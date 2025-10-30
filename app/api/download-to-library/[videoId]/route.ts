import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, setSupabaseUserId } from '@/lib/supabase/client';
import { verifyWhopToken } from '@/lib/whop/server';

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

    // Verify user is authenticated
    const payload = await verifyWhopToken();
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Set the user ID for RLS policies
    await setSupabaseUserId(payload.userId);

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

    // Return the HLS URL for client-side conversion
    // The client will use hls.js to download and convert HLS to MP4
    return NextResponse.json({
      success: true,
      type: 'hls',
      url: video.mux_url,
      title: video.title,
      message: 'Download URL ready - browser will convert HLS to MP4',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}