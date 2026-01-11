// app/api/vendors/route.ts (FIXED - Consistent Review Count)
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

// Keywords untuk matching - LEBIH SPESIFIK dan terstruktur
const CATEGORY_KEYWORDS: Record<string, {
  primary: string[];
  secondary: string[];
  exclude: string[];
}> = {
  'ac': {
    primary: ['ac', 'air conditioner', 'pendingin udara'],
    secondary: ['split', 'cassette', 'central', 'freon', 'kompresor'],
    exclude: []
  },
  'sedotwc': {
    primary: ['sedot wc', 'sedot', 'septic tank', 'septik'],
    secondary: ['toilet', 'wc', 'saluran mampet', 'closet'],
    exclude: []
  },
  'furnitur': {
    primary: ['furnitur', 'furniture', 'mebel', 'kitchen set'],
    secondary: ['lemari', 'kursi', 'meja', 'rak', 'kayu jati'],
    exclude: []
  },
  'ledeng': {
    primary: ['ledeng', 'plumbing', 'pipa air', 'tukang pipa'],
    secondary: ['wastafel', 'kran', 'pompa air', 'kloset', 'toren', 'kebocoran'],
    exclude: []
  },
  'kebun': {
    primary: ['taman', 'kebun', 'landscape', 'landscaping'],
    secondary: ['tanaman', 'rumput', 'pemangkasan', 'vertical garden'],
    exclude: []
  },
  'listrik': {
    primary: ['listrik', 'electrical', 'instalasi listrik', 'tukang listrik'],
    secondary: ['kabel', 'lampu', 'panel listrik', 'mcb', 'wiring'],
    exclude: []
  },
  'pembersihanrumah': {
    primary: [
      'pembersihan rumah',
      'bersih rumah', 
      'cleaning service',
      'cuci rumah',
      'sanitasi rumah',
      'deep cleaning rumah'
    ],
    secondary: [
      'pel lantai',
      'sapu',
      'pembersihan kamar',
      'pembersihan dapur',
      'pembersihan kamar mandi',
      'cuci jendela',
      'cuci kaca',
      'poles lantai'
    ],
    exclude: [
      'cuci ac',
      'cuci sofa',
      'sedot',
      'septic',
      'taman',
      'listrik',
      'pipa'
    ]
  },
};

// Normalize string for matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

// Check if text contains keyword with exact/partial matching
function containsKeyword(text: string, keyword: string, exact: boolean = false): boolean {
  const normalizedText = normalizeString(text);
  const normalizedKeyword = normalizeString(keyword);
  
  if (exact) {
    const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
    return regex.test(normalizedText);
  } else {
    return normalizedText.includes(normalizedKeyword);
  }
}

// Extract search keywords from query
function extractSearchKeywords(query: string): string[] {
  const normalized = normalizeString(query);
  const commonWords = ['di', 'dari', 'ke', 'untuk', 'yang', 'dan', 'atau', 'dengan', 'pada', 'oleh', 'daerah', 'area', 'wilayah', 'kota'];
  const words = normalized.split(' ').filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  
  const keywords = [normalized, ...words];
  return [...new Set(keywords)];
}

// Calculate search relevance score
function calculateSearchScore(vendor: any, searchQuery: string): number {
  let score = 0;
  const keywords = extractSearchKeywords(searchQuery);
  
  console.log(`\n[Search] Scoring "${vendor.name}" for query: "${searchQuery}"`);
  console.log(`[Search] Keywords extracted:`, keywords);

  for (const keyword of keywords) {
    if (vendor.name && containsKeyword(vendor.name, keyword, true)) {
      score += 100;
      console.log(`✅ [+100] Exact match in vendor name`);
    } else if (vendor.name && containsKeyword(vendor.name, keyword, false)) {
      score += 50;
      console.log(`✅ [+50] Partial match in vendor name`);
    }

    if (vendor.tags && Array.isArray(vendor.tags)) {
      for (const tag of vendor.tags) {
        if (typeof tag === 'string' && tag.trim()) {
          if (containsKeyword(tag, keyword, true)) {
            score += 80;
            console.log(`✅ [+80] Exact match in tag: "${tag}"`);
          } else if (containsKeyword(tag, keyword, false)) {
            score += 40;
            console.log(`✅ [+40] Partial match in tag: "${tag}"`);
          }
        }
      }
    }

    if (vendor.specialties && Array.isArray(vendor.specialties)) {
      for (const specialty of vendor.specialties) {
        if (typeof specialty === 'string' && specialty.trim()) {
          if (containsKeyword(specialty, keyword, true)) {
            score += 70;
            console.log(`✅ [+70] Exact match in specialty: "${specialty}"`);
          } else if (containsKeyword(specialty, keyword, false)) {
            score += 35;
            console.log(`✅ [+35] Partial match in specialty: "${specialty}"`);
          }
        }
      }
    }

    if (vendor.service_areas && Array.isArray(vendor.service_areas)) {
      for (const area of vendor.service_areas) {
        if (typeof area === 'string' && area.trim()) {
          if (containsKeyword(area, keyword, true)) {
            score += 60;
            console.log(`✅ [+60] Exact match in service area: "${area}"`);
          } else if (containsKeyword(area, keyword, false)) {
            score += 30;
            console.log(`✅ [+30] Partial match in service area: "${area}"`);
          }
        }
      }
    }

    if (vendor.services && Array.isArray(vendor.services)) {
      for (const service of vendor.services) {
        if (service.name) {
          if (containsKeyword(service.name, keyword, true)) {
            score += 50;
            console.log(`✅ [+50] Exact match in service name: "${service.name}"`);
          } else if (containsKeyword(service.name, keyword, false)) {
            score += 25;
            console.log(`✅ [+25] Partial match in service name: "${service.name}"`);
          }
        }
      }
    }

    if (vendor.description) {
      if (containsKeyword(vendor.description, keyword, true)) {
        score += 20;
        console.log(`✅ [+20] Exact match in description`);
      } else if (containsKeyword(vendor.description, keyword, false)) {
        score += 10;
        console.log(`✅ [+10] Partial match in description`);
      }
    }

    if (vendor.services && Array.isArray(vendor.services)) {
      for (const service of vendor.services) {
        if (service.description && containsKeyword(service.description, keyword, false)) {
          score += 15;
          console.log(`✅ [+15] Match in service description`);
        }
      }
    }
  }

  console.log(`[Search] Final score for "${vendor.name}": ${score}`);
  return score;
}

// Calculate match score for category filter
function calculateMatchScore(vendor: any, categorySlug: string): number {
  let score = 0;
  const keywords = CATEGORY_KEYWORDS[categorySlug];
  const dbCategories = CATEGORY_DB_MAPPING[categorySlug] || [categorySlug];
  
  if (!keywords) {
    console.log(`⚠️ No keywords defined for category: ${categorySlug}`);
    return 0;
  }

  const allText = [
    vendor.name || '',
    vendor.description || '',
    ...(vendor.tags || []),
    ...(vendor.specialties || []),
    ...(vendor.services?.map((s: any) => `${s.name} ${s.description || ''}`) || [])
  ].join(' ');

  for (const excludeKeyword of keywords.exclude) {
    if (containsKeyword(allText, excludeKeyword, true)) {
      console.log(`❌ [Exclude] "${vendor.name}" - contains excluded keyword: "${excludeKeyword}"`);
      return -1000;
    }
  }

  if (vendor.category && dbCategories.some(dbCat => 
    normalizeString(vendor.category) === normalizeString(dbCat)
  )) {
    score += 100;
    console.log(`✅ [+100] "${vendor.name}" - exact category match: ${vendor.category}`);
  }

  if (vendor.tags && Array.isArray(vendor.tags)) {
    for (const tag of vendor.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        for (const keyword of keywords.primary) {
          if (containsKeyword(tag, keyword, true)) {
            score += 50;
            console.log(`✅ [+50] "${vendor.name}" - primary keyword in tag: "${tag}"`);
          }
        }
      }
    }
  }

  if (vendor.specialties && Array.isArray(vendor.specialties)) {
    for (const specialty of vendor.specialties) {
      if (typeof specialty === 'string' && specialty.trim()) {
        for (const keyword of keywords.primary) {
          if (containsKeyword(specialty, keyword, true)) {
            score += 40;
            console.log(`✅ [+40] "${vendor.name}" - primary keyword in specialty: "${specialty}"`);
          }
        }
      }
    }
  }

  if (vendor.name) {
    for (const keyword of keywords.primary) {
      if (containsKeyword(vendor.name, keyword, true)) {
        score += 30;
        console.log(`✅ [+30] "${vendor.name}" - primary keyword in name`);
      }
    }
  }

  if (vendor.services && Array.isArray(vendor.services)) {
    for (const service of vendor.services) {
      if (service.name) {
        for (const keyword of keywords.primary) {
          if (containsKeyword(service.name, keyword, true)) {
            score += 25;
            console.log(`✅ [+25] "${vendor.name}" - primary keyword in service: "${service.name}"`);
          }
        }
      }
    }
  }

  if (vendor.tags && Array.isArray(vendor.tags)) {
    for (const tag of vendor.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        for (const keyword of keywords.secondary) {
          if (containsKeyword(tag, keyword, false)) {
            score += 15;
            console.log(`✅ [+15] "${vendor.name}" - secondary keyword in tag: "${tag}"`);
          }
        }
      }
    }
  }

  if (vendor.specialties && Array.isArray(vendor.specialties)) {
    for (const specialty of vendor.specialties) {
      if (typeof specialty === 'string' && specialty.trim()) {
        for (const keyword of keywords.secondary) {
          if (containsKeyword(specialty, keyword, false)) {
            score += 12;
            console.log(`✅ [+12] "${vendor.name}" - secondary keyword in specialty: "${specialty}"`);
          }
        }
      }
    }
  }

  if (vendor.description) {
    for (const keyword of keywords.primary) {
      if (containsKeyword(vendor.description, keyword, false)) {
        score += 10;
        console.log(`✅ [+10] "${vendor.name}" - primary keyword in description`);
        break;
      }
    }
  }

  if (vendor.description) {
    for (const keyword of keywords.secondary) {
      if (containsKeyword(vendor.description, keyword, false)) {
        score += 5;
        console.log(`✅ [+5] "${vendor.name}" - secondary keyword in description`);
        break;
      }
    }
  }

  return score;
}

const MINIMUM_CATEGORY_SCORE = 25;
const MINIMUM_SEARCH_SCORE = 20;

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

    if (city && !search) {
      where.service_areas = {
        has: city,
      };
    }

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

    console.log('[Vendors API] Fetching vendors from database...');

    // ✅ CRITICAL FIX: Include reviews relasi untuk count yang konsisten
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
        // ✅ TAMBAHKAN: Include reviews untuk count yang akurat
        reviews: {
          select: {
            review_id: true, // Minimal select untuk efisiensi
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    console.log('[Vendors API] Total vendors from database:', vendors.length);

    let filteredVendors = vendors;

    if (search && search.trim()) {
      console.log(`\n[Vendors API] 🔍 Applying search filter for: "${search}"`);
      
      const vendorsWithSearchScores = vendors.map(vendor => ({
        vendor,
        searchScore: calculateSearchScore(vendor, search)
      }));

      filteredVendors = vendorsWithSearchScores
        .filter(({ searchScore }) => searchScore >= MINIMUM_SEARCH_SCORE)
        .sort((a, b) => b.searchScore - a.searchScore)
        .map(({ vendor, searchScore }) => {
          console.log(`✅ [SEARCH MATCH] "${vendor.name}" - Search Score: ${searchScore}`);
          return vendor;
        });
      
      console.log(`[Vendors API] ✨ Search filter result: ${filteredVendors.length} of ${vendors.length} vendors matched`);
    }

    if (category) {
      console.log(`\n[Vendors API] 🎯 Applying category filter: "${category}"`);
      
      const vendorsWithCategoryScores = filteredVendors.map(vendor => ({
        vendor,
        categoryScore: calculateMatchScore(vendor, category)
      }));

      filteredVendors = vendorsWithCategoryScores
        .filter(({ categoryScore }) => categoryScore >= MINIMUM_CATEGORY_SCORE)
        .sort((a, b) => b.categoryScore - a.categoryScore)
        .map(({ vendor, categoryScore }) => {
          console.log(`✅ [CATEGORY MATCH] "${vendor.name}" - Category Score: ${categoryScore}`);
          return vendor;
        });
      
      console.log(`[Vendors API] ✨ Category filter result: ${filteredVendors.length} vendors matched`);
    }

    const formattedVendors = filteredVendors.map(vendor => {
      const activeServicesCount = vendor.services.filter(s => s.is_active === true).length;

      // ✅ CRITICAL FIX: Gunakan reviews.length dari relasi, BUKAN review_count dari database
      // Ini memastikan konsistensi dengan detail page
      const actualReviewCount = vendor.reviews?.length || 0;

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
        // ✅ GUNAKAN: actualReviewCount dari relasi
        reviewCount: actualReviewCount,
        review_count: actualReviewCount,
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