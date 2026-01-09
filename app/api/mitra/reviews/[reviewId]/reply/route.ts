import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/components/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { vendorId, reply } = await request.json()
    const reviewId = params.reviewId

    if (!vendorId || !reply) {
      return NextResponse.json(
        { error: 'Vendor ID and reply are required' },
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

    // Create response metadata
    const responseMetadata = {
      reply,
      date: new Date().toISOString(),
    }

    // Update comment dengan response metadata
    const baseComment = review.comment ? review.comment.split('|')[0] : ''
    const updatedComment = `${baseComment}|RESPONSE|${JSON.stringify(responseMetadata)}`

    // Update review
    await prisma.review.update({
      where: { review_id: reviewId },
      data: {
        comment: updatedComment,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      response: {
        vendorReply: reply,
        replyDate: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
      metadata: responseMetadata,
    })
  } catch (error) {
    console.error('Error submitting reply:', error)
    return NextResponse.json(
      { error: 'Failed to submit reply' },
      { status: 500 }
    )
  }
}