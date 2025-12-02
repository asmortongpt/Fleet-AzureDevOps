//
//  DriverBehaviorView.swift
//  Fleet Manager
//
//  Driver Behavior Analysis with Scoring and Performance Metrics
//

import SwiftUI
import Charts

struct DriverBehaviorView: View {
    let behaviors: [DriverBehavior]
    @State private var selectedDriver: DriverBehavior?
    @State private var sortOption: SortOption = .score

    enum SortOption: String, CaseIterable {
        case score = "Score"
        case events = "Events"
        case name = "Name"

        var icon: String {
            switch self {
            case .score: return "star.fill"
            case .events: return "exclamationmark.triangle.fill"
            case .name: return "person.fill"
            }
        }
    }

    var sortedBehaviors: [DriverBehavior] {
        switch sortOption {
        case .score:
            return behaviors.sorted { $0.overallScore > $1.overallScore }
        case .events:
            return behaviors.sorted { $0.totalEvents > $1.totalEvents }
        case .name:
            return behaviors.sorted { $0.driverName < $1.driverName }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            if behaviors.isEmpty {
                emptyStateView
            } else {
                VStack(spacing: 16) {
                    // Summary Stats
                    summaryStatsView

                    // Sort Options
                    sortOptionsView

                    // Drivers List
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(sortedBehaviors) { behavior in
                                DriverBehaviorCard(behavior: behavior) {
                                    selectedDriver = behavior
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
        .sheet(item: $selectedDriver) { driver in
            DriverBehaviorDetailView(behavior: driver)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.fill.questionmark")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Driver Data")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Driver behavior data will appear here once trips are completed")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - Summary Stats
    private var summaryStatsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SummaryDriverStatCard(
                    title: "Total Drivers",
                    value: "\(behaviors.count)",
                    icon: "person.3.fill",
                    color: .blue
                )

                SummaryDriverStatCard(
                    title: "Avg Score",
                    value: String(format: "%.0f", behaviors.map { $0.overallScore }.average),
                    icon: "star.fill",
                    color: .orange
                )

                SummaryDriverStatCard(
                    title: "Excellent",
                    value: "\(behaviors.filter { $0.safetyRating == .excellent }.count)",
                    icon: "star.circle.fill",
                    color: .green
                )

                SummaryDriverStatCard(
                    title: "Needs Attention",
                    value: "\(behaviors.filter { $0.safetyRating == .poor || $0.safetyRating == .critical }.count)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Sort Options
    private var sortOptionsView: some View {
        HStack(spacing: 8) {
            ForEach(SortOption.allCases, id: \.self) { option in
                DriverSortButton(
                    option: option,
                    isSelected: sortOption == option
                ) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        sortOption = option
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Summary Driver Stat Card
struct SummaryDriverStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 100)
        .padding(.vertical, 12)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Driver Sort Button
struct DriverSortButton: View {
    let option: DriverBehaviorView.SortOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: option.icon)
                    .font(.caption)
                Text(option.rawValue)
                    .font(.subheadline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(8)
        }
    }
}

// MARK: - Driver Behavior Card
struct DriverBehaviorCard: View {
    let behavior: DriverBehavior
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "person.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.blue)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(behavior.driverName)
                            .font(.headline)

                        HStack(spacing: 4) {
                            Image(systemName: behavior.safetyRating.icon)
                                .font(.caption)
                            Text(behavior.safetyRating.rawValue)
                                .font(.subheadline)
                        }
                        .foregroundColor(safetyRatingColor)
                    }

                    Spacer()

                    // Score Circle
                    ZStack {
                        Circle()
                            .stroke(Color(.systemGray5), lineWidth: 8)
                            .frame(width: 70, height: 70)

                        Circle()
                            .trim(from: 0, to: behavior.overallScore / 100)
                            .stroke(scoreColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                            .frame(width: 70, height: 70)
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 2) {
                            Text("\(Int(behavior.overallScore))")
                                .font(.title3)
                                .fontWeight(.bold)
                            Text("score")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Divider()

                // Behavior Metrics
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 12) {
                    BehaviorMetricView(
                        title: "Acceleration",
                        metric: behavior.acceleration
                    )

                    BehaviorMetricView(
                        title: "Braking",
                        metric: behavior.braking
                    )

                    BehaviorMetricView(
                        title: "Speeding",
                        metric: behavior.speeding
                    )
                }

                // Event Summary
                HStack {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.orange)

                    Text("\(behavior.totalEvents) total events")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var scoreColor: Color {
        switch behavior.overallScore {
        case 80...100: return .green
        case 60..<80: return .yellow
        case 40..<60: return .orange
        default: return .red
        }
    }

    private var safetyRatingColor: Color {
        switch behavior.safetyRating.color {
        case "green": return .green
        case "blue": return .blue
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Behavior Metric View
struct BehaviorMetricView: View {
    let title: String
    let metric: DriverBehavior.BehaviorMetric

    var body: some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            ZStack {
                Circle()
                    .stroke(Color(.systemGray5), lineWidth: 4)
                    .frame(width: 40, height: 40)

                Circle()
                    .trim(from: 0, to: metric.score / 100)
                    .stroke(metricColor, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .frame(width: 40, height: 40)
                    .rotationEffect(.degrees(-90))

                Text(metric.formattedScore)
                    .font(.caption2)
                    .fontWeight(.semibold)
            }

            Text("\(metric.eventCount) events")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }

    private var metricColor: Color {
        switch metric.scoreColor {
        case "green": return .green
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Driver Behavior Detail View
struct DriverBehaviorDetailView: View {
    @Environment(\.dismiss) var dismiss
    let behavior: DriverBehavior

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Driver Header
                    driverHeader

                    // Score Breakdown
                    scoreBreakdown

                    // Detailed Metrics
                    detailedMetrics

                    // Trend Chart
                    if !behavior.trends.scoreTrend.isEmpty {
                        trendChart
                    }

                    // Event Count Trend
                    if !behavior.trends.eventCountTrend.isEmpty {
                        eventCountChart
                    }

                    // Recommendations
                    if !behavior.recommendations.isEmpty {
                        recommendationsSection
                    }
                }
                .padding()
            }
            .navigationTitle("Driver Performance")
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

    // MARK: - Driver Header
    private var driverHeader: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)

            Text(behavior.driverName)
                .font(.title2)
                .fontWeight(.bold)

            HStack(spacing: 16) {
                VStack {
                    Text("Overall Score")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(behavior.formattedOverallScore)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(scoreColor)
                }

                Divider()
                    .frame(height: 40)

                VStack {
                    Text("Safety Rating")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    HStack(spacing: 4) {
                        Image(systemName: behavior.safetyRating.icon)
                        Text(behavior.safetyRating.rawValue)
                    }
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(safetyRatingColor)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Score Breakdown
    private var scoreBreakdown: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Score Breakdown")
                .font(.headline)

            VStack(spacing: 12) {
                ScoreBar(title: "Acceleration", metric: behavior.acceleration)
                ScoreBar(title: "Braking", metric: behavior.braking)
                ScoreBar(title: "Cornering", metric: behavior.cornering)
                ScoreBar(title: "Speeding", metric: behavior.speeding)
                ScoreBar(title: "Idling", metric: behavior.idling)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Detailed Metrics
    private var detailedMetrics: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detailed Metrics")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                DetailMetricCard(
                    title: "Total Events",
                    value: "\(behavior.totalEvents)",
                    icon: "exclamationmark.triangle.fill",
                    color: .orange
                )

                DetailMetricCard(
                    title: "Improvement",
                    value: String(format: "+%.1f%%", behavior.trends.improvementRate),
                    icon: "arrow.up.circle.fill",
                    color: .green
                )
            }
        }
    }

    // MARK: - Trend Chart
    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Score Trend")
                .font(.headline)

            Chart(behavior.trends.scoreTrend) { dataPoint in
                LineMark(
                    x: .value("Date", dataPoint.date, unit: .day),
                    y: .value("Score", dataPoint.score)
                )
                .foregroundStyle(Color.blue.gradient)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", dataPoint.date, unit: .day),
                    y: .value("Score", dataPoint.score)
                )
                .foregroundStyle(
                    LinearGradient(
                        gradient: Gradient(colors: [Color.blue.opacity(0.3), Color.blue.opacity(0.1)]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)
            }
            .frame(height: 200)
            .chartYScale(domain: 0...100)
            .chartYAxis {
                AxisMarks(position: .leading)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Event Count Chart
    private var eventCountChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Event Count Trend")
                .font(.headline)

            Chart(behavior.trends.eventCountTrend) { dataPoint in
                BarMark(
                    x: .value("Date", dataPoint.date, unit: .day),
                    y: .value("Count", dataPoint.count)
                )
                .foregroundStyle(Color.orange.gradient)
            }
            .frame(height: 200)
            .chartYAxis {
                AxisMarks(position: .leading)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Recommendations Section
    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.headline)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(behavior.recommendations.enumerated()), id: \.offset) { index, recommendation in
                    HStack(alignment: .top, spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.blue.opacity(0.1))
                                .frame(width: 24, height: 24)

                            Text("\(index + 1)")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        }

                        Text(recommendation)
                            .font(.subheadline)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Helper Properties
    private var scoreColor: Color {
        switch behavior.overallScore {
        case 80...100: return .green
        case 60..<80: return .yellow
        case 40..<60: return .orange
        default: return .red
        }
    }

    private var safetyRatingColor: Color {
        switch behavior.safetyRating.color {
        case "green": return .green
        case "blue": return .blue
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Score Bar
struct ScoreBar: View {
    let title: String
    let metric: DriverBehavior.BehaviorMetric

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(.subheadline)

                Spacer()

                Text(metric.formattedScore)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(metricColor)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 8)
                        .cornerRadius(4)

                    Rectangle()
                        .fill(metricColor)
                        .frame(width: geometry.size.width * (metric.score / 100), height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)

            HStack {
                Text("\(metric.eventCount) events")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text(metric.severity)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    private var metricColor: Color {
        switch metric.scoreColor {
        case "green": return .green
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Detail Metric Card
struct DetailMetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Preview
struct DriverBehaviorView_Previews: PreviewProvider {
    static var previews: some View {
        DriverBehaviorView(behaviors: [])
    }
}
