import { SupabaseService } from '@/lib/supabase/service';
import { Video, VideoUploadRequest, VideoStats } from '@/app/models/Video';
import { v4 as uuidv4 } from 'uuid';

export class VideoViewModel {
  private videos: Video[] = [];
  private loading = false;
  private error: string | null = null;

  async uploadVideo(userId: string, request: VideoUploadRequest): Promise<Video> {
    this.loading = true;
    this.error = null;

    try {
      // Validate Mux URL
      if (!this.isValidMuxUrl(request.muxUrl)) {
        throw new Error('Invalid Mux URL');
      }

      // Create shareable ID
      const shareableId = uuidv4();

      // Create video record in Supabase
      const video = await SupabaseService.createVideo({
        userId,
        shareableId,
        title: request.title,
        muxUrl: request.muxUrl,
        viewCount: 0,
        downloadCount: 0,
      });

      this.videos.push(video);
      return video;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to upload video';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async getUserVideos(userId: string): Promise<Video[]> {
    this.loading = true;
    this.error = null;

    try {
      const videos = await SupabaseService.getUserVideos(userId);
      this.videos = videos;
      return videos;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch videos';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async getVideoByShareableId(shareableId: string): Promise<Video> {
    this.loading = true;
    this.error = null;

    try {
      const video = await SupabaseService.getVideoByShareableId(shareableId);
      return video;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Video not found';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async getVideoStats(videoId: string): Promise<VideoStats> {
    try {
      const video = await SupabaseService.getVideo(videoId);
      return {
        totalViews: video.viewCount,
        totalDownloads: video.downloadCount,
        lastAccessed: video.updatedAt,
      };
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch stats';
      throw err;
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      await SupabaseService.deleteVideo(videoId);
      this.videos = this.videos.filter((v) => v.id !== videoId);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete video';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  private isValidMuxUrl(url: string): boolean {
    return url.includes('stream.mux.com') && url.includes('.m3u8');
  }

  getState() {
    return {
      videos: this.videos,
      loading: this.loading,
      error: this.error,
    };
  }
}

export const videoViewModel = new VideoViewModel();

