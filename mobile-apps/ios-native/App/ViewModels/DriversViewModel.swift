//
//  DriversViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for managing drivers, performance tracking, and vehicle assignments
//  Inherits from RefreshableViewModel for search, pagination, and caching
//

import Foundation
import Combine
import SwiftUI

@MainActor
class DriversViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var drivers: [Driver] = []
    @Published var filteredDrivers: [Driver] = []
    @Published var selectedDriver: Driver?
    @Published var selectedFilter: DriverFilter = .all
    @Published var selectedSortOption: SortOption = .name
    @Published var showingAddDriver = false
    @Published var showingEditDriver = false
    @Published var showingDriverDetail = false

    // Performance tracking
    @Published var performanceData: [String: PerformanceMetrics] = [:] // Driver ID -> Metrics

    // License tracking
    @Published var expiringLicenses: [Driver] = []
    @Published var expiredLicenses: [Driver] = []

    // Vehicle assignments
    @Published var driverVehicleMap: [String: [String]] = [:] // Driver ID -> Vehicle IDs

    // Statistics
    @Published var totalDrivers: Int = 0
    @Published var activeDrivers: Int = 0
    @Published var averageSafetyScore: Double = 0.0
    @Published var driversWithIncidents: Int = 0

    // MARK: - Dependencies
    private let apiConfig: APIConfiguration
    private var cacheKey = "drivers_cache"

    // MARK: - Initialization
    override init() {
        self.apiConfig = APIConfiguration.shared
        super.init()
        loadCachedData()
    }

    // MARK: - Data Loading

    /// Load drivers from API
    func loadDrivers() async {
        startLoading()

        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/drivers")!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.invalidResponse
            }

            guard httpResponse.statusCode == 200 else {
                throw NetworkError.statusCode(httpResponse.statusCode)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let driversResponse = try decoder.decode(DriversResponse.self, from: data)

            await MainActor.run {
                self.drivers = driversResponse.drivers
                self.totalDrivers = driversResponse.total
                self.updateStatistics()
                self.checkLicenseExpirations()
                self.applyFiltersAndSort()
                self.cacheDrivers()
                self.finishLoading()
            }

        } catch {
            await MainActor.run {
                self.handleError(error)
            }
        }
    }

    /// Load single driver by ID
    func loadDriver(id: String) async -> Driver? {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/drivers/\(id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (data, _) = try await URLSession.shared.data(for: request)

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let driverResponse = try decoder.decode(DriverResponse.self, from: data)

            return driverResponse.driver

        } catch {
            print("Error loading driver: \(error)")
            return nil
        }
    }

    /// Refresh data from API
    override func refresh() async {
        startRefreshing()
        await loadDrivers()
        finishRefreshing()
    }

    // MARK: - CRUD Operations

    /// Add new driver
    func addDriver(_ driver: Driver) async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/drivers")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(driver)

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 201 || httpResponse.statusCode == 200 else {
                return false
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let driverResponse = try decoder.decode(DriverResponse.self, from: data)

            await MainActor.run {
                self.drivers.append(driverResponse.driver)
                self.updateStatistics()
                self.applyFiltersAndSort()
                self.cacheDrivers()
            }

            return true

        } catch {
            print("Error adding driver: \(error)")
            return false
        }
    }

    /// Update existing driver
    func updateDriver(_ driver: Driver) async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/drivers/\(driver.id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(driver)

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return false
            }

            await MainActor.run {
                if let index = self.drivers.firstIndex(where: { $0.id == driver.id }) {
                    self.drivers[index] = driver
                }
                self.updateStatistics()
                self.checkLicenseExpirations()
                self.applyFiltersAndSort()
                self.cacheDrivers()
            }

            return true

        } catch {
            print("Error updating driver: \(error)")
            return false
        }
    }

    /// Delete driver
    func deleteDriver(_ driver: Driver) async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/drivers/\(driver.id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 || httpResponse.statusCode == 204 else {
                return false
            }

            await MainActor.run {
                self.drivers.removeAll { $0.id == driver.id }
                self.updateStatistics()
                self.applyFiltersAndSort()
                self.cacheDrivers()
            }

            return true

        } catch {
            print("Error deleting driver: \(error)")
            return false
        }
    }

    // MARK: - Vehicle Assignment

    /// Assign vehicle to driver
    func assignVehicle(vehicleId: String, to driver: Driver) async -> Bool {
        var updatedDriver = driver
        if !updatedDriver.assignedVehicles.contains(vehicleId) {
            updatedDriver.assignedVehicles.append(vehicleId)
        }
        return await updateDriver(updatedDriver)
    }

    /// Unassign vehicle from driver
    func unassignVehicle(vehicleId: String, from driver: Driver) async -> Bool {
        var updatedDriver = driver
        updatedDriver.assignedVehicles.removeAll { $0 == vehicleId }
        return await updateDriver(updatedDriver)
    }

    /// Get drivers for specific vehicle
    func getDriversForVehicle(vehicleId: String) -> [Driver] {
        drivers.filter { $0.assignedVehicles.contains(vehicleId) }
    }

    // MARK: - Performance Tracking

    /// Update performance metrics for driver
    func updatePerformanceMetrics(for driverId: String, metrics: PerformanceMetrics) {
        performanceData[driverId] = metrics

        if let index = drivers.firstIndex(where: { $0.id == driverId }) {
            drivers[index].performanceMetrics = metrics
        }

        updateStatistics()
    }

    /// Calculate average safety score
    private func calculateAverageSafetyScore() -> Double {
        guard !drivers.isEmpty else { return 0.0 }
        let totalScore = drivers.reduce(0.0) { $0 + $1.performanceMetrics.safetyScore }
        return totalScore / Double(drivers.count)
    }

    /// Get top performing drivers
    func getTopPerformers(limit: Int = 5) -> [Driver] {
        drivers
            .sorted { $0.performanceMetrics.safetyScore > $1.performanceMetrics.safetyScore }
            .prefix(limit)
            .map { $0 }
    }

    // MARK: - License Management

    /// Check for expiring and expired licenses
    private func checkLicenseExpirations() {
        expiringLicenses = drivers.filter { $0.isLicenseExpiring }
        expiredLicenses = drivers.filter { $0.isLicenseExpired }
    }

    /// Get drivers with license issues
    func getDriversWithLicenseIssues() -> [Driver] {
        drivers.filter { $0.isLicenseExpiring || $0.isLicenseExpired }
    }

    // MARK: - Filtering & Sorting

    /// Apply current filters and sort
    func applyFiltersAndSort() {
        var result = drivers

        // Apply filter
        switch selectedFilter {
        case .all:
            break
        case .active:
            result = result.filter { $0.status == .active }
        case .inactive:
            result = result.filter { $0.status == .inactive }
        case .onLeave:
            result = result.filter { $0.status == .onLeave }
        case .licenseExpiring:
            result = result.filter { $0.isLicenseExpiring }
        case .licenseExpired:
            result = result.filter { $0.isLicenseExpired }
        case .withIncidents:
            result = result.filter { $0.performanceMetrics.hasIncidents }
        }

        // Apply search
        if !searchText.isEmpty {
            result = result.filter { driver in
                driver.fullName.localizedCaseInsensitiveContains(searchText) ||
                driver.employeeId.localizedCaseInsensitiveContains(searchText) ||
                driver.email.localizedCaseInsensitiveContains(searchText) ||
                driver.department.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Apply sort
        switch selectedSortOption {
        case .name:
            result.sort { $0.fullName < $1.fullName }
        case .performance:
            result.sort { $0.performanceMetrics.safetyScore > $1.performanceMetrics.safetyScore }
        case .trips:
            result.sort { $0.performanceMetrics.totalTrips > $1.performanceMetrics.totalTrips }
        case .hireDate:
            result.sort { $0.hireDate > $1.hireDate }
        case .status:
            result.sort { $0.status.displayName < $1.status.displayName }
        }

        filteredDrivers = result
    }

    override func performSearch() {
        applyFiltersAndSort()
    }

    // MARK: - Statistics

    /// Update all statistics
    private func updateStatistics() {
        totalDrivers = drivers.count
        activeDrivers = drivers.filter { $0.status == .active }.count
        averageSafetyScore = calculateAverageSafetyScore()
        driversWithIncidents = drivers.filter { $0.performanceMetrics.hasIncidents }.count
    }

    // MARK: - Caching

    /// Cache drivers to local storage
    private func cacheDrivers() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(drivers)
            UserDefaults.standard.set(data, forKey: cacheKey)
        } catch {
            print("Failed to cache drivers: \(error)")
        }
    }

    /// Load cached drivers
    private func loadCachedData() {
        guard let data = UserDefaults.standard.data(forKey: cacheKey) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            drivers = try decoder.decode([Driver].self, from: data)
            updateStatistics()
            checkLicenseExpirations()
            applyFiltersAndSort()
        } catch {
            print("Failed to load cached drivers: \(error)")
        }
    }

    /// Clear cache
    func clearCache() {
        UserDefaults.standard.removeObject(forKey: cacheKey)
        super.clearCache()
    }
}

// MARK: - Filter Options
enum DriverFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
    case inactive = "Inactive"
    case onLeave = "On Leave"
    case licenseExpiring = "License Expiring"
    case licenseExpired = "License Expired"
    case withIncidents = "With Incidents"

    var icon: String {
        switch self {
        case .all: return "person.3.fill"
        case .active: return "checkmark.circle.fill"
        case .inactive: return "pause.circle.fill"
        case .onLeave: return "calendar.badge.clock"
        case .licenseExpiring: return "exclamationmark.triangle.fill"
        case .licenseExpired: return "xmark.octagon.fill"
        case .withIncidents: return "exclamationmark.shield.fill"
        }
    }
}

// MARK: - Sort Options
enum SortOption: String, CaseIterable {
    case name = "Name"
    case performance = "Performance"
    case trips = "Total Trips"
    case hireDate = "Hire Date"
    case status = "Status"

    var icon: String {
        switch self {
        case .name: return "textformat"
        case .performance: return "chart.bar.fill"
        case .trips: return "car.fill"
        case .hireDate: return "calendar"
        case .status: return "tag.fill"
        }
    }
}

// MARK: - Network Error
enum NetworkError: Error {
    case invalidResponse
    case statusCode(Int)
    case decodingError
}
