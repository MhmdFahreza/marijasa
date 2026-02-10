// app/api/auth/[...nextauth]/route.ts - FIXED FUNCTION_INVOCATION_FAILED
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Create the NextAuth handler once
const nextAuthHandler = NextAuth(authOptions);

function extractNextAuthSegments(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove /api/auth/ prefix and split
    const match = pathname.match(/\/api\/auth\/(.+)/);
    if (match && match[1]) {
      return match[1].split("/").filter(Boolean);
    }

    return [];
  } catch {
    return [];
  }
}

// Helper to create error redirect
function createErrorRedirect(error: string, req: NextRequest): NextResponse {
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const errorUrl = new URL(
    `/login?error=${encodeURIComponent(error)}`,
    baseUrl
  );
  console.log("[NextAuth] Redirecting to error page:", errorUrl.toString());

  return NextResponse.redirect(errorUrl);
}

// ✅ FIXED: Wrap handler with timeout protection - properly clears timeout
async function handleWithTimeout(
  handler: Function,
  req: NextRequest,
  context: any,
  timeoutMs: number = 25000 // 25 seconds (below Vercel's 30s limit)
): Promise<NextResponse> {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    const response = await Promise.race([
      // When handler resolves first, clear the timeout immediately
      (handler(req, context) as Promise<NextResponse>).then((res) => {
        clearTimeout(timeoutId);
        return res;
      }),
      new Promise<NextResponse>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Handler timeout")),
          timeoutMs
        );
      }),
    ]);
    return response;
  } catch (error) {
    // ✅ Always clear timeout on error (including when handler rejects first)
    clearTimeout(timeoutId);
    throw error; // Re-throw so the outer catch handles it
  }
}

export async function GET(req: NextRequest) {
  const segments = extractNextAuthSegments(req.url);
  const startTime = Date.now();

  console.log(
    "[NextAuth GET]",
    req.nextUrl.pathname,
    "| segments:",
    JSON.stringify(segments)
  );

  try {
    // ✅ Pass plain object with resolved params - NOT a Promise
    const context = { params: { nextauth: segments } };

    // Execute with timeout protection
    const response = await handleWithTimeout(
      nextAuthHandler,
      req as any,
      context as any,
      25000
    );

    const duration = Date.now() - startTime;
    console.log(
      "[NextAuth GET] ✅ Response status:",
      response?.status,
      `(${duration}ms)`
    );

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      "[NextAuth GET] ❌ Error:",
      error instanceof Error ? error.message : error
    );
    console.error("[NextAuth GET] Duration:", `${duration}ms`);

    if (error instanceof Error && error.message === "Handler timeout") {
      console.error("[NextAuth GET] TIMEOUT - Handler took too long");
      return createErrorRedirect("TIMEOUT", req);
    }

    // For callback errors, redirect to login with error
    if (segments[0] === "callback") {
      return createErrorRedirect("CALLBACK_ERROR", req);
    }

    // For other errors, return JSON error
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const segments = extractNextAuthSegments(req.url);
  const startTime = Date.now();

  console.log(
    "[NextAuth POST]",
    req.nextUrl.pathname,
    "| segments:",
    JSON.stringify(segments)
  );

  try {
    const context = { params: { nextauth: segments } };

    const response = await handleWithTimeout(
      nextAuthHandler,
      req as any,
      context as any,
      25000
    );

    const duration = Date.now() - startTime;
    console.log(
      "[NextAuth POST] ✅ Response status:",
      response?.status,
      `(${duration}ms)`
    );

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      "[NextAuth POST] ❌ Error:",
      error instanceof Error ? error.message : error
    );
    console.error("[NextAuth POST] Duration:", `${duration}ms`);

    if (error instanceof Error && error.message === "Handler timeout") {
      console.error("[NextAuth POST] TIMEOUT - Handler took too long");
      return createErrorRedirect("TIMEOUT", req);
    }

    if (segments[0] === "signin" || segments[0] === "callback") {
      return createErrorRedirect("SIGNIN_ERROR", req);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}