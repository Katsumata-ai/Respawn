import { NextRequest, NextResponse } from 'next/server';
import { DownloadService } from '@/lib/download/service';
import { getSupabaseClient } from '@/lib/supabase/client';
import { verifyWhopToken, checkUserHasPremiumAccess } from '@/lib/whop/server';
import { v4 as uuidv4 } from 'uuid';

const FREE_UPLOAD_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { muxUrl, title } = body;

    if (!muxUrl || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: muxUrl and title' },
        { status: 400 }
      );
    }

    // Get Whop user from token
    const payload = await verifyWhopToken();

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const whopUserId = payload.userId;
    const shareableId = uuidv4();

    // Check if user has premium access
    const hasPremium = await checkUserHasPremiumAccess(whopUserId);

    // If user is FREE, check upload limit using user_limits table
    if (!hasPremium) {
      const supabase = getSupabaseClient();
      console.log(`[Upload] Checking limits for user: ${whopUserId}`);

      // Get or create user limits
      let { data: limits, error: limitsError } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', whopUserId)
        .single();

      console.log(`[Upload] Limits query result:`, { limits, error: limitsError });

      // If no limits exist, create default ones
      if (limitsError && limitsError.code === 'PGRST116') {
        console.log(`[Upload] No limits found, creating default limits`);
        const { data: newLimits, error: createError } = await supabase
          .from('user_limits')
          .insert({
            user_id: whopUserId,
            cloud_uploads_count: 0,
            local_downloads_count: 0,
            cloud_uploads_limit: FREE_UPLOAD_LIMIT,
            local_downloads_limit: 3,
          })
          .select()
          .single();

        if (createError) {
          console.error('[Upload] Error creating user limits:', createError);
          return NextResponse.json(
            { error: 'Failed to initialize user limits', details: createError.message },
            { status: 500 }
          );
        }
        limits = newLimits;
        console.log(`[Upload] Created new limits:`, limits);
      } else if (limitsError) {
        console.error('[Upload] Error checking upload limit:', limitsError);
        return NextResponse.json(
          { error: 'Failed to check upload limit', details: limitsError.message },
          { status: 500 }
        );
      }

      console.log(`[Upload] Current upload count: ${limits?.cloud_uploads_count}/${FREE_UPLOAD_LIMIT}`);

      // Check if user has reached upload limit
      if (limits && limits.cloud_uploads_count >= FREE_UPLOAD_LIMIT) {
        console.log(`[Upload] User has reached upload limit`);
        return NextResponse.json(
          {
            error: 'Upload limit reached',
            message: `Free users can upload up to ${FREE_UPLOAD_LIMIT} videos. Upgrade to premium for unlimited uploads.`,
            limit: FREE_UPLOAD_LIMIT,
            current: limits.cloud_uploads_count
          },
          { status: 403 }
        );
      }

      console.log(`[Upload] User can upload (${limits?.cloud_uploads_count}/${FREE_UPLOAD_LIMIT})`);
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

    // Increment upload counter for free users (only after successful upload)
    if (!hasPremium) {
      const supabase = getSupabaseClient();

      // Fetch current count and increment
      const { data: currentLimits } = await supabase
        .from('user_limits')
        .select('cloud_uploads_count')
        .eq('user_id', whopUserId)
        .single();

      if (currentLimits) {
        const newCount = currentLimits.cloud_uploads_count + 1;
        await supabase
          .from('user_limits')
          .update({
            cloud_uploads_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', whopUserId);

        console.log(`[Upload] Incremented upload count for user ${whopUserId}: ${newCount}/${FREE_UPLOAD_LIMIT}`);
      }
    }

    return NextResponse.json({
      ...result,
      title: title,
    }, { status: 201 });
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
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

