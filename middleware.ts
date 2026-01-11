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
    "/admin/:path*",
  ],
};

// Protected routes that require authentication
const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];

// Auth routes (redirect to home if already logged in)
const authRoutes = ["/login", "/register", "/register/otp"];

// Public mitra routes (don't require authentication)
const publicMitraRoutes = ["/mitra/login", "/mitra/daftar"];

/**
 * Create a redirect response with loading page
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =============== ADMIN ROUTES ===============
  if (pathname.startsWith('/admin/')) {
    // Allow access to login page
    if (pathname === '/admin/login') {
      // If already logged in, redirect to dashboard
      const adminSessionId = request.cookies.get('admin_session_id')?.value;
      const adminAccessToken = request.cookies.get('admin_access_token')?.value;

      if (adminSessionId && adminAccessToken) {
        console.log('[Middleware] Admin already authenticated, redirecting to dashboard');
        return createLoadingRedirect("/admin/dashboard", request, "Loading admin dashboard...");
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
    // The client will handle token refresh
    if (!adminAccessToken && adminRefreshToken) {
      console.log('[Middleware] Admin access token missing, allowing through for refresh');
      return NextResponse.next();
    }

    // Verify admin access token by calling verify API
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
        // If token expired, check if we should refresh
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
    // Allow access to public mitra routes (login, daftar)
    if (publicMitraRoutes.some(route => pathname === route)) {
      // If accessing login and already logged in, redirect to dashboard
      if (pathname === '/mitra/login') {
        const mitraSessionId = request.cookies.get('mitra_session_id')?.value;
        const mitraAccessToken = request.cookies.get('mitra_access_token')?.value;
        const mitraRefreshToken = request.cookies.get('mitra_refresh_token')?.value;

        // Only redirect if has valid session and either access or refresh token
        if (mitraSessionId && (mitraAccessToken || mitraRefreshToken)) {
          console.log('[Middleware] Mitra already authenticated, redirecting to dashboard');
          return createLoadingRedirect("/mitra/dashboard", request, "Loading mitra dashboard...");
        }
      }
      
      // Allow access to /mitra/daftar without authentication
      console.log(`[Middleware] Allowing access to public mitra route: ${pathname}`);
      return NextResponse.next();
    }

    // Protected mitra routes - require authentication
    const mitraSessionId = request.cookies.get('mitra_session_id')?.value;
    const mitraAccessToken = request.cookies.get('mitra_access_token')?.value;
    const mitraRefreshToken = request.cookies.get('mitra_refresh_token')?.value;

    // Must have session and at least one token (access or refresh)
    if (!mitraSessionId || (!mitraAccessToken && !mitraRefreshToken)) {
      console.log('[Middleware] Mitra not authenticated, redirecting to login');
      return createLoadingRedirect("/mitra/login", request, "Please login to continue...");
    }

    // If access token is missing but refresh token exists, allow through
    // The page will handle token refresh via /api/mitra/me
    if (!mitraAccessToken && mitraRefreshToken) {
      console.log('[Middleware] Mitra access token missing but has refresh, allowing through');
      return NextResponse.next();
    }

    // Verify mitra access token by calling verify API
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
        // If should refresh and has refresh token, allow through
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
      
      // If has refresh token, allow through to try refresh
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

  // Simple check: user is authenticated if has session OR sessionToken
  let isAuthenticated = false;

  // Check NextAuth session first (for Google OAuth)
  if (sessionToken) {
    console.log("[Middleware] User authenticated via NextAuth");
    isAuthenticated = true;
  }
  // Check custom auth (session + access/refresh token)
  else if (sessionId && (accessToken || refreshToken)) {
    console.log("[Middleware] User authenticated via JWT session");
    isAuthenticated = true;
  }

  // Check if accessing protected route without auth
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log("[Middleware] Unauthenticated user trying to access protected route:", pathname);
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      return createLoadingRedirect(loginUrl, request, "Please login to access this page...");
    }
  }

  // Check if accessing auth routes while authenticated
  if (authRoutes.some((route) => pathname === route)) {
    if (isAuthenticated) {
      console.log("[Middleware] Authenticated user trying to access auth route, redirecting to home");
      return createLoadingRedirect("/", request, "Redirecting to home...");
    }
  }

  return NextResponse.next();
}