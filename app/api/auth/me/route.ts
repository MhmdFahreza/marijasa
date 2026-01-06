// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import {
  verifyToken,
  getSession,
  getAccessToken,
  getRefreshToken,
  updateSessionActivity,
  refreshAccessToken,
  deleteSession,
  deleteTokens,
} from "@/app/components/lib/token-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { authenticated: false, message: "Tidak ada sesi aktif" },
        { status: 401 }
      );
    }

    // Check if session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      // Session expired or doesn't exist
      const response = NextResponse.json(
        { authenticated: false, message: "Sesi telah kedaluwarsa" },
        { status: 401 }
      );

      // Clear cookies
      response.cookies.delete("session_id");
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");

      return response;
    }

    // Verify access token
    if (!accessToken) {
      return NextResponse.json(
        { authenticated: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    let tokenPayload = verifyToken(accessToken);

    // If access token expired, try to refresh it
    if (!tokenPayload && refreshToken) {
      console.log(`[Auth] Access token expired, attempting refresh for session: ${sessionId}`);

      const refreshResult = await refreshAccessToken(accessToken, refreshToken);

      if (refreshResult.success && refreshResult.accessToken) {
        // Use new access token
        tokenPayload = verifyToken(refreshResult.accessToken);

        if (tokenPayload) {
          // Update cookie with new access token
          const response = await createAuthResponse(tokenPayload.userId, sessionId);

          // Set new access token cookie
          response.cookies.set("access_token", refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 1 hour
            path: "/",
          });

          return response;
        }
      } else {
        // Refresh failed, delete session and tokens
        await deleteSession(sessionId);
        await deleteTokens(sessionId);

        const response = NextResponse.json(
          { authenticated: false, message: "Sesi telah kedaluwarsa" },
          { status: 401 }
        );

        response.cookies.delete("session_id");
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");

        return response;
      }
    }

    if (!tokenPayload) {
      return NextResponse.json(
        { authenticated: false, message: "Token tidak valid" },
        { status: 401 }
      );
    }

    // Verify token belongs to this session
    if (tokenPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { authenticated: false, message: "Token tidak sesuai dengan sesi" },
        { status: 401 }
      );
    }

    // Verify access token exists in Redis
    const storedAccessToken = await getAccessToken(sessionId);
    if (!storedAccessToken || storedAccessToken !== accessToken) {
      return NextResponse.json(
        { authenticated: false, message: "Token tidak valid atau sudah kedaluwarsa" },
        { status: 401 }
      );
    }

    // Update session last activity
    await updateSessionActivity(sessionId);

    // Return user data
    return await createAuthResponse(tokenPayload.userId, sessionId);
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { authenticated: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// Helper function to create authenticated response
async function createAuthResponse(userId: string, sessionId: string) {
  // Get user from database
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      email_verified: true,
      is_active: true,
    },
  });

  if (!user) {
    const response = NextResponse.json(
      { authenticated: false, message: "User tidak ditemukan" },
      { status: 404 }
    );

    // Delete session and tokens
    await deleteSession(sessionId);
    await deleteTokens(sessionId);

    response.cookies.delete("session_id");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    return response;
  }

  if (!user.is_active) {
    const response = NextResponse.json(
      { authenticated: false, message: "Akun tidak aktif" },
      { status: 403 }
    );

    // Delete session and tokens
    await deleteSession(sessionId);
    await deleteTokens(sessionId);

    response.cookies.delete("session_id");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    return response;
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || "/profile.svg",
        role: user.role,
        emailVerified: user.email_verified,
      },
    },
    { status: 200 }
  );
}