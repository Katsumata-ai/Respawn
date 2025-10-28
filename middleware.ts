import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to extract Whop dev token from referer and add it to request headers
 * In dev mode, Whop sends the token as a query parameter in the referer URL
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let tokenAdded = false;

  // 1. Try to get token from referer (for API calls from pages with token in URL)
  const referer = request.headers.get('referer');
  console.log('[Middleware] Path:', request.nextUrl.pathname);
  console.log('[Middleware] Referer:', referer);

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const devToken = refererUrl.searchParams.get('whop-dev-user-token');
      console.log('[Middleware] Dev token from referer:', !!devToken);

      if (devToken) {
        requestHeaders.set('x-whop-user-token', devToken);
        tokenAdded = true;
        console.log('[Middleware] ✅ Token added from referer');
      }
    } catch (e) {
      console.log('[Middleware] Error parsing referer:', e);
    }
  }

  // 2. Try to get token from query params (for direct API calls)
  if (!tokenAdded) {
    const queryToken = request.nextUrl.searchParams.get('whop-dev-user-token');
    if (queryToken) {
      requestHeaders.set('x-whop-user-token', queryToken);
      tokenAdded = true;
      console.log('[Middleware] ✅ Token added from query params');
    }
  }

  // 3. Try to get token from x-whop-user-token header (already present)
  if (!tokenAdded) {
    const headerToken = request.headers.get('x-whop-user-token');
    if (headerToken) {
      tokenAdded = true;
      console.log('[Middleware] ✅ Token already in headers');
      console.log('[Middleware] Token preview:', headerToken.substring(0, 50) + '...');
    }
  }

  if (!tokenAdded) {
    console.log('[Middleware] ⚠️ No token found');
    console.log('[Middleware] Available headers:', Array.from(request.headers.entries()).map(([k]) => k).join(', '));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
    '/experiences/:path*',
  ],
};

