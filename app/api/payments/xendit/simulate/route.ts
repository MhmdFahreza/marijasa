import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import { XENDIT_PAYMENT_FEES, PaymentMethodId } from '@/app/components/lib/xendit';

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const BASE_URL = 'https://api.xendit.co';

// ==========================================
// XENDIT SIMULATION API (Development Only)
// ==========================================

async function simulateXenditEWalletPayment(chargeId: string): Promise<boolean> {
  try {
    console.log('[Xendit Simulate] Simulating e-wallet payment for charge:', chargeId);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    // Xendit E-Wallet simulation endpoint (development mode only)
    const response = await fetch(`${BASE_URL}/ewallets/charges/${chargeId}/simulate_payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'api-version': '2021-01-25',
      },
      body: JSON.stringify({
        status: 'SUCCEEDED'
      })
    });

    console.log('[Xendit Simulate] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate] Success:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate] Error:', errorText);

      // If simulation endpoint not available, it's okay - webhook will handle it
      if (response.status === 404) {
        console.log('[Xendit Simulate] Simulation endpoint not available, proceeding with local update');
        return false;
      }
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate] Exception:', error);
    return false;
  }
}

async function simulateXenditVAPayment(vaId: string, amount: number): Promise<boolean> {
  try {
    console.log('[Xendit Simulate] Simulating VA payment for:', vaId);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    // Xendit VA simulation endpoint
    const response = await fetch(`${BASE_URL}/callback_virtual_accounts/external_id:${vaId}/simulate_payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount
      })
    });

    console.log('[Xendit Simulate VA] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate VA] Success:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate VA] Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate VA] Exception:', error);
    return false;
  }
}

async function simulateXenditQRISPayment(qrId: string, amount: number): Promise<boolean> {
  try {
    console.log('[Xendit Simulate] Simulating QRIS payment for:', qrId);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    // Xendit QR simulation endpoint
    const response = await fetch(`${BASE_URL}/qr_codes/${qrId}/payments/simulate`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount
      })
    });

    console.log('[Xendit Simulate QRIS] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate QRIS] Success:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate QRIS] Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate QRIS] Exception:', error);
    return false;
  }
}

async function simulateXenditRetailPayment(paymentCodeId: string, amount: number): Promise<boolean> {
  try {
    console.log('[Xendit Simulate] Simulating Retail payment for:', paymentCodeId);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    // Xendit Retail simulation endpoint
    const response = await fetch(`${BASE_URL}/fixed_payment_code/${paymentCodeId}/simulate_payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transfer_amount: amount
      })
    });

    console.log('[Xendit Simulate Retail] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate Retail] Success:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate Retail] Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate Retail] Exception:', error);
    return false;
  }
}

// ==========================================
// POST - Simulate Payment Success
// ==========================================

export async function POST(request: NextRequest) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           SIMULATE PAYMENT - REQUEST RECEIVED                    ║');
  console.log('║ Timestamp:', new Date().toISOString());
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    const body = await request.json();
    const { orderId, simulateStatus, additionalServiceId, paymentType } = body;

    console.log('[Simulate] Order ID:', orderId);
    console.log('[Simulate] Status to simulate:', simulateStatus || 'PAID');
    console.log('[Simulate] Payment type:', paymentType || 'main');
    console.log('[Simulate] Additional service ID:', additionalServiceId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      include: {
        user: { select: { user_id: true, name: true } },
        vendor: { select: { name: true } },
        items: { include: { service: true } },
        additional_service_requests: {
          where: {
            status: 'APPROVED',
            payment_status: 'PAID'
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Simulate] Found booking:', booking.booking_id);
    console.log('[Simulate] Current payment status:', booking.payment_status);
    console.log('[Simulate] Payment method:', booking.payment_method);

    // ==========================================
    // PENANGANAN KHUSUS UNTUK LAYANAN TAMBAHAN
    // ==========================================
    if (additionalServiceId && paymentType === "additional") {
      console.log('[Simulate] Processing additional service payment:', additionalServiceId);

      // Find additional service
      const additionalService = await prisma.additionalServiceRequest.findFirst({
        where: {
          request_id: additionalServiceId,
          booking_id: booking.booking_id
        }
      });

      if (!additionalService) {
        return NextResponse.json(
          { success: false, error: 'Not Found', message: 'Layanan tambahan tidak ditemukan' },
          { status: 404 }
        );
      }

      // Check if already paid
      if (additionalService.payment_status === 'PAID') {
        return NextResponse.json(
          { success: false, error: 'Already Paid', message: 'Layanan tambahan ini sudah dibayar' },
          { status: 400 }
        );
      }

      const targetStatus = (simulateStatus || 'PAID').toUpperCase();

      if (targetStatus === 'PAID') {
        // Update additional service payment status
        const updatedAdditionalService = await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'PAID',
            paid_at: new Date(),
            payment_metadata: {
              ...(additionalService.payment_metadata as any) || {},
              simulated: true,
              simulated_at: new Date().toISOString(),
              simulated_status: 'PAID'
            }
          }
        });

        // PERBAIKAN: Update total booking dengan benar setelah layanan tambahan dibayar
        // Hitung total semua layanan tambahan yang sudah dibayar
        const paidAdditionalServices = await prisma.additionalServiceRequest.findMany({
          where: {
            booking_id: booking.booking_id,
            status: 'APPROVED',
            payment_status: 'PAID'
          }
        });

        const totalAdditionalPaid = paidAdditionalServices.reduce((sum: number, req: any) => {
          const serviceFee = req.service_fee || 10000;
          const transactionFee = req.transaction_fee || 0;
          return sum + (req.total_price || 0) + serviceFee + transactionFee;
        }, 0);

        const newTotal = booking.subtotal + booking.service_fee + booking.transaction_fee + totalAdditionalPaid;

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: { 
            total: newTotal,
            payment_metadata: {
              ...(booking.payment_metadata as any) || {},
              updated_at: new Date().toISOString(),
              additional_services_updated: true
            }
          }
        });

        // Create notification for additional service payment
        await prisma.userNotification.create({
          data: {
            user_id: booking.user.user_id,
            title: '✅ Pembayaran Layanan Tambahan Berhasil',
            message: `Pembayaran untuk layanan tambahan "${additionalService.description}" telah berhasil. Total: Rp ${additionalService.total_price.toLocaleString('id-ID')}`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });

        // Add to booking history
        await prisma.bookingHistory.create({
          data: {
            booking_id: booking.booking_id,
            status: 'Pembayaran Layanan Tambahan Berhasil',
            reason: `Pembayaran untuk layanan tambahan: ${additionalService.description}`
          }
        });

        console.log('[Simulate] Additional service payment simulated successfully');

        return NextResponse.json({
          success: true,
          message: 'Pembayaran layanan tambahan berhasil disimulasikan',
          additionalServicePaid: true,
          additionalService: {
            id: updatedAdditionalService.request_id,
            description: updatedAdditionalService.description,
            paymentStatus: updatedAdditionalService.payment_status,
            paidAt: updatedAdditionalService.paid_at,
            totalPrice: updatedAdditionalService.total_price
          },
          booking: {
            orderId: booking.booking_number,
            total: newTotal,
            paidAdditionalServicesCount: paidAdditionalServices.length,
            paidAdditionalServicesTotal: totalAdditionalPaid
          }
        });
      } else if (targetStatus === 'FAILED') {
        // Simulasi gagal untuk layanan tambahan
        await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'FAILED',
            payment_metadata: {
              ...(additionalService.payment_metadata as any) || {},
              simulated: true,
              simulated_at: new Date().toISOString(),
              simulated_status: 'FAILED'
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Simulasi pembayaran gagal untuk layanan tambahan',
          additionalService: {
            id: additionalServiceId,
            paymentStatus: 'FAILED'
          }
        });
      }
    }

    // ==========================================
    // SIMULASI PEMBAYARAN UTAMA (BOOKING)
    // ==========================================

    // Check if already paid
    if (booking.payment_status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Already Paid', message: 'Pembayaran sudah dilakukan sebelumnya' },
        { status: 400 }
      );
    }

    // Get payment method name
    const paymentMethodName = getPaymentMethodName(booking.payment_method);
    const currentMetadata = (booking.payment_metadata as any) || {};

    // Determine what status to simulate
    const targetStatus = (simulateStatus || 'PAID').toUpperCase();

    if (booking.payment_method === 'tunai') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Operation',
          message: 'Tidak dapat mensimulasikan pembayaran tunai'
        },
        { status: 400 }
      );
    }

    if (targetStatus === 'PAID') {
      // ==========================================
      // SIMULATE SUCCESS - Try Xendit first, then local
      // ==========================================

      let xenditSimulated = false;
      const paymentType = currentMetadata.payment_type;
      const xenditId = currentMetadata.xendit_id;

      console.log('[Simulate] Payment type:', paymentType);
      console.log('[Simulate] Xendit ID:', xenditId);

      // Try to simulate in Xendit (development mode)
      if (xenditId && process.env.NODE_ENV !== 'production') {
        console.log('[Simulate] Attempting Xendit simulation...');

        switch (paymentType) {
          case 'ewallet':
            xenditSimulated = await simulateXenditEWalletPayment(xenditId);
            break;
          case 'va':
            xenditSimulated = await simulateXenditVAPayment(orderId, booking.total);
            break;
          case 'qris':
            xenditSimulated = await simulateXenditQRISPayment(xenditId, booking.total);
            break;
          case 'retail':
            xenditSimulated = await simulateXenditRetailPayment(xenditId, booking.total);
            break;
        }

        if (xenditSimulated) {
          console.log('[Simulate] ✅ Xendit simulation successful!');
          console.log('[Simulate] Webhook will update the database automatically');

          // Wait a bit for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check if webhook already updated the status
          const updatedBooking = await prisma.booking.findFirst({
            where: { booking_id: booking.booking_id }
          });

          if (updatedBooking?.payment_status === 'PAID') {
            return NextResponse.json({
              success: true,
              message: 'Pembayaran berhasil disimulasikan via Xendit',
              xenditSimulated: true,
              booking: {
                orderId: updatedBooking.booking_number,
                paymentStatus: updatedBooking.payment_status,
                paymentMethod: updatedBooking.payment_method,
                paymentMethodName: paymentMethodName,
                status: updatedBooking.status,
                total: updatedBooking.total,
              }
            });
          }
        } else {
          console.log('[Simulate] Xendit simulation not available, using local update');
        }
      }

      // PERBAIKAN: Hitung total dengan benar termasuk layanan tambahan yang sudah dibayar
      const paidAdditionalServices = await prisma.additionalServiceRequest.findMany({
        where: {
          booking_id: booking.booking_id,
          status: 'APPROVED',
          payment_status: 'PAID'
        }
      });

      const totalAdditionalPaid = paidAdditionalServices.reduce((sum: number, req: any) => {
        const serviceFee = req.service_fee || 10000;
        const transactionFee = req.transaction_fee || 0;
        return sum + (req.total_price || 0) + serviceFee + transactionFee;
      }, 0);

      const newTotal = booking.subtotal + booking.service_fee + booking.transaction_fee + totalAdditionalPaid;

      // Fallback: Update local database directly
      const updatedBooking = await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_status: 'PAID',
          status: 'CONFIRMED',
          total: newTotal,
          payment_metadata: {
            ...currentMetadata,
            simulated: true,
            simulated_at: new Date().toISOString(),
            simulated_status: 'PAID',
            xendit_simulated: xenditSimulated,
          }
        }
      });

      console.log('[Simulate] Booking updated to PAID');
      console.log('[Simulate] New total:', newTotal);
      console.log('[Simulate] Paid additional services:', paidAdditionalServices.length);
      console.log('[Simulate] Total additional paid:', totalAdditionalPaid);

      // Create success notification
      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '✅ Pembayaran Berhasil',
          message: `Pembayaran untuk pesanan #${orderId} telah berhasil via ${paymentMethodName}. Total: Rp ${newTotal.toLocaleString('id-ID')}. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      // Add to booking history
      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: xenditSimulated ? 'Pembayaran Berhasil (Xendit Simulation)' : 'Pembayaran Berhasil',
          reason: `Pembayaran via ${paymentMethodName} telah dikonfirmasi (mode testing)`
        }
      });

      console.log('[Simulate] Notification and history created');

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║           PAYMENT SIMULATION SUCCESSFUL - PAID                   ║');
      console.log('║ Xendit Simulated:', xenditSimulated ? 'YES' : 'NO (Local only)');
      console.log('║ Total:', newTotal);
      console.log('║ Paid Additional Services:', paidAdditionalServices.length);
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        success: true,
        message: xenditSimulated
          ? 'Pembayaran berhasil disimulasikan (Xendit + Local)'
          : 'Pembayaran berhasil disimulasikan (Local only - Xendit tetap Pending)',
        xenditSimulated,
        booking: {
          orderId: updatedBooking.booking_number,
          paymentStatus: updatedBooking.payment_status,
          paymentMethod: updatedBooking.payment_method,
          paymentMethodName: paymentMethodName,
          status: updatedBooking.status,
          total: updatedBooking.total,
          paidAdditionalServicesCount: paidAdditionalServices.length,
          paidAdditionalServicesTotal: totalAdditionalPaid
        }
      });

    } else if (targetStatus === 'FAILED') {
      // ==========================================
      // SIMULATE FAILURE
      // ==========================================

      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_status: 'FAILED',
          payment_metadata: {
            ...currentMetadata,
            simulated: true,
            simulated_at: new Date().toISOString(),
            simulated_status: 'FAILED',
          }
        }
      });

      // Create failure notification
      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '❌ Pembayaran Gagal',
          message: `Pembayaran untuk pesanan #${orderId} gagal. Silakan lakukan pembayaran ulang atau pilih metode pembayaran lain.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      // Add to booking history
      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Gagal (Simulasi)',
          reason: 'Pembayaran gagal (mode testing)'
        }
      });

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║           PAYMENT SIMULATION - FAILED                            ║');
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        success: true,
        message: 'Simulasi pembayaran gagal berhasil',
        booking: {
          orderId: booking.booking_number,
          paymentStatus: 'FAILED',
          status: booking.status,
        }
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid Status', message: 'Status simulasi tidak valid' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Simulate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - Get simulation info
// ==========================================

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({
      message: 'Xendit Payment Simulation Endpoint',
      usage: 'POST with { orderId, simulateStatus?: "PAID" | "FAILED" }',
      note: 'This endpoint simulates payment in both Xendit (development) and local database',
      endpoints: {
        ewallet: '/ewallets/charges/{id}/simulate_payment',
        va: '/callback_virtual_accounts/external_id:{id}/simulate_payment',
        qris: '/qr_codes/{id}/payments/simulate',
        retail: '/fixed_payment_code/{id}/simulate_payment'
      }
    });
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      select: {
        booking_id: true,
        booking_number: true,
        payment_status: true,
        payment_method: true,
        total: true,
        status: true,
        payment_metadata: true,
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    const metadata = booking.payment_metadata as any;

    return NextResponse.json({
      success: true,
      booking: {
        orderId: booking.booking_number,
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        paymentMethodName: getPaymentMethodName(booking.payment_method),
        status: booking.status,
        total: booking.total,
        canSimulate: booking.payment_status !== 'PAID',
        isSimulated: metadata?.simulated || false,
        simulatedAt: metadata?.simulated_at || null,
        xenditSimulated: metadata?.xendit_simulated || false,
        xenditId: metadata?.xendit_id || null,
        paymentType: metadata?.payment_type || null,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
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