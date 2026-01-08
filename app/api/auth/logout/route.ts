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

    // Define cookie options for clearing
    const cookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    // Clear all auth cookies
    response.cookies.set("session_id", "", cookieOptions);
    response.cookies.set("access_token", "", cookieOptions);
    response.cookies.set("refresh_token", "", cookieOptions);

    // Also clear NextAuth cookies (for Google OAuth) if they exist
    response.cookies.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("__Secure-next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: true,
    });
    response.cookies.set("next-auth.csrf-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("__Host-next-auth.csrf-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: true,
    });
    response.cookies.set("next-auth.callback-url", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    console.log("[Logout] All cookies cleared successfully");

    return response;
  } catch (error) {
    console.error("[Logout] Error:", error);
    
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json(
      { success: true, message: "Logout completed" },
      { status: 200 }
    );

    const cookieOptions = {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    response.cookies.set("session_id", "", cookieOptions);
    response.cookies.set("access_token", "", cookieOptions);
    response.cookies.set("refresh_token", "", cookieOptions);
    response.cookies.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("__Secure-next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: true,
    });

    return response;
  }
}