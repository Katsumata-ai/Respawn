import { getSupabaseClient } from './client';

export interface Video {
  id: string;
  userId: string;
  shareableId: string;
  title: string;
  s3Url?: string;
  muxUrl?: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoAccess {
  id: string;
  videoId: string;
  userId: string;
  accessType: 'view' | 'download';
  accessedAt: string;
  ipAddress?: string;
}

export class SupabaseService {
  // Videos
  static async createVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('videos')
      .insert([video])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getVideo(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getVideoByShareableId(shareableId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('shareableId', shareableId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserVideos(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateVideo(id: string, updates: Partial<Video>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteVideo(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Video Access Tracking
  static async trackAccess(access: Omit<VideoAccess, 'id'>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('video_accesses')
      .insert([access])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getVideoStats(videoId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('video_accesses')
      .select('access_type')
      .eq('video_id', videoId);

    if (error) throw error;

    // Count by access type
    const stats = {
      views: data?.filter((d: any) => d.access_type === 'view').length || 0,
      downloads: data?.filter((d: any) => d.access_type === 'download').length || 0,
    };

    return stats;
  }
}

