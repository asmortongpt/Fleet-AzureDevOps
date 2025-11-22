import Foundation
import SwiftUI
import Combine

// MARK: - Dashboard View Model
@MainActor
class DashboardViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var state: DashboardState = .loading
    @Published var isRefreshing: Bool = false
    @Published var lastSyncTime: Date?
    @Published var showingOfflineIndicator: Bool = false

    // MARK: - Dependencies
    private let networkManager: AzureNetworkManager
    private let persistenceManager: DataPersistenceManager
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    init(
        networkManager: AzureNetworkManager = AzureNetworkManager(),
        persistenceManager: DataPersistenceManager = .shared
    ) {
        self.networkManager = networkManager
        self.persistenceManager = persistenceManager

        // Observe network status
        networkManager.$isConnected
            .sink { [weak self] isConnected in
                self?.showingOfflineIndicator = !isConnected
            }
            .store(in: &cancellables)
    }

    // MARK: - Public Methods

    /// Load dashboard data (from cache or API)
    func loadDashboard() async {
        state = .loading

        // Try to load from cache first
        if let cachedMetrics = persistenceManager.loadFleetMetrics(),
           persistenceManager.isCacheValid() {
            state = .loaded(cachedMetrics)
            lastSyncTime = persistenceManager.getLastSyncTime()

            // Fetch fresh data in background
            Task {
                await fetchFleetMetrics(silent: true)
            }
        } else {
            // No valid cache, fetch from API
            await fetchFleetMetrics(silent: false)
        }
    }

    /// Refresh dashboard data (pull-to-refresh)
    func refresh() async {
        isRefreshing = true
        await fetchFleetMetrics(silent: false)
        isRefreshing = false
    }

    /// Fetch fleet metrics from API
    private func fetchFleetMetrics(silent: Bool) async {
        do {
            // Check network connectivity
            if !networkManager.isConnected {
                await networkManager.checkConnection()
            }

            // Attempt to fetch from API
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.fleetMetrics,
                method: .GET,
                token: getUserToken(),
                responseType: FleetMetricsResponse.self
            )

            // Update state and cache
            let metrics = response.data
            state = .loaded(metrics)
            lastSyncTime = Date()

            // Save to cache
            persistenceManager.saveFleetMetrics(metrics)

        } catch APIError.authenticationFailed {
            handleError("Authentication failed. Please log in again.", silent: silent)
        } catch APIError.networkError {
            handleNetworkError(silent: silent)
        } catch APIError.serverError {
            handleError("Server error. Please try again later.", silent: silent)
        } catch {
            handleError(error.localizedDescription, silent: silent)
        }
    }

    /// Handle network errors with offline fallback
    private func handleNetworkError(silent: Bool) {
        // Try to use cached data
        if let cachedMetrics = persistenceManager.loadFleetMetrics() {
            state = .loaded(cachedMetrics)
            lastSyncTime = persistenceManager.getLastSyncTime()
            showingOfflineIndicator = true
        } else {
            if !silent {
                state = .error("No internet connection and no cached data available")
            }
        }
    }

    /// Handle general errors
    private func handleError(_ message: String, silent: Bool) {
        if !silent {
            // Try to fallback to cache
            if let cachedMetrics = persistenceManager.loadFleetMetrics() {
                state = .loaded(cachedMetrics)
                lastSyncTime = persistenceManager.getLastSyncTime()
            } else {
                state = .error(message)
            }
        }
    }

    /// Get user authentication token
    private func getUserToken() -> String? {
        // TODO: Integrate with KeychainManager when authentication is implemented
        // For now, return nil and let the API handle unauthenticated requests
        return nil
    }

    // MARK: - Quick Actions

    /// Handle quick action tap
    func handleQuickAction(_ action: QuickActionType) {
        // TODO: Navigate to respective screens
        print("Quick action tapped: \(action.rawValue)")

        switch action {
        case .startTrip:
            handleStartTrip()
        case .reportIssue:
            handleReportIssue()
        case .vehicleInspection:
            handleVehicleInspection()
        }
    }

    private func handleStartTrip() {
        // Navigate to trip creation screen
        // This will be implemented when navigation is set up
        print("Starting trip...")
    }

    private func handleReportIssue() {
        // Navigate to issue reporting screen
        print("Reporting issue...")
    }

    private func handleVehicleInspection() {
        // Navigate to vehicle inspection screen
        print("Starting vehicle inspection...")
    }

    // MARK: - Metric Card Generation

    /// Generate metric cards from fleet metrics
    func generateMetricCards(from metrics: FleetMetrics) -> [MetricCardData] {
        return [
            MetricCardData(
                title: "Total Vehicles",
                value: "\(metrics.totalVehicles)",
                icon: "car.2.fill",
                color: "blue",
                accessibilityLabel: "Total vehicles: \(metrics.totalVehicles)"
            ),
            MetricCardData(
                title: "Active Trips",
                value: "\(metrics.activeTrips)",
                icon: "map.fill",
                color: "green",
                accessibilityLabel: "Active trips: \(metrics.activeTrips)"
            ),
            MetricCardData(
                title: "Maintenance Due",
                value: "\(metrics.maintenanceDue)",
                icon: "wrench.and.screwdriver.fill",
                color: metrics.maintenanceDue > 0 ? "orange" : "gray",
                accessibilityLabel: "Vehicles needing maintenance: \(metrics.maintenanceDue)"
            ),
            MetricCardData(
                title: "Available",
                value: "\(metrics.availableVehicles)",
                icon: "checkmark.circle.fill",
                color: "teal",
                accessibilityLabel: "Available vehicles: \(metrics.availableVehicles)"
            ),
            MetricCardData(
                title: "Utilization",
                value: String(format: "%.0f%%", metrics.vehicleUtilizationRate * 100),
                icon: "chart.bar.fill",
                color: "purple",
                accessibilityLabel: "Fleet utilization rate: \(String(format: "%.0f", metrics.vehicleUtilizationRate * 100)) percent"
            ),
            MetricCardData(
                title: "Active Drivers",
                value: "\(metrics.activeDrivers)",
                icon: "person.fill",
                color: "indigo",
                accessibilityLabel: "Active drivers: \(metrics.activeDrivers)"
            )
        ]
    }

    // MARK: - Cache Management

    /// Clear cached data
    func clearCache() {
        persistenceManager.clearCache()
        lastSyncTime = nil
    }

    /// Format last sync time for display
    func formattedSyncTime() -> String {
        guard let syncTime = lastSyncTime else {
            return "Never"
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: syncTime, relativeTo: Date())
    }
}
