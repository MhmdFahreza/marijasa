// app/api/user/upload-avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyToken } from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// POST - Upload avatar (save as base64 in database)
export async function POST(request: NextRequest) {
  try {
    console.log("[Upload Avatar] 📸 Starting avatar upload process...");

    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionId || !accessToken) {
      console.log("[Upload Avatar] ❌ Missing session or access token");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSession(sessionId);
    if (!session) {
      console.log("[Upload Avatar] ❌ Session not found in Redis");
      return NextResponse.json(
        { message: "Session expired" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      console.log("[Upload Avatar] ❌ Invalid token");
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    console.log("[Upload Avatar] ✅ User authenticated:", session.userId);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      console.log("[Upload Avatar] ❌ No file in request");
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log("[Upload Avatar] 📁 File received:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.log("[Upload Avatar] ❌ Invalid file type:", file.type);
      return NextResponse.json(
        { message: "Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log("[Upload Avatar] ❌ File too large:", file.size);
      return NextResponse.json(
        { message: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { user_id: session.userId },
      select: { 
        avatar: true,
        email: true,
        name: true
      }
    });

    if (!currentUser) {
      console.log("[Upload Avatar] ❌ User not found in database");
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log("[Upload Avatar] 👤 Current user:", {
      email: currentUser.email,
      name: currentUser.name,
      hasOldAvatar: !!currentUser.avatar
    });

    // Convert file to base64 string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    console.log("[Upload Avatar] 🔄 Converted to base64, size:", base64String.length, "chars");

    // CRITICAL: Save base64 string directly to database
    console.log("[Upload Avatar] 💾 Saving to database...");
    const updatedUser = await prisma.user.update({
      where: { user_id: session.userId },
      data: {
        avatar: base64String,
        updated_at: new Date(),
      },
      select: {
        user_id: true,
        email: true,
        name: true,
        avatar: true,
        updated_at: true
      }
    });

    console.log("[Upload Avatar] ✅ Database updated successfully:", {
      user_id: updatedUser.user_id,
      email: updatedUser.email,
      avatar_length: updatedUser.avatar?.length || 0,
      avatar_preview: updatedUser.avatar?.substring(0, 50) + "...",
      updated_at: updatedUser.updated_at
    });

    // Verify the data was saved correctly
    const verifyUser = await prisma.user.findUnique({
      where: { user_id: session.userId },
      select: { avatar: true }
    });

    console.log("[Upload Avatar] 🔍 Verification - Avatar in DB:", {
      exists: !!verifyUser?.avatar,
      length: verifyUser?.avatar?.length || 0,
      isBase64: verifyUser?.avatar?.startsWith('data:image') || false
    });

    if (!verifyUser?.avatar || verifyUser.avatar !== base64String) {
      console.error("[Upload Avatar] ❌ CRITICAL: Avatar not saved correctly!");
      throw new Error("Avatar gagal tersimpan ke database");
    }

    console.log("[Upload Avatar] ✅ SUCCESS - Avatar saved to database as base64");

    return NextResponse.json(
      {
        success: true,
        message: "Avatar berhasil diupload",
        avatarUrl: base64String,
        user: {
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Upload Avatar] ❌ CRITICAL ERROR:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { 
        message: "Gagal mengupload avatar",
        error: error instanceof Error ? error.message : "Unknown error",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}