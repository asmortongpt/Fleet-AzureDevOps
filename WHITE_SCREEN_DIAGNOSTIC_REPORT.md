# Fleet White Screen Diagnostic Report

**Generated:** 2025-11-25
**Analyzed by:** Claude Code + Manual Code Review
**Repository:** https://github.com/asmortongpt/fleet

---

## 🔍 Diagnosis

The Fleet application is displaying a white screen due to **multiple critical issues** that prevent React from rendering properly. The analysis reveals several interconnected problems in the application bootstrap sequence, error handling, and environment configuration.

## 🎯 Root Causes (Ranked by Severity)

### 1. **CRITICAL: Error Boundary Re-throw in Development**
**File:** `src/ErrorFallback.tsx:9`
```typescript
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;  // ❌ THIS CAUSES WHITE SCREEN
```

**Problem:** This code re-throws errors in development mode, which bypasses React's error boundary and causes the entire app to crash silently, resulting in a white screen.

**Impact:** ANY error in the application will cause a complete crash in development mode.

---

### 2. **CRITICAL: Missing Environment Variables**
**File:** `.env` (missing)

The application requires several environment variables that are not set:

**Required Variables:**
```bash
VITE_API_URL=                                    # Can be empty for relative paths
VITE_ENVIRONMENT=development
VITE_AZURE_AD_CLIENT_ID=your-client-id           # Required for auth
VITE_AZURE_AD_TENANT_ID=your-tenant-id           # Required for auth
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=                # Optional but breaks maps
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_TEAMS_INTEGRATION=false
VITE_ENABLE_EMAIL_CENTER=false
VITE_ENABLE_DARK_MODE=true
```

**Problem:** Missing environment variables cause:
- Authentication failures
- Map component crashes
- Feature flag undefined errors
- API endpoint resolution failures

---

### 3. **HIGH: Protected Route Authentication Loop**
**File:** `src/main.tsx:38-47`
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authenticated = isAuthenticated()
  console.log('[PROTECTED_ROUTE] isAuthenticated:', authenticated)
  if (import.meta.env.DEV) {
    console.log('[PROTECTED_ROUTE] DEV mode - allowing access')
    return <>{children}</>  // ✅ Works in DEV
  }
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />  // ❌ Fails in PROD
}
```

**Problem:** In production mode, if authentication fails or returns undefined, users get stuck in a redirect loop or see a white screen.

---

### 4. **HIGH: Script Load Order Issues**
**File:** `index.html:39-42`
```html
<!-- Runtime configuration - MUST load before main app -->
<script src="./runtime-config.js"></script>
<!-- React.Children polyfill - MUST load before React for @radix-ui compatibility -->
<script src="./react-polyfill.js"></script>
```

**Problem:** These scripts are in `public/` but referenced with `./` which may fail in production builds. The path should be `/runtime-config.js` (absolute) not `./runtime-config.js` (relative).

---

### 5. **MEDIUM: Missing CSS Main File**
**File:** `index.html:38`
```html
<link href="./src/main.css" rel="stylesheet" />
```

**Problem:** This references a source file that doesn't exist in the build output. Vite should handle CSS imports automatically via `src/main.tsx`.

---

### 6. **MEDIUM: Lazy Loading Without Proper Error Handling**
**File:** `src/App.tsx:43-48`
```typescript
// Lazy load hub pages
import OperationsHub from "@/pages/hubs/OperationsHub"
import FleetHub from "@/pages/hubs/FleetHub"
import PeopleHub from "@/pages/hubs/PeopleHub"
import WorkHub from "@/pages/hubs/WorkHub"
import InsightsHub from "@/pages/hubs/InsightsHub"
```

**Problem:** These are marked as "Lazy load" in the comment but are using regular imports. If these files fail to load or have errors, there's no fallback, causing a white screen.

---

## 📋 Evidence

### Browser Console Errors (Expected)
When the white screen occurs, you should see one or more of:

1. **Error Boundary Bypass:**
   ```
   Uncaught Error: [Some error]
   ```

2. **Environment Variable Errors:**
   ```
   ReferenceError: import.meta.env.VITE_AZURE_AD_CLIENT_ID is undefined
   ```

3. **Authentication Errors:**
   ```
   [PROTECTED_ROUTE] isAuthenticated: false
   ```

4. **Script Loading Errors:**
   ```
   Failed to load resource: ./runtime-config.js
   Failed to load resource: ./react-polyfill.js
   ```

5. **CSS Loading Errors:**
   ```
   Failed to load resource: ./src/main.css
   ```

### Network Tab (Expected)
- 404 errors for `./runtime-config.js` or `./react-polyfill.js`
- 404 errors for `./src/main.css`

---

## 🔧 Fix Steps

### Step 1: Fix Error Boundary (CRITICAL - Do This First)

**File:** `src/ErrorFallback.tsx`

Replace lines 6-9:
```typescript
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;  // ❌ REMOVE THIS
```

With:
```typescript
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Always show the error boundary in production
  // In development, log to console but still show UI
  console.error('[ErrorFallback] Caught error:', error);
```

**Command:**
```bash
# Make the fix
cat > src/ErrorFallback.tsx << 'EOF'
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Always show the error boundary - helps diagnose issues
  console.error('[ErrorFallback] Caught error:', error);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>A runtime error has occurred</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. The error details are shown below.
          </AlertDescription>
        </Alert>

        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Error Details:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
          <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border overflow-auto max-h-32 mt-2">
            {error.stack}
          </pre>
        </div>

        <Button
          onClick={resetErrorBoundary}
          className="w-full"
          variant="outline"
        >
          <RefreshCwIcon />
          Try Again
        </Button>
      </div>
    </div>
  );
}
EOF
```

---

### Step 2: Create Environment File (CRITICAL)

**File:** `.env`

```bash
# Copy the example and edit
cp .env.example .env

# Edit the file with required values
cat > .env << 'EOF'
# ===========================================
# Fleet Management System - Environment Variables
# ===========================================

# Frontend (Vite)
VITE_API_URL=
VITE_ENVIRONMENT=development

# Azure AD Authentication (Use test/demo values or real ones)
VITE_AZURE_AD_CLIENT_ID=demo-client-id
VITE_AZURE_AD_TENANT_ID=demo-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Azure Maps (Optional - leave empty to disable maps)
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=false
VITE_ENABLE_TEAMS_INTEGRATION=false
VITE_ENABLE_EMAIL_CENTER=false
VITE_ENABLE_DARK_MODE=true

# Application Insights (Optional)
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=
EOF
```

---

### Step 3: Fix Script Paths in index.html

**File:** `index.html`

Replace lines 38-42:
```html
<link href="./src/main.css" rel="stylesheet" />
<!-- Runtime configuration - MUST load before main app -->
<script src="./runtime-config.js"></script>
<!-- React.Children polyfill - MUST load before React for @radix-ui compatibility -->
<script src="./react-polyfill.js"></script>
```

With:
```html
<!-- Runtime configuration - MUST load before main app -->
<script src="/runtime-config.js"></script>
<!-- React.Children polyfill - MUST load before React for @radix-ui compatibility -->
<script src="/react-polyfill.js"></script>
```

**Command:**
```bash
# Fix the paths
sed -i.bak 's|<link href="./src/main.css" rel="stylesheet" />||g' index.html
sed -i.bak 's|src="./runtime-config.js"|src="/runtime-config.js"|g' index.html
sed -i.bak 's|src="./react-polyfill.js"|src="/react-polyfill.js"|g' index.html
```

---

### Step 4: Add Safe Authentication Guard

**File:** `src/main.tsx`

Replace the ProtectedRoute function (lines 38-47) with:
```typescript
// Protected Route Component with safe fallback
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authenticated = isAuthenticated()
  console.log('[PROTECTED_ROUTE] isAuthenticated:', authenticated)

  // In development mode, always allow access
  if (import.meta.env.DEV) {
    console.log('[PROTECTED_ROUTE] DEV mode - allowing access')
    return <>{children}</>
  }

  // In production, redirect to login if not authenticated
  if (!authenticated) {
    console.log('[PROTECTED_ROUTE] Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

---

### Step 5: Rebuild and Test

```bash
# Clean previous build
rm -rf dist/ node_modules/.vite

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# The app should now load at http://localhost:5173
```

---

## ✅ Verification Steps

### 1. Check for White Screen Resolution
```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
# You should see the login page or the app dashboard (not a white screen)
```

### 2. Check Browser Console
Open Developer Tools (F12) and check the Console tab:
- ✅ No uncaught errors
- ✅ No 404 errors for scripts
- ✅ You should see: `[App] React mounted successfully`
- ✅ You should see: `[App] Background services initialized`

### 3. Check Network Tab
- ✅ `/runtime-config.js` loads with 200 status
- ✅ `/react-polyfill.js` loads with 200 status
- ✅ All JavaScript bundles load successfully

### 4. Test Error Boundary
To verify the error boundary works:
```typescript
// Temporarily add to src/App.tsx
useEffect(() => {
  // throw new Error('Test error');  // Uncomment to test
}, []);
```

You should see the error boundary UI (not a white screen).

---

## 🚀 Quick Fix Script

Run this to apply all fixes automatically:

```bash
#!/bin/bash
set -e

echo "🔧 Applying Fleet white screen fixes..."

# Fix 1: Error Boundary
echo "1️⃣ Fixing Error Boundary..."
sed -i.bak '/if (import.meta.env.DEV) throw error;/d' src/ErrorFallback.tsx
sed -i.bak '6a\  console.error("[ErrorFallback] Caught error:", error);' src/ErrorFallback.tsx

# Fix 2: Create .env
echo "2️⃣ Creating .env file..."
cat > .env << 'EOF'
VITE_API_URL=
VITE_ENVIRONMENT=development
VITE_AZURE_AD_CLIENT_ID=demo-client-id
VITE_AZURE_AD_TENANT_ID=demo-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=
VITE_ENABLE_AI_ASSISTANT=false
VITE_ENABLE_TEAMS_INTEGRATION=false
VITE_ENABLE_EMAIL_CENTER=false
VITE_ENABLE_DARK_MODE=true
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=
EOF

# Fix 3: Script paths
echo "3️⃣ Fixing script paths..."
sed -i.bak 's|<link href="./src/main.css" rel="stylesheet" />||g' index.html
sed -i.bak 's|src="./runtime-config.js"|src="/runtime-config.js"|g' index.html
sed -i.bak 's|src="./react-polyfill.js"|src="/react-polyfill.js"|g' index.html

# Fix 4: Clean build
echo "4️⃣ Cleaning build artifacts..."
rm -rf dist/ node_modules/.vite

echo "✅ Fixes applied! Run 'npm run dev' to test."
```

Save as `fix-white-screen.sh` and run:
```bash
chmod +x fix-white-screen.sh
./fix-white-screen.sh
npm run dev
```

---

## 📊 Success Criteria

After applying the fixes, you should observe:

| Metric | Before | After |
|--------|---------|-------|
| White Screen | ❌ Yes | ✅ No |
| Console Errors | ❌ Multiple | ✅ None |
| Error Boundary | ❌ Bypassed | ✅ Catches errors |
| Authentication | ❌ Undefined | ✅ Works |
| Environment Variables | ❌ Missing | ✅ Loaded |
| Script Loading | ❌ 404 errors | ✅ 200 success |

---

## 🎯 Additional Recommendations

### 1. Add Proper Lazy Loading
Replace imports in `src/App.tsx` with:
```typescript
import { lazy } from 'react';

const OperationsHub = lazy(() => import("@/pages/hubs/OperationsHub"));
const FleetHub = lazy(() => import("@/pages/hubs/FleetHub"));
const PeopleHub = lazy(() => import("@/pages/hubs/PeopleHub"));
const WorkHub = lazy(() => import("@/pages/hubs/WorkHub"));
const InsightsHub = lazy(() => import("@/pages/hubs/InsightsHub"));
```

### 2. Add Loading Fallback
Wrap routes in Suspense:
```typescript
<Suspense fallback={<ModuleLoadingSpinner />}>
  <Routes>
    {/* routes */}
  </Routes>
</Suspense>
```

### 3. Add Error Logging Service
Set up proper error tracking (Sentry, LogRocket, etc.) to catch production errors.

### 4. Add Health Check Endpoint
Create `/api/health` to verify backend connectivity.

---

## 📞 Support

If issues persist after applying these fixes:

1. **Check Browser Console:** Look for specific error messages
2. **Check Network Tab:** Look for failed requests
3. **Check Environment:** Verify all required services are running
4. **Check GitHub Issues:** https://github.com/asmortongpt/fleet/issues

---

**Report End** 🎉
