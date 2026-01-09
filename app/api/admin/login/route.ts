// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { nanoid } from "nanoid";
import redis, { isRedisAvailable } from "@/app/components/lib/redis";
import prisma from "@/app/components/lib/prisma";

// JWT Secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-min-32-characters-long"
);

// Token expiration times
const ACCESS_TOKEN_EXPIRES = 60 * 60; // 1 hour in seconds
const REFRESH_TOKEN_EXPIRES = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_EXPIRES = 30 * 24 * 60 * 60; // 30 days in seconds

// Generate JWT token
async function generateToken(
  payload: any,
  expiresIn: number
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(JWT_SECRET);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const normalizedEmail = email.toLowerCase().trim();
    console.log("[Admin Login] Attempting login for:", normalizedEmail);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email dan password harus diisi",
          errorType: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Debug: Check all admins in database
    const allAdmins = await prisma.admin.findMany({
      select: {
        admin_id: true,
        email: true,
        name: true,
        is_active: true,
      },
    });
    console.log("[Admin Login] All admins in database:", allAdmins);

    // Find admin by email (case-insensitive search)
    const admin = await prisma.admin.findFirst({
      where: { 
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        }
      },
    });

    console.log("[Admin Login] Admin found:", admin ? {
      id: admin.admin_id,
      email: admin.email,
      name: admin.name,
      is_active: admin.is_active
    } : "null");

    if (!admin) {
      console.log("[Admin Login] Admin not found for email:", normalizedEmail);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah",
          errorType: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Check if admin is active
    if (!admin.is_active) {
      console.log("[Admin Login] Admin account is inactive:", email);
      return NextResponse.json(
        {
          success: false,
          error: "Akun admin tidak aktif. Silakan hubungi administrator.",
          errorType: "ACCOUNT_INACTIVE",
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      console.log("[Admin Login] Invalid password for:", email);
      return NextResponse.json(
        {
          success: false,
          error: "Email atau password salah",
          errorType: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Generate session ID
    const sessionId = nanoid(32);

    // Generate tokens
    const accessToken = await generateToken(
      {
        adminId: admin.admin_id,
        email: admin.email,
        type: "access",
      },
      ACCESS_TOKEN_EXPIRES
    );

    const refreshToken = await generateToken(
      {
        adminId: admin.admin_id,
        email: admin.email,
        sessionId: sessionId,
        type: "refresh",
      },
      REFRESH_TOKEN_EXPIRES
    );

    // Store session, access token, and refresh token in Redis
    if (isRedisAvailable() && redis) {
      try {
        const sessionData = {
          adminId: admin.admin_id,
          email: admin.email,
          name: admin.name,
          createdAt: new Date().toISOString(),
          lastAccess: new Date().toISOString(),
        };

        // Store session
        await redis.setex(
          `admin_session:${sessionId}`,
          SESSION_EXPIRES,
          JSON.stringify(sessionData)
        );

        // Store access token
        await redis.setex(
          `admin_access_token:${sessionId}`,
          ACCESS_TOKEN_EXPIRES,
          accessToken
        );

        // Store refresh token (ONLY ONE KEY)
        await redis.setex(
          `admin_refresh_token:${sessionId}`,
          REFRESH_TOKEN_EXPIRES,
          refreshToken
        );

        console.log("[Admin Login] Session and tokens stored in Redis:", {
          sessionId,
          adminId: admin.admin_id,
          email: admin.email,
        });
      } catch (redisError) {
        console.error("[Admin Login] Redis error:", redisError);
        // Continue without Redis if it fails
      }
    } else {
      console.warn("[Admin Login] Redis not available, tokens stored only in cookies");
    }

    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        admin: {
          id: admin.admin_id,
          email: admin.email,
          name: admin.name,
          avatar: admin.avatar,
        },
      },
      { status: 200 }
    );

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Session ID cookie (30 days)
    response.cookies.set("admin_session_id", sessionId, {
      ...cookieOptions,
      maxAge: SESSION_EXPIRES,
    });

    // Access token cookie (1 hour)
    response.cookies.set("admin_access_token", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_EXPIRES,
    });

    // Refresh token cookie (30 days)
    response.cookies.set("admin_refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_EXPIRES,
    });

    console.log("[Admin Login] Login successful for:", admin.email);

    return response;
  } catch (error) {
    console.error("[Admin Login] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan saat login",
        errorType: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}