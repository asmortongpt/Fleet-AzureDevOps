//
//  CustomReportBuilderView.swift
//  Fleet Manager - iOS Native App
//
//  Custom Report Builder Interface
//  Visual report builder with drag-drop fields, filters, and templates
//

import SwiftUI

struct CustomReportBuilderView: View {
    @StateObject private var viewModel = ReportBuilderViewModel()
    @State private var showTemplateLibrary = false
    @State private var showPreview = false
    @State private var showScheduler = false
    @State private var showExportSheet = false
    @State private var showSaveDialog = false
    @State private var editingTemplateName = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Template Selection Header
                    templateHeader

                    // Report Configuration Sections
                    VStack(spacing: 16) {
                        dataSourceSection
                        fieldsSection
                        filtersSection
                        groupingSection
                        sortingSection
                        chartTypeSection
                        dateRangeSection
                    }
                    .padding(.horizontal)

                    // Action Buttons
                    actionButtons
                        .padding()
                }
                .padding(.vertical)
            }
            .navigationTitle("Report Builder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showTemplateLibrary = true }) {
                        Label("Templates", systemImage: "folder.fill")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showSaveDialog = true }) {
                            Label("Save Template", systemImage: "square.and.arrow.down")
                        }

                        Button(action: { showScheduler = true }) {
                            Label("Schedule Report", systemImage: "clock.badge.checkmark")
                        }

                        Button(action: { viewModel.createNewTemplate() }) {
                            Label("New Report", systemImage: "plus.circle")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showTemplateLibrary) {
                TemplateLibraryView(viewModel: viewModel)
            }
            .sheet(isPresented: $showPreview) {
                if viewModel.generatedReport != nil {
                    ReportPreviewView(
                        report: viewModel.generatedReport!,
                        chartType: viewModel.chartType
                    )
                }
            }
            .sheet(isPresented: $showScheduler) {
                ReportSchedulerView(viewModel: viewModel)
            }
            .sheet(isPresented: $showExportSheet) {
                ExportOptionsView(viewModel: viewModel)
            }
            .alert("Save Template", isPresented: $showSaveDialog) {
                TextField("Template Name", text: $editingTemplateName)
                Button("Cancel", role: .cancel) { }
                Button("Save") {
                    if !editingTemplateName.isEmpty {
                        viewModel.currentTemplate.name = editingTemplateName
                        viewModel.saveTemplate()
                    }
                }
            } message: {
                Text("Enter a name for this report template")
            }
        }
    }

    // MARK: - Template Header

    private var templateHeader: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: viewModel.currentTemplate.type.icon)
                    .font(.title)
                    .foregroundColor(.blue)

                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.currentTemplate.name)
                        .font(.headline)

                    Text(viewModel.currentTemplate.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if viewModel.currentTemplate.isCustom {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
        .padding(.horizontal)
    }

    // MARK: - Data Source Section

    private var dataSourceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Data Source",
                icon: "database.fill",
                description: "Select the primary data source for this report"
            )

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ReportDataSource.allCases, id: \.self) { source in
                        DataSourceCard(
                            source: source,
                            isSelected: viewModel.selectedDataSource == source
                        ) {
                            viewModel.updateDataSource(source)
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Fields Section

    private var fieldsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Report Fields",
                icon: "list.bullet.rectangle",
                description: "Select and order the fields to include (drag to reorder)"
            )

            // Selected Fields
            if !viewModel.selectedFields.isEmpty {
                VStack(spacing: 8) {
                    ForEach(viewModel.selectedFields, id: \.self) { field in
                        SelectedFieldRow(field: field) {
                            viewModel.removeField(field)
                        }
                    }
                    .onMove { source, destination in
                        viewModel.moveField(from: source, to: destination)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(8)
            }

            // Available Fields
            VStack(spacing: 8) {
                Text("Available Fields")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                FlowLayout(spacing: 8) {
                    ForEach(viewModel.selectedDataSource.availableFields, id: \.self) { field in
                        if !viewModel.selectedFields.contains(field) {
                            FieldChip(field: field) {
                                viewModel.toggleField(field)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Filters Section

    private var filtersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Filters",
                icon: "line.3.horizontal.decrease.circle",
                description: "Add conditions to filter report data"
            )

            // Existing Filters
            if !viewModel.filters.isEmpty {
                VStack(spacing: 8) {
                    ForEach(Array(viewModel.filters.enumerated()), id: \.element.id) { index, filter in
                        FilterRow(filter: filter) {
                            viewModel.removeFilter(at: index)
                        }
                    }
                }
            }

            // Add Filter Button
            NavigationLink(destination: AddFilterView(viewModel: viewModel)) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Filter")
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Grouping Section

    private var groupingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Group By",
                icon: "square.3.layers.3d",
                description: "Group report data by a field"
            )

            if let grouping = viewModel.grouping {
                VStack(spacing: 12) {
                    HStack {
                        Text("Grouped by: \(grouping.field.rawValue)")
                            .font(.subheadline)

                        Spacer()

                        Button(action: { viewModel.grouping = nil }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red)
                        }
                    }

                    Toggle("Show Subtotals", isOn: Binding(
                        get: { grouping.showSubtotals },
                        set: { viewModel.grouping?.showSubtotals = $0 }
                    ))

                    Toggle("Show Grand Total", isOn: Binding(
                        get: { grouping.showGrandTotal },
                        set: { viewModel.grouping?.showGrandTotal = $0 }
                    ))
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(8)
            } else {
                Menu {
                    ForEach(viewModel.selectedFields, id: \.self) { field in
                        Button(field.rawValue) {
                            viewModel.grouping = ReportGrouping(field: field)
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Select Grouping Field")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                .disabled(viewModel.selectedFields.isEmpty)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Sorting Section

    private var sortingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Sort By",
                icon: "arrow.up.arrow.down",
                description: "Define sort order for report data"
            )

            if let sorting = viewModel.sorting {
                HStack {
                    Text(sorting.field.rawValue)
                        .font(.subheadline)

                    Spacer()

                    Picker("Direction", selection: Binding(
                        get: { sorting.direction },
                        set: { viewModel.sorting?.direction = $0 }
                    )) {
                        Text("Ascending").tag(ReportSorting.SortDirection.ascending)
                        Text("Descending").tag(ReportSorting.SortDirection.descending)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .frame(width: 180)

                    Button(action: { viewModel.sorting = nil }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(8)
            } else {
                Menu {
                    ForEach(viewModel.selectedFields, id: \.self) { field in
                        Button(field.rawValue) {
                            viewModel.sorting = ReportSorting(
                                field: field,
                                direction: .ascending
                            )
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "plus.circle")
                        Text("Select Sort Field")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                .disabled(viewModel.selectedFields.isEmpty)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Chart Type Section

    private var chartTypeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Visualization",
                icon: "chart.bar.fill",
                description: "Choose how to display the report data"
            )

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ReportChartType.allCases, id: \.self) { type in
                        ChartTypeCard(
                            type: type,
                            isSelected: viewModel.chartType == type
                        ) {
                            viewModel.chartType = type
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Date Range Section

    private var dateRangeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(
                title: "Date Range",
                icon: "calendar",
                description: "Filter data by date range"
            )

            HStack(spacing: 12) {
                ForEach([
                    ("7D", DateRange.thisWeek),
                    ("30D", DateRange.last30Days),
                    ("90D", DateRange.last90Days),
                    ("1Y", DateRange.last90Days)
                ], id: \.0) { label, range in
                    Button(action: { viewModel.dateRange = range }) {
                        Text(label)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                viewModel.dateRange.start == range.start
                                    ? Color.blue
                                    : Color(.systemGray6)
                            )
                            .foregroundColor(
                                viewModel.dateRange.start == range.start
                                    ? .white
                                    : .primary
                            )
                            .cornerRadius(8)
                    }
                }
            }

            HStack {
                DatePicker(
                    "From",
                    selection: Binding(
                        get: { viewModel.dateRange.start },
                        set: { newDate in
                            viewModel.dateRange = DateRange(
                                start: newDate,
                                end: viewModel.dateRange.end
                            )
                        }
                    ),
                    displayedComponents: .date
                )
                .labelsHidden()

                Text("to")
                    .foregroundColor(.secondary)

                DatePicker(
                    "To",
                    selection: Binding(
                        get: { viewModel.dateRange.end },
                        set: { newDate in
                            viewModel.dateRange = DateRange(
                                start: viewModel.dateRange.start,
                                end: newDate
                            )
                        }
                    ),
                    displayedComponents: .date
                )
                .labelsHidden()
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(8)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        VStack(spacing: 12) {
            // Generate Preview Button
            Button(action: {
                Task {
                    await viewModel.generateReport()
                    if viewModel.generatedReport != nil {
                        showPreview = true
                    }
                }
            }) {
                HStack {
                    if viewModel.isGenerating {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: "eye.fill")
                    }

                    Text(viewModel.isGenerating ? "Generating..." : "Preview Report")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(viewModel.selectedFields.isEmpty || viewModel.isGenerating)

            // Export Button
            if viewModel.generatedReport != nil {
                Button(action: { showExportSheet = true }) {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Export Report")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }

            // Schedule Button
            Button(action: { showScheduler = true }) {
                HStack {
                    Image(systemName: "clock.badge.checkmark")
                    Text("Schedule Report")
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.purple.opacity(0.1))
                .foregroundColor(.purple)
                .cornerRadius(12)
            }
            .disabled(viewModel.selectedFields.isEmpty)
        }
    }
}

// MARK: - Supporting Views

struct SectionHeader: View {
    let title: String
    let icon: String
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.headline)
            }

            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct DataSourceCard: View {
    let source: ReportDataSource
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: source.icon)
                    .font(.title2)

                Text(source.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 100, height: 80)
            .background(isSelected ? Color.blue.opacity(0.15) : Color(.systemBackground))
            .foregroundColor(isSelected ? .blue : .primary)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
    }
}

struct SelectedFieldRow: View {
    let field: ReportField
    let onRemove: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "line.3.horizontal")
                .foregroundColor(.secondary)

            Text(field.rawValue)
                .font(.subheadline)

            Spacer()

            Text(field.dataType.rawValue)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(.systemGray5))
                .cornerRadius(4)

            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.red)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .cornerRadius(6)
    }
}

struct FieldChip: View {
    let field: ReportField
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(field.rawValue)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(16)
        }
    }
}

struct FilterRow: View {
    let filter: ReportFilter
    let onRemove: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(filter.displayText)
                    .font(.subheadline)

                Text("\(filter.field.rawValue) \(filter.operatorType.symbol) \(filter.value)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: onRemove) {
                Image(systemName: "trash.circle.fill")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

struct ChartTypeCard: View {
    let type: ReportChartType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: type.icon)
                    .font(.title2)

                Text(type.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 100, height: 80)
            .background(isSelected ? Color.blue.opacity(0.15) : Color(.systemBackground))
            .foregroundColor(isSelected ? .blue : .primary)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX, y: bounds.minY + result.frames[index].minY), proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize
        var frames: [CGRect]

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var frames: [CGRect] = []
            var size: CGSize = .zero
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let subviewSize = subview.sizeThatFits(.unspecified)

                if currentX + subviewSize.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                frames.append(CGRect(origin: CGPoint(x: currentX, y: currentY), size: subviewSize))
                currentX += subviewSize.width + spacing
                lineHeight = max(lineHeight, subviewSize.height)
                size.width = max(size.width, currentX)
            }

            size.height = currentY + lineHeight
            self.size = size
            self.frames = frames
        }
    }
}

// MARK: - Preview

#Preview {
    CustomReportBuilderView()
}
