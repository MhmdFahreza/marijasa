// app/api/master/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const cities = await prisma.city.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        { sort_order: 'asc' },
        { name: 'asc' },
      ],
      select: {
        city_id: true,
        name: true,
        province: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: cities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Cities API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}