/**
 * GET /api/oauth/init
 * Initiates the OAuth flow by redirecting to Whop's authorization endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { WhopServerSdk } from '@whop/api';

const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY!,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});

export async function GET(request: NextRequest) {
  try {
    const redirectUri = process.env.WHOP_REDIRECT_URI;

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'OAuth configuration missing - redirect URI not set' },
        { status: 500 }
      );
    }

    // Get authorization URL from Whop SDK
    const { url, state } = whopApi.oauth.getAuthorizationUrl({
      redirectUri,
      scope: ['read_user'],
    });

    // Store state in a cookie for verification in callback
    const response = NextResponse.redirect(url);

    // Set secure cookie with state
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('OAuth init error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', details: String(error) },
      { status: 500 }
    );
  }
}

