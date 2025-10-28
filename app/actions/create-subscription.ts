'use server';

import { verifyWhopToken, checkUserAccess } from '@/lib/whop/server';
import { WhopServerSdk } from '@whop/api';

// Initialize Whop SDK with API key
const whopSdk = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY!,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});

/**
 * Simply return the plan ID - the iFrame SDK will handle the payment
 * using the price defined in the Whop Access Pass
 */
export async function createSubscription(experienceId?: string, token?: string) {
  try {
    console.log('[createSubscription] Token received:', !!token);

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Verify the token to ensure user is authenticated
    const payload = await verifyWhopToken(token);
    console.log('[createSubscription] Token payload:', payload);

    if (!payload || !payload.userId) {
      console.error('[createSubscription] Invalid payload:', payload);
      throw new Error('Invalid token or user not found');
    }

    console.log('[createSubscription] User ID:', payload.userId);

    // Return the plan ID - the iFrame SDK will use the price from the Access Pass
    const planId = process.env.NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID;

    if (!planId) {
      throw new Error('Premium plan ID not configured');
    }

    console.log('[createSubscription] Returning plan ID:', planId);

    return {
      planId,
      metadata: {
        experienceId: experienceId || 'general',
        userId: payload.userId,
      },
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Check if user has access to the premium access pass
 */
export async function checkUserPremiumAccess() {
  try {
    const payload = await verifyWhopToken();

    if (!payload || !payload.userId) {
      return { hasAccess: false };
    }

    // Check user access in database
    const accessResult = await checkUserAccess(payload.userId);

    return { hasAccess: accessResult.hasAccess };
  } catch (error) {
    console.error('Error checking premium access:', error);
    return { hasAccess: false };
  }
}

