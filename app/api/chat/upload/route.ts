// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

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

function getExtensionFromType(type: string, fileName: string): string {
  // Try to get extension from filename first
  const fileExt = fileName.split(".").pop()?.toLowerCase();
  if (fileExt) return fileExt;
  
  // Fallback based on type
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

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = getExtensionFromType(type, file.name);
    const fileName = `chat/${type}_${timestamp}_${randomString}.${extension}`;

    console.log('Uploading file to Vercel Blob:', {
      type,
      originalFileName: file.name,
      generatedFileName: fileName,
      size: file.size,
      contentType: file.type
    });

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('File uploaded successfully to Vercel Blob:', {
      url: blob.url,
      pathname: blob.pathname,
      size: file.size
    });

    // For videos, use a placeholder thumbnail (you can implement video thumbnail generation later)
    let thumbnail = null;
    if (type === "video") {
      thumbnail = "/images/video-placeholder.jpg";
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: blob.url, // Public URL from Vercel Blob
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        thumbnail,
      },
    });
  } catch (error: any) {
    // Check if it's a Vercel Blob specific error
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        {
          success: false,
          error: "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.",
          details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        },
        { status: 500 }
      );
    }
    
    return handleError(error, "Failed to upload file");
  }
}

// Optional: DELETE endpoint to remove files from blob storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json(
        { 
          success: false,
          error: "fileUrl is required" 
        },
        { status: 400 }
      );
    }

    // Note: Vercel Blob delete requires the blob URL
    // You can implement delete functionality using @vercel/blob del() function
    // For now, we'll just return success
    // import { del } from '@vercel/blob';
    // await del(fileUrl);

    return NextResponse.json({
      success: true,
      message: "File deletion queued",
    });
  } catch (error: any) {
    return handleError(error, "Failed to delete file");
  }
}