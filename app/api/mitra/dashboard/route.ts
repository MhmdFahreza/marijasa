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

    // Calculate statistics
    let availableBalance = 0;
    let pendingBalance = 0;
    let monthlyIncome = 0;
    let totalOrders = allBookings.length;
    let completedOrders = 0;
    let pendingOrders = 0;
    let inProgressOrders = 0;

    const transactions: any[] = [];

    // Process bookings
    allBookings.forEach((booking) => {
      const bookingDate = new Date(booking.created_at);

      if (booking.status === "COMPLETED" && booking.payment_status === "PAID") {
        completedOrders++;
        const orderAmount = booking.total;
        availableBalance += orderAmount;

        transactions.push({
          id: `INC-${booking.booking_id}`,
          type: "income",
          amount: orderAmount,
          date: booking.created_at.toISOString(),
          description: `Pembayaran dari ${booking.user.name}`,
          customerName: booking.user.name,
          orderId: booking.booking_id,
          bookingNumber: booking.booking_number,
          status: "COMPLETED",
          paymentMethod: "transfer_bank",
        });

        // Check if in current month
        if (bookingDate >= startOfMonth && bookingDate <= endOfMonth) {
          monthlyIncome += orderAmount;
        }
      } else if (booking.status === "IN_PROGRESS") {
        inProgressOrders++;
        if (booking.payment_status === "PAID") {
          pendingBalance += booking.total;
        }
      } else if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
        pendingOrders++;
      }
    });

    // Fetch withdrawals from database
    // Note: This requires the Withdrawal model to be added to your schema
    let monthlyWithdrawal = 0;
    let totalWithdrawn = 0;
    let withdrawalTransactions: any[] = [];

    try {
      // Fetch all withdrawals for the vendor
      const withdrawals = await prisma.withdrawal.findMany({
        where: { vendor_id: vendorId },
        orderBy: { created_at: "desc" },
      });

      // Process withdrawals
      withdrawals.forEach((withdrawal) => {
        const withdrawalDate = new Date(withdrawal.created_at);

        // Add to transactions
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

        // Calculate total withdrawn (only completed withdrawals)
        if (withdrawal.status === "COMPLETED") {
          totalWithdrawn += withdrawal.amount;

          // Check if in current month
          if (withdrawalDate >= startOfMonth && withdrawalDate <= endOfMonth) {
            monthlyWithdrawal += withdrawal.amount;
          }
        }
      });
    } catch (error) {
      console.log("Withdrawal table not found. Using default values.");
      // If Withdrawal table doesn't exist yet, continue with default values
    }

    // Adjust available balance
    availableBalance = Math.max(0, availableBalance - totalWithdrawn);

    // Merge all transactions
    const allTransactions = [...transactions, ...withdrawalTransactions];

    // Return dashboard data
    return NextResponse.json({
      vendorId: vendor.vendor_id,
      vendorName: vendor.name,
      availableBalance,
      pendingBalance,
      monthlyIncome,
      monthlyWithdrawal,
      totalOrders,
      completedOrders,
      pendingOrders,
      inProgressOrders,
      vendorRating: vendor.rating,
      vendorReviewCount: vendor.review_count,
      totalRevenue: availableBalance + pendingBalance,
      transactions: allTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}