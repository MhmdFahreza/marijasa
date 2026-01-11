// app/api/call/answer/route.ts
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
    const { callId, receiverId, receiverType } = body;

    if (!callId || !receiverId || !receiverType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get call
    const call = await prisma.call.findUnique({
      where: { call_id: callId },
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

    if (!call) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    // Verify receiver
    if (call.receiver_id !== receiverId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if call can be answered
    if (call.status !== 'RINGING' && call.status !== 'INITIATING') {
      return NextResponse.json(
        { success: false, error: "Call cannot be answered" },
        { status: 400 }
      );
    }

    // Update call status
    const updatedCall = await prisma.call.update({
      where: { call_id: callId },
      data: {
        status: 'ANSWERED',
        answered_at: new Date(),
      },
    });

    // Get caller and receiver info
    const callerInfo = call.caller_type === 'user' ? call.session.user : call.session.vendor;
    const receiverInfo = call.receiver_type === 'user' ? call.session.user : call.session.vendor;

    return NextResponse.json({
      success: true,
      data: {
        callId: updatedCall.call_id,
        sessionId: updatedCall.session_id,
        callerId: updatedCall.caller_id,
        callerType: updatedCall.caller_type,
        callerName: callerInfo.name,
        callerAvatar: callerInfo.avatar,
        receiverId: updatedCall.receiver_id,
        receiverType: updatedCall.receiver_type,
        receiverName: receiverInfo.name,
        receiverAvatar: receiverInfo.avatar,
        callType: updatedCall.call_type,
        status: updatedCall.status,
        offer: updatedCall.offer,
        startedAt: updatedCall.started_at,
        answeredAt: updatedCall.answered_at,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to answer call");
  }
}