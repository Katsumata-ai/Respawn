# 🎬 WHOP APP - DEEP TECHNICAL ANALYSIS
## Course Downloader - Complete Project Overview

---

## 📋 TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [What is a Whop App?](#what-is-a-whop-app)
3. [Project Architecture](#project-architecture)
4. [Tech Stack Breakdown](#tech-stack-breakdown)
5. [Core Features Analysis](#core-features-analysis)
6. [Data Flow & Payment Model](#data-flow--payment-model)
7. [Security & Authentication](#security--authentication)
8. [Database Schema](#database-schema)
9. [API Routes Documentation](#api-routes-documentation)
10. [Current Implementation Status](#current-implementation-status)
11. [Known Issues & Gaps](#known-issues--gaps)
12. [Deployment & Marketplace](#deployment--marketplace)
13. [Development Roadmap](#development-roadmap)

---

## 📊 EXECUTIVE SUMMARY

**Project Name:** Course Downloader - A Whop App  
**Purpose:** Allow Whop community members to download and manage course videos from Mux streams  
**Monetization:** €10 one-time payment per user  
**Tech Stack:** Next.js 16 + React 19 + TypeScript + Supabase + Vercel  
**Status:** MVP phase with core infrastructure ready, video processing pending

### Key Stats
- **Repository:** `/Users/amenefzi/Projects/WhopApp1`
- **Framework:** Next.js 16 (App Router with TypeScript)
- **Database:** Supabase (PostgreSQL)
- **Frontend:** React 19 + Tailwind CSS
- **APIs:** RESTful Next.js API routes
- **Deployment:** Vercel (automatic)
- **Payment Integration:** Whop SDK (webhooks required)

---

## 🎯 WHAT IS A WHOP APP?

### Definition
A Whop App is a web application that integrates into **Whop communities** - allowing Whop creators to offer additional tools/services to their community members.

### Key Characteristics
1. **Embedded Experience:** Runs within Whop community dashboard
2. **Zero Authentication:** Whop handles user authentication automatically
3. **Payment Integrated:** Seamless payment collection via Whop
4. **Marketplace Distribution:** Listed in Whop App Store (seen by 10,000s of creators)
5. **Multi-tenant:** Same app instance serves multiple communities

### Whop App Advantages
- **No auth complexity:** Whop provides user info via JWT token
- **Payment handling:** Whop processes payments (fees to Whop included)
- **Community reach:** Access to tens of thousands of creators
- **Webhook support:** Real-time payment notifications
- **SDK ready:** Official SDK handles most integrations

### Whop Monetization Models
1. **One-time Installation Fee:** $5,000 (one payment, all community members get access)
2. **Per-Seat Model:** $1/member/month (charged per active community member)
3. **Monthly Subscription:** $300/month (creators pay monthly)
4. **Transaction Fee:** Take % on in-app purchases (games, marketplaces)
5. **Affiliate Commission:** Creators resell your app (you earn commission)

**This Project Uses:** One-time €10 fee per user

---

## 🏗️ PROJECT ARCHITECTURE

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                   WHOP COMMUNITY PLATFORM                    │
│              (Authentication & Payment Handling)             │
│  Provides:                                                   │
│  - User JWT tokens (x-whop-user-token header)               │
│  - Payment webhooks (payment.completed, payment.refunded)   │
│  - User context (username, email, ID)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP + JWT Token
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS APP (Vercel Deployment)                │
│                                                              │
│  ┌─ Frontend (React 19) ──────────────────────────────────┐ │
│  │ • VideoExtractor.tsx - Main UI                         │ │
│  │ • Home page with auth check & video upload form        │ │
│  │ • Responsive design (Tailwind CSS)                     │ │
│  │ • Real-time feedback (loading, error, success)         │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌─ API Routes (Backend) ─────────────────────────────────┐ │
│  │ • /api/videos [POST/GET]           - CRUD operations   │ │
│  │ • /api/videos/[shareableId] [GET]  - Public sharing    │ │
│  │ • /api/whop/user [GET]             - User info         │ │
│  │ • /api/whop/validate-access [GET]  - Payment check     │ │
│  │ • /api/webhooks/whop [POST]        - Payment events    │ │
│  └────────────────────────────────────────────────────────┘ │
│                       │                                      │
│  ┌─ Business Logic (Services) ─────────────────────────────┐│
│  │ • VideoViewModel - State management & operations       ││
│  │ • WhopClient - Whop SDK wrapper (browser-side)         ││
│  │ • WhopServer - Token verification (server-side)        ││
│  │ • SupabaseService - Database operations                ││
│  └────────────────────────────────────────────────────────┘│
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
       ▼                ▼                ▼
  ┌──────────┐   ┌────────────┐   ┌──────────────┐
  │ Supabase │   │ Supabase   │   │   S3 Bucket  │
  │ Database │   │  Storage   │   │  (Videos)    │
  │(Metadata)│   │(Not used)  │   │ (TODO: impl) │
  └──────────┘   └────────────┘   └──────────────┘
```

### MVVM Pattern Implementation

```
┌─────────────────────────────────┐
│      Views (React Components)    │
│  VideoExtractor.tsx             │
│  - Form inputs                  │
│  - User interactions            │
│  - UI state (loading, error)    │
└────────────┬────────────────────┘
             │ (calls methods)
             ▼
┌─────────────────────────────────┐
│   ViewModels (Business Logic)   │
│  VideoViewModel                 │
│  - uploadVideo()                │
│  - getUserVideos()              │
│  - getVideoStats()              │
│  - deleteVideo()                │
│  - State management             │
└────────────┬────────────────────┘
             │ (uses Models)
             ▼
┌─────────────────────────────────┐
│    Models (Data Contracts)      │
│  Video interface                │
│  VideoUploadRequest             │
│  VideoResponse                  │
│  VideoStats                     │
└────────────┬────────────────────┘
             │ (calls API)
             ▼
┌─────────────────────────────────┐
│    API Routes (Handlers)        │
│  /api/videos                    │
│  /api/whop/validate-access      │
│  → Database Operations          │
└─────────────────────────────────┘
```

### Folder Structure (Detailed)

```
WhopApp1/
│
├── 📱 app/ (Next.js App Router)
│   ├── page.tsx                    # Main entry point
│   ├── layout.tsx                  # Root HTML layout
│   ├── globals.css                 # Tailwind styles
│   │
│   ├── models/
│   │   └── Video.ts                # Type definitions & interfaces
│   │
│   ├── viewmodels/
│   │   └── VideoViewModel.ts       # Business logic (singleton)
│   │
│   ├── views/
│   │   └── VideoExtractor.tsx      # Main React component
│   │
│   ├── services/
│   │   └── api.service.ts          # HTTP client (if needed)
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript type exports
│   │
│   ├── utils/
│   │   └── constants.ts            # App constants
│   │
│   └── api/ (API Routes)
│       ├── videos/
│       │   ├── route.ts            # POST: create video, GET: list videos
│       │   └── [shareableId]/
│       │       └── route.ts        # GET: video by shareable ID
│       │
│       ├── whop/
│       │   ├── user/
│       │   │   └── route.ts        # GET: current user info
│       │   ├── validate-access/
│       │   │   └── route.ts        # GET: check if user paid
│       │   └── company/
│       │       └── route.ts        # GET: company info (optional)
│       │
│       └── webhooks/
│           └── whop/
│               └── route.ts        # POST: payment webhooks
│
├── 🗄️ lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase client singleton
│   │   └── service.ts              # Database operations
│   │
│   └── whop/
│       ├── client.ts               # Browser-side Whop SDK wrapper
│       └── server.ts               # Server-side token verification
│
├── 🔧 Configuration Files
│   ├── package.json                # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript config
│   ├── next.config.js              # Next.js config
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS config
│   ├── vercel.json                 # Vercel deployment config
│   └── .env.local                  # Environment variables
│
├── 📚 Documentation
│   ├── PROJECT_SUMMARY.md          # Overview
│   ├── PROJECT_STRUCTURE.md        # Folder structure
│   ├── WHOP_APP_GUIDE.md           # Whop-specific guide
│   ├── QUICK_START.md              # Quick start instructions
│   ├── COMPLETE_GUIDE.md           # Comprehensive guide
│   ├── DEPLOYMENT_CHECKLIST.md     # Pre-deployment checks
│   ├── BROWSER_EXTENSIONS_GUIDE.md # Browser extension setup
│   ├── OPTIMIZATION_SUMMARY.md     # Performance optimizations
│   ├── NEXT_STEPS.md               # Future features
│   └── SUPABASE_SETUP.md           # Database setup
│
├── 🗃️ supabase/
│   └── migrations/
│       └── 001_create_tables.sql   # Database schema
│
├── 🧪 tests/
│   └── (Test files - Playwright)
│
└── 📦 node_modules/ (Dependencies installed)
```

---

## ⚙️ TECH STACK BREAKDOWN

### Frontend Layer
```
✅ Next.js 16.0.0
   - App Router (not Pages Router)
   - TypeScript enabled
   - Server-side rendering capable
   - API routes built-in
   - Hot module reloading

✅ React 19.0.0
   - Latest features (Suspense, Transitions)
   - UseState for component state
   - UseEffect for side effects
   - RSC ready (React Server Components)

✅ TypeScript 5.0.0
   - Type safety across the project
   - Strict mode enabled
   - Interface definitions for all models

✅ Tailwind CSS 3.4.0
   - Utility-first CSS
   - Pre-configured in tailwind.config.js
   - PostCSS integration
   - Responsive design ready
```

### Backend Layer
```
✅ Next.js API Routes
   - /api/videos/* - Video CRUD
   - /api/whop/* - Whop integrations
   - /api/webhooks/* - Webhook handlers
   - All in TypeScript

✅ Supabase (PostgreSQL)
   - Cloud database (no setup required)
   - Real-time capabilities
   - Row Level Security (RLS)
   - Storage buckets (unused so far)
```

### Database Layer
```
✅ Supabase PostgreSQL
   - videos table - Video metadata
   - video_accesses table - View/download tracking
   - users table (implied) - User payment status
   - All with timestamps & indexes
```

### External Integrations
```
✅ Whop SDK
   - JWT token verification
   - Payment webhook handling
   - User context (user ID, email, etc.)
   - App installation management

✅ Supabase JS SDK v2.76.1
   - Type-safe database queries
   - Real-time subscriptions
   - Authentication integration (not used here)

✅ UUID v13.0.0
   - Shareable video IDs (not sequential)
   - Collision-resistant unique identifiers
```

### DevOps & Deployment
```
✅ Vercel
   - Zero-config Next.js hosting
   - Automatic deployments from git
   - Preview deployments
   - Environment variables management
   - Serverless functions (API routes)
   - Edge middleware capability

✅ Environment Configuration
   - .env.local for local development
   - .env.production for production
   - API keys secure in Vercel dashboard
```

### Development Tools
```
✅ TypeScript 5.0.0 - Type checking
✅ ESLint (via Next.js) - Code linting
✅ Tailwind CSS - Style linting
✅ Node.js 18+ - Runtime
✅ npm 10+ - Package manager
✅ Playwright 1.56.1 - E2E testing
```

---

## 🎯 CORE FEATURES ANALYSIS

### 1. **User Authentication & Verification**

**How It Works:**
- Whop embeds the app in an iframe within their community
- Whop injects a JWT token in the `x-whop-user-token` header
- Token contains: `{ userId, appId, iat, exp }`
- No manual login needed (handled by Whop)

**Implementation:**
```typescript
// app/page.tsx
- Call /api/whop/validate-access
- Check if user has paid €10
- If not paid → Show "Access Required" message
- If paid → Show VideoExtractor component

// app/api/whop/validate-access/route.ts
- Verify JWT token from headers
- Check user's payment status in Supabase
- Return { hasAccess: boolean, accessLevel: 'admin'|'customer'|'no_access' }
```

**Security Notes:**
- Token verified on backend only (not in browser)
- JWT signature should be verified (currently decoded but not validated)
- Token expiration checked automatically

### 2. **Video Upload & Management**

**Workflow:**
```
User fills form
  ├─ Video Title (text input)
  ├─ Mux URL (via browser extraction or manual paste)
  └─ Optional: Description

User clicks "Extract Mux URL"
  └─ Opens popup with DevTools instructions
     (User must manually extract from Network tab)

User clicks "Upload Video"
  ├─ Validate Mux URL format (must have stream.mux.com & .m3u8)
  ├─ Generate unique shareableId (UUID v4)
  └─ POST /api/videos
     ├─ Save to Supabase videos table
     ├─ Return video metadata
     └─ Show success message

User gets shareable link
  └─ Can share with others: /video/[shareableId]
```

**Validation:**
```typescript
✅ Mux URL must include:
   - "stream.mux.com" (domain)
   - ".m3u8" (manifest file)

✅ Required fields:
   - userId (from Whop token)
   - title (user input)
   - muxUrl (extracted from browser)

❌ Does NOT validate:
   - If Mux URL is actually accessible
   - If video exists at that URL
   - Stream credentials validity
```

### 3. **Mux URL Extraction**

**Current Method (Manual):**
- Browser extension or Developer Tools required
- User opens Network tab while playing course video
- Finds requests to stream.mux.com
- Copies .m3u8 URL and pastes into app

**Why Mux URLs?**
- Mux provides video streaming infrastructure
- Used by many course platforms (Teachable, Podia, etc.)
- Stream URLs are HLS manifests (.m3u8)
- Can be played in HTML5 video players

**Example Mux URL:**
```
https://stream.mux.com/abc123/manifest.m3u8?token=xyz789&expires=1234567890
```

**Limitations:**
- Requires manual extraction (not automated)
- Depends on browser DevTools knowledge
- URLs may have token expiration
- No validation that URL is valid before upload

### 4. **Video Sharing & Public Access**

**Shareable Link Format:**
```
https://your-app.vercel.app/video/[shareableId]
```

**Implementation:**
```typescript
// app/api/videos/[shareableId]/route.ts
GET request:
  ├─ Find video by shareableId
  ├─ Track access in video_accesses table
  ├─ Return video metadata (including Mux URL)
  └─ Frontend plays video (if player implemented)

// Frontend video player (TODO)
<video>
  <source src="[muxUrl]" type="application/x-mpegURL" />
</video>
```

**Current Status:**
- API route exists but frontend player NOT implemented
- Video metadata returned, but playback UI missing

### 5. **Analytics & Tracking**

**What Gets Tracked:**
```
video_accesses table:
├─ video_id (which video)
├─ user_id (who accessed it)
├─ access_type ('view' or 'download')
├─ accessed_at (timestamp)
└─ ip_address (optional)

videos table:
├─ view_count (total views)
├─ download_count (total downloads)
└─ updated_at (last access time)
```

**Statistics Provided:**
```typescript
SupabaseService.getVideoStats(videoId)
├─ views: number (count of 'view' access_type)
├─ downloads: number (count of 'download' access_type)
└─ lastAccessed: timestamp
```

**Currently Tracked:**
✅ View count stored in DB  
✅ Download count stored in DB  
❌ No real tracking happening (view/download not incremented)  
❌ No analytics dashboard UI

### 6. **Payment Integration**

**Payment Flow:**
```
1. User installs app in their Whop community
2. Whop community members see "Install App" button
3. Users click to buy → Whop payment page
4. User pays €10 (one-time fee)
5. Whop sends webhook: payment.completed
6. Webhook marks user as paid in Supabase
7. User can now use app

Future accesses:
8. User visits app
9. /api/whop/validate-access checks payment status
10. If has_paid = true → Allow access
11. If has_paid = false → Show "Purchase Required"
```

**Webhook Implementation (TODO):**
```typescript
// app/api/webhooks/whop/route.ts
POST request:
├─ Verify webhook signature (Whop header)
├─ Check event type (payment.completed)
├─ Extract user ID from payload
├─ Call markUserAsPaid(userId)
└─ Update Supabase: has_paid = true
```

**Status:**
- ✅ Webhook route exists
- ❌ No verification implemented
- ❌ No payload handling
- ❌ No database update

---

## 💰 DATA FLOW & PAYMENT MODEL

### Complete User Journey

```
┌─ DISCOVERY ─────────────────────────────────────────┐
│  Creator finds "Course Downloader" in Whop App Store │
│  Reviews features: "Download course videos"         │
│  Decides to install for their community             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─ INSTALLATION ──────────────────────────────────────┐
│  Creator clicks "Install App"                        │
│  Whop shows app in community as feature             │
│  Members see app when they visit community          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─ PURCHASE ──────────────────────────────────────────┐
│  Community member clicks "Use App"                   │
│  Redirected to payment page: €10 one-time fee       │
│  User enters payment info (Whop handles it)         │
│  Payment processed                                   │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─ WEBHOOK NOTIFICATION ──────────────────────────────┐
│  Whop sends: POST /api/webhooks/whop                │
│  {                                                   │
│    event: "payment.completed",                      │
│    userId: "user_abc123",                           │
│    amount: 10,                                       │
│    currency: "EUR"                                  │
│  }                                                   │
│  App updates: users.has_paid = true                 │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─ FIRST ACCESS ──────────────────────────────────────┐
│  User visits app (already embedded in community)     │
│  Whop sends JWT token in headers                    │
│  App checks: /api/whop/validate-access              │
│  Database says: has_paid = true ✅                 │
│  App loads VideoExtractor component                 │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─ FEATURE USAGE ─────────────────────────────────────┐
│  User enters video title + Mux URL                  │
│  User clicks "Upload Video"                         │
│  API saves to Supabase (videos table)               │
│  User gets shareable link                           │
│  User shares with others: /video/[shareableId]      │
└─────────────────────────────────────────────────────┘
```

### Revenue Model

```
Pricing: €10 (one-time per user per community)

Example Revenue Scenario:
- Creator has 100 community members
- 50 members purchase app access
- Revenue = 50 × €10 = €500

Whop's Revenue Share:
- Whop takes 20% = €100
- Developer gets 80% = €400

Multiple Communities:
- Creator A: 100 members, 50 purchase = €500
- Creator B: 200 members, 100 purchase = €1,000
- Creator C: 50 members, 25 purchase = €250
- Total potential: €1,750 from 3 communities
```

### Payment Status Tracking

```
Database Design:
┌──────────────────────────────────┐
│         users table              │
├──────────────────────────────────┤
│ id                  (UUID)       │
│ whop_user_id        (VARCHAR)    │  ← From JWT token
│ email               (VARCHAR)    │
│ username            (VARCHAR)    │
│ avatar              (VARCHAR)    │
│ has_paid            (BOOLEAN)    │  ← TRUE after payment
│ payment_date        (TIMESTAMP)  │  ← When they paid
│ created_at          (TIMESTAMP)  │
│ updated_at          (TIMESTAMP)  │
└──────────────────────────────────┘

Access Check Flow:
1. User visits app
2. JWT token decoded: userId = "user_abc123"
3. Query: SELECT has_paid FROM users WHERE whop_user_id = 'user_abc123'
4. Result: true ✅ (allow access)
   or     false ❌ (show purchase modal)
```

---

## 🔐 SECURITY & AUTHENTICATION

### Whop JWT Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": "user_abc123xyz",
  "appId": "app_FgzHqoGCTn-h4zFJdorsIII",
  "iat": 1629907200,           # Issued at
  "exp": 1629910800            # Expires in 1 hour
}

Signature:
HMAC-SHA256(
  base64(header) + "." + base64(payload),
  "your-whop-app-secret"
)
```

### Token Verification (Current Implementation)

```typescript
// lib/whop/server.ts
export async function verifyWhopToken(): Promise<WhopUserPayload | null> {
  // Get token from headers
  const token = headers().get('x-whop-user-token');
  
  if (!token) return null;
  
  // Split JWT into parts
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  // Decode payload (base64)
  const payload = JSON.parse(
    Buffer.from(parts[1], 'base64').toString('utf-8')
  );
  
  return payload;
}
```

**Current Issues:**
- ❌ Signature NOT verified
- ❌ Token expiration NOT checked
- ❌ Secret key not used
- ⚠️ Only decoding, not validating authenticity

**What Should Happen:**
```typescript
// TODO: Use jwt library to verify
import jwt from 'jsonwebtoken';

const payload = jwt.verify(token, process.env.WHOP_APP_SECRET);
```

### Security Best Practices Implemented

✅ **Environment Variables:**
- API keys stored in .env.local (not in code)
- Vercel keeps secrets encrypted
- Different keys for dev vs production

✅ **Backend Verification:**
- All sensitive checks on server-side
- Payment verification happens server-side
- User access validated on /api/ routes

✅ **No Secrets in Frontend:**
- No Whop app secret in browser code
- No database credentials in browser
- Only public Supabase anon key exposed

❌ **Webhook Validation (Missing):**
- Incoming webhooks not verified
- Should check Whop signature header
- Could allow malicious payment notifications

❌ **CORS Configuration (Missing):**
- No explicit CORS headers set
- Could allow cross-origin requests

❌ **Rate Limiting (Missing):**
- No protection against brute force
- No webhook replay protection

---

## 🗄️ DATABASE SCHEMA

### Current Tables

#### **videos Table**
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                    # Who uploaded it
  shareable_id VARCHAR UNIQUE NOT NULL,     # Public share link
  title VARCHAR NOT NULL,                   # Video title
  description TEXT,                         # Optional description
  s3_url VARCHAR,                           # Video file location (S3)
  mux_url VARCHAR NOT NULL,                 # Original Mux stream URL
  duration INTEGER,                         # Video length in seconds
  thumbnail VARCHAR,                        # Preview image
  view_count INTEGER DEFAULT 0,             # Number of views
  download_count INTEGER DEFAULT 0,         # Number of downloads
  is_public BOOLEAN DEFAULT true,           # Visibility
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_shareable_id (shareable_id),
  UNIQUE (shareable_id)
);
```

#### **video_accesses Table**
```sql
CREATE TABLE video_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,                    # Who accessed it
  access_type VARCHAR NOT NULL,             # 'view' or 'download'
  accessed_at TIMESTAMP DEFAULT now(),
  ip_address VARCHAR,                       # For security/analytics
  
  -- Indexes
  INDEX idx_video_id (video_id),
  INDEX idx_user_id (user_id),
  INDEX idx_accessed_at (accessed_at)
);
```

#### **users Table** (Implied, not yet created)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_user_id VARCHAR UNIQUE NOT NULL,     # From JWT token
  email VARCHAR,
  username VARCHAR,
  avatar VARCHAR,                           # Profile picture
  has_paid BOOLEAN DEFAULT false,           # Payment status ⭐
  payment_date TIMESTAMP,                   # When they paid
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_whop_user_id (whop_user_id)
);
```

### Entity Relationships

```
┌──────────────────┐
│ users            │
│ id (PK)          │
│ whop_user_id     │
│ has_paid ⭐      │
└────────┬─────────┘
         │
         │ (1 to Many)
         │
         ▼
┌──────────────────┐     ┌──────────────────────┐
│ videos           │─────│ video_accesses       │
│ id (PK)          │     │ video_id (FK)        │
│ user_id (FK)     │     │ user_id (FK)         │
│ view_count       │     │ access_type          │
│ download_count   │     │ accessed_at          │
└──────────────────┘     └──────────────────────┘
```

### Row Level Security (RLS) - Not Yet Configured

```sql
-- Users can only see their own videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

-- Only the uploader can delete
CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view video_accesses of their videos
CREATE POLICY "Can view accesses of own videos" ON video_accesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = video_accesses.video_id 
      AND videos.user_id = auth.uid()
    )
  );
```

---

## 📡 API ROUTES DOCUMENTATION

### 1. **POST /api/videos** - Create Video
```typescript
Request:
{
  "userId": "user_abc123",
  "muxUrl": "https://stream.mux.com/abc123/manifest.m3u8",
  "title": "Python Basics Course - Part 1",
  "description": "Learn Python fundamentals"
}

Response (201 Created):
{
  "id": "uuid-123-456-789",
  "userId": "user_abc123",
  "shareableId": "uuid-random",
  "title": "Python Basics Course - Part 1",
  "muxUrl": "https://stream.mux.com/abc123/manifest.m3u8",
  "viewCount": 0,
  "downloadCount": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

Errors:
- 400: Missing required fields or invalid Mux URL
- 500: Database error
```

### 2. **GET /api/videos** - List User's Videos
```typescript
Request:
GET /api/videos?userId=user_abc123

Response (200 OK):
[
  {
    "id": "uuid-1",
    "title": "Video 1",
    "viewCount": 42,
    "downloadCount": 5,
    "shareableId": "uuid-share-1",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid-2",
    "title": "Video 2",
    "viewCount": 128,
    "downloadCount": 12,
    "shareableId": "uuid-share-2",
    "createdAt": "2024-01-14T08:15:00Z"
  }
]

Errors:
- 400: userId not provided
- 500: Database error
```

### 3. **GET /api/videos/[shareableId]** - Get Public Video
```typescript
Request:
GET /api/videos/uuid-share-123

Response (200 OK):
{
  "id": "uuid-123",
  "title": "Python Basics",
  "muxUrl": "https://stream.mux.com/abc123/manifest.m3u8",
  "viewCount": 42,
  "downloadCount": 5,
  "createdAt": "2024-01-15T10:30:00Z"
}

Behavior:
✅ Tracks access in video_accesses table
✅ Increments view_count in videos table
❌ NOT implemented yet

Errors:
- 404: Video not found
- 500: Database error
```

### 4. **GET /api/whop/user** - Get Current User
```typescript
Request:
GET /api/whop/user
(Headers: x-whop-user-token: jwt_token_here)

Response (200 OK):
{
  "id": "user_abc123",
  "email": "user@example.com",
  "username": "john_doe",
  "profilePicUrl": "https://..."
}

Errors:
- 401: No valid Whop token
- 500: Failed to get user info
```

### 5. **GET /api/whop/validate-access** - Check Payment Status
```typescript
Request:
GET /api/whop/validate-access
(Headers: x-whop-user-token: jwt_token_here)

Response (200 OK):
{
  "hasAccess": true,
  "accessLevel": "customer"
}

Response (403 Forbidden) - User hasn't paid:
{
  "hasAccess": false,
  "accessLevel": "no_access"
}

Flow:
1. Decode JWT token → get userId
2. Query: SELECT has_paid FROM users WHERE whop_user_id = userId
3. Return hasAccess: has_paid
```

### 6. **POST /api/webhooks/whop** - Payment Webhook
```typescript
Request:
{
  "event": "payment.completed",
  "userId": "user_abc123",
  "amount": 10,
  "currency": "EUR",
  "timestamp": 1629907200
}

Response (200 OK):
{
  "success": true,
  "message": "Payment processed"
}

Behavior:
✅ Route exists at app/api/webhooks/whop/route.ts
❌ NOT implemented:
   - Webhook signature verification
   - Payload parsing
   - Database update
   - Event handling

TODO Implementation:
export async function POST(request: NextRequest) {
  const payload = await request.json();
  
  // Verify signature
  const signature = request.headers.get('x-whop-signature');
  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Handle payment completed
  if (payload.event === 'payment.completed') {
    await markUserAsPaid(payload.userId);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
}
```

---

## 📊 CURRENT IMPLEMENTATION STATUS

### ✅ COMPLETED Features

1. **Project Setup**
   - Next.js 16 with TypeScript configured
   - Tailwind CSS integrated
   - Environment variables set up
   - Vercel deployment ready

2. **Authentication Layer**
   - Whop JWT token extraction
   - Token decoding (not signature verification)
   - Access validation endpoint (/api/whop/validate-access)
   - Server-side token verification

3. **Database Layer**
   - Supabase integration
   - Videos table schema created
   - Video_accesses table schema created
   - Singleton SupabaseService class
   - Full CRUD operations for videos

4. **Frontend UI**
   - Home page with access check
   - VideoExtractor form component
   - Responsive design (Tailwind CSS)
   - Loading/error/success states
   - Mux URL extraction popup helper

5. **Business Logic**
   - VideoViewModel for state management
   - Mux URL validation
   - UUID generation for shareable IDs
   - Video upload workflow

6. **API Routes**
   - POST /api/videos (create video)
   - GET /api/videos (list user videos)
   - GET /api/videos/[shareableId] (public access)
   - GET /api/whop/user (get current user)
   - GET /api/whop/validate-access (check payment)
   - POST /api/webhooks/whop (webhook receiver - empty)

7. **Documentation**
   - Project structure documentation
   - Setup guides
   - Whop-specific guide
   - Deployment checklist
   - Next steps roadmap

### ⚠️ PARTIALLY IMPLEMENTED Features

1. **Payment Integration**
   - ✅ Access validation logic ready
   - ❌ Webhook handler empty (no signature verification, no database update)
   - ❌ Payment event processing not implemented

2. **Video Sharing**
   - ✅ Shareable link generation (UUID)
   - ✅ API endpoint for public video access
   - ❌ No frontend video player component
   - ❌ No analytics dashboard

3. **Analytics**
   - ✅ Database schema for tracking
   - ❌ No actual tracking implementation
   - ❌ No statistics UI/dashboard

### ❌ NOT IMPLEMENTED Features

1. **Video Processing**
   - No video downloading from Mux URLs
   - No S3 storage integration
   - No background job queue (Bull)
   - No video conversion/transcoding

2. **Video Player**
   - No HLS player component
   - No playback UI
   - No download button
   - No video controls (pause, seek, etc.)

3. **Advanced Features**
   - No user profiles
   - No video collections
   - No comments/ratings
   - No search functionality
   - No video editing

4. **Security**
   - JWT signature verification not implemented
   - Webhook signature verification not implemented
   - CORS not explicitly configured
   - Rate limiting not implemented
   - Input validation minimal

5. **DevOps**
   - Database migrations not automated
   - No database backup strategy
   - No monitoring/logging
   - No error tracking (Sentry)
   - No performance monitoring

---

## 🐛 KNOWN ISSUES & GAPS

### Critical Issues

1. **Webhook Handler Empty**
   - File: `app/api/webhooks/whop/route.ts`
   - Status: Exists but does nothing
   - Impact: Payments not recorded in database
   - Fix needed: Implement payload parsing, verification, and database update

2. **JWT Token Verification Incomplete**
   - Current: Decoding only, no signature check
   - Risk: Anyone could forge a JWT token
   - Fix needed: Use `jsonwebtoken` library to verify signature with app secret

3. **Payment Status Check (users table)**
   - Database table may not exist yet
   - Referenced in code but needs migration
   - Until table exists, access validation will fail

### Major Gaps

4. **No Video Player Implemented**
   - API endpoint exists but frontend missing
   - Can't actually play shared videos
   - Users can only get metadata via API
   - Fix: Create React component with HLS.js or Video.js

5. **No Video Processing**
   - Videos not actually downloaded from Mux
   - Not stored in S3
   - Mux URLs may expire (contain tokens)
   - Fix: Implement Bull queue + yt-dlp integration

6. **Analytics Not Tracking**
   - Schema exists but no actual tracking
   - View/download counts never incremented
   - Fix: Track access in `video_accesses` table on each request

### Minor Gaps

7. **Mux URL Extraction Manual**
   - Requires user to open DevTools
   - Fragile (depends on browser storage of credentials)
   - Fix: Create browser extension for automatic extraction

8. **No Error Handling in Webhooks**
   - If webhook fails, no retry logic
   - No dead letter queue
   - Fix: Implement idempotency keys, retry logic

9. **No Environment Setup Script**
   - Manual Supabase configuration required
   - No migrations automation
   - Fix: Create setup script

10. **Type Safety Issues**
    - Some `any` types used
    - WhopUser type could be stricter
    - Fix: Add proper TypeScript types throughout

---

## 🚀 DEPLOYMENT & MARKETPLACE

### Deployment Pipeline

```
Local Development
  ↓ (npm run dev on localhost:3000)
  
Code Push to GitHub
  ↓ (git push origin main)
  
Vercel Auto-Deploy
  ├─ Install dependencies
  ├─ Build Next.js (npm run build)
  ├─ Run TypeScript checks (tsc --noEmit)
  ├─ Generate static assets
  └─ Deploy to Edge Functions
  
Production Live
  └─ https://your-app.vercel.app
```

### Pre-Deployment Checklist

```
❌ Environment Variables
   - NEXT_PUBLIC_SUPABASE_URL set
   - NEXT_PUBLIC_SUPABASE_ANON_KEY set
   - SUPABASE_SERVICE_ROLE_KEY set (if used server-side)
   - WHOP_APP_KEY set

❌ Database
   - Supabase project created
   - All migrations run
   - RLS policies configured

❌ Whop Configuration
   - App ID set in env
   - Base URL points to Vercel domain
   - Webhook endpoint configured in Whop dashboard
   - Payment model configured (€10 one-time)

❌ Security
   - All secrets in environment variables
   - No credentials in code
   - CORS configured
   - Webhook signature verification implemented

❌ Testing
   - npm run build passes
   - npm run type-check passes
   - Manual testing of main flows
   - Payment webhook tested (with ngrok locally)

❌ Documentation
   - README updated
   - Setup instructions clear
   - Admin dashboard guide provided
```

### Whop App Store Listing

```
App Name: Course Downloader
Description: Download and manage course videos from Mux streams

Features:
• One-click video upload from Mux URLs
• Shareable video links
• View and download analytics
• Permanent storage

Pricing:
• €10 one-time fee per member
• Unlimited uploads
• Unlimited storage

Screenshots:
1. Main upload interface
2. Video list view
3. Sharing example

Categories:
• Productivity
• Content Management
• E-learning Tools

Support:
• Email: support@example.com
• Documentation: https://...
```

---

## 🗺️ DEVELOPMENT ROADMAP

### Phase 1: MVP (Current - Next 2 weeks)
- [ ] Implement webhook handler for payments
- [ ] Add JWT signature verification
- [ ] Create users table and migration
- [ ] Test payment flow end-to-end
- [ ] Basic error handling

### Phase 2: Video Playback (Weeks 3-4)
- [ ] Create video player component (HLS.js)
- [ ] Implement /api/videos/[shareableId] frontend
- [ ] Add analytics tracking (increment view_count)
- [ ] Create simple analytics dashboard
- [ ] Add download button

### Phase 3: Video Processing (Weeks 5-6)
- [ ] Setup Bull queue for background jobs
- [ ] Implement yt-dlp integration
- [ ] Configure S3 bucket
- [ ] Create video download/processing flow
- [ ] Add processing status UI

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] User profiles and video management
- [ ] Video collections/playlists
- [ ] Search and filtering
- [ ] Comments and ratings
- [ ] Admin analytics dashboard

### Phase 5: Production Ready (Weeks 9-10)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Error tracking (Sentry)
- [ ] Load testing
- [ ] Documentation finalization

### Phase 6: Marketplace Launch (Week 11+)
- [ ] Submit to Whop App Store
- [ ] Marketing materials
- [ ] Community outreach
- [ ] Continuous monitoring
- [ ] Feature requests handling

---

## 📚 WHOP ECOSYSTEM CONTEXT

### How Whop Apps Work in Whop Communities

```
Whop Creator
  ├─ Creates community for their business
  ├─ Offers courses/services/digital products
  └─ Wants to add tools to enhance community
       │
       ▼ (Browse App Store)
       
Whop App Store
  ├─ Lists all approved apps
  ├─ Shows reviews and pricing
  └─ One-click install button
       │
       ▼ (Creator installs app)
       
App Installation
  ├─ App embedded in community
  ├─ All community members see app
  └─ Members can purchase access
       │
       ▼ (Member clicks "Use App")
       
Payment Flow
  ├─ Whop payment modal shown
  ├─ Member pays €10 (one-time)
  ├─ Whop processes payment
  └─ Webhook sent to app backend
       │
       ▼ (Webhook: payment.completed)
       
Your App Backend
  ├─ Mark user as paid
  ├─ Store in Supabase
  └─ User now has access
       │
       ▼ (Member uses app)
       
App Experience
  ├─ Member visits app (embedded in iframe)
  ├─ Whop injects JWT token
  ├─ App verifies: has_paid = true
  ├─ App shows video upload feature
  └─ Member uploads videos
       │
       ▼ (Member shares videos)
       
Video Sharing
  ├─ Member gets shareable link
  ├─ Shares with others (inside/outside community)
  └─ Others view videos (no payment needed)
```

### Whop vs Traditional Payments

```
Traditional Approach:
- User → Payment form → Stripe → Your app → Database
- You handle: PCI compliance, fraud detection, recurring billing
- Complex, risky, lots of overhead

Whop Approach:
- User → Whop → Your webhook → Your database
- Whop handles: PCI, fraud, billing, customer support
- Simple, secure, built-in trust
- Whop also provides distribution (marketplace)
```

---

## 🎓 KEY LEARNINGS FOR WHOP APP DEVELOPMENT

### 1. JWT Token is Your Authentication
- Don't require login (Whop already authenticated them)
- Extract user ID from token
- Use it to identify user in your database

### 2. Webhooks are Critical
- User pays via Whop
- Whop sends webhook to your app
- Mark user as paid in your database
- Without webhooks, you won't know who paid

### 3. Think Multi-Tenant
- Same app runs in multiple communities
- Each community has different members
- Users in one community are separate from another
- Your database needs community/context awareness

### 4. Leverage Whop SDK
- Use official SDK for consistency
- Don't manually verify JWTs (let SDK do it)
- Use Whop's payment system (don't integrate Stripe)
- Follow Whop patterns and conventions

### 5. UX Matters
- App runs in iframe (potential issues)
- Keep it responsive (mobile-first)
- Fast loading (within app context)
- Clear value proposition upfront

### 6. Security First
- Verify webhooks (signature verification)
- Never trust client-side claims
- Validate all inputs
- Use HTTPS (Vercel provides this)
- Store secrets in environment variables

---

## 📌 SUMMARY

This is a **Whop app for downloading course videos**. It's built with modern tech (Next.js 16, React 19, TypeScript, Tailwind, Supabase) and follows MVVM architecture.

**Core Flow:**
1. User pays €10 via Whop
2. Webhook marks them as paid
3. They access the app and upload Mux video URLs
4. App stores video metadata
5. Videos get shareable links
6. Others can view videos

**Status:** MVP phase - infrastructure ready, but webhook handler and video player not yet implemented.

**Next Priority:** Implement webhook payment handling so the payment flow actually works end-to-end.

