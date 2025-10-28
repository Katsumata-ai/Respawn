/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for community admins
 * Note: User and revenue stats are managed by Whop, we only track videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { verifyWhopToken } from '@/lib/whop/server';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const payload = await verifyWhopToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    // Get total videos uploaded
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // Get unique users who uploaded videos
    const { data: videosByUser } = await supabase
      .from('videos')
      .select('user_id', { count: 'exact' });

    const uniqueUsers = new Set(videosByUser?.map((v: any) => v.user_id) || []).size;

    return NextResponse.json({
      totalVideos: totalVideos || 0,
      uniqueUsers: uniqueUsers || 0,
      note: 'User membership and revenue stats are managed by Whop API',
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

