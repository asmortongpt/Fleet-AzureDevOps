# Security Standards & Compliance Library

## 1. Compliance Frameworks

### 1.1 NIST SP 800-53 Rev 5 (Key Controls for Moderate/High)
*   **AC-2 (Account Management)**: Automated system account management, RBAC enforcement.
*   **AC-6 (Least Privilege)**: Users/processes only have access to what is necessary.
*   **AU-2 (Audit Events)**: Log all auth changes, privilege escalations, failed logins, data access.
*   **IA-2 (Identification and Authentication)**: MFA required for privileged access and all external access.
*   **SC-8 (Transmission Confidentiality)**: TLS 1.3 everywhere. Strong ciphers only.
*   **SI-2 (Flaw Remediation)**: Zero-day patching policy, auto-remediation of criticals.
*   **SI-4 (Information System Monitoring)**: Real-time intrusion detection and behavioral monitoring.

### 1.2 FedRAMP Baseline Requirements
*   **Boundaries**: Explicit authorization boundary definition.
*   **FIPS 140-3**: Use FIPS-validated crypto modules where applicable.
*   **Vulnerability Scanning**: Monthly OS/DB/Web scans. Zero High/Critical vulnerabilities allowed past 30 days.
*   **Incident Response**: Automated preparation, detection, analysis, containment within strict SLAs.

## 2. OWASP Standards

### 2.1 OWASP Top 10 (2025 Remediation)
1.  **Broken Access Control**: Enforce ownership checks on *every* object access (RBAC + Ownership).
2.  **Cryptographic Failures**: No plaintext secrets. Hash passwords with Argon2id.
3.  **Injection**: Use ORMs/Parameter binding strictly. No raw SQL string concatenation.
4.  **Insecure Design**: Threat modeling required for every feature.
5.  **Security Misconfiguration**: Hardened headers, disabled default accounts, locked down ports.

### 2.2 OWASP ASVS 4.0 (Level 2)
*   **Authentication**: rigorous session management, brute force protection.
*   **Input Validation**: White-list validation on all inputs. Sanitize output.
*   **Logging**: Centralized, immutable logs.

## 3. Secure Coding Practices
*   **CWE Top 25**: Actively avoid top 25 software errors (buffer overflows, cross-site scripting, etc.).
*   **Headers**:
    *   `Content-Security-Policy`: strict-dynamic or nonce-based.
    *   `Strict-Transport-Security`: max-age=31536000; includeSubDomains.
    *   `X-Content-Type-Options`: nosniff.
    *   `X-Frame-Options`: DENY.
*   **Cookies**: `Secure`, `HttpOnly`, `SameSite=Strict`.
*   **Secrets**: Never commit secrets. Use environment variables/Key Vault.

## 4. Infrastructure as Code (IaC) Security
*   **Least Privilege**: Service principals have minimal scopes.
*   **Network Security**: Private endpoints for all DBs/Key Vaults. No public internet access to DBs.
*   **Container Security**: Run as non-root user. Read-only root filesystem where possible.
