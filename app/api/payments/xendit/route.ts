// app/api/payments/xendit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import {
  calculateXenditFee,
  XENDIT_PAYMENT_FEES,
  PaymentMethodId,
  isXenditConfigured,
  createQRISPayment,
  getQRCodeDetails,
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

// ==========================================
// POST - Create Payment (With Xendit Integration)
// ==========================================

export async function POST(request: NextRequest) {
  let requestBody: any = null;
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           PAYMENT API - REQUEST RECEIVED (XENDIT INTEGRATION)    ║');
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

    } else if (feeConfig.category === 'qris') {
      // QRIS - Create Xendit QR Code
      console.log('\n[Processing] QRIS payment via Xendit...');
      
      // Check if Xendit is configured
      if (!isXenditConfigured()) {
        console.error('[Xendit] API key not configured');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Configuration Error', 
            message: 'Sistem pembayaran belum dikonfigurasi. Mohon hubungi administrator.' 
          },
          { status: 500 }
        );
      }

      try {
        // Create QR Code via Xendit API
        const qrParams = {
          externalId: orderId,
          amount: totalAmount,
          customerName: customerName || 'Customer',
          customerPhone: customerPhone || '',
          customerEmail: customerEmail || '',
          description: description || `Pembayaran untuk layanan dari ${booking.vendor.name}`,
          expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
        };

        console.log('[Xendit] Creating QR Code with params:', qrParams);
        
        const qrResponse = await createQRISPayment(qrParams);
        
        console.log('[Xendit] QR Code created:', {
          id: qrResponse.id,
          qrString: qrResponse.qr_string,
          amount: qrResponse.amount,
          status: qrResponse.status
        });

        // Save QR code data to database using payment_metadata
        const paymentMetadata = {
          xendit_qr_id: qrResponse.id,
          xendit_qr_string: qrResponse.qr_string,
          xendit_expires_at: qrResponse.expires_at,
          xendit_status: qrResponse.status,
          qr_code_url: qrResponse.qr_code_url || null,
          invoice_url: qrResponse.invoice_url || null,
        };

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            payment_method: paymentMethod,
            payment_status: 'PENDING',
            transaction_fee: transactionFee,
            total: totalAmount,
            payment_metadata: paymentMetadata // ✅ Now valid with updated schema
          }
        });

        // Create notification
        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: '📱 QRIS Dibuat via Xendit',
            message: `Pembayaran #${orderId} via QRIS berhasil dibuat. Total: Rp ${totalAmount.toLocaleString('id-ID')}. QR code berlaku 24 jam.`,
            type: 'payment',
            order_id: booking.booking_id,
          }
        });

        // Add to booking history
        await prisma.bookingHistory.create({
          data: {
            booking_id: booking.booking_id,
            status: 'Menunggu Pembayaran - QRIS',
            reason: `QR Code ID: ${qrResponse.id.slice(-8)}`
          }
        });

        // Prepare response with Xendit QR data
        responseData = {
          ...responseData,
          xenditId: qrResponse.id,
          qrId: qrResponse.id,
          qrString: qrResponse.qr_string,
          qrCodeUrl: qrResponse.qr_code_url,
          invoiceUrl: qrResponse.invoice_url,
          expiresAt: qrResponse.expires_at,
          qrCodeData: qrResponse.qr_code_url ? await fetchQRCodeImage(qrResponse.qr_code_url) : null,
        };

        console.log('[Xendit] QRIS payment created successfully');

      } catch (xenditError: any) {
        console.error('[Xendit] Error creating QR code:', xenditError);
        
        // Fallback to dummy QR code for testing
        console.log('[Xendit] Falling back to dummy QR code for testing');
        
        const dummyQRString = `00020101021226650014ID.CO.QRIS.WWW011893600914220617${orderId}5204571253033605406${totalAmount}5802ID5913SELSAS VENDOR6005DEPOK61051234562140123DANA${Date.now()}${Math.random().toString(36).substr(2, 9)}6304`;
        
        const dummyPaymentMetadata = {
          is_test_mode: true,
          qr_string: dummyQRString,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            payment_method: paymentMethod,
            payment_status: 'PENDING',
            transaction_fee: transactionFee,
            total: totalAmount,
            payment_metadata: dummyPaymentMetadata // ✅ Now valid
          }
        });

        responseData = {
          ...responseData,
          isTestMode: true,
          qrString: dummyQRString,
          message: 'QRIS berhasil dibuat (Mode Testing)',
        };
      }

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
          payment_metadata: {
            va_number: vaNumber,
            bank_code: paymentMethod.replace('va_', '').toUpperCase(),
          }
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
          payment_metadata: {
            ewallet_type: paymentMethod.replace('ewallet_', '').toUpperCase(),
          }
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
          payment_metadata: {
            card_type: paymentMethod.replace('card_', '').toUpperCase(),
          }
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
          payment_metadata: {
            payment_code: paymentCode,
            retail_outlet: paymentMethod.replace('retail_', '').toUpperCase(),
          }
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
// HELPER: Fetch QR Code Image from URL
// ==========================================

async function fetchQRCodeImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[QR Code] Failed to fetch image from URL:', url);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('[QR Code] Error fetching image:', error);
    return null;
  }
}

// ==========================================
// GET - Check Payment Status
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    const refreshQR = request.nextUrl.searchParams.get('refreshQR') === 'true';

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
        payment_metadata: true,
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // If QR code and we need to refresh it
    let refreshedQRData = null;
    if (refreshQR && booking.payment_method === 'qris' && booking.payment_metadata) {
      try {
        const metadata = booking.payment_metadata as any;
        if (metadata.xendit_qr_id) {
          const qrId = metadata.xendit_qr_id;
          const qrDetails = await getQRCodeDetails(qrId);
          
          refreshedQRData = {
            qrString: qrDetails.qr_string,
            qrCodeUrl: qrDetails.qr_code_url,
            status: qrDetails.status,
            expiresAt: qrDetails.expires_at,
            qrCodeData: qrDetails.qr_code_url ? await fetchQRCodeImage(qrDetails.qr_code_url) : null,
          };
          
          // Update metadata with refreshed data
          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_metadata: {
                ...metadata,
                ...refreshedQRData,
              }
            }
          });
        }
      } catch (error) {
        console.error('[Refresh QR] Error:', error);
      }
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
        metadata: booking.payment_metadata,
        refreshedQR: refreshedQRData,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}