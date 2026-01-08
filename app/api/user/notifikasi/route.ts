// app/api/notifikasi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", notifications: [] },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { user_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", notifications: [] },
        { status: 404 }
      );
    }

    // TODO: Fetch notifications from database
    // Example query:
    // const notifications = await prisma.notification.findMany({
    //   where: { user_id: user.user_id },
    //   orderBy: { created_at: 'desc' },
    //   take: 50,
    // });

    // Mock response for now
    const mockNotifications = [
      {
        id: "1",
        title: "Pesanan Diterima",
        message: "Pesanan Anda untuk jasa kebersihan telah diterima vendor",
        time: "10:30",
        date: "2024-01-15",
        type: "order",
        read: false,
        orderId: "ORD-001",
      },
      {
        id: "2",
        title: "Pembayaran Berhasil",
        message: "Pembayaran untuk pesanan ORD-001 telah berhasil",
        time: "11:45",
        date: "2024-01-15",
        type: "payment",
        read: true,
        orderId: "ORD-001",
      },
    ];

    return NextResponse.json({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.read).length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  } catch (error) {
    console.error("[Notifications API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", notifications: [] },
      { status: 500 }
    );
  }
}