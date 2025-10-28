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
      title: 'Capture the Mux URL',
      items: [
        'Open the video on Whop',
        'Press F12 to open DevTools',
        'Go to the Network tab',
        'Play the video',
        'Filter by "m3u8"',
        'Copy the link: https://stream.mux.com/...m3u8?token=...',
      ],
    },
    {
      number: 2,
      title: 'Use in Downloader',
      items: [
        'Paste the Mux link into the app',
        'Add a title for your video',
        'Click "Download & Save Video"',
        'Video saves instantly to the cloud',
        'Watch, share, or download locally',
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
          className="p-4 rounded-2xl mb-8"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2B2B2B',
          }}
        >
          <p style={{ color: '#FFFFFF', marginBottom: '8px', fontWeight: '500' }}>
            What is a Mux Link?
          </p>
          <p style={{ color: '#AAAAAA', lineHeight: '1.6' }}>
            Whop uses Mux to serve videos. A Mux link is the direct URL to the video stream that allows you to save it permanently to the cloud and download it locally as a clean MP4 file.
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
          className="p-4 rounded-2xl mb-4"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid #EF4444',
          }}
        >
          <p style={{ color: '#EF4444', fontWeight: '500', marginBottom: '4px' }}>
            Time-Limited Token
          </p>
          <p style={{ color: '#AAAAAA', fontSize: '14px' }}>
            The Mux link contains a time-limited token. If it stops working, simply capture a fresh one by repeating the steps above.
          </p>
        </div>

        {/* Warning 2 */}
        <div
          className="p-4 rounded-2xl mb-8"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid #EF4444',
          }}
        >
          <p style={{ color: '#EF4444', fontWeight: '500', marginBottom: '4px' }}>
            Multiple Mux Links in Playlists
          </p>
          <p style={{ color: '#AAAAAA', fontSize: '14px' }}>
            For videos inside playlists, the Network tab may show multiple Mux links. Test each one to find the correct video. Look for the link that matches the video you want to download.
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
