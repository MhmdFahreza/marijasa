// app/api/auth/google/set-cookies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";

// This endpoint is called after Google OAuth to set cookies properly
export async function GET(request: NextRequest) {
  try {
    console.log("[Google Set Cookies] Request received");
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("[Google Set Cookies] No session found");
      return NextResponse.redirect(new URL("/login?error=NO_SESSION", request.url));
    }

    // Get session data from session
    const sessionId = (session.user as any).sessionId;
    const accessToken = (session.user as any).accessToken;
    const refreshToken = (session.user as any).refreshToken;

    console.log("[Google Set Cookies] Session data:", {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    if (!sessionId || !accessToken || !refreshToken) {
      console.error("[Google Set Cookies] Missing session data");
      return NextResponse.redirect(new URL("/login?error=SESSION_ERROR", request.url));
    }

    // Create response with redirect to home
    const response = NextResponse.redirect(new URL("/", request.url));

    // Set cookies
    // Session ID cookie (30 days)
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Access Token cookie (1 hour)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    // Refresh Token cookie (30 days)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    console.log(`[Google Set Cookies] Cookies set successfully for session: ${sessionId}`);

    return response;
  } catch (error) {
    console.error("[Google Set Cookies] Error:", error);
    return NextResponse.redirect(new URL("/login?error=CALLBACK_ERROR", request.url));
  }
}