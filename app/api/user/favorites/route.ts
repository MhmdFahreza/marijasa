// app/api/user/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// GET - Get user's favorite vendors
export async function GET(request: NextRequest) {
  try {
    // Try to get NextAuth session first
    const session = await getServerSession();
    
    let userEmail: string | null = null;

    if (session?.user?.email) {
      userEmail = session.user.email;
    } else {
      // Fallback: try custom session/token if NextAuth not found
      const sessionId = request.cookies.get("session_id")?.value;
      const accessToken = request.cookies.get("access_token")?.value;

      if (!sessionId || !accessToken) {
        return NextResponse.json(
          { message: "Unauthorized - Please login" },
          { status: 401 }
        );
      }

      // Import custom token service dynamically
      try {
        const { getSession, verifyToken } = await import("@/app/components/lib/token-service");
        
        const customSession = await getSession(sessionId);
        if (!customSession) {
          return NextResponse.json(
            { message: "Session expired" },
            { status: 401 }
          );
        }

        const tokenPayload = verifyToken(accessToken);
        if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
          return NextResponse.json(
            { message: "Invalid token" },
            { status: 401 }
          );
        }

        // Get user by ID from custom session
        const user = await prisma.user.findUnique({
          where: { user_id: customSession.userId },
        });

        if (!user) {
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 }
          );
        }

        userEmail = user.email;
      } catch (error) {
        console.error("[Custom Session] Error:", error);
        return NextResponse.json(
          { message: "Authentication error" },
          { status: 401 }
        );
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { message: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    // Get user from database by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Get user's favorites with vendor details
    const favorites = await prisma.userFavorite.findMany({
      where: {
        user_id: user.user_id,
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