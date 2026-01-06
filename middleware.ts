// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  verifyToken,
  getSession,
  getAccessToken,
} from "@/app/components/lib/token-service";

// Protected routes that require authentication
const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];

// Auth routes (redirect to home if already logged in)
const authRoutes = ["/login", "/register", "/register/otp"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session ID and tokens from cookies
  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Get NextAuth session token
  const sessionToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check custom auth (session + tokens)
  let isCustomAuth = false;
  if (sessionId && accessToken) {
    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (session) {
      // Verify access token
      const tokenPayload = verifyToken(accessToken);
      if (tokenPayload && tokenPayload.sessionId === sessionId) {
        // Verify token exists in Redis
        const storedToken = await getAccessToken(sessionId);
        if (storedToken === accessToken) {
          isCustomAuth = true;
        }
      } else if (refreshToken) {
        // Access token expired but we have refresh token
        // Let the /api/auth/me handle the refresh
        isCustomAuth = true;
      }
    }
  }

  // User is authenticated if either custom auth or NextAuth session exists
  const isAuthenticated = isCustomAuth || !!sessionToken;

  // Check if accessing protected route without auth
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Check if accessing auth routes while authenticated
  if (authRoutes.some((route) => pathname === route)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/riwayat_pemesanan/:path*",
    "/vendor_favorit/:path*",
    "/login",
    "/register",
    "/register/otp",
  ],
};