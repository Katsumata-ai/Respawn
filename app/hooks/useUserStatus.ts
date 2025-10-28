'use client';

import { useState, useEffect } from 'react';

export interface UserStatus {
  userId: string | null;
  hasPremium: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to check user's premium status using Whop API
 * No Supabase needed - everything is managed by Whop
 */
export function useUserStatus(): UserStatus {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API endpoint that checks Whop membership
      const response = await fetch('/api/user/status');

      if (!response.ok) {
        throw new Error('User not authenticated');
      }

      const data = await response.json();

      setUserId(data.userId);
      setHasPremium(data.hasPremium);
    } catch (err) {
      console.error('Error fetching user status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user status');
      setHasPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStatus();
  }, []);

  return {
    userId,
    hasPremium,
    loading,
    error,
    refresh: fetchUserStatus,
  };
}

