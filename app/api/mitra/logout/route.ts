// app/api/mitra/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, deleteTokens } from '@/app/components/lib/token-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('mitra_session_id')?.value;

    console.log('[Mitra Logout API] Logout attempt for session:', sessionId);

    if (sessionId) {
      // Delete session and tokens from Redis
      await deleteSession(sessionId);
      await deleteTokens(sessionId);
      console.log('[Mitra Logout API] Session deleted from Redis');
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logout successful'
    });

    // Clear all mitra cookies
    response.cookies.delete('mitra_session_id');
    response.cookies.delete('mitra_access_token');
    response.cookies.delete('mitra_refresh_token');

    console.log('[Mitra Logout API] Cookies cleared');

    return response;
  } catch (error) {
    console.error('[Mitra Logout API] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}