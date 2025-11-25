//
//  ReportPreviewView.swift
//  Fleet Manager - iOS Native App
//
//  Report Preview with Charts
//  Display generated reports with interactive charts and data tables
//

import SwiftUI
import Charts

struct ReportPreviewView: View {
    let report: GeneratedReport
    let chartType: ReportChartType
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab: PreviewTab = .chart
    @State private var showShareSheet = false

    enum PreviewTab: String, CaseIterable {
        case chart = "Chart"
        case table = "Table"
        case summary = "Summary"
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Report Header
                reportHeader

                // Tab Selector
                tabSelector

                // Content
                TabView(selection: $selectedTab) {
                    chartView
                        .tag(PreviewTab.chart)

                    tableView
                        .tag(PreviewTab.table)

                    summaryView
                        .tag(PreviewTab.summary)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle(report.templateName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showShareSheet = true }) {
                            Label("Share", systemImage: "square.and.arrow.up")
                        }

                        Button(action: { printReport() }) {
                            Label("Print", systemImage: "printer")
                        }

                        Button(action: { exportPDF() }) {
                            Label("Export PDF", systemImage: "doc.fill")
                        }

                        Button(action: { exportCSV() }) {
                            Label("Export CSV", systemImage: "tablecells")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
    }

    // MARK: - Report Header

    private var reportHeader: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Date Range")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(report.dateRange.displayText)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Generated")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(report.generatedDate, style: .relative)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
            }

            if let summary = report.summary {
                HStack {
                    Label("\(summary.totalRecords) records", systemImage: "doc.text.fill")
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(8)

                    Spacer()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
    }

    // MARK: - Tab Selector

    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(PreviewTab.allCases, id: \.self) { tab in
                Button(action: {
                    withAnimation {
                        selectedTab = tab
                    }
                }) {
                    VStack(spacing: 4) {
                        Text(tab.rawValue)
                            .font(.subheadline)
                            .fontWeight(selectedTab == tab ? .semibold : .regular)

                        if selectedTab == tab {
                            Rectangle()
                                .fill(Color.blue)
                                .frame(height: 2)
                        } else {
                            Rectangle()
                                .fill(Color.clear)
                                .frame(height: 2)
                        }
                    }
                    .foregroundColor(selectedTab == tab ? .blue : .secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal)
        .background(Color(.systemBackground))
    }

    // MARK: - Chart View

    private var chartView: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let chartData = report.chartData, !chartData.labels.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Visualization")
                            .font(.headline)
                            .padding(.horizontal)

                        chartForType(chartType, data: chartData)
                            .frame(height: 350)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                            .padding(.horizontal)
                    }
                } else {
                    EmptyStateView(
                        icon: "chart.bar.fill",
                        title: "No Chart Data",
                        description: "This report doesn't have chart data available"
                    )
                    .padding(.top, 100)
                }
            }
            .padding(.vertical)
        }
    }

    @ViewBuilder
    private func chartForType(_ type: ReportChartType, data: ChartData) -> some View {
        switch type {
        case .table:
            Text("Table view - See Table tab")
                .foregroundColor(.secondary)

        case .bar:
            barChart(data: data)

        case .line:
            lineChart(data: data)

        case .pie:
            pieChart(data: data)

        case .area:
            areaChart(data: data)

        case .scatter:
            scatterChart(data: data)
        }
    }

    private func barChart(data: ChartData) -> some View {
        Chart {
            ForEach(Array(zip(data.labels, data.datasets[0].values).enumerated()), id: \.offset) { index, item in
                BarMark(
                    x: .value("Category", item.0),
                    y: .value("Value", item.1)
                )
                .foregroundStyle(Color.blue.gradient)
            }
        }
        .chartXAxis {
            AxisMarks(position: .bottom) { value in
                AxisValueLabel()
                    .font(.caption2)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
    }

    private func lineChart(data: ChartData) -> some View {
        Chart {
            ForEach(Array(zip(data.labels, data.datasets[0].values).enumerated()), id: \.offset) { index, item in
                LineMark(
                    x: .value("Category", index),
                    y: .value("Value", item.1)
                )
                .foregroundStyle(Color.green)
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("Category", index),
                    y: .value("Value", item.1)
                )
                .foregroundStyle(Color.green)
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { value in
                if let index = value.as(Int.self), index < data.labels.count {
                    AxisValueLabel {
                        Text(data.labels[index])
                            .font(.caption2)
                    }
                }
            }
        }
    }

    private func pieChart(data: ChartData) -> some View {
        let colors: [Color] = [.blue, .green, .orange, .purple, .pink, .cyan, .yellow, .red]

        return Chart {
            ForEach(Array(zip(data.labels, data.datasets[0].values).enumerated()), id: \.offset) { index, item in
                SectorMark(
                    angle: .value("Value", item.1),
                    innerRadius: .ratio(0.5),
                    angularInset: 2
                )
                .foregroundStyle(colors[index % colors.count].gradient)
                .annotation(position: .overlay) {
                    VStack(spacing: 2) {
                        Text(item.0)
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text(String(format: "%.0f", item.1))
                            .font(.caption2)
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }

    private func areaChart(data: ChartData) -> some View {
        Chart {
            ForEach(Array(zip(data.labels, data.datasets[0].values).enumerated()), id: \.offset) { index, item in
                AreaMark(
                    x: .value("Category", index),
                    y: .value("Value", item.1)
                )
                .foregroundStyle(
                    LinearGradient(
                        gradient: Gradient(colors: [Color.blue.opacity(0.5), Color.blue.opacity(0.1)]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)

                LineMark(
                    x: .value("Category", index),
                    y: .value("Value", item.1)
                )
                .foregroundStyle(Color.blue)
                .interpolationMethod(.catmullRom)
            }
        }
        .chartXAxis {
            AxisMarks(values: .automatic) { value in
                if let index = value.as(Int.self), index < data.labels.count {
                    AxisValueLabel {
                        Text(data.labels[index])
                            .font(.caption2)
                    }
                }
            }
        }
    }

    private func scatterChart(data: ChartData) -> some View {
        Chart {
            ForEach(Array(zip(data.labels, data.datasets[0].values).enumerated()), id: \.offset) { index, item in
                PointMark(
                    x: .value("X", Double(index)),
                    y: .value("Y", item.1)
                )
                .foregroundStyle(Color.purple)
            }
        }
    }

    // MARK: - Table View

    private var tableView: some View {
        ScrollView {
            VStack(spacing: 16) {
                if !report.data.isEmpty {
                    // Extract column headers from first row
                    let headers = Array(report.data[0].keys.sorted())

                    VStack(spacing: 0) {
                        // Header Row
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 0) {
                                ForEach(headers, id: \.self) { header in
                                    Text(header)
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .frame(width: 120, alignment: .leading)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 12)
                                        .background(Color.blue)
                                }
                            }
                        }

                        // Data Rows
                        ScrollView {
                            LazyVStack(spacing: 0) {
                                ForEach(Array(report.data.enumerated()), id: \.offset) { index, row in
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: 0) {
                                            ForEach(headers, id: \.self) { header in
                                                Text(row[header]?.displayValue ?? "")
                                                    .font(.caption)
                                                    .frame(width: 120, alignment: .leading)
                                                    .padding(.horizontal, 12)
                                                    .padding(.vertical, 12)
                                                    .background(index % 2 == 0 ? Color(.systemBackground) : Color(.secondarySystemBackground))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .cornerRadius(8)
                    .padding(.horizontal)
                } else {
                    EmptyStateView(
                        icon: "tablecells",
                        title: "No Data",
                        description: "This report doesn't have any data"
                    )
                    .padding(.top, 100)
                }
            }
            .padding(.vertical)
        }
    }

    // MARK: - Summary View

    private var summaryView: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let summary = report.summary {
                    // Key Metrics
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Key Metrics")
                            .font(.headline)

                        VStack(spacing: 12) {
                            MetricRow(
                                label: "Total Records",
                                value: "\(summary.totalRecords)",
                                icon: "doc.text.fill",
                                color: .blue
                            )

                            if !summary.aggregations.isEmpty {
                                ForEach(Array(summary.aggregations.keys.sorted()), id: \.self) { key in
                                    if let value = summary.aggregations[key] {
                                        MetricRow(
                                            label: key,
                                            value: String(format: "%.2f", value),
                                            icon: "chart.bar.fill",
                                            color: .green
                                        )
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }

                    // Insights
                    if !summary.insights.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Insights")
                                .font(.headline)

                            VStack(spacing: 8) {
                                ForEach(summary.insights, id: \.self) { insight in
                                    HStack(alignment: .top, spacing: 12) {
                                        Image(systemName: "lightbulb.fill")
                                            .foregroundColor(.yellow)
                                            .font(.title3)

                                        Text(insight)
                                            .font(.subheadline)
                                            .foregroundColor(.primary)

                                        Spacer()
                                    }
                                    .padding()
                                    .background(Color(.systemBackground))
                                    .cornerRadius(8)
                                }
                            }
                        }
                        .padding(.top, 8)
                    }
                } else {
                    EmptyStateView(
                        icon: "chart.bar.doc.horizontal",
                        title: "No Summary",
                        description: "Summary data is not available for this report"
                    )
                    .padding(.top, 100)
                }
            }
            .padding()
        }
    }

    // MARK: - Actions

    private func printReport() {
        print("Print report: \(report.templateName)")
    }

    private func exportPDF() {
        print("Export PDF: \(report.templateName)")
    }

    private func exportCSV() {
        print("Export CSV: \(report.templateName)")
    }
}

// MARK: - Supporting Views

struct MetricRow: View {
    let label: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Preview

#Preview {
    let sampleReport = GeneratedReport(
        templateId: "1",
        templateName: "Fleet Summary",
        dateRange: DateRange.last30Days,
        data: [
            [
                "Vehicle Number": .string("V-001"),
                "Status": .string("Active"),
                "Mileage": .decimal(45000.0),
                "Fuel Level": .decimal(75.0)
            ],
            [
                "Vehicle Number": .string("V-002"),
                "Status": .string("Idle"),
                "Mileage": .decimal(32000.0),
                "Fuel Level": .decimal(50.0)
            ],
            [
                "Vehicle Number": .string("V-003"),
                "Status": .string("Active"),
                "Mileage": .decimal(58000.0),
                "Fuel Level": .decimal(90.0)
            ]
        ],
        summary: ReportSummary(
            totalRecords: 3,
            aggregations: [
                "Average Mileage": 45000.0,
                "Total Distance": 135000.0
            ],
            insights: [
                "3 vehicles in the fleet",
                "Average mileage: 45,000 miles",
                "2 vehicles currently active"
            ]
        ),
        chartData: ChartData(
            labels: ["V-001", "V-002", "V-003"],
            datasets: [
                ChartData.ChartDataset(
                    label: "Mileage",
                    values: [45000, 32000, 58000],
                    color: "blue"
                )
            ]
        )
    )

    return ReportPreviewView(report: sampleReport, chartType: .bar)
}
