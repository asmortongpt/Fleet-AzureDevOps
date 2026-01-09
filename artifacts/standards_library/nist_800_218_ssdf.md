# NIST SP 800-218: Secure Software Development Framework (SSDF)

## Overview

NIST Special Publication 800-218 describes the **Secure Software Development Framework (SSDF)**, a set of fundamental secure software development practices based on established secure software development practice documents. The SSDF is aligned with the **Executive Order 14028** on Improving the Nation's Cybersecurity.

**Purpose**: Reduce the number of vulnerabilities in released software, mitigate the impact of exploitation, and address the root causes of vulnerabilities.

---

## Four Core Practice Groups

### PO: Prepare the Organization
Define security requirements, roles, and processes throughout the SDLC.

### PS: Protect the Software
Protect all components from tampering and unauthorized access.

### PW: Produce Well-Secured Software
Produce well-secured software with minimal security vulnerabilities.

### RV: Respond to Vulnerabilities
Identify, respond to, and manage vulnerabilities in released software.

---

## PO: Prepare the Organization

### PO.1: Define Security Requirements for Software Development

**Objective**: Establish security requirements for all software development efforts.

**Implementation**:
1. **Define Security Standards**
   - Adopt OWASP ASVS Level 2 as minimum
   - Define coding standards (CERT C/C++, TypeScript ESLint security rules)
   - Require FedRAMP Moderate controls for federal systems

2. **Security Requirements in Stories/Epics**
   - Include security acceptance criteria in user stories
   - Example: "Authentication must use MFA and bcrypt password hashing"

3. **Threat Modeling**
   - Conduct threat modeling for all new features (STRIDE, PASTA, attack trees)
   - Update threat models on significant changes

4. **Data Classification**
   - Classify all data (public, internal, confidential, restricted)
   - Apply appropriate protections based on classification

**Checklist**:
- [ ] Security requirements documented and accessible to all developers
- [ ] Threat modeling template and process defined
- [ ] Data classification policy published
- [ ] Security requirements reviewed in sprint planning

---

### PO.2: Implement Roles and Responsibilities

**Objective**: Ensure personnel know their roles and responsibilities related to secure software development.

**Roles**:
- **Security Champion**: Developer trained in security, advocates for security in team
- **Security Architect**: Designs security controls, reviews architecture
- **AppSec Team**: Performs security testing, reviews findings, provides guidance
- **DevOps/SRE**: Implements security controls in infrastructure, monitors production
- **Product Owner**: Prioritizes security work, ensures compliance requirements met

**Responsibilities**:
- Developers: Write secure code, fix vulnerabilities, attend security training
- Security Champions: Participate in threat modeling, review PRs for security issues
- Security Architects: Approve architectural changes, define security patterns
- AppSec: Manage security tools, triage findings, provide remediation guidance

**Checklist**:
- [ ] Security roles documented in team charter
- [ ] At least one Security Champion per team
- [ ] Security responsibilities in job descriptions
- [ ] Escalation path for security issues defined

---

### PO.3: Implement Supporting Toolchains

**Objective**: Provide personnel with automated tools for secure development.

**Required Tools**:

1. **Static Application Security Testing (SAST)**
   - Tools: SonarQube, Semgrep, Checkmarx, Veracode
   - Run on every commit/PR
   - Block merges on high/critical findings

2. **Software Composition Analysis (SCA)**
   - Tools: Dependabot, Snyk, WhiteSource, Black Duck
   - Detect vulnerable dependencies
   - Alert on new CVEs in dependencies

3. **Dynamic Application Security Testing (DAST)**
   - Tools: OWASP ZAP, Burp Suite, Acunetix
   - Run against deployed environments (staging)
   - Detect runtime vulnerabilities

4. **Container Scanning**
   - Tools: Trivy, Clair, Anchore, Prisma Cloud
   - Scan container images for vulnerabilities
   - Block deployment of vulnerable images

5. **Secrets Scanning**
   - Tools: TruffleHog, GitGuardian, git-secrets
   - Detect hardcoded credentials in code
   - Prevent commits with secrets

6. **Interactive Application Security Testing (IAST)**
   - Tools: Contrast Security, Hdiv, Checkmarx IAST
   - Runtime instrumentation for vulnerability detection

7. **Code Review Tools**
   - GitHub/GitLab code review
   - Security-focused review checklist

**Checklist**:
- [ ] SAST tool integrated in CI/CD
- [ ] SCA tool scanning dependencies daily
- [ ] DAST tool scanning staging environment weekly
- [ ] Container scanning on image build
- [ ] Secrets scanning blocking commits
- [ ] Developers trained on interpreting tool findings

---

### PO.4: Define and Use Criteria for Software Security Checks

**Objective**: Establish clear criteria for security checks throughout SDLC.

**Security Gates**:

1. **Design Phase**
   - [ ] Threat model completed and reviewed
   - [ ] Security architecture approved by Security Architect
   - [ ] Data flows documented

2. **Development Phase**
   - [ ] Peer code review with security checklist
   - [ ] SAST scan passes (no high/critical)
   - [ ] Unit tests for security controls (authentication, authorization, input validation)

3. **Pre-Deployment Phase**
   - [ ] DAST scan passes (no high/critical unfixed)
   - [ ] Penetration testing completed (for major releases)
   - [ ] Security sign-off from AppSec team

4. **Production Deployment**
   - [ ] All dependencies up-to-date (no known high/critical CVEs)
   - [ ] Security configuration validated (TLS, headers, secrets management)
   - [ ] Monitoring and alerting configured

**Checklist**:
- [ ] Security gates documented and enforced
- [ ] Criteria for blocking deployment defined
- [ ] Exception process for security gate failures
- [ ] Metrics tracked (gate pass rate, time to fix)

---

### PO.5: Implement and Maintain Secure Environments

**Objective**: Ensure development, build, and production environments are secure.

**Environment Security**:

1. **Development Environment**
   - Encrypted laptops (BitLocker, FileVault)
   - Endpoint protection (EDR)
   - Require MFA for all developer accounts
   - Prohibit production data in development

2. **Build Environment (CI/CD)**
   - Isolated build agents (ephemeral, containerized)
   - Secrets stored in secure vault (Azure Key Vault, HashiCorp Vault)
   - Build artifacts signed and checksummed
   - Audit logs for all build pipeline activity

3. **Staging Environment**
   - Mirror production configuration
   - Use anonymized production data
   - Restrict access to authorized personnel
   - Deploy from same pipeline as production

4. **Production Environment**
   - Least privilege access (break-glass for emergencies)
   - Immutable infrastructure (no SSH to production)
   - Network segmentation (DMZ, app tier, data tier)
   - Web Application Firewall (WAF)

**Checklist**:
- [ ] All environments documented with security controls
- [ ] Secrets management solution in use (no hardcoded secrets)
- [ ] Build environment isolated and audited
- [ ] Production access restricted and logged

---

## PS: Protect the Software

### PS.1: Protect All Forms of Code from Unauthorized Access and Tampering

**Objective**: Ensure code integrity throughout development and deployment.

**Implementation**:

1. **Source Code Management**
   - Require authentication for repository access (MFA for write access)
   - Branch protection rules (require reviews, no force push to main)
   - Audit logs for all repository changes
   - Signed commits (GPG signatures)

2. **Access Control**
   - RBAC for repositories (developer, maintainer, admin)
   - Principle of least privilege
   - Remove access immediately on termination

3. **Code Signing**
   - Sign all build artifacts (binaries, containers, packages)
   - Verify signatures before deployment
   - Use hardware security modules (HSM) for signing keys

4. **Artifact Repository Security**
   - Private registries for internal artifacts (npm, Docker, Maven)
   - Authentication required for push/pull
   - Immutable tags (prevent overwrite)
   - Vulnerability scanning on storage

**Checklist**:
- [ ] Repository access requires MFA
- [ ] Branch protection enabled on main/production branches
- [ ] Code signing implemented for releases
- [ ] Artifact registry secured and scanned

---

### PS.2: Provide a Mechanism for Verifying Software Release Integrity

**Objective**: Enable verification that software has not been tampered with.

**Implementation**:

1. **Software Bill of Materials (SBOM)**
   - Generate SBOM for every release (CycloneDX, SPDX format)
   - Include all dependencies with versions and licenses
   - Publish SBOM alongside release

2. **Cryptographic Hashes**
   - Generate SHA-256 hash for every release artifact
   - Publish hashes on secure website or repository

3. **Digital Signatures**
   - Sign releases with code signing certificate
   - Provide public key for signature verification

4. **Provenance Records**
   - Document build process (inputs, build environment, tools used)
   - Use SLSA framework for provenance (https://slsa.dev)

**Example**:
```bash
# Generate SBOM
syft packages dir:. -o json > sbom.json

# Generate checksum
sha256sum fleet-app-v1.2.3.tar.gz > fleet-app-v1.2.3.tar.gz.sha256

# Sign release
gpg --detach-sign --armor fleet-app-v1.2.3.tar.gz

# Verify signature
gpg --verify fleet-app-v1.2.3.tar.gz.asc fleet-app-v1.2.3.tar.gz
```

**Checklist**:
- [ ] SBOM generated for every release
- [ ] SHA-256 checksums published
- [ ] Releases digitally signed
- [ ] Verification instructions provided to users

---

### PS.3: Archive and Protect Each Software Release

**Objective**: Maintain secure archives of all software releases.

**Implementation**:

1. **Release Archival**
   - Store all releases in version-controlled artifact repository
   - Include source code, binaries, SBOMs, signatures
   - Retain for minimum 3 years (longer for compliance)

2. **Access Control**
   - Read-only access for most personnel
   - Write access restricted to build automation
   - Audit all access to release archives

3. **Backup and Recovery**
   - Regular backups of artifact repository
   - Test restore procedures quarterly
   - Store backups in geographically separate location

4. **Immutability**
   - Prevent modification or deletion of archived releases
   - Use write-once storage if possible

**Checklist**:
- [ ] Artifact repository configured for all releases
- [ ] Access controls and audit logging enabled
- [ ] Backup and recovery procedures tested
- [ ] Retention policy documented and enforced

---

## PW: Produce Well-Secured Software

### PW.1: Design Software to Meet Security Requirements and Mitigate Security Risks

**Objective**: Incorporate security into design phase to prevent vulnerabilities.

**Implementation**:

1. **Threat Modeling**
   - Use STRIDE or PASTA methodology
   - Identify threats, vulnerabilities, and mitigations
   - Document in design documents or wiki
   - Review and update on significant changes

2. **Security Architecture Review**
   - Security Architect reviews all architectural changes
   - Approve authentication, authorization, encryption designs
   - Ensure defense in depth (multiple layers of security)

3. **Secure Design Patterns**
   - Use established secure patterns (OAuth 2.0, JWT, RBAC)
   - Avoid anti-patterns (session fixation, insecure direct object references)
   - Reference golden patterns library

4. **Privacy by Design**
   - Minimize data collection
   - Provide user control over data
   - Implement data retention and deletion

**Checklist**:
- [ ] Threat model completed for new features
- [ ] Security architecture review conducted
- [ ] Security requirements documented in design
- [ ] Privacy considerations addressed

---

### PW.2: Review the Software Design to Verify Compliance with Security Requirements

**Objective**: Ensure design meets security standards before implementation.

**Implementation**:

1. **Design Review Checklist**
   - Authentication and authorization mechanisms
   - Data protection (encryption, masking)
   - Input validation strategy
   - Error handling and logging
   - Secure communication protocols

2. **Review Participants**
   - Security Architect (required)
   - Security Champion (required)
   - Product Owner (optional)
   - Other engineers (peer review)

3. **Review Documentation**
   - Architecture diagrams
   - Data flow diagrams
   - Threat model
   - Security requirements traceability matrix

**Checklist**:
- [ ] Design review meeting scheduled
- [ ] Security Architect approval documented
- [ ] All security requirements addressed
- [ ] Threat model reviewed and approved

---

### PW.4: Reuse Existing, Well-Secured Software

**Objective**: Leverage secure, tested components rather than custom implementations.

**Implementation**:

1. **Use Framework Security Features**
   - Authentication: Use framework's built-in authentication (Passport.js, Spring Security)
   - Session management: Framework-provided session management
   - CSRF protection: Framework CSRF tokens
   - Input validation: Framework validators (express-validator, Joi)

2. **Vetted Libraries**
   - Use well-maintained, popular libraries
   - Check library security track record (CVE history)
   - Prefer libraries with active security teams

3. **Avoid Custom Crypto**
   - Never implement custom encryption algorithms
   - Use established crypto libraries (libsodium, Web Crypto API)
   - Follow NIST-approved algorithms

4. **Golden Patterns**
   - Maintain internal library of approved patterns
   - Authentication, authorization, data table, dashboard patterns
   - Code snippets and templates

**Checklist**:
- [ ] Framework security features used where available
- [ ] No custom crypto implementations
- [ ] All libraries vetted for security
- [ ] Golden patterns library available to developers

---

### PW.5: Create Source Code by Adhering to Secure Coding Practices

**Objective**: Write code that is free from common vulnerabilities.

**Secure Coding Practices**:

1. **Input Validation**
   - Validate all inputs (whitelist approach)
   - Validate type, length, format, range
   - Reject invalid input (do not attempt to sanitize malicious input)

2. **Output Encoding**
   - Encode output based on context (HTML, JavaScript, URL, SQL)
   - Use framework auto-escaping features

3. **Parameterized Queries**
   - Always use parameterized queries ($1, $2, $3) or ORMs
   - Never concatenate user input into SQL

4. **Authentication and Session Management**
   - Use framework session management
   - Regenerate session IDs on login and privilege change
   - Implement secure logout (invalidate server-side session)

5. **Access Control**
   - Check authorization on every request
   - Enforce least privilege
   - Default-deny policy

6. **Error Handling**
   - Generic error messages to users
   - Detailed errors logged server-side
   - Never expose stack traces or system information

7. **Cryptography**
   - Use TLS 1.2+ for data in transit
   - Use AES-256 for data at rest
   - Use bcrypt/argon2 for passwords (cost ≥ 12)

8. **File Operations**
   - Validate file types and sizes
   - Store uploads outside web root
   - Do not execute uploaded files

9. **Logging and Monitoring**
   - Log security-relevant events
   - Do not log sensitive data (passwords, tokens, PII)
   - Protect log files from modification

**Example (Node.js/Express)**:
```javascript
// Input Validation
const { body, validationResult } = require('express-validator');

app.post('/api/users',
  body('email').isEmail().normalizeEmail(),
  body('age').isInt({ min: 18, max: 120 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with validated input
  }
);

// Parameterized Query
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]  // Never: 'SELECT * FROM users WHERE email = "' + email + '"'
);

// Output Encoding (using template engine with auto-escaping)
res.render('profile', { username: user.name });  // Auto-escaped by EJS/Pug/etc.

// Access Control
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.get('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  // Only admins can access
});
```

**Checklist**:
- [ ] Coding standards documented and accessible
- [ ] Linters configured with security rules (ESLint security plugin)
- [ ] Code review checklist includes security items
- [ ] Developers trained on secure coding (annual minimum)

---

### PW.6: Configure Software to Have Secure Settings by Default

**Objective**: Ensure software is secure "out of the box" without requiring user configuration.

**Secure Defaults**:

1. **Authentication**
   - Require strong passwords by default (no weak defaults like "admin/admin")
   - MFA enabled or strongly encouraged
   - Session timeout configured (15 min idle, 8 hr absolute)

2. **Encryption**
   - TLS enabled by default (redirect HTTP to HTTPS)
   - Strong cipher suites only (disable weak ciphers)
   - HSTS header enabled

3. **Access Control**
   - Default-deny for all resources
   - No world-readable files or directories
   - Least privilege for service accounts

4. **Logging**
   - Audit logging enabled by default
   - Log all authentication events
   - Protect logs from modification

5. **Error Handling**
   - Generic error messages (no verbose errors in production)
   - Debug mode disabled by default

6. **Network**
   - Disable unnecessary services and ports
   - Firewall configured to allow only required traffic

**Configuration Checklist**:
- [ ] No default credentials (force password change on first login)
- [ ] TLS enabled with strong ciphers
- [ ] HSTS header configured
- [ ] Session timeouts configured
- [ ] Audit logging enabled
- [ ] Debug mode disabled in production
- [ ] Unnecessary services disabled

---

### PW.7: Review and/or Analyze Human-Readable Code to Identify Vulnerabilities

**Objective**: Find and fix vulnerabilities through code review and analysis.

**Code Review Process**:

1. **Peer Review**
   - All code reviewed by at least one other developer
   - Security Champion reviews security-critical code
   - Use code review checklist

2. **Security-Focused Review**
   - Input validation
   - SQL injection prevention
   - XSS prevention
   - Authentication and authorization
   - Cryptography usage
   - Error handling

3. **SAST Tools**
   - Run on every PR (SonarQube, Semgrep)
   - Require passing scan before merge
   - Triage and remediate findings

4. **Manual Security Review**
   - AppSec team reviews high-risk changes
   - Review before major releases

**Code Review Checklist**:
- [ ] All inputs validated
- [ ] Parameterized queries used (no SQL concatenation)
- [ ] Output properly encoded
- [ ] Authorization checked on all endpoints
- [ ] Sensitive data not logged
- [ ] Error messages sanitized
- [ ] Cryptography used correctly
- [ ] No hardcoded secrets

---

### PW.8: Test Executable Code to Identify Vulnerabilities

**Objective**: Identify vulnerabilities through testing before release.

**Testing Strategy**:

1. **Unit Tests**
   - Test authentication logic
   - Test authorization (RBAC)
   - Test input validation
   - Test error handling

2. **Integration Tests**
   - Test API endpoints with invalid inputs
   - Test authentication flows
   - Test session management

3. **DAST (Dynamic Application Security Testing)**
   - Run OWASP ZAP or Burp Suite against staging
   - Test for OWASP Top 10 vulnerabilities
   - Weekly scans minimum

4. **Penetration Testing**
   - Annual penetration test by third party
   - Before major releases or architectural changes
   - Remediate high/critical findings before release

5. **Vulnerability Scanning**
   - Scan dependencies with Snyk/Dependabot
   - Scan containers with Trivy
   - Daily scans, alert on new CVEs

**Testing Checklist**:
- [ ] Unit tests for security controls
- [ ] DAST scan passing (staging environment)
- [ ] Penetration test completed (annual)
- [ ] Vulnerability scan passing (no high/critical)
- [ ] All findings triaged and remediated

---

### PW.9: Configure Software to Have Secure Settings by Default

**Objective**: Ensure software is deployed with secure configurations.

**Deployment Configuration**:

1. **Environment Variables**
   - Store secrets in Azure Key Vault or equivalent
   - Never hardcode secrets in code or config files
   - Rotate secrets regularly

2. **Security Headers**
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy: default-src 'self'`
   - `Referrer-Policy: no-referrer`

3. **Cookie Settings**
   - `HttpOnly` flag (prevent JavaScript access)
   - `Secure` flag (HTTPS only)
   - `SameSite=Strict` or `SameSite=Lax` (CSRF protection)

4. **CORS Configuration**
   - Whitelist allowed origins (no `Access-Control-Allow-Origin: *`)
   - Restrict methods and headers

5. **Database Configuration**
   - Principle of least privilege for DB accounts
   - Encrypt connections (TLS)
   - Enable audit logging

**Checklist**:
- [ ] Secrets stored in vault (not in code)
- [ ] Security headers configured
- [ ] Cookie security flags set
- [ ] CORS properly restricted
- [ ] Database connections encrypted

---

## RV: Respond to Vulnerabilities

### RV.1: Identify and Confirm Vulnerabilities on an Ongoing Basis

**Objective**: Continuously monitor for new vulnerabilities in software and dependencies.

**Vulnerability Identification**:

1. **Dependency Scanning**
   - Automated daily scans (Dependabot, Snyk)
   - Alert on new CVEs in dependencies
   - Prioritize based on severity and exploitability

2. **Security Advisories**
   - Subscribe to US-CERT alerts
   - Monitor vendor security bulletins
   - Track CVEs relevant to tech stack

3. **Bug Bounty Program**
   - Consider bug bounty for public-facing applications
   - Reward researchers for responsible disclosure
   - Platforms: HackerOne, Bugcrowd

4. **Security Monitoring**
   - SIEM alerts on suspicious activity
   - IDS/IPS alerts
   - WAF logs

**Checklist**:
- [ ] Dependency scanning automated
- [ ] Security advisory subscriptions active
- [ ] Vulnerability disclosure process documented
- [ ] Security monitoring and alerting configured

---

### RV.2: Assess, Prioritize, and Remediate Vulnerabilities

**Objective**: Fix vulnerabilities in a timely manner based on risk.

**Vulnerability Management Process**:

1. **Assessment**
   - Confirm vulnerability (true positive vs. false positive)
   - Determine exploitability (CVSS score, exploit availability)
   - Assess impact (data exposure, system compromise)

2. **Prioritization**
   - **Critical**: Actively exploited, RCE, authentication bypass → 7 days
   - **High**: High CVSS score, easily exploitable → 30 days
   - **Medium**: Moderate CVSS, harder to exploit → 90 days
   - **Low**: Low CVSS, requires complex preconditions → Risk-based

3. **Remediation**
   - Update dependency to patched version
   - Apply vendor patch
   - Implement compensating controls (WAF rule, network restriction)
   - Refactor code to eliminate vulnerability

4. **Verification**
   - Retest to confirm fix
   - Run vulnerability scanner again
   - Update SBOM if dependencies changed

5. **Communication**
   - Notify stakeholders of high/critical vulnerabilities
   - Document remediation in ticket system
   - Update security advisories if customer-facing

**Checklist**:
- [ ] Vulnerability triage process documented
- [ ] SLAs defined (Critical: 7d, High: 30d, Medium: 90d)
- [ ] Remediation workflow integrated with ticketing system
- [ ] Verification testing performed
- [ ] Stakeholder communication plan

---

### RV.3: Analyze Vulnerabilities to Identify Root Causes

**Objective**: Prevent similar vulnerabilities in the future.

**Root Cause Analysis**:

1. **Post-Incident Review**
   - Conduct blameless postmortem for high/critical vulnerabilities
   - Identify how vulnerability was introduced
   - Determine why it was not caught earlier

2. **Pattern Recognition**
   - Track recurring vulnerability types (e.g., SQL injection, XSS)
   - Analyze common root causes (lack of input validation, outdated dependencies)

3. **Process Improvements**
   - Update secure coding guidelines
   - Add new test cases to prevent recurrence
   - Improve SAST/DAST rules
   - Enhance code review checklist
   - Additional developer training

4. **Metrics and Tracking**
   - Track vulnerabilities by type, severity, age
   - Measure mean time to remediation (MTTR)
   - Report trends to leadership

**Checklist**:
- [ ] Post-incident review conducted for high/critical vulnerabilities
- [ ] Root causes documented
- [ ] Process improvements identified and implemented
- [ ] Vulnerability metrics tracked and reviewed quarterly

---

## Supply Chain Security

### Dependency Management

**Best Practices**:

1. **Inventory Dependencies**
   - Generate SBOM for every release (CycloneDX, SPDX)
   - Track all direct and transitive dependencies
   - Document approved dependencies

2. **Vet Dependencies**
   - Check project health (active maintenance, community size)
   - Review security track record (CVE history)
   - Prefer projects with security policies and disclosure processes
   - Verify package integrity (checksums, signatures)

3. **Minimize Dependencies**
   - Only include necessary dependencies
   - Avoid "dependency bloat"
   - Regularly audit and remove unused dependencies

4. **Pin Versions**
   - Use exact version numbers (not `^` or `~` ranges)
   - Lock file committed to repository (package-lock.json, yarn.lock)
   - Review updates before applying

5. **Automated Updates**
   - Use Dependabot or Renovate for automated PRs
   - Review and test updates before merging
   - Prioritize security updates

6. **Private Registries**
   - Use private npm/Maven/Docker registries for internal packages
   - Scan packages before publishing
   - Restrict access to trusted publishers

**Checklist**:
- [ ] SBOM generated and published with releases
- [ ] Dependency vetting process documented
- [ ] Exact version pinning enforced
- [ ] Automated dependency updates configured
- [ ] Private registry for internal packages

---

### Secure Build Pipeline

**Build Pipeline Security**:

1. **Isolated Build Environment**
   - Ephemeral build agents (destroyed after build)
   - Containerized builds (Docker, Kubernetes)
   - No persistent state on build agents

2. **Access Control**
   - Restrict who can modify build pipeline
   - Require approval for pipeline changes
   - Audit all pipeline modifications

3. **Secrets Management**
   - Store secrets in vault (Azure Key Vault, HashiCorp Vault)
   - Inject secrets at runtime (not stored in code or pipeline definition)
   - Rotate secrets regularly

4. **Artifact Signing**
   - Sign all build artifacts (code signing certificate)
   - Store signing keys in HSM
   - Verify signatures before deployment

5. **Build Provenance**
   - Record build metadata (source commit, build time, builder identity)
   - Generate provenance attestations (SLSA)
   - Make provenance available for verification

6. **Dependency Resolution**
   - Resolve dependencies from trusted registries only
   - Verify dependency checksums
   - Use lock files for reproducible builds

7. **Security Scanning**
   - SAST scan in build pipeline
   - Dependency vulnerability scan
   - Container image scan
   - Fail build on high/critical findings

**Example (GitHub Actions)**:
```yaml
name: Secure Build Pipeline

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci  # Use ci for reproducible builds

      - name: Run SAST scan
        uses: github/codeql-action/analyze@v2

      - name: Check for vulnerabilities
        run: npm audit --audit-level=high

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Sign artifacts
        run: |
          echo "$SIGNING_KEY" | gpg --import
          gpg --detach-sign --armor dist/app.tar.gz
        env:
          SIGNING_KEY: ${{ secrets.GPG_SIGNING_KEY }}

      - name: Generate SBOM
        run: |
          npx @cyclonedx/cyclonedx-npm --output-file sbom.json

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            dist/
            sbom.json
            dist/app.tar.gz.asc
```

**Checklist**:
- [ ] Build environment isolated and ephemeral
- [ ] Build pipeline access controlled
- [ ] Secrets stored in vault
- [ ] Artifacts signed with code signing certificate
- [ ] Build provenance recorded
- [ ] Security scans integrated in pipeline
- [ ] Reproducible builds (lock files, pinned versions)

---

## References

- **NIST SP 800-218**: https://csrc.nist.gov/publications/detail/sp/800-218/final
- **SLSA Framework**: https://slsa.dev
- **OWASP SAMM**: https://owaspsamm.org
- **BSIMM**: https://www.bsimm.com
- **CycloneDX SBOM**: https://cyclonedx.org
- **SPDX SBOM**: https://spdx.dev

---

**Last Updated**: 2026-01-08
**Applicable To**: Fleet Management Application Secure SDLC
