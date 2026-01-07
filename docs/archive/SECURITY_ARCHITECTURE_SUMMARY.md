# Fleet Management Application - Security Architecture Summary

## Executive Summary

This document provides a high-level overview of the enterprise security architecture analysis and proposed improvements for the Fleet Management application.

---

## Critical Security Findings

### Current Risk Assessment: **HIGH**

The existing implementation has significant security vulnerabilities that would fail enterprise security audits:

### Top 10 Critical Issues

1. **Client-Side Only Security** - All authentication, authorization, and policy enforcement happens in the browser
2. **No Server-Side Validation** - API endpoints lack JWT authentication, RBAC, and input validation
3. **Missing Secrets Management** - API keys stored in localStorage and environment variables
4. **No Audit Trail** - Configuration changes logged to console only, no database persistence
5. **Missing Encryption** - Sensitive data stored unencrypted in database
6. **No Rate Limiting** - Vulnerable to brute force and DDoS attacks
7. **SQL Injection Risk** - Some endpoints use raw SQL queries
8. **No MFA** - Privileged operations have no additional verification
9. **Missing CSRF Protection** - State-changing operations vulnerable to cross-site attacks
10. **No Approval Workflow** - Critical configuration changes apply immediately without review

---

## Proposed Architecture

### 1. Security Layers (Defense in Depth)

```
┌─────────────────────────────────────────────────┐
│  Layer 5: Monitoring & Response                 │
│  • SIEM Integration                             │
│  • Real-time Threat Detection                   │
│  • Incident Response Automation                 │
└─────────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────┐
│  Layer 4: Data Security                         │
│  • AES-256 Encryption at Rest                   │
│  • TLS 1.3 in Transit                           │
│  • Azure Key Vault for Secrets                  │
│  • Database Row-Level Security                  │
└─────────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────┐
│  Layer 3: Application Security                  │
│  • Server-Side Policy Enforcement               │
│  • RBAC with Permission Granularity             │
│  • Input Validation & Sanitization              │
│  • Parameterized Queries Only                   │
└─────────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────┐
│  Layer 2: API Security                          │
│  • JWT Authentication (RS256)                   │
│  • Refresh Token Rotation                       │
│  • API Rate Limiting (Redis)                    │
│  • CSRF Tokens                                  │
│  • Security Headers (CSP, HSTS, etc.)           │
└─────────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────┐
│  Layer 1: Network Security                      │
│  • Azure Application Gateway (WAF)              │
│  • DDoS Protection                              │
│  • Certificate Pinning                          │
│  • IP Whitelisting (for admin)                  │
└─────────────────────────────────────────────────┘
```

### 2. Core Services Architecture

```typescript
// 1. Configuration Management Service
class ConfigurationService {
  - Get/Set configuration with encryption
  - Version history and rollback
  - Approval workflow for high-impact changes
  - Real-time validation
  - Cache invalidation
}

// 2. Policy Enforcement Service (SERVER-SIDE)
class PolicyEnforcementService {
  - Evaluate policies server-side (cannot be bypassed)
  - Record all executions
  - Automatic violation detection
  - Action execution with retry logic
}

// 3. Audit Logging Service
class AuditService {
  - Immutable audit trail
  - Daily digest generation with cryptographic hashing
  - Tamper detection
  - Compliance reporting
}

// 4. Secrets Management Service
class KeyVaultService {
  - Azure Key Vault integration
  - Automatic key rotation
  - Encrypted storage references
  - Access tracking
}

// 5. Data Governance Service
class DataGovernanceService {
  - Master Data Management (MDM)
  - Data lineage tracking
  - Quality scoring
  - PII auto-detection
  - Data classification
}
```

---

## Database Schema Enhancements

### New Security Tables

| Table Name | Purpose | Key Features |
|-----------|---------|--------------|
| `configuration_settings` | Server-side config storage | Encryption, versioning, approval flags |
| `configuration_versions` | Version history | Immutable audit trail, rollback support |
| `configuration_approvals` | Approval workflow | Multi-level approval, justification required |
| `mfa_tokens` | Multi-factor auth | TOTP secrets, backup codes, lockout |
| `session_tokens` | JWT session tracking | Revocation support, activity monitoring |
| `revoked_tokens` | Token blacklist | Immediate logout capability |
| `api_keys` | Encrypted credentials | Rotation tracking, Azure KV integration |
| `encryption_keys` | Key metadata | Version tracking, rotation scheduling |
| `audit_logs` | Comprehensive audit trail | Partitioned by month, immutable |
| `audit_log_digests` | Daily compliance summaries | Cryptographic hash chain (blockchain-style) |
| `security_events` | Security incidents | SOC monitoring, investigation tracking |
| `rate_limits` | Rate limiting tracking | Per user/IP/endpoint throttling |
| `blocked_entities` | IP/User blacklist | Temporary/permanent blocks |
| `data_classifications` | Data governance | PII marking, retention policies |
| `data_access_logs` | Sensitive data access | GDPR compliance, access purpose tracking |

### Database Security Features

- **Row-Level Security (RLS)** - Automatic filtering based on user context
- **Encrypted Columns** - AES-256 encryption for sensitive data
- **Audit Triggers** - Automatic logging of all changes
- **Partitioning** - Monthly partitions for audit logs (performance + archival)
- **Immutable Logs** - No UPDATE/DELETE permissions on audit tables

---

## API Security Layer

### Authentication Flow

```
1. User Login
   ├─> Username/Password validation (bcrypt, cost factor 12)
   ├─> Optional: MFA verification (TOTP)
   ├─> Generate JWT (RS256, 15min expiry)
   ├─> Generate Refresh Token (secure random, hashed)
   └─> Store session in database

2. API Request
   ├─> Extract JWT from Authorization header
   ├─> Verify signature and expiration
   ├─> Check revocation list
   ├─> Validate session in database
   ├─> Update last activity timestamp
   ├─> Attach user context to request
   └─> Proceed to RBAC check

3. Authorization
   ├─> Check user role (SuperAdmin, CTAOwner, etc.)
   ├─> Check specific permissions (configuration.write, etc.)
   ├─> Check MFA if required for sensitive operation
   ├─> Log authorization decision
   └─> Allow or deny request

4. Rate Limiting
   ├─> Generate rate limit key (user ID or IP)
   ├─> Check current count in Redis
   ├─> Increment counter or reject (429 Too Many Requests)
   ├─> Set rate limit headers (X-RateLimit-*)
   └─> Proceed to endpoint handler

5. Request Processing
   ├─> Validate input with Zod schemas
   ├─> Sanitize inputs (prevent XSS, SQL injection)
   ├─> Execute business logic
   ├─> Enforce policies server-side
   ├─> Log all actions to audit trail
   └─> Return response

6. Audit Logging
   ├─> Log request metadata
   ├─> Log response status
   ├─> Log execution time
   ├─> Log any security events
   └─> Generate daily digest (scheduled job)
```

### Security Middleware Stack

```typescript
app.use(helmet()) // Security headers
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(csrfProtection()) // CSRF tokens
app.use(rateLimitMiddleware.apiLimit) // Rate limiting
app.use(authMiddleware.authenticate) // JWT validation
app.use(auditMiddleware.logRequest) // Audit logging

// Protected routes
app.use('/api/configuration',
  authMiddleware.requireRole(['CTAOwner', 'SuperAdmin']),
  rateLimitMiddleware.configLimit,
  configurationRoutes
)

app.use('/api/policies',
  authMiddleware.requireRole(['CTAOwner', 'SuperAdmin']),
  authMiddleware.requireMFA, // MFA required for policy changes
  policyRoutes
)
```

---

## Secrets Management (Azure Key Vault)

### Integration Architecture

```
┌────────────────────────────────────────────────┐
│  Fleet Application                              │
│  ┌──────────────────────────────────────┐      │
│  │  KeyVaultService                     │      │
│  │  • DefaultAzureCredential            │      │
│  │  • Automatic token refresh           │      │
│  │  • Local caching (5 min TTL)         │      │
│  └────────────┬─────────────────────────┘      │
│               │                                 │
└───────────────┼─────────────────────────────────┘
                │ HTTPS
                │
┌───────────────▼─────────────────────────────────┐
│  Azure Key Vault                                │
│  ┌──────────────────────────────────────┐      │
│  │  Secrets                             │      │
│  │  • database-connection-string        │      │
│  │  • api-key-openai                    │      │
│  │  • api-key-google-maps               │      │
│  │  • encryption-key-master             │      │
│  │  • jwt-signing-private-key           │      │
│  │  • jwt-signing-public-key            │      │
│  └──────────────────────────────────────┘      │
│                                                 │
│  ┌──────────────────────────────────────┐      │
│  │  Access Policies                     │      │
│  │  • Application: Read-only            │      │
│  │  • SuperAdmin: Full access           │      │
│  │  • Audit logging enabled             │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### Secret Rotation Schedule

| Secret Type | Rotation Frequency | Automated |
|-------------|-------------------|-----------|
| Database passwords | 90 days | Yes |
| API keys | 90 days | Manual (vendor-dependent) |
| Encryption keys | 365 days | Yes |
| JWT signing keys | 180 days | Yes |
| MFA secrets | Never (user-generated) | N/A |

---

## Encryption Strategy

### Data at Rest

```sql
-- Encrypted columns in PostgreSQL
CREATE TABLE configuration_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  value TEXT, -- Plaintext for non-sensitive
  encrypted_value TEXT, -- AES-256-GCM encrypted
  is_encrypted BOOLEAN
);

-- Encryption function
CREATE FUNCTION encrypt_sensitive(plaintext TEXT) RETURNS TEXT AS $$
BEGIN
  -- Uses pgcrypto extension + key from Azure Key Vault
  RETURN pgp_sym_encrypt(plaintext, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

### Data in Transit

- **TLS 1.3** for all HTTP communication
- **Certificate pinning** for mobile apps
- **Database connections** encrypted with SSL
- **Inter-service communication** via Azure Private Link

### Encryption Keys

| Key Name | Algorithm | Purpose | Storage |
|----------|-----------|---------|---------|
| `master-encryption-key` | AES-256-GCM | Sensitive config values | Azure Key Vault |
| `database-encryption-key` | AES-256-GCM | Database column encryption | Azure Key Vault |
| `backup-encryption-key` | AES-256-GCM | Backup archives | Azure Key Vault |
| `jwt-signing-private-key` | RSA-2048 | JWT signature | Azure Key Vault |
| `jwt-signing-public-key` | RSA-2048 | JWT verification | Cached in app |

---

## Audit Logging & Compliance

### Audit Trail Features

1. **Immutable Logs** - No UPDATE/DELETE permissions
2. **Comprehensive Capture** - Every API call, configuration change, policy execution
3. **Tamper Detection** - Daily cryptographic hash digests (blockchain-style)
4. **Long-term Retention** - 7 years for compliance
5. **Real-time Alerting** - Critical events trigger immediate notifications
6. **Compliance Reporting** - SOC 2, FISMA, NIST 800-53 reports

### What Gets Logged

```typescript
interface AuditLogEntry {
  timestamp: Date
  userId: string
  sessionId: string
  action: string // 'configuration.update', 'policy.execute', etc.
  resourceType: string
  resourceId: string
  ipAddress: string
  userAgent: string
  requestMethod: string
  requestPath: string
  responseStatus: number
  executionTimeMs: number
  metadata: {
    previousValue?: any
    newValue?: any
    policyId?: number
    approved?: boolean
    // ... context-specific data
  }
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
}
```

### Compliance Mappings

| Framework | Requirement | Implementation |
|-----------|-------------|----------------|
| SOC 2 | Access logging | audit_logs table, 7-year retention |
| SOC 2 | Encryption at rest | pgcrypto + Azure Key Vault |
| SOC 2 | Encryption in transit | TLS 1.3 everywhere |
| NIST 800-53 | AC-2 Account Management | RBAC, session tracking, MFA |
| NIST 800-53 | AU-2 Audit Events | Comprehensive audit logging |
| NIST 800-53 | AU-9 Audit Information Protection | Immutable logs, hash chain |
| NIST 800-53 | IA-2 Identification & Authentication | JWT + TOTP MFA |
| NIST 800-53 | SC-12 Cryptographic Key Management | Azure Key Vault |
| FISMA | Continuous Monitoring | Real-time security event detection |
| GDPR | Right to be Forgotten | Data deletion workflows |
| GDPR | Data Portability | Export functionality |
| GDPR | Privacy by Design | Default encryption, minimal data collection |

---

## Multi-Factor Authentication (MFA)

### Implementation

```typescript
// 1. MFA Enrollment
async function enrollMFA(userId: number) {
  const secret = speakeasy.generateSecret({
    name: `Fleet Management (${userEmail})`,
    issuer: 'Capital Tech Alliance'
  })

  // Encrypt and store secret
  await db.query(
    `INSERT INTO mfa_tokens (user_id, secret_key_encrypted, is_enabled)
     VALUES ($1, $2, false)`,
    [userId, await encrypt(secret.base32)]
  )

  // Generate backup codes
  const backupCodes = generateBackupCodes(10)

  return {
    qrCode: secret.otpauth_url,
    backupCodes
  }
}

// 2. MFA Verification
async function verifyMFA(userId: number, token: string): Promise<boolean> {
  const result = await db.query(
    `SELECT secret_key_encrypted FROM mfa_tokens
     WHERE user_id = $1 AND is_enabled = true`,
    [userId]
  )

  const secret = await decrypt(result.rows[0].secret_key_encrypted)

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps for clock drift
  })
}

// 3. MFA Required for Sensitive Operations
app.post('/api/configuration/critical',
  authMiddleware.authenticate,
  authMiddleware.requireRole(['SuperAdmin']),
  authMiddleware.requireMFA, // <-- MFA check
  async (req, res) => {
    // High-impact operation
  }
)
```

### MFA Required For

- SuperAdmin login
- Configuration changes with `requiresApproval: true`
- Policy activation/deactivation
- User role changes
- API key rotation
- Audit log exports
- Database backups/restores

---

## Configuration Change Approval Workflow

### Workflow States

```
┌─────────────────┐
│ Change Request  │ (User submits configuration change)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validation      │ (Server-side validation of new value)
└────────┬────────┘
         │
         ├─> Validation Failed ──> Reject immediately
         │
         ▼
┌─────────────────┐
│ Approval Check  │ (Check if approval required)
└────────┬────────┘
         │
         ├─> No Approval Needed ──> Apply Immediately
         │
         ▼
┌─────────────────┐
│ Pending         │ (Create approval request)
└────────┬────────┘
         │
         ├─> Notify Approvers (Email + Teams)
         │
         ▼
┌─────────────────┐
│ Under Review    │ (Awaiting approver action)
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Approved     │  │ Rejected     │  │ Cancelled    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Apply Change │  │ Notify       │  │ Notify       │
│ + Audit Log  │  │ Requester    │  │ Requester    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Approval Matrix

| Configuration Category | Requires Approval | Approver Role | MFA Required |
|------------------------|-------------------|---------------|--------------|
| Organization branding | No | N/A | No |
| Module enable/disable | Yes | CTAOwner | No |
| Business rules | Yes | CTAOwner | Yes |
| Security settings | Yes | SuperAdmin | Yes |
| MFA enforcement | Yes | SuperAdmin | Yes |
| API keys | Yes | SuperAdmin | Yes |
| Encryption settings | Yes | SuperAdmin | Yes |

---

## Implementation Roadmap

### Phase 1: Critical Security (Weeks 1-4) - HIGHEST PRIORITY

**Goal:** Eliminate critical vulnerabilities that allow trivial bypasses

- [x] Database schema migration (new security tables)
- [ ] Implement JWT authentication middleware
- [ ] Add RBAC middleware
- [ ] Integrate Azure Key Vault
- [ ] Implement audit logging service
- [ ] Add rate limiting (Redis-backed)
- [ ] Security headers and CSRF protection
- [ ] Parameterize all SQL queries

**Deliverables:**
- Working JWT authentication on all endpoints
- Server-side policy enforcement (basic)
- Audit logs for all API calls
- Secrets moved to Azure Key Vault

### Phase 2: Data Security (Weeks 5-8)

**Goal:** Protect data at rest and in transit

- [ ] Implement encryption service
- [ ] Encrypt sensitive database columns
- [ ] Row-level security (RLS) for multi-tenancy
- [ ] Backup and recovery procedures
- [ ] Data classification tagging
- [ ] Automated key rotation

**Deliverables:**
- All PII encrypted at rest
- Database backups encrypted
- Data access logging operational
- Key rotation automation working

### Phase 3: Backend Services (Weeks 9-16)

**Goal:** Move business logic and enforcement server-side

- [ ] Configuration Management Service (full implementation)
- [ ] Policy Enforcement Service (server-side)
- [ ] Data Governance Service
- [ ] Approval workflow system
- [ ] Versioning and rollback
- [ ] Real-time validation

**Deliverables:**
- Configuration changes require approval
- Policies enforced server-side (cannot be bypassed)
- Configuration history with rollback
- MDM and data lineage tracking

### Phase 4: Advanced Security (Weeks 17-20)

**Goal:** Add enterprise security features

- [ ] MFA implementation (TOTP)
- [ ] Continuous security monitoring
- [ ] Automated threat detection
- [ ] Anomaly detection (unusual access patterns)
- [ ] Security dashboard
- [ ] Incident response automation

**Deliverables:**
- MFA working for SuperAdmin
- Security events dashboard
- Automated blocking of suspicious IPs
- Real-time alerting for critical events

### Phase 5: Compliance & Certification (Weeks 21-24)

**Goal:** Achieve compliance certifications

- [ ] SOC 2 Type II documentation
- [ ] NIST 800-53 controls mapping
- [ ] Compliance reporting dashboard
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] Vulnerability remediation
- [ ] Production deployment

**Deliverables:**
- SOC 2 Type II report
- NIST compliance documentation
- Security audit passed
- Production deployment approved

---

## Quick Start (For Development)

### 1. Run Database Migration

```bash
cd api
psql -U fleet_user -d fleet_db -f migrations/001_enterprise_security_schema.sql
```

### 2. Set Up Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name fleet-keyvault \
  --resource-group fleet-rg \
  --location eastus2

# Store secrets
az keyvault secret set --vault-name fleet-keyvault --name database-connection-string --value "postgresql://..."
az keyvault secret set --vault-name fleet-keyvault --name api-key-openai --value "sk-..."
az keyvault secret set --vault-name fleet-keyvault --name encryption-key-master --value "$(openssl rand -base64 32)"
```

### 3. Update Environment Variables

```bash
# .env
AZURE_KEY_VAULT_URL=https://fleet-keyvault.vault.azure.net/
AZURE_CLIENT_ID=<managed-identity-client-id>
AZURE_TENANT_ID=<tenant-id>
JWT_SECRET_KEY_ID=jwt-signing-private-key
JWT_PUBLIC_KEY_ID=jwt-signing-public-key
REDIS_URL=redis://localhost:6379
```

### 4. Install Dependencies

```bash
npm install \
  @azure/keyvault-secrets \
  @azure/identity \
  jsonwebtoken \
  bcrypt \
  helmet \
  csurf \
  express-rate-limit \
  ioredis \
  speakeasy \
  qrcode \
  zod
```

### 5. Start Application

```bash
npm run dev
```

---

## Testing Security

### Security Test Checklist

- [ ] JWT authentication blocks unauthenticated requests
- [ ] Revoked tokens are rejected
- [ ] RBAC prevents unauthorized access
- [ ] Rate limiting triggers at threshold
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized
- [ ] CSRF tokens are validated
- [ ] MFA is required for sensitive operations
- [ ] Audit logs capture all changes
- [ ] Configuration approval workflow works
- [ ] Encrypted data cannot be read directly from database
- [ ] Secrets are loaded from Azure Key Vault (not .env)

### Automated Security Tests

```bash
# Run security test suite
npm run test:security

# Penetration testing
npm run test:pentest

# Dependency vulnerability scan
npm audit
npm run snyk:test
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Authentication**
   - Failed login attempts per hour
   - MFA failures
   - Session revocations
   - Password reset requests

2. **Authorization**
   - Unauthorized access attempts
   - Permission denied events
   - Privilege escalation attempts

3. **API Security**
   - Rate limit exceeded events
   - Blocked IPs
   - Suspicious request patterns
   - Unusual API usage

4. **Data Security**
   - Sensitive data access (PII)
   - Configuration changes
   - Policy violations
   - Data export requests

5. **Audit Compliance**
   - Audit log volume
   - Critical security events
   - Compliance violations
   - Missing audit entries (integrity check)

### Alerting Rules

| Event | Severity | Alert Channel | Response |
|-------|----------|---------------|----------|
| 5+ failed logins (same user) | High | Email + SMS | Lock account |
| 10+ failed logins (same IP) | Critical | Email + SMS + Teams | Block IP |
| Unauthorized access attempt | High | Email + Teams | Investigate |
| Configuration change (critical) | Medium | Email | Review change |
| Policy violation | Medium | Email | Investigate |
| MFA failure (3x) | High | Email + SMS | Lock account |
| Data breach attempt | Critical | All channels | Incident response |
| Audit log tampering detected | Critical | All channels | Immediate investigation |

---

## Support & Documentation

### Additional Resources

1. **Full Architecture Document**: `ENTERPRISE_SECURITY_ARCHITECTURE.md`
2. **Database Migration**: `api/migrations/001_enterprise_security_schema.sql`
3. **API Documentation**: `docs/api/security.md` (to be created)
4. **Security Policies**: `docs/security/policies.md` (to be created)
5. **Incident Response Plan**: `docs/security/incident-response.md` (to be created)

### Getting Help

- **Security Team**: security@example.com
- **DevOps Team**: devops@example.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX (24/7 on-call)

### Contributing

All security-related changes must:
1. Pass security review
2. Include automated tests
3. Update documentation
4. Not introduce new vulnerabilities

---

## Conclusion

This security architecture transforms the Fleet Management application from a client-side prototype into an enterprise-grade, secure-by-default system suitable for government and financial institutions.

**Key Achievements:**
- ✅ Server-side enforcement (no client-side bypasses)
- ✅ Comprehensive audit trail (SOC 2 compliant)
- ✅ Enterprise-grade authentication (JWT + MFA)
- ✅ Secrets management (Azure Key Vault)
- ✅ Data encryption (at rest and in transit)
- ✅ Policy enforcement (cannot be bypassed)
- ✅ Compliance-ready (SOC 2, NIST, FISMA)

**Estimated Implementation**: 24 weeks (6 months) with dedicated team

**Next Steps**: Begin Phase 1 implementation immediately to address critical vulnerabilities.

---

**Document Version**: 1.0
**Last Updated**: January 5, 2026
**Author**: Enterprise Architecture Team
**Classification**: Internal - Architecture
