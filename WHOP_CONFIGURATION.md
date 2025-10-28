# Whop App Configuration Guide

## 🎯 Correct Paths for Whop Dashboard

After implementing the OAuth flow and App Views, configure these paths in your Whop Dashboard:

### **1. Experience View (Main App Interface)**
- **Path**: `/experiences/[experienceId]`
- **URL**: `http://localhost:3000/experiences/[experienceId]` (dev)
- **URL**: `https://your-domain.com/experiences/[experienceId]` (production)
- **Purpose**: Main app interface where users download courses

### **2. Dashboard View (Admin Analytics)**
- **Path**: `/dashboard/[companyId]`
- **URL**: `http://localhost:3000/dashboard/[companyId]` (dev)
- **URL**: `https://your-domain.com/dashboard/[companyId]` (production)
- **Purpose**: Community admin dashboard with analytics

### **3. Discover View (Marketplace Preview)**
- **Path**: `/discover`
- **URL**: `http://localhost:3000/discover` (dev)
- **URL**: `https://your-domain.com/discover` (production)
- **Purpose**: App preview in Whop marketplace

---

## 🔐 OAuth Configuration

### **Environment Variables Required**
```env
WHOP_CLIENT_ID=app_Fgd9oq5D1HjMWJ
WHOP_CLIENT_SECRET=ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI
WHOP_REDIRECT_URI=http://localhost:3000/api/oauth/callback
WHOP_API_KEY=your_whop_api_key_here
WHOP_WEBHOOK_SECRET=ws_f40502cdca20f101659660e4495446d91daa126644d0bb6b40bb3ea03cc2d582
```

### **OAuth Flow**
1. User clicks "Login with Whop"
2. Redirects to `/api/oauth/init`
3. User authorizes on Whop
4. Redirects back to `/api/oauth/callback`
5. Access token stored in secure cookie
6. User redirected to app

---

## 🪝 Webhook Configuration

### **Webhook URL**
```
https://your-domain.com/api/webhooks/whop
```

For local development with ngrok:
```
https://your-ngrok-url.ngrok-free.dev/api/webhooks/whop
```

### **Events to Subscribe**
- ✅ `payment.completed` - User paid €10
- ✅ `payment.refunded` - Payment refunded
- ✅ `user.removed` - User left community

### **Webhook Secret**
The webhook secret is stored in `WHOP_WEBHOOK_SECRET` environment variable.

---

## 🚀 Local Development Setup

### **1. Start ngrok**
```bash
ngrok http 3000
```
Copy the URL (e.g., `https://abc123.ngrok-free.dev`)

### **2. Update .env.local**
```env
WHOP_REDIRECT_URI=https://abc123.ngrok-free.dev/api/oauth/callback
```

### **3. Update Whop Dashboard**
1. Go to https://whop.com/dashboard/developer
2. Select "Course Downloader" app
3. Update **Dev URL** to your ngrok URL
4. Update **Webhook URL** to `https://abc123.ngrok-free.dev/api/webhooks/whop`

### **4. Start dev server**
```bash
npm run dev
```

---

## 📋 Whop Dashboard Settings

### **App Views Configuration**
| View | Path | Type |
|------|------|------|
| Experience | `/experiences/[experienceId]` | Main Interface |
| Dashboard | `/dashboard/[companyId]` | Admin Panel |
| Discover | `/discover` | Marketplace |

### **OAuth Settings**
- Client ID: `app_Fgd9oq5D1HjMWJ`
- Client Secret: `ojneczyAk8cG8Yc9e6IgMmkOB2mYUfo4PTcNtOejsoI`
- Redirect URI: `http://localhost:3000/api/oauth/callback` (dev)

### **Webhook Settings**
- URL: `/api/webhooks/whop`
- Secret: `ws_f40502cdca20f101659660e4495446d91daa126644d0bb6b40bb3ea03cc2d582`
- Events: `payment.completed`, `payment.refunded`, `user.removed`

---

## ✅ Testing Checklist

- [ ] OAuth flow works (login redirects correctly)
- [ ] Experience View loads at `/experiences/[experienceId]`
- [ ] Dashboard View loads at `/dashboard/[companyId]`
- [ ] Discover View loads at `/discover`
- [ ] Webhook receives payment events
- [ ] User access is validated correctly
- [ ] Payment status updates in database

---

## 🔗 Useful Links

- [Whop OAuth Guide](https://docs.whop.com/apps/features/oauth-guide)
- [Whop Webhooks](https://docs.whop.com/apps/features/webhooks)
- [Whop App Views](https://docs.whop.com/apps/app-views/experience-view)
- [Whop Dashboard](https://whop.com/dashboard/developer)

