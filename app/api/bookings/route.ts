// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function POST(request: NextRequest) {
  try {
    // Get user session from cookie
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const userId = sessionData.user?.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Session tidak valid' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      gpsLink,
      vendorId,
      serviceCategory,
      serviceDetails,
      workDate,
      workTime,
      additionalNotes,
      status,
      orderDate,
      paymentStatus,
      subtotal,
      serviceFee,
      totalAmount
    } = body;

    // Validate required fields
    if (!orderId || !vendorId || !workDate || !workTime) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Data pemesanan tidak lengkap' },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: vendorId }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Vendor tidak ditemukan' },
        { status: 404 }
      );
    }

    // Combine date and time for scheduled_date
    const scheduledDateTime = new Date(`${workDate}T${workTime}:00`);

    // Create booking with items
    const booking = await prisma.booking.create({
      data: {
        booking_number: orderId,
        user_id: userId,
        vendor_id: vendorId,
        scheduled_date: scheduledDateTime,
        scheduled_time: workTime,
        location: `${customerAddress}\nGPS: ${gpsLink}`,
        notes: additionalNotes || null,
        status: status.toUpperCase() as any,
        payment_status: paymentStatus.toUpperCase() as any,
        subtotal: subtotal,
        service_fee: serviceFee,
        total: totalAmount,
        items: {
          create: serviceDetails.selectedServices.map((serviceId: string) => ({
            service_id: serviceId,
            quantity: serviceDetails.quantities[serviceId] || 1,
            price: 0, // Will be updated below
            subtotal: 0 // Will be updated below
          }))
        }
      },
      include: {
        items: {
          include: {
            service: true
          }
        }
      }
    });

    // Update booking items with actual prices
    for (const item of booking.items) {
      const service = item.service;
      const quantity = item.quantity;
      const itemSubtotal = service.price * quantity;

      await prisma.bookingItem.update({
        where: { booking_item_id: item.booking_item_id },
        data: {
          price: service.price,
          subtotal: itemSubtotal
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Pemesanan berhasil dibuat',
        orderId: booking.booking_number,
        bookingId: booking.booking_id
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Terjadi kesalahan saat membuat pemesanan'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const userId = sessionData.user?.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Session tidak valid' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {
      user_id: userId
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            vendor_id: true,
            name: true,
            avatar: true,
            phone: true,
            rating: true
          }
        },
        items: {
          include: {
            service: {
              select: {
                service_id: true,
                name: true,
                description: true,
                price: true,
                price_type: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.booking.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      bookings: bookings,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Terjadi kesalahan saat mengambil data pemesanan'
      },
      { status: 500 }
    );
  }
}