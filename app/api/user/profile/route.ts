// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getSession, verifyToken } from "@/app/components/lib/token-service";

export const runtime = "nodejs";

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { message: "Session expired" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Fetch user profile from database
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
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
    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { message: "Session expired" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { message: "Invalid token" },
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
      where: { user_id: session.userId },
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