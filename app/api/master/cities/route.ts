// app/api/master/cities/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/components/lib/prisma';

export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}