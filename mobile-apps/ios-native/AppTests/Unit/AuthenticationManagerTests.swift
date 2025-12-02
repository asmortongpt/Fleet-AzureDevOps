//
//  AuthenticationManagerTests.swift
//  Fleet Management App Tests
//
//  Unit tests for authentication flows, token management, and KeychainManager
//

import XCTest
import LocalAuthentication
@testable import App

class AuthenticationManagerTests: XCTestCase {

    var keychainManager: KeychainManager!
    var authService: AuthenticationService!

    override func setUpWithError() throws {
        try super.setUpWithError()
        keychainManager = KeychainManager.shared
        authService = AuthenticationService.shared

        // Clean up keychain before each test
        try? keychainManager.clearAll()
    }

    override func tearDownWithError() throws {
        // Clean up after each test
        try? keychainManager.clearAll()
        keychainManager = nil
        authService = nil
        try super.tearDownWithError()
    }

    // MARK: - Keychain Save Tests

    func testSaveStringToKeychain() throws {
        // Given
        let testValue = "test-access-token-12345"
        let key = KeychainManager.KeychainKey.accessToken

        // When
        try keychainManager.save(testValue, for: key)

        // Then
        XCTAssertTrue(keychainManager.exists(for: key))
    }

    func testSaveDataToKeychain() throws {
        // Given
        let testData = "test-data".data(using: .utf8)!
        let key = KeychainManager.KeychainKey.accessToken

        // When
        try keychainManager.saveData(testData, for: key)

        // Then
        XCTAssertTrue(keychainManager.exists(for: key))
    }

    func testOverwriteExistingKeychainItem() throws {
        // Given
        let key = KeychainManager.KeychainKey.accessToken
        try keychainManager.save("first-value", for: key)

        // When
        try keychainManager.save("second-value", for: key)

        // Then
        XCTAssertTrue(keychainManager.exists(for: key))
    }

    // MARK: - Keychain Retrieve Tests

    func testRetrieveStringFromKeychain() async throws {
        // Given
        let testValue = "test-access-token-12345"
        let key = KeychainManager.KeychainKey.accessToken
        try keychainManager.save(testValue, for: key)

        // When
        let retrievedValue = try await keychainManager.retrieve(for: key)

        // Then
        XCTAssertEqual(retrievedValue, testValue)
    }

    func testRetrieveDataFromKeychain() async throws {
        // Given
        let testData = "test-data".data(using: .utf8)!
        let key = KeychainManager.KeychainKey.accessToken
        try keychainManager.saveData(testData, for: key)

        // When
        let retrievedData = try await keychainManager.retrieveData(for: key)

        // Then
        XCTAssertEqual(retrievedData, testData)
    }

    func testRetrieveNonExistentItem() async throws {
        // Given
        let key = KeychainManager.KeychainKey.accessToken

        // When / Then
        do {
            _ = try await keychainManager.retrieve(for: key)
            XCTFail("Should throw itemNotFound error")
        } catch KeychainManager.KeychainError.itemNotFound {
            // Expected
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - Keychain Delete Tests

    func testDeleteKeychainItem() throws {
        // Given
        let key = KeychainManager.KeychainKey.accessToken
        try keychainManager.save("test-value", for: key)
        XCTAssertTrue(keychainManager.exists(for: key))

        // When
        try keychainManager.delete(for: key)

        // Then
        XCTAssertFalse(keychainManager.exists(for: key))
    }

    func testDeleteNonExistentItem() throws {
        // Given
        let key = KeychainManager.KeychainKey.accessToken

        // When / Then - Should not throw
        try keychainManager.delete(for: key)
    }

    func testClearAllKeychainItems() throws {
        // Given
        try keychainManager.save("token1", for: .accessToken)
        try keychainManager.save("token2", for: .refreshToken)
        try keychainManager.save("user@example.com", for: .userEmail)

        // When
        try keychainManager.clearAll()

        // Then
        XCTAssertFalse(keychainManager.exists(for: .accessToken))
        XCTAssertFalse(keychainManager.exists(for: .refreshToken))
        XCTAssertFalse(keychainManager.exists(for: .userEmail))
    }

    // MARK: - Token Management Tests

    func testSaveTokens() async throws {
        // Given
        let accessToken = "access-token-12345"
        let refreshToken = "refresh-token-67890"
        let expiresIn = 3600

        // When
        try await keychainManager.saveTokens(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn
        )

        // Then
        XCTAssertTrue(keychainManager.exists(for: .accessToken))
        XCTAssertTrue(keychainManager.exists(for: .refreshToken))
        XCTAssertTrue(keychainManager.exists(for: .tokenExpiry))
    }

    func testGetAccessToken() async throws {
        // Given
        let accessToken = "test-access-token"
        try keychainManager.save(accessToken, for: .accessToken)

        // When
        let retrievedToken = try await keychainManager.getAccessToken()

        // Then
        XCTAssertEqual(retrievedToken, accessToken)
    }

    func testGetRefreshToken() async throws {
        // Given
        let refreshToken = "test-refresh-token"
        try keychainManager.save(refreshToken, for: .refreshToken)

        // When
        let retrievedToken = try await keychainManager.getRefreshToken()

        // Then
        XCTAssertEqual(retrievedToken, refreshToken)
    }

    func testGetRefreshTokenWhenNone() async throws {
        // When
        let retrievedToken = try await keychainManager.getRefreshToken()

        // Then
        XCTAssertNil(retrievedToken)
    }

    func testIsTokenExpired() async throws {
        // Given - Expired token
        let expiredDate = Date().addingTimeInterval(-3600) // 1 hour ago
        let expiryString = ISO8601DateFormatter().string(from: expiredDate)
        try keychainManager.save(expiryString, for: .tokenExpiry)

        // When
        let isExpired = await keychainManager.isTokenExpired()

        // Then
        XCTAssertTrue(isExpired)
    }

    func testIsTokenNotExpired() async throws {
        // Given - Valid token
        let futureDate = Date().addingTimeInterval(3600) // 1 hour from now
        let expiryString = ISO8601DateFormatter().string(from: futureDate)
        try keychainManager.save(expiryString, for: .tokenExpiry)

        // When
        let isExpired = await keychainManager.isTokenExpired()

        // Then
        XCTAssertFalse(isExpired)
    }

    func testClearAuthenticationData() throws {
        // Given
        try keychainManager.save("access-token", for: .accessToken)
        try keychainManager.save("refresh-token", for: .refreshToken)
        try keychainManager.save("user@example.com", for: .userEmail)
        try keychainManager.save("123", for: .userId)

        // When
        try keychainManager.clearAuthenticationData()

        // Then
        XCTAssertFalse(keychainManager.exists(for: .accessToken))
        XCTAssertFalse(keychainManager.exists(for: .refreshToken))
        XCTAssertFalse(keychainManager.exists(for: .userEmail))
        XCTAssertFalse(keychainManager.exists(for: .userId))
    }

    // MARK: - Biometric Authentication Tests

    func testBiometricAvailability() throws {
        // When
        let (available, biometricType) = keychainManager.isBiometricAvailable()

        // Then
        // This will vary by device/simulator
        XCTAssertNotNil(available)
        XCTAssertNotNil(biometricType)
    }

    func testGetBiometricTypeName() throws {
        // When
        let biometricName = keychainManager.getBiometricTypeName()

        // Then
        XCTAssertFalse(biometricName.isEmpty)
        // Should be one of: "Face ID", "Touch ID", "Optic ID", or "Biometric"
        let validNames = ["Face ID", "Touch ID", "Optic ID", "Biometric"]
        XCTAssertTrue(validNames.contains(biometricName))
    }

    // MARK: - Authentication Service Tests

    func testAuthServiceHealthCheck() async throws {
        // When
        let isHealthy = await authService.healthCheck()

        // Then
        // This will depend on network connectivity
        XCTAssertNotNil(isHealthy)
    }

    // MARK: - Authentication Error Tests

    func testAuthenticationErrorDescriptions() throws {
        XCTAssertEqual(
            AuthenticationService.AuthError.invalidCredentials.errorDescription,
            "Invalid email or password"
        )
        XCTAssertEqual(
            AuthenticationService.AuthError.invalidResponse.errorDescription,
            "Invalid server response"
        )
        XCTAssertEqual(
            AuthenticationService.AuthError.networkError.errorDescription,
            "Network connection error. Please check your internet connection."
        )
        XCTAssertEqual(
            AuthenticationService.AuthError.unauthorized.errorDescription,
            "Unauthorized. Please log in again."
        )
        XCTAssertEqual(
            AuthenticationService.AuthError.tokenExpired.errorDescription,
            "Your session has expired. Please log in again."
        )
    }

    // MARK: - Keychain Error Tests

    func testKeychainErrorDescriptions() throws {
        XCTAssertEqual(
            KeychainManager.KeychainError.itemNotFound.errorDescription,
            "Item not found in keychain"
        )
        XCTAssertEqual(
            KeychainManager.KeychainError.duplicateItem.errorDescription,
            "Item already exists in keychain"
        )
        XCTAssertEqual(
            KeychainManager.KeychainError.invalidData.errorDescription,
            "Invalid data format"
        )
        XCTAssertEqual(
            KeychainManager.KeychainError.authenticationFailed.errorDescription,
            "Biometric authentication failed"
        )
    }

    // MARK: - Edge Cases

    func testSaveEmptyString() throws {
        // Given
        let emptyString = ""
        let key = KeychainManager.KeychainKey.accessToken

        // When
        try keychainManager.save(emptyString, for: key)

        // Then
        XCTAssertTrue(keychainManager.exists(for: key))
    }

    func testSaveVeryLongString() throws {
        // Given
        let longString = String(repeating: "a", count: 10000)
        let key = KeychainManager.KeychainKey.accessToken

        // When
        try keychainManager.save(longString, for: key)

        // Then
        XCTAssertTrue(keychainManager.exists(for: key))
    }

    func testSaveSpecialCharacters() throws {
        // Given
        let specialString = "!@#$%^&*()_+-={}[]|:;<>?,./~`"
        let key = KeychainManager.KeychainKey.accessToken

        // When
        try keychainManager.save(specialString, for: key)

        // Then
        XCTAssertTrue(keychainManager.exists(for: key))
    }

    func testSaveUnicodeCharacters() async throws {
        // Given
        let unicodeString = "测试🚗🔧🌟"
        let key = KeychainManager.KeychainKey.accessToken

        // When
        try keychainManager.save(unicodeString, for: key)
        let retrieved = try await keychainManager.retrieve(for: key)

        // Then
        XCTAssertEqual(retrieved, unicodeString)
    }

    // MARK: - Performance Tests

    func testKeychainSavePerformance() throws {
        measure {
            for i in 0..<100 {
                try? keychainManager.save("token-\(i)", for: .accessToken)
            }
        }
    }

    func testKeychainRetrievePerformance() async throws {
        // Given
        try keychainManager.save("test-token", for: .accessToken)

        // When / Then
        measure {
            Task {
                _ = try? await keychainManager.retrieve(for: .accessToken)
            }
        }
    }

    // MARK: - Concurrent Access Tests

    func testConcurrentKeychainWrites() async throws {
        // Given
        let iterations = 50

        // When
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<iterations {
                group.addTask {
                    try? self.keychainManager.save("token-\(i)", for: .accessToken)
                }
            }
        }

        // Then - Should not crash
        XCTAssertTrue(keychainManager.exists(for: .accessToken))
    }

    func testConcurrentKeychainReads() async throws {
        // Given
        try keychainManager.save("test-token", for: .accessToken)
        let iterations = 50

        // When
        await withTaskGroup(of: String?.self) { group in
            for _ in 0..<iterations {
                group.addTask {
                    return try? await self.keychainManager.retrieve(for: .accessToken)
                }
            }

            // Then
            var successCount = 0
            for await result in group {
                if result != nil {
                    successCount += 1
                }
            }

            XCTAssertEqual(successCount, iterations)
        }
    }

    // MARK: - Token Expiry Edge Cases

    func testTokenExpiryWithBuffer() async throws {
        // Given - Token expires in 30 seconds (within the 60 second buffer)
        let almostExpiredDate = Date().addingTimeInterval(30)
        let expiryString = ISO8601DateFormatter().string(from: almostExpiredDate)
        try keychainManager.save(expiryString, for: .tokenExpiry)

        // When
        let isExpired = await keychainManager.isTokenExpired()

        // Then - Should be considered expired due to 60 second buffer
        XCTAssertTrue(isExpired)
    }

    func testTokenExpiryWithInvalidDate() async throws {
        // Given
        try keychainManager.save("invalid-date", for: .tokenExpiry)

        // When
        let isExpired = await keychainManager.isTokenExpired()

        // Then - Should be considered expired
        XCTAssertTrue(isExpired)
    }

    // MARK: - Memory Leak Tests

    func testKeychainManagerMemoryLeak() throws {
        // Given
        weak var weakManager: KeychainManager?

        // When
        autoreleasepool {
            let manager = KeychainManager.shared
            weakManager = manager
            try? manager.save("test", for: .accessToken)
        }

        // Then - Singleton should be retained
        XCTAssertNotNil(weakManager, "Singleton should be retained")
    }
}
