// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import bcrypt from "bcryptjs";
import { generateOTP, storeOTP, checkCooldown } from "@/app/components/lib/otp-service";
import { sendOTPEmail } from "@/app/components/lib/email-service";

export const runtime = "nodejs";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("08")) cleaned = "+62" + cleaned.substring(1);
  else if (cleaned.startsWith("62")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+62")) cleaned = "+62" + cleaned;
  return cleaned;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePhoneID(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ""));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: "Body request tidak valid" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const phoneRaw = String(body.phone || "").trim();
    const password = String(body.password || "");

    // Validation
    if (!name || !email || !phoneRaw || !password) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 });
    }

    if (name.length < 2) {
      return NextResponse.json({ message: "Nama harus minimal 2 karakter" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: "Format email tidak valid" }, { status: 400 });
    }

    if (!validatePhoneID(phoneRaw)) {
      return NextResponse.json(
        { message: "Format nomor telepon tidak valid. Gunakan format Indonesia (08xxx atau +628xxx)" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password harus minimal 8 karakter" }, { status: 400 });
    }

    const phone = normalizePhone(phoneRaw);

    // Check cooldown before processing
    const cooldownStatus = await checkCooldown(email, "register");
    if (cooldownStatus.onCooldown) {
      return NextResponse.json(
        { 
          message: `Tunggu ${cooldownStatus.remainingSeconds} detik sebelum meminta kode baru`,
          cooldownRemaining: cooldownStatus.remainingSeconds
        },
        { status: 429 }
      );
    }

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: { user_id: true, email_verified: true },
    });

    if (existingUserByEmail) {
      if (existingUserByEmail.email_verified) {
        return NextResponse.json(
          { message: "Email sudah terdaftar. Silakan login." },
          { status: 409 }
        );
      } else {
        // User exists but not verified - delete old record and allow re-registration
        await prisma.user.delete({ where: { email } });
      }
    }

    // Check if phone already exists
    const existingUserByPhone = await prisma.user.findFirst({
      where: { phone },
      select: { user_id: true },
    });

    if (existingUserByPhone) {
      return NextResponse.json(
        { message: "Nomor telepon sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otpCode = generateOTP();

    // Store OTP in Redis/Memory
    const storeResult = await storeOTP(email, otpCode, "register");
    if (!storeResult.success) {
      return NextResponse.json(
        { message: storeResult.error || "Gagal menyimpan OTP" },
        { status: 500 }
      );
    }

    // Send OTP via email using Resend (or console in dev)
    const emailResult = await sendOTPEmail(email, otpCode, "register");
    if (!emailResult.success) {
      return NextResponse.json(
        { message: "Gagal mengirim email verifikasi. Silakan coba lagi." },
        { status: 500 }
      );
    }

    // Create pending user (email_verified = false)
    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        avatar: "/profile.svg",
        email_verified: false,
        is_active: true,
      },
    });

    console.log(`[Register] OTP sent to ${email}`);

    // Info message based on whether email was actually sent
    const infoMessage = process.env.RESEND_API_KEY
      ? "Kode OTP telah dikirim ke email Anda. Silakan periksa inbox atau folder spam."
      : "Kode OTP telah dibuat. Cek console untuk melihat kode (development mode).";

    return NextResponse.json(
      {
        success: true,
        message: infoMessage,
        email: email,
        // Include OTP in development for testing
        ...(process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY && { devOtp: otpCode }),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Handle Prisma unique constraint error
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Data sudah terdaftar (email atau nomor telepon)." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}