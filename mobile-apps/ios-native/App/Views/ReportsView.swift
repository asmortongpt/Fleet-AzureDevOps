//
//  ReportsView.swift
//  Fleet Manager
//
//  Comprehensive reports view with Charts framework and analytics
//

import SwiftUI
import Charts

struct ReportsView: View {
    @StateObject private var viewModel = ReportsViewModel()
    @State private var selectedTab = 0
    @State private var showExportSheet = false
    @State private var showFilterSheet = false
    @State private var showDateRangePicker = false

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: ModernTheme.Spacing.lg) {
                        // Date Range Selector
                        dateRangeSection

                        // Tab Selector
                        reportTabSelector

                        // Content based on selected tab
                        Group {
                            switch selectedTab {
                            case 0:
                                fleetUtilizationContent
                            case 1:
                                fuelAnalysisContent
                            case 2:
                                maintenanceCostContent
                            case 3:
                                driverPerformanceContent
                            default:
                                fleetUtilizationContent
                            }
                        }
                        .padding(.horizontal)

                        Spacer(minLength: 20)
                    }
                    .padding(.top)
                }

                // Loading overlay
                if viewModel.loadingState.isLoading {
                    LoadingOverlay()
                }
            }
            .navigationTitle("Reports & Analytics")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        Button(action: { showFilterSheet = true }) {
                            Image(systemName: "line.3.horizontal.decrease.circle")
                                .font(.title3)
                        }

                        Button(action: { showExportSheet = true }) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.title3)
                        }
                    }
                }
            }
            .sheet(isPresented: $showExportSheet) {
                ExportSheet(viewModel: viewModel)
            }
            .sheet(isPresented: $showFilterSheet) {
                FilterSheet(viewModel: viewModel)
            }
            .sheet(isPresented: $showDateRangePicker) {
                DateRangePickerSheet(viewModel: viewModel)
            }
        }
    }

    // MARK: - Date Range Section

    private var dateRangeSection: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text("Date Range")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                Button(action: { showDateRangePicker = true }) {
                    HStack(spacing: 6) {
                        Text(viewModel.selectedDateRange.displayText)
                            .font(ModernTheme.Typography.footnote)
                        Image(systemName: "chevron.down")
                            .font(.caption)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(ModernTheme.Colors.secondaryBackground)
                    .cornerRadius(ModernTheme.CornerRadius.sm)
                }
            }
            .padding(.horizontal)

            // Quick date range buttons
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: ModernTheme.Spacing.sm) {
                    DateRangeButton(title: "Today", range: .today, viewModel: viewModel)
                    DateRangeButton(title: "This Week", range: .thisWeek, viewModel: viewModel)
                    DateRangeButton(title: "This Month", range: .thisMonth, viewModel: viewModel)
                    DateRangeButton(title: "Last 30 Days", range: .last30Days, viewModel: viewModel)
                    DateRangeButton(title: "Last 90 Days", range: .last90Days, viewModel: viewModel)
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Tab Selector

    private var reportTabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                TabButton(title: "Fleet Utilization", icon: "chart.bar.fill", index: 0, selected: $selectedTab)
                TabButton(title: "Fuel Analysis", icon: "fuelpump.fill", index: 1, selected: $selectedTab)
                TabButton(title: "Maintenance", icon: "wrench.fill", index: 2, selected: $selectedTab)
                TabButton(title: "Driver Performance", icon: "person.crop.circle.badge.checkmark", index: 3, selected: $selectedTab)
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Fleet Utilization Content

    private var fleetUtilizationContent: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            if let report = viewModel.fleetUtilizationReport {
                // Summary Cards
                LazyVGrid(columns: ModernTheme.adaptiveColumns, spacing: ModernTheme.Spacing.md) {
                    MetricCard(
                        title: "Total Vehicles",
                        value: "\(report.totalVehicles)",
                        icon: "car.2.fill",
                        color: .blue
                    )

                    MetricCard(
                        title: "Active",
                        value: "\(report.activeVehicles)",
                        icon: "location.fill",
                        color: .green
                    )

                    MetricCard(
                        title: "Utilization",
                        value: report.utilizationPercentage,
                        icon: "chart.bar.fill",
                        color: .purple,
                        trend: .up(report.utilizationRate * 10)
                    )

                    MetricCard(
                        title: "Avg Mileage",
                        value: String(format: "%.0f mi", report.avgMileage),
                        icon: "speedometer",
                        color: .orange
                    )
                }

                // Status Distribution Chart
                ChartCard(title: "Vehicle Status Distribution") {
                    Chart(viewModel.utilizationChartData) { item in
                        BarMark(
                            x: .value("Status", item.category),
                            y: .value("Count", item.value)
                        )
                        .foregroundStyle(by: .value("Status", item.category))
                        .cornerRadius(ModernTheme.CornerRadius.sm)
                    }
                    .frame(height: 200)
                    .chartLegend(position: .bottom)
                }

                // Department Breakdown
                ChartCard(title: "Vehicles by Department") {
                    Chart(report.vehiclesByDepartment.sorted(by: { $0.key < $1.key }), id: \.key) { dept, count in
                        SectorMark(
                            angle: .value("Count", count),
                            innerRadius: .ratio(0.6),
                            angularInset: 1.5
                        )
                        .foregroundStyle(by: .value("Department", dept))
                    }
                    .frame(height: 250)
                    .chartLegend(position: .bottom, spacing: 8)
                }
            }
        }
    }

    // MARK: - Fuel Analysis Content

    private var fuelAnalysisContent: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            if let report = viewModel.fuelConsumptionReport {
                // Summary Cards
                LazyVGrid(columns: ModernTheme.adaptiveColumns, spacing: ModernTheme.Spacing.md) {
                    MetricCard(
                        title: "Total Cost",
                        value: String(format: "$%.0f", report.totalFuelCost),
                        icon: "dollarsign.circle.fill",
                        color: .red
                    )

                    MetricCard(
                        title: "Fuel Used",
                        value: String(format: "%.0f gal", report.totalFuelUsed),
                        icon: "fuelpump.fill",
                        color: .blue
                    )

                    MetricCard(
                        title: "Average MPG",
                        value: report.efficiency,
                        icon: "gauge.medium",
                        color: .green,
                        trend: report.avgMPG > 20 ? .up(5) : .down(3)
                    )

                    MetricCard(
                        title: "Cost/Mile",
                        value: String(format: "$%.2f", report.avgCostPerMile),
                        icon: "chart.line.uptrend.xyaxis",
                        color: .orange
                    )
                }

                // Cost Trend Chart
                ChartCard(title: "Fuel Cost Trend") {
                    Chart(viewModel.fuelTrendData) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Cost", point.value)
                        )
                        .foregroundStyle(ModernTheme.Colors.primary)
                        .interpolationMethod(.catmullRom)

                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value("Cost", point.value)
                        )
                        .foregroundStyle(
                            .linearGradient(
                                colors: [ModernTheme.Colors.primary.opacity(0.3), ModernTheme.Colors.primary.opacity(0.0)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                    }
                    .frame(height: 200)
                    .chartXAxis {
                        AxisMarks(values: .automatic(desiredCount: 5))
                    }
                }

                // Top Consumers
                ChartCard(title: "Top Fuel Consumers") {
                    Chart(report.fuelByVehicle.sorted { $0.value > $1.value }.prefix(10), id: \.key) { vehicle, cost in
                        BarMark(
                            x: .value("Cost", cost),
                            y: .value("Vehicle", vehicle)
                        )
                        .foregroundStyle(ModernTheme.Colors.primary)
                        .cornerRadius(ModernTheme.CornerRadius.xs)
                    }
                    .frame(height: 300)
                }
            }
        }
    }

    // MARK: - Maintenance Cost Content

    private var maintenanceCostContent: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            if let report = viewModel.maintenanceCostReport {
                // Summary Cards
                LazyVGrid(columns: ModernTheme.adaptiveColumns, spacing: ModernTheme.Spacing.md) {
                    MetricCard(
                        title: "Total Cost",
                        value: String(format: "$%.0f", report.totalCost),
                        icon: "dollarsign.circle.fill",
                        color: .orange
                    )

                    MetricCard(
                        title: "Scheduled",
                        value: String(format: "$%.0f", report.scheduledMaintenance),
                        icon: "calendar.badge.checkmark",
                        color: .green
                    )

                    MetricCard(
                        title: "Unscheduled",
                        value: String(format: "$%.0f", report.unscheduledMaintenance),
                        icon: "exclamationmark.triangle.fill",
                        color: .red
                    )

                    MetricCard(
                        title: "Cost/Vehicle",
                        value: String(format: "$%.0f", report.costPerVehicle),
                        icon: "car.fill",
                        color: .purple
                    )
                }

                // Cost Trend
                ChartCard(title: "Maintenance Cost Trend") {
                    Chart(viewModel.costTrendData) { point in
                        BarMark(
                            x: .value("Date", point.date, unit: .day),
                            y: .value("Cost", point.value)
                        )
                        .foregroundStyle(ModernTheme.Colors.warning)
                        .cornerRadius(ModernTheme.CornerRadius.xs)
                    }
                    .frame(height: 200)
                    .chartXAxis {
                        AxisMarks(values: .automatic(desiredCount: 5))
                    }
                }

                // Cost by Type
                ChartCard(title: "Cost by Service Type") {
                    Chart(report.costByType.sorted { $0.value > $1.value }, id: \.key) { type, cost in
                        SectorMark(
                            angle: .value("Cost", cost),
                            innerRadius: .ratio(0.6),
                            angularInset: 1.5
                        )
                        .foregroundStyle(by: .value("Type", type))
                    }
                    .frame(height: 250)
                    .chartLegend(position: .bottom, spacing: 8)
                }

                // Upcoming & Overdue
                HStack(spacing: ModernTheme.Spacing.md) {
                    AlertCard(
                        title: "Upcoming",
                        count: report.upcomingMaintenance,
                        icon: "clock.arrow.circlepath",
                        color: .blue
                    )

                    AlertCard(
                        title: "Overdue",
                        count: report.overdueMaintenance,
                        icon: "exclamationmark.circle.fill",
                        color: .red
                    )
                }
            }
        }
    }

    // MARK: - Driver Performance Content

    private var driverPerformanceContent: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            if let report = viewModel.driverPerformanceReport {
                // Summary Cards
                LazyVGrid(columns: ModernTheme.adaptiveColumns, spacing: ModernTheme.Spacing.md) {
                    MetricCard(
                        title: "Total Drivers",
                        value: "\(report.totalDrivers)",
                        icon: "person.3.fill",
                        color: .blue
                    )

                    MetricCard(
                        title: "Safety Score",
                        value: String(format: "%.1f", report.avgSafetyScore),
                        icon: "shield.fill",
                        color: .green,
                        trend: report.avgSafetyScore > 80 ? .up(5) : .down(5)
                    )

                    MetricCard(
                        title: "Efficiency",
                        value: String(format: "%.1f", report.avgEfficiencyScore),
                        icon: "gauge.medium",
                        color: .purple,
                        trend: .up(3)
                    )

                    MetricCard(
                        title: "Incidents",
                        value: "\(report.totalIncidents)",
                        icon: "exclamationmark.triangle.fill",
                        color: .orange
                    )
                }

                // Top Performers
                ChartCard(title: "Driver Performance Rankings") {
                    Chart(viewModel.performanceData.prefix(10)) { score in
                        BarMark(
                            x: .value("Score", score.overallScore),
                            y: .value("Driver", score.driverName)
                        )
                        .foregroundStyle(
                            score.overallScore > 80 ? ModernTheme.Colors.success :
                            score.overallScore > 60 ? ModernTheme.Colors.warning :
                            ModernTheme.Colors.error
                        )
                        .cornerRadius(ModernTheme.CornerRadius.xs)
                    }
                    .frame(height: 350)
                }

                // Driver List
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                    Text("Driver Details")
                        .font(ModernTheme.Typography.headline)
                        .padding(.horizontal)

                    ForEach(viewModel.performanceData.prefix(5)) { driver in
                        DriverScoreRow(score: driver)
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct DateRangeButton: View {
    let title: String
    let range: DateRange
    @ObservedObject var viewModel: ReportsViewModel

    var body: some View {
        Button(action: {
            viewModel.updateDateRange(range)
        }) {
            Text(title)
                .font(ModernTheme.Typography.caption1)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    viewModel.selectedDateRange.start == range.start ?
                    ModernTheme.Colors.primary : ModernTheme.Colors.tertiaryBackground
                )
                .foregroundColor(
                    viewModel.selectedDateRange.start == range.start ?
                    .white : ModernTheme.Colors.primaryText
                )
                .cornerRadius(ModernTheme.CornerRadius.sm)
        }
    }
}

struct TabButton: View {
    let title: String
    let icon: String
    let index: Int
    @Binding var selected: Int

    var body: some View {
        Button(action: { selected = index }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title3)
                Text(title)
                    .font(ModernTheme.Typography.caption1)
            }
            .frame(minWidth: 80)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(
                selected == index ?
                ModernTheme.Colors.primary : ModernTheme.Colors.tertiaryBackground
            )
            .foregroundColor(
                selected == index ? .white : ModernTheme.Colors.primaryText
            )
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var trend: TrendIndicator? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
                if let trend = trend {
                    HStack(spacing: 2) {
                        Image(systemName: trend.icon)
                        Text(trend.displayText)
                    }
                    .font(.caption2)
                    .foregroundColor(trendColor(trend))
                }
            }

            Text(value)
                .font(ModernTheme.Typography.title2)
                .fontWeight(.bold)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    private func trendColor(_ trend: TrendIndicator) -> Color {
        switch trend.color {
        case "green": return .green
        case "red": return .red
        default: return .gray
        }
    }
}

struct ChartCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text(title)
                .font(ModernTheme.Typography.headline)

            content
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

struct AlertCard: View {
    let title: String
    let count: Int
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(color)

            Text("\(count)")
                .font(ModernTheme.Typography.title1)
                .fontWeight(.bold)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

struct DriverScoreRow: View {
    let score: DriverScore

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            VStack(alignment: .leading, spacing: 4) {
                Text(score.driverName)
                    .font(ModernTheme.Typography.bodyBold)

                Text("\(score.totalTrips) trips • \(String(format: "%.0f", score.totalMiles)) mi")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 8) {
                    ScoreBadge(label: "Safety", score: score.safetyScore, color: .green)
                    ScoreBadge(label: "Efficiency", score: score.efficiencyScore, color: .blue)
                }

                Text("Overall: \(String(format: "%.0f", score.overallScore))")
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .padding(.horizontal)
    }
}

struct ScoreBadge: View {
    let label: String
    let score: Double
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(String(format: "%.0f", score))
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.15))
        .cornerRadius(6)
    }
}

struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.5)
        }
    }
}

// MARK: - Export Sheet

struct ExportSheet: View {
    @ObservedObject var viewModel: ReportsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedFormat: ReportFormat = .pdf

    var body: some View {
        NavigationView {
            List {
                Section("Export Format") {
                    ForEach(ReportFormat.allCases, id: \.self) { format in
                        Button(action: { selectedFormat = format }) {
                            HStack {
                                Image(systemName: format.icon)
                                Text(format.rawValue)
                                Spacer()
                                if selectedFormat == format {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                        .foregroundColor(ModernTheme.Colors.primaryText)
                    }
                }

                Section {
                    Button("Export Report") {
                        if let report = viewModel.currentReport {
                            Task {
                                await viewModel.exportReport(report, format: selectedFormat)
                                dismiss()
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(ModernTheme.Colors.primary)
                }
            }
            .navigationTitle("Export Report")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Filter Sheet

struct FilterSheet: View {
    @ObservedObject var viewModel: ReportsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var filters: ReportFilters

    init(viewModel: ReportsViewModel) {
        self.viewModel = viewModel
        _filters = State(initialValue: viewModel.activeFilters)
    }

    var body: some View {
        NavigationView {
            List {
                Section("Vehicle Types") {
                    ForEach(VehicleType.allCases, id: \.self) { type in
                        Toggle(type.displayName, isOn: Binding(
                            get: { filters.vehicleTypes.contains(type) },
                            set: { isOn in
                                if isOn {
                                    filters.vehicleTypes.append(type)
                                } else {
                                    filters.vehicleTypes.removeAll { $0 == type }
                                }
                            }
                        ))
                    }
                }

                Section("Status") {
                    ForEach(VehicleStatus.allCases, id: \.self) { status in
                        Toggle(status.displayName, isOn: Binding(
                            get: { filters.statuses.contains(status) },
                            set: { isOn in
                                if isOn {
                                    filters.statuses.append(status)
                                } else {
                                    filters.statuses.removeAll { $0 == status }
                                }
                            }
                        ))
                    }
                }

                Section {
                    Button("Apply Filters") {
                        viewModel.updateFilters(filters)
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(ModernTheme.Colors.primary)

                    Button("Clear All") {
                        filters = ReportFilters()
                        viewModel.clearFilters()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Date Range Picker Sheet

struct DateRangePickerSheet: View {
    @ObservedObject var viewModel: ReportsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var startDate = Date()
    @State private var endDate = Date()

    var body: some View {
        NavigationView {
            Form {
                Section("Custom Date Range") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }

                Section {
                    Button("Apply") {
                        viewModel.updateDateRange(DateRange(start: startDate, end: endDate))
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(ModernTheme.Colors.primary)
                }
            }
            .navigationTitle("Select Date Range")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

#if DEBUG
struct ReportsView_Previews: PreviewProvider {
    static var previews: some View {
        ReportsView()
    }
}
#endif
