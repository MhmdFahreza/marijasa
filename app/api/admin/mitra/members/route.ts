// app/api/admin/mitra/members/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Fetching vendors from database...");
    
    const vendors = await prisma.vendor.findMany({
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
      },
      orderBy: {
        created_at: "desc",
      },
    });

    console.log(`Found ${vendors.length} vendors`);

    // Calculate total revenue for each vendor
    const vendorsWithRevenue = vendors.map((vendor) => {
      const totalRevenue = vendor.bookings.reduce(
        (sum, booking) => sum + booking.total,
        0
      );

      return {
        vendor_id: vendor.vendor_id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        avatar: vendor.avatar,
        description: vendor.description,
        category: vendor.category,
        status: vendor.status,
        verified: vendor.verified,
        rating: vendor.rating,
        review_count: vendor.review_count,
        service_areas: vendor.service_areas,
        specialties: vendor.specialties,
        tags: vendor.tags,
        join_date: vendor.join_date,
        _count: {
          bookings: vendor._count.bookings,
          reviews: vendor._count.reviews,
          services: vendor._count.services,
        },
        totalRevenue,
      };
    });

    return NextResponse.json({
      success: true,
      data: vendorsWithRevenue,
      total: vendorsWithRevenue.length,
    });
  } catch (error) {
    console.error("Error fetching mitra members:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mitra members",
      },
      { status: 500 }
    );
  }
}