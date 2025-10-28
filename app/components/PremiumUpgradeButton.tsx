'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIframeSdk } from '@whop/react';

interface PremiumUpgradeButtonProps {
  experienceId?: string;
  onSuccess?: () => void;
  className?: string;
  style?: React.CSSProperties;
  whopToken?: string;
}

export default function PremiumUpgradeButton({
  experienceId,
  onSuccess,
  className = '',
  style,
  whopToken: propWhopToken,
}: PremiumUpgradeButtonProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whopToken, setWhopToken] = useState<string | undefined>(propWhopToken);
  const iframeSdk = useIframeSdk();

  useEffect(() => {
    // Get token from URL if not provided via props
    if (!whopToken) {
      const token = searchParams.get('whop-dev-user-token');
      if (token) {
        setWhopToken(token);
        console.log('[PremiumUpgradeButton] Token from URL:', !!token);
      }
    }
  }, [searchParams, whopToken]);

  // Get the premium plan ID from the API
  const getPlanId = async () => {
    console.log('[PremiumUpgradeButton] Getting premium plan ID');

    if (!whopToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`/api/whop/plan-id?token=${encodeURIComponent(whopToken)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get plan ID');
    }

    const result = await response.json();
    return result.planId;
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[PremiumUpgradeButton] Token:', !!whopToken);

      // Get the premium plan ID
      const planId = await getPlanId();
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

