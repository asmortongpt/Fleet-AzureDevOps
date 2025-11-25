//
//  BudgetPlanning.swift
//  Fleet Manager
//
//  Comprehensive budget planning models with variance analysis and forecasting
//

import Foundation

// MARK: - Budget Category
enum BudgetCategory: String, Codable, CaseIterable, Identifiable {
    case fuel = "Fuel"
    case maintenance = "Maintenance"
    case repairs = "Repairs"
    case insurance = "Insurance"
    case registration = "Registration"
    case depreciation = "Depreciation"
    case lease = "Lease/Financing"
    case parking = "Parking & Tolls"
    case labor = "Labor"
    case tires = "Tires"
    case other = "Other"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .fuel: return "fuelpump.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .repairs: return "hammer.fill"
        case .insurance: return "shield.checkered"
        case .registration: return "doc.text.fill"
        case .depreciation: return "chart.line.downtrend.xyaxis"
        case .lease: return "dollarsign.circle.fill"
        case .parking: return "parkingsign.circle.fill"
        case .labor: return "person.2.fill"
        case .tires: return "circle.grid.cross.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }

    var color: String {
        switch self {
        case .fuel: return "orange"
        case .maintenance: return "blue"
        case .repairs: return "red"
        case .insurance: return "purple"
        case .registration: return "green"
        case .depreciation: return "pink"
        case .lease: return "indigo"
        case .parking: return "cyan"
        case .labor: return "yellow"
        case .tires: return "brown"
        case .other: return "gray"
        }
    }
}

// MARK: - Budget Period
enum BudgetPeriod: String, Codable, CaseIterable, Identifiable {
    case monthly = "Monthly"
    case quarterly = "Quarterly"
    case annual = "Annual"
    case custom = "Custom"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .monthly: return "calendar"
        case .quarterly: return "calendar.badge.clock"
        case .annual: return "calendar.circle"
        case .custom: return "calendar.badge.plus"
        }
    }

    var months: Int {
        switch self {
        case .monthly: return 1
        case .quarterly: return 3
        case .annual: return 12
        case .custom: return 0
        }
    }
}

// MARK: - Variance Status
enum VarianceStatus: String, Codable {
    case favorable = "Favorable"
    case unfavorable = "Unfavorable"
    case neutral = "Neutral"

    var color: String {
        switch self {
        case .favorable: return "green"
        case .unfavorable: return "red"
        case .neutral: return "gray"
        }
    }

    var icon: String {
        switch self {
        case .favorable: return "arrow.down.circle.fill"
        case .unfavorable: return "arrow.up.circle.fill"
        case .neutral: return "minus.circle.fill"
        }
    }
}

// MARK: - Budget Plan
struct BudgetPlan: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let fiscalYear: Int
    let startDate: Date
    let endDate: Date
    let period: BudgetPeriod
    let totalAllocated: Double
    var totalSpent: Double
    var totalProjected: Double
    let categories: [BudgetAllocation]
    let department: String?
    let vehicleId: String?
    let createdBy: String
    let createdAt: Date
    var updatedAt: Date
    let isActive: Bool

    var percentageUsed: Double {
        guard totalAllocated > 0 else { return 0 }
        return (totalSpent / totalAllocated) * 100
    }

    var percentageProjected: Double {
        guard totalAllocated > 0 else { return 0 }
        return (totalProjected / totalAllocated) * 100
    }

    var remaining: Double {
        totalAllocated - totalSpent
    }

    var variance: Double {
        totalAllocated - totalSpent
    }

    var variancePercentage: Double {
        guard totalAllocated > 0 else { return 0 }
        return (variance / totalAllocated) * 100
    }

    var status: BudgetStatus {
        if percentageUsed >= 100 {
            return .overBudget
        } else if percentageUsed >= 90 {
            return .critical
        } else if percentageUsed >= 75 {
            return .warning
        } else {
            return .onTrack
        }
    }

    var projectedOverage: Double {
        max(0, totalProjected - totalAllocated)
    }

    var daysElapsed: Int {
        Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
    }

    var daysRemaining: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: endDate).day ?? 0
    }

    var totalDays: Int {
        Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 1
    }

    var dailyBurnRate: Double {
        guard daysElapsed > 0 else { return 0 }
        return totalSpent / Double(daysElapsed)
    }

    var projectedDailyBurnRate: Double {
        guard totalDays > 0 else { return 0 }
        return totalProjected / Double(totalDays)
    }

    enum CodingKeys: String, CodingKey {
        case id, name
        case fiscalYear = "fiscal_year"
        case startDate = "start_date"
        case endDate = "end_date"
        case period
        case totalAllocated = "total_allocated"
        case totalSpent = "total_spent"
        case totalProjected = "total_projected"
        case categories, department
        case vehicleId = "vehicle_id"
        case createdBy = "created_by"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case isActive = "is_active"
    }
}

// MARK: - Budget Allocation
struct BudgetAllocation: Codable, Identifiable, Equatable {
    let id: String
    let category: BudgetCategory
    let allocatedAmount: Double
    var spentAmount: Double
    var projectedAmount: Double
    let percentage: Double

    var remaining: Double {
        allocatedAmount - spentAmount
    }

    var percentageUsed: Double {
        guard allocatedAmount > 0 else { return 0 }
        return (spentAmount / allocatedAmount) * 100
    }

    var variance: Double {
        allocatedAmount - spentAmount
    }

    var variancePercentage: Double {
        guard allocatedAmount > 0 else { return 0 }
        return (variance / allocatedAmount) * 100
    }

    var varianceStatus: VarianceStatus {
        if abs(variance) < 100 {
            return .neutral
        }
        return variance >= 0 ? .favorable : .unfavorable
    }

    var formattedAllocated: String {
        String(format: "$%.2f", allocatedAmount)
    }

    var formattedSpent: String {
        String(format: "$%.2f", spentAmount)
    }

    var formattedRemaining: String {
        String(format: "$%.2f", remaining)
    }

    var formattedPercentage: String {
        String(format: "%.1f%%", percentage)
    }

    enum CodingKeys: String, CodingKey {
        case id, category
        case allocatedAmount = "allocated_amount"
        case spentAmount = "spent_amount"
        case projectedAmount = "projected_amount"
        case percentage
    }
}

// MARK: - Budget Variance
struct BudgetVariance: Codable, Identifiable {
    let id: String
    let budgetId: String
    let category: BudgetCategory
    let period: String
    let actual: Double
    let budgeted: Double
    let variance: Double
    let variancePercentage: Double
    let status: VarianceStatus
    let date: Date

    var formattedActual: String {
        String(format: "$%.2f", actual)
    }

    var formattedBudgeted: String {
        String(format: "$%.2f", budgeted)
    }

    var formattedVariance: String {
        String(format: "$%.2f", abs(variance))
    }

    var formattedVariancePercentage: String {
        String(format: "%.1f%%", abs(variancePercentage))
    }

    var isOverBudget: Bool {
        actual > budgeted
    }

    enum CodingKeys: String, CodingKey {
        case id
        case budgetId = "budget_id"
        case category, period, actual, budgeted, variance
        case variancePercentage = "variance_percentage"
        case status, date
    }
}

// MARK: - Forecast Data
struct ForecastData: Codable, Identifiable {
    let id: String
    let budgetId: String
    let category: BudgetCategory?
    let period: String
    let date: Date
    let projectedAmount: Double
    let confidenceLevel: Double
    let baselineAmount: Double
    let trendFactor: Double
    let seasonalFactor: Double

    var formattedProjected: String {
        String(format: "$%.2f", projectedAmount)
    }

    var formattedConfidence: String {
        String(format: "%.0f%%", confidenceLevel * 100)
    }

    var confidenceLevel_: String {
        if confidenceLevel >= 0.8 {
            return "High"
        } else if confidenceLevel >= 0.6 {
            return "Medium"
        } else {
            return "Low"
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case budgetId = "budget_id"
        case category, period, date
        case projectedAmount = "projected_amount"
        case confidenceLevel = "confidence_level"
        case baselineAmount = "baseline_amount"
        case trendFactor = "trend_factor"
        case seasonalFactor = "seasonal_factor"
    }
}

// MARK: - Budget Status
enum BudgetStatus: String, Codable {
    case onTrack = "On Track"
    case warning = "Warning"
    case critical = "Critical"
    case overBudget = "Over Budget"

    var color: String {
        switch self {
        case .onTrack: return "green"
        case .warning: return "yellow"
        case .critical: return "orange"
        case .overBudget: return "red"
        }
    }

    var icon: String {
        switch self {
        case .onTrack: return "checkmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .critical: return "exclamationmark.triangle.fill"
        case .overBudget: return "xmark.circle.fill"
        }
    }
}

// MARK: - Budget Metrics
struct BudgetMetrics: Codable {
    let totalBudget: Double
    let totalSpent: Double
    let remaining: Double
    let percentageUsed: Double
    let variance: Double
    let variancePercentage: Double
    let projectedTotal: Double
    let projectedVariance: Double
    let dailyBurnRate: Double
    let daysRemaining: Int

    var formattedTotalBudget: String {
        String(format: "$%.2f", totalBudget)
    }

    var formattedTotalSpent: String {
        String(format: "$%.2f", totalSpent)
    }

    var formattedRemaining: String {
        String(format: "$%.2f", remaining)
    }

    var formattedVariance: String {
        String(format: "$%.2f", abs(variance))
    }

    var formattedProjectedTotal: String {
        String(format: "$%.2f", projectedTotal)
    }

    var formattedDailyBurnRate: String {
        String(format: "$%.2f/day", dailyBurnRate)
    }

    var isOverBudget: Bool {
        percentageUsed >= 100
    }

    var isAtRisk: Bool {
        percentageUsed >= 75
    }

    enum CodingKeys: String, CodingKey {
        case totalBudget = "total_budget"
        case totalSpent = "total_spent"
        case remaining
        case percentageUsed = "percentage_used"
        case variance
        case variancePercentage = "variance_percentage"
        case projectedTotal = "projected_total"
        case projectedVariance = "projected_variance"
        case dailyBurnRate = "daily_burn_rate"
        case daysRemaining = "days_remaining"
    }
}

// MARK: - Budget Template
struct BudgetTemplate: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let period: BudgetPeriod
    let categories: [BudgetAllocation]
    let isDefault: Bool
    let createdBy: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description, period, categories
        case isDefault = "is_default"
        case createdBy = "created_by"
        case createdAt = "created_at"
    }
}

// MARK: - API Response Models
struct BudgetPlansResponse: Codable {
    let budgets: [BudgetPlan]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct BudgetPlanResponse: Codable {
    let budget: BudgetPlan
}

struct BudgetVariancesResponse: Codable {
    let variances: [BudgetVariance]
    let total: Int
}

struct BudgetForecastResponse: Codable {
    let forecasts: [ForecastData]
    let budgetId: String
    let generatedAt: Date

    enum CodingKeys: String, CodingKey {
        case forecasts
        case budgetId = "budget_id"
        case generatedAt = "generated_at"
    }
}

struct BudgetMetricsResponse: Codable {
    let metrics: BudgetMetrics
    let budgetId: String

    enum CodingKeys: String, CodingKey {
        case metrics
        case budgetId = "budget_id"
    }
}

struct BudgetTemplatesResponse: Codable {
    let templates: [BudgetTemplate]
    let total: Int
}
