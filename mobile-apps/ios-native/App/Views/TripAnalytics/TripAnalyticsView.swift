//
//  TripAnalyticsView.swift
//  Fleet Manager
//
//  Advanced Trip Analytics Dashboard with Charts and Insights
//

import SwiftUI
import Charts

struct TripAnalyticsView: View {
    @StateObject private var viewModel = TripAnalyticsViewModel()
    @State private var selectedTab: AnalyticsTab = .overview
    @State private var showingFilterSheet = false
    @State private var showingExportOptions = false

    enum AnalyticsTab: String, CaseIterable {
        case overview = "Overview"
        case patterns = "Patterns"
        case anomalies = "Anomalies"
        case behavior = "Behavior"

        var icon: String {
            switch self {
            case .overview: return "chart.bar.fill"
            case .patterns: return "arrow.triangle.2.circlepath"
            case .anomalies: return "exclamationmark.triangle.fill"
            case .behavior: return "person.fill"
            }
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 20) {
                        // Period Selector
                        periodSelector

                        // Tab Selector
                        tabSelector

                        // Content based on selected tab
                        switch selectedTab {
                        case .overview:
                            overviewContent
                        case .patterns:
                            patternsContent
                        case .anomalies:
                            anomaliesContent
                        case .behavior:
                            behaviorContent
                        }
                    }
                    .padding()
                }

                if viewModel.loadingState.isLoading {
                    ProgressView("Analyzing trips...")
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .shadow(radius: 5)
                }
            }
            .navigationTitle("Trip Analytics")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        Task {
                            await viewModel.refresh()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingFilterSheet = true }) {
                            Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button(action: { showingExportOptions = true }) {
                            Label("Export Report", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingFilterSheet) {
                FilterSheetView(filter: $viewModel.filter)
            }
            .sheet(isPresented: $showingExportOptions) {
                ExportOptionsView(viewModel: viewModel)
            }
        }
    }

    // MARK: - Period Selector
    private var periodSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(TripAnalyticsViewModel.TimePeriod.allCases, id: \.self) { period in
                    PeriodButton(
                        period: period,
                        isSelected: viewModel.selectedPeriod == period
                    ) {
                        viewModel.updatePeriod(period)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Tab Selector
    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(AnalyticsTab.allCases, id: \.self) { tab in
                TabButton(
                    tab: tab,
                    isSelected: selectedTab == tab
                ) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedTab = tab
                    }
                }
            }
        }
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }

    // MARK: - Overview Content
    private var overviewContent: some View {
        VStack(spacing: 20) {
            // Key Statistics Cards
            if let stats = viewModel.statistics {
                StatisticsCardsView(statistics: stats)
            }

            // Comparison Section
            if let comparison = viewModel.comparison {
                ComparisonSectionView(comparison: comparison)
            }

            // Trip Volume Chart
            if !viewModel.tripVolumeData.isEmpty {
                ChartCardView(title: "Trip Volume", icon: "chart.bar.fill") {
                    Chart(viewModel.tripVolumeData) { dataPoint in
                        BarMark(
                            x: .value("Date", dataPoint.date, unit: .day),
                            y: .value("Trips", dataPoint.value)
                        )
                        .foregroundStyle(Color.blue.gradient)
                    }
                    .frame(height: 200)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                }
            }

            // Distance Chart
            if !viewModel.distanceData.isEmpty {
                ChartCardView(title: "Daily Distance", icon: "ruler.fill") {
                    Chart(viewModel.distanceData) { dataPoint in
                        LineMark(
                            x: .value("Date", dataPoint.date, unit: .day),
                            y: .value("Distance", dataPoint.value)
                        )
                        .foregroundStyle(Color.green.gradient)
                        .interpolationMethod(.catmullRom)

                        AreaMark(
                            x: .value("Date", dataPoint.date, unit: .day),
                            y: .value("Distance", dataPoint.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.green.opacity(0.3), Color.green.opacity(0.1)]),
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                    }
                    .frame(height: 200)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                }
            }

            // Fuel Efficiency Chart
            if !viewModel.fuelEfficiencyData.isEmpty {
                ChartCardView(title: "Fuel Efficiency", icon: "fuelpump.fill") {
                    Chart(viewModel.fuelEfficiencyData) { dataPoint in
                        LineMark(
                            x: .value("Date", dataPoint.date, unit: .day),
                            y: .value("MPG", dataPoint.value)
                        )
                        .foregroundStyle(Color.orange.gradient)
                        .interpolationMethod(.catmullRom)
                        .symbol(.circle)
                    }
                    .frame(height: 200)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                }
            }

            // Insights
            if !viewModel.insights.isEmpty {
                InsightsSectionView(insights: viewModel.insights)
            }
        }
    }

    // MARK: - Patterns Content
    private var patternsContent: some View {
        PatternAnalysisView(patterns: viewModel.patterns)
    }

    // MARK: - Anomalies Content
    private var anomaliesContent: some View {
        AnomalyDetectionView(anomalies: viewModel.anomalies)
    }

    // MARK: - Behavior Content
    private var behaviorContent: some View {
        DriverBehaviorView(behaviors: viewModel.driverBehaviors)
    }
}

// MARK: - Period Button
struct PeriodButton: View {
    let period: TripAnalyticsViewModel.TimePeriod
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: period.icon)
                Text(period.rawValue)
                    .font(.subheadline)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(8)
        }
    }
}

// MARK: - Tab Button
struct TabButton: View {
    let tab: TripAnalyticsView.AnalyticsTab
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: tab.icon)
                    .font(.system(size: 16))
                Text(tab.rawValue)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isSelected ? Color.blue : Color.clear)
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(8)
        }
    }
}

// MARK: - Statistics Cards View
struct StatisticsCardsView: View {
    let statistics: TripStatistics

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                StatCard(
                    title: "Total Trips",
                    value: "\(statistics.totalTrips)",
                    icon: "car.fill",
                    color: .blue
                )

                StatCard(
                    title: "Total Distance",
                    value: statistics.distanceStats.formattedTotal,
                    icon: "ruler.fill",
                    color: .green
                )
            }

            HStack(spacing: 12) {
                StatCard(
                    title: "Avg Duration",
                    value: statistics.durationStats.formattedAverage,
                    icon: "clock.fill",
                    color: .orange
                )

                StatCard(
                    title: "Avg MPG",
                    value: statistics.fuelEfficiency.formattedAvgMPG,
                    icon: "fuelpump.fill",
                    color: .purple
                )
            }

            HStack(spacing: 12) {
                StatCard(
                    title: "Total Cost",
                    value: statistics.fuelEfficiency.formattedTotalCost,
                    icon: "dollarsign.circle.fill",
                    color: .red
                )

                StatCard(
                    title: "Cost/Mile",
                    value: statistics.fuelEfficiency.formattedCostPerMile,
                    icon: "chart.line.uptrend.xyaxis",
                    color: .teal
                )
            }
        }
    }
}

// MARK: - Stat Card
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
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Comparison Section View
struct ComparisonSectionView: View {
    let comparison: TripComparison

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Period Comparison")
                .font(.headline)

            VStack(spacing: 8) {
                ComparisonRow(
                    title: "Distance",
                    change: comparison.changes.distanceChange
                )

                Divider()

                ComparisonRow(
                    title: "Fuel Efficiency",
                    change: comparison.changes.fuelEfficiencyChange
                )

                Divider()

                ComparisonRow(
                    title: "Cost",
                    change: comparison.changes.costChange
                )

                Divider()

                ComparisonRow(
                    title: "Trip Count",
                    change: comparison.changes.tripCountChange
                )
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

// MARK: - Comparison Row
struct ComparisonRow: View {
    let title: String
    let change: TripComparison.PercentageChange

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)

            Spacer()

            HStack(spacing: 4) {
                Image(systemName: change.trend.icon)
                    .font(.caption)

                Text(change.formatted)
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(colorForChange(change.color))
        }
    }

    private func colorForChange(_ colorString: String) -> Color {
        switch colorString {
        case "green": return .green
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Chart Card View
struct ChartCardView<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.headline)
            }

            content
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Insights Section View
struct InsightsSectionView: View {
    let insights: [TripAnalyticsViewModel.AnalyticsInsight]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Insights & Recommendations")
                .font(.headline)

            VStack(spacing: 12) {
                ForEach(insights) { insight in
                    InsightCard(insight: insight)
                }
            }
        }
    }
}

// MARK: - Insight Card
struct InsightCard: View {
    let insight: TripAnalyticsViewModel.AnalyticsInsight

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: insight.type.icon)
                .font(.title2)
                .foregroundColor(colorForType(insight.type.color))
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(insight.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Spacer()

                    Text(insight.impact.rawValue)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color(.systemGray5))
                        .cornerRadius(4)
                }

                Text(insight.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }

    private func colorForType(_ colorString: String) -> Color {
        switch colorString {
        case "green": return .green
        case "orange": return .orange
        case "red": return .red
        case "blue": return .blue
        default: return .gray
        }
    }
}

// MARK: - Filter Sheet View
struct FilterSheetView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var filter: AnalyticsFilter
    @State private var tempFilter: AnalyticsFilter

    init(filter: Binding<AnalyticsFilter>) {
        _filter = filter
        _tempFilter = State(initialValue: filter.wrappedValue)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Date Range") {
                    DatePicker("Start Date", selection: Binding(
                        get: { tempFilter.dateRange.start },
                        set: { tempFilter.dateRange = DateRange(start: $0, end: tempFilter.dateRange.end) }
                    ), displayedComponents: .date)

                    DatePicker("End Date", selection: Binding(
                        get: { tempFilter.dateRange.end },
                        set: { tempFilter.dateRange = DateRange(start: tempFilter.dateRange.start, end: $0) }
                    ), displayedComponents: .date)
                }

                Section("Include") {
                    Toggle("Patterns", isOn: $tempFilter.includePatterns)
                    Toggle("Anomalies", isOn: $tempFilter.includeAnomalies)
                    Toggle("Driver Behavior", isOn: $tempFilter.includeBehavior)
                }

                Section("Comparison") {
                    Picker("Compare To", selection: $tempFilter.comparisonPeriod) {
                        Text("None").tag(nil as AnalyticsFilter.ComparisonPeriod?)
                        ForEach(AnalyticsFilter.ComparisonPeriod.allCases, id: \.self) { period in
                            Text(period.rawValue).tag(period as AnalyticsFilter.ComparisonPeriod?)
                        }
                    }
                }
            }
            .navigationTitle("Filter Analytics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        filter = tempFilter
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

// MARK: - Export Options View
struct ExportOptionsView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: TripAnalyticsViewModel

    var body: some View {
        NavigationView {
            List {
                Section("Export Format") {
                    Button {
                        Task {
                            await viewModel.exportReport()
                            dismiss()
                        }
                    } label: {
                        HStack {
                            Image(systemName: "doc.richtext")
                                .foregroundColor(.red)
                            Text("PDF Report")
                            Spacer()
                            if viewModel.isGeneratingReport {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(viewModel.isGeneratingReport)

                    Button {
                        // Export CSV
                        dismiss()
                    } label: {
                        HStack {
                            Image(systemName: "tablecells")
                                .foregroundColor(.green)
                            Text("CSV Data")
                        }
                    }

                    Button {
                        // Export Excel
                        dismiss()
                    } label: {
                        HStack {
                            Image(systemName: "doc.text")
                                .foregroundColor(.blue)
                            Text("Excel Workbook")
                        }
                    }
                }

                Section("Include") {
                    Toggle("Statistics Summary", isOn: .constant(true))
                    Toggle("Charts & Graphs", isOn: .constant(true))
                    Toggle("Pattern Analysis", isOn: .constant(true))
                    Toggle("Anomaly Details", isOn: .constant(true))
                    Toggle("Driver Behavior", isOn: .constant(true))
                }
            }
            .navigationTitle("Export Report")
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
}

// MARK: - Preview
struct TripAnalyticsView_Previews: PreviewProvider {
    static var previews: some View {
        TripAnalyticsView()
    }
}
