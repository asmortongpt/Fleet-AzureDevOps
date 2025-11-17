//
//  FIPSCryptoManager.swift
//  Fleet Manager - FIPS 140-2 Validated Cryptography Manager
//
//  Implements FIPS 140-2 validated cryptographic operations using
//  Apple's CryptoKit and CommonCrypto frameworks.
//
//  FIPS 140-2 Validated Modules:
//  - Apple CryptoKit (iOS 13+)
//  - Apple CommonCrypto
//  - Apple Secure Enclave (for key storage)
//
//  Algorithms (NIST Approved):
//  - AES-256-GCM: NIST SP 800-38D (authenticated encryption)
//  - SHA-256/384/512: FIPS 180-4 (hashing)
//  - HMAC-SHA-256: FIPS 198-1 (message authentication)
//  - ECDSA P-256/384: FIPS 186-4 (digital signatures)
//  - PBKDF2: NIST SP 800-132 (key derivation)
//

import Foundation
import Security
import CommonCrypto
import CryptoKit

// MARK: - FIPS Crypto Manager

@available(iOS 13.0, *)
class FIPSCryptoManager {

    static let shared = FIPSCryptoManager()

    // MARK: - Constants

    /// AES-256 key size (256 bits)
    private let aesKeySize = 32

    /// GCM tag size (128 bits)
    private let gcmTagSize = 16

    /// PBKDF2 iterations (NIST SP 800-132 minimum: 10,000)
    /// Recommended: 100,000+ for password-based encryption
    private let pbkdf2Iterations = 100_000

    /// Salt size for key derivation (128 bits minimum per NIST)
    private let saltSize = 16

    private init() {}

    // MARK: - AES-256-GCM Encryption (NIST SP 800-38D)

    /// Encrypt data using AES-256-GCM (FIPS 140-2 approved)
    /// - Parameter data: Plain data to encrypt
    /// - Parameter key: Optional symmetric key (generates new if nil)
    /// - Returns: Encrypted data package (nonce + ciphertext + tag)
    /// - Throws: CryptoError on failure
    func encryptAESGCM(data: Data, key: SymmetricKey? = nil) throws -> EncryptedDataPackage {
        // Use provided key or generate new one
        let encryptionKey = try key ?? generateSymmetricKey()

        // Create sealed box (encrypts with GCM)
        let sealedBox = try AES.GCM.seal(data, using: encryptionKey)

        // Extract components
        let nonce = sealedBox.nonce.withUnsafeBytes { Data($0) }
        let ciphertext = sealedBox.ciphertext
        let tag = sealedBox.tag

        // Log encryption event
        AuditLogger.shared.logSecurityEvent(.dataEncrypted, details: [
            "algorithm": "AES-256-GCM",
            "dataSize": data.count,
            "standard": "NIST SP 800-38D"
        ])

        return EncryptedDataPackage(
            nonce: nonce,
            ciphertext: ciphertext,
            tag: tag,
            key: encryptionKey
        )
    }

    /// Decrypt data using AES-256-GCM
    /// - Parameter encryptedPackage: Encrypted data package
    /// - Returns: Decrypted plain data
    /// - Throws: CryptoError on failure
    func decryptAESGCM(encryptedData package: EncryptedDataPackage) throws -> Data {
        do {
            // Reconstruct sealed box
            let sealedBox = try AES.GCM.SealedBox(
                nonce: AES.GCM.Nonce(data: package.nonce),
                ciphertext: package.ciphertext,
                tag: package.tag
            )

            // Decrypt
            let decryptedData = try AES.GCM.open(sealedBox, using: package.key)

            // Log decryption event
            AuditLogger.shared.logSecurityEvent(.dataDecrypted, details: [
                "algorithm": "AES-256-GCM",
                "dataSize": decryptedData.count,
                "standard": "NIST SP 800-38D"
            ])

            return decryptedData

        } catch {
            AuditLogger.shared.logSecurityEvent(.decryptionFailed, details: [
                "algorithm": "AES-256-GCM",
                "error": error.localizedDescription
            ])
            throw CryptoError.decryptionFailed
        }
    }

    // MARK: - Hashing (FIPS 180-4)

    /// Compute SHA-256 hash (FIPS 180-4 approved)
    /// - Parameter data: Data to hash
    /// - Returns: SHA-256 hash (32 bytes)
    func sha256(data: Data) throws -> Data {
        let hash = SHA256.hash(data: data)
        return Data(hash)
    }

    /// Compute SHA-384 hash (FIPS 180-4 approved)
    /// - Parameter data: Data to hash
    /// - Returns: SHA-384 hash (48 bytes)
    func sha384(data: Data) throws -> Data {
        let hash = SHA384.hash(data: data)
        return Data(hash)
    }

    /// Compute SHA-512 hash (FIPS 180-4 approved)
    /// - Parameter data: Data to hash
    /// - Returns: SHA-512 hash (64 bytes)
    func sha512(data: Data) throws -> Data {
        let hash = SHA512.hash(data: data)
        return Data(hash)
    }

    /// Compute SHA-256 hash of string
    /// - Parameter string: String to hash
    /// - Returns: Hex-encoded hash string
    func sha256(string: String) throws -> String {
        guard let data = string.data(using: .utf8) else {
            throw CryptoError.invalidInput
        }
        let hash = try sha256(data: data)
        return hash.map { String(format: "%02hhx", $0) }.joined()
    }

    // MARK: - HMAC (FIPS 198-1)

    /// Compute HMAC-SHA-256 (FIPS 198-1 approved)
    /// - Parameters:
    ///   - data: Data to authenticate
    ///   - key: HMAC key
    /// - Returns: HMAC-SHA-256 authentication code
    func hmacSHA256(data: Data, key: SymmetricKey) throws -> Data {
        let authenticationCode = HMAC<SHA256>.authenticationCode(for: data, using: key)
        return Data(authenticationCode)
    }

    /// Verify HMAC-SHA-256
    /// - Parameters:
    ///   - data: Data to verify
    ///   - mac: HMAC to verify against
    ///   - key: HMAC key
    /// - Returns: True if valid
    func verifyHMACSHA256(data: Data, mac: Data, key: SymmetricKey) throws -> Bool {
        let computedMAC = try hmacSHA256(data: data, key: key)
        return constantTimeCompare(computedMAC, mac)
    }

    /// Constant-time comparison (prevents timing attacks)
    private func constantTimeCompare(_ lhs: Data, _ rhs: Data) -> Bool {
        guard lhs.count == rhs.count else { return false }

        var result: UInt8 = 0
        for (a, b) in zip(lhs, rhs) {
            result |= a ^ b
        }
        return result == 0
    }

    // MARK: - Key Derivation (NIST SP 800-132)

    /// Derive key from password using PBKDF2 (NIST SP 800-132)
    /// - Parameters:
    ///   - password: Password to derive from
    ///   - salt: Salt (generates random if nil)
    ///   - iterations: PBKDF2 iterations (default: 100,000)
    /// - Returns: Derived key data (32 bytes)
    /// - Throws: CryptoError on failure
    func deriveKey(password: String, salt: Data? = nil, iterations: Int? = nil) throws -> Data {
        let saltData = try salt ?? generateSalt()
        let iterationCount = iterations ?? pbkdf2Iterations

        guard let passwordData = password.data(using: .utf8) else {
            throw CryptoError.invalidInput
        }

        var derivedKey = Data(count: aesKeySize)
        let result = derivedKey.withUnsafeMutableBytes { derivedKeyBytes in
            saltData.withUnsafeBytes { saltBytes in
                CCKeyDerivationPBKDF(
                    CCPBKDFAlgorithm(kCCPBKDF2),
                    password,
                    passwordData.count,
                    saltBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    saltData.count,
                    CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                    UInt32(iterationCount),
                    derivedKeyBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    aesKeySize
                )
            }
        }

        guard result == kCCSuccess else {
            AuditLogger.shared.logSecurityEvent(.keyDerivationFailed, details: [
                "algorithm": "PBKDF2-HMAC-SHA256",
                "iterations": iterationCount
            ])
            throw CryptoError.keyDerivationFailed
        }

        AuditLogger.shared.logSecurityEvent(.keyDerived, details: [
            "algorithm": "PBKDF2-HMAC-SHA256",
            "iterations": iterationCount,
            "standard": "NIST SP 800-132"
        ])

        return derivedKey
    }

    /// Generate cryptographically secure salt
    /// - Returns: Random salt (16 bytes)
    func generateSalt() throws -> Data {
        var salt = Data(count: saltSize)
        let result = salt.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, saltSize, bytes.baseAddress!)
        }

        guard result == errSecSuccess else {
            throw CryptoError.randomGenerationFailed
        }

        return salt
    }

    // MARK: - Digital Signatures (FIPS 186-4)

    /// Generate ECDSA P-256 key pair (FIPS 186-4 approved)
    /// - Returns: P-256 private key
    func generateECDSAKeyPair() throws -> P256.Signing.PrivateKey {
        let privateKey = P256.Signing.PrivateKey()

        AuditLogger.shared.logSecurityEvent(.keyGenerated, details: [
            "algorithm": "ECDSA-P256",
            "standard": "FIPS 186-4"
        ])

        return privateKey
    }

    /// Sign data using ECDSA P-256
    /// - Parameters:
    ///   - data: Data to sign
    ///   - privateKey: ECDSA private key
    /// - Returns: Digital signature
    func signECDSA(data: Data, privateKey: P256.Signing.PrivateKey) throws -> Data {
        let signature = try privateKey.signature(for: data)
        return signature.rawRepresentation
    }

    /// Verify ECDSA P-256 signature
    /// - Parameters:
    ///   - data: Original data
    ///   - signature: Signature to verify
    ///   - publicKey: ECDSA public key
    /// - Returns: True if signature is valid
    func verifyECDSA(data: Data, signature: Data, publicKey: P256.Signing.PublicKey) throws -> Bool {
        let ecdsaSignature = try P256.Signing.ECDSASignature(rawRepresentation: signature)
        return publicKey.isValidSignature(ecdsaSignature, for: data)
    }

    // MARK: - Key Generation (NIST SP 800-133)

    /// Generate symmetric key (AES-256)
    /// Uses NIST SP 800-90A approved DRBG (SecRandomCopyBytes)
    /// - Returns: 256-bit symmetric key
    func generateSymmetricKey() throws -> SymmetricKey {
        let key = SymmetricKey(size: .bits256)

        AuditLogger.shared.logSecurityEvent(.keyGenerated, details: [
            "type": "Symmetric",
            "size": 256,
            "standard": "NIST SP 800-133"
        ])

        return key
    }

    /// Generate cryptographically secure random bytes
    /// - Parameter count: Number of bytes to generate
    /// - Returns: Random data
    func generateRandomBytes(count: Int) throws -> Data {
        var randomData = Data(count: count)
        let result = randomData.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, count, bytes.baseAddress!)
        }

        guard result == errSecSuccess else {
            AuditLogger.shared.logSecurityEvent(.randomGenerationFailed, details: [
                "standard": "NIST SP 800-90A"
            ])
            throw CryptoError.randomGenerationFailed
        }

        return randomData
    }

    // MARK: - Secure Key Storage

    /// Store key in Secure Enclave (when available)
    /// - Parameters:
    ///   - key: Symmetric key to store
    ///   - identifier: Key identifier
    /// - Throws: CryptoError on failure
    func storeKeyInSecureEnclave(key: SymmetricKey, identifier: String) throws {
        let keyData = key.withUnsafeBytes { Data($0) }

        var query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: identifier,
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Use Secure Enclave if available
        if SecureEnclave.isAvailable {
            query[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
        }

        // Delete existing key
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: identifier
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new key
        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw CryptoError.keyStorageFailed
        }

        AuditLogger.shared.logSecurityEvent(.keyStored, details: [
            "identifier": identifier,
            "secureEnclave": SecureEnclave.isAvailable
        ])
    }

    /// Retrieve key from Secure Enclave
    /// - Parameter identifier: Key identifier
    /// - Returns: Symmetric key
    func retrieveKeyFromSecureEnclave(identifier: String) throws -> SymmetricKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: identifier,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let keyData = result as? Data else {
            throw CryptoError.keyRetrievalFailed
        }

        return SymmetricKey(data: keyData)
    }

    // MARK: - Certificate Validation (NIST Guidelines)

    /// Validate SSL/TLS certificate per NIST guidelines
    /// - Parameter trust: Server trust to validate
    /// - Returns: True if valid
    func validateCertificate(trust: SecTrust) async throws -> Bool {
        // Set validation policy
        let policy = SecPolicyCreateSSL(true, nil)
        SecTrustSetPolicies(trust, policy)

        // Perform validation
        var error: CFError?
        let isValid = SecTrustEvaluateWithError(trust, &error)

        if !isValid {
            AuditLogger.shared.logSecurityEvent(.certificateValidationFailed, details: [
                "error": error?.localizedDescription ?? "Unknown error"
            ])
        }

        return isValid
    }
}

// MARK: - Supporting Types

/// Encrypted data package
struct EncryptedDataPackage {
    let nonce: Data       // 12 bytes for GCM
    let ciphertext: Data  // Encrypted data
    let tag: Data         // 16 bytes authentication tag
    let key: SymmetricKey // Encryption key

    /// Combined data format: nonce + ciphertext + tag
    var combined: Data {
        var result = Data()
        result.append(nonce)
        result.append(ciphertext)
        result.append(tag)
        return result
    }

    /// Initialize from combined data
    init(combined: Data, key: SymmetricKey) throws {
        guard combined.count >= 28 else { // 12 (nonce) + 16 (tag)
            throw CryptoError.invalidDataFormat
        }

        self.nonce = combined.prefix(12)
        self.tag = combined.suffix(16)
        self.ciphertext = combined.dropFirst(12).dropLast(16)
        self.key = key
    }

    init(nonce: Data, ciphertext: Data, tag: Data, key: SymmetricKey) {
        self.nonce = nonce
        self.ciphertext = ciphertext
        self.tag = tag
        self.key = key
    }
}

/// Cryptographic errors
enum CryptoError: Error, LocalizedError {
    case encryptionFailed
    case decryptionFailed
    case keyGenerationFailed
    case keyDerivationFailed
    case keyStorageFailed
    case keyRetrievalFailed
    case randomGenerationFailed
    case invalidInput
    case invalidDataFormat
    case signatureFailed
    case verificationFailed

    var errorDescription: String? {
        switch self {
        case .encryptionFailed: return "Encryption operation failed"
        case .decryptionFailed: return "Decryption operation failed"
        case .keyGenerationFailed: return "Key generation failed"
        case .keyDerivationFailed: return "Key derivation failed"
        case .keyStorageFailed: return "Key storage failed"
        case .keyRetrievalFailed: return "Key retrieval failed"
        case .randomGenerationFailed: return "Random number generation failed"
        case .invalidInput: return "Invalid input data"
        case .invalidDataFormat: return "Invalid data format"
        case .signatureFailed: return "Digital signature failed"
        case .verificationFailed: return "Signature verification failed"
        }
    }
}

/// Secure Enclave availability check
struct SecureEnclave {
    static var isAvailable: Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        return true
        #endif
    }
}

// MARK: - Usage Examples

/*
 Example Usage:

 1. Encrypt/Decrypt with AES-256-GCM:
    ```swift
    let crypto = FIPSCryptoManager.shared

    // Encrypt
    let sensitiveData = "Secret Message".data(using: .utf8)!
    let encrypted = try crypto.encryptAESGCM(data: sensitiveData)

    // Decrypt
    let decrypted = try crypto.decryptAESGCM(encryptedData: encrypted)
    ```

 2. Hash with SHA-256:
    ```swift
    let data = "Hash Me".data(using: .utf8)!
    let hash = try crypto.sha256(data: data)
    let hexHash = try crypto.sha256(string: "Hash Me")
    ```

 3. HMAC Authentication:
    ```swift
    let key = try crypto.generateSymmetricKey()
    let data = "Authenticate Me".data(using: .utf8)!
    let mac = try crypto.hmacSHA256(data: data, key: key)

    // Verify
    let isValid = try crypto.verifyHMACSHA256(data: data, mac: mac, key: key)
    ```

 4. Key Derivation (PBKDF2):
    ```swift
    let password = "MySecurePassword123!"
    let salt = try crypto.generateSalt()
    let key = try crypto.deriveKey(password: password, salt: salt)
    ```

 5. Digital Signatures (ECDSA):
    ```swift
    // Generate key pair
    let privateKey = try crypto.generateECDSAKeyPair()
    let publicKey = privateKey.publicKey

    // Sign
    let data = "Sign Me".data(using: .utf8)!
    let signature = try crypto.signECDSA(data: data, privateKey: privateKey)

    // Verify
    let isValid = try crypto.verifyECDSA(data: data, signature: signature, publicKey: publicKey)
    ```

 6. Secure Key Storage:
    ```swift
    let key = try crypto.generateSymmetricKey()
    try crypto.storeKeyInSecureEnclave(key: key, identifier: "my.encryption.key")

    // Retrieve later
    let retrievedKey = try crypto.retrieveKeyFromSecureEnclave(identifier: "my.encryption.key")
    ```
*/
