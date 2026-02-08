// app/api/auth/google/set-cookies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";

// ============================================
// PRODUCTION-SAFE: Get the correct base URL
// On Vercel, request.url might use internal hostname.
// Use NEXTAUTH_URL or VERCEL_URL to build the correct redirect.
// ============================================
function getBaseUrl(requestUrl: string): string {
  // 1. Explicit NEXTAUTH_URL (should always be set in Vercel env vars)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // 2. Vercel auto-sets VERCEL_URL (without protocol)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. NEXT_PUBLIC_APP_URL as fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 4. Extract from request URL
  try {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

// This endpoint is called after Google OAuth to set cookies properly
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request.url);

  try {
    console.log("[Google Set Cookies] Request received");
    console.log("[Google Set Cookies] Base URL:", baseUrl);

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("[Google Set Cookies] No session found");
      return NextResponse.redirect(new URL("/login?error=NO_SESSION", baseUrl));
    }

    // Get session data from NextAuth session
    const sessionId = (session.user as any).sessionId;
    const accessToken = (session.user as any).accessToken;
    const refreshToken = (session.user as any).refreshToken;

    console.log("[Google Set Cookies] Session data:", {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!sessionId || !accessToken || !refreshToken) {
      console.error("[Google Set Cookies] Missing session data");
      return NextResponse.redirect(
        new URL("/login?error=SESSION_ERROR", baseUrl)
      );
    }

    // Create response with redirect to home
    const response = NextResponse.redirect(new URL("/", baseUrl));

    const isProduction = process.env.NODE_ENV === "production";

    // Session ID cookie (30 days)
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Access Token cookie (1 hour)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    // Refresh Token cookie (30 days)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    console.log(
      `[Google Set Cookies] ✅ Cookies set, redirecting to ${baseUrl}/`
    );

    return response;
  } catch (error) {
    console.error("[Google Set Cookies] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=CALLBACK_ERROR", baseUrl)
    );
  }
}