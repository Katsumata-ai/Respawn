import { VideoDownloader } from './downloader';
import { VideoStorage } from './storage';
import { DownloadRequest, DownloadResponse } from './types';

export class DownloadService {
  private downloader: VideoDownloader;
  private storage: VideoStorage;

  constructor() {
    this.downloader = new VideoDownloader();
    this.storage = new VideoStorage();
  }

  /**
   * Quick link creation - just save the Mux URL without downloading
   */
  async processQuickLink(request: DownloadRequest): Promise<DownloadResponse> {
    try {
      // Validate Mux URL
      if (!request.muxUrl || !request.muxUrl.includes('stream.mux.com')) {
        return {
          success: false,
          error: 'Invalid Mux URL. Must be from stream.mux.com',
          message: 'Please provide a valid Mux streaming URL',
        };
      }

      console.log('Creating quick link for:', request.muxUrl);

      // Generate video ID
      const { v4: uuidv4 } = await import('uuid');
      const videoId = uuidv4();

      // Generate thumbnail URL from Mux (using poster image)
      const thumbnailUrl = this.generateMuxThumbnailUrl(request.muxUrl);

      // Save metadata to database
      console.log('Saving metadata to database...');
      await this.storage.saveVideoMetadata(videoId, {
        title: request.videoTitle || 'Video',
        duration: 0, // Will be fetched on first play
        fileSize: 0,
        format: 'stream',
        resolution: 'unknown',
        storageUrl: request.muxUrl,
        storagePath: request.muxUrl,
        muxUrl: request.muxUrl,
        userId: request.userId,
        shareableId: request.shareableId,
        thumbnail: thumbnailUrl,
      });
      console.log('Metadata saved successfully');

      // Generate URLs - use Vercel production URL in production
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const watchUrl = `${baseUrl}/watch/${videoId}`;

      console.log('Quick link created successfully');

      return {
        success: true,
        videoId,
        watchUrl,
        status: 'completed',
        message: 'Video link created successfully',
      };
    } catch (error) {
      console.error('Quick link creation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        message: 'Failed to create video link. Please try again.',
      };
    }
  }

  /**
   * Download video from Mux URL (for quick links)
   */
  async downloadFromMux(videoId: string, muxUrl: string, title: string): Promise<DownloadResponse> {
    try {
      console.log(`[${videoId}] Starting Mux download for: ${muxUrl}`);

      // Download video using yt-dlp
      const downloadResult = await this.downloader.downloadVideo(muxUrl, title, videoId);
      const { filePath, metadata } = downloadResult;

      console.log(`[${videoId}] Download completed`);

      // Upload to public directory
      const uploadResult = await this.storage.uploadVideo(filePath, videoId, metadata);
      console.log(`[${videoId}] Upload completed`);

      // Update database with local file path
      await this.storage.saveVideoMetadata(videoId, {
        title: title || 'Video',
        duration: metadata?.duration || 0,
        fileSize: metadata?.fileSize || 0,
        format: metadata?.format || 'mp4',
        resolution: metadata?.resolution || 'unknown',
        storageUrl: uploadResult.url,
        storagePath: uploadResult.path,
        muxUrl: muxUrl,
        thumbnail: uploadResult.thumbnail,
      });

      console.log(`[${videoId}] Mux download process completed successfully`);

      return {
        success: true,
        videoId,
        status: 'completed',
        message: 'Video downloaded successfully',
      };
    } catch (error) {
      console.error(`[${videoId}] Mux download failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        message: 'Failed to download video from Mux',
      };
    }
  }

  /**
   * Generate Mux thumbnail URL from stream URL
   */
  private generateMuxThumbnailUrl(muxUrl: string): string {
    // Extract video ID from Mux URL
    // Format: https://stream.mux.com/{VIDEO_ID}.m3u8?token=...
    // The VIDEO_ID can contain alphanumeric characters and underscores
    const match = muxUrl.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const videoId = match[1].replace('.m3u8', ''); // Remove .m3u8 if present
      return `https://image.mux.com/${videoId}/thumbnail.jpg?width=160&height=120&time=1`;
    }
    return '';
  }

  /**
   * Main download process
   */
  async processDownload(request: DownloadRequest): Promise<DownloadResponse> {
    try {
      // Validate Mux URL
      if (!request.muxUrl || !request.muxUrl.includes('stream.mux.com')) {
        return {
          success: false,
          error: 'Invalid Mux URL. Must be from stream.mux.com',
          message: 'Please provide a valid Mux streaming URL',
        };
      }

      console.log('Starting download process for:', request.muxUrl);

      // Step 1: Download video
      console.log('Step 1: Downloading video...');
      const downloadResult = await this.downloader.downloadVideo(
        request.muxUrl,
        request.videoTitle
      );

      const { videoId, filePath, metadata } = downloadResult;
      console.log(`Step 1 completed: ${videoId}`);

      // Step 2: Get video info
      console.log('Step 2: Getting video information...');
      const videoInfo = await this.downloader.getVideoInfo(filePath);
      const fileSize = this.downloader.getFileSize(filePath);
      console.log('Step 2 completed');

      // Extract resolution from video info
      const videoStream = videoInfo.streams?.find(
        (s: any) => s.codec_type === 'video'
      );
      const resolution = videoStream
        ? `${videoStream.width}x${videoStream.height}`
        : 'unknown';
      const duration = Math.floor(
        parseFloat(videoInfo.format?.duration || '0')
      );

      // Step 3: Upload to Supabase
      console.log('Step 3: Uploading to Supabase Storage...');
      const uploadResult = await this.storage.uploadVideo(
        filePath,
        videoId,
        metadata
      );
      console.log('Step 3 completed');

      // Step 4: Save metadata to database
      console.log('Step 4: Saving metadata to database...');
      await this.storage.saveVideoMetadata(videoId, {
        title: request.videoTitle || 'Downloaded Video',
        duration,
        fileSize,
        format: 'mp4',
        resolution,
        storageUrl: uploadResult.url,
        storagePath: uploadResult.path,
        muxUrl: request.muxUrl,
        userId: request.userId,
        shareableId: request.shareableId,
        thumbnail: uploadResult.thumbnail,
      });
      console.log('Step 4 completed');

      // Step 5: Cleanup temp files
      console.log('Step 5: Cleaning up temporary files...');
      this.downloader.cleanupTempFile(filePath);
      console.log('Step 5 completed');

      // Generate URLs - use Vercel production URL in production
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                      'http://localhost:3000';
      const viewUrl = `${baseUrl}/watch/${videoId}`;
      const downloadUrl = `${baseUrl}/api/download/${videoId}`;

      console.log('Download process completed successfully');

      return {
        success: true,
        videoId,
        viewUrl,
        downloadUrl,
        status: 'completed',
        message: 'Video downloaded and processed successfully',
      };
    } catch (error) {
      console.error('Download process failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        message: 'Failed to download video. Please try again.',
      };
    }
  }

  /**
   * Get download status
   */
  async getDownloadStatus(videoId: string): Promise<any> {
    try {
      const video = await this.storage.getVideo(videoId);
      return {
        videoId,
        status: video?.status || 'not_found',
        title: video?.title,
        fileSize: video?.file_size,
        resolution: video?.resolution,
        createdAt: video?.created_at,
      };
    } catch (error) {
      console.error('Error getting download status:', error);
      throw error;
    }
  }
}

