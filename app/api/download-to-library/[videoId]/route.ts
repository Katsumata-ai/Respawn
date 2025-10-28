import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

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

    // Convert HLS URL to MP4 URL for download
    // Mux supports both .m3u8 (HLS streaming) and .mp4 (direct download)
    const mp4Url = video.mux_url.replace('.m3u8', '.mp4');

    return NextResponse.json({
      success: true,
      type: 'stream',
      url: mp4Url,
      title: video.title,
      message: 'Download URL ready - browser will download MP4 directly from Mux',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}