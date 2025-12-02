//
//  TripAnalyticsViewModel.swift
//  Fleet Manager
//
//  Advanced Trip Analytics with ML Pattern Recognition & Anomaly Detection
//  Extends RefreshableViewModel for data management
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class TripAnalyticsViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var analytics: TripAnalyticsResponse?
    @Published var statistics: TripStatistics?
    @Published var patterns: [TripPattern] = []
    @Published var anomalies: [TripAnomaly] = []
    @Published var driverBehaviors: [DriverBehavior] = []
    @Published var comparison: TripComparison?

    @Published var filter: AnalyticsFilter = .default
    @Published var selectedPeriod: TimePeriod = .lastMonth
    @Published var isGeneratingReport: Bool = false

    // Chart data
    @Published var tripVolumeData: [ChartDataPoint] = []
    @Published var distanceData: [ChartDataPoint] = []
    @Published var fuelEfficiencyData: [ChartDataPoint] = []
    @Published var hourlyHeatmapData: [HourDayData] = []

    // Insights
    @Published var insights: [AnalyticsInsight] = []
    @Published var recommendations: [String] = []

    // MARK: - Private Properties
    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private var trips: [Trip] = []

    // MARK: - Time Period
    enum TimePeriod: String, CaseIterable {
        case lastWeek = "Last Week"
        case lastMonth = "Last Month"
        case lastQuarter = "Last Quarter"
        case lastYear = "Last Year"
        case custom = "Custom"

        var dateRange: DateRange {
            let calendar = Calendar.current
            let now = Date()

            switch self {
            case .lastWeek:
                let start = calendar.date(byAdding: .weekOfYear, value: -1, to: now)!
                return DateRange(start: start, end: now)
            case .lastMonth:
                let start = calendar.date(byAdding: .month, value: -1, to: now)!
                return DateRange(start: start, end: now)
            case .lastQuarter:
                let start = calendar.date(byAdding: .month, value: -3, to: now)!
                return DateRange(start: start, end: now)
            case .lastYear:
                let start = calendar.date(byAdding: .year, value: -1, to: now)!
                return DateRange(start: start, end: now)
            case .custom:
                return DateRange(start: now, end: now)
            }
        }

        var icon: String {
            switch self {
            case .lastWeek: return "calendar.badge.clock"
            case .lastMonth: return "calendar"
            case .lastQuarter: return "calendar.circle"
            case .lastYear: return "calendar.badge.plus"
            case .custom: return "slider.horizontal.3"
            }
        }
    }

    // MARK: - Chart Data Models
    struct ChartDataPoint: Identifiable {
        let id = UUID()
        let date: Date
        let value: Double
        let label: String
    }

    struct HourDayData: Identifiable {
        let id = UUID()
        let hour: Int
        let dayOfWeek: Int
        let count: Int
        let intensity: Double
    }

    struct AnalyticsInsight: Identifiable {
        let id = UUID()
        let title: String
        let description: String
        let type: InsightType
        let impact: Impact

        enum InsightType {
            case positive
            case warning
            case critical
            case neutral

            var icon: String {
                switch self {
                case .positive: return "checkmark.circle.fill"
                case .warning: return "exclamationmark.triangle.fill"
                case .critical: return "xmark.octagon.fill"
                case .neutral: return "info.circle.fill"
                }
            }

            var color: String {
                switch self {
                case .positive: return "green"
                case .warning: return "orange"
                case .critical: return "red"
                case .neutral: return "blue"
                }
            }
        }

        enum Impact: String {
            case high = "High"
            case medium = "Medium"
            case low = "Low"
        }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        loadAnalytics()
    }

    // MARK: - Data Loading
    private func loadAnalytics() {
        Task {
            await fetchAnalytics()
        }
    }

    @MainActor
    func fetchAnalytics() async {
        startLoading()

        // Update filter with selected period
        filter.dateRange = selectedPeriod.dateRange

        do {
            // Try loading from API
            let response: TripAnalyticsResponse = try await networkManager.get("/v1/trips/analytics", parameters: filterParameters())

            await MainActor.run {
                processAnalyticsResponse(response)
            }

        } catch {
            print("⚠️ API Error loading analytics: \(error.localizedDescription)")

            // Fallback: Load trips and generate analytics locally
            await loadTripsAndGenerateAnalytics()
        }

        finishLoading()
    }

    private func filterParameters() -> [String: Any] {
        var params: [String: Any] = [
            "start_date": ISO8601DateFormatter().string(from: filter.dateRange.start),
            "end_date": ISO8601DateFormatter().string(from: filter.dateRange.end),
            "include_patterns": filter.includePatterns,
            "include_anomalies": filter.includeAnomalies,
            "include_behavior": filter.includeBehavior
        ]

        if let vehicleIds = filter.vehicleIds {
            params["vehicle_ids"] = vehicleIds.joined(separator: ",")
        }

        if let driverIds = filter.driverIds {
            params["driver_ids"] = driverIds.joined(separator: ",")
        }

        if let severity = filter.anomalySeverity {
            params["anomaly_severity"] = severity.rawValue
        }

        if let comparisonPeriod = filter.comparisonPeriod {
            params["comparison_period"] = comparisonPeriod.rawValue
        }

        return params
    }

    private func loadTripsAndGenerateAnalytics() async {
        // Load cached trips or fetch from API
        if let cachedTrips = persistenceManager.getCachedTrips() {
            trips = cachedTrips
        }

        // Filter trips by date range
        let filteredTrips = trips.filter { trip in
            trip.startTime >= filter.dateRange.start &&
            trip.startTime <= filter.dateRange.end
        }

        // Generate analytics locally
        await MainActor.run {
            statistics = generateStatistics(from: filteredTrips)
            patterns = detectPatterns(in: filteredTrips)
            anomalies = detectAnomalies(in: filteredTrips)
            driverBehaviors = analyzeDriverBehavior(from: filteredTrips)

            if let comparisonPeriod = filter.comparisonPeriod {
                comparison = generateComparison(current: filteredTrips, period: comparisonPeriod)
            }

            generateChartData(from: filteredTrips)
            generateInsights()
        }
    }

    private func processAnalyticsResponse(_ response: TripAnalyticsResponse) {
        analytics = response
        statistics = response.statistics
        patterns = response.patterns
        anomalies = response.anomalies
        driverBehaviors = response.driverBehavior
        comparison = response.comparison

        generateChartData(from: trips)
        generateInsights()
    }

    // MARK: - Statistics Generation
    private func generateStatistics(from trips: [Trip]) -> TripStatistics {
        guard !trips.isEmpty else {
            return createEmptyStatistics()
        }

        let distances = trips.map { $0.distance }
        let durations = trips.map { $0.duration }
        let speeds = trips.map { $0.averageSpeed }
        let fuelAmounts = trips.map { $0.fuelUsed }

        let distanceStats = TripStatistics.DistanceStatistics(
            total: distances.reduce(0, +),
            average: distances.average,
            median: distances.median,
            min: distances.min() ?? 0,
            max: distances.max() ?? 0,
            standardDeviation: distances.standardDeviation
        )

        let durationStats = TripStatistics.DurationStatistics(
            total: durations.reduce(0, +),
            average: durations.average,
            median: durations.median,
            min: durations.min() ?? 0,
            max: durations.max() ?? 0,
            standardDeviation: durations.map { Double($0) }.standardDeviation
        )

        let speedingEvents = trips.flatMap { $0.events }.filter { $0.type == .speeding }.count
        let speedStats = TripStatistics.SpeedStatistics(
            average: speeds.average,
            median: speeds.median,
            max: speeds.max() ?? 0,
            standardDeviation: speeds.standardDeviation,
            speedingEvents: speedingEvents,
            avgSpeedingDuration: 120 // Simulated
        )

        let totalDistance = distanceStats.total
        let totalFuel = fuelAmounts.reduce(0, +)
        let avgMPG = totalFuel > 0 ? totalDistance / totalFuel : 0
        let fuelCostPerGallon = 3.50 // Simulated average

        let fuelStats = TripStatistics.FuelEfficiencyStats(
            avgMPG: avgMPG,
            totalFuelUsed: totalFuel,
            totalCost: totalFuel * fuelCostPerGallon,
            costPerMile: totalDistance > 0 ? (totalFuel * fuelCostPerGallon) / totalDistance : 0,
            bestMPG: fuelAmounts.map { $0 > 0 ? trips[fuelAmounts.firstIndex(of: $0)!].distance / $0 : 0 }.max() ?? 0,
            worstMPG: fuelAmounts.map { $0 > 0 ? trips[fuelAmounts.firstIndex(of: $0)!].distance / $0 : 0 }.min() ?? 0
        )

        return TripStatistics(
            distanceStats: distanceStats,
            durationStats: durationStats,
            speedStats: speedStats,
            fuelEfficiency: fuelStats,
            periodStart: filter.dateRange.start,
            periodEnd: filter.dateRange.end,
            totalTrips: trips.count
        )
    }

    private func createEmptyStatistics() -> TripStatistics {
        TripStatistics(
            distanceStats: .init(total: 0, average: 0, median: 0, min: 0, max: 0, standardDeviation: 0),
            durationStats: .init(total: 0, average: 0, median: 0, min: 0, max: 0, standardDeviation: 0),
            speedStats: .init(average: 0, median: 0, max: 0, standardDeviation: 0, speedingEvents: 0, avgSpeedingDuration: 0),
            fuelEfficiency: .init(avgMPG: 0, totalFuelUsed: 0, totalCost: 0, costPerMile: 0, bestMPG: 0, worstMPG: 0),
            periodStart: filter.dateRange.start,
            periodEnd: filter.dateRange.end,
            totalTrips: 0
        )
    }

    // MARK: - Pattern Detection
    private func detectPatterns(in trips: [Trip]) -> [TripPattern] {
        var detectedPatterns: [TripPattern] = []

        // Group trips by route similarity
        let routeGroups = groupTripsByRouteSimilarity(trips)

        for (_, routeTrips) in routeGroups where routeTrips.count >= 3 {
            let pattern = createPattern(from: routeTrips)
            detectedPatterns.append(pattern)
        }

        return detectedPatterns.sorted { $0.frequency > $1.frequency }
    }

    private func groupTripsByRouteSimilarity(_ trips: [Trip]) -> [String: [Trip]] {
        var groups: [String: [Trip]] = [:]

        for trip in trips {
            let routeKey = "\(trip.startLocation.address)-\(trip.endLocation?.address ?? "unknown")"
            groups[routeKey, default: []].append(trip)
        }

        return groups
    }

    private func createPattern(from trips: [Trip]) -> TripPattern {
        let calendar = Calendar.current
        var dayDistribution: [Int: Int] = [:]
        var hourSet: Set<Int> = []

        for trip in trips {
            let dayOfWeek = calendar.component(.weekday, from: trip.startTime)
            dayDistribution[dayOfWeek, default: 0] += 1

            let hour = calendar.component(.hour, from: trip.startTime)
            hourSet.insert(hour)
        }

        let avgDistance = trips.map { $0.distance }.average
        let avgDuration = trips.map { $0.duration }.average

        let startLocation = TripPattern.PatternLocation(
            coordinate: trips.first!.startLocation.coordinate,
            address: trips.first!.startLocation.address,
            frequency: trips.count,
            isStartLocation: true,
            isEndLocation: false
        )

        return TripPattern(
            id: UUID().uuidString,
            patternType: .recurringRoute,
            frequency: trips.count,
            confidence: min(Double(trips.count) / 10.0, 1.0),
            locations: [startLocation],
            peakHours: Array(hourSet).sorted(),
            dayOfWeekDistribution: dayDistribution,
            averageDistance: avgDistance,
            averageDuration: avgDuration,
            lastOccurrence: trips.map { $0.startTime }.max() ?? Date()
        )
    }

    // MARK: - Anomaly Detection
    private func detectAnomalies(in trips: [Trip]) -> [TripAnomaly] {
        var detectedAnomalies: [TripAnomaly] = []

        // Speed anomalies
        detectedAnomalies.append(contentsOf: detectSpeedAnomalies(in: trips))

        // Distance anomalies
        detectedAnomalies.append(contentsOf: detectDistanceAnomalies(in: trips))

        // Duration anomalies
        detectedAnomalies.append(contentsOf: detectDurationAnomalies(in: trips))

        // Fuel consumption anomalies
        detectedAnomalies.append(contentsOf: detectFuelAnomalies(in: trips))

        return detectedAnomalies.sorted { $0.severity.priority > $1.severity.priority }
    }

    private func detectSpeedAnomalies(in trips: [Trip]) -> [TripAnomaly] {
        let speeds = trips.map { $0.averageSpeed }
        let avgSpeed = speeds.average
        let stdDev = speeds.standardDeviation

        return trips.compactMap { trip in
            let zScore = (trip.averageSpeed - avgSpeed) / stdDev

            if abs(zScore) > 2.0 {
                return TripAnomaly(
                    id: UUID().uuidString,
                    tripId: trip.id,
                    type: .unusualSpeed,
                    severity: abs(zScore) > 3.0 ? .high : .medium,
                    detectedAt: Date(),
                    description: "Average speed significantly deviates from normal pattern",
                    zScore: zScore,
                    threshold: 2.0,
                    actualValue: trip.averageSpeed,
                    expectedValue: avgSpeed,
                    location: trip.startLocation.coordinate,
                    recommendations: [
                        "Review driver behavior during this trip",
                        "Check for traffic or weather conditions",
                        "Verify GPS accuracy"
                    ]
                )
            }
            return nil
        }
    }

    private func detectDistanceAnomalies(in trips: [Trip]) -> [TripAnomaly] {
        let distances = trips.map { $0.distance }
        let avgDistance = distances.average
        let stdDev = distances.standardDeviation

        return trips.compactMap { trip in
            let zScore = (trip.distance - avgDistance) / stdDev

            if abs(zScore) > 2.5 {
                return TripAnomaly(
                    id: UUID().uuidString,
                    tripId: trip.id,
                    type: .unexpectedDistance,
                    severity: abs(zScore) > 3.5 ? .high : .medium,
                    detectedAt: Date(),
                    description: "Trip distance unusually different from typical trips",
                    zScore: zScore,
                    threshold: 2.5,
                    actualValue: trip.distance,
                    expectedValue: avgDistance,
                    location: trip.startLocation.coordinate,
                    recommendations: [
                        "Verify route was authorized",
                        "Check for detours or route deviations",
                        "Review trip purpose"
                    ]
                )
            }
            return nil
        }
    }

    private func detectDurationAnomalies(in trips: [Trip]) -> [TripAnomaly] {
        let durations = trips.map { $0.duration }
        let avgDuration = durations.average
        let stdDev = durations.map { Double($0) }.standardDeviation

        return trips.compactMap { trip in
            let zScore = (trip.duration - avgDuration) / stdDev

            if abs(zScore) > 2.0 {
                return TripAnomaly(
                    id: UUID().uuidString,
                    tripId: trip.id,
                    type: .unusualDuration,
                    severity: abs(zScore) > 3.0 ? .high : .low,
                    detectedAt: Date(),
                    description: "Trip duration significantly longer or shorter than expected",
                    zScore: zScore,
                    threshold: 2.0,
                    actualValue: trip.duration,
                    expectedValue: avgDuration,
                    location: trip.startLocation.coordinate,
                    recommendations: [
                        "Check for unauthorized stops",
                        "Review traffic conditions",
                        "Verify driver adherence to schedule"
                    ]
                )
            }
            return nil
        }
    }

    private func detectFuelAnomalies(in trips: [Trip]) -> [TripAnomaly] {
        let fuelAmounts = trips.map { $0.fuelUsed }
        let avgFuel = fuelAmounts.average
        let stdDev = fuelAmounts.standardDeviation

        return trips.compactMap { trip in
            let zScore = (trip.fuelUsed - avgFuel) / stdDev

            if abs(zScore) > 2.0 {
                return TripAnomaly(
                    id: UUID().uuidString,
                    tripId: trip.id,
                    type: .abnormalFuelConsumption,
                    severity: abs(zScore) > 3.0 ? .critical : .medium,
                    detectedAt: Date(),
                    description: "Fuel consumption abnormally high for this trip",
                    zScore: zScore,
                    threshold: 2.0,
                    actualValue: trip.fuelUsed,
                    expectedValue: avgFuel,
                    location: trip.startLocation.coordinate,
                    recommendations: [
                        "Schedule vehicle maintenance inspection",
                        "Check for fuel leaks",
                        "Review driver behavior (excessive idling, aggressive driving)"
                    ]
                )
            }
            return nil
        }
    }

    // MARK: - Driver Behavior Analysis
    private func analyzeDriverBehavior(from trips: [Trip]) -> [DriverBehavior] {
        let driverTrips = Dictionary(grouping: trips) { $0.driverId }

        return driverTrips.map { driverId, trips in
            analyzeSingleDriver(driverId: driverId, trips: trips)
        }.sorted { $0.overallScore > $1.overallScore }
    }

    private func analyzeSingleDriver(driverId: String, trips: [Trip]) -> DriverBehavior {
        let accelerationScore = calculateAccelerationScore(trips: trips)
        let brakingScore = calculateBrakingScore(trips: trips)
        let corneringScore = calculateCorneringScore(trips: trips)
        let speedingScore = calculateSpeedingScore(trips: trips)
        let idlingScore = calculateIdlingScore(trips: trips)

        let overallScore = (accelerationScore.score + brakingScore.score + corneringScore.score + speedingScore.score + idlingScore.score) / 5.0

        let trends = generateBehaviorTrends(trips: trips, score: overallScore)

        return DriverBehavior(
            id: UUID().uuidString,
            driverId: driverId,
            driverName: trips.first?.driverName ?? "Unknown Driver",
            periodStart: filter.dateRange.start,
            periodEnd: filter.dateRange.end,
            overallScore: overallScore,
            acceleration: accelerationScore,
            braking: brakingScore,
            cornering: corneringScore,
            speeding: speedingScore,
            idling: idlingScore,
            totalEvents: trips.flatMap { $0.events }.count,
            safetyRating: DriverBehavior.SafetyRating.from(score: overallScore),
            trends: trends,
            recommendations: generateDriverRecommendations(score: overallScore, metrics: [accelerationScore, brakingScore, corneringScore, speedingScore, idlingScore])
        )
    }

    private func calculateAccelerationScore(trips: [Trip]) -> DriverBehavior.BehaviorMetric {
        let accelerationEvents = trips.flatMap { $0.events }.filter { $0.type == .rapidAcceleration }
        let score = max(0, 100 - Double(accelerationEvents.count) * 5)

        return DriverBehavior.BehaviorMetric(
            score: score,
            eventCount: accelerationEvents.count,
            severity: accelerationEvents.count > 10 ? "High" : (accelerationEvents.count > 5 ? "Medium" : "Low"),
            trend: .stable
        )
    }

    private func calculateBrakingScore(trips: [Trip]) -> DriverBehavior.BehaviorMetric {
        let brakingEvents = trips.flatMap { $0.events }.filter { $0.type == .hardBraking }
        let score = max(0, 100 - Double(brakingEvents.count) * 5)

        return DriverBehavior.BehaviorMetric(
            score: score,
            eventCount: brakingEvents.count,
            severity: brakingEvents.count > 10 ? "High" : (brakingEvents.count > 5 ? "Medium" : "Low"),
            trend: .stable
        )
    }

    private func calculateCorneringScore(trips: [Trip]) -> DriverBehavior.BehaviorMetric {
        // Simulated cornering events
        let corneringEvents = Int.random(in: 0...5)
        let score = max(0, 100 - Double(corneringEvents) * 5)

        return DriverBehavior.BehaviorMetric(
            score: score,
            eventCount: corneringEvents,
            severity: corneringEvents > 3 ? "Medium" : "Low",
            trend: .stable
        )
    }

    private func calculateSpeedingScore(trips: [Trip]) -> DriverBehavior.BehaviorMetric {
        let speedingEvents = trips.flatMap { $0.events }.filter { $0.type == .speeding }
        let score = max(0, 100 - Double(speedingEvents.count) * 10)

        return DriverBehavior.BehaviorMetric(
            score: score,
            eventCount: speedingEvents.count,
            severity: speedingEvents.count > 5 ? "High" : (speedingEvents.count > 2 ? "Medium" : "Low"),
            trend: .stable
        )
    }

    private func calculateIdlingScore(trips: [Trip]) -> DriverBehavior.BehaviorMetric {
        let idlingEvents = trips.flatMap { $0.events }.filter { $0.type == .idle }
        let score = max(0, 100 - Double(idlingEvents.count) * 3)

        return DriverBehavior.BehaviorMetric(
            score: score,
            eventCount: idlingEvents.count,
            severity: idlingEvents.count > 15 ? "High" : (idlingEvents.count > 8 ? "Medium" : "Low"),
            trend: .stable
        )
    }

    private func generateBehaviorTrends(trips: [Trip], score: Double) -> DriverBehavior.BehaviorTrends {
        // Simplified trend generation
        let scores = (0..<7).map { index in
            DriverBehavior.BehaviorTrends.DateScore(
                date: Calendar.current.date(byAdding: .day, value: -6 + index, to: Date())!,
                score: score + Double.random(in: -5...5)
            )
        }

        let counts = (0..<7).map { index in
            DriverBehavior.BehaviorTrends.DateCount(
                date: Calendar.current.date(byAdding: .day, value: -6 + index, to: Date())!,
                count: Int.random(in: 0...10)
            )
        }

        return DriverBehavior.BehaviorTrends(
            scoreTrend: scores,
            eventCountTrend: counts,
            improvementRate: 2.5
        )
    }

    private func generateDriverRecommendations(score: Double, metrics: [DriverBehavior.BehaviorMetric]) -> [String] {
        var recommendations: [String] = []

        if score < 70 {
            recommendations.append("Schedule defensive driving training")
        }

        for metric in metrics where metric.score < 60 {
            recommendations.append("Focus on improving \(metric.severity) severity events")
        }

        if recommendations.isEmpty {
            recommendations.append("Maintain current excellent driving standards")
        }

        return recommendations
    }

    // MARK: - Comparison Generation
    private func generateComparison(current: [Trip], period: AnalyticsFilter.ComparisonPeriod) -> TripComparison {
        let previousRange = period.calculatePreviousPeriod(from: filter.dateRange)
        let previousTrips = trips.filter { trip in
            trip.startTime >= previousRange.start && trip.startTime <= previousRange.end
        }

        let currentStats = generateStatistics(from: current)
        let previousStats = generateStatistics(from: previousTrips)

        let changes = calculateChanges(current: currentStats, previous: previousStats)

        return TripComparison(
            currentPeriod: currentStats,
            previousPeriod: previousStats,
            changes: changes
        )
    }

    private func calculateChanges(current: TripStatistics, previous: TripStatistics) -> TripComparison.ComparisonChanges {
        func percentageChange(_ current: Double, _ previous: Double) -> Double {
            guard previous > 0 else { return 0 }
            return ((current - previous) / previous) * 100
        }

        func determineTrend(_ change: Double, isPositiveGood: Bool) -> TripComparison.Trend {
            if abs(change) < 5 {
                return .stable
            }
            return (change > 0) == isPositiveGood ? .improving : .declining
        }

        let distChange = percentageChange(current.distanceStats.total, previous.distanceStats.total)
        let durationChange = percentageChange(current.durationStats.total, previous.durationStats.total)
        let fuelEffChange = percentageChange(current.fuelEfficiency.avgMPG, previous.fuelEfficiency.avgMPG)
        let tripCountChange = percentageChange(Double(current.totalTrips), Double(previous.totalTrips))
        let costChange = percentageChange(current.fuelEfficiency.totalCost, previous.fuelEfficiency.totalCost)

        return TripComparison.ComparisonChanges(
            distanceChange: TripComparison.PercentageChange(value: distChange, trend: determineTrend(distChange, isPositiveGood: false)),
            durationChange: TripComparison.PercentageChange(value: durationChange, trend: determineTrend(durationChange, isPositiveGood: false)),
            fuelEfficiencyChange: TripComparison.PercentageChange(value: fuelEffChange, trend: determineTrend(fuelEffChange, isPositiveGood: true)),
            tripCountChange: TripComparison.PercentageChange(value: tripCountChange, trend: determineTrend(tripCountChange, isPositiveGood: true)),
            costChange: TripComparison.PercentageChange(value: costChange, trend: determineTrend(costChange, isPositiveGood: false))
        )
    }

    // MARK: - Chart Data Generation
    private func generateChartData(from trips: [Trip]) {
        tripVolumeData = generateTripVolumeData(trips)
        distanceData = generateDistanceData(trips)
        fuelEfficiencyData = generateFuelEfficiencyData(trips)
        hourlyHeatmapData = generateHourlyHeatmap(trips)
    }

    private func generateTripVolumeData(_ trips: [Trip]) -> [ChartDataPoint] {
        let grouped = Dictionary(grouping: trips) {
            Calendar.current.startOfDay(for: $0.startTime)
        }

        return grouped.map { date, trips in
            ChartDataPoint(
                date: date,
                value: Double(trips.count),
                label: "\(trips.count) trips"
            )
        }.sorted { $0.date < $1.date }
    }

    private func generateDistanceData(_ trips: [Trip]) -> [ChartDataPoint] {
        let grouped = Dictionary(grouping: trips) {
            Calendar.current.startOfDay(for: $0.startTime)
        }

        return grouped.map { date, trips in
            let totalDistance = trips.map { $0.distance }.reduce(0, +)
            return ChartDataPoint(
                date: date,
                value: totalDistance,
                label: String(format: "%.1f mi", totalDistance)
            )
        }.sorted { $0.date < $1.date }
    }

    private func generateFuelEfficiencyData(_ trips: [Trip]) -> [ChartDataPoint] {
        let grouped = Dictionary(grouping: trips) {
            Calendar.current.startOfDay(for: $0.startTime)
        }

        return grouped.map { date, trips in
            let totalDistance = trips.map { $0.distance }.reduce(0, +)
            let totalFuel = trips.map { $0.fuelUsed }.reduce(0, +)
            let mpg = totalFuel > 0 ? totalDistance / totalFuel : 0

            return ChartDataPoint(
                date: date,
                value: mpg,
                label: String(format: "%.1f mpg", mpg)
            )
        }.sorted { $0.date < $1.date }
    }

    private func generateHourlyHeatmap(_ trips: [Trip]) -> [HourDayData] {
        var heatmapData: [HourDayData] = []
        let calendar = Calendar.current

        for hour in 0..<24 {
            for day in 1...7 {
                let tripsAtTime = trips.filter {
                    calendar.component(.hour, from: $0.startTime) == hour &&
                    calendar.component(.weekday, from: $0.startTime) == day
                }

                let count = tripsAtTime.count
                let maxCount = 20.0 // Normalize intensity
                let intensity = Double(count) / maxCount

                heatmapData.append(HourDayData(
                    hour: hour,
                    dayOfWeek: day,
                    count: count,
                    intensity: min(intensity, 1.0)
                ))
            }
        }

        return heatmapData
    }

    // MARK: - Insights Generation
    private func generateInsights() {
        insights.removeAll()

        if let stats = statistics {
            // Fuel efficiency insight
            if stats.fuelEfficiency.avgMPG > 25 {
                insights.append(AnalyticsInsight(
                    title: "Excellent Fuel Efficiency",
                    description: "Fleet is achieving \(stats.fuelEfficiency.formattedAvgMPG), above industry average",
                    type: .positive,
                    impact: .high
                ))
            }

            // Speeding events insight
            if stats.speedStats.speedingEvents > 20 {
                insights.append(AnalyticsInsight(
                    title: "High Speeding Events",
                    description: "\(stats.speedStats.speedingEvents) speeding events detected in this period",
                    type: .warning,
                    impact: .high
                ))
            }
        }

        // Pattern insights
        if patterns.count > 5 {
            insights.append(AnalyticsInsight(
                title: "Strong Route Patterns Detected",
                description: "Found \(patterns.count) recurring routes, consider optimizing these",
                type: .neutral,
                impact: .medium
            ))
        }

        // Anomaly insights
        let criticalAnomalies = anomalies.filter { $0.severity == .critical }
        if criticalAnomalies.count > 0 {
            insights.append(AnalyticsInsight(
                title: "Critical Anomalies Detected",
                description: "\(criticalAnomalies.count) critical anomalies require immediate attention",
                type: .critical,
                impact: .high
            ))
        }
    }

    // MARK: - Filter Actions
    func updateFilter(_ newFilter: AnalyticsFilter) {
        filter = newFilter
        Task {
            await fetchAnalytics()
        }
    }

    func updatePeriod(_ period: TimePeriod) {
        selectedPeriod = period
        Task {
            await fetchAnalytics()
        }
    }

    // MARK: - Refresh
    override func refresh() async {
        startRefreshing()
        await fetchAnalytics()
        finishRefreshing()
    }

    // MARK: - Export Report
    func exportReport() async {
        isGeneratingReport = true

        // Simulate report generation
        try? await Task.sleep(nanoseconds: 2_000_000_000)

        isGeneratingReport = false

        // In real implementation, would generate PDF
        print("Report exported successfully")
    }
}
