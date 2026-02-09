// app/api/auth/debug/route.ts
// ✅ TEMPORARY DEBUG ENDPOINT - Remove after fixing the issue
// Visit: https://marijasa.vercel.app/api/auth/debug
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    
    // Check critical env vars (show only existence, not values)
    envVars: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? `✅ Set (${process.env.NEXTAUTH_URL})` : "❌ NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ NOT SET",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `✅ Set (${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...)` : "❌ NOT SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ NOT SET",
      VERCEL_URL: process.env.VERCEL_URL || "not set",
    },
    
    // Check URL consistency
    urlCheck: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      note: "Make sure this EXACT callback URL is in Google Console > Authorized redirect URIs",
    },
    
    // Check if critical modules can be imported
    moduleCheck: {
      nextAuth: "checking...",
      prisma: "checking...",
      tokenService: "checking...",
    },
  };

  // Test module imports
  try {
    const { authOptions } = await import("@/app/components/lib/auth.config");
    diagnostics.moduleCheck.nextAuth = authOptions ? "✅ OK" : "❌ authOptions is null";
  } catch (error) {
    diagnostics.moduleCheck.nextAuth = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    const prisma = (await import("@/app/components/lib/prisma")).default;
    // Quick connectivity test
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.moduleCheck.prisma = "✅ Connected";
  } catch (error) {
    diagnostics.moduleCheck.prisma = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    const { createSessionId } = await import("@/app/components/lib/token-service");
    const testId = createSessionId();
    diagnostics.moduleCheck.tokenService = testId ? "✅ OK" : "❌ createSessionId returned empty";
  } catch (error) {
    diagnostics.moduleCheck.tokenService = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}