//
//  TestConfiguration.swift
//  Fleet Manager - Test Configuration
//
//  Centralized test configuration, mock data generators, test utilities
//  Performance thresholds and CI/CD integration
//

import Foundation
import XCTest
@testable import App

// MARK: - Test Configuration

struct TestConfiguration {

    // MARK: - Performance Thresholds

    struct PerformanceThresholds {
        static let maxAppLaunchTime: TimeInterval = 2.0       // 2 seconds
        static let maxAPIResponseTime: TimeInterval = 0.5     // 500ms
        static let maxMemoryUsage: Double = 100.0             // 100MB
        static let maxDatabaseQueryTime: TimeInterval = 0.1   // 100ms
        static let targetFrameRate: Double = 60.0             // 60fps
        static let maxEncryptionTime: TimeInterval = 0.01     // 10ms for 1KB
        static let maxDecryptionTime: TimeInterval = 0.01     // 10ms for 1KB
    }

    // MARK: - Test Environment

    struct Environment {
        static let isCI: Bool = {
            return ProcessInfo.processInfo.environment["CI"] != nil
        }()

        static let testTimeout: TimeInterval = isCI ? 60.0 : 30.0

        static let shouldRunPerformanceTests: Bool = {
            return ProcessInfo.processInfo.environment["RUN_PERFORMANCE_TESTS"] == "1"
        }()

        static let shouldRunIntegrationTests: Bool = {
            return ProcessInfo.processInfo.environment["RUN_INTEGRATION_TESTS"] == "1"
        }()

        static let testDataDirectory: URL = {
            return FileManager.default.temporaryDirectory
                .appendingPathComponent("FleetTests", isDirectory: true)
        }()
    }

    // MARK: - API Configuration

    struct API {
        static let mockBaseURL = "https://mock-api.fleet.test"
        static let testTimeout: TimeInterval = 10.0
        static let maxRetries = 3
    }

    // MARK: - Security Configuration

    struct Security {
        static let testEncryptionKey = "test_encryption_key_12345"
        static let testAccessToken = "test_access_token"
        static let testRefreshToken = "test_refresh_token"
    }

    // MARK: - Setup & Teardown

    static func setup() {
        // Create test data directory
        try? FileManager.default.createDirectory(
            at: Environment.testDataDirectory,
            withIntermediateDirectories: true
        )

        // Configure logging
        SecurityLogger.shared.consoleOutputEnabled = false
    }

    static func teardown() {
        // Clean up test data
        try? FileManager.default.removeItem(at: Environment.testDataDirectory)

        // Clear keychain
        try? KeychainManager.shared.clearAll()

        // Clear sync queue
        SyncQueue.shared.clearAll()
    }
}

// MARK: - Mock Data Generators

struct MockDataGenerator {

    // MARK: - Vehicle Mocks

    static func createMockVehicle(id: String? = nil) -> Vehicle {
        return Vehicle(
            id: id ?? "VEH-\(UUID().uuidString.prefix(8))",
            make: randomMake(),
            model: randomModel(),
            year: randomYear(),
            vin: randomVIN(),
            status: randomStatus(),
            lastUpdated: Date()
        )
    }

    static func createMockVehicles(count: Int) -> [Vehicle] {
        return (0..<count).map { _ in createMockVehicle() }
    }

    static func createMockVehicleWithCustomData(
        id: String? = nil,
        make: String? = nil,
        model: String? = nil,
        year: Int? = nil,
        status: String? = nil
    ) -> Vehicle {
        return Vehicle(
            id: id ?? "VEH-\(UUID().uuidString.prefix(8))",
            make: make ?? randomMake(),
            model: model ?? randomModel(),
            year: year ?? randomYear(),
            vin: randomVIN(),
            status: status ?? randomStatus(),
            lastUpdated: Date()
        )
    }

    // MARK: - User Mocks

    static func createMockUser(id: Int? = nil, email: String? = nil) -> AuthenticationService.User {
        return AuthenticationService.User(
            id: id ?? Int.random(in: 1...10000),
            email: email ?? "test\(Int.random(in: 1...1000))@fleet.com",
            name: randomName(),
            role: randomRole(),
            organizationId: Int.random(in: 1...100)
        )
    }

    // MARK: - Authentication Mocks

    static func createMockLoginResponse() -> AuthenticationService.LoginResponse {
        return AuthenticationService.LoginResponse(
            success: true,
            user: createMockUser(),
            accessToken: TestConfiguration.Security.testAccessToken,
            refreshToken: TestConfiguration.Security.testRefreshToken,
            expiresIn: 3600
        )
    }

    static func createMockTokenResponse() -> AuthenticationService.RefreshTokenResponse {
        return AuthenticationService.RefreshTokenResponse(
            accessToken: "new_\(TestConfiguration.Security.testAccessToken)",
            refreshToken: "new_\(TestConfiguration.Security.testRefreshToken)",
            expiresIn: 3600
        )
    }

    // MARK: - Sync Operation Mocks

    static func createMockSyncOperation(
        recordType: String = "vehicle",
        operationType: SyncOperationType = .create,
        priority: SyncPriority = .normal
    ) -> SyncOperation {
        let mockData = ["test": "data", "timestamp": Date().timeIntervalSince1970] as [String: Any]
        let jsonData = try! JSONSerialization.data(withJSONObject: mockData)

        return SyncOperation(
            id: UUID().uuidString,
            recordType: recordType,
            recordId: "RECORD-\(UUID().uuidString.prefix(8))",
            operationType: operationType,
            payload: jsonData,
            endpoint: "/api/\(recordType)s",
            priority: priority,
            status: .pending
        )
    }

    // MARK: - Random Data Helpers

    private static func randomMake() -> String {
        let makes = ["Ford", "Chevrolet", "Toyota", "Honda", "Tesla", "BMW", "Mercedes-Benz"]
        return makes.randomElement()!
    }

    private static func randomModel() -> String {
        let models = ["F-150", "Silverado", "Camry", "Accord", "Model 3", "X5", "C-Class"]
        return models.randomElement()!
    }

    private static func randomYear() -> Int {
        return Int.random(in: 2020...2024)
    }

    private static func randomVIN() -> String {
        let chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
        return String((0..<17).map { _ in chars.randomElement()! })
    }

    private static func randomStatus() -> String {
        let statuses = ["active", "inactive", "maintenance", "retired"]
        return statuses.randomElement()!
    }

    private static func randomName() -> String {
        let firstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah"]
        let lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia"]
        return "\(firstNames.randomElement()!) \(lastNames.randomElement()!)"
    }

    private static func randomRole() -> String {
        let roles = ["admin", "manager", "driver", "mechanic", "viewer"]
        return roles.randomElement()!
    }
}

// MARK: - Test Utilities

class TestUtilities {

    // MARK: - Async Testing

    static func waitForCondition(
        timeout: TimeInterval = 5.0,
        pollingInterval: TimeInterval = 0.1,
        condition: @escaping () -> Bool,
        description: String = "Condition"
    ) async throws {
        let deadline = Date().addingTimeInterval(timeout)

        while Date() < deadline {
            if condition() {
                return
            }
            try await Task.sleep(nanoseconds: UInt64(pollingInterval * 1_000_000_000))
        }

        throw TestError.timeout(description: "Timeout waiting for: \(description)")
    }

    // MARK: - File Management

    static func createTemporaryFile(content: String) -> URL? {
        let tempDir = TestConfiguration.Environment.testDataDirectory
        try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)

        let fileURL = tempDir.appendingPathComponent("\(UUID().uuidString).txt")

        do {
            try content.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            return nil
        }
    }

    static func cleanupTemporaryFiles() {
        let tempDir = TestConfiguration.Environment.testDataDirectory
        try? FileManager.default.removeItem(at: tempDir)
    }

    // MARK: - Random Data

    static func randomString(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map { _ in letters.randomElement()! })
    }

    static func randomData(size: Int) -> Data {
        var data = Data(count: size)
        _ = data.withUnsafeMutableBytes { bytes in
            SecRandomCopyBytes(kSecRandomDefault, size, bytes.baseAddress!)
        }
        return data
    }

    // MARK: - Performance Measurement

    static func measurePerformance(
        _ block: () -> Void
    ) -> TimeInterval {
        let startTime = Date()
        block()
        return Date().timeIntervalSince(startTime)
    }

    static func measureAsyncPerformance(
        _ block: () async throws -> Void
    ) async rethrows -> TimeInterval {
        let startTime = Date()
        try await block()
        return Date().timeIntervalSince(startTime)
    }

    // MARK: - Assertion Helpers

    static func assertWithinThreshold(
        _ value: TimeInterval,
        threshold: TimeInterval,
        file: StaticString = #file,
        line: UInt = #line
    ) {
        XCTAssertLessThanOrEqual(
            value,
            threshold,
            "Performance exceeded threshold: \(value)s > \(threshold)s",
            file: file,
            line: line
        )
    }

    static func assertMemoryWithinThreshold(
        _ memoryMB: Double,
        threshold: Double = TestConfiguration.PerformanceThresholds.maxMemoryUsage,
        file: StaticString = #file,
        line: UInt = #line
    ) {
        XCTAssertLessThanOrEqual(
            memoryMB,
            threshold,
            "Memory usage exceeded threshold: \(memoryMB)MB > \(threshold)MB",
            file: file,
            line: line
        )
    }
}

// MARK: - Test Errors

enum TestError: Error, LocalizedError {
    case timeout(description: String)
    case invalidData(description: String)
    case setupFailed(description: String)

    var errorDescription: String? {
        switch self {
        case .timeout(let description):
            return "Test timeout: \(description)"
        case .invalidData(let description):
            return "Invalid test data: \(description)"
        case .setupFailed(let description):
            return "Test setup failed: \(description)"
        }
    }
}

// MARK: - CI/CD Integration

class CITestReporter {

    static func reportTestResults(suite: String, passed: Bool, duration: TimeInterval) {
        if TestConfiguration.Environment.isCI {
            let status = passed ? "PASSED" : "FAILED"
            print("::test-result::\(suite)::\(status)::\(duration)s")
        }
    }

    static func reportPerformanceMetric(name: String, value: Double, unit: String) {
        if TestConfiguration.Environment.isCI {
            print("::performance::\(name)::\(value)::\(unit)")
        }
    }

    static func reportCoverage(percentage: Double) {
        if TestConfiguration.Environment.isCI {
            print("::coverage::\(percentage)%")
        }
    }
}

// MARK: - Mock Network Session

class MockURLSession {

    var mockData: Data?
    var mockResponse: HTTPURLResponse?
    var mockError: Error?

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        if let error = mockError {
            throw error
        }

        let data = mockData ?? Data()
        let response = mockResponse ?? HTTPURLResponse(
            url: request.url!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!

        return (data, response)
    }

    static func createSuccess(data: Data) -> MockURLSession {
        let session = MockURLSession()
        session.mockData = data
        session.mockResponse = HTTPURLResponse(
            url: URL(string: "https://test.com")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )
        return session
    }

    static func createError(statusCode: Int) -> MockURLSession {
        let session = MockURLSession()
        session.mockResponse = HTTPURLResponse(
            url: URL(string: "https://test.com")!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: nil
        )
        return session
    }
}

// MARK: - Test Base Class

class FleetTestCase: XCTestCase {

    override func setUpWithError() throws {
        try super.setUpWithError()
        TestConfiguration.setup()
    }

    override func tearDownWithError() throws {
        TestConfiguration.teardown()
        try super.tearDownWithError()
    }

    // Convenience methods
    func createMockVehicle() -> Vehicle {
        return MockDataGenerator.createMockVehicle()
    }

    func createMockVehicles(count: Int) -> [Vehicle] {
        return MockDataGenerator.createMockVehicles(count: count)
    }

    func assertPerformance(
        _ block: () -> Void,
        threshold: TimeInterval
    ) {
        let duration = TestUtilities.measurePerformance(block)
        TestUtilities.assertWithinThreshold(duration, threshold: threshold)
    }
}
