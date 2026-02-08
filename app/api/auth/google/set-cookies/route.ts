// app/api/auth/google/set-cookies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// PRODUCTION-SAFE: Get the correct base URL
// CRITICAL FIX: Same logic as auth.config.ts
// ============================================
function getBaseUrl(): string {
  // 1. Production: NEXTAUTH_URL (MUST be set in Vercel)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.trim();
  }

  // 2. Vercel auto-sets VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim();
  }

  // 4. Development fallback
  return "http://localhost:3000";
}

// This endpoint is called after Google OAuth to set cookies properly
export async function GET(request: NextRequest) {
  const BASE_URL = getBaseUrl();
  const isProduction = process.env.NODE_ENV === "production";

  try {
    console.log("[Google Set Cookies] ========== START ==========");
    console.log("[Google Set Cookies] Base URL:", BASE_URL);
    console.log("[Google Set Cookies] Environment:", process.env.NODE_ENV);
    console.log("[Google Set Cookies] Request URL:", request.url);

    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("[Google Set Cookies] ❌ No session found");
      const errorUrl = `${BASE_URL}/login?error=NO_SESSION`;
      console.log("[Google Set Cookies] Redirecting to:", errorUrl);
      return NextResponse.redirect(errorUrl);
    }

    console.log("[Google Set Cookies] ✅ Session found for:", session.user.email);

    // Extract session data
    const sessionId = (session.user as any).sessionId;
    const accessToken = (session.user as any).accessToken;
    const refreshToken = (session.user as any).refreshToken;

    console.log("[Google Set Cookies] Session data check:", {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      sessionIdPreview: sessionId ? `${sessionId.substring(0, 8)}...` : 'none',
    });

    // Validate session data
    if (!sessionId || !accessToken || !refreshToken) {
      console.error("[Google Set Cookies] ❌ Missing session data");
      const errorUrl = `${BASE_URL}/login?error=SESSION_ERROR`;
      console.log("[Google Set Cookies] Redirecting to:", errorUrl);
      return NextResponse.redirect(errorUrl);
    }

    // Create response with redirect to home
    const homeUrl = `${BASE_URL}/`;
    console.log("[Google Set Cookies] Creating redirect to:", homeUrl);
    
    const response = NextResponse.redirect(homeUrl);

    // Cookie configuration
    const cookieConfig = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    console.log("[Google Set Cookies] Cookie config:", {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
    });

    // Set Session ID cookie (30 days)
    response.cookies.set("session_id", sessionId, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    console.log("[Google Set Cookies] ✅ session_id cookie set");

    // Set Access Token cookie (1 hour)
    response.cookies.set("access_token", accessToken, {
      ...cookieConfig,
      maxAge: 60 * 60, // 1 hour
    });
    console.log("[Google Set Cookies] ✅ access_token cookie set");

    // Set Refresh Token cookie (30 days)
    response.cookies.set("refresh_token", refreshToken, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    console.log("[Google Set Cookies] ✅ refresh_token cookie set");

    console.log("[Google Set Cookies] ========== SUCCESS ==========");
    console.log("[Google Set Cookies] All cookies set, redirecting to:", homeUrl);

    return response;
  } catch (error) {
    console.error("[Google Set Cookies] ========== ERROR ==========");
    console.error("[Google Set Cookies] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[Google Set Cookies] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[Google Set Cookies] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Create error response
    const errorUrl = `${BASE_URL}/login?error=CALLBACK_ERROR`;
    console.log("[Google Set Cookies] Redirecting to error page:", errorUrl);

    return NextResponse.redirect(errorUrl);
  }
}