# Security Configuration Improvements

## Overview
This document describes the critical security configuration improvements implemented to address vulnerabilities and strengthen the application's security posture.

## Changes Implemented

### 1. CSRF Protection Hardening
**File:** `api/src/middleware/csrf.ts`

**Changes:**
- Removed default fallback CSRF secret
- Added mandatory CSRF_SECRET environment variable validation
- Enforced minimum 32-character secret length
- Server now fails to start if CSRF_SECRET is not properly configured

**Impact:**
- Prevents CSRF attacks by ensuring unique secrets per deployment (CWE-352)
- Eliminates risk of default secret exploitation
- Forces proper configuration in all environments

**Migration:**
```bash
# Generate a secure CSRF secret
openssl rand -base64 48

# Add to .env file
CSRF_SECRET=<generated-secret>
```

### 2. JWT Secret Hardening
**Files:**
- `api/src/server.ts` (existing validation)
- `api/src/config/environment.ts` (removed fallback)

**Changes:**
- Removed development fallback JWT secret
- JWT_SECRET now required in all environments (dev, staging, production)
- Maintains existing 32-character minimum length validation
- Maintains existing weak secret pattern detection

**Impact:**
- Prevents authentication bypass vulnerabilities (CWE-287, CWE-798)
- Ensures strong authentication in all environments
- Eliminates default/weak secret usage

**Migration:**
```bash
# Generate a secure JWT secret
openssl rand -base64 48

# Add to .env file (if not already present)
JWT_SECRET=<generated-secret>
```

### 3. JWT Refresh Token Rotation
**File:** `api/src/routes/auth.ts`

**Changes:**
- Implemented refresh token rotation pattern
- Access tokens now short-lived (15 minutes instead of 24 hours)
- Refresh tokens long-lived (7 days)
- Refresh tokens stored in database for revocation support
- New `/api/auth/refresh` endpoint for token renewal
- Enhanced logout with optional "logout from all devices" support

**Benefits:**
- Reduces window of opportunity for token theft
- Enables token revocation
- Supports multi-device sessions
- Follows OWASP best practices for token management

**API Changes:**

#### Login Response (Modified)
```json
{
  "token": "short-lived-access-token",
  "refreshToken": "long-lived-refresh-token",
  "expiresIn": 900,
  "user": { ... }
}
```

#### New Refresh Endpoint
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}

Response:
{
  "token": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 900
}
```

#### Enhanced Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "revokeAllTokens": true  // Optional: logout from all devices
}
```

### 4. Secrets Baseline
**File:** `.secrets.baseline`

**Changes:**
- Created detect-secrets baseline for secret scanning
- Scans entire codebase for potential secrets
- Establishes baseline for CI/CD integration

**Usage:**
```bash
# Activate virtual environment
source .venv/bin/activate

# Scan for new secrets
detect-secrets scan --baseline .secrets.baseline

# Audit detected secrets
detect-secrets audit .secrets.baseline
```

**CI/CD Integration:**
Add to your CI pipeline:
```yaml
- name: Check for secrets
  run: |
    pip install detect-secrets
    detect-secrets scan --baseline .secrets.baseline
```

### 5. Security.txt File
**File:** `public/.well-known/security.txt`

**Changes:**
- Created RFC 9116 compliant security.txt file
- Provides security contact information
- Documents vulnerability disclosure policy
- Establishes responsible disclosure process

**Benefits:**
- Makes it easy for security researchers to report vulnerabilities
- Demonstrates security commitment
- Follows industry standards (RFC 9116)

**Hosted at:** `https://your-domain/.well-known/security.txt`

### 6. Database Migration
**File:** `api/database/migrations/009_refresh_tokens.sql`

**Changes:**
- Created `refresh_tokens` table for token storage
- Added indexes for efficient lookups
- Included cleanup function for expired tokens

**Schema:**
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);
```

**Migration:**
```bash
# Run migration (adjust for your setup)
psql -d fleet -f api/database/migrations/009_refresh_tokens.sql

# Or use your migration tool
npm run migrate:up
```

### 7. Environment Configuration
**File:** `.env.example`

**Changes:**
- Added CSRF_SECRET with generation instructions
- Updated JWT token expiration times
- Added clear documentation for required secrets
- Included generation commands

**Updated Configuration:**
```bash
# REQUIRED: JWT_SECRET must be at least 32 characters
# Generate with: openssl rand -base64 48
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# REQUIRED: CSRF_SECRET must be at least 32 characters
# Generate with: openssl rand -base64 48
CSRF_SECRET=your-csrf-secret-minimum-32-characters-long
```

## Validation Testing

### Server Startup Validation
The server will now fail to start if:
1. JWT_SECRET is not set
2. JWT_SECRET is less than 32 characters
3. JWT_SECRET contains weak/default patterns
4. CSRF_SECRET is not set
5. CSRF_SECRET is less than 32 characters

Expected startup output:
```
🔒 Validating security configuration...
✅ JWT_SECRET validated successfully
✅ JWT_SECRET length: 64 characters
✅ CSRF_SECRET validated successfully
✅ CSRF_SECRET length: 64 characters
```

### Testing Refresh Token Flow

1. **Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Expected: Returns `token`, `refreshToken`, and `expiresIn`

2. **Use Access Token:**
```bash
curl http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer <access-token>"
```

Expected: Returns data while token is valid

3. **Refresh Token:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh-token>"}'
```

Expected: Returns new `token` and `refreshToken`

4. **Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"revokeAllTokens":true}'
```

Expected: Revokes all refresh tokens

## Security Checklist

- [x] Remove default CSRF secret
- [x] Remove JWT_SECRET fallback
- [x] Implement refresh token rotation
- [x] Create secrets baseline
- [x] Add security.txt file
- [x] Create database migration
- [x] Update .env.example
- [x] Add startup validation
- [x] Document changes

## Frontend Integration Required

The frontend needs to be updated to support the new token flow:

1. **Store Both Tokens:**
```typescript
// After login
const { token, refreshToken, expiresIn } = response.data;
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

2. **Implement Token Refresh:**
```typescript
// Before token expires or on 401 response
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const { token, refreshToken: newRefreshToken } = await response.json();
  localStorage.setItem('accessToken', token);
  localStorage.setItem('refreshToken', newRefreshToken);
  return token;
}
```

3. **Intercept 401 Responses:**
```typescript
// Axios interceptor example
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Compliance & Standards

These changes align with:
- **OWASP Top 10:** Addresses A02:2021 - Cryptographic Failures
- **OWASP ASVS:** V2 Authentication, V3 Session Management
- **CWE-287:** Improper Authentication
- **CWE-352:** Cross-Site Request Forgery (CSRF)
- **CWE-798:** Use of Hard-coded Credentials
- **FedRAMP:** IA-5 Authenticator Management
- **RFC 9116:** Security.txt specification

## Monitoring & Maintenance

### Periodic Tasks
1. **Token Cleanup:** Run cleanup function weekly
```sql
SELECT cleanup_expired_refresh_tokens();
```

2. **Secret Scanning:** Run in CI/CD pipeline
```bash
detect-secrets scan --baseline .secrets.baseline
```

3. **Audit Logs:** Monitor refresh token usage
```sql
SELECT * FROM audit_logs
WHERE action = 'REFRESH_TOKEN'
AND created_at > NOW() - INTERVAL '24 hours';
```

## Rollback Instructions

If issues occur, you can rollback:

1. **Restore Previous Auth Logic:**
```bash
git revert <commit-hash>
```

2. **Extend Token Lifetime (Emergency Only):**
```env
JWT_EXPIRES_IN=24h  # Temporary fallback
```

3. **Drop Migration:**
```sql
DROP TABLE IF EXISTS refresh_tokens CASCADE;
```

## Support & Questions

For questions or issues:
- Security issues: security@fleet.local
- Technical support: Create GitHub issue
- Documentation: See `/docs/security/`

---

**Last Updated:** 2025-11-20
**Version:** 1.0.0
**Author:** Security Team
