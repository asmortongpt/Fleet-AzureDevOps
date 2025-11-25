//
//  TrendChartView.swift
//  Fleet Manager
//
//  Multi-line trend charts using Swift Charts
//

import SwiftUI
import Charts

struct TrendChartView: View {
    let trendData: [TrendData]
    let title: String
    let yAxisLabel: String
    let showLegend: Bool

    init(trendData: [TrendData], title: String, yAxisLabel: String = "Value", showLegend: Bool = true) {
        self.trendData = trendData
        self.title = title
        self.yAxisLabel = yAxisLabel
        self.showLegend = showLegend
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text(title)
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    if let trend = overallTrend {
                        HStack(spacing: 4) {
                            Image(systemName: trendIcon(for: trend))
                                .font(.caption)
                                .foregroundColor(trendColor(for: trend))

                            Text(trendDescription(for: trend))
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                        }
                    }
                }

                Spacer()
            }

            // Chart
            if !trendData.isEmpty {
                chart
                    .frame(height: 250)
            } else {
                emptyState
            }

            // Legend
            if showLegend && trendData.count > 1 {
                legend
            }
        }
        .padding(ModernTheme.Spacing.md)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(
                    color: ModernTheme.Shadow.small.color,
                    radius: ModernTheme.Shadow.small.radius,
                    x: ModernTheme.Shadow.small.x,
                    y: ModernTheme.Shadow.small.y
                )
        )
    }

    // MARK: - Chart
    @ViewBuilder
    private var chart: some View {
        Chart {
            ForEach(trendData) { trend in
                ForEach(trend.dataPoints) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value(yAxisLabel, point.value)
                    )
                    .foregroundStyle(by: .value("Series", trend.name))
                    .interpolationMethod(.catmullRom)
                    .symbol {
                        Circle()
                            .fill(colorForTrend(trend))
                            .frame(width: 6, height: 6)
                    }

                    // Area mark for single series
                    if trendData.count == 1 {
                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value(yAxisLabel, point.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    colorForTrend(trend).opacity(0.3),
                                    colorForTrend(trend).opacity(0.05)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                    }
                }
            }
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .day, count: xAxisStride)) { value in
                if let date = value.as(Date.self) {
                    AxisValueLabel {
                        Text(formatDate(date))
                            .font(ModernTheme.Typography.caption2)
                    }
                    AxisGridLine()
                }
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisValueLabel {
                    if let doubleValue = value.as(Double.self) {
                        Text(formatYAxisValue(doubleValue))
                            .font(ModernTheme.Typography.caption2)
                    }
                }
                AxisGridLine()
            }
        }
        .chartLegend(position: .bottom, spacing: ModernTheme.Spacing.sm)
        .chartForegroundStyleScale(
            domain: trendData.map { $0.name },
            range: trendData.map { colorForTrend($0) }
        )
    }

    // MARK: - Legend
    private var legend: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            ForEach(trendData) { trend in
                HStack(spacing: ModernTheme.Spacing.xs) {
                    Circle()
                        .fill(colorForTrend(trend))
                        .frame(width: 8, height: 8)

                    Text(trend.name)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 48))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No trend data available")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(height: 250)
        .frame(maxWidth: .infinity)
    }

    // MARK: - Computed Properties
    private var overallTrend: KPI.Trend? {
        guard !trendData.isEmpty else { return nil }
        // Use the first trend's overall trend
        return trendData.first?.trend
    }

    private var xAxisStride: Int {
        guard let firstTrend = trendData.first else { return 1 }
        let dayCount = firstTrend.dataPoints.count

        if dayCount <= 7 {
            return 1
        } else if dayCount <= 30 {
            return 7
        } else if dayCount <= 90 {
            return 30
        } else {
            return 90
        }
    }

    // MARK: - Helper Methods
    private func colorForTrend(_ trend: TrendData) -> Color {
        switch trend.color.lowercased() {
        case "blue":
            return .blue
        case "green":
            return .green
        case "orange":
            return .orange
        case "purple":
            return .purple
        case "pink":
            return .pink
        case "teal":
            return .teal
        case "indigo":
            return .indigo
        case "cyan":
            return .cyan
        case "red":
            return .red
        case "yellow":
            return .yellow
        default:
            return ModernTheme.Colors.primary
        }
    }

    private func trendIcon(for trend: KPI.Trend) -> String {
        switch trend {
        case .up:
            return "arrow.up.right"
        case .down:
            return "arrow.down.right"
        case .stable:
            return "arrow.right"
        }
    }

    private func trendColor(for trend: KPI.Trend) -> Color {
        switch trend {
        case .up:
            return ModernTheme.Colors.success
        case .down:
            return ModernTheme.Colors.error
        case .stable:
            return ModernTheme.Colors.info
        }
    }

    private func trendDescription(for trend: KPI.Trend) -> String {
        switch trend {
        case .up:
            return "Trending Up"
        case .down:
            return "Trending Down"
        case .stable:
            return "Stable"
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = xAxisStride > 7 ? "MMM" : "MMM d"
        return formatter.string(from: date)
    }

    private func formatYAxisValue(_ value: Double) -> String {
        if value >= 1_000_000 {
            return String(format: "$%.1fM", value / 1_000_000)
        } else if value >= 1_000 {
            return String(format: "$%.0fK", value / 1_000)
        } else if value >= 100 {
            return String(format: "%.0f", value)
        } else {
            return String(format: "%.1f", value)
        }
    }
}

// MARK: - Preview
#Preview {
    let sampleData = [
        TrendData(
            id: "1",
            name: "Monthly Costs",
            dataPoints: (0..<12).map { index in
                TrendData.DataPoint(
                    date: Calendar.current.date(byAdding: .month, value: -11 + index, to: Date())!,
                    value: Double.random(in: 45000...55000)
                )
            },
            category: "Financial",
            color: "blue"
        ),
        TrendData(
            id: "2",
            name: "Target",
            dataPoints: (0..<12).map { index in
                TrendData.DataPoint(
                    date: Calendar.current.date(byAdding: .month, value: -11 + index, to: Date())!,
                    value: 50000
                )
            },
            category: "Financial",
            color: "green"
        )
    ]

    return VStack(spacing: 16) {
        TrendChartView(
            trendData: sampleData,
            title: "Fleet Operating Costs",
            yAxisLabel: "Cost ($)"
        )

        TrendChartView(
            trendData: [sampleData[0]],
            title: "Single Series Chart",
            yAxisLabel: "Value"
        )
    }
    .padding()
    .background(ModernTheme.Colors.groupedBackground)
}
