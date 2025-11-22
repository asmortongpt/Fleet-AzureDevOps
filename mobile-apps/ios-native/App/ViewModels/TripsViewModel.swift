//
//  TripsViewModel.swift
//  Fleet Manager
//
//  ViewModel for Trips view with history, filtering - Simplified for model alignment
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class TripsViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var trips: [Trip] = []
    @Published var filteredTrips: [Trip] = []
    @Published var selectedTrip: Trip?
    @Published var selectedFilter: TripFilter = .all
    @Published var selectedDateRange: DateRange = DateRange(
        start: Date().addingTimeInterval(-30 * 24 * 3600),
        end: Date()
    )

    // Statistics
    @Published var todayTrips: Int = 0
    @Published var weekTrips: Int = 0
    @Published var totalDistance: Double = 0
    @Published var avgTripDuration: TimeInterval = 0

    // Active Trip
    @Published var isTrackingActive: Bool = false
    @Published var activeTrip: Trip?
    @Published var currentSpeed: Double = 0
    @Published var currentDistance: Double = 0

    // MARK: - Private Properties
    private var allTrips: [Trip] = []
    private var vehicles: [Vehicle] = []

    // MARK: - Filter Options
    enum TripFilter: String, CaseIterable {
        case all = "All"
        case today = "Today"
        case week = "This Week"
        case month = "This Month"
        case inProgress = "In Progress"
        case completed = "Completed"

        var icon: String {
            switch self {
            case .all: return "list.bullet"
            case .today: return "calendar"
            case .week: return "calendar.badge.clock"
            case .month: return "calendar.circle"
            case .inProgress: return "location.fill"
            case .completed: return "checkmark.circle"
            }
        }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        setupSearchDebouncer()
        loadTrips()
    }

    // MARK: - Data Loading
    private func loadTrips() {
        Task {
            await loadTripData()
        }
    }

    @MainActor
    private func loadTripData() async {
        startLoading()

        // Simulate network delay
        await Task.sleep(200_000_000) // 0.2 seconds

        // Initialize with empty data - will be populated from API
        vehicles = []
        allTrips = []
        trips = allTrips

        // Update statistics
        updateStatistics()

        // Apply current filter
        applyFilter(selectedFilter)

        finishLoading()
    }

    private func updateStatistics() {
        let calendar = Calendar.current
        let now = Date()
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now

        todayTrips = allTrips.filter { calendar.isDate($0.startTime, inSameDayAs: now) }.count
        weekTrips = allTrips.filter { $0.startTime >= startOfWeek }.count
        totalDistance = allTrips.map { $0.totalDistance }.reduce(0, +)

        let totalDuration = allTrips.map { $0.duration }.reduce(0, +)
        avgTripDuration = allTrips.isEmpty ? 0 : totalDuration / Double(allTrips.count)
    }

    // MARK: - Search
    override func performSearch() {
        filterTrips()
    }

    private func setupSearchDebouncer() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.filterTrips()
            }
            .store(in: &cancellables)
    }

    // MARK: - Filtering
    func applyFilter(_ filter: TripFilter) {
        selectedFilter = filter
        filterTrips()
    }

    func applyDateRange(_ range: DateRange) {
        selectedDateRange = range
        filterTrips()
    }

    private func filterTrips() {
        var result = allTrips

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { trip in
                trip.name.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Apply status/date filter
        let calendar = Calendar.current
        let now = Date()

        switch selectedFilter {
        case .all:
            break
        case .today:
            result = result.filter { calendar.isDate($0.startTime, inSameDayAs: now) }
        case .week:
            let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now
            result = result.filter { $0.startTime >= startOfWeek }
        case .month:
            let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
            result = result.filter { $0.startTime >= startOfMonth }
        case .inProgress:
            result = result.filter { $0.status == .inProgress || $0.status == .active }
        case .completed:
            result = result.filter { $0.status == .completed }
        }

        // Apply date range filter
        result = result.filter { trip in
            trip.startTime >= selectedDateRange.start &&
            trip.startTime <= selectedDateRange.end
        }

        // Sort by start time (newest first)
        result.sort { $0.startTime > $1.startTime }

        // Update filtered trips with animation
        withAnimation(.easeInOut(duration: 0.2)) {
            filteredTrips = result
        }
    }

    // MARK: - Trip Tracking (Simplified)
    func startNewTrip(vehicleId: String) {
        guard !isTrackingActive else { return }

        let newTrip = TripModels.Trip(
            name: "New Trip",
            startTime: Date(),
            status: .active
        )

        activeTrip = newTrip
        isTrackingActive = true
        currentDistance = 0
        currentSpeed = 0

        // Add to trips list
        allTrips.insert(newTrip, at: 0)
        filterTrips()
    }

    func stopCurrentTrip() {
        guard isTrackingActive, var trip = activeTrip else { return }

        // Mark as completed
        if let index = allTrips.firstIndex(where: { $0.id == trip.id }) {
            var updatedTrip = allTrips[index]
            updatedTrip.status = .completed
            updatedTrip.endTime = Date()
            allTrips[index] = updatedTrip
        }

        // Stop tracking
        isTrackingActive = false
        activeTrip = nil

        // Update UI
        filterTrips()
        updateStatistics()
    }

    // MARK: - Refresh
    override func refresh() async {
        startRefreshing()
        await loadTripData()
        finishRefreshing()
    }

    // MARK: - Trip Actions
    func viewTripDetails(_ trip: Trip) {
        selectedTrip = trip
    }

    func exportTripReport() {
        print("Exporting trip report...")
        // Would export to CSV/PDF
    }

    func getTripsByVehicle(_ vehicleId: String) -> [Trip] {
        allTrips.filter { $0.vehicleId == vehicleId }
    }

    func getTripsByDriver(_ driverId: String) -> [Trip] {
        allTrips.filter { $0.driverId == driverId }
    }
}
