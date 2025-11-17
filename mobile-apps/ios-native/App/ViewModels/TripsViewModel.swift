//
//  TripsViewModel.swift
//  Fleet Manager
//
//  ViewModel for Trips view with history, tracking, and filtering
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
    private let mockData = MockDataGenerator.shared
    private var allTrips: [Trip] = []
    private var vehicles: [Vehicle] = []
    private var trackingTimer: Timer?

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

    deinit {
        trackingTimer?.invalidate()
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

        // Generate mock data
        vehicles = mockData.generateVehicles(count: 25)
        allTrips = mockData.generateTrips(count: 50, vehicles: vehicles)
        trips = allTrips

        // Update statistics
        updateStatistics()

        // Apply current filter
        applyFilter(selectedFilter)

        // Cache the data
        cacheTripData()

        finishLoading()
    }

    private func cacheTripData() {
        if let data = try? JSONEncoder().encode(allTrips) {
            cacheObject(data as AnyObject, forKey: "trips_cache")
        }
    }

    private func updateStatistics() {
        let calendar = Calendar.current
        let now = Date()
        let startOfToday = calendar.startOfDay(for: now)
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now

        todayTrips = allTrips.filter { calendar.isDate($0.startTime, inSameDayAs: now) }.count
        weekTrips = allTrips.filter { $0.startTime >= startOfWeek }.count
        totalDistance = allTrips.map { $0.distance }.reduce(0, +)

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
                trip.vehicleNumber.localizedCaseInsensitiveContains(searchText) ||
                trip.driverName.localizedCaseInsensitiveContains(searchText) ||
                (trip.purpose?.localizedCaseInsensitiveContains(searchText) ?? false)
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
            result = result.filter { $0.status == .inProgress }
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

    // MARK: - Trip Tracking
    func startNewTrip(vehicleId: String) {
        guard !isTrackingActive else { return }

        let vehicle = vehicles.first { $0.id == vehicleId } ?? vehicles.first!
        let newTrip = Trip(
            id: UUID().uuidString,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.number,
            driverId: "current_user",
            driverName: "Current User",
            startTime: Date(),
            endTime: nil,
            startLocation: vehicle.location,
            endLocation: nil,
            distance: 0,
            duration: 0,
            averageSpeed: 0,
            maxSpeed: 0,
            fuelUsed: 0,
            status: .inProgress,
            purpose: nil,
            route: [],
            events: [],
            notes: nil
        )

        activeTrip = newTrip
        isTrackingActive = true
        currentDistance = 0
        currentSpeed = 0

        // Start tracking timer
        startTrackingTimer()

        // Add to trips list
        allTrips.insert(newTrip, at: 0)
        filterTrips()
    }

    func stopCurrentTrip() {
        guard isTrackingActive, var trip = activeTrip else { return }

        // Update trip with final data
        let endTime = Date()
        let duration = endTime.timeIntervalSince(trip.startTime)

        trip = Trip(
            id: trip.id,
            vehicleId: trip.vehicleId,
            vehicleNumber: trip.vehicleNumber,
            driverId: trip.driverId,
            driverName: trip.driverName,
            startTime: trip.startTime,
            endTime: endTime,
            startLocation: trip.startLocation,
            endLocation: trip.startLocation, // Would use actual GPS location
            distance: currentDistance,
            duration: duration,
            averageSpeed: currentDistance / (duration / 3600),
            maxSpeed: Double.random(in: 45...75),
            fuelUsed: currentDistance * 0.08,
            status: .completed,
            purpose: trip.purpose,
            route: trip.route,
            events: trip.events,
            notes: "Trip completed successfully"
        )

        // Update in the list
        if let index = allTrips.firstIndex(where: { $0.id == trip.id }) {
            allTrips[index] = trip
        }

        // Stop tracking
        isTrackingActive = false
        activeTrip = nil
        trackingTimer?.invalidate()
        trackingTimer = nil

        // Update UI
        filterTrips()
        updateStatistics()
    }

    private func startTrackingTimer() {
        trackingTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            Task { @MainActor in
                self.updateTrackingData()
            }
        }
    }

    @MainActor
    private func updateTrackingData() {
        guard isTrackingActive else { return }

        // Simulate GPS updates
        currentSpeed = Double.random(in: 25...65)
        currentDistance += (currentSpeed / 3600) // Add distance based on speed

        // Update active trip distance
        if var trip = activeTrip,
           let index = allTrips.firstIndex(where: { $0.id == trip.id }) {
            trip = Trip(
                id: trip.id,
                vehicleId: trip.vehicleId,
                vehicleNumber: trip.vehicleNumber,
                driverId: trip.driverId,
                driverName: trip.driverName,
                startTime: trip.startTime,
                endTime: nil,
                startLocation: trip.startLocation,
                endLocation: nil,
                distance: currentDistance,
                duration: Date().timeIntervalSince(trip.startTime),
                averageSpeed: currentDistance / (Date().timeIntervalSince(trip.startTime) / 3600),
                maxSpeed: max(trip.maxSpeed, currentSpeed),
                fuelUsed: currentDistance * 0.08,
                status: .inProgress,
                purpose: trip.purpose,
                route: trip.route,
                events: trip.events,
                notes: nil
            )
            allTrips[index] = trip
            activeTrip = trip
        }
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