# 🔧 WHOP PAYMENT DEBUGGING TOOLKIT

Complete debugging guide with commands, tools, and problem-solving strategies.

---

## 🎯 QUICK DIAGNOSIS (2 mins)

Run this command to see your current setup status:

```bash
#!/bin/bash
# Copy this into: debug-whop.sh

echo "=== WHOP PAYMENT SYSTEM DIAGNOSIS ==="
echo ""

echo "1. Environment Variables:"
if grep -q "WHOP_WEBHOOK_SECRET" .env.local 2>/dev/null; then
  echo "   ✅ WHOP_WEBHOOK_SECRET found in .env.local"
  echo "   Value: $(grep WHOP_WEBHOOK_SECRET .env.local | cut -d'=' -f2 | head -c 20)..."
else
  echo "   ❌ WHOP_WEBHOOK_SECRET NOT found in .env.local"
fi
echo ""

echo "2. Webhook Route:"
if [ -f "app/api/webhooks/whop/route.ts" ]; then
  echo "   ✅ Webhook route exists"
else
  echo "   ❌ Webhook route NOT found"
fi
echo ""

echo "3. Supabase Connection:"
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local 2>/dev/null; then
  echo "   ✅ Supabase configured"
else
  echo "   ❌ Supabase NOT configured"
fi
echo ""

echo "4. Server Functions:"
if grep -q "markUserAsPaid" lib/whop/server.ts 2>/dev/null; then
  echo "   ✅ Payment marking function exists"
else
  echo "   ❌ Payment marking function NOT found"
fi
echo ""

echo "5. Database Tables:"
echo "   Check Supabase dashboard for:"
echo "   - users table (has: whop_user_id, has_paid, payment_date)"
echo "   - user_limits table (optional)"
echo ""

echo "=== STATUS ==="
if [ -f "app/api/webhooks/whop/route.ts" ] && grep -q "WHOP_WEBHOOK_SECRET" .env.local 2>/dev/null; then
  echo "✅ Basic setup is READY"
  echo "   Next: Get webhook secret and configure in Whop dashboard"
else
  echo "❌ Setup INCOMPLETE"
  echo "   Next: Review setup guide"
fi
```

Run it:
```bash
chmod +x debug-whop.sh
./debug-whop.sh
```

---

## 🔍 DEEP DIAGNOSTICS

### Diagnostic 1: Check JWT Token

```bash
# In browser console (DevTools → Console)
# Run this to see your JWT token:

fetch('/api/whop/user')
  .then(r => r.json())
  .then(data => console.log('User:', data))

# Should output:
# User: {
#   id: "user_abc123",
#   email: "user_abc123@whop.local",
#   username: "user_abc123"
# }

# If 401: JWT token not being sent by Whop
# If 500: Supabase connection error
```

### Diagnostic 2: Decode JWT Token

```bash
# In browser console:
# Get the JWT from storage or headers

# Method 1: Check headers
fetch('/api/whop/user')
  .then(r => {
    console.log('Headers:', r.headers);
    console.log('Status:', r.status);
    return r.json();
  })

# Method 2: Manually check x-whop-user-token
# In Network tab, click API request
# Headers → x-whop-user-token
# Copy value

# Decode at: https://jwt.io/
# Paste the token to see:
# - userId
# - appId
# - iat/exp
```

### Diagnostic 3: Test Webhook Endpoint

```bash
# Create test-webhook.js:

const crypto = require('crypto');
const secret = process.env.WHOP_WEBHOOK_SECRET;

// Example webhook body
const body = JSON.stringify({
  type: 'payment.completed',
  data: {
    customer_id: 'test_user_123',
    product_id: 'prod_test',
    amount: 1000
  }
});

// Create signature
const signature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

console.log('Body:', body);
console.log('Signature:', signature);
console.log('Header to send: x-whop-signature: ' + signature);

// Test locally:
// curl -X POST http://localhost:3000/api/webhooks/whop \
//   -H "Content-Type: application/json" \
//   -H "x-whop-signature: $signature" \
//   -d '$body'
```

### Diagnostic 4: Check Database Directly

```bash
# Supabase Dashboard → SQL Editor

-- Check users table
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- Check specific user
SELECT * FROM users WHERE whop_user_id = 'user_abc123';

-- Check user limits
SELECT u.whop_user_id, ul.* FROM users u
LEFT JOIN user_limits ul ON u.id = ul.user_id
ORDER BY u.created_at DESC LIMIT 5;

-- Check webhooks (if you created table)
SELECT * FROM webhook_deliveries ORDER BY processed_at DESC LIMIT 10;

-- Count total payments
SELECT COUNT(*) as total_payments FROM users WHERE has_paid = true;
```

### Diagnostic 5: Monitor Live Webhooks

```bash
# Terminal 1: Watch logs
vercel logs your-project-name --follow

# Terminal 2: Send test webhook
# From Whop dashboard: Send test event

# Terminal 1 should show:
# [timestamp] Whop webhook event: payment.completed
# [timestamp] Processing payment for customer: ...
# [timestamp] ✅ Payment processed successfully
```

---

## 🛠️ DEBUGGING TOOLS

### Tool 1: ngrok Debugging

```bash
# Monitor ngrok tunnel
# In ngrok terminal, you see all requests in real-time

# Also access ngrok web interface:
# http://localhost:4040/

# Shows:
# - All requests sent through tunnel
# - Response status codes
# - Request/response headers
# - Full request body
# - Timing information
```

### Tool 2: Network Monitoring (Browser DevTools)

```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: api
4. Make a request
5. Click the request
6. View:
   - Request headers (x-whop-user-token)
   - Request body
   - Response status
   - Response body
   - Timing
```

### Tool 3: Local Webhook Testing

```bash
# Create test script: test-webhook.sh

#!/bin/bash

WEBHOOK_SECRET=$(grep WHOP_WEBHOOK_SECRET .env.local | cut -d'=' -f2)
BODY='{"type":"payment.completed","data":{"customer_id":"test_user_123","product_id":"prod_test","amount":1000}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)

echo "Testing webhook..."
echo "Secret: ${WEBHOOK_SECRET:0:20}..."
echo "Signature: $SIGNATURE"

curl -X POST http://localhost:3000/api/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "x-whop-signature: $SIGNATURE" \
  -d "$BODY" \
  -v

# Run it:
chmod +x test-webhook.sh
./test-webhook.sh
```

### Tool 4: Database Query Tool

```bash
# Install Supabase CLI:
npm install -g supabase

# Or use Supabase Dashboard web interface:
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. SQL Editor
# 4. Write and run queries
# 5. See results instantly

# Useful queries:

-- Find user by ID
SELECT * FROM users WHERE whop_user_id = 'user_abc123';

-- Find recent payments
SELECT * FROM users WHERE has_paid = true ORDER BY payment_date DESC LIMIT 10;

-- Check webhook attempts
SELECT * FROM webhook_deliveries WHERE status = 'failed' ORDER BY processed_at DESC;

-- Count unpaid vs paid
SELECT 
  has_paid, 
  COUNT(*) as count 
FROM users 
GROUP BY has_paid;
```

---

## 📋 STEP-BY-STEP DEBUGGING PROCESS

### Problem: Webhook Not Received

**Step 1: Check ngrok is running (30 seconds)**
```bash
# Terminal 1: Check if running
ps aux | grep ngrok

# If not running:
ngrok http 3000

# Copy the forwarding URL: https://abc123.ngrok.io
```

**Step 2: Check webhook URL in Whop (1 min)**
```
1. Go to https://whop.com/dashboard/developer
2. Select your app
3. Click Webhooks
4. Click your webhook
5. Verify URL is exactly: https://abc123.ngrok.io/api/webhooks/whop
6. If URL is wrong, update it and save
```

**Step 3: Test with curl (1 min)**
```bash
# Terminal 2: Send test request
BODY='{"type":"payment.completed","data":{"customer_id":"test_user_123"}}'

curl -X POST https://abc123.ngrok.io/api/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "x-whop-signature: test" \
  -d "$BODY" \
  -v

# Should get response (even if signature wrong)
# Should see in Terminal 1 (ngrok): POST /api/webhooks/whop [status code]
```

**Step 4: Check dev server (1 min)**
```bash
# Terminal 3: Check if dev server running
ps aux | grep "npm run dev"

# If not:
npm run dev

# Should see:
# ▲ Next.js 16.x.x
# - Local: http://localhost:3000
```

**Step 5: Send test from Whop (2 mins)**
```
1. Whop Dashboard → Your webhook
2. Click "Send test event" dropdown
3. Select "payment.completed"
4. Click "Send"
5. Watch Terminal 3 (dev server)
6. Should see: "Whop webhook event: payment.completed"
```

### Problem: "Invalid Webhook Signature"

**Step 1: Get correct secret (1 min)**
```
1. Whop Dashboard → Your webhook
2. Click copy icon next to "Webhook Secret"
3. Paste to text editor (check for extra spaces)
4. Copy exactly
```

**Step 2: Update .env.local (1 min)**
```bash
# Edit .env.local
WHOP_WEBHOOK_SECRET=whsec_PASTE_HERE_EXACTLY

# Save and restart dev server:
# Ctrl+C (stop)
npm run dev (restart)
```

**Step 3: Test signature (2 mins)**
```bash
# Verify signature generation:
WEBHOOK_SECRET=$(grep WHOP_WEBHOOK_SECRET .env.local | cut -d'=' -f2)
echo "Secret: $WEBHOOK_SECRET"

# Should show: whsec_...
# If empty: secret not saved correctly
```

### Problem: User Not in Database

**Step 1: Check webhook processed (1 min)**
```bash
# Terminal where dev server runs
# Should see: "Processing payment for customer: ..."

# If NOT seeing this message:
# → Webhook signature verification failed
# → Or webhook secret not configured
# See above fix
```

**Step 2: Check database insert (2 mins)**
```bash
# Supabase Dashboard → SQL Editor
SELECT * FROM users WHERE whop_user_id = 'test_user_123';

# If empty:
# → Webhook processed but insert failed
# → Check terminal for database errors
```

**Step 3: Check RLS policies (2 mins)**
```
1. Supabase Dashboard
2. Authentication → Policies
3. Table: users
4. Should have INSERT policy allowing writes
5. If not configured: add policies

-- Allow inserts on users table
CREATE POLICY "Allow webhook inserts" ON users
  FOR INSERT WITH CHECK (true);
```

---

## 🚨 ERROR MESSAGES & SOLUTIONS

### Error: "WHOP_WEBHOOK_SECRET not configured"

```typescript
// Cause: Environment variable not set
// Solution:
1. .env.local (local dev):
   WHOP_WEBHOOK_SECRET=whsec_...
2. Vercel (production):
   vercel env add WHOP_WEBHOOK_SECRET
3. Restart dev server
```

### Error: "Invalid webhook signature"

```
Cause: Signature doesn't match
Likely reasons:
1. Wrong secret in .env.local
2. Secret has extra spaces
3. Webhook body corrupted
4. Using old webhook configuration

Solution:
1. Go to Whop dashboard
2. Get webhook secret again (copy carefully)
3. Update .env.local
4. Restart dev server
5. Test again
```

### Error: "User creation failed"

```
Cause: Database insert error
Likely reasons:
1. users table doesn't exist
2. RLS policy preventing inserts
3. Supabase connection error
4. Duplicate whop_user_id

Solution:
1. Check users table exists:
   Supabase → Tables → users
2. Verify columns exist:
   - id (UUID)
   - whop_user_id (VARCHAR)
   - has_paid (BOOLEAN)
   - payment_date (TIMESTAMP)
3. Check RLS policies allow INSERT
4. Test manual insert:
   INSERT INTO users (whop_user_id, has_paid)
   VALUES ('test_123', true);
```

### Error: "Connection timeout"

```
Cause: Webhook processing takes too long
Likely reasons:
1. Supabase down
2. Database slow
3. Network issues

Solution:
1. Check Supabase status: status.supabase.com
2. Verify network connection
3. Optimize database queries
4. Return 200 quickly, process in background
```

---

## 📊 PERFORMANCE MONITORING

### Monitor Webhook Speed

```typescript
// Add timing logs in webhook handler

export async function POST(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Signature verification
    const sigStart = Date.now();
    // ... signature code ...
    console.log(`Signature check: ${Date.now() - sigStart}ms`);
    
    // Database operation
    const dbStart = Date.now();
    // ... database code ...
    console.log(`Database operation: ${Date.now() - dbStart}ms`);
    
    // Total time
    console.log(`Total webhook time: ${Date.now() - start}ms`);
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.log(`Failed after ${Date.now() - start}ms`);
    throw error;
  }
}
```

Target times:
- Signature verification: < 10ms
- Database operation: < 100ms
- Total: < 200ms

---

## 🎯 AUTOMATED TESTING

### Create Test Suite

```typescript
// tests/webhook.test.ts

import { POST } from '@/app/api/webhooks/whop/route';
import crypto from 'crypto';

describe('Webhook Handler', () => {
  const secret = process.env.WHOP_WEBHOOK_SECRET!;
  
  it('should reject invalid signature', async () => {
    const body = JSON.stringify({ test: true });
    const request = new Request(
      'http://localhost:3000/api/webhooks/whop',
      {
        method: 'POST',
        headers: {
          'x-whop-signature': 'invalid_signature',
          'content-type': 'application/json'
        },
        body
      }
    );
    
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
  
  it('should process payment.completed event', async () => {
    const body = JSON.stringify({
      type: 'payment.completed',
      data: {
        customer_id: 'test_user_123',
        amount: 1000
      }
    });
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    const request = new Request(
      'http://localhost:3000/api/webhooks/whop',
      {
        method: 'POST',
        headers: {
          'x-whop-signature': signature,
          'content-type': 'application/json'
        },
        body
      }
    );
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

Run tests:
```bash
npm install --save-dev jest @types/jest
npm test
```

---

## 📈 MONITORING IN PRODUCTION

### Setup Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const withSentryConfig = require('@sentry/nextjs').withSentryConfig;

module.exports = withSentryConfig(
  {
    // Your config
  },
  {
    org: 'your-org',
    project: 'course-downloader'
  }
);
```

### View Production Logs

```bash
# Vercel logs
vercel logs your-project-name --follow

# Filter by webhook
vercel logs your-project-name --follow | grep "webhook"

# Show last 50 entries
vercel logs your-project-name --limit 50
```

---

## ✅ FINAL VERIFICATION CHECKLIST

Before considering it "working":

- [ ] Local webhook receives test event
- [ ] Webhook signature verifies successfully
- [ ] User created in Supabase
- [ ] has_paid set to true
- [ ] /api/whop/validate-access returns hasAccess: true
- [ ] User sees "Access Granted" on page
- [ ] Production webhook working
- [ ] No errors in logs
- [ ] Response time < 200ms
- [ ] Database shows correct data

---

## 🆘 WHEN ALL ELSE FAILS

### Nuclear Option: Start Fresh

```bash
# 1. Delete everything Whop-related
rm app/api/webhooks/whop/route.ts
rm lib/whop/*

# 2. Clear .env.local
# Remove WHOP_* variables

# 3. Start over with setup guide
# Follow: WHOP_PAYMENT_QUICKSTART.md

# 4. Implement step by step
# Test after each step
```

### Get Help

```
1. Check Whop Docs: https://docs.whop.com/apps/features/webhooks
2. Check error message: Search in docs
3. Check Vercel logs: vercel logs
4. Check Supabase logs: Supabase dashboard → Logs
5. Check ngrok web UI: http://localhost:4040
6. Ask in Whop community Discord
```

---

**You now have everything you need to debug any Whop payment issue!** 🚀

