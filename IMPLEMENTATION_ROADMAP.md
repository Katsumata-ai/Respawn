# 🗺️ IMPLEMENTATION ROADMAP

## Overview

This document provides a **step-by-step action plan** to complete the Whop app from MVP to production-ready.

---

## Phase 1: Payment System Integration (Critical)
**Timeline:** 1-2 weeks  
**Priority:** 🔴 CRITICAL - Nothing works without this

### 1.1 Implement Webhook Handler
**File:** `app/api/webhooks/whop/route.ts`  
**Current Status:** File exists but empty

```typescript
// Current (broken)
export async function POST(request: NextRequest) {
  // TODO
}

// What it should do:
1. Parse request body
2. Verify webhook signature (Whop-Signature header)
3. Check event type (payment.completed)
4. Extract userId and amount
5. Update database: users.has_paid = true
6. Return success response
```

**Implementation Steps:**
```bash
1. Read Whop webhook documentation
2. Get webhook secret from Whop dashboard
3. Implement signature verification using crypto
4. Create users table migration (if not exists)
5. Parse payment events
6. Call: await markUserAsPaid(userId)
7. Add error handling and logging
8. Test with ngrok (local testing)
```

**Files to Create/Modify:**
- `app/api/webhooks/whop/route.ts` (implement)
- `lib/whop/server.ts` (use existing markUserAsPaid)
- Database migration (create users table)

**Testing:**
```bash
# Local testing with ngrok
npx ngrok http 3000
# Set webhook URL in Whop dashboard to: https://your-ngrok-url/api/webhooks/whop

# Trigger test payment
# Wait for webhook → check database → verify has_paid updated
```

### 1.2 Create Users Table Migration
**File:** `supabase/migrations/002_create_users_table.sql`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id VARCHAR UNIQUE NOT NULL,
  email VARCHAR,
  username VARCHAR,
  avatar VARCHAR,
  has_paid BOOLEAN DEFAULT false,
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_whop_user_id ON users(whop_user_id);
```

### 1.3 Verify JWT Signatures
**File:** `lib/whop/server.ts`  
**Current Issue:** JWT decoded but not verified

```typescript
// Current (unsafe)
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

// Should be (secure)
import jwt from 'jsonwebtoken';
const payload = jwt.verify(token, process.env.WHOP_APP_SECRET);
```

**Steps:**
1. Install: `npm install jsonwebtoken @types/jsonwebtoken`
2. Update `verifyWhopToken()` to use jwt.verify
3. Get app secret from Whop dashboard
4. Set WHOP_APP_SECRET in .env.local

---

## Phase 2: Video Player Implementation
**Timeline:** 1-2 weeks  
**Priority:** 🟠 HIGH - Users can't actually play videos without this

### 2.1 Create Video Player Component
**File:** `app/components/VideoPlayer.tsx`

```typescript
'use client';
import { useEffect, useRef } from 'react';
import HLS from 'hls.js';

export default function VideoPlayer({ muxUrl }: { muxUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !muxUrl) return;

    if (HLS.isSupported()) {
      const hls = new HLS();
      hls.loadSource(muxUrl);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = muxUrl;
    }
  }, [muxUrl]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', maxWidth: '100%' }}
    />
  );
}
```

**Steps:**
1. Install HLS library: `npm install hls.js`
2. Create VideoPlayer component
3. Create video view page: `app/videos/[shareableId]/page.tsx`
4. Fetch video metadata from API
5. Display player with video title and description

### 2.2 Create Video Share Page
**File:** `app/videos/[shareableId]/page.tsx`

```typescript
'use client';
import { useEffect, useState } from 'react';
import VideoPlayer from '@/app/components/VideoPlayer';

export default function VideoPage({ 
  params 
}: { 
  params: { shareableId: string } 
}) {
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${params.shareableId}`);
        const data = await res.json();
        setVideo(data);
        
        // Track view access
        await fetch('/api/videos/track-access', {
          method: 'POST',
          body: JSON.stringify({
            videoId: data.id,
            accessType: 'view'
          })
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [params.shareableId]);

  if (loading) return <div>Loading...</div>;
  if (!video) return <div>Video not found</div>;

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <VideoPlayer muxUrl={video.muxUrl} />
        <div className="bg-white rounded-lg p-6 mt-4">
          <h1 className="text-3xl font-bold">{video.title}</h1>
          <p className="text-gray-600 mt-2">
            Views: {video.viewCount} | Downloads: {video.downloadCount}
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Download Video
          </button>
        </div>
      </div>
    </main>
  );
}
```

### 2.3 Implement Analytics Tracking
**File:** `app/api/track-access/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const { videoId, accessType } = await request.json();

    if (!videoId || !accessType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Track access
    await SupabaseService.trackAccess({
      videoId,
      userId: 'anonymous', // TODO: Get from Whop token
      accessType,
      ipAddress: request.ip || 'unknown',
    });

    // Update video counts
    const video = await SupabaseService.getVideo(videoId);
    const newCount = accessType === 'view' 
      ? video.viewCount + 1 
      : video.downloadCount + 1;

    await SupabaseService.updateVideo(videoId, {
      [accessType + 'Count']: newCount
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking access:', error);
    return NextResponse.json(
      { error: 'Failed to track access' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Video Processing Pipeline
**Timeline:** 2-3 weeks  
**Priority:** 🟡 MEDIUM - Required for long-term sustainability

### 3.1 Setup Bull Queue
**File:** `lib/queue/index.ts`

```bash
npm install bull redis
```

```typescript
import Queue from 'bull';

const videoQueue = new Queue('video-processing', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

videoQueue.process(async (job) => {
  const { videoId, muxUrl } = job.data;
  
  console.log(`Processing video ${videoId}`);
  job.progress(10);

  // 1. Download from Mux
  job.progress(30);
  const videoPath = await downloadFromMux(muxUrl);

  // 2. Upload to S3
  job.progress(60);
  const s3Url = await uploadToS3(videoPath);

  // 3. Update database
  job.progress(90);
  await SupabaseService.updateVideo(videoId, { s3Url });

  job.progress(100);
  return { success: true, s3Url };
});

export default videoQueue;
```

### 3.2 Integrate S3 Storage
**File:** `lib/storage/s3.ts`

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function uploadToS3(filePath: string, key: string) {
  const fileContent = require('fs').readFileSync(filePath);
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: fileContent,
    ContentType: 'video/mp4',
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Location);
    });
  });
}
```

### 3.3 Implement yt-dlp Integration
**File:** `lib/video/downloader.ts`

```bash
# Install yt-dlp (system dependency)
brew install yt-dlp  # macOS
apt-get install yt-dlp  # Linux
```

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function downloadFromMux(muxUrl: string, outputPath: string) {
  const command = `yt-dlp -f best -o "${outputPath}" "${muxUrl}"`;
  
  try {
    await execAsync(command);
    return outputPath;
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download video');
  }
}
```

---

## Phase 4: Advanced Features
**Timeline:** 2-3 weeks  
**Priority:** 🟢 LOW - Nice to have

### 4.1 User Profiles
- **File:** `app/components/UserProfile.tsx`
- **Features:** View own videos, manage uploads, statistics

### 4.2 Video Collections
- **File:** Add collections table to database
- **Features:** Organize videos into playlists

### 4.3 Comments & Ratings
- **Files:** Database table + API routes + UI components
- **Features:** Community engagement

### 4.4 Search & Filtering
- **File:** `app/components/VideoSearch.tsx`
- **Features:** Full-text search, sort by date/popularity

### 4.5 Admin Dashboard
- **File:** `app/admin/dashboard/page.tsx`
- **Features:** Creator analytics, earnings, user management

---

## Phase 5: Production Hardening
**Timeline:** 1-2 weeks  
**Priority:** 🔴 CRITICAL before launch

### 5.1 Error Tracking
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 5.2 Logging
```typescript
// lib/logger.ts
export function log(level: string, message: string, data?: any) {
  console.log(`[${level}] ${message}`, data);
  
  // TODO: Send to logging service
}
```

### 5.3 Rate Limiting
```bash
npm install next-rate-limit
```

### 5.4 Input Validation
```bash
npm install zod
```

```typescript
import { z } from 'zod';

const VideoUploadSchema = z.object({
  title: z.string().min(3).max(255),
  muxUrl: z.string().url(),
  description: z.string().optional(),
});

export function validateVideoUpload(data: any) {
  return VideoUploadSchema.parse(data);
}
```

### 5.5 Performance Optimization
- [ ] Image optimization (next/image)
- [ ] Code splitting
- [ ] Database query optimization
- [ ] Caching strategies
- [ ] CDN configuration

### 5.6 Security Audit
- [ ] Penetration testing
- [ ] Dependency vulnerability check: `npm audit`
- [ ] Secret scanning
- [ ] CORS review
- [ ] CSP headers

---

## Phase 6: Launch & Marketing
**Timeline:** 1 week  
**Priority:** 🟡 MEDIUM

### 6.1 Pre-Launch Checklist
- [ ] All features working
- [ ] Tests passing (npm run test)
- [ ] Performance acceptable (Lighthouse > 80)
- [ ] Security audit completed
- [ ] Documentation finalized
- [ ] Support email setup
- [ ] Discord community (optional)

### 6.2 Marketplace Submission
1. Create app icon (512x512px)
2. Write marketing copy
3. Create screenshots
4. Record demo video
5. Submit to Whop App Store
6. Wait for approval (1-2 weeks)

### 6.3 Marketing Launch
- Social media posts
- Newsletter announcement
- Product Hunt (optional)
- Reddit communities
- Whop community outreach

---

## Quick Wins (Do First)

These provide immediate value with minimal effort:

1. **Implement webhook handler** (1 day)
   - File: `app/api/webhooks/whop/route.ts`
   - Impact: Payment system works

2. **Create users table** (1 day)
   - Run migration in Supabase
   - Impact: Payment status tracking works

3. **Add JWT verification** (1 day)
   - File: `lib/whop/server.ts`
   - Impact: Security improved

4. **Create video player** (1-2 days)
   - File: `app/components/VideoPlayer.tsx`
   - Impact: Users can actually watch videos

5. **Setup error tracking** (1 day)
   - Install Sentry
   - Impact: Know when things break

---

## Dependency Tree

```
Phase 1 (Webhooks)
├─ Phase 2 (Player) ← Can't fully work without Phase 1
│  └─ Phase 3 (Processing) ← Needs video storage first
│     └─ Phase 4 (Advanced)
└─ Phase 5 (Hardening) ← Can happen in parallel with 2-4
   └─ Phase 6 (Launch)
```

---

## Testing Strategy

### Unit Tests
```typescript
// app/__tests__/VideoViewModel.test.ts
describe('VideoViewModel', () => {
  it('should validate Mux URLs', () => {
    expect(vm.isValidMuxUrl('https://stream.mux.com/...m3u8')).toBe(true);
    expect(vm.isValidMuxUrl('invalid')).toBe(false);
  });
});
```

### Integration Tests
```typescript
// tests/api.test.ts
describe('POST /api/videos', () => {
  it('should create a video', async () => {
    const res = await fetch('/api/videos', {
      method: 'POST',
      body: JSON.stringify(videoData)
    });
    expect(res.status).toBe(201);
  });
});
```

### E2E Tests
```typescript
// tests/e2e.test.ts
import { test } from '@playwright/test';

test('user can upload video', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('input[name="title"]', 'Test Video');
  await page.fill('textarea[name="muxUrl"]', 'https://...');
  await page.click('button:has-text("Upload")');
  await expect(page).toContainText('Upload successful');
});
```

---

## Monitoring Checklist

Once deployed, monitor:

- [ ] Error rates (Sentry)
- [ ] API response times
- [ ] Database query performance
- [ ] Storage usage (S3)
- [ ] Bandwidth usage
- [ ] User signups
- [ ] Payment success rate
- [ ] Feature usage
- [ ] Support tickets

---

## Success Metrics

Define what "success" looks like:

| Metric | Target | Reason |
|--------|--------|--------|
| Uptime | 99.9% | Reliability |
| API latency | < 500ms | User experience |
| Payment success rate | > 99% | Revenue |
| Page load time | < 3s | Adoption |
| Error rate | < 0.1% | Stability |
| User retention (30d) | > 80% | Product-market fit |

---

## Timeline Summary

```
Week 1-2:   Payment system + users table
Week 3-4:   Video player + analytics
Week 5-7:   Video processing pipeline
Week 8-9:   Advanced features
Week 10-11: Production hardening + testing
Week 12:    Launch preparation
Week 13+:   Live in marketplace!
```

**Estimated total:** 12-13 weeks to full launch

---

## Questions to Answer Before Each Phase

Before starting a new phase, answer:

1. **Is the previous phase complete?**
2. **Do we have all required dependencies?**
3. **Are there any blockers?**
4. **Do we have test coverage?**
5. **Is the code documented?**
6. **Does it scale?**
7. **Is it secure?**

---

## Getting Help

When stuck:
1. Check existing docs (PROJECT_DEEP_ANALYSIS.md)
2. Review Whop official docs
3. Check Next.js community
4. Look at GitHub issues/discussions
5. Ask in Whop developer community

