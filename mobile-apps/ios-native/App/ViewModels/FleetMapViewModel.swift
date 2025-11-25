//
//  FleetMapViewModel.swift
//  Fleet Manager
//
//  ViewModel for Fleet Map View with real-time location updates
//

import Foundation
import SwiftUI
import Combine
import MapKit
import CoreLocation

@MainActor
final class FleetMapViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var vehicles: [Vehicle] = []
    @Published var filteredVehicles: [Vehicle] = []
    @Published var selectedVehicle: Vehicle?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false

    // Filter state
    @Published var selectedStatusFilter: VehicleStatus?
    @Published var searchText = ""
    @Published var showFilterSheet = false
    @Published var showLegend = false

    // Location state
    @Published var userLocation: CLLocationCoordinate2D?
    @Published var locationPermissionStatus: CLAuthorizationStatus = .notDetermined

    // Map region
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )

    // Statistics
    @Published var activeCount: Int = 0
    @Published var idleCount: Int = 0
    @Published var offlineCount: Int = 0
    @Published var maintenanceCount: Int = 0
    @Published var emergencyCount: Int = 0

    // MARK: - Private Properties
    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private let locationManager = CLLocationManager()
    private var cancellables = Set<AnyCancellable>()
    private var refreshTimer: Timer?

    // Auto-refresh interval (30 seconds)
    private let autoRefreshInterval: TimeInterval = 30.0

    // MARK: - Initialization
    init() {
        setupLocationManager()
        setupSearchAndFilter()
        loadCachedData()
        startAutoRefresh()
    }

    deinit {
        stopAutoRefresh()
    }

    // MARK: - Location Manager Setup
    private func setupLocationManager() {
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationPermissionStatus = locationManager.authorizationStatus
    }

    func requestLocationPermission() {
        locationManager.requestWhenInUseAuthorization()
        locationPermissionStatus = locationManager.authorizationStatus
    }

    func centerOnUserLocation() {
        if let location = locationManager.location {
            userLocation = location.coordinate
            withAnimation {
                mapRegion = MKCoordinateRegion(
                    center: location.coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                )
            }
            ModernTheme.Haptics.light()
        } else {
            errorMessage = "Unable to get your current location"
            showError = true
        }
    }

    // MARK: - Search and Filter Setup
    private func setupSearchAndFilter() {
        Publishers.CombineLatest3(
            $vehicles,
            $searchText,
            $selectedStatusFilter
        )
        .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
        .map { vehicles, searchText, statusFilter in
            var filtered = vehicles

            // Apply status filter
            if let status = statusFilter {
                filtered = filtered.filter { $0.status == status }
            }

            // Apply search filter
            if !searchText.isEmpty {
                filtered = filtered.filter { vehicle in
                    vehicle.number.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.make.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.model.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.vin.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.licensePlate.localizedCaseInsensitiveContains(searchText) ||
                    (vehicle.assignedDriver?.localizedCaseInsensitiveContains(searchText) ?? false)
                }
            }

            return filtered
        }
        .assign(to: &$filteredVehicles)
    }

    // MARK: - Data Loading
    private func loadCachedData() {
        if let cachedVehicles = persistenceManager.getCachedVehicles() {
            vehicles = cachedVehicles
            updateStatistics()
        }
    }

    func fetchVehicles(token: String? = nil, showLoading: Bool = true) async {
        if showLoading {
            isLoading = true
        }
        errorMessage = nil
        showError = false

        do {
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.vehicles,
                method: .GET,
                token: token,
                responseType: VehiclesResponse.self
            )

            vehicles = response.vehicles
            persistenceManager.cacheVehicles(response.vehicles)
            updateStatistics()
            isLoading = false

            // Center map on all vehicles after first load
            if mapRegion.center.latitude == 38.9072 && mapRegion.center.longitude == -77.0369 {
                centerOnAllVehicles()
            }

        } catch {
            handleError(error)

            // Fall back to cached data if available
            if let cachedVehicles = persistenceManager.getCachedVehicles() {
                vehicles = cachedVehicles
                updateStatistics()
                if showLoading {
                    errorMessage = "Using cached data. \(error.localizedDescription)"
                    showError = true
                }
            }

            isLoading = false
        }
    }

    // MARK: - Auto-Refresh
    private func startAutoRefresh() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: autoRefreshInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.fetchVehicles(showLoading: false)
            }
        }
    }

    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }

    // MARK: - Statistics
    private func updateStatistics() {
        activeCount = vehicles.filter { $0.status == .active }.count
        idleCount = vehicles.filter { $0.status == .idle }.count
        offlineCount = vehicles.filter { $0.status == .offline }.count
        maintenanceCount = vehicles.filter { $0.status == .service }.count
        emergencyCount = vehicles.filter { $0.status == .emergency }.count
    }

    // MARK: - Map Controls
    func centerOnAllVehicles() {
        guard !filteredVehicles.isEmpty else {
            // Default to DC area if no vehicles
            withAnimation {
                mapRegion = MKCoordinateRegion(
                    center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
                    span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
                )
            }
            return
        }

        var minLat = 90.0
        var maxLat = -90.0
        var minLng = 180.0
        var maxLng = -180.0

        for vehicle in filteredVehicles {
            minLat = min(minLat, vehicle.location.lat)
            maxLat = max(maxLat, vehicle.location.lat)
            minLng = min(minLng, vehicle.location.lng)
            maxLng = max(maxLng, vehicle.location.lng)
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 1.5, 0.05),
            longitudeDelta: max((maxLng - minLng) * 1.5, 0.05)
        )

        withAnimation {
            mapRegion = MKCoordinateRegion(center: center, span: span)
        }

        ModernTheme.Haptics.light()
    }

    func centerOnVehicle(_ vehicle: Vehicle) {
        withAnimation {
            mapRegion = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: vehicle.location.lat, longitude: vehicle.location.lng),
                span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
            )
        }
        selectedVehicle = vehicle
        ModernTheme.Haptics.light()
    }

    // MARK: - Filtering
    func applyStatusFilter(_ status: VehicleStatus?) {
        selectedStatusFilter = status
        ModernTheme.Haptics.selection()
    }

    func clearFilters() {
        searchText = ""
        selectedStatusFilter = nil
        ModernTheme.Haptics.light()
    }

    func getVehiclesByStatus(_ status: VehicleStatus) -> [Vehicle] {
        vehicles.filter { $0.status == status }
    }

    // MARK: - Refresh
    func refresh() async {
        ModernTheme.Haptics.medium()
        await fetchVehicles(showLoading: true)
    }

    // MARK: - Error Handling
    private func handleError(_ error: Error) {
        if let apiError = error as? APIError {
            errorMessage = apiError.errorDescription
        } else {
            errorMessage = error.localizedDescription
        }
        showError = true
    }

    // MARK: - Map Annotations
    func getAnnotationColor(for status: VehicleStatus) -> Color {
        switch status {
        case .active:
            return ModernTheme.Colors.active
        case .idle:
            return ModernTheme.Colors.idle
        case .charging:
            return ModernTheme.Colors.charging
        case .service:
            return ModernTheme.Colors.service
        case .emergency:
            return ModernTheme.Colors.emergency
        case .offline:
            return ModernTheme.Colors.offline
        }
    }

    // MARK: - Time Formatting
    func timeAgoString() -> String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.minute, .second]
        formatter.unitsStyle = .abbreviated
        return "Updated \(formatter.string(from: autoRefreshInterval) ?? "30s") ago"
    }
}

// MARK: - Vehicle Status Legend
extension FleetMapViewModel {
    var statusLegend: [(status: VehicleStatus, color: Color, count: Int)] {
        [
            (.active, ModernTheme.Colors.active, activeCount),
            (.idle, ModernTheme.Colors.idle, idleCount),
            (.offline, ModernTheme.Colors.offline, offlineCount),
            (.service, ModernTheme.Colors.service, maintenanceCount),
            (.emergency, ModernTheme.Colors.emergency, emergencyCount)
        ]
    }
}
