// app/api/call/signal/route.ts
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

// GET - Get pending signals for a participant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");
    const receiverId = searchParams.get("receiverId");
    const receiverType = searchParams.get("receiverType");

    if (!callId || !receiverId || !receiverType) {
      return NextResponse.json(
        { success: false, error: "callId, receiverId, and receiverType are required" },
        { status: 400 }
      );
    }

    // Get unprocessed signals for this participant (signals NOT sent by them)
    const signals = await prisma.callSignal.findMany({
      where: {
        call_id: callId,
        is_processed: false,
        NOT: {
          sender_id: receiverId,
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Mark signals as processed
    if (signals.length > 0) {
      await prisma.callSignal.updateMany({
        where: {
          signal_id: {
            in: signals.map(s => s.signal_id),
          },
        },
        data: {
          is_processed: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: signals.map(signal => ({
        signalId: signal.signal_id,
        callId: signal.call_id,
        senderId: signal.sender_id,
        senderType: signal.sender_type,
        signalType: signal.signal_type,
        signalData: signal.signal_data,
        createdAt: signal.created_at,
      })),
    });
  } catch (error: any) {
    return handleError(error, "Failed to get signals");
  }
}

// POST - Send a signal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, senderId, senderType, signalType, signalData } = body;

    if (!callId || !senderId || !senderType || !signalType || !signalData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if call exists
    const call = await prisma.call.findUnique({
      where: { call_id: callId },
    });

    if (!call) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    // Create signal
    const signal = await prisma.callSignal.create({
      data: {
        call_id: callId,
        sender_id: senderId,
        sender_type: senderType,
        signal_type: signalType,
        signal_data: signalData,
      },
    });

    // Update call with offer/answer if applicable
    if (signalType === 'offer') {
      await prisma.call.update({
        where: { call_id: callId },
        data: { offer: signalData },
      });
    } else if (signalType === 'answer') {
      await prisma.call.update({
        where: { call_id: callId },
        data: { answer: signalData },
      });
    } else if (signalType === 'ice-candidate') {
      // Append ICE candidate to the appropriate field
      const field = senderId === call.caller_id ? 'ice_candidates_caller' : 'ice_candidates_receiver';
      const currentCandidates = (call[field] as any[]) || [];
      await prisma.call.update({
        where: { call_id: callId },
        data: {
          [field]: [...currentCandidates, signalData],
        },
      });
    } else if (signalType === 'hangup') {
      await prisma.call.update({
        where: { call_id: callId },
        data: {
          status: 'ENDED',
          ended_at: new Date(),
          end_reason: 'hangup',
        },
      });
    } else if (signalType === 'reject') {
      await prisma.call.update({
        where: { call_id: callId },
        data: {
          status: 'REJECTED',
          ended_at: new Date(),
          end_reason: 'rejected',
        },
      });
    } else if (signalType === 'busy') {
      await prisma.call.update({
        where: { call_id: callId },
        data: {
          status: 'BUSY',
          ended_at: new Date(),
          end_reason: 'busy',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        signalId: signal.signal_id,
        callId: signal.call_id,
        signalType: signal.signal_type,
        createdAt: signal.created_at,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to send signal");
  }
}