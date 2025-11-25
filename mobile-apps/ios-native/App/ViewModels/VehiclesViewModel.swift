//
//  VehiclesViewModel.swift
//  Fleet Manager
//
//  ViewModel for Vehicles view with search, filtering, and real-time updates
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class VehiclesViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var vehicles: [Vehicle] = []
    @Published var filteredVehicles: [Vehicle] = []
    @Published var selectedFilter: VehicleFilter = .all
    @Published var selectedSortOption: VehicleSortOption = .number
    @Published var selectedVehicle: Vehicle?

    // Statistics
    @Published var activeCount: Int = 0
    @Published var maintenanceCount: Int = 0
    @Published var offlineCount: Int = 0

    // MARK: - Private Properties
    private let mockData = MockDataGenerator.shared
    private var allVehicles: [Vehicle] = []

    // MARK: - Filter Options
    enum VehicleFilter: String, CaseIterable {
        case all = "All"
        case active = "Active"
        case inactive = "Inactive"
        case maintenance = "Maintenance"
        case moving = "Moving"
        case alerts = "Has Alerts"

        var icon: String {
            switch self {
            case .all: return "car.2"
            case .active: return "checkmark.circle"
            case .inactive: return "pause.circle"
            case .maintenance: return "wrench"
            case .moving: return "location.fill"
            case .alerts: return "exclamationmark.triangle"
            }
        }
    }

    enum VehicleSortOption: String, CaseIterable {
        case number = "Number"
        case status = "Status"
        case mileage = "Mileage"
        case fuel = "Fuel Level"
        case department = "Department"

        var icon: String {
            switch self {
            case .number: return "number"
            case .status: return "circle.fill"
            case .mileage: return "speedometer"
            case .fuel: return "fuelpump"
            case .department: return "building.2"
            }
        }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        loadVehicles()
    }

    // MARK: - Data Loading
    private func loadVehicles() {
        Task {
            await loadVehicleData()
        }
    }

    @MainActor
    private func loadVehicleData() async {
        startLoading()

        // Simulate network delay
        await Task.sleep(200_000_000) // 0.2 seconds

        // Generate mock vehicles
        allVehicles = mockData.generateVehicles(count: 25)
        vehicles = allVehicles

        // Update statistics
        updateStatistics()

        // Apply current filter and sort
        applyFilterAndSort()

        // Cache the data
        cacheVehicleData()

        finishLoading()
    }

    private func cacheVehicleData() {
        if let data = try? JSONEncoder().encode(allVehicles) {
            cacheObject(data as AnyObject, forKey: "vehicles_cache")
        }
    }

    private func updateStatistics() {
        activeCount = allVehicles.filter { $0.status == .active || $0.status == .moving }.count
        maintenanceCount = allVehicles.filter { $0.status == .maintenance }.count
        offlineCount = allVehicles.filter { $0.status == .offline }.count
    }

    // MARK: - Search
    override func performSearch() {
        applyFilterAndSort()
    }


    // MARK: - Filtering and Sorting
    func applyFilter(_ filter: VehicleFilter) {
        selectedFilter = filter
        applyFilterAndSort()
    }

    func applySortOption(_ option: VehicleSortOption) {
        selectedSortOption = option
        applyFilterAndSort()
    }

    private func applyFilterAndSort() {
        // Start with all vehicles
        var result = allVehicles

        // Apply search filter
        if !searchText.isEmpty {
            result = result.filter { vehicle in
                vehicle.number.localizedCaseInsensitiveContains(searchText) ||
                vehicle.make.localizedCaseInsensitiveContains(searchText) ||
                vehicle.model.localizedCaseInsensitiveContains(searchText) ||
                vehicle.licensePlate.localizedCaseInsensitiveContains(searchText) ||
                vehicle.department.localizedCaseInsensitiveContains(searchText) ||
                (vehicle.assignedDriver?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Apply status filter
        switch selectedFilter {
        case .all:
            break
        case .active:
            result = result.filter { $0.status == .active || $0.status == .parked }
        case .inactive:
            result = result.filter { $0.status == .inactive }
        case .maintenance:
            result = result.filter { $0.status == .maintenance }
        case .moving:
            result = result.filter { $0.status == .moving }
        case .alerts:
            result = result.filter { !$0.alerts.isEmpty }
        }

        // Apply sorting
        switch selectedSortOption {
        case .number:
            result.sort { $0.number < $1.number }
        case .status:
            result.sort { $0.status.rawValue < $1.status.rawValue }
        case .mileage:
            result.sort { $0.mileage > $1.mileage }
        case .fuel:
            result.sort { $0.fuelLevel < $1.fuelLevel }
        case .department:
            result.sort { $0.department < $1.department }
        }

        // Update filtered vehicles with animation
        withAnimation(.easeInOut(duration: 0.2)) {
            filteredVehicles = result
        }
    }

    // MARK: - Refresh
    override func refresh() async {
        startRefreshing()
        await loadVehicleData()
        finishRefreshing()
    }

    // MARK: - Vehicle Actions
    func toggleVehicleStatus(_ vehicle: Vehicle) {
        guard let index = allVehicles.firstIndex(where: { $0.id == vehicle.id }) else { return }

        // Toggle between active and inactive
        let newStatus: VehicleStatus = vehicle.status == .active ? .inactive : .active

        var updatedVehicle = vehicle
        updatedVehicle = Vehicle(
            id: vehicle.id,
            tenantId: vehicle.tenantId,
            number: vehicle.number,
            type: vehicle.type,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
            licensePlate: vehicle.licensePlate,
            status: newStatus,
            location: vehicle.location,
            region: vehicle.region,
            department: vehicle.department,
            fuelLevel: vehicle.fuelLevel,
            fuelType: vehicle.fuelType,
            mileage: vehicle.mileage,
            hoursUsed: vehicle.hoursUsed,
            assignedDriver: vehicle.assignedDriver,
            ownership: vehicle.ownership,
            lastService: vehicle.lastService,
            nextService: vehicle.nextService,
            alerts: vehicle.alerts,
            customFields: vehicle.customFields,
            tags: vehicle.tags
        )

        allVehicles[index] = updatedVehicle
        updateStatistics()
        applyFilterAndSort()
    }

    func scheduleMaintenanceForVehicle(_ vehicle: Vehicle) {
        print("Scheduling maintenance for vehicle: \(vehicle.number)")
        // Would navigate to maintenance scheduling
    }

    func viewVehicleDetails(_ vehicle: Vehicle) {
        selectedVehicle = vehicle
    }

    // MARK: - Bulk Actions
    func exportVehicleList() {
        print("Exporting vehicle list...")
        // Would export to CSV/Excel
    }

    func importVehicles() {
        print("Importing vehicles...")
        // Would show import interface
    }
}