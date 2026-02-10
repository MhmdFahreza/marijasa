// app/api/auth/[...nextauth]/route.ts
// ✅ CRITICAL FIX: Reconstruct NextAuth's Response as NextResponse
//
// ROOT CAUSE:
// NextAuth v4 internally creates a standard Web API `Response` object.
// Next.js 15 route handlers process the returned Response through an
// internal pipeline that expects certain properties/behaviors from
// `NextResponse`. When NextAuth's plain `Response` (with complex
// Set-Cookie headers from JWE-encrypted JWT) goes through this pipeline,
// it crashes silently — no error logged, just FUNCTION_INVOCATION_FAILED.
//
// FIX:
// Reconstruct the Response as a NextResponse before returning it.
// This ensures Next.js 15's internal pipeline can process it correctly.
//
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const authHandler = NextAuth(authOptions);

const BASE_URL =
  process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/**
 * Convert NextAuth's plain Response → NextResponse
 * This is the key fix for Next.js 15 compatibility.
 */
function toNextResponse(response: Response): NextResponse {
  // For redirects (302/307): reconstruct with NextResponse.redirect
  // to ensure Next.js handles the Location header properly
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      const redirectResponse = NextResponse.redirect(location, response.status);

      // ✅ CRITICAL: Preserve ALL Set-Cookie headers from NextAuth
      // These contain the encrypted session token (next-auth.session-token)
      // Headers.getSetCookie() returns each Set-Cookie as separate entries
      // (unlike .get('set-cookie') which concatenates them and breaks parsing)
      const setCookieHeaders = response.headers.getSetCookie?.();
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        // Clear any existing set-cookie from NextResponse.redirect
        redirectResponse.headers.delete("set-cookie");
        for (const cookie of setCookieHeaders) {
          redirectResponse.headers.append("set-cookie", cookie);
        }
      } else {
        // Fallback for environments where getSetCookie() isn't available
        // Iterate raw headers to find set-cookie entries
        const rawHeaders = [...response.headers.entries()];
        const cookieHeaders = rawHeaders.filter(
          ([key]) => key.toLowerCase() === "set-cookie"
        );
        if (cookieHeaders.length > 0) {
          redirectResponse.headers.delete("set-cookie");
          for (const [, value] of cookieHeaders) {
            redirectResponse.headers.append("set-cookie", value);
          }
        }
      }

      return redirectResponse;
    }
  }

  // For non-redirect responses (JSON APIs like /session, /providers, /csrf):
  // Pass through body and headers as-is
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const startTime = Date.now();

  try {
    // ✅ Await the Promise-wrapped params (Next.js 15 requirement)
    const resolvedParams = await context.params;

    console.log(
      "[NextAuth GET]",
      req.nextUrl.pathname,
      "| segments:",
      JSON.stringify(resolvedParams.nextauth)
    );

    // Call NextAuth handler with resolved params
    const authResponse = await authHandler(
      req as any,
      { params: resolvedParams } as any
    );

    // ✅ KEY FIX: Convert to NextResponse before returning
    const nextResponse = toNextResponse(authResponse);

    const duration = Date.now() - startTime;
    console.log(
      "[NextAuth GET] ✅ status:",
      nextResponse.status,
      `(${duration}ms)`
    );

    return nextResponse;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      "[NextAuth GET] ❌ FATAL:",
      error instanceof Error ? error.stack || error.message : error,
      `(${duration}ms)`
    );

    // Session was likely already created in Redis (callbacks completed).
    // Redirect to home — the client will pick up the session via /api/auth/me
    if (req.nextUrl.pathname.includes("/callback")) {
      console.log("[NextAuth GET] Fallback redirect to home (session exists in Redis)");
      return NextResponse.redirect(new URL("/", BASE_URL));
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const startTime = Date.now();

  try {
    const resolvedParams = await context.params;

    console.log(
      "[NextAuth POST]",
      req.nextUrl.pathname,
      "| segments:",
      JSON.stringify(resolvedParams.nextauth)
    );

    const authResponse = await authHandler(
      req as any,
      { params: resolvedParams } as any
    );

    // ✅ Convert to NextResponse
    const nextResponse = toNextResponse(authResponse);

    const duration = Date.now() - startTime;
    console.log(
      "[NextAuth POST] ✅ status:",
      nextResponse.status,
      `(${duration}ms)`
    );

    return nextResponse;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      "[NextAuth POST] ❌ FATAL:",
      error instanceof Error ? error.stack || error.message : error,
      `(${duration}ms)`
    );

    if (
      req.nextUrl.pathname.includes("/signin") ||
      req.nextUrl.pathname.includes("/callback")
    ) {
      return NextResponse.redirect(
        new URL("/login?error=SIGNIN_ERROR", BASE_URL)
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}