// app/api/mitra/reviews/[reviewId]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/components/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { vendorId, reply } = await request.json()
    const { reviewId } = await params

    if (!vendorId || !reply) {
      return NextResponse.json(
        { error: 'Vendor ID and reply are required' },
        { status: 400 }
      )
    }

    console.log('[Reply Review API] Processing reply for review:', reviewId)

    // Get current review
    const review = await prisma.review.findUnique({
      where: { review_id: reviewId },
      select: { 
        comment: true,
        vendor_id: true 
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Verify vendor ownership
    if (review.vendor_id !== vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Create response metadata
    const responseMetadata = {
      reply,
      date: new Date().toISOString(),
    }

    // Parse existing metadata
    let baseComment = review.comment || ''
    let photos = null
    let likes = null
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
          
          if (responseParts[1]) {
            const likeParts = responseParts[1].split('|ANONYMOUS|')
            likes = likeParts[0]
            
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
        
        if (responseParts[1]) {
          const likeParts = responseParts[1].split('|ANONYMOUS|')
          likes = likeParts[0]
          
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
        likes = likeParts[0]
        
        if (likeParts[1]) {
          anonymous = true
        }
      }
    } else if (baseComment.includes('|ANONYMOUS|')) {
      baseComment = baseComment.split('|ANONYMOUS|')[0]
      anonymous = true
    }

    // Rebuild comment dengan response
    let updatedComment = baseComment
    if (photos) {
      updatedComment += `|PHOTOS|${photos}`
    }
    updatedComment += `|RESPONSE|${JSON.stringify(responseMetadata)}`
    if (likes) {
      updatedComment += `|LIKES|${likes}`
    }
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

    console.log('[Reply Review API] Reply saved successfully')

    // Format response date
    const replyDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return NextResponse.json({
      response: {
        vendorReply: reply,
        replyDate: replyDate,
      },
      metadata: responseMetadata,
    })
  } catch (error) {
    console.error('[Reply Review API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit reply' },
      { status: 500 }
    )
  }
}