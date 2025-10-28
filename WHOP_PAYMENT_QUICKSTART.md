# ⚡ WHOP PAYMENT - QUICK START (30 mins)

Fast setup guide to get payments working in dev and production.

---

## 🚀 LOCAL SETUP (15 mins)

### 1. Install & Start ngrok (2 mins)

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Create free account at https://ngrok.com
# Get your authtoken and run:
ngrok authtoken YOUR_AUTHTOKEN

# In Terminal 1: Start tunnel
ngrok http 3000

# Copy the forwarding URL: https://abc123.ngrok.io
```

### 2. Start Dev Server (1 min)

```bash
# In Terminal 2:
npm run dev
# Runs on http://localhost:3000
```

### 3. Add Webhook Secret to .env.local (2 mins)

```bash
# You'll get this from Whop dashboard in next step
# For now, add a placeholder:

echo "WHOP_WEBHOOK_SECRET=whsec_test_" >> .env.local

# Restart dev server for changes to take effect
# Ctrl+C then npm run dev
```

### 4. Configure Webhook in Whop Dashboard (10 mins)

```
1. Go to https://whop.com/dashboard/developer
2. Select "Course Downloader" app
3. Click "Webhooks" in left menu
4. Click "Create webhook"
5. Paste URL: https://abc123.ngrok.io/api/webhooks/whop
   ↳ Replace abc123 with your ngrok URL
6. Select events:
   ☑ payment.completed
   ☑ payment.refunded
7. Click "Save"
8. Click on the webhook you created
9. Click the copy icon next to "Webhook Secret"
10. Update .env.local:
    
    WHOP_WEBHOOK_SECRET=whsec_abc123xyz456...

11. Restart dev server
```

### 5. Test Webhook Locally (5 mins)

```
In Whop Dashboard:
1. Click your webhook
2. Click "Send test event" dropdown
3. Select "payment.completed"
4. Click "Send"

In your terminal (npm run dev):
Should see:
  "Whop webhook event: payment.completed"
  "Processing payment for customer: ..."
  "✅ Payment processed successfully"

✅ If you see this, local setup is DONE!
```

---

## 🌍 PRODUCTION SETUP (15 mins)

### 1. Get Production Webhook Secret (2 mins)

```
In Whop Dashboard:
1. Go to your webhook
2. Copy the secret (same as dev)
3. You'll use it in next step
```

### 2. Deploy to Vercel (3 mins)

```bash
# Make sure all changes are pushed
git add .
git commit -m "Add Whop payment system"
git push origin main

# Vercel auto-deploys
# Wait for deployment to complete
# Your URL: https://your-app.vercel.app
```

### 3. Set Environment Variable in Vercel (5 mins)

```
Option A: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings"
4. Click "Environment Variables"
5. Click "Add New"
6. Name: WHOP_WEBHOOK_SECRET
   Value: whsec_abc123xyz456...
   Environments: ☑ Production
7. Click "Save"
8. Click "Redeploy" (or push another commit)

Option B: Using Vercel CLI
```bash
vercel env add WHOP_WEBHOOK_SECRET
# Paste the secret when prompted
# Select: Production
```
```

### 4. Update Webhook URL in Whop (3 mins)

```
In Whop Dashboard:
1. Click your webhook
2. Click "Edit" (pencil icon)
3. Change URL to: https://your-app.vercel.app/api/webhooks/whop
4. Save
```

### 5. Test Production Webhook (2 mins)

```
In Whop Dashboard:
1. Click your webhook
2. Click "Send test event"
3. Select "payment.completed"
4. Click "Send"

In Vercel Logs:
vercel logs your-project-name

Should see the same success messages
✅ Production is working!
```

---

## ✅ VERIFICATION CHECKLIST

### Local Development
- [ ] ngrok running (`ngrok http 3000`)
- [ ] Dev server running (`npm run dev`)
- [ ] Webhook secret in `.env.local`
- [ ] Test webhook sent and received
- [ ] See "Payment processed successfully" in terminal

### Production
- [ ] Deployed to Vercel
- [ ] Webhook secret in Vercel env vars
- [ ] Webhook URL updated to `https://your-app.vercel.app/api/webhooks/whop`
- [ ] Test webhook sent to production
- [ ] See success in `vercel logs`

### Database
- [ ] User appears in Supabase `users` table
- [ ] `has_paid = true` after webhook
- [ ] `/api/whop/validate-access` returns `hasAccess: true`

---

## 🐛 If Something Goes Wrong

### Test Event Not Received
```bash
1. Verify ngrok URL in webhook config
2. Check ngrok is still running (terminal should show activity)
3. Check dev server terminal for errors
4. Try sending test event again
```

### "Invalid Webhook Signature" Error
```bash
1. Go to Whop dashboard webhook
2. Copy the secret again (make sure it's correct)
3. Update .env.local or Vercel env vars
4. Restart dev server (or redeploy if prod)
5. Try again
```

### User Not Marked as Paid
```bash
1. Check Supabase dashboard -> users table
2. Look for a user with recent payment_date
3. If not there: webhook didn't process
   → Check webhook logs
   → Check for errors in terminal
4. If there but has_paid=false: webhook partially processed
   → Check database update error
```

### Can't Reach localhost:3000 with ngrok
```bash
1. Stop dev server (Ctrl+C)
2. Stop ngrok (Ctrl+C)
3. Restart both:
   Terminal 1: ngrok http 3000
   Terminal 2: npm run dev
4. Get new ngrok URL and update Whop webhook
```

---

## 🔑 Key URLs to Remember

```
Local Dev:
- App: http://localhost:3000
- Webhook endpoint: https://abc123.ngrok.io/api/webhooks/whop
- Whop dashboard: https://whop.com/dashboard/developer

Production:
- App: https://your-app.vercel.app
- Webhook endpoint: https://your-app.vercel.app/api/webhooks/whop
- Vercel dashboard: https://vercel.com/dashboard
- Vercel logs: vercel logs your-project-name
```

---

## 📊 Payment Flow (What Happens)

```
1. User pays €10 in Whop community
   ↓
2. Whop sends webhook to /api/webhooks/whop
   ↓
3. Your app verifies webhook signature
   ↓
4. Creates or updates user in Supabase
   ↓
5. Sets has_paid = true
   ↓
6. Next time user visits app
   ↓
7. /api/whop/validate-access checks has_paid
   ↓
8. User gets access ✅
```

---

## 🎯 AFTER SETUP: TEST PAYMENT FLOW

```bash
# 1. Local or production doesn't matter
# 2. Send test webhook from Whop dashboard
# 3. Check database
# 4. Verify access works
# 5. Test /api/whop/validate-access endpoint

# Test the access endpoint:
curl -H "x-whop-user-token: YOUR_JWT_TOKEN" \
  http://localhost:3000/api/whop/validate-access

# Response should be:
# {"hasAccess": true, "accessLevel": "customer"}
```

---

## 📝 TROUBLESHOOTING COMMANDS

```bash
# Check if ngrok is running
ps aux | grep ngrok

# Check .env.local has webhook secret
cat .env.local | grep WHOP_WEBHOOK_SECRET

# Check Vercel env vars
vercel env ls

# View live logs
vercel logs your-project --follow

# View production deployment
vercel ls

# Test Supabase connection
# Go to Supabase dashboard and run query:
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

---

## 🚨 COMMON ISSUES & FIXES

| Issue | Fix |
|-------|-----|
| "Webhook not received" | Check ngrok URL in Whop dashboard |
| "Invalid signature" | Copy webhook secret again, update .env.local |
| "User not in database" | Check webhook actually sent, check Supabase |
| "Access still denied" | Verify has_paid = true, restart app |
| "ngrok URL keeps changing" | Ngrok expired, restart and update webhook URL |
| "env var not loading" | Restart dev server after updating .env.local |
| "Deploy failed" | Check build errors with `vercel logs` |

---

## ⏱️ TIMING

```
Local setup: 15 minutes
Production setup: 15 minutes
Total: 30 minutes

If you've done it before: 10 minutes
```

---

## 🎉 YOU'RE DONE!

When you see this in the terminal:
```
✅ Payment processed successfully for user: [uuid]
```

**Payments are working!** 🎊

---

**Next Steps:**
1. Deploy full app to production
2. Test real payment flow with real Whop user
3. Monitor webhook deliveries
4. Add error tracking (optional)

