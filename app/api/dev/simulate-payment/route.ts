import { NextRequest, NextResponse } from 'next/server';

// This endpoint is ONLY for development testing
// NOTE: Whop handles all payment simulation and membership management
// This endpoint is kept for reference but no longer needed

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Payment simulation is now handled by Whop. Use Whop dashboard to test payments.',
    note: 'Whop automatically manages user memberships and access passes.',
  });
}

