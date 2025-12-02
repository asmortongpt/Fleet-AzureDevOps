//
//  SustainabilityReportView.swift
//  Fleet Manager
//
//  Comprehensive Sustainability Report
//  Full environmental impact reporting and export
//

import SwiftUI
import Charts

struct SustainabilityReportView: View {
    @StateObject private var viewModel = EnvironmentalImpactViewModel()
    @State private var selectedReportType: ReportType = .monthly
    @State private var isGenerating = false
    @State private var showingExportOptions = false
    @State private var showingShareSheet = false
    @State private var reportURL: URL?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Report Type Selector
                reportTypeSelector

                // Generate Button
                if viewModel.emissionReport == nil {
                    generateReportButton
                } else {
                    // Report Content
                    reportContent
                }
            }
            .padding()
        }
        .navigationTitle("Sustainability Report")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if viewModel.emissionReport != nil {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: { showingExportOptions = true }) {
                        Image(systemName: "square.and.arrow.up")
                    }

                    Button(action: { Task { await regenerateReport() } }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .sheet(isPresented: $showingExportOptions) {
            exportOptionsSheet
        }
        .task {
            if viewModel.emissionsData.isEmpty {
                await viewModel.refresh()
            }
        }
    }

    // MARK: - Report Type Selector
    private var reportTypeSelector: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Report Period")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ReportType.allCases.filter { $0 != .custom }, id: \.self) { type in
                        Button(action: { selectedReportType = type }) {
                            Text(type.displayName)
                                .font(.subheadline)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(selectedReportType == type ? Color.blue : Color(.systemGray5))
                                .foregroundColor(selectedReportType == type ? .white : .primary)
                                .cornerRadius(10)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Generate Report Button
    private var generateReportButton: View {
        Button(action: { Task { await generateReport() } }) {
            HStack {
                if isGenerating {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Image(systemName: "doc.text.fill")
                }

                Text(isGenerating ? "Generating..." : "Generate Report")
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(isGenerating)
        .padding(.vertical, 20)
    }

    // MARK: - Report Content
    @ViewBuilder
    private var reportContent: some View {
        if let report = viewModel.emissionReport {
            VStack(spacing: 20) {
                // Report Header
                reportHeader(report)

                // Executive Summary
                executiveSummary(report)

                // Emissions Overview
                emissionsOverview(report)

                // Vehicle Breakdown
                vehicleBreakdown(report)

                // Fuel Type Analysis
                fuelTypeAnalysis(report)

                // Trends
                trendsSection(report)

                // Recommendations
                recommendationsSection(report)

                // Carbon Offset
                carbonOffsetSection
            }
        }
    }

    // MARK: - Report Header
    private func reportHeader(_ report: EmissionReport) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "leaf.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("Environmental Impact Report")
                .font(.title)
                .fontWeight(.bold)

            Text(report.reportType.displayName.uppercased())
                .font(.subheadline)
                .foregroundColor(.secondary)

            Text(report.period.displayString)
                .font(.caption)
                .foregroundColor(.secondary)

            Text("Generated on \(report.generatedDate, style: .date)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            LinearGradient(
                colors: [Color.green.opacity(0.1), Color.blue.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
    }

    // MARK: - Executive Summary
    private func executiveSummary(_ report: EmissionReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Executive Summary")
                .font(.headline)

            VStack(spacing: 16) {
                SummaryMetric(
                    title: "Total CO2 Emissions",
                    value: String(format: "%.1f kg", report.totalCO2),
                    icon: "cloud.fill",
                    color: .red
                )

                SummaryMetric(
                    title: "Fleet Efficiency",
                    value: String(format: "%.1f MPG", report.totalDistance / report.totalFuel),
                    icon: "speedometer",
                    color: .green
                )

                SummaryMetric(
                    title: "Distance Traveled",
                    value: String(format: "%.0f miles", report.totalDistance),
                    icon: "road.lanes",
                    color: .blue
                )

                SummaryMetric(
                    title: "Fuel Consumed",
                    value: String(format: "%.1f gallons", report.totalFuel),
                    icon: "fuelpump.fill",
                    color: .orange
                )
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Emissions Overview
    private func emissionsOverview(_ report: EmissionReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Emissions Breakdown")
                .font(.headline)

            VStack(spacing: 16) {
                EmissionMetricRow(
                    type: "CO2",
                    value: report.totalCO2,
                    unit: "kg",
                    color: .red,
                    description: "Carbon Dioxide - Primary greenhouse gas"
                )

                EmissionMetricRow(
                    type: "NOx",
                    value: report.totalNOx,
                    unit: "kg",
                    color: .orange,
                    description: "Nitrogen Oxides - Air pollutant"
                )

                EmissionMetricRow(
                    type: "PM2.5",
                    value: report.totalPM25,
                    unit: "kg",
                    color: .yellow,
                    description: "Particulate Matter - Health hazard"
                )
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)

            // Emissions per mile
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Emissions per Mile")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text(String(format: "%.3f kg CO2/mi", report.averageEmissionsPerMile))
                        .font(.title3)
                        .fontWeight(.semibold)
                }

                Spacer()

                Image(systemName: "chart.line.downtrend.xyaxis")
                    .font(.title)
                    .foregroundColor(.green)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Vehicle Breakdown
    private func vehicleBreakdown(_ report: EmissionReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Vehicle Breakdown")
                .font(.headline)

            Text("\(report.vehicleBreakdown.count) vehicles tracked")
                .font(.caption)
                .foregroundColor(.secondary)

            // Top emitters
            VStack(alignment: .leading, spacing: 8) {
                Text("Top Emitters")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                let topEmitters = report.vehicleBreakdown.sorted { $0.co2 > $1.co2 }.prefix(5)

                ForEach(topEmitters) { vehicle in
                    VehicleEmissionRow(vehicle: vehicle)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)

            // Best performers
            VStack(alignment: .leading, spacing: 8) {
                Text("Best Performers")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                let bestPerformers = report.vehicleBreakdown.sorted { $0.mpg > $1.mpg }.prefix(5)

                ForEach(bestPerformers) { vehicle in
                    VehicleEmissionRow(vehicle: vehicle)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Fuel Type Analysis
    private func fuelTypeAnalysis(_ report: EmissionReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fuel Type Analysis")
                .font(.headline)

            Chart {
                ForEach(report.fuelTypeBreakdown) { fuelData in
                    SectorMark(
                        angle: .value("Emissions", fuelData.totalCO2),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .cornerRadius(4)
                    .foregroundStyle(by: .value("Fuel Type", fuelData.fuelType.displayName))
                }
            }
            .frame(height: 250)

            VStack(spacing: 8) {
                ForEach(report.fuelTypeBreakdown) { fuelData in
                    FuelTypeRow(fuelData: fuelData)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Trends Section
    private func trendsSection(_ report: EmissionReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Trend Analysis")
                .font(.headline)

            VStack(spacing: 12) {
                TrendSummaryCard(
                    title: "CO2 Emissions",
                    trend: report.trends.co2Trend,
                    icon: "cloud.fill",
                    isInverse: true
                )

                TrendSummaryCard(
                    title: "Fuel Efficiency",
                    trend: report.trends.mpgTrend,
                    icon: "speedometer",
                    isInverse: false
                )

                TrendSummaryCard(
                    title: "Idle Time",
                    trend: report.trends.idleTimeTrend,
                    icon: "clock.fill",
                    isInverse: true
                )
            }
        }
    }

    // MARK: - Recommendations Section
    private func recommendationsSection(_ report: EmissionReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.headline)

            if !report.recommendations.isEmpty {
                VStack(spacing: 10) {
                    ForEach(Array(report.recommendations.enumerated()), id: \.offset) { index, recommendation in
                        HStack(alignment: .top, spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Color.blue.opacity(0.2))
                                    .frame(width: 30, height: 30)

                                Text("\(index + 1)")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.blue)
                            }

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
                Text("No recommendations at this time. Your fleet is performing well!")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
            }
        }
    }

    // MARK: - Carbon Offset Section
    private var carbonOffsetSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Carbon Offset Summary")
                .font(.headline)

            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Total Emissions")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text(String(format: "%.1f kg", viewModel.carbonFootprint?.totalCO2Emissions ?? 0))
                            .font(.title3)
                            .fontWeight(.semibold)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Offset Credits")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text(String(format: "%.1f kg", viewModel.carbonFootprint?.offsetCredits ?? 0))
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                }

                if viewModel.carbonOffsetNeeded > 0 {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Carbon Neutral Goal")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        Text("Purchase \(String(format: "%.0f", viewModel.carbonOffsetNeeded)) kg of carbon offsets to achieve net-zero emissions.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .fixedSize(horizontal: false, vertical: true)

                        Button(action: { /* Navigate to offset programs */ }) {
                            Text("View Offset Programs")
                                .font(.footnote)
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Export Options Sheet
    private var exportOptionsSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Export Format")) {
                    Button(action: { Task { await exportAsCSV() } }) {
                        HStack {
                            Image(systemName: "tablecells")
                            Text("Export as CSV")
                        }
                    }

                    Button(action: { /* Export PDF */ }) {
                        HStack {
                            Image(systemName: "doc.fill")
                            Text("Export as PDF")
                        }
                    }

                    Button(action: { /* Export JSON */ }) {
                        HStack {
                            Image(systemName: "doc.badge.gearshape")
                            Text("Export as JSON")
                        }
                    }
                }

                Section(header: Text("Share")) {
                    Button(action: { Task { await shareReport() } }) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Share Report")
                        }
                    }
                }
            }
            .navigationTitle("Export Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingExportOptions = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Methods
    private func generateReport() async {
        isGenerating = true
        let _ = await viewModel.generateReport(type: selectedReportType)
        isGenerating = false
    }

    private func regenerateReport() async {
        let _ = await viewModel.generateReport(type: selectedReportType)
    }

    private func exportAsCSV() async {
        reportURL = await viewModel.exportReport()
        showingExportOptions = false
        if reportURL != nil {
            showingShareSheet = true
        }
    }

    private func shareReport() async {
        if reportURL == nil {
            reportURL = await viewModel.exportReport()
        }
        showingExportOptions = false
        if reportURL != nil {
            showingShareSheet = true
        }
    }
}

// MARK: - Supporting Views
struct SummaryMetric: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.title3)
                    .fontWeight(.semibold)
            }

            Spacer()
        }
    }
}

struct EmissionMetricRow: View {
    let type: String
    let value: Double
    let unit: String
    let color: Color
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(type)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Spacer()

                Text("\(String(format: "%.2f", value)) \(unit)")
                    .font(.headline)
                    .foregroundColor(color)
            }

            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

struct VehicleEmissionRow: View {
    let vehicle: VehicleEmissions

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(vehicle.vehicleNumber)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("\(vehicle.fuelType.displayName) • \(String(format: "%.1f", vehicle.mpg)) MPG")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(String(format: "%.1f", vehicle.co2)) kg")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("\(String(format: "%.0f", vehicle.distance)) mi")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct FuelTypeRow: View {
    let fuelData: FuelTypeEmissions

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(fuelData.fuelType.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("\(fuelData.vehicleCount) vehicles • \(String(format: "%.1f", fuelData.averageMPG)) MPG avg")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("\(String(format: "%.1f%%", fuelData.percentage))")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("\(String(format: "%.1f", fuelData.totalCO2)) kg")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct TrendSummaryCard: View {
    let title: String
    let trend: TrendData
    let icon: String
    let isInverse: Bool

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("\(String(format: "%.1f", trend.currentValue)) (current)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            HStack(spacing: 6) {
                Image(systemName: trend.direction.icon)
                    .font(.caption)

                Text("\(String(format: "%.1f%%", abs(trend.percentageChange)))")
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
        .background(Color(.systemGray6))
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
        SustainabilityReportView()
    }
}
