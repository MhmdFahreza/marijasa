// app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/app/components/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
);

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('admin_session_id')?.value;
    const accessToken = request.cookies.get('admin_access_token')?.value;

    console.log('[Admin Me API] Request received:', {
      hasSessionId: !!sessionId,
      hasAccessToken: !!accessToken
    });

    if (!sessionId || !accessToken) {
      return NextResponse.json(
        { authenticated: false, message: 'No credentials provided' },
        { status: 401 }
      );
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      
      console.log('[Admin Me API] Token verified:', {
        adminId: payload.adminId,
        email: payload.email,
        type: payload.type
      });

      if (payload.type !== 'access') {
        return NextResponse.json(
          { authenticated: false, message: 'Invalid token type' },
          { status: 401 }
        );
      }

      const adminId = payload.adminId as string;

      // Get admin from database
      const admin = await prisma.admin.findUnique({
        where: { admin_id: adminId },
        select: {
          admin_id: true,
          email: true,
          name: true,
          avatar: true,
          is_active: true
        }
      });

      if (!admin) {
        return NextResponse.json(
          { authenticated: false, message: 'Admin not found' },
          { status: 401 }
        );
      }

      if (!admin.is_active) {
        return NextResponse.json(
          { authenticated: false, message: 'Admin account is inactive' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        authenticated: true,
        admin: {
          admin_id: admin.admin_id,
          email: admin.email,
          name: admin.name,
          avatar: admin.avatar
        }
      });

    } catch (jwtError) {
      console.error('[Admin Me API] JWT verification failed:', jwtError);
      return NextResponse.json(
        { authenticated: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('[Admin Me API] Error:', error);
    return NextResponse.json(
      { authenticated: false, message: error.message },
      { status: 500 }
    );
  }
}