# 🏗️ ARCHITECTURE DIAGRAMS & VISUAL GUIDES

Visual representation of the Whop App architecture, data flows, and key concepts.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHOP ECOSYSTEM                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Whop Community Dashboard                         │  │
│  │  - User authentication (JWT)                            │  │
│  │  - Payment processing                                   │  │
│  │  - Community management                                 │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                  Injects JWT token                              │
│                  (x-whop-user-token)                            │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Your Next.js App     │
            │  (Vercel Deployment)  │
            └───────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌────────┐ ┌──────────┐ ┌─────────────┐
    │Frontend│ │ API Routes│ │  Services   │
    │ React  │ │ /api/*   │ │             │
    └────────┘ └──────────┘ └─────────────┘
        │          │
        └──────────┼──────────┐
                   │          │
                   ▼          ▼
            ┌────────────┐ ┌──────────────┐
            │ Supabase   │ │ Whop Webhooks│
            │ PostgreSQL │ │ (Payments)   │
            └────────────┘ └──────────────┘
```

---

## 2. Complete Request-Response Flow

```
USER VISITS APP:
┌─────────────────────────────────────┐
│ Browser opens app (iframe)          │
│ Whop injects JWT in headers         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Next.js: GET / (page.tsx)           │
│ - Extract JWT from headers          │
│ - Call /api/whop/validate-access    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ API: GET /api/whop/validate-access  │
│ - Decode JWT token                  │
│ - Query: has_paid from users table  │
│ - Return: { hasAccess: true/false } │
└────────────┬────────────────────────┘
             │
             ├─→ if hasAccess → Show app ✅
             └─→ if !hasAccess → Show payment page ❌

USER UPLOADS VIDEO:
┌─────────────────────────────────────┐
│ User fills form in VideoExtractor   │
│ - Title: "Python Basics"            │
│ - Mux URL: "https://stream.mux..."  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Form submit → POST /api/videos      │
│ {                                   │
│   userId, title, muxUrl             │
│ }                                   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ API: POST /api/videos               │
│ - Validate Mux URL format           │
│ - Generate shareableId (UUID)       │
│ - Insert into videos table          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Return: { id, shareableId, ... }    │
│ Response status: 201 Created        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Frontend shows:                     │
│ "Video uploaded successfully!"      │
│ Shareable link: /video/[uuid]       │
└─────────────────────────────────────┘

USER SHARES VIDEO:
┌─────────────────────────────────────┐
│ Other person opens shareable link   │
│ /video/abc123def456                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Next.js dynamic page                │
│ params.shareableId = "abc123def456" │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ API: GET /api/videos/abc123def456   │
│ - Query videos table by shareableId │
│ - Track access in video_accesses    │
│ - Return video metadata + muxUrl    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Frontend renders:                   │
│ - Video player (HLS player)         │
│ - Video title                       │
│ - View/download counts              │
└─────────────────────────────────────┘
```

---

## 3. Payment & Access Control Flow

```
PAYMENT JOURNEY:

1. DISCOVERY & INSTALLATION
   ┌──────────────────────────┐
   │ Creator finds app in     │
   │ Whop App Store           │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ Clicks "Install" in      │
   │ their community          │
   └────────┬─────────────────┘

2. PURCHASE
   ┌──────────────────────────┐
   │ Community member sees    │
   │ app icon                 │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ Clicks to use app        │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ Whop shows payment modal │
   │ "€10 one-time"           │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ User enters payment info │
   └────────┬─────────────────┘
            │
            ▼
   ┌──────────────────────────┐
   │ Whop processes payment   │
   │ (handles all PCI, etc.)  │
   └────────┬─────────────────┘

3. WEBHOOK NOTIFICATION (YOUR APP)
   ┌──────────────────────────────────┐
   │ POST /api/webhooks/whop          │
   │ {                                │
   │   event: "payment.completed",    │
   │   userId: "user_abc123",         │
   │   amount: 10,                    │
   │   currency: "EUR",               │
   │   timestamp: 1629907200          │
   │ }                                │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Verify webhook signature ✅      │
   │ (currently not implemented)      │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Query users table:               │
   │ WHERE whop_user_id = user_abc123 │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ UPDATE users SET:                │
   │ has_paid = true                  │
   │ payment_date = NOW()             │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ Return: { success: true }        │
   └────────┬─────────────────────────┘

4. NEXT LOGIN
   ┌──────────────────────────────────┐
   │ User visits app next time        │
   └────────┬─────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────┐
   │ GET /api/whop/validate-access    │
   │ - Get userId from JWT            │
   │ - Query: SELECT has_paid         │
   │   FROM users                     │
   │   WHERE whop_user_id = userId    │
   └────────┬─────────────────────────┘
            │
            ├─→ has_paid = true  → ALLOW ACCESS ✅
            └─→ has_paid = false → DENY ACCESS ❌
```

---

## 4. Database Schema Relationships

```
┌──────────────────────────┐
│        users             │
├──────────────────────────┤
│ id                (PK)   │
│ whop_user_id (UNIQUE) ◄──┼───┐ From JWT token
│ email                    │   │
│ username                 │   │
│ avatar                   │   │
│ has_paid            ⭐   │   │ Payment status
│ payment_date             │   │ When they paid
│ created_at               │   │
│ updated_at               │   │
└──────────────────────────┘   │
         ▲                      │
         │ (1 to Many)         │
         │                     │
         │                     │
┌────────┴──────────────────────┐
│        videos                  │
├───────────────────────────────┤
│ id                  (PK)       │
│ user_id             (FK) ─────→ user.id
│ shareable_id        (UNIQUE)  │
│ title                          │
│ description                    │
│ mux_url                        │
│ s3_url                         │
│ view_count                     │
│ download_count                 │
│ created_at                     │
│ updated_at                     │
└────────┬──────────────────────┘
         │ (1 to Many)
         │
         ▼
┌──────────────────────────────┐
│    video_accesses            │
├──────────────────────────────┤
│ id                (PK)       │
│ video_id          (FK) ────► videos.id
│ user_id           (optional) │
│ access_type       ('view' or │ 'download')
│ accessed_at                  │
│ ip_address                   │
└──────────────────────────────┘
```

---

## 5. Component Hierarchy

```
└── app/page.tsx (Root)
    ├── State: user, loading, hasAccess
    │
    ├─ if (loading)
    │  └─ <LoadingSpinner />
    │
    ├─ if (!hasAccess)
    │  └─ <AccessDeniedScreen />
    │
    └─ if (user && hasAccess)
       │
       ├─ <Header>
       │  └─ Welcome message with user.username
       │
       └─ <main>
          ├─ <VideoExtractor />  [2/3 width]
          │  ├─ Form inputs
          │  │  ├─ <input> title
          │  │  └─ <textarea> muxUrl
          │  │
          │  ├─ Buttons
          │  │  ├─ "Extract Mux URL" → Opens popup
          │  │  └─ "Upload Video" → POST /api/videos
          │  │
          │  └─ Feedback
          │     ├─ Error message
          │     ├─ Loading state
          │     └─ Success message
          │
          └─ <HowItWorks />  [1/3 width]
             └─ 4-step guide
```

---

## 6. State Flow (MVVM)

```
┌──────────────────────────────┐
│    User Interaction          │
│ (Type title, click upload)   │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   View (React Component)     │
│                              │
│ const [title, setTitle] ...  │
│ const [loading, setLoading]  │
│ const [error, setError]      │
│ const [success, setSuccess]  │
│                              │
│ handleSubmit() calls         │
│ videoViewModel.uploadVideo() │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  ViewModel (Business Logic)  │
│                              │
│ VideoViewModel {             │
│   uploadVideo() {            │
│     - Validate              │
│     - Call API              │
│     - Update state          │
│     - Return result         │
│   }                          │
│ }                            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   Model (API Call)           │
│                              │
│ POST /api/videos             │
│ {userId, title, muxUrl}      │
│                              │
│ Returns: {                   │
│   id, shareableId, title,    │
│   createdAt, ...             │
│ }                            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  Backend (API Route)         │
│                              │
│ - Validate input            │
│ - Generate UUID             │
│ - Insert to Supabase        │
│ - Return response           │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  Database (Supabase)        │
│                              │
│ INSERT INTO videos (...)    │
│ VALUES (...)                │
│ RETURNING *                 │
└────────────┬─────────────────┘
             │
             ▼
     [Response flows back ↑]
```

---

## 7. File Structure Tree

```
app/
├── page.tsx                           Main entry
│   ├─ useEffect: Initialize app
│   ├─ whopClient.validateAccess()
│   ├─ whopClient.getCurrentUser()
│   └─ Render: Home page or access denied
│
├── layout.tsx                         HTML structure
│   └─ Global styling, fonts, head
│
├── globals.css                        Tailwind imports
│
├── models/
│   └── Video.ts                       Type definitions
│       ├─ Video interface
│       ├─ VideoUploadRequest
│       ├─ VideoResponse
│       └─ VideoStats
│
├── viewmodels/
│   └── VideoViewModel.ts              Singleton pattern
│       ├─ uploadVideo()
│       ├─ getUserVideos()
│       ├─ deleteVideo()
│       └─ State getters
│
├── views/
│   └── VideoExtractor.tsx             UI Component
│       ├─ Form for upload
│       ├─ Mux URL extraction
│       ├─ Error/success handling
│       └─ Post message listener
│
├── services/
│   └── api.service.ts                 (Not used)
│
├── types/
│   └── index.ts                       Type exports
│
├── utils/
│   └── constants.ts                   App config
│
└── api/
    ├── videos/
    │   ├── route.ts                   POST/GET videos
    │   │   ├─ POST: Create video
    │   │   └─ GET: List user videos
    │   └── [shareableId]/
    │       └── route.ts               GET: Public access
    │
    ├── whop/
    │   ├── user/
    │   │   └── route.ts               GET: User info
    │   ├── validate-access/
    │   │   └── route.ts               GET: Payment check
    │   └── company/
    │       └── route.ts               GET: Company info
    │
    └── webhooks/
        └── whop/
            └── route.ts               POST: Payment webhook

lib/
├── supabase/
│   ├── client.ts                      Supabase singleton
│   │   └─ getSupabaseClient()
│   └── service.ts                     Database operations
│       ├─ SupabaseService {
│       ├─   createVideo()
│       ├─   getVideo()
│       ├─   getUserVideos()
│       ├─   updateVideo()
│       ├─   deleteVideo()
│       ├─   trackAccess()
│       └─   getVideoStats()
│
└── whop/
    ├── client.ts                      Browser-side SDK
    │   └─ WhopClient {
    │       ├─ getCurrentUser()
    │       ├─ validateAccess()
    │       ├─ isAdmin()
    │       └─ getCompany()
    │
    └── server.ts                      Server-side token verification
        ├─ verifyWhopToken()
        ├─ getCurrentWhopUser()
        ├─ checkUserAccess()
        ├─ markUserAsPaid()
        └─ upsertUser()
```

---

## 8. Data Transformation Pipeline

```
RAW INPUT (form)
│
├─ title: "Python Basics"
├─ muxUrl: "https://stream.mux.com/abc/manifest.m3u8"
└─ userId: "user_123"
│
▼ (Validation)
│
└─ Mux URL format check
   ├─ Must contain "stream.mux.com"
   ├─ Must end with ".m3u8"
   └─ Must not be empty
│
▼ (Transformation)
│
├─ Generate shareableId: UUID.v4()
└─ Create timestamp: NOW()
│
▼ (API Model)
│
├─ {
│    userId: string
│    shareableId: string
│    title: string
│    muxUrl: string
│    viewCount: 0
│    downloadCount: 0
│  }
│
▼ (Database Operation)
│
├─ INSERT INTO videos (...)
│  VALUES (...)
│  RETURNING *
│
▼ (Response Model)
│
└─ {
     id: UUID
     shareableId: UUID
     title: string
     muxUrl: string
     viewCount: 0
     downloadCount: 0
     createdAt: timestamp
   }
```

---

## 9. Security Verification Flow

```
REQUEST ARRIVES:

1. Extract Token
   ┌─────────────────────────┐
   │ Get x-whop-user-token   │
   │ from request headers    │
   └────────┬────────────────┘
            │
            ▼
2. Decode JWT (Basic)
   ┌──────────────────────────────────┐
   │ Split by "."                     │
   │ Decode base64 payload            │
   │ Get: { userId, appId, iat, exp } │
   └────────┬─────────────────────────┘
            │
            ▼
3. Verify JWT (Advanced) ❌ MISSING
   ┌──────────────────────────────────┐
   │ Verify signature using            │
   │ jwt.verify(token, secret)        │
   │ Check expiration (exp < now)     │
   │ ✅ Would ensure token is valid   │
   └────────┬─────────────────────────┘
            │
            ▼
4. Check Payment Status
   ┌──────────────────────────────────┐
   │ Query users table:               │
   │ SELECT has_paid                  │
   │ WHERE whop_user_id = userId      │
   └────────┬─────────────────────────┘
            │
            ├─ has_paid = true  → ✅ ALLOW
            └─ has_paid = false → ❌ DENY
```

---

## 10. Deployment Architecture

```
Your Computer
│
├─ npm run build
│  └─ Compile Next.js
│
├─ git add .
├─ git commit
└─ git push origin main
│
▼
GitHub Repository
│
├─ Webhook triggers
└─ (linked to Vercel)
│
▼
Vercel Build System
│
├─ Install dependencies
│  ├─ npm install
│  └─ Download packages
│
├─ Run checks
│  ├─ npm run type-check (TypeScript)
│  ├─ npm run lint (Code quality)
│  └─ npm run build (Compile)
│
├─ Create bundle
│  ├─ Minimize code
│  ├─ Optimize assets
│  └─ Generate static files
│
└─ Deploy to Edge
   ├─ API routes → Serverless functions
   ├─ Pages → CDN edge locations
   └─ Static assets → Global CDN
│
▼
Production Live
│
├─ https://your-app.vercel.app
│
└─ Users access via:
   ├─ Whop community (embedded)
   ├─ Direct link
   └─ Shareable links
```

---

## 11. Error Handling Flow

```
API Request
│
├─ try {
│  │
│  ├─ Parse JSON body
│  │
│  ├─ Validate fields
│  │  └─ If invalid
│  │     ├─ return 400 (Bad Request)
│  │     └─ { error: "Invalid Mux URL" }
│  │
│  ├─ Database operation
│  │  └─ If fails
│  │     ├─ return 500 (Server Error)
│  │     └─ { error: "Failed to create video" }
│  │
│  └─ return 201 (Success)
│     └─ { id, shareableId, ... }
│
├─ } catch (error) {
│  │
│  ├─ Log error
│  ├─ console.error('Error:', error)
│  │
│  ├─ Send error response
│  ├─ return 500
│  └─ { error: "Internal server error" }
│
└─ }
```

---

## 12. Performance Considerations

```
Frontend Performance:
┌─────────────────────────────┐
│ Page Load                    │
├─────────────────────────────┤
│ 1. HTML download ~5KB       │
│ 2. Tailwind CSS ~50KB       │
│ 3. React bundle ~40KB       │
│ 4. App JS ~20KB             │
│ ─────────────────────────── │
│ Total ~115KB                │
│ Time to Interactive: <1s    │
└─────────────────────────────┘

Database Performance:
┌─────────────────────────────┐
│ Query: GET user's videos    │
├─────────────────────────────┤
│ SELECT * FROM videos        │
│ WHERE user_id = $1          │
│ ORDER BY created_at DESC    │
│ ─────────────────────────── │
│ Response time: ~50ms        │
│ (with proper indexes)       │
└─────────────────────────────┘

API Performance:
┌─────────────────────────────┐
│ POST /api/videos            │
├─────────────────────────────┤
│ 1. Validate: 5ms            │
│ 2. Generate UUID: 1ms       │
│ 3. Database write: 20ms     │
│ 4. Return response: 2ms     │
│ ─────────────────────────── │
│ Total: ~28ms                │
└─────────────────────────────┘
```

---

## 13. Scaling Considerations

```
Current Setup (MVP)
┌─────────────────────────────┐
│ Vercel (Serverless)         │
│ Supabase (Managed)          │
│ Simple routing              │
│ No caching                  │
│ Single region               │
│ ≈ 100s concurrent users OK  │
└─────────────────────────────┘

If 10,000 concurrent users needed:
┌─────────────────────────────┐
│ ✅ Vercel handles auto      │
│ ✅ Supabase scales well     │
│ ✅ Add Redis caching        │
│ ✅ Add database read replicas
│ ✅ Add CDN edge caching     │
│ ✅ Implement pagination     │
│ ✅ Optimize images          │
│ ✅ Monitor & alert          │
└─────────────────────────────┘
```

---

## 14. Request Flow Timeline

```
0ms    ├─ Request starts
       │
5ms    ├─ Connection established
       │
10ms   ├─ Headers received
       │  └─ x-whop-user-token extracted
       │
15ms   ├─ Body parsed
       │  └─ JSON decoded
       │
20ms   ├─ Validation
       │  └─ Mux URL checked
       │
25ms   ├─ Database query
       │  └─ INSERT into videos table
       │
45ms   ├─ Response ready
       │  └─ JSON serialized
       │
50ms   └─ Response sent to client
        └─ Total: 50ms round trip
```

---

## 15. Security Threat Model

```
THREAT: Unauthorized access
┌─────────────────────────────────┐
│ Current                         │
├─────────────────────────────────┤
│ ✅ JWT extracted               │
│ ❌ JWT signature not verified   │
│ ✅ Payment status checked       │
│ ⚠️ Payment stored in memory     │
└─────────────────────────────────┘
Fix: Verify JWT signature

THREAT: Webhook spoofing
┌─────────────────────────────────┐
│ Current                         │
├─────────────────────────────────┤
│ ❌ No webhook signature check   │
│ ❌ Handler not implemented      │
└─────────────────────────────────┘
Fix: Verify Whop-Signature header

THREAT: CSRF attacks
┌─────────────────────────────────┐
│ Current                         │
├─────────────────────────────────┤
│ ✅ Using POST for mutations    │
│ ✅ Within Whop iframe (same-origin) │
│ ⚠️ No explicit CSRF tokens      │
└─────────────────────────────────┘
Fix: Add CSRF protection

THREAT: SQL injection
┌─────────────────────────────────┐
│ Current                         │
├─────────────────────────────────┤
│ ✅ Using Supabase SDK          │
│ ✅ Parameterized queries       │
│ ✅ No raw SQL                  │
└─────────────────────────────────┘
Status: Protected by design

THREAT: XSS attacks
┌─────────────────────────────────┐
│ Current                         │
├─────────────────────────────────┤
│ ✅ React escapes by default    │
│ ✅ No innerHTML usage          │
│ ⚠️ Could add CSP headers       │
└─────────────────────────────────┘
Status: Generally protected
```

---

This completes the architecture documentation!

