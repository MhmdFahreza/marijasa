// app/api/admin/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import redis, { isRedisAvailable } from "@/app/components/lib/redis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-min-32-characters-long"
);

const ACCESS_TOKEN_EXPIRES = 60 * 60; // 1 hour in seconds
const SESSION_EXPIRES = 30 * 24 * 60 * 60; // 30 days in seconds

// Generate JWT token
async function generateToken(
  payload: any,
  expiresIn: number
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(JWT_SECRET);
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("admin_session_id")?.value;
    const refreshToken = request.cookies.get("admin_refresh_token")?.value;

    console.log("[Admin Refresh] Attempting token refresh for session:", sessionId);

    if (!sessionId || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Refresh token tidak ditemukan",
          errorType: "NO_REFRESH_TOKEN",
        },
        { status: 401 }
      );
    }

    // Verify refresh token JWT
    let payload;
    try {
      const verified = await jwtVerify(refreshToken, JWT_SECRET);
      payload = verified.payload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      if (payload.sessionId !== sessionId) {
        throw new Error("Session mismatch");
      }
    } catch (tokenError) {
      console.error("[Admin Refresh] Invalid refresh token:", tokenError);
      return NextResponse.json(
        {
          success: false,
          error: "Refresh token tidak valid atau kedaluwarsa",
          errorType: "INVALID_REFRESH_TOKEN",
        },
        { status: 401 }
      );
    }

    // Check session and stored tokens in Redis if available
    if (isRedisAvailable() && redis) {
      try {
        // Check if session exists
        const sessionData = await redis.get(`admin_session:${sessionId}`);

        if (!sessionData) {
          console.log("[Admin Refresh] Session not found in Redis");
          return NextResponse.json(
            {
              success: false,
              error: "Session telah kedaluwarsa",
              errorType: "SESSION_EXPIRED",
            },
            { status: 401 }
          );
        }

        // Verify stored refresh token matches
        const storedRefreshToken = await redis.get(`admin_refresh_token:${sessionId}`);
        
        // Convert to string if needed
        const storedRefreshTokenStr = typeof storedRefreshToken === 'string'
          ? storedRefreshToken
          : String(storedRefreshToken);

        if (storedRefreshTokenStr !== refreshToken) {
          console.log("[Admin Refresh] Refresh token mismatch");
          return NextResponse.json(
            {
              success: false,
              error: "Refresh token tidak valid",
              errorType: "INVALID_REFRESH_TOKEN",
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
          console.error("[Admin Refresh] Invalid session data type:", typeof sessionData);
          throw new Error("Invalid session data format");
        }

        // Generate new access token
        const newAccessToken = await generateToken(
          {
            adminId: session.adminId,
            email: session.email,
            type: "access",
          },
          ACCESS_TOKEN_EXPIRES
        );

        // Update session last access time
        session.lastAccess = new Date().toISOString();
        await redis.setex(
          `admin_session:${sessionId}`,
          SESSION_EXPIRES,
          JSON.stringify(session)
        );

        // Store new access token in Redis
        await redis.setex(
          `admin_access_token:${sessionId}`,
          ACCESS_TOKEN_EXPIRES,
          newAccessToken
        );

        console.log("[Admin Refresh] Token refreshed successfully for:", session.email);

        // Prepare response
        const response = NextResponse.json(
          {
            success: true,
            message: "Token berhasil diperbarui",
            admin: {
              id: session.adminId,
              email: session.email,
              name: session.name,
            },
          },
          { status: 200 }
        );

        // Set new access token cookie
        response.cookies.set("admin_access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_TOKEN_EXPIRES,
        });

        return response;
      } catch (redisError) {
        console.error("[Admin Refresh] Redis error:", redisError);
        // Continue with JWT-only refresh if Redis fails
      }
    }

    // Fallback: Generate new access token using JWT payload only
    const newAccessToken = await generateToken(
      {
        adminId: payload.adminId,
        email: payload.email,
        type: "access",
      },
      ACCESS_TOKEN_EXPIRES
    );

    console.log("[Admin Refresh] Token refreshed (JWT only) for:", payload.email);

    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        message: "Token berhasil diperbarui",
      },
      { status: 200 }
    );

    // Set new access token cookie
    response.cookies.set("admin_access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_EXPIRES,
    });

    return response;
  } catch (error) {
    console.error("[Admin Refresh] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat refresh token",
        errorType: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}