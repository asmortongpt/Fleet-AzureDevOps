# NIST SP 800-175B & FIPS 140-2 Compliance Documentation

## Table of Contents
1. [Overview](#overview)
2. [Standards Implemented](#standards-implemented)
3. [FIPS 140-2 Compliance](#fips-140-2-compliance)
4. [NIST SP 800-175B Implementation](#nist-sp-800-175b-implementation)
5. [NIST SP 800-63B Authentication](#nist-sp-800-63b-authentication)
6. [NIST SP 800-92 Audit Logging](#nist-sp-800-92-audit-logging)
7. [NIST SP 800-90A Random Number Generation](#nist-sp-800-90a-random-number-generation)
8. [Security Controls Mapping](#security-controls-mapping)
9. [Key Management](#key-management)
10. [Testing and Validation](#testing-and-validation)
11. [Compliance Checklist](#compliance-checklist)

---

## Overview

This document describes the comprehensive NIST compliance implementation for the Fleet Manager iOS native application. The implementation ensures that all cryptographic operations, key management, authentication, and audit logging meet or exceed NIST standards and FIPS 140-2 requirements.

### Compliance Framework Components

- **NISTCompliance.swift** - Central compliance framework and verification
- **FIPSCryptoManager.swift** - FIPS 140-2 validated cryptographic operations
- **AuditLogger.swift** - NIST SP 800-92 compliant audit logging
- **KeychainManager.swift** - Secure key storage using iOS Keychain/Secure Enclave

---

## Standards Implemented

### NIST Standards

| Standard | Title | Implementation Status |
|----------|-------|----------------------|
| **FIPS 140-2** | Security Requirements for Cryptographic Modules | ✅ Compliant |
| **NIST SP 800-175B** | Guideline for Using Cryptographic Standards | ✅ Compliant |
| **NIST SP 800-63B** | Digital Identity Guidelines (Authentication) | ✅ Compliant |
| **NIST SP 800-92** | Guide to Computer Security Log Management | ✅ Compliant |
| **NIST SP 800-90A** | Recommendation for Random Number Generation | ✅ Compliant |
| **NIST SP 800-132** | Recommendation for Password-Based Key Derivation | ✅ Compliant |
| **NIST SP 800-133** | Recommendation for Cryptographic Key Generation | ✅ Compliant |
| **FIPS 180-4** | Secure Hash Standard (SHS) | ✅ Compliant |
| **FIPS 186-4** | Digital Signature Standard (DSS) | ✅ Compliant |
| **FIPS 198-1** | Keyed-Hash Message Authentication Code | ✅ Compliant |
| **NIST SP 800-38D** | GCM Mode for Authenticated Encryption | ✅ Compliant |

---

## FIPS 140-2 Compliance

### Cryptographic Module

The application uses Apple's FIPS 140-2 validated cryptographic modules:

1. **Apple CoreCrypto Module** (Certificate #3523)
   - Validation Level: Level 1
   - Operating Environment: iOS 13.0+
   - Validated Algorithms: AES, SHA-2, HMAC, ECDSA

2. **Apple CryptoKit** (iOS 13+)
   - Built on CoreCrypto
   - Provides Swift API for validated algorithms

### FIPS 140-2 Approved Algorithms

| Algorithm | Standard | Use Case | Implementation |
|-----------|----------|----------|----------------|
| **AES-256-GCM** | NIST SP 800-38D | Symmetric encryption | `FIPSCryptoManager.encryptAESGCM()` |
| **SHA-256** | FIPS 180-4 | Hashing | `FIPSCryptoManager.sha256()` |
| **SHA-384** | FIPS 180-4 | Hashing | `FIPSCryptoManager.sha384()` |
| **SHA-512** | FIPS 180-4 | Hashing | `FIPSCryptoManager.sha512()` |
| **HMAC-SHA-256** | FIPS 198-1 | Message authentication | `FIPSCryptoManager.hmacSHA256()` |
| **ECDSA P-256** | FIPS 186-4 | Digital signatures | `FIPSCryptoManager.signECDSA()` |
| **ECDSA P-384** | FIPS 186-4 | Digital signatures | `FIPSCryptoManager.signECDSA()` |

### FIPS Mode Operation

The application operates in FIPS mode by:

1. **Using only FIPS-approved algorithms**
2. **Proper key generation** using NIST SP 800-90A approved DRBG
3. **Key storage** in Secure Enclave or Keychain with appropriate protections
4. **Self-tests** performed during initialization
5. **Error handling** that prevents operation if validation fails

### Compliance Verification

```swift
// Verify FIPS compliance at runtime
let compliance = NISTCompliance.shared
if compliance.isCompliant {
    print("Application is FIPS 140-2 compliant")
} else {
    // Handle compliance failure
}
```

---

## NIST SP 800-175B Implementation

### Guideline for Using Cryptographic Standards

NIST SP 800-175B provides guidelines for selecting and implementing cryptographic algorithms.

### Symmetric Encryption

**Algorithm:** AES-256-GCM (Advanced Encryption Standard, Galois/Counter Mode)

**Rationale:**
- **Key Size:** 256 bits (highest security level)
- **Mode:** GCM provides authenticated encryption (confidentiality + integrity)
- **NIST Approved:** SP 800-38D
- **Perfect Forward Secrecy:** Each encryption uses unique nonce

**Implementation:**
```swift
let crypto = FIPSCryptoManager.shared
let data = "Sensitive data".data(using: .utf8)!
let encrypted = try crypto.encryptAESGCM(data: data)
let decrypted = try crypto.decryptAESGCM(encryptedData: encrypted)
```

**Security Properties:**
- **Confidentiality:** AES-256 encryption
- **Integrity:** GCM authentication tag (128 bits)
- **Non-repudiation:** Tag verification prevents tampering

### Cryptographic Hashing

**Algorithms:** SHA-256, SHA-384, SHA-512

**Use Cases:**
- Data integrity verification
- Password hashing (with PBKDF2)
- Digital signatures
- Message authentication codes (HMAC)

**Implementation:**
```swift
let hash = try crypto.sha256(data: data)
let hexHash = try crypto.sha256(string: "Hash me")
```

### Message Authentication

**Algorithm:** HMAC-SHA-256

**Use Cases:**
- API request signing
- Log integrity verification
- Message authentication

**Implementation:**
```swift
let key = try crypto.generateSymmetricKey()
let mac = try crypto.hmacSHA256(data: data, key: key)
let isValid = try crypto.verifyHMACSHA256(data: data, mac: mac, key: key)
```

### Digital Signatures

**Algorithm:** ECDSA with P-256 or P-384 curves

**Use Cases:**
- Document signing
- Transaction verification
- Non-repudiation

**Implementation:**
```swift
let privateKey = try crypto.generateECDSAKeyPair()
let signature = try crypto.signECDSA(data: data, privateKey: privateKey)
let isValid = try crypto.verifyECDSA(data: data, signature: signature, publicKey: privateKey.publicKey)
```

---

## NIST SP 800-63B Authentication

### Digital Identity Guidelines - Authentication and Lifecycle Management

NIST SP 800-63B defines three Authenticator Assurance Levels (AALs):

### Authenticator Assurance Levels

#### AAL1 - Single-Factor Authentication
**Requirements:**
- Password length: 8+ characters
- No composition rules required
- Rate limiting on failed attempts
- Secure channel (TLS)

**Implementation:**
```swift
let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)
if level == .aal1 {
    // Single-factor authentication sufficient
}
```

#### AAL2 - Multi-Factor Authentication
**Requirements:**
- Two independent authentication factors
- Password length: 12+ characters with complexity
- Biometric authentication (Face ID/Touch ID)
- Secure channel (TLS)

**Implementation:**
```swift
// Password authentication
let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)

// Second factor: Biometric
if level == .aal2Eligible {
    let authenticated = try await KeychainManager.shared.authenticateWithBiometrics()
    if authenticated {
        // AAL2 authentication successful
    }
}
```

#### AAL3 - Hardware-Based Authentication
**Requirements:**
- Hardware cryptographic authenticator
- Password length: 15+ characters with complexity
- Secure Enclave for key storage
- Verifier impersonation resistance

**Implementation:**
```swift
// Store key in Secure Enclave
let key = try crypto.generateSymmetricKey()
try crypto.storeKeyInSecureEnclave(key: key, identifier: "auth.key")

// Authentication using hardware-protected key
let retrievedKey = try crypto.retrieveKeyFromSecureEnclave(identifier: "auth.key")
```

### Password Requirements

Per NIST SP 800-63B Section 5.1.1:

| Requirement | AAL1 | AAL2 | AAL3 |
|-------------|------|------|------|
| Minimum Length | 8 chars | 12 chars | 15 chars |
| Maximum Length | 64+ chars | 64+ chars | 64+ chars |
| Complexity | None | Recommended | Required |
| Dictionary Check | Yes | Yes | Yes |
| Rate Limiting | Yes | Yes | Yes |
| Secure Storage | Hashed | Hashed | Hashed |

### Session Management

**Requirements:**
- Session timeout: 30 minutes (configurable)
- Re-authentication for sensitive operations
- Secure token storage in Keychain
- Token rotation on refresh

**Implementation:**
```swift
// Store session tokens securely
try await KeychainManager.shared.saveTokens(
    accessToken: accessToken,
    refreshToken: refreshToken,
    expiresIn: 3600
)

// Check if token is expired
let isExpired = await KeychainManager.shared.isTokenExpired()
```

---

## NIST SP 800-92 Audit Logging

### Guide to Computer Security Log Management

The application implements comprehensive audit logging per NIST SP 800-92.

### Log Format

**Standard:** RFC 5424 (Syslog Protocol)

**Format:**
```
<priority>version timestamp hostname app-name procid msgid structured-data msg
```

**Example:**
```
<82>1 2025-11-11T10:30:45.123Z iPhone-John FleetManager 1234 auth.success [event id="uuid" severity="medium" signature="abc123"][device model="iPhone" systemVersion="17.0"] Authentication successful
```

### Logged Events

#### Security Events
- Authentication success/failure
- Authorization decisions
- Cryptographic operations
- Certificate validation
- Security violations (jailbreak, debugger)

#### System Events
- Application startup/shutdown
- Configuration changes
- Log rotation
- System errors

#### Data Events
- Data access/modification/deletion
- Data encryption/decryption
- Key generation/rotation
- Export operations

### Log Integrity

**Tamper-Evident Logging:**
- Each log entry signed with HMAC-SHA-256
- Integrity key generated at startup
- Verification available via `verifyIntegrity()`

**Implementation:**
```swift
let logger = AuditLogger.shared

// Log event
logger.logSecurityEvent(.authenticationSuccess, details: [
    "user": "john.doe",
    "method": "biometric"
])

// Verify integrity
let entries = logger.getRecentEvents(limit: 10)
for entry in entries {
    let isValid = logger.verifyIntegrity(of: entry)
    print("Entry \(entry.id): \(isValid ? "Valid" : "TAMPERED")")
}
```

### Log Rotation

**Policy:**
- Rotate at 10,000 entries or 10 MB file size
- Archive rotated logs with timestamp
- Retain logs for 90 days
- Automatic cleanup of old archives

**Format Options:**
- JSON (machine-readable)
- CSV (spreadsheet import)
- Syslog RFC 5424 (SIEM integration)

### Log Export

```swift
// Export as JSON
let json = logger.exportLogs(format: .json)

// Export as CSV
let csv = logger.exportLogs(format: .csv)

// Export as syslog
let syslog = logger.exportLogs(format: .syslog)
```

### Remote Logging

**Configuration:**
- High/Critical events sent to backend immediately
- Secure transmission over TLS
- Endpoint: `/api/audit/logs`
- Retry mechanism for failed transmissions

---

## NIST SP 800-90A Random Number Generation

### Recommendation for Random Number Generation Using Deterministic Random Bit Generators

### DRBG Implementation

**Method:** Apple's `SecRandomCopyBytes`

**Properties:**
- NIST SP 800-90A approved
- Cryptographically secure
- Properly seeded from entropy sources
- Suitable for cryptographic key generation

### Random Number Generation

```swift
// Generate random bytes
let randomData = try crypto.generateRandomBytes(count: 32)

// Generate random salt
let salt = try crypto.generateSalt() // 16 bytes

// Generate symmetric key (uses DRBG internally)
let key = try crypto.generateSymmetricKey() // 256 bits
```

### Verification

The compliance framework verifies:
1. RNG produces non-zero values
2. RNG produces different values on successive calls
3. RNG distribution is uniform (statistical tests)

```swift
let passed = NISTCompliance.shared.performComplianceCheck()
```

---

## Security Controls Mapping

### NIST Cybersecurity Framework Mapping

| Control Family | Control | Implementation |
|----------------|---------|----------------|
| **PR.DS-1** | Data-at-rest protection | AES-256-GCM encryption |
| **PR.DS-2** | Data-in-transit protection | TLS 1.3, Certificate pinning |
| **PR.DS-5** | Protection against data leaks | Secure key storage, Memory clearing |
| **PR.AC-1** | Identity management | NIST SP 800-63B AAL2 |
| **PR.AC-7** | Authentication | Multi-factor, Biometric |
| **PR.PT-1** | Audit logging | NIST SP 800-92 compliant |
| **DE.CM-1** | Network monitoring | TLS validation, Certificate checks |
| **DE.CM-7** | Monitoring for unauthorized activity | Jailbreak detection, Debugger detection |

### NIST SP 800-53 Controls

| Control | Title | Implementation |
|---------|-------|----------------|
| **SC-8** | Transmission Confidentiality | TLS 1.3, AES-256-GCM |
| **SC-12** | Cryptographic Key Management | Secure Enclave, Key rotation |
| **SC-13** | Cryptographic Protection | FIPS 140-2 algorithms |
| **SC-28** | Protection of Information at Rest | AES-256-GCM encryption |
| **IA-2** | Identification and Authentication | AAL2 multi-factor |
| **IA-5** | Authenticator Management | NIST SP 800-63B compliant |
| **AU-2** | Audit Events | Comprehensive event logging |
| **AU-3** | Content of Audit Records | RFC 5424 format |
| **AU-9** | Protection of Audit Information | HMAC integrity signatures |

---

## Key Management

### Key Lifecycle Management (NIST SP 800-175B)

#### Key Generation

**Method:**
- Apple CryptoKit `SymmetricKey(size: .bits256)`
- Uses NIST SP 800-90A approved DRBG
- Secure Enclave generation when available

**Implementation:**
```swift
let key = try crypto.generateSymmetricKey()
```

#### Key Storage

**Locations:**
1. **Secure Enclave** (preferred)
   - Hardware-based key storage
   - Keys never leave secure processor
   - Available on devices with Secure Enclave

2. **iOS Keychain** (fallback)
   - Software-based protection
   - Encrypted by system
   - Protected by device passcode

**Implementation:**
```swift
// Store in Secure Enclave
try crypto.storeKeyInSecureEnclave(key: key, identifier: "encryption.key")

// Retrieve from storage
let retrievedKey = try crypto.retrieveKeyFromSecureEnclave(identifier: "encryption.key")
```

#### Key Derivation

**Algorithm:** PBKDF2-HMAC-SHA-256

**Parameters:**
- Iterations: 100,000 (NIST SP 800-132 minimum: 10,000)
- Salt: 128 bits (16 bytes) random
- Output: 256 bits (32 bytes)

**Implementation:**
```swift
let password = "UserPassword123!"
let salt = try crypto.generateSalt()
let derivedKey = try crypto.deriveKey(password: password, salt: salt, iterations: 100_000)
```

#### Key Rotation

**Policy:**
- Encryption keys: Rotate annually or on compromise
- Authentication tokens: Rotate on refresh (1 hour)
- HMAC keys: Rotate quarterly

**Implementation:**
```swift
// Rotate encryption key
let newKey = try crypto.generateSymmetricKey()
try crypto.storeKeyInSecureEnclave(key: newKey, identifier: "encryption.key.v2")

// Re-encrypt data with new key
let decrypted = try crypto.decryptAESGCM(encryptedData: oldData)
let reEncrypted = try crypto.encryptAESGCM(data: decrypted, key: newKey)
```

#### Key Destruction

**Method:**
- Remove from Keychain/Secure Enclave
- Overwrite memory with zeros
- Verify removal

**Implementation:**
```swift
// Delete key from Keychain
let query: [String: Any] = [
    kSecClass as String: kSecClassKey,
    kSecAttrApplicationTag as String: identifier
]
SecItemDelete(query as CFDictionary)
```

---

## Testing and Validation

### Compliance Testing

#### Unit Tests

Create unit tests to verify compliance:

```swift
import XCTest

class NISTComplianceTests: XCTestCase {

    func testFIPSCompliance() {
        let compliance = NISTCompliance.shared
        XCTAssertTrue(compliance.isCompliant, "FIPS 140-2 compliance failed")
    }

    func testAESGCMEncryption() throws {
        let crypto = FIPSCryptoManager.shared
        let testData = "Test Data".data(using: .utf8)!

        let encrypted = try crypto.encryptAESGCM(data: testData)
        let decrypted = try crypto.decryptAESGCM(encryptedData: encrypted)

        XCTAssertEqual(testData, decrypted, "AES-GCM encryption/decryption failed")
    }

    func testHMACIntegrity() throws {
        let crypto = FIPSCryptoManager.shared
        let key = try crypto.generateSymmetricKey()
        let data = "Test Data".data(using: .utf8)!

        let mac = try crypto.hmacSHA256(data: data, key: key)
        let isValid = try crypto.verifyHMACSHA256(data: data, mac: mac, key: key)

        XCTAssertTrue(isValid, "HMAC verification failed")
    }

    func testPasswordStrength() {
        let compliance = NISTCompliance.shared

        // AAL1 (weak)
        let aal1 = compliance.verifyAuthenticationStrength(password: "password")
        XCTAssertEqual(aal1, .aal1)

        // AAL2 (strong)
        let aal2 = compliance.verifyAuthenticationStrength(password: "MyP@ssw0rd123")
        XCTAssertEqual(aal2, .aal2Eligible)

        // AAL3 (very strong)
        let aal3 = compliance.verifyAuthenticationStrength(password: "MyV3ry$tr0ng!P@ssw0rd")
        XCTAssertEqual(aal3, .aal3Eligible)
    }

    func testAuditLogIntegrity() {
        let logger = AuditLogger.shared

        logger.logSecurityEvent(.authenticationSuccess, details: ["test": "true"])

        let entries = logger.getRecentEvents(limit: 1)
        guard let entry = entries.first else {
            XCTFail("No log entry found")
            return
        }

        let isValid = logger.verifyIntegrity(of: entry)
        XCTAssertTrue(isValid, "Log entry integrity verification failed")
    }
}
```

#### Integration Tests

Test end-to-end scenarios:

1. **Authentication Flow**
   - Login with AAL2 (password + biometric)
   - Verify token storage
   - Verify audit logs

2. **Data Encryption**
   - Encrypt sensitive data
   - Store in Keychain
   - Retrieve and decrypt
   - Verify integrity

3. **Key Rotation**
   - Generate initial key
   - Encrypt data
   - Rotate key
   - Re-encrypt data
   - Verify decryption

### Penetration Testing

Recommended tests:
- Cryptographic algorithm verification
- Key extraction attempts
- Log tampering attempts
- Authentication bypass attempts
- Man-in-the-middle attacks
- Certificate pinning validation

### Compliance Audit

Generate compliance report:

```swift
let report = NISTCompliance.shared.generateComplianceReport()

print("Compliance Status: \(report.isCompliant ? "✅ COMPLIANT" : "❌ NON-COMPLIANT")")
print("\nStandards:")
for standard in report.standards {
    print("  \(standard.name): \(standard.status ? "✅" : "❌")")
}

if !report.violations.isEmpty {
    print("\nViolations:")
    for violation in report.violations {
        print("  • \(violation.standard) - \(violation.requirement)")
        print("    \(violation.description)")
    }
}
```

---

## Compliance Checklist

### FIPS 140-2

- [x] Use only FIPS-approved algorithms
- [x] AES-256-GCM for symmetric encryption
- [x] SHA-256/384/512 for hashing
- [x] HMAC-SHA-256 for message authentication
- [x] ECDSA P-256/384 for digital signatures
- [x] NIST SP 800-90A DRBG for random generation
- [x] Secure key storage (Keychain/Secure Enclave)
- [x] Self-tests on initialization
- [x] Error handling for cryptographic failures

### NIST SP 800-175B

- [x] Use approved cryptographic algorithms
- [x] Proper key sizes (256-bit for AES, SHA-256+)
- [x] Authenticated encryption (GCM mode)
- [x] Key derivation using PBKDF2
- [x] Secure random number generation
- [x] Certificate validation
- [x] Perfect forward secrecy

### NIST SP 800-63B

- [x] Password length requirements (8+ chars)
- [x] No composition rules mandated
- [x] Password strength verification
- [x] Multi-factor authentication support
- [x] Biometric authentication (AAL2)
- [x] Secure Enclave authentication (AAL3)
- [x] Rate limiting on failed attempts
- [x] Secure session management
- [x] Token rotation

### NIST SP 800-92

- [x] Comprehensive event logging
- [x] RFC 5424 (syslog) format
- [x] Tamper-evident logging (HMAC signatures)
- [x] Log rotation policy
- [x] Log retention (90 days)
- [x] Secure log storage
- [x] Remote logging for critical events
- [x] Log integrity verification
- [x] Multiple export formats

### NIST SP 800-90A

- [x] Use approved DRBG (SecRandomCopyBytes)
- [x] Proper entropy sources
- [x] Cryptographically secure RNG
- [x] Statistical testing of randomness
- [x] Verification on startup

---

## Compliance Maintenance

### Annual Review

- Perform full compliance audit
- Review new NIST guidelines
- Update algorithms if deprecated
- Rotate cryptographic keys
- Review and update policies

### Continuous Monitoring

- Monitor audit logs daily
- Review security events weekly
- Investigate compliance violations immediately
- Update threat models quarterly

### Documentation

- Keep compliance documentation current
- Document all cryptographic operations
- Maintain audit trails
- Record key rotation events

### Training

- Train developers on NIST standards
- Review secure coding practices
- Conduct security awareness training
- Stay updated on NIST publications

---

## References

### NIST Publications

- **FIPS 140-2**: Security Requirements for Cryptographic Modules
  - https://csrc.nist.gov/publications/detail/fips/140/2/final

- **NIST SP 800-175B**: Guideline for Using Cryptographic Standards
  - https://csrc.nist.gov/publications/detail/sp/800-175b/final

- **NIST SP 800-63B**: Digital Identity Guidelines - Authentication
  - https://csrc.nist.gov/publications/detail/sp/800-63b/final

- **NIST SP 800-92**: Guide to Computer Security Log Management
  - https://csrc.nist.gov/publications/detail/sp/800-92/final

- **NIST SP 800-90A**: Recommendation for Random Number Generation
  - https://csrc.nist.gov/publications/detail/sp/800-90a/rev-1/final

- **NIST SP 800-132**: Recommendation for Password-Based Key Derivation
  - https://csrc.nist.gov/publications/detail/sp/800-132/final

### Apple Documentation

- **CryptoKit**: https://developer.apple.com/documentation/cryptokit
- **CommonCrypto**: https://developer.apple.com/security/
- **Keychain Services**: https://developer.apple.com/documentation/security/keychain_services
- **Secure Enclave**: https://support.apple.com/guide/security/secure-enclave-sec59b0b31ff/web

### RFCs

- **RFC 5424**: The Syslog Protocol
  - https://datatracker.ietf.org/doc/html/rfc5424

---

## Contact

For compliance questions or security concerns:
- Security Team: security@fleet.capitaltechalliance.com
- Compliance Team: compliance@fleet.capitaltechalliance.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-11 | Initial NIST compliance implementation |

---

**Document Classification:** Internal Use Only
**Last Updated:** 2025-11-11
**Next Review:** 2026-11-11
