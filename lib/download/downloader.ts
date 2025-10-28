import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export class VideoDownloader {
  private tempDir: string;
  private downloadDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'tmp', 'downloads');
    this.downloadDir = path.join(process.cwd(), 'public', 'videos');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Download video from Mux URL using yt-dlp
   */
  async downloadVideo(muxUrl: string, videoTitle?: string, videoId?: string): Promise<{
    videoId: string;
    filePath: string;
    metadata: any;
  }> {
    const finalVideoId = videoId || uuidv4();
    const outputPath = path.join(this.tempDir, `${finalVideoId}.mp4`);
    const infoJsonPath = path.join(this.tempDir, `${finalVideoId}.info.json`);

    try {
      console.log(`[${finalVideoId}] Starting download from: ${muxUrl}`);

      // Download video with yt-dlp
      const command = `yt-dlp \
        --no-playlist \
        --concurrent-fragments 16 \
        -f "bv*+ba/b" \
        --merge-output-format mp4 \
        --postprocessor-args "ffmpeg:-c:v libx264 -preset fast -c:a aac -b:a 128k -movflags +faststart" \
        --write-info-json \
        -o "${outputPath.replace(/\.mp4$/, '')}" \
        "${muxUrl}"`;

      console.log(`[${finalVideoId}] Executing: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        timeout: 3600000, // 1 hour timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      console.log(`[${finalVideoId}] Download output:`, stdout);
      if (stderr) console.log(`[${finalVideoId}] Stderr:`, stderr);

      // Check if file exists
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Downloaded file not found at ${outputPath}`);
      }

      // Read metadata if available
      let metadata = {};
      if (fs.existsSync(infoJsonPath)) {
        const infoContent = fs.readFileSync(infoJsonPath, 'utf-8');
        metadata = JSON.parse(infoContent);
      }

      console.log(`[${finalVideoId}] Download completed successfully`);

      return {
        videoId: finalVideoId,
        filePath: outputPath,
        metadata,
      };
    } catch (error) {
      console.error(`[${finalVideoId}] Download failed:`, error);
      // Cleanup on error
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      if (fs.existsSync(infoJsonPath)) {
        fs.unlinkSync(infoJsonPath);
      }
      throw error;
    }
  }

  /**
   * Get video file info using ffprobe
   */
  async getVideoInfo(filePath: string): Promise<any> {
    try {
      const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Error getting video info:', error);
      throw error;
    }
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath: string): number {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  /**
   * Clean up temporary files
   */
  cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Also try to remove .info.json file
      const infoPath = filePath.replace(/\.[^.]+$/, '.info.json');
      if (fs.existsSync(infoPath)) {
        fs.unlinkSync(infoPath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
}

