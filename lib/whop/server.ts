/**
 * Whop Server SDK - Server-side operations
 * Based on Whop SDK documentation
 * Used for authentication, payment verification, and user management
 */

import { headers } from 'next/headers';

export interface WhopUserPayload {
  userId?: string;
  sub?: string; // Subject - used in dev tokens
  appId?: string;
  aud?: string; // Audience - used in dev tokens
  iat: number;
  exp: number;
  isDev?: boolean;
}

export interface WhopAccessCheckResult {
  hasAccess: boolean;
  accessLevel: 'admin' | 'customer' | 'no_access';
  userId?: string;
}

/**
 * Get OAuth access token from cookies
 * Used for OAuth-based authentication
 */
export async function getOAuthAccessToken(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('whop_access_token')?.value;
    return token || null;
  } catch (error) {
    console.error('Failed to get OAuth token:', error);
    return null;
  }
}

/**
 * Verify JWT token from Whop
 * The token can be sent in:
 * 1. x-whop-user-token header (production iframe context)
 * 2. whop-dev-user-token query parameter (dev mode)
 * 3. OAuth access token in cookies
 */
export async function verifyWhopToken(token?: string): Promise<WhopUserPayload | null> {
  try {
    let whopToken = token;

    // If no token provided, try to get from headers
    if (!whopToken) {
      const headersList = await headers();
      whopToken = headersList.get('x-whop-user-token') || undefined;
    }

    // If still no token, try to get from x-whop-dev-token header (set by middleware)
    if (!whopToken) {
      const headersList = await headers();
      whopToken = headersList.get('x-whop-dev-token') || undefined;
    }

    if (!whopToken) {
      console.warn('No Whop token found in headers or query parameters');
      return null;
    }

    // In production, verify the JWT signature
    // For now, we'll decode it (in real app, use jwt.verify)
    const parts = whopToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // Decode payload (base64)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Normalize the payload - handle both production and dev token formats
    const normalizedPayload: WhopUserPayload = {
      ...payload,
      // Use 'sub' if 'userId' is not present (dev tokens use 'sub')
      userId: payload.userId || payload.sub,
      // Use 'aud' if 'appId' is not present (dev tokens use 'aud')
      appId: payload.appId || payload.aud,
      iat: payload.iat,
      exp: payload.exp,
    };

    return normalizedPayload;
  } catch (error) {
    console.error('Failed to verify Whop token:', error);
    return null;
  }
}

/**
 * Check if user has access to the premium plan using Whop API
 * Returns true if user has an active membership for the premium plan
 */
export async function checkUserHasPremiumAccess(userId: string): Promise<boolean> {
  try {
    const IS_DEV = process.env.NODE_ENV === 'development';

    // TEMPORARY: In development mode, simulate FREE user for testing
    if (IS_DEV) {
      console.log('[checkUserHasPremiumAccess] DEV MODE: Simulating FREE user for:', userId);
      return false; // Simulate FREE user in dev mode
    }

    // Production code - Check Whop API for active membership
    const WHOP_API_KEY = process.env.WHOP_API_KEY;
    const PREMIUM_PLAN_ID = process.env.NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID;

    if (!WHOP_API_KEY || !PREMIUM_PLAN_ID) {
      console.error('[checkUserHasPremiumAccess] Missing WHOP_API_KEY or PREMIUM_PLAN_ID');
      return false;
    }

    console.log('[checkUserHasPremiumAccess] PRODUCTION MODE: Checking Whop API for user:', userId);
    console.log('[checkUserHasPremiumAccess] Premium Plan ID:', PREMIUM_PLAN_ID);

    // Call Whop API to check user's memberships
    // Using the /me/memberships endpoint which returns all memberships for the authenticated user
    const response = await fetch('https://api.whop.com/api/v5/me/memberships', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[checkUserHasPremiumAccess] Whop API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[checkUserHasPremiumAccess] Error details:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('[checkUserHasPremiumAccess] Whop API response:', JSON.stringify(data, null, 2));

    // Check if user has an active membership for the premium plan
    const hasPremium = data.data?.some((membership: any) =>
      membership.user_id === userId &&
      membership.plan_id === PREMIUM_PLAN_ID &&
      membership.status === 'active'
    ) || false;

    console.log('[checkUserHasPremiumAccess] User has premium:', hasPremium);
    return hasPremium;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
}

/**
 * Get current user from Whop context
 */
export async function getCurrentWhopUser() {
  try {
    const payload = await verifyWhopToken();
    if (!payload || !payload.userId) return null;

    return {
      userId: payload.userId,
      appId: payload.appId,
    };
  } catch (error) {
    console.error('Failed to get current Whop user:', error);
    return null;
  }
}

/**
 * Check if user has paid for access
 * All users have free access by default
 */
export async function checkUserAccess(userId: string): Promise<WhopAccessCheckResult> {
  try {
    // Import Supabase client
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseClient();

    // Check if user exists, if not create them with free access
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create them as FREE user (not paid)
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          whop_user_id: userId,
          has_paid: false, // New users are FREE by default
          payment_date: null,
        });

      if (insertError) {
        console.error('Failed to create user:', insertError);
      }

      return {
        hasAccess: true,
        accessLevel: 'customer',
        userId,
      };
    }

    if (error) {
      console.error('Failed to check user access:', error);
      return {
        hasAccess: true, // Allow access even if there's an error
        accessLevel: 'customer',
        userId,
      };
    }

    // User exists, grant access
    return {
      hasAccess: true,
      accessLevel: 'customer',
      userId,
    };
  } catch (error) {
    console.error('Failed to check user access:', error);
    return {
      hasAccess: true, // Allow access even if there's an error
      accessLevel: 'customer',
      userId,
    };
  }
}

/**
 * Mark user as paid in database
 * Called when payment webhook is received
 */
export async function markUserAsPaid(userId: string) {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('users')
      .update({
        has_paid: true,
        payment_date: new Date().toISOString(),
      })
      .eq('whop_user_id', userId);

    if (error) {
      console.error('Failed to mark user as paid:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to mark user as paid:', error);
    return false;
  }
}

/**
 * Create or update user in database
 */
export async function upsertUser(
  whopUserId: string,
  email: string,
  username: string,
  profilePicUrl?: string
) {
  try {
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          whop_user_id: whopUserId,
          email,
          username,
          avatar: profilePicUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'whop_user_id',
        }
      );

    if (error) {
      console.error('Failed to upsert user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to upsert user:', error);
    return false;
  }
}

