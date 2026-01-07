// app/api/mitra/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToken,
  getSession,
  getAccessToken,
  refreshAccessToken,
  updateSessionActivity,
} from '@/app/components/lib/token-service';
import prisma from '@/app/components/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get session ID and tokens from cookies
    const sessionId = request.cookies.get('mitra_session_id')?.value;
    const accessToken = request.cookies.get('mitra_access_token')?.value;
    const refreshToken = request.cookies.get('mitra_refresh_token')?.value;

    console.log('[Mitra Me API] Request:', {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      sessionId: sessionId
    });

    if (!sessionId) {
      return NextResponse.json(
        { message: 'No session found', authenticated: false },
        { status: 401 }
      );
    }

    // Verify session exists in Redis
    const session = await getSession(sessionId);
    if (!session) {
      console.log('[Mitra Me API] Session not found in Redis');
      return NextResponse.json(
        { message: 'Session expired', authenticated: false },
        { status: 401 }
      );
    }

    console.log('[Mitra Me API] Session found:', {
      userId: session.userId,
      email: session.email,
      role: session.role
    });

    let currentAccessToken = accessToken;

    // Verify access token
    if (accessToken) {
      const tokenPayload = verifyToken(accessToken);
      
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        // Access token expired, try to refresh
        if (refreshToken) {
          console.log('[Mitra Me API] Access token invalid, attempting refresh');
          const refreshResult = await refreshAccessToken(sessionId, refreshToken);
          
          if (refreshResult.success && refreshResult.accessToken) {
            currentAccessToken = refreshResult.accessToken;
            
            // Update cookie with new access token
            const response = NextResponse.json(
              {
                authenticated: true,
                vendor: {
                  id: session.userId,
                  email: session.email,
                  role: session.role,
                },
                refreshed: true,
              },
              { status: 200 }
            );

            response.cookies.set('mitra_access_token', refreshResult.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60, // 1 hour
              path: '/',
            });

            return response;
          } else {
            console.log('[Mitra Me API] Refresh failed');
            return NextResponse.json(
              { message: 'Session expired', authenticated: false },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            { message: 'Token expired', authenticated: false },
            { status: 401 }
          );
        }
      }

      // Verify token exists in Redis
      const storedToken = await getAccessToken(sessionId);
      if (!storedToken || storedToken !== accessToken) {
        console.log('[Mitra Me API] Token not found in Redis or mismatch');
        return NextResponse.json(
          { message: 'Invalid token', authenticated: false },
          { status: 401 }
        );
      }
    } else if (refreshToken) {
      // No access token but has refresh token, try to refresh
      console.log('[Mitra Me API] No access token, attempting refresh');
      const refreshResult = await refreshAccessToken(sessionId, refreshToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        currentAccessToken = refreshResult.accessToken;
        
        // Update cookie with new access token
        const response = NextResponse.json(
          {
            authenticated: true,
            vendor: {
              id: session.userId,
              email: session.email,
              role: session.role,
            },
            refreshed: true,
          },
          { status: 200 }
        );

        response.cookies.set('mitra_access_token', refreshResult.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
          path: '/',
        });

        return response;
      } else {
        return NextResponse.json(
          { message: 'Session expired', authenticated: false },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { message: 'No tokens found', authenticated: false },
        { status: 401 }
      );
    }

    // Get full vendor data from database
    const vendor = await prisma.vendor.findUnique({
      where: { vendor_id: session.userId },
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
      },
    });

    if (!vendor || vendor.status !== 'ACTIVE') {
      console.log('[Mitra Me API] Vendor not found or inactive');
      return NextResponse.json(
        { message: 'Vendor not found or inactive', authenticated: false },
        { status: 404 }
      );
    }

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log('[Mitra Me API] Authentication successful for:', vendor.email);

    return NextResponse.json(
      {
        authenticated: true,
        vendor: {
          id: vendor.vendor_id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          avatar: vendor.avatar || '/profile.svg',
          description: vendor.description,
          verified: vendor.verified,
          status: vendor.status,
          rating: vendor.rating ? Number(vendor.rating) : 0,
          review_count: vendor.review_count,
          service_areas: vendor.service_areas,
          specialties: vendor.specialties,
          tags: vendor.tags,
          category: vendor.category,
          join_date: vendor.join_date,
          role: 'vendor',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Mitra Me API] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
}