// app/api/payments/xendit/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import { getWebhookToken } from '@/app/components/lib/xendit';

export async function POST(request: NextRequest) {
  console.log('\n[Xendit Webhook] Received callback');

  try {
    // Verify token
    const callbackToken = request.headers.get('x-callback-token');
    const webhookToken = getWebhookToken();
    
    if (webhookToken && callbackToken !== webhookToken) {
      console.error('[Webhook] Invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Webhook] Payload:', JSON.stringify(body, null, 2));

    // Get order ID
    const orderId = body.external_id || body.reference_id;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Map status
    let paymentStatus = 'PENDING';
    const status = (body.status || '').toUpperCase();
    
    if (['PAID', 'SETTLED', 'SUCCEEDED', 'COMPLETED'].includes(status)) {
      paymentStatus = 'PAID';
    } else if (['FAILED', 'EXPIRED'].includes(status)) {
      paymentStatus = 'FAILED';
    }

    console.log('[Webhook] Order:', orderId, 'Status:', paymentStatus);

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      include: { 
        user: { select: { user_id: true } }, 
        vendor: { select: { name: true } } 
      }
    });

    if (!booking) {
      console.log('[Webhook] Booking not found');
      return NextResponse.json({ received: true });
    }

    // Update based on status
    if (paymentStatus === 'PAID') {
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: { payment_status: 'PAID', status: 'CONFIRMED' }
      });

      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '✅ Pembayaran Berhasil',
          message: `Pembayaran #${orderId} berhasil. Pesanan diproses oleh ${booking.vendor.name}.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Berhasil',
          reason: `Via ${body.payment_method || body.payment_channel || 'Xendit'}`
        }
      });

    } else if (paymentStatus === 'FAILED') {
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: { payment_status: 'FAILED' }
      });

      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '❌ Pembayaran Gagal',
          message: `Pembayaran #${orderId} gagal. Silakan coba lagi.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });
    }

    return NextResponse.json({ received: true, orderId, status: paymentStatus });

  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ received: true, error: error.message });
  }
}
