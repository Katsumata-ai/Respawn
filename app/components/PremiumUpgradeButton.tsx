'use client';

import { useState } from 'react';
import { useIframeSdk } from '@whop/react';

interface PremiumUpgradeButtonProps {
  experienceId?: string;
  onSuccess?: () => void;
  className?: string;
  style?: React.CSSProperties;
  whopToken?: string; // Keep for backward compatibility but not used
}

export default function PremiumUpgradeButton({
  experienceId,
  onSuccess,
  className = '',
  style,
}: PremiumUpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeSdk = useIframeSdk();

  // Get the premium plan ID directly from env
  const getPlanId = () => {
    console.log('[PremiumUpgradeButton] Getting premium plan ID');
    const planId = process.env.NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID;

    if (!planId) {
      throw new Error('Premium plan ID not configured');
    }

    return planId;
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[PremiumUpgradeButton] Starting purchase flow');

      // Get the premium plan ID
      const planId = getPlanId();
      console.log('[PremiumUpgradeButton] Plan ID:', planId);

      // Open the payment modal using iFrame SDK
      // @ts-ignore
      const purchaseResult = await iframeSdk.inAppPurchase({
        planId: planId,
      });
      console.log('[PremiumUpgradeButton] Purchase result:', purchaseResult);

      // Check if the purchase was successful
      if (purchaseResult && purchaseResult.status === 'ok') {
        console.log('[PremiumUpgradeButton] Purchase successful!');
        if (onSuccess) {
          onSuccess();
        }
      } else if (purchaseResult && purchaseResult.status === 'error' && purchaseResult.error?.includes('canceled by the user')) {
        // User canceled the purchase - this is normal, not an error
        console.log('[PremiumUpgradeButton] Purchase canceled by user');
        // Don't show error message, just reset the state
      } else {
        // Other errors (payment failed, network error, etc.)
        const errorMsg = purchaseResult && purchaseResult.status === 'error' ? purchaseResult.error : 'Unknown error';
        throw new Error('Purchase failed: ' + errorMsg);
      }

    } catch (err) {
      console.error('[PremiumUpgradeButton] Purchase error:', err);
      // Only show error if it's not a user cancellation
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      if (!errorMessage.includes('canceled by the user')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`px-4 py-2 rounded font-semibold transition ${className}`}
        style={{
          backgroundColor: '#FF8102',
          color: '#161616',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          ...style,
        }}
      >
        {loading ? 'Processing...' : 'Upgrade Now'}
      </button>
      {error && (
        <p style={{ color: '#FF6B6B', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

