//
//  ReportsViewModel.swift
//  Fleet Manager
//
//  ViewModel for Reports with data loading, generation, and export functionality
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class ReportsViewModel: RefreshableViewModel {

    // MARK: - Published Properties

    // Report data
    @Published var fleetUtilizationReport: FleetUtilizationReport?
    @Published var fuelConsumptionReport: FuelConsumptionReport?
    @Published var maintenanceCostReport: MaintenanceCostReport?
    @Published var driverPerformanceReport: DriverPerformanceReport?

    // Generated reports
    @Published var currentReport: FleetReport?
    @Published var savedReports: [FleetReport] = []

    // Date range
    @Published var selectedDateRange: DateRange = DateRange.last30Days
    @Published var customDateRange: DateRange?

    // Export
    @Published var exportFormat: ReportFormat = .pdf
    @Published var isExporting = false
    @Published var exportError: String?

    // Filters
    @Published var activeFilters = ReportFilters()
    @Published var selectedReportType: ReportType = .fleetUtilization

    // Chart data
    @Published var utilizationChartData: [CategoryDataPoint] = []
    @Published var fuelTrendData: [DateDataPoint] = []
    @Published var costTrendData: [DateDataPoint] = []
    @Published var performanceData: [DriverScore] = []

    // MARK: - Private Properties
    private var vehicles: [Vehicle] = []
    private var trips: [Trip] = []
    private var maintenanceRecords: [MaintenanceRecord] = []
    private var fuelRecords: [FuelRecord] = []

    // MARK: - Initialization
    override init() {
        super.init()
        loadReportData()
    }

    // MARK: - Data Loading

    private func loadReportData() {
        Task {
            await loadAllData()
        }
    }

    @MainActor
    private func loadAllData() async {
        startLoading()

        // Simulate network delay
        await Task.sleep(300_000_000) // 0.3 seconds

        // Initialize with empty data - will be populated from API
        vehicles = []
        trips = []
        maintenanceRecords = []
        fuelRecords = []

        // Generate initial reports
        generateFleetUtilizationReport()
        generateFuelConsumptionReport()
        generateMaintenanceCostReport()
        generateDriverPerformanceReport()

        // Load saved reports from cache
        loadSavedReports()

        finishLoading()
    }

    // MARK: - Report Generation

    func generateFleetUtilizationReport() {
        let filteredVehicles = applyFilters(to: vehicles)

        let activeVehicles = filteredVehicles.filter {
            $0.status == .active || $0.status == .moving
        }

        let utilizationRate = filteredVehicles.isEmpty ? 0.0 :
            Double(activeVehicles.count) / Double(filteredVehicles.count)

        let avgMileage = filteredVehicles.isEmpty ? 0.0 :
            filteredVehicles.map { $0.mileage }.reduce(0, +) / Double(filteredVehicles.count)

        let avgHoursUsed = filteredVehicles.isEmpty ? 0.0 :
            filteredVehicles.compactMap { $0.hoursUsed }.reduce(0, +) / Double(filteredVehicles.count)

        // Group by status
        var vehiclesByStatus: [VehicleStatus: Int] = [:]
        for vehicle in filteredVehicles {
            vehiclesByStatus[vehicle.status, default: 0] += 1
        }

        // Group by department
        var vehiclesByDepartment: [String: Int] = [:]
        for vehicle in filteredVehicles {
            vehiclesByDepartment[vehicle.department, default: 0] += 1
        }

        // Group by type
        var vehiclesByType: [VehicleType: Int] = [:]
        for vehicle in filteredVehicles {
            vehiclesByType[vehicle.type, default: 0] += 1
        }

        fleetUtilizationReport = FleetUtilizationReport(
            totalVehicles: filteredVehicles.count,
            activeVehicles: activeVehicles.count,
            utilizationRate: utilizationRate,
            avgMileage: avgMileage,
            avgHoursUsed: avgHoursUsed,
            vehiclesByStatus: vehiclesByStatus,
            vehiclesByDepartment: vehiclesByDepartment,
            vehiclesByType: vehiclesByType
        )

        // Generate chart data
        utilizationChartData = vehiclesByStatus.map { status, count in
            CategoryDataPoint(
                category: status.displayName,
                value: Double(count),
                color: status.themeColor.description
            )
        }
    }

    func generateFuelConsumptionReport() {
        let filteredTrips = applyFilters(to: trips)
        let dateFilteredRecords = fuelRecords.filter { record in
            record.date >= selectedDateRange.start && record.date <= selectedDateRange.end
        }

        let totalDistance = filteredTrips.map { $0.distance }.reduce(0, +)
        let totalFuelUsed = dateFilteredRecords.map { $0.gallons }.reduce(0, +)
        let totalFuelCost = dateFilteredRecords.map { $0.totalCost }.reduce(0, +)

        let avgMPG = totalFuelUsed > 0 ? totalDistance / totalFuelUsed : 0
        let avgCostPerMile = totalDistance > 0 ? totalFuelCost / totalDistance : 0
        let avgCostPerGallon = totalFuelUsed > 0 ? totalFuelCost / totalFuelUsed : 0

        // Group by vehicle
        var fuelByVehicle: [String: Double] = [:]
        for record in dateFilteredRecords {
            fuelByVehicle[record.vehicleNumber, default: 0] += record.totalCost
        }

        // Group by department (from vehicles)
        var fuelByDepartment: [String: Double] = [:]
        for record in dateFilteredRecords {
            if let vehicle = vehicles.first(where: { $0.number == record.vehicleNumber }) {
                fuelByDepartment[vehicle.department, default: 0] += record.totalCost
            }
        }

        // Generate trend data
        fuelTrendData = generateTrendData(from: dateFilteredRecords.map { ($0.date, $0.totalCost) })

        fuelConsumptionReport = FuelConsumptionReport(
            totalDistance: totalDistance,
            totalFuelUsed: totalFuelUsed,
            totalFuelCost: totalFuelCost,
            avgMPG: avgMPG,
            avgCostPerMile: avgCostPerMile,
            avgCostPerGallon: avgCostPerGallon,
            fuelByVehicle: fuelByVehicle,
            fuelByDepartment: fuelByDepartment,
            costTrend: fuelTrendData
        )
    }

    func generateMaintenanceCostReport() {
        let dateFilteredRecords = maintenanceRecords.filter { record in
            record.scheduledDate >= selectedDateRange.start &&
            record.scheduledDate <= selectedDateRange.end
        }

        let totalCost = dateFilteredRecords.map { $0.cost }.reduce(0, +)
        let scheduledCost = dateFilteredRecords.filter { $0.status == .scheduled || $0.status == .completed }
            .map { $0.cost }.reduce(0, +)
        let unscheduledCost = totalCost - scheduledCost

        let costPerVehicle = vehicles.isEmpty ? 0.0 : totalCost / Double(vehicles.count)

        // Group by type
        var costByType: [String: Double] = [:]
        for record in dateFilteredRecords {
            costByType[record.type, default: 0] += record.cost
        }

        // Group by vehicle
        var costByVehicle: [String: Double] = [:]
        for record in dateFilteredRecords {
            costByVehicle[record.vehicleNumber, default: 0] += record.cost
        }

        // Generate trend data
        costTrendData = generateTrendData(from: dateFilteredRecords.map { ($0.scheduledDate, $0.cost) })

        let upcomingCount = maintenanceRecords.filter {
            $0.status == .scheduled && $0.scheduledDate > Date()
        }.count

        let overdueCount = maintenanceRecords.filter {
            $0.status == .overdue
        }.count

        maintenanceCostReport = MaintenanceCostReport(
            totalCost: totalCost,
            scheduledMaintenance: scheduledCost,
            unscheduledMaintenance: unscheduledCost,
            costPerVehicle: costPerVehicle,
            costByType: costByType,
            costByVehicle: costByVehicle,
            costTrend: costTrendData,
            upcomingMaintenance: upcomingCount,
            overdueMaintenance: overdueCount
        )
    }

    func generateDriverPerformanceReport() {
        let filteredTrips = applyFilters(to: trips)

        // Group trips by driver
        var tripsByDriver: [String: [Trip]] = [:]
        for trip in filteredTrips {
            tripsByDriver[trip.driverName, default: []].append(trip)
        }

        // Calculate scores for each driver
        var driverScores: [DriverScore] = []
        for (driverName, trips) in tripsByDriver {
            let totalMiles = trips.map { $0.distance }.reduce(0, +)
            let incidents = trips.flatMap { $0.events }.filter {
                $0.severity == .high || $0.severity == .medium
            }.count

            // Calculate safety score (100 - penalties for events)
            let hardBraking = trips.flatMap { $0.events }.filter { $0.type == .hardBraking }.count
            let speeding = trips.flatMap { $0.events }.filter { $0.type == .speeding }.count
            let safetyPenalty = Double(hardBraking * 5 + speeding * 10)
            let safetyScore = max(0, min(100, 100 - safetyPenalty))

            // Calculate efficiency score based on fuel usage and speed
            let avgSpeed = trips.isEmpty ? 0 : trips.map { $0.averageSpeed }.reduce(0, +) / Double(trips.count)
            let fuelEfficiency = trips.map { $0.fuelUsed }.reduce(0, +)
            let efficiencyScore = min(100, (avgSpeed / 65.0) * 100) // Optimal at 65 mph

            let score = DriverScore(
                id: UUID().uuidString,
                driverName: driverName,
                safetyScore: safetyScore,
                efficiencyScore: efficiencyScore,
                totalTrips: trips.count,
                totalMiles: totalMiles,
                incidents: incidents,
                violations: speeding + hardBraking
            )

            driverScores.append(score)
        }

        // Sort by overall score
        driverScores.sort { $0.overallScore > $1.overallScore }

        let avgSafety = driverScores.isEmpty ? 0 :
            driverScores.map { $0.safetyScore }.reduce(0, +) / Double(driverScores.count)
        let avgEfficiency = driverScores.isEmpty ? 0 :
            driverScores.map { $0.efficiencyScore }.reduce(0, +) / Double(driverScores.count)

        let topPerformers = Array(driverScores.prefix(5)).map { $0.driverName }
        let needsImprovement = Array(driverScores.suffix(5)).map { $0.driverName }

        performanceData = driverScores

        driverPerformanceReport = DriverPerformanceReport(
            totalDrivers: driverScores.count,
            avgSafetyScore: avgSafety,
            avgEfficiencyScore: avgEfficiency,
            totalIncidents: driverScores.map { $0.incidents }.reduce(0, +),
            totalViolations: driverScores.map { $0.violations }.reduce(0, +),
            driverScores: driverScores,
            topPerformers: topPerformers,
            needsImprovement: needsImprovement
        )
    }

    // MARK: - Helper Methods

    private func applyFilters(to vehicles: [Vehicle]) -> [Vehicle] {
        var filtered = vehicles

        if !activeFilters.vehicleTypes.isEmpty {
            filtered = filtered.filter { activeFilters.vehicleTypes.contains($0.type) }
        }

        if !activeFilters.departments.isEmpty {
            filtered = filtered.filter { activeFilters.departments.contains($0.department) }
        }

        if !activeFilters.statuses.isEmpty {
            filtered = filtered.filter { activeFilters.statuses.contains($0.status) }
        }

        if !activeFilters.regions.isEmpty {
            filtered = filtered.filter { activeFilters.regions.contains($0.region) }
        }

        return filtered
    }

    private func applyFilters(to trips: [Trip]) -> [Trip] {
        trips.filter { trip in
            trip.startTime >= selectedDateRange.start &&
            trip.startTime <= selectedDateRange.end
        }
    }

    private func generateTrendData(from data: [(Date, Double)]) -> [DateDataPoint] {
        // Group by day and sum values
        let calendar = Calendar.current
        var dailyData: [Date: Double] = [:]

        for (date, value) in data {
            let day = calendar.startOfDay(for: date)
            dailyData[day, default: 0] += value
        }

        // Convert to sorted array
        return dailyData.map { date, value in
            DateDataPoint(date: date, value: value)
        }.sorted { $0.date < $1.date }
    }

    // MARK: - Report Management

    func generateReport(type: ReportType) {
        selectedReportType = type

        switch type {
        case .fleetUtilization:
            generateFleetUtilizationReport()
            currentReport = createFleetReport(from: fleetUtilizationReport)
        case .fuelConsumption:
            generateFuelConsumptionReport()
            currentReport = createFleetReport(from: fuelConsumptionReport)
        case .maintenanceCost:
            generateMaintenanceCostReport()
            currentReport = createFleetReport(from: maintenanceCostReport)
        case .driverPerformance:
            generateDriverPerformanceReport()
            currentReport = createFleetReport(from: driverPerformanceReport)
        case .tripSummary:
            currentReport = createTripSummaryReport()
        default:
            currentReport = nil
        }
    }

    private func createFleetReport(from utilizationReport: FleetUtilizationReport?) -> FleetReport? {
        guard let report = utilizationReport else { return nil }

        let details = [
            ReportDetail(
                label: "Total Vehicles",
                value: "\(report.totalVehicles)",
                icon: "car.2.fill"
            ),
            ReportDetail(
                label: "Active Vehicles",
                value: "\(report.activeVehicles)",
                icon: "location.fill",
                color: "green"
            ),
            ReportDetail(
                label: "Utilization Rate",
                value: report.utilizationPercentage,
                icon: "chart.bar.fill",
                trend: .up(report.utilizationRate * 100)
            ),
            ReportDetail(
                label: "Average Mileage",
                value: String(format: "%.0f mi", report.avgMileage),
                icon: "speedometer"
            ),
            ReportDetail(
                label: "Average Hours",
                value: String(format: "%.0f hrs", report.avgHoursUsed),
                icon: "clock.fill"
            )
        ]

        return FleetReport(
            name: "Fleet Utilization Report",
            type: .fleetUtilization,
            dateRange: selectedDateRange,
            summary: "Utilization: \(report.utilizationPercentage) | Active: \(report.activeVehicles)/\(report.totalVehicles)",
            details: details
        )
    }

    private func createFleetReport(from fuelReport: FuelConsumptionReport?) -> FleetReport? {
        guard let report = fuelReport else { return nil }

        let details = [
            ReportDetail(
                label: "Total Distance",
                value: String(format: "%.0f mi", report.totalDistance),
                icon: "map.fill"
            ),
            ReportDetail(
                label: "Fuel Used",
                value: String(format: "%.1f gal", report.totalFuelUsed),
                icon: "fuelpump.fill"
            ),
            ReportDetail(
                label: "Total Cost",
                value: String(format: "$%.2f", report.totalFuelCost),
                icon: "dollarsign.circle.fill",
                color: "red"
            ),
            ReportDetail(
                label: "Average MPG",
                value: report.efficiency,
                icon: "gauge.medium",
                trend: report.avgMPG > 20 ? .up(10) : .down(5)
            ),
            ReportDetail(
                label: "Cost per Mile",
                value: String(format: "$%.2f", report.avgCostPerMile),
                icon: "chart.line.uptrend.xyaxis"
            )
        ]

        return FleetReport(
            name: "Fuel Consumption Report",
            type: .fuelConsumption,
            dateRange: selectedDateRange,
            summary: "Total: $\(String(format: "%.2f", report.totalFuelCost)) | MPG: \(report.efficiency)",
            details: details
        )
    }

    private func createFleetReport(from maintenanceReport: MaintenanceCostReport?) -> FleetReport? {
        guard let report = maintenanceReport else { return nil }

        let details = [
            ReportDetail(
                label: "Total Cost",
                value: String(format: "$%.2f", report.totalCost),
                icon: "dollarsign.circle.fill",
                color: "orange"
            ),
            ReportDetail(
                label: "Scheduled Maintenance",
                value: String(format: "$%.2f", report.scheduledMaintenance),
                icon: "calendar.badge.checkmark"
            ),
            ReportDetail(
                label: "Unscheduled Repairs",
                value: String(format: "$%.2f", report.unscheduledMaintenance),
                icon: "exclamationmark.triangle.fill",
                color: "red"
            ),
            ReportDetail(
                label: "Cost per Vehicle",
                value: String(format: "$%.2f", report.costPerVehicle),
                icon: "car.fill"
            ),
            ReportDetail(
                label: "Upcoming Maintenance",
                value: "\(report.upcomingMaintenance)",
                icon: "clock.arrow.circlepath"
            ),
            ReportDetail(
                label: "Overdue",
                value: "\(report.overdueMaintenance)",
                icon: "exclamationmark.circle.fill",
                color: "red"
            )
        ]

        return FleetReport(
            name: "Maintenance Cost Report",
            type: .maintenanceCost,
            dateRange: selectedDateRange,
            summary: "Total: $\(String(format: "%.2f", report.totalCost)) | Per Vehicle: $\(String(format: "%.2f", report.costPerVehicle))",
            details: details
        )
    }

    private func createFleetReport(from performanceReport: DriverPerformanceReport?) -> FleetReport? {
        guard let report = performanceReport else { return nil }

        let details = [
            ReportDetail(
                label: "Total Drivers",
                value: "\(report.totalDrivers)",
                icon: "person.3.fill"
            ),
            ReportDetail(
                label: "Avg Safety Score",
                value: String(format: "%.1f", report.avgSafetyScore),
                icon: "shield.fill",
                trend: report.avgSafetyScore > 80 ? .up(5) : .down(5),
                color: "green"
            ),
            ReportDetail(
                label: "Avg Efficiency Score",
                value: String(format: "%.1f", report.avgEfficiencyScore),
                icon: "gauge.medium",
                trend: .up(3)
            ),
            ReportDetail(
                label: "Total Incidents",
                value: "\(report.totalIncidents)",
                icon: "exclamationmark.triangle.fill",
                color: "orange"
            ),
            ReportDetail(
                label: "Total Violations",
                value: "\(report.totalViolations)",
                icon: "xmark.shield.fill",
                color: "red"
            )
        ]

        return FleetReport(
            name: "Driver Performance Report",
            type: .driverPerformance,
            dateRange: selectedDateRange,
            summary: "Safety: \(String(format: "%.1f", report.avgSafetyScore)) | Efficiency: \(String(format: "%.1f", report.avgEfficiencyScore))",
            details: details
        )
    }

    private func createTripSummaryReport() -> FleetReport {
        let filteredTrips = applyFilters(to: trips)
        let completed = filteredTrips.filter { $0.status == .completed }
        let totalDistance = filteredTrips.map { $0.distance }.reduce(0, +)
        let avgDistance = filteredTrips.isEmpty ? 0 : totalDistance / Double(filteredTrips.count)

        let details = [
            ReportDetail(
                label: "Total Trips",
                value: "\(filteredTrips.count)",
                icon: "map.fill"
            ),
            ReportDetail(
                label: "Completed",
                value: "\(completed.count)",
                icon: "checkmark.circle.fill",
                color: "green"
            ),
            ReportDetail(
                label: "Total Distance",
                value: String(format: "%.0f mi", totalDistance),
                icon: "road.lanes"
            ),
            ReportDetail(
                label: "Average Distance",
                value: String(format: "%.1f mi", avgDistance),
                icon: "chart.bar.fill"
            )
        ]

        return FleetReport(
            name: "Trip Summary Report",
            type: .tripSummary,
            dateRange: selectedDateRange,
            summary: "Total: \(filteredTrips.count) trips | Distance: \(String(format: "%.0f mi", totalDistance))",
            details: details
        )
    }

    func saveReport(_ report: FleetReport) {
        savedReports.append(report)
        cacheSavedReports()
    }

    private func loadSavedReports() {
        if let data = getCachedObject(forKey: "saved_reports", type: Data.self),
           let reports = try? JSONDecoder().decode([FleetReport].self, from: data) {
            savedReports = reports
        }
    }

    private func cacheSavedReports() {
        if let data = try? JSONEncoder().encode(savedReports) {
            cacheObject(data as AnyObject, forKey: "saved_reports")
        }
    }

    // MARK: - Export

    func exportReport(_ report: FleetReport, format: ReportFormat) async {
        isExporting = true
        exportError = nil

        // Simulate export process
        await Task.sleep(1_000_000_000) // 1 second

        // In a real app, this would generate PDF, CSV, or Excel files
        switch format {
        case .pdf:
            exportError = nil // Success
            print("Exported report as PDF: \(report.name)")
        case .csv:
            exportError = nil
            print("Exported report as CSV: \(report.name)")
        case .excel:
            exportError = nil
            print("Exported report as Excel: \(report.name)")
        case .json:
            if let data = try? JSONEncoder().encode(report) {
                print("Exported report as JSON: \(data.count) bytes")
            }
        }

        isExporting = false
    }

    // MARK: - Date Range

    func updateDateRange(_ range: DateRange) {
        selectedDateRange = range
        // Regenerate current report with new date range
        if let type = currentReport?.type {
            generateReport(type: type)
        }
    }

    // MARK: - Refresh

    override func refresh() async {
        startRefreshing()
        await loadAllData()
        finishRefreshing()
    }

    // MARK: - Filters

    func updateFilters(_ filters: ReportFilters) {
        activeFilters = filters
        // Regenerate reports with new filters
        generateFleetUtilizationReport()
        generateFuelConsumptionReport()
        generateMaintenanceCostReport()
        generateDriverPerformanceReport()

        if let type = currentReport?.type {
            generateReport(type: type)
        }
    }

    func clearFilters() {
        activeFilters = ReportFilters()
        updateFilters(activeFilters)
    }
}
