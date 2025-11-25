# White Screen Prevention Checklist

**Date:** November 25, 2025
**Status:** ✅ SAFETY MEASURES DOCUMENTED

---

## Root Causes Identified

### 1. React Context Module Loading Order
**Error:** `TypeError: Cannot read properties of undefined (reading 'createContext')`

**Cause:** Vendor chunk loading before React chunk, with libraries calling `React.createContext()` at module initialization.

**Prevention:**
```typescript
// vite.config.ts - CRITICAL: Keep ALL React packages together
manualChunks: (id) => {
  // Bundle ALL React-related packages in ONE chunk
  if (id.includes('node_modules/react') ||
      id.includes('node_modules/scheduler') ||
      id.includes('node_modules/react-dom')) {
    return 'react-vendor';
  }

  // Ensure React Router is separate but loads after React
  if (id.includes('node_modules/react-router-dom') ||
      id.includes('node_modules/@remix-run')) {
    return 'react-router';
  }
}
```

### 2. Runtime Config Script Tag Removed
**Error:** White page with NO JavaScript errors

**Cause:** Vite removing `<script src="/runtime-config.js"></script>` during HTML transformation because file doesn't exist at build time.

**Prevention:**
```typescript
// vite.config.ts - Plugin to inject runtime-config.js
function injectRuntimeConfig(): PluginOption {
  return {
    name: 'inject-runtime-config',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        '<div id="root"></div>',
        '<div id="root"></div>\n    <script src="/runtime-config.js"></script>'
      );
    },
  };
}
```

**Also create:**
```javascript
// public/runtime-config.js - Placeholder file
window.__RUNTIME_CONFIG__ = {
  VITE_AZURE_MAPS_SUBSCRIPTION_KEY: "",
  VITE_API_URL: "",
  VITE_ENVIRONMENT: "production",
  VITE_BUILD_VERSION: "latest"
};
```

### 3. Absolute vs Relative Paths
**Error:** 404 errors on Azure Static Web Apps

**Cause:** Vite generating absolute paths `/assets/...` incompatible with Azure

**Prevention:**
```typescript
// vite.config.ts
export default defineConfig({
  base: './',  // CRITICAL: Use relative paths for Azure Static Web Apps
})
```

---

## Current Safety Verification

### ✅ Check 1: React Bundling
```bash
# Verify React is bundled together
npm run build
grep -A 20 "manualChunks" vite.config.ts | grep -i "react"
```

**Expected:** All React packages in same chunk

### ✅ Check 2: Runtime Config Injection
```bash
# Verify runtime-config.js script tag exists in built HTML
npm run build
grep "runtime-config.js" dist/index.html
```

**Expected:** `<script src="/runtime-config.js"></script>` present

### ✅ Check 3: Relative Paths
```bash
# Verify relative paths in built assets
npm run build
grep -o 'href="[^"]*"' dist/index.html | head -5
```

**Expected:** `href="./assets/...` (relative, not absolute)

### ✅ Check 4: CJS/ESM Interop
```bash
# Verify cjs-interop plugin is active
grep -A 10 "cjsInterop" vite.config.ts
```

**Expected:** Plugin configured for icon libraries

---

## Pre-Deployment Safety Tests

### Test 1: Production Build Test
```bash
npm run build && npm run preview
```
**Must Pass:** Application loads without white screen

### Test 2: Playwright White Screen Test
```bash
npx playwright test e2e/production-deep-diagnosis.spec.ts
```

**Must Pass:**
- ✅ Runtime config loaded: true
- ✅ Root has children: true
- ✅ No console errors
- ✅ Application rendered

### Test 3: Bundle Analysis
```bash
npm run build
ls -lh dist/assets/*.js | grep react
```

**Must Verify:**
- React, react-dom, scheduler in SAME chunk
- No React code in vendor chunk
- Chunk sizes reasonable (<500KB per chunk ideally)

### Test 4: Runtime Config Verification
```bash
npm run build
curl http://localhost:4173 | grep "runtime-config.js"
```

**Must Pass:** Script tag present in served HTML

---

## Critical vite.config.ts Settings

### MUST HAVE - Do Not Change:

```typescript
export default defineConfig({
  // 1. RELATIVE PATHS (Azure compatibility)
  base: './',

  // 2. PLUGINS (in order)
  plugins: [
    react(),
    tailwindcss(),
    cjsInterop({
      dependencies: [
        '@phosphor-icons/react',
        'lucide-react',
        // ... other icon libraries
      ],
    }),
    injectRuntimeConfig(), // CRITICAL: Must inject runtime-config.js
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: ALL React packages together
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // ... other chunks
        }
      }
    }
  }
})
```

---

## Dangerous Operations (DO NOT DO)

### ❌ NEVER: Split React Packages
```typescript
// ❌ WRONG - Will cause white screen
manualChunks: (id) => {
  if (id.includes('react-dom')) return 'react-dom';  // ❌ DON'T SPLIT
  if (id.includes('react/')) return 'react';          // ❌ DON'T SPLIT
}
```

### ❌ NEVER: Remove Runtime Config Plugin
```typescript
// ❌ WRONG - Will cause white screen in production
plugins: [
  react(),
  // injectRuntimeConfig(), // ❌ DON'T REMOVE THIS
]
```

### ❌ NEVER: Use Absolute Paths
```typescript
// ❌ WRONG - Will break on Azure
export default defineConfig({
  base: '/',  // ❌ DON'T USE ABSOLUTE
})
```

### ❌ NEVER: Remove CJS Interop
```typescript
// ❌ WRONG - May cause module loading errors
plugins: [
  react(),
  // cjsInterop({...}), // ❌ DON'T REMOVE THIS
]
```

---

## Safe Optimization Patterns

### ✅ SAFE: Code Splitting Components
```typescript
// ✅ SAFE - Lazy load AFTER React is loaded
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  )
}
```

### ✅ SAFE: Extract Large Dependencies
```typescript
// ✅ SAFE - Extract non-React libraries
manualChunks: (id) => {
  if (id.includes('node_modules/lodash')) return 'lodash';
  if (id.includes('node_modules/date-fns')) return 'date-fns';
  // These load independently, safe to split
}
```

### ✅ SAFE: React.memo and useMemo
```typescript
// ✅ SAFE - Performance optimization
const Component = React.memo(({ props }) => {
  const data = useMemo(() => compute(props), [props])
  return <div>{data}</div>
})
```

---

## Emergency Rollback

If white screen appears in production:

### Step 1: Immediate Rollback
```bash
# Rollback to last known good deployment
kubectl rollout undo deployment/fleet-app -n fleet-management
```

### Step 2: Verify Last Good Build
```bash
# Find last successful deployment
git log --oneline | grep -E "(deploy|production|release)"
```

### Step 3: Redeploy Last Good
```bash
# Checkout last good commit
git checkout <last-good-commit>

# Rebuild and redeploy
npm run build
docker build -t fleet-app:rollback .
# ... deploy
```

---

## CI/CD Safety Checks

Add to pipeline (Azure DevOps or GitHub Actions):

```yaml
- name: White Screen Prevention Checks
  run: |
    # Build
    npm run build

    # Check 1: Runtime config script tag
    if ! grep -q 'runtime-config.js' dist/index.html; then
      echo "❌ FAIL: Missing runtime-config.js"
      exit 1
    fi

    # Check 2: Relative paths
    if grep -q 'href="/' dist/index.html; then
      echo "❌ FAIL: Absolute paths detected"
      exit 1
    fi

    # Check 3: React bundle verification
    if [ ! -f dist/assets/*react-vendor*.js ]; then
      echo "❌ FAIL: React vendor chunk missing"
      exit 1
    fi

    echo "✅ PASS: All safety checks passed"
```

---

## Monitoring & Alerts

### Health Check Endpoint
```typescript
// Add to API health check
{
  "status": "healthy",
  "checks": {
    "runtimeConfig": typeof window.__RUNTIME_CONFIG__ !== 'undefined',
    "reactMounted": document.getElementById('root')?.hasChildNodes(),
    "noErrors": window.onerror === null
  }
}
```

### Browser Error Tracking
```javascript
// Add to main.tsx
window.addEventListener('error', (event) => {
  if (event.message.includes('createContext')) {
    // CRITICAL: White screen error detected
    console.error('WHITE SCREEN ERROR: React module loading order issue')
    // Send to monitoring service
  }
})
```

---

## Summary Checklist

Before ANY deployment to production:

- [ ] ✅ `npm run build` succeeds
- [ ] ✅ `grep "runtime-config.js" dist/index.html` finds script tag
- [ ] ✅ `grep 'href="./' dist/index.html` shows relative paths
- [ ] ✅ `ls dist/assets/*react-vendor*.js` React chunk exists
- [ ] ✅ `npm run preview` application loads (not white screen)
- [ ] ✅ `npx playwright test e2e/production-deep-diagnosis.spec.ts` passes
- [ ] ✅ Browser console has zero errors on localhost:4173
- [ ] ✅ `window.__RUNTIME_CONFIG__` exists in browser console

**Only deploy if ALL checks pass.**

---

## Key Learnings

1. **React bundling is CRITICAL** - All React packages must load together
2. **Runtime config needs special handling** - Vite will remove it without plugin
3. **Relative paths required for Azure** - Absolute paths break on Static Web Apps
4. **Test production builds locally** - `npm run preview` catches issues early
5. **Monitor for specific errors** - "createContext" error is the canary

---

**Status:** ✅ All safety measures documented and verified
**Last Updated:** November 25, 2025
**Next Review:** Before any vite.config.ts changes
