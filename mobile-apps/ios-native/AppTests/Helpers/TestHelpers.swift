//
//  TestHelpers.swift
//  Fleet Management App Tests
//
//  Helper utilities and extensions for testing
//

import XCTest
import Foundation
@testable import App

// MARK: - XCTestCase Extensions

extension XCTestCase {

    /// Wait for async operation with timeout
    func waitForAsync(timeout: TimeInterval = 5.0, completion: @escaping () async throws -> Void) {
        let expectation = expectation(description: "Async operation")

        Task {
            do {
                try await completion()
                expectation.fulfill()
            } catch {
                XCTFail("Async operation failed: \(error)")
                expectation.fulfill()
            }
        }

        waitForExpectations(timeout: timeout)
    }

    /// Create temporary directory for file tests
    func createTemporaryDirectory() throws -> URL {
        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        return tempDir
    }

    /// Remove temporary directory
    func removeTemporaryDirectory(_ url: URL) throws {
        try FileManager.default.removeItem(at: url)
    }
}

// MARK: - FleetMetrics Test Extensions

extension FleetMetrics {

    /// Create random fleet metrics for testing
    static func random() -> FleetMetrics {
        return FleetMetrics(
            totalVehicles: Int.random(in: 1...100),
            activeTrips: Int.random(in: 0...50),
            maintenanceDue: Int.random(in: 0...20),
            availableVehicles: Int.random(in: 0...100),
            vehicleUtilizationRate: Double.random(in: 0...1),
            activeDrivers: Int.random(in: 0...100),
            lastUpdated: Date()
        )
    }

    /// Create empty metrics
    static var zero: FleetMetrics {
        return FleetMetrics(
            totalVehicles: 0,
            activeTrips: 0,
            maintenanceDue: 0,
            availableVehicles: 0,
            vehicleUtilizationRate: 0.0,
            activeDrivers: 0,
            lastUpdated: Date()
        )
    }
}

// MARK: - Date Extensions for Testing

extension Date {

    /// Create date from components
    static func from(year: Int, month: Int, day: Int, hour: Int = 0, minute: Int = 0) -> Date? {
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        components.hour = hour
        components.minute = minute
        return Calendar.current.date(from: components)
    }

    /// Check if dates are on the same day
    func isSameDay(as other: Date) -> Bool {
        return Calendar.current.isDate(self, inSameDayAs: other)
    }
}

// MARK: - String Extensions for Testing

extension String {

    /// Generate random alphanumeric string
    static func random(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map { _ in letters.randomElement()! })
    }

    /// Generate random email
    static func randomEmail() -> String {
        return "\(String.random(length: 10))@example.com"
    }
}

// MARK: - Mock Response Builder

struct MockResponseBuilder {

    static func buildLoginResponse(
        success: Bool = true,
        accessToken: String = "mock-access-token",
        refreshToken: String = "mock-refresh-token",
        expiresIn: Int = 3600
    ) -> Data {
        let json: [String: Any] = [
            "success": success,
            "user": [
                "id": 1,
                "email": "test@example.com",
                "name": "Test User",
                "role": "driver",
                "organization_id": 1
            ],
            "access_token": accessToken,
            "refresh_token": refreshToken,
            "expires_in": expiresIn
        ]

        return try! JSONSerialization.data(withJSONObject: json)
    }

    static func buildFleetMetricsResponse(metrics: FleetMetrics? = nil) -> Data {
        let metricsToUse = metrics ?? FleetMetrics.sample

        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601

        let response = FleetMetricsResponse(
            success: true,
            data: metricsToUse,
            timestamp: Date()
        )

        return try! encoder.encode(response)
    }

    static func buildErrorResponse(message: String) -> Data {
        let json: [String: Any] = [
            "success": false,
            "error": "error",
            "message": message
        ]

        return try! JSONSerialization.data(withJSONObject: json)
    }
}

// MARK: - Test Data Generators

class TestDataGenerator {

    static func generateVehicleData() -> OBD2VehicleData {
        var data = OBD2VehicleData()
        data.engineRPM = Int.random(in: 800...6000)
        data.vehicleSpeed = Int.random(in: 0...120)
        data.fuelLevel = Int.random(in: 0...100)
        data.coolantTemp = Int.random(in: 60...100)
        data.engineLoad = Int.random(in: 0...100)
        data.throttlePosition = Int.random(in: 0...100)
        data.timestamp = Date()
        return data
    }

    static func generateDTCs(count: Int = 3) -> [DiagnosticTroubleCode] {
        let codes = ["P0171", "P0420", "P0300", "P0101", "P0442"]
        return (0..<count).map { i in
            DiagnosticTroubleCode(
                code: codes[i % codes.count],
                description: "Test DTC \(i)",
                severity: .confirmed
            )
        }
    }
}

// MARK: - Assertion Helpers

func XCTAssertEqualWithAccuracy<T: FloatingPoint>(
    _ expression1: T,
    _ expression2: T,
    accuracy: T,
    _ message: String = "",
    file: StaticString = #file,
    line: UInt = #line
) {
    XCTAssertTrue(
        abs(expression1 - expression2) <= accuracy,
        message.isEmpty ? "\(expression1) is not equal to \(expression2) within \(accuracy)" : message,
        file: file,
        line: line
    )
}

// MARK: - Async Testing Helpers

actor AsyncTestHelper {
    private var results: [String: Any] = [:]

    func store<T>(_ value: T, forKey key: String) {
        results[key] = value
    }

    func retrieve<T>(forKey key: String) -> T? {
        return results[key] as? T
    }

    func clear() {
        results.removeAll()
    }
}

// MARK: - Performance Measurement Helpers

class PerformanceHelper {

    static func measureTime(_ operation: () -> Void) -> TimeInterval {
        let startTime = Date()
        operation()
        return Date().timeIntervalSince(startTime)
    }

    static func measureAsyncTime(_ operation: @escaping () async -> Void) async -> TimeInterval {
        let startTime = Date()
        await operation()
        return Date().timeIntervalSince(startTime)
    }

    static func averageExecutionTime(iterations: Int, operation: () -> Void) -> TimeInterval {
        var totalTime: TimeInterval = 0

        for _ in 0..<iterations {
            totalTime += measureTime(operation)
        }

        return totalTime / Double(iterations)
    }
}

// MARK: - Mock Network Delay Simulator

class NetworkDelaySimulator {

    static func simulateNetworkDelay(
        minimumDelay: TimeInterval = 0.1,
        maximumDelay: TimeInterval = 0.5
    ) async {
        let delay = TimeInterval.random(in: minimumDelay...maximumDelay)
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
    }
}

// MARK: - Test State Manager

class TestStateManager {
    static let shared = TestStateManager()

    private var state: [String: Any] = [:]

    func set<T>(_ value: T, forKey key: String) {
        state[key] = value
    }

    func get<T>(forKey key: String) -> T? {
        return state[key] as? T
    }

    func reset() {
        state.removeAll()
    }

    private init() {}
}
