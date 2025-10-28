import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { verifyWhopToken } from '@/lib/whop/server';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

// Global store for download status
const downloadStatus: Record<string, { status: string; progress: number; error?: string }> = {};

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

    // Get Whop user from token
    const payload = await verifyWhopToken();

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;
    const supabase = getSupabaseClient();

    // Get video metadata from database
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

    const videoFileName = `${videoId}.mp4`;
    const videoPath = path.join(process.cwd(), 'public', 'videos', videoFileName);

    // If file exists, return it directly
    if (fs.existsSync(videoPath)) {
      const fileBuffer = fs.readFileSync(videoPath);
      const fileSize = fs.statSync(videoPath).size;

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': fileSize.toString(),
          'Content-Disposition': `attachment; filename="${video.title || videoFileName}.mp4"`,
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes',
        },
      });
    }

    // If quick link (has mux_url but no local file), return Mux URL directly
    if (video.mux_url) {
      console.log(`[${videoId}] Quick link - returning Mux URL for streaming`);

      // Return the Mux URL for browser to download directly
      return NextResponse.json({
        success: true,
        type: 'stream',
        url: video.mux_url,
        title: video.title,
        message: 'Streaming from Mux - download will start automatically',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Video not available' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

