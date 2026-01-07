// app/api/vendors/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// GET - Get all vendors with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('kategori');
    const city = searchParams.get('kota');
    const rating = searchParams.get('rating');

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
    };

    if (category) {
      where.category = category;
    }

    if (city) {
      where.service_areas = {
        has: city,
      };
    }

    if (rating && rating !== 'semuarating') {
      const ratingValue = parseFloat(rating.replace('+', ''));
      where.rating = {
        gte: ratingValue,
      };
    }

    // Get vendors with their gallery
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        gallery: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Format the response
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.vendor_id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      avatar: vendor.avatar,
      description: vendor.description,
      verified: vendor.verified,
      status: vendor.status,
      rating: vendor.rating,
      reviewCount: vendor.review_count,
      serviceAreas: vendor.service_areas,
      specialties: vendor.specialties,
      tags: vendor.tags,
      category: vendor.category,
      summary: vendor.description, // Use description as summary
      gallery: vendor.gallery.map(img => ({
        src: img.image_url,
        alt: img.caption || vendor.name,
      })),
      joinDate: vendor.join_date,
    }));

    return NextResponse.json(
      {
        success: true,
        vendors: formattedVendors,
        total: formattedVendors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vendors List] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}