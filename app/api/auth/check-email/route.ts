// app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/components/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body

    // Cek email jika diberikan
    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (existingUserByEmail) {
        return NextResponse.json(
          { 
            exists: true, 
            field: "email",
            message: "Email sudah terdaftar" 
          },
          { status: 200 }
        )
      }
    }

    // Cek phone jika diberikan
    if (phone) {
      const existingUserByPhone = await prisma.user.findFirst({
        where: { phone: phone }
      })

      if (existingUserByPhone) {
        return NextResponse.json(
          { 
            exists: true, 
            field: "phone",
            message: "Nomor telepon sudah terdaftar" 
          },
          { status: 200 }
        )
      }
    }

    return NextResponse.json(
      { 
        exists: false,
        message: "Email dan nomor telepon tersedia" 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Check email error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
