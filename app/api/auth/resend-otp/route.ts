// app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { generateOTP, storeOTP, checkCooldown, getRemainingAttempts, getTempUserData } from "@/app/components/lib/otp-service";
import { sendOTPEmail } from "@/app/components/lib/email-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    // Validation
    if (!email || !type) {
      return NextResponse.json(
        { message: "Email dan tipe harus diisi" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const otpType = type as "register" | "login" | "reset_password";

    // Check cooldown
    const cooldownStatus = await checkCooldown(normalizedEmail, otpType);
    if (cooldownStatus.onCooldown) {
      return NextResponse.json(
        { 
          message: `Tunggu ${cooldownStatus.remainingSeconds} detik sebelum meminta kode baru`,
          cooldownRemaining: cooldownStatus.remainingSeconds
        },
        { status: 429 }
      );
    }

    // Untuk register, cek apakah ada data sementara
    if (type === "register") {
      const tempData = await getTempUserData(normalizedEmail, "register");
      if (!tempData) {
        return NextResponse.json(
          { message: "Data pendaftaran tidak ditemukan. Silakan daftar ulang." },
          { status: 404 }
        );
      }
    } else {
      // Untuk reset_password dan login, cek apakah user ada
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Email tidak ditemukan" },
          { status: 404 }
        );
      }

      // For register type, check if already verified
      if (type === "reset_password" && !user.email_verified) {
        return NextResponse.json(
          { message: "Email belum diverifikasi. Silakan verifikasi email terlebih dahulu." },
          { status: 400 }
        );
      }
    }

    // Generate new OTP
    const otpCode = generateOTP();

    // Store OTP in Redis
    const storeResult = await storeOTP(normalizedEmail, otpCode, otpType);
    if (!storeResult.success) {
      return NextResponse.json(
        { message: storeResult.error || "Gagal menyimpan OTP" },
        { status: 500 }
      );
    }

    // Send OTP via email
    const emailResult = await sendOTPEmail(normalizedEmail, otpCode, otpType);
    if (!emailResult.success) {
      return NextResponse.json(
        { message: "Gagal mengirim email verifikasi. Silakan coba lagi." },
        { status: 500 }
      );
    }

    // Get remaining attempts for info
    const remainingAttempts = await getRemainingAttempts(normalizedEmail, otpType);

    console.log(`[Resend OTP] New OTP sent to ${normalizedEmail}`);

    return NextResponse.json(
      { 
        success: true,
        message: "Kode OTP baru telah dikirim ke email Anda",
        remainingAttempts: remainingAttempts
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}