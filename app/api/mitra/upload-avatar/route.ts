// app/api/mitra/upload-avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/components/lib/prisma";
import { verifyToken } from "@/app/components/lib/token-service";

// ✅ Helper: Convert File to base64 data URL
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64String = buffer.toString("base64");
  return `data:${file.type};base64,${base64String}`;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("mitra_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== "access") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const avatar = formData.get("avatar") as File;

    if (!avatar) {
      return NextResponse.json(
        { error: "No avatar provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (avatar.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!avatar.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Convert to base64 and store in database (no filesystem write)
    console.log(
      "[Mitra Upload Avatar] Converting avatar to base64, size:",
      avatar.size
    );
    const avatarBase64 = await fileToBase64(avatar);
    console.log(
      "[Mitra Upload Avatar] Base64 length:",
      avatarBase64.length,
      "chars"
    );

    // Update vendor avatar in database
    await prisma.vendor.update({
      where: { vendor_id: tokenPayload.userId },
      data: { avatar: avatarBase64 },
    });

    console.log(
      "[Mitra Upload Avatar] Avatar updated for vendor:",
      tokenPayload.userId
    );

    return NextResponse.json({
      avatarUrl: avatarBase64, // ✅ Return base64 string
      message: "Avatar berhasil diupload",
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}