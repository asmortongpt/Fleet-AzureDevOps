# FedRAMP Moderate Baseline Requirements

## Overview

FedRAMP Moderate impact level applies to cloud systems that process, store, or transmit **moderate-sensitivity** federal data. Loss of confidentiality, integrity, or availability could have a **serious adverse effect** on organizational operations, assets, or individuals.

**Baseline**: NIST 800-53 Rev 5 Moderate baseline (325 controls across 20 families)

---

## Key Control Families

### Access Control (AC)

**AC-1: Access Control Policy and Procedures**
- Document and disseminate access control policies
- Review and update annually

**AC-2: Account Management**
- Define authorized users and access privileges
- Implement account creation, modification, and termination procedures
- Review accounts quarterly (minimum)
- Disable inactive accounts after 90 days

**AC-3: Access Enforcement**
- Enforce approved authorizations for logical access
- Implement Role-Based Access Control (RBAC)
- Default-deny policy

**AC-4: Information Flow Enforcement**
- Control information flows between security domains
- Implement network segmentation

**AC-6: Least Privilege**
- Grant only minimum privileges necessary
- Separate admin functions from user functions
- Restrict privileged accounts

**AC-7: Unsuccessful Logon Attempts**
- Lock accounts after 3 consecutive failed attempts
- Lockout duration: 15 minutes minimum or until admin reset

**AC-8: System Use Notification**
- Display system use notification banner before granting access
- Retain consent acknowledgment

**AC-11: Session Lock**
- Automatic session lock after 15 minutes of inactivity
- Require re-authentication

**AC-12: Session Termination**
- Automatic session termination after defined period
- Clear session tokens on logout

**AC-17: Remote Access**
- Encrypt all remote access sessions
- Require multi-factor authentication (MFA)
- Monitor and control remote access

**AC-20: Use of External Information Systems**
- Control external system connections
- Implement security controls for external access

---

### Audit and Accountability (AU)

**AU-1: Audit and Accountability Policy**
- Document audit requirements and procedures

**AU-2: Audit Events**
- Define auditable events (logins, access to sensitive data, privilege escalation, admin actions)
- Coordinate with incident response

**AU-3: Content of Audit Records**
- Capture: timestamp, user ID, event type, outcome, source/destination
- Include correlation identifiers

**AU-4: Audit Storage Capacity**
- Allocate sufficient storage
- Alert when 75% threshold reached

**AU-5: Response to Audit Processing Failures**
- Alert admins on audit failure
- Override actions or halt system if critical

**AU-6: Audit Review, Analysis, and Reporting**
- Review logs weekly (minimum)
- Use automated tools (SIEM)
- Report findings to security team

**AU-7: Audit Reduction and Report Generation**
- Provide on-demand audit reports
- Support filtering, searching, sorting

**AU-8: Time Stamps**
- Use synchronized system clocks (NTP)
- Granularity: at least 1 second

**AU-9: Protection of Audit Information**
- Restrict access to audit logs (read-only for most users)
- Prevent modification or deletion
- Implement tamper-evident logs

**AU-11: Audit Record Retention**
- Retain audit logs for minimum 90 days online
- Archive for 1 year minimum (3 years recommended)

**AU-12: Audit Generation**
- Enable auditing by default
- Ensure all required events are captured

---

### Configuration Management (CM)

**CM-1: Configuration Management Policy**
- Document CM policies and procedures

**CM-2: Baseline Configuration**
- Develop, document, and maintain secure baseline configurations
- Review and update baselines annually

**CM-3: Configuration Change Control**
- Require approval for all changes
- Test changes in non-production
- Document rollback procedures

**CM-4: Security Impact Analysis**
- Analyze security impact before implementing changes

**CM-5: Access Restrictions for Change**
- Limit who can make configuration changes
- Enforce separation of duties

**CM-6: Configuration Settings**
- Use security configuration checklists (CIS benchmarks, STIGs)
- Document deviations from baselines

**CM-7: Least Functionality**
- Disable unnecessary services, ports, protocols
- Remove or disable unused software

**CM-8: Information System Component Inventory**
- Maintain accurate inventory of all system components
- Update inventory on changes

**CM-10: Software Usage Restrictions**
- License tracking and compliance
- Prohibit unauthorized software

**CM-11: User-Installed Software**
- Restrict users from installing software
- Whitelist approach for approved software

---

### Identification and Authentication (IA)

**IA-1: Identification and Authentication Policy**
- Document IA policies and procedures

**IA-2: Identification and Authentication (Organizational Users)**
- Require unique user IDs
- **IA-2(1)**: Multi-Factor Authentication (MFA) for network access
- **IA-2(2)**: MFA for privileged accounts (mandatory)
- **IA-2(8)**: Replay-resistant authentication

**IA-4: Identifier Management**
- Unique user identifiers
- Do not reuse identifiers for 2 years

**IA-5: Authenticator Management**
- **Passwords**: Minimum 12 characters, complexity requirements
- **IA-5(1)**: Encrypt passwords in transit and at rest (bcrypt/argon2, cost ≥ 12)
- **IA-5(4)**: Automated support for password strength
- **IA-5(7)**: No embedded unencrypted static credentials
- **IA-5(11)**: Hardware token-based authentication for high-risk access

**IA-6: Authenticator Feedback**
- Obscure password feedback during entry (masking)

**IA-7: Cryptographic Module Authentication**
- FIPS 140-2 validated crypto modules

**IA-8: Identification and Authentication (Non-Organizational Users)**
- Authenticate external users (PIV, federated identity)

**IA-11: Re-authentication**
- Require re-authentication for privilege escalation or after session lock

---

### System and Communications Protection (SC)

**SC-1: System and Communications Protection Policy**
- Document SC policies and procedures

**SC-5: Denial of Service Protection**
- Implement rate limiting, load balancing, DDoS mitigation

**SC-7: Boundary Protection**
- **SC-7(4)**: External telecommunications services
- **SC-7(5)**: Deny by default, allow by exception
- **SC-7(7)**: Split tunneling prevention for remote access
- Implement firewalls, DMZ architecture

**SC-8: Transmission Confidentiality and Integrity**
- **SC-8(1)**: Encrypt data in transit (TLS 1.2+, HTTPS)
- Prevent downgrade attacks

**SC-12: Cryptographic Key Establishment and Management**
- NIST-approved key management (FIPS 140-2)
- Automated key rotation

**SC-13: Cryptographic Protection**
- Use NIST-approved algorithms (AES-256, RSA 2048+, SHA-256+)
- FIPS 140-2 Level 1 minimum

**SC-17: Public Key Infrastructure Certificates**
- Use DoD PKI or approved CA
- Certificate validation and revocation checking

**SC-28: Protection of Information at Rest**
- **SC-28(1)**: Encrypt sensitive data at rest (AES-256)
- Full disk encryption, database encryption

---

### System and Information Integrity (SI)

**SI-1: System and Information Integrity Policy**
- Document SI policies and procedures

**SI-2: Flaw Remediation**
- Patch critical vulnerabilities within 30 days
- Patch high vulnerabilities within 90 days
- Test patches before deployment

**SI-3: Malicious Code Protection**
- Deploy anti-malware on endpoints and servers
- Update signatures daily
- Scan on file access, download, execution

**SI-4: Information System Monitoring**
- **SI-4(2)**: Automated tools (IDS/IPS, SIEM)
- **SI-4(4)**: Monitor for inbound/outbound communications
- **SI-4(5)**: Alert on security anomalies

**SI-5: Security Alerts, Advisories, and Directives**
- Subscribe to US-CERT alerts
- Disseminate to relevant personnel

**SI-6: Security Function Verification**
- Verify security functions operate correctly
- Automated testing in CI/CD

**SI-7: Software, Firmware, and Information Integrity**
- **SI-7(1)**: Integrity checking (checksums, digital signatures)
- **SI-7(7)**: Detect unauthorized changes to software

**SI-10: Information Input Validation**
- Validate ALL user inputs (whitelist approach)
- Prevent injection attacks (SQL, XSS, command injection)

**SI-11: Error Handling**
- Generate error messages that provide necessary info without revealing sensitive data
- Log detailed errors server-side only

**SI-12: Information Handling and Retention**
- Classify data and handle according to classification
- Implement retention schedules

**SI-16: Memory Protection**
- ASLR, DEP/NX bit, stack canaries
- Prevent buffer overflows

---

## Encryption Requirements

### Data in Transit
- **Minimum**: TLS 1.2 (TLS 1.3 preferred)
- **Ciphers**: FIPS 140-2 approved (e.g., AES-GCM)
- **Certificates**: Valid, trusted CA, no self-signed in production
- **HSTS**: Enforce HTTPS with Strict-Transport-Security header

### Data at Rest
- **Algorithm**: AES-256 (FIPS 140-2 validated)
- **Scope**: Databases, file storage, backups, logs containing sensitive data
- **Key Management**: Azure Key Vault, AWS KMS, or equivalent FIPS 140-2 Level 1+
- **Key Rotation**: Automated, annual minimum (quarterly recommended)

### Password Storage
- **Algorithm**: bcrypt (cost ≥ 12) or argon2id
- **Salting**: Unique per-user salt (automatic with bcrypt/argon2)
- **Never**: Plaintext, MD5, SHA-1, reversible encryption

---

## Session Management Requirements

### Session Creation
- Generate cryptographically strong session IDs (128+ bits entropy)
- Use framework-provided session management (never custom)
- Set session ID on login, regenerate on privilege escalation

### Session Security
- **HttpOnly**: Prevent JavaScript access to session cookies
- **Secure**: Transmit cookies over HTTPS only
- **SameSite**: Set to `Strict` or `Lax` to prevent CSRF
- **Path**: Restrict to minimum necessary path

### Session Timeout
- **Idle timeout**: 15 minutes maximum (AC-11)
- **Absolute timeout**: 8 hours maximum (AC-12)
- **Re-authentication**: Required after timeout or for sensitive actions

### Session Termination
- Invalidate server-side session on logout
- Clear session tokens from client
- Prevent session fixation and session hijacking

---

## Role-Based Access Control (RBAC) Expectations

### Principle of Least Privilege
- Users granted minimum access required for job function
- Separate roles for read vs. write operations
- Separate admin roles from user roles

### Role Definition
- **User**: Standard application access
- **Manager**: User + approval workflows, team management
- **Admin**: System configuration, user management
- **Auditor**: Read-only access to all data and logs
- **API Service**: Machine-to-machine authentication

### Role Assignment
- Documented approval process for role grants
- Regular access reviews (quarterly minimum)
- Automatic removal on termination or role change

### Privilege Escalation
- Require re-authentication for admin actions
- Time-limited elevated access (Just-In-Time)
- Log all privilege escalation events

### Enforcement
- Enforce at API layer (not just UI)
- Default-deny: explicit grants required
- Validate on every request (stateless where possible)

---

## Compliance Checklist

### Authentication & Authorization
- [ ] MFA enabled for all users
- [ ] MFA mandatory for privileged accounts
- [ ] Password policy: 12+ chars, complexity, bcrypt/argon2 cost ≥ 12
- [ ] Account lockout: 3 failed attempts, 15 min lockout
- [ ] Session timeout: 15 min idle, 8 hr absolute
- [ ] RBAC implemented with least privilege
- [ ] Regular access reviews (quarterly)

### Audit & Logging
- [ ] Log all authentication events (success/failure)
- [ ] Log all access to sensitive data
- [ ] Log all privilege escalation
- [ ] Log all admin actions
- [ ] Audit records contain: timestamp, user, event, outcome, source
- [ ] Logs protected from modification (tamper-evident)
- [ ] Log retention: 90 days online, 1 year archive
- [ ] Weekly log review process

### Encryption
- [ ] TLS 1.2+ for all data in transit
- [ ] HSTS header enabled
- [ ] AES-256 encryption for data at rest
- [ ] Passwords hashed with bcrypt (cost ≥ 12) or argon2
- [ ] FIPS 140-2 validated crypto modules
- [ ] Key management via Azure Key Vault or equivalent
- [ ] Automated key rotation

### Session Management
- [ ] Cryptographically strong session IDs
- [ ] HttpOnly flag on session cookies
- [ ] Secure flag on session cookies
- [ ] SameSite=Strict or Lax on cookies
- [ ] Session regeneration on login and privilege change
- [ ] Server-side session invalidation on logout

### Input Validation & Integrity
- [ ] All inputs validated (whitelist approach)
- [ ] Parameterized queries only ($1, $2, $3)
- [ ] No string concatenation in SQL
- [ ] Output encoding for XSS prevention
- [ ] Error messages sanitized (no sensitive data)
- [ ] File upload validation (type, size, content)

### Configuration Management
- [ ] Secure baseline configurations documented
- [ ] Change control process implemented
- [ ] Disable unnecessary services/ports
- [ ] Remove or disable unused software
- [ ] Configuration drift detection
- [ ] Quarterly baseline reviews

### Vulnerability Management
- [ ] Critical patches within 30 days
- [ ] High patches within 90 days
- [ ] Automated vulnerability scanning
- [ ] Dependency scanning in CI/CD
- [ ] Security testing before deployment

### Incident Response
- [ ] Incident response plan documented
- [ ] Security alerts automated (IDS/IPS, SIEM)
- [ ] Subscribe to US-CERT alerts
- [ ] Incident response drills (annual minimum)
- [ ] Post-incident reviews and lessons learned

---

## References

- **FedRAMP**: https://www.fedramp.gov/
- **NIST SP 800-53 Rev 5**: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- **FedRAMP Moderate Baseline**: https://www.fedramp.gov/assets/resources/documents/FedRAMP_Security_Controls_Baseline.xlsx
- **FIPS 140-2**: https://csrc.nist.gov/publications/detail/fips/140/2/final

---

**Last Updated**: 2026-01-08
**Applicable To**: Fleet Management Application (FedRAMP Moderate)
