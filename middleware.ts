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
  ],
};

// Route yang TIDAK memerlukan autentikasi (PUBLIC)
const publicRoutes = [
  "/api/payments/xendit/webhook",
  "/api/payments/xendit/simulate",
  "/api/payments/xendit/webhook/route",
  "/api/auth/callback/google", // CRITICAL: Allow Google OAuth callback
  "/api/auth/google/set-cookies", // CRITICAL: Allow cookie setting
];

// Protected routes that require authentication
const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];

// Auth routes (redirect to home if already logged in)
const authRoutes = ["/login", "/register", "/register/otp"];

// Public mitra routes (don't require authentication)
const publicMitraRoutes = ["/mitra/login", "/mitra/daftar"];

/**
 * Create a redirect response with loading page
 * Used for cases where we want to show a loading indicator
 */
function createLoadingRedirect(targetUrl: string, request: NextRequest, message: string = "Redirecting...") {
  const loadingPageUrl = new URL("/loading", request.url);
  loadingPageUrl.searchParams.set("redirect", targetUrl);
  loadingPageUrl.searchParams.set("message", message);
  
  const response = NextResponse.redirect(loadingPageUrl);
  
  // Set a cookie to track the redirect for security
  response.cookies.set("redirect_target", targetUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60, // 60 seconds to complete redirect
  });
  
  return response;
}

/**
 * Create a direct redirect response without loading page
 * Used for simple redirects like authenticated user accessing login page
 */
function createDirectRedirect(targetUrl: string, request: NextRequest) {
  const redirectUrl = new URL(targetUrl, request.url);
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =============== PUBLIC ROUTES ===============
  // CRITICAL: Allow Google OAuth callback and cookie setting routes
  for (const route of publicRoutes) {
    if (pathname.startsWith(route) || pathname === route) {
      console.log(`[Middleware] ✅ Allowing public access to: ${pathname}`);
      return NextResponse.next();
    }
  }

  // =============== ADMIN ROUTES ===============
  if (pathname.startsWith('/admin/')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      const adminSessionId = request.cookies.get('admin_session_id')?.value;
      const adminAccessToken = request.cookies.get('admin_access_token')?.value;
      const adminRefreshToken = request.cookies.get('admin_refresh_token')?.value;

      if (adminSessionId && (adminAccessToken || adminRefreshToken)) {
        console.log('[Middleware] Admin already authenticated, redirecting to dashboard');
        return createDirectRedirect("/admin/dashboard", request);
      }
      
      return NextResponse.next();
    }

    // Protected admin routes - require authentication
    const adminSessionId = request.cookies.get('admin_session_id')?.value;
    const adminAccessToken = request.cookies.get('admin_access_token')?.value;
    const adminRefreshToken = request.cookies.get('admin_refresh_token')?.value;

    if (!adminSessionId || (!adminAccessToken && !adminRefreshToken)) {
      console.log('[Middleware] Admin not authenticated, redirecting to login');
      return createLoadingRedirect("/admin/login", request, "Please login to continue...");
    }

    // If access token is missing but refresh token exists, allow through
    if (!adminAccessToken && adminRefreshToken) {
      console.log('[Middleware] Admin access token missing, allowing through for refresh');
      return NextResponse.next();
    }

    // Verify admin access token
    try {
      const verifyUrl = new URL('/api/admin/verify', request.url);
      const verifyResponse = await fetch(verifyUrl.toString(), {
        method: 'GET',
        headers: {
          'Cookie': `admin_session_id=${adminSessionId}; admin_access_token=${adminAccessToken}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        if (verifyData.shouldRefresh && adminRefreshToken) {
          console.log('[Middleware] Admin token expired, allowing through for refresh');
          return NextResponse.next();
        }

        console.log('[Middleware] Admin token verification failed');
        return createLoadingRedirect("/admin/login", request, "Session expired. Please login again...");
      }

      console.log('[Middleware] Admin authenticated successfully');
      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware] Error verifying admin token:', error);
      return createLoadingRedirect("/admin/login", request, "Authentication error. Redirecting...");
    }
  }

  // =============== MITRA ROUTES ===============
  if (pathname.startsWith('/mitra/')) {
    const mitraSessionId = request.cookies.get('mitra_session_id')?.value;
    const mitraAccessToken = request.cookies.get('mitra_access_token')?.value;
    const mitraRefreshToken = request.cookies.get('mitra_refresh_token')?.value;

    // Allow access to public mitra routes (login, daftar)
    if (publicMitraRoutes.some(route => pathname === route)) {
      // If accessing login and already logged in, redirect to dashboard
      if (pathname === '/mitra/login') {
        if (mitraSessionId && (mitraAccessToken || mitraRefreshToken)) {
          console.log('[Middleware] Mitra already authenticated, redirecting to dashboard');
          return createDirectRedirect("/mitra/dashboard", request);
        }
      }
      
      console.log(`[Middleware] ✅ Allowing access to public mitra route: ${pathname}`);
      return NextResponse.next();
    }

    // Protected mitra routes - require authentication
    if (!mitraSessionId || (!mitraAccessToken && !mitraRefreshToken)) {
      console.log('[Middleware] Mitra not authenticated, redirecting to login');
      return createLoadingRedirect("/mitra/login", request, "Please login to continue...");
    }

    // If access token is missing but refresh token exists, allow through
    if (!mitraAccessToken && mitraRefreshToken) {
      console.log('[Middleware] Mitra access token missing but has refresh, allowing through');
      return NextResponse.next();
    }

    // Verify mitra access token
    try {
      const verifyUrl = new URL('/api/mitra/verify', request.url);
      const verifyResponse = await fetch(verifyUrl.toString(), {
        method: 'GET',
        headers: {
          'Cookie': `mitra_session_id=${mitraSessionId}; mitra_access_token=${mitraAccessToken}; mitra_refresh_token=${mitraRefreshToken || ''}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        if (verifyData.shouldRefresh && mitraRefreshToken) {
          console.log('[Middleware] Mitra token expired, allowing through for refresh');
          return NextResponse.next();
        }

        console.log('[Middleware] Mitra token verification failed:', verifyData.error);
        return createLoadingRedirect("/mitra/login", request, "Session expired. Please login again...");
      }

      console.log('[Middleware] Mitra authenticated successfully');
      return NextResponse.next();
    } catch (error) {
      console.error('[Middleware] Error verifying mitra token:', error);
      
      if (mitraRefreshToken) {
        console.log('[Middleware] Error but has refresh token, allowing through');
        return NextResponse.next();
      }
      
      return createLoadingRedirect("/mitra/login", request, "Authentication error. Redirecting...");
    }
  }

  // =============== USER ROUTES ===============
  
  // Get session ID and tokens from cookies
  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Get NextAuth session token
  const sessionToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is authenticated
  let isAuthenticated = false;

  // Check NextAuth session first (for Google OAuth)
  if (sessionToken) {
    console.log("[Middleware] ✅ User authenticated via NextAuth");
    isAuthenticated = true;
  }
  // Check custom auth (session + access/refresh token)
  else if (sessionId && (accessToken || refreshToken)) {
    console.log("[Middleware] ✅ User authenticated via JWT session");
    isAuthenticated = true;
  }

  // Check if accessing protected route without auth
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log("[Middleware] ❌ Unauthenticated user accessing protected route:", pathname);
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      return createLoadingRedirect(loginUrl, request, "Please login to access this page...");
    }
  }

  // Check if accessing auth routes while authenticated
  // CRITICAL FIX: Use direct redirect instead of loading page
  if (authRoutes.some((route) => pathname === route)) {
    if (isAuthenticated) {
      console.log("[Middleware] ⚠️ Authenticated user accessing auth route, redirecting to home");
      // IMPORTANT: Direct redirect to avoid infinite loops
      return createDirectRedirect("/", request);
    }
  }

  return NextResponse.next();
}