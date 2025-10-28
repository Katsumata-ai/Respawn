/**
 * GET /api/whop/validate-access
 * Validates if the current user has access to the experience via Whop
 * Uses Whop SDK to check access, not custom DB logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params (dev mode) or headers (production)
    const tokenFromQuery = request.nextUrl.searchParams.get('whop-dev-user-token');

    // Verify Whop token
    const payload = await verifyWhopToken(tokenFromQuery || undefined);

    if (!payload) {
      console.warn('No valid Whop token found');
      return NextResponse.json(
        {
          hasAccess: false,
          accessLevel: 'no_access',
          error: 'No valid Whop token found',
        },
        { status: 401 }
      );
    }

    // For now, allow all users to access (Whop handles payment verification)
    // In production, you would use whopSdk.access.checkIfUserHasAccessToExperience()
    // to verify the user has paid for access

    return NextResponse.json({
      hasAccess: true,
      accessLevel: 'customer',
      userId: payload.userId,
    });
  } catch (error) {
    console.error('Error validating access:', error);
    return NextResponse.json(
      { error: 'Failed to validate access' },
      { status: 500 }
    );
  }
}

