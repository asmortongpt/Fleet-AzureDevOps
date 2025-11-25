//
//  CostDetailView.swift
//  Fleet Manager
//
//  Detailed view for specific cost categories with filtering and analysis
//

import SwiftUI
import Charts

struct CostDetailView: View {
    @ObservedObject var viewModel: CostViewModel
    let category: CostCategory?

    @State private var selectedSortOption: SortOption = .date
    @State private var showFilterSheet = false

    enum SortOption: String, CaseIterable {
        case date = "Date"
        case amount = "Amount"
        case vehicle = "Vehicle"

        var icon: String {
            switch self {
            case .date: return "calendar"
            case .amount: return "dollarsign.circle"
            case .vehicle: return "car"
            }
        }
    }

    var filteredAndSortedRecords: [CostRecord] {
        var records = viewModel.filteredCostRecords

        if let category = category {
            records = records.filter { $0.category == category }
        }

        switch selectedSortOption {
        case .date:
            return records.sorted { $0.date > $1.date }
        case .amount:
            return records.sorted { $0.amount > $1.amount }
        case .vehicle:
            return records.sorted { $0.vehicleNumber < $1.vehicleNumber }
        }
    }

    var totalAmount: Double {
        filteredAndSortedRecords.reduce(0) { $0 + $1.amount }
    }

    var averageAmount: Double {
        guard !filteredAndSortedRecords.isEmpty else { return 0 }
        return totalAmount / Double(filteredAndSortedRecords.count)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Stats Header
            statsHeader

            // Sort Options
            sortBar

            // Records List
            ScrollView {
                LazyVStack(spacing: 12) {
                    if filteredAndSortedRecords.isEmpty {
                        emptyState
                    } else {
                        ForEach(filteredAndSortedRecords) { record in
                            CostRecordDetailCard(record: record)
                        }
                    }
                }
                .padding()
            }
        }
        .navigationTitle(category?.rawValue ?? "All Costs")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showFilterSheet = true }) {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                }
            }
        }
        .sheet(isPresented: $showFilterSheet) {
            FilterSheet(viewModel: viewModel)
        }
    }

    // MARK: - Stats Header

    private var statsHeader: some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                StatBox(
                    title: "Total",
                    value: String(format: "$%.2f", totalAmount),
                    icon: "dollarsign.circle.fill",
                    color: .blue
                )

                StatBox(
                    title: "Average",
                    value: String(format: "$%.2f", averageAmount),
                    icon: "chart.bar.fill",
                    color: .green
                )

                StatBox(
                    title: "Count",
                    value: "\(filteredAndSortedRecords.count)",
                    icon: "number.circle.fill",
                    color: .orange
                )
            }

            if let category = category {
                // Category-specific chart
                categoryTrendChart
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
    }

    private var categoryTrendChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Trend")
                .font(.headline)

            if viewModel.costTrends.isEmpty {
                Text("No trend data")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(height: 100)
            } else {
                Chart(viewModel.costTrends) { trend in
                    let amount: Double
                    if let category = category {
                        switch category {
                        case .fuel: amount = trend.fuelCost
                        case .maintenance: amount = trend.maintenanceCost
                        default: amount = trend.otherCost
                        }
                    } else {
                        amount = trend.totalCost
                    }

                    BarMark(
                        x: .value("Period", trend.period),
                        y: .value("Amount", amount)
                    )
                    .foregroundStyle(Color.blue.gradient)
                }
                .frame(height: 120)
                .chartXAxis {
                    AxisMarks(values: .automatic) { value in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
            }
        }
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Sort Bar

    private var sortBar: some View {
        HStack {
            Text("Sort by:")
                .font(.subheadline)
                .foregroundColor(.secondary)

            ForEach(SortOption.allCases, id: \.self) { option in
                Button(action: {
                    withAnimation {
                        selectedSortOption = option
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: option.icon)
                        Text(option.rawValue)
                    }
                    .font(.subheadline)
                    .foregroundColor(selectedSortOption == option ? .white : .primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(selectedSortOption == option ? Color.blue : Color(.tertiarySystemGroupedBackground))
                    .cornerRadius(8)
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: category?.icon ?? "doc.text")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No \(category?.rawValue ?? "Cost") Records")
                .font(.headline)

            Text("No records found for the selected filters")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

// MARK: - Supporting Views

struct StatBox: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            Text(value)
                .font(.headline)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct CostRecordDetailCard: View {
    let record: CostRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: record.category.icon)
                    .foregroundColor(Color(record.category.color))
                    .font(.title3)

                VStack(alignment: .leading, spacing: 4) {
                    Text(record.category.rawValue)
                        .font(.headline)
                    Text(record.vehicleNumber)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(record.formattedAmount)
                    .font(.title3.bold())
                    .foregroundColor(.primary)
            }

            Divider()

            // Details
            VStack(spacing: 8) {
                if let vendor = record.vendor {
                    DetailRow(icon: "building.2", label: "Vendor", value: vendor)
                }

                DetailRow(icon: "calendar", label: "Date", value: record.formattedDate)

                if let odometer = record.odometer {
                    DetailRow(icon: "gauge", label: "Odometer", value: String(format: "%.0f mi", odometer))
                }

                DetailRow(icon: "building.2", label: "Department", value: record.department)

                if let invoiceNumber = record.invoiceNumber {
                    DetailRow(icon: "doc.text", label: "Invoice", value: invoiceNumber)
                }

                if let description = record.description {
                    DetailRow(icon: "text.alignleft", label: "Description", value: description)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 20)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationView {
        CostDetailView(viewModel: CostViewModel(), category: .fuel)
    }
}
