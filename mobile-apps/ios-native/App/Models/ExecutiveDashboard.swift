//
//  ExecutiveDashboard.swift
//  Fleet Manager
//
//  Executive Dashboard models for high-level KPIs and metrics
//

import Foundation

// MARK: - Executive Metrics
struct ExecutiveMetrics: Codable, Equatable {
    let totalFleetValue: Double
    let monthlyCosts: Double
    let utilizationRate: Double
    let safetyScore: Double
    let complianceScore: Double
    let averageVehicleAge: Double
    let maintenanceOnTimePercent: Double
    let fuelEfficiency: Double
    let totalVehicles: Int
    let activeVehicles: Int
    let lastUpdated: Date

    // Computed properties for display
    var formattedFleetValue: String {
        formatCurrency(totalFleetValue)
    }

    var formattedMonthlyCosts: String {
        formatCurrency(monthlyCosts)
    }

    var formattedUtilization: String {
        String(format: "%.1f%%", utilizationRate)
    }

    var formattedSafetyScore: String {
        String(format: "%.1f", safetyScore)
    }

    var formattedComplianceScore: String {
        String(format: "%.0f%%", complianceScore)
    }

    var formattedAverageAge: String {
        String(format: "%.1f years", averageVehicleAge)
    }

    var formattedMaintenanceOnTime: String {
        String(format: "%.0f%%", maintenanceOnTimePercent)
    }

    var formattedFuelEfficiency: String {
        String(format: "%.1f MPG", fuelEfficiency)
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$0"
    }
}

// MARK: - KPI
struct KPI: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let currentValue: Double
    let targetValue: Double
    let trend: Trend
    let percentChange: Double
    let unit: KPIUnit
    let category: KPICategory
    let priority: Int

    enum Trend: String, Codable {
        case up = "up"
        case down = "down"
        case stable = "stable"
    }

    enum KPIUnit: String, Codable {
        case currency = "currency"
        case percentage = "percentage"
        case number = "number"
        case decimal = "decimal"
        case mpg = "mpg"
        case years = "years"
    }

    enum KPICategory: String, Codable {
        case financial = "Financial"
        case operational = "Operational"
        case safety = "Safety"
        case compliance = "Compliance"
    }

    // Computed properties
    var formattedCurrentValue: String {
        formatValue(currentValue, unit: unit)
    }

    var formattedTargetValue: String {
        formatValue(targetValue, unit: unit)
    }

    var formattedPercentChange: String {
        let sign = percentChange >= 0 ? "+" : ""
        return String(format: "%@%.1f%%", sign, percentChange)
    }

    var isOnTarget: Bool {
        switch trend {
        case .up:
            return currentValue >= targetValue
        case .down:
            return currentValue <= targetValue
        case .stable:
            return abs(currentValue - targetValue) < (targetValue * 0.05)
        }
    }

    var statusColor: String {
        if isOnTarget {
            return "green"
        } else if abs(currentValue - targetValue) < (targetValue * 0.1) {
            return "yellow"
        } else {
            return "red"
        }
    }

    private func formatValue(_ value: Double, unit: KPIUnit) -> String {
        switch unit {
        case .currency:
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            formatter.currencyCode = "USD"
            formatter.maximumFractionDigits = 0
            return formatter.string(from: NSNumber(value: value)) ?? "$0"
        case .percentage:
            return String(format: "%.0f%%", value)
        case .number:
            return String(format: "%.0f", value)
        case .decimal:
            return String(format: "%.1f", value)
        case .mpg:
            return String(format: "%.1f MPG", value)
        case .years:
            return String(format: "%.1f years", value)
        }
    }
}

// MARK: - Trend Data
struct TrendData: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let dataPoints: [DataPoint]
    let category: String
    let color: String

    struct DataPoint: Codable, Equatable, Identifiable {
        let id: String
        let date: Date
        let value: Double
        let label: String?

        init(id: String = UUID().uuidString, date: Date, value: Double, label: String? = nil) {
            self.id = id
            self.date = date
            self.value = value
            self.label = label
        }
    }

    // Computed properties
    var minValue: Double {
        dataPoints.map { $0.value }.min() ?? 0
    }

    var maxValue: Double {
        dataPoints.map { $0.value }.max() ?? 0
    }

    var averageValue: Double {
        guard !dataPoints.isEmpty else { return 0 }
        let sum = dataPoints.reduce(0) { $0 + $1.value }
        return sum / Double(dataPoints.count)
    }

    var trend: KPI.Trend {
        guard dataPoints.count >= 2 else { return .stable }
        let recent = dataPoints.suffix(3).map { $0.value }
        let older = dataPoints.prefix(3).map { $0.value }

        let recentAvg = recent.reduce(0, +) / Double(recent.count)
        let olderAvg = older.reduce(0, +) / Double(older.count)

        let change = (recentAvg - olderAvg) / olderAvg

        if abs(change) < 0.05 {
            return .stable
        } else if change > 0 {
            return .up
        } else {
            return .down
        }
    }
}

// MARK: - Alert
struct ExecutiveAlert: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let message: String
    let severity: Severity
    let category: AlertCategory
    let timestamp: Date
    let affectedVehicles: Int?
    let estimatedCost: Double?
    let actionRequired: String
    let status: AlertStatus
    let department: String?

    enum Severity: String, Codable {
        case critical = "Critical"
        case high = "High"
        case medium = "Medium"
        case low = "Low"
    }

    enum AlertCategory: String, Codable {
        case budget = "Budget"
        case compliance = "Compliance"
        case safety = "Safety"
        case maintenance = "Maintenance"
        case operational = "Operational"
    }

    enum AlertStatus: String, Codable {
        case new = "New"
        case acknowledged = "Acknowledged"
        case inProgress = "In Progress"
        case resolved = "Resolved"
    }

    // Computed properties
    var formattedTimestamp: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }

    var formattedEstimatedCost: String? {
        guard let cost = estimatedCost else { return nil }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: cost))
    }

    var iconName: String {
        switch severity {
        case .critical:
            return "exclamationmark.triangle.fill"
        case .high:
            return "exclamationmark.circle.fill"
        case .medium:
            return "info.circle.fill"
        case .low:
            return "checkmark.circle.fill"
        }
    }

    var colorName: String {
        switch severity {
        case .critical:
            return "red"
        case .high:
            return "orange"
        case .medium:
            return "yellow"
        case .low:
            return "blue"
        }
    }
}

// MARK: - Department
struct Department: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let vehicleCount: Int
    let budget: Double
    let utilization: Double
    let monthlyCost: Double
    let safetyScore: Double
    let complianceScore: Double
    let manager: String
    let region: String

    // Computed properties
    var formattedBudget: String {
        formatCurrency(budget)
    }

    var formattedMonthlyCost: String {
        formatCurrency(monthlyCost)
    }

    var formattedUtilization: String {
        String(format: "%.0f%%", utilization)
    }

    var budgetStatus: BudgetStatus {
        let percentUsed = (monthlyCost / budget) * 100
        if percentUsed > 100 {
            return .overbudget
        } else if percentUsed > 90 {
            return .nearLimit
        } else {
            return .onTrack
        }
    }

    enum BudgetStatus {
        case overbudget
        case nearLimit
        case onTrack

        var color: String {
            switch self {
            case .overbudget: return "red"
            case .nearLimit: return "yellow"
            case .onTrack: return "green"
            }
        }

        var label: String {
            switch self {
            case .overbudget: return "Over Budget"
            case .nearLimit: return "Near Limit"
            case .onTrack: return "On Track"
            }
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$0"
    }
}

// MARK: - Dashboard Summary
struct DashboardSummary: Codable {
    let generatedAt: Date
    let periodStart: Date
    let periodEnd: Date
    let highlights: [String]
    let concerns: [String]
    let recommendations: [String]

    var formattedPeriod: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        let start = formatter.string(from: periodStart)
        let end = formatter.string(from: periodEnd)
        return "\(start) - \(end)"
    }
}

// MARK: - Filter Options
enum DashboardFilterPeriod: String, CaseIterable {
    case week = "Last 7 Days"
    case month = "Last 30 Days"
    case quarter = "Last Quarter"
    case year = "Last Year"
    case custom = "Custom Range"

    var days: Int {
        switch self {
        case .week: return 7
        case .month: return 30
        case .quarter: return 90
        case .year: return 365
        case .custom: return 0
        }
    }
}

enum DashboardFilterDepartment: String {
    case all = "All Departments"
    case operations = "Operations"
    case sales = "Sales"
    case maintenance = "Maintenance"
    case logistics = "Logistics"
}

enum DashboardFilterRegion: String {
    case all = "All Regions"
    case north = "North"
    case south = "South"
    case east = "East"
    case west = "West"
}
