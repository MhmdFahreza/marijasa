import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/app/components/lib/prisma';
import { verifyToken } from '@/app/components/lib/token-service';

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
    const avatar = formData.get('avatar') as File;

    if (!avatar) {
      return NextResponse.json(
        { error: 'No avatar provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (avatar.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!avatar.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Upload file to public folder
    const bytes = await avatar.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `${tokenPayload.userId}_${timestamp}_avatar${avatar.name.substring(avatar.name.lastIndexOf('.'))}`;
    const publicPath = join(process.cwd(), 'public', 'uploads', 'avatars');
    
    // Ensure directory exists
    const fs = await import('fs');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    const filepath = join(publicPath, filename);
    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update vendor avatar in database
    await prisma.vendor.update({
      where: { vendor_id: tokenPayload.userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({
      avatarUrl,
      message: 'Avatar berhasil diupload'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}