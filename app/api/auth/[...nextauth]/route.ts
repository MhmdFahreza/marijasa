// app/api/auth/[...nextauth]/route.ts
// ✅ MINIMAL - No wrappers, no Promise.race, no manual segment extraction
import NextAuth from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Create NextAuth handler once
const nextAuth = NextAuth(authOptions);

// ============================================
// ✅ KEY FIX: The simplest possible handler.
//
// Previous code had 3 layers of wrappers:
// 1. extractNextAuthSegments() - manually parsed URL segments
// 2. handleWithTimeout() - Promise.race with setTimeout
// 3. createErrorRedirect() - custom error handling
//
// ALL of these are unnecessary and harmful:
// - NextAuth v4 internally parses req.url to get segments
// - Promise.race wrapping the Response in .then() corrupts the stream
// - The 25s timeout is redundant (Vercel has maxDuration: 30)
//
// The only thing we NEED to do is resolve Next.js 15's
// async params before passing to NextAuth v4 (which reads
// params.nextauth synchronously).
// ============================================

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  // ✅ Await the Promise-wrapped params (Next.js 15 requirement)
  const resolvedParams = await context.params;
  // ✅ Pass plain object with resolved params to NextAuth v4
  return nextAuth(req as any, { params: resolvedParams } as any);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await context.params;
  return nextAuth(req as any, { params: resolvedParams } as any);
}