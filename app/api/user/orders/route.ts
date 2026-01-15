// app/api/user/orders/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/components/lib/prisma';

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
    console.error('[User Orders API] Error verifying session:', error);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        user_id: userId
      },
      include: {
        vendor: {
          select: {
            vendor_id: true,
            name: true,
            avatar: true,
            rating: true,
            category: true,
            tags: true
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
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            gps_link: true
          }
        },
        order_history: {
          orderBy: {
            created_at: 'asc'
          }
        },
        additional_service_requests: {
          include: {
            items: {
              include: {
                service: {
                  select: {
                    service_id: true,
                    name: true,
                    price: true,
                    price_type: true
                  }
                }
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const vendorServicesByBooking: Record<string, any[]> = {};
    for (const booking of bookings) {
      const vendorServices = await prisma.service.findMany({
        where: {
          vendor_id: booking.vendor_id,
          is_active: true
        },
        select: {
          service_id: true,
          name: true,
          description: true,
          price: true,
          price_type: true,
          estimated_time: true
        }
      });
      vendorServicesByBooking[booking.booking_id] = vendorServices;
    }

    const formattedOrders = bookings.map(booking => {
      const statusMap: Record<string, string> = {
        'PENDING': 'menunggu pembayaran',
        'CONFIRMED': 'diproses',
        'IN_PROGRESS': 'diproses',
        'COMPLETED': 'selesai',
        'CANCELLED': 'dibatalkan'
      };

      const frontendStatus = statusMap[booking.status] || 'menunggu pembayaran';
      const serviceNames = booking.items.map(item => item.service.name);
      const serviceType = serviceNames.join(', ') || booking.vendor.category || 'Layanan Umum';

      const orderHistory = booking.order_history.map(history => ({
        status: history.status,
        date: new Date(history.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) + " - " + new Date(history.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        reason: history.reason
      }));

      const additionalServices = booking.additional_service_requests.map(req => ({
        id: req.request_id,
        description: req.description,
        totalPrice: req.total_price,
        status: req.status.toLowerCase(),
        reason: req.reason,
        images: req.images,
        services: req.items.map(item => ({
          id: item.service_id,
          name: item.service.name,
          price: item.price,
          quantity: item.quantity,
          priceType: item.service.price_type
        })),
        submittedAt: req.created_at.toISOString(),
        approvedAt: req.approved_at?.toISOString(),
        rejectedAt: req.rejected_at?.toISOString(),
        rejectionReason: req.rejection_reason,
        isPaid: req.payment_status === 'PAID',
        paymentMethod: req.payment_method,
        paymentStatus: req.payment_status,
        transactionFee: req.transaction_fee || 0,
        serviceFee: req.service_fee || 10000,
        paidAt: req.paid_at?.toISOString()
      }));

      const vendorServices = vendorServicesByBooking[booking.booking_id] || [];

      return {
        id: booking.booking_number,
        bookingId: booking.booking_id,
        vendorId: booking.vendor_id,
        vendorName: booking.vendor.name,
        vendorAvatar: booking.vendor.avatar,
        vendorRating: booking.vendor.rating,
        serviceType: serviceType,
        serviceDate: new Date(booking.scheduled_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        serviceTime: booking.scheduled_time,
        status: frontendStatus,
        statusColor: getStatusColor(frontendStatus),
        paymentMethod: booking.payment_method || 'Belum Dibayar',
        paymentId: booking.payment_method ? `#${Math.floor(1000000 + Math.random() * 9000000)}` : null,
        totalPrice: booking.total,
        paymentDetails: {
          subtotal: booking.subtotal,
          serviceFee: booking.service_fee,
          transactionFee: booking.transaction_fee,
          total: booking.total
        },
        customerInfo: {
          name: booking.user.name,
          email: booking.user.email || '',
          phone: booking.user.phone || '',
          address: booking.location || booking.user.address || '',
          gpsLink: booking.user.gps_link || ''
        },
        serviceDetails: {
          services: serviceNames,
          propertyType: null,
          date: new Date(booking.scheduled_date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          time: booking.scheduled_time
        },
        orderHistory: orderHistory,
        additionalServices: additionalServices,
        vendorServices: vendorServices.map(service => ({
          id: service.service_id,
          name: service.name,
          description: service.description,
          price: service.price,
          priceType: service.price_type,
          estimatedTime: service.estimated_time
        })),
        rating: booking.rating,
        review: booking.rating_comment,
        ratingPhotos: booking.rating_photos || [],
        isAnonymous: booking.is_anonymous,
        cancellationReason: booking.cancellation_reason,
        cancelledBy: booking.cancelled_by,
        cancelledAt: booking.cancelled_at?.toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error: any) {
    console.error('[User Orders API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, orderId, ...data } = body;

    const booking = await prisma.booking.findFirst({
      where: {
        booking_number: orderId,
        user_id: userId
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'updatePayment': {
        const { paymentMethod, transactionFee } = data;

        console.log('[Update Payment] Updating booking:', {
          bookingId: booking.booking_id,
          paymentMethod,
          transactionFee
        });

        // Calculate new total
        const newTotal = booking.subtotal + booking.service_fee + (transactionFee || 0);

        // ✅ Update booking dengan payment_method yang benar
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            payment_method: paymentMethod, // ✅ Simpan payment method
            transaction_fee: transactionFee || 0, // ✅ Simpan transaction fee
            total: newTotal // ✅ Update total
          }
        });

        await prisma.bookingHistory.create({
          data: {
            booking_id: booking.booking_id,
            status: 'Metode Pembayaran Diperbarui',
            reason: paymentMethod.toLowerCase() === 'tunai' 
              ? 'Pembayaran tunai akan dilakukan saat layanan diberikan'
              : null
          }
        });

        console.log('[Update Payment] Payment method updated successfully');

        return NextResponse.json({
          success: true,
          message: 'Metode pembayaran berhasil diperbarui'
        });
      }

      case 'pay': {
        console.log('[Pay] Processing payment for booking:', booking.booking_id);
        console.log('[Pay] Payment method:', booking.payment_method);

        // Check if payment method exists
        if (!booking.payment_method || booking.payment_method === 'Belum Dibayar') {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Silakan pilih metode pembayaran terlebih dahulu' },
            { status: 400 }
          );
        }

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            status: 'CONFIRMED',
            payment_status: 'PAID',
            order_history: {
              create: {
                status: 'Pembayaran Diterima'
              }
            }
          }
        });

        // Notification message berbeda untuk tunai vs non-tunai
        const isCashPayment = booking.payment_method.toLowerCase() === 'tunai' || 
                             booking.payment_method.toLowerCase() === 'cash';

        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: isCashPayment ? '💵 Pembayaran Tunai Dikonfirmasi' : '✅ Pembayaran Berhasil',
            message: isCashPayment
              ? `Pesanan #${orderId} dikonfirmasi dengan pembayaran tunai. Pembayaran akan dilakukan langsung kepada vendor saat layanan diberikan.`
              : `Pembayaran untuk pesanan #${orderId} telah berhasil diproses. Pesanan Anda sedang dikerjakan oleh vendor.`,
            type: 'payment',
            order_id: booking.booking_id
          }
        });

        console.log('[Pay] Payment processed successfully');

        return NextResponse.json({
          success: true,
          message: 'Pembayaran berhasil diproses'
        });
      }

      case 'cancel': {
        const { reason } = data;

        if (booking.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Pesanan tidak dapat dibatalkan' },
            { status: 400 }
          );
        }

        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            status: 'CANCELLED',
            cancellation_reason: reason,
            cancelled_by: 'user',
            cancelled_at: new Date(),
            order_history: {
              create: {
                status: 'Pesanan Dibatalkan',
                reason: reason
              }
            }
          }
        });

        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: 'Pesanan Dibatalkan',
            message: `Pesanan #${orderId} telah dibatalkan. Alasan: ${reason}`,
            type: 'cancellation',
            order_id: booking.booking_id
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Pesanan berhasil dibatalkan'
        });
      }

      case 'complete': {
        const { rating, comment, photos, isAnonymous } = data;

        console.log(`[Complete Order] Starting completion for booking ${booking.booking_id}`);

        if (booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Hanya pesanan yang sedang diproses yang dapat dikonfirmasi selesai' },
            { status: 400 }
          );
        }

        const unpaidAdditionalServices = await prisma.additionalServiceRequest.findMany({
          where: {
            booking_id: booking.booking_id,
            status: 'APPROVED',
            payment_status: { not: 'PAID' }
          }
        });

        if (unpaidAdditionalServices.length > 0) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Harap bayar layanan tambahan terlebih dahulu sebelum mengkonfirmasi selesai' },
            { status: 400 }
          );
        }

        const existingReview = await prisma.review.findUnique({
          where: { booking_id: booking.booking_id }
        });

        if (existingReview) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Rating sudah pernah diberikan untuk pesanan ini' },
            { status: 400 }
          );
        }

        const result = await prisma.$transaction(async (tx) => {
          const updateData: any = {
            status: 'COMPLETED',
            completed_at: new Date(),
          };

          if (rating && rating > 0) {
            updateData.rating = rating;
            updateData.rating_comment = comment || null;
            updateData.rating_photos = photos || [];
            updateData.is_anonymous = isAnonymous || false;
            updateData.rated_at = new Date();
          }

          const updatedBooking = await tx.booking.update({
            where: { booking_id: booking.booking_id },
            data: updateData
          });

          await tx.bookingHistory.create({
            data: {
              booking_id: booking.booking_id,
              status: 'Pekerjaan Selesai',
              reason: null
            }
          });

          if (rating && rating > 0) {
            await tx.review.create({
              data: {
                booking_id: booking.booking_id,
                user_id: userId,
                vendor_id: booking.vendor_id,
                rating: rating,
                comment: comment || null
              }
            });

            const allReviews = await tx.review.findMany({
              where: { vendor_id: booking.vendor_id },
              select: { rating: true }
            });

            if (allReviews.length > 0) {
              const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
              const newAverageRating = totalRating / allReviews.length;

              await tx.vendor.update({
                where: { vendor_id: booking.vendor_id },
                data: {
                  rating: newAverageRating,
                }
              });
            }

            await tx.bookingHistory.create({
              data: {
                booking_id: booking.booking_id,
                status: 'Rating dan Ulasan Diberikan',
                reason: null
              }
            });
          }

          return updatedBooking;
        });

        await prisma.userNotification.create({
          data: {
            user_id: userId,
            title: 'Pesanan Selesai',
            message: `Pesanan #${orderId} telah dikonfirmasi selesai${rating ? ` dengan rating ${rating} bintang` : ''}. Terima kasih telah menggunakan layanan kami!`,
            type: 'completion',
            order_id: booking.booking_id
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Pesanan telah dikonfirmasi selesai'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Action tidak valid' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[User Orders API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'dibatalkan':
      return 'bg-red-100 text-red-800';
    case 'diproses':
      return 'bg-blue-100 text-blue-800';
    case 'selesai':
      return 'bg-green-100 text-green-800';
    case 'menunggu pembayaran':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}