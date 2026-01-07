// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSession, deleteTokens } from "@/app/components/lib/token-service";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log("[Logout] Request received");

    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;

    if (sessionId) {
      // Delete session and tokens from Redis
      await deleteSession(sessionId);
      await deleteTokens(sessionId);
      console.log("[Logout] Session and tokens deleted:", sessionId);
    } else {
      console.log("[Logout] No session ID found");
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Delete ALL auth-related cookies with proper options
    const cookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    };

    // Custom auth cookies
    response.cookies.set("session_id", "", cookieOptions);
    response.cookies.set("access_token", "", cookieOptions);
    response.cookies.set("refresh_token", "", cookieOptions);

    // NextAuth cookies (for Google OAuth)
    response.cookies.set("next-auth.session-token", "", cookieOptions);
    response.cookies.set("__Secure-next-auth.session-token", "", cookieOptions);
    response.cookies.set("next-auth.csrf-token", "", cookieOptions);
    response.cookies.set("__Host-next-auth.csrf-token", "", cookieOptions);
    response.cookies.set("next-auth.callback-url", "", cookieOptions);
    response.cookies.set("__Secure-next-auth.callback-url", "", cookieOptions);

    console.log("[Logout] All cookies cleared");

    return response;
  } catch (error) {
    console.error("[Logout] Error:", error);
    
    // Even if there's an error, clear cookies
    const response = NextResponse.json(
      { success: false, message: "Logout completed with warnings" },
      { status: 200 }
    );

    const cookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    };

    response.cookies.set("session_id", "", cookieOptions);
    response.cookies.set("access_token", "", cookieOptions);
    response.cookies.set("refresh_token", "", cookieOptions);
    response.cookies.set("next-auth.session-token", "", cookieOptions);
    response.cookies.set("__Secure-next-auth.session-token", "", cookieOptions);

    return response;
  }
}