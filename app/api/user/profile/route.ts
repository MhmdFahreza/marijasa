// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getSession, verifyToken, refreshAccessToken } from "@/app/components/lib/token-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";

// ============================================
// Helper: Get authenticated user ID from request
// Supports both custom JWT and NextAuth (Google OAuth)
// ============================================
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // STRATEGY 1: Custom JWT cookies
  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (sessionId && (accessToken || refreshToken)) {
    // Verify session in Redis
    const session = await getSession(sessionId);
    if (!session) return null;

    // Try access token first
    if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      if (tokenPayload && tokenPayload.sessionId === sessionId) {
        return session.userId;
      }
    }

    // Try refresh if access token invalid
    if (refreshToken) {
      const refreshResult = await refreshAccessToken(sessionId, refreshToken);
      if (refreshResult.success) {
        return session.userId;
      }
    }
  }

  // STRATEGY 2: NextAuth session (Google OAuth fallback)
  const nextAuthToken = request.cookies.get("next-auth.session-token")?.value;
  if (nextAuthToken) {
    try {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user?.email) {
        // Get user ID from database using email
        const user = await prisma.user.findUnique({
          where: { email: nextAuthSession.user.email.toLowerCase() },
          select: { user_id: true, is_active: true },
        });

        if (user && user.is_active) {
          return user.user_id;
        }
      }
    } catch (error) {
      console.error("[Profile Auth] NextAuth check failed:", error);
    }
  }

  return null;
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user profile from database
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        gps_link: true,
        avatar: true,
        created_at: true,
        role: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      return NextResponse.json(
        { message: "User not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Profile GET] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, address, gps_link, avatar } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { message: "Nama harus minimal 2 karakter" },
        { status: 400 }
      );
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        name: name.trim(),
        address: address ? address.trim() : null,
        gps_link: gps_link ? gps_link.trim() : null,
        avatar: avatar || null,
        updated_at: new Date(),
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        gps_link: true,
        avatar: true,
        created_at: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profil berhasil diperbarui",
        profile: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Profile PUT] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}