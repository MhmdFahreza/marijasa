// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyToken,
  getSession,
  refreshAccessToken,
  updateSessionActivity,
} from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// Helper to clear cookies
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

export async function GET(request: NextRequest) {
  try {
    // Get session ID and tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    console.log("[Auth Me] Request received", {
      hasSessionId: !!sessionId,
      sessionId: sessionId?.substring(0, 8) + "...",
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!sessionId) {
      console.log("[Auth Me] No session ID found");
      return NextResponse.json(
        { message: "No session found", authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log("[Auth Me] Session not found in Redis:", sessionId);
      console.log("[Auth Me] Clearing stale cookies");
      
      const response = NextResponse.json(
        { message: "Session expired", authenticated: false, user: null },
        { status: 401 }
      );
      
      clearAuthCookies(response);
      return response;
    }

    console.log("[Auth Me] Session found:", {
      sessionId: sessionId.substring(0, 8) + "...",
      userId: session.userId,
      email: session.email,
    });

    let currentAccessToken = accessToken;

    // Handle token refresh scenarios
    if (!accessToken && refreshToken) {
      // No access token but has refresh token
      console.log("[Auth Me] No access token, attempting refresh with refresh token");
      
      const refreshResult = await refreshAccessToken(sessionId, refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        currentAccessToken = refreshResult.accessToken;
        console.log("[Auth Me] Access token created from refresh token");
      } else {
        console.log("[Auth Me] Refresh failed:", refreshResult.error);
        const response = NextResponse.json(
          { message: "Session expired", authenticated: false, user: null },
          { status: 401 }
        );
        
        clearAuthCookies(response);
        return response;
      }
    } else if (accessToken) {
      // Verify access token
      const tokenPayload = verifyToken(accessToken);
      
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        console.log("[Auth Me] Access token invalid or expired, attempting refresh");
        
        // Access token expired, try to refresh
        if (refreshToken) {
          const refreshResult = await refreshAccessToken(sessionId, refreshToken);
          
          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
            console.log("[Auth Me] Access token refreshed successfully");
          } else {
            console.log("[Auth Me] Refresh failed:", refreshResult.error);
            const response = NextResponse.json(
              { message: "Session expired", authenticated: false, user: null },
              { status: 401 }
            );
            
            clearAuthCookies(response);
            return response;
          }
        } else {
          console.log("[Auth Me] No refresh token available");
          const response = NextResponse.json(
            { message: "Token expired", authenticated: false, user: null },
            { status: 401 }
          );
          
          clearAuthCookies(response);
          return response;
        }
      }
    } else {
      // No tokens at all
      console.log("[Auth Me] No tokens found");
      const response = NextResponse.json(
        { message: "No tokens found", authenticated: false, user: null },
        { status: 401 }
      );
      
      clearAuthCookies(response);
      return response;
    }

    // Get full user data from database
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      select: {
        user_id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      console.log("[Auth Me] User not found or inactive");
      const response = NextResponse.json(
        { message: "User not found or inactive", authenticated: false, user: null },
        { status: 404 }
      );
      
      clearAuthCookies(response);
      return response;
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log("[Auth Me] Authentication successful for:", user.email);

    // Prepare response
    const responseData = {
      authenticated: true,
      user: {
        user_id: user.user_id,
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || "/profile.svg",
        role: user.role,
      },
      refreshed: currentAccessToken !== accessToken,
    };

    const response = NextResponse.json(responseData, { status: 200 });

    // If token was refreshed, set new access token cookie
    if (currentAccessToken && currentAccessToken !== accessToken) {
      response.cookies.set("access_token", currentAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });
      console.log("[Auth Me] New access token cookie set");
    }

    return response;
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json(
      { message: "Internal server error", authenticated: false, user: null },
      { status: 500 }
    );
  }
}