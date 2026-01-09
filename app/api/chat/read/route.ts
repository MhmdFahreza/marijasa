// app/api/chat/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/components/lib/prisma';

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

// POST - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, vendorId, readerType } = body;

    if (!userId || !vendorId || !readerType) {
      return NextResponse.json(
        { 
          success: false,
          error: "userId, vendorId, and readerType are required" 
        },
        { status: 400 }
      );
    }

    if (readerType !== "user" && readerType !== "mitra") {
      return NextResponse.json(
        { 
          success: false,
          error: "readerType must be 'user' or 'mitra'" 
        },
        { status: 400 }
      );
    }

    // Find the session
    const session = await prisma.chatSession.findUnique({
      where: {
        user_id_vendor_id: {
          user_id: userId,
          vendor_id: vendorId,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: "Chat session not found" 
        },
        { status: 404 }
      );
    }

    // Determine which messages to mark as read based on reader type
    const senderTypeToMark = readerType === "user" ? "mitra" : "user";

    // Update all unread messages from the other party
    await prisma.message.updateMany({
      where: {
        session_id: session.session_id,
        sender_type: senderTypeToMark,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    // Reset the unread count for the reader
    if (readerType === "user") {
      await prisma.chatSession.update({
        where: { session_id: session.session_id },
        data: { user_unread_count: 0 },
      });
    } else {
      await prisma.chatSession.update({
        where: { session_id: session.session_id },
        data: { mitra_unread_count: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error: any) {
    return handleError(error, "Failed to mark messages as read");
  }
}