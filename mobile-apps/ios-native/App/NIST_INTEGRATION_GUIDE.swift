//
//  NIST_INTEGRATION_GUIDE.swift
//  Fleet Manager - NIST Compliance Integration Examples
//
//  This file contains comprehensive examples of how to integrate
//  NIST compliance features into the Fleet Manager iOS app.
//
//  DO NOT include this file in production builds.
//  This is for documentation and reference purposes only.
//

import Foundation
import CryptoKit

// MARK: - Example 1: Application Startup - Verify NIST Compliance

@available(iOS 13.0, *)
class AppStartupExample {

    func verifyComplianceOnStartup() {
        // Verify NIST compliance during app initialization
        let compliance = NISTCompliance.shared

        if compliance.isCompliant {
            print("✅ Application is NIST compliant")

            // Log compliance verification
            AuditLogger.shared.logSecurityEvent(.complianceVerified, details: [
                "standards": "FIPS 140-2, NIST SP 800-175B",
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ])
        } else {
            print("❌ Application failed NIST compliance check")

            // Generate detailed compliance report
            let report = compliance.generateComplianceReport()

            for violation in report.violations {
                print("Violation: \(violation.standard) - \(violation.requirement)")
                print("  \(violation.description)")
            }

            // Alert user and prevent app usage if critical
            handleComplianceFailure(report: report)
        }
    }

    private func handleComplianceFailure(report: ComplianceReport) {
        // In production, this might:
        // - Show an error screen
        // - Disable cryptographic features
        // - Contact support
        // - Force app update
    }
}

// MARK: - Example 2: User Authentication (NIST SP 800-63B)

@available(iOS 13.0, *)
class AuthenticationExample {

    // AAL1: Single-factor authentication
    func authenticateAAL1(email: String, password: String) async throws {
        // Verify password strength
        let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)

        guard level >= .aal1 else {
            throw AuthError.weakPassword
        }

        // Hash password for transmission (never send plaintext)
        let crypto = FIPSCryptoManager.shared
        let passwordHash = try crypto.sha256(string: password)

        // Authenticate with backend
        let success = try await authenticateWithBackend(email: email, passwordHash: passwordHash)

        if success {
            // Log successful authentication
            AuditLogger.shared.logSecurityEvent(.authenticationSuccess, details: [
                "user": email,
                "method": "password",
                "aal": "AAL1"
            ])
        } else {
            // Log failed authentication
            AuditLogger.shared.logSecurityEvent(.authenticationFailure, details: [
                "user": email,
                "reason": "Invalid credentials"
            ], severity: .high)
        }
    }

    // AAL2: Multi-factor authentication (password + biometric)
    func authenticateAAL2(email: String, password: String) async throws {
        // First factor: Password
        let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)

        guard level >= .aal2Eligible else {
            throw AuthError.passwordNotAAL2Compliant
        }

        // Authenticate password first
        try await authenticateAAL1(email: email, password: password)

        // Second factor: Biometric
        let keychain = KeychainManager.shared
        let authenticated = try await keychain.authenticateWithBiometrics(
            reason: "Authenticate to access your Fleet account"
        )

        if authenticated {
            AuditLogger.shared.logSecurityEvent(.authenticationSuccess, details: [
                "user": email,
                "method": "password+biometric",
                "aal": "AAL2"
            ])
        } else {
            throw AuthError.biometricFailed
        }
    }

    // AAL3: Hardware-based authentication
    func authenticateAAL3(email: String, password: String) async throws {
        // Verify password strength for AAL3
        let level = NISTCompliance.shared.verifyAuthenticationStrength(password: password)

        guard level >= .aal3Eligible else {
            throw AuthError.passwordNotAAL3Compliant
        }

        // Use hardware-protected key from Secure Enclave
        let crypto = FIPSCryptoManager.shared

        // Generate challenge-response with Secure Enclave key
        let challenge = try crypto.generateRandomBytes(count: 32)
        let hardwareKey = try crypto.retrieveKeyFromSecureEnclave(identifier: "auth.hardware.key")
        let response = try crypto.hmacSHA256(data: challenge, key: hardwareKey)

        // Authenticate with backend using hardware-signed challenge
        let success = try await authenticateWithHardwareProof(
            email: email,
            challenge: challenge,
            response: response
        )

        if success {
            AuditLogger.shared.logSecurityEvent(.authenticationSuccess, details: [
                "user": email,
                "method": "password+hardware",
                "aal": "AAL3"
            ])
        }
    }

    // Helper methods (stub implementations)
    private func authenticateWithBackend(email: String, passwordHash: String) async throws -> Bool {
        // Implementation: Call authentication API
        return true
    }

    private func authenticateWithHardwareProof(email: String, challenge: Data, response: Data) async throws -> Bool {
        // Implementation: Call hardware authentication API
        return true
    }
}

enum AuthError: Error {
    case weakPassword
    case passwordNotAAL2Compliant
    case passwordNotAAL3Compliant
    case biometricFailed
}

// MARK: - Example 3: Encrypting Sensitive Data (FIPS 140-2)

@available(iOS 13.0, *)
class DataEncryptionExample {

    func encryptSensitiveUserData(userData: UserSensitiveData) throws -> Data {
        let crypto = FIPSCryptoManager.shared

        // Serialize user data
        let encoder = JSONEncoder()
        let jsonData = try encoder.encode(userData)

        // Encrypt with AES-256-GCM (FIPS 140-2 approved)
        let encrypted = try crypto.encryptAESGCM(data: jsonData)

        // Store encryption key securely
        try crypto.storeKeyInSecureEnclave(
            key: encrypted.key,
            identifier: "user.data.encryption.key"
        )

        // Log encryption event
        AuditLogger.shared.logSecurityEvent(.dataEncrypted, details: [
            "dataType": "UserSensitiveData",
            "algorithm": "AES-256-GCM",
            "keyStorage": "SecureEnclave"
        ])

        return encrypted.combined
    }

    func decryptSensitiveUserData(encryptedData: Data) throws -> UserSensitiveData {
        let crypto = FIPSCryptoManager.shared

        // Retrieve encryption key from Secure Enclave
        let key = try crypto.retrieveKeyFromSecureEnclave(
            identifier: "user.data.encryption.key"
        )

        // Decrypt data
        let package = try EncryptedDataPackage(combined: encryptedData, key: key)
        let decryptedData = try crypto.decryptAESGCM(encryptedData: package)

        // Deserialize
        let decoder = JSONDecoder()
        let userData = try decoder.decode(UserSensitiveData.self, from: decryptedData)

        // Log decryption event
        AuditLogger.shared.logSecurityEvent(.dataDecrypted, details: [
            "dataType": "UserSensitiveData",
            "algorithm": "AES-256-GCM"
        ])

        return userData
    }
}

struct UserSensitiveData: Codable {
    let userId: String
    let ssn: String?
    let driverLicense: String?
    let creditCard: String?
}

// MARK: - Example 4: API Request Signing (HMAC)

@available(iOS 13.0, *)
class APIRequestSigningExample {

    func signAPIRequest(endpoint: String, payload: [String: Any]) throws -> [String: String] {
        let crypto = FIPSCryptoManager.shared

        // Get or generate HMAC key
        let hmacKey: SymmetricKey
        if let existingKey = try? crypto.retrieveKeyFromSecureEnclave(identifier: "api.hmac.key") {
            hmacKey = existingKey
        } else {
            hmacKey = try crypto.generateSymmetricKey()
            try crypto.storeKeyInSecureEnclave(key: hmacKey, identifier: "api.hmac.key")
        }

        // Create signature data
        let timestamp = String(Int(Date().timeIntervalSince1970))
        let jsonData = try JSONSerialization.data(withJSONObject: payload)

        var signatureData = Data()
        signatureData.append(endpoint.data(using: .utf8)!)
        signatureData.append(timestamp.data(using: .utf8)!)
        signatureData.append(jsonData)

        // Compute HMAC-SHA-256 signature
        let signature = try crypto.hmacSHA256(data: signatureData, key: hmacKey)
        let signatureHex = signature.map { String(format: "%02hhx", $0) }.joined()

        // Return headers
        return [
            "X-Signature": signatureHex,
            "X-Timestamp": timestamp
        ]
    }

    func verifyAPIResponse(data: Data, signature: String, timestamp: String) throws -> Bool {
        let crypto = FIPSCryptoManager.shared

        // Get HMAC key
        let hmacKey = try crypto.retrieveKeyFromSecureEnclave(identifier: "api.hmac.key")

        // Reconstruct signature data
        var signatureData = Data()
        signatureData.append(timestamp.data(using: .utf8)!)
        signatureData.append(data)

        // Verify signature
        guard let signatureBytes = Data(hexString: signature) else {
            return false
        }

        return try crypto.verifyHMACSHA256(
            data: signatureData,
            mac: signatureBytes,
            key: hmacKey
        )
    }
}

// MARK: - Example 5: Password-Based Encryption (PBKDF2)

@available(iOS 13.0, *)
class PasswordBasedEncryptionExample {

    func encryptWithPassword(data: Data, password: String) throws -> PasswordEncryptedData {
        let crypto = FIPSCryptoManager.shared

        // Generate random salt
        let salt = try crypto.generateSalt()

        // Derive key from password using PBKDF2 (NIST SP 800-132)
        let keyData = try crypto.deriveKey(
            password: password,
            salt: salt,
            iterations: 100_000
        )
        let key = SymmetricKey(data: keyData)

        // Encrypt data with derived key
        let encrypted = try crypto.encryptAESGCM(data: data, key: key)

        return PasswordEncryptedData(
            salt: salt,
            nonce: encrypted.nonce,
            ciphertext: encrypted.ciphertext,
            tag: encrypted.tag
        )
    }

    func decryptWithPassword(encrypted: PasswordEncryptedData, password: String) throws -> Data {
        let crypto = FIPSCryptoManager.shared

        // Derive key from password using same salt
        let keyData = try crypto.deriveKey(
            password: password,
            salt: encrypted.salt,
            iterations: 100_000
        )
        let key = SymmetricKey(data: keyData)

        // Decrypt data
        let package = EncryptedDataPackage(
            nonce: encrypted.nonce,
            ciphertext: encrypted.ciphertext,
            tag: encrypted.tag,
            key: key
        )

        return try crypto.decryptAESGCM(encryptedData: package)
    }
}

struct PasswordEncryptedData {
    let salt: Data
    let nonce: Data
    let ciphertext: Data
    let tag: Data
}

// MARK: - Example 6: Digital Signatures (ECDSA)

@available(iOS 13.0, *)
class DigitalSignatureExample {

    func signDocument(document: Data) throws -> DocumentSignature {
        let crypto = FIPSCryptoManager.shared

        // Generate or retrieve signing key
        let privateKey = try crypto.generateECDSAKeyPair()

        // Create document hash
        let documentHash = try crypto.sha256(data: document)

        // Sign hash with ECDSA
        let signature = try crypto.signECDSA(data: documentHash, privateKey: privateKey)

        // Log signing event
        AuditLogger.shared.logSecurityEvent(.dataAccessed, details: [
            "action": "document_signed",
            "algorithm": "ECDSA-P256",
            "documentHash": documentHash.prefix(16).map { String(format: "%02hhx", $0) }.joined()
        ])

        return DocumentSignature(
            signature: signature,
            publicKey: privateKey.publicKey.rawRepresentation,
            algorithm: "ECDSA-P256",
            timestamp: Date()
        )
    }

    func verifyDocumentSignature(document: Data, signature: DocumentSignature) throws -> Bool {
        let crypto = FIPSCryptoManager.shared

        // Reconstruct public key
        let publicKey = try P256.Signing.PublicKey(rawRepresentation: signature.publicKey)

        // Hash document
        let documentHash = try crypto.sha256(data: document)

        // Verify signature
        let isValid = try crypto.verifyECDSA(
            data: documentHash,
            signature: signature.signature,
            publicKey: publicKey
        )

        if isValid {
            AuditLogger.shared.logSecurityEvent(.accessGranted, details: [
                "action": "signature_verified",
                "algorithm": signature.algorithm
            ])
        } else {
            AuditLogger.shared.logSecurityEvent(.accessDenied, details: [
                "action": "signature_verification_failed",
                "reason": "Invalid signature"
            ], severity: .high)
        }

        return isValid
    }
}

struct DocumentSignature {
    let signature: Data
    let publicKey: Data
    let algorithm: String
    let timestamp: Date
}

// MARK: - Example 7: Audit Logging (NIST SP 800-92)

@available(iOS 13.0, *)
class AuditLoggingExample {

    func logSecurityEvents() {
        let logger = AuditLogger.shared

        // Log authentication success
        logger.logSecurityEvent(.authenticationSuccess, details: [
            "user": "john.doe@example.com",
            "method": "biometric",
            "deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        ])

        // Log data access
        logger.logSecurityEvent(.dataAccessed, details: [
            "resource": "vehicle_list",
            "action": "read",
            "recordCount": "50"
        ])

        // Log configuration change
        logger.logSecurityEvent(.configurationChange, details: [
            "setting": "api_endpoint",
            "oldValue": "https://api.old.example.com",
            "newValue": "https://api.new.example.com"
        ], severity: .high)

        // Log critical security event
        logger.logSecurityEvent(.jailbreakDetected, details: [
            "method": "Cydia app detected",
            "action": "App locked"
        ], severity: .critical)
    }

    func exportAuditLogs() {
        let logger = AuditLogger.shared

        // Export as JSON
        if let json = logger.exportLogs(format: .json) {
            print("JSON Export:\n\(json)")
        }

        // Export as CSV
        if let csv = logger.exportLogs(format: .csv) {
            print("CSV Export:\n\(csv)")
        }

        // Export as syslog
        if let syslog = logger.exportLogs(format: .syslog) {
            print("Syslog Export:\n\(syslog)")
        }
    }

    func verifyLogIntegrity() {
        let logger = AuditLogger.shared
        let entries = logger.getRecentEvents(limit: 100)

        var tamperedCount = 0
        for entry in entries {
            let isValid = logger.verifyIntegrity(of: entry)
            if !isValid {
                tamperedCount += 1
                print("⚠️ Log entry \(entry.id) has been tampered with!")
            }
        }

        if tamperedCount > 0 {
            // Alert security team
            logger.logSecurityEvent(.logIntegrityFailure, details: [
                "tamperedEntries": "\(tamperedCount)",
                "totalEntries": "\(entries.count)"
            ], severity: .critical)
        }
    }
}

// MARK: - Example 8: Key Rotation

@available(iOS 13.0, *)
class KeyRotationExample {

    func rotateEncryptionKeys() throws {
        let crypto = FIPSCryptoManager.shared

        // Generate new encryption key
        let newKey = try crypto.generateSymmetricKey()

        // Retrieve all encrypted data with old key
        let oldKey = try crypto.retrieveKeyFromSecureEnclave(identifier: "data.encryption.key")

        // Example: Re-encrypt user data
        let encryptedData = loadEncryptedUserData()

        for data in encryptedData {
            // Decrypt with old key
            let package = try EncryptedDataPackage(combined: data, key: oldKey)
            let decrypted = try crypto.decryptAESGCM(encryptedData: package)

            // Re-encrypt with new key
            let reEncrypted = try crypto.encryptAESGCM(data: decrypted, key: newKey)

            // Save re-encrypted data
            saveEncryptedUserData(reEncrypted.combined)
        }

        // Store new key
        try crypto.storeKeyInSecureEnclave(key: newKey, identifier: "data.encryption.key.v2")

        // Log key rotation
        AuditLogger.shared.logSecurityEvent(.keyRotated, details: [
            "keyType": "data.encryption",
            "algorithm": "AES-256-GCM",
            "itemsReEncrypted": "\(encryptedData.count)"
        ])

        // Delete old key after successful rotation
        deleteOldKey(identifier: "data.encryption.key")
    }

    // Helper methods (stub implementations)
    private func loadEncryptedUserData() -> [Data] {
        return []
    }

    private func saveEncryptedUserData(_ data: Data) {
        // Save to storage
    }

    private func deleteOldKey(identifier: String) {
        // Delete from Keychain
    }
}

// MARK: - Example 9: Compliance Reporting

@available(iOS 13.0, *)
class ComplianceReportingExample {

    func generateComplianceReport() {
        let compliance = NISTCompliance.shared

        // Perform compliance check
        let passed = compliance.performComplianceCheck()

        // Generate report
        let report = compliance.generateComplianceReport()

        print("═══════════════════════════════════════")
        print("NIST COMPLIANCE REPORT")
        print("═══════════════════════════════════════")
        print("Status: \(report.isCompliant ? "✅ COMPLIANT" : "❌ NON-COMPLIANT")")
        print("Last Check: \(report.lastCheck)")
        print("")

        print("Standards:")
        for standard in report.standards {
            let status = standard.status ? "✅" : "❌"
            print("  \(status) \(standard.name)")
        }
        print("")

        if !report.violations.isEmpty {
            print("Violations:")
            for violation in report.violations {
                print("  ⚠️ \(violation.standard)")
                print("     Requirement: \(violation.requirement)")
                print("     Description: \(violation.description)")
                print("     Timestamp: \(violation.timestamp)")
                print("")
            }
        }

        print("═══════════════════════════════════════")
    }
}

// MARK: - Example 10: Integration into SwiftUI Views

@available(iOS 13.0, *)
struct NISTComplianceStatusView: View {
    @State private var isCompliant: Bool = false
    @State private var complianceReport: ComplianceReport?

    var body: some View {
        VStack(spacing: 20) {
            Text("NIST Compliance Status")
                .font(.title)

            if isCompliant {
                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)
                Text("Application is NIST Compliant")
                    .font(.headline)
            } else {
                Image(systemName: "xmark.shield.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.red)
                Text("Compliance Issues Detected")
                    .font(.headline)
            }

            if let report = complianceReport {
                List {
                    ForEach(report.standards, id: \.name) { standard in
                        HStack {
                            Image(systemName: standard.status ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(standard.status ? .green : .red)
                            Text(standard.name)
                        }
                    }
                }
            }

            Button("Run Compliance Check") {
                checkCompliance()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .onAppear {
            checkCompliance()
        }
    }

    private func checkCompliance() {
        let compliance = NISTCompliance.shared
        isCompliant = compliance.performComplianceCheck()
        complianceReport = compliance.generateComplianceReport()
    }
}

// MARK: - Helper Extensions

extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        for i in 0..<len {
            let j = hexString.index(hexString.startIndex, offsetBy: i*2)
            let k = hexString.index(j, offsetBy: 2)
            let bytes = hexString[j..<k]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            } else {
                return nil
            }
        }
        self = data
    }
}

// Import SwiftUI for view example
import SwiftUI
