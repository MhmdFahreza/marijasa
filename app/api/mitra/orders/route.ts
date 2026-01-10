// app/api/mitra/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToken,
  getSession,
  getAccessToken,
  refreshAccessToken,
  updateSessionActivity,
} from '@/app/components/lib/token-service';
import prisma from '@/app/components/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get session ID and tokens from cookies
    const sessionId = request.cookies.get('mitra_session_id')?.value;
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const refreshToken = request.cookies.get('mitra_refresh_token')?.value;

    console.log('[Mitra Orders API] Request:', {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      sessionId: sessionId
    });

    if (!sessionId) {
      console.log('[Mitra Orders API] No session ID');
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      );
    }

    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log('[Mitra Orders API] Session not found in Redis');
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401 }
      );
    }

    console.log('[Mitra Orders API] Session found:', {
      userId: session.userId,
      email: session.email,
      role: session.role
    });

    let currentAccessToken = accessToken;

    // Verify access token
    if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        // Access token expired, try to refresh
        if (refreshToken) {
          console.log('[Mitra Orders API] Access token invalid, attempting refresh');
          const refreshResult = await refreshAccessToken(sessionId, refreshToken);
          
          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
          } else {
            console.log('[Mitra Orders API] Refresh failed');
            return NextResponse.json(
              { success: false, message: 'Session expired' },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, message: 'Token expired' },
            { status: 401 }
          );
        }
      }

      // Verify token exists in Redis
      const storedToken = await getAccessToken(sessionId);
      if (!storedToken || storedToken !== currentAccessToken) {
        console.log('[Mitra Orders API] Token not found in Redis or mismatch');
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        );
      }
    } else if (refreshToken) {
      // No access token but has refresh token, try to refresh
      console.log('[Mitra Orders API] No access token, attempting refresh');
      const refreshResult = await refreshAccessToken(sessionId, refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        currentAccessToken = refreshResult.accessToken;
      } else {
        return NextResponse.json(
          { success: false, message: 'Session expired' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'No tokens found' },
        { status: 401 }
      );
    }

    // Verify vendor exists and is active
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: session.userId },
      select: { vendor_id: true, status: true, name: true, email: true }
    });

    if (!vendor || vendor.status !== 'ACTIVE') {
      console.log('[Mitra Orders API] Vendor not found or inactive');
      return NextResponse.json(
        { success: false, message: 'Vendor not found or inactive' },
        { status: 404 }
      );
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log('[Mitra Orders API] Fetching orders for vendor:', vendor.vendor_id);

    // Fetch orders for this vendor
    const orders = await prisma.booking.findMany({
      where: {
        vendor_id: vendor.vendor_id,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        booking_id: true,
        booking_number: true,
        user_id: true,
        vendor_id: true,
        scheduled_date: true,
        scheduled_time: true,
        location: true,
        notes: true,
        status: true,
        payment_status: true,
        payment_method: true,
        subtotal: true,
        service_fee: true,
        transaction_fee: true,
        total: true,
        rating: true,
        rating_comment: true,
        cancellation_reason: true,
        cancelled_by: true,
        cancelled_at: true,
        created_at: true,
        updated_at: true,
        completed_at: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            gps_link: true,
          },
        },
        items: {
          select: {
            booking_item_id: true,
            service_id: true,
            quantity: true,
            price: true,
            subtotal: true,
            service: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Transform orders to match frontend format
    const transformedOrders = orders.map((order) => {
      // Extract service details from items
      const selectedServices = order.items.map((item) => item.service.name);
      
      // Determine service category based on service names or default
      let serviceCategory = 'general';
      const firstServiceName = selectedServices[0]?.toLowerCase() || '';
      
      if (firstServiceName.includes('ac') || firstServiceName.includes('pendingin')) {
        serviceCategory = 'ac';
      } else if (firstServiceName.includes('bersih') || firstServiceName.includes('cleaning')) {
        serviceCategory = 'cleaning';
      } else if (firstServiceName.includes('listrik') || firstServiceName.includes('electrical')) {
        serviceCategory = 'electrical';
      } else if (firstServiceName.includes('pipa') || firstServiceName.includes('plumbing')) {
        serviceCategory = 'plumbing';
      } else if (firstServiceName.includes('taman') || firstServiceName.includes('garden')) {
        serviceCategory = 'garden';
      } else if (firstServiceName.includes('furniture') || firstServiceName.includes('mebel')) {
        serviceCategory = 'furniture';
      } else if (firstServiceName.includes('sedot') || firstServiceName.includes('wc')) {
        serviceCategory = 'sedot-wc';
      }

      return {
        id: order.booking_number,
        serviceCategory,
        serviceDetails: {
          selectedServices,
          totalPrice: order.total,
          items: order.items.map((item) => ({
            id: item.booking_item_id,
            name: item.service.name,
            description: item.service.description,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
        customerName: order.user.name,
        customerEmail: order.user.email,
        customerPhone: order.user.phone || '-',
        customerAddress: order.user.address || order.location,
        gpsLink: order.user.gps_link || null,
        workDate: order.scheduled_date,
        workTime: order.scheduled_time,
        additionalNotes: order.notes,
        status: order.status.toLowerCase().replace('_', '-'),
        paymentStatus: order.payment_status.toLowerCase(),
        orderDate: order.created_at,
        cancellationReason: order.cancellation_reason,
        cancelledBy: order.cancelled_by,
        cancelledAt: order.cancelled_at,
      };
    });

    // Calculate stats
    const stats = {
      total: transformedOrders.length,
      pending: transformedOrders.filter((o) => o.status === 'pending').length,
      inProgress: transformedOrders.filter((o) => o.status === 'in-progress').length,
      completed: transformedOrders.filter((o) => o.status === 'completed').length,
      rejected: transformedOrders.filter((o) => o.status === 'cancelled' || o.status === 'rejected').length,
    };

    console.log('[Mitra Orders API] Success:', {
      ordersCount: transformedOrders.length,
      stats
    });

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      stats,
    });
  } catch (error) {
    console.error('[Mitra Orders API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}