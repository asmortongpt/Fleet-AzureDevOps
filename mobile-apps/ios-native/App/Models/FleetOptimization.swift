import Foundation

// MARK: - Optimization Goal
public enum OptimizationGoal: String, Codable, CaseIterable, Identifiable {
    case reduceCosts = "reduce_costs"
    case improveUtilization = "improve_utilization"
    case minimizeDowntime = "minimize_downtime"
    case reduceEmissions = "reduce_emissions"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .reduceCosts:
            return "Reduce Costs"
        case .improveUtilization:
            return "Improve Utilization"
        case .minimizeDowntime:
            return "Minimize Downtime"
        case .reduceEmissions:
            return "Reduce Emissions"
        }
    }

    public var icon: String {
        switch self {
        case .reduceCosts:
            return "dollarsign.circle.fill"
        case .improveUtilization:
            return "chart.line.uptrend.xyaxis"
        case .minimizeDowntime:
            return "wrench.and.screwdriver.fill"
        case .reduceEmissions:
            return "leaf.fill"
        }
    }

    public var description: String {
        switch self {
        case .reduceCosts:
            return "Minimize total cost of ownership and operational expenses"
        case .improveUtilization:
            return "Maximize vehicle usage and eliminate idle time"
        case .minimizeDowntime:
            return "Reduce maintenance delays and improve availability"
        case .reduceEmissions:
            return "Lower carbon footprint and environmental impact"
        }
    }
}

// MARK: - Fleet Metrics
public struct FleetMetrics: Codable, Equatable {
    public let totalVehicles: Int
    public let activeVehicles: Int
    public let utilizationRate: Double // 0.0 to 1.0
    public let costPerMile: Double
    public let costPerVehicle: Double
    public let downtimePercentage: Double // 0.0 to 1.0
    public let emissionsPerMile: Double // kg CO2
    public let totalMileage: Double
    public let totalCosts: Double
    public let avgMaintenanceCost: Double
    public let avgFuelCost: Double
    public let idleTimePercentage: Double // 0.0 to 1.0
    public let optimalFleetSize: Int
    public let excessVehicles: Int
    public let underutilizedVehicles: Int

    public var utilizationPercentage: Int {
        Int(utilizationRate * 100)
    }

    public var downtimePercentageInt: Int {
        Int(downtimePercentage * 100)
    }

    public var idleTimePercentageInt: Int {
        Int(idleTimePercentage * 100)
    }

    public var efficiencyScore: Double {
        // Weighted score: 40% utilization, 30% downtime, 30% cost efficiency
        let utilizationScore = utilizationRate * 0.4
        let downtimeScore = (1.0 - downtimePercentage) * 0.3
        let costScore = min(1.0, 1.0 / max(costPerMile, 0.1)) * 0.3
        return (utilizationScore + downtimeScore + costScore) * 100
    }

    public init(
        totalVehicles: Int,
        activeVehicles: Int,
        utilizationRate: Double,
        costPerMile: Double,
        costPerVehicle: Double,
        downtimePercentage: Double,
        emissionsPerMile: Double,
        totalMileage: Double,
        totalCosts: Double,
        avgMaintenanceCost: Double,
        avgFuelCost: Double,
        idleTimePercentage: Double,
        optimalFleetSize: Int,
        excessVehicles: Int,
        underutilizedVehicles: Int
    ) {
        self.totalVehicles = totalVehicles
        self.activeVehicles = activeVehicles
        self.utilizationRate = utilizationRate
        self.costPerMile = costPerMile
        self.costPerVehicle = costPerVehicle
        self.downtimePercentage = downtimePercentage
        self.emissionsPerMile = emissionsPerMile
        self.totalMileage = totalMileage
        self.totalCosts = totalCosts
        self.avgMaintenanceCost = avgMaintenanceCost
        self.avgFuelCost = avgFuelCost
        self.idleTimePercentage = idleTimePercentage
        self.optimalFleetSize = optimalFleetSize
        self.excessVehicles = excessVehicles
        self.underutilizedVehicles = underutilizedVehicles
    }
}

// MARK: - Recommendation Type
public enum RecommendationType: String, Codable, CaseIterable {
    case retireVehicle = "retire_vehicle"
    case reassignVehicle = "reassign_vehicle"
    case adjustMaintenance = "adjust_maintenance"
    case consolidateRoutes = "consolidate_routes"
    case replaceVehicle = "replace_vehicle"
    case addVehicle = "add_vehicle"
    case optimizeScheduling = "optimize_scheduling"
    case reduceFuelConsumption = "reduce_fuel_consumption"
    case preventiveMaintenance = "preventive_maintenance"
    case driverTraining = "driver_training"

    public var displayName: String {
        switch self {
        case .retireVehicle:
            return "Retire Vehicle"
        case .reassignVehicle:
            return "Reassign Vehicle"
        case .adjustMaintenance:
            return "Adjust Maintenance Schedule"
        case .consolidateRoutes:
            return "Consolidate Routes"
        case .replaceVehicle:
            return "Replace Vehicle"
        case .addVehicle:
            return "Add Vehicle"
        case .optimizeScheduling:
            return "Optimize Scheduling"
        case .reduceFuelConsumption:
            return "Reduce Fuel Consumption"
        case .preventiveMaintenance:
            return "Preventive Maintenance"
        case .driverTraining:
            return "Driver Training"
        }
    }

    public var icon: String {
        switch self {
        case .retireVehicle:
            return "xmark.circle.fill"
        case .reassignVehicle:
            return "arrow.triangle.2.circlepath"
        case .adjustMaintenance:
            return "calendar.badge.clock"
        case .consolidateRoutes:
            return "map.fill"
        case .replaceVehicle:
            return "arrow.triangle.swap"
        case .addVehicle:
            return "plus.circle.fill"
        case .optimizeScheduling:
            return "calendar.badge.checkmark"
        case .reduceFuelConsumption:
            return "fuelpump.fill"
        case .preventiveMaintenance:
            return "wrench.and.screwdriver.fill"
        case .driverTraining:
            return "person.fill.checkmark"
        }
    }
}

// MARK: - Recommendation Priority
public enum RecommendationPriority: String, Codable, CaseIterable {
    case critical
    case high
    case medium
    case low

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: String {
        switch self {
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

    public var sortOrder: Int {
        switch self {
        case .critical:
            return 0
        case .high:
            return 1
        case .medium:
            return 2
        case .low:
            return 3
        }
    }
}

// MARK: - Optimization Recommendation
public struct OptimizationRecommendation: Codable, Identifiable, Equatable {
    public let id: String
    public let type: RecommendationType
    public let title: String
    public let description: String
    public let estimatedSavings: Double
    public let priority: RecommendationPriority
    public let implementationSteps: [String]
    public let affectedVehicles: [String] // Vehicle IDs
    public let timeframe: String // "Immediate", "1 week", "1 month", etc.
    public let confidence: Double // 0.0 to 1.0
    public var implemented: Bool
    public let createdAt: Date
    public let metadata: [String: String]?

    public var savingsFormatted: String {
        "$\(String(format: "%.0f", estimatedSavings))"
    }

    public var confidencePercentage: Int {
        Int(confidence * 100)
    }

    public init(
        id: String = UUID().uuidString,
        type: RecommendationType,
        title: String,
        description: String,
        estimatedSavings: Double,
        priority: RecommendationPriority,
        implementationSteps: [String],
        affectedVehicles: [String],
        timeframe: String,
        confidence: Double,
        implemented: Bool = false,
        createdAt: Date = Date(),
        metadata: [String: String]? = nil
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.description = description
        self.estimatedSavings = estimatedSavings
        self.priority = priority
        self.implementationSteps = implementationSteps
        self.affectedVehicles = affectedVehicles
        self.timeframe = timeframe
        self.confidence = confidence
        self.implemented = implemented
        self.createdAt = createdAt
        self.metadata = metadata
    }
}

// MARK: - Utilization Analysis
public struct UtilizationAnalysis: Codable, Equatable {
    public let vehicleId: String
    public let vehicleNumber: String
    public let dailyUtilization: [DailyUtilization]
    public let weeklyUtilization: [WeeklyUtilization]
    public let monthlyUtilization: [MonthlyUtilization]
    public let averageUtilization: Double // 0.0 to 1.0
    public let peakUtilization: Double
    public let lowUtilization: Double
    public let totalHoursAvailable: Double
    public let totalHoursUsed: Double
    public let idleHours: Double

    public var averageUtilizationPercentage: Int {
        Int(averageUtilization * 100)
    }

    public var utilizationStatus: UtilizationStatus {
        switch averageUtilization {
        case 0..<0.30:
            return .veryLow
        case 0.30..<0.50:
            return .low
        case 0.50..<0.75:
            return .moderate
        case 0.75..<0.90:
            return .good
        default:
            return .excellent
        }
    }

    public init(
        vehicleId: String,
        vehicleNumber: String,
        dailyUtilization: [DailyUtilization],
        weeklyUtilization: [WeeklyUtilization],
        monthlyUtilization: [MonthlyUtilization],
        averageUtilization: Double,
        peakUtilization: Double,
        lowUtilization: Double,
        totalHoursAvailable: Double,
        totalHoursUsed: Double,
        idleHours: Double
    ) {
        self.vehicleId = vehicleId
        self.vehicleNumber = vehicleNumber
        self.dailyUtilization = dailyUtilization
        self.weeklyUtilization = weeklyUtilization
        self.monthlyUtilization = monthlyUtilization
        self.averageUtilization = averageUtilization
        self.peakUtilization = peakUtilization
        self.lowUtilization = lowUtilization
        self.totalHoursAvailable = totalHoursAvailable
        self.totalHoursUsed = totalHoursUsed
        self.idleHours = idleHours
    }
}

// MARK: - Utilization Status
public enum UtilizationStatus: String, Codable {
    case veryLow = "very_low"
    case low
    case moderate
    case good
    case excellent

    public var displayName: String {
        switch self {
        case .veryLow:
            return "Very Low"
        case .low:
            return "Low"
        case .moderate:
            return "Moderate"
        case .good:
            return "Good"
        case .excellent:
            return "Excellent"
        }
    }

    public var color: String {
        switch self {
        case .veryLow:
            return "red"
        case .low:
            return "orange"
        case .moderate:
            return "yellow"
        case .good:
            return "green"
        case .excellent:
            return "blue"
        }
    }
}

// MARK: - Daily Utilization
public struct DailyUtilization: Codable, Identifiable, Equatable {
    public let id: String
    public let date: Date
    public let hoursUsed: Double
    public let hoursAvailable: Double

    public var utilization: Double {
        guard hoursAvailable > 0 else { return 0 }
        return hoursUsed / hoursAvailable
    }

    public var utilizationPercentage: Int {
        Int(utilization * 100)
    }

    public init(id: String = UUID().uuidString, date: Date, hoursUsed: Double, hoursAvailable: Double) {
        self.id = id
        self.date = date
        self.hoursUsed = hoursUsed
        self.hoursAvailable = hoursAvailable
    }
}

// MARK: - Weekly Utilization
public struct WeeklyUtilization: Codable, Identifiable, Equatable {
    public let id: String
    public let weekStart: Date
    public let weekEnd: Date
    public let hoursUsed: Double
    public let hoursAvailable: Double
    public let avgDailyUtilization: Double

    public var utilization: Double {
        guard hoursAvailable > 0 else { return 0 }
        return hoursUsed / hoursAvailable
    }

    public var utilizationPercentage: Int {
        Int(utilization * 100)
    }

    public init(
        id: String = UUID().uuidString,
        weekStart: Date,
        weekEnd: Date,
        hoursUsed: Double,
        hoursAvailable: Double,
        avgDailyUtilization: Double
    ) {
        self.id = id
        self.weekStart = weekStart
        self.weekEnd = weekEnd
        self.hoursUsed = hoursUsed
        self.hoursAvailable = hoursAvailable
        self.avgDailyUtilization = avgDailyUtilization
    }
}

// MARK: - Monthly Utilization
public struct MonthlyUtilization: Codable, Identifiable, Equatable {
    public let id: String
    public let month: Date
    public let hoursUsed: Double
    public let hoursAvailable: Double
    public let avgWeeklyUtilization: Double

    public var utilization: Double {
        guard hoursAvailable > 0 else { return 0 }
        return hoursUsed / hoursAvailable
    }

    public var utilizationPercentage: Int {
        Int(utilization * 100)
    }

    public init(
        id: String = UUID().uuidString,
        month: Date,
        hoursUsed: Double,
        hoursAvailable: Double,
        avgWeeklyUtilization: Double
    ) {
        self.id = id
        self.month = month
        self.hoursUsed = hoursUsed
        self.hoursAvailable = hoursAvailable
        self.avgWeeklyUtilization = avgWeeklyUtilization
    }
}

// MARK: - API Request Models
public struct OptimizationRequest: Codable {
    public let goal: OptimizationGoal
    public let timeframe: String?
    public let constraints: [String: String]?

    public init(goal: OptimizationGoal, timeframe: String? = nil, constraints: [String: String]? = nil) {
        self.goal = goal
        self.timeframe = timeframe
        self.constraints = constraints
    }
}

// MARK: - API Response Models
public struct OptimizationResponse: Codable {
    public let metrics: FleetMetrics
    public let recommendations: [OptimizationRecommendation]
    public let utilizationAnalysis: [UtilizationAnalysis]
    public let timestamp: Date

    public init(
        metrics: FleetMetrics,
        recommendations: [OptimizationRecommendation],
        utilizationAnalysis: [UtilizationAnalysis],
        timestamp: Date = Date()
    ) {
        self.metrics = metrics
        self.recommendations = recommendations
        self.utilizationAnalysis = utilizationAnalysis
        self.timestamp = timestamp
    }
}
