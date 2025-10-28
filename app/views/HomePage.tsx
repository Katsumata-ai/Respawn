'use client';

import { useState } from 'react';
import VideoExtractor from './VideoExtractor';
import MyVideos from './MyVideos';
import { LogOut, User } from 'lucide-react';

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleVideoSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#161616' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#2B2B2B', backgroundColor: '#161616' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: '#FF8102' }}>
              W
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Whop video downloader</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: '#676767' }}>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Whop User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Section: Download Form + How it works */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Download Form */}
          <div className="lg:col-span-2">
            <VideoExtractor onVideoSaved={handleVideoSaved} />
          </div>

          {/* How it works */}
          <div className="rounded-lg p-6 h-fit" style={{ backgroundColor: '#1a1a1a', borderColor: '#2B2B2B', border: '1px solid' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>How it works</h3>
            <div className="space-y-3 text-sm" style={{ color: '#676767' }}>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: '#FF8102', color: '#161616' }}>
                  1
                </div>
                <p>Paste your Mux video link</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: '#FF8102', color: '#161616' }}>
                  2
                </div>
                <p>Add a title for your video</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: '#FF8102', color: '#161616' }}>
                  3
                </div>
                <p>Click download and watch instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: My Videos */}
        <div style={{ borderTop: '1px solid #2B2B2B' }} className="pt-8">
          <MyVideos refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}

