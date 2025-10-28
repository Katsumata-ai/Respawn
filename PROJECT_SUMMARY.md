# Course Downloader - Project Summary

## 📋 Project Overview

**Course Downloader** is a Whop App that allows users to download and manage course videos from Mux streams.

### Key Features
- ✅ Extract Mux video URLs from browser
- ✅ Upload videos with metadata
- ✅ Generate shareable links
- ✅ Track views and downloads
- ✅ One-time €10 payment model
- ✅ Supabase database integration
- ✅ Vercel deployment ready

## 🏗️ Architecture

### MVVM Pattern
```
Models (app/models/)
  ↓
ViewModels (app/viewmodels/)
  ↓
Views (app/views/)
  ↓
API Routes (app/api/)
```

### Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Payment**: Whop (€10 one-time fee)
- **Styling**: Tailwind CSS

## 📁 Project Structure

```
whop-downloader/
├── app/
│   ├── models/              # Data models
│   ├── viewmodels/          # Business logic
│   ├── views/               # React components
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilities & constants
│   ├── api/                 # API routes
│   ├── page.tsx             # Main page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── lib/
│   ├── supabase/            # Supabase client & service
│   └── whop/                # Whop SDK client
├── supabase/
│   └── migrations/          # Database migrations
├── public/                  # Static assets
├── .env.local               # Environment variables
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── next.config.ts           # Next.js config
├── vercel.json              # Vercel config
└── SETUP.md                 # Setup instructions
```

## 🔑 Key Files

### Configuration
- `.env.local` - Environment variables
- `vercel.json` - Vercel deployment config
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration

### Core Logic
- `app/models/Video.ts` - Video data model
- `app/viewmodels/VideoViewModel.ts` - Business logic
- `app/views/VideoExtractor.tsx` - Main UI component
- `lib/supabase/service.ts` - Database operations

### API Routes
- `app/api/videos/route.ts` - Create/list videos
- `app/api/videos/[shareableId]/route.ts` - Get video by ID
- `app/api/whop/user/route.ts` - Get current user
- `app/api/whop/validate-access/route.ts` - Validate access

### Database
- `supabase/migrations/001_create_tables.sql` - Database schema

## 🚀 Getting Started

### 1. Setup Environment
```bash
cd /Users/amenefzi/Projects/whop-downloader
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Supabase
- Create project at https://supabase.com
- Run migration SQL
- Add credentials to `.env.local`

### 4. Run Locally
```bash
npm run dev
# Visit http://localhost:3000
```

### 5. Deploy to Vercel
```bash
vercel deploy
```

## 📊 Database Schema

### videos table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `shareable_id` (VARCHAR) - Unique shareable link
- `title` (VARCHAR) - Video title
- `mux_url` (VARCHAR) - Original Mux URL
- `s3_url` (VARCHAR) - Permanent S3 URL
- `view_count` (INT) - Number of views
- `download_count` (INT) - Number of downloads
- `created_at` (TIMESTAMP) - Creation date
- `updated_at` (TIMESTAMP) - Last update

### video_accesses table
- `id` (UUID) - Primary key
- `video_id` (UUID) - Foreign key to videos
- `user_id` (UUID) - Accessor
- `access_type` (VARCHAR) - 'view' or 'download'
- `accessed_at` (TIMESTAMP) - Access time
- `ip_address` (VARCHAR) - IP address

## 💰 Payment Model

**One-Time €10 Fee**
- Users pay once for unlimited access
- No recurring charges
- Integrated with Whop payment system

## 🔐 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS) ready
- API validation for all inputs
- CORS configuration for Whop

## 📈 Next Steps

1. **Configure Supabase**
   - Create project
   - Run migrations
   - Add credentials

2. **Setup Whop Payment**
   - Configure payment model
   - Set up webhooks
   - Test payment flow

3. **Implement Video Processing**
   - Add Bull queue for background jobs
   - Implement yt-dlp integration
   - Setup S3 storage

4. **Add Analytics**
   - Track user behavior
   - Monitor video performance
   - Generate reports

5. **Deploy to Production**
   - Deploy to Vercel
   - Configure custom domain
   - Monitor performance

## 📞 Support

For issues or questions:
1. Check SETUP.md for setup instructions
2. Check SUPABASE_SETUP.md for database setup
3. Check WHOP_SETUP.md for Whop configuration
4. Check DEPLOYMENT.md for deployment guide

