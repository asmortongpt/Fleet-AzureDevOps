//
//  DataGridView.swift
//  Fleet Manager
//
//  Scrollable data grid for displaying query results
//

import SwiftUI

struct DataGridView: View {
    let result: QueryResult

    @State private var sortColumn: String?
    @State private var sortAscending = true
    @State private var searchText = ""
    @State private var selectedRow: Int?

    private let cellWidth: CGFloat = 150
    private let cellHeight: CGFloat = 44
    private let headerHeight: CGFloat = 50

    var filteredRows: [[String: Any]] {
        if searchText.isEmpty {
            return result.rows
        }

        return result.rows.filter { row in
            row.values.contains { value in
                String(describing: value).localizedCaseInsensitiveContains(searchText)
            }
        }
    }

    var sortedRows: [[String: Any]] {
        guard let sortColumn = sortColumn else {
            return filteredRows
        }

        return filteredRows.sorted { row1, row2 in
            guard let value1 = row1[sortColumn],
                  let value2 = row2[sortColumn] else {
                return false
            }

            let comparison = compareValues(value1, value2)
            return sortAscending ? comparison : !comparison
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Metrics Header
            metricsHeader

            // Search Bar
            searchBar

            // Data Grid
            ScrollView([.horizontal, .vertical]) {
                VStack(spacing: 0) {
                    // Column Headers
                    headerRow

                    // Data Rows
                    LazyVStack(spacing: 0) {
                        ForEach(Array(sortedRows.enumerated()), id: \.offset) { index, row in
                            dataRow(row: row, index: index)
                                .background(
                                    selectedRow == index ?
                                    ModernTheme.Colors.primary.opacity(0.1) :
                                    (index % 2 == 0 ? Color.clear : ModernTheme.Colors.secondaryBackground)
                                )
                                .onTapGesture {
                                    selectedRow = selectedRow == index ? nil : index
                                }
                        }
                    }
                }
            }
            .background(ModernTheme.Colors.background)
        }
    }

    // MARK: - Metrics Header
    private var metricsHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Query Results")
                    .font(ModernTheme.Typography.headline)
                Text("\(filteredRows.count) of \(result.metadata.totalCount) rows")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("Execution Time")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                Text("\(String(format: "%.2f", result.metadata.executionTime))ms")
                    .font(ModernTheme.Typography.callout)
                    .fontWeight(.medium)
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
    }

    // MARK: - Search Bar
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(ModernTheme.Colors.secondaryText)
            TextField("Search in results...", text: $searchText)
                .textFieldStyle(.plain)
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(ModernTheme.Colors.tertiaryBackground)
    }

    // MARK: - Header Row
    private var headerRow: some View {
        HStack(spacing: 0) {
            ForEach(result.columns) { column in
                Button(action: {
                    if sortColumn == column.name {
                        sortAscending.toggle()
                    } else {
                        sortColumn = column.name
                        sortAscending = true
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: column.type.icon)
                            .font(.caption)
                        Text(column.displayName)
                            .font(ModernTheme.Typography.callout)
                            .fontWeight(.semibold)
                            .lineLimit(1)

                        if sortColumn == column.name {
                            Image(systemName: sortAscending ? "chevron.up" : "chevron.down")
                                .font(.caption2)
                        }
                    }
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .frame(width: cellWidth, height: headerHeight)
                    .background(ModernTheme.Colors.secondaryBackground)
                }
                .buttonStyle(.plain)

                Divider()
                    .frame(height: headerHeight)
            }
        }
    }

    // MARK: - Data Row
    private func dataRow(row: [String: Any], index: Int) -> some View {
        HStack(spacing: 0) {
            ForEach(result.columns) { column in
                cellView(
                    value: row[column.name],
                    column: column
                )

                if column.id != result.columns.last?.id {
                    Divider()
                        .frame(height: cellHeight)
                }
            }
        }
        .frame(height: cellHeight)
    }

    // MARK: - Cell View
    private func cellView(value: Any?, column: DataColumn) -> some View {
        Group {
            if let value = value {
                Text(formatCellValue(value, for: column))
                    .font(ModernTheme.Typography.callout)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .padding(.horizontal, 8)
                    .frame(width: cellWidth, height: cellHeight, alignment: .leading)
            } else {
                Text("—")
                    .font(ModernTheme.Typography.callout)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                    .frame(width: cellWidth, height: cellHeight)
            }
        }
    }

    // MARK: - Formatting
    private func formatCellValue(_ value: Any, for column: DataColumn) -> String {
        switch column.type {
        case .string:
            return String(describing: value)

        case .number:
            if let number = value as? Int {
                return "\(number)"
            } else if let number = value as? Double {
                return String(format: "%.0f", number)
            }
            return String(describing: value)

        case .decimal:
            if let number = value as? Double {
                return String(format: "%.2f", number)
            }
            return String(describing: value)

        case .currency:
            if let number = value as? Double {
                let formatter = NumberFormatter()
                formatter.numberStyle = .currency
                return formatter.string(from: NSNumber(value: number)) ?? "$\(number)"
            }
            return String(describing: value)

        case .date:
            if let date = value as? Date {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                formatter.timeStyle = .none
                return formatter.string(from: date)
            } else if let dateString = value as? String {
                return dateString
            }
            return String(describing: value)

        case .datetime:
            if let date = value as? Date {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                formatter.timeStyle = .short
                return formatter.string(from: date)
            } else if let dateString = value as? String {
                return dateString
            }
            return String(describing: value)

        case .boolean:
            if let bool = value as? Bool {
                return bool ? "Yes" : "No"
            }
            return String(describing: value)
        }
    }

    private func compareValues(_ value1: Any, _ value2: Any) -> Bool {
        // String comparison
        if let str1 = value1 as? String, let str2 = value2 as? String {
            return str1 < str2
        }

        // Number comparison
        if let num1 = value1 as? Double, let num2 = value2 as? Double {
            return num1 < num2
        }
        if let num1 = value1 as? Int, let num2 = value2 as? Int {
            return num1 < num2
        }

        // Date comparison
        if let date1 = value1 as? Date, let date2 = value2 as? Date {
            return date1 < date2
        }

        // Boolean comparison
        if let bool1 = value1 as? Bool, let bool2 = value2 as? Bool {
            return !bool1 && bool2
        }

        // Default string comparison
        return String(describing: value1) < String(describing: value2)
    }
}

// MARK: - Preview
#Preview {
    DataGridView(
        result: QueryResult(
            rows: [
                ["id": "1", "name": "Vehicle 1", "odometer": 15000, "cost": 25000.00],
                ["id": "2", "name": "Vehicle 2", "odometer": 22000, "cost": 32000.00],
                ["id": "3", "name": "Vehicle 3", "odometer": 8500, "cost": 18500.00]
            ],
            columns: [
                DataColumn(name: "id", type: .string),
                DataColumn(name: "name", type: .string),
                DataColumn(name: "odometer", type: .number),
                DataColumn(name: "cost", type: .currency)
            ],
            metadata: QueryMetadata(
                executionTime: 125.5,
                rowCount: 3,
                totalCount: 3,
                queryText: nil
            )
        )
    )
}
