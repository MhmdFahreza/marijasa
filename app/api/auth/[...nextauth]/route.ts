// app/api/auth/[...nextauth]/route.ts
// ✅ FIXED: All error redirects use absolute URLs
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const authHandler = NextAuth(authOptions);

// ✅ Get BASE_URL for absolute redirects
function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/+$/, "").trim();
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").trim();
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

/**
 * Convert NextAuth's plain Response → NextResponse
 * This is the key fix for Next.js 15 compatibility.
 */
function toNextResponse(response: Response): NextResponse {
  // For redirects (302/307): reconstruct with NextResponse.redirect
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      // ✅ CRITICAL: Ensure location is absolute URL
      let absoluteLocation = location;
      
      if (!location.startsWith("http")) {
        // Convert relative to absolute
        absoluteLocation = location.startsWith("/") 
          ? `${BASE_URL}${location}`
          : `${BASE_URL}/${location}`;
        
        console.log("[toNextResponse] Converting relative → absolute:", location, "→", absoluteLocation);
      }
      
      const redirectResponse = NextResponse.redirect(absoluteLocation, response.status);

      // ✅ Preserve ALL Set-Cookie headers from NextAuth
      const setCookieHeaders = response.headers.getSetCookie?.();
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        redirectResponse.headers.delete("set-cookie");
        for (const cookie of setCookieHeaders) {
          redirectResponse.headers.append("set-cookie", cookie);
        }
      } else {
        // Fallback for environments without getSetCookie()
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

  // For non-redirect responses: pass through body and headers as-is
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

    // ✅ Convert to NextResponse before returning
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

    // ✅ Session might exist in Redis even if error occurred
    // Redirect to home with absolute URL (let AuthContext pick up session)
    if (req.nextUrl.pathname.includes("/callback")) {
      console.log("[NextAuth GET] Callback error → redirect to home (absolute URL)");
      return NextResponse.redirect(new URL("/", BASE_URL));
    }

    // ✅ For signin errors, redirect to login with absolute URL
    if (req.nextUrl.pathname.includes("/signin")) {
      console.log("[NextAuth GET] Signin error → redirect to login (absolute URL)");
      return NextResponse.redirect(
        new URL("/login?error=SIGNIN_ERROR", BASE_URL)
      );
    }

    // ✅ Generic error response
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

    // ✅ Handle callback/signin errors with absolute URLs
    if (
      req.nextUrl.pathname.includes("/signin") ||
      req.nextUrl.pathname.includes("/callback")
    ) {
      console.log("[NextAuth POST] Error → redirect to login (absolute URL)");
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