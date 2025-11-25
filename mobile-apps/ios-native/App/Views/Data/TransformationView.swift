//
//  TransformationView.swift
//  Fleet Manager
//
//  Data transformation interface for advanced data manipulation
//

import SwiftUI

struct TransformationView: View {
    let dataset: Dataset
    let onApplyTransformation: (DataTransformation) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selectedType: TransformationType = .filter
    @State private var transformationConfig = TransformationConfig()

    // Filter states
    @State private var filterConditions: [FilterCondition] = []

    // Aggregation states
    @State private var selectedAggColumn: DataColumn?
    @State private var selectedAggFunction: AggregationFunction = .count
    @State private var aggregations: [Aggregation] = []

    // Group By states
    @State private var groupByColumns: [String] = []

    // Sort states
    @State private var sortColumns: [SortColumn] = []

    var body: some View {
        NavigationView {
            Form {
                // Transformation Type Selector
                Section(header: Text("Transformation Type")) {
                    Picker("Type", selection: $selectedType) {
                        ForEach([TransformationType.filter, .aggregate, .sort, .groupBy], id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.displayName)
                            }
                            .tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                // Configuration based on type
                switch selectedType {
                case .filter:
                    filterConfiguration
                case .aggregate:
                    aggregationConfiguration
                case .groupBy:
                    groupByConfiguration
                case .sort:
                    sortConfiguration
                default:
                    EmptyView()
                }

                // Preview Section
                Section(header: Text("Preview")) {
                    Text(transformationPreview)
                        .font(ModernTheme.Typography.callout)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
            .navigationTitle("Apply Transformation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Apply") {
                        applyTransformation()
                    }
                    .disabled(!canApply)
                }
            }
        }
    }

    // MARK: - Filter Configuration
    private var filterConfiguration: some View {
        Section(header: Text("Filter Conditions")) {
            ForEach(filterConditions) { filter in
                VStack(alignment: .leading, spacing: 4) {
                    Text(filter.column)
                        .font(ModernTheme.Typography.callout)
                        .fontWeight(.medium)
                    Text("\(filter.operator.displayName)")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
            .onDelete { indexSet in
                filterConditions.remove(atOffsets: indexSet)
            }

            Button(action: {
                // Add filter logic - would open QueryBuilderView
            }) {
                Label("Add Filter", systemImage: "plus.circle.fill")
            }
        }
    }

    // MARK: - Aggregation Configuration
    private var aggregationConfiguration: some View {
        Group {
            Section(header: Text("Select Column")) {
                Picker("Column", selection: $selectedAggColumn) {
                    Text("Select...").tag(nil as DataColumn?)
                    ForEach(dataset.columns.filter { $0.type == .number || $0.type == .decimal || $0.type == .currency }) { column in
                        Text(column.displayName).tag(column as DataColumn?)
                    }
                }
            }

            Section(header: Text("Aggregation Function")) {
                Picker("Function", selection: $selectedAggFunction) {
                    ForEach(AggregationFunction.allCases, id: \.self) { function in
                        HStack {
                            Image(systemName: function.icon)
                            Text(function.displayName)
                        }
                        .tag(function)
                    }
                }
                .pickerStyle(.menu)
            }

            Section(header: Text("Configured Aggregations")) {
                ForEach(aggregations) { agg in
                    HStack {
                        Image(systemName: agg.function.icon)
                        Text("\(agg.function.displayName)(\(agg.column))")
                            .font(ModernTheme.Typography.callout)
                    }
                }
                .onDelete { indexSet in
                    aggregations.remove(atOffsets: indexSet)
                }

                if selectedAggColumn != nil {
                    Button(action: {
                        if let column = selectedAggColumn {
                            let agg = Aggregation(column: column.name, function: selectedAggFunction)
                            aggregations.append(agg)
                        }
                    }) {
                        Label("Add Aggregation", systemImage: "plus.circle.fill")
                    }
                }
            }
        }
    }

    // MARK: - Group By Configuration
    private var groupByConfiguration: some View {
        Section(header: Text("Group By Columns")) {
            ForEach(dataset.columns) { column in
                Button(action: {
                    if groupByColumns.contains(column.name) {
                        groupByColumns.removeAll { $0 == column.name }
                    } else {
                        groupByColumns.append(column.name)
                    }
                }) {
                    HStack {
                        Image(systemName: groupByColumns.contains(column.name) ? "checkmark.square.fill" : "square")
                        Image(systemName: column.type.icon)
                        Text(column.displayName)
                        Spacer()
                    }
                }
                .buttonStyle(.plain)
            }

            if !groupByColumns.isEmpty {
                Section(header: Text("Selected Columns")) {
                    ForEach(groupByColumns, id: \.self) { columnName in
                        if let column = dataset.columns.first(where: { $0.name == columnName }) {
                            HStack {
                                Image(systemName: column.type.icon)
                                Text(column.displayName)
                            }
                        }
                    }
                    .onDelete { indexSet in
                        groupByColumns.remove(atOffsets: indexSet)
                    }
                }
            }
        }
    }

    // MARK: - Sort Configuration
    private var sortConfiguration: some View {
        Section(header: Text("Sort Columns")) {
            ForEach(sortColumns) { sort in
                HStack {
                    Text(sort.column)
                        .font(ModernTheme.Typography.callout)
                    Spacer()
                    Image(systemName: sort.direction.icon)
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }
            .onDelete { indexSet in
                sortColumns.remove(atOffsets: indexSet)
            }

            Menu {
                ForEach(dataset.columns) { column in
                    Menu(column.displayName) {
                        Button("Ascending") {
                            sortColumns.append(SortColumn(column: column.name, direction: .ascending))
                        }
                        Button("Descending") {
                            sortColumns.append(SortColumn(column: column.name, direction: .descending))
                        }
                    }
                }
            } label: {
                Label("Add Sort Column", systemImage: "plus.circle.fill")
            }
        }
    }

    // MARK: - Transformation Preview
    private var transformationPreview: String {
        switch selectedType {
        case .filter:
            if filterConditions.isEmpty {
                return "No filters configured"
            }
            return "Filter data with \(filterConditions.count) condition(s)"

        case .aggregate:
            if aggregations.isEmpty {
                return "No aggregations configured"
            }
            let aggList = aggregations.map { "\($0.function.displayName)(\($0.column))" }.joined(separator: ", ")
            return "Calculate: \(aggList)"

        case .groupBy:
            if groupByColumns.isEmpty {
                return "No grouping configured"
            }
            return "Group by: \(groupByColumns.joined(separator: ", "))"

        case .sort:
            if sortColumns.isEmpty {
                return "No sorting configured"
            }
            let sortList = sortColumns.map { "\($0.column) \($0.direction.displayName)" }.joined(separator: ", ")
            return "Sort by: \(sortList)"

        default:
            return "Configure transformation"
        }
    }

    // MARK: - Validation
    private var canApply: Bool {
        switch selectedType {
        case .filter:
            return !filterConditions.isEmpty
        case .aggregate:
            return !aggregations.isEmpty
        case .groupBy:
            return !groupByColumns.isEmpty
        case .sort:
            return !sortColumns.isEmpty
        default:
            return false
        }
    }

    // MARK: - Apply Transformation
    private func applyTransformation() {
        var config = TransformationConfig()

        switch selectedType {
        case .filter:
            config.filterConditions = filterConditions
        case .aggregate:
            config.aggregations = aggregations
        case .groupBy:
            config.groupByColumns = groupByColumns
        case .sort:
            config.sortColumns = sortColumns
        default:
            break
        }

        let transformation = DataTransformation(type: selectedType, config: config)
        onApplyTransformation(transformation)
        dismiss()
    }
}

#Preview {
    TransformationView(
        dataset: Dataset(
            name: "Vehicles",
            source: .vehicles,
            rowCount: 100,
            columns: [
                DataColumn(name: "name", type: .string),
                DataColumn(name: "odometer", type: .number),
                DataColumn(name: "cost", type: .currency)
            ]
        ),
        onApplyTransformation: { _ in }
    )
}
