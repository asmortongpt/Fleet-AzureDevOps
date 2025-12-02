//
//  EnhancedViewModels.swift
//  Fleet Manager
//
//  Enhanced ViewModels with real data integration, search, filter, and sort
//

import Foundation
import SwiftUI
import Combine

// MARK: - Enhanced Vehicles ViewModel
@MainActor
final class EnhancedVehiclesViewModel: SimpleBaseViewModel {
    @Published var vehicles: [Vehicle] = []
    @Published var filteredVehicles: [Vehicle] = []
    @Published var searchText: String = ""
    @Published var loadingState: LoadingState = .idle
    @Published var selectedFilter: VehicleFilter = .all
    @Published var selectedSortOption: VehicleSortOption = .name

    private var cancellables = Set<AnyCancellable>()

    var activeCount: Int {
        vehicles.filter { $0.status == .active || $0.status == .moving }.count
    }

    var maintenanceCount: Int {
        vehicles.filter { $0.status == .maintenance }.count
    }

    var offlineCount: Int {
        vehicles.filter { $0.status == .offline }.count
    }

    enum LoadingState {
        case idle, loading, loaded, error
    }

    enum VehicleFilter: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case inactive = "Inactive"
        case maintenance = "Maintenance"

        var icon: String {
            switch self {
            case .all: return "car.2.fill"
            case .active: return "bolt.fill"
            case .inactive: return "powersleep"
            case .maintenance: return "wrench.fill"
            }
        }
    }

    enum VehicleSortOption: String, CaseIterable {
        case name = "Name"
        case status = "Status"
        case mileage = "Mileage"
        case lastActive = "Last Active"

        var icon: String {
            switch self {
            case .name: return "textformat.abc"
            case .status: return "circle.fill"
            case .mileage: return "speedometer"
            case .lastActive: return "clock.arrow.circlepath"
            }
        }
    }

    override init() {
        super.init()
        loadMockData()
        setupReactiveSearch()
    }

    private func loadMockData() {
        // Initialize with empty data - will be populated from API
        self.vehicles = []
        updateFilteredResults()
    }

    private func setupReactiveSearch() {
        // Setup debounced search (300ms)
        $searchText
            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)

        // Watch filter changes
        $selectedFilter
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)

        // Watch sort option changes
        $selectedSortOption
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)
    }

    private func updateFilteredResults() {
        var results = vehicles

        // Apply filter
        switch selectedFilter {
        case .all:
            break // No filtering needed
        case .active:
            results = results.filter { $0.status == .active || $0.status == .moving }
        case .inactive:
            results = results.filter { $0.status == .inactive || $0.status == .offline || $0.status == .parked }
        case .maintenance:
            results = results.filter { $0.status == .maintenance }
        }

        // Apply search
        if !searchText.isEmpty {
            let lowercasedSearch = searchText.lowercased()
            results = results.filter { vehicle in
                vehicle.number.lowercased().contains(lowercasedSearch) ||
                vehicle.make.lowercased().contains(lowercasedSearch) ||
                vehicle.model.lowercased().contains(lowercasedSearch) ||
                vehicle.department.lowercased().contains(lowercasedSearch) ||
                (vehicle.assignedDriver?.lowercased().contains(lowercasedSearch) ?? false)
            }
        }

        // Apply sort
        switch selectedSortOption {
        case .name:
            results.sort { $0.number < $1.number }
        case .status:
            results.sort { $0.status.rawValue < $1.status.rawValue }
        case .mileage:
            results.sort { $0.mileage > $1.mileage }
        case .lastActive:
            results.sort { $0.lastService > $1.lastService }
        }

        filteredVehicles = results
    }

    func applyFilter(_ filter: VehicleFilter) {
        selectedFilter = filter
    }

    func applySortOption(_ option: VehicleSortOption) {
        selectedSortOption = option
    }

    func exportVehicleList() {
        // Export functionality
    }

    func importVehicles() {
        // Import functionality
    }

    func refresh() async {
        loadingState = .loading
        try? await Task.sleep(nanoseconds: 500_000_000)
        loadMockData()
        loadingState = .loaded
    }
}

// MARK: - Enhanced Trips ViewModel
@MainActor
final class EnhancedTripsViewModel: SimpleBaseViewModel {
    @Published var trips: [Trip] = []
    @Published var filteredTrips: [Trip] = []
    @Published var searchText: String = ""
    @Published var loadingState: LoadingState = .idle
    @Published var showCompleted: Bool = true
    @Published var isTrackingActive: Bool = false
    @Published var todayTrips: [Trip] = []
    @Published var weekTrips: Int = 0
    @Published var selectedFilter: TripFilter = .all
    @Published var activeTrip: Trip? = nil
    @Published var currentDistance: Double = 0
    @Published var currentSpeed: Double = 0
    @Published var totalDistance: Double = 0
    @Published var avgTripDuration: TimeInterval = 0

    private var cancellables = Set<AnyCancellable>()
    private var vehicles: [Vehicle] = []

    enum LoadingState {
        case idle, loading, loaded, error
    }

    enum TripFilter: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case completed = "Completed"
        case today = "Today"

        var icon: String {
            switch self {
            case .all: return "list.bullet"
            case .active: return "arrow.right.circle"
            case .completed: return "checkmark.circle"
            case .today: return "calendar"
            }
        }

        var color: Color {
            switch self {
            case .all: return .blue
            case .active: return .green
            case .completed: return .gray
            case .today: return .orange
            }
        }
    }

    override init() {
        super.init()
        loadMockData()
        setupReactiveSearch()
    }

    private func loadMockData() {
        // Initialize with empty data - will be populated from API
        self.vehicles = []
        self.trips = []

        // Calculate stats
        self.todayTrips = trips.filter { Calendar.current.isDateInToday($0.startTime) }
        self.weekTrips = trips.filter {
            Calendar.current.isDate($0.startTime, equalTo: Date(), toGranularity: .weekOfYear)
        }.count
        self.totalDistance = trips.map { $0.distance }.reduce(0, +)
        let completedTrips = trips.filter { $0.status == .completed }
        if !completedTrips.isEmpty {
            self.avgTripDuration = completedTrips.map { $0.duration }.reduce(0, +) / Double(completedTrips.count)
        }

        updateFilteredResults()
    }

    private func setupReactiveSearch() {
        // Setup debounced search (300ms)
        $searchText
            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)

        // Watch filter changes
        $selectedFilter
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)
    }

    private func updateFilteredResults() {
        var results = trips

        // Apply filter
        switch selectedFilter {
        case .all:
            break // No filtering needed
        case .active:
            results = results.filter { $0.status == .inProgress || $0.status == .planned }
        case .completed:
            results = results.filter { $0.status == .completed }
        case .today:
            results = results.filter { Calendar.current.isDateInToday($0.startTime) }
        }

        // Apply search
        if !searchText.isEmpty {
            let lowercasedSearch = searchText.lowercased()
            results = results.filter { trip in
                trip.vehicleNumber.lowercased().contains(lowercasedSearch) ||
                trip.driverName.lowercased().contains(lowercasedSearch) ||
                (trip.endLocation?.address.lowercased().contains(lowercasedSearch) ?? false) ||
                (trip.purpose?.lowercased().contains(lowercasedSearch) ?? false)
            }
        }

        // Sort by start time (most recent first)
        results.sort { $0.startTime > $1.startTime }

        filteredTrips = results
    }

    func applyFilter(_ filter: Any) {
        if let tripFilter = filter as? TripFilter {
            selectedFilter = tripFilter
        }
    }

    func startTracking() {}
    func stopTracking() {}
    func stopCurrentTrip() {}
    func startNewTrip(vehicleId: String) {}
    func applyDateRange(_ range: Any) {}

    func refresh() async {
        loadingState = .loading
        try? await Task.sleep(nanoseconds: 500_000_000)
        loadMockData()
        loadingState = .loaded
    }
}

// MARK: - Enhanced Maintenance ViewModel
@MainActor
final class EnhancedMaintenanceViewModel: SimpleBaseViewModel {
    @Published var maintenanceRecords: [MaintenanceRecord] = []
    @Published var filteredRecords: [MaintenanceRecord] = []
    @Published var vehicles: [Vehicle] = []
    @Published var searchText: String = ""
    @Published var loadingState: LoadingState = .idle
    @Published var selectedFilter: MaintenanceFilter = .all

    private var cancellables = Set<AnyCancellable>()

    var overdueCount: Int {
        maintenanceRecords.filter { $0.status == .overdue }.count
    }

    var scheduledCount: Int {
        maintenanceRecords.filter { $0.status == .scheduled }.count
    }

    var completedCount: Int {
        maintenanceRecords.filter { $0.status == .completed }.count
    }

    var delayedCount: Int {
        maintenanceRecords.filter { record in
            record.scheduledDate < Date() && record.status != .completed
        }.count
    }

    var completedThisMonth: Int {
        let calendar = Calendar.current
        let now = Date()
        return maintenanceRecords.filter { record in
            guard let completedDate = record.completedDate else { return false }
            return calendar.isDate(completedDate, equalTo: now, toGranularity: .month) &&
                   record.status == .completed
        }.count
    }

    var totalCostThisMonth: Double {
        let calendar = Calendar.current
        let now = Date()
        return maintenanceRecords.filter { record in
            guard let completedDate = record.completedDate else { return false }
            return calendar.isDate(completedDate, equalTo: now, toGranularity: .month) &&
                   record.status == .completed
        }.map { $0.cost }.reduce(0, +)
    }

    enum LoadingState {
        case idle, loading, loaded, error
    }

    enum MaintenanceFilter: String, CaseIterable {
        case all = "All"
        case pending = "Pending"
        case completed = "Completed"
        case overdue = "Overdue"

        var icon: String {
            switch self {
            case .all: return "list.bullet"
            case .pending: return "clock"
            case .completed: return "checkmark.circle"
            case .overdue: return "exclamationmark.triangle"
            }
        }

        var color: Color {
            switch self {
            case .all: return .blue
            case .pending: return .orange
            case .completed: return .green
            case .overdue: return .red
            }
        }
    }

    override init() {
        super.init()
        loadMockData()
        setupReactiveSearch()
    }

    private func loadMockData() {
        // Initialize with empty data - will be populated from API
        self.vehicles = []
        self.maintenanceRecords = []
        updateFilteredResults()
    }

    private func setupReactiveSearch() {
        // Setup debounced search (300ms)
        $searchText
            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)

        // Watch filter changes
        $selectedFilter
            .sink { [weak self] _ in
                self?.updateFilteredResults()
            }
            .store(in: &cancellables)
    }

    private func updateFilteredResults() {
        var results = maintenanceRecords

        // Apply filter
        switch selectedFilter {
        case .all:
            break // No filtering needed
        case .pending:
            results = results.filter { $0.status == .scheduled || $0.status == .inProgress }
        case .completed:
            results = results.filter { $0.status == .completed }
        case .overdue:
            results = results.filter { $0.status == .overdue }
        }

        // Apply search
        if !searchText.isEmpty {
            let lowercasedSearch = searchText.lowercased()
            results = results.filter { record in
                record.vehicleNumber.lowercased().contains(lowercasedSearch) ||
                record.type.lowercased().contains(lowercasedSearch) ||
                record.provider.lowercased().contains(lowercasedSearch)
            }
        }

        // Sort by scheduled date (most urgent first)
        results.sort { $0.scheduledDate < $1.scheduledDate }

        filteredRecords = results
    }

    func applyFilter(_ filter: Any) {
        if let maintenanceFilter = filter as? MaintenanceFilter {
            selectedFilter = maintenanceFilter
        }
    }

    func refresh() async {
        loadingState = .loading
        try? await Task.sleep(nanoseconds: 500_000_000)
        loadMockData()
        loadingState = .loaded
    }

    func scheduleNewMaintenance(vehicleId: String, type: String, date: Date) {}
    func rescheduleMaintenance(_ record: MaintenanceRecord, newDate: Date) {}
    func markAsCompleted(_ record: MaintenanceRecord) {}
    func cancelMaintenance(_ record: MaintenanceRecord) {}
}
