// app/api/admin/dashboard/recent-activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getRedisClient } from "@/app/components/lib/redis";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

type RecentActivity = {
  id: string;
  type: 'user' | 'mitra' | 'admin' | 'anonymous';
  action: string;
  actor: string;
  actorEmail?: string;
  timestamp: string;
  details?: any;
};

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSessionId = request.cookies.get('admin_session_id')?.value;
    const adminAccessToken = request.cookies.get('admin_access_token')?.value;

    if (!adminSessionId || !adminAccessToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const activities: RecentActivity[] = [];

    // Get recent user registrations
    const recentUsers = await prisma.user.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 5,
      select: {
        user_id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `user_reg_${user.user_id}`,
        type: 'user',
        action: 'Mendaftar sebagai user baru',
        actor: user.name,
        actorEmail: user.email,
        timestamp: user.created_at.toISOString(),
      });
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        vendor: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    recentBookings.forEach(booking => {
      activities.push({
        id: `booking_${booking.booking_id}`,
        type: 'user',
        action: `Membuat pemesanan ${booking.booking_number}`,
        actor: booking.user.name,
        actorEmail: booking.user.email,
        timestamp: booking.created_at.toISOString(),
        details: {
          vendor: booking.vendor.name,
          category: booking.vendor.category,
          total: booking.total,
        },
      });
    });

    // Get recent booking status updates by mitra
    const recentMitraActivities = await prisma.booking.findMany({
      where: {
        updated_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'],
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 10,
      include: {
        vendor: {
          select: {
            name: true,
            email: true,
            category: true,
          },
        },
      },
    });

    recentMitraActivities.forEach(booking => {
      let action = '';
      switch(booking.status) {
        case 'CONFIRMED':
          action = 'Mengkonfirmasi pesanan';
          break;
        case 'IN_PROGRESS':
          action = 'Memulai pekerjaan';
          break;
        case 'COMPLETED':
          action = 'Menyelesaikan pekerjaan';
          break;
      }

      activities.push({
        id: `mitra_booking_${booking.booking_id}`,
        type: 'mitra',
        action: `${action} ${booking.booking_number}`,
        actor: booking.vendor.name,
        actorEmail: booking.vendor.email,
        timestamp: booking.updated_at.toISOString(),
        details: {
          category: booking.vendor.category,
          status: booking.status,
        },
      });
    });

    // Get recent mitra registrations
    const recentMitra = await prisma.vendor.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 5,
      select: {
        vendor_id: true,
        name: true,
        email: true,
        category: true,
        status: true,
        created_at: true,
      },
    });

    recentMitra.forEach(mitra => {
      activities.push({
        id: `mitra_reg_${mitra.vendor_id}`,
        type: 'mitra',
        action: mitra.status === 'PENDING' 
          ? 'Mengajukan pendaftaran mitra'
          : 'Terdaftar sebagai mitra',
        actor: mitra.name,
        actorEmail: mitra.email,
        timestamp: mitra.created_at.toISOString(),
        details: {
          category: mitra.category,
          status: mitra.status,
        },
      });
    });

    // Get recent profile updates (exclude newly created users)
    const recentUserUpdates = await prisma.$queryRaw<Array<{
      user_id: string;
      name: string;
      email: string;
      updated_at: Date;
    }>>`
      SELECT user_id, name, email, updated_at
      FROM users
      WHERE updated_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        AND updated_at != created_at
      ORDER BY updated_at DESC
      LIMIT 5
    `;

    recentUserUpdates.forEach(user => {
      activities.push({
        id: `user_update_${user.user_id}`,
        type: 'user',
        action: 'Memperbarui profil',
        actor: user.name,
        actorEmail: user.email,
        timestamp: user.updated_at.toISOString(),
      });
    });

    // Get anonymous activities from Redis
    try {
      const redis = await getRedisClient();
      const anonymousKeys = await redis.keys('activity:anonymous:recent:*');
      
      if (anonymousKeys && Array.isArray(anonymousKeys)) {
        for (const key of anonymousKeys.slice(0, 10)) {
          try {
            const data = await redis.get(key);
            if (data && typeof data === 'string') {
              const anonActivity = JSON.parse(data);
              activities.push({
                id: `anon_${key}`,
                type: 'anonymous',
                action: anonActivity.action || 'Mengunjungi website',
                actor: 'Anonymous User',
                timestamp: anonActivity.timestamp || new Date().toISOString(),
                details: anonActivity.details,
              });
            }
          } catch (parseError) {
            console.error('[Recent Activities] Parse error for key:', key, parseError);
          }
        }
      }
    } catch (redisError) {
      console.error('[Recent Activities] Redis error:', redisError);
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Take top 50 activities
    const topActivities = activities.slice(0, 50);

    return NextResponse.json({
      success: true,
      activities: topActivities,
    });
  } catch (error: any) {
    console.error("[Recent Activities] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}