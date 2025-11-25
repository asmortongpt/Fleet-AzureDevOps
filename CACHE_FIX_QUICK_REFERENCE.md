# Service Worker Cache Fix - Quick Reference

## The Problem
Users with old cached `index.html` were getting **white screen** because the HTML referenced JavaScript bundles that no longer exist (404 errors).

## The Solution
**Cache version v1.0.2** implements:
- **NEVER cache** `index.html` or `runtime-config.js` (network-only)
- **Stale-while-revalidate** for JS/CSS bundles (fast + auto-update)
- **Automatic update detection** and reload

---

## For Users Experiencing White Screen

### Quick Fix (Share This Link):
```
https://your-production-url.com/clear-cache.html?autoclear=1
```

This will automatically:
1. Clear all caches
2. Unregister old service worker
3. Reload with fresh content

### Alternative Fixes:
- **Option 1:** Use incognito/private browsing mode
- **Option 2:** DevTools → Application → Clear site data
- **Option 3:** Wait 60 seconds and refresh (auto-update will fix it)

---

## For Developers

### Verify the Fix is Deployed:

```bash
# Run verification script
./scripts/verify-cache-fix.sh https://your-production-url.com

# Should output:
# ✓ sw.js is accessible
# ✓ Service worker version is v1.0.2
# ✓ NEVER_CACHE list exists
# ✓ Network-only strategy for critical assets
# ✓ All tests passed!
```

### Check in Browser DevTools:

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for:
   ```
   [ServiceWorker] Installing version: ctafleet-v1.0.2
   [ServiceWorker] Activating version: ctafleet-v1.0.2
   [ServiceWorker] Network-only (never cache): /index.html
   ```

4. Go to **Application** → **Cache Storage**
5. Verify:
   - `ctafleet-cache-ctafleet-v1.0.2` exists
   - NO old caches (v1.0.0 or v1.0.1)
   - **index.html is NOT in cache**

### Test the Fix Locally:

```bash
# Build
npm run build

# Preview
npm run preview

# Verify
./scripts/verify-cache-fix.sh http://localhost:4173
```

---

## What Changed

### Service Worker (public/sw.js)
- **Version:** v1.0.1 → **v1.0.2**
- **Strategy:** Cache-first → **Network-only for index.html**
- **Bundle caching:** Cache-first → **Stale-while-revalidate**

### Index.html
- Added service worker update detection
- Added automatic reload on SW activation
- Added quick update checks (10s intervals for 2 minutes)

### New Files
- `public/clear-cache.html` - Manual cache clear utility
- `CACHE_STRATEGY.md` - Complete documentation
- `e2e/service-worker-cache.spec.ts` - E2E tests
- `scripts/verify-cache-fix.sh` - Verification script

---

## Key Metrics

### Before Fix:
- Users with old cache: **White screen** (100% broken)
- Recovery: **Manual only** (user must clear browser data)
- Update time: **Never** (required user action)

### After Fix:
- Users with old cache: **Auto-fixed in <60 seconds**
- Recovery: **Automatic** (SW update + reload)
- Update time: **10-60 seconds** after deployment

---

## Files Changed

### Modified:
1. `/Users/andrewmorton/Documents/GitHub/Fleet/public/sw.js`
2. `/Users/andrewmorton/Documents/GitHub/Fleet/index.html`
3. `/Users/andrewmorton/Documents/GitHub/Fleet/public/runtime-config.js`
4. `/Users/andrewmorton/Documents/GitHub/Fleet/vite.config.ts`

### Created:
1. `/Users/andrewmorton/Documents/GitHub/Fleet/public/clear-cache.html`
2. `/Users/andrewmorton/Documents/GitHub/Fleet/CACHE_STRATEGY.md`
3. `/Users/andrewmorton/Documents/GitHub/Fleet/AGENT_3_CACHE_FIX_REPORT.md`
4. `/Users/andrewmorton/Documents/GitHub/Fleet/e2e/service-worker-cache.spec.ts`
5. `/Users/andrewmorton/Documents/GitHub/Fleet/scripts/verify-cache-fix.sh`

### Git Commits:
- `6af67ad6` - docs: add comprehensive service worker cache strategy documentation
- `73648c56` - test: add comprehensive service worker cache management E2E tests
- `a6399323` - feat: add service worker cache fix verification script

---

## Deployment Steps

1. **Build:**
   ```bash
   npm run build
   ```

2. **Verify locally:**
   ```bash
   npm run preview
   ./scripts/verify-cache-fix.sh http://localhost:4173
   ```

3. **Deploy to Azure Static Web App:**
   - Push to main branch triggers auto-deployment
   - Or manually deploy dist/ folder

4. **Verify in production:**
   ```bash
   ./scripts/verify-cache-fix.sh https://your-production-url.com
   ```

5. **Monitor:**
   - Check Azure Static Web App deployment status
   - Visit app and check DevTools console for v1.0.2 logs
   - Verify old caches are deleted

6. **Communicate to users** (if needed):
   - Share `/clear-cache.html?autoclear=1` link
   - Or let auto-update fix it (within 60 seconds)

---

## Expected Behavior

### On First Visit After Deployment:
1. User loads app (may still have old cache)
2. Within 10-60 seconds: Browser detects new service worker
3. New SW downloads and installs
4. New SW activates, deletes old caches
5. Page automatically reloads
6. Fresh HTML loads with correct bundle
7. App works correctly

### On Subsequent Visits:
1. User loads app
2. index.html fetched from network (never cached)
3. JS/CSS bundles served from cache (if available)
4. Bundles update in background if needed
5. Fast, reliable load every time

---

## Troubleshooting

### White Screen Still Occurring?

**Check:**
1. Is service worker registered?
   - DevTools → Application → Service Workers
2. What cache version is active?
   - DevTools → Console (look for version logs)
3. Is index.html in cache?
   - DevTools → Application → Cache Storage
   - Should NOT be in cache

**Fix:**
- Visit `/clear-cache.html?autoclear=1`
- Or manually unregister SW and clear site data

### Service Worker Not Updating?

**Check:**
1. Is update detection working?
   - DevTools → Console (look for "update found" logs)
2. Is there a waiting service worker?
   - DevTools → Application → Service Workers

**Fix:**
- Click "Update" in DevTools Service Workers panel
- Or wait for automatic update check (every 60 seconds)

---

## Success Criteria

- [x] Cache version is v1.0.2
- [x] index.html is NOT cached
- [x] runtime-config.js is NOT cached
- [x] Old caches are deleted on activation
- [x] Service worker updates automatically
- [x] Page reloads on SW update
- [x] clear-cache.html utility available
- [x] All critical files accessible
- [x] No 404 errors on JS bundles
- [x] App loads without white screen

---

## Additional Resources

- **Full Documentation:** `CACHE_STRATEGY.md`
- **Detailed Report:** `AGENT_3_CACHE_FIX_REPORT.md`
- **E2E Tests:** `e2e/service-worker-cache.spec.ts`
- **Verification Script:** `scripts/verify-cache-fix.sh`

---

## Contact

For issues or questions about the cache fix:
1. Check `CACHE_STRATEGY.md` for detailed troubleshooting
2. Run `./scripts/verify-cache-fix.sh` to diagnose
3. Check E2E test results for validation
