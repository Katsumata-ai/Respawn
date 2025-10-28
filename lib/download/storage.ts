import { getSupabaseClient } from '@/lib/supabase/client';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VideoStorage {
  private supabase = getSupabaseClient();
  private publicVideosDir = path.join(process.cwd(), 'public', 'videos');

  /**
   * Ensure public videos directory exists
   */
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.publicVideosDir)) {
      fs.mkdirSync(this.publicVideosDir, { recursive: true });
      console.log(`Created videos directory: ${this.publicVideosDir}`);
    }
  }

  /**
   * Generate thumbnail from video
   */
  private async generateThumbnail(videoPath: string, videoId: string): Promise<string | null> {
    try {
      const thumbnailPath = path.join(this.publicVideosDir, `${videoId}_thumb.jpg`);

      // Extract frame at 1 second
      const command = `ffmpeg -i "${videoPath}" -ss 1 -vframes 1 -vf "scale=160:120" "${thumbnailPath}" -y`;

      await execAsync(command, { timeout: 30000 });

      if (fs.existsSync(thumbnailPath)) {
        console.log(`[${videoId}] Thumbnail generated successfully`);
        return `/videos/${videoId}_thumb.jpg`;
      }

      return null;
    } catch (error) {
      console.error(`[${videoId}] Thumbnail generation failed:`, error);
      return null;
    }
  }

  /**
   * Move video file to public directory
   */
  async uploadVideo(
    filePath: string,
    videoId: string,
    metadata?: any
  ): Promise<{
    url: string;
    path: string;
    thumbnail?: string;
  }> {
    try {
      this.ensureDirectoryExists();

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileName = `${videoId}.mp4`;
      const publicPath = path.join(this.publicVideosDir, fileName);

      console.log(`[${videoId}] Moving video to public directory: ${publicPath}`);

      // Move file from temp to public
      fs.copyFileSync(filePath, publicPath);
      console.log(`[${videoId}] Video moved successfully`);

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(publicPath, videoId);

      // Generate public URL
      const publicUrl = `/videos/${fileName}`;
      const watchUrl = `/watch/${videoId}`;

      return {
        url: watchUrl,
        path: publicPath,
        thumbnail,
      };
    } catch (error) {
      console.error(`[${videoId}] Upload error:`, error);
      throw error;
    }
  }

  /**
   * Save video metadata to database
   */
  async saveVideoMetadata(
    videoId: string,
    metadata: {
      title?: string;
      duration?: number;
      fileSize: number;
      format: string;
      resolution?: string;
      storageUrl: string;
      storagePath: string;
      muxUrl: string;
      userId?: string;
      shareableId?: string;
      thumbnail?: string;
    }
  ): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('videos')
        .insert([
          {
            id: videoId,
            title: metadata.title || 'Untitled Video',
            duration: metadata.duration || 0,
            mux_url: metadata.muxUrl,
            s3_url: metadata.storageUrl,
            user_id: metadata.userId,
            shareable_id: metadata.shareableId || videoId,
            thumbnail: metadata.thumbnail,
            created_at: new Date().toISOString(),
            is_public: true,
          },
        ])
        .select();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }

      console.log(`[${videoId}] Metadata saved to database`);
      return data?.[0];
    } catch (error) {
      console.error(`[${videoId}] Metadata save error:`, error);
      throw error;
    }
  }

  /**
   * Get video by ID
   */
  async getVideo(videoId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`Error getting video:`, error);
      throw error;
    }
  }

  /**
   * Delete video from storage and database
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      // Delete from local storage
      const filePath = path.join(this.publicVideosDir, `${videoId}.mp4`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[${videoId}] Video file deleted from storage`);
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (dbError) {
        throw new Error(`Database delete failed: ${dbError.message}`);
      }

      console.log(`[${videoId}] Video deleted successfully`);
    } catch (error) {
      console.error(`Error deleting video:`, error);
      throw error;
    }
  }
}

