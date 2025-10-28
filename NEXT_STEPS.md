# Next Steps - User Limits & Paywall Integration

## ✅ What's Done (Latest Update)

- ✅ Design consistency: Watch page now matches HomePage
- ✅ Database schema: Created `users` and `user_limits` tables
- ✅ PaywallModal component: Beautiful UI with feature list
- ✅ User limits API: GET/POST endpoints for limit management
- ✅ UserLimitsService: Utility class for business logic
- ✅ UI Integration: Paywall buttons on HomePage, WatchPage, MyVideos
- ✅ Build: Successfully compiled with no errors
- ✅ Pricing model: Free (1 upload + 1 download) vs Paid (€10 unlimited)

## 🎯 Immediate Next Steps (Priority Order)

### 1. Integrate Download Limit Check (HIGH PRIORITY)
**File:** `app/components/DownloadProgressModal.tsx`
**Time: 20 minutes**

Add before starting download:
```typescript
import { UserLimitsService } from '@/app/services/user-limits.service';

// Check if user can download
const canDownload = await UserLimitsService.canDownloadLocally(userId);
if (!canDownload) {
  setShowPaywall(true);
  setPaywallType('local-download');
  return;
}

// If can download, increment counter
await UserLimitsService.incrementLocalDownload(userId);
```

### 2. Integrate Upload Limit Check (HIGH PRIORITY)
**File:** `app/views/VideoExtractor.tsx`
**Time: 20 minutes**

Add before uploading video:
```typescript
import { UserLimitsService } from '@/app/services/user-limits.service';

// Check if user can upload to cloud
const canUpload = await UserLimitsService.canUploadToCloud(userId);
if (!canUpload) {
  setShowPaywall(true);
  setPaywallType('cloud-upload');
  return;
}

// If can upload, increment counter
await UserLimitsService.incrementCloudUpload(userId);
```

### 3. Setup Whop Payment Webhook (HIGH PRIORITY)
**File:** `app/api/webhooks/whop/route.ts`
**Time: 30 minutes**

Implement webhook handler:
```typescript
import { UserLimitsService } from '@/app/services/user-limits.service';

export async function POST(request: NextRequest) {
  const event = await request.json();

  if (event.type === 'payment.completed') {
    const userId = event.data.user_id;

    // Update user as paid
    await supabase
      .from('users')
      .update({ has_paid: true, payment_date: new Date() })
      .eq('whop_user_id', userId);

    // Set unlimited access
    await UserLimitsService.setUnlimitedAccess(userId);
  }
}
```

### 4. Update Whop Payment Link (MEDIUM PRIORITY)
**File:** `app/components/PaywallModal.tsx`
**Time: 5 minutes**

Replace placeholder with your Whop product link:
```typescript
const handleUpgrade = () => {
  window.open('https://whop.com/your-product-link', '_blank');
};
```

### 5. Add User Authentication (MEDIUM PRIORITY)
**File:** `app/page.tsx` and API routes
**Time: 30 minutes**

Ensure user ID is available in all requests and create user on first login.

## � Testing Checklist

- [ ] Database migrations applied to Supabase
- [ ] PaywallModal displays correctly on all pages
- [ ] Upgrade button shows paywall
- [ ] User limits API returns correct data
- [ ] Download limit check prevents 2nd download
- [ ] Upload limit check prevents 2nd upload
- [ ] Paywall shows when limits exceeded
- [ ] Whop payment webhook updates user status
- [ ] Paid users have unlimited access
- [ ] Design is consistent across all pages

## 🔧 Configuration

### Environment Variables
Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
WHOP_API_KEY=your_whop_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret
```

### Whop Setup
1. Create product on Whop dashboard
2. Set price to €10 (one-time)
3. Get product link
4. Setup webhook for payment events
5. Add webhook URL: `https://yourapp.com/api/webhooks/whop`

## 📝 Database Schema

Tables already created:
- `users` - User info and payment status
- `user_limits` - Track usage counts

Run migrations:
```bash
# Migrations are in: supabase/migrations/001_create_tables.sql
# Apply via Supabase dashboard or CLI
```

## � Deployment

After completing all tasks:
1. Test locally with `npm run dev`
2. Commit changes: `git commit -m "Add user limits and paywall"`
3. Push to GitHub: `git push origin main`
4. Vercel auto-deploys
5. Test on production

## � Support

Key files for reference:
- `app/components/PaywallModal.tsx` - Paywall UI
- `app/services/user-limits.service.ts` - Business logic
- `app/api/user-limits/route.ts` - API endpoint
- `IMPLEMENTATION_SUMMARY.md` - Full implementation details

## ✅ Completion Criteria

System is complete when:
- ✅ Free users can upload 1 video and download 1 video
- ✅ Paywall appears on 2nd attempt
- ✅ Paid users have unlimited access
- ✅ Payment webhook updates user status
- ✅ Design is consistent across all pages
- ✅ All tests pass

---

**Ready to start? Begin with Step 1: Integrate Download Limit Check! 🚀**

