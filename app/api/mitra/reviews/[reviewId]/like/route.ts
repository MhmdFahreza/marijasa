// app/api/mitra/reviews/[reviewId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/components/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { vendorId } = await request.json()
    const { reviewId } = await params

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    console.log('[Like Review API] Processing like for review:', reviewId)

    // Get current review
    const review = await prisma.review.findUnique({
      where: { review_id: reviewId },
      select: { comment: true },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Parse current likes dari metadata
    let currentLikes = { count: 0, mitraLikes: [] as string[] }
    
    try {
      if (review.comment && review.comment.includes('|LIKES|')) {
        const parts = review.comment.split('|LIKES|')
        const likesStr = parts[1]?.split('|')[0] // Ambil hanya bagian LIKES
        if (likesStr) {
          currentLikes = JSON.parse(likesStr)
        }
      }
    } catch (error) {
      console.error('[Like Review API] Error parsing likes:', error)
    }

    // Toggle like
    const alreadyLiked = currentLikes.mitraLikes.includes(vendorId)
    let updatedLikes

    if (alreadyLiked) {
      // Unlike
      updatedLikes = {
        count: Math.max(0, currentLikes.count - 1),
        mitraLikes: currentLikes.mitraLikes.filter((id: string) => id !== vendorId),
      }
      console.log('[Like Review API] Unlike - removing vendor:', vendorId)
    } else {
      // Like
      updatedLikes = {
        count: currentLikes.count + 1,
        mitraLikes: [...currentLikes.mitraLikes, vendorId],
      }
      console.log('[Like Review API] Like - adding vendor:', vendorId)
    }

    // Rebuild comment dengan metadata yang updated
    let baseComment = review.comment || ''
    let photos = null
    let response = null
    let anonymous = false

    // Extract existing metadata
    if (baseComment.includes('|PHOTOS|')) {
      const parts = baseComment.split('|PHOTOS|')
      baseComment = parts[0]
      const remaining = parts[1]
      
      if (remaining) {
        const photoParts = remaining.split('|RESPONSE|')
        photos = photoParts[0]
        
        if (photoParts[1]) {
          const responseParts = photoParts[1].split('|LIKES|')
          response = responseParts[0]
          
          if (responseParts[1]) {
            const likeParts = responseParts[1].split('|ANONYMOUS|')
            if (likeParts[1]) {
              anonymous = true
            }
          }
        }
      }
    } else if (baseComment.includes('|RESPONSE|')) {
      const parts = baseComment.split('|RESPONSE|')
      baseComment = parts[0]
      const remaining = parts[1]
      
      if (remaining) {
        const responseParts = remaining.split('|LIKES|')
        response = responseParts[0]
        
        if (responseParts[1]) {
          const likeParts = responseParts[1].split('|ANONYMOUS|')
          if (likeParts[1]) {
            anonymous = true
          }
        }
      }
    } else if (baseComment.includes('|LIKES|')) {
      const parts = baseComment.split('|LIKES|')
      baseComment = parts[0]
      
      if (parts[1]) {
        const likeParts = parts[1].split('|ANONYMOUS|')
        if (likeParts[1]) {
          anonymous = true
        }
      }
    } else if (baseComment.includes('|ANONYMOUS|')) {
      baseComment = baseComment.split('|ANONYMOUS|')[0]
      anonymous = true
    }

    // Rebuild comment
    let updatedComment = baseComment
    if (photos) {
      updatedComment += `|PHOTOS|${photos}`
    }
    if (response) {
      updatedComment += `|RESPONSE|${response}`
    }
    updatedComment += `|LIKES|${JSON.stringify(updatedLikes)}`
    if (anonymous) {
      updatedComment += `|ANONYMOUS|`
    }

    // Update review
    await prisma.review.update({
      where: { review_id: reviewId },
      data: {
        comment: updatedComment,
        updated_at: new Date(),
      },
    })

    console.log('[Like Review API] Updated likes:', updatedLikes)

    // Dispatch event untuk update UI
    return NextResponse.json({
      helpfulCount: updatedLikes.count,
      mitraLikes: updatedLikes.mitraLikes,
      isLiked: !alreadyLiked,
    })
  } catch (error) {
    console.error('[Like Review API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to like review' },
      { status: 500 }
    )
  }
}