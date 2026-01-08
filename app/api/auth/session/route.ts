// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/components/lib/auth.config";
import { getSession } from "@/app/components/lib/token-service";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Session Check] Starting session verification...');

    // Check NextAuth session first (Google OAuth) - with error handling
    let nextAuthSession = null;
    try {
      nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user) {
        console.log('[Session Check] Valid NextAuth session found for:', nextAuthSession.user.email);
        return NextResponse.json({
          authenticated: true,
          user: {
            user_id: (nextAuthSession.user as any).id,
            id: (nextAuthSession.user as any).id,
            email: nextAuthSession.user.email,
            name: nextAuthSession.user.name,
            phone: (nextAuthSession.user as any).phone,
            avatar: nextAuthSession.user.image || "/profile.svg",
            role: (nextAuthSession.user as any).role || "USER"
          }
        }, { status: 200 });
      }
    } catch (error) {
      // Suppress NextAuth errors - this is expected when no session exists
      console.log('[Session Check] No NextAuth session (this is normal)');
    }

    // Check custom session cookies
    const sessionId = request.cookies.get('session_id')?.value;
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    console.log('[Session Check] Cookie status:', {
      hasSessionId: !!sessionId,
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'none',
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    // If no session cookies at all, return 401 but without error
    if (!sessionId) {
      console.log('[Session Check] No session cookies found - user not logged in');
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      }, { status: 401 });
    }

    // Verify session exists in Redis
    try {
      const redisSession = await getSession(sessionId);
      
      if (!redisSession) {
        console.log('[Session Check] Session not found in Redis:', sessionId);
        console.log('[Session Check] Clearing stale cookies...');
        
        // Clear invalid/stale cookies
        const response = NextResponse.json({
          authenticated: false,
          message: 'Session expired'
        }, { status: 401 });

        // Clear cookies properly
        const cookieOptions = {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        };

        response.cookies.set('session_id', '', cookieOptions);
        response.cookies.set('access_token', '', cookieOptions);
        response.cookies.set('refresh_token', '', cookieOptions);

        return response;
      }

      console.log('[Session Check] Valid Redis session found for user:', redisSession.userId);

      // If we have a valid session but no tokens, session is incomplete
      if (!accessToken && !refreshToken) {
        console.log('[Session Check] Session valid but no tokens found, clearing session');
        
        const response = NextResponse.json({
          authenticated: false,
          message: 'Incomplete session, please login again'
        }, { status: 401 });

        const cookieOptions = {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        };

        response.cookies.set('session_id', '', cookieOptions);
        response.cookies.set('access_token', '', cookieOptions);
        response.cookies.set('refresh_token', '', cookieOptions);

        return response;
      }

      // Return authenticated response with session data
      return NextResponse.json({
        authenticated: true,
        user: {
          user_id: redisSession.userId,
          id: redisSession.userId,
          email: redisSession.email,
          role: redisSession.role
        }
      }, { status: 200 });

    } catch (error) {
      console.error('[Session Check] Redis verification failed:', error);
      
      // Clear cookies on error
      const response = NextResponse.json({
        authenticated: false,
        message: 'Session verification failed'
      }, { status: 500 });

      const cookieOptions = {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      };

      response.cookies.set('session_id', '', cookieOptions);
      response.cookies.set('access_token', '', cookieOptions);
      response.cookies.set('refresh_token', '', cookieOptions);

      return response;
    }

  } catch (error: any) {
    console.error('[Session Check] Unexpected error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}