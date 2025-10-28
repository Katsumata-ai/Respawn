'use client';

import { useState, useEffect } from 'react';
import { Download, X, HelpCircle } from 'lucide-react';

interface DownloadProgressModalProps {
  isOpen: boolean;
  videoId: string;
  videoTitle: string;
  videoDuration?: number; // Duration in seconds
  onClose: () => void;
}

export default function DownloadProgressModal({
  isOpen,
  videoId,
  videoTitle,
  videoDuration = 0,
  onClose,
}: DownloadProgressModalProps) {
  const [status, setStatus] = useState('Preparing download...');
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showEstimateTooltip, setShowEstimateTooltip] = useState(false);

  // Smooth progress animation with interpolation
  useEffect(() => {
    if (progress === displayProgress) return;

    const difference = progress - displayProgress;
    const step = difference / 10; // Smooth transition over 10 frames

    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const next = prev + step;
        // Stop when we reach the target
        if ((step > 0 && next >= progress) || (step < 0 && next <= progress)) {
          clearInterval(interval);
          return Math.round(progress * 100) / 100; // Round to 2 decimal places
        }
        return Math.round(next * 100) / 100; // Round to 2 decimal places
      });
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [progress, displayProgress]);

  // Handle modal close - allow user to close even during download
  const handleClose = () => {
    setIsDownloading(false);
    setProgress(0);
    setDisplayProgress(0);
    setStatus('Preparing download...');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset state at the beginning of each download attempt
    setIsDownloading(true);
    setProgress(0);
    setDisplayProgress(0);
    setStatus('Preparing download...');

    // Create abort controller to stop requests when modal closes
    const abortController = new AbortController();
    let isMounted = true;

    const startDownload = async () => {
      console.log(`[Download] Starting fresh download for video: ${videoId}`);

      try {
        // Get the Mux URL from the server
        setStatus('Preparing download...');
        console.log(`[Download] Fetching Mux URL from /api/download-to-library/${videoId}`);

        const response = await fetch(`/api/download-to-library/${videoId}`, {
          method: 'POST',
          signal: abortController.signal,
        });

        console.log(`[Download] Response status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`Failed to get download URL: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[Download] Received response:`, data);

        if (!data.success || !data.url) {
          throw new Error(data.error || 'Failed to get download URL');
        }

        // Download HLS stream directly from Mux
        if (!isMounted) return;
        setStatus('Downloading video...');
        setProgress(20);
        console.log(`[Download] Downloading HLS stream from Mux`);

        // Fetch the HLS playlist
        const playlistResponse = await fetch(data.url, {
          signal: abortController.signal,
        });

        if (!playlistResponse.ok) {
          throw new Error(`Failed to fetch HLS playlist: ${playlistResponse.status}`);
        }

        const playlistText = await playlistResponse.text();
        console.log(`[Download] Playlist fetched, size: ${playlistText.length} bytes`);

        // Parse the playlist to get segment URLs
        const lines = playlistText.split('\n');
        const segments: string[] = [];
        const baseUrl = data.url.substring(0, data.url.lastIndexOf('/') + 1);

        for (const line of lines) {
          if (line && !line.startsWith('#') && line.endsWith('.ts')) {
            segments.push(baseUrl + line);
          }
        }

        console.log(`[Download] Found ${segments.length} segments`);

        if (segments.length === 0) {
          throw new Error('No video segments found in HLS playlist');
        }

        // Download all segments
        if (!isMounted) return;
        setStatus('Downloading video segments...');
        setProgress(30);

        const chunks: ArrayBuffer[] = [];

        for (let i = 0; i < segments.length; i++) {
          if (!isMounted) return;

          const segmentUrl = segments[i];
          console.log(`[Download] Downloading segment ${i + 1}/${segments.length}: ${segmentUrl}`);

          const segmentResponse = await fetch(segmentUrl, {
            signal: abortController.signal,
          });

          if (!segmentResponse.ok) {
            console.warn(`[Download] Failed to download segment ${i}, status: ${segmentResponse.status}`);
            continue; // Skip failed segments
          }

          const buffer = await segmentResponse.arrayBuffer();
          chunks.push(buffer);

          // Update progress
          const segmentProgress = 30 + (i / segments.length) * 60;
          setProgress(segmentProgress);
        }

        if (chunks.length === 0) {
          throw new Error('Failed to download any video segments');
        }

        // Combine chunks into single blob
        if (!isMounted) return;
        setStatus('Finalizing download...');
        setProgress(95);

        const blob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
        console.log(`[Download] File downloaded, size: ${blob.size} bytes`);

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoTitle}.mp4`;

        // Ensure element is in DOM before clicking
        if (!document.body.contains(a)) {
          document.body.appendChild(a);
        }

        a.click();

        // Cleanup after a delay to ensure download starts
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 100);

        if (isMounted) {
          setStatus('Download complete! ✓');
          setProgress(100);
          console.log(`[Download] Download complete!`);

          setTimeout(() => {
            if (isMounted) {
              setIsDownloading(false);
              onClose();
            }
          }, 1500);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[Download] Download cancelled by user');
          if (isMounted) {
            setStatus('Download cancelled');
            setIsDownloading(false);
          }
        } else {
          console.error('[Download] Error:', error);
          if (isMounted) {
            setStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsDownloading(false);
          }
        }
      }
    };

    startDownload();

    // Cleanup: abort requests and mark as unmounted when modal closes
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isOpen, videoId, videoTitle, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-6 w-96 shadow-lg"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #2B2B2B' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download size={20} style={{ color: '#FF8102' }} />
            <h3 className="font-semibold" style={{ color: '#FFFFFF' }}>
              Downloading...
            </h3>
            {/* Help tooltip */}
            <div className="relative inline-block">
              <button
                onMouseEnter={() => setShowEstimateTooltip(true)}
                onMouseLeave={() => setShowEstimateTooltip(false)}
                className="p-0 rounded transition hover:opacity-70 cursor-help"
                style={{ color: '#FF8102' }}
                title="Estimated download times"
              >
                <HelpCircle size={16} />
              </button>
              {showEstimateTooltip && (
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs px-3 py-2 rounded z-50 pointer-events-none"
                  style={{ backgroundColor: '#2B2B2B', color: '#FFFFFF', minWidth: '180px' }}
                >
                  <div className="font-semibold mb-2">Estimated times:</div>
                  <div className="space-y-1 text-xs">
                    <div>5 min → ~2 min</div>
                    <div>15 min → ~7 min</div>
                    <div>30 min → ~13 min</div>
                    <div>1h → ~27 min</div>
                    <div>2h → ~54 min</div>
                  </div>
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent"
                    style={{ borderTopColor: '#2B2B2B' }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded transition hover:opacity-70 cursor-pointer"
            style={{ color: '#676767' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video title */}
        <p className="text-sm mb-4 truncate" style={{ color: '#676767' }}>
          {videoTitle}
        </p>

        {/* Content */}
        <div className="text-center">
          {/* Progress bar */}
          <div className="mb-4">
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: '#2B2B2B' }}
            >
              <div
                className="h-3 rounded-full"
                style={{
                  backgroundColor: '#FF8102',
                  width: `${displayProgress}%`,
                }}
              ></div>
            </div>
            <p className="text-sm font-semibold mt-2" style={{ color: '#FF8102' }}>
              {Math.round(displayProgress)}%
            </p>
          </div>

          {/* Status message */}
          <p className="text-sm" style={{ color: '#FFFFFF' }}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

