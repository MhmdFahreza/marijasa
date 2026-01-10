// app/api/notifications/[notificationId]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to get user ID from session
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: { user_id: true },
      });
      if (user) return user.user_id;
    }
  } catch (error) {
    console.log("[Notification Read API] NextAuth check failed");
  }

  const sessionId = request.cookies.get("session_id")?.value;
  const accessToken = request.cookies.get("access_token")?.value;

  if (sessionId && accessToken) {
    try {
      const origin = request.nextUrl.origin;
      const meResponse = await fetch(`${origin}/api/auth/me`, {
        method: "GET",
        headers: {
          Cookie: `session_id=${sessionId}; access_token=${accessToken}`,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (meData.authenticated && meData.user) {
          return meData.user.user_id || meData.user.id;
        }
      }
    } catch (error) {
      console.error("[Notification Read API] Error verifying session:", error);
    }
  }

  return null;
}

// PUT - Mark single notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    console.log("[Notification Read API] PUT request for:", notificationId);

    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update notification
    const notification = await prisma.userNotification.updateMany({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
      data: {
        is_read: true,
      },
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    console.log("[Notification Read API] Notification marked as read");

    return NextResponse.json({
      success: true,
      message: "Notifikasi ditandai sebagai dibaca",
    });
  } catch (error) {
    console.error("[Notification Read API] PUT Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}