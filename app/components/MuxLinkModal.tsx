'use client';

import { X } from 'lucide-react';

interface MuxLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MuxLinkModal({ isOpen, onClose }: MuxLinkModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      title: 'Open DevTools and Prepare',
      items: [
        'Open the video page on Whop (the course you want to download)',
        'Press F12 to open DevTools (or right-click → Inspect)',
        'Click on the "Network" tab at the top of DevTools',
        'In the filter box, type: m3u8',
        'Keep DevTools open for the next steps',
      ],
    },
    {
      number: 2,
      title: 'Capture the Mux Link',
      items: [
        'Reload the page (press F5 or Ctrl+R)',
        'Play the video that you want to download',
        'Wait 2-3 seconds for the video to start playing',
        'Look in the Network tab - you\'ll see a request appear',
        'Click on the request that contains "stream.mux.com"',
        'Copy the full URL that looks like: https://stream.mux.com/xxxxx.m3u8?token=xxxxx',
      ],
    },
    {
      number: 3,
      title: 'Use in Downloader',
      items: [
        'Paste the Mux link into the app input field',
        'Add a descriptive title for your video',
        'Click "Download & Save Video"',
        'Video saves instantly to the cloud',
        'Watch, share, or download locally anytime',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div
        className="rounded-3xl p-8 max-w-3xl w-full relative overflow-hidden max-h-[90vh] overflow-y-auto pr-2"
        style={{
          backgroundColor: '#161616',
          border: '1px solid #2B2B2B',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition hover:bg-gray-800 z-10"
          style={{ color: '#676767' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
            How to Get Mux Links
          </h2>
          <p style={{ color: '#AAAAAA' }}>
            Step-by-step guide to capture and use Mux links from Whop videos
          </p>
        </div>

        {/* Intro */}
        <div
          className="p-5 rounded-2xl mb-8"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2B2B2B',
          }}
        >
          <p style={{ color: '#FFFFFF', marginBottom: '12px', fontWeight: '600', fontSize: '16px' }}>
            What is a Mux Link?
          </p>
          <p style={{ color: '#AAAAAA', lineHeight: '1.7', marginBottom: '12px' }}>
            Whop uses Mux to serve videos. A Mux link is the direct URL to the video stream. It looks like this:
          </p>
          <div
            className="p-3 rounded-lg font-mono text-xs"
            style={{
              backgroundColor: '#0a0a0a',
              color: '#FF8102',
              overflowX: 'auto',
              border: '1px solid #2B2B2B',
            }}
          >
            https://stream.mux.com/xxxxx.m3u8?token=xxxxx
          </div>
          <p style={{ color: '#AAAAAA', lineHeight: '1.7', marginTop: '12px' }}>
            This link allows you to save videos permanently to the cloud and download them locally as clean MP4 files.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-8">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#FF8102', color: '#161616' }}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
                  {step.title}
                </h3>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2B2B2B',
                  marginLeft: '44px',
                }}
              >
                <ul className="space-y-2">
                  {step.items.map((item, idx) => (
                    <li key={idx} style={{ color: '#AAAAAA' }} className="flex items-start gap-3">
                      <span style={{ color: '#FF8102', flexShrink: 0 }}>→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Warning 1 */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid #EF4444',
          }}
        >
          <p style={{ color: '#EF4444', fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}>
            ⚠️ Time-Limited Token
          </p>
          <p style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.6' }}>
            The Mux link contains a time-limited token that expires after a few hours. If the link stops working or shows an error, simply capture a fresh one by repeating the steps above. This is normal and takes only 30 seconds.
          </p>
        </div>

        {/* Warning 2 */}
        <div
          className="p-5 rounded-2xl mb-8"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid #EF4444',
          }}
        >
          <p style={{ color: '#EF4444', fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}>
            ⚠️ Multiple Videos in Playlists
          </p>
          <p style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
            If you're downloading from a playlist or course with multiple videos, the Network tab may show several Mux links at once.
          </p>
          <p style={{ color: '#CCCCCC', fontSize: '14px', lineHeight: '1.6' }}>
            <strong style={{ color: '#FFFFFF' }}>Solution:</strong> Make sure to play ONLY the video you want to download. The most recent link that appears after clicking play is usually the correct one. You can also check the file size in the Network tab to identify the right video.
          </p>
        </div>

        {/* Benefits */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{
            backgroundColor: 'rgba(255, 129, 2, 0.05)',
            border: '1px solid #2B2B2B',
          }}
        >
          <p style={{ color: '#FFFFFF', fontWeight: '500', marginBottom: '12px' }}>
            After Saving Your Videos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Watch anytime, anywhere',
              'Share with anyone',
              'Download locally',
              'Lifetime access',
            ].map((benefit, idx) => (
              <div key={idx} style={{ color: '#AAAAAA' }} className="flex items-center gap-2">
                <span style={{ color: '#FF8102' }}>✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold transition"
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
          Got it!
        </button>
      </div>
    </div>
  );
}
