// app/api/mitra/gallery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
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

    console.log('[Gallery API] Fetched gallery items:', gallery.length);

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

    console.log('[Gallery Upload] Received image:', image?.name, 'size:', image?.size);

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

    console.log('[Gallery Upload] Existing gallery count:', existingCount);

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
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = image.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filename = `gallery_${tokenPayload.userId}_${timestamp}_${randomString}_${originalName}`;
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'gallery');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log('[Gallery Upload] Created upload directory:', uploadDir);
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    console.log('[Gallery Upload] File saved to:', filepath);

    // Create gallery entry
    const galleryItem = await prisma.vendorGallery.create({
      data: {
        vendor_id: tokenPayload.userId,
        image_url: `/uploads/gallery/${filename}`,
        caption: caption || 'Hasil pekerjaan',
        sort_order: existingCount,
      },
    });

    console.log('[Gallery Upload] Gallery item created:', galleryItem.gallery_id);

    return NextResponse.json({
      gallery: galleryItem,
      message: 'Foto berhasil diupload'
    });
  } catch (error) {
    console.error('Upload gallery error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
    try {
      const { unlink } = await import('fs/promises');
      const filePath = join(process.cwd(), 'public', existingGallery.image_url);
      
      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log('[Gallery Delete] File deleted:', filePath);
      }
    } catch (fileError) {
      console.error('[Gallery Delete] Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.vendorGallery.delete({
      where: { gallery_id: galleryId },
    });

    console.log('[Gallery Delete] Gallery item deleted:', galleryId);

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