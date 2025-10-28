'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function PlayerViewContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('url');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const initHLS = async () => {
      try {
        // Try to load HLS stream
        const HLS = (await import('hls.js')).default;

        if (HLS.isSupported()) {
          const hls = new HLS();
          hls.loadSource(videoUrl);
          hls.attachMedia(videoRef.current!);
          console.log('HLS stream loaded successfully');
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          videoRef.current.src = videoUrl;
          console.log('Using native HLS support');
        }
      } catch (err) {
        console.error('Failed to load HLS:', err);
        setError('Failed to load video');
      }
    };

    initHLS();
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#161616' }}>
        <div className="text-center">
          <p style={{ color: '#FF8102' }} className="mb-4">
            No video URL provided
          </p>
          <Link
            href="/"
            className="hover:opacity-80 transition"
            style={{ color: '#FF8102' }}
          >
            ← Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10" style={{ backgroundColor: '#161616' }}>
        <Link
          href="/"
          className="flex items-center gap-2 transition hover:opacity-80"
          style={{ color: '#FFFFFF' }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <h1 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
          Video Player
        </h1>

        <div className="w-20" /> {/* Spacer for alignment */}
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <p style={{ color: '#EF4444' }} className="mb-4">
              {error}
            </p>
            <Link
              href="/"
              style={{ color: '#FF8102' }}
            >
              ← Go back
            </Link>
          </div>
        ) : (
          <div className="w-full h-full max-w-6xl aspect-video rounded-lg overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              controls
              autoPlay
              className="w-full h-full"
              style={{ backgroundColor: '#000000' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayerView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#161616' }}>
        <p style={{ color: '#FFFFFF' }}>Loading...</p>
      </div>
    }>
      <PlayerViewContent />
    </Suspense>
  );
}
