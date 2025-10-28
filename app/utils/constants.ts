// App Configuration
export const APP_NAME = 'Course Downloader';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Download and manage your course videos';

// Payment Configuration
export const PAYMENT_MODEL = 'one-time';
export const PAYMENT_AMOUNT = 10; // €10
export const PAYMENT_CURRENCY = 'EUR';

// Whop Configuration
export const WHOP_APP_ID = process.env.NEXT_PUBLIC_WHOP_APP_ID || '';
export const WHOP_AGENT_USER_ID = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || '';
export const WHOP_COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || '';

// Mux Configuration
export const MUX_URL_PATTERN = /stream\.mux\.com.*\.m3u8/;
export const VALID_MUX_DOMAIN = 'stream.mux.com';
export const VALID_MUX_EXTENSION = '.m3u8';

// Video Configuration
export const MAX_VIDEO_TITLE_LENGTH = 255;
export const MAX_VIDEO_DESCRIPTION_LENGTH = 1000;
export const VIDEO_PROCESSING_TIMEOUT = 3600000; // 1 hour

// Storage Configuration
export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET || '';
export const S3_REGION = process.env.AWS_S3_REGION || 'us-east-1';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000; // 30 seconds

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_MUX_URL: 'Invalid Mux URL format. Please provide a valid stream.mux.com URL.',
  MISSING_FIELDS: 'Please fill in all required fields.',
  UPLOAD_FAILED: 'Failed to upload video. Please try again.',
  FETCH_FAILED: 'Failed to fetch videos. Please try again.',
  ACCESS_DENIED: 'Access denied. Please purchase the app to continue.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  VIDEO_UPLOADED: 'Video uploaded successfully!',
  VIDEO_DELETED: 'Video deleted successfully!',
  ACCESS_GRANTED: 'Access granted!',
};

