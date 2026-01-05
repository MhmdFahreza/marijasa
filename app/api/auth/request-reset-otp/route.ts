import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import {
  generateOTP,
  storeOTP,
  checkCooldown,
  getRemainingAttempts,
} from "@/app/components/lib/otp-service";
import { sendOTPEmail } from "@/app/components/lib/email-service";

export const runtime = "nodejs";

function isEmail(value: string) {
  return value.includes("@");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  // Simpel: buang spasi, strip, kurung. Pertahankan "+" jika ada.
  return phone.trim().replace(/[()\-\s]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body as { identifier?: string };

    if (!identifier) {
      return NextResponse.json(
        { message: "Email atau nomor telepon harus diisi" },
        { status: 400 }
      );
    }

    const raw = String(identifier).trim();
    const identifierType = isEmail(raw) ? "email" : "phone";

    // Cari user berdasarkan email atau phone
    const user = await prisma.user.findFirst({
      where:
        identifierType === "email"
          ? { email: normalizeEmail(raw) }
          : { phone: normalizePhone(raw) },
      select: { user_id: true, email: true, phone: true, email_verified: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          message:
            identifierType === "email"
              ? "Email tidak terdaftar"
              : "Nomor telepon tidak terdaftar",
        },
        { status: 404 }
      );
    }

    // OTP akan dikirim via EMAIL (karena email-service yang tersedia memang email)
    const destinationEmail = user.email.toLowerCase();
    const otpType = "reset_password" as const;

    // cooldown pakai key email tujuan (stabil)
    const cooldownStatus = await checkCooldown(destinationEmail, otpType);
    if (cooldownStatus.onCooldown) {
      return NextResponse.json(
        {
          message: `Tunggu ${cooldownStatus.remainingSeconds} detik sebelum meminta kode baru`,
          cooldownRemaining: cooldownStatus.remainingSeconds,
        },
        { status: 429 }
      );
    }

    const otpCode = generateOTP();

    const storeResult = await storeOTP(destinationEmail, otpCode, otpType);
    if (!storeResult.success) {
      return NextResponse.json(
        { message: storeResult.error || "Gagal menyimpan OTP" },
        { status: 500 }
      );
    }

    const emailResult = await sendOTPEmail(destinationEmail, otpCode, otpType);
    if (!emailResult.success) {
      return NextResponse.json(
        { message: emailResult.error || "Gagal mengirim OTP" },
        { status: 500 }
      );
    }

    const remainingAttempts = await getRemainingAttempts(destinationEmail, otpType);

    return NextResponse.json(
      {
        success: true,
        message:
          identifierType === "email"
            ? "OTP telah dikirim ke email Anda"
            : "OTP telah dikirim ke email yang terdaftar pada akun Anda",
        // penting untuk step berikutnya
        otpTargetEmail: destinationEmail,
        remainingAttempts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Request reset OTP error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
