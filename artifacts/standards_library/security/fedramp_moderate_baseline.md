# FedRAMP Moderate Baseline Security Standards

**Version**: 1.0
**Last Updated**: 2026-01-08
**Authority**: NIST SP 800-53 Rev 5, FedRAMP Moderate Baseline
**Application**: CTAFleet Vehicle Management System

---

## 1. Overview

### 1.1 FedRAMP Moderate Impact Level
FedRAMP Moderate is appropriate for cloud services where the loss of confidentiality, integrity, or availability could have a **serious adverse effect** on organizational operations, assets, or individuals.

**Impact Categories**:
- **Confidentiality**: MODERATE - Unauthorized disclosure could cause serious harm
- **Integrity**: MODERATE - Unauthorized modification could cause serious harm
- **Availability**: MODERATE - Disruption could cause serious harm

### 1.2 Control Baseline
FedRAMP Moderate requires implementation of:
- **325 security controls** from NIST SP 800-53 Rev 5
- **Continuous monitoring** and vulnerability management
- **Annual assessments** by FedRAMP-authorized 3PAO
- **Monthly continuous monitoring deliverables**

---

## 2. Key Control Families

### 2.1 Access Control (AC)

#### AC-1: Access Control Policy and Procedures
**Requirement**: Develop, document, and disseminate access control policy and procedures.

**Implementation**:
- Document comprehensive access control policy
- Define roles: Admin, Fleet Manager, Driver, Viewer
- Establish procedures for account provisioning/deprovisioning
- Review and update annually

#### AC-2: Account Management
**Requirement**: Manage information system accounts including establishment, activation, modification, review, disabling, and removal.

**Implementation**:
```typescript
// Account lifecycle management
- Automated account provisioning via Azure AD
- Role assignment based on least privilege principle
- Account review every 90 days
- Automatic disabling after 90 days inactivity
- Immediate revocation upon termination
```

**Code Requirements**:
- Implement account expiration checks
- Log all account lifecycle events
- Enforce approval workflow for privileged accounts

#### AC-3: Access Enforcement
**Requirement**: Enforce approved authorizations for logical access.

**Implementation**:
- Role-Based Access Control (RBAC) enforced at API layer
- Attribute-Based Access Control (ABAC) for resource-level permissions
- Default deny-all policy
- Explicit allow rules only

**Code Pattern**:
```typescript
// Middleware enforcement pattern
export const enforceAccess = (requiredRole: Role, resource?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Verify authentication
    if (!user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Verify authorization
    if (!hasRole(user, requiredRole)) {
      auditLog.logAccessDenied(user.id, requiredRole, resource);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify resource-level access
    if (resource && !canAccessResource(user, resource)) {
      auditLog.logAccessDenied(user.id, requiredRole, resource);
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};
```

#### AC-6: Least Privilege
**Requirement**: Employ the principle of least privilege.

**Implementation**:
- Minimum necessary permissions for each role
- Separate admin accounts for privileged operations
- Just-in-time (JIT) privilege elevation
- Regular privilege review and recertification

#### AC-7: Unsuccessful Logon Attempts
**Requirement**: Enforce limit of consecutive invalid logon attempts.

**Implementation**:
- **Maximum 3 failed attempts** within 15 minutes
- **Account lockout for 30 minutes** after threshold
- Administrator notification after 5 failed attempts
- Log all failed authentication attempts

**Code Requirements**:
```typescript
// Failed login tracking
interface LoginAttempt {
  userId: string;
  timestamp: Date;
  ipAddress: string;
  success: boolean;
}

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
```

#### AC-17: Remote Access
**Requirement**: Establish usage restrictions and implementation guidance for remote access.

**Implementation**:
- All remote access via HTTPS (TLS 1.3)
- Multi-factor authentication required
- Session timeout after 15 minutes inactivity
- Network-level controls (IP allowlisting where feasible)

---

### 2.2 Audit and Accountability (AU)

#### AU-2: Audit Events
**Requirement**: Determine auditable events and audit them.

**Implementation - Required Audit Events**:
1. **Authentication Events**:
   - Successful/failed login attempts
   - Logout events
   - Session creation/termination
   - Password changes
   - MFA enrollment/usage

2. **Authorization Events**:
   - Access denials (403 errors)
   - Privilege escalation attempts
   - Role assignments/modifications

3. **Data Access Events**:
   - Vehicle record access
   - Maintenance record viewing
   - Report generation
   - Data export operations

4. **Administrative Events**:
   - User account creation/modification/deletion
   - Configuration changes
   - System setting modifications
   - Security policy updates

5. **System Events**:
   - Application start/stop
   - Error conditions
   - Security alerts
   - Backup operations

**Audit Log Format**:
```typescript
interface AuditEvent {
  timestamp: string;        // ISO 8601 format
  eventId: string;          // Unique event identifier
  eventType: string;        // Event category
  userId?: string;          // Actor (if applicable)
  ipAddress: string;        // Source IP
  userAgent: string;        // Client information
  action: string;           // Action performed
  resource?: string;        // Resource affected
  result: 'success' | 'failure';
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: Record<string, any>;
}
```

#### AU-3: Content of Audit Records
**Requirement**: Generate audit records containing sufficient information.

**Required Fields**:
- Date and time of event
- Component/source of event
- Type of event
- User/subject identity
- Outcome (success/failure)
- Additional details for investigation

#### AU-6: Audit Review, Analysis, and Reporting
**Requirement**: Review and analyze audit records.

**Implementation**:
- **Daily**: Automated analysis for anomalies
- **Weekly**: Security team review of failed access attempts
- **Monthly**: Comprehensive audit log review
- **Real-time**: Alerts for critical security events

#### AU-9: Protection of Audit Information
**Requirement**: Protect audit information and tools from unauthorized access.

**Implementation**:
- Audit logs stored in append-only storage
- Separate Azure Log Analytics workspace
- Role-based access (security team only)
- Tamper detection mechanisms
- Encrypted at rest and in transit

#### AU-11: Audit Record Retention
**Requirement**: Retain audit records for organization-defined time period.

**Implementation**:
- **Minimum retention**: 90 days online
- **Archive retention**: 1 year offline/cold storage
- **Compliance retention**: 7 years for financial records
- Automated archival and deletion processes

---

### 2.3 Identification and Authentication (IA)

#### IA-2: Identification and Authentication (Organizational Users)
**Requirement**: Uniquely identify and authenticate organizational users.

**Implementation**:
- Azure AD integration for primary authentication
- Unique user identifiers (no shared accounts)
- Multi-factor authentication (MFA) required
- Certificate-based authentication for APIs

#### IA-2(1): Multi-Factor Authentication
**Requirement**: Implement MFA for network access to privileged accounts.

**Implementation**:
- **Required for**: All users accessing sensitive data
- **Methods**: TOTP (Microsoft Authenticator), SMS (backup), Hardware tokens
- **Enforcement**: Conditional Access policies in Azure AD
- **Bypass**: Not permitted except emergency access accounts

#### IA-4: Identifier Management
**Requirement**: Manage user identifiers.

**Implementation**:
- Unique identifiers for each user (Azure AD Object ID)
- No reuse of identifiers
- Identifiers remain associated with individual
- Disable (don't delete) terminated user accounts

#### IA-5: Authenticator Management
**Requirement**: Manage information system authenticators.

**Implementation**:
- **Password Requirements**:
  - Minimum 14 characters
  - Complexity: uppercase, lowercase, numbers, special characters
  - No dictionary words
  - No user information (name, email)
  - Password history: 24 previous passwords
  - Maximum age: 90 days
  - Minimum age: 1 day

**Code Requirements**:
```typescript
// Password validation
const PASSWORD_POLICY = {
  minLength: 14,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // days
  historyCount: 24,
  minAge: 1 // days
};
```

- **API Keys/Tokens**:
  - Generate cryptographically random tokens
  - Minimum 256-bit entropy
  - Store hashed (bcrypt, cost factor ≥12)
  - Rotate every 90 days
  - Revoke on compromise

#### IA-5(1): Password-Based Authentication
**Requirement**: Enforce password-based authentication requirements.

**Implementation**:
- Passwords stored as bcrypt hashes (cost ≥12)
- Salted hashes (unique salt per password)
- Secure password reset mechanism
- No password hints
- Prevent password stuffing attacks

#### IA-8: Identification and Authentication (Non-Organizational Users)
**Requirement**: Uniquely identify and authenticate non-organizational users.

**Implementation**:
- External users via Azure AD B2B
- Service accounts for API access
- Certificate-based authentication for machine-to-machine
- OAuth 2.0 for third-party integrations

---

### 2.4 System and Communications Protection (SC)

#### SC-7: Boundary Protection
**Requirement**: Monitor and control communications at external boundaries.

**Implementation**:
- Azure Application Gateway with WAF
- Network Security Groups (NSGs)
- DDoS protection
- API Gateway for external API access
- No direct database access from internet

#### SC-8: Transmission Confidentiality and Integrity
**Requirement**: Protect confidentiality and integrity of transmitted information.

**Implementation**:
- **TLS 1.3** required (TLS 1.2 minimum)
- **Cipher suites**: ECDHE-RSA-AES256-GCM-SHA384 or stronger
- **Certificate management**: Valid certificates from trusted CA
- **HSTS**: Enforce HTTPS with max-age=31536000
- **No mixed content**: All resources over HTTPS

**Code Requirements**:
```typescript
// Express TLS configuration
const tlsOptions = {
  minVersion: 'TLSv1.3',
  ciphers: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
  ].join(':'),
  honorCipherOrder: true,
};
```

#### SC-12: Cryptographic Key Establishment and Management
**Requirement**: Establish and manage cryptographic keys.

**Implementation**:
- Azure Key Vault for key storage
- Automated key rotation (every 90 days)
- Hardware Security Module (HSM) backing
- Separate keys for different purposes
- Key access auditing

#### SC-13: Cryptographic Protection
**Requirement**: Implement FIPS-validated or NSA-approved cryptography.

**Implementation**:
- **Encryption at rest**: AES-256
- **Encryption in transit**: TLS 1.3 with approved ciphers
- **Hashing**: SHA-256 or stronger
- **Password hashing**: bcrypt (cost ≥12) or Argon2id
- **Token generation**: Cryptographically secure random (crypto.randomBytes)

**Code Requirements**:
```typescript
// Secure token generation
import crypto from 'crypto';

export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

// Password hashing
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
```

#### SC-23: Session Authenticity
**Requirement**: Protect the authenticity of communications sessions.

**Implementation**:
- JWT tokens with RS256 signing
- Session tokens with CSRF protection
- Secure cookie attributes (HttpOnly, Secure, SameSite=Strict)
- Session binding to IP address (optional, with user notification)
- Session timeout after 15 minutes inactivity

---

### 2.5 System and Information Integrity (SI)

#### SI-2: Flaw Remediation
**Requirement**: Identify, report, and correct information system flaws.

**Implementation**:
- **Critical vulnerabilities**: Patch within 15 days
- **High vulnerabilities**: Patch within 30 days
- **Medium vulnerabilities**: Patch within 90 days
- Automated vulnerability scanning (weekly)
- Dependency scanning in CI/CD pipeline
- Security advisories monitoring

#### SI-3: Malicious Code Protection
**Requirement**: Implement malicious code protection mechanisms.

**Implementation**:
- Azure Defender for Cloud (endpoint protection)
- Web Application Firewall (WAF)
- Input validation and sanitization
- Content Security Policy (CSP)
- Regular malware scans

#### SI-4: Information System Monitoring
**Requirement**: Monitor the information system to detect attacks.

**Implementation**:
- Azure Monitor for application monitoring
- Azure Sentinel for SIEM
- Real-time alerting for security events
- Intrusion detection/prevention
- Anomaly detection for authentication patterns

#### SI-10: Information Input Validation
**Requirement**: Check the validity of information inputs.

**Implementation**:
- **Whitelist validation**: Accept only known-good input
- **Type checking**: Validate data types
- **Length limits**: Enforce maximum input sizes
- **Format validation**: Regex patterns for structured data
- **Canonicalization**: Normalize before validation
- **Server-side validation**: Never trust client-side only

**Code Requirements**:
```typescript
// Input validation pattern
import { z } from 'zod';

// Define schema
const VehicleSchema = z.object({
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/),
  licensePlate: z.string().max(10).regex(/^[A-Z0-9-]+$/),
  make: z.string().max(50).regex(/^[A-Za-z0-9\s-]+$/),
  model: z.string().max(50).regex(/^[A-Za-z0-9\s-]+$/),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).max(9999999),
});

// Validate input
export function validateVehicleInput(data: unknown) {
  try {
    return VehicleSchema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid vehicle data', error);
  }
}
```

#### SI-11: Error Handling
**Requirement**: Generate error messages that provide necessary information without revealing sensitive information.

**Implementation**:
- Generic error messages to users
- Detailed errors logged server-side only
- No stack traces in production
- No database schema information in errors
- Standardized error response format

**Code Requirements**:
```typescript
// Error handling pattern
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public userMessage: string, // Safe for client
    public details?: any // Logged only
  ) {
    super(message);
  }
}

// Error middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.error(err.message, { details: err.details, stack: err.stack });
    res.status(err.statusCode).json({ error: err.userMessage });
  } else {
    logger.error('Unhandled error', { error: err, stack: err.stack });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
```

---

## 3. Implementation Guidance for Web Applications

### 3.1 Secure Development Lifecycle

**Phase 1: Requirements**
- Identify security requirements early
- Define data classification levels
- Establish security acceptance criteria

**Phase 2: Design**
- Threat modeling (STRIDE methodology)
- Security architecture review
- Design patterns for common threats

**Phase 3: Implementation**
- Secure coding standards (this document)
- Code review checklist
- Static application security testing (SAST)

**Phase 4: Testing**
- Dynamic application security testing (DAST)
- Penetration testing
- Security regression testing

**Phase 5: Deployment**
- Security configuration hardening
- Automated security scanning
- Security monitoring setup

**Phase 6: Operations**
- Continuous monitoring
- Incident response procedures
- Regular security assessments

### 3.2 Secure Configuration Management

**Application Configuration**:
- No hardcoded secrets
- Environment-specific configurations
- Azure Key Vault for sensitive values
- Configuration change auditing

**Database Configuration**:
- Parameterized queries only (no string concatenation)
- Least privilege database accounts
- Encrypted connections (TLS)
- Connection string in Key Vault

**Code Example**:
```typescript
// WRONG: SQL injection vulnerability
const query = `SELECT * FROM vehicles WHERE vin = '${userInput}'`;

// CORRECT: Parameterized query
const query = 'SELECT * FROM vehicles WHERE vin = $1';
const result = await db.query(query, [userInput]);
```

### 3.3 Security Testing Requirements

**Pre-Deployment Testing**:
- SAST scan (ESLint security rules, Semgrep)
- DAST scan (OWASP ZAP)
- Dependency vulnerability scan (npm audit, Snyk)
- Secret scanning (git-secrets, TruffleHog)

**Ongoing Testing**:
- Weekly vulnerability scans
- Monthly penetration testing
- Quarterly security assessments
- Annual 3PAO assessment

---

## 4. Compliance and Monitoring

### 4.1 Continuous Monitoring Requirements

**Monthly Deliverables**:
- Continuous Monitoring Monthly Report
- POA&M (Plan of Action & Milestones)
- Incident reports
- Significant change requests

**Automated Monitoring**:
- Security alerts (Azure Sentinel)
- Vulnerability scanning results
- Compliance drift detection
- Configuration change tracking

### 4.2 Incident Response

**Incident Categories**:
- **Category 1**: Data breach, system compromise (1 hour response)
- **Category 2**: Service disruption, attempted breach (4 hour response)
- **Category 3**: Policy violation, suspicious activity (24 hour response)

**Response Procedures**:
1. Detection and analysis
2. Containment
3. Eradication
4. Recovery
5. Post-incident review
6. FedRAMP PMO notification (if applicable)

---

## 5. Documentation Requirements

**Required Documentation**:
- System Security Plan (SSP)
- Privacy Impact Assessment (PIA)
- Security Assessment Plan (SAP)
- Security Assessment Report (SAR)
- POA&M
- Incident Response Plan
- Configuration Management Plan
- Continuous Monitoring Plan

**Documentation Updates**:
- Review annually
- Update within 30 days of significant changes
- Version control all documentation

---

## 6. References

1. **NIST SP 800-53 Rev 5**: Security and Privacy Controls for Information Systems and Organizations
2. **FedRAMP Security Controls Baseline**: https://www.fedramp.gov/baselines/
3. **FedRAMP Templates**: https://www.fedramp.gov/templates/
4. **NIST SP 800-63B**: Digital Identity Guidelines - Authentication and Lifecycle Management
5. **NIST SP 800-171**: Protecting Controlled Unclassified Information
6. **FIPS 140-2**: Security Requirements for Cryptographic Modules
7. **CIS Controls**: Center for Internet Security Critical Security Controls

---

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | STANDARDS-001 | Initial baseline document |

---

**Document Classification**: Internal Use
**Next Review Date**: 2027-01-08
