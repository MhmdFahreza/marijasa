// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyToken,
  getSession,
  getAccessToken,
  refreshAccessToken,
  updateSessionActivity,
} from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get session ID and tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: "No session found", authenticated: false },
        { status: 401 }
      );
    }

    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { message: "Session expired", authenticated: false },
        { status: 401 }
      );
    }

    let currentAccessToken = accessToken;

    // Verify access token
    if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        // Access token expired, try to refresh
        if (refreshToken) {
          const refreshResult = await refreshAccessToken(accessToken, refreshToken);
          
          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
            
            // Update cookie with new access token
            const response = NextResponse.json(
              {
                authenticated: true,
                user: {
                  id: session.userId,
                  email: session.email,
                  role: session.role,
                },
                refreshed: true,
              },
              { status: 200 }
            );

            response.cookies.set("access_token", refreshResult.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60, // 1 hour
              path: "/",
            });

            return response;
          } else {
            // Refresh failed, session is invalid
            return NextResponse.json(
              { message: "Session expired", authenticated: false },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { message: "Token expired", authenticated: false },
            { status: 401 }
          );
        }
      }

      // Verify token exists in Redis
      const storedToken = await getAccessToken(sessionId);
      if (!storedToken || storedToken !== accessToken) {
        return NextResponse.json(
          { message: "Invalid token", authenticated: false },
          { status: 401 }
        );
      }
    } else if (refreshToken) {
      // No access token but has refresh token, try to refresh
      const refreshResult = await refreshAccessToken("", refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        currentAccessToken = refreshResult.accessToken;
        
        // Update cookie with new access token
        const response = NextResponse.json(
          {
            authenticated: true,
            user: {
              id: session.userId,
              email: session.email,
              role: session.role,
            },
            refreshed: true,
          },
          { status: 200 }
        );

        response.cookies.set("access_token", refreshResult.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
          path: "/",
        });

        return response;
      } else {
        return NextResponse.json(
          { message: "Session expired", authenticated: false },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "No tokens found", authenticated: false },
        { status: 401 }
      );
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
      return NextResponse.json(
        { message: "User not found or inactive", authenticated: false },
        { status: 404 }
      );
    }

    // Update session activity
    await updateSessionActivity(sessionId);

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
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json(
      { message: "Internal server error", authenticated: false },
      { status: 500 }
    );
  }
}