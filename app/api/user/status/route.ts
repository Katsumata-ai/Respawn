import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken, checkUserHasPremiumAccess } from '@/lib/whop/server';
import { getSupabaseClient } from '@/lib/supabase/client';

const FREE_UPLOAD_LIMIT = 3;

/**
 * Check user's premium status using Whop API
 * Returns upload count by counting videos in Supabase
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

    // Count user's videos from Supabase
    const supabase = getSupabaseClient();
    const { count, error: countError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', whopUserId);

    if (countError) {
      console.error('[Status] Error counting videos:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch user status' },
        { status: 500 }
      );
    }

    const uploadCount = count || 0;
    const uploadLimit = FREE_UPLOAD_LIMIT;

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

