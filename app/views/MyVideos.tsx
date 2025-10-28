'use client';

import { useEffect, useState } from 'react';
import { Play, Trash2, Copy, Check, Video, Download } from 'lucide-react';
import DownloadProgressModal from '@/app/components/DownloadProgressModal';
import PaywallModal from '@/app/components/PaywallModal';

interface Video {
  id: string;
  title: string;
  duration: number;
  created_at: string;
  shareable_id: string;
  thumbnail?: string;
  mux_url?: string;
}

export default function MyVideos({ refreshTrigger }: { refreshTrigger?: number }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingTitle, setDownloadingTitle] = useState('');
  const [downloadingDuration, setDownloadingDuration] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'local-download' | 'upgrade'>('upgrade');

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchVideos();
    }
  }, [refreshTrigger]);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const copyWatchLink = async (video: Video) => {
    if (!video.mux_url) return;
    
    try {
      // Generate player URL with Mux stream
      const playerUrl = `${window.location.origin}/player-view?url=${encodeURIComponent(video.mux_url)}`;
      await navigator.clipboard.writeText(playerUrl);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const deleteVideo = async (videoId: string, shareableId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const response = await fetch(`/api/videos/${shareableId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete video');
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const isRecent = (createdAt: string): boolean => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - created) / (1000 * 60);
    return diffMinutes < 5; // Show orange dot for videos created in last 5 minutes
  };

  const startDownload = (videoId: string, videoTitle: string, duration: number) => {
    setDownloadingId(videoId);
    setDownloadingTitle(videoTitle);
    setDownloadingDuration(duration);
  };

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Video size={48} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-2">No videos yet</p>
          <p className="text-gray-500 text-sm">Download a video to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>My videos</h2>

      <div className="space-y-2">
        {videos.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: '#676767' }}>No videos yet. Download one to get started!</p>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="rounded p-3 transition flex items-center justify-between"
              style={{ backgroundColor: '#1a1a1a', borderColor: '#2B2B2B', border: '1px solid' }}
            >
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-12 rounded flex-shrink-0 flex items-center justify-center text-xs overflow-hidden" style={{ backgroundColor: '#2B2B2B' }}>
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span style={{ color: '#676767' }}>▶</span>
                  </div>
                  {isRecent(video.created_at) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: '#FF8102' }}></div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate" style={{ color: '#FFFFFF' }}>{video.title}</h3>
                  <p className="text-xs" style={{ color: '#676767' }}>
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {/* Copy Button */}
                <button
                  onClick={() => copyWatchLink(video)}
                  className="p-2 rounded transition flex items-center justify-center"
                  style={{
                    backgroundColor: copiedId === video.id ? '#10B981' : '#2B2B2B',
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
                      e.currentTarget.style.backgroundColor = '#2B2B2B';
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
                  onClick={() => startDownload(video.id, video.title, video.duration)}
                  className="p-2 rounded transition"
                  style={{
                    backgroundColor: '#2B2B2B',
                    color: '#FF8102',
                  }}
                  title="Download"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF8102';
                    e.currentTarget.style.color = '#161616';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2B2B2B';
                    e.currentTarget.style.color = '#FF8102';
                  }}
                >
                  <Download size={16} />
                </button>

                {/* Watch Button */}
                <a
                  href={`/watch/${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded transition"
                  style={{
                    backgroundColor: '#2B2B2B',
                    color: '#FF8102',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Watch"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF8102';
                    e.currentTarget.style.color = '#161616';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2B2B2B';
                    e.currentTarget.style.color = '#FF8102';
                  }}
                >
                  <Play size={16} />
                </a>

                {/* Delete Button */}
                <button
                  onClick={() => deleteVideo(video.id, video.shareable_id)}
                  className="p-2 rounded transition"
                  style={{
                    backgroundColor: '#2B2B2B',
                    color: '#EF4444',
                  }}
                  title="Delete"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EF4444';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2B2B2B';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <DownloadProgressModal
        isOpen={downloadingId !== null}
        videoId={downloadingId || ''}
        videoTitle={downloadingTitle}
        videoDuration={downloadingDuration}
        onClose={() => {
          setDownloadingId(null);
          setDownloadingTitle('');
          setDownloadingDuration(0);
        }}
      />

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        type={paywallType}
      />
    </div>
  );
}

