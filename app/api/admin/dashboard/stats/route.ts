// app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getRedisClient } from "@/app/components/lib/redis";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

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

    // Get total registered users
    const totalUsers = await prisma.user.count({
      where: {
        is_active: true,
      },
    });

    // Get total mitra (active and verified)
    const totalMitra = await prisma.vendor.count({
      where: {
        status: 'ACTIVE',
        verified: true,
      },
    });

    // Get pending approval count
    const pendingApproval = await prisma.vendor.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get visitor stats from Redis
    let totalVisitors = 0;
    let activeVisitors = 0;

    try {
      const redis = await getRedisClient();
      
      // Get all visitor session keys
      const visitorKeys = await redis.keys('visitor:*');
      
      if (visitorKeys && Array.isArray(visitorKeys)) {
        totalVisitors = visitorKeys.length;

        // Count active visitors (sessions updated in last 5 minutes)
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        for (const key of visitorKeys) {
          try {
            const data = await redis.get(key);
            if (data && typeof data === 'string') {
              const visitorData = JSON.parse(data);
              if (visitorData.lastActivity && visitorData.lastActivity > fiveMinutesAgo) {
                activeVisitors++;
              }
            }
          } catch (parseError) {
            console.error('[Dashboard Stats] Parse error for key:', key, parseError);
          }
        }
      }
    } catch (redisError) {
      console.error('[Dashboard Stats] Redis error:', redisError);
      // Continue with 0 values if Redis fails
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalMitra,
        pendingApproval,
        totalVisitors,
        activeVisitors,
      },
    });
  } catch (error: any) {
    console.error("[Dashboard Stats] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}