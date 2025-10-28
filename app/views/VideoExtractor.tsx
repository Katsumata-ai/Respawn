'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, X, Play, Download, Copy, Check, Trash2 } from 'lucide-react';
import DownloadProgressModal from '../components/DownloadProgressModal';

interface DownloadResult {
  success: boolean;
  videoId?: string;
  title?: string;
  watchUrl?: string;
  message?: string;
  error?: string;
}

interface Video {
  id: string;
  title: string;
  createdAt?: string;
  created_at?: string;
  mux_url?: string;
  muxUrl?: string;
  shareable_id?: string;
  shareableId?: string;
  duration?: number;
}

export default function VideoExtractor({ onVideoSaved }: { onVideoSaved?: () => void }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const experienceId = params.experienceId as string;
  const whopToken = searchParams.get('whop-dev-user-token');

  const [muxUrl, setMuxUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLimitError, setIsLimitError] = useState<boolean>(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDownloadModalForVideoId, setShowDownloadModalForVideoId] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load videos on mount and when result changes
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded videos:', data.videos);
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error('Failed to load videos:', err);
      }
    };

    loadVideos();
  }, [result]);

  // Also load videos on component mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        if (response.ok) {
          const data = await response.json();
          console.log('Initial videos load:', data.videos);
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error('Failed to load videos:', err);
      }
    };

    loadVideos();
  }, []);

  const handleExtractMuxUrl = async () => {
    const popup = window.open('', 'extractor', 'width=800,height=600');
    if (!popup) {
      setError('Failed to open popup. Please allow popups.');
      return;
    }

    const script = `
      <html>
        <head>
          <title>Mux URL Extractor</title>
          <style>
            body { font-family: Arial; padding: 20px; background: #1a1a1a; color: #fff; }
            .info { background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ff9500; }
            textarea { width: 100%; height: 150px; padding: 10px; border: 1px solid #444; border-radius: 5px; background: #222; color: #fff; }
            button { background: #ff9500; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
            button:hover { background: #ff8c00; }
          </style>
        </head>
        <body>
          <h2>Extract Mux URL</h2>
          <div class="info">
            <p><strong>Steps:</strong></p>
            <p>1. Open DevTools (F12)</p>
            <p>2. Go to Network tab</p>
            <p>3. Play the video</p>
            <p>4. Look for "stream.mux.com" requests</p>
            <p>5. Copy the .m3u8 URL and paste below</p>
          </div>
          <textarea id="muxUrl" placeholder="Paste Mux URL here..."></textarea>
          <br><br>
          <button onclick="
            const url = document.getElementById('muxUrl').value;
            if (url) {
              window.opener.postMessage({ type: 'MUX_URL', url }, '*');
              window.close();
            } else {
              alert('Please paste a URL');
            }
          ">Copy & Close</button>
        </body>
      </html>
    `;

    popup.document.write(script);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLimitError(false);
    setResult(null);

    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (!muxUrl.trim()) {
      setError('Please enter a Mux URL');
      return;
    }

    // Validate Mux URL format on client side
    const muxUrlPattern = /^https:\/\/stream\.mux\.com\/[A-Za-z0-9_-]+\.m3u8\?token=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

    if (!muxUrlPattern.test(muxUrl.trim())) {
      setError('Invalid Mux URL format. The URL must be from stream.mux.com and include a valid .m3u8 file with a token parameter.');
      return;
    }

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          muxUrl: muxUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle upload limit error (403) - check for specific error message
        if (response.status === 403 && data.error === 'Upload limit reached') {
          setError(data.message || 'Upload limit reached');
          setIsLimitError(true);
        } else {
          // Other errors (validation, etc.)
          setError(data.message || data.error || 'Failed to process video');
          setIsLimitError(false);
        }
        return;
      }

      setResult({
        success: true,
        videoId: data.videoId,
        title: title.trim(),
        watchUrl: `${window.location.origin}/watch/${data.videoId}`,
        message: data.message,
      });

      setTitle('');
      setMuxUrl('');

      // Trigger refresh of video list and parent component
      if (onVideoSaved) {
        onVideoSaved();
      }

      // Trigger a custom event to refresh the video count in the parent
      window.dispatchEvent(new CustomEvent('videoUploaded'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const copyWatchLink = () => {
    if (result?.watchUrl) {
      navigator.clipboard.writeText(result.watchUrl);
    }
  };

  const copyVideoLink = async (video: Video) => {
    const muxUrl = video.muxUrl || video.mux_url;
    console.log('Copy video link clicked for:', video);
    console.log('Mux URL:', muxUrl);
    
    if (!muxUrl) {
      console.error('No mux_url found for video:', video);
      return;
    }
    
    try {
      // Generate player URL with Mux stream
      const playerUrl = `${window.location.origin}/player-view?url=${encodeURIComponent(muxUrl)}`;
      console.log('Generated player URL:', playerUrl);
      
      await navigator.clipboard.writeText(playerUrl);
      console.log('Link copied to clipboard!');
      
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const deleteVideo = async (videoId: string, shareableId: string | undefined) => {
    const id = shareableId;
    if (!id) {
      console.error('No shareableId for deletion');
      return;
    }
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const response = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete video');
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'MUX_URL') {
        setMuxUrl(event.data.url);
      }
    });
  }

  return (
    <div>
      {error && (
        <div
          className="mb-4 p-4 rounded-lg text-sm"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #FF8102',
            color: '#FFFFFF'
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#FF8102' }} />
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#FF8102' }}>
                {isLimitError ? 'Upload Limit Reached' : 'Error'}
              </p>
              <p className="mt-1" style={{ color: '#FFFFFF' }}>
                {isLimitError ? (
                  <>
                    {error.split('Upgrade to premium')[0]}
                    <button
                      onClick={() => {
                        // Trigger paywall modal in parent component
                        window.dispatchEvent(new CustomEvent('openPaywall'));
                      }}
                      className="font-semibold underline hover:opacity-80 transition"
                      style={{ color: '#FF8102' }}
                    >
                      Upgrade to premium
                    </button>
                    {' for unlimited uploads.'}
                  </>
                ) : (
                  error
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {result && result.success && (
        <div className="mb-4 p-4 rounded-lg text-sm" style={{ backgroundColor: '#1a1a1a', border: '1px solid #FF8102', color: '#FFFFFF' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-2">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#FF8102' }} />
              <div>
                <p className="font-semibold">Video saved successfully!</p>
                <p className="text-xs mt-1" style={{ color: '#676767' }}>Your video is now in "My Videos"</p>
              </div>
            </div>
            <button
              onClick={() => setResult(null)}
              className="flex-shrink-0 p-1 rounded transition hover:opacity-70"
              style={{ color: '#FF8102' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (result.videoId) {
                  const watchUrl = whopToken
                    ? `/watch/${result.videoId}?experienceId=${experienceId}&whop-dev-user-token=${whopToken}`
                    : `/watch/${result.videoId}?experienceId=${experienceId}`;
                  router.push(watchUrl);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded transition hover:opacity-80"
              style={{ backgroundColor: '#FF8102', color: '#161616' }}
            >
              <span className="text-sm font-semibold">Watch Video</span>
              <Play size={16} />
            </button>
            <button
              onClick={() => {
                setShowDownloadModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded transition hover:opacity-80"
              style={{ backgroundColor: '#2B2B2B', color: '#FF8102', border: '1px solid #FF8102' }}
            >
              <span className="text-sm font-semibold">Download</span>
              <Download size={16} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title"
          className="w-full px-4 py-2.5 rounded text-sm focus:outline-none transition"
          style={{ backgroundColor: '#2B2B2B', borderColor: '#494949', border: '1px solid', color: '#FFFFFF' }}
          onFocus={(e) => e.target.style.borderColor = '#FF8102'}
          onBlur={(e) => e.target.style.borderColor = '#494949'}
        />

        <textarea
          value={muxUrl}
          onChange={(e) => setMuxUrl(e.target.value)}
          placeholder="Mux link"
          className="w-full px-4 py-2.5 rounded h-40 resize-none text-sm focus:outline-none transition"
          style={{ backgroundColor: '#2B2B2B', borderColor: '#494949', border: '1px solid', color: '#FFFFFF' }}
          onFocus={(e) => e.target.style.borderColor = '#FF8102'}
          onBlur={(e) => e.target.style.borderColor = '#494949'}
        />

        <button
          type="submit"
          className="w-full px-4 py-2.5 rounded font-semibold transition text-sm hover:opacity-80"
          style={{ backgroundColor: '#FF8102', color: '#161616' }}
        >
          Download
        </button>
      </form>

      <DownloadProgressModal
        isOpen={showDownloadModal}
        videoId={result?.videoId || ''}
        videoTitle={result?.title || 'Video'}
        onClose={() => setShowDownloadModal(false)}
      />

      {/* Download modal for videos from list */}
      {showDownloadModalForVideoId && (
        <DownloadProgressModal
          isOpen={true}
          videoId={showDownloadModalForVideoId}
          videoTitle={videos.find(v => v.id === showDownloadModalForVideoId)?.title || 'Video'}
          videoDuration={videos.find(v => v.id === showDownloadModalForVideoId)?.duration || 0}
          onClose={() => setShowDownloadModalForVideoId(null)}
        />
      )}

      {/* My Videos Section */}
      <div className="mt-8 pt-6 border-t" style={{ borderColor: '#494949' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>My videos</h2>

        {videos.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#676767' }}>
            <p className="text-sm">No videos yet. Download one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((video) => {
              const watchUrl = whopToken
                ? `/watch/${video.id}?experienceId=${experienceId}&whop-dev-user-token=${whopToken}`
                : `/watch/${video.id}?experienceId=${experienceId}`;

              return (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 rounded transition"
                  style={{ backgroundColor: '#2B2B2B' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        if (btn) {
                          btn.style.transform = 'scale(0.95)';
                          setTimeout(() => {
                            if (btn) btn.style.transform = 'scale(1)';
                            router.push(watchUrl);
                          }, 100);
                        } else {
                          router.push(watchUrl);
                        }
                      }}
                      className="flex-shrink-0 p-2 rounded transition"
                      style={{ backgroundColor: '#1a1a1a', color: '#FF8102' }}
                      title="Play video"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FF8102';
                        e.currentTarget.style.color = '#161616';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.color = '#FF8102';
                      }}
                    >
                      <Play size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>
                        {video.title}
                      </p>
                      <p className="text-xs" style={{ color: '#676767' }}>
                        {new Date(video.createdAt || video.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {/* Copy Button */}
                    <button
                      onClick={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        if (btn) {
                          btn.style.transform = 'scale(0.95)';
                          setTimeout(() => {
                            if (btn) btn.style.transform = 'scale(1)';
                          }, 100);
                        }
                        copyVideoLink(video);
                      }}
                      className="p-2 rounded transition flex items-center justify-center"
                      style={{
                        backgroundColor: copiedId === video.id ? '#10B981' : '#1a1a1a',
                        color: copiedId === video.id ? '#FFFFFF' : '#FF8102',
                      }}
                      title={copiedId === video.id ? "Copied!" : "Copy shareable link"}
                      onMouseEnter={(e) => {
                        if (copiedId !== video.id) {
                          e.currentTarget.style.backgroundColor = '#FF8102';
                          e.currentTarget.style.color = '#161616';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedId !== video.id) {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                          e.currentTarget.style.color = '#FF8102';
                        }
                      }}
                    >
                      {copiedId === video.id ? (
                        <Check size={16} style={{ animation: 'pulse 0.3s ease-out' }} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        if (btn) {
                          btn.style.transform = 'scale(0.95)';
                          setTimeout(() => {
                            if (btn) btn.style.transform = 'scale(1)';
                          }, 100);
                        }
                        setShowDownloadModalForVideoId(video.id);
                      }}
                      className="p-2 rounded transition"
                      style={{
                        backgroundColor: '#1a1a1a',
                        color: '#FF8102',
                      }}
                      title="Download"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FF8102';
                        e.currentTarget.style.color = '#161616';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.color = '#FF8102';
                      }}
                    >
                      <Download size={16} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteVideo(video.id, video.shareableId || video.shareable_id)}
                      className="p-2 rounded transition"
                      style={{
                        backgroundColor: '#1a1a1a',
                        color: '#EF4444',
                      }}
                      title="Delete"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EF4444';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.color = '#EF4444';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
