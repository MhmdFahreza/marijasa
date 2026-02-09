// app/api/auth/[...nextauth]/route.ts
// ============================================
// FIX: Next.js 15 + NextAuth v4 Compatibility
//
// Problem: Next.js 15 changed route handler params to Promise<{...}>
// NextAuth v4 reads context.params.nextauth synchronously → undefined → crash
//
// Solution: Manually extract nextauth segments from the URL path
// and construct a plain params object before passing to NextAuth.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Create the NextAuth handler once
const nextAuthHandler = NextAuth(authOptions);

// ============================================
// Extract [...nextauth] segments from the URL
// e.g. /api/auth/callback/google → ["callback", "google"]
// e.g. /api/auth/signin/google  → ["signin", "google"]
// e.g. /api/auth/session        → ["session"]
// ============================================
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

export async function GET(req: NextRequest) {
  const segments = extractNextAuthSegments(req.url);
  console.log("[NextAuth GET]", req.nextUrl.pathname, "| segments:", JSON.stringify(segments));

  try {
    // ✅ Pass plain object with resolved params - NOT a Promise
    const context = { params: { nextauth: segments } };
    const response = await nextAuthHandler(req as any, context as any);
    console.log("[NextAuth GET] ✅ Response status:", response?.status);
    return response;
  } catch (error) {
    console.error("[NextAuth GET] ❌ Error:", error instanceof Error ? error.message : error);
    console.error("[NextAuth GET] Stack:", error instanceof Error ? error.stack : "N/A");

    // Redirect to login with error instead of showing 500
    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    return NextResponse.redirect(new URL(`/login?error=CALLBACK_ERROR`, baseUrl));
  }
}

export async function POST(req: NextRequest) {
  const segments = extractNextAuthSegments(req.url);
  console.log("[NextAuth POST]", req.nextUrl.pathname, "| segments:", JSON.stringify(segments));

  try {
    const context = { params: { nextauth: segments } };
    const response = await nextAuthHandler(req as any, context as any);
    console.log("[NextAuth POST] ✅ Response status:", response?.status);
    return response;
  } catch (error) {
    console.error("[NextAuth POST] ❌ Error:", error instanceof Error ? error.message : error);
    console.error("[NextAuth POST] Stack:", error instanceof Error ? error.stack : "N/A");

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    return NextResponse.redirect(new URL(`/login?error=CALLBACK_ERROR`, baseUrl));
  }
}