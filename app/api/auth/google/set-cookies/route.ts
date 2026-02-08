// app/api/auth/google/set-cookies/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// PRODUCTION-SAFE: Get the correct base URL
// ============================================
function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.trim();
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim();
  }

  return "http://localhost:3000";
}

// POST endpoint - receives session data from client and sets cookies
export async function POST(request: NextRequest) {
  const BASE_URL = getBaseUrl();
  const isProduction = process.env.NODE_ENV === "production";

  try {
    console.log("[Google Set Cookies POST] ========== START ==========");
    console.log("[Google Set Cookies POST] Base URL:", BASE_URL);
    console.log("[Google Set Cookies POST] Environment:", process.env.NODE_ENV);

    // Get session data from request body
    const body = await request.json();
    const { sessionId, accessToken, refreshToken } = body;

    console.log("[Google Set Cookies POST] Session data received:", {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      sessionIdPreview: sessionId ? `${sessionId.substring(0, 8)}...` : 'none',
    });

    // Validate session data
    if (!sessionId || !accessToken || !refreshToken) {
      console.error("[Google Set Cookies POST] ❌ Missing session data");
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing session data",
          details: {
            sessionId: !!sessionId,
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
          }
        },
        { status: 400 }
      );
    }

    // Cookie configuration
    const cookieConfig = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    console.log("[Google Set Cookies POST] Cookie config:", cookieConfig);

    // Create response
    const response = NextResponse.json(
      { 
        success: true,
        message: "Cookies set successfully",
        cookiesSet: {
          sessionId: true,
          accessToken: true,
          refreshToken: true,
        }
      },
      { status: 200 }
    );

    // Set Session ID cookie (30 days)
    response.cookies.set("session_id", sessionId, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    console.log("[Google Set Cookies POST] ✅ session_id cookie set");

    // Set Access Token cookie (1 hour)
    response.cookies.set("access_token", accessToken, {
      ...cookieConfig,
      maxAge: 60 * 60, // 1 hour
    });
    console.log("[Google Set Cookies POST] ✅ access_token cookie set");

    // Set Refresh Token cookie (30 days)
    response.cookies.set("refresh_token", refreshToken, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    console.log("[Google Set Cookies POST] ✅ refresh_token cookie set");

    console.log("[Google Set Cookies POST] ========== SUCCESS ==========");

    return response;
  } catch (error) {
    console.error("[Google Set Cookies POST] ========== ERROR ==========");
    console.error("[Google Set Cookies POST] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[Google Set Cookies POST] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[Google Set Cookies POST] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to set cookies",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint - legacy support (redirect approach - NOT RECOMMENDED)
export async function GET(request: NextRequest) {
  const BASE_URL = getBaseUrl();
  
  console.log("[Google Set Cookies GET] ⚠️ GET method called - this is deprecated");
  console.log("[Google Set Cookies GET] Redirecting to home - cookies should be set via POST");
  
  // Just redirect to home
  // The new flow uses POST from the callback page
  return NextResponse.redirect(`${BASE_URL}/`);
}