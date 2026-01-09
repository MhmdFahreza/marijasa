// app/api/chat/messages/route.ts
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

// GET - Get messages for a chat session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const vendorId = searchParams.get("vendorId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId || !vendorId) {
      return NextResponse.json(
        { 
          success: false,
          error: "userId and vendorId are required" 
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
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { session_id: session.session_id },
      orderBy: { created_at: "asc" },
      skip: offset,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: messages.map((msg) => ({
        id: msg.message_id,
        sessionId: msg.session_id,
        senderId: msg.sender_id,
        senderType: msg.sender_type,
        text: msg.text,
        messageType: msg.message_type,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileType: msg.file_type,
        fileSize: msg.file_size,
        thumbnail: msg.thumbnail,
        duration: msg.duration,
        isRead: msg.is_read,
        readAt: msg.read_at,
        timestamp: msg.created_at,
        isVoiceMessage: msg.message_type === "VOICE",
        isImage: msg.message_type === "IMAGE",
        isVideo: msg.message_type === "VIDEO",
        audioUrl: msg.message_type === "VOICE" ? msg.file_url : undefined,
      })),
    });
  } catch (error: any) {
    return handleError(error, "Failed to fetch messages");
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      vendorId,
      senderId,
      senderType,
      text,
      messageType = "TEXT",
      fileUrl,
      fileName,
      fileType,
      fileSize,
      thumbnail,
      duration,
    } = body;

    if (!userId || !vendorId || !senderId || !senderType) {
      return NextResponse.json(
        { 
          success: false,
          error: "userId, vendorId, senderId, and senderType are required" 
        },
        { status: 400 }
      );
    }

    // Get or create session
    let session = await prisma.chatSession.findUnique({
      where: {
        user_id_vendor_id: {
          user_id: userId,
          vendor_id: vendorId,
        },
      },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          user_id: userId,
          vendor_id: vendorId,
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        session_id: session.session_id,
        sender_id: senderId,
        sender_type: senderType,
        text: text || null,
        message_type: messageType,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
        file_size: fileSize || null,
        thumbnail: thumbnail || null,
        duration: duration || null,
      },
    });

    // Update session with last message info and unread count
    const lastMessageText =
      messageType === "TEXT"
        ? text
        : messageType === "VOICE"
        ? "[Pesan Suara]"
        : messageType === "IMAGE"
        ? "[Gambar]"
        : messageType === "VIDEO"
        ? "[Video]"
        : "[File]";

    // Update unread count based on sender type
    const updateData: any = {
      last_message: lastMessageText,
      last_message_time: new Date(),
    };

    if (senderType === "user") {
      updateData.mitra_unread_count = { increment: 1 };
    } else {
      updateData.user_unread_count = { increment: 1 };
    }

    await prisma.chatSession.update({
      where: { session_id: session.session_id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: message.message_id,
        sessionId: message.session_id,
        senderId: message.sender_id,
        senderType: message.sender_type,
        text: message.text,
        messageType: message.message_type,
        fileUrl: message.file_url,
        fileName: message.file_name,
        fileType: message.file_type,
        fileSize: message.file_size,
        thumbnail: message.thumbnail,
        duration: message.duration,
        isRead: message.is_read,
        readAt: message.read_at,
        timestamp: message.created_at,
        isVoiceMessage: message.message_type === "VOICE",
        isImage: message.message_type === "IMAGE",
        isVideo: message.message_type === "VIDEO",
        audioUrl: message.message_type === "VOICE" ? message.file_url : undefined,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to send message");
  }
}