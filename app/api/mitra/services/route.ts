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

    console.log('[Services API] Updated vendor tags:', tags);
  } catch (error) {
    console.error('[Services API] Error updating vendor tags:', error);
  }
}

// ✅ Helper: Auto-create services dari vendor tags jika belum ada services
async function ensureServicesFromTags(vendorId: string): Promise<any[]> {
  try {
    // Cek vendor dan tags-nya
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: vendorId },
      select: {
        vendor_id: true,
        name: true,
        tags: true,
        specialties: true,
      },
    });

    if (!vendor) {
      console.log('[Services API] Vendor not found:', vendorId);
      return [];
    }

    // Gunakan tags atau specialties sebagai sumber layanan
    const serviceTags = vendor.tags?.length > 0 ? vendor.tags : vendor.specialties || [];

    if (serviceTags.length === 0) {
      console.log('[Services API] No tags/specialties found for vendor:', vendorId);
      return [];
    }

    console.log('[Services API] Auto-creating services from tags:', serviceTags);

    // Buat services dari tags
    const createdServices = [];
    for (const tagName of serviceTags) {
      try {
        const service = await prisma.service.create({
          data: {
            vendor_id: vendor.vendor_id,
            name: tagName,
            description: `Layanan ${tagName} oleh ${vendor.name}`,
            price: 0,
            price_type: 'FIXED',
            is_active: true,
          },
        });
        createdServices.push(service);
        console.log('[Services API] Auto-created service:', service.name, service.service_id);
      } catch (createError) {
        console.error('[Services API] Error creating service from tag:', tagName, createError);
      }
    }

    return createdServices;
  } catch (error) {
    console.error('[Services API] Error in ensureServicesFromTags:', error);
    return [];
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

    // Fetch services
    let services = await prisma.service.findMany({
      where: {
        vendor_id: tokenPayload.userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log('[Services API GET] Total services found:', services.length);

    // ✅ FALLBACK: Jika tidak ada services, coba buat dari tags vendor
    if (services.length === 0) {
      console.log('[Services API GET] No services found, attempting to create from vendor tags...');
      const autoCreated = await ensureServicesFromTags(tokenPayload.userId);
      
      if (autoCreated.length > 0) {
        // Fetch ulang setelah auto-create
        services = await prisma.service.findMany({
          where: {
            vendor_id: tokenPayload.userId,
          },
          orderBy: {
            created_at: 'desc',
          },
        });
        console.log('[Services API GET] Services after auto-create:', services.length);
      }
    }

    // Fetch gallery
    const gallery = await prisma.vendorGallery.findMany({
      where: {
        vendor_id: tokenPayload.userId,
      },
      orderBy: {
        sort_order: 'asc',
      },
    });

    console.log('[Services API GET] Active services:', services.filter(s => s.is_active === true).length);
    console.log('[Services API GET] Gallery items:', gallery.length);

    return NextResponse.json({
      services,
      gallery,
    });
  } catch (error) {
    console.error('[Services API GET] Error:', error);
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

    console.log('[Services API POST] Creating service:', { name, price, price_type, is_active });

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Nama, deskripsi, dan harga wajib diisi' },
        { status: 400 }
      );
    }

    // PERBAIKAN: Pastikan is_active adalah boolean
    const isActiveBoolean = is_active === true || is_active === 'true' || is_active === 1;

    // Create service
    const service = await prisma.service.create({
      data: {
        vendor_id: tokenPayload.userId,
        name,
        description,
        price: parseFloat(price),
        price_type,
        estimated_time,
        is_active: isActiveBoolean,
      },
    });

    console.log('[Services API POST] Service created:', {
      id: service.service_id,
      name: service.name,
      is_active: service.is_active,
      is_active_type: typeof service.is_active
    });

    // Update vendor tags dengan layanan baru
    await updateVendorTags(tokenPayload.userId);

    return NextResponse.json({
      service,
      message: 'Layanan berhasil ditambahkan'
    });
  } catch (error) {
    console.error('[Services API POST] Error:', error);
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

    console.log('[Services API PUT] Updating service:', { service_id, is_active });

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

    // PERBAIKAN: Pastikan is_active adalah boolean saat update
    let isActiveBoolean = existingService.is_active;
    if (is_active !== undefined) {
      isActiveBoolean = is_active === true || is_active === 'true' || is_active === 1;
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
        is_active: isActiveBoolean,
        updated_at: new Date(),
      },
    });

    console.log('[Services API PUT] Service updated:', {
      id: service.service_id,
      name: service.name,
      is_active: service.is_active,
      is_active_type: typeof service.is_active
    });

    // Update vendor tags setelah edit layanan
    await updateVendorTags(tokenPayload.userId);

    return NextResponse.json({
      service,
      message: 'Layanan berhasil diperbarui'
    });
  } catch (error) {
    console.error('[Services API PUT] Error:', error);
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

    console.log('[Services API DELETE] Deleting service:', serviceId);

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
    console.error('[Services API DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}