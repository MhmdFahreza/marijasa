// app/api/mitra/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/components/lib/prisma';
import { verifyToken } from '@/app/components/lib/token-service';

// GET - Get vendor profile with services and gallery
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('mitra_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Ambil vendor dengan services dan gallery
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

    // Ambil services aktif untuk sinkronisasi tags
    const activeServices = await prisma.service.findMany({
      where: {
        vendor_id: tokenPayload.userId,
        is_active: true,
      },
      select: {
        name: true,
      },
    });

    // Update tags dari services aktif
    const serviceTags = activeServices.map(service => service.name);
    
    // Jika tags tidak sinkron, update otomatis
    const tagsNeedUpdate = JSON.stringify(vendor.tags) !== JSON.stringify(serviceTags);
    
    if (tagsNeedUpdate && serviceTags.length > 0) {
      await prisma.vendor.update({
        where: { vendor_id: tokenPayload.userId },
        data: { tags: serviceTags },
      });
      vendor.tags = serviceTags;
    }

    return NextResponse.json({
      vendor,
      message: 'Profile berhasil diambil'
    });
  } catch (error) {
    console.error('[Profile API GET] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT - Update vendor profile
export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('mitra_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, service_areas, specialties, avatar } = body;

    // Update vendor profile
    const updatedVendor = await prisma.vendor.update({
      where: { vendor_id: tokenPayload.userId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(service_areas && { service_areas }),
        ...(specialties && { specialties }),
        ...(avatar && { avatar }),
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

    // Setelah update profile, sinkronkan tags dengan services aktif
    const activeServices = await prisma.service.findMany({
      where: {
        vendor_id: tokenPayload.userId,
        is_active: true,
      },
      select: {
        name: true,
      },
    });

    const serviceTags = activeServices.map(service => service.name);
    
    // Update tags jika ada services aktif
    if (serviceTags.length > 0) {
      const vendorWithUpdatedTags = await prisma.vendor.update({
        where: { vendor_id: tokenPayload.userId },
        data: { tags: serviceTags },
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

      console.log('[Profile API PUT] Tags updated:', serviceTags);

      return NextResponse.json({
        vendor: vendorWithUpdatedTags,
        message: 'Profile berhasil diperbarui'
      });
    }

    return NextResponse.json({
      vendor: updatedVendor,
      message: 'Profile berhasil diperbarui'
    });
  } catch (error) {
    console.error('[Profile API PUT] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}