/**
 * GET /api/oauth/callback
 * Handles the OAuth callback from Whop
 * Exchanges authorization code for access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { WhopServerSdk } from '@whop/api';

const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY!,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Verify state parameter
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || state !== storedState) {
      console.error('State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      );
    }

    const redirectUri = process.env.WHOP_REDIRECT_URI;

    if (!redirectUri) {
      console.error('OAuth configuration missing - redirect URI not set');
      return NextResponse.redirect(
        new URL('/?error=config_missing', request.url)
      );
    }

    // Exchange code for token using Whop SDK
    const authResponse = await whopApi.oauth.exchangeCode({
      code,
      redirectUri,
    });

    if (!authResponse.ok) {
      const errorMsg = (authResponse as any).raw?.statusText || 'Unknown error';
      console.error('Token exchange failed:', errorMsg);
      return NextResponse.redirect(
        new URL(`/?error=token_exchange_failed&details=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    const { access_token } = authResponse.tokens;

    // Create response and set secure cookie with access token
    const response = NextResponse.redirect(new URL('/', request.url));

    response.cookies.set('whop_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 30, // 30 days
    });

    // Clear state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=callback_error&details=${encodeURIComponent(String(error))}`, request.url)
    );
  }
}

