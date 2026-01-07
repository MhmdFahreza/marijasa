// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

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

    // Validate service IDs exist
    if (serviceDetails?.selectedServices?.length > 0) {
      const existingServices = await prisma.service.findMany({
        where: {
          service_id: {
            in: serviceDetails.selectedServices
          }
        },
        select: { service_id: true }
      });

      const existingIds = existingServices.map(s => s.service_id);
      const missingIds = serviceDetails.selectedServices.filter(
        (id: string) => !existingIds.includes(id)
      );

      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: `Beberapa layanan tidak ditemukan: ${missingIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Combine date and time for scheduled_date
    const scheduledDateTime = new Date(`${workDate}T${workTime}:00`);
    
    // Ensure date is valid
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Tanggal dan waktu tidak valid' },
        { status: 400 }
      );
    }

    // Get service prices
    const selectedServices = serviceDetails?.selectedServices || [];
    const serviceItems = [];
    
    for (const serviceId of selectedServices) {
      const service = await prisma.service.findUnique({
        where: { service_id: serviceId }
      });
      
      if (service) {
        const quantity = serviceDetails.quantities?.[serviceId] || 1;
        serviceItems.push({
          service_id: serviceId,
          quantity: quantity,
          price: service.price,
          subtotal: service.price * quantity
        });
      }
    }

    // Calculate total from service items
    const calculatedSubtotal = serviceItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Use provided subtotal or calculated
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTotal = totalAmount || (finalSubtotal + serviceFee);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        booking_number: orderId,
        user_id: userId,
        vendor_id: vendorId,
        scheduled_date: scheduledDateTime,
        scheduled_time: workTime,
        location: `${customerAddress}\nGPS: ${gpsLink}`,
        notes: additionalNotes || null,
        status: status.toUpperCase(),
        payment_status: paymentStatus.toUpperCase(),
        subtotal: finalSubtotal,
        service_fee: serviceFee,
        total: finalTotal,
        items: {
          create: serviceItems
        }
      },
      include: {
        items: {
          include: {
            service: true
          }
        },
        vendor: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pemesanan berhasil dibuat',
        orderId: booking.booking_number,
        bookingId: booking.booking_id,
        booking: {
          id: booking.booking_id,
          orderId: booking.booking_number,
          status: booking.status,
          paymentStatus: booking.payment_status,
          total: booking.total,
          scheduledDate: booking.scheduled_date,
          vendor: booking.vendor
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate Entry', message: 'Order ID sudah digunakan' },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Not Found', message: 'Data terkait tidak ditemukan' },
        { status: 404 }
      );
    }

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