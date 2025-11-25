//
//  BudgetForecastView.swift
//  Fleet Manager
//
//  Projected spending charts with trend analysis
//

import SwiftUI
import Charts

struct BudgetForecastView: View {
    let budget: BudgetPlan
    @ObservedObject var viewModel: BudgetPlanningViewModel

    @State private var forecastMonths: Int = 6
    @State private var selectedCategory: BudgetCategory?
    @State private var showConfidenceInterval = true
    @State private var generatedForecasts: [ForecastData] = []

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Forecast Summary
                forecastSummarySection

                // Forecast Controls
                forecastControlsSection

                // Forecast Chart
                forecastChartSection

                // Category Forecasts
                if selectedCategory == nil {
                    categoryForecastsSection
                }

                // Forecast Table
                forecastTableSection

                // Insights
                insightsSection
            }
            .padding()
        }
        .navigationTitle("Budget Forecast")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.fetchForecasts(budgetId: budget.id)
            generateForecasts()
        }
    }

    // MARK: - Forecast Summary Section
    private var forecastSummarySection: some View {
        VStack(spacing: 16) {
            Text("Forecast Summary")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                ForecastSummaryCard(
                    title: "Current Spent",
                    value: String(format: "$%.2f", budget.totalSpent),
                    icon: "cart.fill",
                    color: .orange
                )

                ForecastSummaryCard(
                    title: "Projected Total",
                    value: String(format: "$%.2f", budget.totalProjected),
                    icon: "chart.line.uptrend.xyaxis",
                    color: .purple
                )
            }

            HStack(spacing: 12) {
                ForecastSummaryCard(
                    title: "Total Budget",
                    value: String(format: "$%.2f", budget.totalAllocated),
                    icon: "dollarsign.circle",
                    color: .blue
                )

                ForecastSummaryCard(
                    title: "Projected Variance",
                    value: String(format: "$%.2f", abs(budget.totalAllocated - budget.totalProjected)),
                    icon: budget.totalProjected <= budget.totalAllocated ? "checkmark.circle" : "exclamationmark.triangle",
                    color: budget.totalProjected <= budget.totalAllocated ? .green : .red
                )
            }

            // Projection Status
            if budget.projectedOverage > 0 {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Projected to Exceed Budget")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.red)

                        Text("Expected overage: \(String(format: "$%.2f", budget.projectedOverage))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
                .padding()
                .background(Color.red.opacity(0.1))
                .cornerRadius(10)
            } else {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)

                    Text("Projected to Stay Within Budget")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)

                    Spacer()
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(10)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Forecast Controls Section
    private var forecastControlsSection: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Forecast Settings")
                    .font(.headline)

                Spacer()

                Button("Regenerate") {
                    generateForecasts()
                }
                .font(.caption)
                .foregroundColor(.blue)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Forecast Period: \(forecastMonths) months")
                    .font(.subheadline)

                Slider(value: Binding(
                    get: { Double(forecastMonths) },
                    set: { forecastMonths = Int($0) }
                ), in: 1...12, step: 1)
                .onChange(of: forecastMonths) { _, _ in
                    generateForecasts()
                }
            }

            Picker("Category", selection: $selectedCategory) {
                Text("All Categories").tag(nil as BudgetCategory?)
                ForEach(BudgetCategory.allCases) { category in
                    Text(category.rawValue).tag(category as BudgetCategory?)
                }
            }
            .pickerStyle(.menu)

            Toggle("Show Confidence Interval", isOn: $showConfidenceInterval)
                .font(.subheadline)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Forecast Chart Section
    private var forecastChartSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Spending Projection")
                .font(.headline)

            if #available(iOS 16.0, *) {
                Chart {
                    // Historical spending (current point)
                    PointMark(
                        x: .value("Date", budget.startDate),
                        y: .value("Amount", 0)
                    )
                    .foregroundStyle(.blue)

                    PointMark(
                        x: .value("Date", Date()),
                        y: .value("Amount", budget.totalSpent)
                    )
                    .foregroundStyle(.orange)

                    // Forecast line
                    ForEach(Array(generatedForecasts.enumerated()), id: \.element.id) { index, forecast in
                        LineMark(
                            x: .value("Date", forecast.date),
                            y: .value("Amount", forecast.projectedAmount)
                        )
                        .foregroundStyle(.purple)

                        PointMark(
                            x: .value("Date", forecast.date),
                            y: .value("Amount", forecast.projectedAmount)
                        )
                        .foregroundStyle(.purple)

                        // Confidence interval
                        if showConfidenceInterval {
                            AreaMark(
                                x: .value("Date", forecast.date),
                                yStart: .value("Lower", forecast.projectedAmount * (1 - (1 - forecast.confidenceLevel))),
                                yEnd: .value("Upper", forecast.projectedAmount * (1 + (1 - forecast.confidenceLevel)))
                            )
                            .foregroundStyle(.purple.opacity(0.1))
                        }
                    }

                    // Budget line
                    RuleMark(
                        y: .value("Budget", budget.totalAllocated)
                    )
                    .foregroundStyle(.green.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))
                }
                .frame(height: 300)
                .chartXAxis {
                    AxisMarks { _ in
                        AxisValueLabel(format: .dateTime.month(.abbreviated))
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisValueLabel {
                            if let doubleValue = value.as(Double.self) {
                                Text(formatCurrency(doubleValue))
                                    .font(.caption2)
                            }
                        }
                    }
                }
            } else {
                Text("Charts require iOS 16.0 or later")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Legend
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 4) {
                    Circle()
                        .fill(.orange)
                        .frame(width: 12, height: 12)
                    Text("Current Spending")
                        .font(.caption)
                }

                HStack(spacing: 4) {
                    Circle()
                        .fill(.purple)
                        .frame(width: 12, height: 12)
                    Text("Projected Spending")
                        .font(.caption)
                }

                HStack(spacing: 4) {
                    Rectangle()
                        .fill(.green.opacity(0.5))
                        .frame(width: 20, height: 2)
                    Text("Budget Limit")
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Category Forecasts Section
    private var categoryForecastsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Category Projections")
                .font(.headline)

            ForEach(budget.categories) { category in
                CategoryForecastCard(
                    allocation: category,
                    forecastMonths: forecastMonths
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Forecast Table Section
    private var forecastTableSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detailed Forecast")
                .font(.headline)

            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Period")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Text("Date")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 80, alignment: .trailing)

                    Text("Projected")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 90, alignment: .trailing)

                    Text("Confidence")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 70, alignment: .trailing)
                }
                .padding()
                .background(Color(.secondarySystemBackground))

                // Rows
                ForEach(generatedForecasts) { forecast in
                    HStack {
                        Text(forecast.period)
                            .font(.caption)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        Text(formatDate(forecast.date))
                            .font(.caption)
                            .frame(width: 80, alignment: .trailing)

                        Text(forecast.formattedProjected)
                            .font(.caption)
                            .frame(width: 90, alignment: .trailing)

                        HStack(spacing: 4) {
                            Text(forecast.formattedConfidence)
                                .font(.caption)

                            Circle()
                                .fill(confidenceColor(forecast.confidenceLevel))
                                .frame(width: 8, height: 8)
                        }
                        .frame(width: 70, alignment: .trailing)
                    }
                    .padding()
                    .background(Color(.systemBackground))

                    Divider()
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(10)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Insights Section
    private var insightsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Forecast Insights")
                .font(.headline)

            VStack(spacing: 12) {
                InsightCard(
                    icon: "calendar",
                    title: "Days Remaining",
                    value: "\(budget.daysRemaining) days",
                    color: .blue
                )

                InsightCard(
                    icon: "flame.fill",
                    title: "Daily Burn Rate",
                    value: String(format: "$%.2f/day", budget.dailyBurnRate),
                    color: .orange
                )

                if let lastForecast = generatedForecasts.last {
                    InsightCard(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "End of Period Projection",
                        value: lastForecast.formattedProjected,
                        color: lastForecast.projectedAmount > budget.totalAllocated ? .red : .green
                    )
                }

                let avgConfidence = generatedForecasts.reduce(0.0) { $0 + $1.confidenceLevel } / Double(max(1, generatedForecasts.count))
                InsightCard(
                    icon: "chart.bar.fill",
                    title: "Average Confidence",
                    value: String(format: "%.0f%%", avgConfidence * 100),
                    color: .purple
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Helper Functions
    private func generateForecasts() {
        generatedForecasts = viewModel.forecastSpending(for: budget, months: forecastMonths)
    }

    private func formatCurrency(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "$%.1fK", value / 1000)
        } else {
            return String(format: "$%.0f", value)
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM yy"
        return formatter.string(from: date)
    }

    private func confidenceColor(_ confidence: Double) -> Color {
        if confidence >= 0.8 {
            return .green
        } else if confidence >= 0.6 {
            return .yellow
        } else {
            return .red
        }
    }
}

// MARK: - Supporting Views

struct ForecastSummaryCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
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
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

struct CategoryForecastCard: View {
    let allocation: BudgetAllocation
    let forecastMonths: Int

    var projectedSpending: Double {
        let daysElapsed = max(1, Calendar.current.dateComponents([.day], from: Date().addingTimeInterval(-30*24*60*60), to: Date()).day ?? 1)
        let dailyBurnRate = allocation.spentAmount / Double(daysElapsed)
        let projectedDays = forecastMonths * 30
        return allocation.spentAmount + (dailyBurnRate * Double(projectedDays))
    }

    var body: some View {
        HStack {
            Image(systemName: allocation.category.icon)
                .foregroundColor(Color(allocation.category.color))
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(allocation.category.rawValue)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("Current: \(allocation.formattedSpent)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "$%.2f", projectedSpending))
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(projectedSpending > allocation.allocatedAmount ? .red : .green)

                Text("projected")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

struct InsightCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 30)

            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

#Preview {
    NavigationView {
        BudgetForecastView(
            budget: BudgetPlan(
                id: "1",
                name: "FY 2025 Fleet Budget",
                fiscalYear: 2025,
                startDate: Date(),
                endDate: Calendar.current.date(byAdding: .year, value: 1, to: Date()) ?? Date(),
                period: .annual,
                totalAllocated: 100000,
                totalSpent: 75000,
                totalProjected: 95000,
                categories: [
                    BudgetAllocation(id: "1", category: .fuel, allocatedAmount: 30000, spentAmount: 25000, projectedAmount: 28000, percentage: 30),
                    BudgetAllocation(id: "2", category: .maintenance, allocatedAmount: 25000, spentAmount: 20000, projectedAmount: 24000, percentage: 25)
                ],
                department: "Operations",
                vehicleId: nil,
                createdBy: "Admin",
                createdAt: Date(),
                updatedAt: Date(),
                isActive: true
            ),
            viewModel: BudgetPlanningViewModel()
        )
    }
}
