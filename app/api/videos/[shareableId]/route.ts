import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareableId: string }> }
) {
  try {
    const { shareableId } = await params;

    if (!shareableId) {
      return NextResponse.json(
        { error: 'shareableId is required' },
        { status: 400 }
      );
    }

    const video = await SupabaseService.getVideoByShareableId(shareableId);

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Track view
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    await SupabaseService.trackAccess({
      videoId: video.id,
      userId: video.userId,
      accessType: 'view',
      ipAddress: clientIp,
      accessedAt: new Date().toISOString(),
    });

    // Update view count
    await SupabaseService.updateVideo(video.id, {
      viewCount: video.viewCount + 1,
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareableId: string }> }
) {
  try {
    const { shareableId } = await params;

    if (!shareableId) {
      return NextResponse.json(
        { error: 'shareableId is required' },
        { status: 400 }
      );
    }

    // Delete video directly by shareable_id
    const supabase = require('@/lib/supabase/client').getSupabaseClient();
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('shareable_id', shareableId);

    if (error) {
      console.error('Error deleting video:', error);
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}

