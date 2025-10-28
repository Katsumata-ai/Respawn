/**
 * GET /api/whop/user
 * Returns the current authenticated user from Whop context
 * No database operations needed - Whop manages all user data
 */

import { NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop/server';

export async function GET() {
  try {
    // Middleware extracts token from referer and adds it to x-whop-user-token header
    // Verify Whop token
    const payload = await verifyWhopToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid Whop token' },
        { status: 401 }
      );
    }

    // Return basic user info from token
    // Whop manages all user data, we just use the userId
    const user = {
      id: payload.userId,
      email: `user_${payload.userId}@whop.local`,
      username: `user_${payload.userId}`,
      profilePicUrl: null,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/whop/user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

