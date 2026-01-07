// app/api/user/favorites/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyToken } from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// POST - Remove vendor from favorites
export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get("session_id")?.value;
    const accessToken = request.cookies.get("access_token")?.value;

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { message: "Session expired" },
        { status: 401 }
      );
    }

    // Verify token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { message: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Remove from favorites
    await prisma.userFavorite.delete({
      where: {
        user_id_vendor_id: {
          user_id: session.userId,
          vendor_id: vendorId,
        },
      },
    }).catch(() => {
      // Ignore error if favorite doesn't exist
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vendor berhasil dihapus dari favorit",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Favorites Remove] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}