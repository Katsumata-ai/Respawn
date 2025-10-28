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
  const handleClose = async () => {
    const wasDownloading = isDownloading && progress < 100;

    setIsDownloading(false);
    setProgress(0);
    setDisplayProgress(0);
    setStatus('Preparing download...');

    // Clean up incomplete file and cancel download if it was in progress
    if (wasDownloading) {
      try {
        console.log(`[Download] Cancelling download for video: ${videoId}`);
        await fetch(`/api/download-to-library/${videoId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to cancel download:', err);
      }
    }

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
        // Always download via the server endpoint
        // The server will handle both local files and Mux URLs
        setStatus('Downloading video...');
        console.log(`[Download] Fetching /api/download/${videoId}`);

        const response = await fetch(`/api/download/${videoId}`, { signal: abortController.signal });
        console.log(`[Download] Response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        // Check if response is JSON (Mux URL) or binary (MP4 file)
        const contentType = response.headers.get('content-type');
        console.log(`[Download] Content-Type: ${contentType}`);

        if (contentType?.includes('application/json')) {
          // Response is JSON with Mux URL - need to download via server
          const data = await response.json();
          console.log(`[Download] Received JSON response:`, data);

          if (data.type === 'stream' && data.url) {
            if (!isMounted) return; // Stop if modal closed
            setStatus('Converting to MP4...');
            setProgress(5); // Start at 5%
            console.log(`[Download] Starting server-side conversion`);

            // Trigger server-side download via download-to-library endpoint
            const downloadResponse = await fetch(`/api/download-to-library/${videoId}`, {
              method: 'POST',
              signal: abortController.signal,
            });

            console.log(`[Download] POST response status: ${downloadResponse.status}`);
            if (!downloadResponse.ok) {
              throw new Error('Failed to start download');
            }

            const downloadData = await downloadResponse.json();
            console.log(`[Download] Download started:`, downloadData);

            if (!downloadData.success) {
              throw new Error(downloadData.error || 'Failed to start download');
            }

            // Wait for download to complete
            if (!isMounted) return; // Stop if modal closed
            setStatus('Downloading...');
            let isReady = false;
            let attempts = 0;
            const maxAttempts = 1800; // 1 hour timeout (1800 * 2 seconds)

            while (!isReady && attempts < maxAttempts && isMounted) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Check every 1 second for more responsive progress
              attempts++;

              if (!isMounted) break; // Stop if modal closed

              try {
                const statusResponse = await fetch(`/api/download-to-library/${videoId}`, {
                  signal: abortController.signal,
                });
                if (!statusResponse.ok) {
                  throw new Error('Failed to check download status');
                }

                const statusData = await statusResponse.json();
                console.log(`[Download] Status check (attempt ${attempts}):`, statusData);

                if (statusData.status === 'ready') {
                  isReady = true;
                  if (isMounted) {
                    setProgress(100);
                  }
                  console.log(`[Download] Download ready!`);
                  break;
                } else if (statusData.status === 'error') {
                  throw new Error(statusData.error || 'Download failed');
                } else if (statusData.status === 'downloading') {
                  // Use actual progress from server for smooth animation
                  const serverProgress = Math.min(99, Math.round((statusData.progress || 0) * 100) / 100);
                  if (isMounted && serverProgress > 0) {
                    setProgress(serverProgress);
                    setStatus('Downloading...');
                  }
                }
              } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                  console.log('[Download] Status check aborted');
                  break;
                }
                throw err;
              }
            }

            // Only throw timeout error if modal is still mounted
            if (!isReady && isMounted) {
              throw new Error('Download timeout - took too long');
            }

            // If modal was closed, stop here
            if (!isMounted) return;

            // Now download the converted file
            if (!isMounted) return; // Stop if modal closed
            setStatus('Finalizing download...');
            console.log(`[Download] Downloading final file`);
            const finalResponse = await fetch(`/api/download/${videoId}`, {
              signal: abortController.signal,
            });
            if (!finalResponse.ok) {
              throw new Error('Failed to download file');
            }

            const blob = await finalResponse.blob();
            console.log(`[Download] File downloaded, size: ${blob.size} bytes`);

            if (isMounted) {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${videoTitle}.mp4`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }
          }
        } else {
          // Response is binary MP4 file
          console.log(`[Download] Received binary MP4 file`);
          const blob = await response.blob();
          console.log(`[Download] File size: ${blob.size} bytes`);

          if (isMounted) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${videoTitle}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        }

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

