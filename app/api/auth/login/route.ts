// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/components/lib/prisma"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

// Generate simple token (dalam production gunakan JWT)
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password, isEmail } = body

    // Validasi input
    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email/Nomor telepon dan password harus diisi" },
        { status: 400 }
      )
    }

    // Validasi password length
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter" },
        { status: 400 }
      )
    }

    let user = null

    if (isEmail) {
      // Cari user berdasarkan email
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() }
      })
    } else {
      // Cari user berdasarkan nomor telepon
      user = await prisma.user.findFirst({
        where: { phone: identifier }
      })
    }

    // Cek apakah user ditemukan
    if (!user) {
      const identifierType = isEmail ? "Email" : "Nomor telepon"
      return NextResponse.json(
        { message: `${identifierType} tidak terdaftar. Silakan daftar terlebih dahulu.` },
        { status: 404 }
      )
    }

    // Cek apakah user memiliki password (bukan OAuth user)
    if (!user.password) {
      return NextResponse.json(
        { message: "Akun ini terdaftar melalui Google. Silakan login dengan Google." },
        { status: 400 }
      )
    }

    // Cek apakah email sudah diverifikasi
    if (!user.email_verified) {
      return NextResponse.json(
        { message: "Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu." },
        { status: 403 }
      )
    }

    // Cek apakah akun aktif
    if (!user.is_active) {
      return NextResponse.json(
        { message: "Akun Anda tidak aktif. Silakan hubungi admin." },
        { status: 403 }
      )
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Password salah. Silakan coba lagi." },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken()

    // Return user data (tanpa password)
    return NextResponse.json(
      {
        message: "Login berhasil",
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

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
