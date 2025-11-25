//
//  BenchmarkDetailView.swift
//  Fleet Manager - iOS Native App
//
//  Detailed Benchmark Analysis View
//  In-depth metrics, trends, and improvement recommendations
//

import SwiftUI
import Charts

struct BenchmarkDetailView: View {
    let metric: BenchmarkMetric
    let comparison: BenchmarkComparison?
    let historicalData: [HistoricalBenchmarkData]

    @Environment(\.dismiss) private var dismiss
    @State private var selectedTimeRange: TimeRange = .year
    @State private var showingRecommendations = false

    enum TimeRange: String, CaseIterable {
        case month = "1M"
        case quarter = "3M"
        case halfYear = "6M"
        case year = "1Y"

        var displayName: String {
            switch self {
            case .month: return "1 Month"
            case .quarter: return "3 Months"
            case .halfYear: return "6 Months"
            case .year: return "1 Year"
            }
        }

        var months: Int {
            switch self {
            case .month: return 1
            case .quarter: return 3
            case .halfYear: return 6
            case .year: return 12
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header Card
                headerCard

                // Key Metrics Grid
                keyMetricsGrid

                // Comparison Chart
                comparisonChart

                // Historical Trend
                historicalTrendSection

                // Peer Comparison
                if let comp = comparison {
                    peerComparisonSection(comparison: comp)
                }

                // Performance Analysis
                performanceAnalysisSection

                // Improvement Recommendations
                recommendationsSection
            }
            .padding()
        }
        .navigationTitle(metric.category.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingRecommendations.toggle() }) {
                    Image(systemName: "lightbulb.fill")
                        .foregroundColor(.yellow)
                }
            }
        }
        .sheet(isPresented: $showingRecommendations) {
            RecommendationsSheet(category: metric.category)
        }
    }

    // MARK: - Header Card
    private var headerCard: some View {
        VStack(spacing: 16) {
            // Icon and Title
            HStack {
                Image(systemName: metric.category.icon)
                    .font(.system(size: 50))
                    .foregroundColor(metric.category.color)

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(metric.percentileRank.displayName)
                        .font(.headline)
                        .foregroundColor(metric.percentileRank.color)

                    Text("Percentile: \(metric.formattedPercentile)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Current Value vs Industry
            HStack(spacing: 30) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your Fleet")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(metric.formattedFleetValue)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                }

                Image(systemName: metric.isPerformingBetter ? "arrow.up.right.circle.fill" : "arrow.down.right.circle.fill")
                    .font(.largeTitle)
                    .foregroundColor(metric.isPerformingBetter ? .green : .red)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Industry Avg")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(metric.formattedIndustryAverage)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.secondary)
                }
            }

            // Performance Delta
            HStack {
                Spacer()

                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: metric.isPerformingBetter ? "arrow.up" : "arrow.down")
                        Text(String(format: "%.1f%%", abs(metric.performanceVsIndustry)))
                    }
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(metric.isPerformingBetter ? .green : .red)

                    Text(metric.isPerformingBetter ? "above average" : "below average")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }
            .padding(.vertical, 12)
            .background(metric.isPerformingBetter ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
            .cornerRadius(8)

            // Trend Badge
            HStack {
                Image(systemName: metric.trend.icon)
                Text(metric.trend.displayName)
                Text(metric.formattedChange)
                    .fontWeight(.semibold)
                Text("vs last period")
                    .foregroundColor(.secondary)
            }
            .font(.subheadline)
            .foregroundColor(metric.trend.color)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(metric.trend.color.opacity(0.15))
            .cornerRadius(8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Key Metrics Grid
    private var keyMetricsGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Key Metrics")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                metricCard(
                    title: "Percentile Rank",
                    value: metric.formattedPercentile,
                    icon: "chart.bar.fill",
                    color: metric.percentileRank.color
                )

                metricCard(
                    title: "Trend",
                    value: metric.trend.displayName,
                    icon: metric.trend.icon,
                    color: metric.trend.color
                )

                metricCard(
                    title: "Monthly Change",
                    value: metric.formattedChange,
                    icon: "calendar",
                    color: metric.trend.color
                )

                metricCard(
                    title: "Data Points",
                    value: comparison?.sampleSize.formatted() ?? "N/A",
                    icon: "number",
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Comparison Chart
    private var comparisonChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Performance Distribution")
                .font(.headline)

            if let comp = comparison {
                if #available(iOS 16.0, *) {
                    Chart {
                        // Your Fleet
                        BarMark(
                            x: .value("Category", "Your Fleet"),
                            y: .value("Value", comp.yourFleet)
                        )
                        .foregroundStyle(.blue)

                        // Top 10%
                        BarMark(
                            x: .value("Category", "Top 10%"),
                            y: .value("Value", comp.top10Percent)
                        )
                        .foregroundStyle(.green)

                        // Top 25%
                        BarMark(
                            x: .value("Category", "Top 25%"),
                            y: .value("Value", comp.top25Percent)
                        )
                        .foregroundStyle(.mint)

                        // Average
                        BarMark(
                            x: .value("Category", "Average"),
                            y: .value("Value", comp.average)
                        )
                        .foregroundStyle(.orange)

                        // Bottom 25%
                        BarMark(
                            x: .value("Category", "Bottom 25%"),
                            y: .value("Value", comp.bottom25Percent)
                        )
                        .foregroundStyle(.red)
                    }
                    .chartYAxisLabel(metric.category.unit)
                    .frame(height: 250)
                } else {
                    Text("Charts require iOS 16+")
                        .foregroundColor(.secondary)
                        .frame(height: 250)
                }

                Text("Based on \(comp.sampleSize) fleets in \(comp.region)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Historical Trend Section
    private var historicalTrendSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Historical Trend")
                    .font(.headline)

                Spacer()

                // Time Range Picker
                Picker("Range", selection: $selectedTimeRange) {
                    ForEach(TimeRange.allCases, id: \.self) { range in
                        Text(range.rawValue).tag(range)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 200)
            }

            if #available(iOS 16.0, *) {
                let filteredData = filterHistoricalData()

                Chart {
                    ForEach(filteredData) { dataPoint in
                        // Fleet Value Line
                        LineMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Value", dataPoint.fleetValue)
                        )
                        .foregroundStyle(.blue)
                        .interpolationMethod(.catmullRom)

                        // Fleet Value Area
                        AreaMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Value", dataPoint.fleetValue)
                        )
                        .foregroundStyle(.blue.opacity(0.2))
                        .interpolationMethod(.catmullRom)

                        // Industry Average Line
                        LineMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Average", dataPoint.industryAverage)
                        )
                        .foregroundStyle(.gray)
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                        .interpolationMethod(.catmullRom)
                    }
                }
                .chartYAxisLabel(metric.category.unit)
                .frame(height: 200)
                .padding(.vertical)

                HStack(spacing: 16) {
                    legendItem(color: .blue, label: "Your Fleet", style: .solid)
                    legendItem(color: .gray, label: "Industry Average", style: .dashed)
                }
                .font(.caption)
            } else {
                Text("Charts require iOS 16+")
                    .foregroundColor(.secondary)
                    .frame(height: 200)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Peer Comparison Section
    private func peerComparisonSection(comparison: BenchmarkComparison) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Peer Comparison")
                .font(.headline)

            Text("\(comparison.fleetSize.displayName) • \(comparison.region)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            // Percentile Breakdown
            VStack(spacing: 8) {
                percentileRow(
                    label: "Top 10%",
                    value: String(format: "%.2f %@", comparison.top10Percent, metric.category.unit),
                    color: PercentileRank.top10.color,
                    isYourFleet: comparison.yourFleet >= comparison.top10Percent
                )

                percentileRow(
                    label: "Top 25%",
                    value: String(format: "%.2f %@", comparison.top25Percent, metric.category.unit),
                    color: PercentileRank.top25.color,
                    isYourFleet: comparison.yourFleet >= comparison.top25Percent && comparison.yourFleet < comparison.top10Percent
                )

                percentileRow(
                    label: "Average",
                    value: String(format: "%.2f %@", comparison.average, metric.category.unit),
                    color: PercentileRank.average.color,
                    isYourFleet: comparison.yourFleet >= comparison.average && comparison.yourFleet < comparison.top25Percent
                )

                percentileRow(
                    label: "Bottom 25%",
                    value: String(format: "%.2f %@", comparison.bottom25Percent, metric.category.unit),
                    color: PercentileRank.belowAverage.color,
                    isYourFleet: comparison.yourFleet < comparison.average
                )
            }

            if comparison.gapToTop10 > 0 {
                HStack {
                    Image(systemName: "flag.fill")
                        .foregroundColor(.orange)

                    Text(comparison.formattedGapToTop10)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Performance Analysis Section
    private var performanceAnalysisSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Performance Analysis")
                .font(.headline)

            VStack(alignment: .leading, spacing: 12) {
                analysisPoint(
                    icon: metric.isPerformingBetter ? "checkmark.circle.fill" : "exclamationmark.circle.fill",
                    color: metric.isPerformingBetter ? .green : .orange,
                    title: metric.isPerformingBetter ? "Performing Above Industry Average" : "Below Industry Average",
                    description: metric.isPerformingBetter
                        ? "Your fleet is performing \(String(format: "%.1f%%", abs(metric.performanceVsIndustry))) better than the industry average. Keep up the good work!"
                        : "Your fleet is performing \(String(format: "%.1f%%", abs(metric.performanceVsIndustry))) below the industry average. Review recommendations for improvement strategies."
                )

                analysisPoint(
                    icon: metric.trend.icon,
                    color: metric.trend.color,
                    title: "\(metric.trend.displayName) Trend",
                    description: getTrendDescription()
                )

                analysisPoint(
                    icon: metric.percentileRank.icon,
                    color: metric.percentileRank.color,
                    title: metric.percentileRank.displayName,
                    description: "Your fleet ranks in the \(metric.percentileRank.displayName) among similar fleets."
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Recommendations Section
    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)

                Text("Quick Recommendations")
                    .font(.headline)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(getQuickRecommendations(), id: \.self) { recommendation in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "arrow.right.circle.fill")
                            .foregroundColor(.blue)
                            .font(.caption)

                        Text(recommendation)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Button(action: { showingRecommendations.toggle() }) {
                HStack {
                    Text("View Detailed Recommendations")
                    Spacer()
                    Image(systemName: "arrow.right")
                }
                .font(.subheadline)
                .fontWeight(.semibold)
            }
            .padding(.top, 8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Helper Views
    private func metricCard(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }

    private func percentileRow(label: String, value: String, color: Color, isYourFleet: Bool) -> some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 12, height: 12)

            Text(label)
                .font(.subheadline)
                .frame(width: 100, alignment: .leading)

            Text(value)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            if isYourFleet {
                Text("You")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(color)
                    .cornerRadius(4)
            }
        }
    }

    private func analysisPoint(icon: String, color: Color, title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func legendItem(color: Color, label: String, style: LineStyle) -> some View {
        HStack(spacing: 4) {
            if style == .solid {
                Rectangle()
                    .fill(color)
                    .frame(width: 20, height: 3)
            } else {
                Rectangle()
                    .fill(color)
                    .frame(width: 20, height: 3)
                    .overlay(
                        GeometryReader { geometry in
                            Path { path in
                                path.move(to: CGPoint(x: 0, y: geometry.size.height / 2))
                                path.addLine(to: CGPoint(x: geometry.size.width, y: geometry.size.height / 2))
                            }
                            .stroke(style: StrokeStyle(lineWidth: 2, dash: [3, 2]))
                            .foregroundColor(color)
                        }
                    )
            }

            Text(label)
        }
    }

    enum LineStyle {
        case solid
        case dashed
    }

    // MARK: - Helper Methods
    private func filterHistoricalData() -> [HistoricalBenchmarkData] {
        let calendar = Calendar.current
        let cutoffDate = calendar.date(byAdding: .month, value: -selectedTimeRange.months, to: Date()) ?? Date()
        return historicalData.filter { $0.date >= cutoffDate }.sorted { $0.date < $1.date }
    }

    private func getTrendDescription() -> String {
        switch metric.trend {
        case .improving:
            return "Performance has improved by \(metric.formattedChange) over the last period. Continue current strategies to maintain this positive trend."
        case .stable:
            return "Performance has remained relatively stable with a change of \(metric.formattedChange). Consider new initiatives to drive improvement."
        case .declining:
            return "Performance has declined by \(metric.formattedChange) over the last period. Immediate action recommended to reverse this trend."
        }
    }

    private func getQuickRecommendations() -> [String] {
        switch metric.category {
        case .fuelEfficiency:
            return [
                "Implement driver eco-training program",
                "Schedule regular vehicle maintenance",
                "Optimize route planning to reduce idle time"
            ]
        case .maintenanceCost:
            return [
                "Transition to preventive maintenance schedule",
                "Negotiate bulk pricing with vendors",
                "Review and standardize parts inventory"
            ]
        case .utilization:
            return [
                "Implement dynamic vehicle assignment",
                "Analyze and right-size fleet capacity",
                "Create vehicle sharing program"
            ]
        case .safety:
            return [
                "Conduct comprehensive driver safety training",
                "Install advanced driver assistance systems",
                "Implement incident reporting program"
            ]
        case .emissions:
            return [
                "Evaluate hybrid or electric vehicle options",
                "Implement anti-idling policies",
                "Optimize routes to reduce total miles"
            ]
        }
    }
}

// MARK: - Recommendations Sheet
struct RecommendationsSheet: View {
    let category: BenchmarkCategory
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ForEach(getDetailedRecommendations(), id: \.title) { recommendation in
                        RecommendationCard(recommendation: recommendation)
                    }
                }
                .padding()
            }
            .navigationTitle("Recommendations")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func getDetailedRecommendations() -> [DetailedRecommendation] {
        // Mock recommendations - in production, fetch from API
        return [
            DetailedRecommendation(
                title: "Implement Driver Training Program",
                priority: .high,
                estimatedImpact: "5-10% improvement",
                timeframe: "2-3 months",
                steps: [
                    "Conduct baseline assessment of current driving behaviors",
                    "Develop customized training curriculum",
                    "Schedule and deliver training sessions",
                    "Monitor and measure improvement"
                ]
            ),
            DetailedRecommendation(
                title: "Optimize Maintenance Schedule",
                priority: .medium,
                estimatedImpact: "3-7% improvement",
                timeframe: "1-2 months",
                steps: [
                    "Review current maintenance procedures",
                    "Transition to preventive maintenance model",
                    "Implement predictive maintenance using telematics",
                    "Track and analyze maintenance data"
                ]
            )
        ]
    }
}

struct DetailedRecommendation {
    let title: String
    let priority: RecommendationPriority
    let estimatedImpact: String
    let timeframe: String
    let steps: [String]
}

struct RecommendationCard: View {
    let recommendation: DetailedRecommendation

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: recommendation.priority.icon)
                    .foregroundColor(recommendation.priority.color)

                Text(recommendation.title)
                    .font(.headline)

                Spacer()

                Text(recommendation.priority.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(recommendation.priority.color.opacity(0.2))
                    .foregroundColor(recommendation.priority.color)
                    .cornerRadius(4)
            }

            HStack(spacing: 16) {
                Label(recommendation.estimatedImpact, systemImage: "chart.line.uptrend.xyaxis")
                Label(recommendation.timeframe, systemImage: "calendar")
            }
            .font(.caption)
            .foregroundColor(.secondary)

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("Action Steps:")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                ForEach(Array(recommendation.steps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\(index + 1).")
                            .fontWeight(.semibold)
                            .foregroundColor(.blue)

                        Text(step)
                            .font(.subheadline)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

#Preview {
    NavigationView {
        BenchmarkDetailView(
            metric: BenchmarkMetric(
                category: .fuelEfficiency,
                industryAverage: 24.5,
                fleetValue: 23.8,
                percentile: 65,
                trend: .improving,
                changePercentage: 2.5
            ),
            comparison: BenchmarkComparison(
                category: .fuelEfficiency,
                fleetSize: .medium,
                region: "Southeast",
                yourFleet: 23.8,
                top10Percent: 28.0,
                top25Percent: 26.0,
                average: 24.5,
                bottom25Percent: 22.0,
                sampleSize: 1250
            ),
            historicalData: []
        )
    }
}
