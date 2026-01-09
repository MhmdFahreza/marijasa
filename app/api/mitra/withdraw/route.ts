// app/api/mitra/withdraw/route.ts
// This is the full version after adding the Withdrawal model to your schema

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/app/components/lib/prisma";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { vendorId, amount, method, accountNumber } = body;

    if (!vendorId || !amount || !method || !accountNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 50000) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is Rp 50,000" },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Calculate available balance
    const completedBookings = await prisma.booking.findMany({
      where: {
        vendor_id: vendorId,
        status: "COMPLETED",
        payment_status: "PAID",
      },
    });

    const totalIncome = completedBookings.reduce(
      (sum, booking) => sum + booking.total,
      0
    );

    // Get total withdrawn
    const completedWithdrawals = await prisma.withdrawal.findMany({
      where: {
        vendor_id: vendorId,
        status: "COMPLETED",
      },
    });

    const totalWithdrawn = completedWithdrawals.reduce(
      (sum, withdrawal) => sum + withdrawal.amount,
      0
    );

    const availableBalance = totalIncome - totalWithdrawn;

    // Check if sufficient balance
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Check maximum withdrawal (90% of available balance)
    const maxWithdrawal = Math.floor(availableBalance * 0.9);
    if (amount > maxWithdrawal) {
      return NextResponse.json(
        { 
          error: "Withdrawal amount exceeds maximum allowed",
          maxWithdrawal 
        },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        vendor_id: vendorId,
        amount: amount,
        method: method,
        account_number: accountNumber,
        status: "COMPLETED", // Auto-complete for demo, change to PENDING for real implementation
        reference: reference,
        admin_fee: 2500,
        completed_at: new Date(), // Remove this for PENDING status
      },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal processed successfully",
      withdrawal: {
        id: withdrawal.withdrawal_id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        reference: withdrawal.reference,
        admin_fee: withdrawal.admin_fee,
        created_at: withdrawal.created_at,
      },
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch withdrawal history
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

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Fetch withdrawal history
    const withdrawals = await prisma.withdrawal.findMany({
      where: { vendor_id: vendorId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map((w) => ({
        id: w.withdrawal_id,
        type: "withdrawal",
        amount: w.amount,
        method: w.method,
        accountNumber: w.account_number,
        status: w.status,
        reference: w.reference,
        adminFee: w.admin_fee,
        date: w.created_at,
        processedAt: w.processed_at,
        completedAt: w.completed_at,
        description: `Penarikan ke ${w.method}`,
        bankName: w.method,
      })),
    });
  } catch (error) {
    console.error("Error fetching withdrawal history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}