# Fleet Authentication System

Complete documentation for the Fleet Management Platform authentication and security framework.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication Methods](#authentication-methods)
- [Token Management](#token-management)
- [Session Management](#session-management)
- [Security Features](#security-features)
- [Usage Guide](#usage-guide)
- [Testing](#testing)

## Overview

Fleet implements enterprise-grade authentication with the following security features:

- **FedRAMP-compliant** authentication framework
- **Multi-factor authentication (MFA)** support
- **Azure AD/Microsoft SSO** integration
- **JWT-based** authentication with httpOnly cookies
- **Automatic token refresh** with 30-minute idle timeout
- **Session management** with activity tracking
- **RBAC integration** (see [RBAC.md](./RBAC.md))
- **Multi-tenant isolation** (see [MULTI_TENANCY.md](./MULTI_TENANCY.md))

## Architecture

### Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Login Request
       ▼
┌─────────────────┐
│  Frontend       │──────────────────┐
│  (React)        │                  │
└────────┬────────┘                  │
         │                           │
         │ 2. POST /api/v1/auth/login│
         ▼                           │
┌──────────────────┐                 │
│  Backend API     │                 │
│  (Express)       │                 │
└────────┬─────────┘                 │
         │                           │
         │ 3. Validate Credentials   │
         ▼                           │
┌──────────────────┐                 │
│  Database        │                 │
│  (PostgreSQL)    │                 │
└────────┬─────────┘                 │
         │                           │
         │ 4. Generate JWT Token     │
         ▼                           │
┌──────────────────┐                 │
│  Set httpOnly    │                 │
│  Cookie          │◄────────────────┘
└────────┬─────────┘
         │
         │ 5. Return User Profile
         ▼
┌─────────────────┐
│  User Session   │
│  Established    │
└─────────────────┘
```

### Components

#### Frontend

**Location:** `/src/contexts/AuthContext.tsx`

- `AuthProvider` - Root authentication provider
- `useAuth()` - Authentication hook for components
- Token refresh mechanism
- Session timeout handling

**Location:** `/src/lib/auth/token-refresh.ts`

- `TokenRefreshManager` - Handles automatic token refresh
- Activity tracking
- Idle timeout detection

**Location:** `/src/components/auth/ProtectedRoute.tsx`

- `ProtectedRoute` - Route-level authentication guard
- Role-based route protection
- Access denied handling

#### Backend

**Location:** `/api/src/middleware/auth.ts`

- JWT validation
- Token extraction from httpOnly cookies
- User authentication middleware

**Location:** `/api/src/middleware/tenant-context.ts`

- Tenant context injection
- Row-Level Security (RLS) setup
- Multi-tenant isolation

## Authentication Methods

### 1. Email/Password Authentication

Standard username/password authentication with secure password hashing.

**Endpoint:** `POST /api/v1/auth/login`

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
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Admin",
    "tenantId": "tenant-uuid",
    "permissions": ["vehicles:*", "drivers:read"]
  }
}
```

**Security Features:**
- Password hashing with bcrypt (cost factor: 12)
- Rate limiting: 5 attempts per 15 minutes
- Account lockout after 5 failed attempts
- Password complexity requirements (see [Password Policy](#password-policy))

### 2. Azure AD / Microsoft SSO

Enterprise SSO integration with Microsoft Azure AD.

**Configuration:**

Environment variables:
```bash
VITE_AZURE_AD_CLIENT_ID=your-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id
VITE_AZURE_AD_REDIRECT_URI=https://yourapp.com/auth/callback
```

**Flow:**

1. User clicks "Sign in with Microsoft"
2. Redirected to Microsoft login page
3. User authenticates with Microsoft
4. Microsoft redirects back with authorization code
5. Backend exchanges code for user profile
6. JWT token issued and session created

**Usage:**

```typescript
import { signInWithMicrosoft } from '@/lib/microsoft-auth';

// In your login component
<Button onClick={() => signInWithMicrosoft()}>
  Sign in with Microsoft
</Button>
```

### 3. Multi-Factor Authentication (MFA)

Optional MFA for enhanced security.

**Supported Methods:**
- **TOTP** (Time-based One-Time Password) - Google Authenticator, Authy
- **SMS** - Text message verification codes
- **Email** - Email verification codes
- **Hardware Keys** - FIDO2/WebAuthn support

**Enabling MFA:**

```typescript
import { MFAService } from '@/lib/security/auth';

// Generate TOTP secret
const { secret, qrCode } = await MFAService.generateTOTPSecret();

// Display QR code to user
// User scans with authenticator app

// Verify TOTP token
const isValid = await MFAService.verifyTOTP(secret, userToken);
```

## Token Management

### JWT Token Structure

Fleet uses **httpOnly cookies** to store JWT tokens, preventing XSS attacks.

**Token Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "Admin",
  "tenantId": "tenant-uuid",
  "permissions": ["vehicles:*"],
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Token Expiration:**
- **Access Token:** 30 minutes
- **Refresh Token:** 7 days

### Automatic Token Refresh

The `TokenRefreshManager` automatically refreshes tokens before expiration.

**Configuration:**

```typescript
import { initializeTokenRefresh } from '@/lib/auth/token-refresh';

// Initialize on login
initializeTokenRefresh({
  refreshInterval: 25 * 60 * 1000, // 25 minutes
  idleTimeout: 30 * 60 * 1000, // 30 minutes
  gracePeriod: 5 * 60 * 1000, // 5 minutes
  onRefresh: (success) => {
    if (!success) {
      // Handle refresh failure
      logout();
    }
  },
  onExpire: () => {
    // Handle session expiry
    window.location.href = '/login?reason=session_expired';
  }
});
```

**Activity Tracking:**

The refresh manager tracks user activity and prevents refresh during idle periods:

- Mouse movements
- Keyboard input
- Scrolling
- Touch events
- Click events

### Session Timeout

**30-Minute Idle Timeout:**

If the user is inactive for 30 minutes, the session expires and the user is logged out.

**Grace Period:**

A 5-minute grace period allows the user to resume activity before forced logout.

**Manual Refresh:**

```typescript
import { getTokenRefreshManager } from '@/lib/auth/token-refresh';

const refreshManager = getTokenRefreshManager();
await refreshManager.refresh();
```

## Session Management

### Session Storage

Sessions are stored in **sessionStorage** (not localStorage) for enhanced security:

- Cleared on browser/tab close
- Not accessible across tabs
- Reduced XSS attack window

**Session Data:**

```typescript
interface SecurityContext {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}
```

### Session Validation

```typescript
import { SessionManager } from '@/lib/security/auth';

// Validate session
const session = await SessionManager.validateSession(sessionId);

if (!session) {
  // Session invalid or expired
  logout();
}

// Refresh session
await SessionManager.refreshSession(sessionId);
```

## Security Features

### Password Policy

**Requirements:**
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Cannot reuse last 24 passwords
- Expires after 90 days

**Validation:**

```typescript
import { PasswordPolicy } from '@/lib/security/auth';

const result = PasswordPolicy.validate(password);

if (!result.valid) {
  console.log(result.errors);
  // ["Password must be at least 12 characters", ...]
}
```

### CSRF Protection

**Token-Based CSRF Protection:**

All state-changing requests require a CSRF token.

**Backend Implementation:**
```javascript
// api/src/middleware/csrf.ts
import { doubleCsrf } from 'csrf-csrf';

const { generateToken, validateRequest } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});
```

**Frontend Integration:**
```typescript
// Automatically handled by use-api.ts
import { refreshCsrfToken } from '@/hooks/use-api';

// Fetch CSRF token after login
await refreshCsrfToken();

// All mutations include CSRF token automatically
```

### Security Headers

**Helmet Middleware:**

```javascript
// api/src/middleware/security.ts
import helmet from 'helmet';

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: {
    action: 'deny',
  },
}));
```

### Rate Limiting

**Login Endpoint:**
- 5 attempts per 15 minutes per IP
- Progressive delays after failed attempts

**API Endpoints:**
- 100 requests per 15 minutes per user
- 1000 requests per hour per tenant

## Usage Guide

### Login Component

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const { login, loginWithMicrosoft, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect handled by AuthContext
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      <button type="button" onClick={loginWithMicrosoft}>
        Sign in with Microsoft
      </button>
    </form>
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Route, Routes } from 'react-router-dom';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireRole="Admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehicles/delete"
        element={
          <ProtectedRoute requirePermission="vehicles:delete">
            <DeleteVehicle />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Using Auth State

```typescript
import { useAuth } from '@/contexts/AuthContext';

function ProfileComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>Welcome, {user.firstName} {user.lastName}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Testing

### Authentication Tests

```bash
# Run authentication tests
npm run test tests/security/auth.spec.ts

# Run in headed mode to see browser
npm run test:headed tests/security/auth.spec.ts
```

### Test Coverage

- ✅ Email/password login
- ✅ Microsoft SSO login
- ✅ Token refresh mechanism
- ✅ Session timeout handling
- ✅ MFA flow
- ✅ Logout and session cleanup
- ✅ Protected route access
- ✅ CSRF protection
- ✅ Rate limiting

### Manual Testing

**Login:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.test","password":"Admin123!"}'
```

**Verify Session:**
```bash
curl -X GET http://localhost:3001/api/v1/auth/verify \
  --cookie "auth_token=<token>"
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  --cookie "auth_token=<token>"
```

**Logout:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  --cookie "auth_token=<token>"
```

## Security Compliance

- ✅ **FedRAMP Moderate** controls implemented
- ✅ **SOC 2 Type II** compliant
- ✅ **OWASP Top 10** mitigations
- ✅ **NIST 800-53** security controls
- ✅ **GDPR** data protection
- ✅ **HIPAA** encryption standards

## Related Documentation

- [RBAC.md](./RBAC.md) - Role-Based Access Control
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) - Multi-Tenant Architecture
- [SECURITY.md](./SECURITY.md) - Security Best Practices

## Support

For authentication issues or questions:

- Review the error logs in browser console
- Check server logs: `docker logs fleet-api`
- Contact: support@fleet.example.com
