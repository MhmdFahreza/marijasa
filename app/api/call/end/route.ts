// app/api/call/end/route.ts
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
    const { callId, enderId, enderType } = body;

    if (!callId || !enderId || !enderType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get call
    const call = await prisma.call.findUnique({
      where: { call_id: callId },
    });

    if (!call) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    // Verify ender is part of the call
    if (call.caller_id !== enderId && call.receiver_id !== enderId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Calculate duration if call was answered
    let duration = 0;
    if (call.answered_at) {
      duration = Math.floor((new Date().getTime() - call.answered_at.getTime()) / 1000);
    }

    // Update call status
    const updatedCall = await prisma.call.update({
      where: { call_id: callId },
      data: {
        status: 'ENDED',
        ended_at: new Date(),
        duration: duration,
        end_reason: 'completed',
      },
    });

    // Create hangup signal for the other party
    const otherId = enderId === call.caller_id ? call.receiver_id : call.caller_id;
    const otherType = enderId === call.caller_id ? call.receiver_type : call.caller_type;

    await prisma.callSignal.create({
      data: {
        call_id: callId,
        sender_id: enderId,
        sender_type: enderType,
        signal_type: 'hangup',
        signal_data: { reason: 'user_ended', duration },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        callId: updatedCall.call_id,
        status: updatedCall.status,
        duration: updatedCall.duration,
        endedAt: updatedCall.ended_at,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to end call");
  }
}