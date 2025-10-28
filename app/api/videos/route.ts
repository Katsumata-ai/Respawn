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

    // Get current stats for free users (needed for both check and update)
    const supabase = getSupabaseClient();
    let currentMaxVideos = 0;

    // If user is FREE, check upload limit using max_videos_uploaded (never decreases)
    if (!hasPremium) {
      console.log(`[Upload] Checking max videos uploaded for user: "${whopUserId}"`);

      // Get max_videos_uploaded from user_upload_stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_upload_stats')
        .select('max_videos_uploaded')
        .eq('user_id', whopUserId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('[Upload] ❌ Error fetching upload stats:', statsError);
        return NextResponse.json(
          { error: 'Failed to check upload limit', details: statsError },
          { status: 500 }
        );
      }

      currentMaxVideos = statsData?.max_videos_uploaded || 0;
      console.log(`[Upload] ✅ User "${whopUserId}" has uploaded max ${currentMaxVideos}/${FREE_UPLOAD_LIMIT} videos (lifetime)`);

      // Check if user has reached upload limit (based on max ever uploaded, not current count)
      if (currentMaxVideos >= FREE_UPLOAD_LIMIT) {
        console.log(`[Upload] ❌ User has reached lifetime upload limit`);
        return NextResponse.json(
          {
            error: 'Upload limit reached',
            message: `Free users can upload up to ${FREE_UPLOAD_LIMIT} videos. Upgrade to premium for unlimited uploads.`,
            limit: FREE_UPLOAD_LIMIT,
            current: currentMaxVideos,
            userId: whopUserId
          },
          { status: 403 }
        );
      }

      console.log(`[Upload] ✅ User can upload (${currentMaxVideos}/${FREE_UPLOAD_LIMIT})`);
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

    // Update max_videos_uploaded for free users (increment by 1, never decreases)
    if (!hasPremium) {
      const newMaxCount = currentMaxVideos + 1;

      console.log(`[Upload] Updating max_videos_uploaded to ${newMaxCount} for user ${whopUserId}`);

      const { error: updateError } = await supabase
        .from('user_upload_stats')
        .upsert({
          user_id: whopUserId,
          max_videos_uploaded: newMaxCount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('[Upload] ⚠️ Failed to update max_videos_uploaded:', updateError);
        // Don't fail the upload, just log the error
      } else {
        console.log(`[Upload] ✅ Updated max_videos_uploaded to ${newMaxCount}`);
      }
    }

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

    // Get max_videos_uploaded for the count display (never decreases)
    const { data: statsData } = await supabase
      .from('user_upload_stats')
      .select('max_videos_uploaded')
      .eq('user_id', whopUserId)
      .single();

    const maxVideosUploaded = statsData?.max_videos_uploaded || videos.length;

    return NextResponse.json({
      videos,
      maxVideosUploaded // Include this for the frontend to display correct count
    });
  } catch (error) {
    console.error('Error in GET /api/videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

