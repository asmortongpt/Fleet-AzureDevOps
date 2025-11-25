//
//  FleetAnalyticsView.swift
//  Fleet Manager - iOS Native App
//
//  Fleet Analytics Dashboard
//  Provides comprehensive analytics with charts, metrics, and trends
//

import SwiftUI
import Charts

struct FleetAnalyticsView: View {
    @StateObject private var viewModel = AnalyticsViewModel()
    @State private var selectedTab: AnalyticsTab = .overview
    @State private var showExportSheet = false

    enum AnalyticsTab: String, CaseIterable {
        case overview = "Overview"
        case utilization = "Utilization"
        case costs = "Costs"
        case trends = "Trends"

        var icon: String {
            switch self {
            case .overview: return "chart.bar.fill"
            case .utilization: return "gauge"
            case .costs: return "dollarsign.circle.fill"
            case .trends: return "chart.line.uptrend.xyaxis"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                tabSelector

                // Content
                ScrollView {
                    VStack(spacing: 20) {
                        // Date Range Selector
                        dateRangeSelector

                        // Tab Content
                        if viewModel.isLoading {
                            ProgressView("Loading analytics...")
                                .padding(.top, 100)
                        } else if let error = viewModel.errorMessage {
                            ErrorView(message: error) {
                                Task {
                                    await viewModel.fetchAllAnalytics()
                                }
                            }
                        } else {
                            switch selectedTab {
                            case .overview:
                                overviewContent
                            case .utilization:
                                utilizationContent
                            case .costs:
                                costsContent
                            case .trends:
                                trendsContent
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Fleet Analytics")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showExportSheet = true }) {
                            Label("Export PDF", systemImage: "doc.fill")
                        }
                        Button(action: { showExportSheet = true }) {
                            Label("Export CSV", systemImage: "tablecells")
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
            .sheet(isPresented: $showExportSheet) {
                exportSheet
            }
            .task {
                await viewModel.fetchAllAnalytics()
            }
        }
    }

    // MARK: - Tab Selector

    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(AnalyticsTab.allCases, id: \.self) { tab in
                    Button(action: {
                        withAnimation {
                            selectedTab = tab
                        }
                    }) {
                        VStack(spacing: 4) {
                            Image(systemName: tab.icon)
                                .font(.title3)
                            Text(tab.rawValue)
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        .frame(minWidth: 80)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 16)
                        .background(
                            selectedTab == tab
                                ? Color.blue.opacity(0.15)
                                : Color.gray.opacity(0.1)
                        )
                        .foregroundColor(selectedTab == tab ? .blue : .primary)
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }

    // MARK: - Date Range Selector

    private var dateRangeSelector: some View {
        Picker("Date Range", selection: $viewModel.selectedDateRange) {
            ForEach(AnalyticsViewModel.DateRange.allCases, id: \.self) { range in
                Text(range.rawValue).tag(range)
            }
        }
        .pickerStyle(MenuPickerStyle())
        .padding(.horizontal)
    }

    // MARK: - Overview Content

    private var overviewContent: some View {
        VStack(spacing: 16) {
            if let metrics = viewModel.fleetMetrics {
                // Key Metrics Cards
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        MetricCard(
                            title: "Total Vehicles",
                            value: "\(metrics.totalVehicles)",
                            icon: "car.2.fill",
                            color: .blue
                        )
                        MetricCard(
                            title: "Active",
                            value: "\(metrics.activeVehicles)",
                            icon: "checkmark.circle.fill",
                            color: .green
                        )
                    }

                    HStack(spacing: 12) {
                        MetricCard(
                            title: "Total Cost",
                            value: metrics.formattedTotalCost,
                            icon: "dollarsign.circle.fill",
                            color: .orange
                        )
                        MetricCard(
                            title: "Cost/Mile",
                            value: metrics.formattedCostPerMile,
                            icon: "chart.line.downtrend.xyaxis",
                            color: .purple
                        )
                    }

                    HStack(spacing: 12) {
                        MetricCard(
                            title: "Utilization",
                            value: metrics.formattedUtilization,
                            icon: "gauge",
                            color: .green
                        )
                        MetricCard(
                            title: "Avg MPG",
                            value: metrics.formattedFuelEfficiency,
                            icon: "fuelpump.fill",
                            color: .blue
                        )
                    }
                }

                // Quick Stats
                VStack(alignment: .leading, spacing: 12) {
                    Text("Quick Stats")
                        .font(.headline)
                        .padding(.horizontal)

                    VStack(spacing: 8) {
                        StatRow(
                            label: "Total Miles Driven",
                            value: String(format: "%.0f mi", metrics.totalMilesDriven)
                        )
                        StatRow(
                            label: "Maintenance Events",
                            value: "\(metrics.maintenanceEvents)"
                        )
                        StatRow(
                            label: "Downtime Hours",
                            value: String(format: "%.1f hrs", metrics.downtimeHours)
                        )
                        StatRow(
                            label: "Idle Vehicles",
                            value: "\(metrics.idleVehicles)"
                        )
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                }
            }
        }
    }

    // MARK: - Utilization Content

    private var utilizationContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Vehicle Utilization")
                .font(.headline)

            if !viewModel.utilizationData.isEmpty {
                // Utilization Bar Chart
                VStack(alignment: .leading, spacing: 8) {
                    Text("Utilization Rate by Vehicle")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Chart(viewModel.utilizationData) { data in
                        BarMark(
                            x: .value("Vehicle", data.vehicleNumber),
                            y: .value("Utilization", data.utilizationRate * 100)
                        )
                        .foregroundStyle(by: .value("Rate", data.formattedUtilization))
                    }
                    .frame(height: 250)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                // Utilization List
                VStack(alignment: .leading, spacing: 8) {
                    Text("Detailed Breakdown")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    ForEach(viewModel.utilizationData) { vehicle in
                        VStack(spacing: 8) {
                            HStack {
                                Text(vehicle.vehicleNumber)
                                    .font(.headline)
                                Spacer()
                                Text(vehicle.formattedUtilization)
                                    .font(.headline)
                                    .foregroundColor(vehicle.utilizationColor)
                            }

                            ProgressView(value: vehicle.utilizationRate)
                                .tint(vehicle.utilizationColor)

                            HStack {
                                Text("\(vehicle.activeHours)h active")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text(String(format: "%.0f mi", vehicle.milesDriven))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                // Navigation to detailed view
                NavigationLink(destination: VehicleUtilizationView(viewModel: viewModel)) {
                    HStack {
                        Text("View Detailed Analysis")
                            .font(.headline)
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(12)
                }
            }
        }
    }

    // MARK: - Costs Content

    private var costsContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Cost Analysis")
                .font(.headline)

            if let costs = viewModel.costData {
                // Cost Summary Cards
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        MetricCard(
                            title: "Total Cost",
                            value: costs.formattedTotalCost,
                            icon: "dollarsign.circle.fill",
                            color: .orange
                        )
                        MetricCard(
                            title: "Per Vehicle",
                            value: costs.formattedCostPerVehicle,
                            icon: "car.fill",
                            color: .blue
                        )
                    }
                }

                // Cost Breakdown Pie Chart
                VStack(alignment: .leading, spacing: 8) {
                    Text("Cost Breakdown")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Chart {
                        SectorMark(
                            angle: .value("Cost", costs.maintenanceCosts),
                            innerRadius: .ratio(0.5),
                            angularInset: 2
                        )
                        .foregroundStyle(Color.blue)
                        .annotation(position: .overlay) {
                            Text("Maint.")
                                .font(.caption2)
                                .foregroundColor(.white)
                        }

                        SectorMark(
                            angle: .value("Cost", costs.fuelCosts),
                            innerRadius: .ratio(0.5),
                            angularInset: 2
                        )
                        .foregroundStyle(Color.green)

                        SectorMark(
                            angle: .value("Cost", costs.insuranceCosts),
                            innerRadius: .ratio(0.5),
                            angularInset: 2
                        )
                        .foregroundStyle(Color.orange)

                        SectorMark(
                            angle: .value("Cost", costs.registrationCosts),
                            innerRadius: .ratio(0.5),
                            angularInset: 2
                        )
                        .foregroundStyle(Color.purple)

                        SectorMark(
                            angle: .value("Cost", costs.otherCosts),
                            innerRadius: .ratio(0.5),
                            angularInset: 2
                        )
                        .foregroundStyle(Color.gray)
                    }
                    .frame(height: 250)

                    // Legend
                    VStack(alignment: .leading, spacing: 8) {
                        CostLegendItem(color: .blue, label: "Maintenance", amount: costs.maintenanceCosts)
                        CostLegendItem(color: .green, label: "Fuel", amount: costs.fuelCosts)
                        CostLegendItem(color: .orange, label: "Insurance", amount: costs.insuranceCosts)
                        CostLegendItem(color: .purple, label: "Registration", amount: costs.registrationCosts)
                        CostLegendItem(color: .gray, label: "Other", amount: costs.otherCosts)
                    }
                    .padding(.top)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                // Navigation to detailed cost analysis
                NavigationLink(destination: CostAnalysisView(viewModel: viewModel)) {
                    HStack {
                        Text("View Detailed Cost Analysis")
                            .font(.headline)
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(12)
                }
            }
        }
    }

    // MARK: - Trends Content

    private var trendsContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Trends")
                .font(.headline)

            // Fuel Efficiency Trend
            if !viewModel.fuelEfficiencyTrend.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Fuel Efficiency Over Time")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Chart(viewModel.fuelEfficiencyTrend) { dataPoint in
                        LineMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("MPG", dataPoint.mpg)
                        )
                        .foregroundStyle(Color.green)
                        .interpolationMethod(.catmullRom)

                        AreaMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("MPG", dataPoint.mpg)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.green.opacity(0.3), Color.green.opacity(0.05)]),
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                    }
                    .frame(height: 200)
                    .chartYAxisLabel("MPG")
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
            }

            // Maintenance Cost Trend
            if !viewModel.maintenanceCostTrend.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Maintenance Costs Over Time")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Chart(viewModel.maintenanceCostTrend) { dataPoint in
                        BarMark(
                            x: .value("Date", dataPoint.date, unit: .month),
                            y: .value("Cost", dataPoint.cost)
                        )
                        .foregroundStyle(Color.orange)
                    }
                    .frame(height: 200)
                    .chartYAxisLabel("Cost ($)")
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
            }
        }
    }

    // MARK: - Export Sheet

    private var exportSheet: some View {
        NavigationView {
            List {
                Button(action: {
                    Task {
                        _ = await viewModel.exportToPDF()
                        showExportSheet = false
                    }
                }) {
                    Label("Export as PDF", systemImage: "doc.fill")
                }

                Button(action: {
                    Task {
                        _ = await viewModel.exportToCSV()
                        showExportSheet = false
                    }
                }) {
                    Label("Export as CSV", systemImage: "tablecells")
                }
            }
            .navigationTitle("Export Analytics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        showExportSheet = false
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct MetricCard: View {
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
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct StatRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
    }
}

struct CostLegendItem: View {
    let color: Color
    let label: String
    let amount: Double

    var body: some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 12, height: 12)
            Text(label)
                .font(.caption)
            Spacer()
            Text(String(format: "$%.2f", amount))
                .font(.caption)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - Preview

#Preview {
    FleetAnalyticsView()
}
