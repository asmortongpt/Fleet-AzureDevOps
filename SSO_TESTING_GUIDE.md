# SSO Testing Guide
## ArchonY Fleet Management - Azure AD Authentication

This comprehensive guide covers all aspects of testing the SSO (Single Sign-On) authentication flow using Azure AD and MSAL.

---

## Table of Contents

1. [Pre-Test Setup](#pre-test-setup)
2. [Automated Tests](#automated-tests)
3. [Manual Testing Checklist](#manual-testing-checklist)
4. [Debugging SSO Issues](#debugging-sso-issues)
5. [Common Issues and Fixes](#common-issues-and-fixes)
6. [Test Accounts Setup](#test-accounts-setup)
7. [Browser Console Inspection](#browser-console-inspection)
8. [Security Testing](#security-testing)
9. [Performance Testing](#performance-testing)

---

## Pre-Test Setup

### Environment Variables

Ensure all required environment variables are set in your `.env` file:

```bash
# Azure AD Configuration
VITE_AZURE_AD_CLIENT_ID=<your-client-id>
VITE_AZURE_AD_TENANT_ID=<your-tenant-id>
VITE_AZURE_AD_REDIRECT_URI=<your-redirect-uri>

# Test User Credentials (for automated tests)
TEST_USER_EMAIL=<test-user@capitaltechalliance.com>
TEST_USER_PASSWORD=<test-password>
```

### Verify Azure AD App Registration

Run the configuration verification script:

```bash
tsx scripts/verify-azure-ad-config.ts
```

This will check:
- ✅ Environment variables are set
- ✅ Azure AD endpoints are reachable
- ✅ JWKS keys are available
- ✅ Redirect URIs are valid
- ✅ App permissions are configured

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

---

## Automated Tests

### 1. SSO Flow Tests (Playwright)

**Location:** `tests/auth/sso-flow.test.ts`

**What it tests:**
- Login page rendering
- Microsoft redirect flow
- Callback handling
- Token extraction
- Session persistence
- Protected route access
- Logout flow

**Run tests:**

```bash
# Run all SSO flow tests
npx playwright test tests/auth/sso-flow.test.ts

# Run with UI
npx playwright test tests/auth/sso-flow.test.ts --ui

# Run specific test
npx playwright test tests/auth/sso-flow.test.ts -g "should display SSO login page"

# Debug mode
npx playwright test tests/auth/sso-flow.test.ts --debug
```

### 2. JWT Validation Tests (Vitest)

**Location:** `tests/auth/jwt-validation.test.ts`

**What it tests:**
- JWT token format validation
- Signature verification
- Expiration handling
- Payload extraction
- Audience (aud) validation
- Issuer (iss) validation
- Token tampering detection

**Run tests:**

```bash
# Run all JWT tests
npm test tests/auth/jwt-validation.test.ts

# Watch mode
npm run test:watch tests/auth/jwt-validation.test.ts

# Coverage
npm run test:coverage tests/auth/jwt-validation.test.ts
```

### 3. Session Management Tests (Vitest)

**Location:** `tests/auth/session-management.test.ts`

**What it tests:**
- Session creation
- Session persistence
- Token refresh
- Session expiration
- Logout cleanup
- Concurrent session handling
- CSRF protection

**Run tests:**

```bash
# Run all session tests
npm test tests/auth/session-management.test.ts

# Watch mode
npm run test:watch tests/auth/session-management.test.ts
```

### 4. Manual Testing Script

**Location:** `scripts/test-sso-manual.ts`

**What it does:**
- Step-by-step interactive testing
- Guides you through the entire SSO flow
- Captures verification at each stage
- Generates test report

**Run manual tests:**

```bash
tsx scripts/test-sso-manual.ts
```

---

## Manual Testing Checklist

Use this checklist for comprehensive manual verification of the SSO flow.

### ✅ Phase 1: Login Page

- [ ] Navigate to `/login`
- [ ] ArchonY logo is displayed
- [ ] "Capital Tech Alliance" branding is visible
- [ ] Official gradient bar (GOLDEN HOUR → NOON) is shown
- [ ] "Sign in with Microsoft" button is present and styled correctly
- [ ] No JavaScript errors in console
- [ ] Page is responsive on mobile/tablet
- [ ] Support contact link works

**Expected State:**
- URL: `http://localhost:5173/login` (or production URL)
- No authentication cookies present
- Clean console (no errors)

---

### ✅ Phase 2: Microsoft Redirect

- [ ] Click "Sign in with Microsoft" button
- [ ] Button shows loading state ("Authenticating...")
- [ ] Redirected to `login.microsoftonline.com`
- [ ] URL contains correct `client_id` parameter
- [ ] URL contains correct `redirect_uri` parameter
- [ ] URL contains `response_type=code` (or `token id_token`)
- [ ] URL contains `scope=openid profile email User.Read`
- [ ] No errors during redirect

**Expected State:**
- URL: `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize?...`
- Microsoft login page loads successfully

---

### ✅ Phase 3: Microsoft Authentication

- [ ] Email input accepts test user email
- [ ] "Next" button works
- [ ] Password input accepts password
- [ ] "Sign in" button works
- [ ] Multi-factor authentication (MFA) prompts if required
- [ ] "Stay signed in?" prompt appears (optional)
- [ ] No authentication errors from Microsoft
- [ ] Successful authentication confirmation

**Expected State:**
- Microsoft validates credentials
- User is authenticated in Azure AD
- Ready to redirect back to app

---

### ✅ Phase 4: Callback Processing

- [ ] Redirected to `/auth/callback`
- [ ] Cinematic loading screen appears
- [ ] "Establishing Protocol" message shows
- [ ] "Verified by Microsoft Azure AD" text displays
- [ ] Loading animation is smooth (no flicker)
- [ ] No console errors during callback
- [ ] Token exchange completes successfully
- [ ] Redirected to dashboard (not login)
- [ ] Redirect happens within 2-3 seconds

**Expected State:**
- URL: `http://localhost:5173/auth/callback` (briefly)
- Then: `http://localhost:5173/` (dashboard)
- `auth_token` cookie is set
- MSAL account data in sessionStorage

---

### ✅ Phase 5: Authenticated State

- [ ] User menu/avatar is displayed
- [ ] User name is shown correctly
- [ ] User role badge is visible
- [ ] Can access protected routes:
  - [ ] `/fleet` (Fleet Hub)
  - [ ] `/drivers` (Drivers Hub)
  - [ ] `/compliance` (Compliance Hub)
  - [ ] `/maintenance` (Maintenance Hub)
- [ ] No redirect to login when accessing protected routes
- [ ] API requests include authentication
- [ ] User data loads correctly

**Expected State:**
- Fully authenticated session
- All protected features accessible
- API calls succeed with auth headers/cookies

---

### ✅ Phase 6: Session Persistence

- [ ] Refresh page (F5 / Cmd+R)
- [ ] Still authenticated (no redirect to login)
- [ ] User data persists
- [ ] Protected routes still accessible
- [ ] Close and reopen browser tab
- [ ] Session persists (if "Stay signed in" was selected)
- [ ] Multiple tabs share same session

**Expected State:**
- Session remains active after refresh
- No re-authentication required
- Cookies and sessionStorage intact

---

### ✅ Phase 7: Token Inspection (DevTools)

Open browser DevTools:

**Application Tab > Cookies:**
- [ ] `auth_token` or `session` cookie exists
- [ ] Cookie has `HttpOnly` flag ✅
- [ ] Cookie has `Secure` flag (if HTTPS) ✅
- [ ] Cookie has `SameSite=Strict` ✅
- [ ] Cookie expiration is set correctly (e.g., 1 hour)

**Application Tab > Session Storage:**
- [ ] MSAL account keys present
- [ ] MSAL token cache present
- [ ] Account data includes user info
- [ ] No plain text access tokens in localStorage
- [ ] No passwords stored anywhere

**Console Tab:**
- [ ] No error messages
- [ ] MSAL logs visible (in dev mode)
- [ ] Auth flow logs show success

---

### ✅ Phase 8: Token Refresh

- [ ] Wait for token to approach expiration (or force it)
- [ ] Automatic refresh triggers (before expiry)
- [ ] No user interruption during refresh
- [ ] New token is obtained silently
- [ ] Session continues without re-login
- [ ] Console shows refresh logs (in dev mode)

**Expected State:**
- Token refreshes automatically at ~5 min before expiry
- Seamless user experience
- New `auth_token` cookie issued

---

### ✅ Phase 9: Logout Flow

- [ ] Click user menu
- [ ] "Logout" / "Sign Out" option is visible
- [ ] Click logout
- [ ] Confirmation dialog (if implemented)
- [ ] Redirected to login page
- [ ] Auth cookie is cleared
- [ ] sessionStorage is cleared
- [ ] localStorage demo flags cleared
- [ ] Cannot access protected routes (redirect to login)
- [ ] Microsoft session also logged out (optional)

**Expected State:**
- URL: `/login`
- All auth data cleared
- Cannot access protected routes without re-login

---

### ✅ Phase 10: Error Handling

Test these error scenarios:

**Invalid Credentials:**
- [ ] Enter wrong password
- [ ] Microsoft shows error message
- [ ] Can retry login
- [ ] No redirect back to app

**Cancelled Login:**
- [ ] Start login flow
- [ ] Cancel on Microsoft page
- [ ] Redirected to login with error message
- [ ] Error description is shown
- [ ] Can retry login

**Network Errors:**
- [ ] Disconnect internet
- [ ] Try to login
- [ ] Appropriate error message shown
- [ ] No broken UI state

**Token Exchange Failure:**
- [ ] Simulate backend error (via DevTools > Network)
- [ ] Block `/api/auth/microsoft/exchange`
- [ ] Error is handled gracefully
- [ ] User is informed of issue
- [ ] Can retry

---

## Debugging SSO Issues

### Enable Debug Logging

In `/src/lib/msal-config.ts`, set log level to verbose:

```typescript
system: {
  loggerOptions: {
    logLevel: 3, // Verbose
  }
}
```

### Use Auth Debug Panel

In development mode, add the Auth Debug Panel to any page:

```tsx
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';

// In your component
{import.meta.env.DEV && <AuthDebugPanel />}
```

This shows:
- Current user data
- Token contents (decoded)
- Token expiration countdown
- MSAL account info
- Manual refresh/logout buttons

### Browser DevTools Network Tab

Filter by:
- `auth` - All auth-related requests
- `microsoft` - Microsoft API calls
- `token` - Token exchange requests

Check:
- Request headers (Authorization, X-CSRF-Token)
- Response status codes
- Response payloads
- Cookies set in responses

### MSAL Debug Mode

In browser console:

```javascript
// View all MSAL accounts
sessionStorage.getItem('msal.account.keys')

// View specific account
const accountId = '<account-id>';
sessionStorage.getItem(`msal.account.${accountId}`)

// View token cache
Object.keys(sessionStorage).filter(k => k.includes('msal.token'))
```

---

## Common Issues and Fixes

### Issue: "Redirect URI mismatch"

**Symptoms:**
- Error from Microsoft: `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application`

**Fix:**
1. Verify `VITE_AZURE_AD_REDIRECT_URI` matches Azure AD app registration
2. Check Azure Portal > App Registration > Authentication > Redirect URIs
3. Ensure exact match (including trailing slash, protocol, port)
4. Add all environments (localhost, staging, production)

---

### Issue: "Invalid client"

**Symptoms:**
- Error: `AADSTS700016: Application with identifier '<id>' was not found`

**Fix:**
1. Verify `VITE_AZURE_AD_CLIENT_ID` is correct
2. Check Azure Portal > App Registration > Overview > Application (client) ID
3. Ensure app registration exists in correct tenant

---

### Issue: "Token expired"

**Symptoms:**
- API returns 401 Unauthorized
- Token refresh fails
- User redirected to login unexpectedly

**Fix:**
1. Check token expiration in browser DevTools
2. Verify token refresh is configured
3. Check `/api/auth/refresh` endpoint works
4. Ensure MSAL `acquireTokenSilent` is called

---

### Issue: "CORS error"

**Symptoms:**
- Console error: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix:**
1. Check backend CORS configuration
2. Ensure `credentials: 'include'` in fetch requests
3. Verify `Access-Control-Allow-Origin` matches frontend origin
4. Check `Access-Control-Allow-Credentials: true`

---

### Issue: "Cookie not set"

**Symptoms:**
- Login succeeds but session not created
- Protected routes redirect to login
- No auth cookie in DevTools

**Fix:**
1. Check backend sets cookie in response
2. Verify cookie attributes (HttpOnly, Secure, SameSite)
3. Ensure `credentials: 'include'` in fetch
4. Check cookie domain matches frontend

---

### Issue: "Infinite redirect loop"

**Symptoms:**
- Page keeps redirecting between login and callback
- Console shows repeated auth attempts

**Fix:**
1. Check callback handling logic
2. Verify token exchange succeeds
3. Ensure user is set in AuthContext after login
4. Check protected route logic doesn't redirect authenticated users

---

## Test Accounts Setup

### Creating Test Accounts in Azure AD

1. **Azure Portal** > **Azure Active Directory** > **Users**
2. Click **New user** > **Create user**
3. Fill in details:
   - User principal name: `test.user@yourdomain.com`
   - Name: `Test User`
   - Password: Auto-generate or set custom
4. Assign roles:
   - Go to **Enterprise applications**
   - Select your Fleet app
   - **Users and groups** > **Add user/group**
   - Assign roles: Admin, Manager, User, ReadOnly
5. Test different role permissions

### Test Account Matrix

| Email | Role | Permissions | Use Case |
|-------|------|-------------|----------|
| `admin.test@cta.com` | SuperAdmin | All | Full access testing |
| `manager.test@cta.com` | Manager | Fleet, Drivers | Manager role testing |
| `user.test@cta.com` | User | Read fleet data | Basic user testing |
| `readonly.test@cta.com` | ReadOnly | View only | Permission testing |

---

## Browser Console Inspection Guide

### What to Look For

#### Successful Login Flow:

```
[MSAL] Initiating login redirect
[Auth] MSAL login redirect started
[MSAL] Redirect response received
[Auth Callback] Processing authentication callback
[Auth Callback] Authentication successful { account: "test@example.com" }
[Auth] Token exchange successful
[Auth] Login successful { userId: "...", role: "Admin" }
```

#### Expected Logs:

- ✅ MSAL initialization
- ✅ Login redirect
- ✅ Callback processing
- ✅ Token exchange
- ✅ User data set
- ✅ Redirect to dashboard

#### Red Flags:

- ❌ "Authentication required" after login
- ❌ "Invalid token" errors
- ❌ "CORS policy" errors
- ❌ "Network error" (check backend)
- ❌ "Token exchange failed"

### Network Tab Analysis

**Successful SSO Flow:**

1. `GET /login` - 200 OK
2. `GET https://login.microsoftonline.com/.../authorize?...` - 302 Redirect
3. `POST https://login.microsoftonline.com/.../token` - 200 OK
4. `POST /api/auth/microsoft/exchange` - 200 OK (sets cookie)
5. `GET /api/auth/me` - 200 OK (user data)
6. `GET /` - 200 OK (dashboard)

**Check Response Headers:**

```
Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

---

## Security Testing

### Security Checklist

- [ ] **No tokens in URL**: Access tokens never exposed in URL parameters
- [ ] **HttpOnly cookies**: Auth cookies have HttpOnly flag
- [ ] **Secure flag**: Cookies have Secure flag (in HTTPS environments)
- [ ] **SameSite=Strict**: CSRF protection via SameSite cookie attribute
- [ ] **No localStorage tokens**: Sensitive tokens not stored in localStorage
- [ ] **HTTPS in production**: All production traffic uses HTTPS
- [ ] **CORS configured**: CORS allows only trusted origins
- [ ] **CSRF protection**: CSRF tokens used for sensitive operations
- [ ] **Token expiration**: Tokens expire after reasonable time (e.g., 1 hour)
- [ ] **Auto-refresh**: Tokens refresh before expiration
- [ ] **Logout cleanup**: All auth data cleared on logout

### Security Test Scenarios

**Test 1: Token Tampering**

1. Get valid auth token from DevTools
2. Modify payload (e.g., change role from User to Admin)
3. Try to use tampered token
4. **Expected:** Server rejects token (signature invalid)

**Test 2: XSS Protection**

1. Try to inject script in login form
2. Check if input is sanitized
3. **Expected:** Script does not execute

**Test 3: CSRF Protection**

1. Create malicious page that calls `/api/auth/logout`
2. Try to trigger from different origin
3. **Expected:** Request blocked by SameSite=Strict cookie

**Test 4: Token Leakage**

1. Check browser history
2. Check network logs
3. Check localStorage/sessionStorage
4. **Expected:** No access tokens in plain text

---

## Performance Testing

### Performance Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Login redirect | < 500ms | < 1s |
| Callback processing | < 1s | < 3s |
| Token exchange | < 500ms | < 2s |
| Page load (authenticated) | < 2s | < 5s |
| Token refresh | < 300ms | < 1s |

### Measuring Performance

Use browser DevTools > Performance tab:

1. Start recording
2. Complete SSO flow
3. Stop recording
4. Analyze timeline:
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Network requests duration
   - JavaScript execution time

### Load Testing

Simulate multiple concurrent logins:

```bash
# Using Artillery
npm install -g artillery
artillery quick --count 10 --num 50 http://localhost:5173/login
```

Monitor:
- Server response times
- Token exchange API
- Database connections
- Memory usage

---

## Continuous Testing

### Pre-Commit Checks

```bash
# Run all auth tests before committing
npm run test:auth
```

### CI/CD Pipeline

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Auth Tests
  run: |
    npm run test tests/auth/jwt-validation.test.ts
    npm run test tests/auth/session-management.test.ts
    npx playwright test tests/auth/sso-flow.test.ts --project=chromium
```

### Monitoring in Production

Set up alerts for:
- Failed login attempts (> 5%)
- Token exchange failures
- Session expiration errors
- CORS errors
- High response times (> 2s)

---

## Getting Help

### Resources

- **MSAL.js Docs**: https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-initializing-client-applications
- **Azure AD Troubleshooting**: https://learn.microsoft.com/en-us/troubleshoot/azure/active-directory/welcome-azure-ad
- **Fleet SSO Issues**: https://github.com/yourusername/Fleet-CTA/issues

### Debug Script Outputs

All test scripts save JSON reports:

- `sso-test-results-<timestamp>.json` - Manual test results
- `azure-ad-validation-<timestamp>.json` - Config validation results

Review these for detailed diagnostics.

---

## Conclusion

This guide covers comprehensive testing of the SSO authentication flow. Follow all checklists to ensure a secure, reliable authentication system.

**Before going to production:**

✅ All automated tests pass
✅ Manual checklist complete
✅ Security audit passed
✅ Performance targets met
✅ Error handling verified
✅ Production environment configured

**Remember:** SSO is the gateway to your application. Test thoroughly!
