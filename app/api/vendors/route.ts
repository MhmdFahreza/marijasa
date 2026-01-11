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

// Keywords untuk matching - LEBIH SPESIFIK dan terstruktur
const CATEGORY_KEYWORDS: Record<string, {
  primary: string[];      // Kata kunci utama - paling penting
  secondary: string[];    // Kata kunci pendukung
  exclude: string[];      // Kata yang HARUS TIDAK ADA (anti-pattern)
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
      'cuci ac',       // Ini kategori AC
      'cuci sofa',     // Ini lebih ke furniture cleaning
      'sedot',         // Ini kategori sedot WC
      'septic',        // Ini kategori sedot WC
      'taman',         // Ini kategori kebun
      'listrik',       // Ini kategori listrik
      'pipa'           // Ini kategori ledeng
    ]
  },
};

// Normalize string for matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

// Check if text contains keyword with exact/partial matching
function containsKeyword(text: string, keyword: string, exact: boolean = false): boolean {
  const normalizedText = normalizeString(text);
  const normalizedKeyword = normalizeString(keyword);
  
  if (exact) {
    // Exact match: keyword must be standalone word(s)
    const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
    return regex.test(normalizedText);
  } else {
    // Partial match
    return normalizedText.includes(normalizedKeyword);
  }
}

// Calculate match score for a vendor
function calculateMatchScore(vendor: any, categorySlug: string): number {
  let score = 0;
  const keywords = CATEGORY_KEYWORDS[categorySlug];
  const dbCategories = CATEGORY_DB_MAPPING[categorySlug] || [categorySlug];
  
  if (!keywords) {
    console.log(`⚠️ No keywords defined for category: ${categorySlug}`);
    return 0;
  }

  // CRITICAL: Check for exclusion keywords first
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
      return -1000; // Negative score = exclude completely
    }
  }

  // 1. HIGHEST PRIORITY: Direct category match (100 points)
  if (vendor.category && dbCategories.some(dbCat => 
    normalizeString(vendor.category) === normalizeString(dbCat)
  )) {
    score += 100;
    console.log(`✅ [+100] "${vendor.name}" - exact category match: ${vendor.category}`);
  }

  // 2. HIGH PRIORITY: Primary keywords in tags (50 points each)
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

  // 3. MEDIUM-HIGH PRIORITY: Primary keywords in specialties (40 points each)
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

  // 4. MEDIUM PRIORITY: Primary keywords in vendor name (30 points)
  if (vendor.name) {
    for (const keyword of keywords.primary) {
      if (containsKeyword(vendor.name, keyword, true)) {
        score += 30;
        console.log(`✅ [+30] "${vendor.name}" - primary keyword in name`);
      }
    }
  }

  // 5. MEDIUM PRIORITY: Primary keywords in service names (25 points each)
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

  // 6. LOWER PRIORITY: Secondary keywords in tags (15 points each)
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

  // 7. LOWER PRIORITY: Secondary keywords in specialties (12 points each)
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

  // 8. LOWEST PRIORITY: Primary keywords in description (10 points)
  if (vendor.description) {
    for (const keyword of keywords.primary) {
      if (containsKeyword(vendor.description, keyword, false)) {
        score += 10;
        console.log(`✅ [+10] "${vendor.name}" - primary keyword in description`);
        break; // Only count once for description
      }
    }
  }

  // 9. MINIMAL PRIORITY: Secondary keywords in description (5 points)
  if (vendor.description) {
    for (const keyword of keywords.secondary) {
      if (containsKeyword(vendor.description, keyword, false)) {
        score += 5;
        console.log(`✅ [+5] "${vendor.name}" - secondary keyword in description`);
        break; // Only count once for description
      }
    }
  }

  return score;
}

// Minimum score threshold to be considered a match
const MINIMUM_MATCH_SCORE = 25; // Must have at least one strong indicator

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

    // Apply category filter with intelligent scoring
    let filteredVendors = vendors;
    if (category) {
      console.log(`\n[Vendors API] 🎯 Filtering by category: "${category}"`);
      console.log('[Vendors API] DB category values:', CATEGORY_DB_MAPPING[category]);
      console.log('[Vendors API] Primary keywords:', CATEGORY_KEYWORDS[category]?.primary);
      console.log('[Vendors API] Exclude keywords:', CATEGORY_KEYWORDS[category]?.exclude);
      console.log('[Vendors API] Starting scoring...\n');
      
      // Calculate scores for all vendors
      const vendorsWithScores = vendors.map(vendor => ({
        vendor,
        score: calculateMatchScore(vendor, category)
      }));

      // Filter vendors with score >= minimum threshold
      filteredVendors = vendorsWithScores
        .filter(({ score }) => {
          const matches = score >= MINIMUM_MATCH_SCORE;
          return matches;
        })
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .map(({ vendor, score }) => {
          console.log(`\n✅ [MATCHED] "${vendor.name}" - Final Score: ${score}`);
          return vendor;
        });
      
      console.log(`\n[Vendors API] ✨ Category filter result: ${filteredVendors.length} of ${vendors.length} vendors matched (min score: ${MINIMUM_MATCH_SCORE})\n`);
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