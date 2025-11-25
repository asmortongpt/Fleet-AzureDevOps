//
//  Cost.swift
//  Fleet Manager
//
//  Complete cost tracking models for TCO, cost per mile, and budget analysis
//

import Foundation

// MARK: - Cost Category
enum CostCategory: String, Codable, CaseIterable {
    case fuel = "Fuel"
    case maintenance = "Maintenance"
    case insurance = "Insurance"
    case registration = "Registration"
    case depreciation = "Depreciation"
    case lease = "Lease/Financing"
    case parking = "Parking & Tolls"
    case labor = "Labor"
    case tires = "Tires"
    case other = "Other"

    var icon: String {
        switch self {
        case .fuel: return "fuelpump.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
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
        case .insurance: return "purple"
        case .registration: return "green"
        case .depreciation: return "red"
        case .lease: return "indigo"
        case .parking: return "cyan"
        case .labor: return "pink"
        case .tires: return "brown"
        case .other: return "gray"
        }
    }
}

// MARK: - Cost Record
struct CostRecord: Codable, Identifiable, Equatable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let department: String
    let category: CostCategory
    let amount: Double
    let date: Date
    let odometer: Double?
    let vendor: String?
    let invoiceNumber: String?
    let description: String?
    let receiptImageUrl: String?
    var receiptImageData: Data?
    let createdBy: String
    let createdAt: Date

    var formattedAmount: String {
        String(format: "$%.2f", amount)
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case department
        case category
        case amount
        case date
        case odometer
        case vendor
        case invoiceNumber = "invoice_number"
        case description
        case receiptImageUrl = "receipt_image_url"
        case createdBy = "created_by"
        case createdAt = "created_at"
    }

    static var sample: CostRecord {
        CostRecord(
            id: UUID().uuidString,
            vehicleId: "VEH-001",
            vehicleNumber: "V-12345",
            department: "Operations",
            category: .fuel,
            amount: 125.50,
            date: Date(),
            odometer: 45230,
            vendor: "Shell Station",
            invoiceNumber: "INV-2025-001",
            description: "Regular fuel fill-up",
            receiptImageUrl: nil,
            createdBy: "John Doe",
            createdAt: Date()
        )
    }
}

// MARK: - Total Cost of Ownership (TCO)
struct TotalCostOfOwnership: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let make: String
    let model: String
    let year: Int
    let purchaseDate: Date
    let purchasePrice: Double
    let currentValue: Double
    let totalMileage: Double
    let totalHours: Double?

    // Cost breakdowns
    let fuelCosts: Double
    let maintenanceCosts: Double
    let insuranceCosts: Double
    let registrationCosts: Double
    let depreciationCosts: Double
    let leaseCosts: Double
    let parkingCosts: Double
    let laborCosts: Double
    let tireCosts: Double
    let otherCosts: Double

    // Calculated properties
    var totalCosts: Double {
        fuelCosts + maintenanceCosts + insuranceCosts + registrationCosts +
        depreciationCosts + leaseCosts + parkingCosts + laborCosts + tireCosts + otherCosts
    }

    var costPerMile: Double {
        guard totalMileage > 0 else { return 0 }
        return totalCosts / totalMileage
    }

    var costPerHour: Double? {
        guard let hours = totalHours, hours > 0 else { return nil }
        return totalCosts / hours
    }

    var costPerDay: Double {
        let daysOwned = Calendar.current.dateComponents([.day], from: purchaseDate, to: Date()).day ?? 1
        guard daysOwned > 0 else { return 0 }
        return totalCosts / Double(daysOwned)
    }

    var costPerMonth: Double {
        let monthsOwned = Calendar.current.dateComponents([.month], from: purchaseDate, to: Date()).month ?? 1
        guard monthsOwned > 0 else { return 0 }
        return totalCosts / Double(monthsOwned)
    }

    var depreciationRate: Double {
        guard purchasePrice > 0 else { return 0 }
        return ((purchasePrice - currentValue) / purchasePrice) * 100
    }

    var categoryBreakdown: [CostCategoryBreakdown] {
        [
            CostCategoryBreakdown(category: .fuel, amount: fuelCosts, percentage: (fuelCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .maintenance, amount: maintenanceCosts, percentage: (maintenanceCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .insurance, amount: insuranceCosts, percentage: (insuranceCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .registration, amount: registrationCosts, percentage: (registrationCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .depreciation, amount: depreciationCosts, percentage: (depreciationCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .lease, amount: leaseCosts, percentage: (leaseCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .parking, amount: parkingCosts, percentage: (parkingCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .labor, amount: laborCosts, percentage: (laborCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .tires, amount: tireCosts, percentage: (tireCosts / totalCosts) * 100),
            CostCategoryBreakdown(category: .other, amount: otherCosts, percentage: (otherCosts / totalCosts) * 100)
        ].filter { $0.amount > 0 }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case make, model, year
        case purchaseDate = "purchase_date"
        case purchasePrice = "purchase_price"
        case currentValue = "current_value"
        case totalMileage = "total_mileage"
        case totalHours = "total_hours"
        case fuelCosts = "fuel_costs"
        case maintenanceCosts = "maintenance_costs"
        case insuranceCosts = "insurance_costs"
        case registrationCosts = "registration_costs"
        case depreciationCosts = "depreciation_costs"
        case leaseCosts = "lease_costs"
        case parkingCosts = "parking_costs"
        case laborCosts = "labor_costs"
        case tireCosts = "tire_costs"
        case otherCosts = "other_costs"
    }
}

// MARK: - Cost Category Breakdown
struct CostCategoryBreakdown: Identifiable {
    let id = UUID()
    let category: CostCategory
    let amount: Double
    let percentage: Double

    var formattedAmount: String {
        String(format: "$%.2f", amount)
    }

    var formattedPercentage: String {
        String(format: "%.1f%%", percentage)
    }
}

// MARK: - Department Cost Summary
struct DepartmentCostSummary: Codable, Identifiable {
    let id: String
    let department: String
    let vehicleCount: Int
    let totalCosts: Double
    let averageCostPerVehicle: Double
    let totalMileage: Double
    let costPerMile: Double
    let categoryBreakdown: [String: Double]

    var formattedTotalCosts: String {
        String(format: "$%.2f", totalCosts)
    }

    var formattedCostPerMile: String {
        String(format: "$%.3f/mi", costPerMile)
    }

    enum CodingKeys: String, CodingKey {
        case id, department
        case vehicleCount = "vehicle_count"
        case totalCosts = "total_costs"
        case averageCostPerVehicle = "average_cost_per_vehicle"
        case totalMileage = "total_mileage"
        case costPerMile = "cost_per_mile"
        case categoryBreakdown = "category_breakdown"
    }
}

// MARK: - Budget
struct Budget: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let department: String?
    let vehicleId: String?
    let category: CostCategory?
    let period: BudgetPeriod
    let startDate: Date
    let endDate: Date
    let allocatedAmount: Double
    var spentAmount: Double
    var projectedAmount: Double
    let createdBy: String
    let createdAt: Date
    var updatedAt: Date

    var remainingAmount: Double {
        allocatedAmount - spentAmount
    }

    var percentageUsed: Double {
        guard allocatedAmount > 0 else { return 0 }
        return (spentAmount / allocatedAmount) * 100
    }

    var percentageProjected: Double {
        guard allocatedAmount > 0 else { return 0 }
        return (projectedAmount / allocatedAmount) * 100
    }

    var variance: Double {
        allocatedAmount - spentAmount
    }

    var variancePercentage: Double {
        guard allocatedAmount > 0 else { return 0 }
        return (variance / allocatedAmount) * 100
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

    var daysRemaining: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: endDate).day ?? 0
    }

    var dailyBurnRate: Double {
        let daysElapsed = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 1
        guard daysElapsed > 0 else { return 0 }
        return spentAmount / Double(daysElapsed)
    }

    var projectedOverage: Double {
        max(0, projectedAmount - allocatedAmount)
    }

    enum CodingKeys: String, CodingKey {
        case id, name, department
        case vehicleId = "vehicle_id"
        case category, period
        case startDate = "start_date"
        case endDate = "end_date"
        case allocatedAmount = "allocated_amount"
        case spentAmount = "spent_amount"
        case projectedAmount = "projected_amount"
        case createdBy = "created_by"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Budget Period
enum BudgetPeriod: String, Codable, CaseIterable {
    case monthly = "Monthly"
    case quarterly = "Quarterly"
    case yearly = "Yearly"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .monthly: return "calendar"
        case .quarterly: return "calendar.badge.clock"
        case .yearly: return "calendar.circle"
        case .custom: return "calendar.badge.plus"
        }
    }
}

// MARK: - Budget Status
enum BudgetStatus: String {
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

// MARK: - Cost Trend
struct CostTrend: Codable, Identifiable {
    let id = UUID()
    let period: String
    let date: Date
    let totalCost: Double
    let fuelCost: Double
    let maintenanceCost: Double
    let otherCost: Double
    let mileage: Double
    let costPerMile: Double

    enum CodingKeys: String, CodingKey {
        case period, date
        case totalCost = "total_cost"
        case fuelCost = "fuel_cost"
        case maintenanceCost = "maintenance_cost"
        case otherCost = "other_cost"
        case mileage
        case costPerMile = "cost_per_mile"
    }
}

// MARK: - Cost Analytics Summary
struct CostAnalyticsSummary: Codable {
    let totalFleetCosts: Double
    let averageCostPerVehicle: Double
    let totalCostPerMile: Double
    let totalCostPerHour: Double?
    let yearToDateCosts: Double
    let monthToDateCosts: Double
    let topCostCategory: CostCategory
    let costTrends: [CostTrend]
    let departmentSummaries: [DepartmentCostSummary]
    let budgetSummaries: [BudgetSummary]

    var formattedTotalCosts: String {
        String(format: "$%.2f", totalFleetCosts)
    }

    var formattedCostPerMile: String {
        String(format: "$%.3f/mi", totalCostPerMile)
    }

    enum CodingKeys: String, CodingKey {
        case totalFleetCosts = "total_fleet_costs"
        case averageCostPerVehicle = "average_cost_per_vehicle"
        case totalCostPerMile = "total_cost_per_mile"
        case totalCostPerHour = "total_cost_per_hour"
        case yearToDateCosts = "ytd_costs"
        case monthToDateCosts = "mtd_costs"
        case topCostCategory = "top_cost_category"
        case costTrends = "cost_trends"
        case departmentSummaries = "department_summaries"
        case budgetSummaries = "budget_summaries"
    }
}

// MARK: - Budget Summary
struct BudgetSummary: Codable, Identifiable {
    let id: String
    let name: String
    let allocatedAmount: Double
    let spentAmount: Double
    let percentageUsed: Double
    let status: BudgetStatus
    let category: CostCategory?

    enum CodingKeys: String, CodingKey {
        case id, name
        case allocatedAmount = "allocated_amount"
        case spentAmount = "spent_amount"
        case percentageUsed = "percentage_used"
        case status, category
    }
}

// MARK: - Vehicle Cost Comparison
struct VehicleCostComparison: Identifiable {
    let id: String
    let vehicleNumber: String
    let make: String
    let model: String
    let totalCosts: Double
    let costPerMile: Double
    let costPerHour: Double?
    let rank: Int

    var formattedTotalCosts: String {
        String(format: "$%.2f", totalCosts)
    }

    var formattedCostPerMile: String {
        String(format: "$%.3f/mi", costPerMile)
    }
}

// MARK: - API Response Models
struct CostRecordsResponse: Codable {
    let costs: [CostRecord]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct TCOResponse: Codable {
    let tco: TotalCostOfOwnership
}

struct CostAnalyticsResponse: Codable {
    let analytics: CostAnalyticsSummary
    let dateRange: DateInterval

    enum CodingKeys: String, CodingKey {
        case analytics
        case dateRange = "date_range"
    }
}

struct BudgetsResponse: Codable {
    let budgets: [Budget]
    let total: Int
}

struct DepartmentCostsResponse: Codable {
    let departments: [DepartmentCostSummary]
    let total: Int
}
