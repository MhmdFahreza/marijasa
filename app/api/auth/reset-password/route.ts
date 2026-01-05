import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret-key";

type ResetPayload = { userId: string; email: string; iat?: number; exp?: number };

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("pw-reset-token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Sesi reset password tidak valid atau sudah habis." },
        { status: 401 }
      );
    }

    let payload: ResetPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as ResetPayload;
    } catch {
      return NextResponse.json(
        { message: "Token reset password tidak valid atau sudah habis." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password, confirmPassword } = body as {
      password?: string;
      confirmPassword?: string;
    };

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { message: "Password dan konfirmasi password harus diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Konfirmasi password tidak sama." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { user_id: payload.userId },
      data: { password: hashed },
    });

    const response = NextResponse.json(
      { success: true, message: "Password berhasil diperbarui." },
      { status: 200 }
    );

    // hapus cookie reset
    response.cookies.set("pw-reset-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
