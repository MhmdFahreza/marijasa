// app/api/master/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/components/lib/prisma';

export async function GET() {
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
        icon: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}