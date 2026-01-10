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

    console.log('[Vendors List API] Query params:', { category, city, rating, search });

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
        // PERBAIKAN: Ambil semua services untuk filtering di frontend
        services: {
          orderBy: {
            created_at: 'asc',
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    console.log('[Vendors List API] Total vendors found:', vendors.length);

    // Format response dengan normalisasi yang konsisten
    const formattedVendors = vendors.map(vendor => {
      // Hitung service count hanya dari active services
      const activeServicesCount = vendor.services.filter(s => s.is_active === true).length;

      return {
        id: vendor.vendor_id,
        vendor_id: vendor.vendor_id, // Backward compatibility
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
        tags: vendor.tags, // Tags sudah diupdate otomatis dari layanan
        category: vendor.category,
        summary: vendor.description?.substring(0, 150) + (vendor.description && vendor.description.length > 150 ? '...' : ''),
        gallery: vendor.gallery.map(img => ({
          src: img.image_url,
          alt: img.caption || vendor.name,
        })),
        // Return services dengan format konsisten
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
        serviceCount: activeServicesCount, // Hanya hitung yang aktif
        joinDate: vendor.join_date,
        join_date: vendor.join_date,
      };
    });

    console.log('[Vendors List API] Vendors with active services:', 
      formattedVendors.filter(v => v.serviceCount > 0).length
    );

    return NextResponse.json(
      {
        success: true,
        vendors: formattedVendors,
        total: formattedVendors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vendors List API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Internal server error" },
      { status: 500 }
    );
  }
}