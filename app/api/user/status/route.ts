import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken, checkUserHasPremiumAccess } from '@/lib/whop/server';
import { getSupabaseClient, setSupabaseUserId } from '@/lib/supabase/client';

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

    // Set the user ID for RLS policies
    await setSupabaseUserId(whopUserId);

    // Check if user has premium access using Whop API
    const hasPremium = await checkUserHasPremiumAccess(whopUserId);

    // Get max_videos_uploaded from user_upload_stats (never decreases)
    const supabase = getSupabaseClient();
    const { data: statsData, error: statsError } = await supabase
      .from('user_upload_stats')
      .select('max_videos_uploaded')
      .eq('user_id', whopUserId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('[Status] Error fetching upload stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch user status' },
        { status: 500 }
      );
    }

    const uploadCount = statsData?.max_videos_uploaded || 0;
    const uploadLimit = FREE_UPLOAD_LIMIT;

    console.log(`[Status] User ${whopUserId}: hasPremium=${hasPremium}, uploadCount=${uploadCount}/${uploadLimit} (lifetime max)`);

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

