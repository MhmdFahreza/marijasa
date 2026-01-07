// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// PENTING: Set runtime ke nodejs
export const config = {
  matcher: [
    "/profile/:path*",
    "/riwayat_pemesanan/:path*",
    "/vendor_favorit/:path*",
    "/login",
    "/register",
    "/register/otp",
  ],
  runtime: "nodejs", // Tambahkan ini
};

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

  // Simple check: user is authenticated if has session OR sessionToken
  let isAuthenticated = false;

  // Check NextAuth session first (for Google OAuth)
  if (sessionToken) {
    isAuthenticated = true;
  }
  // Check custom auth (session + access token)
  else if (sessionId && accessToken) {
    // For custom auth, we'll validate in the API routes
    // Here we just check if cookies exist
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