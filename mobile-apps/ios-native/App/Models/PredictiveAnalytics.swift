//
//  PredictiveAnalytics.swift
//  Fleet Manager
//
//  Predictive Analytics Models for maintenance, costs, and fleet optimization
//

import Foundation

// MARK: - Prediction Type Enum

enum PredictionType: String, Codable, CaseIterable {
    case maintenance = "Maintenance"
    case breakdown = "Breakdown"
    case cost = "Cost"
    case utilization = "Utilization"
    case driverBehavior = "Driver Behavior"

    var icon: String {
        switch self {
        case .maintenance:
            return "wrench.and.screwdriver.fill"
        case .breakdown:
            return "exclamationmark.triangle.fill"
        case .cost:
            return "dollarsign.circle.fill"
        case .utilization:
            return "gauge.with.dots.needle.67percent"
        case .driverBehavior:
            return "person.fill.checkmark"
        }
    }

    var color: String {
        switch self {
        case .maintenance:
            return "orange"
        case .breakdown:
            return "red"
        case .cost:
            return "green"
        case .utilization:
            return "blue"
        case .driverBehavior:
            return "purple"
        }
    }
}

// MARK: - Base Prediction Struct

struct Prediction: Identifiable, Codable, Equatable {
    let id: String
    let type: PredictionType
    let vehicleId: String?
    let vehicleNumber: String?
    let driverId: String?
    let driverName: String?
    let confidenceScore: Double // 0.0 to 1.0
    let predictedDate: Date
    let predictionValue: String
    let factors: [PredictionFactor]
    let recommendations: [String]
    let severity: PredictionSeverity
    let description: String
    let createdAt: Date
    let lastUpdated: Date

    var confidencePercentage: Int {
        Int(confidenceScore * 100)
    }

    var confidenceLevel: ConfidenceLevel {
        if confidenceScore >= 0.8 {
            return .high
        } else if confidenceScore >= 0.5 {
            return .medium
        } else {
            return .low
        }
    }

    var formattedPredictedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: predictedDate)
    }
}

// MARK: - Prediction Factor

struct PredictionFactor: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let value: String
    let weight: Double // 0.0 to 1.0
    let description: String?

    var weightPercentage: Int {
        Int(weight * 100)
    }
}

// MARK: - Prediction Severity

enum PredictionSeverity: String, Codable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    case critical = "Critical"

    var color: String {
        switch self {
        case .low:
            return "green"
        case .medium:
            return "yellow"
        case .high:
            return "orange"
        case .critical:
            return "red"
        }
    }

    var icon: String {
        switch self {
        case .low:
            return "checkmark.circle.fill"
        case .medium:
            return "exclamationmark.circle.fill"
        case .high:
            return "exclamationmark.triangle.fill"
        case .critical:
            return "exclamationmark.octagon.fill"
        }
    }
}

// MARK: - Confidence Level

enum ConfidenceLevel: String {
    case low = "Low"
    case medium = "Medium"
    case high = "High"

    var color: String {
        switch self {
        case .low:
            return "red"
        case .medium:
            return "yellow"
        case .high:
            return "green"
        }
    }
}

// MARK: - Maintenance Prediction

struct MaintenancePrediction: Identifiable, Codable, Equatable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let maintenanceType: String
    let predictedDate: Date
    let confidenceScore: Double
    let estimatedCost: Double
    let currentMileage: Double
    let predictedMileage: Double
    let lastServiceDate: Date?
    let daysSinceLastService: Int?
    let factors: [PredictionFactor]
    let urgency: PredictionSeverity
    let recommendedActions: [String]

    var formattedEstimatedCost: String {
        String(format: "$%.2f", estimatedCost)
    }

    var formattedMileage: String {
        String(format: "%.0f mi", predictedMileage)
    }
}

// MARK: - Breakdown Prediction

struct BreakdownPrediction: Identifiable, Codable, Equatable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let predictedDate: Date
    let confidenceScore: Double
    let riskScore: Double // 0.0 to 1.0
    let potentialCause: String
    let affectedComponent: String
    let factors: [PredictionFactor]
    let preventiveMeasures: [String]
    let severity: PredictionSeverity

    var riskPercentage: Int {
        Int(riskScore * 100)
    }
}

// MARK: - Cost Prediction

struct CostPrediction: Identifiable, Codable, Equatable {
    let id: String
    let vehicleId: String?
    let vehicleNumber: String?
    let period: TimePeriod
    let predictedTotalCost: Double
    let costBreakdown: CostBreakdown
    let confidenceScore: Double
    let factors: [PredictionFactor]
    let comparisonToPrevious: Double // Percentage change
    let recommendations: [String]

    var formattedTotalCost: String {
        String(format: "$%.2f", predictedTotalCost)
    }

    var formattedComparison: String {
        let sign = comparisonToPrevious >= 0 ? "+" : ""
        return String(format: "%@%.1f%%", sign, comparisonToPrevious)
    }

    var isIncreasing: Bool {
        comparisonToPrevious > 0
    }
}

// MARK: - Cost Breakdown

struct CostBreakdown: Codable, Equatable {
    let maintenance: Double
    let fuel: Double
    let insurance: Double
    let registration: Double
    let repairs: Double
    let other: Double

    var total: Double {
        maintenance + fuel + insurance + registration + repairs + other
    }
}

// MARK: - Time Period

enum TimePeriod: String, Codable, CaseIterable {
    case week = "Week"
    case month = "Month"
    case quarter = "Quarter"
    case year = "Year"
}

// MARK: - Utilization Prediction

struct UtilizationPrediction: Identifiable, Codable, Equatable {
    let id: String
    let vehicleId: String?
    let vehicleNumber: String?
    let period: TimePeriod
    let predictedUtilizationRate: Double // 0.0 to 1.0
    let predictedMileage: Double
    let predictedActiveHours: Double
    let confidenceScore: Double
    let factors: [PredictionFactor]
    let recommendations: [String]
    let isUnderutilized: Bool
    let isOverutilized: Bool

    var utilizationPercentage: Int {
        Int(predictedUtilizationRate * 100)
    }

    var formattedUtilization: String {
        String(format: "%.0f%%", predictedUtilizationRate * 100)
    }

    var utilizationStatus: String {
        if isOverutilized {
            return "Overutilized"
        } else if isUnderutilized {
            return "Underutilized"
        } else {
            return "Optimal"
        }
    }

    var statusColor: String {
        if isOverutilized {
            return "red"
        } else if isUnderutilized {
            return "yellow"
        } else {
            return "green"
        }
    }
}

// MARK: - Driver Behavior Prediction

struct DriverBehaviorPrediction: Identifiable, Codable, Equatable {
    let id: String
    let driverId: String
    let driverName: String
    let period: TimePeriod
    let predictedSafetyScore: Double // 0.0 to 100.0
    let predictedIncidentRisk: Double // 0.0 to 1.0
    let confidenceScore: Double
    let behaviorTrends: [BehaviorTrend]
    let factors: [PredictionFactor]
    let recommendations: [String]
    let severity: PredictionSeverity

    var formattedSafetyScore: String {
        String(format: "%.1f", predictedSafetyScore)
    }

    var riskLevel: String {
        if predictedIncidentRisk >= 0.7 {
            return "High Risk"
        } else if predictedIncidentRisk >= 0.4 {
            return "Moderate Risk"
        } else {
            return "Low Risk"
        }
    }

    var riskColor: String {
        if predictedIncidentRisk >= 0.7 {
            return "red"
        } else if predictedIncidentRisk >= 0.4 {
            return "orange"
        } else {
            return "green"
        }
    }
}

// MARK: - Behavior Trend

struct BehaviorTrend: Identifiable, Codable, Equatable {
    let id: String
    let metric: String
    let currentValue: Double
    let predictedValue: Double
    let changePercentage: Double
    let isImproving: Bool

    var formattedChange: String {
        let sign = changePercentage >= 0 ? "+" : ""
        return String(format: "%@%.1f%%", sign, changePercentage)
    }
}

// MARK: - Prediction Summary

struct PredictionSummary: Codable {
    let totalPredictions: Int
    let highConfidencePredictions: Int
    let criticalPredictions: Int
    let upcomingMaintenanceCount: Int
    let breakdownRiskCount: Int
    let averageConfidence: Double
    let lastGeneratedDate: Date

    var formattedAverageConfidence: String {
        String(format: "%.0f%%", averageConfidence * 100)
    }
}

// MARK: - API Request/Response Models

struct GeneratePredictionRequest: Codable {
    let predictionType: PredictionType
    let vehicleId: String?
    let driverId: String?
    let period: TimePeriod?
}

struct PredictionsResponse: Codable {
    let predictions: [Prediction]
    let summary: PredictionSummary
    let timestamp: Date
}
