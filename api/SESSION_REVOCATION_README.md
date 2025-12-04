# Session Revocation Implementation

**Security Fix: CVSS 7.2 - Session Revocation Capability**

## Overview

This implementation adds JWT token revocation capability to the Fleet API, addressing the critical security vulnerability where compromised accounts could not be forcibly logged out.

## Architecture

### Components

1. **JWT Blacklist** (`src/routes/session-revocation.ts`)
   - In-memory Map storing revoked tokens with expiry timestamps
   - Automatic cleanup every 5 minutes
   - TODO: Migrate to Redis for production multi-instance deployments

2. **Middleware Integration** (`src/middleware/auth.ts`)
   - Enhanced `authenticateJWT` to check token revocation status
   - Integrates seamlessly with existing authentication flow

3. **API Endpoints** (`src/routes/session-revocation.ts`)
   - `POST /api/auth/revoke` - Revoke JWT tokens
   - `GET /api/auth/revoke/status` - Get blacklist statistics (admin only)

## Features

### Authorization Model

**Self-Revocation:**
- Any authenticated user can revoke their own session
- Automatically clears the `auth_token` cookie
- Logs user out immediately

**Admin Revocation:**
- Admins can revoke any user's session by `user_id` or `email`
- Requires `admin` role
- Comprehensive audit logging of all admin actions

### Security Features

1. **Token Validation**
   - Verifies token belongs to target user before revocation
   - Prevents arbitrary token revocation attacks
   - Extracts JWT expiry for blacklist TTL

2. **Audit Logging**
   - All revocation attempts logged to `audit_logs` table
   - Includes: user_id, action, outcome, IP address, user agent
   - Failed authorization attempts logged separately

3. **Automatic Cleanup**
   - Expired tokens removed every 5 minutes
   - Opportunistic cleanup on each revocation check
   - Prevents memory leaks

## API Documentation

### POST /api/auth/revoke

Revoke a JWT token to force user logout.

**Authorization:**
- Authentication via JWT required (Authorization header or cookie)
- Users can revoke own session
- Admins can revoke any user's session

**Request Body:**
```json
{
  "token": "optional_specific_token_to_revoke",
  "user_id": "admin_only_target_user_id",
  "email": "admin_only_target_email"
}
```

**Parameters:**
- `token` (optional): Specific token to revoke. If omitted, revokes current session token.
- `user_id` (optional, admin only): Revoke all active tokens for specified user ID
- `email` (optional, admin only): Revoke all active tokens for specified email

**Response (Success):**
```json
{
  "success": true,
  "message": "Your session has been revoked successfully",
  "revoked_user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "revoked_by": {
    "id": "admin-uuid",
    "email": "admin@example.com"
  },
  "blacklist_size": 42,
  "expires_at": "2025-12-05T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "error": "Insufficient permissions",
  "message": "Only administrators can revoke other users' sessions",
  "required": ["admin"],
  "current": "viewer"
}
```

**HTTP Status Codes:**
- `200` - Session revoked successfully
- `400` - Invalid token or missing parameters
- `401` - Authentication required or token already revoked
- `403` - Insufficient permissions or token mismatch
- `404` - User not found
- `500` - Internal server error

### GET /api/auth/revoke/status

Get JWT blacklist statistics (admin only).

**Authorization:**
- Authentication via JWT required (Authorization header or cookie)
- Requires `admin` role

**Response:**
```json
{
  "blacklist_size": 42,
  "active_revocations": 38,
  "expired_pending_cleanup": 4,
  "cleanup_interval_ms": 300000,
  "storage_type": "in-memory",
  "recommendation": "Upgrade to Redis for production multi-instance deployments"
}
```

## Testing Guide

### Prerequisites

1. Start the API server:
   ```bash
   cd /Users/andrewmorton/Documents/GitHub/fleet-local/api
   npm run dev
   ```

2. Obtain a JWT token by logging in:
   ```bash
   # Login to get token
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "your_password"
     }'
   ```

   Save the token from the response or cookie.

### Test Scenarios

#### Test 1: Self-Revoke Current Session

```bash
# Revoke your own session
curl -X POST http://localhost:3000/api/auth/revoke \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected: 200 OK with success message

# Verify token is revoked - this should fail with 401
curl -X GET http://localhost:3000/api/auth/revoke/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 401 Unauthorized - "Token has been revoked"
```

#### Test 2: Admin Revoke User by Email

```bash
# Admin revokes another user's session
curl -X POST http://localhost:3000/api/auth/revoke \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# Expected: 200 OK with revocation details
```

#### Test 3: Non-Admin Attempts to Revoke Other User

```bash
# Non-admin tries to revoke another user
curl -X POST http://localhost:3000/api/auth/revoke \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'

# Expected: 403 Forbidden - "Insufficient permissions"
```

#### Test 4: Check Blacklist Status (Admin)

```bash
# Get blacklist statistics
curl -X GET http://localhost:3000/api/auth/revoke/status \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK with statistics
```

#### Test 5: Revoke Specific Token

```bash
# Revoke a specific token
curl -X POST http://localhost:3000/api/auth/revoke \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "SPECIFIC_TOKEN_TO_REVOKE",
    "user_id": "target-user-uuid"
  }'

# Expected: 200 OK with revocation confirmation
```

#### Test 6: Attempt to Use Revoked Token

```bash
# Try to access protected resource with revoked token
curl -X GET http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer REVOKED_TOKEN"

# Expected: 401 Unauthorized - "Token has been revoked"
```

### Automated Test Script

```bash
#!/bin/bash
# test-session-revocation.sh

API_URL="http://localhost:3000"

echo "=== Session Revocation Test Suite ==="
echo ""

# Test 1: Login and get token
echo "Test 1: Login to get token"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token obtained: ${TOKEN:0:20}..."
echo ""

# Test 2: Verify token works
echo "Test 2: Verify token is valid"
curl -s -X GET $API_URL/api/auth/revoke/status \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test 3: Revoke token
echo "Test 3: Revoke current session"
curl -s -X POST $API_URL/api/auth/revoke \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

# Test 4: Verify token is revoked
echo "Test 4: Verify token is now invalid"
curl -s -X GET $API_URL/api/auth/revoke/status \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "=== Test Suite Complete ==="
```

## Audit Log Examples

All revocation events are logged to the `audit_logs` table:

### Self-Revocation
```sql
SELECT * FROM audit_logs
WHERE action = 'LOGOUT'
AND details->>'action' = 'session_revoked'
AND details->>'is_self_revocation' = 'true';
```

### Admin Revocation
```sql
SELECT * FROM audit_logs
WHERE action = 'LOGOUT'
AND details->>'action' = 'session_revoked'
AND details->>'is_self_revocation' = 'false';
```

### Failed Authorization Attempts
```sql
SELECT * FROM audit_logs
WHERE action = 'LOGOUT'
AND outcome = 'failure'
AND error_message LIKE '%Insufficient permissions%';
```

## Production Considerations

### Current Limitations

1. **In-Memory Storage**
   - Blacklist does not persist across server restarts
   - Not shared across multiple API instances
   - Memory usage grows with number of revoked tokens

2. **Scalability**
   - Single-instance only
   - No distributed session management

### Recommended Upgrades

#### Migrate to Redis

```typescript
// Example Redis implementation
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Add token to blacklist
await redis.setex(`revoked:${token}`, ttlSeconds, '1')

// Check if token is revoked
const isRevoked = await redis.exists(`revoked:${token}`)
```

**Benefits:**
- Shared across all API instances
- Persistent storage
- Automatic expiry with TTL
- Battle-tested scalability

#### Add Refresh Token Support

- Implement refresh token rotation
- Revoke refresh tokens along with access tokens
- Store refresh tokens in database with revocation status

## Integration Checklist

- [x] JWT blacklist infrastructure implemented
- [x] POST /api/auth/revoke endpoint created
- [x] GET /api/auth/revoke/status endpoint created
- [x] checkRevoked middleware integrated into authenticateJWT
- [x] Comprehensive audit logging for all revocations
- [x] Self-revocation authorization logic
- [x] Admin-only revocation authorization logic
- [x] Token validation to prevent arbitrary revocations
- [x] Automatic cleanup of expired tokens
- [x] Cookie clearing on self-revocation
- [ ] Redis migration for production (TODO)
- [ ] Refresh token support (TODO)
- [ ] Load testing for blacklist performance (TODO)
- [ ] Monitoring/alerting for revocation events (TODO)

## Security Compliance

This implementation addresses:

- **CVSS 7.2** - Session Revocation capability
- **CWE-613** - Session Fixation
- **CWE-598** - Use of GET Request Method With Sensitive Query Strings (prevented via POST)
- **FedRAMP AC-7** - Account locking and session management

## Monitoring

### Key Metrics to Track

1. **Blacklist Size**
   - Monitor growth rate
   - Alert if exceeds threshold (e.g., 10,000 tokens)

2. **Revocation Rate**
   - Track revocations per hour
   - Alert on unusual spikes

3. **Failed Revocation Attempts**
   - Monitor for potential abuse
   - Alert on repeated failures from same user

### Example Monitoring Query

```sql
-- Revocations in last 24 hours
SELECT
  COUNT(*) as total_revocations,
  COUNT(CASE WHEN details->>'is_self_revocation' = 'true' THEN 1 END) as self_revocations,
  COUNT(CASE WHEN details->>'is_self_revocation' = 'false' THEN 1 END) as admin_revocations
FROM audit_logs
WHERE action = 'LOGOUT'
AND details->>'action' = 'session_revoked'
AND created_at > NOW() - INTERVAL '24 hours';
```

## Files Modified

- `/Users/andrewmorton/Documents/GitHub/fleet-local/api/src/routes/session-revocation.ts` (NEW)
- `/Users/andrewmorton/Documents/GitHub/fleet-local/api/src/middleware/auth.ts` (MODIFIED)
- `/Users/andrewmorton/Documents/GitHub/fleet-local/api/src/server.ts` (MODIFIED)

## References

- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- FedRAMP Security Controls: https://www.fedramp.gov/
