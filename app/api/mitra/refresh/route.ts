// app/api/mitra/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, verifyToken } from '@/app/components/lib/token-service';
import prisma from '@/app/components/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Dapatkan refresh token dari cookie
    const refreshToken = request.cookies.get('mitra_refresh_token')?.value;
    const sessionId = request.cookies.get('mitra_session_id')?.value;

    console.log('[Mitra Refresh API] Refresh attempt:', {
      hasRefreshToken: !!refreshToken,
      hasSessionId: !!sessionId,
      sessionId: sessionId
    });

    if (!refreshToken || !sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verifikasi refresh token
    const refreshPayload = verifyToken(refreshToken);
    if (!refreshPayload || refreshPayload.type !== 'refresh') {
      console.log('[Mitra Refresh API] Invalid refresh token');
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    console.log('[Mitra Refresh API] Refresh token payload:', {
      userId: refreshPayload.userId,
      email: refreshPayload.email,
      role: refreshPayload.role,
      sessionId: refreshPayload.sessionId
    });

    // Cek apakah vendor masih ada di database
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: refreshPayload.userId },
      select: { vendor_id: true, email: true, status: true }
    });

    if (!vendor || vendor.status !== 'ACTIVE') {
      console.log('[Mitra Refresh API] Vendor not found or inactive');
      return NextResponse.json(
        { error: 'Vendor tidak ditemukan atau tidak aktif' },
        { status: 401 }
      );
    }

    // Refresh access token
    const result = await refreshAccessToken(sessionId, refreshToken);
    
    if (!result.success) {
      console.log('[Mitra Refresh API] Refresh failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    console.log('[Mitra Refresh API] Token refreshed successfully');

    // Set cookie access token baru
    const response = NextResponse.json({
      message: 'Token refreshed successfully'
    });

    response.cookies.set('mitra_access_token', result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 jam
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Mitra Refresh API] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}