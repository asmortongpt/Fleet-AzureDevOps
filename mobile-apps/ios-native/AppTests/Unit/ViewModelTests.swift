//
//  ViewModelTests.swift
//  Fleet Management App Tests
//
//  Unit tests for ViewModels with async/await and Combine
//

import XCTest
import Combine
@testable import App

@MainActor
class ViewModelTests: XCTestCase {

    var viewModel: DashboardViewModel!
    var mockNetworkManager: MockAzureNetworkManager!
    var mockPersistenceManager: MockDataPersistenceManager!
    var cancellables: Set<AnyCancellable>!

    override func setUpWithError() throws {
        try super.setUpWithError()
        mockNetworkManager = MockAzureNetworkManager()
        mockPersistenceManager = MockDataPersistenceManager()
        cancellables = Set<AnyCancellable>()

        viewModel = DashboardViewModel(
            networkManager: mockNetworkManager,
            persistenceManager: mockPersistenceManager
        )
    }

    override func tearDownWithError() throws {
        viewModel = nil
        mockNetworkManager = nil
        mockPersistenceManager = nil
        cancellables = nil
        try super.tearDownWithError()
    }

    // MARK: - Initialization Tests

    func testViewModelInitialization() throws {
        // Then
        XCTAssertEqual(viewModel.state, .loading)
        XCTAssertFalse(viewModel.isRefreshing)
        XCTAssertNil(viewModel.lastSyncTime)
    }

    // MARK: - Load Dashboard Tests

    func testLoadDashboardWithValidCache() async throws {
        // Given
        let cachedMetrics = FleetMetrics.sample
        mockPersistenceManager.cachedMetrics = cachedMetrics
        mockPersistenceManager.isCacheValidValue = true
        mockPersistenceManager.lastSyncTimeValue = Date()

        // When
        await viewModel.loadDashboard()

        // Then
        if case .loaded(let metrics) = viewModel.state {
            XCTAssertEqual(metrics.totalVehicles, cachedMetrics.totalVehicles)
        } else {
            XCTFail("Expected loaded state")
        }
    }

    func testLoadDashboardWithExpiredCache() async throws {
        // Given
        mockPersistenceManager.cachedMetrics = nil
        mockPersistenceManager.isCacheValidValue = false
        mockNetworkManager.shouldSucceed = true

        // When
        await viewModel.loadDashboard()

        // Then
        // Should attempt to fetch from network
        XCTAssertTrue(mockNetworkManager.performRequestCalled)
    }

    func testLoadDashboardWithNoCache() async throws {
        // Given
        mockPersistenceManager.cachedMetrics = nil
        mockNetworkManager.shouldSucceed = true

        // When
        await viewModel.loadDashboard()

        // Then
        XCTAssertTrue(mockNetworkManager.performRequestCalled)
    }

    // MARK: - Refresh Tests

    func testRefreshDashboard() async throws {
        // Given
        mockNetworkManager.shouldSucceed = true

        // When
        await viewModel.refresh()

        // Then
        XCTAssertTrue(mockNetworkManager.performRequestCalled)
        XCTAssertFalse(viewModel.isRefreshing)
    }

    func testRefreshSetsRefreshingState() async throws {
        // Given
        mockNetworkManager.shouldSucceed = true
        var refreshingStates: [Bool] = []

        // Observe refreshing state changes
        viewModel.$isRefreshing
            .sink { isRefreshing in
                refreshingStates.append(isRefreshing)
            }
            .store(in: &cancellables)

        // When
        await viewModel.refresh()

        // Then
        // Should have been true during refresh
        XCTAssertTrue(refreshingStates.contains(true))
        // Should be false after completion
        XCTAssertFalse(viewModel.isRefreshing)
    }

    // MARK: - Error Handling Tests

    func testLoadDashboardWithNetworkError() async throws {
        // Given
        mockPersistenceManager.cachedMetrics = nil
        mockNetworkManager.shouldSucceed = false
        mockNetworkManager.errorToThrow = APIError.networkError

        // When
        await viewModel.loadDashboard()

        // Then
        if case .error(let message) = viewModel.state {
            XCTAssertFalse(message.isEmpty)
        } else {
            // With no cache, might end up in error state
            XCTAssertNotEqual(viewModel.state, .loading)
        }
    }

    func testLoadDashboardWithAuthError() async throws {
        // Given
        mockPersistenceManager.cachedMetrics = nil
        mockNetworkManager.shouldSucceed = false
        mockNetworkManager.errorToThrow = APIError.authenticationFailed

        // When
        await viewModel.loadDashboard()

        // Then
        // Should handle auth error
        XCTAssertNotEqual(viewModel.state, .loading)
    }

    func testNetworkErrorFallsBackToCache() async throws {
        // Given
        let cachedMetrics = FleetMetrics.sample
        mockPersistenceManager.cachedMetrics = cachedMetrics
        mockNetworkManager.shouldSucceed = false
        mockNetworkManager.errorToThrow = APIError.networkError

        // When
        await viewModel.loadDashboard()

        // Then
        if case .loaded(let metrics) = viewModel.state {
            XCTAssertEqual(metrics.totalVehicles, cachedMetrics.totalVehicles)
        }
        XCTAssertTrue(viewModel.showingOfflineIndicator)
    }

    // MARK: - Offline Indicator Tests

    func testOfflineIndicatorShownWhenNotConnected() throws {
        // Given
        mockNetworkManager.isConnected = false

        // Create new view model to trigger initialization
        let newViewModel = DashboardViewModel(
            networkManager: mockNetworkManager,
            persistenceManager: mockPersistenceManager
        )

        // When
        // Network connection status is observed during init

        // Then
        XCTAssertTrue(newViewModel.showingOfflineIndicator)
    }

    func testOfflineIndicatorHiddenWhenConnected() throws {
        // Given
        mockNetworkManager.isConnected = true

        // Create new view model to trigger initialization
        let newViewModel = DashboardViewModel(
            networkManager: mockNetworkManager,
            persistenceManager: mockPersistenceManager
        )

        // Then
        XCTAssertFalse(newViewModel.showingOfflineIndicator)
    }

    // MARK: - Metric Card Generation Tests

    func testGenerateMetricCards() throws {
        // Given
        let metrics = FleetMetrics.sample

        // When
        let cards = viewModel.generateMetricCards(from: metrics)

        // Then
        XCTAssertEqual(cards.count, 6)
        XCTAssertTrue(cards.contains { $0.title == "Total Vehicles" })
        XCTAssertTrue(cards.contains { $0.title == "Active Trips" })
        XCTAssertTrue(cards.contains { $0.title == "Maintenance Due" })
        XCTAssertTrue(cards.contains { $0.title == "Available" })
        XCTAssertTrue(cards.contains { $0.title == "Utilization" })
        XCTAssertTrue(cards.contains { $0.title == "Active Drivers" })
    }

    func testMetricCardValues() throws {
        // Given
        let metrics = FleetMetrics(
            totalVehicles: 100,
            activeTrips: 25,
            maintenanceDue: 5,
            availableVehicles: 70,
            vehicleUtilizationRate: 0.75,
            activeDrivers: 80,
            lastUpdated: Date()
        )

        // When
        let cards = viewModel.generateMetricCards(from: metrics)

        // Then
        let totalVehiclesCard = cards.first { $0.title == "Total Vehicles" }
        XCTAssertEqual(totalVehiclesCard?.value, "100")

        let utilizationCard = cards.first { $0.title == "Utilization" }
        XCTAssertEqual(utilizationCard?.value, "75%")
    }

    func testMaintenanceDueColorChange() throws {
        // Given - No maintenance due
        let noMaintenanceMetrics = FleetMetrics(
            totalVehicles: 100,
            activeTrips: 25,
            maintenanceDue: 0,
            availableVehicles: 75,
            vehicleUtilizationRate: 0.75,
            activeDrivers: 80,
            lastUpdated: Date()
        )

        // When
        let noMaintenanceCards = viewModel.generateMetricCards(from: noMaintenanceMetrics)
        let noMaintenanceCard = noMaintenanceCards.first { $0.title == "Maintenance Due" }

        // Then
        XCTAssertEqual(noMaintenanceCard?.color, "gray")

        // Given - Maintenance due
        let maintenanceMetrics = FleetMetrics(
            totalVehicles: 100,
            activeTrips: 25,
            maintenanceDue: 5,
            availableVehicles: 70,
            vehicleUtilizationRate: 0.75,
            activeDrivers: 80,
            lastUpdated: Date()
        )

        // When
        let maintenanceCards = viewModel.generateMetricCards(from: maintenanceMetrics)
        let maintenanceCard = maintenanceCards.first { $0.title == "Maintenance Due" }

        // Then
        XCTAssertEqual(maintenanceCard?.color, "orange")
    }

    // MARK: - Quick Action Tests

    func testHandleStartTripAction() throws {
        // When
        viewModel.handleQuickAction(.startTrip)

        // Then - Should not crash
        XCTAssertNotNil(viewModel)
    }

    func testHandleReportIssueAction() throws {
        // When
        viewModel.handleQuickAction(.reportIssue)

        // Then - Should not crash
        XCTAssertNotNil(viewModel)
    }

    func testHandleVehicleInspectionAction() throws {
        // When
        viewModel.handleQuickAction(.vehicleInspection)

        // Then - Should not crash
        XCTAssertNotNil(viewModel)
    }

    // MARK: - Cache Management Tests

    func testClearCache() throws {
        // Given
        viewModel.lastSyncTime = Date()

        // When
        viewModel.clearCache()

        // Then
        XCTAssertTrue(mockPersistenceManager.clearCacheCalled)
        XCTAssertNil(viewModel.lastSyncTime)
    }

    func testFormattedSyncTime() throws {
        // Given - Recent sync
        viewModel.lastSyncTime = Date()

        // When
        let formattedTime = viewModel.formattedSyncTime()

        // Then
        XCTAssertFalse(formattedTime.isEmpty)
        XCTAssertNotEqual(formattedTime, "Never")
    }

    func testFormattedSyncTimeWhenNever() throws {
        // Given
        viewModel.lastSyncTime = nil

        // When
        let formattedTime = viewModel.formattedSyncTime()

        // Then
        XCTAssertEqual(formattedTime, "Never")
    }

    // MARK: - State Tests

    func testDashboardStateIsLoading() throws {
        // Given
        let loadingState = DashboardState.loading

        // Then
        XCTAssertTrue(loadingState.isLoading)
        XCTAssertNil(loadingState.fleetMetrics)
        XCTAssertNil(loadingState.errorMessage)
    }

    func testDashboardStateLoaded() throws {
        // Given
        let metrics = FleetMetrics.sample
        let loadedState = DashboardState.loaded(metrics)

        // Then
        XCTAssertFalse(loadedState.isLoading)
        XCTAssertNotNil(loadedState.fleetMetrics)
        XCTAssertNil(loadedState.errorMessage)
        XCTAssertEqual(loadedState.fleetMetrics?.totalVehicles, metrics.totalVehicles)
    }

    func testDashboardStateError() throws {
        // Given
        let errorMessage = "Test error"
        let errorState = DashboardState.error(errorMessage)

        // Then
        XCTAssertFalse(errorState.isLoading)
        XCTAssertNil(errorState.fleetMetrics)
        XCTAssertEqual(errorState.errorMessage, errorMessage)
    }

    func testDashboardStateEmpty() throws {
        // Given
        let emptyState = DashboardState.empty

        // Then
        XCTAssertFalse(emptyState.isLoading)
        XCTAssertNil(emptyState.fleetMetrics)
        XCTAssertNil(emptyState.errorMessage)
    }

    // MARK: - Performance Tests

    func testLoadDashboardPerformance() async throws {
        // Given
        mockPersistenceManager.cachedMetrics = FleetMetrics.sample
        mockPersistenceManager.isCacheValidValue = true

        // When / Then
        measure {
            Task {
                await viewModel.loadDashboard()
            }
        }
    }

    func testGenerateMetricCardsPerformance() throws {
        // Given
        let metrics = FleetMetrics.sample

        // When / Then
        measure {
            for _ in 0..<100 {
                _ = viewModel.generateMetricCards(from: metrics)
            }
        }
    }
}

// MARK: - Mock Azure Network Manager

class MockAzureNetworkManager: AzureNetworkManager {
    var shouldSucceed = true
    var errorToThrow: Error?
    var performRequestCalled = false

    override init() {
        super.init()
    }

    override func performRequest<T>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: [String : Any]? = nil,
        token: String? = nil,
        responseType: T.Type
    ) async throws -> T where T : Decodable, T : Encodable {
        performRequestCalled = true

        if !shouldSucceed {
            throw errorToThrow ?? APIError.networkError
        }

        // Return mock response
        if T.self == FleetMetricsResponse.self {
            let response = FleetMetricsResponse(
                success: true,
                data: FleetMetrics.sample,
                timestamp: Date()
            )
            return response as! T
        }

        throw APIError.decodingError
    }
}

// MARK: - Mock Data Persistence Manager

class MockDataPersistenceManager: DataPersistenceManager {
    var cachedMetrics: FleetMetrics?
    var isCacheValidValue = false
    var lastSyncTimeValue: Date?
    var clearCacheCalled = false
    var saveFleetMetricsCalled = false

    override func loadFleetMetrics() -> FleetMetrics? {
        return cachedMetrics
    }

    override func saveFleetMetrics(_ metrics: FleetMetrics) {
        saveFleetMetricsCalled = true
        cachedMetrics = metrics
    }

    override func isCacheValid() -> Bool {
        return isCacheValidValue
    }

    override func getLastSyncTime() -> Date? {
        return lastSyncTimeValue
    }

    override func clearCache() {
        clearCacheCalled = true
        cachedMetrics = nil
        lastSyncTimeValue = nil
    }
}
