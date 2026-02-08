// middleware.ts - FIXED VERSION
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
    "/admin/:path*",
    "/auth/google-callback",
  ],
};

// Route yang TIDAK memerlukan autentikasi (PUBLIC)
const publicRoutes = [
  "/api/payments/xendit/webhook",
  "/api/payments/xendit/simulate",
  "/api/payments/xendit/webhook/route",
  "/api/auth/callback/google", // CRITICAL: Allow Google OAuth callback
  "/api/auth/google/set-cookies", // CRITICAL: Allow cookie setting (POST)
  "/auth/google-callback", // CRITICAL: Allow custom Google callback page
  "/api/auth/[...nextauth]/route", // CRITICAL: Allow NextAuth API routes
];

// FIX: Tambahkan semua NextAuth API routes
const nextAuthRoutes = [
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/verify-request",
  "/api/auth/error",
  "/api/auth/_log",
  "/api/auth/me",
  "/api/auth/script",
];

// Protected routes
const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];
const authRoutes = ["/login", "/register", "/register/otp"];
const publicMitraRoutes = ["/mitra/login", "/mitra/daftar"];

// Helper untuk check public routes
function isPublicRoute(pathname: string): boolean {
  // Check publicRoutes
  if (publicRoutes.some(route => pathname.startsWith(route) || pathname === route)) {
    return true;
  }
  
  // Check NextAuth routes
  if (nextAuthRoutes.some(route => pathname.startsWith(route) || pathname === route)) {
    return true;
  }
  
  // Allow all /api/auth/* routes (CRITICAL FIX)
  if (pathname.startsWith('/api/auth/')) {
    return true;
  }
  
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =============== PUBLIC ROUTES ===============
  // CRITICAL: Allow all NextAuth and Google OAuth routes without checking
  if (isPublicRoute(pathname)) {
    console.log(`[Middleware] ✅ Allowing public access to: ${pathname}`);
    return NextResponse.next();
  }

  // =============== ADMIN ROUTES ===============
  if (pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') {
      const adminSessionId = request.cookies.get('admin_session_id')?.value;
      const adminAccessToken = request.cookies.get('admin_access_token')?.value;
      const adminRefreshToken = request.cookies.get('admin_refresh_token')?.value;

      if (adminSessionId && (adminAccessToken || adminRefreshToken)) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.next();
    }

    const adminSessionId = request.cookies.get('admin_session_id')?.value;
    const adminAccessToken = request.cookies.get('admin_access_token')?.value;
    const adminRefreshToken = request.cookies.get('admin_refresh_token')?.value;

    if (!adminSessionId || (!adminAccessToken && !adminRefreshToken)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // =============== MITRA ROUTES ===============
  if (pathname.startsWith('/mitra/')) {
    const mitraSessionId = request.cookies.get('mitra_session_id')?.value;
    const mitraAccessToken = request.cookies.get('mitra_access_token')?.value;
    const mitraRefreshToken = request.cookies.get('mitra_refresh_token')?.value;

    if (publicMitraRoutes.some(route => pathname === route)) {
      if (pathname === '/mitra/login') {
        if (mitraSessionId && (mitraAccessToken || mitraRefreshToken)) {
          return NextResponse.redirect(new URL("/mitra/dashboard", request.url));
        }
      }
      return NextResponse.next();
    }

    if (!mitraSessionId || (!mitraAccessToken && !mitraRefreshToken)) {
      return NextResponse.redirect(new URL("/mitra/login", request.url));
    }

    return NextResponse.next();
  }

  // =============== USER ROUTES ===============
  
  // Skip check for home page and static assets
  if (pathname === '/' || pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next();
  }

  // Get NextAuth session token
  const sessionToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  // Check custom auth cookies
  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Check if authenticated
  const isAuthenticated = sessionToken || (sessionId && (accessToken || refreshToken));

  // Check protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log(`[Middleware] ❌ Unauthenticated user accessing protected route: ${pathname}`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check auth routes (login, register) - redirect if already authenticated
  if (authRoutes.some((route) => pathname === route)) {
    if (isAuthenticated) {
      console.log("[Middleware] ⚠️ Authenticated user accessing auth route, redirecting to home");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}