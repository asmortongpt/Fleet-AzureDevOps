# NIST Compliance Quick Start Guide

## Overview

This guide provides a quick introduction to using the NIST SP 800-175B and FIPS 140-2 compliance features in the Fleet Manager iOS app.

## Table of Contents

1. [Getting Started](#getting-started)
2. [5-Minute Integration](#5-minute-integration)
3. [Common Use Cases](#common-use-cases)
4. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- iOS 13.0 or later
- Xcode 12.0 or later
- Swift 5.3 or later

### Files Overview

| File | Purpose |
|------|---------|
| `NISTCompliance.swift` | Main compliance framework |
| `FIPSCryptoManager.swift` | FIPS-validated cryptography |
| `AuditLogger.swift` | NIST SP 800-92 audit logging |
| `NIST_COMPLIANCE.md` | Comprehensive documentation |
| `NIST_INTEGRATION_GUIDE.swift` | Code examples |

---

## 5-Minute Integration

### Step 1: Verify Compliance on App Launch

```swift
// In your AppDelegate or App struct
@available(iOS 13.0, *)
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    // Check NIST compliance
    let compliance = NISTCompliance.shared

    if !compliance.isCompliant {
        print("⚠️ Warning: NIST compliance check failed")
        // Handle compliance failure (alert user, disable features, etc.)
    }

    return true
}
```

### Step 2: Encrypt Sensitive Data

```swift
@available(iOS 13.0, *)
func saveSensitiveData() throws {
    let crypto = FIPSCryptoManager.shared

    // Your sensitive data
    let sensitiveData = "User SSN: 123-45-6789".data(using: .utf8)!

    // Encrypt with AES-256-GCM (FIPS 140-2 approved)
    let encrypted = try crypto.encryptAESGCM(data: sensitiveData)

    // Store key in Secure Enclave
    try crypto.storeKeyInSecureEnclave(
        key: encrypted.key,
        identifier: "user.ssn.key"
    )

    // Save encrypted data
    UserDefaults.standard.set(encrypted.combined, forKey: "encrypted_ssn")
}
```

### Step 3: Enable Audit Logging

```swift
@available(iOS 13.0, *)
func logSecurityEvent() {
    let logger = AuditLogger.shared

    // Log authentication
    logger.logSecurityEvent(.authenticationSuccess, details: [
        "user": "john.doe@example.com",
        "method": "biometric"
    ])

    // Log data access
    logger.logSecurityEvent(.dataAccessed, details: [
        "resource": "vehicle_data",
        "action": "read"
    ])
}
```

### Step 4: Implement Multi-Factor Authentication

```swift
@available(iOS 13.0, *)
func authenticateUser(email: String, password: String) async throws {
    // Verify password strength (NIST SP 800-63B)
    let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)

    guard level >= .aal2Eligible else {
        throw AuthError.weakPassword
    }

    // Biometric authentication (second factor)
    let authenticated = try await KeychainManager.shared.authenticateWithBiometrics(
        reason: "Authenticate to access Fleet Manager"
    )

    if authenticated {
        AuditLogger.shared.logSecurityEvent(.authenticationSuccess, details: [
            "user": email,
            "aal": "AAL2"
        ])
    }
}
```

---

## Common Use Cases

### Use Case 1: Encrypting API Requests

```swift
@available(iOS 13.0, *)
func encryptAPIPayload(_ payload: [String: Any]) throws -> String {
    let crypto = FIPSCryptoManager.shared

    // Serialize payload
    let jsonData = try JSONSerialization.data(withJSONObject: payload)

    // Encrypt
    let encrypted = try crypto.encryptAESGCM(data: jsonData)

    // Return base64-encoded encrypted data
    return encrypted.combined.base64EncodedString()
}
```

### Use Case 2: Hashing Passwords

```swift
@available(iOS 13.0, *)
func hashPassword(_ password: String) throws -> String {
    let crypto = FIPSCryptoManager.shared

    // Generate salt
    let salt = try crypto.generateSalt()

    // Derive key using PBKDF2 (NIST SP 800-132)
    let hash = try crypto.deriveKey(
        password: password,
        salt: salt,
        iterations: 100_000
    )

    // Combine salt + hash for storage
    var combined = Data()
    combined.append(salt)
    combined.append(hash)

    return combined.base64EncodedString()
}
```

### Use Case 3: Signing API Requests

```swift
@available(iOS 13.0, *)
func signAPIRequest(endpoint: String, body: Data) throws -> String {
    let crypto = FIPSCryptoManager.shared

    // Get HMAC key
    let key = try crypto.retrieveKeyFromSecureEnclave(identifier: "api.hmac.key")

    // Create signature data
    var signatureData = Data()
    signatureData.append(endpoint.data(using: .utf8)!)
    signatureData.append(body)

    // Compute HMAC-SHA-256
    let signature = try crypto.hmacSHA256(data: signatureData, key: key)

    return signature.base64EncodedString()
}
```

### Use Case 4: Verifying Data Integrity

```swift
@available(iOS 13.0, *)
func verifyDataIntegrity(data: Data, signature: String) throws -> Bool {
    let crypto = FIPSCryptoManager.shared

    // Get HMAC key
    let key = try crypto.retrieveKeyFromSecureEnclave(identifier: "data.integrity.key")

    // Decode signature
    guard let signatureData = Data(base64Encoded: signature) else {
        return false
    }

    // Verify HMAC
    return try crypto.verifyHMACSHA256(
        data: data,
        mac: signatureData,
        key: key
    )
}
```

### Use Case 5: Generating Compliance Reports

```swift
@available(iOS 13.0, *)
func generateComplianceReport() -> ComplianceReport {
    let compliance = NISTCompliance.shared

    // Perform compliance check
    _ = compliance.performComplianceCheck()

    // Generate report
    let report = compliance.generateComplianceReport()

    // Print summary
    print("Compliance Status: \(report.isCompliant ? "PASS" : "FAIL")")
    for standard in report.standards {
        print("\(standard.name): \(standard.status ? "✅" : "❌")")
    }

    return report
}
```

---

## Quick Reference

### Encryption Algorithms

| Algorithm | Use Case | Method |
|-----------|----------|--------|
| **AES-256-GCM** | Data encryption | `crypto.encryptAESGCM()` |
| **SHA-256** | Hashing | `crypto.sha256()` |
| **HMAC-SHA-256** | Message authentication | `crypto.hmacSHA256()` |
| **ECDSA P-256** | Digital signatures | `crypto.signECDSA()` |
| **PBKDF2** | Key derivation | `crypto.deriveKey()` |

### Authentication Levels (NIST SP 800-63B)

| Level | Requirements | Use Case |
|-------|--------------|----------|
| **AAL1** | Password (8+ chars) | Basic authentication |
| **AAL2** | Password + Biometric | Sensitive operations |
| **AAL3** | Hardware-based | High-security operations |

### Audit Event Types

```swift
// Authentication
.authenticationSuccess
.authenticationFailure
.logout

// Data Operations
.dataEncrypted
.dataDecrypted
.dataAccessed
.dataModified
.dataDeleted

// Cryptographic Operations
.keyGenerated
.keyRotated
.encryptionFailed

// Security Events
.jailbreakDetected
.certificateValidationFailed
.suspiciousActivity

// Compliance
.complianceVerified
.complianceViolation
.complianceCheckPassed
```

---

## Troubleshooting

### Issue: Compliance Check Fails

**Problem:** `NISTCompliance.shared.isCompliant` returns `false`

**Solution:**
```swift
// Generate detailed report
let report = NISTCompliance.shared.generateComplianceReport()

// Check violations
for violation in report.violations {
    print("Violation: \(violation.standard)")
    print("Details: \(violation.description)")
}
```

### Issue: Encryption Fails

**Problem:** `encryptAESGCM()` throws an error

**Solution:**
```swift
do {
    let encrypted = try crypto.encryptAESGCM(data: data)
} catch CryptoError.encryptionFailed {
    print("Encryption failed - check input data")
} catch CryptoError.keyGenerationFailed {
    print("Key generation failed - check Keychain access")
} catch {
    print("Unknown error: \(error)")
}
```

### Issue: Biometric Authentication Not Available

**Problem:** `authenticateWithBiometrics()` fails

**Solution:**
```swift
let keychain = KeychainManager.shared
let (available, type) = keychain.isBiometricAvailable()

if !available {
    print("Biometric authentication not available")
    // Fall back to password-only authentication
} else {
    print("Biometric type: \(keychain.getBiometricTypeName())")
}
```

### Issue: Secure Enclave Not Available

**Problem:** `storeKeyInSecureEnclave()` fails

**Solution:**
```swift
if SecureEnclave.isAvailable {
    // Use Secure Enclave
    try crypto.storeKeyInSecureEnclave(key: key, identifier: "my.key")
} else {
    // Fallback to Keychain
    print("⚠️ Secure Enclave not available (simulator or older device)")
    // Use standard Keychain storage
}
```

### Issue: Audit Logs Not Writing

**Problem:** Logs not appearing

**Solution:**
```swift
let logger = AuditLogger.shared

// Check if logging is enabled
if !logger.isEnabled {
    logger.isEnabled = true
}

// Verify log file exists
let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
let logFile = docs.appendingPathComponent("audit.log")

if FileManager.default.fileExists(atPath: logFile.path) {
    print("Log file exists at: \(logFile.path)")
} else {
    print("Log file not created - check permissions")
}
```

---

## Best Practices

### 1. Always Check Compliance on Startup

```swift
let compliance = NISTCompliance.shared
guard compliance.isCompliant else {
    fatalError("Application does not meet NIST compliance requirements")
}
```

### 2. Use Secure Enclave When Available

```swift
if SecureEnclave.isAvailable {
    try crypto.storeKeyInSecureEnclave(key: key, identifier: "encryption.key")
} else {
    // Fallback to Keychain
}
```

### 3. Log All Security-Relevant Events

```swift
// Always log:
// - Authentication attempts
// - Data access/modifications
// - Cryptographic operations
// - Security violations
// - Configuration changes

AuditLogger.shared.logSecurityEvent(.dataAccessed, details: [
    "resource": resourceId,
    "action": "read"
])
```

### 4. Rotate Keys Regularly

```swift
// Rotate encryption keys annually
// Rotate authentication tokens hourly
// Rotate HMAC keys quarterly

let newKey = try crypto.generateSymmetricKey()
// Re-encrypt data with new key
// Delete old key
```

### 5. Verify Password Strength

```swift
let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)

guard level >= .aal2Eligible else {
    throw ValidationError.passwordTooWeak
}
```

### 6. Handle Errors Gracefully

```swift
do {
    let encrypted = try crypto.encryptAESGCM(data: data)
} catch {
    // Log error
    AuditLogger.shared.logSecurityEvent(.encryptionFailed, details: [
        "error": error.localizedDescription
    ], severity: .high)

    // Alert user
    // Attempt recovery
}
```

---

## Testing

### Unit Test Example

```swift
import XCTest

@available(iOS 13.0, *)
class NISTComplianceTests: XCTestCase {

    func testEncryptionDecryption() throws {
        let crypto = FIPSCryptoManager.shared
        let testData = "Test Data".data(using: .utf8)!

        // Encrypt
        let encrypted = try crypto.encryptAESGCM(data: testData)

        // Decrypt
        let decrypted = try crypto.decryptAESGCM(encryptedData: encrypted)

        // Verify
        XCTAssertEqual(testData, decrypted)
    }

    func testComplianceCheck() {
        let compliance = NISTCompliance.shared
        XCTAssertTrue(compliance.isCompliant, "NIST compliance check failed")
    }

    func testPasswordStrength() {
        let compliance = NISTCompliance.shared

        let weak = compliance.verifyAuthenticationStrength(password: "pass")
        XCTAssertEqual(weak, .insufficient)

        let strong = compliance.verifyAuthenticationStrength(password: "MyP@ssw0rd123")
        XCTAssertEqual(strong, .aal2Eligible)
    }
}
```

---

## Additional Resources

- **Full Documentation:** See `NIST_COMPLIANCE.md`
- **Code Examples:** See `NIST_INTEGRATION_GUIDE.swift`
- **NIST Publications:** https://csrc.nist.gov/publications
- **Apple CryptoKit:** https://developer.apple.com/documentation/cryptokit

---

## Support

For questions or issues:
- Review the comprehensive documentation in `NIST_COMPLIANCE.md`
- Check code examples in `NIST_INTEGRATION_GUIDE.swift`
- Contact the security team: security@fleet.capitaltechalliance.com

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
