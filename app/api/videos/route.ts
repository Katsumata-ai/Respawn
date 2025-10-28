import { NextRequest, NextResponse } from 'next/server';
import { DownloadService } from '@/lib/download/service';
import { getSupabaseClient } from '@/lib/supabase/client';
import { verifyWhopToken, checkUserHasPremiumAccess } from '@/lib/whop/server';
import { v4 as uuidv4 } from 'uuid';

const FREE_UPLOAD_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/videos] Request received');

    const body = await request.json();
    const { muxUrl, title } = body;

    console.log('[POST /api/videos] Body:', { muxUrl: !!muxUrl, title: !!title });

    if (!muxUrl || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: muxUrl and title' },
        { status: 400 }
      );
    }

    // Get Whop user from token
    console.log('[POST /api/videos] Verifying token...');
    const payload = await verifyWhopToken();
    console.log('[POST /api/videos] Token payload:', payload);

    if (!payload || !payload.userId) {
      console.error('[POST /api/videos] ❌ No valid token or userId');
      console.error('[POST /api/videos] Payload:', payload);
      return NextResponse.json(
        { error: 'Unauthorized - Please refresh the page', debug: 'No token found' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;
    const shareableId = uuidv4();

    console.log(`[Upload] whopUserId: "${whopUserId}" (type: ${typeof whopUserId})`);

    // Check if user has premium access using Whop API
    console.log('[Upload] Checking premium access...');
    const hasPremium = await checkUserHasPremiumAccess(whopUserId);
    console.log(`[Upload] hasPremium: ${hasPremium}`);

    // If user is FREE, check upload limit by counting videos in Supabase
    if (!hasPremium) {
      const supabase = getSupabaseClient();
      console.log(`[Upload] Counting videos for user: "${whopUserId}"`);

      const { count, error: countError } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', whopUserId);

      if (countError) {
        console.error('[Upload] ❌ Error counting videos:', countError);
        return NextResponse.json(
          { error: 'Failed to check upload limit', details: countError },
          { status: 500 }
        );
      }

      const currentUploadCount = count || 0;
      console.log(`[Upload] ✅ User "${whopUserId}" has ${currentUploadCount}/${FREE_UPLOAD_LIMIT} videos`);

      // Check if user has reached upload limit
      if (currentUploadCount >= FREE_UPLOAD_LIMIT) {
        console.log(`[Upload] ❌ User has reached upload limit`);
        return NextResponse.json(
          {
            error: 'Upload limit reached',
            message: `Free users can upload up to ${FREE_UPLOAD_LIMIT} videos. Upgrade to premium for unlimited uploads.`,
            limit: FREE_UPLOAD_LIMIT,
            current: currentUploadCount,
            userId: whopUserId
          },
          { status: 403 }
        );
      }

      console.log(`[Upload] ✅ User can upload (${currentUploadCount}/${FREE_UPLOAD_LIMIT})`);
    } else {
      console.log(`[Upload] ✅ Premium user, skipping upload limit check`);
    }

    // Validate Mux URL
    if (!muxUrl.includes('stream.mux.com') || !muxUrl.includes('.m3u8')) {
      return NextResponse.json(
        { error: 'Invalid Mux URL. Must be from stream.mux.com and include .m3u8' },
        { status: 400 }
      );
    }

    // Process quick link (no download, just save the Mux URL)
    const service = new DownloadService();
    const result = await service.processQuickLink({
      muxUrl,
      videoTitle: title,
      userId: whopUserId,
      shareableId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to download video' },
        { status: 400 }
      );
    }

    console.log(`[Upload] Video uploaded successfully for user ${whopUserId}`);

    return NextResponse.json({
      ...result,
      title: title,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/videos] Error processing video:', error);
    console.error('[POST /api/videos] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get Whop user from token
    const payload = await verifyWhopToken();

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;
    const supabase = getSupabaseClient();

    // Get videos for THIS user only
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, duration, created_at, shareable_id, thumbnail, mux_url, s3_url, user_id')
      .eq('user_id', whopUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      );
    }

    // Format the response to match what the frontend expects
    const videos = (data || []).map((video: any) => ({
      id: video.id,
      title: video.title,
      createdAt: video.created_at,
      duration: video.duration,
      thumbnail: video.thumbnail,
      muxUrl: video.mux_url,
      s3Url: video.s3_url,
      shareableId: video.shareable_id,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error in GET /api/videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

