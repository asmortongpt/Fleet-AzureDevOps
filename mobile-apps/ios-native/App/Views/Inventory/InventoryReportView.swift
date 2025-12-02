//
//  InventoryReportView.swift
//  Fleet Manager
//
//  View for displaying inventory reports (stock value, turnover, aging, etc.)
//

import SwiftUI
import Charts

struct InventoryReportView: View {
    @StateObject private var viewModel = InventoryManagementViewModel()
    @State private var selectedReport: ReportType = .stockValue

    enum ReportType: String, CaseIterable {
        case stockValue = "Stock Value"
        case location = "By Location"
        case lowStock = "Low Stock"
        case expiration = "Expiration"

        var icon: String {
            switch self {
            case .stockValue: return "dollarsign.circle.fill"
            case .location: return "building.2.fill"
            case .lowStock: return "exclamationmark.triangle.fill"
            case .expiration: return "clock.badge.exclamationmark"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Summary Header
                reportSummaryHeader

                // Report Type Picker
                Picker("Report Type", selection: $selectedReport) {
                    ForEach(ReportType.allCases, id: \.self) { type in
                        HStack {
                            Image(systemName: type.icon)
                            Text(type.rawValue)
                        }
                        .tag(type)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Report Content
                ScrollView {
                    VStack(spacing: 20) {
                        switch selectedReport {
                        case .stockValue:
                            stockValueReport
                        case .location:
                            locationReport
                        case .lowStock:
                            lowStockReport
                        case .expiration:
                            expirationReport
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Inventory Reports")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: exportPDF) {
                            Label("Export PDF", systemImage: "doc.fill")
                        }

                        Button(action: exportCSV) {
                            Label("Export CSV", systemImage: "tablecells")
                        }

                        Button(action: shareReport) {
                            Label("Share", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Label("Export", systemImage: "square.and.arrow.up")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadInventoryData()
            }
        }
    }

    // MARK: - Summary Header
    private var reportSummaryHeader: some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Inventory Value")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(String(format: "$%.2f", viewModel.totalInventoryValue))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Total Items")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("\(viewModel.inventoryItems.count)")
                        .font(.title)
                        .fontWeight(.bold)
                }
            }

            Divider()

            HStack(spacing: 20) {
                StatBadge(title: "Low Stock", value: "\(viewModel.lowStockItemsCount)", color: .orange)
                StatBadge(title: "Out of Stock", value: "\(viewModel.outOfStockItemsCount)", color: .red)
                StatBadge(title: "Active Alerts", value: "\(viewModel.alertsCount)", color: .purple)
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Stock Value Report
    private var stockValueReport: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Value by Category")
                .font(.headline)

            let categoryData = viewModel.generateStockValueReport()

            if !categoryData.isEmpty {
                // Chart
                if #available(iOS 16.0, *) {
                    Chart(categoryData, id: \.category) { item in
                        BarMark(
                            x: .value("Value", item.value),
                            y: .value("Category", item.category.rawValue)
                        )
                        .foregroundStyle(Color(item.category.color))
                    }
                    .frame(height: 300)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                } else {
                    // Fallback for iOS 15
                    Text("Chart requires iOS 16+")
                        .foregroundColor(.secondary)
                }

                // Details List
                ForEach(categoryData, id: \.category) { item in
                    CategoryValueRow(
                        category: item.category,
                        value: item.value,
                        percentage: item.percentage
                    )
                }
            } else {
                EmptyReportView()
            }
        }
    }

    // MARK: - Location Report
    private var locationReport: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Inventory by Location")
                .font(.headline)

            let locationData = viewModel.generateLocationReport()

            if !locationData.isEmpty {
                ForEach(locationData, id: \.location) { item in
                    LocationReportRow(
                        location: item.location,
                        itemCount: item.itemCount,
                        value: item.value
                    )
                }
            } else {
                EmptyReportView()
            }
        }
    }

    // MARK: - Low Stock Report
    private var lowStockReport: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Low Stock Items")
                .font(.headline)

            let lowStockItems = viewModel.generateLowStockReport()

            if !lowStockItems.isEmpty {
                ForEach(lowStockItems) { item in
                    LowStockReportRow(item: item)
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.green)

                    Text("All stock levels are adequate")
                        .font(.headline)

                    Text("No items are currently low on stock")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Expiration Report
    private var expirationReport: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Expiring Items")
                .font(.headline)

            let expiringItems = viewModel.generateExpirationReport()

            if !expiringItems.isEmpty {
                ForEach(expiringItems) { item in
                    ExpirationReportRow(item: item)
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.green)

                    Text("No expiring items")
                        .font(.headline)

                    Text("All items are within their shelf life")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Helper Functions
    private func exportPDF() {
        // TODO: Implement PDF export
        print("Exporting PDF...")
    }

    private func exportCSV() {
        // TODO: Implement CSV export
        print("Exporting CSV...")
    }

    private func shareReport() {
        // TODO: Implement share functionality
        print("Sharing report...")
    }
}

// MARK: - Stat Badge
struct StatBadge: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Category Value Row
struct CategoryValueRow: View {
    let category: InventoryCategory
    let value: Double
    let percentage: Double

    var body: some View {
        HStack {
            Image(systemName: category.icon)
                .foregroundColor(Color(category.color))
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(category.rawValue)
                    .font(.body)
                    .fontWeight(.medium)

                Text("\(String(format: "%.1f", percentage))% of total")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(String(format: "$%.2f", value))
                .font(.callout)
                .fontWeight(.semibold)
                .foregroundColor(.green)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Location Report Row
struct LocationReportRow: View {
    let location: StockLocation
    let itemCount: Int
    let value: Double

    var body: some View {
        HStack {
            Image(systemName: location.icon)
                .foregroundColor(.blue)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(location.rawValue)
                    .font(.body)
                    .fontWeight(.medium)

                Text("\(itemCount) items")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(String(format: "$%.2f", value))
                    .font(.callout)
                    .fontWeight(.semibold)
                    .foregroundColor(.green)

                Text("Total Value")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Low Stock Report Row
struct LowStockReportRow: View {
    let item: InventoryItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: item.stockStatus.icon)
                    .foregroundColor(Color(item.stockStatus.color))

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.body)
                        .fontWeight(.medium)

                    Text("SKU: \(item.sku)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(item.stockStatus.rawValue)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(item.stockStatus.color))
                    .cornerRadius(6)
            }

            HStack(spacing: 20) {
                StockInfoLabel(title: "Current", value: "\(item.quantity)")
                StockInfoLabel(title: "Minimum", value: "\(item.minLevel)")
                StockInfoLabel(title: "Reorder", value: "\(item.reorderPoint)")

                Spacer()

                if item.needsReorder {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Order")
                            .font(.caption2)
                            .foregroundColor(.secondary)

                        Text("\(item.reorderQuantity)")
                            .font(.callout)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Stock Info Label
struct StockInfoLabel: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)

            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - Expiration Report Row
struct ExpirationReportRow: View {
    let item: InventoryItem

    var body: some View {
        HStack {
            Image(systemName: item.isExpired ? "xmark.circle.fill" : "clock.badge.exclamationmark")
                .foregroundColor(item.isExpired ? .red : .orange)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.body)
                    .fontWeight(.medium)

                Text("SKU: \(item.sku)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                if let expirationDate = item.expirationDate {
                    HStack(spacing: 4) {
                        Text("Expires:")
                        Text(formatDate(expirationDate))
                    }
                    .font(.caption)
                    .foregroundColor(item.isExpired ? .red : .orange)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("\(item.quantity)")
                    .font(.title3)
                    .fontWeight(.bold)

                Text(item.unitOfMeasure)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Empty Report View
struct EmptyReportView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)

            Text("No Data Available")
                .font(.headline)

            Text("Add items to your inventory to see reports")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

#Preview {
    InventoryReportView()
}
