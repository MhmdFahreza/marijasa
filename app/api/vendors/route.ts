// app/api/vendors/route.ts - FIXED WITH isFavorite STATUS
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

// Keywords untuk matching
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

// Check if text contains keyword
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

  for (const keyword of keywords) {
    if (vendor.name && containsKeyword(vendor.name, keyword, true)) {
      score += 100;
    } else if (vendor.name && containsKeyword(vendor.name, keyword, false)) {
      score += 50;
    }

    if (vendor.tags && Array.isArray(vendor.tags)) {
      for (const tag of vendor.tags) {
        if (typeof tag === 'string' && tag.trim()) {
          if (containsKeyword(tag, keyword, true)) {
            score += 80;
          } else if (containsKeyword(tag, keyword, false)) {
            score += 40;
          }
        }
      }
    }

    if (vendor.specialties && Array.isArray(vendor.specialties)) {
      for (const specialty of vendor.specialties) {
        if (typeof specialty === 'string' && specialty.trim()) {
          if (containsKeyword(specialty, keyword, true)) {
            score += 70;
          } else if (containsKeyword(specialty, keyword, false)) {
            score += 35;
          }
        }
      }
    }

    if (vendor.service_areas && Array.isArray(vendor.service_areas)) {
      for (const area of vendor.service_areas) {
        if (typeof area === 'string' && area.trim()) {
          if (containsKeyword(area, keyword, true)) {
            score += 60;
          } else if (containsKeyword(area, keyword, false)) {
            score += 30;
          }
        }
      }
    }

    if (vendor.services && Array.isArray(vendor.services)) {
      for (const service of vendor.services) {
        if (service.name) {
          if (containsKeyword(service.name, keyword, true)) {
            score += 50;
          } else if (containsKeyword(service.name, keyword, false)) {
            score += 25;
          }
        }
      }
    }

    if (vendor.description) {
      if (containsKeyword(vendor.description, keyword, true)) {
        score += 20;
      } else if (containsKeyword(vendor.description, keyword, false)) {
        score += 10;
      }
    }

    if (vendor.services && Array.isArray(vendor.services)) {
      for (const service of vendor.services) {
        if (service.description && containsKeyword(service.description, keyword, false)) {
          score += 15;
        }
      }
    }
  }

  return score;
}

// Calculate match score for category filter
function calculateMatchScore(vendor: any, categorySlug: string): number {
  let score = 0;
  const keywords = CATEGORY_KEYWORDS[categorySlug];
  const dbCategories = CATEGORY_DB_MAPPING[categorySlug] || [categorySlug];
  
  if (!keywords) {
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
      return -1000;
    }
  }

  if (vendor.category && dbCategories.some(dbCat => 
    normalizeString(vendor.category) === normalizeString(dbCat)
  )) {
    score += 100;
  }

  if (vendor.tags && Array.isArray(vendor.tags)) {
    for (const tag of vendor.tags) {
      if (typeof tag === 'string' && tag.trim()) {
        for (const keyword of keywords.primary) {
          if (containsKeyword(tag, keyword, true)) {
            score += 50;
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
          }
        }
      }
    }
  }

  if (vendor.name) {
    for (const keyword of keywords.primary) {
      if (containsKeyword(vendor.name, keyword, true)) {
        score += 30;
      }
    }
  }

  if (vendor.services && Array.isArray(vendor.services)) {
    for (const service of vendor.services) {
      if (service.name) {
        for (const keyword of keywords.primary) {
          if (containsKeyword(service.name, keyword, true)) {
            score += 25;
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
          }
        }
      }
    }
  }

  if (vendor.description) {
    for (const keyword of keywords.primary) {
      if (containsKeyword(vendor.description, keyword, false)) {
        score += 10;
        break;
      }
    }
  }

  if (vendor.description) {
    for (const keyword of keywords.secondary) {
      if (containsKeyword(vendor.description, keyword, false)) {
        score += 5;
        break;
      }
    }
  }

  return score;
}

const MINIMUM_CATEGORY_SCORE = 25;
const MINIMUM_SEARCH_SCORE = 20;

// ✅ Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Try NextAuth session first
  const session = await getServerSession();
  
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { user_id: true }
    });
    if (user) {
      console.log('[Vendors API] User authenticated via NextAuth:', user.user_id);
      return user.user_id;
    }
  }
  
  // Fallback: try custom session/token
  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;

  if (sessionId && accessToken) {
    try {
      const { getSession, verifyToken } = await import("@/app/components/lib/token-service");
      
      const customSession = await getSession(sessionId);
      if (customSession) {
        const tokenPayload = verifyToken(accessToken);
        if (tokenPayload && tokenPayload.sessionId === sessionId) {
          console.log('[Vendors API] User authenticated via custom token:', customSession.userId);
          return customSession.userId;
        }
      }
    } catch (error) {
      console.log('[Vendors API] Custom token verification failed');
    }
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('kategori');
    const city = searchParams.get('kota');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');

    console.log('[Vendors API] Query params:', { category, city, rating, search });

    // ✅ Get current user ID for favorites check
    const currentUserId = await getCurrentUserId(request);
    console.log('[Vendors API] Current user ID:', currentUserId || 'Guest');

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
        reviews: {
          select: {
            review_id: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    console.log('[Vendors API] Total vendors from database:', vendors.length);

    // ✅ Get user's favorite vendor IDs if logged in
    let userFavoriteIds: Set<string> = new Set();
    
    if (currentUserId) {
      const favorites = await prisma.userFavorite.findMany({
        where: {
          user_id: currentUserId
        },
        select: {
          vendor_id: true
        }
      });
      
      userFavoriteIds = new Set(favorites.map(f => f.vendor_id));
      console.log('[Vendors API] User favorites count:', userFavoriteIds.size);
    }

    let filteredVendors = vendors;

    if (search && search.trim()) {
      console.log(`[Vendors API] Applying search filter for: "${search}"`);
      
      const vendorsWithSearchScores = vendors.map(vendor => ({
        vendor,
        searchScore: calculateSearchScore(vendor, search)
      }));

      filteredVendors = vendorsWithSearchScores
        .filter(({ searchScore }) => searchScore >= MINIMUM_SEARCH_SCORE)
        .sort((a, b) => b.searchScore - a.searchScore)
        .map(({ vendor }) => vendor);
      
      console.log(`[Vendors API] Search filter result: ${filteredVendors.length} vendors`);
    }

    if (category) {
      console.log(`[Vendors API] Applying category filter: "${category}"`);
      
      const vendorsWithCategoryScores = filteredVendors.map(vendor => ({
        vendor,
        categoryScore: calculateMatchScore(vendor, category)
      }));

      filteredVendors = vendorsWithCategoryScores
        .filter(({ categoryScore }) => categoryScore >= MINIMUM_CATEGORY_SCORE)
        .sort((a, b) => b.categoryScore - a.categoryScore)
        .map(({ vendor }) => vendor);
      
      console.log(`[Vendors API] Category filter result: ${filteredVendors.length} vendors`);
    }

    // ✅ Format vendors with isFavorite status
    const formattedVendors = filteredVendors.map(vendor => {
      const activeServicesCount = vendor.services.filter(s => s.is_active === true).length;
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
        // ✅ CRITICAL: Include isFavorite status based on current user
        isFavorite: userFavoriteIds.has(vendor.vendor_id)
      };
    });

    console.log('[Vendors API] Returning', formattedVendors.length, 'vendors');

    return NextResponse.json(
      {
        success: true,
        vendors: formattedVendors,
        total: formattedVendors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vendors API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Internal server error" },
      { status: 500 }
    );
  }
}