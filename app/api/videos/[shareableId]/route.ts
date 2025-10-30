import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase/service';
import { verifyWhopToken } from '@/lib/whop/server';
import { getSupabaseClient, setSupabaseUserId } from '@/lib/supabase/client';

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

    // Verify user is authenticated
    const payload = await verifyWhopToken();
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;

    // Set the user ID for RLS policies
    await setSupabaseUserId(whopUserId);

    const supabase = getSupabaseClient();

    // First, get the video to verify it belongs to the user
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('id, user_id')
      .eq('shareable_id', shareableId)
      .single();

    if (fetchError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Verify the video belongs to the current user
    if (video.user_id !== whopUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own videos' },
        { status: 403 }
      );
    }

    // Delete the video
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('shareable_id', shareableId);

    if (deleteError) {
      console.error('Error deleting video:', deleteError);
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

