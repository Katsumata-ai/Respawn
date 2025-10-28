# 🔧 Fix for Whop Dev Mode - Token in Query Parameters

## 🎯 Problem Identified

Whop sends the dev token as a **query parameter** (`whop-dev-user-token`), not in headers:

```
http://localhost:3000/experiences/exp_auuZRK8DNSGXWQ?whop-dev-user-token=eyJhbGc...
```

But the app was looking for it in headers (`x-whop-user-token`).

---

## ✅ Solution Applied

### **1. Updated `lib/whop/server.ts`**
- Modified `verifyWhopToken()` to accept token as parameter
- Now handles both header and query parameter tokens

### **2. Updated `app/experiences/[experienceId]/page.tsx`**
- Extracts `whop-dev-user-token` from query parameters
- Passes it to the API in the header

### **3. Updated API Routes**
- `/api/whop/validate-access` - Now reads token from header
- `/api/whop/user` - Now reads token from header

---

## 🧪 How to Test

### **Step 1: Make sure dev server is running**
```bash
npm run dev
# Should run on http://localhost:3000
```

### **Step 2: Test the Experience View URL**
```
http://localhost:3000/experiences/exp_auuZRK8DNSGXWQ?whop-dev-user-token=eyJhbGc...
```

Replace `eyJhbGc...` with the actual token from Whop.

### **Step 3: Check the browser console**
- Should NOT show "Failed to validate access"
- Should load the VideoExtractor component
- Should show the app interface

### **Step 4: Test in Whop Dashboard**
1. Go to https://whop.com/dashboard/developer
2. Select "Course Downloader"
3. Click "Open" in dev mode
4. Should now load without access error

---

## 📋 What Changed

### **Before ❌**
```typescript
// Only looked in headers
const token = headersList.get('x-whop-user-token');
```

### **After ✅**
```typescript
// Accepts token as parameter
export async function verifyWhopToken(token?: string): Promise<WhopUserPayload | null> {
  // Can now handle both header and parameter tokens
}
```

---

## 🚀 Next Steps

1. **Restart dev server** (already done)
2. **Test in Whop dev mode** - Click "Open" button
3. **Verify no access errors** - Should load the app
4. **Test all features** - Upload, download, etc.

---

## ✨ Expected Result

When you click "Open" in Whop dev mode:
- ✅ No "Failed to validate access" error
- ✅ Experience View loads
- ✅ VideoExtractor component displays
- ✅ Can upload and download videos

---

## 🐛 If Still Having Issues

### **Check 1: Token is being passed**
```javascript
// In browser console
const url = new URL(window.location);
console.log(url.searchParams.get('whop-dev-user-token'));
// Should show the token
```

### **Check 2: API is receiving token**
```bash
# Check server logs for:
# "No valid Whop token found" or similar
```

### **Check 3: Verify token format**
The token should be a valid JWT with 3 parts separated by dots:
```
header.payload.signature
```

---

## 📞 Support

If you still see errors:
1. Check the server logs (Terminal with `npm run dev`)
2. Check browser console for errors
3. Verify the token is being passed in the URL
4. Make sure dev server is running on port 3000

