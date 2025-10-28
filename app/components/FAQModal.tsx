'use client';

import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const [expandedId, setExpandedId] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What quality options are available?',
      answer:
        'The downloader supports all available quality levels from Whop, ranging from standard definition up to 4K or higher where available. You can select your preferred quality before downloading.',
    },
    {
      question: 'Does this work with all Whop content?',
      answer:
        'The downloader works with most publicly accessible content on Whop. Some restricted or DRM-protected content may not be downloadable.',
    },
    {
      question: 'Is there a download limit?',
      answer:
        'Premium users have unlimited downloads. Free users are limited to 3 cloud uploads and 3 local downloads. After upgrading, all limits are removed.',
    },
    {
      question: 'Can I share my downloaded videos outside of Whop?',
      answer:
        'Yes, once downloaded or saved to the cloud, you can share videos with anyone using the shareable link. The videos are yours to keep and share.',
    },
    {
      question: 'Is there a time limit for keeping downloaded videos?',
      answer:
        'No, there is no time limit. Your videos are stored permanently. Premium access is lifetime, so you can access them anytime.',
    },
    {
      question: 'How long do downloads take?',
      answer:
        'Cloud uploads are instant. Local downloads depend on your internet connection speed and file size. Typically, a 1GB video takes 5-10 minutes on a good connection.',
    },
    {
      question: 'What if I have a problem or want a refund?',
      answer:
        'Send a DM to the founder. We offer a 30-day money-back guarantee with no questions asked. We are here to help!',
    },

  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div
        className="rounded-3xl p-8 max-w-2xl w-full relative overflow-hidden max-h-[90vh] overflow-y-auto pr-2"
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
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#AAAAAA' }}>
            Find answers to common questions about the video downloader
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl overflow-hidden transition"
              style={{
                backgroundColor: '#1a1a1a',
                border: expandedId === idx ? '1px solid #FF8102' : '1px solid #2B2B2B',
              }}
            >
              {/* Question */}
              <button
                onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 transition"
                style={{
                  backgroundColor: expandedId === idx ? 'rgba(255, 129, 2, 0.05)' : 'transparent',
                }}
              >
                <span
                  className="text-left font-semibold"
                  style={{ color: '#FFFFFF' }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  style={{
                    color: '#FF8102',
                    transform: expandedId === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease-out',
                    flexShrink: 0,
                  }}
                />
              </button>

              {/* Answer */}
              {expandedId === idx && (
                <div
                  className="px-6 pb-4 border-t"
                  style={{ borderColor: '#2B2B2B' }}
                >
                  <p style={{ color: '#AAAAAA', lineHeight: '1.6' }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-8 p-6 rounded-2xl text-center"
          style={{
            backgroundColor: 'rgba(255, 129, 2, 0.05)',
            border: '1px solid #2B2B2B',
          }}
        >
          <p style={{ color: '#FFFFFF', fontWeight: '500', marginBottom: '4px' }}>
            Still have questions?
          </p>
          <p style={{ color: '#AAAAAA', fontSize: '14px' }}>
            Send a DM to the founder for support
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 py-3 rounded-xl font-semibold transition"
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
          Close
        </button>
      </div>
    </div>
  );
}
