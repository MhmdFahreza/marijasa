// app/api/payments/xendit/route.ts
// FINAL VERSION - No payment method filter (let Xendit show all available methods)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import {
  createXenditInvoice,
  calculateXenditFee,
  XENDIT_PAYMENT_FEES,
  PaymentMethodId,
  isXenditConfigured,
  getSecretKeyInfo,
} from '@/app/components/lib/xendit';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ==========================================
// VALIDATION HELPERS
// ==========================================

function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '+6281234567890';
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  if (cleaned.length < 10) {
    return '+6281234567890';
  }
  
  return '+' + cleaned;
}

function validateEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeName(name: string | null | undefined): string {
  if (!name || name.trim() === '') return 'Customer';
  const sanitized = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (sanitized.length === 0) return 'Customer';
  if (sanitized.length > 100) return sanitized.substring(0, 100);
  return sanitized;
}

// ==========================================
// POST - Create Payment via Xendit Invoice
// ==========================================

export async function POST(request: NextRequest) {
  let requestBody: any = null;
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           XENDIT PAYMENT API - REQUEST RECEIVED                  ║');
  console.log('║ Timestamp:', new Date().toISOString());
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    // Log configuration
    console.log('\n[Config]');
    console.log('  - Xendit Configured:', isXenditConfigured());
    console.log('  - Key Info:', getSecretKeyInfo());

    // Parse request body
    try {
      requestBody = await request.json();
      console.log('\n[Request Body]', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('[ERROR] Parse failed:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid Request', message: 'Request body tidak valid' },
        { status: 400 }
      );
    }

    // Authenticate user
    let userId: string | null = null;
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;

    if (sessionId && accessToken) {
      try {
        const origin = request.nextUrl.origin;
        const meResponse = await fetch(`${origin}/api/auth/me`, {
          method: 'GET',
          headers: { 'Cookie': `session_id=${sessionId}; access_token=${accessToken}` }
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData.authenticated && meData.user) {
            userId = meData.user.user_id || meData.user.id;
          }
        }
      } catch (error) {
        console.error('[Auth Error]', error);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    console.log('\n[Auth] User ID:', userId);

    // Extract data
    const { orderId, paymentMethod, customerName, customerEmail, customerPhone, amount, description } = requestBody;

    console.log('\n[Payment Data]');
    console.log('  - Order ID:', orderId);
    console.log('  - Method:', paymentMethod);
    console.log('  - Amount:', amount);

    // Validate
    if (!orderId || !paymentMethod || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Data pembayaran tidak lengkap' },
        { status: 400 }
      );
    }

    if (!XENDIT_PAYMENT_FEES[paymentMethod as PaymentMethodId]) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: `Metode pembayaran "${paymentMethod}" tidak valid` },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId, user_id: userId },
      include: {
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

    console.log('\n[Booking] Found:', booking.booking_id, '-', booking.vendor.name);

    // Calculate fees
    const transactionFee = calculateXenditFee(paymentMethod as PaymentMethodId, amount);
    const totalAmount = amount + transactionFee;

    console.log('\n[Fees] Base:', amount, '+ Fee:', transactionFee, '= Total:', totalAmount);

    // Check if TUNAI (no Xendit needed)
    const feeConfig = XENDIT_PAYMENT_FEES[paymentMethod as PaymentMethodId];
    
    if (feeConfig.category === 'tunai') {
      console.log('\n[Processing] Cash payment...');
      
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_method: paymentMethod,
          payment_status: 'PENDING',
          transaction_fee: 0,
          total: amount,
          status: 'CONFIRMED',
        }
      });

      await prisma.userNotification.create({
        data: {
          user_id: userId,
          title: '💵 Pembayaran Tunai Dikonfirmasi',
          message: `Pesanan #${orderId} dikonfirmasi dengan pembayaran tunai.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Tunai - Menunggu Layanan',
          reason: 'Pembayaran tunai saat layanan diberikan'
        }
      });

      console.log('[SUCCESS] Cash payment confirmed');
      
      return NextResponse.json({
        success: true,
        message: 'Pembayaran Tunai berhasil dikonfirmasi',
        paymentType: 'tunai',
        orderId,
        amount,
        transactionFee: 0,
        totalAmount: amount,
        redirectUrl: '/riwayat_pemesanan'
      });
    }

    // Check Xendit config
    if (!isXenditConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Configuration Error', message: 'Xendit belum dikonfigurasi' },
        { status: 500 }
      );
    }

    // Prepare customer data
    const validatedEmail = validateEmail(customerEmail) ? customerEmail : `user_${userId.substring(0, 8)}@temp.local`;
    const validatedPhone = formatPhoneNumber(customerPhone);
    const validatedName = sanitizeName(customerName);

    console.log('\n[Customer]');
    console.log('  - Name:', validatedName);
    console.log('  - Email:', validatedEmail);
    console.log('  - Phone:', validatedPhone);

    // URLs
    const baseUrl = APP_URL.replace(/\/$/, '');
    const successUrl = `${baseUrl}/riwayat_pemesanan?payment=success&orderId=${orderId}`;
    const failureUrl = `${baseUrl}/riwayat_pemesanan?payment=failed&orderId=${orderId}`;

    // Description
    const serviceNames = booking.items.map(item => item.service.name).join(', ');
    const paymentDescription = `Pembayaran ${serviceNames} - ${booking.vendor.name}`.substring(0, 200);

    // ==========================================
    // CREATE XENDIT INVOICE
    // TIDAK PAKAI FILTER - biarkan Xendit tampilkan semua metode yang aktif
    // ==========================================
    console.log('\n[Xendit] Creating Invoice...');
    console.log('  - NO payment method filter (Xendit will show all available methods)');
    console.log('  - User selected:', paymentMethod, '- but they can choose any on Xendit page');

    let xenditResponse: any = null;
    let paymentUrl: string | null = null;

    try {
      // TIDAK KIRIM payment_methods filter
      // Xendit akan menampilkan SEMUA metode yang sudah diaktifkan di dashboard
      xenditResponse = await createXenditInvoice({
        externalId: orderId,
        amount: totalAmount,
        payerEmail: validatedEmail,
        description: paymentDescription,
        customerName: validatedName,
        customerPhone: validatedPhone,
        successRedirectUrl: successUrl,
        failureRedirectUrl: failureUrl,
        // TIDAK ADA paymentMethods filter!
        invoiceDuration: 86400, // 24 jam
      });

      paymentUrl = xenditResponse.invoice_url;
      
      console.log('\n[Xendit] SUCCESS!');
      console.log('  - Invoice ID:', xenditResponse.id);
      console.log('  - Invoice URL:', paymentUrl);
      console.log('  - Available methods on Xendit page:', xenditResponse.available_banks || 'All enabled methods');

    } catch (xenditError: any) {
      console.error('\n[XENDIT ERROR]');
      console.error('  - Message:', xenditError.message);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Payment Gateway Error',
          message: xenditError.message || 'Gagal membuat pembayaran',
        },
        { status: 500 }
      );
    }

    // Update database
    console.log('\n[Database] Updating...');
    
    try {
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_method: paymentMethod,
          payment_status: 'PENDING',
          transaction_fee: transactionFee,
          total: totalAmount,
        }
      });

      await prisma.userNotification.create({
        data: {
          user_id: userId,
          title: '💳 Pembayaran Dibuat',
          message: `Pembayaran #${orderId} dibuat. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: `Pembayaran Dibuat - ${feeConfig.name}`,
          reason: `Menunggu pembayaran Rp ${totalAmount.toLocaleString('id-ID')}`
        }
      });
    } catch (dbError) {
      console.error('  - DB Error (non-fatal):', dbError);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    PAYMENT CREATED SUCCESSFULLY                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    return NextResponse.json({
      success: true,
      message: 'Pembayaran berhasil dibuat',
      paymentType: feeConfig.category,
      orderId,
      amount,
      transactionFee,
      totalAmount,
      paymentUrl,
      xenditId: xenditResponse?.id,
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
      redirectUrl: paymentUrl || '/riwayat_pemesanan'
    });

  } catch (error: any) {
    console.error('\n[UNEXPECTED ERROR]', error.message);
    
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - Check Payment Status
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      select: {
        booking_id: true,
        payment_status: true,
        payment_method: true,
        total: true,
        transaction_fee: true,
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        orderId,
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        total: booking.total,
        transactionFee: booking.transaction_fee,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}
