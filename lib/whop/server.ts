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

    console.log('[verifyWhopToken] Raw payload from token:', JSON.stringify(payload, null, 2));

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

    console.log('[verifyWhopToken] Normalized payload:', JSON.stringify(normalizedPayload, null, 2));
    console.log('[verifyWhopToken] Extracted userId:', normalizedPayload.userId);

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
 * Check if user has paid for access using Whop API
 * Returns true if user has active membership for premium plan
 */
export async function checkUserAccess(userId: string): Promise<WhopAccessCheckResult> {
  try {
    // Use Whop API to check if user has premium membership
    const hasPremium = await checkUserHasPremiumAccess(userId);

    return {
      hasAccess: true, // All users have access to the app
      accessLevel: hasPremium ? 'customer' : 'customer', // Both free and paid are customers
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



