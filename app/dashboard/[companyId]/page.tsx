import { headers } from 'next/headers';
import { getSupabaseClient } from '@/lib/supabase/client';
import { verifyWhopToken } from '@/lib/whop/server';

/**
 * Dashboard View - Analytics and statistics
 * Shows community admin dashboard with app analytics
 * Path: /dashboard/[companyId]
 *
 * IMPORTANT: This is a SERVER component as per Whop documentation
 * https://docs.whop.com/apps/guides/app-views#dashboard-view
 */

interface DashboardStats {
  totalVideos: number;
  uniqueUsers: number;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Verify user token and check admin access
  const payload = await verifyWhopToken();

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Authentication Required</h1>
          <p className="text-gray-600">
            Please authenticate to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is admin of this company
  // Note: In production, you should verify the user has admin access to this specific company
  // For now, we allow any authenticated user to view the dashboard
  const isAdmin = true; // TODO: Implement proper admin check with Whop API

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Access Denied</h1>
          <p className="text-gray-600">
            Only company admins can access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Fetch dashboard stats
  let stats: DashboardStats = {
    totalVideos: 0,
    uniqueUsers: 0,
  };

  try {
    const supabase = getSupabaseClient();

    // Get total videos uploaded
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // Get unique users who uploaded videos
    const { data: videosByUser } = await supabase
      .from('videos')
      .select('user_id');

    const uniqueUsers = new Set(videosByUser?.map((v: any) => v.user_id) || []).size;

    stats = {
      totalVideos: totalVideos || 0,
      uniqueUsers: uniqueUsers || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Community Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Company ID: {companyId}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            User: {payload.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Videos Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Total Videos</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalVideos}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Videos uploaded by all users
            </p>
          </div>

          {/* Unique Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Active Users</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.uniqueUsers}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Users who have uploaded videos
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> User membership and revenue statistics are managed by Whop.
            This dashboard shows video-related metrics only.
          </p>
        </div>
      </div>
    </div>
  );
}

