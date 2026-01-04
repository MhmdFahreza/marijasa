// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/components/lib/prisma"
import { randomBytes } from "crypto"
import { OTPType } from "@/app/generated/prisma"

// Generate simple token (dalam production gunakan JWT)
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, type } = body

    // Validasi input
    if (!email || !code || !type) {
      return NextResponse.json(
        { message: "Email, kode OTP, dan tipe harus diisi" },
        { status: 400 }
      )
    }

    // Validasi kode OTP format (6 digit)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { message: "Kode OTP harus 6 digit angka" },
        { status: 400 }
      )
    }

    // Mapping type string ke enum
    const otpType = type === "register" ? OTPType.REGISTER : 
                    type === "login" ? OTPType.LOGIN : 
                    OTPType.RESET_PASSWORD

    // Cari OTP record
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type: otpType,
        verified: false
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if (!otpRecord) {
      return NextResponse.json(
        { message: "Kode OTP tidak ditemukan atau sudah digunakan. Silakan minta kode baru." },
        { status: 404 }
      )
    }

    // Cek apakah OTP sudah expired
    if (new Date() > otpRecord.expires_at) {
      return NextResponse.json(
        { message: "Kode OTP sudah kadaluarsa. Silakan minta kode baru." },
        { status: 410 }
      )
    }

    // Verifikasi kode OTP
    if (otpRecord.code !== code) {
      return NextResponse.json(
        { message: "Kode OTP salah. Silakan coba lagi." },
        { status: 401 }
      )
    }

    // Update OTP sebagai verified
    await prisma.oTPCode.update({
      where: { otp_id: otpRecord.otp_id },
      data: { verified: true }
    })

    // Jika tipe register, update user email_verified
    if (type === "register") {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        return NextResponse.json(
          { message: "User tidak ditemukan" },
          { status: 404 }
        )
      }

      // Update email verified status
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { email_verified: true }
      })

      // Generate token
      const token = generateToken()

      // Hapus semua OTP untuk email ini
      await prisma.oTPCode.deleteMany({
        where: {
          email: email.toLowerCase(),
          type: OTPType.REGISTER
        }
      })

      return NextResponse.json(
        {
          message: "Verifikasi berhasil! Akun Anda sudah aktif.",
          token: token,
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar || "/profile.svg",
            role: user.role
          }
        },
        { status: 200 }
      )
    }

    // Untuk tipe lain (login, reset_password)
    return NextResponse.json(
      { message: "Verifikasi berhasil" },
      { status: 200 }
    )

  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
