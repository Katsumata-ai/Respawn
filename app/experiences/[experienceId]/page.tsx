'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { HelpCircle, MessageCircle } from 'lucide-react';
import VideoExtractor from '../../views/VideoExtractor';
import PaywallModal from '../../components/PaywallModal';
import MuxLinkModal from '../../components/MuxLinkModal';
import FAQModal from '../../components/FAQModal';

/**
 * Experience View - Main app interface
 * This is the primary view shown when users access the app from Whop
 * Path: /experiences/[experienceId]
 */

export default function ExperiencePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const experienceId = params.experienceId as string;
  const [hasAccess, setHasAccess] = useState(true);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showMuxModal, setShowMuxModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [whopToken, setWhopToken] = useState<string | undefined>(undefined);

  const FREE_UPLOAD_LIMIT = 3;

  useEffect(() => {
    // Get the Whop dev token from query params
    const token = searchParams.get('whop-dev-user-token');
    if (token) {
      setWhopToken(token);
    }
  }, [searchParams]);

  // Check user's premium status and upload count
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/user/status');
        if (response.ok) {
          const data = await response.json();
          setHasPremium(data.hasPremium || false);
          // Use upload count from user_limits, not video count
          setVideoCount(data.uploadCount || 0);
        }
      } catch (error) {
        console.error('Failed to check user status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkUserStatus();

    // Listen for video upload events to refresh count
    const handleVideoUploaded = () => {
      checkUserStatus();
    };

    window.addEventListener('videoUploaded', handleVideoUploaded);

    return () => {
      window.removeEventListener('videoUploaded', handleVideoUploaded);
    };
  }, []);

  // Listen for paywall open events
  useEffect(() => {
    const handleOpenPaywall = () => {
      setShowPaywall(true);
    };

    window.addEventListener('openPaywall', handleOpenPaywall);

    return () => {
      window.removeEventListener('openPaywall', handleOpenPaywall);
    };
  }, []);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Get the Whop dev token from query params if available
        const whopDevToken = searchParams.get('whop-dev-user-token');

        const headers: Record<string, string> = {};
        if (whopDevToken) {
          // In dev mode, pass the token in the header for the API to verify
          headers['x-whop-user-token'] = whopDevToken;
        }

        const response = await fetch('/api/whop/validate-access', {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess);
          if (!data.hasAccess) {
            setShowPaywall(true);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to validate access');
        }
      } catch (err) {
        console.error('Access validation error:', err);
        setError('Error validating access');
      }
    };

    validateAccess();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#161616' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: '#FF8102' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded font-semibold transition hover:opacity-80"
            style={{ backgroundColor: '#FF8102', color: '#161616' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#161616', minHeight: '100vh' }}>
      <div className="w-full px-4 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                  Whop Video Downloader
                </h1>
                <span className="text-xs font-medium" style={{ color: '#676767' }}>
                  v1
                </span>
              </div>
              {!loadingStatus && (
                <>
                  {hasPremium ? (
                    <p style={{ color: '#00D9FF', fontSize: '14px', marginTop: '4px' }}>
                      ✓ Premium Access Active
                    </p>
                  ) : (
                    <div style={{ marginTop: '8px' }}>
                      <p style={{ color: '#676767', fontSize: '14px', marginBottom: '8px' }}>
                        Free Plan • {videoCount}/{FREE_UPLOAD_LIMIT} videos uploaded
                      </p>
                      <button
                        onClick={() => setShowPaywall(true)}
                        className="px-4 py-2 rounded-lg font-semibold text-sm transition"
                        style={{
                          backgroundColor: '#FF8102',
                          color: '#161616',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF6B00';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FF8102';
                        }}
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Help Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMuxModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm"
                style={{
                  backgroundColor: 'rgba(255, 129, 2, 0.1)',
                  color: '#FF8102',
                  border: '1px solid #FF8102',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 129, 2, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 129, 2, 0.1)';
                }}
              >
                <HelpCircle size={16} />
                Mux
              </button>

              <button
                onClick={() => setShowFAQModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm"
                style={{
                  backgroundColor: 'rgba(255, 129, 2, 0.1)',
                  color: '#FF8102',
                  border: '1px solid #FF8102',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 129, 2, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 129, 2, 0.1)';
                }}
              >
                <MessageCircle size={16} />
                FAQ
              </button>
            </div>
          </div>
        </div>

        {hasAccess ? (
          <VideoExtractor />
        ) : (
          <div className="text-center py-12">
            <p style={{ color: '#676767' }}>
              Please upgrade to access this feature.
            </p>
          </div>
        )}
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        type="upgrade"
        experienceId={experienceId}
        whopToken={whopToken}
      />

      <MuxLinkModal
        isOpen={showMuxModal}
        onClose={() => setShowMuxModal(false)}
      />

      <FAQModal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
    </div>
  );
}

