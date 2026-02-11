// app/api/mitra/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyToken, 
  getSession, 
  getAccessToken, 
  refreshAccessToken,
  updateSessionActivity 
} from '@/app/components/lib/token-service';
import prisma from '@/app/components/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const sessionId = request.cookies.get('mitra_session_id')?.value;
    const refreshToken = request.cookies.get('mitra_refresh_token')?.value;

    console.log('[Mitra Verify API] Checking authentication:', {
      hasAccessToken: !!accessToken,
      hasSessionId: !!sessionId,
      hasRefreshToken: !!refreshToken,
      sessionId: sessionId
    });

    if (!sessionId) {
      console.log('[Mitra Verify API] Missing session ID');
      return NextResponse.json(
        { error: 'Unauthorized', valid: false },
        { status: 401 }
      );
    }

    // Cek session di Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log('[Mitra Verify API] Session not found in Redis');
      return NextResponse.json(
        { error: 'Session expired', valid: false, shouldRefresh: false },
        { status: 401 }
      );
    }

    console.log('[Mitra Verify API] Session found:', {
      userId: session.userId,
      email: session.email,
      role: session.role
    });

    // ✅ AUTO-REFRESH: If no access token but has refresh token, auto-refresh
    if (!accessToken && refreshToken) {
      console.log('[Mitra Verify API] No access token but has refresh token - auto-refreshing...');
      
      const refreshResult = await refreshAccessToken(sessionId, refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        console.log('[Mitra Verify API] Auto-refresh successful');
        
        // Get vendor data
        const vendor = await prisma.vendor.findUnique({
          where: { vendor_id: session.userId },
          select: { 
            vendor_id: true, 
            email: true, 
            name: true,
            avatar: true,
            status: true,
            verified: true
          }
        });

        if (!vendor || vendor.status !== 'ACTIVE') {
          console.log('[Mitra Verify API] Vendor not found or inactive');
          return NextResponse.json(
            { error: 'Vendor tidak ditemukan atau tidak aktif', valid: false },
            { status: 401 }
          );
        }

        // Update session activity
        await updateSessionActivity(sessionId);

        // Return success with new access token in cookie
        const response = NextResponse.json({
          vendor: {
            id: vendor.vendor_id,
            email: vendor.email,
            name: vendor.name,
            avatar: vendor.avatar,
            verified: vendor.verified,
            status: vendor.status,
          },
          valid: true,
          refreshed: true
        });

        // Set new access token cookie
        response.cookies.set('mitra_access_token', refreshResult.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
          path: '/',
        });

        return response;
      } else {
        console.log('[Mitra Verify API] Auto-refresh failed:', refreshResult.error);
        return NextResponse.json(
          { error: 'Session expired', valid: false, shouldRefresh: false },
          { status: 401 }
        );
      }
    }

    if (!accessToken) {
      console.log('[Mitra Verify API] Missing access token and no refresh token');
      return NextResponse.json(
        { error: 'Unauthorized', valid: false },
        { status: 401 }
      );
    }

    // Verifikasi access token
    const tokenPayload = verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      console.log('[Mitra Verify API] Invalid access token');
      
      // ✅ If has refresh token, try to refresh
      if (refreshToken) {
        console.log('[Mitra Verify API] Invalid access token - attempting auto-refresh...');
        
        const refreshResult = await refreshAccessToken(sessionId, refreshToken);
        
        if (refreshResult.success && refreshResult.accessToken) {
          console.log('[Mitra Verify API] Auto-refresh successful after invalid token');
          
          // Get vendor data
          const vendor = await prisma.vendor.findUnique({
            where: { vendor_id: session.userId },
            select: { 
              vendor_id: true, 
              email: true, 
              name: true,
              avatar: true,
              status: true,
              verified: true
            }
          });

          if (!vendor || vendor.status !== 'ACTIVE') {
            console.log('[Mitra Verify API] Vendor not found or inactive');
            return NextResponse.json(
              { error: 'Vendor tidak ditemukan atau tidak aktif', valid: false },
              { status: 401 }
            );
          }

          // Update session activity
          await updateSessionActivity(sessionId);

          // Return success with new access token
          const response = NextResponse.json({
            vendor: {
              id: vendor.vendor_id,
              email: vendor.email,
              name: vendor.name,
              avatar: vendor.avatar,
              verified: vendor.verified,
              status: vendor.status,
            },
            valid: true,
            refreshed: true
          });

          response.cookies.set('mitra_access_token', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
          });

          return response;
        } else {
          console.log('[Mitra Verify API] Auto-refresh failed after invalid token');
          return NextResponse.json(
            { error: 'Invalid access token', valid: false },
            { status: 401 }
          );
        }
      }
      
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

    // Verify token exists in Redis
    const storedToken = await getAccessToken(sessionId);
    if (!storedToken || storedToken !== accessToken) {
      console.log('[Mitra Verify API] Token not found in Redis or mismatch');
      
      // ✅ If has refresh token, try to refresh
      if (refreshToken) {
        console.log('[Mitra Verify API] Token mismatch - attempting auto-refresh...');
        
        const refreshResult = await refreshAccessToken(sessionId, refreshToken);
        
        if (refreshResult.success && refreshResult.accessToken) {
          console.log('[Mitra Verify API] Auto-refresh successful after token mismatch');
          
          // Get vendor data
          const vendor = await prisma.vendor.findUnique({
            where: { vendor_id: session.userId },
            select: { 
              vendor_id: true, 
              email: true, 
              name: true,
              avatar: true,
              status: true,
              verified: true
            }
          });

          if (!vendor || vendor.status !== 'ACTIVE') {
            console.log('[Mitra Verify API] Vendor not found or inactive');
            return NextResponse.json(
              { error: 'Vendor tidak ditemukan atau tidak aktif', valid: false },
              { status: 401 }
            );
          }

          // Update session activity
          await updateSessionActivity(sessionId);

          // Return success with new access token
          const response = NextResponse.json({
            vendor: {
              id: vendor.vendor_id,
              email: vendor.email,
              name: vendor.name,
              avatar: vendor.avatar,
              verified: vendor.verified,
              status: vendor.status,
            },
            valid: true,
            refreshed: true
          });

          response.cookies.set('mitra_access_token', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
            path: '/',
          });

          return response;
        } else {
          console.log('[Mitra Verify API] Auto-refresh failed after token mismatch');
          return NextResponse.json(
            { error: 'Token mismatch', valid: false },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Token mismatch', valid: false },
        { status: 401 }
      );
    }

    // Cek vendor di database
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
      console.log('[Mitra Verify API] Vendor not active:', vendor.status);
      return NextResponse.json(
        { error: 'Vendor tidak aktif', valid: false },
        { status: 401 }
      );
    }

    // Update session activity
    await updateSessionActivity(sessionId);

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