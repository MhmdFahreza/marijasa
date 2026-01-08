// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSession, deleteTokens } from "@/app/components/lib/token-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log("[Logout] 🚪 Processing logout request...");

    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;

    // Delete from Redis if session exists
    if (sessionId) {
      try {
        await deleteSession(sessionId);
        await deleteTokens(sessionId);
        console.log("[Logout] ✅ Session and tokens deleted from Redis:", sessionId);
      } catch (error) {
        console.error("[Logout] ⚠️ Error deleting from Redis:", error);
      }
    } else {
      console.log("[Logout] No session ID found in cookies");
    }

    // Check if there's a NextAuth session
    try {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession) {
        console.log("[Logout] NextAuth session detected, will be cleared");
      }
    } catch (error) {
      console.log("[Logout] No NextAuth session or error checking");
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

    // Define cookie clearing options - MUST match original cookie settings
    const secureCookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    const publicCookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    };

    // Clear ALL custom auth cookies
    console.log("[Logout] 🧹 Clearing all authentication cookies...");
    
    response.cookies.set("session_id", "", secureCookieOptions);
    response.cookies.set("access_token", "", secureCookieOptions);
    response.cookies.set("refresh_token", "", secureCookieOptions);

    // Clear NextAuth cookies (both development and production versions)
    // Development cookie
    response.cookies.set("next-auth.session-token", "", publicCookieOptions);
    
    // Production cookie (secure)
    if (process.env.NODE_ENV === "production") {
      response.cookies.set("__Secure-next-auth.session-token", "", {
        ...publicCookieOptions,
        secure: true,
      });
    }
    
    // CSRF tokens
    response.cookies.set("next-auth.csrf-token", "", publicCookieOptions);
    if (process.env.NODE_ENV === "production") {
      response.cookies.set("__Host-next-auth.csrf-token", "", {
        ...publicCookieOptions,
        secure: true,
      });
    }
    
    // Callback URL
    response.cookies.set("next-auth.callback-url", "", publicCookieOptions);

    console.log("[Logout] ✅ All cookies cleared successfully");

    return response;
  } catch (error) {
    console.error("[Logout] ❌ Unexpected error:", error);
    
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json(
      { success: true, message: "Logout completed with warnings" },
      { status: 200 }
    );

    // Clear all cookies regardless of error
    const secureCookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    const publicCookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    };

    console.log("[Logout] 🧹 Clearing cookies despite error...");
    
    response.cookies.set("session_id", "", secureCookieOptions);
    response.cookies.set("access_token", "", secureCookieOptions);
    response.cookies.set("refresh_token", "", secureCookieOptions);
    response.cookies.set("next-auth.session-token", "", publicCookieOptions);

    return response;
  }
}