# Local Build Test Report - http://localhost:4175

**Test Date:** 2025-11-24 (22:50 EST)
**Build Location:** http://localhost:4175
**Test Framework:** Playwright v1.x
**Browser:** Chromium

---

## Executive Summary

### Does the app load?
**NO** - The page loads (HTTP 200) but the React application fails to initialize due to a critical JavaScript error.

### Root Cause
**React bundling issue**: The Vite build configuration is splitting React and React-DOM into separate chunks incorrectly, causing `React.createContext` to be called on an undefined object.

---

## Detailed Findings

### 1. Page Load Status
- **HTTP Status:** 200 OK
- **HTML Delivered:** Yes
- **Scripts Loaded:** Yes (index-CtOHSOfS.js, runtime-config.js)
- **Runtime Config:** Present and valid

### 2. JavaScript Errors

#### Critical Error (Blocking App Load):
```
TypeError: Cannot read properties of undefined (reading 'createContext')
    at http://localhost:4175/assets/js/vendor-CaQWWafl.js:1:10417
```

**Occurrence:** 2 times (duplicate error)

**Impact:** CRITICAL - Prevents React from initializing, app cannot render

**Root Cause Analysis:**
The error occurs because the Vite build configuration (vite.config.ts lines 102-113) attempts to split React core and React-DOM into separate chunks, but the logic has a flaw:

```typescript
// Lines 105-113 in vite.config.ts
if (id.includes('node_modules/react-dom')) {
  return 'react-vendor';
}
if (id.includes('node_modules/react') && !id.includes('node_modules/react-')) {
  return 'react-vendor';
}
```

This creates a race condition where:
1. `react-dom` gets bundled into 'react-vendor' chunk
2. Core `react` package may be split or loaded out of order
3. When `react-dom` tries to access `React.createContext`, React is undefined

### 3. Root Element Analysis
- **#root exists:** Yes
- **#root is visible:** No (empty/not rendered)
- **#root children count:** **0** (FAILED - should be > 0)
- **#root innerHTML:** Empty string

### 4. Page State Details
```json
{
  "documentReadyState": "complete",
  "rootElement": {
    "exists": true,
    "innerHTML": "",
    "childrenCount": 0,
    "firstChildTagName": "N/A"
  },
  "bodyChildren": 3,
  "globalReact": "undefined",
  "globalReactDOM": "undefined",
  "runtimeConfig": "exists"
}
```

**Key Issue:** `globalReact: "undefined"` - React is not available in the global scope

### 5. Console Activity
The page shows normal Service Worker activity:
- ServiceWorker registered successfully
- ServiceWorker update detected and activated
- Page attempted reload for SW update
- No other console errors besides the React initialization failure

### 6. Screenshot
![Local Build Screenshot](/Users/andrewmorton/Documents/GitHub/Fleet/test-screenshots/detailed-debug.png)

**Result:** Blank white page (no UI rendered)

---

## Test Artifacts

### Screenshots
- Primary: `/Users/andrewmorton/Documents/GitHub/Fleet/test-screenshots/local-build-1764042627858.png`
- Debug: `/Users/andrewmorton/Documents/GitHub/Fleet/test-screenshots/detailed-debug.png`

### Reports
- JSON Report: `/Users/andrewmorton/Documents/GitHub/Fleet/test-screenshots/test-report.json`
- Playwright HTML: Available via `npx playwright show-report`
- Video Recording: Available in test-results directory

### Test Specs
- Main Test: `/Users/andrewmorton/Documents/GitHub/Fleet/e2e/test-local-build.spec.ts`
- Debug Test: `/Users/andrewmorton/Documents/GitHub/Fleet/e2e/detailed-debug.spec.ts`

---

## Recommendations

### CRITICAL: Fix React Bundling (BLOCKING)
**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/vite.config.ts`
**Lines:** 102-113

**Issue:** The manual chunks configuration is incorrectly splitting React packages

**Fix Required:** Ensure React and React-DOM are bundled together in the same chunk. The current logic has a flaw where packages like `react-router`, `react-hook-form`, etc. are excluded from react-vendor due to the `!id.includes('node_modules/react-')` condition, but this may also affect core React.

**Suggested Fix:**
```typescript
// More explicit React bundling
if (id.includes('node_modules/react/') ||
    id.includes('node_modules/react-dom/') ||
    id.includes('node_modules/scheduler/')) {
  return 'react-vendor';
}
```

### Verification Steps After Fix:
1. Rebuild the production build: `npm run build`
2. Serve the build: `npm run preview`
3. Re-run this test suite: `npx playwright test e2e/test-local-build.spec.ts`
4. Verify #root has children > 0
5. Verify no JavaScript errors

---

## Production Deployment Impact

**CRITICAL - DO NOT DEPLOY TO PRODUCTION**

This build will result in:
- Complete application failure
- Blank page for all users
- No error recovery possible (requires code fix)
- Zero functionality available

**Required Action:** Fix the React bundling issue before any deployment.

---

## Test Execution Details

**Command Used:**
```bash
npx playwright test e2e/test-local-build.spec.ts --reporter=line --project=chromium
```

**Test Duration:** ~5 seconds
**Retries:** 1 (automatic)
**Both attempts:** Failed with same error

**Test Framework Status:** Working correctly - detected the critical issue as expected
