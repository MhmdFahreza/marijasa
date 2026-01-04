// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/components/lib/prisma"
import bcrypt from "bcryptjs"
import { OTPType, Prisma } from "@/app/generated/prisma"

export const runtime = "nodejs" // penting untuk Prisma

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, "")
  if (cleaned.startsWith("08")) cleaned = "+62" + cleaned.substring(1)
  else if (cleaned.startsWith("62")) cleaned = "+" + cleaned
  else if (!cleaned.startsWith("+62")) cleaned = "+62" + cleaned
  return cleaned
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

function validatePhoneID(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ""))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ message: "Body request tidak valid" }, { status: 400 })
    }

    const name = String(body.name || "").trim()
    const email = String(body.email || "").toLowerCase().trim()
    const phoneRaw = String(body.phone || "").trim()
    const password = String(body.password || "")

    if (!name || !email || !phoneRaw || !password) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 })
    }

    if (name.length < 2) {
      return NextResponse.json({ message: "Nama harus minimal 2 karakter" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: "Format email tidak valid" }, { status: 400 })
    }

    if (!validatePhoneID(phoneRaw)) {
      return NextResponse.json(
        { message: "Format nomor telepon tidak valid. Gunakan format Indonesia (08xxx atau +628xxx)" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password harus minimal 8 karakter" }, { status: 400 })
    }

    const phone = normalizePhone(phoneRaw)

    const hashedPassword = await bcrypt.hash(password, 12)

    const otpCode =
      process.env.NODE_ENV === "development" ? "123456" : generateOTP()

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    const result = await prisma.$transaction(async (tx) => {
      const existingUserByEmail = await tx.user.findUnique({
        where: { email },
        select: { user_id: true },
      })
      if (existingUserByEmail) {
        return { ok: false as const, status: 409, message: "Email sudah terdaftar. Silakan login." }
      }

      const existingUserByPhone = await tx.user.findFirst({
        where: { phone },
        select: { user_id: true },
      })
      if (existingUserByPhone) {
        return { ok: false as const, status: 409, message: "Nomor telepon sudah terdaftar. Silakan login." }
      }

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          avatar: "/profile.svg",
          email_verified: false,
          is_active: true,
        },
        select: { user_id: true, email: true },
      })

      await tx.oTPCode.deleteMany({
        where: {
          email,
          type: OTPType.REGISTER,
        },
      })

      const otpRecord = await tx.oTPCode.create({
        data: {
          user_id: newUser.user_id,
          email,
          code: otpCode,
          type: OTPType.REGISTER,
          expires_at: otpExpiry,
          verified: false,
        },
        select: { otp_id: true },
      })

      return {
        ok: true as const,
        status: 201,
        message: "Registrasi berhasil. Silakan verifikasi email Anda.",
        otpId: otpRecord.otp_id,
      }
    })

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${email}: ${otpCode}`)
    }

    return NextResponse.json(
      {
        message: result.message,
        otpId: result.otpId,
        ...(process.env.NODE_ENV === "development" && { devOtp: otpCode }),
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error("Registration error:", err)

    // Error Prisma yang "known"
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed
      if (err.code === "P2002") {
        return NextResponse.json(
          { message: "Data sudah terdaftar (email atau nomor telepon)." },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { message: "Database error. Silakan coba lagi." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
