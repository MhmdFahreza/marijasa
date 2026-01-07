// app/api/mitra/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/components/lib/prisma';
import { verifyToken } from '@/app/components/lib/token-service';

// Helper function untuk update tags vendor
async function updateVendorTags(vendorId: string) {
  try {
    // Ambil semua layanan aktif vendor
    const activeServices = await prisma.service.findMany({
      where: {
        vendor_id: vendorId,
        is_active: true,
      },
      select: {
        name: true,
      },
    });

    // Ekstrak nama layanan untuk tags
    const tags = activeServices.map(service => service.name);

    // Update vendor dengan tags baru
    await prisma.vendor.update({
      where: { vendor_id: vendorId },
      data: { tags },
    });
  } catch (error) {
    console.error('Error updating vendor tags:', error);
  }
}

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
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const [services, gallery] = await Promise.all([
      prisma.service.findMany({
        where: {
          vendor_id: tokenPayload.userId,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.vendorGallery.findMany({
        where: {
          vendor_id: tokenPayload.userId,
        },
        orderBy: {
          sort_order: 'asc',
        },
      })
    ]);

    return NextResponse.json({
      services,
      gallery,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, price_type, estimated_time, is_active } = body;

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Nama, deskripsi, dan harga wajib diisi' },
        { status: 400 }
      );
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        vendor_id: tokenPayload.userId,
        name,
        description,
        price: parseFloat(price),
        price_type,
        estimated_time,
        is_active: is_active ?? true,
      },
    });

    // Update vendor tags dengan layanan baru
    await updateVendorTags(tokenPayload.userId);

    return NextResponse.json({
      service,
      message: 'Layanan berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { service_id, name, description, price, price_type, estimated_time, is_active } = body;

    if (!service_id) {
      return NextResponse.json(
        { error: 'Service ID required' },
        { status: 400 }
      );
    }

    // Check if service belongs to vendor
    const existingService = await prisma.service.findFirst({
      where: {
        service_id,
        vendor_id: tokenPayload.userId,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Update service
    const service = await prisma.service.update({
      where: { service_id },
      data: {
        name: name ?? existingService.name,
        description: description ?? existingService.description,
        price: price !== undefined ? parseFloat(price) : existingService.price,
        price_type: price_type ?? existingService.price_type,
        estimated_time: estimated_time ?? existingService.estimated_time,
        is_active: is_active !== undefined ? is_active : existingService.is_active,
        updated_at: new Date(),
      },
    });

    // Update vendor tags setelah edit layanan
    await updateVendorTags(tokenPayload.userId);

    return NextResponse.json({
      service,
      message: 'Layanan berhasil diperbarui'
    });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID required' },
        { status: 400 }
      );
    }

    // Check if service belongs to vendor
    const existingService = await prisma.service.findFirst({
      where: {
        service_id: serviceId,
        vendor_id: tokenPayload.userId,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Delete service
    await prisma.service.delete({
      where: { service_id: serviceId },
    });

    // Update vendor tags setelah hapus layanan
    await updateVendorTags(tokenPayload.userId);

    return NextResponse.json({
      message: 'Layanan berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}