# Manual SSO Testing Guide

## Prerequisites
✅ Frontend running on: http://localhost:5173
✅ Backend API running on: http://localhost:3000
✅ Database connected with 4 tenants
✅ MSAL packages installed
✅ Azure AD credentials configured

## Test Procedure

### **Test 1: Login Page Display**

1. **Open your browser** (Chrome, Edge, or Firefox recommended)
2. **Navigate to:** `http://localhost:5173/login`
3. **Verify the following elements are visible:**

   ✅ **Header Section:**
   - ArchonY logo at the top
   - "Fleet Management System" title
   - "Sign in to access your account" subtitle

   ✅ **Login Card (White card on dark background):**
   - "Sign in with Microsoft" button (dark gray/black with Microsoft logo)
   - "Or continue with email" divider line
   - "Sign in with Email" button (outlined)

   ✅ **Footer:**
   - Lock icon with "Secure encrypted connection"
   - Building icon with CTA logo
   - Copyright text "© 2026 Capital Tech Alliance"

   ✅ **Design Quality:**
   - Clean, professional appearance
   - No visual glitches
   - Proper spacing and alignment
   - Readable text

### **Test 2: Browser Console Check**

1. **Open Developer Tools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Check for errors:**
   - ❌ Should see NO red errors
   - ⚠️ Warnings are OK (yellow)
   - ℹ️ Info messages are OK (blue)

   **Expected console messages:**
   ```
   [Auth] Initializing authentication...
   [MSAL] Initialized successfully
   ```

   **Red flags (should NOT see):**
   ```
   ❌ Failed to load resource
   ❌ Uncaught TypeError
   ❌ MSAL initialization failed
   ❌ Network error
   ```

### **Test 3: Microsoft SSO Button Click**

1. **Click the "Sign in with Microsoft" button**
2. **Observe what happens:**

   ✅ **Expected behavior:**
   - Browser should redirect to Microsoft login page
   - URL should change to `https://login.microsoftonline.com/...`
   - You should see Microsoft's login interface
   - **NO redirect loop** (should not bounce back to login page)

   ❌ **Problems to watch for:**
   - Button does nothing (check console for errors)
   - Redirects back to login immediately (redirect loop)
   - Error message appears
   - Popup blocker prevents redirect

### **Test 4: Microsoft Authentication** (Optional - if you want to complete login)

1. **On Microsoft login page:**
   - Enter your Microsoft account credentials
   - Complete any MFA if required

2. **After authentication:**
   - Should redirect to: `http://localhost:5173/auth/callback`
   - Brief loading screen should appear
   - Should redirect to home page: `http://localhost:5173/`
   - **Should NOT loop back to login**

3. **Verify you're logged in:**
   - Check if user menu/avatar appears
   - Try navigating to different pages
   - Refresh the page - should stay logged in

### **Test 5: Email Login (Alternative)**

1. **Go back to:** `http://localhost:5173/login`
2. **Click "Sign in with Email"**
3. **Verify:**
   - Email and password fields appear
   - Back button works
   - Can type in fields
   - "Sign In" button is visible

## Troubleshooting

### Issue: "Sign in with Microsoft" button does nothing

**Check:**
1. Open console (F12) and look for errors
2. Verify MSAL is initialized (should see `[MSAL]` messages)
3. Check Network tab for failed requests

**Fix:**
```bash
# Restart frontend
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA
npm run dev
```

### Issue: Redirect loop (keeps going back to login)

**Check:**
1. Console for authentication errors
2. Network tab for failed API calls

**This should be FIXED** - if you still see loops:
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Check console for specific error messages

### Issue: "Failed to load resource" errors

**Check:**
1. Is backend API running? Test: `curl http://localhost:3000/health`
2. Check CORS errors in console
3. Verify API URL in `.env`: `VITE_API_URL=http://localhost:3000`

### Issue: Microsoft login page shows error

**Possible causes:**
- Invalid Client ID or Tenant ID
- Redirect URI not registered in Azure AD
- Client secret expired

**Verify configuration:**
```bash
# Check frontend config
grep VITE_AZURE_AD .env

# Check backend config  
grep AZURE_AD api/.env
```

## Success Criteria

✅ **Login page loads without errors**
✅ **All UI elements are visible and styled correctly**
✅ **No console errors (red)**
✅ **Microsoft SSO button redirects to Microsoft**
✅ **NO redirect loops**
✅ **After Microsoft auth, user is logged in**
✅ **Session persists on page refresh**

## Quick Test Commands

```bash
# Check if frontend is running
curl -s http://localhost:5173 | grep "Fleet Management"

# Check if backend is running
curl -s http://localhost:3000/health

# Check database connection
psql postgresql://fleet_user:fleet_test_pass@localhost:5432/fleet_test -c "SELECT COUNT(*) FROM tenants;"

# View frontend logs
# (Check the terminal where npm run dev is running)

# View backend logs
# (Check the terminal where api npm run dev is running)
```

## What to Report

If you encounter issues, please provide:

1. **Screenshot of the login page**
2. **Console errors** (copy/paste the red errors)
3. **Network tab** (any failed requests)
4. **What happens when you click Microsoft button**
5. **Browser and version** (e.g., Chrome 120)

## Expected Test Results

### ✅ PASS Scenario:
```
1. Login page loads ✅
2. Clean design visible ✅
3. No console errors ✅
4. Click Microsoft button ✅
5. Redirects to Microsoft ✅
6. No loops ✅
7. Can complete login ✅
```

### ❌ FAIL Scenario:
```
1. Login page loads ✅
2. Console shows errors ❌
3. Click Microsoft button ❌
4. Nothing happens or loops ❌
```

---

## Ready to Test!

**Start here:** http://localhost:5173/login

The SSO should now work without any redirect loops. The fixes ensure that:
- User state is set immediately when MSAL detects authentication
- Callback prevents multiple executions
- No timing gaps that cause redirect loops

Good luck with testing! 🚀
