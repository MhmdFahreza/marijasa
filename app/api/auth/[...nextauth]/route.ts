// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

// ✅ Increase max duration for serverless (Google OAuth can be slow)
export const maxDuration = 30; // 30 seconds
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

// ============================================
// ✅ FIX: Next.js 15 compatibility
// In Next.js 15, route params are a Promise<{...}> instead of plain {}.
// NextAuth v4 expects synchronous params, causing 500 on callback.
// We resolve params before passing to NextAuth.
// ============================================

async function resolveContext(ctx: any) {
  // Next.js 15: params is a Promise
  // Next.js 14: params is a plain object
  if (ctx?.params && typeof ctx.params.then === "function") {
    const resolvedParams = await ctx.params;
    return { ...ctx, params: resolvedParams };
  }
  return ctx;
}

async function wrappedGET(req: Request, ctx: any) {
  try {
    const pathname = new URL(req.url).pathname;
    console.log("[NextAuth GET]", pathname);
    
    const resolvedCtx = await resolveContext(ctx);
    const response = await handler(req as any, resolvedCtx);
    return response;
  } catch (error) {
    console.error("[NextAuth GET] ❌ Unhandled error:", error);
    console.error("[NextAuth GET] Error name:", error instanceof Error ? error.name : "unknown");
    console.error("[NextAuth GET] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[NextAuth GET] Stack:", error instanceof Error ? error.stack : "no stack");
    
    // Return a redirect to login with error instead of raw 500
    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl.replace(/\/+$/, "")}/login?error=CALLBACK_ERROR`,
      },
    });
  }
}

async function wrappedPOST(req: Request, ctx: any) {
  try {
    const pathname = new URL(req.url).pathname;
    console.log("[NextAuth POST]", pathname);
    
    const resolvedCtx = await resolveContext(ctx);
    const response = await handler(req as any, resolvedCtx);
    return response;
  } catch (error) {
    console.error("[NextAuth POST] ❌ Unhandled error:", error);
    console.error("[NextAuth POST] Error name:", error instanceof Error ? error.name : "unknown");
    console.error("[NextAuth POST] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[NextAuth POST] Stack:", error instanceof Error ? error.stack : "no stack");
    
    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl.replace(/\/+$/, "")}/login?error=CALLBACK_ERROR`,
      },
    });
  }
}

export { wrappedGET as GET, wrappedPOST as POST };