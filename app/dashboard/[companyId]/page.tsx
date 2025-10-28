'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * Dashboard View - Analytics and statistics
 * Shows community admin dashboard with app analytics
 * Path: /dashboard/[companyId]
 */

interface DashboardStats {
  totalUsers: number;
  totalDownloads: number;
  totalRevenue: number;
  activeUsers: number;
}

export default function DashboardPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDownloads: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check if user is admin
        const adminResponse = await fetch('/api/whop/user');
        if (adminResponse.ok) {
          const userData = await adminResponse.json();
          // In a real app, check if user is admin of this company
          setIsAdmin(true);
        }

        // Load dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">
            Only community admins can access the dashboard.
          </p>
        </div>
      </div>
    );
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
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Total Users</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalUsers}
            </div>
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Active Users</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.activeUsers}
            </div>
          </div>

          {/* Total Downloads Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">
              Total Downloads
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalDownloads}
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Total Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              €{stats.totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

