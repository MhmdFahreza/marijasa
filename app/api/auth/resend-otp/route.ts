// app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/components/lib/prisma"
import { OTPType } from "@/app/generated/prisma"

// Generate 6 digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type } = body

    // Validasi input
    if (!email || !type) {
      return NextResponse.json(
        { message: "Email dan tipe harus diisi" },
        { status: 400 }
      )
    }

    // Mapping type string ke enum
    const otpType = type === "register" ? OTPType.REGISTER : 
                    type === "login" ? OTPType.LOGIN : 
                    OTPType.RESET_PASSWORD

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { message: "Email tidak ditemukan" },
        { status: 404 }
      )
    }

    // Cek rate limiting - tidak boleh request OTP lebih dari 1x per menit
    const recentOTP = await prisma.oTPCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: otpType,
        created_at: {
          gte: new Date(Date.now() - 60 * 1000) // 1 menit yang lalu
        }
      }
    })

    if (recentOTP) {
      const waitTime = Math.ceil((60 * 1000 - (Date.now() - recentOTP.created_at.getTime())) / 1000)
      return NextResponse.json(
        { message: `Tunggu ${waitTime} detik sebelum meminta kode baru` },
        { status: 429 }
      )
    }

    // Generate OTP code baru (dummy: 123456 untuk testing)
    const otpCode = process.env.NODE_ENV === "development" ? "123456" : generateOTP()
    
    // Simpan OTP ke database
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 menit
    
    // Hapus OTP lama yang belum terverifikasi
    await prisma.oTPCode.deleteMany({
      where: {
        email: email.toLowerCase(),
        type: otpType,
        verified: false
      }
    })

    // Buat OTP baru
    const otpRecord = await prisma.oTPCode.create({
      data: {
        user_id: user.user_id,
        email: email.toLowerCase(),
        code: otpCode,
        type: otpType,
        expires_at: otpExpiry,
        verified: false
      }
    })

    // TODO: Kirim email OTP (implementasi email service)
    // await sendOTPEmail(email, otpCode)
    
    // Untuk development, log OTP
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Resent OTP for ${email}: ${otpCode}`)
    }

    return NextResponse.json(
      { 
        message: "Kode OTP baru telah dikirim ke email Anda",
        otpId: otpRecord.otp_id,
        // Hanya untuk development
        ...(process.env.NODE_ENV === "development" && { devOtp: otpCode })
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Resend OTP error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
