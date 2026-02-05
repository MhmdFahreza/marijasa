// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  refreshAccessToken,
  verifyToken,
  getSession,
  updateSessionActivity,
} from "@/app/components/lib/token-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to clear all auth cookies
function clearAuthCookies(response: NextResponse) {
  const cookieOptions = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set("session_id", "", cookieOptions);
  response.cookies.set("access_token", "", cookieOptions);
  response.cookies.set("refresh_token", "", cookieOptions);
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Refresh] Starting token refresh process...");

    // Get tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    console.log("[Refresh] Cookies present:", {
      sessionId: !!sessionId,
      sessionIdValue: sessionId?.substring(0, 8) + "...",
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
    });

    // Must have session ID
    if (!sessionId) {
      console.error("[Refresh] Missing session ID");
      const response = NextResponse.json(
        { success: false, message: "Session tidak ditemukan" },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Must have refresh token
    if (!refreshToken) {
      console.error("[Refresh] Missing refresh token");
      const response = NextResponse.json(
        { success: false, message: "Refresh token tidak ditemukan" },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Verify session still exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.error("[Refresh] Session not found in Redis:", sessionId);
      const response = NextResponse.json(
        { success: false, message: "Sesi telah kedaluwarsa" },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    console.log("[Refresh] Session found for user:", session.userId);

    // Check if access token is still valid
    if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      if (tokenPayload && tokenPayload.sessionId === sessionId) {
        console.log("[Refresh] Access token still valid, extending session");
        
        // Update session activity
        await updateSessionActivity(sessionId);
        
        // Return success without creating new token
        return NextResponse.json(
          {
            success: true,
            message: "Token masih valid",
            user: {
              id: tokenPayload.userId,
              email: tokenPayload.email,
              role: tokenPayload.role,
            },
            tokenValid: true,
          },
          { status: 200 }
        );
      }
    }

    // Access token expired or invalid, refresh it
    console.log("[Refresh] Access token expired/invalid, refreshing...");
    
    const refreshResult = await refreshAccessToken(sessionId, refreshToken);

    if (!refreshResult.success || !refreshResult.accessToken) {
      console.error("[Refresh] Failed to refresh:", refreshResult.error);
      const response = NextResponse.json(
        { 
          success: false, 
          message: refreshResult.error || "Gagal refresh token",
          shouldLogout: true
        },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Verify new access token
    const newTokenPayload = verifyToken(refreshResult.accessToken);
    if (!newTokenPayload) {
      console.error("[Refresh] New token verification failed");
      const response = NextResponse.json(
        { success: false, message: "Token baru tidak valid" },
        { status: 500 }
      );
      clearAuthCookies(response);
      return response;
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log("[Refresh] ✅ Successfully refreshed token for user:", newTokenPayload.userId);

    // Create response with new token
    const response = NextResponse.json(
      {
        success: true,
        message: "Token berhasil diperbarui",
        user: {
          id: newTokenPayload.userId,
          email: newTokenPayload.email,
          role: newTokenPayload.role,
        },
        tokenRefreshed: true,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );

    // Set new access token cookie
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
    
    const response = NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
    
    // Don't clear cookies on server error - might be temporary
    return response;
  }
}

// Also support GET for simple token validation
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { valid: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { valid: false, message: "Session tidak valid" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { valid: false, message: "Token tidak valid", needsRefresh: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        valid: true, 
        user: {
          id: tokenPayload.userId,
          email: tokenPayload.email,
          role: tokenPayload.role,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Refresh GET] Error:", error);
    return NextResponse.json(
      { valid: false, message: "Server error" },
      { status: 500 }
    );
  }
}