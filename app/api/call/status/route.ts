// app/api/call/status/route.ts
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

const RINGING_TIMEOUT_SECONDS = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json(
        { success: false, error: "callId is required" },
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
              },
            },
            vendor: {
              select: {
                vendor_id: true,
                name: true,
                avatar: true,
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

    // Check for ringing timeout
    if (call.status === 'RINGING' || call.status === 'INITIATING') {
      const elapsedSeconds = Math.floor((Date.now() - call.started_at.getTime()) / 1000);
      
      if (elapsedSeconds > RINGING_TIMEOUT_SECONDS) {
        // Update to MISSED
        await prisma.call.update({
          where: { call_id: callId },
          data: {
            status: 'MISSED',
            ended_at: new Date(),
            end_reason: 'timeout',
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            callId: call.call_id,
            status: 'MISSED',
            endReason: 'timeout',
          },
        });
      }
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
        startedAt: call.started_at,
        answeredAt: call.answered_at,
        endedAt: call.ended_at,
        duration: call.duration,
        endReason: call.end_reason,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to get call status");
  }
}