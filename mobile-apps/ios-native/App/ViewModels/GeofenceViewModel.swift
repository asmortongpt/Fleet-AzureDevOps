import Foundation
import Combine
import SwiftUI
import CoreLocation
import MapKit

@MainActor
class GeofenceViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var geofences: [Geofence] = []
    @Published var violations: [GeofenceViolation] = []
    @Published var statistics: GeofenceStatistics?
    @Published var selectedGeofence: Geofence?
    @Published var selectedViolation: GeofenceViolation?
    @Published var showingCreateGeofence = false
    @Published var showingViolationsHistory = false
    @Published var filterByType: GeofenceType?
    @Published var showActiveOnly = true
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    // Location monitoring
    private let locationManager = CLLocationManager()
    private var monitoredRegions: Set<CLCircularRegion> = []

    // MARK: - Computed Properties
    var filteredGeofences: [Geofence] {
        var filtered = geofences

        if showActiveOnly {
            filtered = filtered.filter { $0.isActive }
        }

        if let type = filterByType {
            filtered = filtered.filter { $0.type == type }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.description?.localizedCaseInsensitiveContains(searchText) ?? false
            }
        }

        return filtered
    }

    var activeGeofences: [Geofence] {
        geofences.filter { $0.isActive }
    }

    var unacknowledgedViolations: [GeofenceViolation] {
        violations.filter { !$0.acknowledged }
    }

    var recentViolations: [GeofenceViolation] {
        violations.filter {
            $0.timestamp > Date().addingTimeInterval(-24 * 3600)
        }
    }

    var geofencesByType: [GeofenceType: [Geofence]] {
        Dictionary(grouping: geofences) { $0.type }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        setupLocationManager()
        Task {
            await loadInitialData()
        }
    }

    private func setupLocationManager() {
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
    }

    // MARK: - Data Loading
    func loadInitialData() async {
        await refresh()
    }

    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadGeofences() }
            group.addTask { await self.loadViolations() }
            group.addTask { await self.loadStatistics() }
        }

        finishRefreshing()
    }

    func loadGeofences() async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            let mockGeofences = generateMockGeofences()

            await MainActor.run {
                self.geofences = mockGeofences
                self.finishLoading()
            }

            // Start monitoring geofences
            startMonitoring(geofences: mockGeofences)
        } catch {
            handleError(error)
        }
    }

    func loadViolations() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockViolations = generateMockViolations()

            await MainActor.run {
                self.violations = mockViolations
            }
        } catch {
            print("Error loading violations: \(error)")
        }
    }

    func loadStatistics() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockStats = generateMockStatistics()

            await MainActor.run {
                self.statistics = mockStats
            }
        } catch {
            print("Error loading statistics: \(error)")
        }
    }

    // MARK: - CRUD Operations
    func createGeofence(_ geofence: Geofence) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            await MainActor.run {
                self.geofences.append(geofence)
                self.finishLoading()
                self.showingCreateGeofence = false
                ModernTheme.Haptics.success()
            }

            if geofence.isActive {
                startMonitoring(geofences: [geofence])
            }

            await loadStatistics()
        } catch {
            handleError(error)
        }
    }

    func updateGeofence(_ geofence: Geofence) async {
        do {
            startLoading()

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.geofences.firstIndex(where: { $0.id == geofence.id }) {
                    self.geofences[index] = geofence
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            // Update monitoring
            stopMonitoring(geofenceId: geofence.id)
            if geofence.isActive {
                startMonitoring(geofences: [geofence])
            }
        } catch {
            handleError(error)
        }
    }

    func deleteGeofence(_ geofence: Geofence) async {
        do {
            startLoading()

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.geofences.removeAll { $0.id == geofence.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            stopMonitoring(geofenceId: geofence.id)
            await loadStatistics()
        } catch {
            handleError(error)
        }
    }

    func toggleGeofenceActive(_ geofence: Geofence) async {
        var updated = geofence
        updated.isActive = !geofence.isActive
        await updateGeofence(updated)
    }

    // MARK: - Violation Management
    func acknowledgeViolation(_ violation: GeofenceViolation, notes: String?) async {
        var updated = violation
        updated.acknowledged = true
        updated.acknowledgedBy = "Current User"
        updated.acknowledgedDate = Date()
        updated.notes = notes

        // Update in array
        if let index = violations.firstIndex(where: { $0.id == violation.id }) {
            violations[index] = updated
        }

        ModernTheme.Haptics.success()
        await loadStatistics()
    }

    func deleteViolation(_ violation: GeofenceViolation) async {
        violations.removeAll { $0.id == violation.id }
        ModernTheme.Haptics.success()
        await loadStatistics()
    }

    // MARK: - Location Monitoring
    func requestLocationPermissions() {
        locationManager.requestAlwaysAuthorization()
    }

    private func startMonitoring(geofences: [Geofence]) {
        for geofence in geofences {
            guard geofence.isActive else { continue }

            switch geofence.shape {
            case .circle(let circle):
                let region = CLCircularRegion(
                    center: circle.coordinate,
                    radius: circle.radius,
                    identifier: geofence.id
                )
                region.notifyOnEntry = geofence.notifications.onEntry
                region.notifyOnExit = geofence.notifications.onExit

                locationManager.startMonitoring(for: region)
                monitoredRegions.insert(region)

            case .polygon:
                // Polygon monitoring would require custom logic
                break
            }
        }
    }

    private func stopMonitoring(geofenceId: String) {
        if let region = monitoredRegions.first(where: { $0.identifier == geofenceId }) {
            locationManager.stopMonitoring(for: region)
            monitoredRegions.remove(region)
        }
    }

    func stopAllMonitoring() {
        for region in monitoredRegions {
            locationManager.stopMonitoring(for: region)
        }
        monitoredRegions.removeAll()
    }

    // MARK: - Map Helpers
    func centerMapOn(geofence: Geofence) {
        switch geofence.shape {
        case .circle(let circle):
            withAnimation {
                mapRegion = MKCoordinateRegion(
                    center: circle.coordinate,
                    latitudinalMeters: circle.radius * 4,
                    longitudinalMeters: circle.radius * 4
                )
            }
        case .polygon(let polygon):
            if let firstCoord = polygon.coordinates.first {
                withAnimation {
                    mapRegion = MKCoordinateRegion(
                        center: firstCoord.clCoordinate,
                        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                    )
                }
            }
        }
    }

    // MARK: - Search
    override func performSearch() {
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        filterByType = nil
    }

    // MARK: - Mock Data Generation
    private func generateMockGeofences() -> [Geofence] {
        let types = GeofenceType.allCases
        let names = ["Downtown Zone", "Depot Area", "Service Region A", "Parking Lot", "Restricted Area"]

        return (0..<10).map { index in
            let lat = 38.9072 + Double.random(in: -0.05...0.05)
            let lon = -77.0369 + Double.random(in: -0.05...0.05)
            let radius = Double.random(in: 500...2000)

            return Geofence(
                id: "GEO-\(String(format: "%03d", index + 1))",
                name: names.randomElement()! + " \(index + 1)",
                description: "Geofence for monitoring",
                type: types.randomElement()!,
                shape: .circle(GeofenceCircle(
                    center: CLLocationCoordinate2D(latitude: lat, longitude: lon),
                    radius: radius
                )),
                isActive: index % 4 != 0,
                createdDate: Date().addingTimeInterval(Double(-index * 86400 * 7)),
                createdBy: "Admin",
                assignedVehicles: (0..<Int.random(in: 1...5)).map { "VEH-\(String(format: "%03d", $0 + 1))" },
                assignedDrivers: [],
                notifications: GeofenceNotifications(
                    onEntry: true,
                    onExit: true,
                    onDwell: index % 2 == 0,
                    dwellTimeMinutes: index % 2 == 0 ? 30 : nil
                ),
                schedule: nil,
                tags: ["zone-\(index)"]
            )
        }
    }

    private func generateMockViolations() -> [GeofenceViolation] {
        let geofenceNames = ["Downtown Zone", "Depot Area", "Restricted Area"]
        let vehicleNumbers = ["V-12345", "V-12346", "V-12347"]
        let drivers = ["John Doe", "Jane Smith", "Bob Johnson"]

        return (0..<15).map { index in
            GeofenceViolation(
                id: "VIO-\(UUID().uuidString.prefix(8))",
                geofenceId: "GEO-\(String(format: "%03d", Int.random(in: 1...10)))",
                geofenceName: geofenceNames.randomElement()!,
                vehicleId: "VEH-\(String(format: "%03d", index + 1))",
                vehicleNumber: vehicleNumbers.randomElement()!,
                driverName: drivers.randomElement()!,
                violationType: GeofenceViolation.ViolationType.allCases.randomElement()!,
                timestamp: Date().addingTimeInterval(Double(-index * 3600)),
                location: Coordinate(
                    latitude: 38.9072 + Double.random(in: -0.05...0.05),
                    longitude: -77.0369 + Double.random(in: -0.05...0.05)
                ),
                duration: index % 3 == 0 ? Double.random(in: 300...3600) : nil,
                acknowledged: index % 3 == 0,
                acknowledgedBy: index % 3 == 0 ? "Manager" : nil,
                acknowledgedDate: index % 3 == 0 ? Date() : nil,
                notes: nil
            )
        }
    }

    private func generateMockStatistics() -> GeofenceStatistics {
        let byType = Dictionary(grouping: geofences) { $0.type.rawValue }
            .mapValues { $0.count }

        let byGeofence = Dictionary(grouping: violations) { $0.geofenceName }
            .mapValues { $0.count }

        return GeofenceStatistics(
            totalGeofences: geofences.count,
            activeGeofences: activeGeofences.count,
            totalViolations: violations.count,
            unacknowledgedViolations: unacknowledgedViolations.count,
            violationsByType: [:],
            violationsByGeofence: byGeofence,
            mostViolatedGeofence: byGeofence.max(by: { $0.value < $1.value })?.key,
            recentViolations: Array(recentViolations.prefix(5))
        )
    }
}

// MARK: - CLLocationManagerDelegate
extension GeofenceViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        Task {
            await handleGeofenceEvent(region: region, eventType: .entry)
        }
    }

    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        Task {
            await handleGeofenceEvent(region: region, eventType: .exit)
        }
    }

    private func handleGeofenceEvent(region: CLRegion, eventType: GeofenceViolation.ViolationType) async {
        guard let geofence = geofences.first(where: { $0.id == region.identifier }) else { return }

        // Create violation
        let violation = GeofenceViolation(
            id: UUID().uuidString,
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            vehicleId: "VEH-001",
            vehicleNumber: "Current Vehicle",
            driverName: "Current Driver",
            violationType: eventType,
            timestamp: Date(),
            location: Coordinate(latitude: 0, longitude: 0),
            duration: nil,
            acknowledged: false,
            acknowledgedBy: nil,
            acknowledgedDate: nil,
            notes: nil
        )

        await MainActor.run {
            violations.insert(violation, at: 0)
            ModernTheme.Haptics.warning()
        }

        await loadStatistics()
    }
}
