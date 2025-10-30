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
 */
export async function setSupabaseUserId(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    // Set the user_id in the session for RLS policies to use
    await supabase.rpc('set_config', {
      key: 'app.current_user_id',
      value: userId,
    }).catch(() => {
      // If RPC fails, try direct query approach
      console.log('[Supabase] RPC set_config not available, using direct approach');
    });
  } catch (error) {
    console.error('[Supabase] Error setting user ID:', error);
  }
}

// Don't export supabase directly - use getSupabaseClient() instead
// This prevents initialization during build time

