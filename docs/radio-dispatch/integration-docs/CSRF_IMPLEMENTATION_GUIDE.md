# CSRF Protection Implementation Guide

## Overview

This guide provides comprehensive documentation on the CSRF (Cross-Site Request Forgery) protection implementation in Radio Fleet Dispatch. The implementation follows industry best practices and provides multiple layers of defense against CSRF attacks.

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

## Architecture

### Defense Layers

The CSRF protection system implements four complementary defense mechanisms:

1. **Double-Submit Cookie Pattern**
   - Token sent in both cookie and custom HTTP header
   - Attacker cannot read or set custom headers from different origin
   - Both must match for request to be valid

2. **Synchronizer Token Pattern**
   - Server-generated cryptographically random tokens
   - Tokens tied to user session
   - Validated on every state-changing request

3. **Origin/Referer Validation**
   - Request origin validated against whitelist
   - Blocks requests from unauthorized domains
   - Prevents cross-origin attacks

4. **SameSite Cookie Attribute**
   - Cookies set with `SameSite=Strict`
   - Browser prevents cookie transmission in cross-site context
   - Additional browser-level protection

### Request Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Backend   │                    │  Database   │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │ 1. GET /csrf-token               │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │                                  │
       │ 2. { csrf_token: "abc123" }      │                                  │
       │    Set-Cookie: csrf_token=abc123 │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
       │ 3. POST /api/incidents           │                                  │
       │    X-CSRF-Token: abc123          │                                  │
       │    Cookie: csrf_token=abc123     │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │ 4. Validate:                     │
       │                                  │    - Origin header               │
       │                                  │    - Token in header             │
       │                                  │    - Token in cookie             │
       │                                  │    - Tokens match                │
       │                                  │                                  │
       │                                  │ 5. Save incident                 │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │ 6. { id: 123, created: true }    │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

## Backend Implementation

### Middleware Setup

The CSRF middleware is implemented in `services/api/app/middleware/csrf.py`:

```python
from app.middleware.csrf import CSRFMiddleware

# Add to FastAPI application
app.add_middleware(
    CSRFMiddleware,
    allowed_origins={
        "http://localhost:3000",
        "https://fleet.capitaltechalliance.com"
    }
)
```

### Key Components

#### Token Generation

```python
def generate_csrf_token() -> str:
    """Generate cryptographically secure CSRF token"""
    return secrets.token_urlsafe(32)  # 32 bytes = 256 bits
```

- Uses Python's `secrets` module (CSPRNG)
- 32 bytes provides 256 bits of entropy
- URL-safe base64 encoding for HTTP transmission

#### Token Validation

```python
async def _validate_csrf(self, request: Request) -> None:
    # 1. Validate Origin/Referer
    origin = extract_origin(request)
    if not is_safe_origin(origin, self.allowed_origins):
        raise HTTPException(403, "Invalid origin")

    # 2. Extract token from header
    csrf_token_header = request.headers.get("X-CSRF-Token")
    if not csrf_token_header:
        raise HTTPException(403, "Missing CSRF token in header")

    # 3. Extract token from cookie
    csrf_token_cookie = request.cookies.get("csrf_token")
    if not csrf_token_cookie:
        raise HTTPException(403, "Missing CSRF token in cookie")

    # 4. Compare using constant-time comparison
    if not hmac.compare_digest(csrf_token_header, csrf_token_cookie):
        raise HTTPException(403, "CSRF token mismatch")
```

#### Protected Methods

```python
CSRF_PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
```

Only state-changing methods require CSRF validation. Safe methods (GET, HEAD, OPTIONS) are exempt.

#### Exempt Paths

```python
CSRF_EXEMPT_PATHS = {
    "/health",
    "/healthz",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/token",
    "/api/webhooks/",
}
```

Certain endpoints are exempt from CSRF protection:
- Health checks: Don't need protection
- Documentation: Read-only
- Authentication: Initial login (before token exists)
- Webhooks: Use HMAC signatures for authentication

### Token Rotation

Tokens are automatically rotated on authentication events:

```python
async def _rotate_csrf_token(self, request: Request, response: Response):
    """Rotate CSRF token on authentication"""
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=28800,  # 8 hours
        httponly=False,
        secure=True,  # Production only
        samesite="strict",
        path="/",
    )
```

Rotation occurs after:
- `/api/auth/login` - User login
- `/api/auth/callback` - OAuth callback

## Frontend Implementation

### Initialization

The frontend API client automatically initializes CSRF protection:

```typescript
import { api } from './lib/api';

// Initialize on app load (in root component or provider)
useEffect(() => {
  api.initializeCSRF();
}, []);
```

### API Client Integration

The API client (`frontend/lib/api.ts`) automatically includes CSRF tokens:

```typescript
class ApiClient {
  async initializeCSRF(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrf_token;
      sessionStorage.setItem('csrf_token', csrfToken);
    }
  }

  private addCSRFHeader(headers: HeadersInit, method: string): HeadersInit {
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (protectedMethods.includes(method.toUpperCase())) {
      const token = this.getCSRFToken();
      if (token) {
        return {
          ...headers,
          'X-CSRF-Token': token,
        };
      }
    }

    return headers;
  }
}
```

### Usage in Components

CSRF protection is transparent to component code:

```typescript
// Create incident (POST)
const incident = await api.post('/api/incidents', {
  title: 'Emergency Response',
  priority: 'critical',
});

// Update incident (PUT)
await api.put(`/api/incidents/${incident.id}`, {
  status: 'in_progress',
});

// Delete incident (DELETE)
await api.delete(`/api/incidents/${incident.id}`);
```

The API client automatically:
1. Initializes CSRF token on first use
2. Includes token in header for state-changing requests
3. Sends cookies with requests (`credentials: 'include'`)
4. Refreshes token on authentication

### Token Refresh

Manually refresh token when needed:

```typescript
import { api } from './lib/api';

// After login
await api.refreshCSRFToken();

// Or use hook
import { useCSRFRefresh } from './lib/use-csrf';

function LoginComponent() {
  const refreshCSRF = useCSRFRefresh();

  const handleLogin = async () => {
    // ... login logic ...
    await refreshCSRF();
  };
}
```

## Testing

### Backend Tests

Run backend CSRF tests:

```bash
cd services/api
pytest tests/unit/test_csrf_middleware.py -v
```

Test coverage includes:
- Token generation and validation
- Origin/Referer header validation
- Exempt path logic
- Protected method validation
- Token rotation on authentication
- Security scenarios (timing attacks, cross-origin attempts)

### Frontend Tests

Run frontend CSRF tests:

```bash
cd frontend
npm run test csrf-protection.test.ts
```

Test coverage includes:
- Token initialization
- Token inclusion in requests
- Token refresh
- Error handling
- Integration scenarios

### Manual Testing

1. **Test Token Initialization**
```bash
curl -v http://localhost:8000/csrf-token
# Should receive:
# - 200 OK
# - JSON with csrf_token
# - Set-Cookie header
```

2. **Test Protected Endpoint Without Token**
```bash
curl -X POST http://localhost:8000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"title": "Test"}'
# Should receive:
# - 403 Forbidden
# - "Missing CSRF token" error
```

3. **Test Protected Endpoint With Token**
```bash
# First, get token
TOKEN=$(curl -s http://localhost:8000/csrf-token | jq -r '.csrf_token')

# Then, use token
curl -X POST http://localhost:8000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -H "X-CSRF-Token: $TOKEN" \
  -b "csrf_token=$TOKEN" \
  -d '{"title": "Test"}'
# Should receive:
# - 200 OK
# - Incident created
```

## Deployment

### Environment Configuration

Set CSRF configuration in environment variables:

```bash
# Production .env
CSRF_SECRET_KEY=<64-character-random-string>
ADDITIONAL_CORS_ORIGINS=https://prod.example.com,https://admin.example.com
MODE=production
```

Generate secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Production Checklist

- [ ] CSRF_SECRET_KEY set in production
- [ ] MODE=production for secure cookies
- [ ] ALLOWED_ORIGINS includes all production domains
- [ ] ADDITIONAL_CORS_ORIGINS configured if needed
- [ ] Frontend initializes CSRF on app load
- [ ] Tests passing in CI/CD pipeline
- [ ] Audit logging enabled for CSRF failures
- [ ] Monitoring alerts configured for CSRF errors

### Azure Deployment

For Azure App Service:

```bash
# Set environment variables
az webapp config appsettings set \
  --name radio-fleet-api \
  --resource-group radio-fleet-rg \
  --settings \
    CSRF_SECRET_KEY=<secret> \
    MODE=production \
    ADDITIONAL_CORS_ORIGINS=https://fleet.capitaltechalliance.com
```

### Kubernetes Deployment

For AKS deployment:

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  MODE: "production"
  ADDITIONAL_CORS_ORIGINS: "https://fleet.capitaltechalliance.com"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
stringData:
  CSRF_SECRET_KEY: "<base64-encoded-secret>"
```

## Troubleshooting

### Common Errors

#### 1. "Missing CSRF token in X-CSRF-Token header"

**Cause**: Frontend not sending token in header

**Solution**:
```typescript
// Ensure API client initialized
await api.initializeCSRF();

// Verify token in request
const response = await api.post('/api/test', data);
```

#### 2. "CSRF token mismatch"

**Cause**: Cookie and header tokens don't match

**Solution**:
- Ensure `credentials: 'include'` in fetch
- Verify cookies enabled in browser
- Check SameSite attribute compatibility
- Clear cookies and reinitialize

#### 3. "Invalid origin. CSRF token validation failed"

**Cause**: Request origin not in allowed list

**Solution**:
```python
# Add origin to backend
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-domain.com",  # Add this
]
```

#### 4. Token Not Refreshing After Login

**Cause**: Token rotation not triggered

**Solution**:
```typescript
// Manually refresh after login
await api.refreshCSRFToken();
```

### Debugging

Enable debug logging:

```python
# Backend
import logging
logging.getLogger('app.middleware.csrf').setLevel(logging.DEBUG)
```

```typescript
// Frontend
// Check browser console for CSRF logs
// Look for: "[API] CSRF token initialized"
```

### Browser DevTools

1. **Check Cookie**
   - Open DevTools → Application → Cookies
   - Verify `csrf_token` cookie exists
   - Check attributes: SameSite=Strict, Secure (in prod)

2. **Check Request Headers**
   - Open DevTools → Network
   - Click POST/PUT/DELETE request
   - Headers tab → Request Headers
   - Verify `X-CSRF-Token` header present

3. **Check Response**
   - If 403 error, check Response tab
   - Error message indicates specific issue

## Security Considerations

### Best Practices

1. **Token Entropy**
   - Use 32 bytes minimum (256 bits)
   - Use cryptographic random number generator
   - Never use predictable tokens

2. **Constant-Time Comparison**
   - Always use `hmac.compare_digest()`
   - Prevents timing attacks
   - Never use `==` for token comparison

3. **Origin Validation**
   - Whitelist approach only
   - No wildcard origins
   - Validate both Origin and Referer

4. **Secure Cookies**
   - HttpOnly=false (needed for JS access)
   - Secure=true in production (HTTPS only)
   - SameSite=Strict (maximum protection)

5. **Token Rotation**
   - Rotate on authentication events
   - Rotate on privilege escalation
   - Consider rotation on each request (high security)

### Known Limitations

1. **Subdomain Cookies**
   - SameSite=Strict may block legitimate subdomain requests
   - Use SameSite=Lax if needed for subdomains
   - Ensure subdomains in ALLOWED_ORIGINS

2. **Mobile Apps**
   - Mobile apps may not support cookies
   - Consider OAuth tokens for mobile
   - Or use custom header-only validation

3. **API-Only Clients**
   - Command-line tools can't use cookies
   - Provide API key authentication alternative
   - Document in API docs

### Compliance

CSRF protection addresses:

- **OWASP Top 10**: A01:2021 - Broken Access Control
- **NIST 800-53**: SC-23 Session Authenticity
- **FedRAMP**: CM-6 Configuration Settings
- **PCI DSS**: 6.5.9 Cross-Site Request Forgery
- **SOC 2**: CC6.1 Logical and Physical Access Controls

### References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [NIST SP 800-53 Rev 5](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-03
**Maintained By**: Capital Technology Security Team
