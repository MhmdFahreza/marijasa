import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/app/components/lib/prisma';
import { verifyToken } from '@/app/components/lib/token-service';

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

    const gallery = await prisma.vendorGallery.findMany({
      where: {
        vendor_id: tokenPayload.userId,
      },
      orderBy: {
        sort_order: 'asc',
      },
    });

    return NextResponse.json({ gallery });
  } catch (error) {
    console.error('Get gallery error:', error);
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

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const caption = formData.get('caption') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate image size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate image type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Count existing gallery images
    const existingCount = await prisma.vendorGallery.count({
      where: { vendor_id: tokenPayload.userId },
    });

    if (existingCount >= 6) {
      return NextResponse.json(
        { error: 'Maximum 6 portfolio images allowed' },
        { status: 400 }
      );
    }

    // Upload image to public folder
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `${tokenPayload.userId}_${timestamp}_${image.name.replace(/\s+/g, '_')}`;
    const publicPath = join(process.cwd(), 'public', 'uploads', 'gallery');
    
    // Ensure directory exists
    const fs = await import('fs');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    const filepath = join(publicPath, filename);
    await writeFile(filepath, buffer);

    // Create gallery entry
    const galleryItem = await prisma.vendorGallery.create({
      data: {
        vendor_id: tokenPayload.userId,
        image_url: `/uploads/gallery/${filename}`,
        caption: caption || 'Hasil pekerjaan',
        sort_order: existingCount,
      },
    });

    return NextResponse.json({
      gallery: galleryItem,
      message: 'Foto berhasil diupload'
    });
  } catch (error) {
    console.error('Upload gallery error:', error);
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
    const galleryId = searchParams.get('id');

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

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID required' },
        { status: 400 }
      );
    }

    // Check if gallery belongs to vendor
    const existingGallery = await prisma.vendorGallery.findFirst({
      where: {
        gallery_id: galleryId,
        vendor_id: tokenPayload.userId,
      },
    });

    if (!existingGallery) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', existingGallery.image_url);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.vendorGallery.delete({
      where: { gallery_id: galleryId },
    });

    return NextResponse.json({
      message: 'Foto berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete gallery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}