//
//  Benchmark.swift
//  Fleet Manager - iOS Native App
//
//  Benchmarking Models
//  Industry comparison and performance metrics
//

import Foundation
import SwiftUI

// MARK: - Benchmark Category
enum BenchmarkCategory: String, CaseIterable, Codable {
    case fuelEfficiency = "fuel_efficiency"
    case maintenanceCost = "maintenance_cost"
    case utilization = "utilization"
    case safety = "safety"
    case emissions = "emissions"

    var displayName: String {
        switch self {
        case .fuelEfficiency:
            return "Fuel Efficiency"
        case .maintenanceCost:
            return "Maintenance Cost"
        case .utilization:
            return "Vehicle Utilization"
        case .safety:
            return "Safety Performance"
        case .emissions:
            return "Emissions & Sustainability"
        }
    }

    var icon: String {
        switch self {
        case .fuelEfficiency:
            return "fuelpump.fill"
        case .maintenanceCost:
            return "wrench.and.screwdriver.fill"
        case .utilization:
            return "gauge.with.dots.needle.67percent"
        case .safety:
            return "shield.checkered"
        case .emissions:
            return "leaf.fill"
        }
    }

    var color: Color {
        switch self {
        case .fuelEfficiency:
            return .blue
        case .maintenanceCost:
            return .orange
        case .utilization:
            return .purple
        case .safety:
            return .red
        case .emissions:
            return .green
        }
    }

    var unit: String {
        switch self {
        case .fuelEfficiency:
            return "MPG"
        case .maintenanceCost:
            return "$/Mile"
        case .utilization:
            return "%"
        case .safety:
            return "Score"
        case .emissions:
            return "kg CO₂/Mile"
        }
    }
}

// MARK: - Percentile Rank
enum PercentileRank: String, Codable {
    case top10 = "top_10"
    case top25 = "top_25"
    case average = "average"
    case belowAverage = "below_average"

    var displayName: String {
        switch self {
        case .top10:
            return "Top 10%"
        case .top25:
            return "Top 25%"
        case .average:
            return "Average"
        case .belowAverage:
            return "Below Average"
        }
    }

    var color: Color {
        switch self {
        case .top10:
            return .green
        case .top25:
            return .blue
        case .average:
            return .orange
        case .belowAverage:
            return .red
        }
    }

    var icon: String {
        switch self {
        case .top10:
            return "star.fill"
        case .top25:
            return "arrow.up.circle.fill"
        case .average:
            return "equal.circle.fill"
        case .belowAverage:
            return "arrow.down.circle.fill"
        }
    }
}

// MARK: - Trend Direction
enum TrendDirection: String, Codable {
    case improving = "improving"
    case stable = "stable"
    case declining = "declining"

    var displayName: String {
        switch self {
        case .improving:
            return "Improving"
        case .stable:
            return "Stable"
        case .declining:
            return "Declining"
        }
    }

    var color: Color {
        switch self {
        case .improving:
            return .green
        case .stable:
            return .blue
        case .declining:
            return .red
        }
    }

    var icon: String {
        switch self {
        case .improving:
            return "arrow.up.right"
        case .stable:
            return "arrow.right"
        case .declining:
            return "arrow.down.right"
        }
    }
}

// MARK: - Benchmark Metric
struct BenchmarkMetric: Codable, Identifiable {
    let id: UUID
    let category: BenchmarkCategory
    let industryAverage: Double
    let fleetValue: Double
    let percentile: Double
    let trend: TrendDirection
    let changePercentage: Double
    let benchmarkDate: Date

    init(id: UUID = UUID(),
         category: BenchmarkCategory,
         industryAverage: Double,
         fleetValue: Double,
         percentile: Double,
         trend: TrendDirection,
         changePercentage: Double,
         benchmarkDate: Date = Date()) {
        self.id = id
        self.category = category
        self.industryAverage = industryAverage
        self.fleetValue = fleetValue
        self.percentile = percentile
        self.trend = trend
        self.changePercentage = changePercentage
        self.benchmarkDate = benchmarkDate
    }

    var percentileRank: PercentileRank {
        switch percentile {
        case 90...:
            return .top10
        case 75..<90:
            return .top25
        case 50..<75:
            return .average
        default:
            return .belowAverage
        }
    }

    var performanceVsIndustry: Double {
        // For metrics where lower is better (costs, emissions)
        if category == .maintenanceCost || category == .emissions {
            return ((industryAverage - fleetValue) / industryAverage) * 100
        }
        // For metrics where higher is better (efficiency, utilization, safety)
        return ((fleetValue - industryAverage) / industryAverage) * 100
    }

    var isPerformingBetter: Bool {
        return performanceVsIndustry > 0
    }

    var formattedFleetValue: String {
        String(format: "%.2f %@", fleetValue, category.unit)
    }

    var formattedIndustryAverage: String {
        String(format: "%.2f %@", industryAverage, category.unit)
    }

    var formattedPercentile: String {
        String(format: "%.0f%%", percentile)
    }

    var formattedChange: String {
        let sign = changePercentage >= 0 ? "+" : ""
        return String(format: "%@%.1f%%", sign, changePercentage)
    }
}

// MARK: - Benchmark Comparison
struct BenchmarkComparison: Codable, Identifiable {
    let id: UUID
    let category: BenchmarkCategory
    let fleetSize: FleetSizeCategory
    let region: String
    let yourFleet: Double
    let top10Percent: Double
    let top25Percent: Double
    let average: Double
    let bottom25Percent: Double
    let sampleSize: Int
    let lastUpdated: Date

    init(id: UUID = UUID(),
         category: BenchmarkCategory,
         fleetSize: FleetSizeCategory,
         region: String,
         yourFleet: Double,
         top10Percent: Double,
         top25Percent: Double,
         average: Double,
         bottom25Percent: Double,
         sampleSize: Int,
         lastUpdated: Date = Date()) {
        self.id = id
        self.category = category
        self.fleetSize = fleetSize
        self.region = region
        self.yourFleet = yourFleet
        self.top10Percent = top10Percent
        self.top25Percent = top25Percent
        self.average = average
        self.bottom25Percent = bottom25Percent
        self.sampleSize = sampleSize
        self.lastUpdated = lastUpdated
    }

    var yourPercentile: PercentileRank {
        if yourFleet >= top10Percent {
            return .top10
        } else if yourFleet >= top25Percent {
            return .top25
        } else if yourFleet >= average {
            return .average
        } else {
            return .belowAverage
        }
    }

    var gapToTop10: Double {
        return top10Percent - yourFleet
    }

    var formattedGapToTop10: String {
        let gap = abs(gapToTop10)
        if gapToTop10 > 0 {
            return String(format: "%.2f %@ below top 10%%", gap, category.unit)
        } else {
            return "In top 10%"
        }
    }
}

// MARK: - Fleet Size Category
enum FleetSizeCategory: String, CaseIterable, Codable {
    case small = "small"           // 1-25 vehicles
    case medium = "medium"         // 26-100 vehicles
    case large = "large"           // 101-500 vehicles
    case enterprise = "enterprise" // 500+ vehicles

    var displayName: String {
        switch self {
        case .small:
            return "Small (1-25 vehicles)"
        case .medium:
            return "Medium (26-100 vehicles)"
        case .large:
            return "Large (101-500 vehicles)"
        case .enterprise:
            return "Enterprise (500+ vehicles)"
        }
    }

    var range: ClosedRange<Int> {
        switch self {
        case .small:
            return 1...25
        case .medium:
            return 26...100
        case .large:
            return 101...500
        case .enterprise:
            return 501...10000
        }
    }
}

// MARK: - Industry Benchmark
struct IndustryBenchmark: Codable, Identifiable {
    let id: UUID
    let category: BenchmarkCategory
    let region: String
    let fleetSizeCategory: FleetSizeCategory
    let benchmarkValue: Double
    let standardDeviation: Double
    let dataPoints: Int
    let publishedDate: Date

    init(id: UUID = UUID(),
         category: BenchmarkCategory,
         region: String,
         fleetSizeCategory: FleetSizeCategory,
         benchmarkValue: Double,
         standardDeviation: Double,
         dataPoints: Int,
         publishedDate: Date = Date()) {
        self.id = id
        self.category = category
        self.region = region
        self.fleetSizeCategory = fleetSizeCategory
        self.benchmarkValue = benchmarkValue
        self.standardDeviation = standardDeviation
        self.dataPoints = dataPoints
        self.publishedDate = publishedDate
    }

    var confidenceRange: ClosedRange<Double> {
        let lower = benchmarkValue - (standardDeviation * 1.96)
        let upper = benchmarkValue + (standardDeviation * 1.96)
        return lower...upper
    }
}

// MARK: - Benchmark Report
struct BenchmarkReport: Codable, Identifiable {
    let id: UUID
    let reportDate: Date
    let metrics: [BenchmarkMetric]
    let comparisons: [BenchmarkComparison]
    let recommendations: [BenchmarkRecommendation]
    let overallScore: Double
    let industryRanking: PercentileRank

    init(id: UUID = UUID(),
         reportDate: Date = Date(),
         metrics: [BenchmarkMetric],
         comparisons: [BenchmarkComparison],
         recommendations: [BenchmarkRecommendation],
         overallScore: Double,
         industryRanking: PercentileRank) {
        self.id = id
        self.reportDate = reportDate
        self.metrics = metrics
        self.comparisons = comparisons
        self.recommendations = recommendations
        self.overallScore = overallScore
        self.industryRanking = industryRanking
    }

    var formattedOverallScore: String {
        String(format: "%.1f/100", overallScore)
    }

    var topPerformingCategories: [BenchmarkMetric] {
        metrics.sorted { $0.percentile > $1.percentile }.prefix(3).map { $0 }
    }

    var areasNeedingImprovement: [BenchmarkMetric] {
        metrics.filter { $0.percentile < 50 }.sorted { $0.percentile < $1.percentile }
    }
}

// MARK: - Benchmark Recommendation
struct BenchmarkRecommendation: Codable, Identifiable {
    let id: UUID
    let category: BenchmarkCategory
    let priority: RecommendationPriority
    let title: String
    let description: String
    let estimatedImpact: Double
    let estimatedCost: Double?
    let timeframe: String
    let actionItems: [String]

    init(id: UUID = UUID(),
         category: BenchmarkCategory,
         priority: RecommendationPriority,
         title: String,
         description: String,
         estimatedImpact: Double,
         estimatedCost: Double? = nil,
         timeframe: String,
         actionItems: [String]) {
        self.id = id
        self.category = category
        self.priority = priority
        self.title = title
        self.description = description
        self.estimatedImpact = estimatedImpact
        self.estimatedCost = estimatedCost
        self.timeframe = timeframe
        self.actionItems = actionItems
    }

    var formattedImpact: String {
        String(format: "%.1f%% improvement", estimatedImpact)
    }

    var formattedCost: String? {
        guard let cost = estimatedCost else { return nil }
        return String(format: "$%.2f", cost)
    }
}

// MARK: - Recommendation Priority
enum RecommendationPriority: String, Codable {
    case high = "high"
    case medium = "medium"
    case low = "low"

    var displayName: String {
        switch self {
        case .high:
            return "High Priority"
        case .medium:
            return "Medium Priority"
        case .low:
            return "Low Priority"
        }
    }

    var color: Color {
        switch self {
        case .high:
            return .red
        case .medium:
            return .orange
        case .low:
            return .blue
        }
    }

    var icon: String {
        switch self {
        case .high:
            return "exclamationmark.triangle.fill"
        case .medium:
            return "exclamationmark.circle.fill"
        case .low:
            return "info.circle.fill"
        }
    }
}

// MARK: - Historical Benchmark Data
struct HistoricalBenchmarkData: Codable, Identifiable {
    let id: UUID
    let category: BenchmarkCategory
    let date: Date
    let fleetValue: Double
    let industryAverage: Double
    let percentile: Double

    init(id: UUID = UUID(),
         category: BenchmarkCategory,
         date: Date,
         fleetValue: Double,
         industryAverage: Double,
         percentile: Double) {
        self.id = id
        self.category = category
        self.date = date
        self.fleetValue = fleetValue
        self.industryAverage = industryAverage
        self.percentile = percentile
    }
}
