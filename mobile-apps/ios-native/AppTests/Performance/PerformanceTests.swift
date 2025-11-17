//
//  PerformanceTests.swift
//  Fleet Management App Tests
//
//  Performance tests for critical data operations and workflows
//

import XCTest
@testable import App

class PerformanceTests: XCTestCase {

    var persistenceManager: DataPersistenceManager!
    var obd2Parser: OBD2DataParser!
    var keychainManager: KeychainManager!

    override func setUpWithError() throws {
        try super.setUpWithError()
        persistenceManager = DataPersistenceManager.shared
        obd2Parser = OBD2DataParser.shared
        keychainManager = KeychainManager.shared

        // Clean up
        persistenceManager.clearCache()
        try? keychainManager.clearAll()
    }

    override func tearDownWithError() throws {
        persistenceManager.clearCache()
        try? keychainManager.clearAll()

        persistenceManager = nil
        obd2Parser = nil
        keychainManager = nil
        try super.tearDownWithError()
    }

    // MARK: - Data Persistence Performance Tests

    func testFleetMetricsSavePerformance() throws {
        let metrics = FleetMetrics.sample

        measure {
            for _ in 0..<100 {
                persistenceManager.saveFleetMetrics(metrics)
            }
        }
    }

    func testFleetMetricsLoadPerformance() throws {
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        measure {
            for _ in 0..<100 {
                _ = persistenceManager.loadFleetMetrics()
            }
        }
    }

    func testGenericCacheSavePerformance() throws {
        struct TestData: Codable {
            let id: Int
            let name: String
            let value: Double
        }

        let testData = TestData(id: 1, name: "test", value: 3.14)

        measure {
            for i in 0..<100 {
                persistenceManager.saveToCache(testData, key: "test_\(i)")
            }
        }
    }

    func testGenericCacheLoadPerformance() throws {
        struct TestData: Codable {
            let id: Int
            let name: String
        }

        let testData = TestData(id: 1, name: "test")
        persistenceManager.saveToCache(testData, key: "test_data")

        measure {
            for _ in 0.../100 {
                _ = persistenceManager.loadFromCache(TestData.self, key: "test_data")
            }
        }
    }

    func testFileSavePerformance() throws {
        struct FileData: Codable {
            let items: [String]
        }

        let data = FileData(items: (0..<100).map { "Item \($0)" })

        measure {
            for i in 0..<10 {
                try? persistenceManager.saveToFile(data, filename: "perf_test_\(i).json")
            }
        }
    }

    func testFileLoadPerformance() throws {
        struct FileData: Codable {
            let items: [String]
        }

        let data = FileData(items: (0..<100).map { "Item \($0)" })
        try persistenceManager.saveToFile(data, filename: "perf_test.json")

        measure {
            for _ in 0..<10 {
                _ = try? persistenceManager.loadFromFile(FileData.self, filename: "perf_test.json")
            }
        }
    }

    // MARK: - OBD2 Parser Performance Tests

    func testOBD2CommandGenerationPerformance() throws {
        measure {
            for _ in 0..<1000 {
                _ = obd2Parser.generateCommand(for: .engineRPM)
                _ = obd2Parser.generateCommand(for: .vehicleSpeed)
                _ = obd2Parser.generateCommand(for: .fuelLevel)
                _ = obd2Parser.generateCommand(for: .coolantTemp)
                _ = obd2Parser.generateCommand(for: .engineLoad)
            }
        }
    }

    func testOBD2ResponseParsingPerformance() throws {
        let rpmResponse = "41 0C 1A F8"
        let speedResponse = "41 0D 3C"
        let fuelResponse = "41 2F 80"
        let tempResponse = "41 05 69"

        measure {
            for _ in 0..<1000 {
                _ = obd2Parser.parseResponse(rpmResponse, for: .engineRPM)
                _ = obd2Parser.parseResponse(speedResponse, for: .vehicleSpeed)
                _ = obd2Parser.parseResponse(fuelResponse, for: .fuelLevel)
                _ = obd2Parser.parseResponse(tempResponse, for: .coolantTemp)
            }
        }
    }

    func testOBD2DTCParsingPerformance() throws {
        let dtcResponse = "43 03 01 71 03 00 04 42"

        measure {
            for _ in 0..<1000 {
                _ = obd2Parser.parseDTCResponse(dtcResponse)
            }
        }
    }

    func testOBD2BulkDataProcessing() throws {
        let responses = [
            ("41 0C 1A F8", OBD2PID.engineRPM),
            ("41 0D 3C", OBD2PID.vehicleSpeed),
            ("41 2F 80", OBD2PID.fuelLevel),
            ("41 05 69", OBD2PID.coolantTemp),
            ("41 04 7F", OBD2PID.engineLoad),
            ("41 11 BF", OBD2PID.throttlePosition)
        ]

        measure {
            for _ in 0..<100 {
                var vehicleData = OBD2VehicleData()
                for (response, pid) in responses {
                    _ = obd2Parser.parseResponse(response, for: pid)
                }
            }
        }
    }

    // MARK: - Keychain Performance Tests

    func testKeychainSavePerformance() throws {
        measure {
            for i in 0..<100 {
                try? keychainManager.save("test-token-\(i)", for: .accessToken)
            }
        }
    }

    func testKeychainRetrievePerformance() async throws {
        try keychainManager.save("test-token", for: .accessToken)

        measure {
            Task {
                for _ in 0..<100 {
                    _ = try? await keychainManager.retrieve(for: .accessToken)
                }
            }
        }
    }

    func testKeychainTokenOperationsPerformance() async throws {
        measure {
            Task {
                for _ in 0..<50 {
                    try? await keychainManager.saveTokens(
                        accessToken: "access-token",
                        refreshToken: "refresh-token",
                        expiresIn: 3600
                    )
                    _ = try? await keychainManager.getAccessToken()
                    _ = await keychainManager.isTokenExpired()
                }
            }
        }
    }

    // MARK: - JSON Encoding/Decoding Performance Tests

    func testJSONEncodingPerformance() throws {
        let metrics = FleetMetrics.sample
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        measure {
            for _ in 0..<1000 {
                _ = try? encoder.encode(metrics)
            }
        }
    }

    func testJSONDecodingPerformance() throws {
        let metrics = FleetMetrics.sample
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(metrics)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        measure {
            for _ in 0..<1000 {
                _ = try? decoder.decode(FleetMetrics.self, from: data)
            }
        }
    }

    func testLargeDataEncodingPerformance() throws {
        struct LargeData: Codable {
            let items: [FleetMetrics]
        }

        let largeData = LargeData(items: (0..<100).map { _ in FleetMetrics.sample })
        let encoder = JSONEncoder()

        measure {
            for _ in 0..<10 {
                _ = try? encoder.encode(largeData)
            }
        }
    }

    // MARK: - Memory Performance Tests

    func testMemoryUsageDuringCaching() throws {
        measureMemory {
            for i in 0..<1000 {
                let metrics = FleetMetrics(
                    totalVehicles: i,
                    activeTrips: i,
                    maintenanceDue: i,
                    availableVehicles: i,
                    vehicleUtilizationRate: 0.5,
                    activeDrivers: i,
                    lastUpdated: Date()
                )
                persistenceManager.saveFleetMetrics(metrics)
            }
        }
    }

    func testMemoryUsageDuringBulkParsing() throws {
        measureMemory {
            for _ in 0..<1000 {
                let response = "41 0C 1A F8"
                _ = obd2Parser.parseResponse(response, for: .engineRPM)
            }
        }
    }

    // MARK: - Concurrent Operations Performance Tests

    func testConcurrentCacheWrites() async throws {
        let options = XCTMeasureOptions()
        options.iterationCount = 5

        measure(options: options) {
            Task {
                await withTaskGroup(of: Void.self) { group in
                    for i in 0..<100 {
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
            }
        }
    }

    func testConcurrentCacheReads() async throws {
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        let options = XCTMeasureOptions()
        options.iterationCount = 5

        measure(options: options) {
            Task {
                await withTaskGroup(of: FleetMetrics?.self) { group in
                    for _ in 0..<100 {
                        group.addTask {
                            return self.persistenceManager.loadFleetMetrics()
                        }
                    }

                    for await _ in group {
                        // Process results
                    }
                }
            }
        }
    }

    // MARK: - API Request Performance Tests

    func testAPIRequestCreationPerformance() throws {
        measure {
            for _ in 0..<1000 {
                _ = APIConfiguration.createRequest(
                    for: APIConfiguration.Endpoints.vehicles,
                    method: .GET,
                    token: "test-token"
                )
            }
        }
    }

    // MARK: - Model Creation Performance Tests

    func testFleetMetricsCreationPerformance() throws {
        measure {
            for i in 0..<1000 {
                _ = FleetMetrics(
                    totalVehicles: i,
                    activeTrips: i % 50,
                    maintenanceDue: i % 10,
                    availableVehicles: i % 100,
                    vehicleUtilizationRate: Double(i) / 1000.0,
                    activeDrivers: i % 200,
                    lastUpdated: Date()
                )
            }
        }
    }

    // MARK: - Complex Workflow Performance Tests

    func testCompleteDataFlowPerformance() throws {
        measure {
            Task {
                // Simulate complete data flow
                for i in 0..<10 {
                    // Create data
                    let metrics = FleetMetrics(
                        totalVehicles: i * 10,
                        activeTrips: i * 2,
                        maintenanceDue: i,
                        availableVehicles: i * 7,
                        vehicleUtilizationRate: 0.75,
                        activeDrivers: i * 8,
                        lastUpdated: Date()
                    )

                    // Save to cache
                    self.persistenceManager.saveFleetMetrics(metrics)

                    // Load from cache
                    _ = self.persistenceManager.loadFleetMetrics()

                    // Check cache validity
                    _ = self.persistenceManager.isCacheValid()
                }
            }
        }
    }

    func testAuthenticationFlowPerformance() async throws {
        measure {
            Task {
                for i in 0..<10 {
                    // Save tokens
                    try? await keychainManager.saveTokens(
                        accessToken: "token-\(i)",
                        refreshToken: "refresh-\(i)",
                        expiresIn: 3600
                    )

                    // Retrieve token
                    _ = try? await keychainManager.getAccessToken()

                    // Check expiry
                    _ = await keychainManager.isTokenExpired()

                    // Clear
                    try? keychainManager.clearAuthenticationData()
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func measureMemory(block: () -> Void) {
        let options = XCTMeasureOptions()
        options.iterationCount = 3

        measure(metrics: [XCTMemoryMetric()], options: options) {
            autoreleasepool {
                block()
            }
        }
    }

    // MARK: - Baseline Performance Tests

    func testBaselineStringOperations() throws {
        measure {
            var result = ""
            for i in 0..<10000 {
                result += String(i)
            }
        }
    }

    func testBaselineArrayOperations() throws {
        measure {
            var array: [Int] = []
            for i in 0..<10000 {
                array.append(i)
            }
            _ = array.filter { $0 % 2 == 0 }
        }
    }

    func testBaselineDictionaryOperations() throws {
        measure {
            var dict: [String: Int] = [:]
            for i in 0..<1000 {
                dict["key\(i)"] = i
            }
            _ = dict.filter { $0.value % 2 == 0 }
        }
    }
}
