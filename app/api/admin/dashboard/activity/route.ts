// app/api/admin/dashboard/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getRedisClient } from "@/app/components/lib/redis";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

type ActivityData = {
  date: string;
  users: number;
  mitra: number;
  anonymous: number;
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // today, week, month

    let startDate: Date;
    let intervals: number;
    let groupBy: 'hour' | 'day';

    const now = new Date();

    if (period === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      intervals = 24; // 24 hours
      groupBy = 'hour';
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6); // Last 7 days
      startDate.setHours(0, 0, 0, 0);
      intervals = 7;
      groupBy = 'day';
    } else { // month
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29); // Last 30 days
      startDate.setHours(0, 0, 0, 0);
      intervals = 30;
      groupBy = 'day';
    }

    // Initialize activity arrays
    const userActivity: ActivityData[] = [];
    const mitraActivity: ActivityData[] = [];

    // Get Redis client for anonymous tracking
    const redis = await getRedisClient();

    for (let i = 0; i < intervals; i++) {
      const intervalDate = new Date(startDate);
      
      if (groupBy === 'hour') {
        intervalDate.setHours(i);
      } else {
        intervalDate.setDate(intervalDate.getDate() + i);
      }

      const nextInterval = new Date(intervalDate);
      if (groupBy === 'hour') {
        nextInterval.setHours(nextInterval.getHours() + 1);
      } else {
        nextInterval.setDate(nextInterval.getDate() + 1);
      }

      // Count user activities (bookings, profile updates, etc.)
      const [bookingsCount, userUpdatesCount] = await Promise.all([
        prisma.booking.count({
          where: {
            created_at: {
              gte: intervalDate,
              lt: nextInterval,
            },
          },
        }),
        prisma.user.count({
          where: {
            updated_at: {
              gte: intervalDate,
              lt: nextInterval,
            },
          },
        }),
      ]);

      const userActivityCount = bookingsCount + userUpdatesCount;

      // Count mitra activities (accepting bookings, profile updates, messages)
      const [mitraBookingsCount, mitraUpdatesCount, mitraMessagesCount] = await Promise.all([
        prisma.booking.count({
          where: {
            updated_at: {
              gte: intervalDate,
              lt: nextInterval,
            },
            status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
          },
        }),
        prisma.vendor.count({
          where: {
            updated_at: {
              gte: intervalDate,
              lt: nextInterval,
            },
          },
        }),
        prisma.message.count({
          where: {
            created_at: {
              gte: intervalDate,
              lt: nextInterval,
            },
            sender_type: 'mitra',
          },
        }),
      ]);

      const mitraActivityCount = mitraBookingsCount + mitraUpdatesCount + mitraMessagesCount;

      // Get anonymous visitor count from Redis
      let anonymousCount = 0;
      try {
        const activityKey = `activity:anonymous:${intervalDate.toISOString().split('T')[0]}:${groupBy === 'hour' ? intervalDate.getHours() : 'day'}`;
        const count = await redis.get(activityKey);
        anonymousCount = count ? parseInt(count as string) : 0;
      } catch (redisError) {
        console.error('[Dashboard Activity] Redis error:', redisError);
      }

      userActivity.push({
        date: intervalDate.toISOString(),
        users: userActivityCount,
        mitra: 0,
        anonymous: anonymousCount,
      });

      mitraActivity.push({
        date: intervalDate.toISOString(),
        users: 0,
        mitra: mitraActivityCount,
        anonymous: 0,
      });
    }

    return NextResponse.json({
      success: true,
      userActivity,
      mitraActivity,
    });
  } catch (error: any) {
    console.error("[Dashboard Activity] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}