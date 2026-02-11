// app/api/vendors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// Parse review metadata helper - IMPROVED & ROBUST
function parseReviewComment(comment: string | null) {
  if (!comment) return { 
    mainComment: '', 
    photos: [], 
    response: undefined, 
    isAnonymous: false,
    helpfulCount: 0,
    mitraLikes: []
  }

  let mainComment = comment
  let photos: string[] = []
  let response: { vendorReply: string; replyDate: string } | undefined
  let isAnonymous = false
  let helpfulCount = 0
  let mitraLikes: string[] = []

  try {
    // Step 1: Extract main comment (sebelum metadata pertama)
    const firstMetadataIndex = comment.search(/\|(PHOTOS|RESPONSE|LIKES|ANONYMOUS)\|/)
    if (firstMetadataIndex !== -1) {
      mainComment = comment.substring(0, firstMetadataIndex).trim()
    } else {
      return {
        mainComment: comment.trim(),
        photos: [],
        response: undefined,
        isAnonymous: false,
        helpfulCount: 0,
        mitraLikes: []
      }
    }

    // Step 2: Extract photos using regex
    if (comment.includes('|PHOTOS|')) {
      const photoMatch = comment.match(/\|PHOTOS\|(.*?)(?=\|(RESPONSE|LIKES|ANONYMOUS)\||$)/)
      if (photoMatch && photoMatch[1]) {
        try {
          photos = JSON.parse(photoMatch[1])
        } catch (e) {
          console.error('[Vendor Detail] Failed to parse photos:', e)
        }
      }
    }

    // Step 3: Extract response using regex
    if (comment.includes('|RESPONSE|')) {
      const responseMatch = comment.match(/\|RESPONSE\|(.*?)(?=\|(LIKES|ANONYMOUS)\||$)/)
      if (responseMatch && responseMatch[1]) {
        try {
          const responseData = JSON.parse(responseMatch[1])
          response = {
            vendorReply: responseData.reply,
            replyDate: new Date(responseData.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          }
        } catch (e) {
          console.error('[Vendor Detail] Failed to parse response:', e)
        }
      }
    }

    // Step 4: Extract likes
    if (comment.includes('|LIKES|')) {
      const likesMatch = comment.match(/\|LIKES\|(.*?)(?=\|ANONYMOUS\||$)/)
      if (likesMatch && likesMatch[1]) {
        try {
          const likesData = JSON.parse(likesMatch[1])
          helpfulCount = likesData.count || 0
          mitraLikes = Array.isArray(likesData.mitraLikes) ? likesData.mitraLikes : []
        } catch (e) {
          console.error('[Vendor Detail] Failed to parse likes:', e)
        }
      }
    }

    // Step 5: Check anonymous flag
    if (comment.includes('|ANONYMOUS|')) {
      isAnonymous = true
    }

  } catch (error) {
    console.error('[Vendor Detail] Error parsing review metadata:', error)
    return {
      mainComment: comment.split('|')[0].trim(),
      photos: [],
      response: undefined,
      isAnonymous: false,
      helpfulCount: 0,
      mitraLikes: []
    }
  }

  return {
    mainComment: mainComment.trim(),
    photos,
    response,
    isAnonymous,
    helpfulCount,
    mitraLikes
  }
}

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
            // ✅ FIX: Include booking to get is_anonymous and rating_photos
            booking: {
              select: {
                is_anonymous: true,
                rating_photos: true,
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
      reviews: vendor.reviews.map(review => {
        const metadata = parseReviewComment(review.comment)
        
        // ✅ FIX: Prioritas is_anonymous dari booking (sumber utama), fallback ke metadata comment
        const isAnonymous = review.booking?.is_anonymous === true || metadata.isAnonymous
        
        // ✅ FIX: Prioritas rating_photos dari booking (sumber utama), fallback ke metadata comment
        const bookingPhotos = review.booking?.rating_photos || []
        const photos = bookingPhotos.length > 0 ? bookingPhotos : (metadata.photos || [])
        
        // Check if vendor liked this review
        const vendorLiked = metadata.mitraLikes.includes(vendor.vendor_id)
        
        console.log('[Vendor Detail API] Parsing review:', {
          reviewId: review.review_id,
          bookingIsAnonymous: review.booking?.is_anonymous,
          metadataIsAnonymous: metadata.isAnonymous,
          finalIsAnonymous: isAnonymous,
          bookingPhotosCount: bookingPhotos.length,
          metadataPhotosCount: metadata.photos?.length || 0,
          finalPhotosCount: photos.length,
          userName: review.user.name,
          displayName: isAnonymous ? 'Anonymous' : review.user.name,
        })
        
        return {
          id: review.review_id,
          userName: isAnonymous ? 'Anonymous' : review.user.name,
          userEmail: isAnonymous ? '' : review.user.email,
          userAvatar: isAnonymous ? null : review.user.avatar,
          rating: review.rating,
          comment: metadata.mainComment,
          photos: photos,
          response: metadata.response,
          isAnonymous: isAnonymous,
          helpfulCount: metadata.helpfulCount,
          mitraLikes: metadata.mitraLikes,
          vendorLiked,
          date: review.created_at.toISOString(),
        }
      }),
      joinDate: vendor.join_date,
      join_date: vendor.join_date,
    };

    console.log('[Vendor Detail API] Success - Review count:', actualReviewCount);

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