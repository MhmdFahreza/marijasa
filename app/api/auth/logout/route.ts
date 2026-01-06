// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSession, deleteTokens } from "@/app/components/lib/token-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;

    if (sessionId) {
      // Delete session from Redis
      await deleteSession(sessionId);

      // Delete tokens from Redis
      await deleteTokens(sessionId);

      console.log(`[Logout] Session and tokens deleted: ${sessionId}`);
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout berhasil",
      },
      { status: 200 }
    );

    // Delete all auth cookies
    response.cookies.delete("session_id");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    // Also set cookies to expired (belt and suspenders approach)
    response.cookies.set("session_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    console.log("[Logout] All cookies cleared");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if there's an error, still try to clear cookies
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout berhasil",
      },
      { status: 200 }
    );

    response.cookies.delete("session_id");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    return response;
  }
}