// app/api/call/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/components/lib/prisma';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callerId, callerType, receiverId, receiverType, callType = "VOICE" } = body;

    if (!callerId || !callerType || !receiverId || !receiverType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine user_id and vendor_id based on caller/receiver types
    const userId = callerType === "user" ? callerId : receiverId;
    const vendorId = callerType === "mitra" ? callerId : receiverId;

    // Check if receiver has an active call
    const existingCall = await prisma.call.findFirst({
      where: {
        OR: [
          { caller_id: receiverId, caller_type: receiverType },
          { receiver_id: receiverId, receiver_type: receiverType },
        ],
        status: {
          in: ['INITIATING', 'RINGING', 'ANSWERED'],
        },
      },
    });

    if (existingCall) {
      return NextResponse.json(
        { success: false, error: "Pengguna sedang dalam panggilan lain" },
        { status: 409 }
      );
    }

    // Get or create chat session
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

    // Create call
    const call = await prisma.call.create({
      data: {
        session_id: session.session_id,
        caller_id: callerId,
        caller_type: callerType,
        receiver_id: receiverId,
        receiver_type: receiverType,
        call_type: callType,
        status: 'RINGING',
      },
      include: {
        session: {
          include: {
            user: {
              select: {
                user_id: true,
                name: true,
                avatar: true,
                phone: true,
              },
            },
            vendor: {
              select: {
                vendor_id: true,
                name: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Get caller and receiver info
    const callerInfo = callerType === 'user' ? call.session.user : call.session.vendor;
    const receiverInfo = receiverType === 'user' ? call.session.user : call.session.vendor;

    return NextResponse.json({
      success: true,
      data: {
        callId: call.call_id,
        sessionId: call.session_id,
        callerId: call.caller_id,
        callerType: call.caller_type,
        callerName: callerInfo.name,
        callerAvatar: callerInfo.avatar,
        receiverId: call.receiver_id,
        receiverType: call.receiver_type,
        receiverName: receiverInfo.name,
        receiverAvatar: receiverInfo.avatar,
        callType: call.call_type,
        status: call.status,
        startedAt: call.started_at,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to initiate call");
  }
}