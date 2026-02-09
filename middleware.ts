// middleware.ts - FIXED FOR VERCEL PRODUCTION
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

// Public routes that don't need authentication
const publicRoutes = [
  "/api/payments/xendit/webhook",
  "/api/payments/xendit/simulate",
  "/api/payments/xendit/webhook/route",
  "/api/auth/callback/google", // NextAuth callback
  "/api/auth/signin/google", // NextAuth signin
  "/api/auth", // All NextAuth routes
];

// Protected routes that require authentication
const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];

// Auth routes (redirect if logged in)
const authRoutes = ["/login", "/register", "/register/otp"];

// Public mitra routes
const publicMitraRoutes = ["/mitra/login", "/mitra/daftar"];

function createLoadingRedirect(
  targetUrl: string,
  request: NextRequest,
  message: string = "Redirecting..."
) {
  const loadingPageUrl = new URL("/loading", request.url);
  loadingPageUrl.searchParams.set("redirect", targetUrl);
  loadingPageUrl.searchParams.set("message", message);

  const response = NextResponse.redirect(loadingPageUrl);

  response.cookies.set("redirect_target", targetUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60,
  });

  return response;
}

function createDirectRedirect(targetUrl: string, request: NextRequest) {
  const redirectUrl = new URL(targetUrl, request.url);
  return NextResponse.redirect(redirectUrl);
}

// Helper: Set custom auth cookies from NextAuth token data
function setCustomCookiesFromToken(
  response: NextResponse,
  sessionToken: {
    sessionId?: string;
    accessToken?: string;
    refreshToken?: string;
  },
  existingCookies: {
    sessionId?: string;
    accessToken?: string;
    refreshToken?: string;
  }
) {
  const isProduction = process.env.NODE_ENV === "production";
  let cookiesSet = false;

  if (sessionToken.sessionId && !existingCookies.sessionId) {
    response.cookies.set("session_id", sessionToken.sessionId as string, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    cookiesSet = true;
  }

  if (sessionToken.accessToken && !existingCookies.accessToken) {
    response.cookies.set("access_token", sessionToken.accessToken as string, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });
    cookiesSet = true;
  }

  if (sessionToken.refreshToken && !existingCookies.refreshToken) {
    response.cookies.set("refresh_token", sessionToken.refreshToken as string, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    cookiesSet = true;
  }

  if (cookiesSet) {
    console.log("[Middleware] ✅ Custom cookies set from NextAuth token");
  }

  return cookiesSet;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =============== PUBLIC ROUTES ===============
  for (const route of publicRoutes) {
    if (pathname.startsWith(route) || pathname === route) {
      console.log(`[Middleware] ✅ Public route: ${pathname}`);
      return NextResponse.next();
    }
  }

  // =============== ADMIN ROUTES ===============
  if (pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") {
      const adminSessionId = request.cookies.get("admin_session_id")?.value;
      const adminAccessToken = request.cookies.get("admin_access_token")?.value;
      const adminRefreshToken = request.cookies.get("admin_refresh_token")?.value;

      if (adminSessionId && (adminAccessToken || adminRefreshToken)) {
        return createDirectRedirect("/admin/dashboard", request);
      }

      return NextResponse.next();
    }

    const adminSessionId = request.cookies.get("admin_session_id")?.value;
    const adminAccessToken = request.cookies.get("admin_access_token")?.value;
    const adminRefreshToken = request.cookies.get("admin_refresh_token")?.value;

    if (!adminSessionId || (!adminAccessToken && !adminRefreshToken)) {
      return createLoadingRedirect(
        "/admin/login",
        request,
        "Please login to continue..."
      );
    }

    if (!adminAccessToken && adminRefreshToken) {
      return NextResponse.next();
    }

    try {
      const verifyUrl = new URL("/api/admin/verify", request.url);
      const verifyResponse = await fetch(verifyUrl.toString(), {
        method: "GET",
        headers: {
          Cookie: `admin_session_id=${adminSessionId}; admin_access_token=${adminAccessToken}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        if (verifyData.shouldRefresh && adminRefreshToken) {
          return NextResponse.next();
        }
        return createLoadingRedirect(
          "/admin/login",
          request,
          "Session expired..."
        );
      }

      return NextResponse.next();
    } catch (error) {
      console.error("[Middleware] Admin verify error:", error);
      return createLoadingRedirect(
        "/admin/login",
        request,
        "Authentication error..."
      );
    }
  }

  // =============== MITRA ROUTES ===============
  if (pathname.startsWith("/mitra/")) {
    const mitraSessionId = request.cookies.get("mitra_session_id")?.value;
    const mitraAccessToken = request.cookies.get("mitra_access_token")?.value;
    const mitraRefreshToken = request.cookies.get("mitra_refresh_token")?.value;

    if (publicMitraRoutes.some((route) => pathname === route)) {
      if (pathname === "/mitra/login") {
        if (mitraSessionId && (mitraAccessToken || mitraRefreshToken)) {
          return createDirectRedirect("/mitra/dashboard", request);
        }
      }
      return NextResponse.next();
    }

    if (!mitraSessionId || (!mitraAccessToken && !mitraRefreshToken)) {
      return createLoadingRedirect("/mitra/login", request, "Please login...");
    }

    if (!mitraAccessToken && mitraRefreshToken) {
      return NextResponse.next();
    }

    try {
      const verifyUrl = new URL("/api/mitra/verify", request.url);
      const verifyResponse = await fetch(verifyUrl.toString(), {
        method: "GET",
        headers: {
          Cookie: `mitra_session_id=${mitraSessionId}; mitra_access_token=${mitraAccessToken}; mitra_refresh_token=${mitraRefreshToken || ""}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        if (verifyData.shouldRefresh && mitraRefreshToken) {
          return NextResponse.next();
        }
        return createLoadingRedirect(
          "/mitra/login",
          request,
          "Session expired..."
        );
      }

      return NextResponse.next();
    } catch (error) {
      console.error("[Middleware] Mitra verify error:", error);
      if (mitraRefreshToken) {
        return NextResponse.next();
      }
      return createLoadingRedirect(
        "/mitra/login",
        request,
        "Authentication error..."
      );
    }
  }

  // =============== USER ROUTES ===============

  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Get NextAuth JWT token
  let sessionToken: any = null;
  try {
    sessionToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error("[Middleware] getToken error:", error);
  }

  let isAuthenticated = false;
  let needsCustomCookies = false;

  // Check NextAuth (Google OAuth)
  if (sessionToken) {
    console.log("[Middleware] ✅ NextAuth token found");
    isAuthenticated = true;

    // ✅ Check if custom cookies need to be set from NextAuth token
    if (
      sessionToken.sessionId &&
      sessionToken.accessToken &&
      sessionToken.refreshToken
    ) {
      // If ANY of the custom cookies are missing, we need to set them
      if (!sessionId || !accessToken || !refreshToken) {
        needsCustomCookies = true;
      }
    }
  }
  // Check custom auth
  else if (sessionId && (accessToken || refreshToken)) {
    console.log("[Middleware] ✅ Custom auth authenticated");
    isAuthenticated = true;
  }

  // Protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log("[Middleware] ❌ Unauthenticated:", pathname);
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      return createLoadingRedirect(loginUrl, request, "Please login...");
    }

    // If authenticated via NextAuth and needs custom cookies, set them
    if (needsCustomCookies && sessionToken) {
      const response = NextResponse.next();
      setCustomCookiesFromToken(
        response,
        sessionToken,
        { sessionId, accessToken, refreshToken }
      );
      return response;
    }
  }

  // Auth routes (redirect if logged in)
  if (authRoutes.some((route) => pathname === route)) {
    if (isAuthenticated) {
      console.log("[Middleware] ⚠️ Already authenticated, redirecting");
      return createDirectRedirect("/", request);
    }
  }

  // For any other matched route, if we need to set custom cookies, do it
  if (needsCustomCookies && sessionToken) {
    const response = NextResponse.next();
    setCustomCookiesFromToken(
      response,
      sessionToken,
      { sessionId, accessToken, refreshToken }
    );
    return response;
  }

  return NextResponse.next();
}