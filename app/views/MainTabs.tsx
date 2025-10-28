'use client';

import { useState } from 'react';
import { Download, Video } from 'lucide-react';
import VideoExtractor from './VideoExtractor';
import MyVideos from './MyVideos';

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState<'download' | 'videos'>('download');

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Vertical Tabs Sidebar */}
      <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">
            <span className="text-orange-500">Whop</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Video Manager</p>
        </div>

        {/* Tabs */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'download'
                ? 'bg-orange-500 text-black font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Download size={20} />
            <span>Download</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'videos'
                ? 'bg-orange-500 text-black font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Video size={20} />
            <span>My Videos</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="w-10 h-10 bg-orange-500 rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'download' && <VideoExtractor />}
          {activeTab === 'videos' && <MyVideos />}
        </div>
      </div>
    </div>
  );
}

