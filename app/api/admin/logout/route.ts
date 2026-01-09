// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis, { isRedisAvailable } from "@/app/components/lib/redis";
import { getAdminSession } from "@/app/components/lib/redis-helpers";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("admin_session_id")?.value;

    console.log("[Admin Logout] Processing logout for session:", sessionId);

    // Delete session and tokens from Redis if available
    if (sessionId && isRedisAvailable() && redis) {
      try {
        // Get session using helper function
        const session = await getAdminSession(redis, sessionId);
        
        if (session && session.adminId) {
          // Delete all Redis keys related to this session
          await Promise.all([
            redis.del(`admin_session:${sessionId}`),
            redis.del(`admin_access_token:${sessionId}`),
            redis.del(`admin_refresh_token:${sessionId}`),
            redis.del(`admin_refresh:${session.adminId}:${sessionId}`),
          ]);
          
          console.log("[Admin Logout] Session and tokens deleted from Redis:", {
            sessionId,
            adminId: session.adminId,
            email: session.email,
          });
        } else {
          // Just delete the session keys without admin ID
          await Promise.all([
            redis.del(`admin_session:${sessionId}`),
            redis.del(`admin_access_token:${sessionId}`),
            redis.del(`admin_refresh_token:${sessionId}`),
          ]);
          
          console.log("[Admin Logout] Session deleted from Redis (no admin data found):", sessionId);
        }
      } catch (redisError) {
        console.error("[Admin Logout] Redis error:", redisError);
        // Continue even if Redis fails
      }
    }

    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout berhasil",
      },
      { status: 200 }
    );

    // Clear all admin cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0, // Expire immediately
    };

    response.cookies.set("admin_session_id", "", cookieOptions);
    response.cookies.set("admin_access_token", "", cookieOptions);
    response.cookies.set("admin_refresh_token", "", cookieOptions);

    console.log("[Admin Logout] Admin logged out successfully");

    return response;
  } catch (error) {
    console.error("[Admin Logout] Error:", error);
    
    // Even if there's an error, still clear cookies
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout berhasil",
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };

    response.cookies.set("admin_session_id", "", cookieOptions);
    response.cookies.set("admin_access_token", "", cookieOptions);
    response.cookies.set("admin_refresh_token", "", cookieOptions);

    return response;
  }
}