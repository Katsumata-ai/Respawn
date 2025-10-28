// Whop Types
export interface WhopUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface WhopCompany {
  id: string;
  name: string;
  slug: string;
}

export interface WhopExperience {
  id: string;
  name: string;
  companyId: string;
}

// Video Types
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

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ApiError {
  error: string;
  status: number;
}

