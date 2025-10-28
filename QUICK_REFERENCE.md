# 🚀 QUICK REFERENCE - Whop App Architecture

## At a Glance

| Aspect | Details |
|--------|---------|
| **App Type** | Whop App (embedded in Whop communities) |
| **Primary Purpose** | Download/manage course videos from Mux URLs |
| **Monetization** | €10 one-time per user |
| **Tech** | Next.js 16 + React 19 + TypeScript + Supabase + Vercel |
| **Status** | MVP (infrastructure ready, payment webhook pending) |

---

## User Journey (30 seconds)

```
Creator installs app in community
    ↓
Member sees app, clicks it
    ↓
Member pays €10 via Whop
    ↓
Webhook: app marks user as paid
    ↓
Member uploads video + Mux URL
    ↓
App stores in Supabase, generates shareable link
    ↓
Member shares link with others
```

---

## Key Whop Concepts

### 1. JWT Token Authentication
- **When:** Every request to your app
- **Contains:** userId, appId, iat, exp
- **Header:** `x-whop-user-token`
- **Purpose:** Identifies user without login

### 2. Payment via Webhook
- **Event:** `payment.completed`
- **Payload:** userId, amount, currency, timestamp
- **Your job:** Mark user as paid in database
- **Status:** Handler exists but not implemented ⚠️

### 3. Multi-Tenant Context
- Same app runs in multiple communities
- Each community has separate members
- User A in Community X ≠ User A in Community Y
- Database needs community awareness (TODO)

---

## File Organization

```
Frontend:              Backend:               Database:
app/page.tsx  ----→   app/api/videos     ----→ Supabase
   ↓                  app/api/whop
VideoExtractor        app/api/webhooks
   ↓
VideoViewModel ----→ lib/whop/
   ↓              lib/supabase/
```

---

## Critical Files

| File | Purpose | Status |
|------|---------|--------|
| `app/page.tsx` | Access check + main layout | ✅ Done |
| `app/views/VideoExtractor.tsx` | Upload form | ✅ Done |
| `app/viewmodels/VideoViewModel.ts` | Business logic | ✅ Done |
| `app/api/videos/route.ts` | Create/list videos | ✅ Done |
| `app/api/whop/validate-access/route.ts` | Payment check | ✅ Done |
| `app/api/webhooks/whop/route.ts` | Payment webhook | ❌ Empty |
| `lib/whop/server.ts` | Token verification | ⚠️ Partial |
| `lib/supabase/service.ts` | DB operations | ✅ Done |

---

## What Works Now

✅ User authentication via Whop JWT  
✅ Access validation (checks if paid)  
✅ Video upload form with Mux URL extraction  
✅ Database CRUD for videos  
✅ Shareable link generation  
✅ Home page with responsive design  

---

## What's Missing

❌ Webhook handler (payment webhook not processed)  
❌ Video player (API exists, UI doesn't)  
❌ Analytics tracking (schema exists, not implemented)  
❌ Video processing (download, S3 storage)  
❌ JWT signature verification (currently decoded only)  

---

## API Endpoints

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/videos` | Create video | ✅ |
| GET | `/api/videos?userId=...` | List user's videos | ✅ |
| GET | `/api/videos/[shareableId]` | Get video by share link | ✅ API only |
| GET | `/api/whop/user` | Get current user | ✅ |
| GET | `/api/whop/validate-access` | Check if paid | ✅ |
| POST | `/api/webhooks/whop` | Payment notification | ❌ Empty |

---

## Database Tables

### videos
```
id, user_id, shareable_id, title, mux_url, 
view_count, download_count, created_at, updated_at
```

### video_accesses
```
id, video_id, user_id, access_type, accessed_at, ip_address
```

### users (needs to be created)
```
id, whop_user_id, email, username, has_paid, payment_date
```

---

## Environment Variables Needed

```
# Whop
NEXT_PUBLIC_WHOP_APP_ID=app_FgzHqoGCTn-h4zFJdorsIII
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_6FrzZNye05fbc
WHOP_APP_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
REDIS_URL=...
```

---

## Next Steps (Priority Order)

1. **Implement webhook handler** ← START HERE
   - File: `app/api/webhooks/whop/route.ts`
   - Task: Parse, verify, update database

2. **Create users table**
   - Add: `whop_user_id, has_paid, payment_date` columns
   - Run migration in Supabase

3. **Verify JWT signatures**
   - File: `lib/whop/server.ts`
   - Task: Add signature verification

4. **Create video player**
   - File: `app/components/VideoPlayer.tsx`
   - Library: HLS.js or Video.js
   - Route: `/videos/[shareableId]` page

5. **Implement analytics tracking**
   - File: `app/api/videos/[shareableId]/route.ts`
   - Task: Increment view_count, add access record

---

## Deployment Checklist

- [ ] All env vars set in Vercel dashboard
- [ ] Database migrations run
- [ ] Webhook URL configured in Whop dashboard
- [ ] Payment model set to €10 one-time
- [ ] `npm run build` passes
- [ ] `npm run type-check` passes
- [ ] Local testing of payment flow (with mock webhook)
- [ ] Vercel domain created (e.g., app.vercel.app)
- [ ] Whop dashboard base URL updated

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Access Required" page always shows | Webhook not implemented | Implement webhook handler |
| Video not playable | No video player component | Create player component |
| TypeScript errors | Missing types | Add proper interfaces |
| Env vars not working | Not set in Vercel | Set in dashboard, redeploy |
| CORS errors | Missing headers | Add CORS config to API routes |

---

## Testing Locally

```bash
# Start dev server
npm run dev

# Visit
http://localhost:3000

# Test with mock token (for development)
# Set x-whop-user-token header in requests

# Type checking
npm run type-check

# Build test
npm run build
```

---

## Key Components Explained

### VideoViewModel
```typescript
// Singleton pattern - only one instance
const vm = videoViewModel;
await vm.uploadVideo(userId, request);
```

### WhopClient (Browser)
```typescript
// Safe to use - calls /api/whop/* routes
const user = await whopClient.getCurrentUser();
const access = await whopClient.validateAccess();
```

### SupabaseService (Server)
```typescript
// Direct database access
const video = await SupabaseService.createVideo({...});
const videos = await SupabaseService.getUserVideos(userId);
```

---

## Scaling Considerations

- **Multi-community context:** Need to track which community each video belongs to
- **Video storage:** Mux URLs may expire - need to download & store in S3
- **Background jobs:** Use Bull queue for video processing
- **Real-time analytics:** Use Supabase real-time subscriptions
- **CDN:** Serve videos from Vercel Edge for speed

---

## Security Checklist

- [ ] JWT signature verification implemented
- [ ] Webhook signature verification implemented
- [ ] No secrets in client-side code
- [ ] Rate limiting on API routes
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] No SQL injection possible (using Supabase SDK)
- [ ] HTTPS enforced (Vercel handles)
- [ ] Error messages don't leak info

---

## Useful Links

- Whop Docs: https://docs.whop.com/apps/introduction
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
- HLS.js: https://github.com/video-dev/hls.js/

---

## Contact & Support

For questions about this implementation:
1. Check PROJECT_DEEP_ANALYSIS.md (detailed guide)
2. Check existing documentation files
3. Review Whop official docs
4. Check Next.js community forums

