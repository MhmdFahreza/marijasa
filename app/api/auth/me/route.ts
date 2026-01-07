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
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get session ID and tokens from cookies
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    console.log("[Auth Me] Request received", {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!sessionId) {
      console.log("[Auth Me] No session ID found");
      return NextResponse.json(
        { message: "No session found", authenticated: false },
        { status: 401 }
      );
    }

    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log("[Auth Me] Session not found in Redis:", sessionId);
      return NextResponse.json(
        { message: "Session expired", authenticated: false },
        { status: 401 }
      );
    }

    console.log("[Auth Me] Session found:", {
      sessionId,
      userId: session.userId,
      email: session.email,
    });

    let currentAccessToken = accessToken;

    // Verify access token
    if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        console.log("[Auth Me] Access token invalid or expired, attempting refresh");
        
        // Access token expired, try to refresh
        if (refreshToken) {
          const refreshResult = await refreshAccessToken(accessToken, refreshToken);
          
          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
            console.log("[Auth Me] Access token refreshed successfully");
            
            // Get user data
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
              return NextResponse.json(
                { message: "User not found or inactive", authenticated: false },
                { status: 404 }
              );
            }

            // Update session activity
            await updateSessionActivity(sessionId);

            // Return response with new access token
            const response = NextResponse.json(
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
            console.log("[Auth Me] Refresh token failed");
            // Refresh failed, session is invalid
            return NextResponse.json(
              { message: "Session expired", authenticated: false },
              { status: 401 }
            );
          }
        } else {
          console.log("[Auth Me] No refresh token available");
          return NextResponse.json(
            { message: "Token expired", authenticated: false },
            { status: 401 }
          );
        }
      }

      // Verify token exists in Redis
      const storedToken = await getAccessToken(sessionId);
      if (!storedToken || storedToken !== accessToken) {
        console.log("[Auth Me] Token mismatch in Redis");
        return NextResponse.json(
          { message: "Invalid token", authenticated: false },
          { status: 401 }
        );
      }
    } else if (refreshToken) {
      console.log("[Auth Me] No access token but has refresh token, attempting refresh");
      
      // No access token but has refresh token, try to refresh
      const refreshResult = await refreshAccessToken("", refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        currentAccessToken = refreshResult.accessToken;
        console.log("[Auth Me] Access token created from refresh token");
        
        // Get user data
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
          return NextResponse.json(
            { message: "User not found or inactive", authenticated: false },
            { status: 404 }
          );
        }

        // Update session activity
        await updateSessionActivity(sessionId);

        // Return response with new access token
        const response = NextResponse.json(
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
        console.log("[Auth Me] Refresh token failed");
        return NextResponse.json(
          { message: "Session expired", authenticated: false },
          { status: 401 }
        );
      }
    } else {
      console.log("[Auth Me] No tokens found");
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
      console.log("[Auth Me] User not found or inactive");
      return NextResponse.json(
        { message: "User not found or inactive", authenticated: false },
        { status: 404 }
      );
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log("[Auth Me] Authentication successful for:", user.email);

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