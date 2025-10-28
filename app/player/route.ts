import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect /player?url=... to open video in player
 * This prevents direct .m3u8 downloads and opens in browser player instead
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect to a player page with the URL encoded
  return NextResponse.redirect(
    new URL(`/player-view?url=${encodeURIComponent(url)}`, request.url)
  );
}
