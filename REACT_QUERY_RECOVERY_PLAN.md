# React Query Cache Recovery Plan
## Fixing "Cannot read properties of null (reading 'useEffect')"

**Problem Analysis:** Vite pre-bundles dependencies and caches them in `node_modules/.vite-fleet/deps/`. When React Query gets pre-bundled BEFORE React is available, it captures a null reference to React's hooks, causing runtime errors.

**Root Cause:** The custom `cacheDir: 'node_modules/.vite-fleet'` combined with excluding React Query from pre-bundling causes Vite to create stale pre-bundled chunks that reference React incorrectly.

---

## Step-by-Step Recovery Plan

### Phase 1: Nuclear Cache Clear (5 minutes)

**IMPORTANT:** Close ALL browser tabs with your app before starting.

#### Option A: Automated (Recommended)
```bash
# Preview what will be deleted
python3 nuclear_cache_clear.py --dry-run

# Execute the nuclear clear
python3 nuclear_cache_clear.py

# If issues persist, use aggressive mode
python3 nuclear_cache_clear.py --aggressive
```

#### Option B: Manual
```bash
# 1. Stop dev server
# Press Ctrl+C in terminal running Vite

# 2. Remove all Vite caches
rm -rf node_modules/.vite-fleet
rm -rf node_modules/.vite
rm -rf node_modules/.vite-temp
rm -rf .vite
rm -rf dist

# 3. Remove TypeScript caches
rm -rf node_modules/.tmp
rm -f tsconfig.tsbuildinfo
rm -f tsconfig.app.tsbuildinfo

# 4. Clear npm cache
npm cache clean --force

# 5. (Aggressive) Remove node_modules
# Only if issues persist after steps 1-4
rm -rf node_modules
rm -f package-lock.json
npm install
```

---

### Phase 2: Update Vite Configuration (2 minutes)

Replace your current `vite.config.ts` with the fixed version:

```bash
# Backup current config
cp vite.config.ts vite.config.BACKUP.ts

# Use the fixed config
cp vite.config.FIXED.ts vite.config.ts
```

**Key Changes in Fixed Config:**

1. **REMOVED Custom Cache Directory**
   ```typescript
   // BEFORE (BROKEN):
   cacheDir: 'node_modules/.vite-fleet',

   // AFTER (FIXED):
   // Use default cache location
   ```

2. **INCLUDED React Query in Pre-bundling**
   ```typescript
   // BEFORE (BROKEN):
   optimizeDeps: {
     exclude: ['@tanstack/react-query'],
   }

   // AFTER (FIXED):
   optimizeDeps: {
     include: [
       'react',
       'react-dom',
       '@tanstack/react-query',  // Now bundled WITH React
     ],
   }
   ```

3. **ENABLED Force Optimization**
   ```typescript
   optimizeDeps: {
     force: true,  // Force fresh optimization
   }
   ```

---

### Phase 3: Clear Browser Cache (2 minutes)

**Chrome/Edge:**
1. Press `Cmd+Shift+Delete` (macOS) or `Ctrl+Shift+Delete` (Windows/Linux)
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"

**Safari:**
1. Safari > Settings > Advanced
2. Enable "Show Develop menu"
3. Develop > Empty Caches (`Cmd+Option+E`)

**Firefox:**
1. Press `Cmd+Shift+Delete` (macOS) or `Ctrl+Shift+Delete` (Windows/Linux)
2. Select "Everything"
3. Check "Cache"
4. Click "Clear Now"

**Alternative:** Use Incognito/Private browsing mode to test without clearing cache.

---

### Phase 4: Restart Development Server (1 minute)

```bash
# 1. Close your terminal and open a new one (clears environment)

# 2. Navigate to project
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# 3. Start dev server
npm run dev
```

**Expected Output:**
```
  VITE v6.4.1  ready in 2000 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help

  Pre-bundling dependencies:
    react
    react-dom
    @tanstack/react-query
    ...
  Optimized dependencies changed. Reloading...
```

---

### Phase 5: Verify Fix (2 minutes)

#### Test 1: Basic App Load
1. Open http://localhost:5173
2. Check browser console - should see NO errors
3. App should load without white screen

#### Test 2: Verify React Query
1. Open browser DevTools > Network tab
2. Look for chunk files: `react-vendor-[hash].js`, `react-utils-[hash].js`
3. Verify both chunks load successfully
4. Check that `react-vendor` loads BEFORE `react-utils`

#### Test 3: Check Module Preloads
1. View page source (Right-click > View Page Source)
2. Look for `<link rel="modulepreload">` tags in `<head>`
3. Verify order:
   - `react-vendor-[hash].js` (FIRST)
   - `react-utils-[hash].js` (SECOND)
   - `vendor-[hash].js` (THIRD)

#### Test 4: Runtime Check
Open browser console and run:
```javascript
// Should NOT throw error
console.log(window.React);  // May be undefined (bundled, not global)

// Navigate to a page that uses React Query
// Should work without errors
```

---

## Troubleshooting

### Issue: Still seeing old cache hash in error
**Solution:**
```bash
# Hard refresh browser
Cmd+Shift+R (macOS) or Ctrl+Shift+R (Windows/Linux)

# Or use Incognito mode
Cmd+Shift+N (Chrome) or Cmd+Shift+P (Safari/Firefox)
```

### Issue: Error persists after all steps
**Solution:**
```bash
# Nuclear option - complete reinstall
python3 nuclear_cache_clear.py --aggressive
npm install
npm run dev
```

### Issue: Different error appears
**Check:**
1. Ensure React version is 18.3.1+: `npm list react`
2. Ensure React Query version is 5.83.1+: `npm list @tanstack/react-query`
3. Check for duplicate React installs: `npm ls react`

```bash
# Fix duplicate React
npm dedupe
```

### Issue: Build works but dev server fails
**Solution:**
```bash
# Clear only dev server cache
rm -rf node_modules/.vite
npm run dev
```

---

## Prevention Strategies

### 1. Don't Use Custom Cache Directories
```typescript
// ❌ AVOID
cacheDir: 'node_modules/.vite-fleet',

// ✅ USE DEFAULT
// (no cacheDir specified)
```

### 2. Include React-Dependent Libraries in Pre-bundling
```typescript
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    '@tanstack/react-query',  // ✅ Include
    'framer-motion',          // ✅ Include
    'next-themes',            // ✅ Include
  ],
  exclude: [
    // Only exclude non-React libraries
    'three',
    'leaflet',
    'mapbox-gl',
  ],
}
```

### 3. Use React Aliases Consistently
```typescript
resolve: {
  alias: {
    'react': resolve(projectRoot, 'node_modules/react'),
    'react-dom': resolve(projectRoot, 'node_modules/react-dom'),
  },
  dedupe: ['react', 'react-dom', 'scheduler'],
}
```

### 4. Enable Cache Busting in Development
```typescript
server: {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  },
}
```

---

## Technical Explanation

### Why This Happens

1. **Vite Pre-bundling:**
   - Vite pre-bundles dependencies using esbuild for faster dev server startup
   - Pre-bundled deps are cached in `node_modules/.vite/deps/`

2. **The Problem:**
   ```javascript
   // React Query tries to import React
   import { useEffect } from 'react';

   // If React isn't available yet, useEffect is null
   // Later code does: null.useEffect() → ERROR!
   ```

3. **Why Custom Cache Dir Made It Worse:**
   - Custom `cacheDir` prevented Vite from auto-detecting stale caches
   - Vite's default invalidation logic doesn't work with custom paths
   - Browser cached the old pre-bundled chunks

4. **The Fix:**
   - Include React Query in `optimizeDeps.include`
   - This forces Vite to pre-bundle React Query WITH React
   - Ensures React is available when React Query initializes
   - Use default cache location for proper invalidation

### Module Resolution Order

**BEFORE (Broken):**
```
1. Browser loads vendor.js (no React)
2. React Query executes: import { useEffect } from 'react'
3. React hasn't loaded yet → useEffect is null
4. ERROR: Cannot read properties of null
```

**AFTER (Fixed):**
```
1. Browser loads react-vendor.js (React available)
2. Browser loads react-utils.js (includes React Query)
3. React Query executes: import { useEffect } from 'react'
4. React is available → useEffect is a function
5. SUCCESS: App works correctly
```

---

## Files Modified

1. **Created:**
   - `nuclear_cache_clear.py` - Automated cache cleaning script
   - `vite.config.FIXED.ts` - Corrected Vite configuration
   - `REACT_QUERY_RECOVERY_PLAN.md` - This document

2. **To Modify:**
   - `vite.config.ts` - Replace with fixed version

3. **To Delete:**
   - All cache directories (via script)

---

## Success Criteria

✅ App loads without errors
✅ No "Cannot read properties of null" errors in console
✅ React Query hooks work correctly
✅ Hot Module Replacement (HMR) works
✅ No white screen on initial load
✅ Browser DevTools shows correct chunk loading order

---

## Next Steps After Fix

1. **Test thoroughly:**
   ```bash
   npm run test
   npm run test:smoke
   ```

2. **Verify build:**
   ```bash
   npm run build
   npm run preview
   ```

3. **Monitor for similar issues:**
   - Check any other libraries that use React hooks at module level
   - Add them to `optimizeDeps.include` if needed

4. **Update documentation:**
   - Document the fix for team members
   - Add to onboarding guide

5. **Consider CI/CD checks:**
   - Add cache clearing to deployment scripts
   - Monitor for cache-related build failures

---

## Support

If issues persist after following all steps:

1. **Check Vite version:**
   ```bash
   npm list vite
   # Should be 6.3.5 or higher
   ```

2. **Check for conflicting plugins:**
   ```bash
   # Review vite.config.ts plugins array
   # Disable plugins one-by-one to isolate issue
   ```

3. **Enable verbose logging:**
   ```bash
   DEBUG=vite:* npm run dev
   ```

4. **Check for OS-specific issues:**
   - macOS: Clear `/tmp/vite*` directories
   - Windows: Clear `%TEMP%\vite*` directories
   - Linux: Clear `/tmp/vite*` directories

---

**Author:** Claude (Anthropic) - Expert Python Optimization Specialist
**Date:** 2025-11-26
**Version:** 1.0
**Status:** Production Ready
