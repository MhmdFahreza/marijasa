// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Error handler helper
function handleError(error: any, message: string = "An error occurred") {
  console.error(`${message}:`, error);
  
  return NextResponse.json(
    { 
      success: false,
      error: error.message || message,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    },
    { status: 500 }
  );
}

function getExtensionFromType(type: string): string {
  switch (type) {
    case "image":
      return "jpg";
    case "video":
      return "mp4";
    case "voice":
      return "webm";
    default:
      return "bin";
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: "No file provided" 
        },
        { status: 400 }
      );
    }

    if (!type || !['image', 'video', 'voice', 'file'].includes(type)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid file type. Must be 'image', 'video', 'voice', or 'file'" 
        },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "chat");
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || getExtensionFromType(type);
    const fileName = `${type}_${timestamp}_${randomString}.${extension}`;
    const filePath = join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/chat/${fileName}`;

    // For videos, use a placeholder thumbnail
    let thumbnail = null;
    if (type === "video") {
      thumbnail = "/images/video-placeholder.jpg";
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        thumbnail,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to upload file");
  }
}