// app/api/mitra/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/components/lib/prisma'
import {
  verifyToken,
  getSession,
} from '@/app/components/lib/token-service'

async function getVendorIdFromSession(request: NextRequest): Promise<string | null> {
  // Get mitra-specific cookies
  const sessionId = request.cookies.get('mitra_session_id')?.value
  const accessToken = request.cookies.get('mitra_access_token')?.value

  console.log('[Mitra Reviews API] Cookies:', {
    hasSessionId: !!sessionId,
    hasAccessToken: !!accessToken,
    sessionId: sessionId?.substring(0, 10) + '...'
  })

  if (!sessionId || !accessToken) {
    console.log('[Mitra Reviews API] Missing cookies')
    return null
  }

  try {
    // Verify token
    const tokenPayload = verifyToken(accessToken)
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      console.log('[Mitra Reviews API] Invalid token')
      return null
    }

    // Get session from Redis
    const session = await getSession(sessionId)
    if (!session) {
      console.log('[Mitra Reviews API] Session not found')
      return null
    }

    console.log('[Mitra Reviews API] Session found:', {
      userId: session.userId,
      email: session.email
    })

    return session.userId
  } catch (error) {
    console.error('[Mitra Reviews API] Error verifying session:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let vendorId = searchParams.get('vendorId')

    // Jika tidak ada vendorId di query params, ambil dari session
    if (!vendorId) {
      vendorId = await getVendorIdFromSession(request)
      
      if (!vendorId) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Please login as vendor' },
          { status: 401 }
        )
      }
    }

    console.log('[Mitra Reviews API] Fetching reviews for vendor:', vendorId)

    // Fetch reviews dengan relasi yang diperlukan
    // ✅ FIX: Explicitly select rating_photos and is_anonymous from booking
    const reviews = await prisma.review.findMany({
      where: {
        vendor_id: vendorId,
      },
      include: {
        booking: {
          select: {
            booking_number: true,
            scheduled_date: true,
            notes: true,
            rating_photos: true,   
            is_anonymous: true,     
            items: {
              include: {
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
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
    })

    console.log('[Mitra Reviews API] Found reviews:', reviews.length)

    // ✅ FIX: Format reviews to include is_anonymous and rating_photos from booking
    const formattedReviews = reviews.map(review => {
      const isAnonymous = review.booking?.is_anonymous === true
      const ratingPhotos = review.booking?.rating_photos || []

      console.log('[Mitra Reviews API] Review formatting:', {
        reviewId: review.review_id,
        isAnonymous,
        photosCount: ratingPhotos.length,
        photosUrls: ratingPhotos,
        userName: review.user.name,
        displayName: isAnonymous ? 'Anonymous' : review.user.name,
      })

      return {
        ...review,
        // ✅ Override user info if anonymous
        user: isAnonymous
          ? {
              name: 'Anonymous',
              email: '',
              avatar: null,
            }
          : review.user,
        // ✅ Override booking user info if anonymous
        booking: review.booking
          ? {
              ...review.booking,
              user: isAnonymous
                ? {
                    name: 'Anonymous',
                    email: '',
                    avatar: null,
                  }
                : review.booking.user,
            }
          : review.booking,
        // ✅ Add explicit fields for frontend convenience
        isAnonymous: isAnonymous,
        ratingPhotos: ratingPhotos,
        rating_photos: ratingPhotos,
      }
    })

    return NextResponse.json(formattedReviews)
  } catch (error) {
    console.error('[Mitra Reviews API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}