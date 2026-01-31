// app/api/payments/xendit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import {
  calculateXenditFee,
  XENDIT_PAYMENT_FEES,
  PaymentMethodId,
  isXenditConfigured,
  getSecretKeyInfo,
} from '@/app/components/lib/xendit';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Generate dummy VA number for testing
function generateVANumber(bankCode: string): string {
  const prefix: Record<string, string> = {
    'va_bca': '1234567890',
    'va_bni': '8810',
    'va_bri': '2621',
    'va_mandiri': '8908',
    'va_permata': '8214',
    'va_bsi': '7181',
    'va_cimb': '8039',
  };
  const basePrefix = prefix[bankCode] || '9999';
  const randomPart = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return basePrefix + randomPart.slice(0, 14 - basePrefix.length);
}

// Generate QRIS string for testing
function generateQRISString(orderId: string, amount: number): string {
  // Format QRIS sederhana untuk testing
  const timestamp = Date.now();
  return `00020101021226580011ID.CO.SELSAS01189360091800000000000215${orderId}5303360540${amount}5802ID5913SELSAS VENDOR6007JAKARTA61051234062070503***6304${timestamp.toString(16).toUpperCase().slice(-4)}`;
}

// ==========================================
// POST - Create Payment (Without Xendit Redirect)
// ==========================================

export async function POST(request: NextRequest) {
  let requestBody: any = null;
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           PAYMENT API - REQUEST RECEIVED (NO REDIRECT)           ║');
  console.log('║ Timestamp:', new Date().toISOString());
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
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

    // Get payment method config
    const feeConfig = XENDIT_PAYMENT_FEES[paymentMethod as PaymentMethodId];
    
    // Prepare response based on payment method category
    let responseData: any = {
      success: true,
      message: 'Pembayaran berhasil dibuat',
      paymentType: feeConfig.category,
      paymentMethod: paymentMethod,
      paymentMethodName: feeConfig.name,
      orderId,
      amount,
      transactionFee,
      totalAmount,
      expirationDate: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    };

    // ==========================================
    // HANDLE DIFFERENT PAYMENT TYPES
    // ==========================================

    if (feeConfig.category === 'tunai') {
      // TUNAI - Cash payment
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
          message: `Pesanan #${orderId} dikonfirmasi dengan pembayaran tunai. Siapkan pembayaran saat layanan diberikan.`,
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

      responseData.message = 'Pembayaran Tunai berhasil dikonfirmasi';
      responseData.transactionFee = 0;
      responseData.totalAmount = amount;

    } else if (feeConfig.category === 'va') {
      // VIRTUAL ACCOUNT
      console.log('\n[Processing] Virtual Account payment...');
      
      const vaNumber = generateVANumber(paymentMethod);
      
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
          title: '🏦 Virtual Account Dibuat',
          message: `Pembayaran #${orderId} via ${feeConfig.name}. VA: ${vaNumber}. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: `Menunggu Pembayaran - ${feeConfig.name}`,
          reason: `VA Number: ${vaNumber}`
        }
      });

      responseData.vaNumber = vaNumber;
      responseData.bankCode = paymentMethod.replace('va_', '').toUpperCase();

    } else if (feeConfig.category === 'qris') {
      // QRIS
      console.log('\n[Processing] QRIS payment...');
      
      const qrString = generateQRISString(orderId, totalAmount);
      
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
          title: '📱 QRIS Dibuat',
          message: `Pembayaran #${orderId} via QRIS. Total: Rp ${totalAmount.toLocaleString('id-ID')}. Scan QR untuk membayar.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Menunggu Pembayaran - QRIS',
          reason: 'Scan QR Code untuk membayar'
        }
      });

      responseData.qrString = qrString;

    } else if (feeConfig.category === 'ewallet') {
      // E-WALLET (DANA, OVO, ShopeePay, LinkAja)
      console.log('\n[Processing] E-Wallet payment...');
      
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
          title: `📱 Pembayaran ${feeConfig.name} Dibuat`,
          message: `Pembayaran #${orderId} via ${feeConfig.name}. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: `Menunggu Pembayaran - ${feeConfig.name}`,
          reason: `Pembayaran via ${feeConfig.name}`
        }
      });

      // For e-wallet, we'll show a simulated deep link or instruction
      responseData.ewalletType = paymentMethod.replace('ewallet_', '').toUpperCase();

    } else if (feeConfig.category === 'card') {
      // CREDIT/DEBIT CARD
      console.log('\n[Processing] Card payment...');
      
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
          title: '💳 Pembayaran Kartu Dibuat',
          message: `Pembayaran #${orderId} via ${feeConfig.name}. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: `Menunggu Pembayaran - ${feeConfig.name}`,
          reason: `Pembayaran via kartu kredit/debit`
        }
      });

      responseData.cardType = paymentMethod.replace('card_', '').toUpperCase();

    } else if (feeConfig.category === 'retail') {
      // RETAIL OUTLETS (Alfamart, Indomaret)
      console.log('\n[Processing] Retail payment...');
      
      const paymentCode = `SELSAS${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
      
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
          title: `🏪 Kode Pembayaran ${feeConfig.name} Dibuat`,
          message: `Pembayaran #${orderId} via ${feeConfig.name}. Kode: ${paymentCode}. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: `Menunggu Pembayaran - ${feeConfig.name}`,
          reason: `Kode Pembayaran: ${paymentCode}`
        }
      });

      responseData.paymentCode = paymentCode;
      responseData.retailOutlet = paymentMethod.replace('retail_', '').toUpperCase();
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    PAYMENT CREATED SUCCESSFULLY                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    return NextResponse.json(responseData);

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
        status: true,
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
        status: booking.status,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}