'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, X, HelpCircle } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

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

    // Load FFmpeg
    const loadFFmpeg = async () => {
      if (ffmpegLoaded && ffmpegRef.current) {
        return ffmpegRef.current;
      }

      console.log('[Download] Loading FFmpeg.wasm...');
      setStatus('Loading video processor (first time only)...');
      setProgress(5);

      const ffmpeg = new FFmpeg();

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      ffmpeg.on('progress', ({ progress: ffmpegProgress }) => {
        // FFmpeg progress is 0-1, map to 85-95%
        const mappedProgress = 85 + (ffmpegProgress * 10);
        setProgress(mappedProgress);
        console.log(`[FFmpeg] Processing: ${(ffmpegProgress * 100).toFixed(1)}%`);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      console.log('[Download] FFmpeg loaded successfully');

      return ffmpeg;
    };

    const startDownload = async () => {
      console.log(`[Download] Starting fresh download for video: ${videoId}`);

      try {
        // Load FFmpeg first
        await loadFFmpeg();

        // Get the Mux URL from the server
        setStatus('Preparing download...');
        setProgress(10);
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

        // Parse the playlist to get video renditions and audio track
        const lines = playlistText.split('\n');
        const videoRenditions: string[] = [];
        let audioRenditionUrl: string | null = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Look for audio track
          if (line.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
            const uriMatch = line.match(/URI="([^"]+)"/);
            if (uriMatch) {
              audioRenditionUrl = uriMatch[1];
              console.log(`[Download] Found audio track: ${audioRenditionUrl.substring(0, 100)}...`);
            }
            continue;
          }

          // Look for video renditions
          if (line && !line.startsWith('#') && line.includes('rendition.m3u8')) {
            videoRenditions.push(line);
          }
        }

        console.log(`[Download] Found ${videoRenditions.length} video renditions`);
        console.log(`[Download] Found audio track: ${audioRenditionUrl ? 'YES' : 'NO'}`);

        if (videoRenditions.length === 0) {
          throw new Error('No video renditions found in HLS playlist');
        }

        // Download the first (best quality) video rendition playlist
        const videoRenditionUrl = videoRenditions[0];
        console.log(`[Download] Downloading video rendition: ${videoRenditionUrl.substring(0, 100)}...`);

        const videoRenditionResponse = await fetch(videoRenditionUrl, {
          signal: abortController.signal,
        });

        if (!videoRenditionResponse.ok) {
          throw new Error(`Failed to fetch video rendition: ${videoRenditionResponse.status}`);
        }

        const videoRenditionText = await videoRenditionResponse.text();
        console.log(`[Download] Video rendition fetched, size: ${videoRenditionText.length} bytes`);

        // Parse the video rendition to get initialization segment and media segments
        const videoRenditionLines = videoRenditionText.split('\n');
        let videoInitSegmentUrl: string | null = null;
        const videoSegments: string[] = [];

        for (let i = 0; i < videoRenditionLines.length; i++) {
          const line = videoRenditionLines[i].trim();

          // Look for initialization segment (EXT-X-MAP)
          if (line.startsWith('#EXT-X-MAP:')) {
            const uriMatch = line.match(/URI="([^"]+)"/);
            if (uriMatch) {
              videoInitSegmentUrl = uriMatch[1];
              console.log(`[Download] Found video init segment`);
            }
            continue;
          }

          // Skip other comments and empty lines
          if (!line || line.startsWith('#')) {
            continue;
          }

          // Look for .m4s segment files
          if (line.includes('.m4s')) {
            videoSegments.push(line);
          }
        }

        console.log(`[Download] Found ${videoSegments.length} video segments`);

        if (!videoInitSegmentUrl) {
          throw new Error('No video initialization segment found');
        }

        if (videoSegments.length === 0) {
          throw new Error('No video segments found');
        }

        // Parse audio rendition if available
        let audioInitSegmentUrl: string | null = null;
        const audioSegments: string[] = [];

        if (audioRenditionUrl) {
          console.log(`[Download] Downloading audio rendition...`);
          const audioRenditionResponse = await fetch(audioRenditionUrl, {
            signal: abortController.signal,
          });

          if (audioRenditionResponse.ok) {
            const audioRenditionText = await audioRenditionResponse.text();
            const audioRenditionLines = audioRenditionText.split('\n');

            for (const line of audioRenditionLines) {
              const trimmedLine = line.trim();

              if (trimmedLine.startsWith('#EXT-X-MAP:')) {
                const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
                if (uriMatch) {
                  audioInitSegmentUrl = uriMatch[1];
                  console.log(`[Download] Found audio init segment`);
                }
                continue;
              }

              if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
              }

              if (trimmedLine.includes('.m4s')) {
                audioSegments.push(trimmedLine);
              }
            }

            console.log(`[Download] Found ${audioSegments.length} audio segments`);
          } else {
            console.warn(`[Download] Failed to fetch audio rendition, continuing without audio`);
          }
        }

        // Download video track
        if (!isMounted) return;
        setStatus('Downloading video track...');
        setProgress(15);

        console.log(`[Download] Downloading video init segment`);
        const videoInitResponse = await fetch(videoInitSegmentUrl, {
          signal: abortController.signal,
        });

        if (!videoInitResponse.ok) {
          throw new Error(`Failed to download video init segment: ${videoInitResponse.status}`);
        }

        const videoInitBuffer = await videoInitResponse.arrayBuffer();
        const videoChunks: ArrayBuffer[] = [videoInitBuffer];

        for (let i = 0; i < videoSegments.length; i++) {
          if (!isMounted) return;

          const segmentUrl = videoSegments[i];
          console.log(`[Download] Downloading video segment ${i + 1}/${videoSegments.length}`);

          const segmentResponse = await fetch(segmentUrl, {
            signal: abortController.signal,
          });

          if (!segmentResponse.ok) {
            console.warn(`[Download] Failed to download video segment ${i}`);
            continue;
          }

          const buffer = await segmentResponse.arrayBuffer();
          videoChunks.push(buffer);

          // Update progress (15% to 45%)
          const segmentProgress = 15 + (i / videoSegments.length) * 30;
          setProgress(segmentProgress);
        }

        const videoBlob = new Blob(videoChunks, { type: 'video/mp4' });
        console.log(`[Download] Video track downloaded, size: ${videoBlob.size} bytes`);

        // Download audio track if available
        let audioBlob: Blob | null = null;

        if (audioInitSegmentUrl && audioSegments.length > 0) {
          if (!isMounted) return;
          setStatus('Downloading audio track...');
          setProgress(45);

          console.log(`[Download] Downloading audio init segment`);
          const audioInitResponse = await fetch(audioInitSegmentUrl, {
            signal: abortController.signal,
          });

          if (audioInitResponse.ok) {
            const audioInitBuffer = await audioInitResponse.arrayBuffer();
            const audioChunks: ArrayBuffer[] = [audioInitBuffer];

            for (let i = 0; i < audioSegments.length; i++) {
              if (!isMounted) return;

              const segmentUrl = audioSegments[i];
              console.log(`[Download] Downloading audio segment ${i + 1}/${audioSegments.length}`);

              const segmentResponse = await fetch(segmentUrl, {
                signal: abortController.signal,
              });

              if (!segmentResponse.ok) {
                console.warn(`[Download] Failed to download audio segment ${i}`);
                continue;
              }

              const buffer = await segmentResponse.arrayBuffer();
              audioChunks.push(buffer);

              // Update progress (45% to 75%)
              const segmentProgress = 45 + (i / audioSegments.length) * 30;
              setProgress(segmentProgress);
            }

            audioBlob = new Blob(audioChunks, { type: 'audio/mp4' });
            console.log(`[Download] Audio track downloaded, size: ${audioBlob.size} bytes`);
          }
        }

        // Merge video and audio with FFmpeg
        if (!isMounted) return;
        setStatus('Merging video and audio...');
        setProgress(80);

        const ffmpeg = ffmpegRef.current!;

        // Write video file
        await ffmpeg.writeFile('video.m4v', await fetchFile(videoBlob));
        console.log('[Download] Video file written to FFmpeg');

        let outputFile = 'output.mp4';

        if (audioBlob) {
          // Write audio file
          await ffmpeg.writeFile('audio.m4a', await fetchFile(audioBlob));
          console.log('[Download] Audio file written to FFmpeg');

          // Merge video and audio
          console.log('[Download] Merging video and audio with FFmpeg...');
          await ffmpeg.exec(['-i', 'video.m4v', '-i', 'audio.m4a', '-c', 'copy', outputFile]);
        } else {
          // Video only
          console.log('[Download] Processing video only (no audio track)...');
          await ffmpeg.exec(['-i', 'video.m4v', '-c', 'copy', outputFile]);
        }

        // Read the output file
        const outputData = await ffmpeg.readFile(outputFile);
        const blob = new Blob([new Uint8Array(outputData as Uint8Array)], { type: 'video/mp4' });
        console.log(`[Download] Final file created, size: ${blob.size} bytes`);

        // Cleanup FFmpeg files
        try {
          await ffmpeg.deleteFile('video.m4v');
          if (audioBlob) {
            await ffmpeg.deleteFile('audio.m4a');
          }
          await ffmpeg.deleteFile(outputFile);
          console.log('[Download] FFmpeg files cleaned up');
        } catch (e) {
          console.warn('[Download] Failed to cleanup FFmpeg files:', e);
        }

        // Trigger download
        if (!isMounted) return;
        setStatus('Starting download...');
        setProgress(95);

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
          console.log(`[Download] Download complete with ${audioBlob ? 'audio' : 'video only'}!`);

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

