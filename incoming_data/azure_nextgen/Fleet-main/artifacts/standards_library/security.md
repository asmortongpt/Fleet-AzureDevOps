# Security Standards & Compliance Library

## 1. Compliance Frameworks

### FedRAMP (Moderate/High Baseline) & NIST 800-53 Rev 5
The system must meet the following control families at a minimum.

#### AC - Access Control
- **AC-2**: Account Management - automated onboarding/offboarding, role-based access.
- **AC-3**: Access Enforcement - RBAC enforced at API and UI layers.
- **AC-7**: Unsuccessful Logon Attempts - Lockout after 3 failed attempts (15 mins).
- **AC-8**: System Use Notification - Legal banners on login.
- **AC-12**: Session Termination - Auto-logout after inactivity (15 mins high / 30 mins mod).

#### AU - Audit and Accountability
- **AU-2**: Audit Events - Log all successful/failed logins, privilege changes, data modifications.
- **AU-3**: Content of Audit Records - User ID, Timestamp, Event Type, Source IP, Outcome.
- **AU-6**: Audit Review, Analysis, and Reporting - Centralized logging (SIEM ready).

#### SC - System and Communication Protection
- **SC-8**: Transmission Confidentiality and Integrity - TLS 1.3 for all data in transit.
- **SC-28**: Protection of Information at Rest - AES-256 encryption for database and backups.

#### SI - System and Information Integrity
- **SI-2**: Flaw Remediation - Patch vulnerabilities within mandated timeframes (Crit: 15d, High: 30d).
- **SI-10**: Information Input Validation - Sanitize all inputs (prevent XSS, SQLi).

### OWASP ASVS 4.0 (Level 2)
1. **Architecture**: Verify security controls are centralized.
2. **Authentication**: Enforce MFA, NIST 800-63B password rules.
3. **Session Management**: HttpOnly/Secure cookies, random session IDs.
4. **Access Control**: IDOR prevention, force RBAC checks on every object access.
5. **Input Validation**: Canonicalize and validate data at the trust boundary.
6. **Cryptography**: Use strong algorithms (Argon2id for passwords).

---

## 2. Secure Coding Practices (CWE Top 25 Prevention)

### 1. Broken Access Control (CWE-284)
- **Deny by Default**: APIs must reject requests without explicit permission.
- **Ownership Checks**: Ensure `user_id` in request matches the resource owner.

### 2. Injection (CWE-78, CWE-89)
- **SQL**: Use parameterized queries (ORM/QueryBuilder) ONLY. No raw SQL concatenation.
- **Command**: Avoid `exec()` or passing user input to shell commands.

### 3. Cryptographic Failures (CWE-310)
- **Secrets**: Never commit secrets to code. Use `.env` and Key Vaults.
- **Randomness**: Use `crypto.randomBytes` not `Math.random` for security.

---

## 3. Web Platform Security

### Secure Headers
All responses must include:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```

### Cookie Policy
All cookies (auth/session) must set:
- `Secure` (HTTPS only)
- `HttpOnly` (No JS access)
- `SameSite=Strict` (Prevent CSRF)
