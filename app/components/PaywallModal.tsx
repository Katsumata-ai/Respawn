'use client';

import { X, Zap, Lock, Share2, Gift } from 'lucide-react';
import PremiumUpgradeButton from './PremiumUpgradeButton';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'cloud-upload' | 'local-download' | 'upgrade';
  currentCount?: number;
  limit?: number;
  experienceId?: string;
  whopToken?: string;
}

export default function PaywallModal({
  isOpen,
  onClose,
  type,
  currentCount = 0,
  limit = 1,
  experienceId,
  whopToken,
}: PaywallModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Zap size={18} />,
      title: 'Unlimited Cloud Uploads',
    },
    {
      icon: <Lock size={18} />,
      title: 'Unlimited Local Downloads',
    },
    {
      icon: <Share2 size={18} />,
      title: 'Share Your Courses',
    },
    {
      icon: <Gift size={18} />,
      title: 'Lifetime Access',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div
        className="rounded-3xl p-6 max-w-sm w-full relative overflow-hidden"
        style={{
          backgroundColor: '#161616',
          border: '1px solid #2B2B2B',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg transition hover:bg-gray-800"
          style={{ color: '#676767' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
            Unlock Premium
          </h2>

          {/* Price */}
          <div>
            <div className="text-5xl font-bold" style={{ color: '#FF8102' }}>
              €10
            </div>
            <p className="text-xs mt-1" style={{ color: '#676767' }}>
              One-time • Lifetime access
            </p>
          </div>
        </div>

        {/* Features Grid - Compact */}
        <div className="grid grid-cols-1 gap-2 mb-5">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg transition"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2B2B2B',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF8102';
                e.currentTarget.style.backgroundColor = 'rgba(255, 129, 2, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2B2B2B';
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
            >
              <div
                className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 129, 2, 0.1)', color: '#FF8102' }}
              >
                {feature.icon}
              </div>
              <h3 className="font-medium text-xs" style={{ color: '#FFFFFF' }}>
                {feature.title}
              </h3>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mb-2">
          <PremiumUpgradeButton
            experienceId={experienceId}
            onSuccess={onClose}
            className="w-full py-3 rounded-lg font-bold text-sm"
            whopToken={whopToken}
            style={{
              backgroundColor: '#FF8102',
              color: '#161616',
            }}
          />
        </div>

        {/* Secondary Button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg font-medium transition border-2 text-xs"
          style={{
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            borderColor: '#2B2B2B',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FF8102';
            e.currentTarget.style.backgroundColor = 'rgba(255, 129, 2, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2B2B2B';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Maybe Later
        </button>

        {/* Trust Badge */}
        <div className="mt-4 text-center text-xs" style={{ color: '#676767' }}>
          <p>30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  );
}
