//
//  QueryBuilderView.swift
//  Fleet Manager
//
//  Visual query builder for creating filter conditions
//

import SwiftUI

struct QueryBuilderView: View {
    let dataset: Dataset
    let onAddFilter: (String, FilterOperator, FilterValue) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selectedColumn: DataColumn?
    @State private var selectedOperator: FilterOperator = .equals
    @State private var stringValue = ""
    @State private var numberValue = ""
    @State private var dateValue = Date()
    @State private var booleanValue = false
    @State private var listValue = ""
    @State private var minValue = ""
    @State private var maxValue = ""

    var body: some View {
        NavigationView {
            Form {
                // Column Selection
                Section(header: Text("Select Column")) {
                    Picker("Column", selection: $selectedColumn) {
                        Text("Select...").tag(nil as DataColumn?)
                        ForEach(dataset.columns) { column in
                            HStack {
                                Image(systemName: column.type.icon)
                                Text(column.displayName)
                            }
                            .tag(column as DataColumn?)
                        }
                    }
                }

                if let column = selectedColumn {
                    // Operator Selection
                    Section(header: Text("Filter Operator")) {
                        Picker("Operator", selection: $selectedOperator) {
                            ForEach(availableOperators(for: column.type), id: \.self) { op in
                                Text(op.displayName).tag(op)
                            }
                        }
                        .pickerStyle(.menu)
                    }

                    // Value Input
                    if selectedOperator.requiresValue {
                        Section(header: Text("Value")) {
                            valueInputField(for: column.type)
                        }
                    }

                    // Preview
                    Section(header: Text("Preview")) {
                        Text(filterPreview)
                            .font(ModernTheme.Typography.callout)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .navigationTitle("Add Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        addFilter()
                    }
                    .disabled(!canAddFilter)
                }
            }
        }
    }

    // MARK: - Value Input Fields
    @ViewBuilder
    private func valueInputField(for type: ColumnType) -> some View {
        switch type {
        case .string:
            TextField("Enter text", text: $stringValue)
                .textInputAutocapitalization(.never)

        case .number, .decimal, .currency:
            if selectedOperator == .between {
                HStack {
                    TextField("Min", text: $minValue)
                        .keyboardType(.decimalPad)
                    Text("to")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    TextField("Max", text: $maxValue)
                        .keyboardType(.decimalPad)
                }
            } else {
                TextField("Enter number", text: $numberValue)
                    .keyboardType(.decimalPad)
            }

        case .date, .datetime:
            if selectedOperator == .between {
                DatePicker("Start Date", selection: $dateValue, displayedComponents: type == .date ? [.date] : [.date, .hourAndMinute])
                DatePicker("End Date", selection: $dateValue, displayedComponents: type == .date ? [.date] : [.date, .hourAndMinute])
            } else {
                DatePicker("Select Date", selection: $dateValue, displayedComponents: type == .date ? [.date] : [.date, .hourAndMinute])
            }

        case .boolean:
            Toggle("Value", isOn: $booleanValue)

        }
    }

    // MARK: - Available Operators
    private func availableOperators(for type: ColumnType) -> [FilterOperator] {
        switch type {
        case .string:
            return [.equals, .notEquals, .contains, .notContains, .startsWith, .endsWith, .isNull, .isNotNull]
        case .number, .decimal, .currency:
            return [.equals, .notEquals, .greaterThan, .greaterThanOrEqual, .lessThan, .lessThanOrEqual, .between, .isNull, .isNotNull]
        case .date, .datetime:
            return [.equals, .notEquals, .greaterThan, .greaterThanOrEqual, .lessThan, .lessThanOrEqual, .between, .isNull, .isNotNull]
        case .boolean:
            return [.equals, .notEquals, .isNull, .isNotNull]
        }
    }

    // MARK: - Filter Preview
    private var filterPreview: String {
        guard let column = selectedColumn else { return "Select a column to begin" }

        var preview = "\(column.displayName) \(selectedOperator.displayName.lowercased())"

        if selectedOperator.requiresValue {
            switch column.type {
            case .string:
                preview += " '\(stringValue)'"
            case .number, .decimal, .currency:
                if selectedOperator == .between {
                    preview += " \(minValue) and \(maxValue)"
                } else {
                    preview += " \(numberValue)"
                }
            case .date, .datetime:
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                formatter.timeStyle = column.type == .datetime ? .short : .none
                preview += " \(formatter.string(from: dateValue))"
            case .boolean:
                preview += " \(booleanValue ? "true" : "false")"
            }
        }

        return preview
    }

    // MARK: - Validation
    private var canAddFilter: Bool {
        guard let column = selectedColumn else { return false }
        guard selectedOperator.requiresValue else { return true }

        switch column.type {
        case .string:
            return !stringValue.isEmpty
        case .number, .decimal, .currency:
            if selectedOperator == .between {
                return !minValue.isEmpty && !maxValue.isEmpty
            }
            return !numberValue.isEmpty
        case .date, .datetime:
            return true
        case .boolean:
            return true
        }
    }

    // MARK: - Add Filter
    private func addFilter() {
        guard let column = selectedColumn else { return }

        let filterValue: FilterValue

        if !selectedOperator.requiresValue {
            filterValue = .none
        } else {
            switch column.type {
            case .string:
                filterValue = .string(stringValue)
            case .number, .decimal, .currency:
                if selectedOperator == .between {
                    if let min = Double(minValue), let max = Double(maxValue) {
                        filterValue = .range(min: min, max: max)
                    } else {
                        return
                    }
                } else {
                    if let value = Double(numberValue) {
                        filterValue = .number(value)
                    } else {
                        return
                    }
                }
            case .date, .datetime:
                filterValue = .date(dateValue)
            case .boolean:
                filterValue = .boolean(booleanValue)
            }
        }

        onAddFilter(column.name, selectedOperator, filterValue)
        dismiss()
    }
}

#Preview {
    QueryBuilderView(
        dataset: Dataset(
            name: "Vehicles",
            source: .vehicles,
            rowCount: 100,
            columns: [
                DataColumn(name: "name", type: .string),
                DataColumn(name: "odometer", type: .number),
                DataColumn(name: "acquisition_date", type: .date)
            ]
        ),
        onAddFilter: { _, _, _ in }
    )
}
