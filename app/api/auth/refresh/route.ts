// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  refreshAccessToken,
  verifyToken,
  getSession,
  updateSessionActivity,
} from "@/app/components/lib/token-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    console.log("[Refresh] Cookies present:", {
      sessionId: !!sessionId,
      sessionIdValue: sessionId ? sessionId.substring(0, 8) + "..." : "none",
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
    });

    // ✅ CRITICAL FIX: Better handling when no cookies
    if (!sessionId || !refreshToken) {
      const nextAuthToken = request.cookies.get("next-auth.session-token")?.value;

      if (nextAuthToken) {
        console.log("[Refresh] No custom cookies, checking NextAuth...");

        try {
          const nextAuthSession = await getServerSession(authOptions);

          if (nextAuthSession?.user?.email) {
            const sessionUser = nextAuthSession.user as any;

            if (
              sessionUser.sessionId &&
              sessionUser.accessToken &&
              sessionUser.refreshToken
            ) {
              console.log("[Refresh] ✅ Tokens found in NextAuth session");

              const response = NextResponse.json(
                {
                  success: true,
                  message: "Session synced from NextAuth",
                  tokenRefreshed: true,
                },
                { status: 200 }
              );

              response.cookies.set("session_id", sessionUser.sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
              });

              response.cookies.set("access_token", sessionUser.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60,
                path: "/",
              });

              response.cookies.set("refresh_token", sessionUser.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
              });

              return response;
            }
          }
        } catch (error) {
          console.log("[Refresh] NextAuth session check failed:", error);
        }
      }

      // ✅ Return proper error without cookies
      console.log("[Refresh] ❌ No session ID and no NextAuth fallback");
      return NextResponse.json(
        { 
          success: false, 
          message: "No active session found",
          shouldLogout: true 
        },
        { status: 401 }
      );
    }

    // Verify session exists
    const session = await getSession(sessionId);
    if (!session) {
      console.error("[Refresh] Session not found in Redis");
      const response = NextResponse.json(
        { success: false, message: "Session expired", shouldLogout: true },
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
        console.log("[Refresh] Access token still valid");
        await updateSessionActivity(sessionId);

        return NextResponse.json(
          {
            success: true,
            message: "Token still valid",
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

    // Refresh token
    console.log("[Refresh] Refreshing access token...");

    const refreshResult = await refreshAccessToken(sessionId, refreshToken);

    if (!refreshResult.success || !refreshResult.accessToken) {
      console.error("[Refresh] Failed to refresh:", refreshResult.error);
      const response = NextResponse.json(
        {
          success: false,
          message: refreshResult.error || "Failed to refresh token",
          shouldLogout: true,
        },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    const newTokenPayload = verifyToken(refreshResult.accessToken);
    if (!newTokenPayload) {
      console.error("[Refresh] New token verification failed");
      const response = NextResponse.json(
        { success: false, message: "Token validation failed", shouldLogout: true },
        { status: 500 }
      );
      clearAuthCookies(response);
      return response;
    }

    await updateSessionActivity(sessionId);

    console.log("[Refresh] ✅ Token refreshed successfully");

    const response = NextResponse.json(
      {
        success: true,
        message: "Token refreshed",
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
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );

    response.cookies.set("access_token", refreshResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Refresh] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", shouldLogout: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { valid: false, message: "No tokens found" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { valid: false, message: "Session invalid" },
        { status: 401 }
      );
    }

    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { valid: false, message: "Token invalid", needsRefresh: true },
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
        },
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