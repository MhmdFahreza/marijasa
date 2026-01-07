// app/api/vendors/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('kategori');
    const city = searchParams.get('kota');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');

    const where: any = {
      status: 'ACTIVE',
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by city (service areas)
    if (city) {
      where.service_areas = {
        has: city,
      };
    }

    // Filter by rating
    if (rating && rating !== 'semuarating') {
      if (rating === '5') {
        where.rating = 5;
      } else {
        const ratingValue = parseFloat(rating.replace('+', ''));
        where.rating = {
          gte: ratingValue,
        };
      }
    }

    // Search functionality - nama vendor, layanan, dan jangkauan layanan
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      where.OR = [
        // Search by vendor name (case insensitive)
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        // Search by description
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        // Search by service areas
        {
          service_areas: {
            hasSome: [searchTerm],
          },
        },
        // Search by services name
        {
          services: {
            some: {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
        // Search by services description
        {
          services: {
            some: {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        gallery: {
          orderBy: {
            sort_order: 'asc',
          },
          take: 3,
        },
        services: {
          where: {
            is_active: true,
          },
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Format response - tags diambil dari services.name
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
      tags: vendor.tags, // Tags sudah diupdate otomatis dari layanan
      category: vendor.category,
      summary: vendor.description?.substring(0, 150) + '...',
      gallery: vendor.gallery.map(img => ({
        src: img.image_url,
        alt: img.caption || vendor.name,
      })),
      services: vendor.services,
      serviceCount: vendor.services.length,
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