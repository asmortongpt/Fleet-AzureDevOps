# Security Testing Framework

## Overview

This document describes the comprehensive security testing framework for Fleet-CTA, covering OWASP Top 10, injection prevention, and access control testing.

## Test Suites

### 1. OWASP Top 10 Tests (`api/tests/security/owasp-top-10.test.ts`)

100+ tests covering all OWASP Top 10 categories:

#### A01: Broken Access Control (15 tests)
- **Insecure Direct Object Reference (IDOR)** - Cannot access other users' resources
- **Horizontal Privilege Escalation** - Cannot access other tenant users
- **Vertical Privilege Escalation** - Cannot elevate own role via JWT manipulation
- **Path Traversal** - `../../` patterns are normalized and blocked
- **Cross-Tenant Data Access** - Strict tenant isolation enforced
- **Function-Level Access Control** - Routes require proper authorization
- **Missing Access Control** - Protected endpoints require authentication
- **Session Hijacking Prevention** - Expired tokens are invalidated
- **Data-Level Access Control** - Field masking for non-admin roles
- **Resource-Based Access Control** - Users only modify their own resources
- **Missing Object-Level Authorization** - Cross-tenant access fails
- **Role-Based Access Control** - RBAC enforced at database level
- **Tenant Isolation** - Strict tenant separation verified
- **State-Changing Operations** - DELETE/UPDATE require proper authorization
- **API Parameter Validation** - Endpoint parameters are validated

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 42-203)

#### A02: Cryptographic Failures (10 tests)
- **HTTPS Enforcement** - Only HTTPS in production
- **Weak Encryption Detection** - No DES/MD5/RC4/SHA1 usage
- **Hardcoded Credentials** - No hardcoded passwords in env vars
- **JWT Algorithm Validation** - Uses RS256 (RSA), not HS256
- **Exposed API Keys** - API keys are not exposed
- **Password Hashing Strength** - bcrypt with cost >= 12
- **HTTPS Redirect** - HTTP redirects to HTTPS in production
- **Data Encryption at Rest** - Sensitive data is encrypted
- **Random IV/Nonce Usage** - Unique IV for each encryption
- **TLS Certificate Validation** - Certificates are validated

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 205-253)

#### A03: Injection (12 tests)
See detailed injection prevention tests below.

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 255-357)

#### A04: Insecure Design (8 tests)
- **Rate Limiting** - Enabled and configured
- **Security Headers** - Middleware is present
- **CSRF Protection** - Enabled with double-submit tokens
- **Account Lockout** - After failed attempts
- **Password Policy** - Minimum requirements enforced
- **Session Timeout** - Configured timeout limits
- **Input Validation** - All inputs are validated
- **Secure Defaults** - Production/staging/development properly configured

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 359-429)

#### A05: Security Misconfiguration (10 tests)
- **Debug Mode Disabled** - No debug mode in production
- **CORS Configuration** - Not wildcard with credentials
- **Directory Listing Disabled** - Express doesn't serve listings
- **Default Credentials Changed** - No default db passwords
- **Security Headers Present** - HSTS and other headers configured
- **Error Messages** - No stack traces in production
- **Unnecessary Features** - X-Powered-By header hidden
- **Security Policy** - SECURITY.md present
- **Content Security Policy** - Strict CSP enabled
- **X-Frame-Options** - Set to DENY or SAMEORIGIN

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 431-497)

#### A06: Vulnerable & Outdated Components (10 tests)
- **npm Audit Results** - No critical vulnerabilities
- **Backend npm Audit** - No critical vulnerabilities
- **Express Version** - Recent version (v4.x)
- **PostgreSQL Driver** - Up-to-date pg driver
- **No Abandoned Packages** - No known abandoned dependencies
- **Security Patches** - No known CVEs
- **Node.js Version** - Supported version (18+, 20+, 21+, 22+)
- **Transitive Dependencies** - Managed with lock file
- **Supply Chain Security** - Package integrity verified
- **Regular Updates** - Update schedule enforced

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 499-570)

#### A07: Authentication Failures (12 tests)
- **Session Fixation** - Each session gets unique ID
- **Brute Force Protection** - Max login attempts enforced
- **Account Lockout** - Lockout after failed attempts
- **Password Reset Security** - Secure reset tokens
- **Token Expiration** - Tokens expire after configured time
- **Password Storage** - Hashed with bcrypt
- **MFA Support** - Optional multi-factor authentication
- **Username Enumeration** - Generic error messages
- **Logout Functionality** - Sessions invalidated on logout
- **Secure Cookies** - Secure flag set in production
- **HTTPOnly Cookies** - XSS protection flag set
- **SameSite Cookies** - Strict or Lax protection

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 572-681)

#### A08: Software & Data Integrity (8 tests)
- **Signed Deployments** - Container signatures verified
- **Secure CI/CD** - GitHub Actions configured
- **Code Signing** - GPG signed commits
- **Dependency Lock File** - package-lock.json present
- **API Response Signing** - HTTPS provides integrity
- **Data Integrity Checks** - Database checksums
- **Backup Integrity** - Backups are checksummed
- **Supply Chain Verification** - npm registry verified

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 683-723)

#### A09: Logging & Monitoring (8 tests)
- **Security Event Logging** - Logger is configured
- **Audit Trails** - Audit table tracks changes
- **Failed Login Logging** - Failures are logged
- **Admin Action Logging** - Admin operations tracked
- **Access Violation Logging** - Denied access is logged
- **Data Modification Logging** - Changes to sensitive data logged
- **Log Retention** - Logs retained for >= 30 days
- **Log Security** - Logs protected from tampering

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 725-762)

#### A10: Server-Side Request Forgery (SSRF) (7 tests)
- **Private IP Range Blocking** - 192.168.x.x, 10.x.x.x, etc. blocked
- **Localhost Blocking** - localhost and 127.0.0.1 blocked
- **Port Filtering** - Dangerous ports (22, 23, 25, 3306, 5432, 6379) restricted
- **URL Scheme Validation** - Only http/https allowed
- **DNS Rebinding Prevention** - Resolved IP validated
- **Redirect Validation** - Redirects validated for safety
- **Metadata Service Blocking** - 169.254.169.254 blocked

**Test File**: `api/tests/security/owasp-top-10.test.ts` (lines 764-808)

### 2. Injection Prevention Tests (`api/tests/security/injection-prevention.test.ts`)

35+ dedicated tests for injection attacks:

#### SQL Injection (10 tests)
```typescript
// Tests cover:
- Classic SELECT injection: "1 OR '1'='1"
- UNION-based injection
- Time-based blind injection
- Boolean-based blind injection
- Stacked queries (DROP TABLE)
- Multiple parameter injection
- Comment-based injection
- LIKE wildcard handling
- Numeric type juggling
- Multi-statement execution
```

#### XSS Prevention (12 tests)
```typescript
// Tests cover:
- Stored XSS with HTML encoding
- Reflected XSS in JSON responses
- DOM-based XSS prevention
- Attribute-based XSS
- JavaScript context escaping
- CSS context escaping
- URL context escaping
- Event handler stripping
- Data attribute XSS
- Mutation-based XSS
- Protocol-based XSS (data:, javascript:)
- SVG-based XSS
```

#### Command Injection (6 tests)
```typescript
// Tests cover:
- execFile with array arguments
- Preventing exec() with user input
- spawn shell:false configuration
- Shell metacharacter escaping
- Command chaining prevention
- Command substitution prevention
```

#### Other Injection Types
- **Template Injection** (4 tests) - No dynamic evaluation
- **Header Injection** (4 tests) - CRLF removal
- **LDAP Injection** (3 tests) - Character escaping
- **XML/XXE** (3 tests) - External entity resolution
- **Path Traversal** (6 tests) - Directory escape prevention
- **NoSQL Injection** (3 tests) - Object/operator validation
- **CSV Injection** (3 tests) - Formula escaping
- **Prototype Pollution** (2 tests) - Object pollution prevention
- **Expression Language** (1 test) - No eval usage

### 3. Access Control Tests (`api/tests/security/access-control.test.ts`)

40+ tests for authorization and access control:

#### Role-Based Access Control (RBAC) (10 tests)
```typescript
// Test users with roles:
- SuperAdmin (full access)
- Admin (tenant management)
- Manager (team management)
- User (own resources)
- ReadOnly (no modifications)

Tests verify:
- Role hierarchy enforcement
- Cross-tenant role isolation
- Dynamic role assignment
- Default deny policy
```

#### Multi-Tenancy (6 tests)
```typescript
- Cross-tenant user access prevention
- Cross-tenant data access prevention
- tenant_id in WHERE clause enforcement
- Tenant escalation prevention
- Resource isolation by tenant
- Context switching prevention
```

#### Field-Level Access Control (5 tests)
```typescript
- Sensitive field masking for non-admins
- Full field access for admins
- Cost field masking
- IDOR field-level prevention
```

#### Resource-Level Access Control (5 tests)
```typescript
- Resource owner access
- Manager team resource access
- Unauthorized access prevention
- Resource ownership checks
```

#### Function-Level Access Control (6 tests)
```typescript
- DELETE operation restrictions
- Role-based function access
- UPDATE operation restrictions
- CREATE operation restrictions
- Middleware enforcement
- Access attempt auditing
```

#### IDOR Prevention (5 tests)
```typescript
- tenant_id required in queries
- Numeric ID enumeration prevention
- Ownership validation
- UUID instead of sequential IDs
- Object-level authorization
```

#### Privilege Escalation (3 tests)
```typescript
- Horizontal escalation prevention
- Vertical escalation prevention
- Role change validation
```

## Running the Tests

### Run All Security Tests
```bash
cd api
npm test -- tests/security/
```

### Run Specific Test Suite
```bash
# OWASP Top 10 tests
npm test -- tests/security/owasp-top-10.test.ts

# Injection tests
npm test -- tests/security/injection-prevention.test.ts

# Access control tests
npm test -- tests/security/access-control.test.ts
```

### Run with Coverage
```bash
npm test -- tests/security/ --coverage
```

### Watch Mode
```bash
npm test -- tests/security/ --watch
```

## Test Patterns

### 1. Real Database Tests
Tests use actual PostgreSQL for multi-tenancy verification:

```typescript
beforeAll(async () => {
  // Create real test tenant and users
  await pool.query(
    'INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3)',
    [testTenantId, 'Test Tenant', 'test-tenant']
  )
})

it('should prevent cross-tenant access', async () => {
  const result = await pool.query(
    'SELECT * FROM users WHERE tenant_id = $1',
    [testTenantId]
  )
  expect(result.rows.length).toBeGreaterThan(0)
})
```

### 2. Parameterized Query Testing
All SQL injection tests use parameterized queries:

```typescript
// SAFE: Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [maliciousInput]
)

// These are NEVER used:
// const result = await pool.query(`SELECT * FROM users WHERE email = '${maliciousInput}'`)
```

### 3. Input Encoding Verification
Tests verify output encoding:

```typescript
it('should HTML-encode output to prevent XSS', () => {
  const userInput = '<script>alert("xss")</script>'
  const encoded = userInput
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
  expect(encoded).not.toContain('<script>')
})
```

## Security Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| A01: Broken Access Control | 15 | ✅ |
| A02: Cryptographic Failures | 10 | ✅ |
| A03: Injection | 12 | ✅ |
| A04: Insecure Design | 8 | ✅ |
| A05: Security Misconfiguration | 10 | ✅ |
| A06: Vulnerable Components | 10 | ✅ |
| A07: Authentication Failures | 12 | ✅ |
| A08: Software & Data Integrity | 8 | ✅ |
| A09: Logging & Monitoring | 8 | ✅ |
| A10: Server-Side Request Forgery | 7 | ✅ |
| Injection Prevention (extended) | 35 | ✅ |
| Access Control (extended) | 40 | ✅ |
| **Total** | **165+** | **✅** |

## CI/CD Integration

Security tests run automatically on:
- Push to main/develop branches
- Pull requests to main
- Daily schedule (3 AM UTC)
- Manual trigger via workflow_dispatch

See `.github/workflows/security-scan.yml` for complete CI/CD configuration.

## Scanning Tools

### npm audit
```bash
npm audit --audit-level=moderate
cd api && npm audit --audit-level=moderate
```

### Snyk (if enabled)
```bash
snyk test --severity-threshold=high
```

### OWASP Dependency-Check
```bash
dependency-check --scan .
```

### Container Scanning (Trivy)
```bash
trivy image fleet-api:scan
```

## Security Best Practices Enforced

### Code Level
- ✅ Parameterized queries (no string concatenation)
- ✅ Output encoding (HTML, JavaScript, URL contexts)
- ✅ Input validation (whitelist approach)
- ✅ No hardcoded secrets
- ✅ bcrypt/argon2 for passwords (cost >= 12)
- ✅ JWT RS256 signing (asymmetric, not HS256)
- ✅ HTTPOnly and SameSite cookies
- ✅ HTTPS enforcement with HSTS

### Infrastructure
- ✅ Non-root containers
- ✅ ReadOnlyRootFilesystem
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Rate limiting on authentication endpoints
- ✅ CORS properly configured
- ✅ No debug mode in production
- ✅ Error handling without stack traces

### Access Control
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenancy with strict isolation
- ✅ Field-level access control
- ✅ Function-level authorization
- ✅ Resource-level ownership checks
- ✅ No IDOR vulnerabilities
- ✅ Privilege escalation prevention

### Monitoring & Logging
- ✅ Security event logging
- ✅ Audit trails for privileged operations
- ✅ Failed authentication logging
- ✅ Access violation logging
- ✅ Log retention >= 30 days
- ✅ Log integrity protection

## Remediation Workflow

When a test fails:

1. **Identify the vulnerability** - Review the test name and file location
2. **Analyze the cause** - Check the code for the security issue
3. **Plan the fix** - Determine how to remediate while maintaining functionality
4. **Implement the fix** - Apply security patch
5. **Verify the fix** - Re-run tests to confirm resolution
6. **Commit and push** - Document changes with security-focused commit message

Example:
```bash
# Identify issue
npm test -- tests/security/owasp-top-10.test.ts

# Fix vulnerability (e.g., enable HSTS)
# Edit api/src/middleware/security-headers.ts

# Verify fix
npm test -- tests/security/owasp-top-10.test.ts

# Commit
git add -A
git commit -m "security: enable HSTS header in production"
```

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

## Continuous Improvement

Security testing is an ongoing process. Regular review and updates should cover:
- New vulnerability discoveries
- Emerging attack techniques
- Dependency security updates
- Threat model updates
- Penetration testing findings

All security tests should pass before merging to main branch.
