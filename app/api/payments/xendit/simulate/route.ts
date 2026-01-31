// app/api/payments/xendit/simulate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

// ==========================================
// POST - Simulate Payment Success (For Testing)
// ==========================================

export async function POST(request: NextRequest) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           SIMULATE PAYMENT - REQUEST RECEIVED                    ║');
  console.log('║ Timestamp:', new Date().toISOString());
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    const body = await request.json();
    const { orderId } = body;

    console.log('[Simulate] Order ID:', orderId);

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
        items: { include: { service: true } }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Simulate] Found booking:', booking.booking_id);
    console.log('[Simulate] Current status:', booking.payment_status);

    // Check if already paid
    if (booking.payment_status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Already Paid', message: 'Pembayaran sudah dilakukan sebelumnya' },
        { status: 400 }
      );
    }

    // Update booking to PAID and CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        payment_status: 'PAID',
        status: 'CONFIRMED',
      }
    });

    console.log('[Simulate] Booking updated to PAID');

    // Create notification
    await prisma.userNotification.create({
      data: {
        user_id: booking.user.user_id,
        title: '✅ Pembayaran Berhasil',
        message: `Pembayaran untuk pesanan #${orderId} telah berhasil. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
        type: 'payment',
        order_id: booking.booking_id,
      }
    });

    // Add to booking history
    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: 'Pembayaran Berhasil',
        reason: `Pembayaran via ${booking.payment_method || 'Unknown'} telah dikonfirmasi`
      }
    });

    console.log('[Simulate] Notification and history created');

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                 PAYMENT SIMULATION SUCCESSFUL                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil disimulasikan',
      booking: {
        orderId: updatedBooking.booking_number,
        paymentStatus: updatedBooking.payment_status,
        status: updatedBooking.status,
        total: updatedBooking.total,
      }
    });

  } catch (error: any) {
    console.error('[Simulate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}