# Fleet Management Security API - Usage Examples

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Encryption Operations](#encryption-operations)
3. [Audit Logging](#audit-logging)
4. [SIEM Integration](#siem-integration)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)

---

## Authentication Flow

### 1. Auth0 Login

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/security/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "user@example.com"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "role": "user",
    "displayName": "John Doe"
  },
  "expiresAt": "2025-12-29T12:00:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Authentication failed",
  "code": "AUTH_FAILED"
}
```

### 2. Get Current User Profile

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/security/user \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 42,
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "user",
    "tenantId": 1,
    "authProvider": "auth0",
    "createdAt": "2025-12-01T10:30:00Z"
  },
  "permissions": [
    "read:own",
    "read:fleet",
    "write:own",
    "view:own_audit"
  ]
}
```

### 3. Refresh Token

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/security/refresh \
  -H "Authorization: Bearer <expired-or-expiring-token>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-30T12:00:00Z"
}
```

### 4. Logout

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/security/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Encryption Operations

### 1. Fetch Master Key Metadata (Admin Only)

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/security/master-key \
  -H "Authorization: Bearer <admin-token>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "keyId": "https://fleet-keyvault.vault.azure.net/secrets/fleet-master-key/v1",
  "keyVersion": "v1",
  "algorithm": "AES-256-GCM",
  "retrievedAt": "2025-12-28T12:00:00Z",
  "message": "Master key successfully retrieved from Azure Key Vault"
}
```

**Error Response - Insufficient Permissions (403 Forbidden):**
```json
{
  "error": "Admin access required",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**Error Response - Not Authenticated (401 Unauthorized):**
```json
{
  "error": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED"
}
```

---

## Audit Logging

### 1. Record Audit Log Entry

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/security/audit/log \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "vehicle.created",
    "resourceType": "vehicle",
    "resourceId": "VH-12345",
    "after": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "vin": "JTDE4RFV5M5030297",
      "licensePlate": "FLEET-01"
    }
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Audit log recorded successfully",
  "timestamp": "2025-12-28T12:00:00Z"
}
```

### 2. Store Immutable Audit Log (Admin Only)

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/security/audit/blob-storage \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "user.role.changed",
    "resourceType": "user",
    "resourceId": "USR-42",
    "data": {
      "oldRole": "user",
      "newRole": "admin",
      "changedBy": "USR-99"
    }
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Audit log stored in immutable blob storage",
  "blobUrl": "https://fleetaudits.blob.core.windows.net/audit-logs/2025-12-28/audit-user-role-change-xyz789.json",
  "immutable": true,
  "timestamp": "2025-12-28T12:00:00Z"
}
```

### 3. Example Audit Events

Common audit events to log:

#### User Login Success
```json
{
  "action": "user.login",
  "resourceType": "user",
  "resourceId": "USR-42"
}
```

#### Vehicle Updated
```json
{
  "action": "vehicle.updated",
  "resourceType": "vehicle",
  "resourceId": "VH-12345",
  "before": {
    "mileage": 50000
  },
  "after": {
    "mileage": 50250
  }
}
```

#### Driver License Verified
```json
{
  "action": "driver.license.verified",
  "resourceType": "driver",
  "resourceId": "DRV-789",
  "after": {
    "licenseVerified": true,
    "verificationDate": "2025-12-28",
    "verificationMethod": "MVR_CHECK"
  }
}
```

#### Maintenance Record Created
```json
{
  "action": "maintenance.created",
  "resourceType": "maintenance",
  "resourceId": "MNT-456",
  "after": {
    "vehicleId": "VH-12345",
    "type": "OIL_CHANGE",
    "cost": 125.00,
    "completedDate": "2025-12-28"
  }
}
```

---

## SIEM Integration

### 1. Forward Event to SIEM

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/security/audit/siem \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "unauthorized_access_attempt",
    "resourceType": "vehicle",
    "severity": "HIGH",
    "details": {
      "attemptedResource": "VH-12345",
      "attemptedAction": "DELETE",
      "userRole": "viewer"
    }
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Event forwarded to SIEM system",
  "siemEventId": "siem-evt-abc-123-def-456",
  "forwarded": true,
  "timestamp": "2025-12-28T12:00:00Z"
}
```

### 2. SIEM Event Types

Common event types:

#### Security Alert - High Severity
```json
{
  "action": "multiple_failed_login_attempts",
  "resourceType": "authentication",
  "severity": "HIGH",
  "details": {
    "failureCount": 6,
    "timeWindow": "15 minutes",
    "sourceIp": "203.0.113.45"
  }
}
```

#### Data Access Event
```json
{
  "action": "sensitive_data_accessed",
  "resourceType": "pii_data",
  "severity": "MEDIUM",
  "details": {
    "dataType": "driver_ssn",
    "accessMethod": "API",
    "accessedBy": "report_generation_job"
  }
}
```

#### Configuration Change
```json
{
  "action": "system_configuration_changed",
  "resourceType": "system",
  "severity": "MEDIUM",
  "details": {
    "configKey": "rate_limit_threshold",
    "oldValue": 100,
    "newValue": 50,
    "changedBy": "admin@company.com"
  }
}
```

#### Compliance Event
```json
{
  "action": "compliance_violation_detected",
  "resourceType": "compliance",
  "severity": "CRITICAL",
  "details": {
    "violationType": "GDPR_DATA_RETENTION",
    "violationDescription": "User data retained beyond 90-day threshold",
    "affectedRecordCount": 342
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Login successful, audit log recorded |
| 400 | Bad Request | Missing required fields, invalid format |
| 401 | Unauthorized | No token provided, invalid token |
| 403 | Forbidden | Insufficient permissions (non-admin accessing admin endpoint) |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Rate Limited | Too many requests (rate limit exceeded) |
| 500 | Server Error | Database connection failed, encryption error |

### Common Error Scenarios

#### Missing Authentication Token
```bash
curl -X GET http://localhost:3000/api/v1/security/user
```

**Response (401 Unauthorized):**
```json
{
  "error": "No token provided",
  "code": "MISSING_TOKEN"
}
```

#### Invalid Token Format
```bash
curl -X GET http://localhost:3000/api/v1/security/user \
  -H "Authorization: Bearer invalid-token-format"
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

#### Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/v1/security/audit/log \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "user.login"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: action, resourceType",
  "code": "VALIDATION_FAILED"
}
```

#### Rate Limit Exceeded
```bash
# Making 11 requests in quick succession (limit is 10/min)
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Security Best Practices

### 1. Token Management

**CORRECT: Store token securely**
```typescript
// Backend: Store in httpOnly cookie (if web)
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Frontend (if SPA): Store in memory only, not localStorage
const [token, setToken] = useState<string | null>(null);
```

**WRONG: Store token in localStorage (vulnerable to XSS)**
```typescript
// ❌ VULNERABLE
localStorage.setItem('token', jwtToken);
```

### 2. Request Headers

**CORRECT: Always include Authorization header**
```bash
curl -X GET http://localhost:3000/api/v1/security/user \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**WRONG: Passing token in query parameter**
```bash
# ❌ VULNERABLE - Tokens in URLs can be logged
curl "http://localhost:3000/api/v1/security/user?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Sensitive Data Logging

**CORRECT: Log metadata only, never secrets**
```json
{
  "action": "encryption_key_accessed",
  "userId": 42,
  "timestamp": "2025-12-28T12:00:00Z",
  "result": "success"
}
```

**WRONG: Logging sensitive data**
```json
{
  "action": "encryption_key_accessed",
  "userId": 42,
  "keyValue": "DXz...",
  "keyAlgorithm": "AES-256-GCM"
}
```

### 4. Input Validation

**CORRECT: Validate and whitelist input**
```typescript
const schema = z.object({
  action: z.string().min(1).max(100),
  resourceType: z.string().min(1).max(100),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional()
});

const validated = await schema.parseAsync(req.body);
```

**WRONG: Accepting raw user input**
```typescript
// ❌ VULNERABLE
const action = req.body.action;
const query = `INSERT INTO logs (action) VALUES ('${action}')`;
```

### 5. CSRF Protection

All POST/PUT/DELETE endpoints automatically include CSRF protection:

```typescript
// Frontend: Get CSRF token
const csrfRes = await fetch('/api/v1/csrf-token');
const { token } = await csrfRes.json();

// Include in requests
const res = await fetch('/api/v1/security/audit/log', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({...})
});
```

### 6. Rate Limiting

Automatic rate limiting protects endpoints:

- **Auth endpoints**: 10 requests per minute per IP
- **General API**: 100 requests per minute per IP
- **Sensitive operations**: 5 requests per minute per user (GDPR deletion, etc.)

---

## Advanced Usage

### Batch Audit Operations

For high-volume audit logging, batch events before sending:

```typescript
// Collect multiple events
const events = [
  { action: 'vehicle.updated', resourceType: 'vehicle', resourceId: 'VH-1' },
  { action: 'maintenance.created', resourceType: 'maintenance', resourceId: 'MNT-1' },
  { action: 'driver.verified', resourceType: 'driver', resourceId: 'DRV-1' }
];

// Send as batch
for (const event of events) {
  await fetch('/api/v1/security/audit/log', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(event)
  });
}
```

### Audit Trail Queries

Query historical audit events:

```sql
-- Get all events for a specific resource
SELECT * FROM audit_logs
WHERE resource_type = 'vehicle'
  AND resource_id = 'VH-12345'
ORDER BY created_at DESC;

-- Get failed login attempts
SELECT * FROM audit_logs
WHERE action = 'user.login'
  AND result = 'failure'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Get admin actions
SELECT * FROM audit_logs
WHERE action LIKE 'admin.%'
  OR action = 'security.alert'
ORDER BY created_at DESC LIMIT 100;
```

### Monitoring Key Rotation

Check when encryption keys were last rotated:

```typescript
// In admin dashboard
const response = await fetch('/api/v1/security/master-key', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const { keyVersion, retrievedAt } = await response.json();
console.log(`Current key version: ${keyVersion}`);
console.log(`Last retrieved: ${retrievedAt}`);
```

---

## Testing the APIs

### Using Postman

1. **Set up environment variables:**
   ```json
   {
     "base_url": "http://localhost:3000",
     "admin_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

2. **Test login endpoint:**
   - POST {{base_url}}/api/v1/security/login
   - Body: `{ "email": "test@example.com", "idToken": "..." }`

3. **Test protected endpoint:**
   - GET {{base_url}}/api/v1/security/user
   - Header: `Authorization: Bearer {{user_token}}`

### Using cURL Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# 1. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/security/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "idToken": "test-token"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 2. Get user profile
echo "Getting user profile..."
curl -s -X GET $BASE_URL/api/v1/security/user \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Record audit log
echo "Recording audit log..."
curl -s -X POST $BASE_URL/api/v1/security/audit/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test.event",
    "resourceType": "test",
    "resourceId": "test-123"
  }' | jq

# 4. Logout
echo "Logging out..."
curl -s -X POST $BASE_URL/api/v1/security/logout \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

**Last Updated:** December 28, 2025
**Version:** 1.0.0
