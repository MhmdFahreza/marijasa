// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import jwt from "jsonwebtoken";
import {
  verifyOTP,
  getTempUserData,
  deleteTempUserData,
} from "@/app/components/lib/otp-service";
import {
  generateAccessToken,
  generateRefreshToken,
  createSessionId,
  storeSession,
  storeTokens,
} from "@/app/components/lib/token-service";

export const runtime = "nodejs";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type } = body;

    // Validation
    if (!email || !code || !type) {
      return NextResponse.json(
        { message: "Email, code, dan type harus diisi" },
        { status: 400 }
      );
    }

    // Verify OTP
    const verifyResult = await verifyOTP(email, code, type);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          message:
            verifyResult.error || "Kode OTP salah atau sudah kedaluwarsa",
          remainingAttempts: verifyResult.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Handle different types
    if (type === "register") {
      // Get temporary user data from Redis
      const tempUserData = await getTempUserData(email, "register");

      if (!tempUserData) {
        return NextResponse.json(
          {
            message:
              "Data pendaftaran tidak ditemukan. Silakan daftar ulang.",
          },
          { status: 404 }
        );
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          name: tempUserData.name,
          email: tempUserData.email,
          phone: tempUserData.phone,
          password: tempUserData.password,
          email_verified: true,
          is_active: true,
          role: "USER",
        },
      });

      // Delete temporary data
      await deleteTempUserData(email, "register");

      // Create session and tokens
      const sessionId = createSessionId();
      const userAgent =
        request.headers.get("user-agent") || undefined;
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined;

      // Store session
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
          { message: "Gagal membuat sesi. Silakan login manual." },
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

      // Store tokens
      const tokensResult = await storeTokens(
        sessionId,
        accessToken,
        refreshToken
      );
      if (!tokensResult.success) {
        return NextResponse.json(
          { message: "Gagal menyimpan token. Silakan login manual." },
          { status: 500 }
        );
      }

      // Create response
      const response = NextResponse.json(
        {
          success: true,
          message: "Verifikasi berhasil! Akun Anda telah dibuat.",
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
      response.cookies.set("session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      response.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });

      response.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      console.log(
        `[Register] User created and logged in: ${user.email}`
      );

      return response;
    } else if (type === "reset_password") {
      // ============================================================
      // FIX: Cari user lalu buat JWT pw-reset-token dan set ke cookie
      // ============================================================
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { user_id: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User tidak ditemukan." },
          { status: 404 }
        );
      }

      // Buat JWT token untuk reset password (berlaku 10 menit)
      const resetToken = jwt.sign(
        { userId: user.user_id, email: user.email },
        JWT_SECRET,
        { expiresIn: "10m" }
      );

      const response = NextResponse.json(
        {
          success: true,
          message: "Verifikasi berhasil. Silakan atur password baru.",
        },
        { status: 200 }
      );

      // Set cookie pw-reset-token agar route reset-password bisa membacanya
      response.cookies.set("pw-reset-token", resetToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60, // 10 menit
        path: "/",
      });

      console.log(
        `[ResetPassword] pw-reset-token cookie set for: ${user.email}`
      );

      return response;
    } else if (type === "login") {
      // For future 2FA implementation
      return NextResponse.json(
        {
          success: true,
          message: "Verifikasi berhasil.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Tipe verifikasi tidak valid" },
      { status: 400 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}