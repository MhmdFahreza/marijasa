// app/api/chat/sessions/route.ts
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

// GET - Get chat sessions for a user or vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const vendorId = searchParams.get("vendorId");
    const type = searchParams.get("type"); // 'user' or 'mitra'

    if (!userId && !vendorId) {
      return NextResponse.json(
        { 
          success: false,
          error: "userId or vendorId is required" 
        },
        { status: 400 }
      );
    }

    let sessions;

    if (type === "user" && userId) {
      // Get sessions for user
      sessions = await prisma.chatSession.findMany({
        where: { user_id: userId },
        include: {
          vendor: {
            select: {
              vendor_id: true,
              name: true,
              avatar: true,
              phone: true,
              verified: true,
              is_online: true,
            },
          },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { last_message_time: "desc" },
      });

      return NextResponse.json({
        success: true,
        data: sessions.map((session) => ({
          id: session.session_id,
          sessionId: session.session_id,
          userId: session.user_id,
          mitraId: session.vendor_id,
          mitraName: session.vendor.name,
          mitraAvatar: session.vendor.avatar,
          mitraPhone: session.vendor.phone,
          mitraVerified: session.vendor.verified,
          mitraOnline: session.vendor.is_online,
          lastMessage: session.last_message || "",
          timestamp: session.last_message_time,
          userUnreadCount: session.user_unread_count,
          mitraUnreadCount: session.mitra_unread_count,
        })),
      });
    } else if (type === "mitra" && vendorId) {
      // Get sessions for vendor/mitra
      sessions = await prisma.chatSession.findMany({
        where: { vendor_id: vendorId },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              avatar: true,
              phone: true,
              is_online: true,
            },
          },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { last_message_time: "desc" },
      });

      return NextResponse.json({
        success: true,
        data: sessions.map((session) => ({
          id: session.session_id,
          sessionId: session.session_id,
          userId: session.user_id,
          userName: session.user.name,
          userAvatar: session.user.avatar,
          userPhone: session.user.phone,
          userOnline: session.user.is_online,
          mitraId: session.vendor_id,
          lastMessage: session.last_message || "",
          timestamp: session.last_message_time,
          userUnreadCount: session.user_unread_count,
          mitraUnreadCount: session.mitra_unread_count,
        })),
      });
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Invalid type parameter. Must be 'user' or 'mitra'" 
      },
      { status: 400 }
    );
  } catch (error: any) {
    return handleError(error, "Failed to fetch chat sessions");
  }
}

// POST - Create or get existing chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, vendorId } = body;

    if (!userId || !vendorId) {
      return NextResponse.json(
        { 
          success: false,
          error: "userId and vendorId are required" 
        },
        { status: 400 }
      );
    }

    // Check if session already exists
    let session = await prisma.chatSession.findUnique({
      where: {
        user_id_vendor_id: {
          user_id: userId,
          vendor_id: vendorId,
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            avatar: true,
            phone: true,
            is_online: true,
          },
        },
        vendor: {
          select: {
            vendor_id: true,
            name: true,
            avatar: true,
            phone: true,
            verified: true,
            is_online: true,
          },
        },
        messages: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    // If session doesn't exist, create it
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          user_id: userId,
          vendor_id: vendorId,
        },
        include: {
          user: {
            select: {
              user_id: true,
              name: true,
              avatar: true,
              phone: true,
              is_online: true,
            },
          },
          vendor: {
            select: {
              vendor_id: true,
              name: true,
              avatar: true,
              phone: true,
              verified: true,
              is_online: true,
            },
          },
          messages: {
            orderBy: { created_at: "asc" },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.session_id,
        sessionId: session.session_id,
        userId: session.user_id,
        userName: session.user.name,
        userAvatar: session.user.avatar,
        userPhone: session.user.phone,
        userOnline: session.user.is_online,
        mitraId: session.vendor_id,
        mitraName: session.vendor.name,
        mitraAvatar: session.vendor.avatar,
        mitraPhone: session.vendor.phone,
        mitraVerified: session.vendor.verified,
        mitraOnline: session.vendor.is_online,
        lastMessage: session.last_message || "",
        timestamp: session.last_message_time,
        userUnreadCount: session.user_unread_count,
        mitraUnreadCount: session.mitra_unread_count,
        messages: session.messages.map((msg) => ({
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
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to create/get chat session");
  }
}