import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/components/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    // Fetch reviews dengan relasi yang diperlukan
    const reviews = await prisma.review.findMany({
      where: {
        vendor_id: vendorId,
      },
      include: {
        booking: {
          include: {
            items: { // DIUBAH: dari 'booking_items' menjadi 'items'
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

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}