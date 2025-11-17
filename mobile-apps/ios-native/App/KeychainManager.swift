//
//  KeychainManager.swift
//  Fleet Manager - Secure Keychain Storage
//
//  Provides secure storage for authentication tokens and credentials
//  using iOS Keychain Services with modern async/await API
//

import Foundation
import Security
import LocalAuthentication

// MARK: - Keychain Manager

class KeychainManager {
    static let shared = KeychainManager()

    private let serviceName = "com.fleet.capitaltechalliance"

    // MARK: - Keychain Keys

    enum KeychainKey: String {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case userEmail = "user_email"
        case userId = "user_id"
        case tokenExpiry = "token_expiry"
        case biometricEnabled = "biometric_enabled"
    }

    // MARK: - Error Types

    enum KeychainError: Error, LocalizedError {
        case itemNotFound
        case duplicateItem
        case invalidData
        case authenticationFailed
        case unhandledError(status: OSStatus)

        var errorDescription: String? {
            switch self {
            case .itemNotFound:
                return "Item not found in keychain"
            case .duplicateItem:
                return "Item already exists in keychain"
            case .invalidData:
                return "Invalid data format"
            case .authenticationFailed:
                return "Biometric authentication failed"
            case .unhandledError(let status):
                return "Keychain error: \(status)"
            }
        }
    }

    private init() {}

    // MARK: - Save Operations

    /// Save string value to keychain
    func save(_ value: String, for key: KeychainKey, requireBiometric: Bool = false) throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.invalidData
        }

        try saveData(data, for: key, requireBiometric: requireBiometric)
    }

    /// Save data to keychain
    func saveData(_ data: Data, for key: KeychainKey, requireBiometric: Bool = false) throws {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key.rawValue,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Add biometric authentication requirement
        if requireBiometric {
            let access = SecAccessControlCreateWithFlags(
                nil,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                .biometryCurrentSet,
                nil
            )
            if let access = access {
                query[kSecAttrAccessControl as String] = access
            }
        }

        // Delete existing item first
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key.rawValue
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    // MARK: - Retrieve Operations

    /// Retrieve string value from keychain
    func retrieve(for key: KeychainKey, requireBiometric: Bool = false) async throws -> String {
        let data = try await retrieveData(for: key, requireBiometric: requireBiometric)

        guard let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.invalidData
        }

        return string
    }

    /// Retrieve data from keychain
    func retrieveData(for key: KeychainKey, requireBiometric: Bool = false) async throws -> Data {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        // Add biometric authentication prompt
        if requireBiometric {
            let context = LAContext()
            context.localizedReason = "Authenticate to access your account"
            query[kSecUseAuthenticationContext as String] = context
        }

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.itemNotFound
            }
            throw KeychainError.unhandledError(status: status)
        }

        guard let data = result as? Data else {
            throw KeychainError.invalidData
        }

        return data
    }

    // MARK: - Delete Operations

    /// Delete item from keychain
    func delete(for key: KeychainKey) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key.rawValue
        ]

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    /// Clear all keychain items for this service
    func clearAll() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName
        ]

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }

    // MARK: - Biometric Authentication

    /// Check if biometric authentication is available
    func isBiometricAvailable() -> (available: Bool, biometricType: LABiometryType) {
        let context = LAContext()
        var error: NSError?

        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)

        return (available, context.biometryType)
    }

    /// Authenticate user with biometrics
    func authenticateWithBiometrics(reason: String = "Authenticate to access your account") async throws -> Bool {
        let context = LAContext()

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) else {
            throw KeychainError.authenticationFailed
        }

        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            return success
        } catch {
            throw KeychainError.authenticationFailed
        }
    }

    /// Get biometric type name for UI display
    func getBiometricTypeName() -> String {
        let (available, type) = isBiometricAvailable()

        guard available else { return "Biometric" }

        switch type {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .opticID:
            return "Optic ID"
        case .none:
            return "Biometric"
        @unknown default:
            return "Biometric"
        }
    }

    // MARK: - Convenience Methods

    /// Check if item exists in keychain
    func exists(for key: KeychainKey) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: false
        ]

        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecSuccess
    }
}

// MARK: - Token Storage Extension

extension KeychainManager {

    /// Save authentication tokens
    func saveTokens(accessToken: String, refreshToken: String?, expiresIn: Int) async throws {
        // Save access token
        try save(accessToken, for: .accessToken)

        // Save refresh token if provided
        if let refreshToken = refreshToken {
            try save(refreshToken, for: .refreshToken)
        }

        // Calculate and save expiry date
        let expiryDate = Date().addingTimeInterval(TimeInterval(expiresIn))
        let expiryString = ISO8601DateFormatter().string(from: expiryDate)
        try save(expiryString, for: .tokenExpiry)
    }

    /// Retrieve access token
    func getAccessToken() async throws -> String {
        return try await retrieve(for: .accessToken)
    }

    /// Retrieve refresh token
    func getRefreshToken() async throws -> String? {
        do {
            return try await retrieve(for: .refreshToken)
        } catch KeychainError.itemNotFound {
            return nil
        }
    }

    /// Check if access token is expired
    func isTokenExpired() async -> Bool {
        do {
            let expiryString = try await retrieve(for: .tokenExpiry)
            guard let expiryDate = ISO8601DateFormatter().date(from: expiryString) else {
                return true
            }

            // Add 60 second buffer before expiry
            return Date().addingTimeInterval(60) >= expiryDate
        } catch {
            return true
        }
    }

    /// Clear all authentication data
    func clearAuthenticationData() throws {
        try delete(for: .accessToken)
        try delete(for: .refreshToken)
        try delete(for: .tokenExpiry)
        try delete(for: .userEmail)
        try delete(for: .userId)
    }
}
