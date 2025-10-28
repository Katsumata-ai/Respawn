import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get user ID from headers (set by middleware or auth)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user limits
    const { data: limits, error } = await supabase
      .from('user_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no limits exist, create default ones
      if (error.code === 'PGRST116') {
        const { data: newLimits, error: createError } = await supabase
          .from('user_limits')
          .insert({
            user_id: userId,
            cloud_uploads_count: 0,
            local_downloads_count: 0,
            cloud_uploads_limit: 1,
            local_downloads_limit: 1,
          })
          .select()
          .single();

        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create user limits' },
            { status: 500 }
          );
        }

        return NextResponse.json(newLimits);
      }

      return NextResponse.json(
        { error: 'Failed to fetch user limits' },
        { status: 500 }
      );
    }

    return NextResponse.json(limits);
  } catch (error) {
    console.error('Error fetching user limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (!action || !['increment-cloud-upload', 'increment-local-download'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get current limits
    const { data: limits, error: fetchError } = await supabase
      .from('user_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch user limits' },
        { status: 500 }
      );
    }

    // Check if user has paid
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('has_paid')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    // If user has paid, no limits apply
    if (user?.has_paid) {
      if (action === 'increment-cloud-upload') {
        const { data: updated } = await supabase
          .from('user_limits')
          .update({ cloud_uploads_count: limits.cloud_uploads_count + 1 })
          .eq('user_id', userId)
          .select()
          .single();
        return NextResponse.json(updated);
      } else {
        const { data: updated } = await supabase
          .from('user_limits')
          .update({ local_downloads_count: limits.local_downloads_count + 1 })
          .eq('user_id', userId)
          .select()
          .single();
        return NextResponse.json(updated);
      }
    }

    // Check limits for free users
    if (action === 'increment-cloud-upload') {
      if (limits.cloud_uploads_count >= limits.cloud_uploads_limit) {
        return NextResponse.json(
          { error: 'Cloud upload limit reached', limitReached: true },
          { status: 403 }
        );
      }
      const { data: updated } = await supabase
        .from('user_limits')
        .update({ cloud_uploads_count: limits.cloud_uploads_count + 1 })
        .eq('user_id', userId)
        .select()
        .single();
      return NextResponse.json(updated);
    } else {
      if (limits.local_downloads_count >= limits.local_downloads_limit) {
        return NextResponse.json(
          { error: 'Local download limit reached', limitReached: true },
          { status: 403 }
        );
      }
      const { data: updated } = await supabase
        .from('user_limits')
        .update({ local_downloads_count: limits.local_downloads_count + 1 })
        .eq('user_id', userId)
        .select()
        .single();
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error('Error updating user limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

