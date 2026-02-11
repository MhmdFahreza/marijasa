// app/api/chat/presence/route.ts
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

// POST - Update online presence (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, participantType, isOnline } = body;

    if (!participantId || !participantType) {
      return NextResponse.json(
        { 
          success: false,
          error: "participantId and participantType are required" 
        },
        { status: 400 }
      );
    }

    if (participantType !== "user" && participantType !== "mitra") {
      return NextResponse.json(
        { 
          success: false,
          error: "participantType must be 'user' or 'mitra'" 
        },
        { status: 400 }
      );
    }

    const online = isOnline !== false; // default to true

    console.log(`[Presence] Setting ${participantType} ${participantId} to ${online ? 'ONLINE' : 'OFFLINE'}`);

    if (participantType === "user") {
      await prisma.user.update({
        where: { user_id: participantId },
        data: { is_online: online },
      });
    } else {
      await prisma.vendor.update({
        where: { vendor_id: participantId },
        data: { is_online: online },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to ${online ? 'online' : 'offline'}`,
      isOnline: online,
    });
  } catch (error: any) {
    // If user/vendor not found, don't throw 500
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false,
          error: "Participant not found" 
        },
        { status: 404 }
      );
    }
    return handleError(error, "Failed to update presence");
  }
}

// GET - Get online status of a participant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");
    const participantType = searchParams.get("participantType");

    if (!participantId || !participantType) {
      return NextResponse.json(
        { 
          success: false,
          error: "participantId and participantType are required" 
        },
        { status: 400 }
      );
    }

    let isOnline = false;

    if (participantType === "user") {
      const user = await prisma.user.findUnique({
        where: { user_id: participantId },
        select: { is_online: true },
      });
      isOnline = user?.is_online || false;
    } else if (participantType === "mitra") {
      const vendor = await prisma.vendor.findUnique({
        where: { vendor_id: participantId },
        select: { is_online: true },
      });
      isOnline = vendor?.is_online || false;
    }

    return NextResponse.json({
      success: true,
      participantId,
      participantType,
      isOnline,
    });
  } catch (error: any) {
    return handleError(error, "Failed to get presence");
  }
}