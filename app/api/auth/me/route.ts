// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret-key";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: "Tidak ada token" },
        { status: 401 }
      );
    }

    // Verify JWT
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (err) {
      return NextResponse.json(
        { authenticated: false, message: "Token tidak valid atau sudah kadaluarsa" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        email_verified: true,
        is_active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { authenticated: false, message: "Akun tidak aktif" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar || "/profile.svg",
          role: user.role,
          emailVerified: user.email_verified,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { authenticated: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}