// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to get user ID from session
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  // Try NextAuth session first
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
    console.log("[Notifications API] NextAuth check failed");
  }

  // Try custom JWT session
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
      console.error("[Notifications API] Error verifying session:", error);
    }
  }

  return null;
}

// GET - Fetch all notifications for user
export async function GET(request: NextRequest) {
  try {
    console.log("[Notifications API] GET request received");

    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", notifications: [] },
        { status: 401 }
      );
    }

    console.log("[Notifications API] Fetching notifications for user:", userId);

    // Fetch notifications from database
    const notifications = await prisma.userNotification.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50, // Limit to last 50 notifications
      include: {
        booking: {
          select: {
            booking_number: true,
            status: true,
          },
        },
      },
    });

    console.log("[Notifications API] Found notifications:", notifications.length);

    // Format notifications for frontend
    const formattedNotifications = notifications.map((notif) => ({
      notification_id: notif.notification_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.is_read,
      order_id: notif.order_id,
      created_at: notif.created_at.toISOString(),
      booking_number: notif.booking?.booking_number,
    }));

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json(
      {
        notifications: formattedNotifications,
        unreadCount,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("[Notifications API] GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error", notifications: [] },
      { status: 500 }
    );
  }
}

// DELETE - Delete all notifications for user
export async function DELETE(request: NextRequest) {
  try {
    console.log("[Notifications API] DELETE request received");

    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all notifications for user
    await prisma.userNotification.deleteMany({
      where: {
        user_id: userId,
      },
    });

    console.log("[Notifications API] All notifications deleted for user:", userId);

    return NextResponse.json({
      success: true,
      message: "Semua notifikasi berhasil dihapus",
    });
  } catch (error) {
    console.error("[Notifications API] DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}