import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/components/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { vendorId } = await request.json()
    const reviewId = params.reviewId

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

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

    let currentLikes = { count: 0, mitraLikes: [] as string[] }
    
    try {
      if (review.comment && review.comment.includes('|LIKES|')) {
        const parts = review.comment.split('|LIKES|')
        const likesData = parts[1] ? JSON.parse(parts[1]) : { count: 0, mitraLikes: [] }
        currentLikes = likesData
      }
    } catch (error) {
      console.error('Error parsing likes:', error)
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
    } else {
      // Like
      updatedLikes = {
        count: currentLikes.count + 1,
        mitraLikes: [...currentLikes.mitraLikes, vendorId],
      }
    }

    // Update comment dengan metadata likes yang baru
    const baseComment = review.comment ? review.comment.split('|')[0] : ''
    const updatedComment = `${baseComment}|LIKES|${JSON.stringify(updatedLikes)}`

    // Update review
    await prisma.review.update({
      where: { review_id: reviewId },
      data: {
        comment: updatedComment,
      },
    })

    return NextResponse.json({
      helpfulCount: updatedLikes.count,
      mitraLikes: updatedLikes.mitraLikes,
    })
  } catch (error) {
    console.error('Error liking review:', error)
    return NextResponse.json(
      { error: 'Failed to like review' },
      { status: 500 }
    )
  }
}