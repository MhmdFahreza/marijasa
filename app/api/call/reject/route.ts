// app/api/call/reject/route.ts
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

    // Update call status
    await prisma.call.update({
      where: { call_id: callId },
      data: {
        status: 'REJECTED',
        ended_at: new Date(),
        end_reason: 'rejected',
      },
    });

    // Create reject signal for caller
    await prisma.callSignal.create({
      data: {
        call_id: callId,
        sender_id: receiverId,
        sender_type: receiverType,
        signal_type: 'reject',
        signal_data: { reason: 'rejected' },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Call rejected",
    });
  } catch (error: any) {
    return handleError(error, "Failed to reject call");
  }
}