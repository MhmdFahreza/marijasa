// app/api/vendors/[id]/route.ts (FIXED - Consistent Review Count)
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params;

    console.log('[Vendor Detail API] Fetching vendor:', vendorId);

    const vendor = await prisma.vendor.findUnique({
      where: {
        vendor_id: vendorId,
      },
      include: {
        gallery: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        services: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    if (!vendor) {
      console.log('[Vendor Detail API] Vendor not found');
      return NextResponse.json(
        { error: "Vendor not found", message: "Vendor not found" },
        { status: 404 }
      );
    }

    console.log('[Vendor Detail API] Services found:', vendor.services?.length || 0);
    console.log('[Vendor Detail API] Reviews found:', vendor.reviews?.length || 0);

    // ✅ CRITICAL FIX: Gunakan reviews.length dari relasi untuk konsistensi
    const actualReviewCount = vendor.reviews?.length || 0;

    const formattedVendor = {
      id: vendor.vendor_id,
      vendor_id: vendor.vendor_id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      avatar: vendor.avatar,
      description: vendor.description,
      verified: vendor.verified,
      status: vendor.status,
      rating: vendor.rating,
      // ✅ GUNAKAN: actualReviewCount dari relasi, BUKAN vendor.review_count
      reviewCount: actualReviewCount,
      review_count: actualReviewCount,
      serviceAreas: vendor.service_areas,
      service_areas: vendor.service_areas,
      specialties: vendor.specialties,
      tags: vendor.tags,
      category: vendor.category,
      summary: vendor.description,
      gallery: vendor.gallery.map(img => ({
        src: img.image_url,
        alt: img.caption || vendor.name,
      })),
      services: vendor.services.map(service => ({
        id: service.service_id,
        service_id: service.service_id,
        name: service.name,
        description: service.description,
        price: service.price,
        priceType: service.price_type,
        price_type: service.price_type,
        estimatedTime: service.estimated_time,
        estimated_time: service.estimated_time,
        isActive: service.is_active === true,
        is_active: service.is_active === true,
      })),
      reviews: vendor.reviews.map(review => ({
        id: review.review_id,
        userName: review.user.name,
        userEmail: review.user.email,
        userAvatar: review.user.avatar,
        rating: review.rating,
        comment: review.comment,
        date: review.created_at.toISOString(),
      })),
      joinDate: vendor.join_date,
      join_date: vendor.join_date,
    };

    console.log('[Vendor Detail API] Formatted services:', formattedVendor.services.length);
    console.log('[Vendor Detail API] Active services:', formattedVendor.services.filter(s => s.isActive).length);
    console.log('[Vendor Detail API] ✅ Review count:', actualReviewCount);

    return NextResponse.json(
      {
        success: true,
        vendor: formattedVendor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vendor Detail API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Internal server error" },
      { status: 500 }
    );
  }
}