export interface Video {
  id: string;
  userId: string;
  shareableId: string;
  title: string;
  description?: string;
  s3Url?: string;
  muxUrl?: string;
  duration?: number;
  thumbnail?: string;
  viewCount: number;
  downloadCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUploadRequest {
  muxUrl: string;
  title: string;
  description?: string;
}

export interface VideoResponse {
  id: string;
  shareableId: string;
  title: string;
  s3Url?: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

export interface VideoStats {
  totalViews: number;
  totalDownloads: number;
  lastAccessed?: string;
}

