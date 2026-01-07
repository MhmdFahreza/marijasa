// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[Bookings API] POST request received');
    
    // Get all cookies for debugging
    const allCookies = request.cookies.getAll();
    console.log('[Bookings API] All cookies:', allCookies.map(c => `${c.name}=${c.value ? 'present' : 'missing'}`));

    // Try to get user ID from various cookie sources
    let userId: string | null = null;
    
    // Method 1: Check session_id cookie (custom auth)
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;
    
    console.log('[Bookings API] Session cookies:', {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken
    });

    if (sessionId && accessToken) {
      try {
        // Call /api/auth/me to verify and get user
        const origin = request.nextUrl.origin;
        const meResponse = await fetch(`${origin}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': `session_id=${sessionId}; access_token=${accessToken}`
          }
        });

        console.log('[Bookings API] /api/auth/me response status:', meResponse.status);

        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log('[Bookings API] Full response from /api/auth/me:', JSON.stringify(meData));
          
          // Check different possible locations for user_id
          if (meData.authenticated && meData.user) {
            // Try different field names
            userId = meData.user.user_id || meData.user.id;
            console.log('[Bookings API] User ID found:', userId);
          } else {
            console.log('[Bookings API] Response structure:', {
              hasAuthenticated: 'authenticated' in meData,
              authenticated: meData.authenticated,
              hasUser: 'user' in meData,
              userKeys: meData.user ? Object.keys(meData.user) : []
            });
          }
        } else {
          const errorText = await meResponse.text();
          console.error('[Bookings API] /api/auth/me error response:', errorText);
        }
      } catch (error) {
        console.error('[Bookings API] Error calling /api/auth/me:', error);
      }
    }

    if (!userId) {
      console.error('[Bookings API] No valid user ID found after all attempts');
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Anda harus login terlebih dahulu',
          debug: {
            hasSessionId: !!sessionId,
            hasAccessToken: !!accessToken
          }
        },
        { status: 401 }
      );
    }

    console.log('[Bookings API] Authenticated user ID:', userId);

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

    console.log('[Bookings API] Booking data:', {
      orderId,
      vendorId,
      userId
    });

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

    console.log('[Bookings API] Creating booking...');

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

    console.log('[Bookings API] Booking created:', booking.booking_id);

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
    console.error('[Bookings API] Error creating booking:', error);
    
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
    console.log('[Bookings API] GET request received');
    
    // Try to get user ID from various cookie sources
    let userId: string | null = null;
    
    // Check session_id cookie (custom auth)
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (sessionId && accessToken) {
      try {
        const origin = request.nextUrl.origin;
        const meResponse = await fetch(`${origin}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': `session_id=${sessionId}; access_token=${accessToken}`
          }
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData.authenticated && meData.user) {
            userId = meData.user.user_id || meData.user.id;
          }
        }
      } catch (error) {
        console.error('[Bookings API] Error verifying session:', error);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
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
    console.error('[Bookings API] Error fetching bookings:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Terjadi kesalahan saat mengambil data pemesanan'
      },
      { status: 500 }
    );
  }
}