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

    // Return the Mux URL for direct download
    // The browser will download directly from Mux, not from our server
    return NextResponse.json({
      success: true,
      type: 'stream',
      url: video.mux_url,
      title: video.title,
      message: 'Download URL ready - browser will download directly from Mux',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}