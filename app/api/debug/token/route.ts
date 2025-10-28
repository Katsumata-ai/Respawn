import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Debug endpoint to check what headers are being sent
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Get all headers
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });

    // Check for Whop token specifically
    const whopToken = headersList.get('x-whop-user-token');
    const whopDevToken = headersList.get('x-whop-dev-token');
    const referer = headersList.get('referer');

    return NextResponse.json({
      message: 'Debug: Token information',
      hasWhopToken: !!whopToken,
      whopTokenLength: whopToken?.length || 0,
      whopTokenPreview: whopToken ? whopToken.substring(0, 50) + '...' : 'NOT FOUND',
      hasWhopDevToken: !!whopDevToken,
      whopDevTokenLength: whopDevToken?.length || 0,
      hasReferer: !!referer,
      referer: referer || 'NOT FOUND',
      allHeaders: Object.keys(allHeaders).sort(),
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

