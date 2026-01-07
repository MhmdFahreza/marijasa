// app/api/bookings/[orderId]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Get user session from cookie
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const userId = sessionData.user?.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Session tidak valid' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    // Parse request body
    const body = await request.json();
    const {
      paymentMethod,
      paymentStatus,
      transactionFee,
      totalAmount
    } = body;

    // Validate required fields
    if (!paymentMethod || !paymentStatus) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Data pembayaran tidak lengkap' },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: {
        booking_number: orderId,
        user_id: userId
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update booking with payment information
    const updatedBooking = await prisma.booking.update({
      where: {
        booking_id: booking.booking_id
      },
      data: {
        payment_status: paymentStatus.toUpperCase() as any,
        total: totalAmount,
        // Store payment method in notes field or create a separate payment table
        notes: booking.notes 
          ? `${booking.notes}\n\nMetode Pembayaran: ${paymentMethod}\nBiaya Transaksi: Rp${transactionFee.toLocaleString('id-ID')}`
          : `Metode Pembayaran: ${paymentMethod}\nBiaya Transaksi: Rp${transactionFee.toLocaleString('id-ID')}`,
        // Update status if payment is successful
        status: paymentStatus.toUpperCase() === 'PAID' ? 'CONFIRMED' : booking.status
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Status pembayaran berhasil diperbarui',
        booking: updatedBooking
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Terjadi kesalahan saat memperbarui status pembayaran'
      },
      { status: 500 }
    );
  }
}