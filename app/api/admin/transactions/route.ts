// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/app/components/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
);

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const sessionId = request.cookies.get('admin_session_id')?.value;
    const accessToken = request.cookies.get('admin_access_token')?.value;

    console.log('[Admin Transactions API] Request received:', {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken
    });

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login sebagai admin' },
        { status: 401 }
      );
    }

    try {
      // Verify JWT token directly
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      
      if (payload.type !== 'access') {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid token type' },
          { status: 401 }
        );
      }

      const adminId = payload.adminId as string;

      // Verify admin exists and is active
      const admin = await prisma.admin.findUnique({
        where: { admin_id: adminId },
        select: { is_active: true }
      });

      if (!admin || !admin.is_active) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Admin account not found or inactive' },
          { status: 401 }
        );
      }

      console.log('[Admin Transactions API] Admin verified:', adminId);

    } catch (jwtError) {
      console.error('[Admin Transactions API] JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get all bookings with related data
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        vendor: {
          select: {
            name: true,
            category: true
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
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('[Admin Transactions API] Found bookings:', bookings.length);

    // Calculate statistics
    const totalTransactions = bookings.length;
    const successCount = bookings.filter(b => b.payment_status === 'PAID').length;
    const pendingCount = bookings.filter(b => b.payment_status === 'PENDING').length;
    const failedCount = bookings.filter(b => b.payment_status === 'FAILED').length;

    // Calculate service balance (total service fee from PAID bookings)
    const serviceBalance = bookings
      .filter(b => b.payment_status === 'PAID')
      .reduce((sum, b) => sum + b.service_fee, 0);

    // Get total withdrawn amount from admin notifications
    const withdrawalNotifications = await prisma.adminNotification.findMany({
      where: {
        title: 'Penarikan Saldo Berhasil'
      }
    });

    const totalWithdrawn = withdrawalNotifications.reduce((sum, notif) => {
      const amountMatch = notif.message.match(/Rp ([\d.,]+)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(/,/g, ''));
        return sum + amount;
      }
      return sum;
    }, 0);

    const availableBalance = serviceBalance - totalWithdrawn;

    console.log('[Admin Transactions API] Stats:', {
      totalTransactions,
      successCount,
      pendingCount,
      failedCount,
      serviceBalance,
      totalWithdrawn,
      availableBalance
    });

    // Format transactions for frontend
    const transactions = bookings.map(booking => {
      const serviceNames = booking.items.map(item => item.service.name).join(', ');
      
      // Map payment status to frontend status
      let status = 'pending';
      if (booking.payment_status === 'PAID') {
        status = 'success';
      } else if (booking.payment_status === 'FAILED' || booking.payment_status === 'REFUNDED') {
        status = 'failed';
      }

      // Get payment method from payment_method field or notes
      let paymentMethod = booking.payment_method || 'Tunai';
      
      // If payment_method is null, try to extract from notes
      if (!booking.payment_method && booking.notes && booking.notes.includes('Metode Pembayaran:')) {
        const methodMatch = booking.notes.match(/Metode Pembayaran: ([^\n]+)/);
        if (methodMatch) {
          paymentMethod = methodMatch[1];
        }
      }

      return {
        id: booking.booking_number,
        user: booking.user.name,
        userEmail: booking.user.email,
        category: booking.vendor.category || serviceNames,
        method: paymentMethod,
        amount: booking.total,
        serviceFee: booking.service_fee,
        status: status,
        date: booking.created_at.toISOString(),
        paymentStatus: booking.payment_status
      };
    });

    return NextResponse.json({
      success: true,
      transactions,
      stats: {
        totalTransactions,
        successCount,
        pendingCount,
        failedCount,
        serviceBalance,
        availableBalance
      }
    });

  } catch (error: any) {
    console.error('[Admin Transactions API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}