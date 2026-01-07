// app/api/user/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyToken } from "@/app/components/lib/token-service";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// GET - Get user's favorite vendors
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

    // Get user's favorites with vendor details
    const favorites = await prisma.userFavorite.findMany({
      where: {
        user_id: session.userId,
      },
      include: {
        vendor: {
          select: {
            vendor_id: true,
            name: true,
            avatar: true,
            rating: true,
            review_count: true,
            tags: true,
            verified: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format the response
    const formattedFavorites = favorites.map(fav => ({
      id: fav.vendor.vendor_id,
      name: fav.vendor.name,
      avatar: fav.vendor.avatar,
      rating: fav.vendor.rating,
      reviewCount: fav.vendor.review_count,
      tags: fav.vendor.tags,
      verified: fav.vendor.verified,
      addedAt: fav.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        favorites: formattedFavorites,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Favorites List] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}