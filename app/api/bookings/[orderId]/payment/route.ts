// app/api/bookings/[orderId]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log('[Payment API] PUT request received for orderId:', params.orderId);
    
    // Get user ID from session
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

    const { orderId } = params;

    // Parse request body
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
      console.error('[Payment API] Booking not found for orderId:', orderId, 'userId:', userId);
      return NextResponse.json(
        { error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Payment API] Found booking:', booking.booking_id);

    // Update booking with payment information
    const updatedBooking = await prisma.booking.update({
      where: {
        booking_id: booking.booking_id
      },
      data: {
        payment_status: paymentStatus.toUpperCase() as any,
        total: totalAmount,
        // Store payment method in notes field
        notes: booking.notes 
          ? `${booking.notes}\n\nMetode Pembayaran: ${paymentMethod}\nBiaya Transaksi: Rp${transactionFee.toLocaleString('id-ID')}`
          : `Metode Pembayaran: ${paymentMethod}\nBiaya Transaksi: Rp${transactionFee.toLocaleString('id-ID')}`,
        // Update status if payment is successful
        status: paymentStatus.toUpperCase() === 'PAID' ? 'CONFIRMED' : booking.status
      }
    });

    console.log('[Payment API] Booking updated successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Status pembayaran berhasil diperbarui',
        booking: updatedBooking
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