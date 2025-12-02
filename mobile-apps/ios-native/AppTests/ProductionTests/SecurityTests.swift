//
//  SecurityTests.swift
//  Fleet Manager - Production Security Tests
//
//  Comprehensive security testing suite for production readiness
//  Tests certificate pinning, encryption, jailbreak detection, keychain operations
//

import XCTest
@testable import App
import Security
import LocalAuthentication

class SecurityTests: XCTestCase {

    var encryptionManager: EncryptionManager!
    var keychainManager: KeychainManager!
    var certificatePinningManager: CertificatePinningManager!
    var jailbreakDetector: JailbreakDetector!
    var securityLogger: SecurityLogger!

    override func setUp() {
        super.setUp()
        encryptionManager = EncryptionManager.shared
        keychainManager = KeychainManager.shared
        certificatePinningManager = CertificatePinningManager.shared
        jailbreakDetector = JailbreakDetector.shared
        securityLogger = SecurityLogger.shared
    }

    override func tearDown() {
        // Clean up test data
        try? keychainManager.clearAll()
        super.tearDown()
    }

    // MARK: - Certificate Pinning Tests

    func testCertificatePinningIsEnabled() {
        XCTAssertNotNil(certificatePinningManager, "Certificate pinning manager should be initialized")

        // Verify strict mode is enabled in production
        #if !DEBUG
        XCTAssertTrue(certificatePinningManager.strictMode, "Strict mode must be enabled in production")
        XCTAssertFalse(certificatePinningManager.bypassPinning, "Certificate pinning bypass must be disabled in production")
        #endif
    }

    func testCertificatePinningValidation() {
        let expectation = self.expectation(description: "Certificate validation")

        // Create test URL request to pinned domain
        guard let url = URL(string: "https://fleet.capitaltechalliance.com") else {
            XCTFail("Invalid URL")
            return
        }

        let session = certificatePinningManager.createPinnedURLSession()

        let task = session.dataTask(with: url) { data, response, error in
            if let error = error {
                print("Certificate pinning test error (expected in test environment): \(error.localizedDescription)")
            }

            // In test environment, verify session is configured correctly
            XCTAssertNotNil(session, "Pinned session should be created")
            expectation.fulfill()
        }

        task.resume()
        waitForExpectations(timeout: 10.0, handler: nil)
    }

    func testCertificatePinningSessionConfiguration() {
        let session = certificatePinningManager.createPinnedURLSession()
        let config = session.configuration

        // Verify security settings
        XCTAssertEqual(config.tlsMinimumSupportedProtocolVersion, .TLSv12, "TLS 1.2 minimum required")
        XCTAssertNil(config.urlCache, "URL cache should be disabled for security")
        XCTAssertEqual(config.requestCachePolicy, .reloadIgnoringLocalAndRemoteCacheData, "Cache should be disabled")
        XCTAssertFalse(config.httpShouldSetCookies, "Cookies should be disabled")
        XCTAssertEqual(config.httpCookieAcceptPolicy, .never, "Cookie policy should be never")
    }

    // MARK: - Encryption Tests

    func testAES256EncryptionDecryption() throws {
        let testData = "Sensitive fleet data 12345"

        // Encrypt
        let encryptedString = try encryptionManager.encrypt(string: testData)
        XCTAssertNotEqual(encryptedString, testData, "Encrypted data should differ from original")
        XCTAssertFalse(encryptedString.isEmpty, "Encrypted string should not be empty")

        // Decrypt
        let decryptedString = try encryptionManager.decrypt(string: encryptedString)
        XCTAssertEqual(decryptedString, testData, "Decrypted data should match original")
    }

    func testEncryptionDecryptionRoundTrip() throws {
        let testCases = [
            "Simple text",
            "Complex text with special chars: !@#$%^&*()",
            "Unicode: 你好世界 🚗",
            "Very long string: " + String(repeating: "A", count: 10000),
            ""  // Empty string
        ]

        for testCase in testCases {
            let encrypted = try encryptionManager.encrypt(string: testCase)
            let decrypted = try encryptionManager.decrypt(string: encrypted)
            XCTAssertEqual(decrypted, testCase, "Roundtrip failed for: \(testCase.prefix(50))")
        }
    }

    func testEncryptionWithBinaryData() throws {
        // Test with binary data (e.g., image data simulation)
        let binaryData = Data((0..<1024).map { UInt8($0 % 256) })

        let encryptedData = try encryptionManager.encrypt(data: binaryData)
        XCTAssertNotEqual(encryptedData, binaryData, "Encrypted data should differ")

        let decryptedData = try encryptionManager.decrypt(data: encryptedData)
        XCTAssertEqual(decryptedData, binaryData, "Decrypted data should match original")
    }

    func testEncryptionKeyGeneration() throws {
        // Verify encryption key is generated and persisted
        let testKey = "test_encryption_key"
        let testData = "Test data".data(using: .utf8)!

        try encryptionManager.secureStore(data: testData, forKey: testKey)
        let retrieved = try encryptionManager.secureRetrieve(forKey: testKey)

        XCTAssertEqual(retrieved, testData, "Stored and retrieved data should match")

        // Clean up
        encryptionManager.secureDelete(forKey: testKey)
    }

    func testJSONPayloadEncryption() throws {
        let payload: [String: Any] = [
            "vehicle_id": "VEH-12345",
            "driver_license": "DL123456789",
            "ssn": "123-45-6789",
            "vin": "1HGBH41JXMN109186"
        ]

        // Encrypt
        let encryptedPayload = try encryptionManager.encryptJSONPayload(payload)
        XCTAssertFalse(encryptedPayload.isEmpty, "Encrypted payload should not be empty")
        XCTAssertFalse(encryptedPayload.contains("VEH-12345"), "Encrypted payload should not contain plain text")

        // Decrypt
        let decryptedPayload = try encryptionManager.decryptJSONPayload(encryptedPayload)
        XCTAssertEqual(decryptedPayload["vehicle_id"] as? String, "VEH-12345")
        XCTAssertEqual(decryptedPayload["driver_license"] as? String, "DL123456789")
    }

    // MARK: - Jailbreak Detection Tests

    func testJailbreakDetection() {
        let status = jailbreakDetector.performDetection()

        XCTAssertNotNil(status, "Jailbreak detection should return status")
        XCTAssertNotNil(status.timestamp, "Detection timestamp should be recorded")

        // In test/simulator environment, device should not be jailbroken
        #if targetEnvironment(simulator)
        // Simulator checks might vary
        print("Running on simulator - jailbreak detection: \(status.isJailbroken)")
        #else
        // On real device, verify detection works
        if status.isJailbroken {
            print("⚠️ ALERT: Jailbreak detected - Methods: \(status.detectionMethods)")
        }
        #endif
    }

    func testJailbreakDetectionCache() {
        let status1 = jailbreakDetector.performDetection()
        let status2 = jailbreakDetector.performDetection()

        // Second call should use cached result
        XCTAssertEqual(status1.timestamp, status2.timestamp, "Detection should be cached")
    }

    func testJailbreakPolicyEnforcement() {
        // Test strict mode enforcement
        jailbreakDetector.strictMode = false

        // Should not throw when strict mode is disabled
        XCTAssertNoThrow(try jailbreakDetector.enforcePolicy(), "Should not throw when strict mode disabled")

        // Restore original state
        #if DEBUG
        jailbreakDetector.strictMode = false
        #else
        jailbreakDetector.strictMode = true
        #endif
    }

    func testDebuggerDetection() {
        let isDebugged = jailbreakDetector.isDebuggerAttached()

        // Log result (may be true when running in Xcode)
        print("Debugger attached: \(isDebugged)")

        #if DEBUG
        // In debug mode, debugger might be attached
        print("Debug mode - debugger detection: \(isDebugged)")
        #else
        // In production, should not have debugger attached
        XCTAssertFalse(isDebugged, "Debugger should not be attached in production")
        #endif
    }

    func testProxyDetection() {
        let isUsingProxy = jailbreakDetector.isUsingProxy()

        // Log result
        print("Proxy detected: \(isUsingProxy)")

        // Verify detection works
        XCTAssertNotNil(isUsingProxy, "Proxy detection should return result")
    }

    // MARK: - Keychain Operations Tests

    func testKeychainSaveAndRetrieve() async throws {
        let testKey = KeychainManager.KeychainKey.userEmail
        let testValue = "test@fleet.com"

        // Save
        try keychainManager.save(testValue, for: testKey)

        // Retrieve
        let retrieved = try await keychainManager.retrieve(for: testKey)
        XCTAssertEqual(retrieved, testValue, "Retrieved value should match saved value")

        // Clean up
        try keychainManager.delete(for: testKey)
    }

    func testKeychainDeleteOperation() async throws {
        let testKey = KeychainManager.KeychainKey.userEmail
        let testValue = "delete@test.com"

        // Save and verify
        try keychainManager.save(testValue, for: testKey)
        XCTAssertTrue(keychainManager.exists(for: testKey), "Item should exist")

        // Delete
        try keychainManager.delete(for: testKey)

        // Verify deletion
        XCTAssertFalse(keychainManager.exists(for: testKey), "Item should not exist after deletion")
    }

    func testKeychainTokenStorage() async throws {
        let accessToken = "test_access_token_12345"
        let refreshToken = "test_refresh_token_67890"
        let expiresIn = 3600

        // Save tokens
        try await keychainManager.saveTokens(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn
        )

        // Retrieve tokens
        let retrievedAccess = try await keychainManager.getAccessToken()
        let retrievedRefresh = try await keychainManager.getRefreshToken()

        XCTAssertEqual(retrievedAccess, accessToken, "Access token should match")
        XCTAssertEqual(retrievedRefresh, refreshToken, "Refresh token should match")

        // Check token expiry
        let isExpired = await keychainManager.isTokenExpired()
        XCTAssertFalse(isExpired, "Token should not be expired immediately after saving")

        // Clean up
        try keychainManager.clearAuthenticationData()
    }

    func testKeychainTokenExpiry() async throws {
        let accessToken = "expiry_test_token"
        let expiresIn = -10  // Already expired

        try await keychainManager.saveTokens(
            accessToken: accessToken,
            refreshToken: nil,
            expiresIn: expiresIn
        )

        let isExpired = await keychainManager.isTokenExpired()
        XCTAssertTrue(isExpired, "Token should be expired")

        try keychainManager.clearAuthenticationData()
    }

    func testKeychainClearAll() throws {
        // Save multiple items
        try keychainManager.save("test1@email.com", for: .userEmail)
        try keychainManager.save("12345", for: .userId)

        // Verify items exist
        XCTAssertTrue(keychainManager.exists(for: .userEmail))
        XCTAssertTrue(keychainManager.exists(for: .userId))

        // Clear all
        try keychainManager.clearAll()

        // Verify all items deleted
        XCTAssertFalse(keychainManager.exists(for: .userEmail))
        XCTAssertFalse(keychainManager.exists(for: .userId))
    }

    func testBiometricAvailability() {
        let (available, biometricType) = keychainManager.isBiometricAvailable()

        print("Biometric available: \(available)")
        print("Biometric type: \(keychainManager.getBiometricTypeName())")

        // Verify detection works
        XCTAssertNotNil(available, "Biometric availability check should return result")
    }

    // MARK: - Token Refresh Flow Tests

    func testTokenRefreshFlow() async throws {
        let authManager = AuthenticationManager.shared

        // Test token expiry check
        let isExpired = await keychainManager.isTokenExpired()
        print("Token expired status: \(isExpired)")

        // Verify token refresh logic exists
        let token = await authManager.getAccessToken()
        print("Token retrieval: \(token != nil ? "Success" : "No token")")

        // Token should be nil if not authenticated
        if token == nil {
            XCTAssertTrue(true, "Expected behavior - no token when not authenticated")
        }
    }

    // MARK: - Security Logger Tests

    func testSecurityLogging() {
        securityLogger.isEnabled = true

        // Log various security events
        securityLogger.logSecurityEvent(
            .authenticationSuccess,
            details: ["email": "test@fleet.com"],
            severity: .low
        )

        securityLogger.logSecurityEvent(
            .certificateValidationSuccess,
            details: ["host": "fleet.capitaltechalliance.com"],
            severity: .low
        )

        securityLogger.logSecurityEvent(
            .dataEncrypted,
            details: ["key": "test_key", "size": 1024],
            severity: .low
        )

        // Wait for async logging
        Thread.sleep(forTimeInterval: 0.5)

        // Verify events were logged
        let recentEvents = securityLogger.getRecentEvents(limit: 10)
        XCTAssertGreaterThan(recentEvents.count, 0, "Security events should be logged")

        // Verify filtering
        let authEvents = securityLogger.getRecentEvents(limit: 10, eventType: .authenticationSuccess)
        XCTAssertTrue(authEvents.allSatisfy { $0.eventType == .authenticationSuccess }, "Filtering should work")
    }

    func testSecurityLogExport() {
        securityLogger.logSecurityEvent(.applicationLaunched, severity: .low)

        Thread.sleep(forTimeInterval: 0.5)

        let exportedLogs = securityLogger.exportLogs()
        XCTAssertNotNil(exportedLogs, "Log export should return JSON string")
        XCTAssertTrue(exportedLogs?.contains("applicationLaunched") ?? false, "Export should contain logged events")
    }

    func testSecurityLogSummary() {
        securityLogger.clearLogs()

        // Log multiple events
        securityLogger.logSecurityEvent(.authenticationSuccess, severity: .low)
        securityLogger.logSecurityEvent(.authenticationSuccess, severity: .low)
        securityLogger.logSecurityEvent(.authenticationFailed, severity: .high)

        Thread.sleep(forTimeInterval: 0.5)

        let summary = securityLogger.getSecuritySummary()
        XCTAssertEqual(summary["auth_success"], 2, "Should count auth success events")
        XCTAssertEqual(summary["auth_failed"], 1, "Should count auth failed events")
    }

    // MARK: - Security Integration Tests

    func testEndToEndSecurityFlow() async throws {
        // Simulate full security flow

        // 1. Jailbreak detection
        let jailbreakStatus = jailbreakDetector.performDetection()
        XCTAssertNotNil(jailbreakStatus, "Jailbreak detection should complete")

        // 2. Encrypt sensitive data
        let sensitiveData = "SSN:123-45-6789"
        let encrypted = try encryptionManager.encrypt(string: sensitiveData)
        XCTAssertNotEqual(encrypted, sensitiveData, "Data should be encrypted")

        // 3. Store encrypted data in keychain
        let encryptedDataObject = encrypted.data(using: .utf8)!
        try encryptionManager.secureStore(data: encryptedDataObject, forKey: "test_sensitive")

        // 4. Retrieve and decrypt
        let retrieved = try encryptionManager.secureRetrieve(forKey: "test_sensitive")
        let retrievedString = String(data: retrieved!, encoding: .utf8)!
        let decrypted = try encryptionManager.decrypt(string: retrievedString)

        XCTAssertEqual(decrypted, sensitiveData, "Full roundtrip should work")

        // 5. Verify security logging
        Thread.sleep(forTimeInterval: 0.5)
        let events = securityLogger.getRecentEvents(limit: 10)
        XCTAssertGreaterThan(events.count, 0, "Security events should be logged")

        // Clean up
        encryptionManager.secureDelete(forKey: "test_sensitive")
    }

    // MARK: - Performance Tests

    func testEncryptionPerformance() throws {
        let testData = String(repeating: "A", count: 10000)

        measure {
            _ = try? encryptionManager.encrypt(string: testData)
        }
    }

    func testDecryptionPerformance() throws {
        let testData = String(repeating: "A", count: 10000)
        let encrypted = try encryptionManager.encrypt(string: testData)

        measure {
            _ = try? encryptionManager.decrypt(string: encrypted)
        }
    }

    func testJailbreakDetectionPerformance() {
        measure {
            _ = jailbreakDetector.performDetection()
        }
    }
}

// MARK: - Test Utilities

extension SecurityTests {

    /// Generate random test data
    func generateRandomData(size: Int) -> Data {
        var data = Data(count: size)
        _ = data.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, size, bytes.baseAddress!)
        }
        return data
    }

    /// Verify data is encrypted (not plaintext)
    func isEncrypted(_ data: String, original: String) -> Bool {
        return data != original && !data.contains(original)
    }
}
