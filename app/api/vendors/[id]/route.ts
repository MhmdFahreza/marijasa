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
        // PERBAIKAN: Ambil SEMUA services, tidak filter di query
        // Filter dilakukan di frontend berdasarkan is_active
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
    console.log('[Vendor Detail API] Services detail:', vendor.services?.map(s => ({
      id: s.service_id,
      name: s.name,
      is_active: s.is_active,
      is_active_type: typeof s.is_active
    })));

    // Format the response dengan normalisasi yang konsisten
    const formattedVendor = {
      id: vendor.vendor_id,
      vendor_id: vendor.vendor_id, // Tambahkan untuk backward compatibility
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      avatar: vendor.avatar,
      description: vendor.description,
      verified: vendor.verified,
      status: vendor.status,
      rating: vendor.rating,
      reviewCount: vendor.review_count,
      review_count: vendor.review_count, // Backward compatibility
      serviceAreas: vendor.service_areas,
      service_areas: vendor.service_areas, // Backward compatibility
      specialties: vendor.specialties,
      tags: vendor.tags,
      category: vendor.category,
      summary: vendor.description,
      gallery: vendor.gallery.map(img => ({
        src: img.image_url,
        alt: img.caption || vendor.name,
      })),
      // PERBAIKAN: Return semua services dengan format yang konsisten
      // Pastikan is_active adalah boolean
      services: vendor.services.map(service => ({
        id: service.service_id,
        service_id: service.service_id, // Backward compatibility
        name: service.name,
        description: service.description,
        price: service.price,
        priceType: service.price_type,
        price_type: service.price_type, // Backward compatibility
        estimatedTime: service.estimated_time,
        estimated_time: service.estimated_time, // Backward compatibility
        // CRITICAL: Pastikan is_active adalah boolean true/false
        isActive: service.is_active === true,
        is_active: service.is_active === true, // Backward compatibility
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
      join_date: vendor.join_date, // Backward compatibility
    };

    console.log('[Vendor Detail API] Formatted services:', formattedVendor.services.length);
    console.log('[Vendor Detail API] Active services:', formattedVendor.services.filter(s => s.isActive).length);

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