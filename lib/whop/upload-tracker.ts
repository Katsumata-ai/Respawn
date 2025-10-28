/**
 * Upload Tracker - Track user uploads without Supabase
 * Uses in-memory storage with persistence to a simple JSON file
 * In production, you could use Redis or a lightweight DB
 */

import fs from 'fs';
import path from 'path';

interface UserUploadData {
  userId: string;
  uploadCount: number;
  lastUploadDate: string;
}

// In-memory cache
let uploadCache: Map<string, UserUploadData> = new Map();
let cacheLoaded = false;

const CACHE_FILE = path.join(process.cwd(), '.upload-cache.json');

/**
 * Load upload cache from file
 */
function loadCache() {
  if (cacheLoaded) return;
  
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      uploadCache = new Map(parsed);
      console.log('[UploadTracker] Cache loaded:', uploadCache.size, 'users');
    }
  } catch (error) {
    console.error('[UploadTracker] Failed to load cache:', error);
  }
  
  cacheLoaded = true;
}

/**
 * Save upload cache to file
 */
function saveCache() {
  try {
    const data = Array.from(uploadCache.entries());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[UploadTracker] Failed to save cache:', error);
  }
}

/**
 * Get user's upload count
 */
export function getUserUploadCount(userId: string): number {
  loadCache();
  const data = uploadCache.get(userId);
  return data?.uploadCount || 0;
}

/**
 * Increment user's upload count
 */
export function incrementUserUploadCount(userId: string): number {
  loadCache();
  
  const current = uploadCache.get(userId) || {
    userId,
    uploadCount: 0,
    lastUploadDate: new Date().toISOString(),
  };
  
  current.uploadCount += 1;
  current.lastUploadDate = new Date().toISOString();
  
  uploadCache.set(userId, current);
  saveCache();
  
  console.log(`[UploadTracker] User ${userId} upload count: ${current.uploadCount}`);
  return current.uploadCount;
}

/**
 * Reset user's upload count (for testing or admin purposes)
 */
export function resetUserUploadCount(userId: string): void {
  loadCache();
  uploadCache.delete(userId);
  saveCache();
  console.log(`[UploadTracker] Reset upload count for user ${userId}`);
}

/**
 * Get all upload data (for debugging)
 */
export function getAllUploadData(): UserUploadData[] {
  loadCache();
  return Array.from(uploadCache.values());
}

