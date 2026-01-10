// app/api/admin/mitra/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { sendMitraApprovalEmail } from "@/app/components/lib/mitra-email-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, reason } = body;

    if (!vendorId) {
      return NextResponse.json(
        { message: "Vendor ID diperlukan" },
        { status: 400 }
      );
    }

    // Get vendor details
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: vendorId },
      include: {
        documents: true,
        gallery: true,
        services: true,
      },
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

    // Store email and name before deletion for sending email
    const vendorEmail = vendor.email;
    const vendorName = vendor.name;

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.$transaction([
      prisma.vendorDocument.deleteMany({ where: { vendor_id: vendorId } }),
      prisma.vendorGallery.deleteMany({ where: { vendor_id: vendorId } }),
      prisma.service.deleteMany({ where: { vendor_id: vendorId } }),
      prisma.vendor.delete({ where: { vendor_id: vendorId } }),
    ]);

    // Send rejection email
    try {
      await sendMitraApprovalEmail(vendorEmail, vendorName, 'rejected', reason);
    } catch (emailError) {
      console.error("[Admin Reject] Email error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Pendaftaran mitra ditolak dan data telah dihapus",
    });
  } catch (error: any) {
    console.error("[Admin Reject Mitra] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}