import { getSupabaseClient } from '@/lib/supabase/client';

export interface UserLimits {
  id: string;
  user_id: string;
  cloud_uploads_count: number;
  local_downloads_count: number;
  cloud_uploads_limit: number;
  local_downloads_limit: number;
}

export class UserLimitsService {
  /**
   * Get user limits
   */
  static async getUserLimits(userId: string): Promise<UserLimits | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No limits exist, create default ones
          return this.createDefaultLimits(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user limits:', error);
      return null;
    }
  }

  /**
   * Create default limits for a new user
   */
  static async createDefaultLimits(userId: string): Promise<UserLimits | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_limits')
        .insert({
          user_id: userId,
          cloud_uploads_count: 0,
          local_downloads_count: 0,
          cloud_uploads_limit: 3, // Free users get 3 uploads
          local_downloads_limit: 3, // Free users get 3 downloads
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default limits:', error);
      return null;
    }
  }

  /**
   * Check if user can upload to cloud
   */
  static async canUploadToCloud(userId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();

      // Check if user has paid
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('has_paid')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // If user has paid, no limits
      if (user?.has_paid) return true;

      // Check limits for free users
      const limits = await this.getUserLimits(userId);
      if (!limits) return false;

      return limits.cloud_uploads_count < limits.cloud_uploads_limit;
    } catch (error) {
      console.error('Error checking cloud upload limit:', error);
      return false;
    }
  }

  /**
   * Check if user can download locally
   */
  static async canDownloadLocally(userId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();

      // Check if user has paid
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('has_paid')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // If user has paid, no limits
      if (user?.has_paid) return true;

      // Check limits for free users
      const limits = await this.getUserLimits(userId);
      if (!limits) return false;

      return limits.local_downloads_count < limits.local_downloads_limit;
    } catch (error) {
      console.error('Error checking local download limit:', error);
      return false;
    }
  }

  /**
   * Increment cloud upload count
   */
  static async incrementCloudUpload(userId: string): Promise<UserLimits | null> {
    try {
      const supabase = getSupabaseClient();
      const limits = await this.getUserLimits(userId);

      if (!limits) return null;

      const { data, error } = await supabase
        .from('user_limits')
        .update({ cloud_uploads_count: limits.cloud_uploads_count + 1 })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error incrementing cloud upload:', error);
      return null;
    }
  }

  /**
   * Increment local download count
   */
  static async incrementLocalDownload(userId: string): Promise<UserLimits | null> {
    try {
      const supabase = getSupabaseClient();
      const limits = await this.getUserLimits(userId);

      if (!limits) return null;

      const { data, error } = await supabase
        .from('user_limits')
        .update({ local_downloads_count: limits.local_downloads_count + 1 })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error incrementing local download:', error);
      return null;
    }
  }

  /**
   * Reset limits for a user (admin only)
   */
  static async resetLimits(userId: string): Promise<UserLimits | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_limits')
        .update({
          cloud_uploads_count: 0,
          local_downloads_count: 0,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resetting limits:', error);
      return null;
    }
  }

  /**
   * Set unlimited access for a user (after payment)
   */
  static async setUnlimitedAccess(userId: string): Promise<UserLimits | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_limits')
        .update({
          cloud_uploads_limit: 999999,
          local_downloads_limit: 999999,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting unlimited access:', error);
      return null;
    }
  }
}

