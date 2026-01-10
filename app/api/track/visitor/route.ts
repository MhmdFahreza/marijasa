// app/api/track/visitor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { trackVisitor, trackAnonymousActivity, getOrCreateVisitorId } from '@/app/components/lib/visitor-tracker';
import { getToken } from 'next-auth/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, page, details } = body;

    // Check if user is authenticated
    const sessionId = request.cookies.get('session_id')?.value;
    const sessionToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!(sessionToken || sessionId);

    // Get or create visitor ID
    const visitorId = await getOrCreateVisitorId(request.headers);

    // Track visitor
    await trackVisitor(visitorId, {
      authenticated: isAuthenticated,
      page,
      userAgent: request.headers.get('user-agent'),
    });

    // Track anonymous activity if not authenticated
    if (!isAuthenticated && action) {
      await trackAnonymousActivity(action, {
        page,
        ...details,
      });
    }

    return NextResponse.json({
      success: true,
      visitorId: visitorId.substring(0, 8) + '...',
    });
  } catch (error: any) {
    console.error('[Visitor Track API] Error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}