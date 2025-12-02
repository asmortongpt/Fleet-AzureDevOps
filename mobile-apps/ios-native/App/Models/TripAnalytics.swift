//
//  TripAnalytics.swift
//  Fleet Manager
//
//  Advanced Trip Analytics Models with ML Pattern Recognition
//  Features: Statistics, Patterns, Anomalies, Driver Behavior
//

import Foundation
import CoreLocation

// MARK: - Trip Statistics

struct TripStatistics: Codable, Equatable {
    let distanceStats: DistanceStatistics
    let durationStats: DurationStatistics
    let speedStats: SpeedStatistics
    let fuelEfficiency: FuelEfficiencyStats
    let periodStart: Date
    let periodEnd: Date
    let totalTrips: Int

    struct DistanceStatistics: Codable, Equatable {
        let total: Double
        let average: Double
        let median: Double
        let min: Double
        let max: Double
        let standardDeviation: Double

        var formattedTotal: String {
            String(format: "%.1f mi", total)
        }

        var formattedAverage: String {
            String(format: "%.1f mi", average)
        }
    }

    struct DurationStatistics: Codable, Equatable {
        let total: TimeInterval
        let average: TimeInterval
        let median: TimeInterval
        let min: TimeInterval
        let max: TimeInterval
        let standardDeviation: Double

        var formattedTotal: String {
            formatDuration(total)
        }

        var formattedAverage: String {
            formatDuration(average)
        }

        private func formatDuration(_ duration: TimeInterval) -> String {
            let hours = Int(duration) / 3600
            let minutes = (Int(duration) % 3600) / 60
            if hours > 0 {
                return "\(hours)h \(minutes)m"
            } else {
                return "\(minutes)m"
            }
        }
    }

    struct SpeedStatistics: Codable, Equatable {
        let average: Double
        let median: Double
        let max: Double
        let standardDeviation: Double
        let speedingEvents: Int
        let avgSpeedingDuration: TimeInterval

        var formattedAverage: String {
            String(format: "%.1f mph", average)
        }

        var formattedMax: String {
            String(format: "%.1f mph", max)
        }
    }

    struct FuelEfficiencyStats: Codable, Equatable {
        let avgMPG: Double
        let totalFuelUsed: Double
        let totalCost: Double
        let costPerMile: Double
        let bestMPG: Double
        let worstMPG: Double

        var formattedAvgMPG: String {
            String(format: "%.1f mpg", avgMPG)
        }

        var formattedCostPerMile: String {
            String(format: "$%.2f/mi", costPerMile)
        }

        var formattedTotalCost: String {
            String(format: "$%.2f", totalCost)
        }
    }
}

// MARK: - Trip Patterns

struct TripPattern: Identifiable, Codable {
    let id: String
    let patternType: PatternType
    let frequency: Int
    let confidence: Double
    let locations: [PatternLocation]
    let peakHours: [Int]
    let dayOfWeekDistribution: [Int: Int]
    let averageDistance: Double
    let averageDuration: TimeInterval
    let lastOccurrence: Date

    enum PatternType: String, Codable, CaseIterable {
        case recurringRoute = "Recurring Route"
        case commonDestination = "Common Destination"
        case routineCommute = "Routine Commute"
        case deliveryRoute = "Delivery Route"
        case serviceRoute = "Service Route"

        var icon: String {
            switch self {
            case .recurringRoute: return "arrow.triangle.2.circlepath"
            case .commonDestination: return "mappin.circle.fill"
            case .routineCommute: return "car.fill"
            case .deliveryRoute: return "shippingbox.fill"
            case .serviceRoute: return "wrench.fill"
            }
        }

        var color: String {
            switch self {
            case .recurringRoute: return "blue"
            case .commonDestination: return "green"
            case .routineCommute: return "purple"
            case .deliveryRoute: return "orange"
            case .serviceRoute: return "red"
            }
        }
    }

    struct PatternLocation: Codable {
        let coordinate: CLLocationCoordinate2D
        let address: String
        let frequency: Int
        let isStartLocation: Bool
        let isEndLocation: Bool
    }

    var confidenceLevel: String {
        switch confidence {
        case 0.8...1.0: return "High"
        case 0.5..<0.8: return "Medium"
        default: return "Low"
        }
    }

    var formattedFrequency: String {
        if frequency == 1 {
            return "Once"
        } else if frequency < 10 {
            return "\(frequency) times"
        } else {
            return "\(frequency)+ times"
        }
    }

    var peakHoursFormatted: String {
        let hours = peakHours.sorted()
        if hours.isEmpty { return "N/A" }
        if hours.count == 1 { return formatHour(hours[0]) }
        return "\(formatHour(hours.first!)) - \(formatHour(hours.last!))"
    }

    private func formatHour(_ hour: Int) -> String {
        let period = hour < 12 ? "AM" : "PM"
        let displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour)
        return "\(displayHour)\(period)"
    }
}

// MARK: - Trip Comparison

struct TripComparison: Codable {
    let currentPeriod: TripStatistics
    let previousPeriod: TripStatistics
    let changes: ComparisonChanges

    struct ComparisonChanges: Codable {
        let distanceChange: PercentageChange
        let durationChange: PercentageChange
        let fuelEfficiencyChange: PercentageChange
        let tripCountChange: PercentageChange
        let costChange: PercentageChange

        var hasImprovement: Bool {
            fuelEfficiencyChange.value > 0 || costChange.value < 0
        }

        var overallTrend: Trend {
            let positiveChanges = [
                fuelEfficiencyChange.value > 0,
                costChange.value < 0
            ].filter { $0 }.count

            if positiveChanges >= 1 {
                return .improving
            } else if positiveChanges == 0 && costChange.value > 0 {
                return .declining
            } else {
                return .stable
            }
        }
    }

    struct PercentageChange: Codable {
        let value: Double
        let trend: Trend

        var formatted: String {
            let sign = value >= 0 ? "+" : ""
            return "\(sign)\(String(format: "%.1f", value))%"
        }

        var color: String {
            switch trend {
            case .improving: return "green"
            case .declining: return "red"
            case .stable: return "gray"
            }
        }
    }

    enum Trend: String, Codable {
        case improving = "Improving"
        case declining = "Declining"
        case stable = "Stable"

        var icon: String {
            switch self {
            case .improving: return "arrow.up.circle.fill"
            case .declining: return "arrow.down.circle.fill"
            case .stable: return "arrow.left.arrow.right.circle.fill"
            }
        }
    }
}

// MARK: - Trip Anomaly Detection

struct TripAnomaly: Identifiable, Codable {
    let id: String
    let tripId: String
    let type: AnomalyType
    let severity: Severity
    let detectedAt: Date
    let description: String
    let zScore: Double
    let threshold: Double
    let actualValue: Double
    let expectedValue: Double
    let location: CLLocationCoordinate2D?
    let recommendations: [String]

    enum AnomalyType: String, Codable, CaseIterable {
        case unusualSpeed = "Unusual Speed"
        case routeDeviation = "Route Deviation"
        case excessiveIdling = "Excessive Idling"
        case unauthorizedStop = "Unauthorized Stop"
        case abnormalFuelConsumption = "Abnormal Fuel Consumption"
        case unexpectedDistance = "Unexpected Distance"
        case unusualDuration = "Unusual Duration"
        case afterHoursUsage = "After Hours Usage"

        var icon: String {
            switch self {
            case .unusualSpeed: return "speedometer"
            case .routeDeviation: return "arrow.triangle.branch"
            case .excessiveIdling: return "pause.circle.fill"
            case .unauthorizedStop: return "stop.circle.fill"
            case .abnormalFuelConsumption: return "fuelpump.fill"
            case .unexpectedDistance: return "ruler.fill"
            case .unusualDuration: return "clock.fill"
            case .afterHoursUsage: return "moon.fill"
            }
        }
    }

    enum Severity: String, Codable, CaseIterable {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
        case critical = "Critical"

        var color: String {
            switch self {
            case .low: return "yellow"
            case .medium: return "orange"
            case .high: return "red"
            case .critical: return "purple"
            }
        }

        var priority: Int {
            switch self {
            case .low: return 1
            case .medium: return 2
            case .high: return 3
            case .critical: return 4
            }
        }
    }

    var deviationPercentage: Double {
        guard expectedValue > 0 else { return 0 }
        return ((actualValue - expectedValue) / expectedValue) * 100
    }

    var formattedDeviation: String {
        String(format: "%.1f%%", abs(deviationPercentage))
    }
}

// MARK: - Driver Behavior

struct DriverBehavior: Identifiable, Codable {
    let id: String
    let driverId: String
    let driverName: String
    let periodStart: Date
    let periodEnd: Date
    let overallScore: Double
    let acceleration: BehaviorMetric
    let braking: BehaviorMetric
    let cornering: BehaviorMetric
    let speeding: BehaviorMetric
    let idling: BehaviorMetric
    let totalEvents: Int
    let safetyRating: SafetyRating
    let trends: BehaviorTrends
    let recommendations: [String]

    struct BehaviorMetric: Codable {
        let score: Double
        let eventCount: Int
        let severity: String
        let trend: TripComparison.Trend

        var formattedScore: String {
            String(format: "%.0f", score)
        }

        var scoreColor: String {
            switch score {
            case 80...100: return "green"
            case 60..<80: return "yellow"
            case 40..<60: return "orange"
            default: return "red"
            }
        }
    }

    struct BehaviorTrends: Codable {
        let scoreTrend: [DateScore]
        let eventCountTrend: [DateCount]
        let improvementRate: Double

        struct DateScore: Codable, Identifiable {
            let id = UUID()
            let date: Date
            let score: Double
        }

        struct DateCount: Codable, Identifiable {
            let id = UUID()
            let date: Date
            let count: Int
        }
    }

    enum SafetyRating: String, Codable {
        case excellent = "Excellent"
        case good = "Good"
        case fair = "Fair"
        case poor = "Poor"
        case critical = "Critical"

        var color: String {
            switch self {
            case .excellent: return "green"
            case .good: return "blue"
            case .fair: return "yellow"
            case .poor: return "orange"
            case .critical: return "red"
            }
        }

        var icon: String {
            switch self {
            case .excellent: return "star.fill"
            case .good: return "hand.thumbsup.fill"
            case .fair: return "minus.circle.fill"
            case .poor: return "exclamationmark.triangle.fill"
            case .critical: return "xmark.octagon.fill"
            }
        }

        static func from(score: Double) -> SafetyRating {
            switch score {
            case 90...100: return .excellent
            case 75..<90: return .good
            case 60..<75: return .fair
            case 40..<60: return .poor
            default: return .critical
            }
        }
    }

    var formattedOverallScore: String {
        String(format: "%.0f/100", overallScore)
    }

    var scoreColor: String {
        switch overallScore {
        case 80...100: return "green"
        case 60..<80: return "yellow"
        case 40..<60: return "orange"
        default: return "red"
        }
    }
}

// MARK: - Analytics Response

struct TripAnalyticsResponse: Codable {
    let statistics: TripStatistics
    let patterns: [TripPattern]
    let anomalies: [TripAnomaly]
    let driverBehavior: [DriverBehavior]
    let comparison: TripComparison?
    let generatedAt: Date
}

// MARK: - Analytics Filter

struct AnalyticsFilter: Codable {
    var dateRange: DateRange
    var vehicleIds: [String]?
    var driverIds: [String]?
    var includePatterns: Bool
    var includeAnomalies: Bool
    var includeBehavior: Bool
    var anomalySeverity: TripAnomaly.Severity?
    var comparisonPeriod: ComparisonPeriod?

    enum ComparisonPeriod: String, Codable, CaseIterable {
        case previousWeek = "Previous Week"
        case previousMonth = "Previous Month"
        case previousQuarter = "Previous Quarter"
        case previousYear = "Previous Year"

        func calculatePreviousPeriod(from dateRange: DateRange) -> DateRange {
            let calendar = Calendar.current
            let duration = dateRange.end.timeIntervalSince(dateRange.start)

            switch self {
            case .previousWeek:
                let start = calendar.date(byAdding: .weekOfYear, value: -1, to: dateRange.start)!
                return DateRange(start: start, end: start.addingTimeInterval(duration))
            case .previousMonth:
                let start = calendar.date(byAdding: .month, value: -1, to: dateRange.start)!
                return DateRange(start: start, end: start.addingTimeInterval(duration))
            case .previousQuarter:
                let start = calendar.date(byAdding: .month, value: -3, to: dateRange.start)!
                return DateRange(start: start, end: start.addingTimeInterval(duration))
            case .previousYear:
                let start = calendar.date(byAdding: .year, value: -1, to: dateRange.start)!
                return DateRange(start: start, end: start.addingTimeInterval(duration))
            }
        }
    }

    static var `default`: AnalyticsFilter {
        AnalyticsFilter(
            dateRange: DateRange(
                start: Calendar.current.date(byAdding: .month, value: -1, to: Date())!,
                end: Date()
            ),
            vehicleIds: nil,
            driverIds: nil,
            includePatterns: true,
            includeAnomalies: true,
            includeBehavior: true,
            anomalySeverity: nil,
            comparisonPeriod: .previousMonth
        )
    }
}

// MARK: - Array Extensions for Statistics

extension Array where Element == Double {
    var average: Double {
        guard !isEmpty else { return 0 }
        return reduce(0, +) / Double(count)
    }

    var median: Double {
        guard !isEmpty else { return 0 }
        let sorted = self.sorted()
        let mid = count / 2
        if count % 2 == 0 {
            return (sorted[mid - 1] + sorted[mid]) / 2
        } else {
            return sorted[mid]
        }
    }

    var standardDeviation: Double {
        guard count > 1 else { return 0 }
        let avg = average
        let variance = map { pow($0 - avg, 2) }.reduce(0, +) / Double(count - 1)
        return sqrt(variance)
    }
}

extension Array where Element == TimeInterval {
    var average: TimeInterval {
        guard !isEmpty else { return 0 }
        return reduce(0, +) / Double(count)
    }

    var median: TimeInterval {
        guard !isEmpty else { return 0 }
        let sorted = self.sorted()
        let mid = count / 2
        if count % 2 == 0 {
            return (sorted[mid - 1] + sorted[mid]) / 2
        } else {
            return sorted[mid]
        }
    }
}
