# Security Guidelines for Vendor Developers

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Classification:** Confidential

---

## Table of Contents

1. [Overview](#overview)
2. [Access Control](#access-control)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Protection](#data-protection)
5. [Secure Coding Practices](#secure-coding-practices)
6. [Secrets Management](#secrets-management)
7. [Dependency Management](#dependency-management)
8. [Infrastructure Security](#infrastructure-security)
9. [Incident Response](#incident-response)
10. [Compliance](#compliance)

---

## Overview

### Security Philosophy

Security is everyone's responsibility. As a vendor developer, you must:
- Follow secure coding practices
- Protect sensitive data
- Report security concerns immediately
- Maintain confidentiality

### Security Principles

**Defense in Depth:** Multiple layers of security controls
**Least Privilege:** Minimum access required for tasks
**Zero Trust:** Verify all access attempts
**Fail Secure:** Default to secure state on errors

---

## Access Control

### Principle of Least Privilege

**What You Have Access To:**
- ✅ Development namespace (full access)
- ✅ Staging namespace (limited access)
- ❌ Production namespace (no access)

**What This Means:**
- Only use dev environment for active development
- Use staging for final testing before production
- Never attempt to access production directly
- Request additional permissions if needed

### Account Security

**Password Requirements:**
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- No personal information
- Unique per system

**Multi-Factor Authentication (MFA):**
- Required for all accounts
- Use authenticator app (not SMS)
- Keep backup codes secure
- Report lost devices immediately

**Session Management:**
- Lock computer when away
- Log out of shared systems
- Use encrypted communications
- Clear sensitive data from clipboard

### Physical Security

**Workstation Security:**
- Use full-disk encryption
- Enable firewall
- Install antivirus software
- Keep OS and software updated
- Use screen lock (5 minute timeout)

**Device Management:**
- Only use approved devices
- Report lost/stolen devices immediately
- No sensitive data on personal devices
- Encrypt all portable storage

---

## Authentication & Authorization

### JWT Token Security

**Best Practices:**
```typescript
// ✅ GOOD: Store token securely
localStorage.setItem('auth_token', token) // HTTPS only
sessionStorage.setItem('auth_token', token) // Better - cleared on tab close

// ❌ BAD: Don't expose tokens
console.log('Token:', token)
alert(token)
// Never log or display tokens
```

**Token Validation:**
```typescript
// ✅ GOOD: Always validate token expiry
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp: number }
    return decoded.exp < Date.now() / 1000
  } catch {
    return true
  }
}

// Check before API calls
if (isTokenExpired(token)) {
  // Redirect to login
}
```

**Token Storage:**
- Never commit tokens to git
- Don't hardcode tokens
- Use environment variables
- Rotate tokens regularly

### Password Handling

**Hashing Requirements:**
```typescript
// ✅ GOOD: Use bcrypt with proper salt rounds
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

// ❌ BAD: Never store plaintext passwords
const password = 'plaintext' // NEVER DO THIS
```

**Password Validation:**
```typescript
// ✅ GOOD: Validate password complexity
const validatePassword = (password: string): boolean => {
  const minLength = 12
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return password.length >= minLength &&
         hasUpper && hasLower && hasNumber && hasSpecial
}
```

### Role-Based Access Control (RBAC)

**Check Permissions Before Actions:**
```typescript
// ✅ GOOD: Verify user permissions
const canDeleteVehicle = (user: User, vehicle: Vehicle): boolean => {
  if (user.role === 'admin') return true
  if (user.role === 'fleet_manager' && user.tenant_id === vehicle.tenant_id) return true
  return false
}

if (!canDeleteVehicle(currentUser, vehicle)) {
  throw new ForbiddenError('Insufficient permissions')
}
```

---

## Data Protection

### Personal Identifiable Information (PII)

**What is PII in Our System:**
- Driver names, addresses, contact info
- Social Security Numbers
- Driver's license numbers
- User email addresses and phone numbers
- Vehicle location data
- Video footage

**Handling PII:**
```typescript
// ✅ GOOD: Mask PII in logs
const maskEmail = (email: string): string => {
  const [user, domain] = email.split('@')
  return `${user.substring(0, 2)}***@${domain}`
}

logger.info('User registered:', { email: maskEmail(user.email) })

// ❌ BAD: Logging PII
logger.info('User data:', user) // Exposes all PII
```

**Data Minimization:**
- Only collect necessary data
- Delete data when no longer needed
- Don't log sensitive data
- Anonymize where possible

### Encryption

**Data at Rest:**
- Database encryption enabled (Azure managed)
- Secrets encrypted in Kubernetes
- File uploads encrypted (Azure Storage)
- Backup encryption enabled

**Data in Transit:**
- TLS 1.2+ required
- HTTPS for all API calls
- No HTTP fallback
- Certificate pinning where applicable

**Encryption Code Examples:**
```typescript
// ✅ GOOD: Encrypt sensitive fields
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

const encrypt = (text: string): string => {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

const decrypt = (encrypted: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Usage
const encryptedSSN = encrypt(driver.ssn)
await pool.query('UPDATE drivers SET ssn_encrypted = $1 WHERE id = $2', [encryptedSSN, driver.id])
```

### Data Access Logging

**Audit Sensitive Operations:**
```typescript
// ✅ GOOD: Log access to sensitive data
const logDataAccess = async (userId: string, resourceType: string, resourceId: string, action: string) => {
  await pool.query(
    'INSERT INTO audit_logs (user_id, resource_type, resource_id, action, ip_address, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
    [userId, resourceType, resourceId, action, req.ip]
  )
}

// Example usage
await logDataAccess(user.id, 'driver', driverId, 'view_ssn')
```

---

## Secure Coding Practices

### SQL Injection Prevention

```typescript
// ✅ GOOD: Parameterized queries
const getVehicle = async (vin: string) => {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE vin = $1',
    [vin]
  )
  return result.rows[0]
}

// ❌ BAD: String concatenation
const getVehicle = async (vin: string) => {
  const result = await pool.query(
    `SELECT * FROM vehicles WHERE vin = '${vin}'` // SQL injection vulnerability!
  )
  return result.rows[0]
}
```

### Cross-Site Scripting (XSS) Prevention

```typescript
// ✅ GOOD: Sanitize user input
import DOMPurify from 'isomorphic-dompurify'

const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

// Usage
const cleanDescription = sanitizeHtml(userInput.description)

// ❌ BAD: Rendering unsanitized HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // XSS vulnerability!

// ✅ GOOD: Use React's built-in escaping
<div>{userInput}</div> // Automatically escaped
```

### Input Validation

```typescript
// ✅ GOOD: Comprehensive validation
import { z } from 'zod'

const vehicleSchema = z.object({
  vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]+$/),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1).max(20).regex(/^[A-Z0-9-]+$/),
  odometerReading: z.number().int().min(0).max(9999999)
})

// Usage
const validateVehicleInput = (data: unknown) => {
  try {
    return vehicleSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid vehicle data', error.errors)
    }
    throw error
  }
}

// ❌ BAD: No validation
const createVehicle = async (data: any) => {
  await pool.query('INSERT INTO vehicles ...', [data.vin, data.make, ...])
}
```

### Error Handling

```typescript
// ✅ GOOD: Secure error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error server-side
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  })

  // Send sanitized error to client
  const statusCode = err.status || 500
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message

  res.status(statusCode).json({
    error: message,
    requestId: req.id // For support reference
  })
})

// ❌ BAD: Exposing stack traces
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // Exposes internal details!
    query: req.query // May contain sensitive data!
  })
})
```

### API Rate Limiting

```typescript
// ✅ GOOD: Rate limiting configured
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path
    })
    res.status(429).json({
      error: 'Too many requests, please try again later'
    })
  }
})

app.use('/api/', limiter)

// Stricter limits for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
})

app.use('/api/auth/login', authLimiter)
```

---

## Secrets Management

### Environment Variables

```typescript
// ✅ GOOD: Use environment variables
const dbConfig = {
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!
}

// ❌ BAD: Hardcoded credentials
const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: 'SuperSecret123!' // NEVER DO THIS
}
```

### .env File Security

```bash
# ✅ GOOD: .gitignore includes
.env
.env.local
.env.*.local
*.key
*.pem

# ❌ BAD: Committing .env files
# Never commit .env files to version control!
```

### Kubernetes Secrets

**Creating Secrets:**
```bash
# Create secret from literal
kubectl create secret generic db-credentials \
  --from-literal=username=dbuser \
  --from-literal=password='StrongPassword123!' \
  -n fleet-dev

# Create secret from file
kubectl create secret generic tls-cert \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem \
  -n fleet-dev
```

**Using Secrets:**
```yaml
# deployment.yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: password
```

### Secret Rotation

**Regular Rotation Schedule:**
- Database passwords: Every 90 days
- API keys: Every 90 days
- JWT secrets: Every 180 days
- TLS certificates: Auto-renewed by cert-manager

---

## Dependency Management

### Keeping Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update major versions carefully
npm install package@latest
```

### Security Scanning

**Automated Scanning:**
- GitHub Dependabot enabled
- Azure DevOps security scanning
- Snyk integration (if available)

**Manual Review:**
```bash
# Before adding new dependency
npm info <package>

# Check for:
# - Recent updates
# - Number of maintainers
# - Open issues
# - Security advisories
```

### Package Verification

```bash
# Verify package integrity
npm audit signatures

# Use package-lock.json
# Always commit package-lock.json
git add package-lock.json
```

---

## Infrastructure Security

### Container Security

**Dockerfile Best Practices:**
```dockerfile
# ✅ GOOD: Secure Dockerfile
FROM node:20-alpine AS builder

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=nodejs:nodejs . .

# Build application
RUN npm run build

# Production image
FROM node:20-alpine

# Run as non-root
USER nodejs

WORKDIR /app

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "dist/server.js"]
```

### Network Security

**Kubernetes Network Policies:**
- Namespace isolation enabled
- Pod-to-pod communication restricted
- External access controlled via ingress
- No direct internet access from pods

**Firewall Rules:**
- Only required ports open
- Source IP whitelisting where possible
- Regular review of rules

---

## Incident Response

### Reporting Security Issues

**IMMEDIATE - Report if you discover:**
- Exposed credentials or secrets
- SQL injection vulnerability
- XSS vulnerability
- Authentication bypass
- Unauthorized data access
- Security breach

**How to Report:**
1. **DO NOT** create public GitHub issue
2. **DO NOT** discuss in public channels
3. **IMMEDIATELY** contact:
   - Email: security@capitaltechalliance.com
   - Phone: [Emergency contact provided separately]
4. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Affected systems

### Incident Response Process

**If Security Breach Suspected:**
1. Immediately notify project lead
2. Do not delete evidence
3. Document all actions taken
4. Follow incident response procedures
5. Cooperate with investigation

### Account Compromise

**If Your Account is Compromised:**
1. Immediately change all passwords
2. Revoke all access tokens
3. Enable MFA if not already enabled
4. Notify security team
5. Review recent access logs

---

## Compliance

### GDPR Compliance

**Data Subject Rights:**
- Right to access data
- Right to rectification
- Right to erasure
- Right to data portability

**Implementation:**
```typescript
// Implement data export
const exportUserData = async (userId: string) => {
  const userData = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  )

  const driverData = await pool.query(
    'SELECT * FROM drivers WHERE user_id = $1',
    [userId]
  )

  // Return all user data in portable format
  return {
    user: userData.rows[0],
    drivers: driverData.rows,
    // ... other data
  }
}

// Implement data deletion
const deleteUserData = async (userId: string) => {
  await pool.query('BEGIN')
  try {
    // Delete all user data
    await pool.query('DELETE FROM audit_logs WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM drivers WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM users WHERE id = $1', [userId])
    await pool.query('COMMIT')
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  }
}
```

### Data Retention

**Retention Policies:**
- Audit logs: 7 years
- User data: Until account deletion
- Video footage: 90 days
- Backup data: 30 days

**Implementation:**
```sql
-- Automated cleanup job
DELETE FROM video_events
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '7 years';
```

---

## Security Checklist

### Before Committing Code

- [ ] No hardcoded secrets or credentials
- [ ] All user input validated
- [ ] SQL queries use parameterization
- [ ] XSS prevention implemented
- [ ] Error messages don't expose sensitive info
- [ ] Logging doesn't include PII
- [ ] Dependencies are up to date
- [ ] No console.log() in production code

### Before Deploying

- [ ] Environment variables configured
- [ ] Secrets stored in Kubernetes
- [ ] TLS/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Authentication required
- [ ] Authorization checks in place
- [ ] Security tests passing
- [ ] No known vulnerabilities

---

## Training and Resources

### Required Reading

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/

### Security Tools

- **SAST:** ESLint with security plugins
- **DAST:** OWASP ZAP (automated scans)
- **Dependency Scanning:** npm audit, Snyk
- **Secret Detection:** git-secrets

---

## Contact

**Security Team:**
- Email: security@capitaltechalliance.com
- Emergency Phone: [Provided separately]
- Response Time: 2 hours for critical issues

**Project Lead:**
- Email: [Provided separately]
- Phone: [Provided separately]

---

**Document Control:**
- Version: 1.0
- Last Updated: 2025-11-09
- Classification: Confidential
- Distribution: External Vendor Development Team Only
- Next Review: 2025-12-09
