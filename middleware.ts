// middleware.ts
// ✅ CLEAN: No Promise.race, no dangling timeouts
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

// NextAuth routes - NEVER intercept
const NEXTAUTH_ROUTES = [
  "/api/auth/callback",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/csrf",
  "/api/auth/error",
  "/api/auth/_log",
];

const publicRoutes = [
  "/api/payments/xendit/webhook",
  "/api/payments/xendit/simulate",
  "/api/payments/xendit/webhook/route",
];

const protectedRoutes = ["/profile", "/riwayat_pemesanan", "/vendor_favorit"];
const authRoutes = ["/login", "/register", "/register/otp"];
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
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    cookiesSet = true;
  }

  if (sessionToken.accessToken && !existingCookies.accessToken) {
    response.cookies.set("access_token", sessionToken.accessToken as string, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });
    cookiesSet = true;
  }

  if (sessionToken.refreshToken && !existingCookies.refreshToken) {
    response.cookies.set("refresh_token", sessionToken.refreshToken as string, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    cookiesSet = true;
  }

  if (cookiesSet) {
    console.log("[Middleware] Custom cookies set from NextAuth token");
  }

  return cookiesSet;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Let NextAuth handle its own routes completely
  for (const route of NEXTAUTH_ROUTES) {
    if (pathname.startsWith(route) || pathname === route) {
      return NextResponse.next();
    }
  }

  // =============== PUBLIC ROUTES ===============
  for (const route of publicRoutes) {
    if (pathname.startsWith(route) || pathname === route) {
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
      return createLoadingRedirect("/admin/login", request, "Please login to continue...");
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
        return createLoadingRedirect("/admin/login", request, "Session expired...");
      }

      return NextResponse.next();
    } catch (error) {
      console.error("[Middleware] Admin verify error:", error);
      return createLoadingRedirect("/admin/login", request, "Authentication error...");
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

    // ✅ Require at minimum: sessionId and refreshToken
    if (!mitraSessionId || !mitraRefreshToken) {
      return createLoadingRedirect("/mitra/login", request, "Please login...");
    }

    // ✅ If no access token but has refresh token, let it through (verify API will handle refresh)
    if (!mitraAccessToken && mitraRefreshToken) {
      console.log('[Middleware] Mitra: No access token, but has refresh token - allowing through for auto-refresh');
      return NextResponse.next();
    }

    try {
      const verifyUrl = new URL("/api/mitra/verify", request.url);
      const verifyResponse = await fetch(verifyUrl.toString(), {
        method: "GET",
        headers: {
          Cookie: `mitra_session_id=${mitraSessionId}; mitra_access_token=${mitraAccessToken || ""}; mitra_refresh_token=${mitraRefreshToken || ""}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.log('[Middleware] Mitra verify failed:', verifyData);

        // ✅ If verify says it refreshed successfully, allow through
        if (verifyData.refreshed) {
          console.log('[Middleware] Mitra: Token was refreshed, allowing through');
          return NextResponse.next();
        }

        return createLoadingRedirect("/mitra/login", request, "Session expired...");
      }

      // ✅ If response includes refreshed flag, we know token was auto-refreshed
      if (verifyData.refreshed) {
        console.log('[Middleware] Mitra: Token auto-refreshed during verify');
      }

      return NextResponse.next();
    } catch (error) {
      console.error("[Middleware] Mitra verify error:", error);
      // If has refresh token, allow through (verify API might fix it)
      if (mitraRefreshToken) {
        console.log('[Middleware] Mitra verify error but has refresh token - allowing through');
        return NextResponse.next();
      }
      return createLoadingRedirect("/mitra/login", request, "Authentication error...");
    }
  }

  // =============== USER ROUTES ===============

  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // ✅ Simple getToken - no Promise.race, no setTimeout
  // getToken() only decodes JWT from cookie (~1ms, no network calls)
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
    isAuthenticated = true;

    if (
      sessionToken.sessionId &&
      sessionToken.accessToken &&
      sessionToken.refreshToken
    ) {
      if (!sessionId || !accessToken || !refreshToken) {
        needsCustomCookies = true;
      }
    }
  }
  // Check custom auth
  else if (sessionId && (accessToken || refreshToken)) {
    isAuthenticated = true;
  }

  // Protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      return createLoadingRedirect(loginUrl, request, "Please login...");
    }

    if (needsCustomCookies && sessionToken) {
      const response = NextResponse.next();
      setCustomCookiesFromToken(response, sessionToken, {
        sessionId,
        accessToken,
        refreshToken,
      });
      return response;
    }
  }

  // Auth routes (redirect if logged in)
  if (authRoutes.some((route) => pathname === route)) {
    if (isAuthenticated) {
      return createDirectRedirect("/", request);
    }
  }

  // Set custom cookies on any matched route if needed
  if (needsCustomCookies && sessionToken) {
    const response = NextResponse.next();
    setCustomCookiesFromToken(response, sessionToken, {
      sessionId,
      accessToken,
      refreshToken,
    });
    return response;
  }

  return NextResponse.next();
}