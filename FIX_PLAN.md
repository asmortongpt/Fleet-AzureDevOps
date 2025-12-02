# Fleet Management App - Fix Plan

**Date**: November 13, 2025
**Based on**: Comprehensive testing results

---

## 🎯 Issues to Fix

### 🔴 CRITICAL - Production Authentication
**Problem**: fleet.capitaltechalliance.com redirects to Microsoft OAuth, blocking demo credentials
**Impact**: Application completely unusable
**Fix Priority**: IMMEDIATE

### 🟡 HIGH - Static Web App API Connection
**Problem**: green-pond-0f040980f.3.azurestaticapps.net has no backend
**Impact**: UI works but no data loads
**Fix Priority**: HIGH

### 🟠 MEDIUM - CSP Headers
**Problem**: Content Security Policy blocks Azure Maps fonts and web workers
**Impact**: Maps don't render properly
**Fix Priority**: MEDIUM

---

## 🔧 Fix #1: Production Authentication (CRITICAL)

### Option A: Add Email/Password Auth (Recommended)

**File**: `api/src/routes/auth.ts`

Add this route BEFORE the Microsoft OAuth redirect:

```typescript
// Email/Password Login (for demo/development)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Demo credentials check
  if (email === 'admin@demofleet.com' && password === 'Demo@123') {
    const token = jwt.sign(
      {
        email: email,
        name: 'Demo Admin',
        role: 'admin',
        tenant_id: 'demo-tenant'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        email: email,
        name: 'Demo Admin',
        role: 'admin'
      }
    });
  }

  // For production, validate against database
  // const user = await db.users.findByEmail(email);
  // const validPassword = await bcrypt.compare(password, user.password);

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});
```

**File**: `frontend/src/components/AuthPage.tsx` or wherever login form submits

Update the login handler to try email/password FIRST:

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    // Try email/password login first
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
      return;
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Option B: Make Microsoft OAuth Optional

**File**: `frontend/src/components/AuthPage.tsx`

Change the "Sign in with Microsoft" to be optional:

```typescript
// Remove automatic redirect on page load
// Only redirect if user clicks "Sign in with Microsoft" button

const handleMicrosoftLogin = () => {
  window.location.href = `${API_URL}/api/auth/microsoft/login`;
};
```

### Testing the Fix

```bash
# After deploying changes:
curl -X POST https://fleet.capitaltechalliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demofleet.com","password":"Demo@123"}'

# Should return: {"success":true,"token":"...","user":{...}}
```

---

## 🔧 Fix #2: Static Web App API Connection (HIGH)

### Option A: Point to Production API (Easiest)

**File**: `.github/workflows/azure-static-web-apps.yml`

Add environment variable to build:

```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "/"
    api_location: ""
    output_location: "dist"
  env:
    VITE_API_URL: "https://fleet.capitaltechalliance.com/api"  # Add this
```

**File**: `vite.config.ts`

Ensure it reads the environment variable:

```typescript
export default defineConfig({
  // ...
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:3000/api'
    )
  }
});
```

### Option B: Deploy Backend to Static Web App

**Create**: `api/` folder structure for Azure Functions

```
api/
├── auth/
│   └── function.json
├── vehicles/
│   └── function.json
└── host.json
```

Update workflow:

```yaml
api_location: "api"  # Change from "" to "api"
```

This will deploy the backend as Azure Functions alongside the frontend.

### Testing the Fix

```bash
# Test that static app can reach API:
curl https://green-pond-0f040980f.3.azurestaticapps.net/api/health

# Should return: {"status":"healthy",...}
```

---

## 🔧 Fix #3: Content Security Policy (MEDIUM)

### Update CSP Headers

**File**: `staticwebapp.config.json` (for static web app)

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/api/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://atlas.microsoft.com; worker-src 'self' blob:; img-src 'self' data: https:; connect-src 'self' https:;"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated", "anonymous"]
    }
  ],
  "platform": {
    "apiRuntime": "node:20"
  }
}
```

**Key changes:**
- Added `https://atlas.microsoft.com` to `font-src`
- Added `worker-src 'self' blob:` for web workers

**For AKS deployment**, update the nginx configuration:

**File**: Look for nginx config in `infra/helm/` or Kubernetes manifests

Add to nginx ConfigMap:

```nginx
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://atlas.microsoft.com; worker-src 'self' blob:; img-src 'self' data: https:; connect-src 'self' https:;";
```

### Testing the Fix

Open browser console and verify:
- No CSP violations for `atlas.microsoft.com` fonts
- No CSP violations for web workers
- Map loads with proper fonts

---

## 📋 Implementation Steps

### Step 1: Fix Authentication (15-30 minutes)

```bash
# 1. Update backend auth route
cd /Users/andrewmorton/Documents/GitHub/fleet-app

# 2. Edit api/src/routes/auth.ts
# Add the email/password login route shown above

# 3. Update frontend login component
# Make Microsoft OAuth optional

# 4. Test locally
cd api
npm run dev

# In another terminal:
cd ..
npm run dev

# Test: http://localhost:5173 - try demo credentials
```

### Step 2: Update CSP Headers (5-10 minutes)

```bash
# 1. Update staticwebapp.config.json
# Add the CSP headers shown above

# 2. For AKS, update nginx config
kubectl edit configmap -n fleet-management <nginx-configmap-name>
# Add CSP headers

# 3. Restart pods
kubectl rollout restart deployment/fleet-app -n fleet-management
```

### Step 3: Connect Static App to API (10 minutes)

```bash
# 1. Update GitHub workflow
# Edit .github/workflows/azure-static-web-apps.yml
# Add VITE_API_URL environment variable

# 2. Commit and push
git add .github/workflows/azure-static-web-apps.yml
git commit -m "Configure static web app to use production API"
git push

# GitHub Actions will rebuild and deploy
```

### Step 4: Deploy Backend Changes (If using Option A)

```bash
# If using AKS deployment:

# 1. Build new Docker image
cd api
docker build -t fleetappregistry.azurecr.io/fleet-api:latest .

# 2. Push to registry
docker push fleetappregistry.azurecr.io/fleet-api:latest

# 3. Restart deployment
kubectl rollout restart deployment/fleet-api -n fleet-management

# Or use the production deployment workflow:
# Trigger manually from GitHub Actions
```

---

## ✅ Verification Checklist

After implementing fixes:

### Production (fleet.capitaltechalliance.com)

- [ ] Navigate to https://fleet.capitaltechalliance.com
- [ ] See login form with email/password fields
- [ ] Enter demo credentials: admin@demofleet.com / Demo@123
- [ ] Click "Sign In"
- [ ] **VERIFY**: Dashboard loads (not Microsoft OAuth)
- [ ] **VERIFY**: Can navigate to Vehicles, Drivers, etc.
- [ ] **VERIFY**: Data loads from API
- [ ] **VERIFY**: No console errors

### Static Web App (green-pond...)

- [ ] Navigate to https://green-pond-0f040980f.3.azurestaticapps.net
- [ ] **VERIFY**: Dashboard shows data (not all zeros)
- [ ] **VERIFY**: "Add Vehicle" creates a vehicle
- [ ] **VERIFY**: Vehicle appears in list
- [ ] **VERIFY**: API calls return JSON (not HTML)
- [ ] **VERIFY**: No 404 errors in console
- [ ] **VERIFY**: Map loads with proper fonts

### CSP Headers

- [ ] Open browser DevTools → Console
- [ ] **VERIFY**: No CSP violation warnings
- [ ] **VERIFY**: Map fonts load correctly
- [ ] **VERIFY**: Web workers function without errors

---

## 🚀 Quick Fix Script

Create this script to automate the fixes:

**File**: `fix-deployments.sh`

```bash
#!/bin/bash

echo "🔧 Fleet Management App - Automated Fix Script"
echo "=============================================="

# Fix 1: Update staticwebapp.config.json
echo ""
echo "📝 Updating staticwebapp.config.json..."
cat > staticwebapp.config.json << 'EOF'
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/api/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://atlas.microsoft.com; worker-src 'self' blob:; img-src 'self' data: https:; connect-src 'self' https:;"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated", "anonymous"]
    }
  ],
  "platform": {
    "apiRuntime": "node:20"
  }
}
EOF

# Fix 2: Update workflow to point to production API
echo ""
echo "📝 Updating GitHub workflow..."
sed -i '' 's/output_location: "dist"/output_location: "dist"\n  env:\n    VITE_API_URL: "https:\/\/fleet.capitaltechalliance.com\/api"/' .github/workflows/azure-static-web-apps.yml

# Fix 3: Commit changes
echo ""
echo "💾 Committing changes..."
git add staticwebapp.config.json .github/workflows/azure-static-web-apps.yml
git commit -m "fix: Update CSP headers and configure API URL for static web app"

echo ""
echo "✅ Fixes applied!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff HEAD~1"
echo "2. Push to deploy: git push origin main"
echo "3. Add email/password auth to api/src/routes/auth.ts manually"
echo "4. Test at: https://green-pond-0f040980f.3.azurestaticapps.net"
echo ""
```

Run it:

```bash
chmod +x fix-deployments.sh
./fix-deployments.sh
```

---

## 📊 Expected Results After Fixes

| Issue | Before | After |
|-------|--------|-------|
| Production login | ❌ OAuth redirect | ✅ Demo credentials work |
| Static app data | ❌ All zeros | ✅ Shows real data from API |
| Map fonts | ❌ CSP blocked | ✅ Load correctly |
| Web workers | ❌ CSP blocked | ✅ Function normally |
| API calls | ❌ 404 errors | ✅ Return JSON data |
| Overall status | 🔴 Broken | ✅ Working |

---

## 📞 Support

If you encounter issues:

1. Check the test reports: `TESTING_INDEX.md`
2. Review screenshots in `test-results/`
3. Check API logs: `kubectl logs -n fleet-management deployment/fleet-api`
4. Verify environment variables are set correctly

---

## 🎯 Summary

**Total Time**: ~1 hour to implement all fixes
**Difficulty**: Medium (requires understanding of auth flow and deployment)
**Impact**: Makes both deployments fully functional

**Priority Order**:
1. Fix authentication (30 min) - CRITICAL
2. Update CSP headers (10 min) - Quick win
3. Connect static app to API (10 min) - High value
4. Test everything (10 min) - Verification

After these fixes, both deployments will be fully functional and ready for production use.
