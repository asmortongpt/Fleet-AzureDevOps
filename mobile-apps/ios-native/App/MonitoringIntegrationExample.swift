//
//  MonitoringIntegrationExample.swift
//  Fleet Manager - iOS Native App
//
//  Example integration of monitoring and observability system
//  This file demonstrates how to integrate monitoring into your app
//

import Foundation
import SwiftUI

// MARK: - Example: App Launch Integration

class MonitoredAppDelegate: UIResponder, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // Step 1: Mark app launch start for performance tracking
        PerformanceMonitor.shared.markAppLaunchStart()

        // Step 2: Start observability system
        ObservabilityManager.shared.startMonitoring()

        // Step 3: Track app lifecycle event
        ObservabilityManager.shared.trackAppLifecycle(.didFinishLaunching)

        // Step 4: Perform initialization
        setupApp()

        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Mark app launch complete
        PerformanceMonitor.shared.markAppLaunchEnd()

        ObservabilityManager.shared.trackAppLifecycle(.didBecomeActive)
    }

    private func setupApp() {
        // Your app initialization code
    }
}

// MARK: - Example: Screen View Tracking

struct MonitoredVehicleListView: View {
    @State private var vehicles: [Vehicle] = []

    var body: some View {
        List(vehicles) { vehicle in
            VehicleRow(vehicle: vehicle)
        }
        .navigationTitle("Vehicles")
        .onAppear {
            // Track screen view
            ObservabilityManager.shared.trackScreenView("VehicleListView")

            // Track feature usage
            MetricsCollector.shared.recordFeatureUsage(featureName: "vehicle_list")

            loadVehicles()
        }
    }

    private func loadVehicles() {
        // Load vehicles with monitoring
        Task {
            await loadVehiclesWithMonitoring()
        }
    }

    private func loadVehiclesWithMonitoring() async {
        // Use traced operation for automatic monitoring
        do {
            vehicles = try await ObservabilityManager.shared.traced(
                "load_vehicles",
                attributes: ["source": "api"]
            ) {
                try await VehicleService.shared.fetchVehicles()
            }
        } catch {
            // Error is automatically logged by traced operation
            AlertManager.shared.sendAlert(
                .criticalError(error: error),
                severity: .high
            )
        }
    }
}

// MARK: - Example: API Request Monitoring

class MonitoredVehicleService {

    func fetchVehicles() async throws -> [Vehicle] {
        let endpoint = "/api/vehicles"

        // Start tracking network request
        let requestId = PerformanceMonitor.shared.startNetworkRequest(
            url: endpoint,
            method: "GET"
        )

        let startTime = Date()

        do {
            // Make API request
            let vehicles: [Vehicle] = try await performAPIRequest(endpoint: endpoint)

            let duration = Date().timeIntervalSince(startTime)

            // End tracking with success
            PerformanceMonitor.shared.endNetworkRequest(
                requestId: requestId,
                statusCode: 200,
                bytesReceived: nil
            )

            // Record API metric
            MetricsCollector.shared.recordAPIRequest(
                endpoint: endpoint,
                method: "GET",
                statusCode: 200,
                duration: duration
            )

            return vehicles

        } catch {
            let duration = Date().timeIntervalSince(startTime)

            // End tracking with failure
            PerformanceMonitor.shared.endNetworkRequest(
                requestId: requestId,
                statusCode: nil,
                bytesReceived: nil
            )

            // Record failed API request
            MetricsCollector.shared.recordAPIRequest(
                endpoint: endpoint,
                method: "GET",
                statusCode: 500,
                duration: duration
            )

            throw error
        }
    }

    private func performAPIRequest<T: Codable>(endpoint: String) async throws -> T {
        // Your actual API request implementation
        fatalError("Implement actual API request")
    }
}

// MARK: - Example: Database Operation Monitoring

class MonitoredDataPersistence {

    func saveVehicle(_ vehicle: Vehicle) async throws {
        // Start database query tracking
        let queryId = PerformanceMonitor.shared.startDatabaseQuery(
            query: "INSERT INTO vehicles",
            type: "INSERT"
        )

        let startTime = Date()

        do {
            // Perform database operation
            try await performDatabaseSave(vehicle)

            let duration = Date().timeIntervalSince(startTime)

            // End tracking with success
            PerformanceMonitor.shared.endDatabaseQuery(
                queryId: queryId,
                rowCount: 1
            )

            // Record database operation metric
            MetricsCollector.shared.recordDatabaseOperation(
                operation: "INSERT",
                duration: duration,
                success: true
            )

        } catch {
            let duration = Date().timeIntervalSince(startTime)

            // End tracking with failure
            PerformanceMonitor.shared.endDatabaseQuery(
                queryId: queryId,
                rowCount: nil
            )

            // Record failed database operation
            MetricsCollector.shared.recordDatabaseOperation(
                operation: "INSERT",
                duration: duration,
                success: false
            )

            throw error
        }
    }

    private func performDatabaseSave(_ vehicle: Vehicle) async throws {
        // Your actual database save implementation
    }
}

// MARK: - Example: Business Event Tracking

class MonitoredTripService {

    func createTrip(vehicleId: String) async throws -> Trip {
        // Create trip with monitoring
        let trip = try await performTripCreation(vehicleId: vehicleId)

        // Record business metric
        MetricsCollector.shared.recordTripCreated(
            tripId: trip.id,
            vehicleId: vehicleId
        )

        // Track user action
        MetricsCollector.shared.recordUserAction(
            action: "create_trip",
            screenName: "TripTrackingView"
        )

        // Track feature usage
        MetricsCollector.shared.recordFeatureUsage(featureName: "trip_tracking")

        return trip
    }

    func completeTrip(tripId: String, distance: Double, duration: TimeInterval) async throws {
        // Complete trip
        try await performTripCompletion(tripId: tripId)

        // Record business metric
        MetricsCollector.shared.recordTripCompleted(
            tripId: tripId,
            distance: distance,
            duration: duration
        )

        // Track custom event
        ObservabilityManager.shared.trackEvent(
            "trip_completed",
            attributes: [
                "trip_id": tripId,
                "distance": String(format: "%.2f", distance)
            ],
            metrics: [
                "distance_km": distance,
                "duration_seconds": duration
            ]
        )
    }

    private func performTripCreation(vehicleId: String) async throws -> Trip {
        // Your actual trip creation implementation
        fatalError("Implement trip creation")
    }

    private func performTripCompletion(tripId: String) async throws {
        // Your actual trip completion implementation
    }
}

// MARK: - Example: Cache Monitoring

class MonitoredCacheManager {

    private var cache: [String: Any] = [:]

    func get<T>(_ key: String) -> T? {
        if let value = cache[key] as? T {
            // Record cache hit
            MetricsCollector.shared.recordCacheHit(key: key)
            return value
        } else {
            // Record cache miss
            MetricsCollector.shared.recordCacheMiss(key: key)
            return nil
        }
    }

    func set<T>(_ key: String, value: T) {
        cache[key] = value
    }
}

// MARK: - Example: Sync Operation Monitoring

class MonitoredSyncService {

    func syncVehicles() async throws {
        let startTime = Date()
        var syncedCount = 0

        do {
            // Perform sync
            let vehicles = try await fetchVehiclesFromServer()
            syncedCount = vehicles.count

            try await saveVehiclesToLocal(vehicles)

            let duration = Date().timeIntervalSince(startTime)

            // Record successful sync
            MetricsCollector.shared.recordSyncOperation(
                type: "vehicles",
                itemsCount: syncedCount,
                duration: duration,
                success: true
            )

        } catch {
            let duration = Date().timeIntervalSince(startTime)

            // Record failed sync
            MetricsCollector.shared.recordSyncOperation(
                type: "vehicles",
                itemsCount: syncedCount,
                duration: duration,
                success: false
            )

            // Send alert for sync failure
            AlertManager.shared.sendAlert(
                .syncFailure(reason: error.localizedDescription),
                severity: .medium
            )

            throw error
        }
    }

    private func fetchVehiclesFromServer() async throws -> [Vehicle] {
        // Your implementation
        []
    }

    private func saveVehiclesToLocal(_ vehicles: [Vehicle]) async throws {
        // Your implementation
    }
}

// MARK: - Example: Health Monitoring Integration

class MonitoredHealthMonitor {

    func performPeriodicHealthCheck() async {
        // Run comprehensive health check
        let report = await HealthCheckManager.shared.runHealthCheck()

        if !report.isHealthy {
            // Send alert if unhealthy
            AlertManager.shared.sendAlert(
                .healthCheckFailed(report: report),
                severity: .high,
                metadata: [
                    "api_health": report.apiHealth.status.rawValue,
                    "database_health": report.databaseHealth.status.rawValue,
                    "storage_health": report.storageHealth.status.rawValue
                ]
            )
        }

        // Log health status
        LoggingManager.shared.log(
            report.isHealthy ? .info : .warning,
            "Health check completed",
            metadata: [
                "overall_status": report.overallStatus.rawValue,
                "duration": String(format: "%.3f", report.duration)
            ]
        )
    }
}

// MARK: - Example: Diagnostics Export

class MonitoredDiagnosticsExporter {

    func exportDiagnostics() async -> [String: Any] {
        // Generate comprehensive diagnostics report
        let diagnostics = await ObservabilityManager.shared.exportDiagnostics()

        // Include additional app-specific information
        var fullReport = diagnostics
        fullReport["app_version"] = getAppVersion()
        fullReport["device_info"] = getDeviceInfo()
        fullReport["system_metrics"] = MetricsCollector.shared.getSystemMetrics().toDictionary()
        fullReport["alert_statistics"] = AlertManager.shared.getAlertStatistics()

        return fullReport
    }

    private func getAppVersion() -> String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
        return "\(version) (\(build))"
    }

    private func getDeviceInfo() -> [String: String] {
        return [
            "model": UIDevice.current.model,
            "system": UIDevice.current.systemName,
            "version": UIDevice.current.systemVersion
        ]
    }
}

// MARK: - Example: Custom Alert Handling

class MonitoredAlertHandler {

    init() {
        setupAlertHandling()
    }

    private func setupAlertHandling() {
        // Add custom alert handler
        AlertManager.shared.addAlertHandler { [weak self] alert in
            self?.handleAlert(alert)
        }

        // Subscribe to alert notifications
        NotificationCenter.default.addObserver(
            forName: .productionAlertReceived,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let alert = notification.userInfo?["alert"] as? Alert {
                self?.showAlertInUI(alert)
            }
        }
    }

    private func handleAlert(_ alert: Alert) {
        // Custom alert handling logic
        switch alert.severity {
        case .critical:
            handleCriticalAlert(alert)
        case .high:
            handleHighAlert(alert)
        case .medium, .low:
            logAlert(alert)
        }
    }

    private func handleCriticalAlert(_ alert: Alert) {
        // Show critical alert to user
        // Log to crash reporter
        // Send to monitoring service
        print("🚨 CRITICAL ALERT: \(alert.type.title)")
    }

    private func handleHighAlert(_ alert: Alert) {
        // Log and potentially notify user
        print("⚠️ HIGH ALERT: \(alert.type.title)")
    }

    private func logAlert(_ alert: Alert) {
        // Just log the alert
        print("ℹ️ Alert: \(alert.type.title)")
    }

    private func showAlertInUI(_ alert: Alert) {
        // Show alert in your app's UI
        // This could be a banner, toast, or full-screen alert
    }
}

// MARK: - Example: Performance Monitoring View

struct MonitoringDashboardView: View {
    @State private var performanceMetrics: PerformanceMetrics?
    @State private var systemMetrics: SystemMetrics?
    @State private var healthReport: HealthCheckReport?

    var body: some View {
        List {
            Section("Performance") {
                if let metrics = performanceMetrics {
                    MetricRow(
                        title: "App Launch Time",
                        value: String(format: "%.2fs", metrics.appLaunchTime ?? 0)
                    )
                    MetricRow(
                        title: "Current FPS",
                        value: String(format: "%.1f", metrics.currentFPS ?? 0)
                    )
                    MetricRow(
                        title: "Memory Usage",
                        value: String(format: "%.1f%%", metrics.currentMemoryUsage?.percentage ?? 0)
                    )
                    MetricRow(
                        title: "Battery Level",
                        value: String(format: "%.0f%%", metrics.batteryLevel * 100)
                    )
                }
            }

            Section("Health") {
                if let health = healthReport {
                    HealthRow(
                        title: "Overall Status",
                        status: health.overallStatus
                    )
                    HealthRow(
                        title: "API",
                        status: health.apiHealth.status
                    )
                    HealthRow(
                        title: "Database",
                        status: health.databaseHealth.status
                    )
                    HealthRow(
                        title: "Network",
                        status: health.networkHealth.status
                    )
                }
            }

            Section("Business Metrics") {
                if let metrics = systemMetrics {
                    MetricRow(
                        title: "Total Trips",
                        value: String(metrics.business.totalTrips)
                    )
                    MetricRow(
                        title: "Vehicles Tracked",
                        value: String(metrics.business.vehiclesTracked.count)
                    )
                    MetricRow(
                        title: "API Success Rate",
                        value: String(format: "%.1f%%", metrics.technical.apiSuccessRate)
                    )
                    MetricRow(
                        title: "Cache Hit Rate",
                        value: String(format: "%.1f%%", metrics.technical.cacheHitRate)
                    )
                }
            }
        }
        .navigationTitle("Monitoring Dashboard")
        .onAppear {
            loadMetrics()
        }
        .refreshable {
            await refreshMetrics()
        }
    }

    private func loadMetrics() {
        performanceMetrics = PerformanceMonitor.shared.getCurrentMetrics()
        systemMetrics = MetricsCollector.shared.getSystemMetrics()

        Task {
            healthReport = await HealthCheckManager.shared.runHealthCheck()
        }
    }

    private func refreshMetrics() async {
        performanceMetrics = PerformanceMonitor.shared.getCurrentMetrics()
        systemMetrics = MetricsCollector.shared.getSystemMetrics()
        healthReport = await HealthCheckManager.shared.runHealthCheck()
    }
}

struct MetricRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundColor(.secondary)
        }
    }
}

struct HealthRow: View {
    let title: String
    let status: HealthStatus

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(status.rawValue)
                .foregroundColor(statusColor)
        }
    }

    private var statusColor: Color {
        switch status {
        case .healthy:
            return .green
        case .degraded:
            return .orange
        case .unhealthy:
            return .red
        }
    }
}

// MARK: - Supporting Types (placeholders removed - using real models from App/Models/)

struct MonitoringTrip: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let startTime: Date
}

struct VehicleRow: View {
    let vehicle: Vehicle

    var body: some View {
        Text("\(vehicle.make) \(vehicle.model)")
    }
}

class VehicleService {
    static let shared = VehicleService()

    func fetchVehicles() async throws -> [Vehicle] {
        // Placeholder implementation
        []
    }
}
