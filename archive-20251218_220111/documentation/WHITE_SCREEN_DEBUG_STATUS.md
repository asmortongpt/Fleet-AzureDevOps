# Fleet White Screen Debug Status - November 25, 2025

## Current Status: IN PROGRESS

The white screen error has been partially diagnosed but not fully resolved.

## Issues Identified and Fixed

### ✅ Fixed: Asset Path Issue
- **Problem**: Vite was generating absolute paths (`/assets/...`) incompatible with Azure Static Web Apps
- **Solution**: Set `base: './'` in vite.config.ts
- **Status**: ✅ RESOLVED - All generated paths are now relative

### ✅ Fixed: CJS/ESM Interop Plugin Added
- **Problem**: Icon libraries and React utilities need CJS/ESM interop
- **Solution**: Added and configured `vite-plugin-cjs-interop`
- **Status**: ✅ CONFIGURED

### ✅ Improved: Chunk Splitting Strategy
- **Changes Made**:
  - Separated React utilities into dedicated `react-utils` chunk (111KB)
  - Reduced vendor chunk from 333KB to 221KB
  - Added specific chunks for icon libraries, UI components, charts, maps, etc.
- **Status**: ✅ IMPROVED

## Current Blocker

### ❌ UNRESOLVED: Module Loading Order Issue

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'createContext')
at http://localhost:4173/assets/js/vendor-B1WsUjtF.js:1:10093
```

**Root Cause**:
Something in the `vendor` chunk has **top-level/module-initialization code** that immediately calls `React.createContext()` when the module loads. However, due to Vite's modulepreload order, the vendor chunk loads before the react-vendor chunk.

**HTML Module Preload Order** (current):
```html
<link rel="modulepreload" href="./assets/js/vendor-B1WsUjtF.js">      <!-- Line 3 -->
<link rel="modulepreload" href="./assets/js/react-vendor-BmTOzVNw.js">  <!-- Line 6 -->
```

The vendor chunk is preloaded before React, causing the error.

### Why This Is Hard to Fix

1. **Vite's modulepreload is a hint, not a guarantee** - The browser decides actual load/execution order
2. **Some library has eager initialization** - Unknown which library in the vendor chunk is calling React.createContext at module level
3. **CJS/ESM interop plugin doesn't solve execution order** - It only fixes import/export wrapping

### Attempted Solutions (None Fully Successful)

1. ❌ Adjusting manual chunks configuration
2. ❌ Moving React-dependent libraries to separate chunks
3. ❌ Adding vite-plugin-cjs-interop
4. ❌ Extracting more libraries from vendor chunk

## Next Steps / Options

### Option 1: Identify the Culprit Library
- Use source map to find exact library calling createContext
- Move that specific library to a chunk that loads after React
- **Pros**: Surgical fix, maintains performance
- **Cons**: Time-consuming detective work

### Option 2: Disable Code Splitting
- Bundle everything into a single chunk
- **Pros**: Guarantees load order, simple
- **Cons**: Large initial bundle, poor caching, not scalable

### Option 3: Use Dynamic Imports
- Lazy-load problematic libraries after React mounts
- **Pros**: Clean separation, guaranteed order
- **Cons**: Requires code changes in app, may affect UX

### Option 4: Custom Vite Plugin
- Create a plugin to enforce modulepreload order
- **Pros**: Fixes root cause
- **Cons**: Complex, may break with Vite updates

### Option 5: Investigate Service Worker
- The service worker is reloading the page immediately after activation
- This might be interfering with module loading
- **Pros**: May be the actual root cause
- **Cons**: Requires disabling SW to test

## Build Metrics

### Current Build Output
```
dist/assets/js/react-vendor-BmTOzVNw.js     142.34 kB │ gzip:  45.78 kB
dist/assets/js/vendor-B1WsUjtF.js           221.30 kB │ gzip:  71.34 kB
dist/assets/js/react-utils-Bu_ITqDr.js      111.78 kB │ gzip:  34.92 kB
dist/assets/js/ui-icons-D7MGbKRG.js         388.28 kB │ gzip:  89.79 kB
dist/assets/js/ui-radix-1RhGgIbN.js         113.17 kB │ gzip:  31.02 kB
dist/assets/js/index-A2lrXO6h.js            975.77 kB │ gzip: 196.02 kB
```

**Total**: ~1.95 MB (compressed: ~469 KB)

## Configuration Files Modified

1. ✅ `vite.config.ts` - Base path, CJS interop, chunk splitting
2. ✅ `index.html` - Verified relative paths (unchanged, generated)
3. ✅ `package.json` - Added vite-plugin-cjs-interop

## Test Results

**Playwright detailed console inspection**:
- ✅ Preview server running
- ✅ All assets load (HTTP 200)
- ✅ No icon library errors (CJS interop working)
- ❌ React not initializing (createContext error)
- ❌ Root element empty (white screen)

## Recommendations

**IMMEDIATE**: Try Option 5 (investigate Service Worker). The logs show:
```
ServiceWorker updated - reloading page...
```

The page is being reloaded immediately after SW activation, which might interrupt module loading. Try:

1. Disable SW registration temporarily
2. Test if app loads without SW
3. If successful, fix SW activation logic

**FALLBACK**: If SW is not the issue, proceed with Option 1 (identify culprit library) by:
1. Build with sourcemaps enabled
2. Load in browser DevTools
3. Find exact line calling createContext in vendor chunk
4. Trace back to source library
5. Move that library to react-utils chunk

## Files for Reference

- Configuration: `vite.config.ts`
- Test suite: `e2e/detailed-console-inspect.spec.ts`
- Build output: `dist/index.html`
- This document: `WHITE_SCREEN_DEBUG_STATUS.md`

---

**Last Updated**: November 25, 2025
**Debug Session Duration**: ~2 hours
**Primary Investigator**: Claude Code (Sonnet 4.5)
