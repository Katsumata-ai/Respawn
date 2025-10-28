import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint is ONLY for development testing
// It simulates a successful payment by directly updating the database
// DO NOT use this in production!

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update user as paid
    const { data, error } = await supabase
      .from('users')
      .update({
        has_paid: true,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('whop_user_id', userId)
      .select();

    if (error) {
      console.error('[DEV] Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user', details: error },
        { status: 500 }
      );
    }

    console.log('[DEV] User marked as paid:', userId);

    return NextResponse.json({
      success: true,
      message: 'Payment simulated successfully',
      user: data?.[0],
    });
  } catch (error) {
    console.error('[DEV] Error simulating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

