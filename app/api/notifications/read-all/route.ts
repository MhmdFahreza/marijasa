// app/api/notifications/read-all/route.ts
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
    console.log("[Notification Read All API] NextAuth check failed");
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
      console.error("[Notification Read All API] Error verifying session:", error);
    }
  }

  return null;
}

// PUT - Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    console.log("[Notification Read All API] PUT request received");

    const userId = await getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update all unread notifications
    await prisma.userNotification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    console.log("[Notification Read All API] All notifications marked as read");

    return NextResponse.json({
      success: true,
      message: "Semua notifikasi ditandai sebagai dibaca",
    });
  } catch (error) {
    console.error("[Notification Read All API] PUT Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}