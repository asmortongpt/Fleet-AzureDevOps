//
//  PredictiveMaintenance.swift
//  Fleet Manager
//
//  Predictive maintenance models with ML-based failure prediction
//

import Foundation
import SwiftUI

// MARK: - Maintenance Prediction
struct MaintenancePrediction: Codable, Identifiable, Equatable {
    let id: String
    let vehicleId: String
    let component: ComponentType
    let predictedFailureDate: Date
    let confidence: Double // 0.0 to 1.0
    let riskLevel: RiskLevel
    let currentHealth: Double // 0.0 to 100.0
    let degradationRate: Double // Health points per day
    let estimatedCost: Double
    let daysUntilFailure: Int
    let recommendedAction: MaintenanceAction
    let basedOnMileage: Double
    let basedOnAge: Int // Days since last replacement
    let historicalFailureCount: Int

    var confidencePercentage: Int {
        Int(confidence * 100)
    }

    var healthPercentage: Int {
        Int(currentHealth)
    }

    var isUrgent: Bool {
        riskLevel == .critical || daysUntilFailure < 7
    }

    var formattedFailureDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: predictedFailureDate)
    }
}

// MARK: - Component Type
enum ComponentType: String, Codable, CaseIterable {
    case battery
    case brakes
    case engine
    case transmission
    case tires
    case suspension
    case airFilter
    case oilFilter
    case sparkPlugs
    case coolantSystem
    case fuelSystem
    case exhaust
    case alternator
    case starter
    case belts

    var displayName: String {
        switch self {
        case .battery: return "Battery"
        case .brakes: return "Brake System"
        case .engine: return "Engine"
        case .transmission: return "Transmission"
        case .tires: return "Tires"
        case .suspension: return "Suspension"
        case .airFilter: return "Air Filter"
        case .oilFilter: return "Oil Filter"
        case .sparkPlugs: return "Spark Plugs"
        case .coolantSystem: return "Coolant System"
        case .fuelSystem: return "Fuel System"
        case .exhaust: return "Exhaust System"
        case .alternator: return "Alternator"
        case .starter: return "Starter Motor"
        case .belts: return "Drive Belts"
        }
    }

    var icon: String {
        switch self {
        case .battery: return "battery.100"
        case .brakes: return "brake.signal"
        case .engine: return "engine.combustion"
        case .transmission: return "gearshape.2"
        case .tires: return "circle.grid.cross"
        case .suspension: return "arrow.up.and.down"
        case .airFilter: return "wind"
        case .oilFilter: return "drop.fill"
        case .sparkPlugs: return "bolt.fill"
        case .coolantSystem: return "thermometer"
        case .fuelSystem: return "fuelpump.fill"
        case .exhaust: return "smoke.fill"
        case .alternator: return "bolt.circle"
        case .starter: return "power"
        case .belts: return "link"
        }
    }

    var category: ComponentCategory {
        switch self {
        case .battery, .alternator, .starter:
            return .electrical
        case .brakes, .tires, .suspension:
            return .safety
        case .engine, .transmission, .fuelSystem:
            return .powertrain
        case .airFilter, .oilFilter, .coolantSystem, .exhaust:
            return .maintenance
        case .sparkPlugs, .belts:
            return .consumable
        }
    }

    // Average lifespan in days
    var averageLifespanDays: Int {
        switch self {
        case .battery: return 1095 // 3 years
        case .brakes: return 730 // 2 years
        case .engine: return 3650 // 10 years
        case .transmission: return 2920 // 8 years
        case .tires: return 1095 // 3 years
        case .suspension: return 1825 // 5 years
        case .airFilter: return 180 // 6 months
        case .oilFilter: return 90 // 3 months
        case .sparkPlugs: return 730 // 2 years
        case .coolantSystem: return 1095 // 3 years
        case .fuelSystem: return 1825 // 5 years
        case .exhaust: return 1460 // 4 years
        case .alternator: return 1825 // 5 years
        case .starter: return 2190 // 6 years
        case .belts: return 730 // 2 years
        }
    }

    // Average cost to replace
    var averageReplacementCost: Double {
        switch self {
        case .battery: return 150
        case .brakes: return 400
        case .engine: return 4500
        case .transmission: return 3500
        case .tires: return 600
        case .suspension: return 1200
        case .airFilter: return 50
        case .oilFilter: return 30
        case .sparkPlugs: return 200
        case .coolantSystem: return 300
        case .fuelSystem: return 800
        case .exhaust: return 500
        case .alternator: return 600
        case .starter: return 400
        case .belts: return 150
        }
    }
}

// MARK: - Component Category
enum ComponentCategory: String, Codable {
    case electrical
    case safety
    case powertrain
    case maintenance
    case consumable

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Component Health
struct ComponentHealth: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let component: ComponentType
    var healthScore: Double // 0.0 to 100.0
    var lastInspectionDate: Date?
    var lastReplacementDate: Date?
    var lastReplacementMileage: Double?
    var currentMileage: Double
    var ageInDays: Int
    var issuesDetected: [String]
    var nextInspectionDate: Date?

    var healthStatus: HealthStatus {
        switch healthScore {
        case 80...100: return .excellent
        case 60..<80: return .good
        case 40..<60: return .fair
        case 20..<40: return .poor
        default: return .critical
        }
    }

    var statusColor: Color {
        healthStatus.color
    }
}

// MARK: - Health Status
enum HealthStatus: String, Codable {
    case excellent
    case good
    case fair
    case poor
    case critical

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .orange
        case .critical: return .red
        }
    }

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Risk Level
enum RiskLevel: String, Codable, CaseIterable {
    case low
    case moderate
    case high
    case critical

    var color: Color {
        switch self {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }

    var icon: String {
        switch self {
        case .low: return "checkmark.shield.fill"
        case .moderate: return "exclamationmark.shield.fill"
        case .high: return "exclamationmark.triangle.fill"
        case .critical: return "xmark.octagon.fill"
        }
    }

    var displayName: String {
        rawValue.capitalized
    }

    var priority: Int {
        switch self {
        case .critical: return 4
        case .high: return 3
        case .moderate: return 2
        case .low: return 1
        }
    }
}

// MARK: - Maintenance Action
enum MaintenanceAction: String, Codable {
    case inspect
    case service
    case replace
    case monitor

    var displayName: String {
        rawValue.capitalized
    }

    var icon: String {
        switch self {
        case .inspect: return "magnifyingglass"
        case .service: return "wrench.fill"
        case .replace: return "arrow.triangle.2.circlepath"
        case .monitor: return "eye.fill"
        }
    }
}

// MARK: - Failure Pattern
struct FailurePattern: Codable, Identifiable {
    let id: String
    let component: ComponentType
    let vehicleType: String?
    let mileageAtFailure: Double
    let ageAtFailureDays: Int
    let failureDate: Date
    let symptoms: [String]
    let rootCause: String?
    let repairCost: Double

    var mileageAtFailureFormatted: String {
        String(format: "%.0f mi", mileageAtFailure)
    }
}

// MARK: - Maintenance Recommendation
struct MaintenanceRecommendation: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let component: ComponentType
    let action: MaintenanceAction
    let priority: RiskLevel
    let scheduledDate: Date
    let estimatedCost: Double
    let estimatedDuration: Int // Minutes
    let description: String
    let benefits: [String]
    var isScheduled: Bool

    var formattedScheduledDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: scheduledDate)
    }

    var formattedCost: String {
        String(format: "$%.2f", estimatedCost)
    }

    var formattedDuration: String {
        if estimatedDuration < 60 {
            return "\(estimatedDuration) min"
        } else {
            let hours = estimatedDuration / 60
            let minutes = estimatedDuration % 60
            if minutes == 0 {
                return "\(hours)h"
            }
            return "\(hours)h \(minutes)m"
        }
    }
}

// MARK: - Trend Data
struct TrendData: Codable, Identifiable {
    let id: String
    let component: ComponentType
    let dataPoints: [TrendDataPoint]

    var latestHealth: Double? {
        dataPoints.last?.healthScore
    }

    var degradationRate: Double {
        guard dataPoints.count >= 2 else { return 0 }
        let first = dataPoints.first!
        let last = dataPoints.last!
        let healthChange = first.healthScore - last.healthScore
        let daysDiff = Calendar.current.dateComponents([.day], from: first.date, to: last.date).day ?? 1
        return healthChange / Double(max(daysDiff, 1))
    }

    var trend: TrendDirection {
        guard dataPoints.count >= 2 else { return .stable }
        let rate = degradationRate
        if rate > 0.5 { return .declining }
        if rate < -0.1 { return .improving }
        return .stable
    }
}

// MARK: - Trend Data Point
struct TrendDataPoint: Codable, Identifiable {
    let id: String
    let date: Date
    let healthScore: Double
    let mileage: Double
    let notes: String?
}

// MARK: - Trend Direction
enum TrendDirection: String {
    case improving
    case stable
    case declining

    var color: Color {
        switch self {
        case .improving: return .green
        case .stable: return .blue
        case .declining: return .red
        }
    }

    var icon: String {
        switch self {
        case .improving: return "arrow.up.right"
        case .stable: return "arrow.right"
        case .declining: return "arrow.down.right"
        }
    }
}

// MARK: - Cost Benefit Analysis
struct CostBenefitAnalysis: Codable {
    let componentType: ComponentType
    let costToRepairNow: Double
    let costToRepairLater: Double
    let downTimeRiskCost: Double
    let safetyRiskScore: Double // 0-10
    let recommendation: String

    var totalCostNow: Double {
        costToRepairNow
    }

    var totalCostLater: Double {
        costToRepairLater + downTimeRiskCost
    }

    var savings: Double {
        totalCostLater - totalCostNow
    }

    var shouldRepairNow: Bool {
        savings > 0 || safetyRiskScore > 5
    }
}

// MARK: - Prediction Summary
struct PredictionSummary: Codable {
    let vehicleId: String
    let totalPredictions: Int
    let criticalCount: Int
    let highRiskCount: Int
    let moderateRiskCount: Int
    let lowRiskCount: Int
    let totalEstimatedCost: Double
    let nextMaintenanceDate: Date?
    let overallVehicleHealth: Double // 0-100

    var hasUrgentIssues: Bool {
        criticalCount > 0 || highRiskCount > 0
    }

    var formattedTotalCost: String {
        String(format: "$%.2f", totalEstimatedCost)
    }
}

// MARK: - API Request/Response Models

struct PredictionRequest: Codable {
    let vehicleId: String
    let components: [ComponentType]?
    let includeHistorical: Bool
}

struct PredictionResponse: Codable {
    let predictions: [MaintenancePrediction]
    let summary: PredictionSummary
    let recommendations: [MaintenanceRecommendation]
    let trends: [TrendData]
}

struct ComponentHealthRequest: Codable {
    let vehicleId: String
    let component: ComponentType?
}

struct ComponentHealthResponse: Codable {
    let health: [ComponentHealth]
    let failurePatterns: [FailurePattern]
}

// MARK: - Export Models

struct PredictionReport: Codable {
    let generatedDate: Date
    let vehicleId: String
    let vehicleInfo: VehicleInfo
    let predictions: [MaintenancePrediction]
    let recommendations: [MaintenanceRecommendation]
    let summary: PredictionSummary
    let costBenefitAnalyses: [CostBenefitAnalysis]

    struct VehicleInfo: Codable {
        let number: String
        let make: String
        let model: String
        let year: Int
        let mileage: Double
        let vin: String
    }
}
