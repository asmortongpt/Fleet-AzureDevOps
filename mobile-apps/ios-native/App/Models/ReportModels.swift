//
//  ReportModels.swift
//  Fleet Manager
//
//  Comprehensive report data structures for analytics and exports
//

import Foundation
import CoreLocation

// MARK: - Report Models

/// Main report container with metadata and data
struct FleetReport: Identifiable, Codable {
    let id: String
    let name: String
    let type: ReportType
    let dateRange: DateRange
    let generatedDate: Date
    let format: ReportFormat?
    let summary: String
    let details: [ReportDetail]
    let exportData: Data?

    init(
        id: String = UUID().uuidString,
        name: String,
        type: ReportType,
        dateRange: DateRange,
        generatedDate: Date = Date(),
        format: ReportFormat? = nil,
        summary: String,
        details: [ReportDetail] = [],
        exportData: Data? = nil
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.dateRange = dateRange
        self.generatedDate = generatedDate
        self.format = format
        self.summary = summary
        self.details = details
        self.exportData = exportData
    }
}

/// Report detail item with optional trend indicator
struct ReportDetail: Identifiable, Codable {
    let id: String
    let label: String
    let value: String
    let icon: String?
    let trend: TrendIndicator?
    let color: String?

    init(
        id: String = UUID().uuidString,
        label: String,
        value: String,
        icon: String? = nil,
        trend: TrendIndicator? = nil,
        color: String? = nil
    ) {
        self.id = id
        self.label = label
        self.value = value
        self.icon = icon
        self.trend = trend
        self.color = color
    }
}

/// Trend indicator for metrics
enum TrendIndicator: Codable {
    case up(Double)
    case down(Double)
    case neutral

    var icon: String {
        switch self {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .neutral: return "minus"
        }
    }

    var color: String {
        switch self {
        case .up: return "green"
        case .down: return "red"
        case .neutral: return "gray"
        }
    }

    var displayText: String {
        switch self {
        case .up(let percent): return "+\(String(format: "%.1f%%", percent))"
        case .down(let percent): return "-\(String(format: "%.1f%%", percent))"
        case .neutral: return "0%"
        }
    }
}

// MARK: - Report Types

enum ReportType: String, CaseIterable, Codable {
    case fleetUtilization = "Fleet Utilization"
    case fuelConsumption = "Fuel Consumption"
    case maintenanceCost = "Maintenance Cost"
    case driverPerformance = "Driver Performance"
    case incidentSummary = "Incident Summary"
    case vehicleCost = "Vehicle Cost Analysis"
    case tripSummary = "Trip Summary"
    case custom = "Custom Report"

    var icon: String {
        switch self {
        case .fleetUtilization: return "chart.bar.fill"
        case .fuelConsumption: return "fuelpump.fill"
        case .maintenanceCost: return "wrench.and.screwdriver.fill"
        case .driverPerformance: return "person.crop.circle.badge.checkmark"
        case .incidentSummary: return "exclamationmark.triangle.fill"
        case .vehicleCost: return "dollarsign.circle.fill"
        case .tripSummary: return "map.fill"
        case .custom: return "doc.text.fill"
        }
    }

    var description: String {
        switch self {
        case .fleetUtilization:
            return "Vehicle usage and efficiency metrics"
        case .fuelConsumption:
            return "Fuel consumption and cost analysis"
        case .maintenanceCost:
            return "Maintenance expenses breakdown"
        case .driverPerformance:
            return "Driver safety and efficiency scores"
        case .incidentSummary:
            return "Incident reports and analysis"
        case .vehicleCost:
            return "Total cost of ownership analysis"
        case .tripSummary:
            return "Comprehensive trip statistics"
        case .custom:
            return "Custom report with selected metrics"
        }
    }
}

/// Export format options
enum ReportFormat: String, CaseIterable, Codable {
    case pdf = "PDF"
    case excel = "Excel"
    case csv = "CSV"
    case json = "JSON"

    var icon: String {
        switch self {
        case .pdf: return "doc.fill"
        case .excel: return "tablecells.fill"
        case .csv: return "doc.plaintext.fill"
        case .json: return "chevron.left.forwardslash.chevron.right"
        }
    }

    var fileExtension: String {
        rawValue.lowercased()
    }
}

/// Date range for report filtering
struct DateRange: Codable {
    let start: Date
    let end: Date

    var displayText: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
    }

    var durationInDays: Int {
        Calendar.current.dateComponents([.day], from: start, to: end).day ?? 0
    }

    static var today: DateRange {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let end = calendar.date(byAdding: .day, value: 1, to: start)!
        return DateRange(start: start, end: end)
    }

    static var thisWeek: DateRange {
        let calendar = Calendar.current
        let now = Date()
        let start = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now
        let end = calendar.date(byAdding: .day, value: 7, to: start)!
        return DateRange(start: start, end: end)
    }

    static var thisMonth: DateRange {
        let calendar = Calendar.current
        let now = Date()
        let start = calendar.dateInterval(of: .month, for: now)?.start ?? now
        let end = calendar.date(byAdding: .month, value: 1, to: start)!
        return DateRange(start: start, end: end)
    }

    static var lastMonth: DateRange {
        let calendar = Calendar.current
        let now = Date()
        let lastMonth = calendar.date(byAdding: .month, value: -1, to: now)!
        let start = calendar.dateInterval(of: .month, for: lastMonth)?.start ?? lastMonth
        let end = calendar.date(byAdding: .month, value: 1, to: start)!
        return DateRange(start: start, end: end)
    }

    static var last30Days: DateRange {
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -30, to: end)!
        return DateRange(start: start, end: end)
    }

    static var last90Days: DateRange {
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -90, to: end)!
        return DateRange(start: start, end: end)
    }
}

// MARK: - Specific Report Models

/// Fleet Utilization Report Data
struct FleetUtilizationReport: Codable {
    let totalVehicles: Int
    let activeVehicles: Int
    let utilizationRate: Double
    let avgMileage: Double
    let avgHoursUsed: Double
    let vehiclesByStatus: [VehicleStatus: Int]
    let vehiclesByDepartment: [String: Int]
    let vehiclesByType: [VehicleType: Int]

    var utilizationPercentage: String {
        String(format: "%.1f%%", utilizationRate * 100)
    }
}

/// Fuel Consumption Report Data
struct FuelConsumptionReport: Codable {
    let totalDistance: Double
    let totalFuelUsed: Double
    let totalFuelCost: Double
    let avgMPG: Double
    let avgCostPerMile: Double
    let avgCostPerGallon: Double
    let fuelByVehicle: [String: Double]
    let fuelByDepartment: [String: Double]
    let costTrend: [DateDataPoint]

    var efficiency: String {
        String(format: "%.1f MPG", avgMPG)
    }
}

/// Maintenance Cost Report Data
struct MaintenanceCostReport: Codable {
    let totalCost: Double
    let scheduledMaintenance: Double
    let unscheduledMaintenance: Double
    let costPerVehicle: Double
    let costByType: [String: Double]
    let costByVehicle: [String: Double]
    let costTrend: [DateDataPoint]
    let upcomingMaintenance: Int
    let overdueMaintenance: Int

    var avgCostPerService: Double {
        guard totalCost > 0 else { return 0 }
        return totalCost / Double(scheduledMaintenance > 0 ? Int(scheduledMaintenance) : 1)
    }
}

/// Driver Performance Report Data
struct DriverPerformanceReport: Codable {
    let totalDrivers: Int
    let avgSafetyScore: Double
    let avgEfficiencyScore: Double
    let totalIncidents: Int
    let totalViolations: Int
    let driverScores: [DriverScore]
    let topPerformers: [String]
    let needsImprovement: [String]

    var overallScore: Double {
        (avgSafetyScore + avgEfficiencyScore) / 2
    }
}

/// Individual driver score
struct DriverScore: Codable, Identifiable {
    let id: String
    let driverName: String
    let safetyScore: Double
    let efficiencyScore: Double
    let totalTrips: Int
    let totalMiles: Double
    let incidents: Int
    let violations: Int

    var overallScore: Double {
        (safetyScore + efficiencyScore) / 2
    }
}

/// Custom Report Configuration
struct CustomReport: Codable {
    let id: String
    let name: String
    let selectedMetrics: [ReportMetric]
    let filters: ReportFilters
    let groupBy: GroupByOption
    let sortBy: SortOption

    init(
        id: String = UUID().uuidString,
        name: String,
        selectedMetrics: [ReportMetric],
        filters: ReportFilters = ReportFilters(),
        groupBy: GroupByOption = .none,
        sortBy: SortOption = .none
    ) {
        self.id = id
        self.name = name
        self.selectedMetrics = selectedMetrics
        self.filters = filters
        self.groupBy = groupBy
        self.sortBy = sortBy
    }
}

/// Report metric options
enum ReportMetric: String, CaseIterable, Codable {
    case vehicleCount = "Vehicle Count"
    case totalMileage = "Total Mileage"
    case fuelConsumption = "Fuel Consumption"
    case maintenanceCost = "Maintenance Cost"
    case tripCount = "Trip Count"
    case utilization = "Utilization Rate"
    case incidents = "Incidents"
    case violations = "Violations"

    var icon: String {
        switch self {
        case .vehicleCount: return "car.2.fill"
        case .totalMileage: return "speedometer"
        case .fuelConsumption: return "fuelpump.fill"
        case .maintenanceCost: return "wrench.fill"
        case .tripCount: return "map.fill"
        case .utilization: return "chart.bar.fill"
        case .incidents: return "exclamationmark.triangle.fill"
        case .violations: return "xmark.shield.fill"
        }
    }
}

/// Report filters
struct ReportFilters: Codable {
    var vehicleTypes: [VehicleType]
    var departments: [String]
    var statuses: [VehicleStatus]
    var regions: [String]

    init(
        vehicleTypes: [VehicleType] = [],
        departments: [String] = [],
        statuses: [VehicleStatus] = [],
        regions: [String] = []
    ) {
        self.vehicleTypes = vehicleTypes
        self.departments = departments
        self.statuses = statuses
        self.regions = regions
    }

    var isActive: Bool {
        !vehicleTypes.isEmpty || !departments.isEmpty || !statuses.isEmpty || !regions.isEmpty
    }
}

/// Group by options for reports
enum GroupByOption: String, CaseIterable, Codable {
    case none = "None"
    case department = "Department"
    case vehicleType = "Vehicle Type"
    case region = "Region"
    case status = "Status"
    case driver = "Driver"
}

/// Sort options for reports
enum SortOption: String, CaseIterable, Codable {
    case none = "None"
    case costAsc = "Cost (Low to High)"
    case costDesc = "Cost (High to Low)"
    case mileageAsc = "Mileage (Low to High)"
    case mileageDesc = "Mileage (High to Low)"
    case nameAsc = "Name (A-Z)"
    case nameDesc = "Name (Z-A)"
}

// MARK: - Chart Data Models

/// Generic data point for time series charts
struct DateDataPoint: Codable, Identifiable {
    let id: String
    let date: Date
    let value: Double
    let label: String?

    init(
        id: String = UUID().uuidString,
        date: Date,
        value: Double,
        label: String? = nil
    ) {
        self.id = id
        self.date = date
        self.value = value
        self.label = label
    }
}

/// Category data point for bar/pie charts
struct CategoryDataPoint: Codable, Identifiable {
    let id: String
    let category: String
    let value: Double
    let color: String?

    init(
        id: String = UUID().uuidString,
        category: String,
        value: Double,
        color: String? = nil
    ) {
        self.id = id
        self.category = category
        self.value = value
        self.color = color
    }
}

/// Multi-series data point for comparison charts
struct MultiSeriesDataPoint: Codable, Identifiable {
    let id: String
    let label: String
    let series: [String: Double]

    init(
        id: String = UUID().uuidString,
        label: String,
        series: [String: Double]
    ) {
        self.id = id
        self.label = label
        self.series = series
    }
}

// MARK: - Report Export Options

/// Export configuration
struct ReportExportOptions: Codable {
    let format: ReportFormat
    let includeCharts: Bool
    let includeRawData: Bool
    let companyLogo: Bool
    let fileName: String

    init(
        format: ReportFormat,
        includeCharts: Bool = true,
        includeRawData: Bool = false,
        companyLogo: Bool = true,
        fileName: String
    ) {
        self.format = format
        self.includeCharts = includeCharts
        self.includeRawData = includeRawData
        self.companyLogo = companyLogo
        self.fileName = fileName
    }
}

// MARK: - Codable Extensions for Trend Indicator

extension TrendIndicator {
    enum CodingKeys: String, CodingKey {
        case type
        case value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "up":
            let value = try container.decode(Double.self, forKey: .value)
            self = .up(value)
        case "down":
            let value = try container.decode(Double.self, forKey: .value)
            self = .down(value)
        case "neutral":
            self = .neutral
        default:
            self = .neutral
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .up(let value):
            try container.encode("up", forKey: .type)
            try container.encode(value, forKey: .value)
        case .down(let value):
            try container.encode("down", forKey: .type)
            try container.encode(value, forKey: .value)
        case .neutral:
            try container.encode("neutral", forKey: .type)
        }
    }
}
