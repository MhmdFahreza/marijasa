// app/api/payments/xendit/simulate/route.ts - FIXED WITH RETRY MECHANISM
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import { XENDIT_PAYMENT_FEES, PaymentMethodId } from '@/app/components/lib/xendit';

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const BASE_URL = 'https://api.xendit.co';

// ==========================================
// IMPROVED XENDIT SIMULATION WITH RETRY
// ==========================================

async function simulateXenditEWalletPayment(
  chargeId: string,
  amount: number,
  channelCode: string,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[E-Wallet Simulate] Starting simulation...');
  console.log('[E-Wallet Simulate] Charge ID:', chargeId);
  console.log('[E-Wallet Simulate] Channel:', channelCode);
  console.log('[E-Wallet Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  // Try simulation with retry
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[E-Wallet Simulate] Attempt ${attempt}/${maxRetries}`);

      const requestBody: any = {};

      // OVO tidak perlu amount parameter
      if (channelCode !== 'ID_OVO') {
        requestBody.amount = amount;
      }

      const endpoint = `${BASE_URL}/ewallets/charges/${chargeId}/simulate_payment`;

      console.log('[E-Wallet Simulate] Endpoint:', endpoint);
      console.log('[E-Wallet Simulate] Request body:', JSON.stringify(requestBody));

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
      console.log('[E-Wallet Simulate] Response status:', response.status);
      console.log('[E-Wallet Simulate] Response body:', responseText);

      if (response.ok) {
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          data = { raw: responseText };
        }

        console.log('[E-Wallet Simulate] ✅ SUCCESS - Xendit simulation completed');
        return { success: true, data, isTestMode: true };
      }

      // Handle specific error cases
      if (response.status === 404) {
        console.log('[E-Wallet Simulate] ⚠️ 404 - Simulation endpoint not available');
        console.log('[E-Wallet Simulate] This usually means you are in PRODUCTION mode');
        console.log('[E-Wallet Simulate] Simulation is only available in TEST mode');
        return {
          success: false,
          error: 'PRODUCTION_MODE',
          isTestMode: false
        };
      }

      if (response.status === 400) {
        console.log('[E-Wallet Simulate] ⚠️ 400 - Bad request');
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText };
        }
        console.log('[E-Wallet Simulate] Error details:', errorData);

        // Jangan retry untuk bad request
        return {
          success: false,
          error: errorData.message || 'Bad request',
          isTestMode: true
        };
      }

      // Retry untuk error lainnya
      if (attempt < maxRetries) {
        console.log(`[E-Wallet Simulate] Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText}`,
        isTestMode: true
      };

    } catch (error: any) {
      console.error(`[E-Wallet Simulate] Exception on attempt ${attempt}:`, error.message);

      if (attempt < maxRetries) {
        console.log(`[E-Wallet Simulate] Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return {
        success: false,
        error: error.message,
        isTestMode: true
      };
    }
  }

  return {
    success: false,
    error: 'Max retries reached',
    isTestMode: true
  };
}

async function simulateXenditVAPayment(
  externalId: string,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[VA Simulate] Starting simulation...');
  console.log('[VA Simulate] External ID:', externalId);
  console.log('[VA Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[VA Simulate] Attempt ${attempt}/${maxRetries}`);

      const endpoint = `${BASE_URL}/callback_virtual_accounts/external_id=${externalId}/simulate_payment`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });

      const responseText = await response.text();
      console.log('[VA Simulate] Response status:', response.status);
      console.log('[VA Simulate] Response body:', responseText);

      if (response.ok) {
        console.log('[VA Simulate] ✅ SUCCESS');
        return { success: true, isTestMode: true };
      }

      if (response.status === 404) {
        return { success: false, error: 'PRODUCTION_MODE', isTestMode: false };
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return { success: false, error: responseText, isTestMode: true };

    } catch (error: any) {
      console.error(`[VA Simulate] Exception on attempt ${attempt}:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return { success: false, error: error.message, isTestMode: true };
    }
  }

  return { success: false, error: 'Max retries reached', isTestMode: true };
}

async function simulateXenditQRISPayment(
  qrId: string,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[QRIS Simulate] Starting simulation...');
  console.log('[QRIS Simulate] QR ID:', qrId);
  console.log('[QRIS Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[QRIS Simulate] Attempt ${attempt}/${maxRetries}`);

      const endpoint = `${BASE_URL}/qr_codes/${qrId}/payments/simulate`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });

      const responseText = await response.text();
      console.log('[QRIS Simulate] Response status:', response.status);
      console.log('[QRIS Simulate] Response body:', responseText);

      if (response.ok) {
        console.log('[QRIS Simulate] ✅ SUCCESS');
        return { success: true, isTestMode: true };
      }

      if (response.status === 404) {
        return { success: false, error: 'PRODUCTION_MODE', isTestMode: false };
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return { success: false, error: responseText, isTestMode: true };

    } catch (error: any) {
      console.error(`[QRIS Simulate] Exception on attempt ${attempt}:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return { success: false, error: error.message, isTestMode: true };
    }
  }

  return { success: false, error: 'Max retries reached', isTestMode: true };
}

async function simulateXenditRetailPayment(
  paymentCodeId: string,
  amount: number,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; isTestMode?: boolean }> {
  console.log('\n[Retail Simulate] Starting simulation...');
  console.log('[Retail Simulate] Payment Code ID:', paymentCodeId);
  console.log('[Retail Simulate] Amount:', amount);

  const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Retail Simulate] Attempt ${attempt}/${maxRetries}`);

      const endpoint = `${BASE_URL}/fixed_payment_code/${paymentCodeId}/simulate_payment`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transfer_amount: amount })
      });

      const responseText = await response.text();
      console.log('[Retail Simulate] Response status:', response.status);
      console.log('[Retail Simulate] Response body:', responseText);

      if (response.ok) {
        console.log('[Retail Simulate] ✅ SUCCESS');
        return { success: true, isTestMode: true };
      }

      if (response.status === 404) {
        return { success: false, error: 'PRODUCTION_MODE', isTestMode: false };
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return { success: false, error: responseText, isTestMode: true };

    } catch (error: any) {
      console.error(`[Retail Simulate] Exception on attempt ${attempt}:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return { success: false, error: error.message, isTestMode: true };
    }
  }

  return { success: false, error: 'Max retries reached', isTestMode: true };
}

// ==========================================
// POST - Simulate Payment Success
// ==========================================

export async function POST(request: NextRequest) {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           SIMULATE PAYMENT - REQUEST RECEIVED                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  try {
    const body = await request.json();
    const { orderId, simulateStatus, additionalServiceId, paymentType } = body;

    console.log('[Simulate] Order ID:', orderId);
    console.log('[Simulate] Status to simulate:', simulateStatus || 'PAID');
    console.log('[Simulate] Payment type:', paymentType || 'main');
    console.log('[Simulate] Additional service ID:', additionalServiceId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Order ID diperlukan' },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      include: {
        user: { select: { user_id: true, name: true } },
        vendor: { select: { name: true } },
        items: { include: { service: true } },
        additional_service_requests: {
          where: {
            status: 'APPROVED',
            payment_status: 'PAID'
          }
        }
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
      console.log('[Simulate] Processing additional service payment:', additionalServiceId);

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
        const additionalMetadata = (additionalService.payment_metadata as any) || {};
        const xenditId = additionalMetadata.xendit_id;
        const additionalPaymentType = additionalMetadata.payment_type;
        const channelCode = additionalMetadata.channel_code;
        const additionalAmount = additionalService.total_price + (additionalService.service_fee || 10000) + (additionalService.transaction_fee || 0);

        let xenditSimulationResult: any = { success: false, isTestMode: true };

        // Try Xendit simulation
        if (xenditId) {
          console.log('[Simulate] Attempting Xendit simulation for additional service...');

          switch (additionalPaymentType) {
            case 'ewallet':
              xenditSimulationResult = await simulateXenditEWalletPayment(xenditId, additionalAmount, channelCode);
              break;
            case 'va':
              xenditSimulationResult = await simulateXenditVAPayment(orderId, additionalAmount);
              break;
            case 'qris':
              xenditSimulationResult = await simulateXenditQRISPayment(xenditId, additionalAmount);
              break;
            case 'retail':
              xenditSimulationResult = await simulateXenditRetailPayment(xenditId, additionalAmount);
              break;
          }

          console.log('[Simulate] Xendit simulation result:', xenditSimulationResult);
        }

        // Check if we're in production mode
        if (xenditSimulationResult.error === 'PRODUCTION_MODE') {
          return NextResponse.json({
            success: false,
            error: 'Production Mode Detected',
            message: '⚠️ Anda menggunakan Production API Key. Simulasi pembayaran hanya tersedia di Test Mode.\n\n' +
              'Solusi:\n' +
              '1. Gunakan Test Mode API Key untuk simulasi, ATAU\n' +
              '2. Lakukan pembayaran real untuk menguji di Production Mode\n\n' +
              'Catatan: Database lokal TIDAK akan diupdate karena simulasi gagal.',
            isTestMode: false,
            xenditSimulated: false
          }, { status: 400 });
        }

        // If simulation failed but in test mode, show error
        if (!xenditSimulationResult.success && xenditSimulationResult.isTestMode) {
          return NextResponse.json({
            success: false,
            error: 'Simulation Failed',
            message: `❌ Simulasi Xendit gagal: ${xenditSimulationResult.error}\n\n` +
              'Kemungkinan penyebab:\n' +
              '1. Charge ID tidak valid atau sudah expired\n' +
              '2. Xendit API sedang bermasalah\n' +
              '3. Parameter simulasi tidak sesuai\n\n' +
              'Database lokal TIDAK akan diupdate.',
            xenditSimulated: false,
            xenditError: xenditSimulationResult.error
          }, { status: 400 });
        }

        // SUCCESS - Update database
        console.log('[Simulate] ✅ Xendit simulation SUCCESS - Updating database...');

        const updatedAdditionalService = await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'PAID',
            paid_at: new Date(),
            payment_metadata: {
              ...additionalMetadata,
              simulated: true,
              simulated_at: new Date().toISOString(),
              simulated_status: 'PAID',
              xendit_simulated: true,
              xendit_simulation_data: xenditSimulationResult.data || null
            }
          }
        });

        // Update booking total
        const paidAdditionalServices = await prisma.additionalServiceRequest.findMany({
          where: {
            booking_id: booking.booking_id,
            status: 'APPROVED',
            payment_status: 'PAID'
          }
        });

        const totalAdditionalPaid = paidAdditionalServices.reduce((sum: number, req: any) => {
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
            message: `Pembayaran untuk layanan tambahan "${additionalService.description}" telah berhasil disimulasikan. Total: Rp ${additionalService.total_price.toLocaleString('id-ID')}`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });

        // Add to booking history
        await prisma.bookingHistory.create({
          data: {
            booking_id: booking.booking_id,
            status: 'Pembayaran Layanan Tambahan Berhasil (Simulasi Xendit)',
            reason: `Pembayaran untuk layanan tambahan: ${additionalService.description}`
          }
        });

        console.log('[Simulate] ✅ Additional service payment completed with Xendit simulation');

        return NextResponse.json({
          success: true,
          message: '✅ Pembayaran berhasil disimulasikan di Xendit dan database lokal!',
          xenditSimulated: true,
          isTestMode: true,
          additionalServicePaid: true,
          additionalService: {
            id: updatedAdditionalService.request_id,
            description: updatedAdditionalService.description,
            paymentStatus: updatedAdditionalService.payment_status,
            paidAt: updatedAdditionalService.paid_at,
            totalPrice: updatedAdditionalService.total_price
          },
          booking: {
            orderId: booking.booking_number,
            total: newTotal,
            paidAdditionalServicesCount: paidAdditionalServices.length,
            paidAdditionalServicesTotal: totalAdditionalPaid
          }
        });
      }
    }

    // ==========================================
    // HANDLE MAIN PAYMENT SIMULATION
    // ==========================================

    if (booking.payment_status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Already Paid', message: 'Pembayaran sudah dilakukan sebelumnya' },
        { status: 400 }
      );
    }

    const paymentMethodName = getPaymentMethodName(booking.payment_method);
    const currentMetadata = (booking.payment_metadata as any) || {};
    const targetStatus = (simulateStatus || 'PAID').toUpperCase();

    if (booking.payment_method === 'tunai') {
      return NextResponse.json(
        { success: false, error: 'Invalid Operation', message: 'Tidak dapat mensimulasikan pembayaran tunai' },
        { status: 400 }
      );
    }

    if (targetStatus === 'PAID') {
      const xenditPaymentType = currentMetadata.payment_type;
      const xenditId = currentMetadata.xendit_id;
      const channelCode = currentMetadata.channel_code;

      console.log('[Simulate] Payment type:', xenditPaymentType);
      console.log('[Simulate] Xendit ID:', xenditId);
      console.log('[Simulate] Booking total:', booking.total);

      let xenditSimulationResult: any = { success: false, isTestMode: true };

      // Try Xendit simulation
      if (xenditId) {
        console.log('[Simulate] Attempting Xendit simulation for main payment...');

        switch (xenditPaymentType) {
          case 'ewallet':
            xenditSimulationResult = await simulateXenditEWalletPayment(xenditId, booking.total, channelCode);
            break;
          case 'va':
            xenditSimulationResult = await simulateXenditVAPayment(orderId, booking.total);
            break;
          case 'qris':
            xenditSimulationResult = await simulateXenditQRISPayment(xenditId, booking.total);
            break;
          case 'retail':
            xenditSimulationResult = await simulateXenditRetailPayment(xenditId, booking.total);
            break;
          default:
            console.log('[Simulate] Unknown payment type:', xenditPaymentType);
        }

        console.log('[Simulate] Xendit simulation result:', xenditSimulationResult);
      }

      // Check if we're in production mode
      if (xenditSimulationResult.error === 'PRODUCTION_MODE') {
        return NextResponse.json({
          success: false,
          error: 'Production Mode Detected',
          message: '⚠️ Anda menggunakan Production API Key. Simulasi pembayaran hanya tersedia di Test Mode.\n\n' +
            'Solusi:\n' +
            '1. Gunakan Test Mode API Key untuk simulasi, ATAU\n' +
            '2. Lakukan pembayaran real untuk menguji di Production Mode, ATAU\n' +
            '3. Gunakan webhook simulator di Xendit Dashboard\n\n' +
            'Catatan: Database lokal TIDAK akan diupdate karena simulasi gagal.',
          isTestMode: false,
          xenditSimulated: false,
          helpUrl: 'https://dashboard.xendit.co/settings/developers#webhooks'
        }, { status: 400 });
      }

      // If simulation failed but in test mode, show error
      if (!xenditSimulationResult.success && xenditSimulationResult.isTestMode) {
        return NextResponse.json({
          success: false,
          error: 'Simulation Failed',
          message: `❌ Simulasi Xendit gagal: ${xenditSimulationResult.error}\n\n` +
            'Kemungkinan penyebab:\n' +
            '1. Charge ID tidak valid atau sudah expired\n' +
            '2. Xendit API sedang bermasalah\n' +
            '3. Parameter simulasi tidak sesuai\n\n' +
            'Solusi:\n' +
            '1. Coba buat pembayaran baru\n' +
            '2. Periksa Xendit Dashboard untuk status charge\n' +
            '3. Gunakan webhook simulator di Xendit Dashboard\n\n' +
            'Database lokal TIDAK akan diupdate.',
          xenditSimulated: false,
          xenditError: xenditSimulationResult.error
        }, { status: 400 });
      }

      // SUCCESS - Update database
      console.log('[Simulate] ✅ Xendit simulation SUCCESS - Updating database...');

      const paidAdditionalServices = await prisma.additionalServiceRequest.findMany({
        where: {
          booking_id: booking.booking_id,
          status: 'APPROVED',
          payment_status: 'PAID'
        }
      });

      const totalAdditionalPaid = paidAdditionalServices.reduce((sum: number, req: any) => {
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
            xendit_simulated: true,
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
          message: `Pembayaran untuk pesanan #${orderId} telah berhasil disimulasikan via ${paymentMethodName}. Total: Rp ${newTotal.toLocaleString('id-ID')}. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      // Add to booking history
      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Berhasil (Simulasi Xendit)',
          reason: `Pembayaran via ${paymentMethodName} telah dikonfirmasi melalui simulasi Xendit`
        }
      });

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║           PAYMENT SIMULATION SUCCESSFUL                          ║');
      console.log('║ Method: Xendit API Simulation                                    ║');
      console.log('║ Status: CONFIRMED (Diproses)                                     ║');
      console.log('║ Total:', newTotal.toString().padEnd(55), '║');
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        success: true,
        message: '✅ Pembayaran berhasil disimulasikan di Xendit dan database lokal!',
        xenditSimulated: true,
        isTestMode: true,
        booking: {
          orderId: updatedBooking.booking_number,
          paymentStatus: updatedBooking.payment_status,
          paymentMethod: updatedBooking.payment_method,
          paymentMethodName: paymentMethodName,
          status: updatedBooking.status,
          total: updatedBooking.total,
          paidAdditionalServicesCount: paidAdditionalServices.length,
          paidAdditionalServicesTotal: totalAdditionalPaid
        }
      });
    }

  } catch (error: any) {
    console.error('[Simulate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// GET - Get simulation info
// ==========================================

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({
      message: 'Xendit Payment Simulation Endpoint',
      usage: 'POST with { orderId, simulateStatus?: "PAID" | "FAILED" }',
      note: 'This endpoint simulates payment through Xendit API. Requires Test Mode API Key.',
      testMode: {
        info: 'To use simulation, you must use Test Mode API Key',
        howTo: 'Get your test API key from Xendit Dashboard > Settings > Developers',
        limitations: 'Production API keys do not support simulation endpoints'
      }
    });
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: { booking_number: orderId },
      select: {
        booking_id: true,
        booking_number: true,
        payment_status: true,
        payment_method: true,
        total: true,
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
        simulatedAt: metadata?.simulated_at || null,
        xenditSimulated: metadata?.xendit_simulated || false,
        xenditId: metadata?.xendit_id || null,
        paymentType: metadata?.payment_type || null,
        channelCode: metadata?.channel_code || null,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// Helper Functions
// ==========================================

function getPaymentMethodName(paymentMethod: string | null): string {
  if (!paymentMethod) return 'Pembayaran';

  const config = XENDIT_PAYMENT_FEES[paymentMethod as PaymentMethodId];
  if (config) return config.name;

  const fallbackNames: Record<string, string> = {
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

  return fallbackNames[paymentMethod] || paymentMethod;
}