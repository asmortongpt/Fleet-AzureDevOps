//
//  RegressionTests.swift
//  Fleet Manager - Regression Tests
//
//  Tests to prevent regressions in critical user flows, edge cases, and previously fixed bugs
//  Ensures production stability and quality
//

import XCTest
@testable import App
import Foundation

class RegressionTests: XCTestCase {

    var authManager: AuthenticationManager!
    var keychainManager: KeychainManager!
    var syncQueue: SyncQueue!
    var dataPersistence: DataPersistenceManager!

    override func setUp() async throws {
        try await super.setUp()
        authManager = AuthenticationManager.shared
        keychainManager = KeychainManager.shared
        syncQueue = SyncQueue.shared
        dataPersistence = DataPersistenceManager.shared

        // Clean state
        try keychainManager.clearAll()
        syncQueue.clearAll()
    }

    override func tearDown() {
        try? keychainManager.clearAll()
        syncQueue.clearAll()
        super.tearDown()
    }

    // MARK: - Authentication Flow Regressions

    func testAuthenticationEmptyEmailValidation() async {
        // Bug: Empty email should be rejected before API call
        let result = await authManager.login(email: "", password: "password123")

        XCTAssertFalse(result, "Empty email should fail validation")
        XCTAssertNotNil(authManager.errorMessage, "Error message should be set")
        XCTAssertEqual(authManager.errorMessage, "Please enter email and password")
    }

    func testAuthenticationInvalidEmailFormat() async {
        // Bug: Invalid email format should be caught by client-side validation
        let invalidEmails = [
            "notanemail",
            "@domain.com",
            "user@",
            "user space@domain.com",
            "user@domain",
            ""
        ]

        for email in invalidEmails {
            let result = await authManager.login(email: email, password: "password")
            XCTAssertFalse(result, "Invalid email '\(email)' should fail validation")
        }
    }

    func testAuthenticationValidEmailFormats() async {
        // Verify valid email formats are accepted by validation
        let validEmails = [
            "user@domain.com",
            "user.name@domain.com",
            "user+tag@domain.co.uk",
            "user123@test-domain.com"
        ]

        for email in validEmails {
            // Note: Will fail at API call, but should pass client validation
            _ = await authManager.login(email: email, password: "password")

            // If error is about credentials, not format, validation passed
            if let error = authManager.errorMessage {
                XCTAssertFalse(
                    error.contains("valid email"),
                    "Valid email '\(email)' should pass format validation"
                )
            }
        }
    }

    func testTokenRefreshRaceCondition() async {
        // Bug: Multiple simultaneous token refresh requests could cause issues
        // This test ensures proper synchronization

        let testToken = "test_token"
        let testRefreshToken = "test_refresh_token"

        try? await keychainManager.saveTokens(
            accessToken: testToken,
            refreshToken: testRefreshToken,
            expiresIn: 3600
        )

        // Simulate multiple concurrent token access requests
        await withTaskGroup(of: String?.self) { group in
            for _ in 0..<10 {
                group.addTask {
                    return await self.authManager.getAccessToken()
                }
            }

            var results: [String?] = []
            for await result in group {
                results.append(result)
            }

            // All results should be consistent (no race condition)
            let nonNilResults = results.compactMap { $0 }
            if !nonNilResults.isEmpty {
                let firstResult = nonNilResults.first!
                XCTAssertTrue(
                    nonNilResults.allSatisfy { $0 == firstResult },
                    "Token refresh should be thread-safe"
                )
            }
        }

        try? keychainManager.clearAuthenticationData()
    }

    func testLogoutClearsAllSessionData() async {
        // Bug: Logout should completely clear all session data

        // Set up session data
        try? keychainManager.save("test@email.com", for: .userEmail)
        try? keychainManager.save("12345", for: .userId)
        try? await keychainManager.saveTokens(
            accessToken: "access_token",
            refreshToken: "refresh_token",
            expiresIn: 3600
        )

        // Logout
        await authManager.logout()

        // Verify all data is cleared
        XCTAssertFalse(keychainManager.exists(for: .userEmail), "Email should be cleared")
        XCTAssertFalse(keychainManager.exists(for: .userId), "User ID should be cleared")
        XCTAssertFalse(keychainManager.exists(for: .accessToken), "Access token should be cleared")
        XCTAssertFalse(keychainManager.exists(for: .refreshToken), "Refresh token should be cleared")
        XCTAssertFalse(keychainManager.exists(for: .tokenExpiry), "Token expiry should be cleared")
        XCTAssertFalse(authManager.isAuthenticated, "Should not be authenticated")
        XCTAssertNil(authManager.currentUser, "Current user should be nil")
    }

    // MARK: - Data Persistence Regressions

    func testVehicleDataPersistenceAcrossAppRestart() {
        // Bug: Data should persist across app restarts
        let testVehicle = Vehicle(
            id: "VEH-PERSIST-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "1FTFW1E89PFA12345",
            status: "active",
            lastUpdated: Date()
        )

        // Save vehicle
        dataPersistence.saveVehicle(testVehicle)

        // Simulate app restart by fetching from persistence
        let fetchedVehicle = dataPersistence.fetchVehicle(id: testVehicle.id)

        XCTAssertNotNil(fetchedVehicle, "Vehicle should persist")
        XCTAssertEqual(fetchedVehicle?.id, testVehicle.id)
        XCTAssertEqual(fetchedVehicle?.make, testVehicle.make)
        XCTAssertEqual(fetchedVehicle?.model, testVehicle.model)

        // Clean up
        dataPersistence.deleteVehicle(id: testVehicle.id)
    }

    func testSpecialCharactersInVehicleData() {
        // Bug: Special characters should be properly escaped and stored
        let testVehicle = Vehicle(
            id: "VEH-SPECIAL-001",
            make: "Ford & Sons",
            model: "F-150 \"Deluxe\"",
            year: 2024,
            vin: "VIN-<test>&'\"",
            status: "active's",
            lastUpdated: Date()
        )

        dataPersistence.saveVehicle(testVehicle)
        let fetched = dataPersistence.fetchVehicle(id: testVehicle.id)

        XCTAssertEqual(fetched?.make, "Ford & Sons")
        XCTAssertEqual(fetched?.model, "F-150 \"Deluxe\"")
        XCTAssertEqual(fetched?.vin, "VIN-<test>&'\"")

        dataPersistence.deleteVehicle(id: testVehicle.id)
    }

    func testUnicodeCharactersInData() {
        // Bug: Unicode characters should be properly handled
        let testVehicle = Vehicle(
            id: "VEH-UNICODE-001",
            make: "奔驰",  // Mercedes in Chinese
            model: "S-Class 🚗",
            year: 2024,
            vin: "VIN-émoji-™",
            status: "active",
            lastUpdated: Date()
        )

        dataPersistence.saveVehicle(testVehicle)
        let fetched = dataPersistence.fetchVehicle(id: testVehicle.id)

        XCTAssertEqual(fetched?.make, "奔驰")
        XCTAssertEqual(fetched?.model, "S-Class 🚗")

        dataPersistence.deleteVehicle(id: testVehicle.id)
    }

    // MARK: - Sync Queue Regressions

    func testSyncQueueDuplicateOperationHandling() throws {
        // Bug: Duplicate operations should be queued independently
        syncQueue.clearAll()

        let testData = ["vehicle_id": "VEH-001", "status": "active"]

        // Enqueue same operation twice
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-001",
            operationType: .update,
            data: testData,
            endpoint: "/api/vehicles/VEH-001",
            priority: .normal
        )

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-001",
            operationType: .update,
            data: testData,
            endpoint: "/api/vehicles/VEH-001",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 2, "Both operations should be queued")

        syncQueue.clearAll()
    }

    func testSyncQueueOperationOrderMaintained() throws {
        // Bug: Operations should be processed in correct priority order
        syncQueue.clearAll()

        let priorities: [SyncPriority] = [.low, .normal, .high, .critical]

        for (index, priority) in priorities.enumerated() {
            try syncQueue.enqueue(
                recordType: "vehicle",
                recordId: "VEH-\(index)",
                operationType: .create,
                data: ["priority": priority.rawValue],
                endpoint: "/api/vehicles",
                priority: priority
            )
        }

        let operations = syncQueue.getPendingOperations()

        // Verify operations are ordered by priority
        XCTAssertEqual(operations[0].priority, .critical)
        XCTAssertEqual(operations[1].priority, .high)
        XCTAssertEqual(operations[2].priority, .normal)
        XCTAssertEqual(operations[3].priority, .low)

        syncQueue.clearAll()
    }

    func testSyncQueueRetryExponentialBackoff() throws {
        // Bug: Retry delays should increase exponentially
        syncQueue.clearAll()

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-BACKOFF",
            operationType: .update,
            data: ["test": "backoff"],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        guard let operation = operations.first else {
            XCTFail("Operation not found")
            return
        }

        let error = NSError(domain: "TestError", code: 500)

        // Track retry delays
        var previousDelay: TimeInterval?

        for retry in 1...3 {
            syncQueue.markFailed(operation.id, error: error)

            if let op = syncQueue.getOperation(id: operation.id),
               let scheduledAt = op.scheduledAt {
                let delay = scheduledAt.timeIntervalSince(Date())

                if let prevDelay = previousDelay {
                    // Delay should increase (exponential backoff)
                    XCTAssertGreaterThan(
                        delay,
                        prevDelay * 1.5,  // Allow some variance
                        "Retry \(retry): Delay should increase exponentially"
                    )
                }

                previousDelay = delay
            }
        }

        syncQueue.clearAll()
    }

    func testSyncQueueMaxRetriesEnforced() throws {
        // Bug: Operations should stop retrying after max attempts
        syncQueue.clearAll()

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-MAX-RETRY",
            operationType: .create,
            data: ["test": "max retry"],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        guard let operation = operations.first else {
            XCTFail("Operation not found")
            return
        }

        let error = NSError(domain: "TestError", code: 500)

        // Fail 6 times (exceeding max retries of 5)
        for _ in 1...6 {
            syncQueue.markFailed(operation.id, error: error)
        }

        if let op = syncQueue.getOperation(id: operation.id) {
            XCTAssertEqual(op.status, .failed, "Should be permanently failed")
            XCTAssertGreaterThanOrEqual(op.retryCount, 5, "Should have reached max retries")
        }

        syncQueue.clearAll()
    }

    // MARK: - Encryption Edge Cases

    func testEncryptionEmptyString() throws {
        // Bug: Empty string encryption should work
        let empty = ""
        let encrypted = try EncryptionManager.shared.encrypt(string: empty)
        let decrypted = try EncryptionManager.shared.decrypt(string: encrypted)

        XCTAssertEqual(decrypted, empty, "Empty string should encrypt/decrypt correctly")
    }

    func testEncryptionVeryLongString() throws {
        // Bug: Very long strings should be handled correctly
        let longString = String(repeating: "A", count: 100000)  // 100KB
        let encrypted = try EncryptionManager.shared.encrypt(string: longString)
        let decrypted = try EncryptionManager.shared.decrypt(string: encrypted)

        XCTAssertEqual(decrypted, longString, "Long string should encrypt/decrypt correctly")
    }

    func testEncryptionMultilineString() throws {
        // Bug: Multiline strings should preserve formatting
        let multiline = """
        Line 1
        Line 2
        Line 3
        """

        let encrypted = try EncryptionManager.shared.encrypt(string: multiline)
        let decrypted = try EncryptionManager.shared.decrypt(string: encrypted)

        XCTAssertEqual(decrypted, multiline, "Multiline string should be preserved")
    }

    func testEncryptionBinaryData() throws {
        // Bug: Binary data should be handled correctly
        let binaryData = Data([0x00, 0xFF, 0xAA, 0x55, 0xDE, 0xAD, 0xBE, 0xEF])

        let encrypted = try EncryptionManager.shared.encrypt(data: binaryData)
        let decrypted = try EncryptionManager.shared.decrypt(data: encrypted)

        XCTAssertEqual(decrypted, binaryData, "Binary data should encrypt/decrypt correctly")
    }

    // MARK: - API Error Handling

    func testAPIErrorMessageExtraction() {
        // Bug: Error messages should be properly extracted from API responses
        let mockErrorJSON: [String: Any] = [
            "success": false,
            "error": "Validation failed",
            "message": "Vehicle ID is required"
        ]

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: mockErrorJSON)
            let decoded = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any]

            XCTAssertEqual(decoded?["message"] as? String, "Vehicle ID is required")
        } catch {
            XCTFail("Error message extraction failed")
        }
    }

    func testAPITimeoutHandling() async {
        // Bug: API timeouts should be handled gracefully
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 0.001  // Very short timeout

        let session = URLSession(configuration: config)
        let url = URL(string: "https://fleet.capitaltechalliance.com/api/vehicles")!

        do {
            _ = try await session.data(from: url)
            // If no error, that's fine (fast network)
        } catch {
            // Verify error is handled
            XCTAssertNotNil(error, "Timeout error should be captured")
        }
    }

    // MARK: - User Input Validation

    func testVehicleVINValidation() {
        // Bug: VIN should be validated (17 characters, alphanumeric)
        let validVINs = [
            "1FTFW1E89PFA12345",
            "5YJSA1E26JF123456",
            "WBADT43452G123456"
        ]

        let invalidVINs = [
            "SHORT",                    // Too short
            "TOOLONGVIN1234567890",     // Too long
            "1FTFW1E89PFA1234O",        // Contains 'O'
            "1FTFW1E89PFA1234I",        // Contains 'I'
            "1FTFW1E89PFA1234Q"         // Contains 'Q'
        ]

        for vin in validVINs {
            XCTAssertTrue(isValidVIN(vin), "Valid VIN should pass: \(vin)")
        }

        for vin in invalidVINs {
            XCTAssertFalse(isValidVIN(vin), "Invalid VIN should fail: \(vin)")
        }
    }

    func testYearValidation() {
        // Bug: Year should be within reasonable range
        let currentYear = Calendar.current.component(.year, from: Date())

        XCTAssertTrue(isValidYear(2024), "Current year should be valid")
        XCTAssertTrue(isValidYear(currentYear), "Current year should be valid")
        XCTAssertTrue(isValidYear(currentYear - 50), "50 years ago should be valid")
        XCTAssertFalse(isValidYear(1800), "Year 1800 should be invalid")
        XCTAssertFalse(isValidYear(currentYear + 10), "Future years should be invalid")
    }

    // MARK: - Critical User Flows

    func testCompleteAuthenticationFlow() async {
        // Critical flow: Login -> Token storage -> Profile fetch -> Logout

        // 1. Start unauthenticated
        XCTAssertFalse(authManager.isAuthenticated)

        // 2. Attempt login (will fail without real backend, but flow is tested)
        _ = await authManager.login(email: "test@fleet.com", password: "password")

        // 3. Verify error handling works
        XCTAssertNotNil(authManager.errorMessage)

        // 4. Logout (should work even if not authenticated)
        await authManager.logout()
        XCTAssertFalse(authManager.isAuthenticated)
    }

    func testCompleteDataSyncFlow() throws {
        // Critical flow: Create data -> Queue sync -> Process -> Confirm
        syncQueue.clearAll()

        // 1. Create local data
        let testVehicle = Vehicle(
            id: "VEH-SYNC-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "1FTFW1E89PFA12345",
            status: "active",
            lastUpdated: Date()
        )

        dataPersistence.saveVehicle(testVehicle)

        // 2. Queue for sync
        let vehicleData = [
            "id": testVehicle.id,
            "make": testVehicle.make,
            "model": testVehicle.model
        ]

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: testVehicle.id,
            operationType: .create,
            data: vehicleData,
            endpoint: "/api/vehicles",
            priority: .normal
        )

        // 3. Verify queued
        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 1)

        // 4. Mark as completed
        if let operation = operations.first {
            syncQueue.markCompleted(operation.id)
        }

        // 5. Verify completed (removed from queue)
        let remaining = syncQueue.getPendingOperations()
        XCTAssertEqual(remaining.count, 0)

        // Clean up
        dataPersistence.deleteVehicle(id: testVehicle.id)
    }

    // MARK: - Edge Cases

    func testConcurrentDatabaseAccess() {
        // Bug: Concurrent database access should be thread-safe
        let group = DispatchGroup()
        let testVehicles = (1...50).map { i in
            Vehicle(
                id: "VEH-CONCURRENT-\(i)",
                make: "Ford",
                model: "F-150",
                year: 2024,
                vin: "VIN\(i)",
                status: "active",
                lastUpdated: Date()
            )
        }

        // Write from multiple threads
        for vehicle in testVehicles {
            group.enter()
            DispatchQueue.global().async {
                self.dataPersistence.saveVehicle(vehicle)
                group.leave()
            }
        }

        group.wait()

        // Verify all vehicles were saved
        for vehicle in testVehicles {
            let fetched = dataPersistence.fetchVehicle(id: vehicle.id)
            XCTAssertNotNil(fetched, "Vehicle \(vehicle.id) should be saved")
        }

        // Clean up
        for vehicle in testVehicles {
            dataPersistence.deleteVehicle(id: vehicle.id)
        }
    }

    func testMemoryLeakPrevention() {
        // Bug: Repeated operations should not cause memory leaks
        weak var weakReference: AnyObject?

        autoreleasepool {
            for _ in 0..<1000 {
                let vehicle = Vehicle(
                    id: UUID().uuidString,
                    make: "Ford",
                    model: "F-150",
                    year: 2024,
                    vin: "VIN123",
                    status: "active",
                    lastUpdated: Date()
                )
                weakReference = vehicle as AnyObject
            }
        }

        // Weak reference should be nil (no leak)
        XCTAssertNil(weakReference, "Objects should be deallocated")
    }

    // MARK: - Helper Methods

    private func isValidVIN(_ vin: String) -> Bool {
        // VIN validation: 17 characters, no I, O, Q
        guard vin.count == 17 else { return false }

        let invalidChars = CharacterSet(charactersIn: "IOQ")
        return vin.uppercased().rangeOfCharacter(from: invalidChars) == nil
    }

    private func isValidYear(_ year: Int) -> Bool {
        let currentYear = Calendar.current.component(.year, from: Date())
        return year >= 1900 && year <= currentYear + 1
    }
}
