// app/api/vendors/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// Mapping frontend category slug -> database category value
const CATEGORY_DB_MAPPING: Record<string, string[]> = {
  'ac': ['ac'],
  'sedotwc': ['sedot-wc', 'sedotwc'],
  'furnitur': ['furniture', 'furnitur'],
  'ledeng': ['plumbing', 'ledeng'],
  'kebun': ['garden', 'kebun'],
  'listrik': ['electrical', 'listrik'],
  'pembersihanrumah': ['cleaning', 'pembersihan'],
};

// Keywords untuk matching dengan tags/specialties (Bahasa Indonesia)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'ac': ['ac', 'air conditioner', 'pendingin', 'cooling', 'split', 'cassette', 'central'],
  'sedotwc': ['sedot', 'wc', 'toilet', 'septic', 'saluran', 'mampet'],
  'furnitur': ['furnitur', 'furniture', 'mebel', 'lemari', 'kursi', 'meja', 'kitchen set', 'rak'],
  'ledeng': ['ledeng', 'plumbing', 'pipa', 'air', 'wastafel', 'kran', 'pompa', 'kloset', 'toren', 'kebocoran'],
  'kebun': ['kebun', 'taman', 'garden', 'landscape', 'tanaman', 'rumput', 'pemangkasan', 'vertical'],
  'listrik': ['listrik', 'electrical', 'kabel', 'instalasi', 'lampu', 'panel', 'mcb', 'wiring'],
  'pembersihanrumah': ['bersih', 'cleaning', 'cuci', 'pembersihan', 'sofa', 'carpet', 'sanitasi', 'deep cleaning'],
};

// Normalize string for matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Check if text contains any keyword
function containsKeyword(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeString(text);
  
  return keywords.some(keyword => {
    const normalizedKeyword = normalizeString(keyword);
    return normalizedText.includes(normalizedKeyword);
  });
}

// Function to check if vendor matches category
function matchesCategory(vendor: any, categorySlug: string): boolean {
  // 1. Check direct category match with database values
  const dbCategories = CATEGORY_DB_MAPPING[categorySlug] || [categorySlug];
  if (vendor.category && dbCategories.some(dbCat => 
    normalizeString(vendor.category) === normalizeString(dbCat)
  )) {
    console.log(`✅ [Match] "${vendor.name}" - category match: ${vendor.category}`);
    return true;
  }

  // 2. Get keywords for matching tags/specialties
  const keywords = CATEGORY_KEYWORDS[categorySlug] || [categorySlug];
  
  // 3. Check in tags (PRIORITY - most reliable)
  if (vendor.tags && Array.isArray(vendor.tags) && vendor.tags.length > 0) {
    for (const tag of vendor.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        if (containsKeyword(tag, keywords)) {
          console.log(`✅ [Match] "${vendor.name}" - tag match: "${tag}"`);
          return true;
        }
      }
    }
  }

  // 4. Check in specialties
  if (vendor.specialties && Array.isArray(vendor.specialties) && vendor.specialties.length > 0) {
    for (const specialty of vendor.specialties) {
      if (typeof specialty === 'string' && specialty.trim()) {
        if (containsKeyword(specialty, keywords)) {
          console.log(`✅ [Match] "${vendor.name}" - specialty match: "${specialty}"`);
          return true;
        }
      }
    }
  }

  // 5. Check in vendor name
  if (vendor.name && containsKeyword(vendor.name, keywords)) {
    console.log(`✅ [Match] "${vendor.name}" - name match`);
    return true;
  }

  // 6. Check in description
  if (vendor.description && containsKeyword(vendor.description, keywords)) {
    console.log(`✅ [Match] "${vendor.name}" - description match`);
    return true;
  }

  // 7. Check in services
  if (vendor.services && Array.isArray(vendor.services)) {
    for (const service of vendor.services) {
      if (service.name && containsKeyword(service.name, keywords)) {
        console.log(`✅ [Match] "${vendor.name}" - service name match: "${service.name}"`);
        return true;
      }
      if (service.description && containsKeyword(service.description, keywords)) {
        console.log(`✅ [Match] "${vendor.name}" - service description match`);
        return true;
      }
    }
  }

  console.log(`❌ [No Match] "${vendor.name}"`);
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('kategori');
    const city = searchParams.get('kota');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');

    console.log('[Vendors API] Query params:', { category, city, rating, search });

    const where: any = {
      status: 'ACTIVE',
    };

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

    // Search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      where.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          service_areas: {
            hasSome: [searchTerm],
          },
        },
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

    console.log('[Vendors API] Fetching vendors from database...');

    // Fetch all vendors matching basic filters
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
          orderBy: {
            created_at: 'asc',
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    console.log('[Vendors API] Total vendors before category filter:', vendors.length);

    // Apply category filter with intelligent matching
    let filteredVendors = vendors;
    if (category) {
      const keywords = CATEGORY_KEYWORDS[category] || [category];
      const dbCategories = CATEGORY_DB_MAPPING[category] || [category];
      
      console.log(`[Vendors API] Filtering by category slug: "${category}"`);
      console.log('[Vendors API] DB category values:', dbCategories);
      console.log('[Vendors API] Keywords for matching:', keywords);
      console.log('[Vendors API] Starting category matching...\n');
      
      filteredVendors = vendors.filter(vendor => matchesCategory(vendor, category));
      
      console.log(`\n[Vendors API] ✨ Category filter result: ${filteredVendors.length} of ${vendors.length} vendors matched`);
    }

    // Format response
    const formattedVendors = filteredVendors.map(vendor => {
      const activeServicesCount = vendor.services.filter(s => s.is_active === true).length;

      return {
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
        reviewCount: vendor.review_count,
        review_count: vendor.review_count,
        serviceAreas: vendor.service_areas,
        service_areas: vendor.service_areas,
        specialties: vendor.specialties,
        tags: vendor.tags,
        category: vendor.category,
        summary: vendor.description?.substring(0, 150) + (vendor.description && vendor.description.length > 150 ? '...' : ''),
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
        serviceCount: activeServicesCount,
        joinDate: vendor.join_date,
        join_date: vendor.join_date,
      };
    });

    console.log('[Vendors API] 🎉 Returning', formattedVendors.length, 'vendors\n');

    return NextResponse.json(
      {
        success: true,
        vendors: formattedVendors,
        total: formattedVendors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vendors API] ❌ Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Internal server error" },
      { status: 500 }
    );
  }
}