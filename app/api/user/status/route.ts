import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken, checkUserHasPremiumAccess } from '@/lib/whop/server';
import { getSupabaseClient } from '@/lib/supabase/client';

const FREE_UPLOAD_LIMIT = 3;

/**
 * Check user's premium status using Whop API
 * Also returns video count from videos table
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

    // Get upload count from user_limits table
    const supabase = getSupabaseClient();
    let uploadCount = 0;

    if (!hasPremium) {
      // Get or create user limits
      let { data: limits, error: limitsError } = await supabase
        .from('user_limits')
        .select('cloud_uploads_count')
        .eq('user_id', whopUserId)
        .single();

      // If no limits exist, create default ones
      if (limitsError && limitsError.code === 'PGRST116') {
        console.log(`[Status] No limits found for user ${whopUserId}, creating defaults`);
        const { data: newLimits } = await supabase
          .from('user_limits')
          .insert({
            user_id: whopUserId,
            cloud_uploads_count: 0,
            local_downloads_count: 0,
            cloud_uploads_limit: FREE_UPLOAD_LIMIT,
            local_downloads_limit: 3,
          })
          .select('cloud_uploads_count')
          .single();

        uploadCount = newLimits?.cloud_uploads_count || 0;
      } else if (!limitsError && limits) {
        uploadCount = limits.cloud_uploads_count || 0;
      } else {
        console.error('[Status] Error fetching limits:', limitsError);
      }
    }

    console.log(`[Status] User ${whopUserId}: hasPremium=${hasPremium}, uploadCount=${uploadCount}/${FREE_UPLOAD_LIMIT}`);

    return NextResponse.json({
      userId: whopUserId,
      hasPremium,
      uploadCount,
      uploadLimit: FREE_UPLOAD_LIMIT,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    );
  }
}

