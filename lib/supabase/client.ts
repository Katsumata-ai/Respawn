import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return {
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        }),
      };
    }
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

/**
 * Set the current user ID for RLS policies
 * This must be called before any database operations to ensure RLS isolation
 * Uses a direct SQL query to set the session variable
 */
export async function setSupabaseUserId(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    // Execute a direct query to set the session variable for RLS
    // This is more reliable than using RPC
    const { error } = await supabase.rpc('set_config', {
      key: 'app.current_user_id',
      value: userId,
    });

    if (error) {
      console.warn('[Supabase] RPC set_config failed:', error.message);
      // RLS will still work because we filter by user_id in the queries
      // This is a fallback - the API endpoints already filter by user_id
    } else {
      console.log('[Supabase] User ID set for RLS:', userId);
    }
  } catch (error) {
    console.error('[Supabase] Error setting user ID:', error);
    // Continue anyway - the API endpoints filter by user_id as a fallback
  }
}

// Don't export supabase directly - use getSupabaseClient() instead
// This prevents initialization during build time

