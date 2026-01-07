// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/components/lib/auth.config";

export async function GET(request: NextRequest) {
  try {
    // Check NextAuth session first (Google OAuth)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            user_id: (session.user as any).id,
            email: session.user.email,
            name: session.user.name,
            avatar: session.user.image
          }
        }, { status: 200 });
      }
    } catch (error) {
      console.log('[Session] NextAuth check failed, trying custom session');
    }

    // Check custom session cookies
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;

    if (sessionId && accessToken) {
      // Verify with /api/auth/me endpoint
      try {
        const meResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
          headers: {
            Cookie: `session_id=${sessionId}; access_token=${accessToken}`
          }
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData.authenticated && meData.user) {
            return NextResponse.json({
              authenticated: true,
              user: meData.user
            }, { status: 200 });
          }
        }
      } catch (error) {
        console.log('[Session] Custom session verification failed');
      }
    }

    // No valid session found
    return NextResponse.json({
      authenticated: false,
      message: 'No valid session found'
    }, { status: 401 });

  } catch (error: any) {
    console.error('[Session] Error checking session:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}