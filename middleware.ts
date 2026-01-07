// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/profile/:path*",
    "/riwayat_pemesanan/:path*",
    "/vendor_favorit/:path*",
    "/login",
    "/register",
    "/register/otp",
    "/mitra/:path*",
  ],
};

// Protected routes that require authentication
const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];

// Auth routes (redirect to home if already logged in)
const authRoutes = ["/login", "/register", "/register/otp"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =============== MITRA ROUTES ===============
  if (pathname.startsWith('/mitra/')) {
    // Allow access to login page
    if (pathname === '/mitra/login') {
      // If already logged in, redirect to dashboard
      const mitraSessionId = request.cookies.get('mitra_session_id')?.value;
      const mitraAccessToken = request.cookies.get('mitra_access_token')?.value;

      if (mitraSessionId && mitraAccessToken) {
        return NextResponse.redirect(new URL("/mitra/dashboard", request.url));
      }
      
      return NextResponse.next();
    }

    // Protected mitra routes - require authentication
    const mitraSessionId = request.cookies.get('mitra_session_id')?.value;
    const mitraAccessToken = request.cookies.get('mitra_access_token')?.value;

    if (!mitraSessionId || !mitraAccessToken) {
      console.log('[Middleware] Mitra not authenticated, redirecting to login');
      const url = new URL("/mitra/login", request.url);
      return NextResponse.redirect(url);
    }

    // Verify mitra access token by calling verify API
    try {
      const verifyUrl = new URL('/api/mitra/verify', request.url);
      const verifyResponse = await fetch(verifyUrl.toString(), {
        method: 'GET',
        headers: {
          'Cookie': `mitra_session_id=${mitraSessionId}; mitra_access_token=${mitraAccessToken}`,
        },
      });

      if (!verifyResponse.ok) {
        console.log('[Middleware] Mitra token verification failed');
        const url = new URL("/mitra/login", request.url);
        return NextResponse.redirect(url);
      }

      console.log('[Middleware] Mitra authenticated successfully');
      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware] Error verifying mitra token:', error);
      const url = new URL("/mitra/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  // =============== USER ROUTES ===============
  
  // Get session ID and tokens from cookies
  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;

  // Get NextAuth session token
  const sessionToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Simple check: user is authenticated if has session OR sessionToken
  let isAuthenticated = false;

  // Check NextAuth session first (for Google OAuth)
  if (sessionToken) {
    isAuthenticated = true;
  }
  // Check custom auth (session + access token)
  else if (sessionId && accessToken) {
    isAuthenticated = true;
  }

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