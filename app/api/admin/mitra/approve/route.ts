// app/api/admin/mitra/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { sendMitraApprovalEmail } from "@/app/components/lib/mitra-email-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, notes } = body;

    if (!vendorId) {
      return NextResponse.json(
        { message: "Vendor ID diperlukan" },
        { status: 400 }
      );
    }

    // Get vendor details
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { message: "Vendor tidak ditemukan" },
        { status: 404 }
      );
    }

    if (vendor.status !== 'PENDING') {
      return NextResponse.json(
        { message: "Vendor sudah diproses sebelumnya" },
        { status: 400 }
      );
    }

    // Update vendor status to ACTIVE
    const updatedVendor = await prisma.vendor.update({
      where: { vendor_id: vendorId },
      data: {
        status: 'ACTIVE',
        verified: true,
        join_date: new Date(),
      },
    });

    // Send approval email
    try {
      await sendMitraApprovalEmail(vendor.email, vendor.name, 'approved', notes);
    } catch (emailError) {
      console.error("[Admin Approve] Email error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Mitra berhasil disetujui",
      vendor: {
        id: updatedVendor.vendor_id,
        name: updatedVendor.name,
        email: updatedVendor.email,
        status: updatedVendor.status,
      },
    });
  } catch (error: any) {
    console.error("[Admin Approve Mitra] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}