//
//  EmissionsChartView.swift
//  Fleet Manager
//
//  Emissions Charts and Trends Visualization
//  CO2 over time, fuel consumption, MPG trends
//

import SwiftUI
import Charts

struct EmissionsChartView: View {
    @StateObject private var viewModel = EnvironmentalImpactViewModel()
    @State private var selectedChartType: ChartType = .co2
    @State private var selectedTimeframe: Timeframe = .month

    enum ChartType: String, CaseIterable {
        case co2 = "CO2 Emissions"
        case fuel = "Fuel Consumption"
        case mpg = "MPG Trends"
        case idle = "Idle Time"

        var icon: String {
            switch self {
            case .co2: return "cloud.fill"
            case .fuel: return "fuelpump.fill"
            case .mpg: return "speedometer"
            case .idle: return "clock.fill"
            }
        }

        var color: Color {
            switch self {
            case .co2: return .red
            case .fuel: return .blue
            case .mpg: return .green
            case .idle: return .orange
            }
        }
    }

    enum Timeframe: String, CaseIterable {
        case week = "Week"
        case month = "Month"
        case quarter = "Quarter"
        case year = "Year"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Chart Type Selector
                chartTypeSelector

                // Timeframe Selector
                timeframeSelector

                // Main Chart
                mainChartSection

                // Summary Stats
                summaryStatsSection

                // Detailed Breakdown
                detailedBreakdownSection

                // Trend Analysis
                trendAnalysisSection
            }
            .padding()
        }
        .navigationTitle("Emissions Charts")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if viewModel.emissionsData.isEmpty {
                await viewModel.refresh()
            }
        }
    }

    // MARK: - Chart Type Selector
    private var chartTypeSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(ChartType.allCases, id: \.self) { type in
                    Button(action: { selectedChartType = type }) {
                        HStack(spacing: 8) {
                            Image(systemName: type.icon)
                            Text(type.rawValue)
                                .font(.subheadline)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(selectedChartType == type ? type.color : Color(.systemGray5))
                        .foregroundColor(selectedChartType == type ? .white : .primary)
                        .cornerRadius(10)
                    }
                }
            }
        }
    }

    // MARK: - Timeframe Selector
    private var timeframeSelector: some View {
        HStack(spacing: 12) {
            ForEach(Timeframe.allCases, id: \.self) { timeframe in
                Button(action: { selectedTimeframe = timeframe }) {
                    Text(timeframe.rawValue)
                        .font(.footnote)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(selectedTimeframe == timeframe ? Color.blue : Color(.systemGray5))
                        .foregroundColor(selectedTimeframe == timeframe ? .white : .primary)
                        .cornerRadius(8)
                }
            }
        }
    }

    // MARK: - Main Chart Section
    private var mainChartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(selectedChartType.rawValue)
                .font(.headline)

            switch selectedChartType {
            case .co2:
                co2Chart
            case .fuel:
                fuelChart
            case .mpg:
                mpgChart
            case .idle:
                idleTimeChart
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - CO2 Chart
    private var co2Chart: View {
        Chart {
            ForEach(viewModel.emissionsData) { emission in
                LineMark(
                    x: .value("Date", emission.period.endDate),
                    y: .value("CO2", emission.co2Emissions)
                )
                .foregroundStyle(Color.red.gradient)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", emission.period.endDate),
                    y: .value("CO2", emission.co2Emissions)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color.red.opacity(0.3), Color.red.opacity(0.05)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { value in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.month().day())
            }
        }
        .frame(height: 250)
    }

    // MARK: - Fuel Chart
    private var fuelChart: View {
        Chart {
            ForEach(viewModel.emissionsData) { emission in
                BarMark(
                    x: .value("Date", emission.period.endDate),
                    y: .value("Fuel", emission.fuelConsumed)
                )
                .foregroundStyle(Color.blue.gradient)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine()
                AxisValueLabel()
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { value in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.month().day())
            }
        }
        .frame(height: 250)
    }

    // MARK: - MPG Chart
    private var mpgChart: View {
        Chart {
            ForEach(viewModel.emissionsData) { emission in
                LineMark(
                    x: .value("Date", emission.period.endDate),
                    y: .value("MPG", emission.mpg)
                )
                .foregroundStyle(Color.green.gradient)
                .symbol(.circle)
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("Date", emission.period.endDate),
                    y: .value("MPG", emission.mpg)
                )
                .foregroundStyle(Color.green)
            }

            // Industry average line
            RuleMark(y: .value("Average", 25.0))
                .foregroundStyle(Color.orange.opacity(0.5))
                .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))
                .annotation(position: .top, alignment: .trailing) {
                    Text("Industry Avg")
                        .font(.caption2)
                        .foregroundColor(.orange)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(4)
                }
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { value in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.month().day())
            }
        }
        .frame(height: 250)
    }

    // MARK: - Idle Time Chart
    private var idleTimeChart: View {
        Chart {
            ForEach(viewModel.emissionsData) { emission in
                BarMark(
                    x: .value("Vehicle", emission.vehicleNumber),
                    y: .value("Idle %", emission.idlePercentage)
                )
                .foregroundStyle(by: .value("Type", emission.idlePercentage > 15 ? "High" : "Normal"))
            }
        }
        .chartForegroundStyleScale([
            "High": Color.orange,
            "Normal": Color.green
        ])
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine()
                AxisValueLabel()
            }
        }
        .frame(height: 250)
    }

    // MARK: - Summary Stats
    private var summaryStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Summary Statistics")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(
                    title: "Total CO2",
                    value: String(format: "%.1f kg", viewModel.totalEmissions),
                    icon: "cloud.fill",
                    color: .red
                )

                StatCard(
                    title: "Avg MPG",
                    value: String(format: "%.1f", viewModel.averageMPG),
                    icon: "speedometer",
                    color: .green
                )

                StatCard(
                    title: "Total Fuel",
                    value: String(format: "%.1f gal", viewModel.emissionsData.reduce(0) { $0 + $1.fuelConsumed }),
                    icon: "fuelpump.fill",
                    color: .blue
                )

                StatCard(
                    title: "Avg Idle",
                    value: String(format: "%.1f%%", viewModel.averageIdlePercentage),
                    icon: "clock.fill",
                    color: .orange
                )
            }
        }
    }

    // MARK: - Detailed Breakdown
    private var detailedBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detailed Breakdown")
                .font(.headline)

            VStack(spacing: 10) {
                ForEach(viewModel.emissionsData.prefix(10)) { emission in
                    EmissionRowDetail(emission: emission)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Trend Analysis
    private var trendAnalysisSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Trend Analysis")
                .font(.headline)

            if let report = viewModel.emissionReport {
                VStack(spacing: 12) {
                    TrendCard(
                        title: "CO2 Emissions",
                        trend: report.trends.co2Trend,
                        isInverse: true
                    )

                    TrendCard(
                        title: "Fuel Efficiency (MPG)",
                        trend: report.trends.mpgTrend,
                        isInverse: false
                    )

                    TrendCard(
                        title: "Idle Time",
                        trend: report.trends.idleTimeTrend,
                        isInverse: true
                    )
                }
            } else {
                Button(action: {
                    Task {
                        await viewModel.generateReport(type: .monthly)
                    }
                }) {
                    HStack {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                        Text("Generate Trend Analysis")
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Supporting Views
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

struct EmissionRowDetail: View {
    let emission: EmissionsData

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(emission.vehicleNumber)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text(emission.fuelType.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(String(format: "%.1f", emission.co2Emissions)) kg CO2")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Text("\(String(format: "%.1f", emission.mpg)) MPG")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Mini progress bars
            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Distance")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Text("\(String(format: "%.0f", emission.distanceTraveled)) mi")
                        .font(.caption)
                        .fontWeight(.medium)
                }

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text("Fuel")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Text("\(String(format: "%.1f", emission.fuelConsumed)) gal")
                        .font(.caption)
                        .fontWeight(.medium)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("Idle")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Text("\(String(format: "%.1f", emission.idlePercentage))%")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(emission.idlePercentage > 15 ? .orange : .green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

struct TrendCard: View {
    let title: String
    let trend: TrendData
    let isInverse: Bool // true if down is good (emissions, idle), false if up is good (MPG)

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                HStack(spacing: 4) {
                    Text("Current: \(String(format: "%.1f", trend.currentValue))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("•")
                        .foregroundColor(.secondary)

                    Text("Previous: \(String(format: "%.1f", trend.previousValue))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            HStack(spacing: 6) {
                Image(systemName: trend.direction.icon)
                    .font(.caption)

                Text("\(String(format: "%.1f", abs(trend.percentageChange)))%")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(trendColor(trend.direction, isInverse: isInverse))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(trendColor(trend.direction, isInverse: isInverse).opacity(0.2))
            .cornerRadius(8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }

    private func trendColor(_ direction: TrendDirection, isInverse: Bool) -> Color {
        switch direction {
        case .up:
            return isInverse ? .red : .green
        case .down:
            return isInverse ? .green : .red
        case .stable:
            return .gray
        }
    }
}

#Preview {
    NavigationView {
        EmissionsChartView()
    }
}
