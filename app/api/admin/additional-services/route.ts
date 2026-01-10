// app/api/admin/additional-services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

// Helper function to verify admin session
async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const adminSessionId = request.cookies.get('admin_session_id')?.value;
  const adminAccessToken = request.cookies.get('admin_access_token')?.value;

  console.log('[Admin Additional Services] Verifying session:', {
    hasSessionId: !!adminSessionId,
    hasAccessToken: !!adminAccessToken
  });

  if (!adminSessionId || !adminAccessToken) {
    console.log('[Admin Additional Services] Missing credentials');
    return false;
  }

  try {
    const origin = request.nextUrl.origin;
    const verifyUrl = `${origin}/api/admin/verify`;
    
    console.log('[Admin Additional Services] Calling verify at:', verifyUrl);
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Cookie': `admin_session_id=${adminSessionId}; admin_access_token=${adminAccessToken}`
      },
      cache: 'no-store'
    });

    console.log('[Admin Additional Services] Verify response status:', verifyResponse.status);

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('[Admin Additional Services] Verify response:', {
        success: verifyData.success,
        hasAdmin: !!verifyData.admin
      });
      
      if (verifyData.success === true) {
        return true;
      }
    }
    
    const errorData = await verifyResponse.json().catch(() => ({ error: 'Unknown error' }));
    console.log('[Admin Additional Services] Auth failed:', errorData);
    
  } catch (error) {
    console.error('[Admin Additional Services] Error verifying session:', error);
  }

  return false;
}

// Get all additional service requests
export async function GET(request: NextRequest) {
  try {
    console.log('[Admin Additional Services] GET request received');
    
    const isAdmin = await verifyAdminSession(request);

    if (!isAdmin) {
      console.log('[Admin Additional Services] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Akses admin diperlukan' },
        { status: 401 }
      );
    }

    console.log('[Admin Additional Services] Admin verified, fetching requests');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {};

    if (status && status !== 'all') {
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'approved': 'APPROVED',
        'rejected': 'REJECTED'
      };
      if (statusMap[status]) {
        whereClause.status = statusMap[status];
      }
    }

    if (search) {
      whereClause.OR = [
        {
          booking: {
            booking_number: { contains: search, mode: 'insensitive' }
          }
        },
        {
          customer_name: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    // Fetch additional service requests
    const requests = await prisma.additionalServiceRequest.findMany({
      where: whereClause,
      include: {
        booking: {
          select: {
            booking_number: true,
            scheduled_date: true,
            scheduled_time: true,
            vendor: {
              select: {
                name: true
              }
            }
          }
        },
        items: {
          include: {
            service: {
              select: {
                service_id: true,
                name: true,
                price: true,
                price_type: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('[Admin Additional Services] Found requests:', requests.length);

    // Format response
    const formattedRequests = requests.map(req => ({
      id: req.request_id,
      orderId: req.booking.booking_number,
      vendorName: req.booking.vendor.name,
      vendorId: req.vendor_id,
      customerName: req.customer_name,
      services: req.items.map(item => ({
        id: item.service_id,
        name: item.service.name,
        price: item.price,
        quantity: item.quantity,
        priceType: item.service.price_type,
        description: item.service.description
      })),
      description: req.description,
      totalPrice: req.total_price,
      reason: req.reason,
      images: req.images,
      submittedAt: req.created_at.toISOString(),
      status: req.status.toLowerCase(),
      rejectionReason: req.rejection_reason,
      approvedAt: req.approved_at?.toISOString(),
      rejectedAt: req.rejected_at?.toISOString(),
      orderDetails: {
        serviceType: req.description,
        serviceDate: req.booking.scheduled_date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        serviceTime: req.booking.scheduled_time
      }
    }));

    // Calculate counts - fetch all statuses
    const allRequests = await prisma.additionalServiceRequest.groupBy({
      by: ['status'],
      _count: true
    });

    const totalCount = await prisma.additionalServiceRequest.count();

    const counts = {
      total: totalCount,
      pending: allRequests.find(r => r.status === 'PENDING')?._count || 0,
      approved: allRequests.find(r => r.status === 'APPROVED')?._count || 0,
      rejected: allRequests.find(r => r.status === 'REJECTED')?._count || 0
    };

    console.log('[Admin Additional Services] Returning response with counts:', counts);

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      counts
    });

  } catch (error: any) {
    console.error('[Admin Additional Services] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// Approve or reject additional service request
export async function PUT(request: NextRequest) {
  try {
    console.log('[Admin Additional Services] PUT request received');
    
    const isAdmin = await verifyAdminSession(request);

    if (!isAdmin) {
      console.log('[Admin Additional Services] Unauthorized PUT attempt');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Akses admin diperlukan' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, requestId, rejectionReason } = body;

    console.log('[Admin Additional Services] Action:', action, 'Request ID:', requestId);

    // Find request
    const additionalRequest = await prisma.additionalServiceRequest.findUnique({
      where: { request_id: requestId },
      include: {
        booking: {
          include: {
            user: true
          }
        },
        items: {
          include: {
            service: true
          }
        }
      }
    });

    if (!additionalRequest) {
      console.log('[Admin Additional Services] Request not found:', requestId);
      return NextResponse.json(
        { error: 'Not Found', message: 'Permintaan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (additionalRequest.status !== 'PENDING') {
      console.log('[Admin Additional Services] Request already processed:', additionalRequest.status);
      return NextResponse.json(
        { error: 'Bad Request', message: 'Permintaan sudah diproses' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'approve': {
        console.log('[Admin Additional Services] Approving request:', requestId);
        
        // Update request status
        await prisma.additionalServiceRequest.update({
          where: { request_id: requestId },
          data: {
            status: 'APPROVED',
            approved_at: new Date()
          }
        });

        // Update booking with new services and price
        const booking = additionalRequest.booking;
        const newSubtotal = booking.subtotal + additionalRequest.total_price;
        const newTotal = newSubtotal + booking.service_fee + booking.transaction_fee;

        // Add new booking items
        for (const item of additionalRequest.items) {
          await prisma.bookingItem.create({
            data: {
              booking_id: booking.booking_id,
              service_id: item.service_id,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal
            }
          });
        }

        // Update booking totals
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            subtotal: newSubtotal,
            total: newTotal,
            order_history: {
              create: {
                status: `Layanan Tambahan Disetujui: ${additionalRequest.description}`
              }
            }
          }
        });

        // Create notification for user
        await prisma.userNotification.create({
          data: {
            user_id: booking.user_id,
            title: 'Permintaan Layanan Disetujui',
            message: `Permintaan layanan tambahan untuk pesanan #${booking.booking_number} telah disetujui. Layanan telah ditambahkan ke pesanan Anda.`,
            type: 'additional_service',
            order_id: booking.booking_id
          }
        });

        // Delete admin notification
        await prisma.adminNotification.deleteMany({
          where: {
            request_id: requestId,
            type: 'additional_service_request'
          }
        });

        console.log('[Admin Additional Services] Request approved successfully');

        return NextResponse.json({
          success: true,
          message: 'Permintaan layanan tambahan berhasil disetujui'
        });
      }

      case 'reject': {
        if (!rejectionReason) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Alasan penolakan diperlukan' },
            { status: 400 }
          );
        }

        console.log('[Admin Additional Services] Rejecting request:', requestId);

        // Update request status
        await prisma.additionalServiceRequest.update({
          where: { request_id: requestId },
          data: {
            status: 'REJECTED',
            rejection_reason: rejectionReason,
            rejected_at: new Date()
          }
        });

        // Create notification for user
        const booking = additionalRequest.booking;
        await prisma.userNotification.create({
          data: {
            user_id: booking.user_id,
            title: 'Permintaan Layanan Ditolak',
            message: `Permintaan layanan tambahan untuk pesanan #${booking.booking_number} ditolak. Alasan: ${rejectionReason}`,
            type: 'additional_service',
            order_id: booking.booking_id
          }
        });

        // Delete admin notification
        await prisma.adminNotification.deleteMany({
          where: {
            request_id: requestId,
            type: 'additional_service_request'
          }
        });

        console.log('[Admin Additional Services] Request rejected successfully');

        return NextResponse.json({
          success: true,
          message: 'Permintaan layanan tambahan telah ditolak'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Action tidak valid' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Admin Additional Services] PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}