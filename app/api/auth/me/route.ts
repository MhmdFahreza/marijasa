// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyToken,
  getSession,
  refreshAccessToken,
  updateSessionActivity,
} from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

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
    console.log("[Auth Me] 🔍 Processing authentication check...");

    // FIRST: Check for NextAuth session (Google OAuth)
    try {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user?.email) {
        console.log("[Auth Me] NextAuth session found for:", nextAuthSession.user.email);
        
        // ALWAYS get fresh user data from database
        const user = await prisma.user.findUnique({
          where: { email: nextAuthSession.user.email.toLowerCase() },
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

        if (user && user.is_active) {
          console.log("[Auth Me] ✅ Returning fresh user data from database:", {
            name: user.name,
            email: user.email,
            hasAvatar: !!user.avatar,
            avatarType: user.avatar?.substring(0, 20) + "..."
          });
          
          return NextResponse.json({
            authenticated: true,
            user: {
              user_id: user.user_id,
              id: user.user_id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              // Avatar from database (base64 or default)
              avatar: user.avatar || "/profile.svg",
              role: user.role,
            },
          }, { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        } else {
          console.log("[Auth Me] ⚠️ User not found or inactive in database");
        }
      }
    } catch (error) {
      console.log("[Auth Me] NextAuth session check failed or not found (this is normal)");
    }

    // SECOND: Check custom JWT session
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    console.log("[Auth Me] Cookie status:", {
      hasSessionId: !!sessionId,
      sessionId: sessionId?.substring(0, 8) + "...",
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!sessionId) {
      console.log("[Auth Me] ❌ No session ID found");
      return NextResponse.json(
        { message: "No session found", authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log("[Auth Me] ❌ Session not found in Redis:", sessionId);
      console.log("[Auth Me] Clearing stale cookies");
      
      const response = NextResponse.json(
        { message: "Session expired", authenticated: false, user: null },
        { status: 401 }
      );
      
      clearAuthCookies(response);
      return response;
    }

    console.log("[Auth Me] ✅ Redis session found for user:", session.userId);

    let currentAccessToken = accessToken;
    let tokenWasRefreshed = false;

    // Handle token refresh scenarios
    if (!accessToken && refreshToken) {
      console.log("[Auth Me] 🔄 No access token, attempting refresh");
      
      const refreshResult = await refreshAccessToken(sessionId, refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        currentAccessToken = refreshResult.accessToken;
        tokenWasRefreshed = true;
        console.log("[Auth Me] ✅ Access token created from refresh token");
      } else {
        console.log("[Auth Me] ❌ Refresh failed:", refreshResult.error);
        const response = NextResponse.json(
          { message: "Session expired", authenticated: false, user: null },
          { status: 401 }
        );
        
        clearAuthCookies(response);
        return response;
      }
    } else if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        console.log("[Auth Me] 🔄 Access token invalid or expired, attempting refresh");
        
        if (refreshToken) {
          const refreshResult = await refreshAccessToken(sessionId, refreshToken);
          
          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
            tokenWasRefreshed = true;
            console.log("[Auth Me] ✅ Access token refreshed successfully");
          } else {
            console.log("[Auth Me] ❌ Refresh failed:", refreshResult.error);
            const response = NextResponse.json(
              { message: "Session expired", authenticated: false, user: null },
              { status: 401 }
            );
            
            clearAuthCookies(response);
            return response;
          }
        } else {
          console.log("[Auth Me] ❌ No refresh token available");
          const response = NextResponse.json(
            { message: "Token expired", authenticated: false, user: null },
            { status: 401 }
          );
          
          clearAuthCookies(response);
          return response;
        }
      }
    } else {
      console.log("[Auth Me] ❌ No tokens found");
      const response = NextResponse.json(
        { message: "No tokens found", authenticated: false, user: null },
        { status: 401 }
      );
      
      clearAuthCookies(response);
      return response;
    }

    // ALWAYS get FRESH user data from database
    console.log("[Auth Me] 📊 Fetching FRESH user data from database...");
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
      console.log("[Auth Me] ❌ User not found or inactive in database");
      const response = NextResponse.json(
        { message: "User not found or inactive", authenticated: false, user: null },
        { status: 404 }
      );
      
      clearAuthCookies(response);
      return response;
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log("[Auth Me] ✅ Authentication successful with FRESH data:", {
      email: user.email,
      name: user.name,
      hasAvatar: !!user.avatar,
      avatarType: user.avatar?.substring(0, 20) + "..."
    });

    // Prepare response with FRESH database data
    const responseData = {
      authenticated: true,
      user: {
        user_id: user.user_id,
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        // Avatar from database (base64 or default)
        avatar: user.avatar || "/profile.svg",
        role: user.role,
      },
      refreshed: tokenWasRefreshed,
    };

    const response = NextResponse.json(responseData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    // If token was refreshed, set new access token cookie
    if (tokenWasRefreshed && currentAccessToken) {
      response.cookies.set("access_token", currentAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });
      console.log("[Auth Me] ✅ New access token cookie set");
    }

    return response;
  } catch (error) {
    console.error("[Auth Me] ❌ Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error", authenticated: false, user: null },
      { status: 500 }
    );
  }
}