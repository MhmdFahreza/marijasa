// app/api/user/orders/additional-service/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  const sessionId = request.cookies.get('session_id')?.value;
  const accessToken = request.cookies.get('access_token')?.value;

  if (!sessionId || !accessToken) {
    return null;
  }

  try {
    const origin = request.nextUrl.origin;
    const meResponse = await fetch(`${origin}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `session_id=${sessionId}; access_token=${accessToken}`
      }
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      if (meData.authenticated && meData.user) {
        return meData.user.user_id || meData.user.id;
      }
    }
  } catch (error) {
    console.error('[Additional Service Payment API] Error verifying session:', error);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, additionalServiceId, paymentMethod, transactionFee } = body;

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: {
        booking_number: orderId,
        user_id: userId
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Find additional service request
    const additionalService = await prisma.additionalServiceRequest.findFirst({
      where: {
        request_id: additionalServiceId,
        booking_id: booking.booking_id,
        status: 'APPROVED'
      }
    });

    if (!additionalService) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Layanan tambahan tidak ditemukan atau belum disetujui' },
        { status: 404 }
      );
    }

    if (additionalService.payment_status === 'PAID') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Layanan tambahan ini sudah dibayar' },
        { status: 400 }
      );
    }

    // Calculate total
    const serviceFee = 10000; // Service fee
    const finalTransactionFee = transactionFee || 0;
    const totalWithFees = additionalService.total_price + serviceFee + finalTransactionFee;

    // Update additional service with payment info
    await prisma.additionalServiceRequest.update({
      where: { request_id: additionalServiceId },
      data: {
        payment_method: paymentMethod,
        payment_status: 'PAID',
        transaction_fee: finalTransactionFee,
        service_fee: serviceFee,
        paid_at: new Date()
      }
    });

    // Update booking total
    const newBookingTotal = booking.total + totalWithFees;
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        total: newBookingTotal
      }
    });

    // Add to order history
    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: `Pembayaran Layanan Tambahan Diterima - ${additionalService.description}`,
        reason: null
      }
    });

    // Create user notification
    await prisma.userNotification.create({
      data: {
        user_id: userId,
        title: 'Pembayaran Layanan Tambahan Berhasil',
        message: `Pembayaran untuk layanan tambahan "${additionalService.description}" telah berhasil diproses. Total: Rp ${totalWithFees.toLocaleString('id-ID')}`,
        type: 'payment',
        order_id: booking.booking_id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran layanan tambahan berhasil',
      data: {
        additionalServiceId: additionalServiceId,
        paymentMethod: paymentMethod,
        totalPaid: totalWithFees,
        paidAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Additional Service Payment API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}