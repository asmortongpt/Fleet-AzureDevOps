//
//  MaintenanceViewModel.swift
//  Fleet Manager
//
//  ViewModel for Maintenance view - Simplified version for model alignment
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class MaintenanceViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var records: [MaintenanceRecord] = []
    @Published var filteredRecords: [MaintenanceRecord] = []
    @Published var selectedRecord: MaintenanceRecord?
    @Published var selectedFilter: MaintenanceFilter = .all

    // Statistics
    @Published var scheduledCount: Int = 0
    @Published var inProgressCount: Int = 0
    @Published var completedCount: Int = 0
    @Published var overdueCount: Int = 0

    // MARK: - Private Properties
    private var allRecords: [MaintenanceRecord] = []

    // MARK: - Filter Options
    enum MaintenanceFilter: String, CaseIterable {
        case all = "All"
        case scheduled = "Scheduled"
        case inProgress = "In Progress"
        case completed = "Completed"
        case overdue = "Overdue"
    }

    // MARK: - Lifecycle
    override init() {
        super.init()
        loadMaintenanceRecords()
    }

    // MARK: - Data Loading
    func loadMaintenanceRecords() {
        loadingState = .loading

        Task {
            do {
                try await Task.sleep(nanoseconds: 500_000_000) // Simulate API call

                // Initialize with empty data - will be populated from API
                allRecords = []
                records = []
                applyFilters()
                updateStatistics()

                loadingState = .loaded
            } catch {
                loadingState = .error(error.localizedDescription)
            }
        }
    }

    override func refresh() async {
        loadMaintenanceRecords()
    }

    // MARK: - Filtering
    func applyFilters() {
        var filtered = allRecords

        // Filter by status
        switch selectedFilter {
        case .all:
            break
        case .scheduled:
            filtered = filtered.filter { $0.status == .scheduled }
        case .inProgress:
            filtered = filtered.filter { $0.status == .inProgress }
        case .completed:
            filtered = filtered.filter { $0.status == .completed }
        case .overdue:
            filtered = filtered.filter { $0.status == .overdue || $0.isOverdue }
        }

        // Apply search filter
        if !searchText.isEmpty {
            filtered = filtered.filter { record in
                record.description.localizedCaseInsensitiveContains(searchText) ||
                record.type.rawValue.localizedCaseInsensitiveContains(searchText) ||
                (record.vehicleNumber?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        filteredRecords = filtered.sorted { $0.scheduledDate > $1.scheduledDate }
    }

    // MARK: - Statistics
    private func updateStatistics() {
        scheduledCount = allRecords.filter { $0.status == .scheduled }.count
        inProgressCount = allRecords.filter { $0.status == .inProgress }.count
        completedCount = allRecords.filter { $0.status == .completed }.count
        overdueCount = allRecords.filter { $0.status == .overdue || $0.isOverdue }.count
    }

    // MARK: - Actions
    func selectFilter(_ filter: MaintenanceFilter) {
        selectedFilter = filter
        applyFilters()
    }

    func scheduleMaintenance(for vehicleId: String, type: MaintenanceType, date: Date, description: String) {
        let record = MaintenanceRecord(
            vehicleId: vehicleId,
            type: type,
            category: .other,
            scheduledDate: date,
            description: description
        )

        allRecords.insert(record, at: 0)
        applyFilters()
        updateStatistics()
    }

    func updateRecordStatus(_ record: MaintenanceRecord, to status: MaintenanceStatus) {
        if let index = allRecords.firstIndex(where: { $0.id == record.id }) {
            var updated = allRecords[index]
            updated.status = status
            if status == .completed {
                updated.completedDate = Date()
            }
            allRecords[index] = updated
            applyFilters()
            updateStatistics()
        }
    }

    func rescheduleMaintenance(_ record: MaintenanceRecord, to date: Date) {
        if let index = allRecords.firstIndex(where: { $0.id == record.id }) {
            var updated = allRecords[index]
            updated.scheduledDate = date
            allRecords[index] = updated
            applyFilters()
        }
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

    func rescheduleMaintenance(_ record: MaintenanceRecord, newDate: Date) {
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