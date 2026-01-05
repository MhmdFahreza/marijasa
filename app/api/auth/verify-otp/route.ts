// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import {
  verifyOTP,
  clearOTPData,
  getRemainingAttempts,
} from "@/app/components/lib/otp-service";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

// JWT Configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret-key";
const JWT_EXPIRES_IN = "30d";
const RESET_JWT_EXPIRES_IN = "10m"; // reset password token berlaku singkat

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

function generateJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateResetToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: RESET_JWT_EXPIRES_IN });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type } = body as {
      email?: string;
      code?: string;
      type?: "register" | "login" | "reset_password";
    };

    // Validation
    if (!email || !code || !type) {
      return NextResponse.json(
        { message: "Email, kode OTP, dan tipe harus diisi" },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { message: "Kode OTP harus 6 digit angka" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check remaining attempts first
    const remainingAttempts = await getRemainingAttempts(normalizedEmail, type);
    if (remainingAttempts <= 0) {
      return NextResponse.json(
        {
          message: "Terlalu banyak percobaan. Silakan minta kode OTP baru.",
          remainingAttempts: 0,
        },
        { status: 429 }
      );
    }

    // Verify OTP from Redis
    const verifyResult = await verifyOTP(normalizedEmail, code, type);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          message: verifyResult.error,
          remainingAttempts: verifyResult.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // OTP verified successfully
    if (type === "register") {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User tidak ditemukan. Silakan daftar ulang." },
          { status: 404 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { user_id: user.user_id },
        data: { email_verified: true },
      });

      // Clear OTP data from Redis
      await clearOTPData(normalizedEmail, "register");

      // Generate JWT for auto-login
      const token = generateJWT({
        userId: updatedUser.user_id,
        email: updatedUser.email,
        role: updatedUser.role,
      });

      const response = NextResponse.json(
        {
          success: true,
          message: "Verifikasi berhasil! Akun Anda sudah aktif.",
          token,
          user: {
            id: updatedUser.user_id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar || "/profile.svg",
            role: updatedUser.role,
          },
        },
        { status: 200 }
      );

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    // ==== RESET PASSWORD FLOW (INI YANG KURANG DI KODE KAMU) ====
    if (type === "reset_password") {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { user_id: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User tidak ditemukan." },
          { status: 404 }
        );
      }

      await clearOTPData(normalizedEmail, "reset_password");

      const resetToken = generateResetToken({
        userId: user.user_id,
        email: user.email,
      });

      const response = NextResponse.json(
        { success: true, message: "Verifikasi berhasil" },
        { status: 200 }
      );

      // Cookie khusus untuk reset password
      response.cookies.set("pw-reset-token", resetToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60, // 10 menit
        path: "/",
      });

      return response;
    }

    // login atau lainnya
    return NextResponse.json(
      { success: true, message: "Verifikasi berhasil" },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
