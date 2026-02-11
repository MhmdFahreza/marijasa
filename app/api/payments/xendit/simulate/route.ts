// app/api/payments/xendit/simulate/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import { XENDIT_PAYMENT_FEES, PaymentMethodId } from '@/app/components/lib/xendit';

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const BASE_URL = 'https://api.xendit.co';
const ALLOW_DIRECT_SIMULATION = process.env.ALLOW_DIRECT_SIMULATION === 'true';

// ==========================================
// IMPROVED E-WALLET SIMULATION WITH FALLBACK
// ==========================================
async function simulateXenditEWalletPayment(
  chargeId: string,
  amount: number,
  channelCode: string,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[E-Wallet Simulate] Starting...');
  console.log('[E-Wallet Simulate] Charge ID:', chargeId);
  console.log('[E-Wallet Simulate] Channel:', channelCode);
  console.log('[E-Wallet Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  // Strategy: 
  // 1. Coba dengan amount (untuk DANA, ShopeePay, LinkAja)
  // 2. Jika gagal dengan 400, coba tanpa amount (untuk OVO)
  // 3. Jika tetap gagal, gunakan direct update jika diizinkan

  const strategies = [
    { withAmount: true, description: 'with amount' },
    { withAmount: false, description: 'without amount' }
  ];

  for (const strategy of strategies) {
    // Skip amount untuk channel yang tidak support jika strategy withAmount = true
    if (strategy.withAmount && channelCode === 'ID_OVO') {
      console.log('[E-Wallet Simulate] Skipping amount for OVO (not supported)');
      continue;
    }
    // Skip tanpa amount untuk channel yang membutuhkan amount
    if (!strategy.withAmount && channelCode !== 'ID_OVO') {
      console.log('[E-Wallet Simulate] Skipping no-amount for non-OVO channel (required)');
      continue;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[E-Wallet Simulate] Attempt ${attempt}/${maxRetries} - ${strategy.description}`);

        const requestBody: any = {};
        if (strategy.withAmount) {
          requestBody.amount = amount;
        }

        const endpoint = `${BASE_URL}/ewallets/charges/${chargeId}/simulate_payment`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
            'api-version': '2021-01-25',
          },
          body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
        });

        const responseText = await response.text();
        console.log(`[E-Wallet Simulate] Response status: ${response.status}`);
        console.log(`[E-Wallet Simulate] Response body: ${responseText.substring(0, 200)}...`);

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            data = { raw: responseText };
          }
          console.log('[E-Wallet Simulate] ✅ SUCCESS');
          return { success: true, data, isTestMode: true };
        }

        // Jika 400 Bad Request, coba strategi berikutnya
        if (response.status === 400) {
          console.log('[E-Wallet Simulate] ⚠️ 400 Bad Request, trying next strategy');
          break; // keluar dari loop attempt, lanjut ke strategi berikutnya
        }

        if (response.status === 404) {
          console.log('[E-Wallet Simulate] ⚠️ 404 - Charge not found or expired');
          return { success: false, error: 'CHARGE_NOT_FOUND', isTestMode: false };
        }

        if (attempt < maxRetries) {
          console.log(`[E-Wallet Simulate] Retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`[E-Wallet Simulate] Exception:`, error.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          return { success: false, error: error.message, isTestMode: true };
        }
      }
    }
  }

  return { success: false, error: 'All strategies failed', isTestMode: true };
}

// ==========================================
// VIRTUAL ACCOUNT SIMULATION - USING VA ID
// ==========================================
async function simulateXenditVAPayment(
  vaId: string,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[VA Simulate] Starting...');
  console.log('[VA Simulate] VA ID:', vaId);
  console.log('[VA Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');
  const endpoint = `${BASE_URL}/callback_virtual_accounts/${vaId}/simulate_payment`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[VA Simulate] Attempt ${attempt}/${maxRetries}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });

      const responseText = await response.text();
      console.log(`[VA Simulate] Response status: ${response.status}`);
      console.log(`[VA Simulate] Response body: ${responseText.substring(0, 200)}`);

      if (response.ok) {
        console.log('[VA Simulate] ✅ SUCCESS');
        return { success: true, isTestMode: true };
      }

      if (response.status === 404) {
        console.log('[VA Simulate] ⚠️ 404 - VA not found');
        return { success: false, error: 'VA_NOT_FOUND', isTestMode: false };
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`[VA Simulate] Exception:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        return { success: false, error: error.message, isTestMode: true };
      }
    }
  }

  return { success: false, error: 'Max retries reached', isTestMode: true };
}

// ==========================================
// QRIS SIMULATION - USING QR ID
// ==========================================
async function simulateXenditQRISPayment(
  qrId: string,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[QRIS Simulate] Starting...');
  console.log('[QRIS Simulate] QR ID:', qrId);
  console.log('[QRIS Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');
  const endpoint = `${BASE_URL}/qr_codes/${qrId}/payments/simulate`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[QRIS Simulate] Attempt ${attempt}/${maxRetries}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });

      const responseText = await response.text();
      console.log(`[QRIS Simulate] Response status: ${response.status}`);
      console.log(`[QRIS Simulate] Response body: ${responseText.substring(0, 200)}`);

      if (response.ok) {
        console.log('[QRIS Simulate] ✅ SUCCESS');
        return { success: true, isTestMode: true };
      }

      if (response.status === 404) {
        console.log('[QRIS Simulate] ⚠️ 404 - QR code not found');
        return { success: false, error: 'QR_NOT_FOUND', isTestMode: false };
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`[QRIS Simulate] Exception:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        return { success: false, error: error.message, isTestMode: true };
      }
    }
  }

  return { success: false, error: 'Max retries reached', isTestMode: true };
}

// ==========================================
// RETAIL OUTLET SIMULATION - USING PAYMENT CODE ID
// ==========================================
async function simulateXenditRetailPayment(
  paymentCodeId: string,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[Retail Simulate] Starting...');
  console.log('[Retail Simulate] Payment Code ID:', paymentCodeId);
  console.log('[Retail Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');
  const endpoint = `${BASE_URL}/fixed_payment_code/${paymentCodeId}/simulate_payment`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Retail Simulate] Attempt ${attempt}/${maxRetries}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transfer_amount: amount })
      });

      const responseText = await response.text();
      console.log(`[Retail Simulate] Response status: ${response.status}`);
      console.log(`[Retail Simulate] Response body: ${responseText.substring(0, 200)}`);

      if (response.ok) {
        console.log('[Retail Simulate] ✅ SUCCESS');
        return { success: true, isTestMode: true };
      }

      if (response.status === 404) {
        console.log('[Retail Simulate] ⚠️ 404 - Payment code not found');
        return { success: false, error: 'PAYMENT_CODE_NOT_FOUND', isTestMode: false };
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`[Retail Simulate] Exception:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        return { success: false, error: error.message, isTestMode: true };
      }
    }
  }

  return { success: false, error: 'Max retries reached', isTestMode: true };
}

// ==========================================
// CARD SIMULATION - No API, direct update
// ==========================================
function simulateCardPayment(): { success: boolean; isTestMode: boolean } {
  console.log('[Card Simulate] No simulation API, using direct update');
  return { success: true, isTestMode: true };
}

// ==========================================
// GET PAYMENT METHOD NAME HELPER
// ==========================================
function getPaymentMethodName(paymentMethod: string | null): string {
  if (!paymentMethod) return 'Pembayaran';

  const config = XENDIT_PAYMENT_FEES[paymentMethod as PaymentMethodId];
  if (config) return config.name;

  const fallback: Record<string, string> = {
    'qris': 'QRIS',
    'ewallet_dana': 'DANA',
    'ewallet_ovo': 'OVO',
    'ewallet_shopeepay': 'ShopeePay',
    'ewallet_linkaja': 'LinkAja',
    'va_bca': 'BCA Virtual Account',
    'va_bni': 'BNI Virtual Account',
    'va_bri': 'BRI Virtual Account',
    'va_mandiri': 'Mandiri Virtual Account',
    'va_permata': 'Permata Virtual Account',
    'va_bsi': 'BSI Virtual Account',
    'va_cimb': 'CIMB Niaga Virtual Account',
    'card_visa': 'Kartu Visa',
    'card_mastercard': 'Kartu Mastercard',
    'card_jcb': 'Kartu JCB',
    'retail_alfamart': 'Alfamart',
    'retail_indomaret': 'Indomaret',
    'tunai': 'Tunai',
  };
  return fallback[paymentMethod] || paymentMethod;
}

// ==========================================
// POST - Simulate Payment Success
// ==========================================
export async function POST(request: NextRequest) {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           SIMULATE PAYMENT - REQUEST RECEIVED                    ║');
  console.log('║           FIXED VERSION - MARCH 2025                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    const body = await request.json();
    const { orderId, simulateStatus, additionalServiceId, paymentType, forceUpdate } = body;

    console.log('[Simulate] Order ID:', orderId);
    console.log('[Simulate] Additional Service ID:', additionalServiceId);
    console.log('[Simulate] Payment Type:', paymentType || 'main');
    console.log('[Simulate] Force Update:', forceUpdate);
    console.log('[Simulate] ALLOW_DIRECT_SIMULATION:', ALLOW_DIRECT_SIMULATION);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }

    // ==========================================
    // FETCH BOOKING
    // ==========================================
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      include: {
        user: { select: { user_id: true, name: true } },
        vendor: { select: { name: true } }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Pemesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Simulate] Found booking:', booking.booking_id);
    console.log('[Simulate] Current payment status:', booking.payment_status);
    console.log('[Simulate] Payment method:', booking.payment_method);

    // ==========================================
    // HANDLE ADDITIONAL SERVICE PAYMENT
    // ==========================================
    if (additionalServiceId && paymentType === "additional") {
      console.log('\n[Simulate] Processing ADDITIONAL SERVICE payment');

      const additionalService = await prisma.additionalServiceRequest.findFirst({
        where: {
          request_id: additionalServiceId,
          booking_id: booking.booking_id
        }
      });

      if (!additionalService) {
        return NextResponse.json(
          { success: false, error: 'Not Found', message: 'Layanan tambahan tidak ditemukan' },
          { status: 404 }
        );
      }

      if (additionalService.payment_status === 'PAID') {
        return NextResponse.json(
          { success: false, error: 'Already Paid', message: 'Layanan tambahan ini sudah dibayar' },
          { status: 400 }
        );
      }

      const targetStatus = (simulateStatus || 'PAID').toUpperCase();

      if (targetStatus === 'PAID') {
        const metadata = (additionalService.payment_metadata as any) || {};
        const xenditId = metadata.xendit_id;
        const xenditPaymentType = metadata.payment_type;
        const channelCode = metadata.channel_code;

        // Calculate total amount
        const subtotal = additionalService.total_price || 0;
        const serviceFee = additionalService.service_fee || 10000;
        const transactionFee = additionalService.transaction_fee || 0;
        const totalAmount = subtotal + serviceFee + transactionFee;

        console.log('[Simulate] Additional service details:');
        console.log('  - Description:', additionalService.description);
        console.log('  - Xendit ID:', xenditId);
        console.log('  - Payment type:', xenditPaymentType);
        console.log('  - Total amount:', totalAmount);

        let xenditSimulationResult: any = { success: false, isTestMode: true };
        let useDirectUpdate = forceUpdate === true;

        // Try Xendit simulation only if we have a valid xenditId and not forced to direct update
        if (!useDirectUpdate && xenditId) {
          console.log('[Simulate] Attempting Xendit simulation...');

          switch (xenditPaymentType) {
            case 'ewallet':
              xenditSimulationResult = await simulateXenditEWalletPayment(
                xenditId,
                totalAmount,
                channelCode
              );
              break;
            case 'va':
              xenditSimulationResult = await simulateXenditVAPayment(xenditId, totalAmount);
              break;
            case 'qris':
              xenditSimulationResult = await simulateXenditQRISPayment(xenditId, totalAmount);
              break;
            case 'retail':
              xenditSimulationResult = await simulateXenditRetailPayment(xenditId, totalAmount);
              break;
            case 'card':
              xenditSimulationResult = simulateCardPayment();
              break;
            default:
              console.log('[Simulate] Unknown payment type, using direct update');
              useDirectUpdate = true;
          }

          console.log('[Simulate] Xendit simulation result:', xenditSimulationResult);

          // If Xendit failed and direct simulation is allowed, fallback to direct update
          if (!xenditSimulationResult.success && ALLOW_DIRECT_SIMULATION) {
            console.log('[Simulate] ⚠️ Xendit failed, falling back to direct update');
            useDirectUpdate = true;
          }
        } else {
          console.log('[Simulate] Using direct update (no Xendit simulation)');
          useDirectUpdate = true;
        }

        // If Xendit failed and direct simulation is not allowed, return error
        if (!xenditSimulationResult.success && !ALLOW_DIRECT_SIMULATION && !useDirectUpdate) {
          return NextResponse.json({
            success: false,
            error: 'Simulation Failed',
            message: `❌ Simulasi Xendit gagal: ${xenditSimulationResult.error || 'Unknown error'}`,
            xenditSimulated: false,
            xenditError: xenditSimulationResult.error
          }, { status: 400 });
        }

        // ===== UPDATE DATABASE =====
        console.log('[Simulate] ✅ Updating database...');

        // Update additional service
        const updatedAdditionalService = await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'PAID',
            paid_at: new Date(),
            payment_metadata: {
              ...metadata,
              simulated: true,
              simulated_at: new Date().toISOString(),
              simulated_status: 'PAID',
              xendit_simulated: !useDirectUpdate && xenditSimulationResult.success,
              direct_update: useDirectUpdate,
              simulation_note: useDirectUpdate
                ? 'Direct database update (fallback)'
                : 'Xendit API simulation',
              xendit_simulation_data: xenditSimulationResult.data || null
            }
          }
        });

        console.log('[Simulate] ✅ Additional service payment status updated to PAID');

        // Update booking total
        const paidAdditionalServices = await prisma.additionalServiceRequest.findMany({
          where: {
            booking_id: booking.booking_id,
            status: 'APPROVED',
            payment_status: 'PAID'
          }
        });

        const totalAdditionalPaid = paidAdditionalServices.reduce((sum, req) => {
          const serviceFee = req.service_fee || 10000;
          const transactionFee = req.transaction_fee || 0;
          return sum + (req.total_price || 0) + serviceFee + transactionFee;
        }, 0);

        const newTotal = booking.subtotal + booking.service_fee + booking.transaction_fee + totalAdditionalPaid;

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            total: newTotal,
            payment_metadata: {
              ...(booking.payment_metadata as any) || {},
              updated_at: new Date().toISOString(),
              additional_services_updated: true
            }
          }
        });

        // Create notification
        await prisma.userNotification.create({
          data: {
            user_id: booking.user.user_id,
            title: '✅ Pembayaran Layanan Tambahan Berhasil',
            message: `Pembayaran untuk "${additionalService.description}" berhasil. Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });

        // Add to booking history
        const historyReason = useDirectUpdate
          ? `Pembayaran layanan tambahan: ${additionalService.description} (Direct Update)`
          : `Pembayaran layanan tambahan: ${additionalService.description} (Xendit Simulation)`;

        await prisma.bookingHistory.create({
          data: {
            booking_id: booking.booking_id,
            status: 'Pembayaran Layanan Tambahan Berhasil',
            reason: historyReason
          }
        });

        console.log('[Simulate] ✅ Additional service payment completed');

        return NextResponse.json({
          success: true,
          message: useDirectUpdate
            ? '✅ Pembayaran layanan tambahan berhasil (Direct Update)'
            : '✅ Pembayaran layanan tambahan berhasil (Xendit Simulation)',
          xenditSimulated: !useDirectUpdate && xenditSimulationResult.success,
          directUpdate: useDirectUpdate,
          isTestMode: true,
          additionalService: {
            id: updatedAdditionalService.request_id,
            description: updatedAdditionalService.description,
            paymentStatus: updatedAdditionalService.payment_status,
            paidAt: updatedAdditionalService.paid_at,
            totalAmount
          },
          booking: {
            orderId: booking.booking_number,
            total: newTotal,
            paidAdditionalServicesCount: paidAdditionalServices.length
          }
        });
      }
    }

    // ==========================================
    // HANDLE MAIN PAYMENT SIMULATION
    // ==========================================
    console.log('\n[Simulate] Processing MAIN payment');

    if (booking.payment_status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Already Paid', message: 'Pembayaran sudah dilakukan sebelumnya' },
        { status: 400 }
      );
    }

    if (booking.payment_method === 'tunai') {
      return NextResponse.json(
        { success: false, error: 'Invalid Operation', message: 'Tidak dapat mensimulasikan pembayaran tunai' },
        { status: 400 }
      );
    }

    const paymentMethodName = getPaymentMethodName(booking.payment_method);
    const currentMetadata = (booking.payment_metadata as any) || {};
    const targetStatus = (simulateStatus || 'PAID').toUpperCase();

    if (targetStatus === 'PAID') {
      const xenditId = currentMetadata.xendit_id;
      const xenditPaymentType = currentMetadata.payment_type;
      const channelCode = currentMetadata.channel_code;

      console.log('[Simulate] Main payment details:');
      console.log('  - Xendit ID:', xenditId);
      console.log('  - Payment type:', xenditPaymentType);
      console.log('  - Total amount:', booking.total);

      let xenditSimulationResult: any = { success: false, isTestMode: true };
      let useDirectUpdate = forceUpdate === true;

      // Try Xendit simulation if we have valid xenditId and not forced
      if (!useDirectUpdate && xenditId) {
        console.log('[Simulate] Attempting Xendit simulation for main payment...');

        switch (xenditPaymentType) {
          case 'ewallet':
            xenditSimulationResult = await simulateXenditEWalletPayment(
              xenditId,
              booking.total,
              channelCode
            );
            break;
          case 'va':
            xenditSimulationResult = await simulateXenditVAPayment(xenditId, booking.total);
            break;
          case 'qris':
            xenditSimulationResult = await simulateXenditQRISPayment(xenditId, booking.total);
            break;
          case 'retail':
            xenditSimulationResult = await simulateXenditRetailPayment(xenditId, booking.total);
            break;
          case 'card':
            xenditSimulationResult = simulateCardPayment();
            break;
          default:
            console.log('[Simulate] Unknown payment type, using direct update');
            useDirectUpdate = true;
        }

        console.log('[Simulate] Xendit simulation result:', xenditSimulationResult);

        if (!xenditSimulationResult.success && ALLOW_DIRECT_SIMULATION) {
          console.log('[Simulate] ⚠️ Xendit failed, falling back to direct update');
          useDirectUpdate = true;
        }
      } else {
        console.log('[Simulate] Using direct update');
        useDirectUpdate = true;
      }

      if (!xenditSimulationResult.success && !ALLOW_DIRECT_SIMULATION && !useDirectUpdate) {
        return NextResponse.json({
          success: false,
          error: 'Simulation Failed',
          message: `❌ Simulasi Xendit gagal: ${xenditSimulationResult.error || 'Unknown error'}`,
          xenditSimulated: false,
          xenditError: xenditSimulationResult.error
        }, { status: 400 });
      }

      // ===== UPDATE DATABASE =====
      console.log('[Simulate] ✅ Updating database for main payment...');

      // Hitung ulang total dengan paid additional services
      const paidAdditionalServices = await prisma.additionalServiceRequest.findMany({
        where: {
          booking_id: booking.booking_id,
          status: 'APPROVED',
          payment_status: 'PAID'
        }
      });

      const totalAdditionalPaid = paidAdditionalServices.reduce((sum, req) => {
        const serviceFee = req.service_fee || 10000;
        const transactionFee = req.transaction_fee || 0;
        return sum + (req.total_price || 0) + serviceFee + transactionFee;
      }, 0);

      const newTotal = booking.subtotal + booking.service_fee + booking.transaction_fee + totalAdditionalPaid;

      const updatedBooking = await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_status: 'PAID',
          status: 'CONFIRMED',
          total: newTotal,
          payment_metadata: {
            ...currentMetadata,
            simulated: true,
            simulated_at: new Date().toISOString(),
            simulated_status: 'PAID',
            xendit_simulated: !useDirectUpdate && xenditSimulationResult.success,
            direct_update: useDirectUpdate,
            simulation_note: useDirectUpdate
              ? 'Direct database update'
              : 'Xendit API simulation',
            xendit_simulation_data: xenditSimulationResult.data || null
          }
        }
      });

      console.log('[Simulate] ✅ Booking updated to PAID and CONFIRMED');
      console.log('[Simulate] New total:', newTotal);

      // Create notification
      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '✅ Pembayaran Berhasil',
          message: `Pembayaran #${orderId} via ${paymentMethodName} berhasil. Total: Rp ${newTotal.toLocaleString('id-ID')}. Pesanan sedang diproses.`,
          type: 'payment',
          order_id: booking.booking_id
        }
      });

      // Add to booking history
      const historyReason = useDirectUpdate
        ? `Pembayaran via ${paymentMethodName} (Direct Update)`
        : `Pembayaran via ${paymentMethodName} (Xendit Simulation)`;

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Berhasil',
          reason: historyReason
        }
      });

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║           PAYMENT SIMULATION SUCCESSFUL                          ║');
      console.log('║ Method:', (useDirectUpdate ? 'Direct Update' : 'Xendit API').padEnd(55), '║');
      console.log('║ Status: CONFIRMED                                               ║');
      console.log('║ Total:', `Rp ${newTotal.toLocaleString('id-ID')}`.padEnd(55), '║');
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        success: true,
        message: useDirectUpdate
          ? '✅ Pembayaran berhasil (Direct Update)'
          : '✅ Pembayaran berhasil (Xendit Simulation)',
        xenditSimulated: !useDirectUpdate && xenditSimulationResult.success,
        directUpdate: useDirectUpdate,
        isTestMode: true,
        booking: {
          orderId: updatedBooking.booking_number,
          paymentStatus: updatedBooking.payment_status,
          paymentMethod: updatedBooking.payment_method,
          paymentMethodName,
          status: updatedBooking.status,
          total: updatedBooking.total
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Simulasi tidak dilakukan (status tidak PAID)'
    });

  } catch (error: any) {
    console.error('[Simulate] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - Check simulation status
// ==========================================
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');
  const additionalServiceId = request.nextUrl.searchParams.get('additionalServiceId');

  if (!orderId) {
    return NextResponse.json({
      message: 'Xendit Payment Simulation Endpoint (Fixed Version)',
      usage: 'POST with { orderId, additionalServiceId?, paymentType?, forceUpdate? }',
      config: {
        ALLOW_DIRECT_SIMULATION,
        note: ALLOW_DIRECT_SIMULATION
          ? '✅ Direct database update enabled for testing'
          : '❌ Only Xendit API simulation allowed'
      },
      fixes: [
        '✅ VA simulation now uses xendit_id instead of external_id',
        '✅ E-Wallet simulation improved with fallback strategies',
        '✅ All payment types now correctly update database',
        '✅ Detailed logging added'
      ]
    });
  }

  try {
    if (additionalServiceId) {
      const additionalService = await prisma.additionalServiceRequest.findFirst({
        where: {
          request_id: additionalServiceId,
          booking: { booking_number: orderId }
        },
        select: {
          request_id: true,
          description: true,
          payment_status: true,
          payment_method: true,
          total_price: true,
          transaction_fee: true,
          service_fee: true,
          paid_at: true,
          payment_metadata: true
        }
      });

      if (!additionalService) {
        return NextResponse.json(
          { success: false, error: 'Not Found' },
          { status: 404 }
        );
      }

      const metadata = additionalService.payment_metadata as any;

      return NextResponse.json({
        success: true,
        additionalService: {
          id: additionalService.request_id,
          description: additionalService.description,
          paymentStatus: additionalService.payment_status,
          paymentMethod: additionalService.payment_method,
          totalPrice: additionalService.total_price,
          totalAmount: (additionalService.total_price || 0) +
            (additionalService.service_fee || 10000) +
            (additionalService.transaction_fee || 0),
          paidAt: additionalService.paid_at,
          isSimulated: metadata?.simulated || false,
          simulatedAt: metadata?.simulated_at,
          xenditSimulated: metadata?.xendit_simulated,
          directUpdate: metadata?.direct_update
        }
      });
    }

    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      select: {
        booking_number: true,
        payment_status: true,
        payment_method: true,
        total: true,
        status: true,
        payment_metadata: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Not Found' },
        { status: 404 }
      );
    }

    const metadata = booking.payment_metadata as any;

    return NextResponse.json({
      success: true,
      booking: {
        orderId: booking.booking_number,
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        paymentMethodName: getPaymentMethodName(booking.payment_method),
        status: booking.status,
        total: booking.total,
        canSimulate: booking.payment_status !== 'PAID',
        isSimulated: metadata?.simulated || false,
        simulatedAt: metadata?.simulated_at,
        xenditSimulated: metadata?.xendit_simulated,
        directUpdate: metadata?.direct_update,
        xenditId: metadata?.xendit_id,
        paymentType: metadata?.payment_type
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}