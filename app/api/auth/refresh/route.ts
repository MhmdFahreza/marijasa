// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  refreshAccessToken,
  verifyToken,
  getSession,
} from "@/app/components/lib/token-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    console.log("[Refresh] Starting token refresh process...");
    
    // Get tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    console.log("[Refresh] Cookies present:", {
      sessionId: !!sessionId,
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
    });

    if (!sessionId || !refreshToken) {
      console.error("[Refresh] Missing required cookies");
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify session still exists
    const session = await getSession(sessionId);
    if (!session) {
      console.error("[Refresh] Session not found:", sessionId);
      const response = NextResponse.json(
        { success: false, message: "Sesi telah kedaluwarsa" },
        { status: 401 }
      );

      response.cookies.delete("session_id");
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");

      return response;
    }

    console.log("[Refresh] Session found for user:", session.userId);

    // Refresh access token - only need refresh token, not old access token
    const refreshResult = await refreshAccessToken(sessionId, refreshToken);

    if (!refreshResult.success || !refreshResult.accessToken) {
      console.error("[Refresh] Failed to refresh:", refreshResult.error);
      const response = NextResponse.json(
        { success: false, message: refreshResult.error || "Gagal refresh token" },
        { status: 401 }
      );

      response.cookies.delete("session_id");
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");

      return response;
    }

    // Verify new access token
    const newTokenPayload = verifyToken(refreshResult.accessToken);
    if (!newTokenPayload) {
      console.error("[Refresh] New token verification failed");
      return NextResponse.json(
        { success: false, message: "Token baru tidak valid" },
        { status: 500 }
      );
    }

    console.log("[Refresh] Successfully refreshed token for user:", newTokenPayload.userId);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Token berhasil diperbarui",
        user: {
          id: newTokenPayload.userId,
          email: newTokenPayload.email,
          role: newTokenPayload.role,
        },
      },
      { status: 200 }
    );

    // Update access token cookie with new token
    response.cookies.set("access_token", refreshResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Refresh] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}