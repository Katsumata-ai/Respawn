-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shareable_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  s3_url VARCHAR(500),
  mux_url VARCHAR(500),
  duration INTEGER,
  thumbnail VARCHAR(500),
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_accesses table for tracking
CREATE TABLE IF NOT EXISTS video_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('view', 'download')),
  accessed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45)
);

-- Create indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_shareable_id ON videos(shareable_id);
CREATE INDEX idx_video_accesses_video_id ON video_accesses(video_id);
CREATE INDEX idx_video_accesses_user_id ON video_accesses(user_id);
CREATE INDEX idx_video_accesses_accessed_at ON video_accesses(accessed_at);

-- Create video_shares table for shareable links
CREATE TABLE IF NOT EXISTS video_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL,
  shared_with_user_id UUID,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_shares_video_id ON video_shares(video_id);
CREATE INDEX idx_video_shares_share_token ON video_shares(share_token);

-- Create users table for tracking user limits and payment status
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  has_paid BOOLEAN DEFAULT false,
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX idx_users_email ON users(email);

-- Create user_limits table to track cloud uploads and local downloads
CREATE TABLE IF NOT EXISTS user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cloud_uploads_count INTEGER DEFAULT 0,
  local_downloads_count INTEGER DEFAULT 0,
  cloud_uploads_limit INTEGER DEFAULT 1,
  local_downloads_limit INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);

