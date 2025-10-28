import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop/server';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Initialize user limits based on existing videos
 * This counts how many videos the user has already uploaded
 */
export async function POST(request: NextRequest) {
  try {
    // Get Whop user from token
    const payload = await verifyWhopToken();

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;
    const supabase = getSupabaseClient();

    // Count existing videos for this user
    const { count: videoCount, error: countError } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', whopUserId);

    if (countError) {
      console.error('Error counting videos:', countError);
    }

    const existingVideos = videoCount || 0;
    console.log(`[Reset] User ${whopUserId} has ${existingVideos} existing videos`);

    // Delete existing limits
    await supabase
      .from('user_limits')
      .delete()
      .eq('user_id', whopUserId);

    // Create fresh limits with count based on existing videos
    const { data: newLimits, error: createError } = await supabase
      .from('user_limits')
      .insert({
        user_id: whopUserId,
        cloud_uploads_count: existingVideos,
        local_downloads_count: 0,
        cloud_uploads_limit: 3,
        local_downloads_limit: 3,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating limits:', createError);
      return NextResponse.json(
        { error: 'Failed to reset limits', details: createError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Limits initialized with ${existingVideos} existing videos`,
      limits: newLimits,
    });
  } catch (error) {
    console.error('Error resetting limits:', error);
    return NextResponse.json(
      { error: 'Failed to reset limits', details: error },
      { status: 500 }
    );
  }
}

