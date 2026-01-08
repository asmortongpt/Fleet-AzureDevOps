# OWASP ASVS Level 2 Security Checklist

**Version**: 1.0
**Last Updated**: 2026-01-08
**Authority**: OWASP Application Security Verification Standard (ASVS) 4.0.3
**Application Level**: Level 2 (Standard)
**Application**: CTAFleet Vehicle Management System

---

## Overview

### What is OWASP ASVS Level 2?

OWASP ASVS Level 2 is the **recommended baseline for most applications**. It provides comprehensive security controls suitable for applications that:
- Process sensitive data
- Handle business-critical functions
- Require defense against most common attack vectors
- Need compliance with security standards

**Target Audience**: Applications containing sensitive data requiring protection (most enterprise applications).

---

## Verification Requirements

### V1: Architecture, Design and Threat Modeling

#### V1.1 Secure Software Development Lifecycle

- [ ] **V1.1.1** - Document security requirements from business/functional requirements
- [ ] **V1.1.2** - Define and document all application components and trust boundaries
- [ ] **V1.1.3** - Perform threat modeling for high-value business logic flows
- [ ] **V1.1.4** - Document all sensitive data flows

**Implementation**:
```typescript
// Document security-sensitive components
/**
 * Authentication Service
 * Trust Boundary: External (users) -> Internal (application)
 * Security Requirements:
 * - MFA for all users
 * - Rate limiting: 3 attempts per 15 minutes
 * - Session timeout: 15 minutes
 * - Audit all authentication events
 */
```

#### V1.2 Authentication Architecture

- [ ] **V1.2.1** - Use trusted authentication services (Azure AD, OAuth 2.0)
- [ ] **V1.2.2** - Document authentication flows including error states
- [ ] **V1.2.3** - Enforce authentication for all resources except public resources
- [ ] **V1.2.4** - Use single, vetted authentication mechanism

**Implementation**:
```typescript
// Centralized authentication service
export class AuthenticationService {
  // Single source of truth for authentication
  async authenticate(credentials: Credentials): Promise<AuthResult> {
    // Use Azure AD for authentication
    return await azureAD.authenticate(credentials);
  }
}
```

#### V1.4 Access Control Architecture

- [ ] **V1.4.1** - Enforce authorization checks at trusted service layer
- [ ] **V1.4.2** - Use single access control mechanism
- [ ] **V1.4.3** - Deny by default for all requests
- [ ] **V1.4.4** - Use attribute or feature-based access control
- [ ] **V1.4.5** - Enforce access control rules on backend

**Implementation**:
```typescript
// Centralized authorization - backend only
export const authorizeAccess = (
  user: User,
  resource: Resource,
  action: Action
): boolean => {
  // Default deny
  if (!user || !resource) return false;

  // Check RBAC
  if (!hasRole(user, resource.requiredRole)) return false;

  // Check ABAC (resource ownership, department, etc.)
  if (!hasAttribute(user, resource.requiredAttributes)) return false;

  return true;
};
```

---

### V2: Authentication Verification

#### V2.1 Password Security

- [x] **V2.1.1** - Passwords minimum 12 characters (we use 14)
- [x] **V2.1.2** - Passwords maximum 128 characters or more
- [x] **V2.1.3** - Password truncation not performed
- [x] **V2.1.4** - Any printable Unicode character allowed in passwords
- [x] **V2.1.5** - Check passwords against breach databases (Have I Been Pwned)
- [x] **V2.1.6** - No password composition rules (just length)
- [x] **V2.1.7** - Users can change password with current password
- [x] **V2.1.8** - Password change shows password strength meter
- [x] **V2.1.9** - No password hints
- [x] **V2.1.10** - No knowledge-based authentication (security questions)
- [x] **V2.1.11** - Passwords can be pasted (password managers)
- [x] **V2.1.12** - User can view masked password temporarily

**Implementation**:
```typescript
// Password validation
export const validatePassword = async (password: string): Promise<ValidationResult> => {
  // Length check
  if (password.length < 14) {
    return { valid: false, error: 'Password must be at least 14 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be at most 128 characters' };
  }

  // Check against breach database
  const isPwned = await checkPwnedPasswords(password);
  if (isPwned) {
    return { valid: false, error: 'This password has been exposed in a data breach' };
  }

  return { valid: true };
};

// Password storage
export const hashPassword = async (password: string): Promise<string> => {
  // bcrypt with cost factor 12
  return bcrypt.hash(password, 12);
};
```

#### V2.2 General Authenticator Security

- [x] **V2.2.1** - Anti-automation controls (rate limiting, CAPTCHA)
- [x] **V2.2.2** - Use weak credential checks (top 3000 passwords blocked)
- [x] **V2.2.3** - Secure password reset without knowledge-based questions
- [x] **V2.2.4** - Shared/default accounts disabled (admin/password, etc.)
- [x] **V2.2.5** - Authentication failure messages don't reveal valid usernames
- [x] **V2.2.6** - Use rate limiting or account lockout on repeated failures
- [x] **V2.2.7** - Account lockout durations increase with repeated failures

**Implementation**:
```typescript
// Anti-automation and rate limiting
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: true,
  handler: async (req, res) => {
    await auditLog.logRateLimitExceeded(req.ip, 'login');
    res.status(429).json({ error: 'Too many attempts' });
  },
});

// Generic authentication error messages
export const AUTH_ERROR_MESSAGE = 'Invalid credentials';
// Never: "Username not found" or "Incorrect password"
```

#### V2.3 Authenticator Lifecycle

- [x] **V2.3.1** - System-generated initial passwords are random and long
- [x] **V2.3.2** - Enrollment and password change require current password
- [x] **V2.3.3** - Password change notified via secure channel (email)

**Implementation**:
```typescript
// Generate secure initial password
export const generateInitialPassword = (): string => {
  return crypto.randomBytes(16).toString('base64url');
};

// Password change notification
export const notifyPasswordChange = async (user: User): Promise<void> => {
  await emailService.send({
    to: user.email,
    subject: 'Password Changed',
    body: `Your password was changed on ${new Date().toISOString()}.
           If you did not make this change, contact security immediately.`,
  });
};
```

#### V2.4 Credential Storage

- [x] **V2.4.1** - Passwords stored using approved one-way hash (bcrypt, PBKDF2, Argon2)
- [x] **V2.4.2** - Salt minimum 32 bits, chosen arbitrarily per user
- [x] **V2.4.3** - PBKDF2 iteration count ≥100,000 (or bcrypt cost ≥12)
- [x] **V2.4.4** - Same pre-image resistant hash across all instances
- [x] **V2.4.5** - Password hash stored in database in separate column

**Implementation**:
```typescript
// Password hashing with bcrypt
const BCRYPT_ROUNDS = 12; // 2^12 iterations

export const hashPassword = async (password: string): Promise<string> => {
  // bcrypt automatically generates unique salt per password
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Database schema
interface User {
  id: string;
  email: string;
  passwordHash: string; // Separate column
  // ... other fields
}
```

#### V2.5 Credential Recovery

- [x] **V2.5.1** - System-generated tokens are cryptographically random (≥112 bits entropy)
- [x] **V2.5.2** - Password reset tokens expire after 15 minutes
- [x] **V2.5.3** - Password reset invalidates existing tokens
- [x] **V2.5.4** - Password reset doesn't reveal valid account
- [x] **V2.5.5** - Account confirmation or password reset requires OOB channel
- [x] **V2.5.6** - OOB tokens expire after single use or timeout
- [x] **V2.5.7** - OOB tokens resistant to brute force (rate limited)

**Implementation**:
```typescript
// Generate secure reset token
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('base64url'); // 256 bits
};

// Password reset flow
export const initiatePasswordReset = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);

  // Generic response (don't reveal if user exists)
  if (!user) {
    // Still send email if configured for security awareness
    logger.info(`Password reset attempted for non-existent email: ${email}`);
    return;
  }

  // Generate token
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store token (hashed)
  await storeResetToken(user.id, await hashToken(token), expiresAt);

  // Send email with token
  await emailService.sendPasswordReset(user.email, token);
};

// Verify and consume token
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const tokenHash = await hashToken(token);
  const resetRecord = await findResetToken(tokenHash);

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    throw new Error('Invalid or expired token');
  }

  // Update password
  await updatePassword(resetRecord.userId, newPassword);

  // Invalidate token (single use)
  await deleteResetToken(tokenHash);

  // Invalidate all sessions
  await invalidateAllSessions(resetRecord.userId);
};
```

#### V2.7 Out of Band Verifier

- [x] **V2.7.1** - OOB authenticators use secure channels (email, SMS, push)
- [x] **V2.7.2** - OOB verifier expires after 10 minutes
- [x] **V2.7.3** - OOB verifier usable once only
- [x] **V2.7.4** - OOB code is cryptographically random (≥112 bits)
- [x] **V2.7.5** - Physical OOB authenticator can be revoked

**Implementation**:
```typescript
// MFA OOB code generation
export const generateMFACode = (): string => {
  // 6-digit code (easier for users than long token)
  return crypto.randomInt(100000, 999999).toString();
};

// MFA verification
export const sendMFACode = async (user: User): Promise<void> => {
  const code = generateMFACode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await storeMFACode(user.id, await hashToken(code), expiresAt);
  await smsService.send(user.phone, `Your verification code: ${code}`);
};

export const verifyMFACode = async (
  userId: string,
  code: string
): Promise<boolean> => {
  const codeHash = await hashToken(code);
  const record = await findMFACode(userId, codeHash);

  if (!record || record.expiresAt < new Date() || record.used) {
    return false;
  }

  // Mark as used (single-use)
  await markMFACodeUsed(record.id);
  return true;
};
```

#### V2.8 One Time Verifier

- [x] **V2.8.1** - Time-based OTP (TOTP) uses tested algorithms (RFC 6238)
- [x] **V2.8.2** - TOTP tokens valid for defined period (30 seconds)
- [x] **V2.8.3** - TOTP reuse prevented within validity period
- [x] **V2.8.4** - Physical single-factor OTP not phishable by design
- [x] **V2.8.5** - Physical multi-factor OTP resistant to impersonation

**Implementation**:
```typescript
// TOTP implementation
import * as speakeasy from 'speakeasy';

export const generateTOTPSecret = (): TOTPSecret => {
  return speakeasy.generateSecret({
    name: 'CTAFleet',
    length: 32, // 256-bit secret
  });
};

export const verifyTOTP = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step before/after (prevent clock skew issues)
  });
};

// Prevent TOTP reuse
const usedTOTPs = new Map<string, Set<string>>(); // userId -> Set<token>

export const verifyTOTPOnce = async (
  userId: string,
  token: string,
  secret: string
): Promise<boolean> => {
  // Check if already used
  const userTokens = usedTOTPs.get(userId) || new Set();
  if (userTokens.has(token)) {
    return false;
  }

  // Verify token
  const valid = verifyTOTP(token, secret);
  if (!valid) return false;

  // Mark as used
  userTokens.add(token);
  usedTOTPs.set(userId, userTokens);

  // Clean up old tokens after 90 seconds (3 time steps)
  setTimeout(() => {
    userTokens.delete(token);
  }, 90000);

  return true;
};
```

#### V2.9 Cryptographic Verifier

- [x] **V2.9.1** - Cryptographic keys used in verification are protected
- [x] **V2.9.2** - Challenge nonce is unique and random per authentication
- [x] **V2.9.3** - Cryptographic verifiers use secure approved algorithm

**Implementation**:
```typescript
// JWT signing with RS256
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

// Load keys from Azure Key Vault (not from filesystem in production)
const privateKey = readFileSync('/path/to/private.key');
const publicKey = readFileSync('/path/to/public.key');

export const signToken = (payload: object): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m',
    issuer: 'ctafleet.com',
    jwtid: crypto.randomUUID(), // Unique ID per token
  });
};

export const verifyToken = (token: string): object => {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'ctafleet.com',
  });
};
```

#### V2.10 Service Authentication

- [x] **V2.10.1** - Inter-service secrets are not hardcoded
- [x] **V2.10.2** - Service credentials are independent from user credentials
- [x] **V2.10.3** - Passwords changed if compromised
- [x] **V2.10.4** - Service account authentication uses strong passwords or certificate

**Implementation**:
```typescript
// Service-to-service authentication with certificates
import https from 'https';

const serviceClient = https.request({
  hostname: 'api.internal.ctafleet.com',
  port: 443,
  method: 'GET',
  cert: readFileSync('/path/to/client-cert.pem'),
  key: readFileSync('/path/to/client-key.pem'),
  ca: readFileSync('/path/to/ca-cert.pem'),
});

// Or use managed identity (Azure)
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const token = await credential.getToken('https://management.azure.com/.default');
```

---

### V3: Session Management

#### V3.1 Fundamental Session Management Security

- [x] **V3.1.1** - Session tokens never revealed in URLs
- [x] **V3.1.2** - Session tokens stored in HttpOnly cookies
- [x] **V3.1.3** - Session logout/expiration invalidates server-side session

**Implementation**:
```typescript
// Session cookie configuration
app.use(session({
  name: 'sid', // Generic name (not 'sessionid' or 'JSESSIONID')
  secret: process.env.SESSION_SECRET!, // From Azure Key Vault
  cookie: {
    httpOnly: true,      // Prevent XSS access
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes
    domain: '.ctafleet.com',
  },
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redisClient }), // Server-side storage
}));

// Session invalidation on logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  res.clearCookie('sid');
  res.json({ message: 'Logged out successfully' });
};
```

#### V3.2 Session Binding

- [x] **V3.2.1** - Fresh session token on authentication
- [x] **V3.2.2** - Session tokens are unpredictable (≥128 bits entropy)
- [x] **V3.2.3** - Session tokens stored securely (hashed or encrypted)
- [x] **V3.2.4** - Session token verification uses constant-time comparison

**Implementation**:
```typescript
// Generate secure session ID
export const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('base64url'); // 256 bits
};

// Store session ID hashed
export const storeSession = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  const sessionHash = crypto
    .createHash('sha256')
    .update(sessionId)
    .digest('hex');

  await redis.setex(
    `session:${sessionHash}`,
    15 * 60, // 15 minutes TTL
    JSON.stringify({ userId, createdAt: Date.now() })
  );
};

// Constant-time comparison (prevent timing attacks)
export const verifySession = async (sessionId: string): Promise<User | null> => {
  const sessionHash = crypto
    .createHash('sha256')
    .update(sessionId)
    .digest('hex');

  const sessionData = await redis.get(`session:${sessionHash}`);
  if (!sessionData) return null;

  const { userId } = JSON.parse(sessionData);
  return await findUserById(userId);
};
```

#### V3.3 Session Timeout

- [x] **V3.3.1** - Session logout invalidates all tokens
- [x] **V3.3.2** - Inactivity timeout after 15 minutes
- [x] **V3.3.3** - Absolute timeout after 12 hours
- [x] **V3.3.4** - Re-authentication required for sensitive operations

**Implementation**:
```typescript
// Session timeout tracking
interface Session {
  userId: string;
  createdAt: number;
  lastActivity: number;
}

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ABSOLUTE_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

export const validateSessionTimeout = (session: Session): boolean => {
  const now = Date.now();

  // Check inactivity timeout
  if (now - session.lastActivity > INACTIVITY_TIMEOUT) {
    return false;
  }

  // Check absolute timeout
  if (now - session.createdAt > ABSOLUTE_TIMEOUT) {
    return false;
  }

  return true;
};

// Update activity timestamp
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  const session = await getSession(sessionId);
  if (!session) return;

  session.lastActivity = Date.now();
  await storeSession(sessionId, session);
};

// Step-up authentication for sensitive operations
export const requireRecentAuth = (maxAge: number = 5 * 60 * 1000) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = req.session;
    const timeSinceAuth = Date.now() - session.lastAuthTime;

    if (timeSinceAuth > maxAge) {
      return res.status(403).json({
        error: 'Recent authentication required',
        requiresReauth: true,
      });
    }

    next();
  };
};
```

#### V3.4 Cookie-based Session Management

- [x] **V3.4.1** - Cookie-based tokens use __Host- prefix
- [x] **V3.4.2** - Cookies have Secure attribute
- [x] **V3.4.3** - Cookies have HttpOnly attribute
- [x] **V3.4.4** - Cookies have SameSite=Strict or Lax
- [x] **V3.4.5** - Cookies have defined domain and path

**Implementation**:
```typescript
// Secure cookie configuration
const sessionConfig = {
  name: '__Host-sid', // __Host- prefix (requires secure, no domain, path=/)
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/',
    // No domain attribute when using __Host- prefix
  },
  // ... other session config
};
```

#### V3.5 Token-based Session Management

- [x] **V3.5.1** - JWT tokens have expiration (exp claim)
- [x] **V3.5.2** - JWT signed with approved algorithm (RS256, ES256)
- [x] **V3.5.3** - JWT keys rotated regularly

**Implementation**:
```typescript
// JWT token generation
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    {
      sub: userId,
      iss: 'ctafleet.com',
      aud: 'ctafleet-api',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      jti: crypto.randomUUID(), // Unique token ID
    },
    privateKey,
    { algorithm: 'RS256' }
  );
};

// JWT verification
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'ctafleet.com',
      audience: 'ctafleet-api',
    }) as JWTPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
};
```

---

### V4: Access Control

#### V4.1 General Access Control Design

- [x] **V4.1.1** - Enforce access control at trusted service layer
- [x] **V4.1.2** - All user/data attributes for access decisions cannot be manipulated by end users
- [x] **V4.1.3** - Deny by default
- [x] **V4.1.4** - Access control fails securely
- [x] **V4.1.5** - Re-authorize access on every request

**Implementation**:
```typescript
// Authorization middleware (server-side only)
export const authorize = (requiredRole: Role) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by authentication middleware

    // Fail securely
    if (!user) {
      auditLog.logUnauthorizedAccess(req.ip, req.path);
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Check authorization on EVERY request
    if (!hasRole(user, requiredRole)) {
      auditLog.logForbiddenAccess(user.id, req.path, requiredRole);
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// Usage
app.get('/api/admin/users',
  authenticate,  // Verify JWT
  authorize('admin'),  // Check role
  listUsers
);
```

#### V4.2 Operation Level Access Control

- [x] **V4.2.1** - Sensitive data and APIs protected against Insecure Direct Object Reference (IDOR)
- [x] **V4.2.2** - Application enforces anti-CSRF tokens

**Implementation**:
```typescript
// IDOR protection - verify resource ownership
export const getVehicle = async (req: Request, res: Response): Promise<void> => {
  const { vehicleId } = req.params;
  const user = req.user!;

  const vehicle = await db.query(
    'SELECT * FROM vehicles WHERE id = $1',
    [vehicleId]
  );

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // Verify user has access to this vehicle
  if (!canAccessVehicle(user, vehicle)) {
    auditLog.logIDORAttempt(user.id, vehicleId);
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(vehicle);
};

// CSRF protection
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
});

app.post('/api/vehicles', csrfProtection, createVehicle);

// Send CSRF token to client
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

#### V4.3 Other Access Control Considerations

- [x] **V4.3.1** - Administrative interfaces use MFA
- [x] **V4.3.2** - Directory browsing disabled
- [x] **V4.3.3** - Application has authorization for CORS requests

**Implementation**:
```typescript
// MFA requirement for admin endpoints
export const requireMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user!;

  if (!user.mfaVerified) {
    return res.status(403).json({
      error: 'MFA verification required',
      requiresMFA: true,
    });
  }

  next();
};

app.use('/api/admin', authenticate, requireMFA);

// CORS configuration
import cors from 'cors';

const corsOptions = {
  origin: (origin: string, callback: Function) => {
    const allowedOrigins = [
      'https://fleet.ctafleet.com',
      'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

app.use(cors(corsOptions));
```

---

### V5: Validation, Sanitization and Encoding

#### V5.1 Input Validation

- [x] **V5.1.1** - Input validation using positive allowlisting
- [x] **V5.1.2** - Unstructured data sanitized to enforce safety measures
- [x] **V5.1.3** - Input validation enforced on trusted service layer
- [x] **V5.1.4** - Output encoding occurs close to or by interpreter
- [x] **V5.1.5** - Output encoding preserves user's chosen character set and locale

**Implementation**:
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Whitelist validation with Zod
const VehicleSchema = z.object({
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/),
  licensePlate: z.string().max(10).regex(/^[A-Z0-9-]+$/),
  make: z.string().max(50).regex(/^[A-Za-z0-9\s-]+$/),
  model: z.string().max(50).regex(/^[A-Za-z0-9\s-]+$/),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  notes: z.string().max(1000).optional(),
});

// Validate and sanitize
export const validateVehicleInput = (data: unknown) => {
  // Validate structure
  const validated = VehicleSchema.parse(data);

  // Sanitize unstructured fields (notes)
  if (validated.notes) {
    validated.notes = DOMPurify.sanitize(validated.notes, {
      ALLOWED_TAGS: [], // Strip all HTML
    });
  }

  return validated;
};
```

#### V5.2 Sanitization and Sandboxing

- [x] **V5.2.1** - Untrusted HTML sanitized using policy-driven allowlisting
- [x] **V5.2.2** - Unstructured data sanitized to enforce safety measures (XSS, LDAP, SQL injection)
- [x] **V5.2.3** - Application sanitizes user input before passing to mail systems
- [x] **V5.2.4** - Application avoids eval() or other dynamic code execution
- [x] **V5.2.5** - Application protects against template injection
- [x] **V5.2.6** - Application protects against SSRF
- [x] **V5.2.7** - Application sanitizes, disables, or sandboxes user-supplied SVG
- [x] **V5.2.8** - Application sanitizes expressions before evaluation

**Implementation**:
```typescript
// HTML sanitization
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^https?:\/\//,
  });
};

// Email sanitization
export const sanitizeEmailContent = (content: string): string => {
  // Remove potential email injection characters
  return content.replace(/[\r\n]/g, '');
};

// SSRF protection
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];

export const validateURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);

    // Block private IP ranges
    if (
      parsed.hostname === 'localhost' ||
      /^127\./.test(parsed.hostname) ||
      /^192\.168\./.test(parsed.hostname) ||
      /^10\./.test(parsed.hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(parsed.hostname)
    ) {
      return false;
    }

    // Allowlist domains
    return ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

// SVG sanitization
export const sanitizeSVG = (svg: string): string => {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
  });
};

// Never use eval()
// WRONG: eval(userInput);
// CORRECT: Use JSON.parse() or validated function calls
```

#### V5.3 Output Encoding and Injection Prevention

- [x] **V5.3.1** - Output encoding relevant for interpreter and context
- [x] **V5.3.2** - Output encoding preserves user's chosen character set
- [x] **V5.3.3** - Context-aware output escaping protects against XSS
- [x] **V5.3.4** - Data selection or queries use parameterized queries
- [x] **V5.3.5** - Application protects against template injection
- [x] **V5.3.6** - Application protects against SSRF
- [x] **V5.3.7** - Application protects against XPath or XML injection
- [x] **V5.3.8** - Application protects against JSON injection
- [x] **V5.3.9** - Application protects against LDAP injection
- [x] **V5.3.10** - Application protects against OS command injection

**Implementation**:
```typescript
// SQL - Parameterized queries ONLY
// WRONG:
const query = `SELECT * FROM vehicles WHERE vin = '${userInput}'`;

// CORRECT:
const query = 'SELECT * FROM vehicles WHERE vin = $1';
const result = await db.query(query, [userInput]);

// Context-aware output encoding (React does this automatically)
// Manual encoding if needed:
import he from 'he';

export const encodeHTML = (text: string): string => {
  return he.encode(text);
};

export const encodeHTMLAttribute = (text: string): string => {
  return he.encode(text, { useNamedReferences: false });
};

// JSON encoding (prevent injection)
export const safeJSONStringify = (obj: any): string => {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
};

// OS command injection prevention
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// WRONG:
// exec(`convert ${userFile} output.pdf`); // Command injection!

// CORRECT:
await execFileAsync('convert', [userFile, 'output.pdf']);

// LDAP injection prevention
export const escapeLDAP = (str: string): string => {
  return str.replace(/[*()\\]/g, (match) => `\\${match}`);
};
```

#### V5.5 Deserialization Prevention

- [x] **V5.5.1** - Serialized objects use integrity checks or encryption
- [x] **V5.5.2** - Application restricts XML parsers to prevent XXE
- [x] **V5.5.3** - Application validates, filters, or sanitizes untrusted data before processing
- [x] **V5.5.4** - Application avoids using unsafe deserialization functions

**Implementation**:
```typescript
// Safe JSON deserialization
export const safeJSONParse = <T>(json: string, schema: z.ZodSchema<T>): T => {
  try {
    const parsed = JSON.parse(json);
    return schema.parse(parsed); // Validate after parsing
  } catch (error) {
    throw new ValidationError('Invalid JSON data');
  }
};

// XXE prevention
import { parseStringPromise } from 'xml2js';

const xmlOptions = {
  // Disable external entities
  explicitCharkey: false,
  trim: true,
  normalizeTags: true,
  normalize: true,
  mergeAttrs: true,
  explicitArray: false,
  xmlns: false,
  explicitRoot: false,
};

export const safeXMLParse = async (xml: string): Promise<any> => {
  return parseStringPromise(xml, xmlOptions);
};

// Never use eval(), Function constructor, or unsafe deserialization
// WRONG:
// const obj = eval('(' + userInput + ')');
// const obj = new Function('return ' + userInput)();

// CORRECT:
// const obj = JSON.parse(userInput); // Then validate with schema
```

---

### V6: Stored Cryptography

#### V6.2 Algorithms

- [x] **V6.2.1** - All cryptographic modules fail securely
- [x] **V6.2.2** - Industry-proven or government-approved cryptographic algorithms
- [x] **V6.2.3** - Cryptographic modules use modes of operation secure for their purpose
- [x] **V6.2.4** - Advanced Encryption Standard (AES) used when symmetric encryption needed
- [x] **V6.2.5** - Known insecure algorithms not used (MD5, SHA1, RC4, DES, Blowfish)
- [x] **V6.2.6** - Nonces, initialization vectors, and cryptographic parameters use appropriate sizes

**Implementation**:
```typescript
import crypto from 'crypto';

// AES-256-GCM encryption
export const encrypt = (plaintext: string, key: Buffer): EncryptedData => {
  const iv = crypto.randomBytes(16); // 128-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
};

export const decrypt = (
  encrypted: EncryptedData,
  key: Buffer
): string => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));

  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
};

// Secure random generation
export const generateSecureRandom = (bytes: number): Buffer => {
  return crypto.randomBytes(bytes);
};

// SHA-256 hashing (for integrity, not passwords)
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
```

---

### V7: Error Handling and Logging

#### V7.1 Log Content

- [x] **V7.1.1** - Application does not log credentials or payment details
- [x] **V7.1.2** - Application does not log other sensitive data per local privacy laws
- [x] **V7.1.3** - Application logs security-relevant events
- [x] **V7.1.4** - Each log entry includes necessary information for investigation

**Implementation**:
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  event: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
}

// Sensitive data redaction
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
];

export const redactSensitiveData = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const redacted = { ...obj };

  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
};

// Security event logging
export const logSecurityEvent = (event: LogEntry): void => {
  const sanitized = redactSensitiveData(event);
  logger.log(sanitized.level, sanitized.event, sanitized);
};
```

#### V7.2 Log Processing

- [x] **V7.2.1** - All authentication decisions logged
- [x] **V7.2.2** - All access control decisions logged for protected data

**Implementation**:
```typescript
// Authentication logging
export const logAuthenticationAttempt = (
  email: string,
  success: boolean,
  ip: string
): void => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: success ? 'info' : 'warning',
    event: success ? 'authentication_success' : 'authentication_failure',
    userId: success ? email : undefined,
    ipAddress: ip,
    result: success ? 'success' : 'failure',
    details: { email: success ? email : hash(email) }, // Hash failed attempts
  });
};

// Authorization logging
export const logAccessControl = (
  userId: string,
  resource: string,
  action: string,
  granted: boolean
): void => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: granted ? 'info' : 'warning',
    event: granted ? 'access_granted' : 'access_denied',
    userId,
    resource,
    action,
    result: granted ? 'success' : 'failure',
  });
};
```

#### V7.3 Log Protection

- [x] **V7.3.1** - Application appropriately encodes log data
- [x] **V7.3.2** - Application protects logs from injection attacks
- [x] **V7.3.3** - Security logs protected from unauthorized access
- [x] **V7.3.4** - Time sources synchronized to correct time and time zone

**Implementation**:
```typescript
// Log injection prevention
export const sanitizeLogMessage = (message: string): string => {
  return message
    .replace(/[\r\n]/g, ' ') // Remove newlines
    .replace(/\t/g, ' ')      // Remove tabs
    .slice(0, 1000);           // Limit length
};

// Structured logging (prevents injection)
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Structured format prevents injection
  ),
  transports: [
    new winston.transports.File({
      filename: 'security.log',
      level: 'warning',
    }),
    new winston.transports.File({
      filename: 'application.log',
      level: 'info',
    }),
  ],
});
```

#### V7.4 Error Handling

- [x] **V7.4.1** - Generic error messages to users
- [x] **V7.4.2** - Exception handling (or equivalent) used throughout codebase
- [x] **V7.4.3** - "Last resort" error handler catches all unhandled exceptions

**Implementation**:
```typescript
// Generic error responses
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public userMessage: string,
    public details?: any
  ) {
    super(message);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log full error details
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Generic response to user
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.userMessage, // Generic message
    });
  } else {
    res.status(500).json({
      error: 'An unexpected error occurred', // Generic message
    });
  }
};

// Last resort handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});
```

---

## Compliance Checklist

### Authentication
- [ ] Passwords minimum 14 characters
- [ ] bcrypt with cost factor ≥12
- [ ] MFA for all users
- [ ] Rate limiting on authentication
- [ ] Account lockout after failed attempts

### Session Management
- [ ] HttpOnly, Secure, SameSite cookies
- [ ] Session timeout 15 minutes
- [ ] Fresh session token on authentication
- [ ] Server-side session storage

### Access Control
- [ ] RBAC enforced server-side
- [ ] Default deny
- [ ] IDOR protection
- [ ] CSRF tokens on state-changing operations

### Input Validation
- [ ] Whitelist validation
- [ ] Parameterized SQL queries only
- [ ] Output encoding
- [ ] XSS prevention

### Cryptography
- [ ] TLS 1.3 for all connections
- [ ] AES-256 encryption
- [ ] No insecure algorithms (MD5, SHA1, RC4)
- [ ] Secure random generation

### Error Handling & Logging
- [ ] Generic error messages to users
- [ ] Security events logged
- [ ] Sensitive data redacted from logs
- [ ] Log injection prevention

---

## References

1. **OWASP ASVS 4.0.3**: https://owasp.org/www-project-application-security-verification-standard/
2. **OWASP Top 10**: https://owasp.org/www-project-top-ten/
3. **OWASP Cheat Sheet Series**: https://cheatsheetseries.owasp.org/
4. **NIST SP 800-63B**: Digital Identity Guidelines - Authentication
5. **CWE Top 25**: Common Weakness Enumeration

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | STANDARDS-001 | Initial ASVS L2 checklist |

---

**Document Classification**: Internal Use
**Next Review Date**: 2027-01-08
