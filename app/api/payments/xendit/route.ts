// app/api/payments/xendit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import {
  calculateXenditFee,
  XENDIT_PAYMENT_FEES,
  PaymentMethodId,
  isXenditConfigured,
  // QRIS
  createQRISPayment,
  getQRCodeDetails,
  // E-Wallet
  createEWalletPayment,
  getEWalletChargeStatus,
  // Virtual Account
  createVirtualAccount,
  getVirtualAccountDetails,
  // Retail Outlet
  createRetailPayment,
  getRetailPaymentDetails,
  // Card (via Invoice)
  createCardPayment,
  getInvoiceDetails,
} from '@/app/components/lib/xendit';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ==========================================
// POST - Create Payment (Full Xendit Integration)
// ==========================================

export async function POST(request: NextRequest) {
  let requestBody: any = null;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       XENDIT PAYMENT API - FULL INTEGRATION                      ║');
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
    console.log('  - Customer:', customerName, customerEmail, customerPhone);

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

    // Check if Xendit is configured (except for tunai)
    if (feeConfig.category !== 'tunai' && !isXenditConfigured()) {
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

    // Prepare base response
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
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
    };

    // ==========================================
    // PROCESS PAYMENT BY TYPE
    // ==========================================

    try {
      switch (feeConfig.category) {
        // ==========================================
        // TUNAI (Cash) - No Xendit needed
        // ==========================================
        case 'tunai': {
          console.log('\n[Processing] Cash payment...');

          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_method: paymentMethod,
              payment_status: 'PENDING',
              transaction_fee: 0,
              total: amount,
              status: 'CONFIRMED',
              payment_metadata: {
                payment_type: 'tunai',
                created_at: new Date().toISOString(),
              }
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
          break;
        }

        // ==========================================
        // QRIS - Create QR Code
        // ==========================================
        case 'qris': {
          console.log('\n[Processing] QRIS payment via Xendit...');

          const qrResponse = await createQRISPayment({
            externalId: orderId,
            amount: totalAmount,
            customerName: customerName || 'Customer',
            customerPhone: customerPhone || '',
            customerEmail: customerEmail || '',
            description: description || `Pembayaran untuk layanan dari ${booking.vendor.name}`,
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          });

          console.log('[Xendit QRIS] Response:', JSON.stringify(qrResponse, null, 2));

          const paymentMetadata = {
            payment_type: 'qris',
            xendit_id: qrResponse.id,
            xendit_qr_id: qrResponse.id,
            xendit_qr_string: qrResponse.qr_string,
            qr_code_url: qrResponse.qr_code_url || null,
            invoice_url: qrResponse.invoice_url || null,
            xendit_status: qrResponse.status,
            xendit_expires_at: qrResponse.expires_at,
            created_at: qrResponse.created,
          };

          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_method: paymentMethod,
              payment_status: 'PENDING',
              transaction_fee: transactionFee,
              total: totalAmount,
              payment_metadata: paymentMetadata
            }
          });

          await prisma.userNotification.create({
            data: {
              user_id: userId,
              title: '📱 QRIS Dibuat',
              message: `Pembayaran #${orderId} via QRIS berhasil dibuat. Total: Rp ${totalAmount.toLocaleString('id-ID')}. Scan QR code untuk membayar.`,
              type: 'payment',
              order_id: booking.booking_id,
            }
          });

          await prisma.bookingHistory.create({
            data: {
              booking_id: booking.booking_id,
              status: 'Menunggu Pembayaran - QRIS',
              reason: `Xendit QR ID: ${qrResponse.id}`
            }
          });

          responseData = {
            ...responseData,
            xenditId: qrResponse.id,
            qrId: qrResponse.id,
            qrString: qrResponse.qr_string,
            qrCodeUrl: qrResponse.qr_code_url,
            invoiceUrl: qrResponse.invoice_url,
            expiresAt: qrResponse.expires_at,
          };
          break;
        }

        // ==========================================
        // E-WALLET (DANA, OVO, ShopeePay, LinkAja)
        // ==========================================
        case 'ewallet': {
          console.log('\n[Processing] E-Wallet payment via Xendit...');

          const channelCode = (feeConfig as any).channelCode;
          console.log('[E-Wallet] Channel Code:', channelCode);

          const ewalletResponse = await createEWalletPayment({
            externalId: orderId,
            amount: totalAmount,
            channelCode: channelCode,
            customerPhone: customerPhone || '',
            customerName: customerName || 'Customer',
            customerEmail: customerEmail || '',
            description: description || `Pembayaran untuk layanan dari ${booking.vendor.name}`,
            successRedirectUrl: `${APP_URL}/riwayat_pemesanan?orderId=${orderId}&status=success`,
            failureRedirectUrl: `${APP_URL}/riwayat_pemesanan?orderId=${orderId}&status=failed`,
          });

          console.log('[Xendit E-Wallet] Response:', JSON.stringify(ewalletResponse, null, 2));

          const paymentMetadata = {
            payment_type: 'ewallet',
            xendit_id: ewalletResponse.id,
            xendit_reference_id: ewalletResponse.reference_id,
            channel_code: ewalletResponse.channel_code,
            xendit_status: ewalletResponse.status,
            is_redirect_required: ewalletResponse.is_redirect_required,
            actions: ewalletResponse.actions,
            checkout_url: ewalletResponse.actions?.mobile_web_checkout_url ||
              ewalletResponse.actions?.desktop_web_checkout_url ||
              null,
            deeplink_url: ewalletResponse.actions?.mobile_deeplink_checkout_url || null,
            qr_string: ewalletResponse.actions?.qr_checkout_string || null,
            created_at: ewalletResponse.created,
          };

          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_method: paymentMethod,
              payment_status: 'PENDING',
              transaction_fee: transactionFee,
              total: totalAmount,
              payment_metadata: paymentMetadata
            }
          });

          await prisma.userNotification.create({
            data: {
              user_id: userId,
              title: `📱 Pembayaran ${feeConfig.name} Dibuat`,
              message: `Pembayaran #${orderId} via ${feeConfig.name} berhasil dibuat. Total: Rp ${totalAmount.toLocaleString('id-ID')}. Silakan selesaikan pembayaran.`,
              type: 'payment',
              order_id: booking.booking_id,
            }
          });

          await prisma.bookingHistory.create({
            data: {
              booking_id: booking.booking_id,
              status: `Menunggu Pembayaran - ${feeConfig.name}`,
              reason: `Xendit Charge ID: ${ewalletResponse.id}`
            }
          });

          responseData = {
            ...responseData,
            xenditId: ewalletResponse.id,
            ewalletType: channelCode.replace('ID_', ''),
            isRedirectRequired: ewalletResponse.is_redirect_required,
            checkoutUrl: paymentMetadata.checkout_url,
            deeplinkUrl: paymentMetadata.deeplink_url,
            qrString: paymentMetadata.qr_string,
            actions: ewalletResponse.actions,
          };
          break;
        }

        // ==========================================
        // VIRTUAL ACCOUNT (BCA, BNI, BRI, Mandiri, etc.)
        // ==========================================
        case 'va': {
          console.log('\n[Processing] Virtual Account payment via Xendit...');

          const bankCode = (feeConfig as any).bankCode;
          console.log('[VA] Bank Code:', bankCode);

          const vaResponse = await createVirtualAccount({
            externalId: orderId,
            bankCode: bankCode,
            amount: totalAmount,
            customerName: customerName || 'SELSAS Customer',
            customerPhone: customerPhone || '',
            customerEmail: customerEmail || '',
            description: description || `Pembayaran untuk layanan dari ${booking.vendor.name}`,
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isSingleUse: true,
            isClosed: true,
          });

          console.log('[Xendit VA] Response:', JSON.stringify(vaResponse, null, 2));

          const paymentMetadata = {
            payment_type: 'va',
            xendit_id: vaResponse.id,
            bank_code: vaResponse.bank_code,
            merchant_code: vaResponse.merchant_code,
            account_number: vaResponse.account_number,
            va_number: vaResponse.account_number,
            xendit_status: vaResponse.status,
            expected_amount: vaResponse.expected_amount,
            expiration_date: vaResponse.expiration_date,
            is_closed: vaResponse.is_closed,
            is_single_use: vaResponse.is_single_use,
          };

          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_method: paymentMethod,
              payment_status: 'PENDING',
              transaction_fee: transactionFee,
              total: totalAmount,
              payment_metadata: paymentMetadata
            }
          });

          await prisma.userNotification.create({
            data: {
              user_id: userId,
              title: `🏦 Virtual Account ${bankCode} Dibuat`,
              message: `Pembayaran #${orderId} via ${feeConfig.name}. VA: ${vaResponse.account_number}. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
              type: 'payment',
              order_id: booking.booking_id,
            }
          });

          await prisma.bookingHistory.create({
            data: {
              booking_id: booking.booking_id,
              status: `Menunggu Pembayaran - ${feeConfig.name}`,
              reason: `VA Number: ${vaResponse.account_number}`
            }
          });

          responseData = {
            ...responseData,
            xenditId: vaResponse.id,
            vaNumber: vaResponse.account_number,
            bankCode: vaResponse.bank_code,
            merchantCode: vaResponse.merchant_code,
            expirationDate: vaResponse.expiration_date,
          };
          break;
        }

        // ==========================================
        // RETAIL OUTLETS (Alfamart, Indomaret)
        // ==========================================
        case 'retail': {
          console.log('\n[Processing] Retail Outlet payment via Xendit...');

          const retailCode = (feeConfig as any).retailCode;
          console.log('[Retail] Outlet:', retailCode);

          const retailResponse = await createRetailPayment({
            externalId: orderId,
            retailOutletName: retailCode,
            amount: totalAmount,
            customerName: customerName || 'SELSAS Customer',
            customerPhone: customerPhone || '',
            customerEmail: customerEmail || '',
            description: description || `Pembayaran untuk layanan dari ${booking.vendor.name}`,
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isSingleUse: true,
          });

          console.log('[Xendit Retail] Response:', JSON.stringify(retailResponse, null, 2));

          const paymentMetadata = {
            payment_type: 'retail',
            xendit_id: retailResponse.id,
            retail_outlet_name: retailResponse.retail_outlet_name,
            payment_code: retailResponse.payment_code,
            prefix: retailResponse.prefix,
            xendit_status: retailResponse.status,
            expected_amount: retailResponse.expected_amount,
            expiration_date: retailResponse.expiration_date,
            is_single_use: retailResponse.is_single_use,
          };

          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_method: paymentMethod,
              payment_status: 'PENDING',
              transaction_fee: transactionFee,
              total: totalAmount,
              payment_metadata: paymentMetadata
            }
          });

          await prisma.userNotification.create({
            data: {
              user_id: userId,
              title: `🏪 Kode Pembayaran ${retailCode} Dibuat`,
              message: `Pembayaran #${orderId} via ${feeConfig.name}. Kode: ${retailResponse.payment_code}. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
              type: 'payment',
              order_id: booking.booking_id,
            }
          });

          await prisma.bookingHistory.create({
            data: {
              booking_id: booking.booking_id,
              status: `Menunggu Pembayaran - ${feeConfig.name}`,
              reason: `Payment Code: ${retailResponse.payment_code}`
            }
          });

          responseData = {
            ...responseData,
            xenditId: retailResponse.id,
            paymentCode: retailResponse.payment_code,
            retailOutlet: retailResponse.retail_outlet_name,
            expirationDate: retailResponse.expiration_date,
          };
          break;
        }

        // ==========================================
        // CARD (Credit/Debit Card via Invoice)
        // ==========================================
        case 'card': {
          console.log('\n[Processing] Card payment via Xendit Invoice...');

          if (!customerEmail) {
            return NextResponse.json(
              { success: false, error: 'Validation Error', message: 'Email diperlukan untuk pembayaran kartu' },
              { status: 400 }
            );
          }

          const cardResponse = await createCardPayment({
            externalId: orderId,
            amount: totalAmount,
            payerEmail: customerEmail,
            customerName: customerName || 'Customer',
            customerPhone: customerPhone || '',
            description: description || `Pembayaran untuk layanan dari ${booking.vendor.name}`,
            successRedirectUrl: `${APP_URL}/riwayat_pemesanan?orderId=${orderId}&status=success`,
            failureRedirectUrl: `${APP_URL}/riwayat_pemesanan?orderId=${orderId}&status=failed`,
            invoiceDuration: 86400,
          });

          console.log('[Xendit Card] Response:', JSON.stringify(cardResponse, null, 2));

          const paymentMetadata = {
            payment_type: 'card',
            xendit_id: cardResponse.id,
            xendit_invoice_id: cardResponse.id,
            invoice_url: cardResponse.invoice_url,
            xendit_status: cardResponse.status,
            expiry_date: cardResponse.expiry_date,
            merchant_name: cardResponse.merchant_name,
          };

          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: {
              payment_method: paymentMethod,
              payment_status: 'PENDING',
              transaction_fee: transactionFee,
              total: totalAmount,
              payment_metadata: paymentMetadata
            }
          });

          await prisma.userNotification.create({
            data: {
              user_id: userId,
              title: `💳 Pembayaran Kartu Dibuat`,
              message: `Pembayaran #${orderId} via ${feeConfig.name}. Total: Rp ${totalAmount.toLocaleString('id-ID')}. Silakan selesaikan pembayaran.`,
              type: 'payment',
              order_id: booking.booking_id,
            }
          });

          await prisma.bookingHistory.create({
            data: {
              booking_id: booking.booking_id,
              status: `Menunggu Pembayaran - ${feeConfig.name}`,
              reason: `Invoice ID: ${cardResponse.id}`
            }
          });

          responseData = {
            ...responseData,
            xenditId: cardResponse.id,
            invoiceId: cardResponse.id,
            invoiceUrl: cardResponse.invoice_url,
            cardType: paymentMethod.replace('card_', '').toUpperCase(),
            expirationDate: cardResponse.expiry_date,
          };
          break;
        }

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid Payment Type', message: 'Tipe pembayaran tidak didukung' },
            { status: 400 }
          );
      }

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║                 PAYMENT CREATED SUCCESSFULLY                     ║');
      console.log('║ Type:', feeConfig.category.toUpperCase().padEnd(55), '║');
      console.log('║ Xendit ID:', (responseData.xenditId || 'N/A').substring(0, 48).padEnd(51), '║');
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json(responseData);

    } catch (xenditError: any) {
      console.error('\n[Xendit API Error]', xenditError.message);

      // Return error to frontend
      return NextResponse.json(
        {
          success: false,
          error: 'Payment Gateway Error',
          message: `Gagal membuat pembayaran: ${xenditError.message}`,
          details: xenditError.message
        },
        { status: 500 }
      );
    }

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
    const refreshQR = request.nextUrl.searchParams.get('refreshQR') === 'true';
    const checkXendit = request.nextUrl.searchParams.get('checkXendit') === 'true';

    console.log('\n[Payment Status] GET request for:', orderId);

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

    const metadata = booking.payment_metadata as any;
    let xenditStatus = null;
    let refreshedData = null;

    // Check Xendit status if requested
    if (checkXendit && metadata?.xendit_id) {
      try {
        const paymentType = metadata.payment_type;

        switch (paymentType) {
          case 'qris':
            xenditStatus = await getQRCodeDetails(metadata.xendit_id);
            break;
          case 'ewallet':
            xenditStatus = await getEWalletChargeStatus(metadata.xendit_id);
            break;
          case 'va':
            xenditStatus = await getVirtualAccountDetails(metadata.xendit_id);
            break;
          case 'retail':
            xenditStatus = await getRetailPaymentDetails(metadata.xendit_id);
            break;
          case 'card':
            xenditStatus = await getInvoiceDetails(metadata.xendit_id);
            break;
        }

        console.log('[Payment Status] Xendit status:', xenditStatus?.status);

      } catch (error) {
        console.error('[Payment Status] Error checking Xendit:', error);
      }
    }

    // Refresh QR code if requested
    if (refreshQR && metadata?.xendit_qr_id) {
      try {
        const qrDetails = await getQRCodeDetails(metadata.xendit_qr_id);
        refreshedData = {
          qrString: qrDetails.qr_string,
          qrCodeUrl: qrDetails.qr_code_url,
          status: qrDetails.status,
          expiresAt: qrDetails.expires_at,
        };

        // Update metadata
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            payment_metadata: {
              ...metadata,
              xendit_qr_string: qrDetails.qr_string,
              qr_code_url: qrDetails.qr_code_url,
              xendit_status: qrDetails.status,
            }
          }
        });

      } catch (error) {
        console.error('[Payment Status] Error refreshing QR:', error);
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
        metadata: metadata,
        xenditStatus: xenditStatus,
        refreshedQR: refreshedData,
      },
    });

  } catch (error: any) {
    console.error('[Payment Status] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}