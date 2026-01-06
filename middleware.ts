// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  verifyToken,
  getSession,
  getAccessToken,
  refreshAccessToken,
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
  let needsRefresh = false;

  if (sessionId) {
    // Verify session exists in Redis
    const session = await getSession(sessionId);
    
    if (session) {
      if (accessToken) {
        // Verify access token
        const tokenPayload = verifyToken(accessToken);
        
        if (tokenPayload && tokenPayload.sessionId === sessionId) {
          // Verify token exists in Redis
          const storedToken = await getAccessToken(sessionId);
          
          if (storedToken === accessToken) {
            isCustomAuth = true;
          } else {
            // Token not in Redis, needs refresh
            needsRefresh = true;
          }
        } else {
          // Access token expired
          needsRefresh = true;
        }
      } else if (refreshToken) {
        // No access token but has refresh token
        needsRefresh = true;
      }

      // Try to refresh if needed
      if (needsRefresh && refreshToken && accessToken) {
        const refreshResult = await refreshAccessToken(accessToken, refreshToken);
        
        if (refreshResult.success && refreshResult.accessToken) {
          // Update cookie with new access token
          const response = NextResponse.next();
          response.cookies.set("access_token", refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 1 hour
            path: "/",
          });
          
          isCustomAuth = true;
          
          // Continue with the response
          if (protectedRoutes.some((route) => pathname.startsWith(route))) {
            return response;
          }
          
          if (authRoutes.some((route) => pathname === route)) {
            return NextResponse.redirect(new URL("/", request.url));
          }
          
          return response;
        }
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