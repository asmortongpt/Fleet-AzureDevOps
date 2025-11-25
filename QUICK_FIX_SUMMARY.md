# 🚨 Fleet White Screen - Quick Fix Summary

## TL;DR - The Problem

Your Fleet app shows a white screen because of **6 critical issues**:

1. ❌ **Error Boundary re-throws errors** → App crashes silently
2. ❌ **Missing .env file** → Environment variables undefined
3. ❌ **Wrong script paths** → ./runtime-config.js returns 404
4. ❌ **Wrong CSS path** → ./src/main.css returns 404
5. ❌ **Auth guard issues** → Redirect loops in production
6. ❌ **No error logging** → Can't see what's failing

## 🎯 One-Command Fix

```bash
./fix-white-screen.sh
npm run dev
```

That's it! The script fixes all 6 issues automatically.

## 📋 What Gets Fixed

| Issue | File | What Changes |
|-------|------|--------------|
| Error Boundary | `src/ErrorFallback.tsx` | Removes `throw error` line that bypasses error handling |
| Environment | `.env` | Creates file with required VITE_ variables |
| Script Paths | `index.html` | Changes `./runtime-config.js` → `/runtime-config.js` |
| CSS Path | `index.html` | Removes broken `./src/main.css` link |
| Build Cache | `dist/`, `node_modules/.vite` | Cleans stale build artifacts |

## 🔍 How to Verify It Worked

After running the fix:

1. **Check for Login Page or Dashboard** (not white screen) ✅
2. **Open DevTools Console** (F12) → No red errors ✅
3. **Check Network Tab** → All scripts load with 200 status ✅
4. **Look for these logs:**
   ```
   [App] React mounted successfully
   [App] Background services initialized
   ```

## 📊 Before vs After

### Before (White Screen)
```
Browser Console:
❌ Uncaught Error: ...
❌ Failed to load: ./runtime-config.js (404)
❌ Failed to load: ./src/main.css (404)
❌ ReferenceError: VITE_AZURE_AD_CLIENT_ID is undefined

Screen:
[Blank white page]
```

### After (Working App)
```
Browser Console:
✅ [App] Starting React application...
✅ [App] React mounted successfully
✅ [App] Background services initialized

Screen:
[Login page or Dashboard visible]
```

## 🚀 Manual Fix (If Script Fails)

### Fix 1: Error Boundary
**File:** `src/ErrorFallback.tsx` (line 9)

**Remove this line:**
```typescript
if (import.meta.env.DEV) throw error;  // ❌ DELETE THIS
```

### Fix 2: Create .env
```bash
cp .env.example .env
```

**Edit .env and set:**
```bash
VITE_ENVIRONMENT=development
VITE_AZURE_AD_CLIENT_ID=demo-client-id
VITE_AZURE_AD_TENANT_ID=demo-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Fix 3: Fix index.html
**File:** `index.html` (lines 38-42)

**Change:**
```html
<!-- BEFORE -->
<link href="./src/main.css" rel="stylesheet" />
<script src="./runtime-config.js"></script>
<script src="./react-polyfill.js"></script>

<!-- AFTER -->
<script src="/runtime-config.js"></script>
<script src="/react-polyfill.js"></script>
```

### Fix 4: Clean Build
```bash
rm -rf dist/ node_modules/.vite
npm run dev
```

## 🆘 Still Seeing White Screen?

1. **Check Browser Console** (F12 → Console tab)
   - Look for RED error messages
   - Share the error with me

2. **Check Network Tab** (F12 → Network tab)
   - Look for RED 404 errors
   - Share which files are failing

3. **Check Terminal Output**
   ```bash
   npm run dev
   ```
   - Look for compilation errors
   - Share any ERROR messages

4. **Try Hard Refresh**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

5. **Clear Browser Cache**
   - F12 → Right-click refresh button → "Empty Cache and Hard Reload"

## 📚 Full Documentation

For the complete technical analysis:
- **Full Report:** `WHITE_SCREEN_DIAGNOSTIC_REPORT.md`
- **Fix Script:** `fix-white-screen.sh`
- **GitHub Repo:** https://github.com/asmortongpt/fleet

## ✅ Success Checklist

- [ ] Ran `./fix-white-screen.sh`
- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:5173
- [ ] Saw login page or dashboard (NOT white screen)
- [ ] No console errors
- [ ] All scripts load successfully (check Network tab)

If all checkboxes are ✅, you're done! 🎉

---

**Need Help?** Check the full diagnostic report or open a GitHub issue.
