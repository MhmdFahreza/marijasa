// app/api/admin/mitra/members/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: id },
      include: {
        _count: {
          select: {
            bookings: true,
            reviews: true,
            services: true,
          },
        },
        bookings: {
          where: {
            payment_status: "PAID",
          },
          select: {
            total: true,
          },
        },
        services: true,
        gallery: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
          take: 10,
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Mitra tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const totalRevenue = vendor.bookings.reduce(
      (sum, booking) => sum + booking.total,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...vendor,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Error fetching mitra detail:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengambil detail mitra",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: id },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Mitra tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Delete vendor (cascade will handle related records)
    await prisma.vendor.delete({
      where: { vendor_id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Mitra berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting mitra:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal menghapus mitra",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: id },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Mitra tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Update vendor
    const updatedVendor = await prisma.vendor.update({
      where: { vendor_id: id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVendor,
      message: "Mitra berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating mitra:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengupdate mitra",
      },
      { status: 500 }
    );
  }
}