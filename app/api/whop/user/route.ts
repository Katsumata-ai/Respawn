/**
 * GET /api/whop/user
 * Returns the current authenticated user from Whop context
 * Based on Whop SDK documentation
 */

import { NextResponse } from 'next/server';
import { verifyWhopToken, upsertUser } from '@/lib/whop/server';

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

    // In a real app, fetch user details from Whop API
    // For now, return basic user info from token
    const user = {
      id: payload.userId,
      email: `user_${payload.userId}@whop.local`,
      username: `user_${payload.userId}`,
      profilePicUrl: null,
    };

    // Upsert user in database
    await upsertUser(
      payload.userId,
      user.email,
      user.username,
      user.profilePicUrl || undefined
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/whop/user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

