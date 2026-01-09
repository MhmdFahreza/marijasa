// app/api/admin/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import redis, { isRedisAvailable } from "@/app/components/lib/redis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-min-32-characters-long"
);

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("admin_session_id")?.value;
    const accessToken = request.cookies.get("admin_access_token")?.value;

    console.log("[Admin Verify] Verifying session:", { 
      hasSessionId: !!sessionId, 
      hasAccessToken: !!accessToken 
    });

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session tidak ditemukan",
          errorType: "NO_SESSION",
        },
        { status: 401 }
      );
    }

    // Check if session exists in Redis first
    if (isRedisAvailable() && redis) {
      try {
        const sessionData = await redis.get(`admin_session:${sessionId}`);

        if (!sessionData) {
          console.log("[Admin Verify] Session not found in Redis:", sessionId);
          return NextResponse.json(
            {
              success: false,
              error: "Session telah kedaluwarsa",
              errorType: "SESSION_EXPIRED",
            },
            { status: 401 }
          );
        }

        // Parse session data - handle both string and object
        let session;
        if (typeof sessionData === 'string') {
          session = JSON.parse(sessionData);
        } else if (typeof sessionData === 'object' && sessionData !== null) {
          session = sessionData;
        } else {
          console.error("[Admin Verify] Invalid session data type:", typeof sessionData);
          throw new Error("Invalid session data format");
        }

        // Check if access token exists in Redis
        const storedAccessToken = await redis.get(`admin_access_token:${sessionId}`);

        // Convert to string if needed
        const storedTokenStr = typeof storedAccessToken === 'string' 
          ? storedAccessToken 
          : String(storedAccessToken);

        if (!storedAccessToken || storedTokenStr !== accessToken) {
          console.log("[Admin Verify] Access token mismatch or expired");
          return NextResponse.json(
            {
              success: false,
              error: "Token tidak valid atau kedaluwarsa",
              errorType: "TOKEN_EXPIRED",
              shouldRefresh: true,
            },
            { status: 401 }
          );
        }

        // Verify access token JWT
        try {
          const { payload } = await jwtVerify(accessToken, JWT_SECRET);

          if (payload.type !== "access") {
            throw new Error("Invalid token type");
          }

          // Update last access time
          session.lastAccess = new Date().toISOString();
          await redis.setex(
            `admin_session:${sessionId}`,
            30 * 24 * 60 * 60, // Reset to 30 days
            JSON.stringify(session)
          );

          console.log("[Admin Verify] Verification successful for:", session.email);

          return NextResponse.json(
            {
              success: true,
              admin: {
                id: session.adminId,
                email: session.email,
                name: session.name,
              },
            },
            { status: 200 }
          );
        } catch (jwtError) {
          console.log("[Admin Verify] JWT verification failed:", jwtError);
          return NextResponse.json(
            {
              success: false,
              error: "Token tidak valid atau kedaluwarsa",
              errorType: "TOKEN_EXPIRED",
              shouldRefresh: true,
            },
            { status: 401 }
          );
        }
      } catch (redisError) {
        console.error("[Admin Verify] Redis error:", redisError);
        // Fall back to JWT verification only if Redis fails
      }
    }

    // Fallback: Verify using JWT only (if Redis not available)
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Access token tidak ditemukan",
          errorType: "NO_ACCESS_TOKEN",
          shouldRefresh: true,
        },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);

      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }

      console.log("[Admin Verify] Verification successful (JWT only) for:", payload.email);

      return NextResponse.json(
        {
          success: true,
          admin: {
            id: payload.adminId,
            email: payload.email,
          },
        },
        { status: 200 }
      );
    } catch (tokenError) {
      console.log("[Admin Verify] JWT verification failed:", tokenError);
      return NextResponse.json(
        {
          success: false,
          error: "Token tidak valid atau kedaluwarsa",
          errorType: "TOKEN_EXPIRED",
          shouldRefresh: true,
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("[Admin Verify] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat verifikasi",
        errorType: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}