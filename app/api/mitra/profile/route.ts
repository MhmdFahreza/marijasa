// app/api/mitra/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/components/lib/prisma';
import { verifyToken, getSession } from '@/app/components/lib/token-service';

// GET - Get vendor profile
export async function GET(request: NextRequest) {
  try {
    // Dapatkan access token dari cookie
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const sessionId = request.cookies.get('mitra_session_id')?.value;

    if (!accessToken || !sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verifikasi access token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Cari vendor di database
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: tokenPayload.userId },
      select: {
        vendor_id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        description: true,
        verified: true,
        status: true,
        rating: true,
        review_count: true,
        service_areas: true,
        specialties: true,
        tags: true,
        category: true,
        join_date: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      vendor,
      message: 'Profile berhasil diambil'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT - Update vendor profile
export async function PUT(request: NextRequest) {
  try {
    // Dapatkan access token dari cookie
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const sessionId = request.cookies.get('mitra_session_id')?.value;

    if (!accessToken || !sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verifikasi access token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, service_areas, specialties } = body;

    // Update vendor profile
    const updatedVendor = await prisma.vendor.update({
      where: { vendor_id: tokenPayload.userId },
      data: {
        name,
        description,
        service_areas,
        specialties,
        updated_at: new Date(),
      },
      select: {
        vendor_id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        description: true,
        verified: true,
        status: true,
        rating: true,
        review_count: true,
        service_areas: true,
        specialties: true,
        tags: true,
        category: true,
        join_date: true,
        updated_at: true,
      }
    });

    return NextResponse.json({
      vendor: updatedVendor,
      message: 'Profile berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}