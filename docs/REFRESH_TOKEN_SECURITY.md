# Refresh Token Security Documentation
## OWASP ASVS 3.0 Compliant Implementation

**Last Updated:** 2025-11-20
**Compliance Standard:** OWASP Application Security Verification Standard (ASVS) 3.0
**Security Level:** Level 2 (Standard)

---

## Executive Summary

This document describes the secure refresh token rotation system implemented in the Fleet Management application. The implementation follows OWASP ASVS 3.0 guidelines and industry best practices for token-based authentication.

### Key Security Features

- ✅ Short-lived access tokens (15 minutes)
- ✅ Long-lived refresh tokens (7 days) stored in httpOnly cookies
- ✅ Automatic token rotation on each refresh
- ✅ Token reuse detection and automatic revocation
- ✅ Multi-tenancy isolation
- ✅ IP address and user agent tracking
- ✅ Comprehensive audit logging
- ✅ Automatic token refresh on frontend

---

## Architecture Overview

### Token Types

#### Access Token (JWT)
- **Lifetime:** 15 minutes
- **Storage:** localStorage (frontend)
- **Purpose:** API authentication
- **Claims:**
  - `id`: User ID
  - `email`: User email
  - `role`: User role (RBAC)
  - `tenant_id`: Tenant ID (multi-tenancy)
  - `type`: "access"
  - `exp`: Expiration timestamp

#### Refresh Token (JWT)
- **Lifetime:** 7 days
- **Storage:** httpOnly cookie (XSS protection)
- **Purpose:** Obtaining new access tokens
- **Claims:**
  - `id`: User ID
  - `tenant_id`: Tenant ID
  - `type`: "refresh"
  - `jti`: Unique token identifier
  - `exp`: Expiration timestamp

---

## Implementation Files

- **Backend Routes:** `api/src/routes/auth.ts`
- **Frontend Client:** `src/lib/api-client.ts`
- **Database Migration:** `api/database/migrations/009_refresh_tokens_enhanced.sql`
- **Tests:** `api/tests/auth-refresh-tokens.test.ts`
- **Documentation:** This file

---

## API Endpoints

### 1. Login
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "tenant_id": "tenant-uuid"
  }
}
```

**Cookies Set:**
- `refreshToken` (httpOnly, secure, sameSite=strict, 7 days)

### 2. Refresh Token
**Endpoint:** `POST /api/auth/refresh`

**Request:** No body (uses httpOnly cookie)

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Cookies Updated:**
- New `refreshToken` (old token is revoked)

### 3. Logout
**Endpoint:** `POST /api/auth/logout`

**Request:**
```json
{
  "revokeAllTokens": true  // Optional: logout from all devices
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**
- `refreshToken`

---

## Security Features

### 1. Token Rotation
Every time a refresh token is used, it is immediately revoked and a new one is issued. This prevents token reuse attacks.

### 2. Token Reuse Detection
If a revoked refresh token is used again, the system:
1. Detects the reuse attempt
2. Revokes ALL refresh tokens for that user
3. Logs a security violation in audit logs
4. Forces the user to re-authenticate

### 3. httpOnly Cookies
Refresh tokens are stored in httpOnly cookies, which:
- Cannot be accessed by JavaScript (prevents XSS)
- Are automatically sent with requests (no manual handling)
- Have SameSite=Strict (prevents CSRF)
- Are Secure in production (HTTPS only)

### 4. Automatic Token Refresh (Frontend)
The frontend API client automatically:
1. Detects 401 Unauthorized responses
2. Attempts to refresh the access token
3. Retries the original request with new token
4. Logs out user if refresh fails

### 5. Multi-Tenancy Isolation
All refresh tokens are tied to a specific tenant_id, ensuring data isolation between tenants.

### 6. Audit Trail
Every authentication event is logged with:
- User ID and tenant ID
- IP address
- User agent
- Timestamp
- Action (login, refresh, logout)
- Success/failure status

---

## Database Schema

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT
);
```

---

## OWASP ASVS 3.0 Compliance

| ASVS ID | Requirement | Status |
|---------|-------------|--------|
| V2.3.1 | Users can logout of all devices | ✅ |
| V2.3.2 | Authenticators bind to session | ✅ |
| V2.3.3 | Session terminates on inactivity | ✅ |
| V3.2.1 | Tokens have a defined expiration | ✅ |
| V3.2.2 | Refresh tokens are rotated | ✅ |
| V3.2.3 | Tokens are revocable | ✅ |
| V3.5.1 | Credentials transmitted over TLS | ✅ |
| V3.5.2 | Tokens not exposed in URLs | ✅ |
| V8.2.1 | Session IDs are unique and random | ✅ |
| V8.2.2 | Session IDs not in URLs | ✅ |
| V8.3.1 | Logout fully terminates session | ✅ |
| V8.3.2 | Session timeout after inactivity | ✅ |

---

## Testing

### Run Unit Tests
```bash
cd api
npm test auth-refresh-tokens.test.ts
```

### Manual Testing

1. **Login and get tokens:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}' \
  -c cookies.txt
```

2. **Refresh token:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

3. **Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

---

## Configuration

### Environment Variables

```env
# JWT Configuration (REQUIRED)
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Node Environment
NODE_ENV=production  # Enables secure cookies
```

### Production Checklist

- [ ] JWT_SECRET is at least 32 characters
- [ ] JWT_SECRET is stored in Azure Key Vault
- [ ] HTTPS is enforced
- [ ] Secure cookie flags are enabled
- [ ] Rate limiting is configured
- [ ] Audit logging is enabled
- [ ] Database indexes are created
- [ ] Token cleanup job is scheduled

---

## Maintenance

### Token Cleanup (Daily)

```sql
SELECT cleanup_expired_refresh_tokens();
```

### Force User Logout

```sql
SELECT revoke_all_user_tokens('USER_UUID');
```

### Monitor Active Sessions

```sql
SELECT * FROM active_refresh_tokens;
```

---

## Incident Response

### Suspected Token Compromise

1. **Revoke all tokens for affected user:**
```sql
SELECT revoke_all_user_tokens('USER_ID');
UPDATE users SET password_reset_required = true WHERE id = 'USER_ID';
```

2. **Check audit logs:**
```sql
SELECT * FROM audit_logs
WHERE user_id = 'USER_ID'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

3. **Notify user and require password change**

---

## References

- [OWASP ASVS 3.0](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 6749: OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [RFC 7519: JWT](https://tools.ietf.org/html/rfc7519)

---

**Document Version:** 1.0
**Last Review:** 2025-11-20
**Next Review:** 2026-02-20
