// Types for video download functionality

export interface DownloadRequest {
  muxUrl: string;
  videoTitle?: string;
  userId?: string;
  shareableId?: string;
}

export interface DownloadResponse {
  success: boolean;
  videoId?: string;
  viewUrl?: string;
  watchUrl?: string;
  downloadUrl?: string;
  status?: string;
  error?: string;
  message?: string;
}

export interface DownloadProgress {
  videoId: string;
  status: 'pending' | 'downloading' | 'processing' | 'uploading' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  fileSize: number;
  format: string;
  resolution: string;
  createdAt: string;
  expiresAt?: string;
}

