import SwiftUI
import Charts

struct SavingsProjectionView: View {
    let recommendations: [OptimizationRecommendation]
    let implementedRecommendations: Set<String>

    @State private var selectedTimeframe = 0
    private let timeframes = ["1 Year", "3 Years", "5 Years"]

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            // Timeframe Picker
            timeframePicker

            // Summary Cards
            savingsSummary

            // Savings Chart
            savingsChart

            // Breakdown by Category
            categoryBreakdown

            // Implementation Timeline
            implementationTimeline
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Timeframe Picker
    private var timeframePicker: some View {
        Picker("Timeframe", selection: $selectedTimeframe) {
            ForEach(Array(timeframes.enumerated()), id: \.offset) { index, timeframe in
                Text(timeframe).tag(index)
            }
        }
        .pickerStyle(.segmented)
    }

    // MARK: - Savings Summary
    private var savingsSummary: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Total Projected Savings
            SummaryCard(
                title: "Projected Savings",
                value: formatCurrency(totalProjectedSavings()),
                subtitle: timeframes[selectedTimeframe],
                color: ModernTheme.Colors.success,
                icon: "dollarsign.circle.fill"
            )

            // Implemented Savings
            SummaryCard(
                title: "Implemented",
                value: formatCurrency(totalImplementedSavings()),
                subtitle: "\(implementedCount) actions",
                color: .blue,
                icon: "checkmark.circle.fill"
            )
        }
    }

    // MARK: - Savings Chart
    private var savingsChart: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Cumulative Savings Over Time")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            let chartData = generateChartData()

            Chart {
                ForEach(chartData) { data in
                    // Projected savings area
                    AreaMark(
                        x: .value("Month", data.month),
                        y: .value("Savings", data.projectedSavings)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [ModernTheme.Colors.success.opacity(0.3), ModernTheme.Colors.success.opacity(0.1)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )

                    // Projected savings line
                    LineMark(
                        x: .value("Month", data.month),
                        y: .value("Savings", data.projectedSavings)
                    )
                    .foregroundStyle(ModernTheme.Colors.success)
                    .lineStyle(StrokeStyle(lineWidth: 3))

                    // Implemented savings line
                    LineMark(
                        x: .value("Month", data.month),
                        y: .value("Implemented", data.implementedSavings)
                    )
                    .foregroundStyle(.blue)
                    .lineStyle(StrokeStyle(lineWidth: 3, dash: [5, 5]))
                }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month, count: selectedTimeframe == 0 ? 2 : 6)) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.month().year())
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let doubleValue = value.as(Double.self) {
                            Text(formatCurrency(doubleValue, short: true))
                                .font(ModernTheme.Typography.caption2)
                        }
                    }
                }
            }
            .frame(height: 200)

            // Legend
            HStack(spacing: ModernTheme.Spacing.lg) {
                LegendItem(color: ModernTheme.Colors.success, label: "Projected", style: .solid)
                LegendItem(color: .blue, label: "Implemented", style: .dashed)
            }
            .font(ModernTheme.Typography.caption2)
            .padding(.top, ModernTheme.Spacing.xs)
        }
    }

    // MARK: - Category Breakdown
    private var categoryBreakdown: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Savings by Category")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            let categoryData = generateCategoryData()

            Chart(categoryData) { item in
                BarMark(
                    x: .value("Savings", item.savings),
                    y: .value("Category", item.category)
                )
                .foregroundStyle(by: .value("Category", item.category))
                .annotation(position: .trailing) {
                    Text(formatCurrency(item.savings, short: true))
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
            .chartForegroundStyleScale(categoryColors())
            .chartLegend(.hidden)
            .frame(height: CGFloat(categoryData.count * 45))
        }
    }

    // MARK: - Implementation Timeline
    private var implementationTimeline: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Implementation Timeline")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            ForEach(timelineItems(), id: \.timeframe) { item in
                TimelineRow(
                    timeframe: item.timeframe,
                    count: item.count,
                    savings: item.savings,
                    isImplemented: item.isImplemented
                )
            }
        }
    }

    // MARK: - Helper Methods

    private func totalProjectedSavings() -> Double {
        let yearlyTotal = recommendations.reduce(0.0) { $0 + $1.estimatedSavings }
        let years = Double(selectedTimeframe + 1) * 2 // 1 Year = 1, 3 Years = 3, 5 Years = 5
        return yearlyTotal * years
    }

    private func totalImplementedSavings() -> Double {
        let yearlyTotal = recommendations
            .filter { implementedRecommendations.contains($0.id) }
            .reduce(0.0) { $0 + $1.estimatedSavings }
        let years = Double(selectedTimeframe + 1) * 2
        return yearlyTotal * years
    }

    private var implementedCount: Int {
        implementedRecommendations.count
    }

    private func generateChartData() -> [SavingsDataPoint] {
        let months = monthCount()
        let monthlyProjected = totalProjectedSavings() / Double(months)
        let monthlyImplemented = totalImplementedSavings() / Double(months)

        let calendar = Calendar.current
        let startDate = Date()

        return (0..<months).map { monthOffset in
            let date = calendar.date(byAdding: .month, value: monthOffset, to: startDate)!
            let cumulativeProjected = monthlyProjected * Double(monthOffset + 1)
            let cumulativeImplemented = monthlyImplemented * Double(monthOffset + 1)

            return SavingsDataPoint(
                month: date,
                projectedSavings: cumulativeProjected,
                implementedSavings: cumulativeImplemented
            )
        }
    }

    private func monthCount() -> Int {
        switch selectedTimeframe {
        case 0: return 12  // 1 year
        case 1: return 36  // 3 years
        case 2: return 60  // 5 years
        default: return 12
        }
    }

    private func generateCategoryData() -> [CategorySavings] {
        var categoryMap: [RecommendationType: Double] = [:]

        for rec in recommendations {
            categoryMap[rec.type, default: 0] += rec.estimatedSavings
        }

        return categoryMap.map { type, savings in
            CategorySavings(category: type.displayName, savings: savings * Double(selectedTimeframe + 1) * 2)
        }
        .sorted { $0.savings > $1.savings }
    }

    private func categoryColors() -> [String: Color] {
        var colors: [String: Color] = [:]
        let colorPalette = ModernTheme.Colors.chartColors

        for (index, type) in RecommendationType.allCases.enumerated() {
            colors[type.displayName] = colorPalette[index % colorPalette.count]
        }

        return colors
    }

    private func timelineItems() -> [TimelineItem] {
        var items: [TimelineItem] = []
        let timeframeGroups: [(String, [String])] = [
            ("Immediate", ["Immediate", "1 week", "1-2 weeks"]),
            ("1 Month", ["2-4 weeks", "1 month", "3-4 weeks"]),
            ("3 Months", ["2-3 months", "3 months", "2-4 months"]),
            ("6+ Months", ["6 months", "6-8 weeks", "6-12 months"])
        ]

        for (label, timeframes) in timeframeGroups {
            let matching = recommendations.filter { rec in
                timeframes.contains { rec.timeframe.lowercased().contains($0.lowercased()) }
            }

            let implementedMatching = matching.filter { implementedRecommendations.contains($0.id) }
            let savings = matching.reduce(0.0) { $0 + $1.estimatedSavings }

            if !matching.isEmpty {
                items.append(TimelineItem(
                    timeframe: label,
                    count: matching.count,
                    savings: savings,
                    isImplemented: implementedMatching.count > 0
                ))
            }
        }

        return items
    }

    private func formatCurrency(_ value: Double, short: Bool = false) -> String {
        if short && value >= 1000 {
            return String(format: "$%.1fK", value / 1000)
        }
        return String(format: "$%,.0f", value)
    }
}

// MARK: - Supporting Types

struct SavingsDataPoint: Identifiable {
    let id = UUID()
    let month: Date
    let projectedSavings: Double
    let implementedSavings: Double
}

struct CategorySavings: Identifiable {
    let id = UUID()
    let category: String
    let savings: Double
}

struct TimelineItem {
    let timeframe: String
    let count: Int
    let savings: Double
    let isImplemented: Bool
}

// MARK: - Supporting Views

struct SummaryCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)

                Spacer()
            }

            Text(value)
                .font(ModernTheme.Typography.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(subtitle)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

struct TimelineRow: View {
    let timeframe: String
    let count: Int
    let savings: Double
    let isImplemented: Bool

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Timeline indicator
            VStack(spacing: 4) {
                Circle()
                    .fill(isImplemented ? Color.green : ModernTheme.Colors.primary)
                    .frame(width: 12, height: 12)

                Rectangle()
                    .fill(ModernTheme.Colors.separator)
                    .frame(width: 2)
            }
            .frame(width: 12)

            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xxs) {
                HStack {
                    Text(timeframe)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Spacer()

                    Text(String(format: "$%,.0f", savings))
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.success)
                }

                HStack {
                    Text("\(count) recommendation\(count == 1 ? "" : "s")")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    if isImplemented {
                        Text("• In Progress")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(.green)
                    }
                }
            }
        }
        .padding(.vertical, ModernTheme.Spacing.xs)
    }
}

struct LegendItem: View {
    let color: Color
    let label: String
    var style: LineStyle = .solid

    enum LineStyle {
        case solid, dashed
    }

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xs) {
            if style == .solid {
                Rectangle()
                    .fill(color)
                    .frame(width: 20, height: 3)
            } else {
                HStack(spacing: 2) {
                    ForEach(0..<3) { _ in
                        Rectangle()
                            .fill(color)
                            .frame(width: 5, height: 3)
                    }
                }
            }

            Text(label)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }
}

// MARK: - Preview
#Preview {
    SavingsProjectionView(
        recommendations: [
            OptimizationRecommendation(
                type: .retireVehicle,
                title: "Retire Vehicle",
                description: "Test",
                estimatedSavings: 8500,
                priority: .high,
                implementationSteps: [],
                affectedVehicles: [],
                timeframe: "2-4 weeks",
                confidence: 0.8
            ),
            OptimizationRecommendation(
                type: .consolidateRoutes,
                title: "Consolidate Routes",
                description: "Test",
                estimatedSavings: 12000,
                priority: .medium,
                implementationSteps: [],
                affectedVehicles: [],
                timeframe: "1 month",
                confidence: 0.75
            ),
            OptimizationRecommendation(
                type: .preventiveMaintenance,
                title: "Preventive Maintenance",
                description: "Test",
                estimatedSavings: 18000,
                priority: .critical,
                implementationSteps: [],
                affectedVehicles: [],
                timeframe: "6 months",
                confidence: 0.88
            )
        ],
        implementedRecommendations: []
    )
    .padding()
}
