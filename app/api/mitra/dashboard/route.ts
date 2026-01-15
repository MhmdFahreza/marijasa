// app/api/mitra/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/app/components/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("mitra_session_id")?.value;
    const accessToken = cookieStore.get("mitra_access_token")?.value;

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get vendorId from query params
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Fetch vendor data with ratings
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: vendorId },
      select: {
        vendor_id: true,
        name: true,
        rating: true,
        review_count: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Fetch all bookings for the vendor
    const allBookings = await prisma.booking.findMany({
      where: { vendor_id: vendorId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Fetch withdrawals from database
    let withdrawals: any[] = [];
    let totalWithdrawn = 0;
    let monthlyWithdrawal = 0;

    try {
      withdrawals = await prisma.withdrawal.findMany({
        where: { vendor_id: vendorId },
        orderBy: { created_at: "desc" },
      });

      // Calculate total withdrawn (only COMPLETED withdrawals)
      withdrawals.forEach((withdrawal) => {
        const withdrawalDate = new Date(withdrawal.created_at);

        if (withdrawal.status === "COMPLETED") {
          totalWithdrawn += withdrawal.amount;

          // Check if in current month
          if (withdrawalDate >= startOfMonth && withdrawalDate <= endOfMonth) {
            monthlyWithdrawal += withdrawal.amount;
          }
        }
      });
    } catch (error) {
      console.log("Withdrawal table not found or error fetching withdrawals. Using default values.");
      withdrawals = [];
      totalWithdrawn = 0;
      monthlyWithdrawal = 0;
    }

    // Initialize statistics
    let totalCompletedEarnings = 0;  // Total dari COMPLETED bookings NON-TUNAI SAJA
    let pendingBalance = 0;          // Dari CONFIRMED/IN_PROGRESS NON-TUNAI SAJA
    let monthlyIncome = 0;           // Total pemasukan bulan ini (SEMUA termasuk tunai untuk tracking)
    let totalOrders = allBookings.length;
    let completedOrders = 0;         // Status COMPLETED
    let pendingOrders = 0;           // Status PENDING (belum bayar)
    let inProgressOrders = 0;        // Status CONFIRMED/IN_PROGRESS (sedang dikerjakan)

    const transactions: any[] = [];

    // Process bookings dengan logika pembayaran tunai yang benar
    allBookings.forEach((booking) => {
      const bookingDate = new Date(booking.created_at);
      
      // Yang masuk ke vendor = subtotal saja (tidak termasuk transaction_fee)
      const vendorEarnings = booking.subtotal;
      
      // Cek apakah pembayaran tunai dengan pengecekan ketat
      // HANYA jika payment_method explicitly = "tunai" atau "cash"
      const paymentMethodLower = (booking.payment_method || "").toLowerCase().trim();
      const isCashPayment = paymentMethodLower === "tunai" || 
                           paymentMethodLower === "cash";
      
      // Log untuk debugging jika payment_method NULL atau kosong
      if (!booking.payment_method || booking.payment_method === "") {
        console.log(`[WARN] Booking ${booking.booking_number} memiliki payment_method NULL/kosong - dianggap NON-tunai`);
      }

      if (booking.status === "COMPLETED" && booking.payment_status === "PAID") {
        completedOrders++;
        
        // ✅ LOGIC PENTING: Pembayaran TUNAI
        if (isCashPayment) {
          // 1. TIDAK masuk ke availableBalance (saldo tersedia)
          // 2. TIDAK masuk ke pendingBalance
          // 3. HANYA masuk ke monthlyIncome untuk tracking saja (jika bulan ini)
          
          if (bookingDate >= startOfMonth && bookingDate <= endOfMonth) {
            monthlyIncome += vendorEarnings;
          }
          
          // Transaksi untuk tracking saja
          transactions.push({
            id: `INC-${booking.booking_id}`,
            type: "income",
            amount: vendorEarnings,
            date: booking.created_at.toISOString(),
            description: `Pembayaran Tunai dari ${booking.user.name}`,
            customerName: booking.user.name,
            orderId: booking.booking_id,
            bookingNumber: booking.booking_number,
            status: "COMPLETED",
            paymentMethod: "tunai",
            isCashPayment: true,
            note: "Pembayaran tunai - tidak masuk saldo digital"
          });
        } else {
          // ✅ Pembayaran NON-TUNAI (Digital): Masuk available balance
          totalCompletedEarnings += vendorEarnings;

          transactions.push({
            id: `INC-${booking.booking_id}`,
            type: "income",
            amount: vendorEarnings,
            date: booking.created_at.toISOString(),
            description: `Pembayaran dari ${booking.user.name}`,
            customerName: booking.user.name,
            orderId: booking.booking_id,
            bookingNumber: booking.booking_number,
            status: "COMPLETED",
            paymentMethod: booking.payment_method || "transfer_bank",
            isCashPayment: false,
          });

          // Tambahkan ke monthly income jika bulan ini
          if (bookingDate >= startOfMonth && bookingDate <= endOfMonth) {
            monthlyIncome += vendorEarnings;
          }
        }
      } else if ((booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && booking.payment_status === "PAID") {
        inProgressOrders++;
        
        // ✅ Pembayaran TUNAI dalam progress: Tidak masuk pending balance
        if (isCashPayment) {
          transactions.push({
            id: `INC-${booking.booking_id}`,
            type: "income",
            amount: vendorEarnings,
            date: booking.created_at.toISOString(),
            description: `Pembayaran Tunai dari ${booking.user.name} (Sedang Diproses)`,
            customerName: booking.user.name,
            orderId: booking.booking_id,
            bookingNumber: booking.booking_number,
            status: "IN_PROGRESS",
            paymentMethod: "tunai",
            isCashPayment: true,
            note: "Pembayaran tunai - tidak masuk saldo digital"
          });

          // Tambahkan ke monthly income jika bulan ini (untuk tracking)
          if (bookingDate >= startOfMonth && bookingDate <= endOfMonth) {
            monthlyIncome += vendorEarnings;
          }
        } else {
          // ✅ Pembayaran NON-TUNAI dalam progress: Masuk pending balance
          pendingBalance += vendorEarnings;

          transactions.push({
            id: `INC-${booking.booking_id}`,
            type: "income",
            amount: vendorEarnings,
            date: booking.created_at.toISOString(),
            description: `Pembayaran dari ${booking.user.name} (Sedang Diproses)`,
            customerName: booking.user.name,
            orderId: booking.booking_id,
            bookingNumber: booking.booking_number,
            status: "IN_PROGRESS",
            paymentMethod: booking.payment_method || "transfer_bank",
            isCashPayment: false,
          });

          // Tambahkan ke monthly income jika bulan ini
          if (bookingDate >= startOfMonth && bookingDate <= endOfMonth) {
            monthlyIncome += vendorEarnings;
          }
        }
      } else if (booking.status === "PENDING") {
        // ✅ Order belum dibayar = waiting payment
        pendingOrders++;

        transactions.push({
          id: `INC-${booking.booking_id}`,
          type: "income",
          amount: vendorEarnings,
          date: booking.created_at.toISOString(),
          description: `Menunggu Pembayaran dari ${booking.user.name}`,
          customerName: booking.user.name,
          orderId: booking.booking_id,
          bookingNumber: booking.booking_number,
          status: "PENDING",
          paymentMethod: isCashPayment ? "tunai" : "belum_dibayar",
          isCashPayment: isCashPayment,
        });
      }
    });

    // ✅ Calculate available balance (HANYA dari pembayaran NON-TUNAI yang COMPLETED)
    // Formula: Total completed earnings (non-tunai) - total withdrawn
    const availableBalance = Math.max(0, totalCompletedEarnings - totalWithdrawn);

    // Process withdrawal transactions
    const withdrawalTransactions: any[] = [];

    withdrawals.forEach((withdrawal) => {
      withdrawalTransactions.push({
        id: withdrawal.withdrawal_id,
        type: "withdrawal",
        amount: withdrawal.amount,
        date: withdrawal.created_at.toISOString(),
        description: `Penarikan ke ${withdrawal.method}`,
        bankName: withdrawal.method,
        accountNumber: withdrawal.account_number,
        status: withdrawal.status,
        reference: withdrawal.reference,
      });
    });

    // Merge all transactions
    const allTransactions = [...transactions, ...withdrawalTransactions];

    // Calculate cash payments summary for logging
    const cashPaymentsCompleted = transactions.filter(t => t.isCashPayment && t.status === 'COMPLETED');
    const cashPaymentsInProgress = transactions.filter(t => t.isCashPayment && t.status === 'IN_PROGRESS');
    const cashPaymentsTotal = cashPaymentsCompleted.reduce((sum, t) => sum + t.amount, 0);
    const cashPaymentsInProgressTotal = cashPaymentsInProgress.reduce((sum, t) => sum + t.amount, 0);

    // Debug logging
    console.log('[Dashboard Stats]', {
      totalOrders,
      completedOrders,
      pendingOrders,
      inProgressOrders,
      totalCompletedEarnings: totalCompletedEarnings,  // Hanya non-tunai
      totalWithdrawn,
      availableBalance,  // Hanya dari non-tunai
      pendingBalance,    // Hanya dari non-tunai
      monthlyIncome,     // Semua pembayaran (tunai + non-tunai) bulan ini
      monthlyWithdrawal,
      cashPayments: {
        completed: cashPaymentsCompleted.length,
        inProgress: cashPaymentsInProgress.length,
        totalCompleted: cashPaymentsTotal,
        totalInProgress: cashPaymentsInProgressTotal,
        totalAll: cashPaymentsTotal + cashPaymentsInProgressTotal
      }
    });

    // Return dashboard data
    return NextResponse.json({
      vendorId: vendor.vendor_id,
      vendorName: vendor.name,
      availableBalance,      // Saldo yang bisa ditarik (HANYA dari non-tunai)
      pendingBalance,        // Saldo pending (HANYA dari non-tunai)
      monthlyIncome,         // Total pemasukan bulan ini (tunai + non-tunai untuk tracking)
      monthlyWithdrawal,     // Penarikan bulan ini
      totalOrders,           // Total semua pesanan
      completedOrders,       // Pesanan COMPLETED
      pendingOrders,         // Pesanan PENDING (belum bayar)
      inProgressOrders,      // Pesanan CONFIRMED/IN_PROGRESS (sedang dikerjakan)
      vendorRating: vendor.rating,
      vendorReviewCount: vendor.review_count,
      totalRevenue: availableBalance + pendingBalance,  // Total revenue dari non-tunai saja
      transactions: allTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      // Additional info for debugging (optional)
      cashPaymentsSummary: {
        completedCount: cashPaymentsCompleted.length,
        inProgressCount: cashPaymentsInProgress.length,
        completedTotal: cashPaymentsTotal,
        inProgressTotal: cashPaymentsInProgressTotal
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}