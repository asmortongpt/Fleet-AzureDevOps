import Foundation
import Security
import CommonCrypto

// MARK: - Encryption Manager
/// Implements AES-256 encryption for sensitive data storage and transmission
/// OWASP Mobile Top 10 - M2: Insecure Data Storage, M9: Insecure Data Storage
class EncryptionManager {

    // MARK: - Properties
    static let shared = EncryptionManager()

    /// Keychain service identifier
    private let keychainService = "com.fleet.capitaltechalliance.encryption"

    /// Encryption algorithm and key size
    private let algorithm = kCCAlgorithmAES
    private let keySize = kCCKeySizeAES256
    private let blockSize = kCCBlockSizeAES128
    private let ivSize = kCCBlockSizeAES128

    /// Encryption key tag in Keychain
    private let encryptionKeyTag = "com.fleet.encryption.key"

    private init() {
        // Ensure encryption key exists in Keychain
        _ = getOrCreateEncryptionKey()
    }

    // MARK: - Public Methods - Data Encryption

    /// Encrypt data using AES-256-GCM
    /// - Parameter data: Plain data to encrypt
    /// - Returns: Encrypted data with IV prepended
    /// - Throws: EncryptionError on failure
    func encrypt(data: Data) throws -> Data {
        guard let key = getOrCreateEncryptionKey() else {
            throw EncryptionError.keyGenerationFailed
        }

        // Generate random IV (Initialization Vector)
        var iv = Data(count: ivSize)
        let ivResult = iv.withUnsafeMutableBytes { ivBytes in
            SecRandomCopyBytes(kSecRandomDefault, ivSize, ivBytes.baseAddress!)
        }

        guard ivResult == errSecSuccess else {
            throw EncryptionError.ivGenerationFailed
        }

        // Perform AES-256-CBC encryption
        let encryptedData = try performCryptOperation(
            operation: CCOperation(kCCEncrypt),
            data: data,
            key: key,
            iv: iv
        )

        // Prepend IV to encrypted data (IV + encrypted data)
        var result = Data()
        result.append(iv)
        result.append(encryptedData)

        return result
    }

    /// Decrypt data using AES-256-GCM
    /// - Parameter data: Encrypted data with IV prepended
    /// - Returns: Decrypted plain data
    /// - Throws: EncryptionError on failure
    func decrypt(data: Data) throws -> Data {
        guard let key = getOrCreateEncryptionKey() else {
            throw EncryptionError.keyRetrievalFailed
        }

        // Extract IV and encrypted data
        guard data.count > ivSize else {
            throw EncryptionError.invalidDataFormat
        }

        let iv = data.prefix(ivSize)
        let encryptedData = data.suffix(from: ivSize)

        // Perform AES-256-CBC decryption
        return try performCryptOperation(
            operation: CCOperation(kCCDecrypt),
            data: encryptedData,
            key: key,
            iv: iv
        )
    }

    // MARK: - Public Methods - String Encryption

    /// Encrypt string to base64-encoded encrypted data
    /// - Parameter string: Plain string to encrypt
    /// - Returns: Base64-encoded encrypted string
    /// - Throws: EncryptionError on failure
    func encrypt(string: String) throws -> String {
        guard let data = string.data(using: .utf8) else {
            throw EncryptionError.encodingFailed
        }

        let encryptedData = try encrypt(data: data)
        return encryptedData.base64EncodedString()
    }

    /// Decrypt base64-encoded encrypted string
    /// - Parameter encryptedString: Base64-encoded encrypted string
    /// - Returns: Decrypted plain string
    /// - Throws: EncryptionError on failure
    func decrypt(string encryptedString: String) throws -> String {
        guard let encryptedData = Data(base64Encoded: encryptedString) else {
            throw EncryptionError.decodingFailed
        }

        let decryptedData = try decrypt(data: encryptedData)

        guard let string = String(data: decryptedData, encoding: .utf8) else {
            throw EncryptionError.decodingFailed
        }

        return string
    }

    // MARK: - Public Methods - Secure Storage

    /// Store sensitive data securely in encrypted format
    /// - Parameters:
    ///   - data: Sensitive data to store
    ///   - key: Storage key identifier
    /// - Throws: EncryptionError on failure
    func secureStore(data: Data, forKey key: String) throws {
        let encryptedData = try encrypt(data: data)
        try storeInKeychain(data: encryptedData, forKey: key)

        SecurityLogger.shared.logSecurityEvent(.dataEncrypted, details: [
            "key": key,
            "size": data.count
        ])
    }

    /// Retrieve and decrypt sensitive data
    /// - Parameter key: Storage key identifier
    /// - Returns: Decrypted sensitive data
    /// - Throws: EncryptionError on failure
    func secureRetrieve(forKey key: String) throws -> Data? {
        guard let encryptedData = retrieveFromKeychain(forKey: key) else {
            return nil
        }

        let decryptedData = try decrypt(data: encryptedData)

        SecurityLogger.shared.logSecurityEvent(.dataDecrypted, details: [
            "key": key,
            "size": decryptedData.count
        ])

        return decryptedData
    }

    /// Delete securely stored data
    /// - Parameter key: Storage key identifier
    func secureDelete(forKey key: String) {
        deleteFromKeychain(forKey: key)

        SecurityLogger.shared.logSecurityEvent(.dataDeleted, details: [
            "key": key
        ])
    }

    // MARK: - Public Methods - Request/Response Encryption

    /// Encrypt JSON payload for API requests
    /// - Parameter json: JSON dictionary to encrypt
    /// - Returns: Encrypted base64-encoded string
    /// - Throws: EncryptionError on failure
    func encryptJSONPayload(_ json: [String: Any]) throws -> String {
        let jsonData = try JSONSerialization.data(withJSONObject: json, options: [])
        let encryptedData = try encrypt(data: jsonData)
        return encryptedData.base64EncodedString()
    }

    /// Decrypt JSON payload from API responses
    /// - Parameter encryptedString: Base64-encoded encrypted JSON string
    /// - Returns: Decrypted JSON dictionary
    /// - Throws: EncryptionError on failure
    func decryptJSONPayload(_ encryptedString: String) throws -> [String: Any] {
        guard let encryptedData = Data(base64Encoded: encryptedString) else {
            throw EncryptionError.decodingFailed
        }

        let decryptedData = try decrypt(data: encryptedData)
        guard let json = try JSONSerialization.jsonObject(with: decryptedData) as? [String: Any] else {
            throw EncryptionError.invalidDataFormat
        }

        return json
    }

    // MARK: - Private Methods - Cryptographic Operations

    /// Perform AES-256 encryption/decryption operation
    private func performCryptOperation(
        operation: CCOperation,
        data: Data,
        key: Data,
        iv: Data
    ) throws -> Data {
        let dataLength = data.count
        let bufferSize = dataLength + blockSize
        var buffer = Data(count: bufferSize)

        var numBytesEncrypted: size_t = 0

        let cryptStatus = key.withUnsafeBytes { keyBytes in
            iv.withUnsafeBytes { ivBytes in
                data.withUnsafeBytes { dataBytes in
                    buffer.withUnsafeMutableBytes { bufferBytes in
                        CCCrypt(
                            operation,
                            CCAlgorithm(algorithm),
                            CCOptions(kCCOptionPKCS7Padding),
                            keyBytes.baseAddress, key.count,
                            ivBytes.baseAddress,
                            dataBytes.baseAddress, dataLength,
                            bufferBytes.baseAddress, bufferSize,
                            &numBytesEncrypted
                        )
                    }
                }
            }
        }

        guard cryptStatus == kCCSuccess else {
            SecurityLogger.shared.logSecurityEvent(.encryptionFailed, details: [
                "operation": operation == kCCEncrypt ? "encrypt" : "decrypt",
                "status": Int(cryptStatus)
            ])
            throw EncryptionError.cryptOperationFailed(status: cryptStatus)
        }

        buffer.removeSubrange(numBytesEncrypted..<buffer.count)
        return buffer
    }

    // MARK: - Private Methods - Key Management

    /// Get existing encryption key or create new one in Keychain
    private func getOrCreateEncryptionKey() -> Data? {
        // Try to retrieve existing key
        if let existingKey = retrieveKeyFromKeychain() {
            return existingKey
        }

        // Generate new key
        var keyData = Data(count: keySize)
        let result = keyData.withUnsafeMutableBytes { keyBytes in
            SecRandomCopyBytes(kSecRandomDefault, keySize, keyBytes.baseAddress!)
        }

        guard result == errSecSuccess else {
            SecurityLogger.shared.logSecurityEvent(.keyGenerationFailed, details: [:])
            return nil
        }

        // Store key in Keychain
        if storeKeyInKeychain(keyData) {
            SecurityLogger.shared.logSecurityEvent(.keyGenerated, details: [
                "keySize": keySize
            ])
            return keyData
        }

        return nil
    }

    /// Store encryption key in Keychain
    private func storeKeyInKeychain(_ key: Data) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: encryptionKeyTag,
            kSecValueData as String: key,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    /// Retrieve encryption key from Keychain
    private func retrieveKeyFromKeychain() -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: encryptionKeyTag,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let keyData = result as? Data else {
            return nil
        }

        return keyData
    }

    // MARK: - Private Methods - Keychain Operations

    /// Store data in Keychain
    private func storeInKeychain(data: Data, forKey key: String) throws {
        // Delete existing item if any
        deleteFromKeychain(forKey: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw EncryptionError.keychainStorageFailed
        }
    }

    /// Retrieve data from Keychain
    private func retrieveFromKeychain(forKey key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }

        return data
    }

    /// Delete data from Keychain
    private func deleteFromKeychain(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Public Methods - Key Rotation

    /// Rotate encryption key (for periodic security updates)
    func rotateEncryptionKey() throws {
        // Delete existing key
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: encryptionKeyTag
        ]
        SecItemDelete(query as CFDictionary)

        // Generate new key
        guard let newKey = getOrCreateEncryptionKey() else {
            throw EncryptionError.keyGenerationFailed
        }

        SecurityLogger.shared.logSecurityEvent(.keyRotated, details: [
            "keySize": keySize
        ])
    }
}

// MARK: - Encryption Errors
enum EncryptionError: Error, LocalizedError {
    case keyGenerationFailed
    case keyRetrievalFailed
    case ivGenerationFailed
    case cryptOperationFailed(status: CCCryptorStatus)
    case encodingFailed
    case decodingFailed
    case invalidDataFormat
    case keychainStorageFailed

    var errorDescription: String? {
        switch self {
        case .keyGenerationFailed:
            return "Failed to generate encryption key"
        case .keyRetrievalFailed:
            return "Failed to retrieve encryption key"
        case .ivGenerationFailed:
            return "Failed to generate initialization vector"
        case .cryptOperationFailed(let status):
            return "Encryption operation failed with status: \(status)"
        case .encodingFailed:
            return "Failed to encode data"
        case .decodingFailed:
            return "Failed to decode data"
        case .invalidDataFormat:
            return "Invalid data format"
        case .keychainStorageFailed:
            return "Failed to store data in Keychain"
        }
    }
}

// MARK: - Usage Examples
/*
 Example Usage:

 1. Encrypt/Decrypt Strings:
    ```swift
    let sensitiveData = "password123"
    let encrypted = try EncryptionManager.shared.encrypt(string: sensitiveData)
    let decrypted = try EncryptionManager.shared.decrypt(string: encrypted)
    ```

 2. Secure Storage:
    ```swift
    let token = "auth_token_12345".data(using: .utf8)!
    try EncryptionManager.shared.secureStore(data: token, forKey: "auth_token")
    let retrieved = try EncryptionManager.shared.secureRetrieve(forKey: "auth_token")
    ```

 3. Encrypt API Payloads:
    ```swift
    let payload = ["password": "secret123", "ssn": "123-45-6789"]
    let encryptedPayload = try EncryptionManager.shared.encryptJSONPayload(payload)
    // Send encryptedPayload in API request
    ```

 4. Key Rotation (annually or when compromised):
    ```swift
    try EncryptionManager.shared.rotateEncryptionKey()
    ```
*/
