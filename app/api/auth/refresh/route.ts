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
    // Get tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!sessionId || !accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify session still exists
    const session = await getSession(sessionId);
    if (!session) {
      const response = NextResponse.json(
        { success: false, message: "Sesi telah kedaluwarsa" },
        { status: 401 }
      );

      response.cookies.delete("session_id");
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");

      return response;
    }

    // Refresh access token
    const refreshResult = await refreshAccessToken(accessToken, refreshToken);

    if (!refreshResult.success || !refreshResult.accessToken) {
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
      return NextResponse.json(
        { success: false, message: "Token baru tidak valid" },
        { status: 500 }
      );
    }

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

    console.log(`[Refresh] Access token refreshed for session: ${sessionId}`);

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}