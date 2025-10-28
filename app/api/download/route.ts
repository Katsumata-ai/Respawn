import { NextRequest, NextResponse } from 'next/server';
import { DownloadService } from '@/lib/download/service';

export const maxDuration = 300; // 5 minutes timeout for Vercel Hobby plan

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { muxUrl, videoTitle, userId } = body;

    // Validate input
    if (!muxUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing muxUrl parameter',
          message: 'Please provide a Mux streaming URL',
        },
        { status: 400 }
      );
    }

    console.log('Download request received:', { muxUrl, videoTitle });

    // Process download
    const service = new DownloadService();
    const result = await service.processDownload({
      muxUrl,
      videoTitle,
      userId,
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing videoId parameter',
        },
        { status: 400 }
      );
    }

    const service = new DownloadService();
    const status = await service.getDownloadStatus(videoId);

    return NextResponse.json(
      {
        success: true,
        data: status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

