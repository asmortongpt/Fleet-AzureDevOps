//
//  AnalyticsViewModel.swift
//  Fleet Manager - iOS Native App
//
//  Fleet Analytics ViewModel
//  Handles data aggregation, calculations, and analytics for fleet metrics
//

import Foundation
import Combine
import SwiftUI

@MainActor
public class AnalyticsViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var selectedDateRange: DateRange = .last30Days

    // Fleet Metrics
    @Published var fleetMetrics: FleetMetrics?
    @Published var utilizationData: [VehicleUtilization] = []
    @Published var costData: CostBreakdown?
    @Published var fuelEfficiencyTrend: [FuelEfficiencyDataPoint] = []
    @Published var maintenanceCostTrend: [MaintenanceCostDataPoint] = []

    // MARK: - Dependencies

    private let maintenanceRepository = MaintenanceRepository()
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Date Range

    public enum DateRange: String, CaseIterable {
        case last7Days = "Last 7 Days"
        case last30Days = "Last 30 Days"
        case last90Days = "Last 90 Days"
        case last6Months = "Last 6 Months"
        case lastYear = "Last Year"
        case custom = "Custom"

        var dateInterval: DateInterval {
            let calendar = Calendar.current
            let endDate = Date()

            switch self {
            case .last7Days:
                let startDate = calendar.date(byAdding: .day, value: -7, to: endDate) ?? endDate
                return DateInterval(start: startDate, end: endDate)
            case .last30Days:
                let startDate = calendar.date(byAdding: .day, value: -30, to: endDate) ?? endDate
                return DateInterval(start: startDate, end: endDate)
            case .last90Days:
                let startDate = calendar.date(byAdding: .day, value: -90, to: endDate) ?? endDate
                return DateInterval(start: startDate, end: endDate)
            case .last6Months:
                let startDate = calendar.date(byAdding: .month, value: -6, to: endDate) ?? endDate
                return DateInterval(start: startDate, end: endDate)
            case .lastYear:
                let startDate = calendar.date(byAdding: .year, value: -1, to: endDate) ?? endDate
                return DateInterval(start: startDate, end: endDate)
            case .custom:
                return DateInterval(start: endDate, end: endDate)
            }
        }
    }

    // MARK: - Initialization

    public init() {
        setupObservers()
    }

    // MARK: - Setup

    private func setupObservers() {
        $selectedDateRange
            .sink { [weak self] _ in
                Task { @MainActor in
                    await self?.fetchAllAnalytics()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Public Methods

    /// Fetch all analytics data
    public func fetchAllAnalytics() async {
        isLoading = true
        errorMessage = nil

        do {
            async let metrics = fetchFleetMetrics()
            async let utilization = calculateUtilization()
            async let costs = analyzeCosts()
            async let fuelTrends = generateFuelEfficiencyTrends()
            async let maintenanceTrends = generateMaintenanceTrends()

            let results = try await (metrics, utilization, costs, fuelTrends, maintenanceTrends)

            self.fleetMetrics = results.0
            self.utilizationData = results.1
            self.costData = results.2
            self.fuelEfficiencyTrend = results.3
            self.maintenanceCostTrend = results.4

            isLoading = false
        } catch {
            errorMessage = "Failed to load analytics: \(error.localizedDescription)"
            isLoading = false
        }
    }

    /// Fetch fleet-wide metrics
    public func fetchFleetMetrics() async throws -> FleetMetrics {
        // Simulate API call
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        let totalVehicles = 42
        let activeVehicles = 38
        let totalMiles = 125_450.0
        let totalCost = try maintenanceRepository.totalCost()
        let avgFuelEfficiency = 24.5
        let utilizationRate = Double(activeVehicles) / Double(totalVehicles)

        return FleetMetrics(
            totalVehicles: totalVehicles,
            activeVehicles: activeVehicles,
            idleVehicles: totalVehicles - activeVehicles,
            totalMilesDriven: totalMiles,
            totalCost: totalCost,
            costPerMile: totalCost / totalMiles,
            averageFuelEfficiency: avgFuelEfficiency,
            utilizationRate: utilizationRate,
            maintenanceEvents: try maintenanceRepository.fetchAll().count,
            downtimeHours: 127.5
        )
    }

    /// Calculate vehicle utilization
    public func calculateUtilization() async throws -> [VehicleUtilization] {
        // Simulate API call
        try await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds

        // Mock data - in production, fetch from API
        return [
            VehicleUtilization(vehicleId: "V001", vehicleNumber: "V-001", utilizationRate: 0.92, activeHours: 176, totalHours: 192, milesDriven: 1850),
            VehicleUtilization(vehicleId: "V002", vehicleNumber: "V-002", utilizationRate: 0.85, activeHours: 163, totalHours: 192, milesDriven: 1620),
            VehicleUtilization(vehicleId: "V003", vehicleNumber: "V-003", utilizationRate: 0.78, activeHours: 150, totalHours: 192, milesDriven: 1450),
            VehicleUtilization(vehicleId: "V004", vehicleNumber: "V-004", utilizationRate: 0.71, activeHours: 136, totalHours: 192, milesDriven: 1280),
            VehicleUtilization(vehicleId: "V005", vehicleNumber: "V-005", utilizationRate: 0.65, activeHours: 125, totalHours: 192, milesDriven: 1150),
            VehicleUtilization(vehicleId: "V006", vehicleNumber: "V-006", utilizationRate: 0.58, activeHours: 111, totalHours: 192, milesDriven: 980),
            VehicleUtilization(vehicleId: "V007", vehicleNumber: "V-007", utilizationRate: 0.45, activeHours: 86, totalHours: 192, milesDriven: 750),
            VehicleUtilization(vehicleId: "V008", vehicleNumber: "V-008", utilizationRate: 0.32, activeHours: 61, totalHours: 192, milesDriven: 520)
        ]
    }

    /// Analyze costs across categories
    public func analyzeCosts() async throws -> CostBreakdown {
        // Simulate API call
        try await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds

        let maintenanceRecords = try maintenanceRepository.fetchAll()

        // Calculate costs by category
        var categoryBreakdown: [String: Double] = [:]
        for record in maintenanceRecords {
            let categoryName = record.category.rawValue
            let cost = (record.cost ?? 0) + record.totalPartsCost
            categoryBreakdown[categoryName, default: 0] += cost
        }

        let maintenanceCosts = maintenanceRecords.reduce(0.0) { $0 + ($1.cost ?? 0) + $1.totalPartsCost }
        let fuelCosts = 28_450.0 // Mock data
        let insuranceCosts = 12_000.0 // Mock data
        let registrationCosts = 2_400.0 // Mock data
        let otherCosts = 3_200.0 // Mock data

        let totalCost = maintenanceCosts + fuelCosts + insuranceCosts + registrationCosts + otherCosts

        return CostBreakdown(
            totalCost: totalCost,
            maintenanceCosts: maintenanceCosts,
            fuelCosts: fuelCosts,
            insuranceCosts: insuranceCosts,
            registrationCosts: registrationCosts,
            otherCosts: otherCosts,
            costPerVehicle: totalCost / 42.0,
            categoryBreakdown: categoryBreakdown
        )
    }

    /// Generate fuel efficiency trends
    public func generateFuelEfficiencyTrends() async throws -> [FuelEfficiencyDataPoint] {
        // Simulate API call
        try await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds

        let calendar = Calendar.current
        let dateInterval = selectedDateRange.dateInterval
        var dataPoints: [FuelEfficiencyDataPoint] = []

        // Generate mock trend data
        let days = calendar.dateComponents([.day], from: dateInterval.start, to: dateInterval.end).day ?? 0
        let sampleSize = min(days, 30)

        for i in 0..<sampleSize {
            guard let date = calendar.date(byAdding: .day, value: i, to: dateInterval.start) else { continue }

            // Mock fuel efficiency with slight variation
            let baseEfficiency = 24.5
            let variation = Double.random(in: -2.0...2.0)
            let mpg = baseEfficiency + variation

            dataPoints.append(FuelEfficiencyDataPoint(date: date, mpg: mpg))
        }

        return dataPoints
    }

    /// Generate maintenance cost trends
    public func generateMaintenanceTrends() async throws -> [MaintenanceCostDataPoint] {
        // Simulate API call
        try await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds

        let calendar = Calendar.current
        let dateInterval = selectedDateRange.dateInterval
        var dataPoints: [MaintenanceCostDataPoint] = []

        // Group maintenance records by month
        let maintenanceRecords = try maintenanceRepository.fetchAll()
        var monthlyData: [Date: Double] = [:]

        for record in maintenanceRecords {
            guard let scheduledDate = record.completedDate ?? record.scheduledDate as Date?,
                  dateInterval.contains(scheduledDate) else { continue }

            let monthStart = calendar.dateInterval(of: .month, for: scheduledDate)?.start ?? scheduledDate
            let cost = (record.cost ?? 0) + record.totalPartsCost
            monthlyData[monthStart, default: 0] += cost
        }

        // Create data points from monthly data
        for (date, cost) in monthlyData.sorted(by: { $0.key < $1.key }) {
            dataPoints.append(MaintenanceCostDataPoint(date: date, cost: cost))
        }

        // Fill in missing months with zero cost
        if dataPoints.isEmpty {
            let days = calendar.dateComponents([.day], from: dateInterval.start, to: dateInterval.end).day ?? 0
            let sampleSize = min(days / 30, 12)

            for i in 0..<sampleSize {
                guard let date = calendar.date(byAdding: .month, value: i, to: dateInterval.start) else { continue }
                dataPoints.append(MaintenanceCostDataPoint(date: date, cost: Double.random(in: 1000...5000)))
            }
        }

        return dataPoints
    }

    /// Export analytics to PDF
    public func exportToPDF() async -> URL? {
        // TODO: Implement PDF export
        return nil
    }

    /// Export analytics to CSV
    public func exportToCSV() async -> URL? {
        // TODO: Implement CSV export
        return nil
    }
}

// MARK: - Data Models

public struct FleetMetrics: Codable {
    let totalVehicles: Int
    let activeVehicles: Int
    let idleVehicles: Int
    let totalMilesDriven: Double
    let totalCost: Double
    let costPerMile: Double
    let averageFuelEfficiency: Double
    let utilizationRate: Double
    let maintenanceEvents: Int
    let downtimeHours: Double

    var formattedTotalCost: String {
        String(format: "$%.2f", totalCost)
    }

    var formattedCostPerMile: String {
        String(format: "$%.2f", costPerMile)
    }

    var formattedUtilization: String {
        String(format: "%.1f%%", utilizationRate * 100)
    }

    var formattedFuelEfficiency: String {
        String(format: "%.1f MPG", averageFuelEfficiency)
    }
}

public struct VehicleUtilization: Codable, Identifiable {
    public let id = UUID()
    let vehicleId: String
    let vehicleNumber: String
    let utilizationRate: Double
    let activeHours: Int
    let totalHours: Int
    let milesDriven: Double

    var formattedUtilization: String {
        String(format: "%.1f%%", utilizationRate * 100)
    }

    var utilizationColor: Color {
        switch utilizationRate {
        case 0.8...:
            return .green
        case 0.6..<0.8:
            return .orange
        default:
            return .red
        }
    }
}

public struct CostBreakdown: Codable {
    let totalCost: Double
    let maintenanceCosts: Double
    let fuelCosts: Double
    let insuranceCosts: Double
    let registrationCosts: Double
    let otherCosts: Double
    let costPerVehicle: Double
    let categoryBreakdown: [String: Double]

    var formattedTotalCost: String {
        String(format: "$%.2f", totalCost)
    }

    var formattedCostPerVehicle: String {
        String(format: "$%.2f", costPerVehicle)
    }

    var categoryBreakdownSorted: [(String, Double)] {
        categoryBreakdown.sorted { $0.value > $1.value }
    }
}

public struct FuelEfficiencyDataPoint: Identifiable, Codable {
    public let id = UUID()
    let date: Date
    let mpg: Double

    enum CodingKeys: String, CodingKey {
        case date, mpg
    }
}

public struct MaintenanceCostDataPoint: Identifiable, Codable {
    public let id = UUID()
    let date: Date
    let cost: Double

    enum CodingKeys: String, CodingKey {
        case date, cost
    }

    var formattedCost: String {
        String(format: "$%.2f", cost)
    }
}
