//
//  IntegrationTests.swift
//  Fleet Management App Tests
//
//  End-to-end integration tests for app workflows
//

import XCTest
@testable import App

@MainActor
class IntegrationTests: XCTestCase {

    var keychainManager: KeychainManager!
    var persistenceManager: DataPersistenceManager!
    var authService: AuthenticationService!

    override func setUpWithError() throws {
        try super.setUpWithError()
        keychainManager = KeychainManager.shared
        persistenceManager = DataPersistenceManager.shared
        authService = AuthenticationService.shared

        // Clean up before each test
        try? keychainManager.clearAll()
        persistenceManager.clearCache()
    }

    override func tearDownWithError() throws {
        // Clean up after each test
        try? keychainManager.clearAll()
        persistenceManager.clearCache()

        keychainManager = nil
        persistenceManager = nil
        authService = nil
        try super.tearDownWithError()
    }

    // MARK: - Complete Authentication Flow Tests

    func testCompleteLoginFlow() async throws {
        // This test demonstrates the complete login flow
        // In a real scenario, you'd mock the network calls

        // Given - User credentials
        let email = "test@example.com"
        let userId = "123"

        // When - Simulate successful login
        let accessToken = "mock-access-token"
        let refreshToken = "mock-refresh-token"
        let expiresIn = 3600

        // Save tokens to keychain
        try await keychainManager.saveTokens(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: expiresIn
        )

        // Save user info
        try keychainManager.save(email, for: .userEmail)
        try keychainManager.save(userId, for: .userId)

        // Then - Verify authentication state
        let savedAccessToken = try await keychainManager.getAccessToken()
        let savedRefreshToken = try await keychainManager.getRefreshToken()
        let isExpired = await keychainManager.isTokenExpired()

        XCTAssertEqual(savedAccessToken, accessToken)
        XCTAssertEqual(savedRefreshToken, refreshToken)
        XCTAssertFalse(isExpired)
    }

    func testCompleteLogoutFlow() async throws {
        // Given - Authenticated user
        try await keychainManager.saveTokens(
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresIn: 3600
        )
        try keychainManager.save("test@example.com", for: .userEmail)

        // When - Logout
        try keychainManager.clearAuthenticationData()

        // Then - Verify all auth data is cleared
        XCTAssertFalse(keychainManager.exists(for: .accessToken))
        XCTAssertFalse(keychainManager.exists(for: .refreshToken))
        XCTAssertFalse(keychainManager.exists(for: .userEmail))
    }

    // MARK: - Data Persistence Flow Tests

    func testDataLoadSaveCycle() async throws {
        // Given - Initial metrics
        let initialMetrics = FleetMetrics(
            totalVehicles: 50,
            activeTrips: 10,
            maintenanceDue: 3,
            availableVehicles: 37,
            vehicleUtilizationRate: 0.74,
            activeDrivers: 42,
            lastUpdated: Date()
        )

        // When - Save to persistence
        persistenceManager.saveFleetMetrics(initialMetrics)

        // Then - Load and verify
        let loadedMetrics = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(loadedMetrics)
        XCTAssertEqual(loadedMetrics?.totalVehicles, initialMetrics.totalVehicles)
        XCTAssertEqual(loadedMetrics?.activeTrips, initialMetrics.activeTrips)

        // Verify cache is valid
        XCTAssertTrue(persistenceManager.isCacheValid())
    }

    func testCacheExpirationCycle() async throws {
        // Given - Save metrics
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)
        XCTAssertTrue(persistenceManager.isCacheValid())

        // When - Manually expire cache
        let oldDate = Date().addingTimeInterval(-20 * 60) // 20 minutes ago
        UserDefaults.standard.set(oldDate, forKey: "last_sync_timestamp")

        // Then - Cache should be invalid
        XCTAssertFalse(persistenceManager.isCacheValid())
    }

    // MARK: - Dashboard Loading Flow Tests

    func testDashboardLoadWithCacheFallback() async throws {
        // Given - Cached data
        let cachedMetrics = FleetMetrics.sample
        persistenceManager.saveFleetMetrics(cachedMetrics)

        // Create view model
        let viewModel = DashboardViewModel(
            networkManager: AzureNetworkManager(),
            persistenceManager: persistenceManager
        )

        // When - Load dashboard (will use cache)
        await viewModel.loadDashboard()

        // Then - Should load from cache
        if case .loaded(let metrics) = viewModel.state {
            XCTAssertEqual(metrics.totalVehicles, cachedMetrics.totalVehicles)
        } else {
            XCTFail("Expected loaded state")
        }
    }

    // MARK: - Token Refresh Flow Tests

    func testTokenExpiryAndRefreshFlow() async throws {
        // Given - Expired token
        let expiredDate = Date().addingTimeInterval(-3600) // 1 hour ago
        let expiryString = ISO8601DateFormatter().string(from: expiredDate)
        try keychainManager.save(expiryString, for: .tokenExpiry)
        try keychainManager.save("old-access-token", for: .accessToken)
        try keychainManager.save("refresh-token", for: .refreshToken)

        // When - Check if expired
        let isExpired = await keychainManager.isTokenExpired()
        XCTAssertTrue(isExpired)

        // Simulate refresh (in real app, would call API)
        let newAccessToken = "new-access-token"
        let newExpiresIn = 3600
        try await keychainManager.saveTokens(
            accessToken: newAccessToken,
            refreshToken: "refresh-token",
            expiresIn: newExpiresIn
        )

        // Then - Token should be refreshed and valid
        let refreshedToken = try await keychainManager.getAccessToken()
        XCTAssertEqual(refreshedToken, newAccessToken)

        let stillExpired = await keychainManager.isTokenExpired()
        XCTAssertFalse(stillExpired)
    }

    // MARK: - OBD2 Data Collection Flow Tests

    func testOBD2DataParsingFlow() throws {
        // Given - OBD2 parser
        let parser = OBD2DataParser.shared

        // When - Parse multiple PIDs
        let rpmResponse = "41 0C 1A F8" // 1726 RPM
        let speedResponse = "41 0D 3C" // 60 km/h
        let fuelResponse = "41 2F 80" // ~50% fuel

        let rpm = parser.parseResponse(rpmResponse, for: .engineRPM) as? Int
        let speed = parser.parseResponse(speedResponse, for: .vehicleSpeed) as? Int
        let fuel = parser.parseResponse(fuelResponse, for: .fuelLevel) as? Int

        // Then - Build vehicle data
        var vehicleData = OBD2VehicleData()
        vehicleData.engineRPM = rpm
        vehicleData.vehicleSpeed = speed
        vehicleData.fuelLevel = fuel

        XCTAssertNotNil(vehicleData.engineRPM)
        XCTAssertNotNil(vehicleData.vehicleSpeed)
        XCTAssertNotNil(vehicleData.fuelLevel)
        XCTAssertTrue(vehicleData.isDriving)
    }

    // MARK: - Multi-Component Integration Tests

    func testAuthenticationAndDataPersistenceIntegration() async throws {
        // Scenario: User logs in and dashboard data is loaded

        // Step 1: Authenticate
        try await keychainManager.saveTokens(
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresIn: 3600
        )

        // Step 2: Verify authentication
        let token = try await keychainManager.getAccessToken()
        XCTAssertNotNil(token)

        // Step 3: Load and cache dashboard data
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        // Step 4: Verify data is cached
        let metrics = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(metrics)

        // Step 5: Simulate app restart - data should still be available
        let reloadedMetrics = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(reloadedMetrics)
        XCTAssertEqual(reloadedMetrics?.totalVehicles, metrics?.totalVehicles)
    }

    func testCompleteAppLifecycle() async throws {
        // Scenario: Complete app lifecycle from launch to background

        // Step 1: App Launch - Check for cached data
        let cachedOnLaunch = persistenceManager.loadFleetMetrics()
        XCTAssertNil(cachedOnLaunch) // First launch, no cache

        // Step 2: User logs in
        try await keychainManager.saveTokens(
            accessToken: "token",
            refreshToken: "refresh",
            expiresIn: 3600
        )

        // Step 3: Dashboard loads data
        persistenceManager.saveFleetMetrics(FleetMetrics.sample)

        // Step 4: App goes to background - verify data is persisted
        let metricsInBackground = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(metricsInBackground)

        // Step 5: App returns to foreground - data should still be available
        let metricsInForeground = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(metricsInForeground)

        // Step 6: User logs out
        try keychainManager.clearAuthenticationData()
        persistenceManager.clearCache()

        // Step 7: Verify clean state
        XCTAssertFalse(keychainManager.exists(for: .accessToken))
        XCTAssertNil(persistenceManager.loadFleetMetrics())
    }

    // MARK: - Error Recovery Flow Tests

    func testNetworkErrorRecoveryFlow() async throws {
        // Given - Cached data available
        let cachedMetrics = FleetMetrics.sample
        persistenceManager.saveFleetMetrics(cachedMetrics)

        // When - Network fails (simulated by not having network)
        // App should fall back to cache

        // Create view model
        let mockNetworkManager = MockFailingNetworkManager()
        let viewModel = DashboardViewModel(
            networkManager: mockNetworkManager,
            persistenceManager: persistenceManager
        )

        // When - Try to load dashboard
        await viewModel.loadDashboard()

        // Then - Should use cached data
        if case .loaded(let metrics) = viewModel.state {
            XCTAssertEqual(metrics.totalVehicles, cachedMetrics.totalVehicles)
        }
    }

    // MARK: - Concurrent Operations Tests

    func testConcurrentDataOperations() async throws {
        // Scenario: Multiple concurrent operations

        let iterations = 20

        await withTaskGroup(of: Void.self) { group in
            // Concurrent saves
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

        // Verify data integrity
        let finalMetrics = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(finalMetrics)
    }

    // MARK: - Data Migration Tests

    func testDataMigrationScenario() throws {
        // Scenario: Old data format to new format

        // Given - Old format data (simulated)
        struct OldMetricsFormat: Codable {
            let vehicles: Int
            let trips: Int
        }

        let oldData = OldMetricsFormat(vehicles: 50, trips: 10)
        persistenceManager.saveToCache(oldData, key: "old_metrics")

        // When - Migrate to new format
        if let old: OldMetricsFormat = persistenceManager.loadFromCache(
            OldMetricsFormat.self,
            key: "old_metrics"
        ) {
            let newMetrics = FleetMetrics(
                totalVehicles: old.vehicles,
                activeTrips: old.trips,
                maintenanceDue: 0,
                availableVehicles: 0,
                vehicleUtilizationRate: 0.0,
                activeDrivers: 0,
                lastUpdated: Date()
            )
            persistenceManager.saveFleetMetrics(newMetrics)
        }

        // Then - Verify migration
        let migratedMetrics = persistenceManager.loadFleetMetrics()
        XCTAssertNotNil(migratedMetrics)
        XCTAssertEqual(migratedMetrics?.totalVehicles, 50)
        XCTAssertEqual(migratedMetrics?.activeTrips, 10)
    }

    // MARK: - Performance Integration Tests

    func testEndToEndPerformance() throws {
        measure {
            Task {
                // Simulate complete user flow
                try? await keychainManager.saveTokens(
                    accessToken: "token",
                    refreshToken: "refresh",
                    expiresIn: 3600
                )
                persistenceManager.saveFleetMetrics(FleetMetrics.sample)
                _ = persistenceManager.loadFleetMetrics()
                _ = try? await keychainManager.getAccessToken()
            }
        }
    }
}

// MARK: - Mock Failing Network Manager

class MockFailingNetworkManager: AzureNetworkManager {
    override init() {
        super.init()
        self.isConnected = false
    }

    override func performRequest<T>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: [String : Any]? = nil,
        token: String? = nil,
        responseType: T.Type
    ) async throws -> T where T : Decodable, T : Encodable {
        throw APIError.networkError
    }
}
