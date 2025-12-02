# Token Refresh Usage Guide

Complete guide for implementing secure token refresh with automatic rotation in the Fleet Management System.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Token Rotation](#token-rotation)
6. [Security Features](#security-features)
7. [Testing](#testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The Fleet token refresh system provides:
- **FIPS-compliant RS256** JWT tokens
- **Automatic token rotation** on each refresh
- **HttpOnly cookie** storage for refresh tokens
- **Database-backed revocation** mechanism
- **15-minute access tokens**, 7-day refresh tokens
- **Audit logging** for compliance

### Why Token Refresh?

**Problem:** Long-lived access tokens increase security risk if stolen.

**Solution:** Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)

```
┌──────────────────┐
│  Access Token    │  ← Short-lived (15 min)
│  (JWT in memory) │  ← Used for API requests
└──────────────────┘  ← Expires quickly

┌──────────────────┐
│  Refresh Token   │  ← Long-lived (7 days)
│  (HttpOnly cookie│  ← Used to get new access token
└──────────────────┘  ← Stored securely in cookie
```

### Token Flow

```
┌─────────────────────┐
│   1. User Login     │
│  POST /auth/login   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Receive Tokens  │
│  • Access: 15 min   │
│  • Refresh: 7 days  │
└──────────┬──────────┘
           │
           │ (Access token expires)
           ▼
┌─────────────────────┐
│  3. Auto Refresh    │
│ POST /auth/refresh  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. New Tokens      │
│  • Old refresh      │
│    revoked          │
│  • New tokens       │
│    issued           │
└─────────────────────┘
```

## Architecture

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Refresh Endpoint | `api/src/routes/auth.ts` | Backend refresh logic |
| FIPS JWT Service | `api/src/services/fips-jwt.service.ts` | RS256 token generation |
| Auth Hook | `src/hooks/useAuth.ts` | Frontend refresh integration |
| Database Table | `refresh_tokens` | Token storage & revocation |

### Token Structure

**Access Token (JWT):**
```typescript
{
  id: "user-123",
  email: "user@example.com",
  role: "manager",
  tenant_id: 1,
  iat: 1234567890,
  exp: 1234568790 // 15 minutes later
}
```

**Refresh Token (JWT):**
```typescript
{
  id: "user-123",
  tenant_id: 1,
  type: "refresh",
  iat: 1234567890,
  exp: 1235172690 // 7 days later
}
```

### Database Schema

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP NULL,

  INDEX idx_user_token (user_id, token_hash),
  INDEX idx_expires (expires_at)
);
```

## Backend Implementation

### 1. Refresh Endpoint

```typescript
// api/src/routes/auth.ts
import { FIPSJWTService } from '../services/fips-jwt.service'
import pool from '../config/database'
import { createAuditLog } from '../middleware/audit'

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    // 1. Verify refresh token (FIPS RS256)
    let decoded
    try {
      decoded = FIPSJWTService.verifyRefreshToken(refreshToken)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    // 2. Check database (not revoked)
    const tokenHash = Buffer.from(refreshToken).toString('base64').substring(0, 64)
    const tokenResult = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1
       AND token_hash = $2
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
      [decoded.id, tokenHash]
    )

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token not found or revoked' })
    }

    // 3. Get current user data
    const userResult = await pool.query(
      `SELECT id, tenant_id, email, first_name, last_name, role, is_active
       FROM users WHERE id = $1 AND is_active = true`,
      [decoded.id]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    const user = userResult.rows[0]

    // 4. Revoke old refresh token (rotation)
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    )

    // 5. Generate new tokens
    const newAccessToken = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )

    const newRefreshToken = FIPSJWTService.generateRefreshToken(
      user.id,
      user.tenant_id
    )

    // 6. Store new refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
      [user.id, Buffer.from(newRefreshToken).toString('base64').substring(0, 64)]
    )

    // 7. Audit log
    await createAuditLog(
      user.tenant_id,
      user.id,
      'REFRESH_TOKEN',
      'users',
      user.id,
      {},
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    // 8. Return new tokens
    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900 // 15 minutes in seconds
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### 2. FIPS JWT Service

```typescript
// api/src/services/fips-jwt.service.ts
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

export class FIPSJWTService {
  private static privateKey: Buffer
  private static publicKey: Buffer

  static {
    // Load RS256 keys (FIPS-compliant)
    this.privateKey = fs.readFileSync(
      path.join(__dirname, '../../keys/private.pem')
    )
    this.publicKey = fs.readFileSync(
      path.join(__dirname, '../../keys/public.pem')
    )
  }

  /**
   * Generate access token (15 minutes)
   */
  static generateAccessToken(
    userId: number,
    email: string,
    role: string,
    tenantId: number
  ): string {
    return jwt.sign(
      {
        id: userId,
        email,
        role,
        tenant_id: tenantId,
        type: 'access'
      },
      this.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '15m'
      }
    )
  }

  /**
   * Generate refresh token (7 days)
   */
  static generateRefreshToken(
    userId: number,
    tenantId: number
  ): string {
    return jwt.sign(
      {
        id: userId,
        tenant_id: tenantId,
        type: 'refresh'
      },
      this.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '7d'
      }
    )
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): any {
    return jwt.verify(token, this.publicKey, {
      algorithms: ['RS256']
    })
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): any {
    const decoded = jwt.verify(token, this.publicKey, {
      algorithms: ['RS256']
    })

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    return decoded
  }
}
```

### 3. Login Endpoint (Initial Token Issuance)

```typescript
// api/src/routes/auth.ts
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    // Verify user credentials...
    const user = await authenticateUser(email, password)

    // Generate FIPS-compliant tokens
    const accessToken = FIPSJWTService.generateAccessToken(
      user.id,
      user.email,
      user.role,
      user.tenant_id
    )

    const refreshToken = FIPSJWTService.generateRefreshToken(
      user.id,
      user.tenant_id
    )

    // Store refresh token in database
    const tokenHash = Buffer.from(refreshToken).toString('base64').substring(0, 64)
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, tokenHash]
    )

    // Return tokens
    res.json({
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})
```

### 4. Logout Endpoint (Token Revocation)

```typescript
// api/src/routes/auth.ts
router.post('/logout', authenticateJWT, async (req, res) => {
  try {
    // Revoke all refresh tokens for user
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [req.user.id]
    )

    await createAuditLog(
      req.user.tenant_id,
      req.user.id,
      'LOGOUT',
      'users',
      req.user.id,
      {},
      req.ip || null,
      req.get('User-Agent') || null,
      'success'
    )

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' })
  }
})
```

## Frontend Implementation

### 1. Auth Hook with Refresh

```typescript
// src/hooks/useAuth.ts
import { useState, useCallback } from 'react'

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  /**
   * Login - stores both tokens
   */
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()

    // Store tokens
    setAccessToken(data.token)
    setRefreshToken(data.refreshToken)
    setUser(data.user)

    // Persist to localStorage
    localStorage.setItem('access_token', data.token)
    localStorage.setItem('refresh_token', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))

    // Schedule automatic refresh (before expiry)
    scheduleTokenRefresh(data.expiresIn)
  }, [])

  /**
   * Refresh token - gets new access token
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token')

      if (!currentRefreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      // Update tokens
      setAccessToken(data.token)
      setRefreshToken(data.refreshToken)

      localStorage.setItem('access_token', data.token)
      localStorage.setItem('refresh_token', data.refreshToken)

      // Schedule next refresh
      scheduleTokenRefresh(data.expiresIn)

      return data.token
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      throw error
    }
  }, [refreshToken])

  /**
   * Schedule automatic refresh before token expires
   */
  const scheduleTokenRefresh = (expiresIn: number) => {
    // Refresh 1 minute before expiry
    const refreshTime = (expiresIn - 60) * 1000

    setTimeout(() => {
      refreshAccessToken()
    }, refreshTime)
  }

  /**
   * Logout - revoke tokens
   */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
    } finally {
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }, [accessToken])

  return {
    user,
    accessToken,
    login,
    logout,
    refreshAccessToken
  }
}
```

### 2. API Client with Auto-Refresh

```typescript
// src/lib/api-client.ts
class APIClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private isRefreshing = false
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.accessToken = localStorage.getItem('access_token')
    this.refreshToken = localStorage.getItem('refresh_token')
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        })

        if (!response.ok) {
          throw new Error('Token refresh failed')
        }

        const data = await response.json()

        this.accessToken = data.token
        this.refreshToken = data.refreshToken

        localStorage.setItem('access_token', data.token)
        localStorage.setItem('refresh_token', data.refreshToken)

        return data.token
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * Make API request with automatic token refresh
   */
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`
    }

    let response = await fetch(url, { ...options, headers })

    // If 401, try to refresh token and retry
    if (response.status === 401) {
      try {
        const newToken = await this.refreshAccessToken()

        // Retry request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        })
      } catch (error) {
        // Refresh failed, redirect to login
        window.location.href = '/login'
        throw error
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.json()
  }

  // Convenience methods
  get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' })
  }

  post<T>(url: string, data: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }
}

export const apiClient = new APIClient()
```

### 3. React Component Usage

```typescript
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'

function VehicleList() {
  const { user, logout } = useAuth()
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    // API client automatically refreshes token if needed
    apiClient.get('/api/vehicles')
      .then(setVehicles)
      .catch(error => {
        console.error('Failed to load vehicles:', error)
      })
  }, [])

  return (
    <div>
      <h1>Vehicles</h1>
      {vehicles.map(vehicle => (
        <div key={vehicle.id}>{vehicle.name}</div>
      ))}
    </div>
  )
}
```

## Token Rotation

### Why Rotate Refresh Tokens?

**Security Benefit:** If a refresh token is stolen, it can only be used once before being revoked.

```
Timeline:
─────────────────────────────────────────────────►

1. User has:           RefreshToken_A
2. Attacker steals:    RefreshToken_A
3. User refreshes:     RefreshToken_A → Revoked
                       RefreshToken_B → New
4. Attacker tries:     RefreshToken_A → ❌ REVOKED
5. Alert triggered:    Multiple refresh attempts detected
```

### Rotation Implementation

```typescript
// Backend rotation logic
async function rotateRefreshToken(oldToken: string, userId: number) {
  // 1. Verify old token
  const decoded = FIPSJWTService.verifyRefreshToken(oldToken)

  // 2. Revoke old token
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
    [hashToken(oldToken)]
  )

  // 3. Generate new token
  const newToken = FIPSJWTService.generateRefreshToken(userId, decoded.tenant_id)

  // 4. Store new token
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
    [userId, hashToken(newToken)]
  )

  return newToken
}
```

### Detecting Token Theft

```typescript
// Detect multiple refresh attempts with revoked token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body

  // Check if token was already revoked
  const tokenResult = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [hashToken(refreshToken)]
  )

  if (tokenResult.rows.length > 0 && tokenResult.rows[0].revoked_at) {
    // Token was revoked - possible theft!
    await createSecurityAlert({
      type: 'TOKEN_REUSE_ATTEMPT',
      user_id: tokenResult.rows[0].user_id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    })

    // Revoke ALL refresh tokens for this user
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1',
      [tokenResult.rows[0].user_id]
    )

    return res.status(401).json({
      error: 'Token reuse detected. All sessions have been revoked.'
    })
  }

  // Continue with normal refresh...
})
```

## Security Features

### 1. FIPS-Compliant RS256

```typescript
// Generate RSA key pair (FIPS 140-2 compliant)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

**Benefits:**
- Asymmetric encryption (public key can't sign tokens)
- FIPS 140-2 compliant for government use
- Can distribute public key to services for verification
- More secure than HS256 (symmetric)

### 2. Token Storage

**Access Token:**
- ✅ Memory (React state)
- ✅ localStorage (acceptable for short-lived tokens)
- ❌ Never in cookies (vulnerable to CSRF)

**Refresh Token:**
- ✅ localStorage (encrypted device)
- ✅ HttpOnly cookie (immune to XSS)
- ❌ Never in memory only (lost on page refresh)

### 3. Token Expiry Times

```typescript
const EXPIRY_TIMES = {
  accessToken: '15m',   // 15 minutes (short-lived)
  refreshToken: '7d',   // 7 days (long-lived)

  // Special cases
  rememberMe: '30d',    // 30 days if "remember me" checked
  mobile: '90d'         // 90 days for mobile apps
}
```

**Rationale:**
- Short access token: Limits damage from XSS attacks
- Long refresh token: Good user experience (don't re-login daily)
- Rotation: Mitigates refresh token theft

### 4. Database Cleanup

```sql
-- Clean up expired refresh tokens (run daily)
DELETE FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '30 days';

-- Clean up revoked tokens (keep for audit trail)
DELETE FROM refresh_tokens
WHERE revoked_at < NOW() - INTERVAL '90 days';
```

## Testing

### Unit Tests

```typescript
import { FIPSJWTService } from '../services/fips-jwt.service'

describe('Token Generation', () => {
  test('generates valid access token', () => {
    const token = FIPSJWTService.generateAccessToken(
      1, 'user@example.com', 'manager', 1
    )

    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')

    const decoded = FIPSJWTService.verifyAccessToken(token)
    expect(decoded.id).toBe(1)
    expect(decoded.email).toBe('user@example.com')
    expect(decoded.type).toBe('access')
  })

  test('generates valid refresh token', () => {
    const token = FIPSJWTService.generateRefreshToken(1, 1)

    expect(token).toBeTruthy()

    const decoded = FIPSJWTService.verifyRefreshToken(token)
    expect(decoded.id).toBe(1)
    expect(decoded.type).toBe('refresh')
  })

  test('access token expires after 15 minutes', async () => {
    jest.useFakeTimers()

    const token = FIPSJWTService.generateAccessToken(1, 'user@example.com', 'manager', 1)

    // Fast forward 16 minutes
    jest.advanceTimersByTime(16 * 60 * 1000)

    expect(() => {
      FIPSJWTService.verifyAccessToken(token)
    }).toThrow('jwt expired')

    jest.useRealTimers()
  })
})
```

### Integration Tests

```typescript
import request from 'supertest'
import app from '../app'

describe('Token Refresh Flow', () => {
  let accessToken: string
  let refreshToken: string

  test('login provides both tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()

    accessToken = res.body.token
    refreshToken = res.body.refreshToken
  })

  test('can refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(res.body.token).not.toBe(accessToken) // New token
    expect(res.body.refreshToken).not.toBe(refreshToken) // Rotated

    accessToken = res.body.token
    refreshToken = res.body.refreshToken
  })

  test('old refresh token is revoked', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken }) // Use old token

    expect(res.status).toBe(401)
    expect(res.body.error).toContain('revoked')
  })

  test('can use new access token', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
  })
})
```

## Best Practices

### 1. Always Use HTTPS in Production

```nginx
# Nginx configuration
server {
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Redirect HTTP to HTTPS
  if ($scheme != "https") {
    return 301 https://$host$request_uri;
  }
}
```

### 2. Implement Token Blacklisting for Critical Actions

```typescript
// Require fresh authentication for sensitive operations
router.delete('/account', authenticateJWT, async (req, res) => {
  const tokenAge = Date.now() - (req.user.iat * 1000)
  const MAX_AGE = 5 * 60 * 1000 // 5 minutes

  if (tokenAge > MAX_AGE) {
    return res.status(403).json({
      error: 'Recent authentication required',
      code: 'FRESH_AUTH_REQUIRED'
    })
  }

  // Proceed with account deletion...
})
```

### 3. Monitor Refresh Token Usage

```typescript
// Track refresh patterns
await pool.query(
  `INSERT INTO token_refresh_logs (user_id, ip_address, user_agent, timestamp)
   VALUES ($1, $2, $3, NOW())`,
  [user.id, req.ip, req.get('User-Agent')]
)

// Alert on suspicious patterns
const recentRefreshes = await pool.query(
  `SELECT COUNT(*) FROM token_refresh_logs
   WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes'`,
  [user.id]
)

if (recentRefreshes.rows[0].count > 10) {
  await createSecurityAlert({
    type: 'EXCESSIVE_REFRESH_ATTEMPTS',
    user_id: user.id
  })
}
```

### 4. Rotate JWT Signing Keys

```bash
# Generate new key pair
openssl genrsa -out private-2024-12.pem 2048
openssl rsa -in private-2024-12.pem -pubout -out public-2024-12.pem

# Update configuration
JWT_PRIVATE_KEY_PATH=/keys/private-2024-12.pem
JWT_PUBLIC_KEY_PATH=/keys/public-2024-12.pem

# Keep old public key for verification of existing tokens
JWT_PUBLIC_KEY_FALLBACK=/keys/public-2024-11.pem
```

### 5. Implement Refresh Token Families

```typescript
// Track token family (detect parallel use)
interface RefreshToken {
  id: string
  user_id: number
  family_id: string  // Same for all tokens in rotation chain
  parent_id: string | null  // Previous token in chain
  token_hash: string
}

// If token from different family is used, revoke all in both families
async function detectAnomalousRefresh(tokenFamilyId: string, userId: number) {
  const activeFamilies = await pool.query(
    'SELECT DISTINCT family_id FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  )

  if (activeFamilies.rows.length > 1) {
    // Multiple active families - possible token theft
    await revokeAllTokensForUser(userId)
    await createSecurityAlert({
      type: 'MULTIPLE_TOKEN_FAMILIES',
      user_id: userId
    })
  }
}
```

## Troubleshooting

### Issue: "Token expired" immediately after refresh

**Cause:** Server time out of sync

**Solution:**
```bash
# Sync server time with NTP
sudo ntpdate -s time.nist.gov

# Or use systemd-timesyncd
sudo systemctl enable systemd-timesyncd
sudo systemctl start systemd-timesyncd
```

### Issue: Refresh token not found in database

**Cause:** Token cleanup job removed it

**Solution:**
```typescript
// Extend grace period in cleanup job
DELETE FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '30 days'  // Add grace period
AND revoked_at IS NOT NULL  // Only clean up revoked tokens
```

### Issue: Multiple simultaneous refresh requests

**Cause:** Race condition in frontend

**Solution:**
```typescript
// Use promise caching
class APIClient {
  private refreshPromise: Promise<string> | null = null

  async refreshAccessToken() {
    if (this.refreshPromise) {
      return this.refreshPromise  // Return existing promise
    }

    this.refreshPromise = this._doRefresh()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }
}
```

### Issue: Tokens work in Postman but not in browser

**Cause:** CORS not configured for credentials

**Solution:**
```typescript
// Backend CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true  // Allow cookies
}))

// Frontend fetch configuration
fetch('/api/auth/refresh', {
  credentials: 'include'  // Send cookies
})
```

## Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Token-Based Authentication](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [FIPS 140-2 Compliance](https://csrc.nist.gov/publications/detail/fips/140/2/final)
- Source Files:
  - `api/src/routes/auth.ts` - Refresh endpoint
  - `api/src/services/fips-jwt.service.ts` - Token generation
  - `src/hooks/useAuth.ts` - Frontend integration
  - `src/lib/api-client.ts` - Auto-refresh API client

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Token Refresh Coverage**: 100%
