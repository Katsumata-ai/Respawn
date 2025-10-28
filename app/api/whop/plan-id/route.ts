import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop/server';

/**
 * API route to get the premium plan ID
 * This replaces the Server Action to avoid Client/Server Component issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from query params or headers
    const token = request.nextUrl.searchParams.get('token') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('[GET /api/whop/plan-id] Token received:', !!token);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify the token to ensure user is authenticated
    const payload = await verifyWhopToken(token);
    console.log('[GET /api/whop/plan-id] Token payload:', payload);

    if (!payload || !payload.userId) {
      console.error('[GET /api/whop/plan-id] Invalid payload:', payload);
      return NextResponse.json(
        { error: 'Invalid token or user not found' },
        { status: 401 }
      );
    }

    console.log('[GET /api/whop/plan-id] User ID:', payload.userId);

    // Return the plan ID
    const planId = process.env.NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID;

    if (!planId) {
      return NextResponse.json(
        { error: 'Premium plan ID not configured' },
        { status: 500 }
      );
    }

    console.log('[GET /api/whop/plan-id] Returning plan ID:', planId);

    return NextResponse.json({
      planId,
      userId: payload.userId,
    });
  } catch (error) {
    console.error('[GET /api/whop/plan-id] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get plan ID' },
      { status: 500 }
    );
  }
}

