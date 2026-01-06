// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import {
  verifyOTP,
  clearOTPData,
  getRemainingAttempts,
  getTempUserData,
  deleteTempUserData,
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
      // Ambil data sementara dari Redis
      const tempUserData = await getTempUserData(normalizedEmail, "register");
      
      if (!tempUserData) {
        return NextResponse.json(
          { message: "Data pendaftaran tidak ditemukan. Silakan daftar ulang." },
          { status: 404 }
        );
      }

      // Cek apakah email sudah terdaftar (mungkin terdaftar oleh user lain saat proses OTP)
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        await deleteTempUserData(normalizedEmail, "register");
        await clearOTPData(normalizedEmail, "register");
        
        return NextResponse.json(
          { message: "Email sudah terdaftar. Silakan login." },
          { status: 409 }
        );
      }

      // Buat user baru di database
      const newUser = await prisma.user.create({
        data: {
          name: tempUserData.name,
          email: normalizedEmail,
          phone: tempUserData.phone,
          password: tempUserData.password,
          avatar: "/profile.svg",
          email_verified: true,
          is_active: true,
        },
      });

      // Hapus data sementara dan OTP dari Redis
      await deleteTempUserData(normalizedEmail, "register");
      await clearOTPData(normalizedEmail, "register");

      // Generate JWT for auto-login
      const token = generateJWT({
        userId: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
      });

      const response = NextResponse.json(
        {
          success: true,
          message: "Verifikasi berhasil! Akun Anda sudah aktif.",
          token,
          user: {
            id: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            avatar: newUser.avatar || "/profile.svg",
            role: newUser.role,
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

    // ==== RESET PASSWORD FLOW ====
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

    // Untuk login atau type lainnya
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