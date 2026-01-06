// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  createSessionId,
  storeSession,
  storeTokens,
} from "@/app/components/lib/token-service";

export const runtime = "nodejs";

// Normalize phone number to +62 format
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "+62" + cleaned.substring(1);
  } else if (cleaned.startsWith("62")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+62")) {
    cleaned = "+62" + cleaned;
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, isEmail } = body;

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email/Nomor telepon dan password harus diisi" },
        { status: 400 }
      );
    }

    let user = null;

    if (isEmail) {
      // Find by email
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "Email belum terdaftar. Silakan daftar terlebih dahulu.",
            errorType: "EMAIL_NOT_REGISTERED",
          },
          { status: 404 }
        );
      }
    } else {
      // Find by phone
      const normalizedPhone = normalizePhone(identifier);
      user = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "Nomor telepon belum terdaftar. Silakan daftar terlebih dahulu.",
            errorType: "PHONE_NOT_REGISTERED",
          },
          { status: 404 }
        );
      }
    }

    // Check if account is Google OAuth only (no password)
    if (!user.password) {
      return NextResponse.json(
        {
          message: "Akun ini terdaftar melalui Google. Silakan login dengan Google.",
          errorType: "GOOGLE_ACCOUNT",
        },
        { status: 400 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        {
          message: "Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.",
          errorType: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          message: "Akun Anda tidak aktif. Silakan hubungi admin.",
          errorType: "ACCOUNT_INACTIVE",
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          message: "Password salah. Silakan coba lagi.",
          errorType: "INVALID_PASSWORD",
        },
        { status: 401 }
      );
    }

    // Create session ID
    const sessionId = createSessionId();

    // Get user agent and IP
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;

    // Store session in Redis
    const sessionResult = await storeSession(sessionId, {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userAgent,
      ip,
    });

    if (!sessionResult.success) {
      return NextResponse.json(
        { message: "Gagal membuat sesi. Silakan coba lagi." },
        { status: 500 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    // Store tokens in Redis
    const tokensResult = await storeTokens(sessionId, accessToken, refreshToken);
    if (!tokensResult.success) {
      return NextResponse.json(
        { message: "Gagal menyimpan token. Silakan coba lagi." },
        { status: 500 }
      );
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar || "/profile.svg",
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set cookies
    // Session ID cookie (30 days)
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Access Token cookie (1 hour)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    // Refresh Token cookie (30 days)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    console.log(`[Login] Success for user: ${user.email} | Session: ${sessionId}`);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}