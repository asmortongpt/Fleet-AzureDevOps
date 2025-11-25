//
//  DispatchViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for Dispatch Console with real-time fleet management
//

import Foundation
import SwiftUI
import Combine
import MapKit
import CoreLocation

@MainActor
final class DispatchViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var vehicles: [Vehicle] = []
    @Published var drivers: [Driver] = []
    @Published var assignments: [Assignment] = []
    @Published var activeTrips: [Trip] = []
    @Published var pendingAssignments: [Assignment] = []
    @Published var messages: [DispatchMessage] = []

    // Filter state
    @Published var selectedRegion: String?
    @Published var selectedDepartment: String?
    @Published var selectedStatus: VehicleStatus?
    @Published var searchText = ""

    // UI state
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    @Published var showFilterSheet = false
    @Published var showAssignmentSheet = false
    @Published var selectedVehicle: Vehicle?
    @Published var selectedDriver: Driver?
    @Published var selectedAssignment: Assignment?

    // Map state
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )

    // Statistics
    @Published var totalVehicles: Int = 0
    @Published var availableVehicles: Int = 0
    @Published var activeAssignments: Int = 0
    @Published var availableDrivers: Int = 0
    @Published var pendingCount: Int = 0
    @Published var overdueCount: Int = 0
    @Published var unreadMessages: Int = 0

    // MARK: - Private Properties
    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private var cancellables = Set<AnyCancellable>()
    private var refreshTimer: Timer?

    // Auto-refresh interval (15 seconds as specified)
    private let autoRefreshInterval: TimeInterval = 15.0

    // MARK: - Initialization
    init() {
        setupFilters()
        loadCachedData()
        startAutoRefresh()
    }

    deinit {
        stopAutoRefresh()
    }

    // MARK: - Setup
    private func setupFilters() {
        // Combine search and filters
        Publishers.CombineLatest4(
            $vehicles,
            $searchText,
            $selectedRegion,
            $selectedDepartment
        )
        .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
        .sink { [weak self] _, _, _, _ in
            self?.updateStatistics()
        }
        .store(in: &cancellables)
    }

    // MARK: - Data Loading
    private func loadCachedData() {
        // Load cached vehicles
        if let cachedVehicles = persistenceManager.getCachedVehicles() {
            vehicles = cachedVehicles
            updateStatistics()
        }
    }

    func fetchAllData(token: String? = nil, showLoading: Bool = true) async {
        if showLoading {
            isLoading = true
        }
        errorMessage = nil
        showError = false

        // Fetch vehicles, drivers, assignments in parallel
        async let vehiclesTask = fetchVehicles(token: token)
        async let driversTask = fetchDrivers(token: token)
        async let assignmentsTask = fetchAssignments(token: token)
        async let tripsTask = fetchActiveTrips(token: token)
        async let messagesTask = fetchMessages(token: token)

        do {
            let _ = try await (vehiclesTask, driversTask, assignmentsTask, tripsTask, messagesTask)
            updateStatistics()
            isLoading = false
        } catch {
            handleError(error)
            isLoading = false
        }
    }

    private func fetchVehicles(token: String?) async throws {
        let response = try await networkManager.performRequest(
            endpoint: APIConfiguration.Endpoints.vehicles,
            method: .GET,
            token: token,
            responseType: VehiclesResponse.self
        )
        vehicles = response.vehicles
        persistenceManager.cacheVehicles(response.vehicles)
    }

    private func fetchDrivers(token: String?) async throws {
        let response = try await networkManager.performRequest(
            endpoint: APIConfiguration.Endpoints.drivers,
            method: .GET,
            token: token,
            responseType: DriversResponse.self
        )
        drivers = response.drivers
    }

    private func fetchAssignments(token: String?) async throws {
        let response = try await networkManager.performRequest(
            endpoint: APIConfiguration.Endpoints.assignments,
            method: .GET,
            token: token,
            responseType: AssignmentsResponse.self
        )
        assignments = response.assignments
        pendingAssignments = response.assignments.filter { $0.isPending || $0.status == .assigned }
    }

    private func fetchActiveTrips(token: String?) async throws {
        let response = try await networkManager.performRequest(
            endpoint: APIConfiguration.Endpoints.trips + "?status=active",
            method: .GET,
            token: token,
            responseType: TripsResponse.self
        )
        activeTrips = response.trips
    }

    private func fetchMessages(token: String?) async throws {
        let response = try await networkManager.performRequest(
            endpoint: APIConfiguration.Endpoints.messages,
            method: .GET,
            token: token,
            responseType: MessagesResponse.self
        )
        messages = response.messages
    }

    // MARK: - Auto-Refresh
    private func startAutoRefresh() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: autoRefreshInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.fetchAllData(showLoading: false)
            }
        }
    }

    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }

    // MARK: - Statistics
    private func updateStatistics() {
        totalVehicles = vehicles.count
        availableVehicles = vehicles.filter { $0.status == .idle && $0.assignedDriver == nil }.count
        activeAssignments = assignments.filter { $0.isActive }.count
        availableDrivers = drivers.filter { $0.status == .active && $0.assignedVehicles.isEmpty }.count
        pendingCount = assignments.filter { $0.isPending }.count
        overdueCount = assignments.filter { $0.isOverdue }.count
        unreadMessages = messages.filter { !$0.isRead }.count
    }

    // MARK: - Assignment Management
    func createAssignment(_ assignment: Assignment) async {
        do {
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.assignments,
                method: .POST,
                body: assignment,
                responseType: AssignmentResponse.self
            )

            assignments.append(response.assignment)
            if response.assignment.isPending {
                pendingAssignments.append(response.assignment)
            }
            updateStatistics()
            ModernTheme.Haptics.success()
        } catch {
            handleError(error)
            ModernTheme.Haptics.error()
        }
    }

    func updateAssignment(_ assignment: Assignment) async {
        do {
            let response = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.assignments)/\(assignment.id)",
                method: .PUT,
                body: assignment,
                responseType: AssignmentResponse.self
            )

            if let index = assignments.firstIndex(where: { $0.id == assignment.id }) {
                assignments[index] = response.assignment
            }

            // Update pending list
            pendingAssignments = assignments.filter { $0.isPending || $0.status == .assigned }
            updateStatistics()
            ModernTheme.Haptics.success()
        } catch {
            handleError(error)
            ModernTheme.Haptics.error()
        }
    }

    func assignVehicleToDriver(vehicleId: String, driverId: String) async {
        // Create assignment payload
        let assignmentData: [String: Any] = [
            "vehicleId": vehicleId,
            "driverId": driverId,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        do {
            _ = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.vehicles)/\(vehicleId)/assign",
                method: .POST,
                body: assignmentData,
                responseType: SuccessResponse.self
            )

            // Update local state
            if let vehicleIndex = vehicles.firstIndex(where: { $0.id == vehicleId }) {
                var updatedVehicle = vehicles[vehicleIndex]
                if let driver = drivers.first(where: { $0.id == driverId }) {
                    updatedVehicle.assignedDriver = driver.fullName
                    vehicles[vehicleIndex] = updatedVehicle
                }
            }

            updateStatistics()
            ModernTheme.Haptics.success()
        } catch {
            handleError(error)
            ModernTheme.Haptics.error()
        }
    }

    func unassignVehicle(vehicleId: String) async {
        do {
            _ = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.vehicles)/\(vehicleId)/unassign",
                method: .POST,
                responseType: SuccessResponse.self
            )

            // Update local state
            if let vehicleIndex = vehicles.firstIndex(where: { $0.id == vehicleId }) {
                var updatedVehicle = vehicles[vehicleIndex]
                updatedVehicle.assignedDriver = nil
                vehicles[vehicleIndex] = updatedVehicle
            }

            updateStatistics()
            ModernTheme.Haptics.success()
        } catch {
            handleError(error)
            ModernTheme.Haptics.error()
        }
    }

    // MARK: - Communication
    func sendMessage(_ message: DispatchMessage) async {
        do {
            _ = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.messages,
                method: .POST,
                body: message,
                responseType: MessageResponse.self
            )

            messages.append(message)
            ModernTheme.Haptics.success()
        } catch {
            handleError(error)
            ModernTheme.Haptics.error()
        }
    }

    func markMessageAsRead(_ messageId: String) async {
        do {
            _ = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.messages)/\(messageId)/read",
                method: .PUT,
                responseType: SuccessResponse.self
            )

            if let index = messages.firstIndex(where: { $0.id == messageId }) {
                var updatedMessage = messages[index]
                updatedMessage.isRead = true
                messages[index] = updatedMessage
            }

            updateStatistics()
        } catch {
            handleError(error)
        }
    }

    // MARK: - Filtering
    func applyFilters(region: String? = nil, department: String? = nil, status: VehicleStatus? = nil) {
        selectedRegion = region
        selectedDepartment = department
        selectedStatus = status
        updateStatistics()
        ModernTheme.Haptics.selection()
    }

    func clearFilters() {
        selectedRegion = nil
        selectedDepartment = nil
        selectedStatus = nil
        searchText = ""
        updateStatistics()
        ModernTheme.Haptics.light()
    }

    var filteredVehicles: [Vehicle] {
        var filtered = vehicles

        if let region = selectedRegion {
            filtered = filtered.filter { $0.region == region }
        }

        if let department = selectedDepartment {
            filtered = filtered.filter { $0.department == department }
        }

        if let status = selectedStatus {
            filtered = filtered.filter { $0.status == status }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter { vehicle in
                vehicle.number.localizedCaseInsensitiveContains(searchText) ||
                vehicle.make.localizedCaseInsensitiveContains(searchText) ||
                vehicle.model.localizedCaseInsensitiveContains(searchText)
            }
        }

        return filtered
    }

    var availableDriversList: [Driver] {
        drivers.filter { $0.status == .active && $0.schedule?.availability == .available }
    }

    var availableVehiclesList: [Vehicle] {
        vehicles.filter { $0.status == .idle && $0.assignedDriver == nil }
    }

    // MARK: - Map Controls
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

    func centerOnAllVehicles() {
        let filteredVehicles = self.filteredVehicles
        guard !filteredVehicles.isEmpty else {
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

    // MARK: - Refresh
    func refresh() async {
        ModernTheme.Haptics.medium()
        await fetchAllData(showLoading: true)
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

    // MARK: - Regions and Departments
    var availableRegions: [String] {
        Array(Set(vehicles.map { $0.region })).sorted()
    }

    var availableDepartments: [String] {
        Array(Set(vehicles.map { $0.department })).sorted()
    }
}

// MARK: - API Response Models
struct TripsResponse: Codable {
    let trips: [Trip]
    let total: Int
}

struct MessagesResponse: Codable {
    let messages: [DispatchMessage]
    let total: Int
}

struct MessageResponse: Codable {
    let message: DispatchMessage
}

struct SuccessResponse: Codable {
    let success: Bool
    let message: String?
}

// MARK: - API Configuration Extension
extension APIConfiguration.Endpoints {
    static let drivers = "/api/drivers"
    static let assignments = "/api/assignments"
    static let messages = "/api/dispatch/messages"
}
