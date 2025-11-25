//
//  EnvironmentalImpact.swift
//  Fleet Manager
//
//  Environmental Impact Tracking Models
//  Emissions, sustainability metrics, and carbon footprint calculations
//

import Foundation

// MARK: - Emissions Data
public struct EmissionsData: Codable, Identifiable, Equatable {
    public let id: String
    public let vehicleId: String
    public let vehicleNumber: String
    public let period: DatePeriod
    public let co2Emissions: Double // kg
    public let noxEmissions: Double // kg
    public let pm25Emissions: Double // kg
    public let fuelConsumed: Double // gallons
    public let fuelType: FuelType
    public let distanceTraveled: Double // miles
    public let idleTime: Double // hours
    public let totalRuntime: Double // hours

    // Computed properties
    public var emissionsPerMile: Double {
        guard distanceTraveled > 0 else { return 0 }
        return co2Emissions / distanceTraveled
    }

    public var idlePercentage: Double {
        guard totalRuntime > 0 else { return 0 }
        return (idleTime / totalRuntime) * 100
    }

    public var mpg: Double {
        guard fuelConsumed > 0 else { return 0 }
        return distanceTraveled / fuelConsumed
    }
}

// MARK: - Fuel Type Extension
extension FuelType {
    // EPA emission factors (kg CO2 per gallon)
    public var co2EmissionFactor: Double {
        switch self {
        case .gasoline: return 8.887
        case .diesel: return 10.180
        case .electric: return 0.0
        case .hybrid: return 6.665
        case .cng: return 6.376
        case .propane: return 5.675
        }
    }

    // NOx emission factors (kg per gallon)
    public var noxEmissionFactor: Double {
        switch self {
        case .gasoline: return 0.0095
        case .diesel: return 0.0284
        case .electric: return 0.0
        case .hybrid: return 0.0071
        case .cng: return 0.0047
        case .propane: return 0.0053
        }
    }

    // PM2.5 emission factors (kg per gallon)
    public var pm25EmissionFactor: Double {
        switch self {
        case .gasoline: return 0.0007
        case .diesel: return 0.0024
        case .electric: return 0.0
        case .hybrid: return 0.0005
        case .cng: return 0.0001
        case .propane: return 0.0002
        }
    }

    public var sustainabilityScore: Double {
        switch self {
        case .electric: return 100.0
        case .hybrid: return 75.0
        case .cng: return 65.0
        case .propane: return 60.0
        case .gasoline: return 40.0
        case .diesel: return 35.0
        }
    }
}

// MARK: - Date Period
public struct DatePeriod: Codable, Equatable {
    public let startDate: Date
    public let endDate: Date

    public var displayString: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return "\(formatter.string(from: startDate)) - \(formatter.string(from: endDate))"
    }

    public var durationInDays: Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: startDate, to: endDate)
        return components.day ?? 0
    }
}

// MARK: - Carbon Footprint
public struct CarbonFootprint: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let period: DatePeriod
    public let totalCO2Emissions: Double // kg
    public let totalNOxEmissions: Double // kg
    public let totalPM25Emissions: Double // kg
    public let totalFuelConsumed: Double // gallons
    public let totalDistanceTraveled: Double // miles
    public let vehicleCount: Int
    public let offsetCredits: Double // kg CO2 offset
    public let netImpact: Double // kg CO2

    // Computed properties
    public var emissionsPerVehicle: Double {
        guard vehicleCount > 0 else { return 0 }
        return totalCO2Emissions / Double(vehicleCount)
    }

    public var averageMPG: Double {
        guard totalFuelConsumed > 0 else { return 0 }
        return totalDistanceTraveled / totalFuelConsumed
    }

    public var offsetPercentage: Double {
        guard totalCO2Emissions > 0 else { return 0 }
        return (offsetCredits / totalCO2Emissions) * 100
    }
}

// MARK: - Sustainability Metrics
public struct SustainabilityMetrics: Codable, Identifiable, Equatable {
    public let id: String
    public let vehicleId: String
    public let vehicleNumber: String
    public let vehicleType: VehicleType
    public let fuelType: FuelType
    public let year: Int
    public let mpg: Double
    public let emissionsPerMile: Double // kg CO2 per mile
    public let idleTimePercentage: Double
    public let totalCO2: Double // kg
    public let totalMiles: Double
    public let sustainabilityScore: Double // 0-100

    public var scoreColor: String {
        switch sustainabilityScore {
        case 80...100: return "green"
        case 60..<80: return "yellow"
        case 40..<60: return "orange"
        default: return "red"
        }
    }

    public var scoreCategory: String {
        switch sustainabilityScore {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        case 20..<40: return "Poor"
        default: return "Critical"
        }
    }
}

// MARK: - Emission Report
public struct EmissionReport: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let reportType: ReportType
    public let period: DatePeriod
    public let generatedDate: Date
    public let totalCO2: Double // kg
    public let totalNOx: Double // kg
    public let totalPM25: Double // kg
    public let totalFuel: Double // gallons
    public let totalDistance: Double // miles
    public let vehicleBreakdown: [VehicleEmissions]
    public let fuelTypeBreakdown: [FuelTypeEmissions]
    public let trends: EmissionTrends
    public let recommendations: [String]

    public var averageEmissionsPerMile: Double {
        guard totalDistance > 0 else { return 0 }
        return totalCO2 / totalDistance
    }
}

// MARK: - Report Type
public enum ReportType: String, Codable, CaseIterable {
    case daily
    case weekly
    case monthly
    case quarterly
    case yearly
    case custom

    public var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Vehicle Emissions
public struct VehicleEmissions: Codable, Identifiable, Equatable {
    public let id: String
    public let vehicleNumber: String
    public let vehicleType: VehicleType
    public let fuelType: FuelType
    public let co2: Double // kg
    public let nox: Double // kg
    public let pm25: Double // kg
    public let distance: Double // miles
    public let fuel: Double // gallons

    public var mpg: Double {
        guard fuel > 0 else { return 0 }
        return distance / fuel
    }
}

// MARK: - Fuel Type Emissions
public struct FuelTypeEmissions: Codable, Identifiable, Equatable {
    public let id: String
    public let fuelType: FuelType
    public let vehicleCount: Int
    public let totalCO2: Double // kg
    public let totalFuel: Double // gallons
    public let totalDistance: Double // miles
    public let percentage: Double // percentage of total emissions

    public var averageMPG: Double {
        guard totalFuel > 0 else { return 0 }
        return totalDistance / totalFuel
    }
}

// MARK: - Emission Trends
public struct EmissionTrends: Codable, Equatable {
    public let co2Trend: TrendData
    public let fuelTrend: TrendData
    public let mpgTrend: TrendData
    public let idleTimeTrend: TrendData

    public var overallTrend: TrendDirection {
        // Lower emissions and idle time is better
        let co2Direction = co2Trend.direction == .down ? 1 : -1
        let idleDirection = idleTimeTrend.direction == .down ? 1 : -1
        // Higher MPG is better
        let mpgDirection = mpgTrend.direction == .up ? 1 : 0

        let score = co2Direction + idleDirection + mpgDirection

        if score > 0 { return .up }
        if score < 0 { return .down }
        return .stable
    }
}

// MARK: - Trend Data
public struct TrendData: Codable, Equatable {
    public let currentValue: Double
    public let previousValue: Double
    public let percentageChange: Double
    public let direction: TrendDirection

    public var isImproving: Bool {
        // For emissions and idle time, down is good
        // For MPG, up is good
        return direction == .down || direction == .stable
    }
}

// MARK: - Trend Direction
public enum TrendDirection: String, Codable {
    case up
    case down
    case stable

    public var icon: String {
        switch self {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .stable: return "arrow.right"
        }
    }

    public var color: String {
        switch self {
        case .up: return "red"
        case .down: return "green"
        case .stable: return "gray"
        }
    }
}

// MARK: - Offset Program
public struct OffsetProgram: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let name: String
    public let description: String
    public let provider: String
    public let purchaseDate: Date
    public let co2Offset: Double // kg CO2 offset
    public let cost: Double
    public let certificateUrl: String?
    public let status: OffsetStatus

    public var costPerTon: Double {
        let tons = co2Offset / 1000.0
        guard tons > 0 else { return 0 }
        return cost / tons
    }
}

// MARK: - Offset Status
public enum OffsetStatus: String, Codable {
    case active
    case pending
    case verified
    case expired

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: String {
        switch self {
        case .active, .verified: return "green"
        case .pending: return "orange"
        case .expired: return "gray"
        }
    }
}

// MARK: - Industry Benchmark
public struct IndustryBenchmark: Codable, Equatable {
    public let category: String
    public let averageMPG: Double
    public let averageEmissionsPerMile: Double // kg CO2
    public let averageIdlePercentage: Double
    public let year: Int

    public func comparison(with metrics: SustainabilityMetrics) -> BenchmarkComparison {
        return BenchmarkComparison(
            mpgDifference: metrics.mpg - averageMPG,
            emissionsDifference: metrics.emissionsPerMile - averageEmissionsPerMile,
            idleTimeDifference: metrics.idleTimePercentage - averageIdlePercentage
        )
    }
}

// MARK: - Benchmark Comparison
public struct BenchmarkComparison: Codable, Equatable {
    public let mpgDifference: Double
    public let emissionsDifference: Double
    public let idleTimeDifference: Double

    public var performanceSummary: String {
        var summary = ""

        if mpgDifference > 0 {
            summary += "Above average MPG. "
        } else if mpgDifference < 0 {
            summary += "Below average MPG. "
        }

        if emissionsDifference < 0 {
            summary += "Lower than average emissions. "
        } else if emissionsDifference > 0 {
            summary += "Higher than average emissions. "
        }

        if idleTimeDifference < 0 {
            summary += "Better than average idle time."
        } else if idleTimeDifference > 0 {
            summary += "Higher than average idle time."
        }

        return summary.isEmpty ? "On par with industry average" : summary
    }
}

// MARK: - API Response Models
public struct EmissionsDataResponse: Codable {
    public let emissions: [EmissionsData]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct CarbonFootprintResponse: Codable {
    public let footprint: CarbonFootprint
}

public struct SustainabilityMetricsResponse: Codable {
    public let metrics: [SustainabilityMetrics]
    public let total: Int
}

public struct EmissionReportResponse: Codable {
    public let report: EmissionReport
}

public struct OffsetProgramsResponse: Codable {
    public let programs: [OffsetProgram]
    public let totalOffset: Double
    public let totalCost: Double
}
