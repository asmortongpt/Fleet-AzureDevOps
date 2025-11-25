//
//  EnvironmentalDashboardView.swift
//  Fleet Manager
//
//  Environmental Impact Dashboard
//  Overall metrics, emissions tracking, and sustainability overview
//

import SwiftUI
import Charts

struct EnvironmentalDashboardView: View {
    @StateObject private var viewModel = EnvironmentalImpactViewModel()
    @State private var selectedTab = 0
    @State private var showingReportOptions = false
    @State private var showingFilters = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Summary Cards
                    summaryCardsSection

                    // Fleet Sustainability Score
                    sustainabilityScoreSection

                    // Period Selector
                    periodSelectorSection

                    // Quick Actions
                    quickActionsSection

                    // Emissions Overview
                    emissionsOverviewSection

                    // Fuel Type Breakdown
                    fuelTypeBreakdownSection

                    // Top Performers & Concerns
                    performanceSection

                    // Recommendations
                    recommendationsSection

                    // Carbon Offset
                    carbonOffsetSection
                }
                .padding()
            }
            .navigationTitle("Environmental Impact")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: { showingFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }

                    Button(action: { showingReportOptions = true }) {
                        Image(systemName: "square.and.arrow.up")
                    }

                    Button(action: { Task { await viewModel.refresh() } }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(isPresented: $showingReportOptions) {
                reportOptionsSheet
            }
            .sheet(isPresented: $showingFilters) {
                filtersSheet
            }
            .task {
                if viewModel.emissionsData.isEmpty {
                    await viewModel.refresh()
                }
            }
        }
    }

    // MARK: - Summary Cards
    private var summaryCardsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
            MetricCard(
                title: "Total CO2",
                value: formatEmissions(viewModel.totalEmissions),
                subtitle: "kg this period",
                icon: "cloud.fill",
                color: .red,
                trend: viewModel.emissionReport?.trends.co2Trend
            )

            MetricCard(
                title: "Fleet MPG",
                value: String(format: "%.1f", viewModel.averageMPG),
                subtitle: "average",
                icon: "fuelpump.fill",
                color: .green,
                trend: viewModel.emissionReport?.trends.mpgTrend
            )

            MetricCard(
                title: "Idle Time",
                value: String(format: "%.1f%%", viewModel.averageIdlePercentage),
                subtitle: "of runtime",
                icon: "clock.fill",
                color: .orange,
                trend: viewModel.emissionReport?.trends.idleTimeTrend
            )

            MetricCard(
                title: "Vehicles",
                value: "\(viewModel.emissionsData.count)",
                subtitle: "tracked",
                icon: "car.2.fill",
                color: .blue,
                trend: nil
            )
        }
    }

    // MARK: - Sustainability Score
    private var sustainabilityScoreSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fleet Sustainability Score")
                .font(.headline)

            HStack(spacing: 20) {
                // Circular progress indicator
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 15)
                        .frame(width: 120, height: 120)

                    Circle()
                        .trim(from: 0, to: viewModel.fleetSustainabilityScore / 100)
                        .stroke(
                            scoreColor(viewModel.fleetSustainabilityScore),
                            style: StrokeStyle(lineWidth: 15, lineCap: .round)
                        )
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(-90))

                    VStack(spacing: 4) {
                        Text("\(Int(viewModel.fleetSustainabilityScore))")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(scoreColor(viewModel.fleetSustainabilityScore))

                        Text("/ 100")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text(scoreCategory(viewModel.fleetSustainabilityScore))
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text("Based on MPG, emissions, idle time, and vehicle age")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    NavigationLink(destination: VehicleComparisonView()) {
                        Text("View Details")
                            .font(.footnote)
                            .foregroundColor(.blue)
                    }
                }

                Spacer()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Period Selector
    private var periodSelectorSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Time Period")
                .font(.headline)

            HStack(spacing: 12) {
                PeriodButton(title: "7D", isSelected: false) {
                    updatePeriod(days: 7)
                }

                PeriodButton(title: "30D", isSelected: true) {
                    updatePeriod(days: 30)
                }

                PeriodButton(title: "90D", isSelected: false) {
                    updatePeriod(days: 90)
                }

                PeriodButton(title: "1Y", isSelected: false) {
                    updatePeriod(days: 365)
                }

                Spacer()

                Button(action: { /* Show date picker */ }) {
                    HStack {
                        Image(systemName: "calendar")
                        Text("Custom")
                    }
                    .font(.footnote)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
                }
            }
        }
    }

    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 12) {
                NavigationLink(destination: EmissionsChartView()) {
                    QuickActionCard(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "Trends",
                        color: .purple
                    )
                }

                NavigationLink(destination: VehicleComparisonView()) {
                    QuickActionCard(
                        icon: "chart.bar.fill",
                        title: "Compare",
                        color: .orange
                    )
                }

                NavigationLink(destination: SustainabilityReportView()) {
                    QuickActionCard(
                        icon: "doc.text.fill",
                        title: "Report",
                        color: .green
                    )
                }

                Button(action: { Task { await exportReport() } }) {
                    QuickActionCard(
                        icon: "square.and.arrow.up",
                        title: "Export",
                        color: .blue
                    )
                }
            }
        }
    }

    // MARK: - Emissions Overview
    private var emissionsOverviewSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Emissions Breakdown")
                    .font(.headline)

                Spacer()

                NavigationLink(destination: EmissionsChartView()) {
                    Text("View Charts")
                        .font(.footnote)
                        .foregroundColor(.blue)
                }
            }

            if let footprint = viewModel.carbonFootprint {
                VStack(spacing: 10) {
                    EmissionBar(
                        title: "CO2",
                        value: footprint.totalCO2Emissions,
                        unit: "kg",
                        color: .red,
                        maxValue: footprint.totalCO2Emissions
                    )

                    EmissionBar(
                        title: "NOx",
                        value: footprint.totalNOxEmissions,
                        unit: "kg",
                        color: .orange,
                        maxValue: footprint.totalCO2Emissions
                    )

                    EmissionBar(
                        title: "PM2.5",
                        value: footprint.totalPM25Emissions,
                        unit: "kg",
                        color: .yellow,
                        maxValue: footprint.totalCO2Emissions
                    )
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Fuel Type Breakdown
    private var fuelTypeBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fuel Type Distribution")
                .font(.headline)

            let fuelTypes = Dictionary(grouping: viewModel.emissionsData) { $0.fuelType }

            VStack(spacing: 10) {
                ForEach(Array(fuelTypes.keys.sorted(by: { $0.rawValue < $1.rawValue })), id: \.self) { fuelType in
                    let count = fuelTypes[fuelType]?.count ?? 0
                    let totalCO2 = fuelTypes[fuelType]?.reduce(0) { $0 + $1.co2Emissions } ?? 0

                    HStack {
                        Image(systemName: fuelTypeIcon(fuelType))
                            .foregroundColor(fuelTypeColor(fuelType))
                            .frame(width: 30)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(fuelType.displayName)
                                .font(.subheadline)
                                .fontWeight(.medium)

                            Text("\(count) vehicles • \(formatEmissions(totalCO2)) kg CO2")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                }
            }
        }
    }

    // MARK: - Performance Section
    private var performanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Vehicle Performance")
                .font(.headline)

            HStack(spacing: 12) {
                // Top Performers
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                        Text("Top Performers")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }

                    let topPerformers = viewModel.sustainabilityMetrics
                        .sorted { $0.sustainabilityScore > $1.sustainabilityScore }
                        .prefix(3)

                    ForEach(topPerformers) { metric in
                        VehiclePerformanceRow(metric: metric)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Needs Attention
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("Needs Attention")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }

                    let needsAttention = viewModel.sustainabilityMetrics
                        .sorted { $0.sustainabilityScore < $1.sustainabilityScore }
                        .prefix(3)

                    ForEach(needsAttention) { metric in
                        VehiclePerformanceRow(metric: metric)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Recommendations
    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.headline)

            if let report = viewModel.emissionReport, !report.recommendations.isEmpty {
                VStack(spacing: 10) {
                    ForEach(report.recommendations, id: \.self) { recommendation in
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: "lightbulb.fill")
                                .foregroundColor(.yellow)
                                .frame(width: 24)

                            Text(recommendation)
                                .font(.subheadline)
                                .fixedSize(horizontal: false, vertical: true)

                            Spacer()
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    }
                }
            } else {
                Text("Loading recommendations...")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
            }
        }
    }

    // MARK: - Carbon Offset
    private var carbonOffsetSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Carbon Offset")
                .font(.headline)

            VStack(spacing: 16) {
                // Offset Progress
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Current Offset")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        Text("\(formatEmissions(viewModel.carbonFootprint?.offsetCredits ?? 0)) kg")
                            .font(.title3)
                            .fontWeight(.semibold)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Needed")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        Text("\(formatEmissions(viewModel.carbonOffsetNeeded)) kg")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.orange)
                    }
                }

                // Progress Bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 10)
                            .cornerRadius(5)

                        let total = viewModel.carbonFootprint?.totalCO2Emissions ?? 1
                        let offset = viewModel.carbonFootprint?.offsetCredits ?? 0
                        let percentage = min(offset / total, 1.0)

                        Rectangle()
                            .fill(Color.green)
                            .frame(width: geometry.size.width * percentage, height: 10)
                            .cornerRadius(5)
                    }
                }
                .frame(height: 10)

                // Offset Programs
                if !viewModel.offsetPrograms.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Active Programs")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        ForEach(viewModel.offsetPrograms) { program in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(program.name)
                                        .font(.footnote)
                                        .fontWeight(.medium)

                                    Text("\(formatEmissions(program.co2Offset)) kg offset")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }

                                Spacer()

                                Text(program.status.displayName)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(program.status.color).opacity(0.2))
                                    .foregroundColor(Color(program.status.color))
                                    .cornerRadius(8)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Report Options Sheet
    private var reportOptionsSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Generate Report")) {
                    Button(action: { generateReport(.daily) }) {
                        HStack {
                            Image(systemName: "doc.text")
                            Text("Daily Report")
                        }
                    }

                    Button(action: { generateReport(.weekly) }) {
                        HStack {
                            Image(systemName: "doc.text")
                            Text("Weekly Report")
                        }
                    }

                    Button(action: { generateReport(.monthly) }) {
                        HStack {
                            Image(systemName: "doc.text")
                            Text("Monthly Report")
                        }
                    }

                    Button(action: { generateReport(.yearly) }) {
                        HStack {
                            Image(systemName: "doc.text")
                            Text("Annual Report")
                        }
                    }
                }

                Section(header: Text("Export Options")) {
                    Button(action: { Task { await exportReport() } }) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Export as CSV")
                        }
                    }

                    Button(action: { /* Export PDF */ }) {
                        HStack {
                            Image(systemName: "doc.fill")
                            Text("Export as PDF")
                        }
                    }
                }
            }
            .navigationTitle("Report Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingReportOptions = false
                    }
                }
            }
        }
    }

    // MARK: - Filters Sheet
    private var filtersSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Fuel Type")) {
                    Picker("Filter by Fuel Type", selection: $viewModel.selectedFuelType) {
                        Text("All").tag(nil as FuelType?)
                        ForEach(FuelType.allCases, id: \.self) { fuelType in
                            Text(fuelType.displayName).tag(fuelType as FuelType?)
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilters = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Methods
    private func updatePeriod(days: Int) {
        viewModel.selectedPeriod = DatePeriod(
            startDate: Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date(),
            endDate: Date()
        )
        Task {
            await viewModel.refresh()
        }
    }

    private func generateReport(_ type: ReportType) {
        Task {
            let _ = await viewModel.generateReport(type: type)
            showingReportOptions = false
        }
    }

    private func exportReport() async {
        if let url = await viewModel.exportReport() {
            // Share the file
            print("Report exported to: \(url)")
        }
    }

    private func formatEmissions(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "%.1f", value / 1000)
        }
        return String(format: "%.0f", value)
    }

    private func scoreColor(_ score: Double) -> Color {
        switch score {
        case 80...100: return .green
        case 60..<80: return .yellow
        case 40..<60: return .orange
        default: return .red
        }
    }

    private func scoreCategory(_ score: Double) -> String {
        switch score {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        case 20..<40: return "Poor"
        default: return "Critical"
        }
    }

    private func fuelTypeIcon(_ fuelType: FuelType) -> String {
        switch fuelType {
        case .electric: return "bolt.fill"
        case .hybrid: return "leaf.fill"
        case .gasoline: return "fuelpump.fill"
        case .diesel: return "fuelpump.fill"
        case .cng: return "cloud.fill"
        case .propane: return "flame.fill"
        }
    }

    private func fuelTypeColor(_ fuelType: FuelType) -> Color {
        switch fuelType {
        case .electric: return .green
        case .hybrid: return .mint
        case .gasoline: return .blue
        case .diesel: return .orange
        case .cng: return .purple
        case .propane: return .red
        }
    }
}

// MARK: - Supporting Views
struct MetricCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    let trend: TrendData?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
                if let trend = trend {
                    HStack(spacing: 4) {
                        Image(systemName: trend.direction.icon)
                            .font(.caption)
                        Text("\(String(format: "%.1f", abs(trend.percentageChange)))%")
                            .font(.caption)
                    }
                    .foregroundColor(Color(trend.direction.color))
                }
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PeriodButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.footnote)
                .fontWeight(.semibold)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(8)
        }
    }
}

struct QuickActionCard: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .fontWeight(.medium)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct EmissionBar: View {
    let title: String
    let value: Double
    let unit: String
    let color: Color
    let maxValue: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Spacer()

                Text("\(String(format: "%.1f", value)) \(unit)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)

                    let percentage = maxValue > 0 ? min(value / maxValue, 1.0) : 0

                    Rectangle()
                        .fill(color)
                        .frame(width: geometry.size.width * percentage, height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
    }
}

struct VehiclePerformanceRow: View {
    let metric: SustainabilityMetrics

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(metric.vehicleNumber)
                    .font(.caption)
                    .fontWeight(.medium)

                Text("\(String(format: "%.1f", metric.mpg)) MPG")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("\(Int(metric.sustainabilityScore))")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color(metric.scoreColor))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(metric.scoreColor).opacity(0.2))
                .cornerRadius(6)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    EnvironmentalDashboardView()
}
