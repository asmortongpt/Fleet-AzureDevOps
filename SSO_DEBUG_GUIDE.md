
# SSO Debug Guide

## 1. Frontend Console Debug

Open browser console and run:
```javascript
// Check MSAL configuration
console.log('MSAL Config:', window.msal?.config)

// Check if MSAL instance exists
console.log('MSAL Instance:', window.msal)

// Monitor auth events
window.addEventListener('fleet-auth-refresh', () => {
  console.log('[DEBUG] Auth refresh event triggered')
})

// Check localStorage for MSAL tokens
Object.keys(localStorage)
  .filter(k => k.includes('msal'))
  .forEach(k => console.log(k, localStorage.getItem(k)))
```

## 2. Backend Log Monitoring

```bash
# Watch backend logs in real-time
cd api
tail -f logs/auth.log

# Or monitor with grep
tail -f logs/auth.log | grep -E "microsoft|exchange|SSO"
```

## 3. Manual Token Exchange Test

```bash
# Test backend endpoint directly (need real ID token from browser)
curl -X POST http://localhost:3001/api/auth/microsoft/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }'
```

## 4. Azure AD Verification

1. Go to https://portal.azure.com
2. Azure Active Directory > App registrations
3. Find app: Fleet-CTA (client ID: baae0851...)
4. Check Authentication > Redirect URIs:
   - Must include: http://localhost:5173/auth/callback
   - Platform: Single-page application (SPA)
5. Check API permissions:
   - openid ✅
   - profile ✅
   - email ✅
6. Check "Implicit grant and hybrid flows":
   - Access tokens ✅
   - ID tokens ✅

## 5. Common Fixes

### Fix 1: Redirect URI Mismatch

```typescript
// src/config/auth-config.ts
export function getRedirectUri(): string {
  return 'http://localhost:5173/auth/callback'  // Must match Azure AD exactly
}
```

### Fix 2: CORS with Credentials

```typescript
// api/src/server.ts
app.use(cors({
  origin: 'http://localhost:5173',  // Exact origin, not '*'
  credentials: true  // Required for cookies
}))
```

### Fix 3: Cookie Configuration

```typescript
// api/src/routes/auth.ts
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: false,  // false for localhost, true for production
  sameSite: 'lax',  // 'lax' works for localhost, 'none' requires secure:true
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
})
```

### Fix 4: MSAL Initialization

```typescript
// src/main.tsx
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}`,
    redirectUri: 'http://localhost:5173/auth/callback'
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
}

const pca = new PublicClientApplication(msalConfig)

// Wrap app in MsalProvider
<MsalProvider instance={pca}>
  <App />
</MsalProvider>
```

## 6. Step-by-Step SSO Test

1. ✅ Clear browser cache and localStorage
2. ✅ Navigate to http://localhost:5173/login
3. ✅ Open browser console (F12)
4. ✅ Click "Sign in with Microsoft"
5. ❓ Expected: Redirect to login.microsoftonline.com
   - ❌ If nothing happens: MSAL not initialized
   - ❌ If error: Check console for details
6. ❓ Enter Microsoft credentials
7. ❓ Expected: Redirect back to /auth/callback
   - ❌ If wrong URI: Redirect URI mismatch
8. ❓ Expected: See "Establishing Protocol" loading screen
   - ❌ If error: Check console for token exchange failure
9. ❓ Expected: Redirect to dashboard (/)
   - ❌ If stuck: Session cookie not set
10. ✅ Success: Dashboard loads, user is authenticated
