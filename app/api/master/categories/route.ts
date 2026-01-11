// app/api/master/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/components/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        { sort_order: 'asc' },
        { name: 'asc' },
      ],
      select: {
        category_id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
      },
    });

    console.log('[Categories API] Found categories:', categories.map(c => ({ slug: c.slug, name: c.name })));

    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Categories API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}