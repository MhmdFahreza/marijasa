// app/api/admin/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/app/components/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
);

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const sessionId = request.cookies.get('admin_session_id')?.value;
    const accessToken = request.cookies.get('admin_access_token')?.value;

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
        select: { is_active: true, name: true }
      });

      if (!admin || !admin.is_active) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Admin account not found or inactive' },
          { status: 401 }
        );
      }

    } catch (jwtError) {
      console.error('[Admin Withdraw API] JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount, method, accountNumber } = body;

    // Validate input
    if (!amount || !method || !accountNumber) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Jumlah penarikan harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Calculate available balance
    const paidBookings = await prisma.booking.findMany({
      where: {
        payment_status: 'PAID'
      },
      select: {
        service_fee: true
      }
    });

    const totalServiceFee = paidBookings.reduce((sum, b) => sum + b.service_fee, 0);

    // Get total withdrawn amount from admin notifications
    const withdrawalNotifications = await prisma.adminNotification.findMany({
      where: {
        title: 'Penarikan Saldo Berhasil'
      }
    });

    const totalWithdrawn = withdrawalNotifications.reduce((sum, notif) => {
      const amountMatch = notif.message.match(/Rp ([\d.,]+)/);
      if (amountMatch) {
        const withdrawnAmount = parseFloat(amountMatch[1].replace(/\./g, '').replace(/,/g, ''));
        return sum + withdrawnAmount;
      }
      return sum;
    }, 0);

    const availableBalance = totalServiceFee - totalWithdrawn;

    // Check if amount is valid
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Jumlah penarikan melebihi saldo tersedia (Rp ${availableBalance.toLocaleString('id-ID')})` },
        { status: 400 }
      );
    }

    // Generate withdrawal reference
    const reference = `WD-ADMIN-${Date.now().toString().slice(-8)}`;

    // Create admin notification for withdrawal record
    await prisma.adminNotification.create({
      data: {
        title: 'Penarikan Saldo Berhasil',
        message: `Penarikan saldo sebesar Rp ${amount.toLocaleString('id-ID')} ke ${method} (${accountNumber}) telah diproses. Referensi: ${reference}`,
        type: 'system',
        is_read: false
      }
    });

    console.log('[Admin Withdraw API] Withdrawal created:', {
      reference,
      amount,
      method,
      accountNumber
    });

    return NextResponse.json({
      success: true,
      message: 'Penarikan berhasil diajukan',
      withdrawal: {
        reference,
        amount,
        method,
        accountNumber,
        status: 'processing',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Admin Withdraw API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const sessionId = request.cookies.get('admin_session_id')?.value;
    const accessToken = request.cookies.get('admin_access_token')?.value;

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

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get withdrawal history from admin notifications
    const withdrawalNotifications = await prisma.adminNotification.findMany({
      where: {
        title: 'Penarikan Saldo Berhasil'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const withdrawals = withdrawalNotifications.map(notif => {
      // Parse the message to extract withdrawal details
      const amountMatch = notif.message.match(/Rp ([\d.,]+)/);
      const referenceMatch = notif.message.match(/Referensi: ([^\s]+)/);
      
      let amount = 0;
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(/,/g, ''));
      }
      
      return {
        id: notif.notification_id,
        reference: referenceMatch ? referenceMatch[1] : '',
        amount: amount,
        status: 'completed',
        createdAt: notif.created_at.toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      withdrawals
    });

  } catch (error: any) {
    console.error('[Admin Withdraw API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}