// app/api/call/incoming/route.ts
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
    const receiverId = searchParams.get("receiverId");
    const receiverType = searchParams.get("receiverType");

    if (!receiverId || !receiverType) {
      return NextResponse.json(
        { success: false, error: "receiverId and receiverType are required" },
        { status: 400 }
      );
    }

    // Find incoming call (RINGING status, where user is receiver)
    const call = await prisma.call.findFirst({
      where: {
        receiver_id: receiverId,
        receiver_type: receiverType,
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

    // Check for timeout
    const elapsedSeconds = Math.floor((Date.now() - call.started_at.getTime()) / 1000);
    
    if (elapsedSeconds > RINGING_TIMEOUT_SECONDS) {
      // Update to MISSED
      await prisma.call.update({
        where: { call_id: call.call_id },
        data: {
          status: 'MISSED',
          ended_at: new Date(),
          end_reason: 'timeout',
        },
      });

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
        startedAt: call.started_at,
      },
    });
  } catch (error: any) {
    return handleError(error, "Failed to check incoming calls");
  }
}