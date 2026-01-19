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
      totalAmount,
      xenditPaymentId,
      xenditReferenceId
    } = body;

    console.log('[Payment API] Payment data:', {
      paymentMethod,
      paymentStatus,
      transactionFee,
      totalAmount,
      xenditPaymentId,
      xenditReferenceId
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
      },
      include: {
        vendor: {
          select: {
            name: true
          }
        }
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

    // Determine booking status based on payment
    let newBookingStatus = booking.status;
    if (paymentStatus.toUpperCase() === 'PAID') {
      newBookingStatus = 'CONFIRMED';
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: {
        booking_id: booking.booking_id
      },
      data: {
        payment_method: paymentMethod,
        payment_status: paymentStatus.toUpperCase() as any,
        transaction_fee: finalTransactionFee,
        total: newTotal,
        status: newBookingStatus as any
      }
    });

    console.log('[Payment API] Booking updated successfully');
    console.log('[Payment API] Payment method saved:', updatedBooking.payment_method);
    console.log('[Payment API] Transaction fee saved:', updatedBooking.transaction_fee);

    // Get payment method display name
    const paymentMethodNames: Record<string, string> = {
      'ewallet_ovo': 'OVO',
      'ewallet_dana': 'DANA',
      'ewallet_shopeepay': 'ShopeePay',
      'ewallet_linkaja': 'LinkAja',
      'va_bca': 'BCA Virtual Account',
      'va_bni': 'BNI Virtual Account',
      'va_bri': 'BRI Virtual Account',
      'va_mandiri': 'Mandiri Virtual Account',
      'va_permata': 'Permata Virtual Account',
      'va_bsi': 'BSI Virtual Account',
      'va_cimb': 'CIMB Virtual Account',
      'qris': 'QRIS',
      'card_visa': 'Kartu Visa',
      'card_mastercard': 'Kartu Mastercard',
      'card_jcb': 'Kartu JCB',
      'retail_alfamart': 'Alfamart',
      'retail_indomaret': 'Indomaret',
      'tunai': 'Tunai'
    };
    const paymentMethodName = paymentMethodNames[paymentMethod] || paymentMethod;

    // Add to booking history
    const historyStatus = paymentStatus.toUpperCase() === 'PAID' 
      ? `Pembayaran Berhasil - ${paymentMethodName}` 
      : `Menunggu Pembayaran - ${paymentMethodName}`;
    
    const historyReason = paymentMethod === 'tunai' 
      ? 'Pembayaran tunai akan dilakukan saat layanan selesai'
      : xenditReferenceId 
        ? `Xendit Reference: ${xenditReferenceId}`
        : null;

    await prisma.bookingHistory.create({
      data: {
        booking_id: booking.booking_id,
        status: historyStatus,
        reason: historyReason
      }
    });

    // Create notification for user
    try {
      const isTunaiPayment = paymentMethod === 'tunai';
      
      if (paymentStatus.toUpperCase() === 'PAID') {
        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: isTunaiPayment ? '💵 Pembayaran Tunai Dikonfirmasi' : '✅ Pembayaran Berhasil',
            message: isTunaiPayment 
              ? `Pesanan #${orderId} dikonfirmasi dengan pembayaran tunai. Pembayaran akan dilakukan langsung ke ${booking.vendor.name} saat layanan selesai. Total: Rp ${newTotal.toLocaleString('id-ID')}`
              : `Pembayaran untuk pesanan #${orderId} telah berhasil diproses melalui ${paymentMethodName}. Total: Rp ${newTotal.toLocaleString('id-ID')}. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });
      } else if (paymentStatus.toUpperCase() === 'PENDING') {
        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: '🔔 Menunggu Pembayaran',
            message: `Silakan selesaikan pembayaran untuk pesanan #${orderId} melalui ${paymentMethodName}. Total: Rp ${newTotal.toLocaleString('id-ID')}`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });
      } else if (paymentStatus.toUpperCase() === 'FAILED') {
        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: '❌ Pembayaran Gagal',
            message: `Pembayaran untuk pesanan #${orderId} gagal. Silakan coba lagi atau pilih metode pembayaran lain.`,
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

// GET - Get payment status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    console.log('[Payment API] GET request for orderId:', orderId);
    
    let userId: string | null = null;
    
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (sessionId && accessToken) {
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
            userId = meData.user.user_id || meData.user.id;
          }
        }
      } catch (error) {
        console.error('[Payment API] Error calling /api/auth/me:', error);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_number: orderId,
        user_id: userId
      },
      include: {
        vendor: {
          select: {
            name: true,
            phone: true
          }
        },
        items: {
          include: {
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking_id,
        orderId: booking.booking_number,
        status: booking.status,
        paymentMethod: booking.payment_method,
        paymentStatus: booking.payment_status,
        subtotal: booking.subtotal,
        serviceFee: booking.service_fee,
        transactionFee: booking.transaction_fee,
        total: booking.total,
        scheduledDate: booking.scheduled_date,
        vendor: booking.vendor,
        items: booking.items.map(item => ({
          serviceName: item.service.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))
      }
    });

  } catch (error: any) {
    console.error('[Payment API] Error getting payment status:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Terjadi kesalahan'
      },
      { status: 500 }
    );
  }
}