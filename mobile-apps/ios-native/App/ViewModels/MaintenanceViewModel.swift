//
//  MaintenanceViewModel.swift
//  Fleet Manager
//
//  ViewModel for Maintenance view with scheduling and service history
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class MaintenanceViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var maintenanceRecords: [MaintenanceRecord] = []
    @Published var filteredRecords: [MaintenanceRecord] = []
    @Published var selectedRecord: MaintenanceRecord?
    @Published var selectedFilter: MaintenanceFilter = .all

    // Statistics
    @Published var overdueCount: Int = 0
    @Published var scheduledCount: Int = 0
    @Published var completedThisMonth: Int = 0
    @Published var totalCostThisMonth: Double = 0

    // Vehicles for scheduling
    @Published var vehicles: [Vehicle] = []

    // MARK: - Private Properties
    private let mockData = MockDataGenerator.shared
    private var allRecords: [MaintenanceRecord] = []

    // MARK: - Filter Options
    enum MaintenanceFilter: String, CaseIterable {
        case all = "All"
        case overdue = "Overdue"
        case scheduled = "Scheduled"
        case completed = "Completed"
        case thisMonth = "This Month"
        case thisWeek = "This Week"

        var icon: String {
            switch self {
            case .all: return "list.bullet"
            case .overdue: return "exclamationmark.triangle"
            case .scheduled: return "calendar"
            case .completed: return "checkmark.circle"
            case .thisMonth: return "calendar.badge.clock"
            case .thisWeek: return "calendar.day.timeline.left"
            }
        }

        var color: Color {
            switch self {
            case .all: return .gray
            case .overdue: return .red
            case .scheduled: return .blue
            case .completed: return .green
            case .thisMonth: return .purple
            case .thisWeek: return .orange
            }
        }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        setupSearchDebouncer()
        loadMaintenanceData()
    }

    // MARK: - Data Loading
    private func loadMaintenanceData() {
        Task {
            await loadData()
        }
    }

    @MainActor
    private func loadData() async {
        startLoading()

        // Simulate network delay
        await Task.sleep(200_000_000) // 0.2 seconds

        // Generate mock data
        vehicles = mockData.generateVehicles(count: 25)
        allRecords = mockData.generateMaintenanceRecords(count: 30, vehicles: vehicles)
        maintenanceRecords = allRecords

        // Update statistics
        updateStatistics()

        // Apply current filter
        applyFilter(selectedFilter)

        // Cache the data
        cacheMaintenanceData()

        finishLoading()
    }

    private func cacheMaintenanceData() {
        if let data = try? JSONEncoder().encode(allRecords) {
            cacheObject(data as AnyObject, forKey: "maintenance_cache")
        }
    }

    private func updateStatistics() {
        let now = Date()
        let calendar = Calendar.current
        let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now

        overdueCount = allRecords.filter { $0.status == .overdue }.count
        scheduledCount = allRecords.filter { $0.status == .scheduled }.count

        let thisMonthRecords = allRecords.filter { record in
            guard let completedDate = record.completedDate else { return false }
            return completedDate >= startOfMonth
        }

        completedThisMonth = thisMonthRecords.count
        totalCostThisMonth = thisMonthRecords.map { $0.cost }.reduce(0, +)
    }

    // MARK: - Search
    override func performSearch() {
        filterRecords()
    }

    private func setupSearchDebouncer() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.filterRecords()
            }
            .store(in: &cancellables)
    }

    // MARK: - Filtering
    func applyFilter(_ filter: MaintenanceFilter) {
        selectedFilter = filter
        filterRecords()
    }

    private func filterRecords() {
        var result = allRecords

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { record in
                record.vehicleNumber.localizedCaseInsensitiveContains(searchText) ||
                record.type.localizedCaseInsensitiveContains(searchText) ||
                record.provider.localizedCaseInsensitiveContains(searchText) ||
                (record.notes?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Apply status/date filter
        let calendar = Calendar.current
        let now = Date()

        switch selectedFilter {
        case .all:
            break
        case .overdue:
            result = result.filter { $0.status == .overdue }
        case .scheduled:
            result = result.filter { $0.status == .scheduled }
        case .completed:
            result = result.filter { $0.status == .completed }
        case .thisMonth:
            let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
            result = result.filter { $0.scheduledDate >= startOfMonth }
        case .thisWeek:
            let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now
            result = result.filter { $0.scheduledDate >= startOfWeek }
        }

        // Sort by date (urgent first, then by scheduled date)
        result.sort { first, second in
            if first.status == .overdue && second.status != .overdue {
                return true
            } else if first.status != .overdue && second.status == .overdue {
                return false
            } else {
                return first.scheduledDate < second.scheduledDate
            }
        }

        // Update filtered records with animation
        withAnimation(.easeInOut(duration: 0.2)) {
            filteredRecords = result
        }
    }

    // MARK: - Refresh
    override func refresh() async {
        startRefreshing()
        await loadData()
        finishRefreshing()
    }

    // MARK: - Maintenance Actions
    func scheduleNewMaintenance(vehicleId: String, type: String, date: Date) {
        guard let vehicle = vehicles.first(where: { $0.id == vehicleId }) else { return }

        let newRecord = MaintenanceRecord(
            id: UUID().uuidString,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.number,
            type: type,
            scheduledDate: date,
            completedDate: nil,
            mileageAtService: vehicle.mileage,
            cost: 0,
            provider: "To be determined",
            notes: "Scheduled maintenance",
            status: .scheduled,
            parts: [],
            laborHours: 0,
            warranty: false,
            nextServiceDue: date.addingTimeInterval(90 * 24 * 3600)
        )

        allRecords.insert(newRecord, at: 0)
        filterRecords()
        updateStatistics()
    }

    func markAsCompleted(_ record: MaintenanceRecord) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else { return }

        var updatedRecord = record
        updatedRecord = MaintenanceRecord(
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleNumber: record.vehicleNumber,
            type: record.type,
            scheduledDate: record.scheduledDate,
            completedDate: Date(),
            mileageAtService: record.mileageAtService,
            cost: record.cost,
            provider: record.provider,
            notes: "Service completed",
            status: .completed,
            parts: record.parts,
            laborHours: record.laborHours,
            warranty: record.warranty,
            nextServiceDue: record.nextServiceDue
        )

        allRecords[index] = updatedRecord
        filterRecords()
        updateStatistics()
    }

    func cancelMaintenance(_ record: MaintenanceRecord) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else { return }

        var updatedRecord = record
        updatedRecord = MaintenanceRecord(
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleNumber: record.vehicleNumber,
            type: record.type,
            scheduledDate: record.scheduledDate,
            completedDate: nil,
            mileageAtService: record.mileageAtService,
            cost: 0,
            provider: record.provider,
            notes: "Service cancelled",
            status: .cancelled,
            parts: [],
            laborHours: 0,
            warranty: record.warranty,
            nextServiceDue: nil
        )

        allRecords[index] = updatedRecord
        filterRecords()
        updateStatistics()
    }

    func rescheduleMainten ance(_ record: MaintenanceRecord, newDate: Date) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else { return }

        var updatedRecord = record
        updatedRecord = MaintenanceRecord(
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleNumber: record.vehicleNumber,
            type: record.type,
            scheduledDate: newDate,
            completedDate: nil,
            mileageAtService: record.mileageAtService,
            cost: record.cost,
            provider: record.provider,
            notes: "Rescheduled to \(newDate.formatted(date: .abbreviated, time: .omitted))",
            status: newDate < Date() ? .overdue : .scheduled,
            parts: record.parts,
            laborHours: record.laborHours,
            warranty: record.warranty,
            nextServiceDue: record.nextServiceDue
        )

        allRecords[index] = updatedRecord
        filterRecords()
        updateStatistics()
    }

    func getMaintenanceForVehicle(_ vehicleId: String) -> [MaintenanceRecord] {
        allRecords.filter { $0.vehicleId == vehicleId }
    }

    func exportMaintenanceReport() {
        print("Exporting maintenance report...")
        // Would export to CSV/PDF
    }
}