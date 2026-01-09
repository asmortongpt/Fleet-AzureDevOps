# NIST 800-53 Rev 5 Control Families

## Overview

NIST Special Publication 800-53 provides a comprehensive catalog of security and privacy controls for federal information systems and organizations. This document focuses on the six key control families most critical to application security for FedRAMP Moderate compliance.

---

## Access Control (AC) Family

### Purpose
Limit information system access to authorized users, processes acting on behalf of authorized users, or devices, and to limit the types of transactions and functions that authorized users are permitted to execute.

### Key Controls

#### AC-1: Access Control Policy and Procedures
**Control**: Develop, document, disseminate, review, and update access control policies and procedures.

**Implementation**:
- Document who can access what, under what circumstances
- Define approval workflows for access requests
- Annual policy review minimum
- Designate responsible personnel

---

#### AC-2: Account Management
**Control**: Manage information system accounts including establishment, activation, modification, review, disablement, and removal.

**Implementation Requirements**:
1. **Account Types**: Identify and document (individual, group, system, guest, temporary)
2. **Account Creation**: Require manager approval
3. **Account Conditions**: Define prerequisites for account grants
4. **Account Attributes**: Document access authorizations
5. **Account Review**: Quarterly minimum for all accounts
6. **Inactive Accounts**: Disable after 90 days of inactivity
7. **Account Termination**: Disable within 24 hours of termination notice
8. **Shared Accounts**: Prohibit (exception: service accounts with documented justification)
9. **Privileged Accounts**: Separate from standard user accounts

**Enhancements**:
- **AC-2(1)**: Automated account management (create, enable, modify, disable, remove)
- **AC-2(2)**: Remove temporary and emergency accounts automatically
- **AC-2(3)**: Disable accounts after 90 days inactivity
- **AC-2(4)**: Automated audit actions (account creation, modification, enabling, disabling)
- **AC-2(5)**: Automatically log out users after 15 minutes inactivity
- **AC-2(7)**: Establish privileged user accounts in accordance with role-based scheme
- **AC-2(9)**: Restrict use of shared/group accounts
- **AC-2(11)**: Define usage conditions for accounts
- **AC-2(12)**: Monitor accounts for atypical usage

---

#### AC-3: Access Enforcement
**Control**: Enforce approved authorizations for logical access to information and system resources.

**Implementation**:
- Implement mandatory access control, discretionary access control, or role-based access control
- Default-deny: explicit grants required
- Enforce at all system layers (UI, API, database)
- Validate authorization on every request

**Enhancements**:
- **AC-3(7)**: Role-based access control
- **AC-3(8)**: Revoke access authorizations when not needed
- **AC-3(10)**: Audited override of access control mechanisms

---

#### AC-4: Information Flow Enforcement
**Control**: Enforce approved authorizations for controlling the flow of information within the system and between interconnected systems.

**Implementation**:
- Network segmentation (DMZ, internal zones)
- Firewall rules (default-deny)
- Data loss prevention (DLP)
- Cross-domain guards for classified data

---

#### AC-5: Separation of Duties
**Control**: Separate duties of individuals to prevent malevolent activity without collusion.

**Implementation Examples**:
- Separate development from production deployment
- Separate code committer from code approver
- Separate security administrator from system administrator
- Require two-person rule for critical operations

---

#### AC-6: Least Privilege
**Control**: Employ the principle of least privilege, allowing only authorized accesses for users.

**Implementation**:
- Grant minimum privileges necessary for job function
- Separate privileged functions from non-privileged
- Regularly review and reduce excessive privileges

**Enhancements**:
- **AC-6(1)**: Explicitly authorize access to security functions
- **AC-6(2)**: Require privileged users to use non-privileged accounts for non-privileged functions
- **AC-6(5)**: Restrict privileged accounts to specific domains/roles
- **AC-6(9)**: Log use of privileged functions
- **AC-6(10)**: Prohibit non-privileged users from executing privileged functions

---

#### AC-7: Unsuccessful Logon Attempts
**Control**: Enforce a limit on consecutive invalid logon attempts by a user.

**Requirements**:
- **Threshold**: Lock account after 3 consecutive failed attempts
- **Duration**: 15 minutes minimum OR until administrator unlocks
- **Scope**: Apply to all authentication methods (password, MFA)
- **Notification**: Alert security team on lockout

**Implementation**:
```javascript
// Example: Track failed attempts
if (failedAttempts >= 3) {
  lockAccount(userId, duration: 15 * 60 * 1000); // 15 minutes
  auditLog.write('ACCOUNT_LOCKED', { userId, reason: 'Excessive failed logins' });
  securityTeam.alert('Account locked', { userId, ipAddress });
}
```

---

#### AC-8: System Use Notification
**Control**: Display system use notification message or banner before granting access.

**Requirements**:
- Display before authentication
- Include privacy and monitoring notice
- Require acknowledgment before proceeding
- Retain consent records

**Example Banner**:
```
AUTHORIZED USE ONLY
This system is for authorized use only. All activity is monitored and recorded.
Unauthorized access is prohibited and may be subject to criminal prosecution.
By continuing, you consent to these terms.
```

---

#### AC-11: Session Lock
**Control**: Prevent further access to the system by initiating a session lock after a defined period of inactivity.

**Requirements**:
- **Timeout**: 15 minutes of inactivity maximum
- **Re-authentication**: Required to unlock
- **Scope**: All sessions (web, mobile, API)

---

#### AC-12: Session Termination
**Control**: Automatically terminate a user session after defined conditions or trigger events.

**Implementation**:
- **Idle timeout**: 15 minutes
- **Absolute timeout**: 8 hours
- **Logout action**: Invalidate server-side session and clear client tokens
- **Triggers**: User logout, privilege de-escalation, session end

---

#### AC-17: Remote Access
**Control**: Establish and document usage restrictions, configuration requirements, and implementation guidance for remote access.

**Requirements**:
- **Encryption**: All remote access encrypted (TLS 1.2+, VPN)
- **MFA**: Mandatory for all remote access
- **Monitoring**: Log all remote connections
- **Authorization**: Document approved remote access methods

---

#### AC-20: Use of External Information Systems
**Control**: Establish terms and conditions for authorized individuals to access the information system from external systems.

**Implementation**:
- Define approved external systems (BYOD policy)
- Require security controls on external devices
- Prohibit storage of sensitive data on unapproved devices

---

## Audit and Accountability (AU) Family

### Purpose
Create, protect, and retain information system audit records to enable monitoring, analysis, investigation, and reporting of unlawful, unauthorized, or inappropriate system activity.

### Key Controls

#### AU-1: Audit and Accountability Policy and Procedures
**Control**: Develop, document, disseminate, review, and update audit policies.

---

#### AU-2: Audit Events
**Control**: Determine which events the system is capable of auditing and specify which events require auditing.

**Required Auditable Events**:
1. **Authentication**: Login success/failure, logout, MFA events
2. **Authorization**: Access denials, privilege escalation
3. **Data Access**: Read/write/delete of sensitive data
4. **Configuration Changes**: System settings, user permissions, security policies
5. **Administrative Actions**: User creation/modification/deletion, role assignments
6. **Security Events**: Malware detection, intrusion attempts, firewall blocks
7. **Application Events**: Errors, exceptions, crashes
8. **Data Export**: Downloads, API calls, reports generated

**Enhancements**:
- **AU-2(3)**: Reviews and updates to auditable events
- **AU-2(4)**: Privileged user actions (all actions by admins)

---

#### AU-3: Content of Audit Records
**Control**: Ensure audit records contain sufficient information to establish what occurred.

**Required Fields**:
1. **Timestamp**: ISO 8601 format with timezone (e.g., 2026-01-08T14:23:11Z)
2. **Event Type**: Login, access, modification, deletion, etc.
3. **Event Outcome**: Success or failure
4. **User ID**: Who performed the action
5. **Source**: IP address, device ID, geographic location
6. **Object**: What was accessed or modified
7. **Session ID**: Correlation identifier
8. **Additional Context**: Request parameters, changes made

**Example Log Entry**:
```json
{
  "timestamp": "2026-01-08T14:23:11Z",
  "eventType": "DATA_ACCESS",
  "outcome": "SUCCESS",
  "userId": "jsmith@example.com",
  "userRole": "Fleet Manager",
  "sourceIP": "10.0.1.50",
  "sessionId": "sess_a1b2c3d4e5f6",
  "resource": "/api/vehicles/12345",
  "action": "READ",
  "objectId": "vehicle-12345",
  "additionalInfo": {
    "userAgent": "Mozilla/5.0...",
    "requestId": "req_xyz789"
  }
}
```

**Enhancements**:
- **AU-3(1)**: Additional audit information (process ID, user full name)
- **AU-3(2)**: Centralized management and configuration

---

#### AU-4: Audit Storage Capacity
**Control**: Allocate audit record storage capacity and configure auditing to reduce likelihood of capacity being exceeded.

**Requirements**:
- Plan for 90 days of online storage minimum
- Alert when 75% capacity reached
- Automated log rotation and archival
- Prevent loss of audit data (circular logging prohibited for critical events)

---

#### AU-5: Response to Audit Processing Failures
**Control**: Alert personnel and take additional actions in event of audit processing failure.

**Implementation**:
- **Alert**: Immediate notification to security team
- **Action**: Halt system (if critical), override to allow operations (if acceptable), switch to backup logging
- **Monitoring**: Real-time health checks on logging infrastructure

---

#### AU-6: Audit Review, Analysis, and Reporting
**Control**: Review and analyze information system audit records for indications of inappropriate or unusual activity.

**Requirements**:
- **Frequency**: Weekly minimum (daily for high-risk systems)
- **Tools**: SIEM, automated anomaly detection
- **Reporting**: Findings reported to security team
- **Investigation**: Escalate suspicious activity

**Enhancements**:
- **AU-6(1)**: Automated process integration (SIEM correlation)
- **AU-6(3)**: Correlate audit repositories across organization
- **AU-6(4)**: Central review and analysis
- **AU-6(5)**: Integrate analysis with vulnerability scanning
- **AU-6(6)**: Correlation with physical access monitoring

---

#### AU-7: Audit Reduction and Report Generation
**Control**: Provide audit reduction and report generation capability that supports on-demand audit review, analysis, and reporting.

**Features**:
- Search and filter logs by user, time, event type, outcome
- Aggregate reports (login attempts by user, failed access by resource)
- Export to CSV, PDF, SIEM formats
- Ad-hoc query interface

**Enhancements**:
- **AU-7(1)**: Automatic processing (scheduled reports)
- **AU-7(2)**: Automatic sort and search

---

#### AU-8: Time Stamps
**Control**: Use internal system clocks to generate time stamps for audit records.

**Requirements**:
- **Synchronization**: NTP to authoritative time source
- **Granularity**: 1 second minimum
- **Format**: ISO 8601 with UTC timezone
- **Protection**: Restrict ability to modify system time

**Enhancements**:
- **AU-8(1)**: Synchronization with authoritative time source (NTP servers)
- **AU-8(2)**: Secondary authoritative time source

---

#### AU-9: Protection of Audit Information
**Control**: Protect audit information and audit tools from unauthorized access, modification, and deletion.

**Implementation**:
- **Access Control**: Read-only for most users, write-only for system
- **Encryption**: Encrypt logs at rest and in transit
- **Integrity**: Cryptographic hashing, write-once media
- **Separation**: Store logs on separate system from application

**Enhancements**:
- **AU-9(2)**: Backup audit records weekly to different system/media
- **AU-9(3)**: Cryptographic protection (digital signatures, blockchain)
- **AU-9(4)**: Access by subset of privileged users only

---

#### AU-10: Non-Repudiation
**Control**: Protect against an individual falsely denying having performed a particular action.

**Implementation**:
- Digital signatures on critical transactions
- Cryptographically signed audit logs
- Timestamp authority integration

---

#### AU-11: Audit Record Retention
**Control**: Retain audit records for defined time period to provide support for after-the-fact investigations.

**Requirements**:
- **Online**: 90 days minimum
- **Archive**: 1 year minimum (3 years recommended for compliance)
- **Legal Hold**: Retain indefinitely if litigation or investigation
- **Secure Deletion**: Sanitize after retention period

---

#### AU-12: Audit Generation
**Control**: Provide audit record generation capability for the auditable events.

**Requirements**:
- Logging enabled by default (no manual configuration required)
- Cannot be disabled by non-privileged users
- Centralized logging infrastructure
- Fail-secure: if logging fails, alert and potentially halt operations

**Enhancements**:
- **AU-12(1)**: Compile audit records from multiple sources
- **AU-12(3)**: Changes by authorized individuals only

---

## Configuration Management (CM) Family

### Purpose
Establish and maintain baseline configurations and inventories of organizational information systems throughout the respective system development life cycles.

### Key Controls

#### CM-1: Configuration Management Policy and Procedures
**Control**: Develop, document, disseminate CM policies and procedures.

---

#### CM-2: Baseline Configuration
**Control**: Develop, document, and maintain current baseline configurations of the information system.

**Requirements**:
- Document secure baseline (OS hardening, service configuration, network settings)
- Use industry standards (CIS Benchmarks, DISA STIGs)
- Review and update baselines annually
- Version control all baseline documents

**Enhancements**:
- **CM-2(1)**: Reviews and updates (automated drift detection)
- **CM-2(2)**: Automation support for accuracy/currency
- **CM-2(3)**: Retention of previous configurations
- **CM-2(7)**: Configure systems to provide only essential capabilities

---

#### CM-3: Configuration Change Control
**Control**: Determine types of changes that are configuration-controlled, review and approve configuration changes, and document change implementation.

**Change Control Process**:
1. **Request**: Documented change request with business justification
2. **Review**: Security impact analysis
3. **Approval**: Change advisory board (CAB) or designated approver
4. **Testing**: Test in non-production environment
5. **Implementation**: Deploy during maintenance window
6. **Verification**: Confirm successful deployment
7. **Documentation**: Update configuration documentation
8. **Rollback**: Documented rollback procedure

**Enhancements**:
- **CM-3(2)**: Test, validate, document changes before production
- **CM-3(4)**: Security representative approval for changes
- **CM-3(6)**: Cryptography management

---

#### CM-4: Security Impact Analysis
**Control**: Analyze changes to the information system to determine potential security impacts prior to change implementation.

**Analysis Includes**:
- Threat modeling of new features
- Impact on existing security controls
- New vulnerabilities introduced
- Compliance implications

---

#### CM-5: Access Restrictions for Change
**Control**: Define, document, approve, and enforce physical and logical access restrictions associated with changes.

**Implementation**:
- Separate development, staging, production environments
- Restrict production access to authorized change agents
- Enforce separation of duties (developer ≠ approver)
- Audit all changes to production

---

#### CM-6: Configuration Settings
**Control**: Establish and document configuration settings for IT products employed within the information system.

**Implementation**:
- Use security configuration checklists (CIS, STIG, OWASP)
- Document deviations from baseline with justification
- Automate configuration enforcement (Ansible, Terraform)
- Regularly scan for configuration drift

**Enhancements**:
- **CM-6(1)**: Automated central management
- **CM-6(2)**: Respond to unauthorized changes (alert, revert)

---

#### CM-7: Least Functionality
**Control**: Configure the information system to provide only essential capabilities.

**Implementation**:
- Disable unnecessary services (telnet, FTP, SMBv1)
- Remove unnecessary software and packages
- Close unnecessary ports
- Disable unnecessary protocols
- Prohibit unauthorized software installation

**Enhancements**:
- **CM-7(1)**: Periodic review (quarterly)
- **CM-7(2)**: Prevent program execution from prohibited locations
- **CM-7(4)**: Unauthorized software (whitelist approach)
- **CM-7(5)**: Authorized software inventory

---

#### CM-8: Information System Component Inventory
**Control**: Develop and document an inventory of information system components.

**Inventory Includes**:
- Hardware (servers, network devices, endpoints)
- Software (OS, applications, libraries, dependencies)
- Licenses and ownership
- Network addresses
- Responsible personnel

**Enhancements**:
- **CM-8(1)**: Updates during installations/removals
- **CM-8(3)**: Automated unauthorized component detection
- **CM-8(5)**: No duplicate accounting of components

---

#### CM-9: Configuration Management Plan
**Control**: Develop, document, and implement a configuration management plan.

**Plan Includes**:
- Roles and responsibilities
- Configuration item identification
- Change control process
- Baseline management
- Audit procedures

---

#### CM-10: Software Usage Restrictions
**Control**: Use software and associated documentation in accordance with contract agreements and copyright laws.

**Implementation**:
- License tracking and compliance monitoring
- Regular license audits
- Prohibit use of pirated or unlicensed software

---

#### CM-11: User-Installed Software
**Control**: Establish policies governing the installation of software by users.

**Implementation**:
- **Default**: Prohibit user software installation
- **Whitelist**: Approved software catalog
- **Approval**: Manager approval for exceptions
- **Monitoring**: Detect and remove unauthorized software

---

## Identification and Authentication (IA) Family

### Purpose
Verify the identities of users, processes, or devices, as a prerequisite to allowing access to organizational information systems.

### Key Controls

#### IA-1: Identification and Authentication Policy and Procedures
**Control**: Develop, document, disseminate IA policies and procedures.

---

#### IA-2: Identification and Authentication (Organizational Users)
**Control**: Uniquely identify and authenticate organizational users.

**Requirements**:
- Unique user identifiers (no shared accounts except documented service accounts)
- Strong authentication for all access

**Enhancements**:
- **IA-2(1)**: Multi-factor authentication (MFA) for network access
- **IA-2(2)**: MFA for privileged accounts (MANDATORY)
- **IA-2(5)**: Group authentication (prohibit shared credentials)
- **IA-2(8)**: Replay-resistant authentication (nonces, timestamps)
- **IA-2(11)**: Remote access uses separate credentials from local access
- **IA-2(12)**: PIV credentials accepted

---

#### IA-3: Device Identification and Authentication
**Control**: Uniquely identify and authenticate devices before establishing connection.

**Implementation**:
- Device certificates (X.509)
- Hardware tokens (TPM, HSM)
- MAC address whitelisting (with limitations)

---

#### IA-4: Identifier Management
**Control**: Manage information system identifiers by receiving authorization, selecting, assigning, preventing reuse, and disabling.

**Requirements**:
- Unique identifiers per user
- Do not reuse identifiers for 2 years
- Disable identifiers for terminated users immediately
- Prevent identifier reuse for service accounts

---

#### IA-5: Authenticator Management
**Control**: Manage information system authenticators including establishment, distribution, storage, and revocation.

**Password Requirements**:
- **Length**: Minimum 12 characters (15+ recommended)
- **Complexity**: Mix of uppercase, lowercase, numbers, special characters
- **History**: Prevent reuse of last 24 passwords
- **Maximum Age**: 60 days (or longer with MFA)
- **Minimum Age**: 1 day
- **Hashing**: bcrypt (cost ≥ 12) or argon2id

**Enhancements**:
- **IA-5(1)**: Password-based authentication (encryption in transit/rest, complexity enforcement)
- **IA-5(2)**: PKI-based authentication (certificate validation)
- **IA-5(4)**: Automated support for password strength determination
- **IA-5(6)**: Protect authenticators commensurate with security category
- **IA-5(7)**: No embedded unencrypted static authenticators (no hardcoded passwords)
- **IA-5(11)**: Hardware token-based authentication for high-risk

---

#### IA-6: Authenticator Feedback
**Control**: Obscure feedback of authentication information during the authentication process.

**Implementation**:
- Mask password fields (••••••)
- Do not display MFA codes in plain text (or only briefly)
- Avoid revealing which field is incorrect on failure

---

#### IA-7: Cryptographic Module Authentication
**Control**: Implement mechanisms for authentication to a cryptographic module that meet FIPS 140-2 requirements.

**Implementation**:
- Use FIPS 140-2 validated crypto libraries
- Hardware security modules (HSMs) for key storage

---

#### IA-8: Identification and Authentication (Non-Organizational Users)
**Control**: Uniquely identify and authenticate non-organizational users.

**Implementation**:
- Federated identity (SAML, OAuth 2.0, OpenID Connect)
- PIV/CAC for federal users
- Third-party identity providers (Azure AD, Okta)

**Enhancements**:
- **IA-8(1)**: PIV credentials accepted
- **IA-8(2)**: FICAM-approved credentials accepted
- **IA-8(4)**: Federated credential management

---

#### IA-9: Service Identification and Authentication
**Control**: Uniquely identify and authenticate services before establishing communications.

**Implementation**:
- API keys, OAuth client credentials
- Mutual TLS (mTLS) for service-to-service
- Service accounts with strong credentials

---

#### IA-10: Adaptive Identification and Authentication
**Control**: Require additional authentication factors based on risk.

**Implementation**:
- Increase authentication requirements for high-risk actions
- Geolocation-based challenges
- Device fingerprinting

---

#### IA-11: Re-Authentication
**Control**: Require users to re-authenticate when specific circumstances or situations require re-authentication.

**Triggers**:
- Session lock unlock
- Privilege escalation (sudo, admin panel)
- Access to highly sensitive data
- Configurable time intervals

---

## System and Communications Protection (SC) Family

### Purpose
Monitor, control, and protect organizational communications at external and internal system boundaries.

### Key Controls

#### SC-1: System and Communications Protection Policy
**Control**: Develop, document, disseminate SC policies and procedures.

---

#### SC-5: Denial of Service Protection
**Control**: Protect against or limit the effects of denial of service attacks.

**Implementation**:
- Rate limiting (API throttling)
- Load balancing and auto-scaling
- DDoS mitigation services (Cloudflare, AWS Shield)
- Resource limits (connection limits, memory limits)

**Enhancements**:
- **SC-5(2)**: Excess capacity, bandwidth, redundancy
- **SC-5(3)**: Detection/monitoring tools

---

#### SC-7: Boundary Protection
**Control**: Monitor and control communications at external boundary and key internal boundaries.

**Implementation**:
- Firewalls (stateful inspection)
- DMZ architecture (public, application, database tiers)
- Web Application Firewall (WAF)
- Network segmentation (VLANs)

**Enhancements**:
- **SC-7(4)**: External telecommunications services
- **SC-7(5)**: Deny by default, allow by exception (whitelist firewall rules)
- **SC-7(7)**: Prevent split tunneling for remote access VPN
- **SC-7(8)**: Route traffic to authenticated proxy servers
- **SC-7(10)**: Prevent unauthorized exfiltration
- **SC-7(12)**: Host-based boundary protection (host firewalls)
- **SC-7(18)**: Fail secure (if firewall fails, block all traffic)

---

#### SC-8: Transmission Confidentiality and Integrity
**Control**: Protect the confidentiality and integrity of transmitted information.

**Implementation**:
- **Encryption**: TLS 1.2+ for all data in transit
- **Certificate Validation**: Verify server certificates
- **Perfect Forward Secrecy**: Use ephemeral key exchange (ECDHE)
- **VPN**: IPsec or WireGuard for site-to-site

**Enhancements**:
- **SC-8(1)**: Cryptographic protection (mandatory for FedRAMP Moderate)
- **SC-8(2)**: Pre/post transmission handling (encrypt before send, decrypt after receive)

---

#### SC-12: Cryptographic Key Establishment and Management
**Control**: Establish and manage cryptographic keys for cryptography employed within the system.

**Implementation**:
- **Key Generation**: FIPS 140-2 approved RNGs
- **Key Distribution**: Secure channels (TLS, HSM)
- **Key Storage**: Azure Key Vault, AWS KMS, HSM
- **Key Rotation**: Automated, annual minimum (quarterly recommended)
- **Key Destruction**: Secure erasure when no longer needed

**Enhancements**:
- **SC-12(2)**: Symmetric keys produced/controlled by FIPS-validated key management
- **SC-12(3)**: Asymmetric keys produced/controlled by approved PKI or NSA-approved key management

---

#### SC-13: Cryptographic Protection
**Control**: Implement FIPS-validated or NSA-approved cryptography.

**Approved Algorithms**:
- **Symmetric**: AES-128, AES-256
- **Asymmetric**: RSA (2048-bit+), ECDSA (P-256+)
- **Hashing**: SHA-256, SHA-384, SHA-512
- **Key Exchange**: Diffie-Hellman (2048-bit+), ECDH (P-256+)

**Prohibited**:
- DES, 3DES, RC4, MD5, SHA-1 (for security purposes)

**FIPS 140-2 Compliance**:
- Use FIPS 140-2 Level 1 minimum validated cryptographic modules
- OpenSSL (FIPS mode), Microsoft CNG, Bouncy Castle FIPS

---

#### SC-15: Collaborative Computing Devices
**Control**: Prohibit remote activation of collaborative computing devices.

**Implementation**:
- Disable microphone/camera when not in use
- Require explicit user action to activate
- Visual indicators when active

---

#### SC-17: Public Key Infrastructure Certificates
**Control**: Issue public key certificates under an approved certificate policy or obtain public key certificates from an approved service provider.

**Implementation**:
- Use DoD PKI for federal systems
- Commercial CA (DigiCert, Let's Encrypt) for public-facing
- Validate certificates on every connection
- Implement certificate revocation checking (CRL, OCSP)

---

#### SC-20: Secure Name/Address Resolution Service (Authoritative Source)
**Control**: Provide additional data origin authentication and integrity verification artifacts along with authoritative name resolution data.

**Implementation**:
- DNSSEC for authoritative DNS
- Validate DNSSEC signatures on resolution

---

#### SC-23: Session Authenticity
**Control**: Protect the authenticity of communications sessions.

**Implementation**:
- Cryptographically strong session identifiers
- Session binding to IP address (optional, may impact mobility)
- Session regeneration on privilege change

---

#### SC-28: Protection of Information at Rest
**Control**: Protect the confidentiality and integrity of information at rest.

**Implementation**:
- **Database Encryption**: AES-256 (Transparent Data Encryption)
- **File Storage**: AES-256 encryption (server-side or client-side)
- **Full Disk Encryption**: BitLocker, LUKS, FileVault
- **Backups**: Encrypt all backups

**Enhancements**:
- **SC-28(1)**: Cryptographic protection (MANDATORY for FedRAMP Moderate)
- **SC-28(2)**: Off-line storage (encryption for removable media)

---

## System and Information Integrity (SI) Family

### Purpose
Identify, report, and correct information and information system flaws in a timely manner, and provide protection from malicious code at appropriate locations within organizational information systems.

### Key Controls

#### SI-1: System and Information Integrity Policy
**Control**: Develop, document, disseminate SI policies and procedures.

---

#### SI-2: Flaw Remediation
**Control**: Identify, report, and correct information system flaws.

**Requirements**:
- **Critical Vulnerabilities**: Patch within 30 days
- **High Vulnerabilities**: Patch within 90 days
- **Medium/Low**: Risk-based prioritization
- **Testing**: Test patches in non-production before deployment
- **Verification**: Confirm successful remediation

**Enhancements**:
- **SI-2(2)**: Automated flaw remediation status (vulnerability scanning)
- **SI-2(3)**: Time to remediate flaws/benchmarks (track SLAs)

---

#### SI-3: Malicious Code Protection
**Control**: Implement malicious code protection mechanisms.

**Implementation**:
- **Anti-malware**: Deploy on all endpoints, servers, email gateways
- **Signature Updates**: Daily minimum (real-time preferred)
- **Scanning**: On access, on download, on execution, scheduled scans
- **Quarantine**: Isolate detected malware
- **Alerts**: Notify security team on detection

**Enhancements**:
- **SI-3(1)**: Centralized management
- **SI-3(2)**: Automatic updates
- **SI-3(4)**: Updates only from approved sources

---

#### SI-4: Information System Monitoring
**Control**: Monitor the information system to detect attacks, unauthorized connections, and activity.

**Monitoring Tools**:
- **IDS/IPS**: Network-based and host-based intrusion detection/prevention
- **SIEM**: Centralized log aggregation and correlation
- **File Integrity Monitoring**: Detect unauthorized file changes
- **Network Traffic Analysis**: Anomaly detection

**Enhancements**:
- **SI-4(2)**: Automated tools for real-time analysis
- **SI-4(4)**: Inbound and outbound communications traffic
- **SI-4(5)**: Alert on indicators of compromise (IoC)
- **SI-4(7)**: Automated response to suspicious events
- **SI-4(12)**: Automated alerts on security events
- **SI-4(16)**: Correlate monitoring information
- **SI-4(23)**: Host-based devices (EDR)

---

#### SI-5: Security Alerts, Advisories, and Directives
**Control**: Receive information system security alerts, advisories, and directives on an ongoing basis.

**Sources**:
- US-CERT alerts (https://www.cisa.gov/uscert/)
- Vendor security bulletins
- NIST National Vulnerability Database (NVD)
- Industry threat intelligence feeds

**Process**:
- Subscribe to relevant feeds
- Disseminate to responsible personnel
- Implement directives within required timeframes

---

#### SI-6: Security Function Verification
**Control**: Verify the correct operation of security functions.

**Implementation**:
- Automated security testing in CI/CD
- Penetration testing (annual minimum)
- Vulnerability scanning (weekly)
- Security control testing (per NIST 800-53A)

---

#### SI-7: Software, Firmware, and Information Integrity
**Control**: Employ integrity verification tools to detect unauthorized changes.

**Implementation**:
- **Code Signing**: Sign all software releases
- **Checksum Verification**: SHA-256 hashes for downloads
- **File Integrity Monitoring**: Tripwire, OSSEC, AIDE
- **Immutable Infrastructure**: Treat servers as immutable

**Enhancements**:
- **SI-7(1)**: Integrity checks (automated, on startup, periodically)
- **SI-7(2)**: Automated notifications on integrity violations
- **SI-7(5)**: Automated response to integrity violations
- **SI-7(7)**: Integration of detection and response
- **SI-7(14)**: Binary or machine-executable code from unverified sources (prohibit)

---

#### SI-8: Spam Protection
**Control**: Employ spam protection mechanisms at entry and exit points.

**Implementation**:
- Email filtering (anti-spam, anti-phishing)
- SPF, DKIM, DMARC configuration
- User reporting mechanisms

---

#### SI-10: Information Input Validation
**Control**: Check the validity of information inputs.

**Implementation**:
- **Whitelist Approach**: Define allowed input patterns
- **Type Validation**: Ensure correct data types
- **Length Validation**: Enforce maximum lengths
- **Range Validation**: Numeric ranges, date ranges
- **Format Validation**: Regex for emails, phone numbers, etc.
- **Encoding Validation**: Prevent double-encoding attacks
- **Sanitization**: Remove/escape dangerous characters

**Example**:
```javascript
// Validate email (whitelist approach)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
if (!emailRegex.test(userInput)) {
  throw new ValidationError('Invalid email format');
}

// Parameterized query (prevent SQL injection)
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [sanitizedEmail]  // Never concatenate!
);
```

---

#### SI-11: Error Handling
**Control**: Generate error messages that provide necessary information without revealing sensitive data.

**Implementation**:
- **User-Facing Errors**: Generic messages ("Invalid username or password")
- **Server-Side Logs**: Detailed error information
- **Stack Traces**: Never expose to users (log server-side only)
- **Database Errors**: Never expose raw DB errors to users

**Example**:
```javascript
try {
  const user = await authenticateUser(username, password);
} catch (error) {
  logger.error('Authentication failed', { username, error: error.stack });
  return res.status(401).json({ error: 'Invalid credentials' }); // Generic message
}
```

---

#### SI-12: Information Handling and Retention
**Control**: Handle and retain information within the system and information output from the system in accordance with applicable laws, regulations, and organizational policies.

**Implementation**:
- Data classification (public, internal, confidential, restricted)
- Handling procedures per classification
- Retention schedules
- Secure disposal (data sanitization, physical destruction)

---

#### SI-16: Memory Protection
**Control**: Implement safeguards to protect system memory from unauthorized code execution.

**Implementation**:
- **ASLR**: Address Space Layout Randomization
- **DEP/NX**: Data Execution Prevention / No-Execute bit
- **Stack Canaries**: Detect buffer overflows
- **Heap Protection**: Prevent heap overflows
- **Compiler Flags**: Enable all security features (-fstack-protector, -D_FORTIFY_SOURCE, etc.)

---

## Quick Reference Table

| Family | Abbreviation | Key Focus | Critical Controls |
|--------|--------------|-----------|-------------------|
| Access Control | AC | Who can access what | AC-2, AC-3, AC-6, AC-7, AC-11, AC-17 |
| Audit and Accountability | AU | Logging and monitoring | AU-2, AU-3, AU-6, AU-9, AU-11, AU-12 |
| Configuration Management | CM | Baselines and change control | CM-2, CM-3, CM-6, CM-7, CM-8 |
| Identification and Authentication | IA | Identity verification | IA-2, IA-5, IA-8, IA-11 |
| System and Communications Protection | SC | Encryption and network security | SC-7, SC-8, SC-12, SC-13, SC-28 |
| System and Information Integrity | SI | Vulnerability and malware protection | SI-2, SI-3, SI-4, SI-7, SI-10, SI-11 |

---

## References

- **NIST SP 800-53 Rev 5**: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- **NIST SP 800-53A Rev 5**: Security and Privacy Controls Assessment (how to test controls)
- **NIST SP 800-53B**: Control Baselines for Information Systems and Organizations
- **FedRAMP Baselines**: https://www.fedramp.gov/assets/resources/documents/FedRAMP_Security_Controls_Baseline.xlsx

---

**Last Updated**: 2026-01-08
**Applicable To**: Fleet Management Application (FedRAMP Moderate)
