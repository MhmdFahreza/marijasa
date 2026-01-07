// app/api/user/favorites/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyToken } from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// GET - Check if vendor is in favorites
export async function GET(request: NextRequest) {
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

    // Get vendorId from query params
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { message: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Check if favorite exists
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        user_id_vendor_id: {
          user_id: session.userId,
          vendor_id: vendorId,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        isFavorite: !!favorite,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Favorites Check] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}