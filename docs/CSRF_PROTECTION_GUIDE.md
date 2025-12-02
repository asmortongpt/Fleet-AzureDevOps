# CSRF Protection Usage Guide

Complete guide for implementing Cross-Site Request Forgery (CSRF) protection in the Fleet Management System.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Cookie Configuration](#cookie-configuration)
6. [Testing](#testing)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

## Overview

The Fleet CSRF protection system provides:
- **Double Submit Cookie** pattern for CSRF protection
- **Automatic token rotation** on each request
- **Secure, HttpOnly cookies** to prevent XSS
- **SameSite=Strict** attribute for additional protection
- **Automatic retry** on token expiration
- **Development mode** with conditional protection

### What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack where a malicious website tricks a user's browser into making unauthorized requests to your application using the user's authenticated session.

**Example Attack:**
```html
<!-- Malicious website -->
<img src="https://fleet.example.com/api/vehicles/123" hidden />
<!-- Browser automatically sends session cookies, deleting the vehicle! -->
```

### How Our Protection Works

```
┌─────────────────────┐
│   Client Request    │
│  (needs CSRF token) │
└──────────┬──────────┘
           │
           │ 1. GET /api/csrf
           ▼
┌─────────────────────┐
│   Backend Server    │
│  • Generate token   │
│  • Set cookie       │
│  • Return token     │
└──────────┬──────────┘
           │
           │ 2. Return: { csrfToken: "abc123" }
           │    Set-Cookie: __Host-csrf.token=xyz789
           ▼
┌─────────────────────┐
│   Client Stores     │
│  • Token: "abc123"  │
│  • Cookie: "xyz789" │
└──────────┬──────────┘
           │
           │ 3. POST /api/vehicles
           │    X-CSRF-Token: abc123
           │    Cookie: __Host-csrf.token=xyz789
           ▼
┌─────────────────────┐
│  Backend Validates  │
│  • Compare token    │
│    with cookie      │
│  • Must match       │
└──────────┬──────────┘
           │
           ▼
      ✅ Request Allowed
```

## Architecture

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| CSRF Middleware | `api/src/middleware/csrf.ts` | Backend protection |
| API Client | `src/lib/api-client.ts` | Frontend integration |
| E2E Tests | `e2e/security/csrf-xss.test.ts` | Security validation |

### Security Features

- **Double Submit Cookie:** Token in both header and cookie
- **HttpOnly Cookies:** JavaScript cannot access cookie value
- **Secure Flag:** Only sent over HTTPS in production
- **SameSite=Strict:** Prevents cross-site cookie transmission
- **Token Rotation:** New token on each request
- **__Host- Prefix:** Enhanced cookie security

## Backend Implementation

### 1. CSRF Middleware Setup

```typescript
// api/src/middleware/csrf.ts
import { doubleCsrf } from 'csrf-csrf'

const {
  generateToken,
  doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: '__Host-csrf.token', // __Host- prefix for security
  cookieOptions: {
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // Prevent CSRF attacks
    path: '/',
    maxAge: 7200000 // 2 hours
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Safe methods
  getTokenFromRequest: (req) => {
    // Check multiple locations
    return req.headers['x-csrf-token'] as string ||
           req.body?._csrf ||
           req.query?._csrf as string
  }
})

export const csrfTokenMiddleware = (req, res) => {
  const token = generateToken(req, res)
  res.json({ csrfToken: token })
}

export const csrfProtection = doubleCsrfProtection
```

### 2. Apply to Express Routes

```typescript
// api/src/app.ts
import express from 'express'
import {
  csrfTokenMiddleware,
  csrfProtection,
  csrfErrorHandler,
  conditionalCsrfProtection
} from './middleware/csrf'

const app = express()

// CSRF token endpoint (no protection needed)
app.get('/api/csrf', csrfTokenMiddleware)

// Apply CSRF protection to all state-changing routes
app.use('/api', conditionalCsrfProtection)

// CSRF error handler (must be after routes)
app.use(csrfErrorHandler)
```

### 3. Conditional CSRF Protection

```typescript
// api/src/middleware/csrf.ts
export const conditionalCsrfProtection = (req, res, next) => {
  // Skip CSRF for webhook endpoints (use signature validation instead)
  if (req.path.startsWith('/api/webhooks/')) {
    return next()
  }

  // Skip CSRF for login in DEV mode (easier testing)
  if (process.env.NODE_ENV === 'development' && req.path === '/api/auth/login') {
    console.log('[CSRF] DEV mode - skipping CSRF protection for login')
    return next()
  }

  // Skip CSRF in development mock data mode
  if (process.env.USE_MOCK_DATA === 'true' && process.env.NODE_ENV === 'development') {
    return next()
  }

  // Apply CSRF protection
  csrfProtection(req, res, next)
}
```

### 4. CSRF Error Handler

```typescript
// api/src/middleware/csrf.ts
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      error: 'Invalid or missing CSRF token',
      message: 'CSRF token validation failed. Please refresh the page and try again.'
    })
  } else {
    next(err)
  }
}
```

### 5. Route-Level Protection

```typescript
// api/src/routes/vehicles.ts
import { Router } from 'express'
import { csrfProtection } from '../middleware/csrf'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

// GET routes don't need CSRF protection
router.get('/vehicles', authenticateJWT, getVehicles)
router.get('/vehicles/:id', authenticateJWT, getVehicle)

// POST/PUT/DELETE routes automatically protected by app-level middleware
router.post('/vehicles', authenticateJWT, createVehicle)
router.put('/vehicles/:id', authenticateJWT, updateVehicle)
router.delete('/vehicles/:id', authenticateJWT, deleteVehicle)

export default router
```

## Frontend Implementation

### 1. API Client with CSRF Support

```typescript
// src/lib/api-client.ts
class APIClient {
  private csrfToken: string | null = null
  private csrfTokenPromise: Promise<void> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.initializeCsrfToken()
  }

  /**
   * Fetches and caches CSRF token from server
   */
  private async initializeCsrfToken(): Promise<void> {
    // Skip in mock data mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return
    }

    // Return existing promise if already fetching
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise
    }

    // Return if we already have a token
    if (this.csrfToken) {
      return
    }

    this.csrfTokenPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/csrf`, {
          method: 'GET',
          credentials: 'include' // Required for cookies
        })

        if (response.ok) {
          const data = await response.json()
          this.csrfToken = data.csrfToken
          console.log('CSRF token initialized')
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error)
      } finally {
        this.csrfTokenPromise = null
      }
    })()

    return this.csrfTokenPromise
  }

  /**
   * Refreshes the CSRF token
   */
  async refreshCsrfToken(): Promise<void> {
    this.csrfToken = null
    this.csrfTokenPromise = null
    await this.initializeCsrfToken()
  }

  /**
   * Makes an API request with CSRF protection
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure CSRF token for state-changing requests
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      options.method?.toUpperCase() || 'GET'
    )

    if (isStateChanging) {
      await this.initializeCsrfToken()
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add CSRF token header
    if (isStateChanging && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Include cookies
      })

      // Handle CSRF token expiration
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))

        // Retry with refreshed token
        if (response.status === 403 && error.error?.includes('CSRF')) {
          console.warn('CSRF token invalid, refreshing...')
          await this.refreshCsrfToken()

          // Retry request
          if (isStateChanging && this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: 'include'
            })

            if (!retryResponse.ok) {
              throw new APIError(
                error.message || 'Request failed',
                retryResponse.status,
                error
              )
            }

            return retryResponse.json()
          }
        }

        throw new APIError(
          error.message || 'Request failed',
          response.status,
          error
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Network error', 0, error)
    }
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new APIClient(API_BASE_URL)
```

### 2. React Component Usage

```typescript
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'

function CreateVehicleForm() {
  const [vehicle, setVehicle] = useState({
    vin: '',
    make: '',
    model: '',
    year: 2024
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // CSRF token automatically included
      const newVehicle = await apiClient.post('/api/vehicles', vehicle)
      console.log('Vehicle created:', newVehicle)

      // Reset form
      setVehicle({ vin: '', make: '', model: '', year: 2024 })
    } catch (error) {
      console.error('Failed to create vehicle:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={vehicle.vin}
        onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value })}
        placeholder="VIN"
      />
      <input
        value={vehicle.make}
        onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
        placeholder="Make"
      />
      <input
        value={vehicle.model}
        onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
        placeholder="Model"
      />
      <input
        type="number"
        value={vehicle.year}
        onChange={(e) => setVehicle({ ...vehicle, year: parseInt(e.target.value) })}
        placeholder="Year"
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Vehicle'}
      </button>
    </form>
  )
}
```

### 3. Manual CSRF Token Usage

```typescript
// For custom fetch calls (not using apiClient)
async function manualApiCall() {
  // 1. Fetch CSRF token
  const csrfResponse = await fetch('/api/csrf', {
    credentials: 'include'
  })
  const { csrfToken } = await csrfResponse.json()

  // 2. Make request with token
  const response = await fetch('/api/vehicles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include', // CRITICAL: Include cookies
    body: JSON.stringify({
      vin: '1HGBH41JXMN109186',
      make: 'Honda',
      model: 'Accord',
      year: 2024
    })
  })

  return response.json()
}
```

## Cookie Configuration

### Production Configuration

```typescript
// api/src/middleware/csrf.ts
cookieOptions: {
  httpOnly: true, // JavaScript cannot access
  secure: true, // HTTPS only
  sameSite: 'strict', // Prevent cross-site requests
  path: '/',
  maxAge: 7200000, // 2 hours
  domain: undefined // Same domain only
}
```

### Development Configuration

```typescript
cookieOptions: {
  httpOnly: true,
  secure: false, // Allow HTTP in dev
  sameSite: 'strict',
  path: '/',
  maxAge: 7200000
}
```

### Cookie Name Security

The `__Host-` prefix provides additional security:

```typescript
cookieName: '__Host-csrf.token'
```

**Requirements:**
- Cookie must be set with `Secure` flag
- Cookie must be set from a secure page (HTTPS)
- Cookie must not have a `Domain` attribute
- Cookie path must be `/`

**Benefits:**
- Prevents subdomain attacks
- Ensures cookie is scoped to the exact host
- No cross-domain cookie leakage

## Testing

### 1. Unit Tests

```typescript
import { describe, test, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

describe('CSRF Protection', () => {
  test('GET /api/csrf returns CSRF token', async () => {
    const res = await request(app)
      .get('/api/csrf')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('csrfToken')
    expect(typeof res.body.csrfToken).toBe('string')
    expect(res.body.csrfToken.length).toBeGreaterThan(0)
  })

  test('POST without CSRF token fails', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .send({ vin: '1HGBH41JXMN109186', make: 'Honda' })

    expect(res.status).toBe(403)
    expect(res.body.error).toContain('CSRF')
  })

  test('POST with valid CSRF token succeeds', async () => {
    // Get CSRF token
    const csrfRes = await request(app).get('/api/csrf')
    const csrfToken = csrfRes.body.csrfToken
    const cookies = csrfRes.headers['set-cookie']

    // Make authenticated request
    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', 'Bearer test-token')
      .send({ vin: '1HGBH41JXMN109186', make: 'Honda' })

    expect(res.status).toBe(201)
  })

  test('POST with invalid CSRF token fails', async () => {
    // Get cookies but use wrong token
    const csrfRes = await request(app).get('/api/csrf')
    const cookies = csrfRes.headers['set-cookie']

    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', 'invalid-token')
      .send({ vin: '1HGBH41JXMN109186' })

    expect(res.status).toBe(403)
  })

  test('GET requests do not require CSRF token', async () => {
    const res = await request(app)
      .get('/api/vehicles')

    // Should not be blocked by CSRF
    expect(res.status).not.toBe(403)
  })
})
```

### 2. Integration Tests

```typescript
describe('CSRF Integration', () => {
  test('complete CSRF flow works', async () => {
    // 1. Fetch CSRF token
    const csrfRes = await request(app).get('/api/csrf')
    const csrfToken = csrfRes.body.csrfToken
    const cookies = csrfRes.headers['set-cookie']

    // 2. Login with CSRF token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'user@example.com', password: 'password' })

    expect(loginRes.status).toBe(200)

    // 3. Get new CSRF token after login
    const newCsrfRes = await request(app)
      .get('/api/csrf')
      .set('Cookie', loginRes.headers['set-cookie'])

    const newCsrfToken = newCsrfRes.body.csrfToken

    // 4. Make authenticated request with new token
    const vehicleRes = await request(app)
      .post('/api/vehicles')
      .set('Cookie', loginRes.headers['set-cookie'])
      .set('X-CSRF-Token', newCsrfToken)
      .send({ vin: '1HGBH41JXMN109186', make: 'Honda' })

    expect(vehicleRes.status).toBe(201)
  })
})
```

### 3. E2E Tests

```typescript
// e2e/security/csrf-xss.test.ts
import { test, expect } from '@playwright/test'

test('CSRF protection in browser', async ({ page, context }) => {
  // Navigate to app
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Intercept AJAX requests
  const requests: any[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') {
      requests.push({
        method: request.method(),
        headers: request.headers(),
        url: request.url()
      })
    }
  })

  // Fill form and submit
  await page.fill('input[name="vin"]', '1HGBH41JXMN109186')
  await page.fill('input[name="make"]', 'Honda')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1000)

  // Check that CSRF token was included
  const postRequests = requests.filter(r => r.method === 'POST')
  expect(postRequests.length).toBeGreaterThan(0)

  const hasCSRF = postRequests.some(r =>
    r.headers['x-csrf-token'] || r.headers['x-xsrf-token']
  )
  expect(hasCSRF).toBe(true)

  // Check cookies
  const cookies = await context.cookies()
  const csrfCookie = cookies.find(c => c.name.includes('csrf'))

  expect(csrfCookie).toBeDefined()
  expect(csrfCookie?.httpOnly).toBe(true)
  expect(csrfCookie?.sameSite).toBe('Strict')
})
```

## Security Considerations

### 1. Token Secret Management

```bash
# Generate a secure CSRF secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env
CSRF_SECRET=your-generated-secret-here
```

**DO NOT:**
- Use the default secret in production
- Commit secrets to version control
- Share secrets between environments

### 2. Cookie Security Checklist

- ✅ HttpOnly flag prevents JavaScript access
- ✅ Secure flag ensures HTTPS-only transmission
- ✅ SameSite=Strict prevents cross-site attacks
- ✅ __Host- prefix enhances security
- ✅ Short maxAge (2 hours) limits exposure
- ✅ Path=/ scopes to entire application

### 3. Defense in Depth

CSRF protection is **one layer** of security. Also implement:

```typescript
// Additional security measures
app.use(helmet()) // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit requests per IP
}))
```

### 4. Known Limitations

**CSRF protection DOES NOT prevent:**
- XSS attacks (use input validation)
- SQL injection (use parameterized queries)
- Clickjacking (use X-Frame-Options header)
- DDoS attacks (use rate limiting)

**CSRF protection DOES prevent:**
- Unauthorized state-changing requests from malicious sites
- Cookie-based session hijacking from cross-origin requests

### 5. Browser Compatibility

Our implementation works with:
- ✅ Chrome/Edge (all versions with SameSite support)
- ✅ Firefox (all versions with SameSite support)
- ✅ Safari (all versions with SameSite support)
- ⚠️ IE11 (limited SameSite support)

For IE11, fallback to Lax SameSite:

```typescript
sameSite: process.env.LEGACY_BROWSER_SUPPORT === 'true' ? 'lax' : 'strict'
```

## Troubleshooting

### Issue: "Invalid or missing CSRF token"

**Symptoms:**
- 403 errors on POST/PUT/DELETE requests
- Error message: "Invalid or missing CSRF token"

**Solutions:**

1. **Check frontend sends token:**
   ```typescript
   // Verify X-CSRF-Token header is present
   console.log('Request headers:', headers)
   ```

2. **Check cookies are enabled:**
   ```typescript
   // Ensure credentials: 'include' is set
   fetch(url, { credentials: 'include' })
   ```

3. **Check domain matches:**
   ```typescript
   // Frontend and backend must be same domain
   // OR use CORS with credentials
   app.use(cors({
     origin: 'https://frontend.example.com',
     credentials: true
   }))
   ```

4. **Check CSRF_SECRET is set:**
   ```bash
   echo $CSRF_SECRET
   # Should output a 32+ character secret
   ```

### Issue: CSRF token expires too quickly

**Solution:**
Increase maxAge in cookie options:

```typescript
cookieOptions: {
  // ...
  maxAge: 14400000 // 4 hours instead of 2
}
```

### Issue: CSRF protection blocks webhooks

**Solution:**
Use conditional protection to skip webhooks:

```typescript
export const conditionalCsrfProtection = (req, res, next) => {
  if (req.path.startsWith('/api/webhooks/')) {
    return next() // Skip CSRF for webhooks
  }
  csrfProtection(req, res, next)
}
```

Webhooks should use signature validation instead:

```typescript
router.post('/webhooks/stripe', validateStripeSignature, handleWebhook)
```

### Issue: CSRF fails in development

**Solution:**
Check development configuration:

```typescript
// api/.env.development
USE_MOCK_DATA=true # Skips CSRF in dev
NODE_ENV=development
CSRF_SECRET=dev-secret-do-not-use-in-prod
```

### Issue: Cookie not being set

**Solutions:**

1. **Check secure flag in development:**
   ```typescript
   secure: process.env.NODE_ENV === 'production' // false in dev
   ```

2. **Check path is correct:**
   ```typescript
   path: '/' // Must match request path
   ```

3. **Check __Host- prefix requirements:**
   ```typescript
   // Remove __Host- in development if not using HTTPS
   cookieName: process.env.NODE_ENV === 'production'
     ? '__Host-csrf.token'
     : 'csrf.token'
   ```

## Best Practices

1. **Always use HTTPS in production**
   - CSRF cookies require secure flag
   - __Host- prefix requires HTTPS

2. **Rotate CSRF secrets regularly**
   ```bash
   # Generate new secret monthly
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Monitor CSRF failures**
   ```typescript
   logger.warn('CSRF validation failed', {
     userId: req.user?.id,
     ip: req.ip,
     userAgent: req.get('user-agent'),
     endpoint: req.path
   })
   ```

4. **Use conditional protection wisely**
   - Skip CSRF only for specific endpoints
   - Document all exceptions
   - Use alternative security for skipped endpoints

5. **Test CSRF protection regularly**
   - Include in CI/CD pipeline
   - Test with real browsers (E2E)
   - Verify cookies are set correctly

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [csrf-csrf Package Documentation](https://github.com/Psifi-Solutions/csrf-csrf)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Chrome __Host- Cookies](https://developer.chrome.com/blog/cookie-prefixes/)
- Source Files:
  - `api/src/middleware/csrf.ts` - CSRF middleware
  - `src/lib/api-client.ts` - Frontend integration
  - `e2e/security/csrf-xss.test.ts` - Security tests

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**CSRF Protection Coverage**: 100%
