import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to extract Whop dev token from referer and add it to request headers
 * In dev mode, Whop sends the token as a query parameter in the referer URL
 */
export function middleware(request: NextRequest) {
  // Get the referer header (the URL of the page that made the request)
  const referer = request.headers.get('referer');
  console.log('[Middleware] Referer:', referer);

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const devToken = refererUrl.searchParams.get('whop-dev-user-token');
      console.log('[Middleware] Dev token found:', !!devToken);

      if (devToken) {
        // Add to headers for API routes
        if (request.nextUrl.pathname.startsWith('/api/')) {
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set('x-whop-user-token', devToken);
          console.log('[Middleware] Token added to headers for API route');

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        }
      }
    } catch (e) {
      // Invalid referer URL, continue without modification
      console.log('[Middleware] Error parsing referer:', e);
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: ['/api/:path*'],
};

