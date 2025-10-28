import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Global store for download status and active processes
const downloadStatus: Record<string, { status: string; progress: number; error?: string }> = {};
const activeDownloads: Record<string, ChildProcess> = {};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Missing videoId' },
        { status: 400 }
      );
    }

    // Check if already downloading
    if (downloadStatus[videoId]?.status === 'downloading') {
      return NextResponse.json({
        success: true,
        status: 'downloading',
        progress: downloadStatus[videoId].progress,
        message: 'Download already in progress',
      });
    }

    // Get video metadata
    const supabase = getSupabaseClient();
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoPath = path.join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);

    // If file already exists, no need to download
    if (fs.existsSync(videoPath)) {
      return NextResponse.json({
        success: true,
        status: 'ready',
        message: 'File already exists in library',
      });
    }

    // Cancel any existing download for this video
    if (activeDownloads[videoId]) {
      console.log(`[${videoId}] Cancelling existing download`);
      activeDownloads[videoId].kill('SIGKILL');
      delete activeDownloads[videoId];

      // Delete incomplete file
      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
          console.log(`[${videoId}] Deleted incomplete file from previous download`);
        } catch (err) {
          console.error(`[${videoId}] Failed to delete incomplete file:`, err);
        }
      }
    }

    // Reset and mark as downloading
    downloadStatus[videoId] = { status: 'downloading', progress: 0 };

    // Launch download in background (don't await!)
    startBackgroundDownload(videoId, video.mux_url, video.title, videoPath, video.duration);

    // Return immediately
    return NextResponse.json({
      success: true,
      status: 'downloading',
      progress: 0,
      message: 'Download started in background',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background download function
function startBackgroundDownload(
  videoId: string,
  muxUrl: string,
  title: string,
  outputPath: string,
  videoDuration: number
) {
  console.log(`[${videoId}] Starting background download from Mux (duration: ${videoDuration}s)`);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Delete incomplete file if it exists
  if (fs.existsSync(outputPath)) {
    try {
      fs.unlinkSync(outputPath);
      console.log(`[${videoId}] Deleted incomplete file`);
    } catch (err) {
      console.error(`[${videoId}] Failed to delete incomplete file:`, err);
    }
  }

  // Use ffmpeg to download HLS stream with token
  // ffmpeg can handle HLS streams with authentication tokens
  const ffmpeg = spawn('ffmpeg', [
    '-i', muxUrl,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y', // Overwrite output file
    outputPath,
  ]);

  // Store the active process
  activeDownloads[videoId] = ffmpeg;

  let lastProgress = 0;
  let lastUpdateTime = Date.now();

  ffmpeg.stdout?.on('data', (data) => {
    const output = data.toString();
    console.log(`[${videoId}] ffmpeg stdout: ${output}`);
  });

  ffmpeg.stderr?.on('data', (data) => {
    const output = data.toString();

    // Try to extract progress from ffmpeg output
    // ffmpeg outputs progress like: frame=  123 fps= 45 q=28.0 Lsize=N/A time=00:00:05.12 bitrate=N/A speed=9.02x
    const timeMatch = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseFloat(timeMatch[3]);
      const processedSeconds = hours * 3600 + minutes * 60 + seconds;

      // Calculate progress based on actual video duration with 2 decimal precision
      const rawProgress = (processedSeconds / videoDuration) * 100;
      const estimatedProgress = Math.min(99.5, Math.round(rawProgress * 100) / 100);

      // Update progress more frequently for smoother animation (every 0.3 seconds or if progress increased)
      const now = Date.now();
      if (estimatedProgress > lastProgress || now - lastUpdateTime > 300) {
        lastProgress = estimatedProgress;
        lastUpdateTime = now;
        downloadStatus[videoId].progress = lastProgress;
        console.log(`[${videoId}] Progress: ${estimatedProgress.toFixed(2)}% (${processedSeconds.toFixed(2)}s / ${videoDuration}s)`);
      }
    }
  });

  ffmpeg.on('close', (code) => {
    // Remove from active downloads
    delete activeDownloads[videoId];

    if (code === 0) {
      console.log(`[${videoId}] Download completed successfully`);
      downloadStatus[videoId] = { status: 'ready', progress: 100 };
    } else {
      console.error(`[${videoId}] Download failed with code ${code}`);
      // Delete incomplete file on error
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
          console.log(`[${videoId}] Deleted incomplete file after error`);
        } catch (err) {
          console.error(`[${videoId}] Failed to delete incomplete file:`, err);
        }
      }
      downloadStatus[videoId] = {
        status: 'error',
        progress: lastProgress,
        error: `Download failed with code ${code}`,
      };
    }
  });

  ffmpeg.on('error', (err) => {
    console.error(`[${videoId}] Download error:`, err);

    // Remove from active downloads
    delete activeDownloads[videoId];

    // Delete incomplete file on error
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log(`[${videoId}] Deleted incomplete file after error`);
      } catch (delErr) {
        console.error(`[${videoId}] Failed to delete incomplete file:`, delErr);
      }
    }
    downloadStatus[videoId] = {
      status: 'error',
      progress: lastProgress,
      error: err.message,
    };
  });
}

// GET endpoint to check download status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Missing videoId' },
        { status: 400 }
      );
    }

    const status = downloadStatus[videoId] || { status: 'idle', progress: 0 };

    return NextResponse.json({
      success: true,
      videoId,
      ...status,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clean up incomplete files and cancel downloads
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Missing videoId' },
        { status: 400 }
      );
    }

    // Kill active download process if exists
    if (activeDownloads[videoId]) {
      console.log(`[${videoId}] Killing active download process`);
      activeDownloads[videoId].kill('SIGKILL');
      delete activeDownloads[videoId];
    }

    const videoPath = path.join(process.cwd(), 'public', 'videos', `${videoId}.mp4`);

    // Delete incomplete file if it exists
    if (fs.existsSync(videoPath)) {
      try {
        fs.unlinkSync(videoPath);
        console.log(`[${videoId}] Deleted incomplete file via DELETE endpoint`);
      } catch (err) {
        console.error(`[${videoId}] Failed to delete file:`, err);
        return NextResponse.json(
          { success: false, error: 'Failed to delete file' },
          { status: 500 }
        );
      }
    }

    // Reset download status
    delete downloadStatus[videoId];

    return NextResponse.json({
      success: true,
      message: 'Download cancelled and incomplete file deleted',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

