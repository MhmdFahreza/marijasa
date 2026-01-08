// app/api/user/favorites/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

// GET - Check if vendor is in favorites
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
          user_id: user.user_id,
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