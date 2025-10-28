'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  successMessage?: string;
  className?: string;
  tooltipText?: string;
  variant?: 'icon' | 'button';
}

export default function CopyButton({
  text,
  successMessage = 'Copied!',
  className = '',
  tooltipText = 'Copy to clipboard',
  variant = 'icon',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={`p-2 rounded transition flex items-center justify-center ${className}`}
        style={{
          backgroundColor: copied ? '#10B981' : '#2B2B2B',
          color: copied ? '#FFFFFF' : '#FF8102',
        }}
        title={copied ? successMessage : tooltipText}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = '#FF8102';
            e.currentTarget.style.color = '#161616';
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = '#2B2B2B';
            e.currentTarget.style.color = '#FF8102';
          }
        }}
      >
        {copied ? (
          <Check size={18} style={{ animation: 'pulse 0.3s ease-out' }} />
        ) : (
          <Copy size={18} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded font-semibold transition flex items-center gap-2 ${className}`}
      style={{
        backgroundColor: copied ? '#10B981' : '#FF8102',
        color: copied ? '#FFFFFF' : '#161616',
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.backgroundColor = '#FF6B00';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 129, 2, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.backgroundColor = '#FF8102';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {copied ? (
        <>
          <Check size={18} style={{ animation: 'pulse 0.3s ease-out' }} />
          {successMessage}
        </>
      ) : (
        <>
          <Copy size={18} />
          {tooltipText}
        </>
      )}
    </button>
  );
}
