# Fleet-CTA: Quick Start Fixes
**Priority: CRITICAL - Start Here**
**Estimated Time: 2-4 hours**
**Date:** February 10, 2026

---

## 🚨 CRITICAL SECURITY FIX (30 minutes)

### Fix 1: Remove Hardcoded Auth Bypass

**File:** `src/components/auth/ProtectedRoute.tsx`

**Current Code (Line 22-23):**
```typescript
// Development auth bypass flag
// TEMPORARY: Hardcoded to true for debugging (TODO: investigate why env var not working)
const SKIP_AUTH = true; // import.meta.env.VITE_SKIP_AUTH === 'true';
```

**✅ Replace With:**
```typescript
// Development auth bypass flag (controlled by environment variable)
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';
```

**Environment Files:**

`.env.development` (create or update):
```bash
# Development - auth bypass enabled for easier testing
VITE_SKIP_AUTH=true
```

`.env.production` (create or update):
```bash
# Production - auth bypass DISABLED
# VITE_SKIP_AUTH=false  # Commented out = undefined = false
```

`.env.test` (create or update):
```bash
# Test - auth bypass enabled for automated testing
VITE_SKIP_AUTH=true
```

**Verify Fix:**
```bash
# In development - should work without login
npm run dev

# In production build - should require login
VITE_SKIP_AUTH=false npm run build
npm run preview
# Try accessing http://localhost:4173 - should redirect to login
```

---

## 🔧 CRITICAL CORS FIX (15 minutes)

### Fix 2: Update CORS Configuration

**File:** `api-standalone/server.js` (or `api/src/server.ts` if using TypeScript API)

**Current Code (Line 32-40):**
```javascript
// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  // ❌ TOO PERMISSIVE
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

**✅ Replace With:**
```javascript
// CORS middleware - production-safe
app.use((req, res, next) => {
  // Whitelist of allowed origins
  const allowedOrigins = [
    'https://proud-bay-0fdc8040f.3.azurestaticapps.net', // Production
    'http://localhost:5173', // Development
    'http://localhost:4173', // Preview
    process.env.FRONTEND_URL, // Additional from env
  ].filter(Boolean); // Remove undefined values

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});
```

**Verify Fix:**
```bash
# Restart backend
npm run dev

# Test from allowed origin (should work)
curl -H "Origin: http://localhost:5173" http://localhost:3000/health

# Test from disallowed origin (should not have CORS header)
curl -H "Origin: http://evil.com" http://localhost:3000/health
```

---

## 🛠️ HIGH PRIORITY TYPESCRIPT FIXES (60-90 minutes)

### Fix 3: Three.js Type Errors

**Problem:** 50+ type errors related to `@react-three/fiber`

**Solution 1: Install Type Definitions (Recommended)**

```bash
# Install missing type definitions
npm install --save-dev @types/three

# Update @react-three packages to latest
npm update @react-three/fiber @react-three/drei @react-three/postprocessing
```

**Solution 2: Add Custom Type Declarations**

Create `src/types/react-three-fiber.d.ts`:
```typescript
import { Object3DNode } from '@react-three/fiber'
import { Mesh, BoxGeometry, SphereGeometry, MeshStandardMaterial } from 'three'

declare module '@react-three/fiber' {
  interface ThreeElements {
    mesh: Object3DNode<Mesh, typeof Mesh>
    boxGeometry: Object3DNode<BoxGeometry, typeof BoxGeometry>
    sphereGeometry: Object3DNode<SphereGeometry, typeof SphereGeometry>
    meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>
  }
}
```

**Update tsconfig.json** to include custom types:
```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*", "src/types/**/*"]
}
```

**Verify Fix:**
```bash
npm run typecheck
# Should see fewer errors (at least Three.js errors gone)
```

### Fix 4: Recharts Import Error

**File:** `src/components/ChartCard.tsx`

**Current Code (Line 15):**
```typescript
import { Bar } from 'recharts/es6/cartesian/Bar.js'; // ❌ Deep import causing issues
```

**✅ Replace With:**
```typescript
import { Bar } from 'recharts'; // ✅ Use standard import
```

**Verify Fix:**
```bash
npm run typecheck | grep recharts
# Should show no recharts errors
```

### Fix 5: User Type Missing 'name' Property

**File:** Find the User type definition (likely in `src/types/` or `src/schemas/`)

Search for it:
```bash
grep -r "interface User" src/ --include="*.ts" --include="*.tsx"
# or
grep -r "type User" src/ --include="*.ts" --include="*.tsx"
```

**Add 'name' Property:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;  // ✅ Add this line
  role: string;
  permissions?: string[];
  // ... other properties
}
```

**Files that will be fixed:**
- `src/components/dashboards/roles/DriverDashboard.tsx` (line 38)

### Fix 6: Fix Storybook Decorator Types

**File:** `.storybook/decorators.tsx`

**Current Code:**
```typescript
export const withQueryClient = (Story) => { ... }  // ❌ Untyped parameter
```

**✅ Replace With:**
```typescript
import type { StoryFn } from '@storybook/react';

export const withQueryClient = (Story: StoryFn) => { ... }  // ✅ Typed parameter
```

Apply same fix to all decorators in this file.

**Verify All TypeScript Fixes:**
```bash
npm run typecheck 2>&1 | tee typecheck-results.txt
# Review remaining errors
# Target: < 10 errors (down from 50+)
```

---

## 📦 PRODUCTION BUILD TEST (30 minutes)

### Step 1: Create Production Build

```bash
# Clean previous builds
rm -rf dist/

# Create production build
NODE_ENV=production npm run build
```

**Expected Output:**
```
vite v7.3.1 building for production...
✓ 1234 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-abc123.css    123.45 kB │ gzip: 45.67 kB
dist/assets/index-def456.js     456.78 kB │ gzip: 123.45 kB
✓ built in 12.34s
```

### Step 2: Analyze Build Size

```bash
# Check dist folder size
du -sh dist/

# List largest files
du -ah dist/ | sort -rh | head -20
```

**Target Sizes:**
- Total dist/: < 2MB
- Initial bundle: < 500KB
- Largest chunk: < 1MB

### Step 3: Test Production Build Locally

```bash
# Start preview server
npm run preview
```

**Manual Testing Checklist:**
- [ ] Navigate to http://localhost:4173
- [ ] Should be redirected to /login (auth bypass is off)
- [ ] Enter credentials and login
- [ ] Fleet Hub loads and displays data
- [ ] Operations Hub loads
- [ ] Drivers Hub loads
- [ ] Maintenance Hub loads
- [ ] Charts render correctly
- [ ] Maps display correctly
- [ ] 3D vehicle viewer works
- [ ] No console errors in browser DevTools

### Step 4: Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. Click "Analyze page load"

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Common Issues & Fixes:**
- **Low Performance:** Reduce bundle size, enable caching
- **Low Accessibility:** Fix ARIA labels, contrast issues
- **Low Best Practices:** Update dependencies, fix security headers
- **Low SEO:** Add meta descriptions, fix heading hierarchy

---

## 🧪 RUN AUTOMATED TESTS (30 minutes)

### Unit Tests
```bash
npm test
```

### E2E Tests (Quick Smoke Test)
```bash
# Run quick smoke tests only
npx playwright test tests/e2e/00-smoke-tests/
```

### Accessibility Tests
```bash
npm run test:a11y
```

### Full E2E Suite (if time permits)
```bash
# Run all E2E tests (may take 5-15 minutes)
npx playwright test

# View report
npx playwright show-report
```

---

## 📋 VERIFICATION CHECKLIST

After completing all fixes above, verify:

- [ ] ✅ Auth bypass removed and controlled by environment variable
- [ ] ✅ CORS properly configured for production
- [ ] ✅ TypeScript errors reduced significantly (< 10 remaining)
- [ ] ✅ Production build completes successfully
- [ ] ✅ Production build tested locally and works
- [ ] ✅ Lighthouse score > 90 on all metrics
- [ ] ✅ Automated tests pass
- [ ] ✅ No console errors in browser

**If all checked:** You're ready to proceed to staging deployment! 🎉

**If any unchecked:** Review the issue and fix before proceeding.

---

## 🚀 NEXT STEPS

After completing these quick fixes:

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "fix: critical security and build issues

   - Remove hardcoded auth bypass
   - Update CORS configuration for production
   - Fix TypeScript errors (Three.js, Recharts, User type)
   - Verify production build
   - All tests passing"

   git push origin feature/feb-2026-enterprise-enhancements
   ```

2. **Deploy to Staging**
   - Follow `DEPLOYMENT_CHECKLIST.md`
   - Test thoroughly in staging environment

3. **Schedule Production Deployment**
   - Obtain all required sign-offs
   - Schedule maintenance window (if needed)
   - Execute production deployment

---

## 📞 SUPPORT

**Questions or Issues?**
- Review: `SDLC_COMPREHENSIVE_REVIEW_2026-02-10.md`
- Follow: `DEPLOYMENT_CHECKLIST.md`
- Contact: DevOps team or Technical Lead

**Emergency Rollback:**
- See "Rollback Plan" section in `DEPLOYMENT_CHECKLIST.md`

---

**Created:** February 10, 2026
**Last Updated:** February 10, 2026
**Maintained By:** DevOps Team
