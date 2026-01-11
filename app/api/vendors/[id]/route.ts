// app/api/vendors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// Parse review metadata helper
function parseReviewComment(comment: string | null) {
  if (!comment) return { mainComment: '', photos: [], response: undefined, isAnonymous: false }

  let mainComment = comment
  let photos: string[] = []
  let response: { vendorReply: string; replyDate: string } | undefined
  let isAnonymous = false

  try {
    if (comment.includes('|PHOTOS|')) {
      const parts = comment.split('|PHOTOS|')
      mainComment = parts[0]
      
      if (parts[1]) {
        const photoStr = parts[1].split('|RESPONSE|')[0].split('|LIKES|')[0].split('|ANONYMOUS|')[0]
        photos = JSON.parse(photoStr)
      }
    }

    if (comment.includes('|RESPONSE|')) {
      const responsePart = comment.split('|RESPONSE|')[1]
      if (responsePart) {
        const responseStr = responsePart.split('|LIKES|')[0].split('|ANONYMOUS|')[0]
        const responseData = JSON.parse(responseStr)
        
        response = {
          vendorReply: responseData.reply,
          replyDate: new Date(responseData.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }
      }
    }

    if (comment.includes('|ANONYMOUS|')) {
      isAnonymous = true
    }

  } catch (error) {
    console.error('[Vendor Detail] Error parsing review metadata:', error)
  }

  return {
    mainComment: mainComment.split('|')[0],
    photos,
    response,
    isAnonymous
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
        
        return {
          id: review.review_id,
          userName: metadata.isAnonymous ? 'Anonymous' : review.user.name,
          userEmail: review.user.email,
          userAvatar: metadata.isAnonymous ? null : review.user.avatar,
          rating: review.rating,
          comment: metadata.mainComment,
          photos: metadata.photos,
          response: metadata.response,
          isAnonymous: metadata.isAnonymous,
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