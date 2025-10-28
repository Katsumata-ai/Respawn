'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import DownloadProgressModal from '@/app/components/DownloadProgressModal';
import PaywallModal from '@/app/components/PaywallModal';
import CopyButton from '@/app/components/CopyButton';

interface VideoData {
  id: string;
  title: string;
  duration: number;
  created_at: string;
  mux_url?: string;
  s3_url?: string;
  shareable_id?: string;
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'local-download' | 'upgrade'>('upgrade');
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loadingPremiumStatus, setLoadingPremiumStatus] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get experienceId and token from query params
  const experienceId = searchParams.get('experienceId');
  const whopToken = searchParams.get('whop-dev-user-token');

  // Check user's premium status
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const response = await fetch('/api/user/status');
        if (response.ok) {
          const data = await response.json();
          setHasPremium(data.hasPremium || false);
        }
      } catch (error) {
        console.error('Failed to check premium status:', error);
      } finally {
        setLoadingPremiumStatus(false);
      }
    };

    checkPremiumStatus();
  }, []);

  useEffect(() => {
    params.then((p) => setVideoId(p.videoId));
  }, [params]);

  const handleBackClick = () => {
    if (experienceId) {
      // Go back to experience page with token if available
      const backUrl = whopToken
        ? `/experiences/${experienceId}?whop-dev-user-token=${whopToken}`
        : `/experiences/${experienceId}`;
      router.push(backUrl);
    } else {
      // Fallback to router back
      router.back();
    }
  };

  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .single();

        if (error) {
          setError('Video not found');
          return;
        }

        setVideoData(data);
      } catch (err) {
        setError('Failed to load video');
        console.error(err);
      }
    };

    fetchVideo();
  }, [videoId]);

  // Initialize HLS player for Mux streams
  useEffect(() => {
    if (!videoData?.mux_url || !videoRef.current) return;

    const initHLS = async () => {
      try {
        // Dynamically import HLS.js
        const HLS = (await import('hls.js')).default;

        if (HLS.isSupported()) {
          const hls = new HLS();
          hls.loadSource(videoData.mux_url);
          hls.attachMedia(videoRef.current!);
          console.log('HLS stream loaded successfully');
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          videoRef.current.src = videoData.mux_url;
          console.log('Using native HLS support');
        }
      } catch (err) {
        console.error('Failed to initialize HLS:', err);
      }
    };

    initHLS();
  }, [videoData?.mux_url]);



  // Don't show error screen - let it load in background
  if (error && videoData === null) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#161616' }}>
        <div className="text-center">
          <p style={{ color: '#FF8102' }} className="mb-4">{error}</p>
          <button
            onClick={handleBackClick}
            className="hover:opacity-80 transition"
            style={{ color: '#FF8102' }}
          >
            ← Go back home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getShareableLink = (): string => {
    if (!videoData?.mux_url) return '';
    // Return player URL instead of direct Mux URL to prevent download
    const playerUrl = `${window.location.origin}/player-view?url=${encodeURIComponent(videoData.mux_url)}`;
    return playerUrl;
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#161616' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10" style={{ borderColor: '#2B2B2B', backgroundColor: '#161616' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="transition hover:opacity-80"
            style={{ color: '#676767' }}
          >
            ← Back
          </button>
          <h2 className="text-sm" style={{ color: '#676767' }}>Video player</h2>
          {/* Only show Upgrade button for FREE users */}
          {!loadingPremiumStatus && !hasPremium && (
            <button
              onClick={() => {
                setPaywallType('upgrade');
                setShowPaywall(true);
              }}
              className="font-semibold transition"
              style={{ color: '#FF8102' }}
            >
              Upgrade
            </button>
          )}
          {/* Show premium badge for PAID users */}
          {!loadingPremiumStatus && hasPremium && (
            <span className="text-sm font-semibold" style={{ color: '#00D9FF' }}>
              ✓ Premium
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Video Player */}
        <div className="rounded-lg overflow-hidden mb-6" style={{ backgroundColor: '#000000', borderColor: '#2B2B2B', border: '1px solid' }}>
          <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
            {videoData?.mux_url ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div style={{ color: '#676767' }}>Loading video...</div>
            )}
          </div>
        </div>

        {/* Video Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{videoData?.title || 'Video'}</h1>
            <p className="text-sm mt-2" style={{ color: '#676767' }}>
              {videoData?.created_at ? formatDate(videoData.created_at) : 'Loading...'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDownloadModal(true)}
              className="px-4 py-2 rounded font-semibold transition text-sm flex items-center gap-2 hover:opacity-80"
              style={{ backgroundColor: '#2B2B2B', color: '#FFFFFF' }}
            >
              <Download size={16} />
              Download
            </button>
            <CopyButton
              text={getShareableLink()}
              successMessage="Copied!"
              tooltipText="Copy shareable link"
              variant="icon"
            />
          </div>
        </div>
      </main>

      <DownloadProgressModal
        isOpen={showDownloadModal}
        videoId={videoData?.id || ''}
        videoTitle={videoData?.title || 'Video'}
        videoDuration={videoData?.duration || 0}
        onClose={() => setShowDownloadModal(false)}
      />

      {/* Only show paywall for FREE users */}
      {!hasPremium && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          type={paywallType}
        />
      )}
    </div>
  );
}

