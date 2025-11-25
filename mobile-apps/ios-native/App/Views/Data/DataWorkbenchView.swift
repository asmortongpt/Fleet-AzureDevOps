//
//  DataWorkbenchView.swift
//  Fleet Manager
//
//  Main Data Workbench interface with dataset selector and query builder
//

import SwiftUI

struct DataWorkbenchView: View {
    @StateObject private var viewModel = DataWorkbenchViewModel()
    @State private var showQueryBuilder = false
    @State private var showSavedQueries = false
    @State private var selectedTab: WorkbenchTab = .query

    enum WorkbenchTab: String, CaseIterable {
        case query = "Query"
        case results = "Results"
        case saved = "Saved"

        var icon: String {
            switch self {
            case .query: return "pencil.and.list.clipboard"
            case .results: return "tablecells"
            case .saved: return "bookmark.fill"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                tabSelector

                // Content based on selected tab
                TabView(selection: $selectedTab) {
                    queryBuilderTab
                        .tag(WorkbenchTab.query)

                    resultsTab
                        .tag(WorkbenchTab.results)

                    savedQueriesTab
                        .tag(WorkbenchTab.saved)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("Data Workbench")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showSavedQueries = true }) {
                            Label("Saved Queries", systemImage: "bookmark")
                        }

                        Button(action: { Task { await viewModel.refresh() } }) {
                            Label("Refresh Datasets", systemImage: "arrow.clockwise")
                        }

                        Divider()

                        if viewModel.queryResult != nil {
                            Button(action: { viewModel.showExportSheet = true }) {
                                Label("Export Results", systemImage: "square.and.arrow.up")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showSaveQuerySheet) {
                saveQuerySheet
            }
            .sheet(isPresented: $viewModel.showExportSheet) {
                exportSheet
            }
            .task {
                await viewModel.loadAvailableDatasets()
            }
        }
    }

    // MARK: - Tab Selector
    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(WorkbenchTab.allCases, id: \.self) { tab in
                Button(action: { withAnimation { selectedTab = tab } }) {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 20))
                        Text(tab.rawValue)
                            .font(.caption)
                    }
                    .foregroundColor(selectedTab == tab ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
            }
        }
        .background(ModernTheme.Colors.secondaryBackground)
    }

    // MARK: - Query Builder Tab
    private var queryBuilderTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                // Dataset Selector
                datasetSelector

                if viewModel.selectedDataset != nil {
                    // Column Selection
                    columnSelector

                    // Filter Section
                    filterSection

                    // Group By Section
                    groupBySection

                    // Aggregation Section
                    aggregationSection

                    // Sort Section
                    sortSection

                    // Query Options
                    queryOptions

                    // Execute Button
                    executeButton
                }
            }
            .padding()
        }
        .background(ModernTheme.Colors.background)
    }

    // MARK: - Dataset Selector
    private var datasetSelector: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Select Dataset")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            if viewModel.loadingState.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ModernTheme.Spacing.md) {
                        ForEach(viewModel.availableDatasets) { dataset in
                            DatasetCard(
                                dataset: dataset,
                                isSelected: viewModel.selectedDataset?.id == dataset.id,
                                action: { viewModel.selectDataset(dataset) }
                            )
                        }
                    }
                }
            }
        }
        .modernCard()
    }

    // MARK: - Column Selector
    private var columnSelector: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text("Select Columns")
                    .font(ModernTheme.Typography.headline)
                Spacer()
                Button(viewModel.selectedColumns.count == viewModel.selectedDataset?.columns.count ? "Deselect All" : "Select All") {
                    if viewModel.selectedColumns.count == viewModel.selectedDataset?.columns.count {
                        viewModel.selectedColumns.removeAll()
                    } else {
                        viewModel.selectedColumns = Set(viewModel.selectedDataset?.columns.map { $0.name } ?? [])
                    }
                }
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.primary)
            }

            if let columns = viewModel.selectedDataset?.columns {
                LazyVGrid(columns: ModernTheme.adaptiveColumns, spacing: ModernTheme.Spacing.sm) {
                    ForEach(columns) { column in
                        ColumnCheckbox(
                            column: column,
                            isSelected: viewModel.selectedColumns.contains(column.name),
                            action: { viewModel.toggleColumnSelection(column.name) }
                        )
                    }
                }
            }
        }
        .modernCard()
    }

    // MARK: - Filter Section
    private var filterSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text("Filters")
                    .font(ModernTheme.Typography.headline)
                Spacer()
                Button(action: { showQueryBuilder = true }) {
                    Label("Add Filter", systemImage: "plus.circle.fill")
                        .font(ModernTheme.Typography.callout)
                }
            }

            if viewModel.filterConditions.isEmpty {
                Text("No filters applied")
                    .font(ModernTheme.Typography.callout)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(viewModel.filterConditions) { filter in
                    FilterRow(filter: filter, onRemove: {
                        viewModel.removeFilter(filter)
                    })
                }
            }
        }
        .modernCard()
        .sheet(isPresented: $showQueryBuilder) {
            if let dataset = viewModel.selectedDataset {
                QueryBuilderView(
                    dataset: dataset,
                    onAddFilter: { column, op, value in
                        viewModel.addFilter(column: column, operator: op, value: value)
                        showQueryBuilder = false
                    }
                )
            }
        }
    }

    // MARK: - Group By Section
    private var groupBySection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Group By")
                .font(ModernTheme.Typography.headline)

            if let columns = viewModel.selectedDataset?.columns {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(columns) { column in
                            Button(action: {
                                if viewModel.groupByColumns.contains(column.name) {
                                    viewModel.removeGroupBy(column.name)
                                } else {
                                    viewModel.addGroupBy(column.name)
                                }
                            }) {
                                HStack {
                                    Image(systemName: column.type.icon)
                                    Text(column.displayName)
                                    if viewModel.groupByColumns.contains(column.name) {
                                        Image(systemName: "checkmark.circle.fill")
                                    }
                                }
                                .font(ModernTheme.Typography.callout)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(
                                    viewModel.groupByColumns.contains(column.name) ?
                                    ModernTheme.Colors.primary.opacity(0.2) :
                                    ModernTheme.Colors.tertiaryBackground
                                )
                                .cornerRadius(ModernTheme.CornerRadius.sm)
                            }
                        }
                    }
                }
            }
        }
        .modernCard()
    }

    // MARK: - Aggregation Section
    private var aggregationSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text("Aggregations")
                    .font(ModernTheme.Typography.headline)
                Spacer()
                Menu {
                    if let columns = viewModel.selectedDataset?.columns {
                        ForEach(columns.filter { $0.type == .number || $0.type == .decimal || $0.type == .currency }) { column in
                            Menu(column.displayName) {
                                ForEach(AggregationFunction.allCases, id: \.self) { function in
                                    Button(function.displayName) {
                                        viewModel.addAggregation(column: column.name, function: function)
                                    }
                                }
                            }
                        }
                    }
                } label: {
                    Label("Add", systemImage: "plus.circle.fill")
                        .font(ModernTheme.Typography.callout)
                }
            }

            if viewModel.aggregations.isEmpty {
                Text("No aggregations")
                    .font(ModernTheme.Typography.callout)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(viewModel.aggregations) { agg in
                    AggregationRow(aggregation: agg, onRemove: {
                        viewModel.removeAggregation(agg)
                    })
                }
            }
        }
        .modernCard()
    }

    // MARK: - Sort Section
    private var sortSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text("Sort Order")
                    .font(ModernTheme.Typography.headline)
                Spacer()
                Menu {
                    if let columns = viewModel.selectedDataset?.columns {
                        ForEach(columns) { column in
                            Menu(column.displayName) {
                                Button("Ascending") {
                                    viewModel.addSort(column: column.name, direction: .ascending)
                                }
                                Button("Descending") {
                                    viewModel.addSort(column: column.name, direction: .descending)
                                }
                            }
                        }
                    }
                } label: {
                    Label("Add", systemImage: "plus.circle.fill")
                        .font(ModernTheme.Typography.callout)
                }
            }

            if viewModel.sortColumns.isEmpty {
                Text("No sorting applied")
                    .font(ModernTheme.Typography.callout)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(viewModel.sortColumns) { sort in
                    SortRow(sort: sort, onRemove: {
                        viewModel.removeSort(sort)
                    }, onToggleDirection: {
                        let newDirection: SortDirection = sort.direction == .ascending ? .descending : .ascending
                        viewModel.updateSortDirection(sort, direction: newDirection)
                    })
                }
            }
        }
        .modernCard()
    }

    // MARK: - Query Options
    private var queryOptions: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Query Options")
                .font(ModernTheme.Typography.headline)

            HStack {
                Text("Result Limit:")
                    .font(ModernTheme.Typography.callout)
                Spacer()
                Picker("Limit", selection: $viewModel.queryLimit) {
                    Text("100").tag(100)
                    Text("500").tag(500)
                    Text("1000").tag(1000)
                    Text("5000").tag(5000)
                }
                .pickerStyle(.menu)
            }
        }
        .modernCard()
    }

    // MARK: - Execute Button
    private var executeButton: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            Button(action: {
                Task {
                    await viewModel.executeQuery()
                    if viewModel.queryResult != nil {
                        withAnimation {
                            selectedTab = .results
                        }
                    }
                }
            }) {
                HStack {
                    if viewModel.isExecutingQuery {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: "play.fill")
                    }
                    Text("Execute Query")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(ModernTheme.Colors.primary)
                .foregroundColor(.white)
                .cornerRadius(ModernTheme.CornerRadius.md)
            }
            .disabled(viewModel.selectedColumns.isEmpty || viewModel.isExecutingQuery)

            if !viewModel.selectedColumns.isEmpty {
                Button(action: { viewModel.showSaveQuerySheet = true }) {
                    HStack {
                        Image(systemName: "bookmark")
                        Text("Save Query")
                    }
                    .font(ModernTheme.Typography.callout)
                    .foregroundColor(ModernTheme.Colors.primary)
                }
            }
        }
        .padding(.vertical)
    }

    // MARK: - Results Tab
    private var resultsTab: some View {
        Group {
            if let result = viewModel.queryResult {
                DataGridView(result: result)
            } else {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    Image(systemName: "tablecells.badge.ellipsis")
                        .font(.system(size: 64))
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Text("No Results")
                        .font(ModernTheme.Typography.title2)
                    Text("Execute a query to see results here")
                        .font(ModernTheme.Typography.callout)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    // MARK: - Saved Queries Tab
    private var savedQueriesTab: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.md) {
                if viewModel.savedQueries.isEmpty {
                    VStack(spacing: ModernTheme.Spacing.lg) {
                        Image(systemName: "bookmark.slash")
                            .font(.system(size: 64))
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                        Text("No Saved Queries")
                            .font(ModernTheme.Typography.title2)
                        Text("Save your queries for quick access")
                            .font(ModernTheme.Typography.callout)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                } else {
                    ForEach(viewModel.savedQueries) { query in
                        SavedQueryRow(
                            query: query,
                            onLoad: {
                                viewModel.loadQuery(query)
                                selectedTab = .query
                            },
                            onDelete: { viewModel.deleteQuery(query) },
                            onToggleFavorite: { viewModel.toggleFavorite(query) }
                        )
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Save Query Sheet
    private var saveQuerySheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Query Details")) {
                    TextField("Query Name", text: $viewModel.queryName)
                }
            }
            .navigationTitle("Save Query")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        viewModel.showSaveQuerySheet = false
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.saveCurrentQuery()
                        }
                    }
                    .disabled(viewModel.queryName.isEmpty)
                }
            }
        }
    }

    // MARK: - Export Sheet
    private var exportSheet: some View {
        NavigationView {
            List {
                ForEach(ExportFormat.allCases, id: \.self) { format in
                    Button(action: {
                        viewModel.exportFormat = format
                        Task {
                            await viewModel.exportResults(format: format)
                            viewModel.showExportSheet = false
                        }
                    }) {
                        HStack {
                            Image(systemName: format.icon)
                                .frame(width: 30)
                            Text(format.displayName)
                        }
                    }
                }
            }
            .navigationTitle("Export As")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        viewModel.showExportSheet = false
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct DatasetCard: View {
    let dataset: Dataset
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: dataset.source.icon)
                        .font(.title2)
                    Spacer()
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                }
                Text(dataset.name)
                    .font(ModernTheme.Typography.headline)
                Text("\(dataset.rowCount) rows")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
            .padding()
            .frame(width: 160, height: 120)
            .background(isSelected ? ModernTheme.Colors.primary.opacity(0.1) : ModernTheme.Colors.tertiaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .stroke(isSelected ? ModernTheme.Colors.primary : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

struct ColumnCheckbox: View {
    let column: DataColumn
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                    .foregroundColor(isSelected ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                Image(systemName: column.type.icon)
                    .font(.caption)
                Text(column.displayName)
                    .font(ModernTheme.Typography.callout)
                Spacer()
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(isSelected ? ModernTheme.Colors.primary.opacity(0.1) : Color.clear)
            .cornerRadius(ModernTheme.CornerRadius.sm)
        }
        .buttonStyle(.plain)
    }
}

struct FilterRow: View {
    let filter: FilterCondition
    let onRemove: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(filter.column)
                    .font(ModernTheme.Typography.callout)
                    .fontWeight(.medium)
                Text("\(filter.operator.displayName)")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
            Spacer()
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(ModernTheme.Colors.error)
            }
        }
        .padding()
        .background(ModernTheme.Colors.tertiaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

struct AggregationRow: View {
    let aggregation: Aggregation
    let onRemove: () -> Void

    var body: some View {
        HStack {
            Image(systemName: aggregation.function.icon)
            Text("\(aggregation.function.displayName)(\(aggregation.column))")
                .font(ModernTheme.Typography.callout)
            Spacer()
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(ModernTheme.Colors.error)
            }
        }
        .padding()
        .background(ModernTheme.Colors.tertiaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

struct SortRow: View {
    let sort: SortColumn
    let onRemove: () -> Void
    let onToggleDirection: () -> Void

    var body: some View {
        HStack {
            Text(sort.column)
                .font(ModernTheme.Typography.callout)
            Spacer()
            Button(action: onToggleDirection) {
                Image(systemName: sort.direction.icon)
                    .foregroundColor(ModernTheme.Colors.primary)
            }
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(ModernTheme.Colors.error)
            }
        }
        .padding()
        .background(ModernTheme.Colors.tertiaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

struct SavedQueryRow: View {
    let query: Query
    let onLoad: () -> Void
    let onDelete: () -> Void
    let onToggleFavorite: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(query.name)
                        .font(ModernTheme.Typography.headline)
                    if query.isFavorite {
                        Image(systemName: "star.fill")
                            .foregroundColor(ModernTheme.Colors.warning)
                            .font(.caption)
                    }
                }
                Text(query.dataset.displayName)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                if let savedAt = query.savedAt {
                    Text("Saved \(savedAt, style: .relative)")
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }

            Spacer()

            Menu {
                Button(action: onLoad) {
                    Label("Load Query", systemImage: "arrow.down.circle")
                }
                Button(action: onToggleFavorite) {
                    Label(query.isFavorite ? "Remove Favorite" : "Add to Favorites", systemImage: "star")
                }
                Button(role: .destructive, action: onDelete) {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .foregroundColor(ModernTheme.Colors.primary)
            }
        }
        .padding()
        .modernCard()
    }
}

#Preview {
    DataWorkbenchView()
}
