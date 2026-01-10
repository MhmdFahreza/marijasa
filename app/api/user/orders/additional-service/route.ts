// app/api/user/orders/additional-service/route.ts (UPDATED with notifications)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

// Helper function to get user ID from session
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  const sessionId = request.cookies.get('session_id')?.value;
  const accessToken = request.cookies.get('access_token')?.value;

  if (!sessionId || !accessToken) {
    return null;
  }

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
        return meData.user.user_id || meData.user.id;
      }
    }
  } catch (error) {
    console.error('[Additional Service API] Error verifying session:', error);
  }

  return null;
}

// Create additional service request
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      selectedServices,
      quantities,
      reason,
      images
    } = body;

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: {
        booking_number: orderId,
        user_id: userId
      },
      include: {
        vendor: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get selected services
    const services = await prisma.service.findMany({
      where: {
        service_id: { in: selectedServices },
        vendor_id: booking.vendor_id,
        is_active: true
      }
    });

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Layanan tidak ditemukan' },
        { status: 400 }
      );
    }

    // Calculate total price and create description
    let totalPrice = 0;
    const serviceDescriptions: string[] = [];
    const serviceItems: { service_id: string; quantity: number; price: number; subtotal: number }[] = [];

    services.forEach(service => {
      const quantity = quantities[service.service_id] || 1;
      const subtotal = service.price * quantity;
      totalPrice += subtotal;
      serviceDescriptions.push(`${service.name} (${quantity}x)`);
      serviceItems.push({
        service_id: service.service_id,
        quantity,
        price: service.price,
        subtotal
      });
    });

    const description = serviceDescriptions.join(', ');

    // Create additional service request
    const additionalRequest = await prisma.additionalServiceRequest.create({
      data: {
        booking_id: booking.booking_id,
        vendor_id: booking.vendor_id,
        customer_name: booking.user.name,
        description,
        total_price: totalPrice,
        reason,
        images: images || [],
        status: 'PENDING',
        items: {
          create: serviceItems
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

    // Create admin notification
    await prisma.adminNotification.create({
      data: {
        title: 'Permintaan Layanan Tambahan Baru',
        message: `${booking.user.name} mengajukan permintaan layanan tambahan untuk pesanan #${orderId}. Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
        type: 'additional_service_request',
        request_id: additionalRequest.request_id,
        order_id: booking.booking_id
      }
    });

    // CREATE USER NOTIFICATION
    await prisma.userNotification.create({
      data: {
        user_id: userId,
        title: 'Permintaan Layanan Tambahan Dikirim',
        message: `Permintaan layanan tambahan untuk pesanan #${orderId} telah dikirim. Menunggu persetujuan admin. Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
        type: 'additional_service',
        order_id: booking.booking_id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Permintaan layanan tambahan berhasil dikirim',
      requestId: additionalRequest.request_id,
      request: {
        id: additionalRequest.request_id,
        orderId: orderId,
        vendorName: booking.vendor.name,
        services: additionalRequest.items.map(item => ({
          id: item.service_id,
          name: item.service.name,
          price: item.price,
          quantity: item.quantity,
          priceType: item.service.price_type
        })),
        description,
        totalPrice,
        reason,
        images: additionalRequest.images,
        submittedAt: additionalRequest.created_at.toISOString(),
        status: 'menunggu konfirmasi admin'
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Additional Service API] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}