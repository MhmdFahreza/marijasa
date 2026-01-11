// app/api/call/active/route.ts
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");
    const participantType = searchParams.get("participantType");

    if (!participantId || !participantType) {
      return NextResponse.json(
        { success: false, error: "participantId and participantType are required" },
        { status: 400 }
      );
    }

    // Find active call where participant is either caller or receiver
    const call = await prisma.call.findFirst({
      where: {
        OR: [
          { caller_id: participantId, caller_type: participantType },
          { receiver_id: participantId, receiver_type: participantType },
        ],
        status: {
          in: ['INITIATING', 'RINGING', 'ANSWERED'],
        },
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
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!call) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Get caller and receiver info
    const callerInfo = call.caller_type === 'user' ? call.session.user : call.session.vendor;
    const receiverInfo = call.receiver_type === 'user' ? call.session.user : call.session.vendor;

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
        offer: call.offer,
        answer: call.answer,
        startedAt: call.started_at,
        answeredAt: call.answered_at,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to get active call");
  }
}