import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken, checkUserHasPremiumAccess, getUserUploadLimit } from '@/lib/whop/server';
import { getUserUploadCount } from '@/lib/whop/upload-tracker';

/**
 * Check user's premium status using Whop API
 * Returns upload count from in-memory tracker
 */
export async function GET(request: NextRequest) {
  try {
    // Get Whop user from token (middleware adds token to headers)
    const payload = await verifyWhopToken();

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;

    // Check if user has premium access using Whop API
    const hasPremium = await checkUserHasPremiumAccess(whopUserId);
    const uploadLimit = await getUserUploadLimit(whopUserId);
    const uploadCount = getUserUploadCount(whopUserId);

    console.log(`[Status] User ${whopUserId}: hasPremium=${hasPremium}, uploadCount=${uploadCount}/${uploadLimit}`);

    return NextResponse.json({
      userId: whopUserId,
      hasPremium,
      uploadCount,
      uploadLimit,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    );
  }
}

