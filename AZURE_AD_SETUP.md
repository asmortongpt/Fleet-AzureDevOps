# Azure AD Single Sign-On (SSO) Configuration Guide

This guide provides comprehensive instructions for setting up and troubleshooting Azure Active Directory authentication for the Fleet Management System.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Azure AD App Registration](#azure-ad-app-registration)
4. [Required API Permissions](#required-api-permissions)
5. [Redirect URI Configuration](#redirect-uri-configuration)
6. [Environment Variables](#environment-variables)
7. [Testing Authentication](#testing-authentication)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## Overview

The Fleet Management System uses **Microsoft Authentication Library (MSAL)** for browser-based authentication and **Azure AD JWT validation** on the backend. This provides:

- **Secure SSO**: Users authenticate via Microsoft Azure AD
- **Token-based security**: OAuth 2.0 / OpenID Connect flow
- **Session management**: Backend validates Azure AD tokens and issues app-specific sessions
- **Multi-tenant support**: Different organizations can use separate Azure AD tenants

### Authentication Flow

```
User → Frontend MSAL → Azure AD Login → Azure AD Token
     → Backend Exchange → App Session Cookie → Protected Resources
```

1. **Frontend**: User clicks "Sign in with Microsoft"
2. **MSAL Redirect**: Browser redirects to Azure AD login page
3. **User Authentication**: User enters Microsoft credentials
4. **Token Issuance**: Azure AD issues access token and ID token
5. **Token Exchange**: Frontend sends token to backend `/api/auth/microsoft/exchange`
6. **Backend Validation**: Backend validates token using Azure AD public keys (JWKS)
7. **Session Creation**: Backend creates app session and sets httpOnly cookie
8. **User Access**: User can now access protected resources

---

## Prerequisites

Before configuring Azure AD, ensure you have:

- **Azure AD Tenant**: An active Azure Active Directory tenant
- **Global Administrator Role**: Or sufficient permissions to register applications
- **Application Details**:
  - Client ID (Application ID)
  - Tenant ID (Directory ID)
  - Client Secret (for backend-only flows, NOT frontend)

---

## Azure AD App Registration

### Step 1: Create New App Registration

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the application:
   - **Name**: `Fleet Management System` (or your preferred name)
   - **Supported account types**:
     - Single tenant (recommended for production)
     - Multi-tenant (if supporting multiple organizations)
   - **Redirect URI**:
     - Type: **Web**
     - URI: `https://proud-bay-0fdc8040f.3.azurestaticapps.net/auth/callback`
     - (Add development URIs later in Step 3)

5. Click **Register**

### Step 2: Save Application IDs

After registration, save these values:

```
Application (client) ID: baae0851-0c24-4214-8587-e3fabc46bd4a
Directory (tenant) ID:   0ec14b81-7b82-45ee-8f3d-cbc31ced5347
```

⚠️ **IMPORTANT**: Do NOT share these IDs publicly. While the client ID is not a secret, it should be treated as sensitive.

### Step 3: Configure Platform Settings

1. Go to **Authentication** in the left menu
2. Under **Platform configurations** > **Web**, add all redirect URIs:

**Production URIs:**
```
https://proud-bay-0fdc8040f.3.azurestaticapps.net/auth/callback
https://fleet.capitaltechalliance.com/auth/callback
```

**Development URIs:**
```
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://localhost:5175/auth/callback
```

3. Under **Implicit grant and hybrid flows**:
   - ✅ **ID tokens** (for OpenID Connect)
   - ❌ Access tokens (MSAL uses authorization code flow, not implicit)

4. Under **Advanced settings**:
   - **Allow public client flows**: No
   - **Treat application as public client**: No

5. Click **Save**

---

## Required API Permissions

### Step 1: Add Microsoft Graph Permissions

1. Go to **API permissions** in the left menu
2. Click **Add a permission**
3. Select **Microsoft Graph** > **Delegated permissions**
4. Add the following scopes:

| Permission | Type | Description | Admin Consent Required |
|------------|------|-------------|------------------------|
| `openid` | Delegated | Sign in and read user profile | No |
| `profile` | Delegated | View users' basic profile | No |
| `email` | Delegated | View users' email address | No |
| `User.Read` | Delegated | Sign in and read user profile | No |
| `offline_access` | Delegated | Maintain access to data (refresh tokens) | No |

5. Click **Add permissions**

### Step 2: Grant Admin Consent (Optional)

For organizational accounts, you may need admin consent:

1. Click **Grant admin consent for [Your Organization]**
2. Confirm by clicking **Yes**
3. All permissions should now show ✅ **Granted for [Your Organization]**

⚠️ **Note**: If you don't have admin rights, ask your IT administrator to grant consent.

---

## Redirect URI Configuration

### Production Deployment

Your Azure Static Web App URL:
```
https://proud-bay-0fdc8040f.3.azurestaticapps.net
```

Callback endpoint:
```
https://proud-bay-0fdc8040f.3.azurestaticapps.net/auth/callback
```

### Local Development

Multiple ports supported for flexibility:

```
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://localhost:5175/auth/callback
```

### Custom Domain

If you have a custom domain (e.g., `fleet.capitaltechalliance.com`):

1. Add redirect URI in Azure AD:
   ```
   https://fleet.capitaltechalliance.com/auth/callback
   ```

2. Update environment variable:
   ```bash
   VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback
   ```

---

## Environment Variables

### Frontend Configuration (.env)

Create or update `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/.env`:

```bash
# Azure AD Authentication
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# For production, use:
# VITE_AZURE_AD_REDIRECT_URI=https://proud-bay-0fdc8040f.3.azurestaticapps.net/auth/callback
```

### Backend Configuration (api/.env)

Create or update `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/.env`:

```bash
# Azure AD Authentication (Backend)
AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347

# Optional: Client secret (only if using backend-initiated OAuth flows)
# AZURE_AD_CLIENT_SECRET=your-client-secret-here

# Redirect URI for OAuth callback (backend endpoint)
AZURE_AD_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback

# For production:
# AZURE_AD_REDIRECT_URI=https://api.fleet.capitaltechalliance.com/api/auth/microsoft/callback

# CORS Origins (must include frontend URL)
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175

# JWT Secrets (generate secure random values for production)
JWT_SECRET=your-secure-random-secret-here
SESSION_SECRET=your-session-secret-here
```

⚠️ **SECURITY WARNING**:
- **NEVER commit actual secrets to Git**
- Use Azure Key Vault or environment-specific secrets in production
- Generate cryptographically random secrets (minimum 32 characters)

---

## Testing Authentication

### 1. Start the Development Server

**Frontend:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA
npm install --legacy-peer-deps
npm run dev
```

**Backend:**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
npm install
npm start
```

### 2. Test SSO Login

1. Open browser to http://localhost:5173
2. Click **"Sign in with Microsoft"**
3. You should be redirected to Microsoft login page
4. Enter your Microsoft credentials (use @capitaltechalliance.com email)
5. Grant consent to requested permissions (if prompted)
6. You should be redirected back to http://localhost:5173/auth/callback
7. After successful authentication, you'll be logged into the app

### 3. Check Browser Console

Look for MSAL logs:
```
[MSAL] Initiating MSAL login redirect
[MSAL] Token acquired successfully
[Auth] Token exchange successful
```

### 4. Verify Backend Logs

Check API server logs for:
```
[AzureADTokenValidator] Token validated successfully
[Auth] User authenticated via Azure AD
```

### 5. Test Session Persistence

1. Refresh the page - you should remain logged in
2. Close and reopen the browser tab - session should persist (if using localStorage)
3. Try accessing a protected route (e.g., /fleet) - should work without re-authentication

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "AADSTS50011: The reply URL specified in the request does not match"

**Cause**: Redirect URI mismatch between request and Azure AD configuration

**Solution**:
1. Check exact redirect URI in browser (including protocol, port, path)
2. Ensure URI is registered in Azure AD **exactly as shown**
3. Common mistakes:
   - Missing trailing slash: ❌ `/auth/callback/` vs ✅ `/auth/callback`
   - Wrong protocol: ❌ `https://localhost` vs ✅ `http://localhost`
   - Wrong port: ❌ `:5174` vs ✅ `:5173`

#### Issue 2: "Token validation failed: Invalid token"

**Cause**: JWT signature verification failed or token expired

**Solution**:
1. Check system clock - ensure server time is accurate (Azure AD allows 5min skew)
2. Verify `AZURE_AD_TENANT_ID` matches the tenant that issued the token
3. Check backend logs for detailed error:
   ```bash
   cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
   npm start | grep "Token validation"
   ```
4. Ensure JWKS endpoint is accessible:
   ```bash
   curl https://login.microsoftonline.com/0ec14b81-7b82-45ee-8f3d-cbc31ced5347/discovery/v2.0/keys
   ```

#### Issue 3: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: Backend not configured to allow frontend origin

**Solution**:
1. Update `api/.env`:
   ```bash
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174
   ```
2. Restart API server
3. Clear browser cache and retry

#### Issue 4: "Failed to fetch signing key"

**Cause**: Cannot reach Azure AD JWKS endpoint or network issue

**Solution**:
1. Check internet connectivity
2. Verify firewall allows outbound HTTPS to `login.microsoftonline.com`
3. Check proxy settings if behind corporate firewall
4. Test JWKS endpoint manually:
   ```bash
   curl -v https://login.microsoftonline.com/0ec14b81-7b82-45ee-8f3d-cbc31ced5347/discovery/v2.0/keys
   ```

#### Issue 5: "Access Denied: Only users with @capitaltechalliance.com can log in"

**Cause**: Email domain restriction in backend

**Solution**:
1. For development, disable domain restrictions in `api/.env`:
   ```bash
   SSO_ALLOWED_DOMAINS=
   ```
2. For production, add allowed domains:
   ```bash
   SSO_ALLOWED_DOMAINS=capitaltechalliance.com,example.com
   ```

#### Issue 6: "Token exchange failed: 400 Bad Request"

**Cause**: Invalid token format or missing required fields

**Solution**:
1. Check frontend sends both `accessToken` and `idToken`:
   ```javascript
   const response = await fetch('/api/auth/microsoft/exchange', {
     method: 'POST',
     body: JSON.stringify({
       accessToken: tokenResult.accessToken,
       idToken: tokenResult.idToken,
     }),
   });
   ```
2. Enable debug logging in backend to see full error:
   ```bash
   LOG_LEVEL=debug npm start
   ```

---

## Security Best Practices

### 1. Token Storage

✅ **DO:**
- Store tokens in `sessionStorage` (cleared when tab closes)
- Use httpOnly cookies for session management
- Enable secure flag on cookies in production

❌ **DON'T:**
- Store tokens in localStorage (vulnerable to XSS)
- Log tokens in console or server logs
- Send tokens in URL parameters

### 2. Token Validation

✅ **DO:**
- Validate all JWT claims (iss, aud, exp, nbf)
- Use Azure AD public keys (JWKS) for signature verification
- Check token expiration before each API request
- Implement token refresh before expiration

❌ **DON'T:**
- Trust tokens without signature verification
- Skip expiration checks
- Use hardcoded public keys (they rotate)

### 3. HTTPS in Production

⚠️ **CRITICAL**: All production traffic MUST use HTTPS

✅ Enable HTTPS for:
- Frontend (Azure Static Web Apps handles this automatically)
- Backend API (use Azure App Service or nginx reverse proxy)
- All OAuth redirect URIs

### 4. Environment-Specific Secrets

✅ **DO:**
- Use Azure Key Vault for production secrets
- Use different Client IDs for dev/staging/prod environments
- Rotate secrets regularly (every 90 days recommended)

❌ **DON'T:**
- Commit `.env` files to Git
- Share secrets in Slack/email
- Reuse development secrets in production

### 5. Rate Limiting

Implement rate limiting on authentication endpoints:

```typescript
// Backend: api/src/middleware/rateLimiter.ts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
});
```

### 6. Logging and Monitoring

✅ **DO:**
- Log all authentication attempts (success and failure)
- Monitor for suspicious patterns (repeated failures)
- Set up alerts for authentication errors
- Use Application Insights or Sentry for error tracking

❌ **DON'T:**
- Log tokens or passwords
- Log personally identifiable information (PII) without consent
- Ignore repeated authentication failures

---

## Advanced Configuration

### Multi-Tenant Support

To support multiple Azure AD tenants:

1. Update frontend config:
   ```typescript
   // src/config/auth-config.ts
   export const AZURE_AD_CONFIG = {
     // Use common endpoint for multi-tenant
     authority: 'https://login.microsoftonline.com/common',
     knownAuthorities: ['login.microsoftonline.com'],
     // ... other config
   };
   ```

2. Update backend validation:
   ```typescript
   // api/src/services/azure-ad-token-validator.ts
   // Accept tokens from any tenant, validate tenant_id after verification
   const allowedTenants = process.env.ALLOWED_TENANT_IDS?.split(',') || [];
   if (allowedTenants.length > 0 && !allowedTenants.includes(claims.tid)) {
     throw new Error('Unauthorized tenant');
   }
   ```

### Custom Token Claims

To include custom claims in tokens:

1. In Azure AD, go to **Token configuration**
2. Click **Add optional claim**
3. Select token type: **ID** and **Access**
4. Add claims (e.g., `groups`, `roles`)
5. Update backend to read these claims:
   ```typescript
   const userRoles = claims.roles || [];
   const userGroups = claims.groups || [];
   ```

---

## Additional Resources

- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD B2C (for customer-facing apps)](https://learn.microsoft.com/en-us/azure/active-directory-b2c/)
- [OAuth 2.0 and OpenID Connect Protocols](https://oauth.net/2/)

---

## Support

For issues specific to this Fleet Management System:

1. Check logs: `npm run dev` (frontend) and `npm start` (backend)
2. Enable debug mode: `VITE_API_DEBUG=true` (frontend), `LOG_LEVEL=debug` (backend)
3. Review this documentation for troubleshooting steps
4. Contact IT support at Capital Technology Alliance

For Azure AD issues:

1. Check [Azure AD Service Health](https://status.azure.com/)
2. Review [Azure AD Known Issues](https://learn.microsoft.com/en-us/azure/active-directory/fundamentals/whats-new)
3. Contact your Microsoft account manager

---

**Last Updated**: 2026-02-03
**Maintained By**: Capital Technology Alliance - Fleet Management Team
