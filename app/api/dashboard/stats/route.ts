/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for community admins
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total downloads (assuming there's a downloads table)
    const { count: totalDownloads } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // Get active users (users who have paid)
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('has_paid', true);

    // Calculate total revenue (€10 per paid user)
    const totalRevenue = (activeUsers || 0) * 10;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalDownloads: totalDownloads || 0,
      activeUsers: activeUsers || 0,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

