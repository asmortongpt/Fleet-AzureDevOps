# SSO Integration Guide - New Azure AD Authentication System

## Overview

This guide explains how to integrate the newly created production-ready SSO authentication system into the Fleet Management application.

## What's Been Created

### New SSO Components

1. **MSAL Configuration** (`src/lib/auth/msal.config.ts`)
   - Production-ready OAuth 2.0 with PKCE flow
   - Secure token caching in localStorage
   - Automatic token refresh
   - Environment variable validation

2. **Authentication Service** (`src/lib/auth/auth.service.ts`)
   - Singleton MSAL instance pattern
   - Silent token acquisition with interactive fallback
   - Comprehensive error handling and logging
   - Clean API for all auth operations

3. **SSO Auth Context** (`src/contexts/SSOAuthContext.tsx`)
   - React context providing authentication state
   - Clean hooks-based API: `useSSOAuth()`
   - Automatic session restoration on page load

4. **Modern Login Page** (`src/pages/SSOLogin.tsx`)
   - Professional UI with CTA branding
   - Responsive design (fits on single page, no scrolling)
   - Loading states and error handling
   - Security feature badges

5. **Auth Callback Handler** (`src/pages/AuthCallback.tsx`)
   - Handles Azure AD redirect after authentication
   - Proper error handling and navigation

## Integration Options

### Option A: Full Migration (Recommended)

Replace the existing auth system entirely with the new SSO implementation.

**Advantages:**
- Cleaner codebase
- Better security with modern patterns
- Improved user experience
- Single source of truth for authentication

**Steps:**

1. **Update src/main.tsx** - Replace old auth providers

```typescript
// REMOVE these imports:
import { AuthProvider } from "./contexts/AuthContext"
import { PublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"
import { msalConfig } from "./lib/msal-config"

// ADD this import:
import { SSOAuthProvider } from "./contexts/SSOAuthContext"

// REMOVE this line:
const msalInstance = new PublicClientApplication(msalConfig)

// REPLACE the provider hierarchy (around line 276-327):
// OLD:
<MsalProvider instance={msalInstance}>
  <AuthProvider>
    {/* ...rest of providers */}
  </AuthProvider>
</MsalProvider>

// NEW:
<SSOAuthProvider>
  {/* ...rest of providers */}
</SSOAuthProvider>
```

2. **Update routing in src/main.tsx**

```typescript
// ADD import for new SSO login page:
import { SSOLogin } from "./pages/SSOLogin"

// UPDATE routes (around line 292-301):
// Change login route to use new SSO login:
<Route path="/login" element={<SSOLogin />} />
<Route path="/sso-login" element={<SSOLogin />} />  {/* Optional: both paths */}

// The callback route is already set up correctly:
<Route path="/auth/callback" element={<AuthCallback />} />
```

3. **Update Protected Routes and Components**

Replace all instances of old auth hooks with new `useSSOAuth()`:

```typescript
// OLD:
import { useMsal } from "@azure/msal-react"
const { instance, accounts } = useMsal()

// NEW:
import { useSSOAuth } from "@/contexts/SSOAuthContext"
const { user, isAuthenticated, signIn, signOut } = useSSOAuth()
```

4. **Update ProtectedRoute component** (if needed)

Check `src/components/ProtectedRoute.tsx` and update it to use `useSSOAuth()` instead of old MSAL hooks.

### Option B: Parallel Implementation (Testing Phase)

Run both systems side-by-side temporarily for testing.

**Steps:**

1. **Add SSOAuthProvider alongside existing providers** in `src/main.tsx`:

```typescript
import { SSOAuthProvider } from "./contexts/SSOAuthContext"
import { SSOLogin } from "./pages/SSOLogin"

// In the provider hierarchy:
<MsalProvider instance={msalInstance}>
  <SSOAuthProvider>  {/* Add this */}
    <AuthProvider>
      {/* ...rest */}
    </AuthProvider>
  </SSOAuthProvider>  {/* Add this */}
</MsalProvider>

// Add new route:
<Route path="/sso-login" element={<SSOLogin />} />
```

2. **Test the new SSO system**
   - Navigate to `/sso-login` to test new authentication
   - Old `/login` still works with existing system
   - Gradually migrate components to use `useSSOAuth()`

## Environment Variables Required

Ensure these are set in `.env`:

```env
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=https://proud-bay-0fdc8040f.3.azurestaticapps.net/auth/callback
```

## Testing the Integration

### Local Development

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:5173/sso-login` (or `/login` if you updated the route)

3. Click "Sign in with Microsoft"

4. You should be redirected to Azure AD login

5. After successful authentication, you'll be redirected to `/dashboard`

### What to Verify

- [ ] Login page is responsive and fits on one page without scrolling
- [ ] Azure AD redirect works correctly
- [ ] Auth callback handles the redirect properly
- [ ] User is authenticated after login
- [ ] User profile information is accessible via `useSSOAuth().user`
- [ ] Sign out works correctly
- [ ] Token refresh happens silently
- [ ] Protected routes require authentication
- [ ] Session persists across page reloads

## Migration Checklist

- [ ] Back up current `src/main.tsx`
- [ ] Update `main.tsx` with new SSO providers
- [ ] Update routing to use `SSOLogin` component
- [ ] Find and replace old MSAL hooks with `useSSOAuth()`
- [ ] Update `ProtectedRoute` component
- [ ] Test login flow end-to-end
- [ ] Test logout flow
- [ ] Test protected routes
- [ ] Test token refresh
- [ ] Verify no console errors
- [ ] Test on all supported browsers
- [ ] Deploy to staging and test
- [ ] Deploy to production

## Troubleshooting

### "VITE_AZURE_AD_CLIENT_ID is not configured" error

Ensure environment variables are set in `.env` file and the development server was restarted after changes.

### Infinite redirect loop

Check that `VITE_AZURE_AD_REDIRECT_URI` matches the redirect URI configured in Azure AD app registration.

### "MSAL not initialized" error

Ensure `SSOAuthProvider` is wrapping your app and MSAL initialization completes before rendering.

### Session not persisting

Check browser localStorage - MSAL stores tokens with keys starting with `msal.`

## Rollback Plan

If issues arise, revert to the old system:

1. Restore `src/main.tsx` from backup
2. Keep new SSO files for future use
3. Document any issues encountered

## Next Steps

After successful integration:

1. Remove old authentication files:
   - Old `src/contexts/AuthContext.tsx` (if fully migrated)
   - Old `src/lib/msal-config.ts` (replaced by `src/lib/auth/msal.config.ts`)
   - Old `src/pages/Login.tsx` (replaced by `SSOLogin.tsx`)

2. Update documentation

3. Train team on new authentication patterns

4. Monitor for authentication issues in production

## Support

For issues or questions about this SSO integration, refer to:
- [Microsoft MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- Azure AD app registration settings
- Application logs (check browser console and network tab)

---

**Created:** 2026-01-31
**Last Updated:** 2026-01-31
**Status:** Ready for Integration
