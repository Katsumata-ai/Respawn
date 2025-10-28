# Whop App Architecture - User Isolation & Upload Limits

## 🎯 Overview

This app uses **Whop SDK only** for user management and authentication. No Supabase needed for user data or limits.

## 🏗️ Architecture

### User Identification
- **Unique ID**: `userId` from Whop token (e.g., `user_Ve2VZURNg8fPy`)
- **Source**: Extracted from JWT token in production, or `whop-dev-user-token` in dev mode
- **Isolation**: All data is keyed by `userId` - complete isolation between users

### Free vs Premium Users
- **Whop API Check**: `checkUserHasPremiumAccess(userId)`
- **Method**: Calls Whop API to check if user has active membership for premium plan
- **Result**: `true` = Premium (unlimited uploads), `false` = Free (3 uploads)

### Upload Limits
- **Free Users**: 3 uploads per user
- **Premium Users**: Unlimited uploads
- **Storage**: In-memory cache with file persistence (`.upload-cache.json`)
- **Isolation**: Each user's count is stored separately by `userId`

## 📁 Key Files

### 1. `lib/whop/server.ts`
```typescript
// Check if user has premium access
const hasPremium = await checkUserHasPremiumAccess(userId);

// Get upload limit based on membership
const limit = await getUserUploadLimit(userId); // Returns 3 or 999999
```

### 2. `lib/whop/upload-tracker.ts`
```typescript
// Get user's current upload count
const count = getUserUploadCount(userId);

// Increment after successful upload
incrementUserUploadCount(userId);

// Reset (for testing)
resetUserUploadCount(userId);
```

### 3. `app/api/videos/route.ts`
- **POST**: Upload video
  - Verify token → Extract userId
  - Check Whop membership (free vs premium)
  - Check upload count against limit
  - Increment counter after successful upload
  
- **GET**: List user's videos
  - Verify token → Extract userId
  - Return only videos for that userId (from Supabase)

### 4. `app/api/user/status/route.ts`
- Returns user's premium status and upload count
- Used by frontend to display "X/3 videos uploaded"

## 🔄 Data Flow

### Upload Flow
```
1. User clicks "Upload"
   ↓
2. Frontend sends POST /api/videos with muxUrl
   ↓
3. Middleware extracts token → adds to headers
   ↓
4. API verifies token → extracts userId
   ↓
5. API checks Whop membership (free vs premium)
   ↓
6. If FREE: Check upload count from tracker
   ↓
7. If count < 3: Allow upload, increment counter
   ↓
8. If count >= 3: Return 403 "Limit reached"
```

### Status Check Flow
```
1. Frontend calls GET /api/user/status
   ↓
2. API verifies token → extracts userId
   ↓
3. API checks Whop membership
   ↓
4. API gets upload count from tracker
   ↓
5. Returns { hasPremium, uploadCount, uploadLimit }
   ↓
6. Frontend displays "2/3 videos uploaded"
```

## 🔐 User Isolation

### How It Works
- **Every API call** extracts `userId` from token
- **Every database query** filters by `userId`
- **Every counter** is keyed by `userId`
- **Result**: Users can ONLY see/modify their own data

### Example
```typescript
// User A (userId: user_123)
GET /api/videos → Returns only videos where user_id = user_123

// User B (userId: user_456)
GET /api/videos → Returns only videos where user_id = user_456

// Even if User B tries to access User A's data:
GET /api/videos?userId=user_123 → Still returns user_456's videos
// Because the API extracts userId from token, not from query params
```

## 📊 Upload Limits

### Storage
- **Location**: `.upload-cache.json` (in-memory with file persistence)
- **Format**: `Map<userId, { uploadCount, lastUploadDate }>`
- **Persistence**: Automatically saved to disk after each increment

### Example Cache
```json
[
  ["user_123", { "userId": "user_123", "uploadCount": 2, "lastUploadDate": "2025-10-28T..." }],
  ["user_456", { "userId": "user_456", "uploadCount": 0, "lastUploadDate": "2025-10-28T..." }]
]
```

## ✅ Verification

### Test User Isolation
```bash
npx ts-node scripts/test-user-isolation.ts
```

### Check Upload Counts
```bash
# View all users' upload counts
cat .upload-cache.json
```

## 🚀 Deployment

### Production
- Token comes from Whop iFrame SDK (in `x-whop-user-token` header)
- Middleware extracts and validates token
- All user data is isolated by userId

### Development
- Token comes from URL query param (`whop-dev-user-token`)
- Middleware extracts from referer URL
- Same isolation logic applies

## 🎓 Key Principles

1. **Trust Whop**: Whop manages authentication and membership
2. **Use userId**: Every operation is keyed by userId
3. **Isolate Data**: Filter all queries by userId
4. **No External DB**: Upload limits stored locally, not in Supabase
5. **Stateless**: Each request is independent, no session state

## 📝 Notes

- Supabase is still used for **video storage** (videos table)
- Supabase is NOT used for **user management** or **limits**
- Upload limits are stored in-memory with file persistence
- For production scale, consider Redis instead of file persistence

