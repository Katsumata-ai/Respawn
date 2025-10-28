# 🏦 WHOP PAYMENT SYSTEM - COMPLETE GUIDE

Full breakdown of the Whop payment processor, how to set it up in dev/production, and how to debug issues.

---

## 📋 EXECUTIVE SUMMARY

**Current Status:** ⚠️ **PARTIALLY IMPLEMENTED**

The webhook system is already in your code but needs configuration:

| Component | Status | Priority |
|-----------|--------|----------|
| Webhook route | ✅ Implemented | - |
| Signature verification | ✅ Implemented | ✅ |
| User table | ✅ Exists | - |
| Payment marking | ✅ Implemented | - |
| Webhook secret storage | ❌ Missing | 🔴 CRITICAL |
| ngrok setup | ❌ Missing | 🔴 CRITICAL (dev) |
| Production URL config | ❌ Missing | 🔴 CRITICAL |
| Testing procedure | ❌ Missing | 🟠 HIGH |

---

## 🏗️ PAYMENT SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│              WHOP COMMUNITY (User pays €10)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (Sends webhook)
┌─────────────────────────────────────────────────────────────┐
│  POST /api/webhooks/whop                                    │
│  ├─ Receives: { type, data, timestamp, ... }               │
│  ├─ Headers: x-whop-signature (HMAC-SHA256)               │
│  └─ Body: Raw JSON (for signature verification)            │
└────────┬──────────────────────────────────────────────────┘
         │
         ▼ (Step 1)
┌─────────────────────────────────────────────────────────────┐
│  Verify Webhook Signature                                   │
│  ├─ Get secret from environment: WHOP_WEBHOOK_SECRET       │
│  ├─ Create HMAC-SHA256(body, secret)                       │
│  ├─ Compare with x-whop-signature header                   │
│  └─ Reject if mismatch (401 Unauthorized)                  │
└────────┬──────────────────────────────────────────────────┘
         │
         ▼ (Step 2)
┌─────────────────────────────────────────────────────────────┐
│  Parse Event Type                                           │
│  ├─ payment.completed ← Process payment                    │
│  ├─ payment.refunded ← Reverse payment                     │
│  └─ other events ← Ignore                                  │
└────────┬──────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────────────────────────┐ ┌──────────────────────────┐
│ PAYMENT COMPLETED           │ │ PAYMENT REFUNDED         │
│ ├─ Extract customer_id      │ │ ├─ Extract customer_id   │
│ ├─ Check if user exists     │ │ ├─ Find user in DB       │
│ ├─ If not: create new       │ │ └─ Set has_paid = false  │
│ ├─ Update has_paid = true   │ └──────────────────────────┘
│ ├─ Set payment_date         │
│ └─ Set unlimited access     │
└────────┬────────────────────┘
         │
         ▼ (Step 3)
┌─────────────────────────────────────────────────────────────┐
│  Update Database (Supabase)                                 │
│  ├─ users table: has_paid = true                           │
│  ├─ users table: payment_date = NOW()                      │
│  └─ user_limits: unlimited access                          │
└────────┬──────────────────────────────────────────────────┘
         │
         ▼ (Step 4)
┌─────────────────────────────────────────────────────────────┐
│  Return 200 OK                                              │
│  ├─ Whop marks as delivered ✅                             │
│  └─ No retry needed                                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (Next login)
┌─────────────────────────────────────────────────────────────┐
│  User Accesses App                                          │
│  ├─ GET /api/whop/validate-access                          │
│  ├─ Query: SELECT has_paid FROM users WHERE whop_user_id   │
│  ├─ Result: has_paid = true ✅                             │
│  └─ User can download videos                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 KEY ENDPOINTS

### 1. GET /api/whop/validate-access
**Purpose:** Check if user has paid

```typescript
Request:
├─ Headers: x-whop-user-token (JWT from Whop)
└─ No body

Response (200):
{
  "hasAccess": true,
  "accessLevel": "customer"
}

Response (403 - Not paid):
{
  "hasAccess": false,
  "accessLevel": "no_access"
}

Response (401 - No token):
{
  "hasAccess": false,
  "accessLevel": "no_access"
}

Flow:
1. Extract JWT token from headers
2. Decode JWT (get userId)
3. Query users table
4. Check: has_paid = true
5. Return result
```

### 2. POST /api/webhooks/whop
**Purpose:** Receive payment events from Whop

```typescript
Webhook Payload:
{
  "type": "payment.completed",
  "data": {
    "id": "payment_123",
    "customer_id": "user_abc123",
    "product_id": "prod_123",
    "amount": 1000  // in cents (€10.00)
  },
  "timestamp": 1629907200
}

Headers:
├─ Content-Type: application/json
├─ x-whop-signature: sha256_hex (HMAC verification)
└─ x-whop-delivery-id: unique delivery ID

Response (200 - Success):
{
  "ok": true,
  "userId": "uuid"
}

Response (401 - Invalid signature):
{
  "error": "Invalid signature"
}

Response (500 - Server error):
{
  "error": "Internal server error"
}
```

### 3. GET /api/whop/user
**Purpose:** Get current user info

```typescript
Request:
├─ Headers: x-whop-user-token (JWT)
└─ No body

Response (200):
{
  "id": "user_abc123",
  "email": "user_abc123@whop.local",
  "username": "user_abc123",
  "profilePicUrl": null
}

Response (401 - No token):
{
  "error": "Unauthorized - No valid Whop token"
}

Side effects:
- Upserts user in database
- Creates user if doesn't exist
```

---

## 🔐 JWT TOKEN STRUCTURE

### Token Format

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyIsImFwcElkIjoiYXBwXzEyMyIsImlhdCI6MTYyOTkwNzIwMCwiZXhwIjoxNjI5OTEwODAwfQ.signature

Parts:
├─ Header: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
│  └─ {"alg":"HS256","typ":"JWT"}
│
├─ Payload: eyJ1c2VySWQiOiJ1c2VyXzEyMyIsImFwcElkIjoiYXBwXzEyMyIsImlhdCI6MTYyOTkwNzIwMCwiZXhwIjoxNjI5OTEwODAwfQ
│  └─ {
│       "userId": "user_123",
│       "appId": "app_123",
│       "iat": 1629907200,
│       "exp": 1629910800
│     }
│
└─ Signature: signature
   └─ HMAC-SHA256(header.payload, secret)
```

### Decoded Payload

```json
{
  "userId": "user_abc123xyz",      // ← USE THIS for database
  "appId": "app_FgzHqoGCTn-h4zFJdorsIII",
  "iat": 1629907200,               // Issued at
  "exp": 1629910800                // Expires in 1 hour
}
```

### Token Lifecycle

```
1. User logs into Whop community
2. Whop creates JWT token
3. JWT sent to your app in header: x-whop-user-token
4. Your app decodes JWT (without verification currently)
5. Token expires after 1 hour
6. User gets new token on next request
```

---

## 🛠️ SETUP GUIDE

### Part 1: Local Development Setup (with ngrok)

#### Step 1: Install ngrok

```bash
# macOS
brew install ngrok

# Linux
wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
unzip ngrok-stable-linux-amd64.zip
sudo mv ngrok /usr/local/bin

# Windows
# Download from https://ngrok.com/download
```

#### Step 2: Create ngrok Account

```bash
1. Go to https://ngrok.com/
2. Sign up (free)
3. Get authtoken
4. Run: ngrok authtoken YOUR_TOKEN
```

#### Step 3: Start Local Dev Server

```bash
# Terminal 1: Run Next.js dev server
npm run dev
# Runs on http://localhost:3000
```

#### Step 4: Start ngrok Tunnel

```bash
# Terminal 2: Create tunnel to localhost:3000
ngrok http 3000

# Output:
# Forwarding    https://abc123.ngrok.io -> http://localhost:3000
# Copy this URL: https://abc123.ngrok.io
```

#### Step 5: Configure Webhook in Whop Dashboard

```
1. Go to https://whop.com/dashboard/developer
2. Select your app "Course Downloader"
3. Click "Webhooks"
4. Click "Create webhook"
5. Enter endpoint URL: https://abc123.ngrok.io/api/webhooks/whop
6. Select events:
   ├─ payment.completed ✅
   └─ payment.refunded ✅
7. Click "Save"
8. Copy webhook secret
```

#### Step 6: Store Webhook Secret in .env.local

```bash
# .env.local (local development only)
WHOP_WEBHOOK_SECRET=whsec_abc123xyz456...

# Get the secret from Whop dashboard
# Click the webhook you created
# Click copy secret
```

#### Step 7: Test Locally

```bash
1. In Whop dashboard, go to Webhooks
2. Find your webhook
3. Click the "..." menu
4. Select "Send test event"
5. Choose "payment.completed"
6. Click "Send"
7. Check terminal: should see webhook processed
```

---

### Part 2: Production Setup (Vercel)

#### Step 1: Get Production Webhook Secret

```
1. Go to https://whop.com/dashboard/developer
2. Select your app
3. Click "Webhooks"
4. Your webhook should already exist from dev setup
5. Update endpoint URL: https://your-app.vercel.app/api/webhooks/whop
6. Copy the webhook secret (same as dev)
```

#### Step 2: Set Production Environment Variable

```bash
# Using Vercel CLI
vercel env add WHOP_WEBHOOK_SECRET

# Or via web dashboard:
1. Go to https://vercel.com/dashboard
2. Select project "WhopApp1"
3. Go to "Settings" → "Environment Variables"
4. Add:
   Name: WHOP_WEBHOOK_SECRET
   Value: whsec_abc123xyz456...
   Environments: Production
5. Click "Save"
6. Redeploy: git push origin main
```

#### Step 3: Configure Production Webhook

```
1. Go to https://whop.com/dashboard/developer
2. Select your app
3. Click "Webhooks"
4. Edit your webhook
5. Change endpoint URL to: https://your-app.vercel.app/api/webhooks/whop
6. Keep events: payment.completed, payment.refunded
7. Click "Save"
```

#### Step 4: Test Production

```
1. Deploy to Vercel: git push origin main
2. Verify deployment successful
3. In Whop dashboard, send test webhook
4. Check production logs: vercel logs
5. Should see: "Webhook processed successfully"
```

---

## 🐛 DEBUGGING GUIDE

### Problem 1: Webhook Not Being Received

**Symptoms:**
- Webhook marked as "failed" in Whop dashboard
- User pays but `has_paid` not updated

**Debugging Steps:**

```bash
# 1. Check ngrok tunnel is running
ps aux | grep ngrok
# Should see: ngrok http 3000

# 2. Check ngrok URL is correct
# Terminal output should show the forwarding URL
# Example: https://abc123.ngrok.io

# 3. Verify webhook URL in Whop dashboard
# Should match: https://abc123.ngrok.io/api/webhooks/whop

# 4. Check .env.local has webhook secret
cat .env.local | grep WHOP_WEBHOOK_SECRET

# 5. Send test webhook from Whop dashboard
# Watch terminal for output

# 6. Check next.js terminal for errors
# Should see: "Whop webhook event: payment.completed"
```

**Common Causes:**
- ❌ ngrok not running
- ❌ Wrong endpoint URL in webhook config
- ❌ ngrok tunnel expired (restart ngrok)
- ❌ Webhook secret not in .env.local
- ❌ Firewall blocking webhook

### Problem 2: "Invalid Webhook Signature"

**Symptoms:**
- Webhook returns 401
- Error: "Invalid webhook signature"

**Debugging Steps:**

```bash
# 1. Verify webhook secret is correct
echo $WHOP_WEBHOOK_SECRET

# 2. Check it matches Whop dashboard
# Go to: https://whop.com/dashboard/developer
# App → Webhooks → View secret

# 3. If mismatch, update .env.local
# Or create new webhook and copy new secret

# 4. Restart dev server
npm run dev

# 5. Send test webhook again
```

**Root Causes:**
- ❌ Wrong webhook secret in .env.local
- ❌ Webhook secret corrupted/pasted wrong
- ❌ Using old webhook secret
- ❌ Environment variable not loaded

### Problem 3: Payment Marked But User Sees "Access Required"

**Symptoms:**
- Webhook processed successfully
- Database shows `has_paid = true`
- User still sees "Access Required"

**Debugging Steps:**

```bash
# 1. Check JWT token is being sent
# In browser DevTools → Network → page request
# Look for header: x-whop-user-token

# 2. Check token contains correct userId
# Decode at: https://jwt.io/
# Should match user created in Supabase

# 3. Verify user was created in database
# Go to Supabase dashboard
# users table → filter by whop_user_id
# Check has_paid = true

# 4. Test /api/whop/validate-access manually
curl -H "x-whop-user-token: YOUR_TOKEN" \
  http://localhost:3000/api/whop/validate-access

# 5. Check app/page.tsx logic
# Verify it calls validateAccess on load
# Verify it sets hasAccess state correctly
```

**Root Causes:**
- ❌ Token not being sent by Whop
- ❌ Token expired (> 1 hour)
- ❌ Wrong userId in token
- ❌ Webhook didn't complete (check logs)
- ❌ Database query error
- ❌ Frontend not checking hasAccess state

### Problem 4: Database Insert Error on Webhook

**Symptoms:**
- Webhook returns 500
- Error: "Failed to create user"

**Debugging Steps:**

```bash
# 1. Check Supabase connection
# .env.local should have:
cat .env.local | grep SUPABASE

# 2. Check users table exists
# Supabase Dashboard → SQL Editor
SELECT * FROM users;
# Should work without error

# 3. Check table schema
# Should have columns:
# - id (UUID, PK)
# - whop_user_id (VARCHAR, UNIQUE)
# - has_paid (BOOLEAN)
# - payment_date (TIMESTAMP)
# - email (VARCHAR, optional)

# 4. Check RLS policies
# Supabase → Authentication → Policies
# Should allow INSERT/UPDATE on users table

# 5. Look at full error message
# Check terminal for detailed error
# Check Supabase logs
```

**Root Causes:**
- ❌ Supabase credentials wrong in .env.local
- ❌ users table doesn't exist (need migration)
- ❌ RLS policy prevents writes
- ❌ Duplicate whop_user_id (unique constraint)
- ❌ Network error to Supabase

### Problem 5: Webhook Retried Multiple Times

**Symptoms:**
- Same webhook received 3+ times
- Duplicate entries in database

**Debugging Steps:**

```bash
# 1. Check response status code
# Webhook must return 200-299 to stop retries
# Check your /api/webhooks/whop returns 200

# 2. Check for infinite loops
# Make sure webhook doesn't process forever
# Should complete in < 5 seconds

# 3. Check for database transaction issues
# If INSERT fails halfway, webhook retried
# Make sure transactions are atomic

# 4. Check Whop webhook delivery log
# Whop dashboard → Webhooks → Your webhook
# View delivery history
# See exactly what failed
```

**Root Causes:**
- ❌ Not returning 200 status
- ❌ Error thrown during processing
- ❌ Process times out
- ❌ Network connectivity issues

---

## 📊 WEBHOOK EVENTS REFERENCE

### payment.completed

```json
{
  "type": "payment.completed",
  "timestamp": 1629907200,
  "data": {
    "id": "payment_abc123",
    "customer_id": "user_abc123",      // ← USE THIS
    "product_id": "prod_xyz789",       // Your app ID
    "amount": 1000,                    // cents (€10.00)
    "currency": "EUR",
    "status": "completed",
    "created_at": "2024-10-26T10:30:00Z"
  }
}
```

**What to do:**
1. Extract `customer_id` (user identifier in Whop)
2. Check if user exists in your database
3. If not: create new user with `has_paid = true`
4. If yes: update user with `has_paid = true`
5. Return 200 OK

### payment.refunded

```json
{
  "type": "payment.refunded",
  "timestamp": 1629907300,
  "data": {
    "id": "payment_abc123",
    "customer_id": "user_abc123",
    "amount": 1000,
    "reason": "user_requested",
    "created_at": "2024-10-26T10:35:00Z"
  }
}
```

**What to do:**
1. Extract `customer_id`
2. Find user in database
3. Set `has_paid = false`
4. Reset any limits to default
5. Return 200 OK

---

## 🔍 MONITORING & LOGGING

### What to Log

```typescript
// Good logging in webhook handler:

console.log('Webhook received:', {
  type: event.type,
  customerId: event.data.customer_id,
  amount: event.data.amount,
  timestamp: new Date().toISOString()
});

console.log('Processing payment:', {
  userId: customer_id,
  action: 'creating new user' | 'updating existing'
});

console.log('Payment processed:', {
  userId: finalUserId,
  hasAccess: true,
  timestamp: new Date().toISOString()
});
```

### Setup Production Monitoring

```bash
# Option 1: Use Sentry for error tracking
npm install @sentry/nextjs

# Configure in next.config.js
withSentryConfig(...)

# Option 2: Use Vercel logs
vercel logs <project-name>

# Option 3: Custom webhook delivery tracking
# Create table: webhook_deliveries
# Log all webhook attempts
# Query to find failed deliveries
```

### Create Webhook Delivery Log Table

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type VARCHAR NOT NULL,
  customer_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  processed_at TIMESTAMP DEFAULT NOW(),
  delivery_id VARCHAR -- From x-whop-delivery-id header
);

CREATE INDEX idx_webhook_deliveries_customer_id 
  ON webhook_deliveries(customer_id);
CREATE INDEX idx_webhook_deliveries_status 
  ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_processed_at 
  ON webhook_deliveries(processed_at);
```

---

## ✅ CHECKLIST FOR PRODUCTION

### Before Going Live

- [ ] Webhook route implemented (already done ✅)
- [ ] Webhook secret stored in Vercel env vars
- [ ] Webhook URL updated to production domain
- [ ] Webhook events configured (payment.completed, payment.refunded)
- [ ] users table created in Supabase
- [ ] users table has all required columns
- [ ] RLS policies allow webhook writes
- [ ] JWT token verification working
- [ ] /api/whop/validate-access working
- [ ] /api/whop/user working
- [ ] Local testing with ngrok passed
- [ ] Production deployment tested
- [ ] Webhook test event sent to production
- [ ] User database correctly updated
- [ ] /api/whop/validate-access returns correct access status
- [ ] Error logging setup
- [ ] Team notified of webhook endpoint
- [ ] Monitoring alerts configured

### Deployment Steps

```bash
# 1. Update webhook URL in Whop dashboard
https://your-app.vercel.app/api/webhooks/whop

# 2. Set env var in Vercel
vercel env add WHOP_WEBHOOK_SECRET

# 3. Deploy
git push origin main

# 4. Verify deployment
vercel deploy --prod

# 5. Test webhook
# Send test event from Whop dashboard
# Verify user created in Supabase
# Verify access check returns correct status

# 6. Monitor for 24 hours
# Watch Vercel logs
# Check webhook deliveries in Whop dashboard
# Monitor error rates
```

---

## 🚨 COMMON MISTAKES

### ❌ Mistake 1: Not Returning 200 Quickly

```typescript
// BAD - Webhook will retry
export async function POST(request: NextRequest) {
  const event = await request.json();
  
  // Long operations here
  await heavyProcessing();
  await anotherHeavyTask();
  
  return NextResponse.json({ ok: true });
  // Too slow! Webhook times out
}

// GOOD - Return 200 immediately
export async function POST(request: NextRequest) {
  const event = await request.json();
  
  // Return success immediately
  queueLongOperations(event); // Queue for background processing
  
  return NextResponse.json({ ok: true }, { status: 200 });
}
```

### ❌ Mistake 2: Not Verifying Signature

```typescript
// BAD - Anyone can send webhook
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customer_id } = body;
  
  // Mark user as paid without verification!
  await markUserAsPaid(customer_id);
  
  return NextResponse.json({ ok: true });
  // Security hole!
}

// GOOD - Always verify
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-whop-signature');
  
  // Verify before processing
  const hash = crypto.createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  if (hash !== signature) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }
  
  // Now process
}
```

### ❌ Mistake 3: Assuming User Exists

```typescript
// BAD - Crashes if user doesn't exist
export async function POST(request: NextRequest) {
  const { customer_id } = event.data;
  
  const user = await supabase
    .from('users')
    .select('*')
    .eq('whop_user_id', customer_id)
    .single(); // Crashes if not found!
  
  return NextResponse.json({ ok: true });
}

// GOOD - Handle both cases
export async function POST(request: NextRequest) {
  const { customer_id } = event.data;
  
  // Check if exists
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('id')
    .eq('whop_user_id', customer_id)
    .single();
  
  if (error && error.code === 'PGRST116') {
    // User doesn't exist - create new
    await supabase.from('users').insert({
      whop_user_id: customer_id,
      has_paid: true,
      payment_date: new Date().toISOString()
    });
  } else if (!error) {
    // User exists - update
    await supabase
      .from('users')
      .update({ has_paid: true })
      .eq('id', existingUser.id);
  } else {
    // Some other error
    throw error;
  }
}
```

### ❌ Mistake 4: Hardcoding Webhook Secret

```typescript
// BAD - Secret in code!
const WEBHOOK_SECRET = 'whsec_abc123xyz';

// GOOD - From environment
const WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error('WHOP_WEBHOOK_SECRET not configured');
}
```

---

## 📞 QUICK REFERENCE

### Production Checklist (5 mins)

```
1. Webhook URL set to: https://your-app.vercel.app/api/webhooks/whop
2. Webhook secret in Vercel env vars
3. Deployed to production
4. Test webhook sent and received
5. Database updated correctly
```

### Local Dev Checklist (10 mins)

```
1. ngrok running: ngrok http 3000
2. Webhook URL set to: https://abc123.ngrok.io/api/webhooks/whop
3. Webhook secret in .env.local
4. npm run dev started
5. Test webhook sent from dashboard
6. Check terminal for success message
```

### Debug Checklist (When Issues Occur)

```
1. Webhook running? Check ngrok/production URL
2. Secret correct? Check .env.local or Vercel
3. Database working? Test query directly
4. Token valid? Check x-whop-user-token header
5. Logs available? Check terminal/Vercel logs
```

---

## 🎓 SUMMARY

**The System:**
- Whop sends webhook when user pays
- You verify signature for security
- Update user in database
- User can now access app

**Three Steps to Production:**
1. Set webhook secret in Vercel
2. Update webhook URL to your domain
3. Deploy and test

**Debugging:**
- Check ngrok/URL
- Verify webhook secret
- Look at logs
- Test with Whop's test event

**Key Files:**
- `app/api/webhooks/whop/route.ts` - Webhook handler
- `lib/whop/server.ts` - Helper functions
- `app/api/whop/validate-access/route.ts` - Access check

**Status:**
✅ Everything is already implemented!
❌ Just needs configuration (webhook secret + URL)

---

**Last Updated:** October 26, 2024
**Status:** Ready for production setup

