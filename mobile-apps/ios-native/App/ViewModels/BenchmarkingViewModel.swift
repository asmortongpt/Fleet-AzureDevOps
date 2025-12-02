//
//  BenchmarkingViewModel.swift
//  Fleet Manager - iOS Native App
//
//  Benchmarking ViewModel
//  Handles industry benchmarking, comparison analytics, and performance insights
//

import Foundation
import Combine
import SwiftUI

@MainActor
class BenchmarkingViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var benchmarks: [BenchmarkMetric] = []
    @Published var selectedCategory: BenchmarkCategory = .fuelEfficiency
    @Published var comparisonData: [BenchmarkComparison] = []
    @Published var historicalData: [HistoricalBenchmarkData] = []
    @Published var currentReport: BenchmarkReport?
    @Published var selectedFleetSize: FleetSizeCategory = .medium
    @Published var selectedRegion: String = "Southeast"

    // Filter options
    @Published var availableRegions: [String] = ["Southeast", "Northeast", "Midwest", "Southwest", "West", "National"]

    // MARK: - Private Properties
    private let baseURL = AzureConfig.apiURL
    private let cacheKey = "benchmarking_data"
    private let cacheExpiration: TimeInterval = 3600 // 1 hour

    // MARK: - Computed Properties
    var selectedBenchmark: BenchmarkMetric? {
        benchmarks.first { $0.category == selectedCategory }
    }

    var selectedComparison: BenchmarkComparison? {
        comparisonData.first { $0.category == selectedCategory }
    }

    var topPerformingCategories: [BenchmarkMetric] {
        benchmarks.sorted { $0.percentile > $1.percentile }.prefix(3).map { $0 }
    }

    var categoriesNeedingImprovement: [BenchmarkMetric] {
        benchmarks.filter { $0.percentile < 50 }.sorted { $0.percentile < $1.percentile }
    }

    var overallPerformanceScore: Double {
        guard !benchmarks.isEmpty else { return 0 }
        let totalPercentile = benchmarks.reduce(0) { $0 + $1.percentile }
        return totalPercentile / Double(benchmarks.count)
    }

    var formattedOverallScore: String {
        String(format: "%.1f/100", overallPerformanceScore)
    }

    var overallPerformanceRank: PercentileRank {
        switch overallPerformanceScore {
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

    // MARK: - Initialization
    override init() {
        super.init()
        setupObservers()
        loadCachedData()
    }

    // MARK: - Setup
    private func setupObservers() {
        // Refresh when category, fleet size, or region changes
        Publishers.CombineLatest3($selectedCategory, $selectedFleetSize, $selectedRegion)
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _, _, _ in
                Task { @MainActor in
                    await self?.fetchBenchmarks()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Public Methods

    /// Fetch all benchmarking data
    func fetchBenchmarks() async {
        startLoading()

        do {
            // Fetch data in parallel
            async let metrics = fetchBenchmarkMetrics()
            async let comparisons = fetchComparisonData()
            async let historical = fetchHistoricalData()

            let results = try await (metrics, comparisons, historical)

            self.benchmarks = results.0
            self.comparisonData = results.1
            self.historicalData = results.2

            // Cache the data
            cacheData()

            finishLoading()
        } catch {
            handleError(error)
        }
    }

    /// Fetch benchmark metrics for all categories
    private func fetchBenchmarkMetrics() async throws -> [BenchmarkMetric] {
        // In production, this would call the API
        // For now, return mock data
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        return BenchmarkCategory.allCases.map { category in
            generateMockMetric(for: category)
        }
    }

    /// Fetch comparison data for all categories
    private func fetchComparisonData() async throws -> [BenchmarkComparison] {
        // In production, this would call the API
        try await Task.sleep(nanoseconds: 500_000_000)

        return BenchmarkCategory.allCases.map { category in
            generateMockComparison(for: category)
        }
    }

    /// Fetch historical benchmark data
    private func fetchHistoricalData() async throws -> [HistoricalBenchmarkData] {
        // In production, this would call the API
        try await Task.sleep(nanoseconds: 500_000_000)

        var data: [HistoricalBenchmarkData] = []
        let calendar = Calendar.current
        let endDate = Date()

        for monthOffset in (0..<12).reversed() {
            guard let date = calendar.date(byAdding: .month, value: -monthOffset, to: endDate) else { continue }

            for category in BenchmarkCategory.allCases {
                let dataPoint = generateHistoricalDataPoint(for: category, date: date, monthOffset: monthOffset)
                data.append(dataPoint)
            }
        }

        return data
    }

    /// Compare performance to industry benchmarks
    func compareToIndustry() async {
        startLoading()

        do {
            let comparisons = try await fetchComparisonData()
            self.comparisonData = comparisons
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    /// Generate comprehensive benchmark report
    func generateReport() async -> BenchmarkReport? {
        startLoading()

        do {
            // Ensure we have the latest data
            if benchmarks.isEmpty {
                try await fetchBenchmarks()
            }

            let recommendations = generateRecommendations()

            let report = BenchmarkReport(
                reportDate: Date(),
                metrics: benchmarks,
                comparisons: comparisonData,
                recommendations: recommendations,
                overallScore: overallPerformanceScore,
                industryRanking: overallPerformanceRank
            )

            self.currentReport = report
            finishLoading()

            return report
        } catch {
            handleError(error)
            return nil
        }
    }

    /// Export report to PDF
    func exportReportToPDF() async -> URL? {
        guard let report = currentReport else {
            handleErrorMessage("No report available to export")
            return nil
        }

        // TODO: Implement PDF generation
        // This would use PDFKit or a similar library
        return nil
    }

    /// Export data to CSV
    func exportToCSV() async -> URL? {
        guard !benchmarks.isEmpty else {
            handleErrorMessage("No data available to export")
            return nil
        }

        // TODO: Implement CSV export
        return nil
    }

    // MARK: - RefreshableViewModel Override
    override func refresh() async {
        startRefreshing()
        await fetchBenchmarks()
        finishRefreshing()
    }

    // MARK: - Private Helper Methods

    private func generateRecommendations() -> [BenchmarkRecommendation] {
        var recommendations: [BenchmarkRecommendation] = []

        for metric in categoriesNeedingImprovement {
            let recommendation = generateRecommendation(for: metric)
            recommendations.append(recommendation)
        }

        return recommendations.sorted { $0.priority.rawValue > $1.priority.rawValue }
    }

    private func generateRecommendation(for metric: BenchmarkMetric) -> BenchmarkRecommendation {
        let gap = abs(metric.performanceVsIndustry)
        let priority: RecommendationPriority = gap > 20 ? .high : (gap > 10 ? .medium : .low)

        switch metric.category {
        case .fuelEfficiency:
            return BenchmarkRecommendation(
                category: .fuelEfficiency,
                priority: priority,
                title: "Improve Fuel Efficiency",
                description: "Your fleet's fuel efficiency is \(String(format: "%.1f%%", gap)) below industry average. Implementing driver training and vehicle maintenance programs can significantly improve MPG.",
                estimatedImpact: gap * 0.6,
                estimatedCost: 5000,
                timeframe: "3-6 months",
                actionItems: [
                    "Implement driver eco-training program",
                    "Optimize route planning to reduce idle time",
                    "Schedule regular tire pressure checks",
                    "Review and optimize vehicle loading practices"
                ]
            )

        case .maintenanceCost:
            return BenchmarkRecommendation(
                category: .maintenanceCost,
                priority: priority,
                title: "Reduce Maintenance Costs",
                description: "Your maintenance costs are \(String(format: "%.1f%%", gap)) above industry average. Preventive maintenance and vendor negotiation can reduce costs.",
                estimatedImpact: gap * 0.5,
                estimatedCost: 2000,
                timeframe: "2-4 months",
                actionItems: [
                    "Transition to preventive maintenance schedule",
                    "Negotiate bulk pricing with preferred vendors",
                    "Implement predictive maintenance using telematics",
                    "Review and standardize parts inventory"
                ]
            )

        case .utilization:
            return BenchmarkRecommendation(
                category: .utilization,
                priority: priority,
                title: "Increase Vehicle Utilization",
                description: "Your fleet utilization is \(String(format: "%.1f%%", gap)) below industry average. Optimizing assignments and reducing idle vehicles can improve ROI.",
                estimatedImpact: gap * 0.7,
                estimatedCost: 1000,
                timeframe: "1-3 months",
                actionItems: [
                    "Implement dynamic vehicle assignment system",
                    "Analyze and right-size fleet capacity",
                    "Create vehicle sharing program across departments",
                    "Set utilization targets and track performance"
                ]
            )

        case .safety:
            return BenchmarkRecommendation(
                category: .safety,
                priority: .high, // Always high priority
                title: "Enhance Safety Performance",
                description: "Your safety score is \(String(format: "%.1f%%", gap)) below industry average. Investing in safety training and technology can prevent incidents.",
                estimatedImpact: gap * 0.8,
                estimatedCost: 8000,
                timeframe: "2-6 months",
                actionItems: [
                    "Implement comprehensive driver safety training",
                    "Install advanced driver assistance systems (ADAS)",
                    "Conduct regular safety audits and inspections",
                    "Create incident reporting and analysis program"
                ]
            )

        case .emissions:
            return BenchmarkRecommendation(
                category: .emissions,
                priority: priority,
                title: "Reduce Carbon Footprint",
                description: "Your emissions are \(String(format: "%.1f%%", gap)) above industry average. Transitioning to cleaner vehicles and optimizing operations can reduce environmental impact.",
                estimatedImpact: gap * 0.6,
                estimatedCost: 15000,
                timeframe: "6-12 months",
                actionItems: [
                    "Evaluate hybrid or electric vehicle options",
                    "Implement anti-idling policies and technology",
                    "Optimize routes to reduce total miles driven",
                    "Track and report emissions metrics regularly"
                ]
            )
        }
    }

    // MARK: - Mock Data Generation (for development)

    private func generateMockMetric(for category: BenchmarkCategory) -> BenchmarkMetric {
        let baseValues: [BenchmarkCategory: (industry: Double, fleet: Double)] = [
            .fuelEfficiency: (24.5, 23.8),
            .maintenanceCost: (0.12, 0.14),
            .utilization: (75.0, 68.0),
            .safety: (85.0, 82.0),
            .emissions: (0.45, 0.48)
        ]

        let (industryAvg, fleetVal) = baseValues[category] ?? (100.0, 95.0)

        // Add some variation based on region and fleet size
        let regionVariation = Double.random(in: -5...5)
        let sizeVariation = Double.random(in: -3...3)

        let adjustedFleetValue = fleetVal + regionVariation + sizeVariation
        let percentile = calculatePercentile(fleetValue: adjustedFleetValue, industryAverage: industryAvg, category: category)

        let trend: TrendDirection
        let change: Double
        if percentile > 70 {
            trend = .improving
            change = Double.random(in: 0.5...3.0)
        } else if percentile > 40 {
            trend = .stable
            change = Double.random(in: -1.0...1.0)
        } else {
            trend = .declining
            change = Double.random(in: -3.0...(-0.5))
        }

        return BenchmarkMetric(
            category: category,
            industryAverage: industryAvg,
            fleetValue: adjustedFleetValue,
            percentile: percentile,
            trend: trend,
            changePercentage: change
        )
    }

    private func generateMockComparison(for category: BenchmarkCategory) -> BenchmarkComparison {
        let metric = benchmarks.first { $0.category == category } ?? generateMockMetric(for: category)

        // Generate distribution data
        let industryAvg = metric.industryAverage
        let top10 = industryAvg * 1.2
        let top25 = industryAvg * 1.1
        let bottom25 = industryAvg * 0.85

        return BenchmarkComparison(
            category: category,
            fleetSize: selectedFleetSize,
            region: selectedRegion,
            yourFleet: metric.fleetValue,
            top10Percent: top10,
            top25Percent: top25,
            average: industryAvg,
            bottom25Percent: bottom25,
            sampleSize: Int.random(in: 500...2000),
            lastUpdated: Date()
        )
    }

    private func generateHistoricalDataPoint(for category: BenchmarkCategory, date: Date, monthOffset: Int) -> HistoricalBenchmarkData {
        let currentMetric = benchmarks.first { $0.category == category } ?? generateMockMetric(for: category)

        // Simulate historical trend
        let trendFactor = Double(monthOffset) * 0.02
        let randomVariation = Double.random(in: -0.03...0.03)

        let historicalFleetValue = currentMetric.fleetValue * (1 - trendFactor + randomVariation)
        let historicalIndustryAvg = currentMetric.industryAverage * (1 - trendFactor * 0.5)
        let percentile = calculatePercentile(fleetValue: historicalFleetValue, industryAverage: historicalIndustryAvg, category: category)

        return HistoricalBenchmarkData(
            category: category,
            date: date,
            fleetValue: historicalFleetValue,
            industryAverage: historicalIndustryAvg,
            percentile: percentile
        )
    }

    private func calculatePercentile(fleetValue: Double, industryAverage: Double, category: BenchmarkCategory) -> Double {
        // For categories where lower is better
        if category == .maintenanceCost || category == .emissions {
            let ratio = industryAverage / max(fleetValue, 0.01)
            return min(100, max(0, (ratio - 0.5) * 100))
        }

        // For categories where higher is better
        let ratio = fleetValue / max(industryAverage, 0.01)
        return min(100, max(0, (ratio - 0.5) * 100))
    }

    // MARK: - Cache Management

    private func loadCachedData() {
        if let cached = getCachedObject(forKey: cacheKey, type: NSArray.self) as? [[String: Any]],
           let data = try? JSONSerialization.data(withJSONObject: cached),
           let metrics = try? JSONDecoder().decode([BenchmarkMetric].self, from: data) {
            self.benchmarks = metrics
        }
    }

    private func cacheData() {
        if let data = try? JSONEncoder().encode(benchmarks),
           let jsonObject = try? JSONSerialization.jsonObject(with: data) as? NSArray {
            cacheObject(jsonObject, forKey: cacheKey)
        }
    }
}
