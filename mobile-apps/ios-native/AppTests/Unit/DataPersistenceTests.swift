//
//  DataPersistenceTests.swift
//  Fleet Management App Tests
//
//  Unit tests for data persistence, caching, and UserDefaults/File storage
//

import XCTest
@testable import App

class DataPersistenceTests: XCTestCase {

    var persistenceManager: DataPersistenceManager!
    var testUserDefaults: UserDefaults!

    override func setUpWithError() throws {
        try super.setUpWithError()

        // Use a separate UserDefaults suite for testing
        testUserDefaults = UserDefaults(suiteName: "com.fleet.tests")
        persistenceManager = DataPersistenceManager.shared

        // Clear all test data
        testUserDefaults?.removePersistentDomain(forName: "com.fleet.tests")
        persistenceManager.clearCache()
    }

    override func tearDownWithError() throws {
        // Clean up after each test
        testUserDefaults?.removePersistentDomain(forName: "com.fleet.tests")
        persistenceManager.clearCache()

        // Delete test files
        try? deleteAllTestFiles()

        testUserDefaults = nil
        persistenceManager = nil
        try super.tearDownWithError()
    }

    // MARK: - Helper Methods

    private func deleteAllTestFiles() throws {
        let fileManager = FileManager.default
        let documentsDir = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let testFiles = try fileManager.contentsOfDirectory(at: documentsDir, includingPropertiesForKeys: nil)

        for file in testFiles where file.lastPathComponent.contains("test") {
            try fileManager.removeItem(at: file)
        }
    }

    // MARK: - Fleet Metrics Caching Tests

    func testSaveFleetMetrics() throws {
        // Given
        let metrics = FleetMetrics.sample

        // When
        persistenceManager.saveFleetMetrics(metrics)

        // Then
        let loaded = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.totalVehicles, metrics.totalVehicles)
        XCTAssertEqual(loaded?.activeTrips, metrics.activeTrips)
    }

    func testLoadFleetMetricsWhenNone() throws {
        // When
        let loaded = persistenceManager.loadFleetMetrics()

        // Then
        XCTAssertNil(loaded)
    }

    func testLoadFleetMetricsWithInvalidData() throws {
        // Given - Save invalid data
        UserDefaults.standard.set("invalid data", forKey: "cached_fleet_metrics")

        // When
        let loaded = persistenceManager.loadFleetMetrics()

        // Then
        XCTAssertNil(loaded)
    }

    func testOverwriteFleetMetrics() throws {
        // Given
        let firstMetrics = FleetMetrics.sample
        let secondMetrics = FleetMetrics(
            totalVehicles: 100,
            activeTrips: 20,
            maintenanceDue: 10,
            availableVehicles: 70,
            vehicleUtilizationRate: 0.85,
            activeDrivers: 80,
            lastUpdated: Date()
        )

        // When
        persistenceManager.saveFleetMetrics(firstMetrics)
        persistenceManager.saveFleetMetrics(secondMetrics)

        // Then
        let loaded = persistenceManager.loadFleetMetrics()
        XCTAssertEqual(loaded?.totalVehicles, secondMetrics.totalVehicles)
    }

    // MARK: - Cache Validation Tests

    func testCacheIsValidImmediately() throws {
        // Given
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        // When
        let isValid = persistenceManager.isCacheValid()

        // Then
        XCTAssertTrue(isValid)
    }

    func testCacheIsInvalidAfterExpiration() throws {
        // Given - Save metrics with old timestamp
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        // Manually set old sync time (16 minutes ago, past the 15 minute expiration)
        let oldDate = Date().addingTimeInterval(-16 * 60)
        UserDefaults.standard.set(oldDate, forKey: "last_sync_timestamp")

        // When
        let isValid = persistenceManager.isCacheValid()

        // Then
        XCTAssertFalse(isValid)
    }

    func testCacheIsInvalidWhenNoSyncTime() throws {
        // When
        let isValid = persistenceManager.isCacheValid()

        // Then
        XCTAssertFalse(isValid)
    }

    func testGetLastSyncTime() throws {
        // Given
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        // When
        let syncTime = persistenceManager.getLastSyncTime()

        // Then
        XCTAssertNotNil(syncTime)
        XCTAssertTrue(abs(syncTime!.timeIntervalSinceNow) < 5) // Within 5 seconds
    }

    // MARK: - Generic Caching Tests

    func testSaveToCacheGeneric() throws {
        // Given
        struct TestData: Codable {
            let id: Int
            let name: String
        }
        let testData = TestData(id: 1, name: "Test")
        let key = "test_data"

        // When
        persistenceManager.saveToCache(testData, key: key)

        // Then
        let loaded: TestData? = persistenceManager.loadFromCache(TestData.self, key: key)
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.id, testData.id)
        XCTAssertEqual(loaded?.name, testData.name)
    }

    func testLoadFromCacheWhenNone() throws {
        // Given
        struct TestData: Codable {
            let id: Int
        }
        let key = "nonexistent_key"

        // When
        let loaded: TestData? = persistenceManager.loadFromCache(TestData.self, key: key)

        // Then
        XCTAssertNil(loaded)
    }

    func testSaveToCacheWithComplexData() throws {
        // Given
        struct ComplexData: Codable {
            let id: Int
            let nested: NestedData
            let array: [String]
            let date: Date
        }
        struct NestedData: Codable {
            let value: Double
        }

        let complexData = ComplexData(
            id: 42,
            nested: NestedData(value: 3.14),
            array: ["one", "two", "three"],
            date: Date()
        )
        let key = "complex_data"

        // When
        persistenceManager.saveToCache(complexData, key: key)
        let loaded: ComplexData? = persistenceManager.loadFromCache(ComplexData.self, key: key)

        // Then
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.id, complexData.id)
        XCTAssertEqual(loaded?.nested.value, complexData.nested.value)
        XCTAssertEqual(loaded?.array, complexData.array)
    }

    // MARK: - Cache Clearing Tests

    func testClearCache() throws {
        // Given
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)
        XCTAssertNotNil(persistenceManager.loadFleetMetrics())

        // When
        persistenceManager.clearCache()

        // Then
        XCTAssertNil(persistenceManager.loadFleetMetrics())
        XCTAssertNil(persistenceManager.getLastSyncTime())
    }

    func testClearSpecificCacheKey() throws {
        // Given
        persistenceManager.saveToCache("value1", key: "key1")
        persistenceManager.saveToCache("value2", key: "key2")

        // When
        persistenceManager.clearCache(for: "key1")

        // Then
        let loaded1: String? = persistenceManager.loadFromCache(String.self, key: "key1")
        let loaded2: String? = persistenceManager.loadFromCache(String.self, key: "key2")

        XCTAssertNil(loaded1)
        XCTAssertNotNil(loaded2)
    }

    // MARK: - File-based Persistence Tests

    func testSaveToFile() throws {
        // Given
        struct FileData: Codable {
            let id: Int
            let content: String
        }
        let testData = FileData(id: 1, content: "Test file content")
        let filename = "test_file.json"

        // When
        try persistenceManager.saveToFile(testData, filename: filename)

        // Then
        let loaded: FileData? = try persistenceManager.loadFromFile(FileData.self, filename: filename)
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.id, testData.id)
        XCTAssertEqual(loaded?.content, testData.content)
    }

    func testLoadFromFileWhenNone() throws {
        // Given
        struct FileData: Codable {
            let id: Int
        }
        let filename = "nonexistent_file.json"

        // When
        let loaded: FileData? = try persistenceManager.loadFromFile(FileData.self, filename: filename)

        // Then
        XCTAssertNil(loaded)
    }

    func testDeleteFile() throws {
        // Given
        struct FileData: Codable {
            let id: Int
        }
        let testData = FileData(id: 1)
        let filename = "test_delete.json"
        try persistenceManager.saveToFile(testData, filename: filename)

        // Verify file exists
        let fileExists: FileData? = try persistenceManager.loadFromFile(FileData.self, filename: filename)
        XCTAssertNotNil(fileExists)

        // When
        try persistenceManager.deleteFile(filename: filename)

        // Then
        let loaded: FileData? = try persistenceManager.loadFromFile(FileData.self, filename: filename)
        XCTAssertNil(loaded)
    }

    func testDeleteNonexistentFile() throws {
        // Given
        let filename = "nonexistent.json"

        // When / Then - Should not throw
        try persistenceManager.deleteFile(filename: filename)
    }

    func testSaveToFileWithLargeData() throws {
        // Given
        struct LargeData: Codable {
            let items: [String]
        }
        let largeArray = (0..<10000).map { "Item \($0)" }
        let largeData = LargeData(items: largeArray)
        let filename = "test_large.json"

        // When
        try persistenceManager.saveToFile(largeData, filename: filename)

        // Then
        let loaded: LargeData? = try persistenceManager.loadFromFile(LargeData.self, filename: filename)
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.items.count, largeArray.count)
    }

    // MARK: - Date Encoding/Decoding Tests

    func testDateEncodingDecoding() throws {
        // Given
        struct DateData: Codable {
            let timestamp: Date
        }
        let now = Date()
        let dateData = DateData(timestamp: now)
        let key = "date_data"

        // When
        persistenceManager.saveToCache(dateData, key: key)
        let loaded: DateData? = persistenceManager.loadFromCache(DateData.self, key: key)

        // Then
        XCTAssertNotNil(loaded)
        // Dates might have slight precision differences due to encoding
        XCTAssertEqual(
            loaded?.timestamp.timeIntervalSince1970,
            now.timeIntervalSince1970,
            accuracy: 1.0
        )
    }

    // MARK: - Performance Tests

    func testSavePerformance() throws {
        measure {
            for _ in 0..<100 {
                persistenceManager.saveFleetMetrics(FleetMetrics.sample)
            }
        }
    }

    func testLoadPerformance() throws {
        // Given
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        // When / Then
        measure {
            for _ in 0..<100 {
                _ = persistenceManager.loadFleetMetrics()
            }
        }
    }

    func testSaveToFilePerformance() throws {
        // Given
        struct TestData: Codable {
            let id: Int
            let data: String
        }
        let testData = TestData(id: 1, data: String(repeating: "x", count: 1000))

        // When / Then
        measure {
            for i in 0..<10 {
                try? persistenceManager.saveToFile(testData, filename: "perf_test_\(i).json")
            }
        }
    }

    // MARK: - Concurrent Access Tests

    func testConcurrentWrites() async throws {
        // Given
        let iterations = 50

        // When
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<iterations {
                group.addTask {
                    let metrics = FleetMetrics(
                        totalVehicles: i,
                        activeTrips: i,
                        maintenanceDue: i,
                        availableVehicles: i,
                        vehicleUtilizationRate: 0.5,
                        activeDrivers: i,
                        lastUpdated: Date()
                    )
                    self.persistenceManager.saveFleetMetrics(metrics)
                }
            }
        }

        // Then - Should not crash
        let loaded = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(loaded)
    }

    func testConcurrentReads() async throws {
        // Given
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)
        let iterations = 50

        // When
        await withTaskGroup(of: FleetMetrics?.self) { group in
            for _ in 0..<iterations {
                group.addTask {
                    return self.persistenceManager.loadFleetMetrics()
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

    // MARK: - Edge Cases

    func testSaveEmptyArray() throws {
        // Given
        struct ArrayData: Codable {
            let items: [String]
        }
        let emptyData = ArrayData(items: [])
        let key = "empty_array"

        // When
        persistenceManager.saveToCache(emptyData, key: key)
        let loaded: ArrayData? = persistenceManager.loadFromCache(ArrayData.self, key: key)

        // Then
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.items.count, 0)
    }

    func testSaveNullableValues() throws {
        // Given
        struct NullableData: Codable {
            let id: Int
            let optionalString: String?
            let optionalInt: Int?
        }
        let nullData = NullableData(id: 1, optionalString: nil, optionalInt: nil)
        let key = "nullable_data"

        // When
        persistenceManager.saveToCache(nullData, key: key)
        let loaded: NullableData? = persistenceManager.loadFromCache(NullableData.self, key: key)

        // Then
        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.id, 1)
        XCTAssertNil(loaded?.optionalString)
        XCTAssertNil(loaded?.optionalInt)
    }

    func testFilenameWithSpecialCharacters() throws {
        // Given
        struct TestData: Codable {
            let value: String
        }
        let testData = TestData(value: "test")
        let filename = "test-file_123.json"

        // When
        try persistenceManager.saveToFile(testData, filename: filename)
        let loaded: TestData? = try persistenceManager.loadFromFile(TestData.self, filename: filename)

        // Then
        XCTAssertNotNil(loaded)
    }

    // MARK: - Memory Tests

    func testMemoryLeakOnSave() throws {
        // Given
        weak var weakMetrics: FleetMetrics?

        // When
        autoreleasepool {
            let metrics = FleetMetrics.sample
            weakMetrics = metrics
            persistenceManager.saveFleetMetrics(metrics)
        }

        // Then
        XCTAssertNil(weakMetrics, "FleetMetrics should be deallocated")
    }

    func testMemoryLeakOnLoad() throws {
        // Given
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)
        weak var weakMetrics: FleetMetrics?

        // When
        autoreleasepool {
            let metrics = persistenceManager.loadFleetMetrics()
            weakMetrics = metrics
        }

        // Then
        XCTAssertNil(weakMetrics, "Loaded FleetMetrics should be deallocated")
    }
}
