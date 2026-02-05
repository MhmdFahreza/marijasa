// app/api/payments/xendit/simulate/route.ts - FIXED E-WALLET SIMULATION
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';
import { XENDIT_PAYMENT_FEES, PaymentMethodId } from '@/app/components/lib/xendit';

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const BASE_URL = 'https://api.xendit.co';

// ==========================================
// XENDIT SIMULATION API - FIXED E-WALLET
// ==========================================

/**
 * PERBAIKAN UTAMA: Xendit E-Wallet Simulation
 * 
 * Setiap e-wallet channel memiliki requirement berbeda untuk simulasi:
 * 
 * 1. OVO: Tidak butuh amount di body
 * 2. DANA: Butuh amount di body
 * 3. ShopeePay: Butuh amount di body
 * 4. LinkAja: Butuh amount di body
 * 
 * Endpoint: POST /ewallets/charges/{charge_id}/simulate_payment
 * Header: api-version harus 2021-01-25 atau lebih baru
 */

async function simulateXenditEWalletPayment(
  chargeId: string, 
  amount: number,
  channelCode: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     XENDIT E-WALLET SIMULATION - DETAILED PROCESS     ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('[E-Wallet Simulate] Channel:', channelCode);
    console.log('[E-Wallet Simulate] Charge ID:', chargeId);
    console.log('[E-Wallet Simulate] Amount:', amount);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    // PERBAIKAN: Berbeda dengan dokumentasi, semua channel sebenarnya butuh amount
    // Tapi OVO lebih toleran jika tidak ada
    const requestBody: any = {};
    
    // Untuk semua channel kecuali OVO, amount WAJIB
    if (channelCode !== 'ID_OVO') {
      requestBody.amount = amount;
      console.log('[E-Wallet Simulate] Adding amount to body:', amount);
    } else {
      console.log('[E-Wallet Simulate] OVO - amount optional');
    }

    const endpoint = `${BASE_URL}/ewallets/charges/${chargeId}/simulate_payment`;
    console.log('[E-Wallet Simulate] Endpoint:', endpoint);
    console.log('[E-Wallet Simulate] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'api-version': '2021-01-25', // PENTING: API version untuk e-wallet
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    });

    console.log('[E-Wallet Simulate] Response status:', response.status);
    console.log('[E-Wallet Simulate] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('[E-Wallet Simulate] Response body:', responseText);

    if (response.ok) {
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { raw: responseText };
      }

      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║          E-WALLET SIMULATION SUCCESS ✅                ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('[E-Wallet Simulate] Success data:', JSON.stringify(data, null, 2));
      
      return { success: true, data };
    } else {
      console.error('╔════════════════════════════════════════════════════════╗');
      console.error('║          E-WALLET SIMULATION FAILED ❌                 ║');
      console.error('╚════════════════════════════════════════════════════════╝');
      console.error('[E-Wallet Simulate] Error status:', response.status);
      console.error('[E-Wallet Simulate] Error body:', responseText);

      let errorMessage = responseText;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error_code || responseText;
      } catch (e) {
        // Keep original error message
      }

      // Status 404 = endpoint tidak tersedia (mode production)
      if (response.status === 404) {
        console.log('[E-Wallet Simulate] Simulation endpoint not available (production mode)');
        return { 
          success: false, 
          error: 'Simulation endpoint not available - using local update instead' 
        };
      }

      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error('╔════════════════════════════════════════════════════════╗');
    console.error('║       E-WALLET SIMULATION EXCEPTION ⚠️                 ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error('[E-Wallet Simulate] Exception:', error.message);
    console.error('[E-Wallet Simulate] Stack:', error.stack);
    
    return { success: false, error: error.message };
  }
}

async function simulateXenditVAPayment(externalId: string, amount: number): Promise<boolean> {
  try {
    console.log('[Xendit Simulate VA] External ID:', externalId);
    console.log('[Xendit Simulate VA] Amount:', amount);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const response = await fetch(`${BASE_URL}/callback_virtual_accounts/external_id=${externalId}/simulate_payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount })
    });

    console.log('[Xendit Simulate VA] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate VA] Success:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate VA] Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate VA] Exception:', error);
    return false;
  }
}

async function simulateXenditQRISPayment(qrId: string, amount: number): Promise<boolean> {
  try {
    console.log('[Xendit Simulate QRIS] QR ID:', qrId);
    console.log('[Xendit Simulate QRIS] Amount:', amount);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const response = await fetch(`${BASE_URL}/qr_codes/${qrId}/payments/simulate`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount })
    });

    console.log('[Xendit Simulate QRIS] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate QRIS] Success:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate QRIS] Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate QRIS] Exception:', error);
    return false;
  }
}

async function simulateXenditRetailPayment(paymentCodeId: string, amount: number): Promise<boolean> {
  try {
    console.log('[Xendit Simulate Retail] Payment Code ID:', paymentCodeId);
    console.log('[Xendit Simulate Retail] Amount:', amount);

    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    const response = await fetch(`${BASE_URL}/fixed_payment_code/${paymentCodeId}/simulate_payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transfer_amount: amount })
    });

    console.log('[Xendit Simulate Retail] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Xendit Simulate Retail] Success:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Xendit Simulate Retail] Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[Xendit Simulate Retail] Exception:', error);
    return false;
  }
}

// ==========================================
// POST - Simulate Payment Success
// ==========================================

export async function POST(request: NextRequest) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           SIMULATE PAYMENT - REQUEST RECEIVED                    ║');
  console.log('║ Timestamp:', new Date().toISOString());
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
    // PENANGANAN KHUSUS UNTUK LAYANAN TAMBAHAN
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
        let xenditSimulated = false;
        const additionalMetadata = (additionalService.payment_metadata as any) || {};
        const xenditId = additionalMetadata.xendit_id;
        const additionalPaymentType = additionalMetadata.payment_type;
        const channelCode = additionalMetadata.channel_code;
        const additionalAmount = additionalService.total_price + (additionalService.service_fee || 10000) + (additionalService.transaction_fee || 0);

        console.log('[Simulate Additional] Xendit ID:', xenditId);
        console.log('[Simulate Additional] Payment Type:', additionalPaymentType);
        console.log('[Simulate Additional] Channel Code:', channelCode);
        console.log('[Simulate Additional] Amount:', additionalAmount);

        if (xenditId) {
          switch (additionalPaymentType) {
            case 'ewallet': {
              const result = await simulateXenditEWalletPayment(xenditId, additionalAmount, channelCode);
              xenditSimulated = result.success;
              
              if (!result.success) {
                console.log('[Simulate Additional] E-Wallet simulation failed:', result.error);
              }
              break;
            }
            case 'va':
              xenditSimulated = await simulateXenditVAPayment(orderId, additionalAmount);
              break;
            case 'qris':
              xenditSimulated = await simulateXenditQRISPayment(xenditId, additionalAmount);
              break;
            case 'retail':
              xenditSimulated = await simulateXenditRetailPayment(xenditId, additionalAmount);
              break;
          }
        }

        // Update additional service payment status
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
              xendit_simulated: xenditSimulated,
              simulation_method: xenditSimulated ? 'xendit_api' : 'local_only'
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
            message: `Pembayaran untuk layanan tambahan "${additionalService.description}" telah berhasil. Total: Rp ${additionalService.total_price.toLocaleString('id-ID')}`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });

        // Add to booking history
        await prisma.bookingHistory.create({
          data: {
            booking_id: booking.booking_id,
            status: xenditSimulated ? 'Pembayaran Layanan Tambahan Berhasil (Xendit)' : 'Pembayaran Layanan Tambahan Berhasil (Local)',
            reason: `Pembayaran untuk layanan tambahan: ${additionalService.description}`
          }
        });

        console.log('[Simulate] Additional service payment simulated successfully');
        console.log('[Simulate] Xendit simulated:', xenditSimulated);

        return NextResponse.json({
          success: true,
          message: xenditSimulated 
            ? 'Pembayaran layanan tambahan berhasil disimulasikan (Xendit + Local)'
            : 'Pembayaran layanan tambahan berhasil disimulasikan (Local only - Xendit simulation unavailable)',
          xenditSimulated,
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
      } else if (targetStatus === 'FAILED') {
        await prisma.additionalServiceRequest.update({
          where: { request_id: additionalServiceId },
          data: {
            payment_status: 'FAILED',
            payment_metadata: {
              ...(additionalService.payment_metadata as any) || {},
              simulated: true,
              simulated_at: new Date().toISOString(),
              simulated_status: 'FAILED'
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Simulasi pembayaran gagal untuk layanan tambahan',
          additionalService: {
            id: additionalServiceId,
            paymentStatus: 'FAILED'
          }
        });
      }
    }

    // ==========================================
    // SIMULASI PEMBAYARAN UTAMA (BOOKING)
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
      let xenditSimulated = false;
      const xenditPaymentType = currentMetadata.payment_type;
      const xenditId = currentMetadata.xendit_id;
      const channelCode = currentMetadata.channel_code;

      console.log('[Simulate] Payment type:', xenditPaymentType);
      console.log('[Simulate] Xendit ID:', xenditId);
      console.log('[Simulate] Channel Code:', channelCode);
      console.log('[Simulate] Booking total:', booking.total);

      if (xenditId) {
        console.log('[Simulate] Attempting Xendit simulation...');

        switch (xenditPaymentType) {
          case 'ewallet': {
            const result = await simulateXenditEWalletPayment(xenditId, booking.total, channelCode);
            xenditSimulated = result.success;
            
            if (!result.success) {
              console.log('[Simulate] E-Wallet simulation failed:', result.error);
              console.log('[Simulate] Will proceed with local update only');
            }
            break;
          }
          case 'va':
            xenditSimulated = await simulateXenditVAPayment(orderId, booking.total);
            break;
          case 'qris':
            xenditSimulated = await simulateXenditQRISPayment(xenditId, booking.total);
            break;
          case 'retail':
            xenditSimulated = await simulateXenditRetailPayment(xenditId, booking.total);
            break;
          default:
            console.log('[Simulate] Unknown payment type:', xenditPaymentType);
        }

        if (xenditSimulated) {
          console.log('[Simulate] ✅ Xendit simulation successful!');
          console.log('[Simulate] Webhook will update the database automatically');

          // Wait for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));

          const updatedBooking = await prisma.booking.findFirst({
            where: { booking_id: booking.booking_id }
          });

          if (updatedBooking?.payment_status === 'PAID') {
            return NextResponse.json({
              success: true,
              message: 'Pembayaran berhasil disimulasikan via Xendit',
              xenditSimulated: true,
              booking: {
                orderId: updatedBooking.booking_number,
                paymentStatus: updatedBooking.payment_status,
                paymentMethod: updatedBooking.payment_method,
                paymentMethodName: paymentMethodName,
                status: updatedBooking.status,
                total: updatedBooking.total,
              }
            });
          }
        } else {
          console.log('[Simulate] Xendit simulation not available or failed, using local update');
        }
      } else {
        console.log('[Simulate] No Xendit ID found, using local update only');
      }

      // Fallback: Update local database directly
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
            xendit_simulated: xenditSimulated,
            simulation_method: xenditSimulated ? 'xendit_api' : 'local_only'
          }
        }
      });

      console.log('[Simulate] Booking updated to PAID');
      console.log('[Simulate] New total:', newTotal);

      // Create notification
      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '✅ Pembayaran Berhasil',
          message: `Pembayaran untuk pesanan #${orderId} telah berhasil via ${paymentMethodName}. Total: Rp ${newTotal.toLocaleString('id-ID')}. Pesanan Anda sedang diproses oleh ${booking.vendor.name}.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      // Add to booking history
      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: xenditSimulated ? 'Pembayaran Berhasil (Xendit Simulation)' : 'Pembayaran Berhasil (Local Simulation)',
          reason: `Pembayaran via ${paymentMethodName} telah dikonfirmasi (mode testing)`
        }
      });

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║           PAYMENT SIMULATION SUCCESSFUL - PAID                   ║');
      console.log('║ Method:', xenditSimulated ? 'Xendit API + Local' : 'Local Only');
      console.log('║ Total:', newTotal);
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        success: true,
        message: xenditSimulated
          ? 'Pembayaran berhasil disimulasikan (Xendit + Local)'
          : 'Pembayaran berhasil disimulasikan (Local only - Xendit simulation unavailable)',
        xenditSimulated,
        simulationMethod: xenditSimulated ? 'xendit_api' : 'local_only',
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

    } else if (targetStatus === 'FAILED') {
      await prisma.booking.update({
        where: { booking_id: booking.booking_id },
        data: {
          payment_status: 'FAILED',
          payment_metadata: {
            ...currentMetadata,
            simulated: true,
            simulated_at: new Date().toISOString(),
            simulated_status: 'FAILED',
          }
        }
      });

      await prisma.userNotification.create({
        data: {
          user_id: booking.user.user_id,
          title: '❌ Pembayaran Gagal',
          message: `Pembayaran untuk pesanan #${orderId} gagal. Silakan lakukan pembayaran ulang atau pilih metode pembayaran lain.`,
          type: 'payment',
          order_id: booking.booking_id,
        }
      });

      await prisma.bookingHistory.create({
        data: {
          booking_id: booking.booking_id,
          status: 'Pembayaran Gagal (Simulasi)',
          reason: 'Pembayaran gagal (mode testing)'
        }
      });

      console.log('\n╔══════════════════════════════════════════════════════════════════╗');
      console.log('║           PAYMENT SIMULATION - FAILED                            ║');
      console.log('╚══════════════════════════════════════════════════════════════════╝\n');

      return NextResponse.json({
        success: true,
        message: 'Simulasi pembayaran gagal berhasil',
        booking: {
          orderId: booking.booking_number,
          paymentStatus: 'FAILED',
          status: booking.status,
        }
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid Status', message: 'Status simulasi tidak valid' },
        { status: 400 }
      );
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
      message: 'Xendit Payment Simulation Endpoint - FIXED E-WALLET',
      usage: 'POST with { orderId, simulateStatus?: "PAID" | "FAILED" }',
      note: 'This endpoint simulates payment in both Xendit (development) and local database',
      endpoints: {
        ewallet: '/ewallets/charges/{id}/simulate_payment (with api-version: 2021-01-25)',
        va: '/callback_virtual_accounts/external_id={id}/simulate_payment',
        qris: '/qr_codes/{id}/payments/simulate',
        retail: '/fixed_payment_code/{id}/simulate_payment'
      },
      ewalletChannels: {
        OVO: 'ID_OVO - amount optional',
        DANA: 'ID_DANA - amount required',
        ShopeePay: 'ID_SHOPEEPAY - amount required',
        LinkAja: 'ID_LINKAJA - amount required'
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
        simulationMethod: metadata?.simulation_method || null,
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
    'va_cimb': 'CIMB Virtual Account',
    'card_visa': 'Kartu Visa',
    'card_mastercard': 'Kartu Mastercard',
    'card_jcb': 'Kartu JCB',
    'retail_alfamart': 'Alfamart',
    'retail_indomaret': 'Indomaret',
    'tunai': 'Tunai',
  };

  return fallbackNames[paymentMethod] || paymentMethod;
}