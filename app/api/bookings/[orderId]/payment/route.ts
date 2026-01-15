// app/api/bookings/[orderId]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    console.log('[Payment API] PUT request received for orderId:', orderId);
    
    let userId: string | null = null;
    
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;
    
    console.log('[Payment API] Session cookies:', {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken
    });

    if (sessionId && accessToken) {
      try {
        const origin = request.nextUrl.origin;
        const meResponse = await fetch(`${origin}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': `session_id=${sessionId}; access_token=${accessToken}`
          }
        });

        console.log('[Payment API] /api/auth/me response status:', meResponse.status);

        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log('[Payment API] Response from /api/auth/me:', JSON.stringify(meData));
          
          if (meData.authenticated && meData.user) {
            userId = meData.user.user_id || meData.user.id;
            console.log('[Payment API] User ID found:', userId);
          }
        }
      } catch (error) {
        console.error('[Payment API] Error calling /api/auth/me:', error);
      }
    }

    if (!userId) {
      console.error('[Payment API] No valid user ID found');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    console.log('[Payment API] Authenticated user ID:', userId);

    const body = await request.json();
    const {
      paymentMethod,
      paymentStatus,
      transactionFee,
      totalAmount
    } = body;

    console.log('[Payment API] Payment data:', {
      paymentMethod,
      paymentStatus,
      transactionFee,
      totalAmount
    });

    // Validate payment method
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
      console.error('[Payment API] Booking not found for orderId:', orderId, 'userId:', userId);
      return NextResponse.json(
        { error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Payment API] Found booking:', booking.booking_id);

    // Calculate new total with transaction fee
    const finalTransactionFee = transactionFee || 0;
    const newTotal = totalAmount || (booking.subtotal + booking.service_fee + finalTransactionFee);

    console.log('[Payment API] Updating booking with:', {
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      transaction_fee: finalTransactionFee,
      total: newTotal
    });

    // ✅ PENTING: Update booking dengan payment_method yang benar
    const updatedBooking = await prisma.booking.update({
      where: {
        booking_id: booking.booking_id
      },
      data: {
        payment_method: paymentMethod, // ✅ Simpan payment method dengan benar
        payment_status: paymentStatus.toUpperCase() as any,
        transaction_fee: finalTransactionFee, // ✅ Simpan transaction fee
        total: newTotal, // ✅ Update total dengan transaction fee
        // Update status jika payment berhasil
        status: paymentStatus.toUpperCase() === 'PAID' ? 'CONFIRMED' : booking.status
      }
    });

    console.log('[Payment API] Booking updated successfully');
    console.log('[Payment API] Payment method saved:', updatedBooking.payment_method);
    console.log('[Payment API] Transaction fee saved:', updatedBooking.transaction_fee);

    // Add to booking history
    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: paymentStatus.toUpperCase() === 'PAID' 
          ? `Pembayaran Berhasil - ${paymentMethod}` 
          : 'Metode Pembayaran Diperbarui',
        reason: paymentMethod.toLowerCase() === 'tunai' 
          ? 'Pembayaran tunai akan dilakukan saat layanan diberikan'
          : null
      }
    });

    // Create notification for user
    try {
      const isCashPayment = paymentMethod.toLowerCase() === 'tunai' || paymentMethod.toLowerCase() === 'cash';
      
      if (paymentStatus.toUpperCase() === 'PAID') {
        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: isCashPayment ? '💵 Pembayaran Tunai Dikonfirmasi' : '✅ Pembayaran Berhasil',
            message: isCashPayment 
              ? `Pesanan #${orderId} dikonfirmasi dengan pembayaran tunai. Pembayaran akan dilakukan langsung kepada vendor saat layanan diberikan. Total: Rp ${newTotal.toLocaleString('id-ID')}`
              : `Pembayaran untuk pesanan #${orderId} telah berhasil diproses melalui ${paymentMethod}. Total: Rp ${newTotal.toLocaleString('id-ID')}. Pesanan Anda sedang diproses.`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });
      } else {
        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: '🔄 Metode Pembayaran Diperbarui',
            message: `Metode pembayaran untuk pesanan #${orderId} telah diperbarui menjadi ${paymentMethod}.${isCashPayment ? ' Pembayaran akan dilakukan secara tunai saat layanan diberikan.' : ' Silakan lanjutkan ke pembayaran.'}`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });
      }

      console.log('[Payment API] Notification created successfully');
    } catch (notifError) {
      console.error('[Payment API] Error creating notification:', notifError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Status pembayaran berhasil diperbarui',
        booking: {
          id: updatedBooking.booking_id,
          orderId: updatedBooking.booking_number,
          paymentMethod: updatedBooking.payment_method,
          paymentStatus: updatedBooking.payment_status,
          transactionFee: updatedBooking.transaction_fee,
          total: updatedBooking.total,
          status: updatedBooking.status
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Payment API] Error updating payment status:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Terjadi kesalahan saat memperbarui status pembayaran'
      },
      { status: 500 }
    );
  }
}