// app/api/vendors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params;

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
          where: {
            is_active: true,
          },
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedVendor = {
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
      tags: vendor.tags, // Tags diupdate otomatis dari nama layanan
      category: vendor.category,
      summary: vendor.description,
      gallery: vendor.gallery.map(img => ({
        src: img.image_url,
        alt: img.caption || vendor.name,
      })),
      services: vendor.services.map(service => ({
        id: service.service_id,
        name: service.name,
        description: service.description,
        price: service.price,
        priceType: service.price_type,
        estimatedTime: service.estimated_time,
        isActive: service.is_active,
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
    };

    return NextResponse.json(
      {
        success: true,
        vendor: formattedVendor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vendor Detail] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}