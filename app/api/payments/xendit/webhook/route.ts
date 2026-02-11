// app/api/webhooks/xendit/route.ts
// Xendit Webhook Handler - All Payment Types
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || '';

export async function POST(request: NextRequest) {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    XENDIT WEBHOOK RECEIVED                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    // Verify webhook token
    const webhookToken = request.headers.get('x-callback-token');
    
    if (webhookToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error('[Webhook] ❌ Invalid webhook token');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[Webhook] Event received');
    console.log('[Webhook] Data:', JSON.stringify(body, null, 2));

    // Handle E-Wallet webhooks
    if (body.data?.channel_code || body.ewallet_type) {
      return await handleEWalletWebhook(body);
    }

    // Handle VA webhooks
    if (body.callback_virtual_account_id || body.external_id) {
      return await handleVAWebhook(body);
    }

    // Handle QRIS webhooks
    if (body.qr_id) {
      return await handleQRISWebhook(body);
    }

    // Handle Retail webhooks
    if (body.retail_outlet_name) {
      return await handleRetailWebhook(body);
    }

    console.log('[Webhook] ⚠️ Unknown webhook type');
    return NextResponse.json({ success: true, message: 'Webhook received but not processed' });

  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handleEWalletWebhook(data: any) {
  console.log('[Webhook E-Wallet] Processing...');
  
  const externalId = data.data?.reference_id || data.reference_id;
  const status = data.data?.status || data.status;

  if (!externalId) {
    console.error('[Webhook E-Wallet] No external ID found');
    return NextResponse.json({ success: false, error: 'No external ID' }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { booking_number: externalId },
    include: {
      user: { select: { user_id: true, name: true } },
      vendor: { select: { name: true } }
    }
  });

  if (!booking) {
    console.error('[Webhook E-Wallet] Booking not found:', externalId);
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (status === 'SUCCEEDED' || status === 'PAID') {
    console.log('[Webhook E-Wallet] ✅ Payment SUCCESS');
    
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        payment_status: 'PAID',
        status: 'CONFIRMED',
        payment_metadata: {
          ...(booking.payment_metadata as any) || {},
          webhook_received: true,
          webhook_at: new Date().toISOString(),
          webhook_data: data
        }
      }
    });

    await prisma.userNotification.create({
      data: {
        user_id: booking.user.user_id,
        title: '✅ Pembayaran Berhasil',
        message: `Pembayaran untuk pesanan #${externalId} telah berhasil. Total: Rp ${booking.total.toLocaleString('id-ID')}. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
        type: 'payment',
        order_id: booking.booking_id
      }
    });

    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: 'Pembayaran Berhasil',
        reason: 'Pembayaran dikonfirmasi oleh Xendit'
      }
    });

    console.log('[Webhook E-Wallet] ✅ Database updated successfully');
    return NextResponse.json({ success: true, message: 'Payment confirmed' });
  }

  if (status === 'FAILED') {
    console.log('[Webhook E-Wallet] ❌ Payment FAILED');
    
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        payment_status: 'FAILED',
        payment_metadata: {
          ...(booking.payment_metadata as any) || {},
          webhook_received: true,
          webhook_at: new Date().toISOString(),
          webhook_data: data,
          failure_reason: data.data?.failure_code || 'Unknown'
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Payment failed recorded' });
  }

  return NextResponse.json({ success: true, message: 'Webhook processed' });
}

async function handleVAWebhook(data: any) {
  console.log('[Webhook VA] Processing...');
  
  const externalId = data.external_id;
  const status = data.status;

  if (!externalId) {
    return NextResponse.json({ success: false, error: 'No external ID' }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { booking_number: externalId },
    include: {
      user: { select: { user_id: true } },
      vendor: { select: { name: true } }
    }
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (status === 'PAID' || status === 'COMPLETED') {
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        payment_status: 'PAID',
        status: 'CONFIRMED',
        payment_metadata: {
          ...(booking.payment_metadata as any) || {},
          webhook_received: true,
          webhook_at: new Date().toISOString(),
          webhook_data: data
        }
      }
    });

    await prisma.userNotification.create({
      data: {
        user_id: booking.user.user_id,
        title: '✅ Pembayaran Berhasil',
        message: `Pembayaran untuk pesanan #${externalId} telah berhasil.`,
        type: 'payment',
        order_id: booking.booking_id
      }
    });

    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: 'Pembayaran Berhasil',
        reason: 'Pembayaran dikonfirmasi oleh Xendit'
      }
    });

    return NextResponse.json({ success: true, message: 'Payment confirmed' });
  }

  return NextResponse.json({ success: true, message: 'Webhook processed' });
}

async function handleQRISWebhook(data: any) {
  console.log('[Webhook QRIS] Processing...');
  
  const externalId = data.external_id || data.reference_id;
  const status = data.status;

  if (!externalId) {
    return NextResponse.json({ success: false, error: 'No external ID' }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { booking_number: externalId },
    include: {
      user: { select: { user_id: true } },
      vendor: { select: { name: true } }
    }
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (status === 'COMPLETED' || status === 'PAID') {
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        payment_status: 'PAID',
        status: 'CONFIRMED',
        payment_metadata: {
          ...(booking.payment_metadata as any) || {},
          webhook_received: true,
          webhook_at: new Date().toISOString(),
          webhook_data: data
        }
      }
    });

    await prisma.userNotification.create({
      data: {
        user_id: booking.user.user_id,
        title: '✅ Pembayaran Berhasil',
        message: `Pembayaran QRIS untuk pesanan #${externalId} telah berhasil.`,
        type: 'payment',
        order_id: booking.booking_id
      }
    });

    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: 'Pembayaran Berhasil',
        reason: 'Pembayaran dikonfirmasi oleh Xendit'
      }
    });

    return NextResponse.json({ success: true, message: 'Payment confirmed' });
  }

  return NextResponse.json({ success: true, message: 'Webhook processed' });
}

async function handleRetailWebhook(data: any) {
  console.log('[Webhook Retail] Processing...');
  
  const externalId = data.external_id;
  const status = data.status;

  if (!externalId) {
    return NextResponse.json({ success: false, error: 'No external ID' }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { booking_number: externalId },
    include: {
      user: { select: { user_id: true } },
      vendor: { select: { name: true } }
    }
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (status === 'COMPLETED' || status === 'PAID') {
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        payment_status: 'PAID',
        status: 'CONFIRMED',
        payment_metadata: {
          ...(booking.payment_metadata as any) || {},
          webhook_received: true,
          webhook_at: new Date().toISOString(),
          webhook_data: data
        }
      }
    });

    await prisma.userNotification.create({
      data: {
        user_id: booking.user.user_id,
        title: '✅ Pembayaran Berhasil',
        message: `Pembayaran di ${data.retail_outlet_name} untuk pesanan #${externalId} telah berhasil.`,
        type: 'payment',
        order_id: booking.booking_id
      }
    });

    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: 'Pembayaran Berhasil',
        reason: 'Pembayaran dikonfirmasi oleh Xendit'
      }
    });

    return NextResponse.json({ success: true, message: 'Payment confirmed' });
  }

  return NextResponse.json({ success: true, message: 'Webhook processed' });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Xendit Webhook Endpoint',
    note: 'This endpoint only accepts POST requests from Xendit',
    status: 'active'
  });
}