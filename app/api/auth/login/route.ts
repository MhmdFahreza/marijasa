// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

// JWT Configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret-key";
const JWT_EXPIRES_IN = "30d"; // 30 days

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
            errorType: "EMAIL_NOT_REGISTERED"
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
            errorType: "PHONE_NOT_REGISTERED"
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
          errorType: "GOOGLE_ACCOUNT"
        },
        { status: 400 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { 
          message: "Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.",
          errorType: "EMAIL_NOT_VERIFIED"
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { 
          message: "Akun Anda tidak aktif. Silakan hubungi admin.",
          errorType: "ACCOUNT_INACTIVE"
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
          errorType: "INVALID_PASSWORD"
        },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = generateJWT({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    });

    // Create response with HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        token: token,
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

    // Set HTTP-only cookie for token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}