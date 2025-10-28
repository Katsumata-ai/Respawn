# 🎬 Whop App - Course Downloader Guide

## 📋 TABLE OF CONTENTS
1. [App Overview](#app-overview)
2. [Whop App Requirements](#whop-app-requirements)
3. [How to Deploy to Whop](#how-to-deploy-to-whop)
4. [Approval Checklist](#approval-checklist)
5. [Architecture](#architecture)
6. [Debugging](#debugging)

---

## 🎯 APP OVERVIEW

**Course Downloader** is a Whop App that allows community members to:
- Download course videos from Mux URLs
- Store videos permanently in Supabase Storage
- Share videos via secure shareable links
- Track download statistics

**Payment Model**: €10 one-time fee (unlimited access)

---

## ✅ WHOP APP REQUIREMENTS

### 1. **App Configuration**
```
App Name: Course Downloader
App ID: app_FgzHqoGCTn-h4zFJdorsIII
Base URL: https://your-vercel-url.vercel.app
Payment Model: One-time fee (€10)
```

### 2. **Required Permissions**
```typescript
requestedPermissions: [
  {
    action: "read_user",
    isRequired: true,
    justification: "To identify and track user downloads"
  },
  {
    action: "read_memberships",
    isRequired: true,
    justification: "To verify user has paid for access"
  },
  {
    action: "write_data",
    isRequired: false,
    justification: "To store download statistics"
  }
]
```

### 3. **App Views**
- **Experience View**: Main app interface (video downloader)
- **Dashboard View**: Analytics and statistics
- **Discover View**: App preview in marketplace

### 4. **Webhooks**
- `payment.completed` - When user pays €10
- `payment.refunded` - When payment is refunded
- `user.removed` - When user leaves community

---

## 🚀 HOW TO DEPLOY TO WHOP

### Step 1: Deploy to Vercel
```bash
cd /Users/amenefzi/Projects/WhopApp1
vercel deploy --prod
```

### Step 2: Update Whop Dashboard
1. Go to https://whop.com/dashboard
2. Select your app "Course Downloader"
3. Update **Base URL** to your Vercel URL
4. Update **Dev URL** for local testing

### Step 3: Configure Payment
1. Go to **Access Pass** settings
2. Set price to €10
3. Set as **One-time fee** (not subscription)
4. Enable **Marketplace** listing

### Step 4: Test Installation
1. Go to your community
2. Click "Add App"
3. Select "Course Downloader"
4. Complete payment flow
5. Verify app loads correctly

---

## ✅ APPROVAL CHECKLIST

Before submitting to Whop Marketplace:

- [ ] App loads without errors
- [ ] User authentication works
- [ ] Payment verification works
- [ ] Video download functionality works
- [ ] No console errors
- [ ] Responsive design (mobile + desktop)
- [ ] All links work
- [ ] Privacy policy included
- [ ] Terms of service included
- [ ] Support contact provided
- [ ] App icon uploaded (512x512px)
- [ ] App description clear and accurate
- [ ] No external dependencies on AWS/paid services
- [ ] Supabase Storage configured
- [ ] Webhooks tested

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────┐
│      WHOP COMMUNITY (User pays €10)     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    NEXT.JS APP (Vercel)                 │
│  ┌─────────────────────────────────────┐│
│  │ Frontend: React 19 + Tailwind       ││
│  │ - Video Extractor UI                ││
│  │ - Download Manager                  ││
│  │ - Analytics Dashboard               ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ Backend: Next.js API Routes         ││
│  │ - /api/videos (CRUD)                ││
│  │ - /api/whop/user (Auth)             ││
│  │ - /api/whop/validate-access         ││
│  │ - /api/webhooks/whop (Payments)     ││
│  └─────────────────────────────────────┘│
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌──────────────┐
   │Supabase │      │Supabase      │
   │Database │      │Storage       │
   │(Metadata)      │(Videos)      │
   └─────────┘      └──────────────┘
```

---

## 🐛 DEBUGGING

### Hydration Mismatch Error
**Cause**: Browser extensions adding attributes to HTML
**Fix**: Added `suppressHydrationWarning` to `<html>` and `<body>` tags

### Payment Not Verifying
**Check**:
1. Verify webhook is receiving payment events
2. Check user has `has_paid = true` in database
3. Verify access token is valid

### Video Download Failing
**Check**:
1. Mux URL is valid and accessible
2. Supabase Storage bucket has correct permissions
3. User has sufficient storage quota

---

## 📞 SUPPORT

For issues or questions:
- Email: support@example.com
- Discord: [Your Discord]
- GitHub: [Your GitHub]

