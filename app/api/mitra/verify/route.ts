// app/api/mitra/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getSession } from '@/app/components/lib/token-service';
import prisma from '@/app/components/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Dapatkan access token dari cookie
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const sessionId = request.cookies.get('mitra_session_id')?.value;

    console.log('[Mitra Verify API] Checking authentication:', {
      hasAccessToken: !!accessToken,
      hasSessionId: !!sessionId,
      sessionId: sessionId
    });

    if (!accessToken || !sessionId) {
      console.log('[Mitra Verify API] Missing credentials');
      return NextResponse.json(
        { error: 'Unauthorized', valid: false },
        { status: 401 }
      );
    }

    // Verifikasi access token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      console.log('[Mitra Verify API] Invalid access token');
      return NextResponse.json(
        { error: 'Invalid access token', valid: false },
        { status: 401 }
      );
    }

    console.log('[Mitra Verify API] Token payload:', {
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      role: tokenPayload.role,
      sessionId: tokenPayload.sessionId
    });

    // Verify session ID matches
    if (tokenPayload.sessionId !== sessionId) {
      console.log('[Mitra Verify API] Session ID mismatch');
      return NextResponse.json(
        { error: 'Session mismatch', valid: false },
        { status: 401 }
      );
    }

    // Cek session di Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log('[Mitra Verify API] Session not found in Redis');
      return NextResponse.json(
        { error: 'Session expired', valid: false },
        { status: 401 }
      );
    }

    console.log('[Mitra Verify API] Session found:', {
      userId: session.userId,
      email: session.email,
      role: session.role
    });

    // Cek apakah vendor masih ada di database
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: tokenPayload.userId },
      select: { 
        vendor_id: true, 
        email: true, 
        name: true,
        avatar: true,
        status: true,
        verified: true
      }
    });

    if (!vendor) {
      console.log('[Mitra Verify API] Vendor not found in database');
      return NextResponse.json(
        { error: 'Vendor tidak ditemukan', valid: false },
        { status: 401 }
      );
    }

    if (vendor.status !== 'ACTIVE') {
      console.log('[Mitra Verify API] Vendor not active');
      return NextResponse.json(
        { error: 'Vendor tidak aktif', valid: false },
        { status: 401 }
      );
    }

    console.log('[Mitra Verify API] Verification successful for:', vendor.email);

    return NextResponse.json({
      vendor: {
        id: vendor.vendor_id,
        email: vendor.email,
        name: vendor.name,
        avatar: vendor.avatar,
        verified: vendor.verified,
        status: vendor.status,
      },
      valid: true
    });
  } catch (error) {
    console.error('[Mitra Verify API] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', valid: false },
      { status: 500 }
    );
  }
}