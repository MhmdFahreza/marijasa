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
export const dynamic = "force-dynamic";

// Response headers for no caching
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

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

// Helper to create user response object
function createUserResponse(user: {
  user_id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
}) {
  return {
    user_id: user.user_id,
    id: user.user_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar || "/profile.svg",
    role: user.role,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("[Auth Me] 🔍 Processing authentication check...");

    // Get cookies early
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    const nextAuthToken = request.cookies.get("next-auth.session-token")?.value;

    console.log("[Auth Me] Cookie status:", {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasNextAuthToken: !!nextAuthToken,
      sessionIdPreview: sessionId
        ? sessionId.substring(0, 8) + "..."
        : "none",
    });

    // ============================================
    // STRATEGY 1: Check custom JWT session FIRST
    // (This is faster than getServerSession)
    // ============================================
    if (sessionId && (accessToken || refreshToken)) {
      console.log("[Auth Me] Checking custom JWT session...");

      // Verify session exists in Redis
      const session = await getSession(sessionId);

      if (session) {
        console.log("[Auth Me] ✅ Redis session found for user:", session.userId);

        let currentAccessToken = accessToken;
        let tokenWasRefreshed = false;

        // Handle token scenarios
        if (accessToken) {
          const tokenPayload = verifyToken(accessToken);

          if (tokenPayload && tokenPayload.sessionId === sessionId) {
            console.log("[Auth Me] ✅ Access token valid");
          } else if (refreshToken) {
            console.log("[Auth Me] 🔄 Access token invalid, refreshing...");

            const refreshResult = await refreshAccessToken(sessionId, refreshToken);

            if (refreshResult.success && refreshResult.accessToken) {
              currentAccessToken = refreshResult.accessToken;
              tokenWasRefreshed = true;
              console.log("[Auth Me] ✅ Access token refreshed");
            } else {
              console.log("[Auth Me] ❌ Refresh failed:", refreshResult.error);
              const response = NextResponse.json(
                { message: "Session expired", authenticated: false, user: null },
                { status: 401, headers: NO_CACHE_HEADERS }
              );
              clearAuthCookies(response);
              return response;
            }
          } else {
            console.log("[Auth Me] ❌ Token invalid and no refresh token");
            const response = NextResponse.json(
              { message: "Token expired", authenticated: false, user: null },
              { status: 401, headers: NO_CACHE_HEADERS }
            );
            clearAuthCookies(response);
            return response;
          }
        } else if (refreshToken) {
          console.log("[Auth Me] 🔄 No access token, using refresh token...");

          const refreshResult = await refreshAccessToken(sessionId, refreshToken);

          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
            tokenWasRefreshed = true;
            console.log("[Auth Me] ✅ Access token created from refresh token");
          } else {
            console.log("[Auth Me] ❌ Refresh failed:", refreshResult.error);
            const response = NextResponse.json(
              { message: "Session expired", authenticated: false, user: null },
              { status: 401, headers: NO_CACHE_HEADERS }
            );
            clearAuthCookies(response);
            return response;
          }
        }

        // Get fresh user data from database
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
          console.log("[Auth Me] ❌ User not found or inactive");
          const response = NextResponse.json(
            { message: "User not found or inactive", authenticated: false, user: null },
            { status: 404, headers: NO_CACHE_HEADERS }
          );
          clearAuthCookies(response);
          return response;
        }

        // Update session activity (fire and forget)
        updateSessionActivity(sessionId).catch(console.error);

        console.log(
          "[Auth Me] ✅ Authentication successful:",
          user.email,
          `(${Date.now() - startTime}ms)`
        );

        const response = NextResponse.json(
          {
            authenticated: true,
            user: createUserResponse(user),
            refreshed: tokenWasRefreshed,
            authMethod: "jwt",
          },
          { status: 200, headers: NO_CACHE_HEADERS }
        );

        // Set new access token if refreshed
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
      } else {
        console.log("[Auth Me] ⚠️ Session not found in Redis:", sessionId?.substring(0, 8));
        // Don't clear cookies yet - fall through to NextAuth check
      }
    }

    // ============================================
    // STRATEGY 2: Check NextAuth session (Google OAuth)
    // ============================================
    if (nextAuthToken) {
      try {
        console.log("[Auth Me] Checking NextAuth session...");

        const nextAuthSession = await getServerSession(authOptions);

        if (nextAuthSession?.user?.email) {
          console.log(
            "[Auth Me] NextAuth session found for:",
            nextAuthSession.user.email
          );

          // Get fresh user data from database
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
            console.log(
              "[Auth Me] ✅ NextAuth user found:",
              user.email,
              `(${Date.now() - startTime}ms)`
            );

            // ✅ Also try to set custom cookies if NextAuth session has token data
            const sessionUser = nextAuthSession.user as any;
            const response = NextResponse.json(
              {
                authenticated: true,
                user: createUserResponse(user),
                authMethod: "nextauth",
              },
              { status: 200, headers: NO_CACHE_HEADERS }
            );

            // If NextAuth session has custom session data but cookies are missing,
            // set them now
            if (sessionUser.sessionId && !sessionId) {
              response.cookies.set("session_id", sessionUser.sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
              });
            }
            if (sessionUser.accessToken && !accessToken) {
              response.cookies.set("access_token", sessionUser.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60,
                path: "/",
              });
            }
            if (sessionUser.refreshToken && !refreshToken) {
              response.cookies.set("refresh_token", sessionUser.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
              });
            }

            return response;
          } else {
            console.log(
              "[Auth Me] ⚠️ NextAuth user not found or inactive in database"
            );
          }
        }
      } catch (error) {
        console.log("[Auth Me] NextAuth session check failed:", error);
      }
    }

    // ============================================
    // NO VALID SESSION FOUND
    // ============================================
    console.log("[Auth Me] ❌ No valid session found");

    const response = NextResponse.json(
      { message: "No session found", authenticated: false, user: null },
      { status: 401, headers: NO_CACHE_HEADERS }
    );

    // Only clear custom cookies if they exist but are invalid
    if (sessionId || accessToken || refreshToken) {
      clearAuthCookies(response);
    }

    return response;
  } catch (error) {
    console.error("[Auth Me] ❌ Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error", authenticated: false, user: null },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}