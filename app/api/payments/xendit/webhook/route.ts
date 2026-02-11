// app/api/payments/xendit/webhook/route.ts
// Xendit Webhook Handler - All Payment Types (TypeScript Fixed)
// PERBAIKAN: Tambah penanganan untuk pembayaran layanan tambahan

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import { getWebhookToken, XENDIT_PAYMENT_FEES, PaymentMethodId } from '@/app/components/lib/xendit';

// ==========================================
// WEBHOOK TYPES
// ==========================================

type WebhookEventType =
  | 'qr_code.paid'
  | 'qr_code.expired'
  | 'ewallet.capture'
  | 'ewallet.void'
  | 'fva_paid'
  | 'fpc_paid'
  | 'invoice.paid'
  | 'invoice.expired'
  | 'payment.succeeded'
  | 'payment.failed';

interface WebhookPayload {
  // Common fields
  id?: string;
  external_id?: string;
  reference_id?: string;
  status?: string;
  amount?: number;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
  payment_id?: string;

  // QR Code specific
  qr_code?: {
    id: string;
    external_id: string;
    amount: number;
    status: string;
  };

  // E-Wallet specific
  business_id?: string;
  channel_code?: string;
  charge_amount?: number;
  capture_amount?: number;

  // VA specific
  bank_code?: string;
  account_number?: string;
  merchant_code?: string;

  // Retail specific
  retail_outlet_name?: string;
  payment_code?: string;

  // Invoice specific
  invoice_url?: string;
  payer_email?: string;

  // Event metadata
  event?: string;
  created?: string;
  updated?: string;
}

// ==========================================
// POST - Handle Xendit Webhooks
// ==========================================

export async function POST(request: NextRequest) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              XENDIT WEBHOOK RECEIVED                             ║');
  console.log('║ Timestamp:', new Date().toISOString());
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    // Verify webhook token
    const callbackToken = request.headers.get('x-callback-token');
    const webhookToken = getWebhookToken();

    console.log('[Webhook] Token verification:', {
      hasCallbackToken: !!callbackToken,
      hasWebhookToken: !!webhookToken,
      tokensMatch: callbackToken === webhookToken
    });

    if (webhookToken && callbackToken !== webhookToken) {
      console.error('[Webhook] Invalid callback token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse payload
    const body: WebhookPayload = await request.json();
    console.log('[Webhook] Payload:', JSON.stringify(body, null, 2));

    // Determine webhook type from headers or payload
    const webhookEvent = request.headers.get('x-webhook-event') || body.event || 'unknown';
    console.log('[Webhook] Event type:', webhookEvent);

    // Extract order ID based on webhook type
    let orderId: string | null = null;
    let paymentType: string = 'unknown';
    let xenditId: string | null = null;
    let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
    let paymentDetails: Record<string, any> = {};

    // ==========================================
    // QRIS Webhook
    // ==========================================
    if (webhookEvent.includes('qr_code') || body.qr_code) {
      paymentType = 'qris';
      const qrData = body.qr_code || body;
      orderId = qrData.external_id || body.external_id || null;
      xenditId = qrData.id || body.id || null;

      const status = (qrData.status || body.status || '').toUpperCase();
      if (['PAID', 'COMPLETED', 'SUCCEEDED'].includes(status)) {
        paymentStatus = 'PAID';
      } else if (['EXPIRED', 'FAILED'].includes(status)) {
        paymentStatus = 'FAILED';
      }

      paymentDetails = {
        qr_id: xenditId,
        paid_amount: body.amount || qrData.amount || null,
        paid_at: body.paid_at || body.updated || null,
      };

      console.log('[Webhook] QRIS payment:', { orderId, status: paymentStatus });
    }

    // ==========================================
    // E-Wallet Webhook
    // ==========================================
    else if (webhookEvent.includes('ewallet') || body.channel_code?.startsWith('ID_')) {
      paymentType = 'ewallet';
      orderId = body.reference_id || body.external_id || null;
      xenditId = body.id || null;

      const status = (body.status || '').toUpperCase();
      if (['SUCCEEDED', 'CAPTURED', 'PAID'].includes(status)) {
        paymentStatus = 'PAID';
      } else if (['VOIDED', 'FAILED', 'EXPIRED'].includes(status)) {
        paymentStatus = 'FAILED';
      }

      paymentDetails = {
        charge_id: xenditId,
        channel_code: body.channel_code || null,
        capture_amount: body.capture_amount || null,
        paid_at: body.updated || body.created || null,
      };

      console.log('[Webhook] E-Wallet payment:', { orderId, channel: body.channel_code, status: paymentStatus });
    }

    // ==========================================
    // Virtual Account Webhook
    // ==========================================
    else if (webhookEvent.includes('fva') || body.bank_code) {
      paymentType = 'va';
      orderId = body.external_id || null;
      xenditId = body.id || body.payment_id || null;

      // VA webhooks are typically sent when payment is received
      paymentStatus = 'PAID';

      paymentDetails = {
        va_id: xenditId,
        bank_code: body.bank_code || null,
        account_number: body.account_number || null,
        paid_amount: body.amount || null,
        paid_at: body.paid_at || new Date().toISOString(),
      };

      console.log('[Webhook] VA payment:', { orderId, bank: body.bank_code, status: paymentStatus });
    }

    // ==========================================
    // Retail Outlet Webhook
    // ==========================================
    else if (webhookEvent.includes('fpc') || body.retail_outlet_name) {
      paymentType = 'retail';
      orderId = body.external_id || null;
      xenditId = body.id || body.payment_id || null;

      // Retail webhooks are typically sent when payment is received
      paymentStatus = 'PAID';

      paymentDetails = {
        retail_id: xenditId,
        retail_outlet: body.retail_outlet_name || null,
        payment_code: body.payment_code || null,
        paid_amount: body.amount || null,
        paid_at: body.paid_at || new Date().toISOString(),
      };

      console.log('[Webhook] Retail payment:', { orderId, outlet: body.retail_outlet_name, status: paymentStatus });
    }

    // ==========================================
    // Invoice/Card Webhook
    // ==========================================
    else if (webhookEvent.includes('invoice') || body.invoice_url) {
      paymentType = 'card';
      orderId = body.external_id || null;
      xenditId = body.id || null;

      const status = (body.status || '').toUpperCase();
      if (['PAID', 'SETTLED'].includes(status)) {
        paymentStatus = 'PAID';
      } else if (['EXPIRED', 'FAILED'].includes(status)) {
        paymentStatus = 'FAILED';
      }

      paymentDetails = {
        invoice_id: xenditId,
        paid_amount: body.paid_amount || body.amount || null,
        paid_at: body.paid_at || null,
        payment_method: body.payment_method || null,
        payment_channel: body.payment_channel || null,
      };

      console.log('[Webhook] Invoice/Card payment:', { orderId, status: paymentStatus });
    }

    // ==========================================
    // Generic Payment Webhook
    // ==========================================
    else if (body.external_id || body.reference_id) {
      orderId = body.external_id || body.reference_id || null;
      xenditId = body.id || null;

      const status = (body.status || '').toUpperCase();
      if (['PAID', 'SUCCEEDED', 'COMPLETED', 'CAPTURED', 'SETTLED'].includes(status)) {
        paymentStatus = 'PAID';
      } else if (['FAILED', 'EXPIRED', 'VOIDED'].includes(status)) {
        paymentStatus = 'FAILED';
      }

      paymentDetails = {
        xendit_id: xenditId,
        paid_amount: body.amount || body.paid_amount || null,
        paid_at: body.paid_at || body.updated || null,
      };

      console.log('[Webhook] Generic payment:', { orderId, status: paymentStatus });
    }

    // No order ID found
    if (!orderId) {
      console.log('[Webhook] No order ID found in payload');
      return NextResponse.json({
        received: true,
        message: 'No order ID found',
        event: webhookEvent
      });
    }

    // ==========================================
    // CHECK IF THIS IS FOR ADDITIONAL SERVICE
    // ==========================================
    if (orderId && orderId.includes('_additional_')) {
      // Parse orderId to get booking number and additional service ID
      const [bookingNumber, additionalServiceId] = orderId.split('_additional_');
      
      console.log('[Webhook] Additional service payment:', { bookingNumber, additionalServiceId });

      // Find additional service
      const additionalService = await prisma.additionalServiceRequest.findFirst({
        where: {
          request_id: additionalServiceId,
          booking: {
            booking_number: bookingNumber
          }
        },
        include: {
          booking: {
            include: {
              user: true,
              vendor: true
            }
          }
        }
      });

      if (!additionalService) {
        console.log('[Webhook] Additional service not found:', additionalServiceId);
        return NextResponse.json({
          received: true,
          message: 'Additional service not found',
          orderId
        });
      }

      console.log('[Webhook] Found additional service:', additionalService.description);
      console.log('[Webhook] Current payment status:', additionalService.payment_status);

      // Get current metadata
      const currentMetadata = (additionalService.payment_metadata as Record<string, any>) || {};

      // Update additional service based on payment status
      if (paymentStatus === 'PAID') {
        // Update to PAID
        await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'PAID',
            paid_at: new Date(),
            payment_metadata: {
              ...currentMetadata,
              ...paymentDetails,
              webhook_received_at: new Date().toISOString(),
              webhook_event: webhookEvent,
              xendit_id: xenditId,
            }
          }
        });

        // Update booking total
        const additionalServiceTotal = additionalService.total_price + 
          (additionalService.service_fee || 10000) + 
          (additionalService.transaction_fee || 0);
        
        await prisma.booking.update({
          where: { booking_id: additionalService.booking_id },
          data: {
            total: additionalService.booking.total + additionalServiceTotal
          }
        });

        // Create success notification
        const paymentMethodName = getPaymentMethodName(additionalService.payment_method);
        await prisma.userNotification.create({
          data: {
            user_id: additionalService.booking.user.user_id,
            title: '✅ Pembayaran Layanan Tambahan Berhasil',
            message: `Pembayaran untuk layanan tambahan "${additionalService.description}" telah berhasil via ${paymentMethodName}. Total: Rp ${additionalServiceTotal.toLocaleString('id-ID')}.`,
            type: 'payment',
            order_id: additionalService.booking_id,
          }
        });

        // Add to booking history
        await prisma.bookingHistory.create({
          data: {
            booking_id: additionalService.booking_id,
            status: 'Pembayaran Layanan Tambahan Berhasil',
            reason: `Pembayaran via ${paymentMethodName} telah dikonfirmasi untuk layanan tambahan: ${additionalService.description}. Xendit ID: ${xenditId || 'N/A'}`
          }
        });

        console.log('[Webhook] ✅ Additional service payment updated to PAID');

      } else if (paymentStatus === 'FAILED') {
        // Update to FAILED
        await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'FAILED',
            payment_metadata: {
              ...currentMetadata,
              ...paymentDetails,
              failure_webhook_at: new Date().toISOString(),
              webhook_event: webhookEvent,
              xendit_id: xenditId,
            }
          }
        });

        // Create failure notification
        await prisma.userNotification.create({
          data: {
            user_id: additionalService.booking.user.user_id,
            title: '❌ Pembayaran Layanan Tambahan Gagal',
            message: `Pembayaran untuk layanan tambahan "${additionalService.description}" gagal atau kedaluwarsa. Silakan lakukan pembayaran ulang atau pilih metode pembayaran lain.`,
            type: 'payment',
            order_id: additionalService.booking_id,
          }
        });

        // Add to booking history
        await prisma.bookingHistory.create({
          data: {
            booking_id: additionalService.booking_id,
            status: 'Pembayaran Layanan Tambahan Gagal',
            reason: `Pembayaran gagal atau kedaluwarsa. Event: ${webhookEvent}`
          }
        });

        console.log('[Webhook] ❌ Additional service payment updated to FAILED');
      }

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║          ADDITIONAL SERVICE WEBHOOK PROCESSED                    ║');
      console.log('║ Service:', (additionalService.description.substring(0, 50) + '...').padEnd(55), '║');
      console.log('║ Status:', paymentStatus.padEnd(54), '║');
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        received: true,
        success: true,
        orderId,
        paymentType: 'additional',
        status: paymentStatus,
        xenditId,
        additionalServiceId,
      });
    }

    // ==========================================
    // Find and Update Booking (MAIN PAYMENT)
    // ==========================================

    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      include: {
        user: { select: { user_id: true, name: true } },
        vendor: { select: { name: true } }
      }
    });

    if (!booking) {
      console.log('[Webhook] Booking not found for order:', orderId);
      return NextResponse.json({
        received: true,
        message: 'Booking not found',
        orderId
      });
    }

    console.log('[Webhook] Found booking:', booking.booking_id);
    console.log('[Webhook] Current status:', booking.payment_status);
    console.log('[Webhook] New status:', paymentStatus);

    // Get current metadata
    const currentMetadata = (booking.payment_metadata as Record<string, any>) || {};

    // Update booking based on payment status
    if (paymentStatus === 'PAID') {
      // Update to PAID and CONFIRMED
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_status: 'PAID',
          status: 'CONFIRMED',
          payment_metadata: {
            ...currentMetadata,
            ...paymentDetails,
            webhook_received_at: new Date().toISOString(),
            webhook_event: webhookEvent,
          }
        }
      });

      // Create success notification
      const paymentMethodName = getPaymentMethodName(booking.payment_method);
      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '✅ Pembayaran Berhasil',
          message: `Pembayaran untuk pesanan #${orderId} telah berhasil via ${paymentMethodName}. Total: Rp ${booking.total.toLocaleString('id-ID')}. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      // Add to booking history
      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Berhasil',
          reason: `Pembayaran via ${paymentMethodName} telah dikonfirmasi. Xendit ID: ${xenditId || 'N/A'}`
        }
      });

      console.log('[Webhook] ✅ Booking updated to PAID');

    } else if (paymentStatus === 'FAILED') {
      // Update to FAILED
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_status: 'FAILED',
          payment_metadata: {
            ...currentMetadata,
            ...paymentDetails,
            failure_webhook_at: new Date().toISOString(),
            webhook_event: webhookEvent,
          }
        }
      });

      // Create failure notification
      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '❌ Pembayaran Gagal',
          message: `Pembayaran untuk pesanan #${orderId} gagal atau kedaluwarsa. Silakan lakukan pembayaran ulang atau pilih metode pembayaran lain.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      // Add to booking history
      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Gagal',
          reason: `Pembayaran gagal atau kedaluwarsa. Event: ${webhookEvent}`
        }
      });

      console.log('[Webhook] ❌ Booking updated to FAILED');
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              WEBHOOK PROCESSED SUCCESSFULLY                      ║');
    console.log('║ Order:', (orderId || 'N/A').padEnd(55), '║');
    console.log('║ Status:', paymentStatus.padEnd(54), '║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    return NextResponse.json({
      received: true,
      success: true,
      orderId,
      paymentType,
      status: paymentStatus,
      xenditId,
    });

  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);

    return NextResponse.json({
      received: true,
      error: error.message
    });
  }
}

// ==========================================
// GET - Webhook Health Check
// ==========================================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Xendit Webhook Endpoint',
    timestamp: new Date().toISOString(),
    supportedEvents: [
      'qr_code.paid',
      'qr_code.expired',
      'ewallet.capture',
      'ewallet.void',
      'fva_paid',
      'fpc_paid',
      'invoice.paid',
      'invoice.expired',
    ],
    note: 'Supports both main payments and additional service payments'
  });
}

// ==========================================
// Helper Functions
// ==========================================

function getPaymentMethodName(paymentMethod: string | null): string {
  if (!paymentMethod) return 'Pembayaran';

  const config = XENDIT_PAYMENT_FEES[paymentMethod as PaymentMethodId];
  if (config) return config.name;

  // Fallback mappings
  const fallbackNames: Record<string, string> = {
    'qris': 'QRIS',
    'ewallet_dana': 'DANA',
    'ewallet_ovo': 'OVO',
    'ewallet_shopeepay': 'ShopeePay',
    'ewallet_linkaja': 'LinkAja',
    'va_bca': 'BCA Virtual Account',
    'va_bni': 'BNI Virtual Account',
    'va_bri': 'BRI Virtual Account',
    'va_mandiri': 'Mandiri Virtual Account',
    'va_permata': 'Permata Virtual Account',
    'va_bsi': 'BSI Virtual Account',
    'va_cimb': 'CIMB Virtual Account',
    'card_visa': 'Kartu Visa',
    'card_mastercard': 'Kartu Mastercard',
    'card_jcb': 'Kartu JCB',
    'retail_alfamart': 'Alfamart',
    'retail_indomaret': 'Indomaret',
    'tunai': 'Tunai',
  };

  return fallbackNames[paymentMethod] || paymentMethod;
}