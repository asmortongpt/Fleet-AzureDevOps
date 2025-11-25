//
//  ExecutiveDashboardView.swift
//  Fleet Manager
//
//  Main dashboard with KPI cards, charts, and alerts
//

import SwiftUI

struct ExecutiveDashboardView: View {
    @StateObject private var viewModel = ExecutiveDashboardViewModel()
    @State private var showingFilters = false
    @State private var showingExportOptions = false
    @State private var selectedKPICategory: KPI.KPICategory?

    var body: some View {
        NavigationView {
            ZStack {
                ModernTheme.Colors.groupedBackground
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: ModernTheme.Spacing.lg) {
                        // Header with filters
                        headerView

                        if viewModel.loadingState.isLoading && viewModel.metrics == nil {
                            loadingView
                        } else if let error = viewModel.errorMessage {
                            errorView(error)
                        } else {
                            contentView
                        }
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
            .navigationTitle("Executive Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: {
                            showingFilters = true
                        }) {
                            Label("Filters", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button(action: {
                            showingExportOptions = true
                        }) {
                            Label("Export to PDF", systemImage: "square.and.arrow.up")
                        }

                        Button(action: {
                            Task {
                                await viewModel.refresh()
                            }
                        }) {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingFilters) {
                filtersView
            }
            .sheet(isPresented: $showingExportOptions) {
                exportOptionsView
            }
            .task {
                if viewModel.metrics == nil {
                    await viewModel.loadDashboard()
                }
            }
        }
    }

    // MARK: - Header View
    private var headerView: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Period: \(viewModel.selectedPeriod.rawValue)")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    if viewModel.selectedDepartment != .all || viewModel.selectedRegion != .all {
                        HStack(spacing: ModernTheme.Spacing.xs) {
                            if viewModel.selectedDepartment != .all {
                                filterPill(viewModel.selectedDepartment.rawValue)
                            }
                            if viewModel.selectedRegion != .all {
                                filterPill(viewModel.selectedRegion.rawValue)
                            }
                        }
                    }
                }

                Spacer()

                if let metrics = viewModel.metrics {
                    VStack(alignment: .trailing, spacing: ModernTheme.Spacing.xs) {
                        Text("Last Updated")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Text(metrics.lastUpdated, style: .relative)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
        }
    }

    private func filterPill(_ text: String) -> some View {
        Text(text)
            .font(ModernTheme.Typography.caption2)
            .foregroundColor(ModernTheme.Colors.primary)
            .padding(.horizontal, ModernTheme.Spacing.sm)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(ModernTheme.Colors.primary.opacity(0.15))
            )
    }

    // MARK: - Content View
    private var contentView: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            // Critical Alerts
            if !viewModel.alerts.isEmpty {
                AlertsView(
                    alerts: viewModel.getCriticalAlerts(),
                    onAcknowledge: { alert in
                        await viewModel.acknowledgeAlert(alert)
                    },
                    onDismiss: { alert in
                        viewModel.dismissAlert(alert)
                    }
                )
            }

            // KPI Cards
            kpiCardsSection

            // Executive Summary
            if viewModel.summary != nil || viewModel.metrics != nil {
                ExecutiveSummaryView(
                    summary: viewModel.summary,
                    metrics: viewModel.metrics
                )
            }

            // Trend Charts
            if !viewModel.trendData.isEmpty {
                trendsSection
            }

            // Department Comparison
            if !viewModel.departments.isEmpty {
                departmentsSection
            }
        }
    }

    // MARK: - KPI Cards Section
    private var kpiCardsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Key Performance Indicators")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                Menu {
                    Button(action: {
                        selectedKPICategory = nil
                    }) {
                        Label("All KPIs", systemImage: selectedKPICategory == nil ? "checkmark" : "")
                    }

                    ForEach([KPI.KPICategory.financial, .operational, .safety, .compliance], id: \.self) { category in
                        Button(action: {
                            selectedKPICategory = category
                        }) {
                            Label(category.rawValue, systemImage: selectedKPICategory == category ? "checkmark" : "")
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(selectedKPICategory?.rawValue ?? "All")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.primary)

                        Image(systemName: "chevron.down")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                }
            }

            let filteredKPIs = selectedKPICategory != nil
                ? viewModel.getKPIsByCategory(selectedKPICategory!)
                : viewModel.kpis

            LazyVGrid(
                columns: ModernTheme.adaptiveColumns,
                spacing: ModernTheme.Spacing.md
            ) {
                ForEach(filteredKPIs) { kpi in
                    KPICardView(kpi: kpi)
                }
            }
        }
    }

    // MARK: - Trends Section
    private var trendsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Performance Trends")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            ForEach(viewModel.trendData) { trend in
                TrendChartView(
                    trendData: [trend],
                    title: trend.name,
                    yAxisLabel: "Value",
                    showLegend: false
                )
            }

            // Multi-line comparison chart if multiple trends
            if viewModel.trendData.count > 1 {
                let costTrends = viewModel.trendData.filter { $0.category == "Financial" }
                if !costTrends.isEmpty {
                    TrendChartView(
                        trendData: costTrends,
                        title: "Cost Comparison",
                        yAxisLabel: "Cost ($)"
                    )
                }
            }
        }
    }

    // MARK: - Departments Section
    private var departmentsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Department Performance")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            VStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(viewModel.departments) { department in
                    departmentRow(department)
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(ModernTheme.Colors.background)
                    .shadow(
                        color: ModernTheme.Shadow.small.color,
                        radius: ModernTheme.Shadow.small.radius,
                        x: ModernTheme.Shadow.small.x,
                        y: ModernTheme.Shadow.small.y
                    )
            )
        }
    }

    private func departmentRow(_ department: Department) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(department.name)
                        .font(ModernTheme.Typography.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text("\(department.vehicleCount) vehicles • \(department.manager)")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                budgetStatusBadge(department.budgetStatus)
            }

            HStack(spacing: ModernTheme.Spacing.lg) {
                metricColumn(label: "Budget", value: department.formattedBudget)
                metricColumn(label: "Spent", value: department.formattedMonthlyCost)
                metricColumn(label: "Utilization", value: department.formattedUtilization)
            }

            // Budget progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(ModernTheme.Colors.tertiaryBackground)
                        .frame(height: 6)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(budgetProgressColor(department.budgetStatus))
                        .frame(
                            width: min(geometry.size.width * (department.monthlyCost / department.budget), geometry.size.width),
                            height: 6
                        )
                }
            }
            .frame(height: 6)
        }
        .padding(.vertical, ModernTheme.Spacing.sm)
        .overlay(
            Rectangle()
                .fill(ModernTheme.Colors.separator)
                .frame(height: 1),
            alignment: .bottom
        )
    }

    private func metricColumn(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(value)
                .font(ModernTheme.Typography.caption1)
                .fontWeight(.medium)
                .foregroundColor(ModernTheme.Colors.primaryText)
        }
    }

    private func budgetStatusBadge(_ status: Department.BudgetStatus) -> some View {
        Text(status.label)
            .font(ModernTheme.Typography.caption2)
            .foregroundColor(.white)
            .padding(.horizontal, ModernTheme.Spacing.sm)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(budgetProgressColor(status))
            )
    }

    private func budgetProgressColor(_ status: Department.BudgetStatus) -> Color {
        switch status {
        case .overbudget:
            return ModernTheme.Colors.error
        case .nearLimit:
            return ModernTheme.Colors.warning
        case .onTrack:
            return ModernTheme.Colors.success
        }
    }

    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Loading Executive Dashboard...")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.vertical, 100)
    }

    // MARK: - Error View
    private func errorView(_ message: String) -> some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(ModernTheme.Colors.error)

            Text("Error Loading Dashboard")
                .font(ModernTheme.Typography.title3)
                .fontWeight(.semibold)

            Text(message)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)

            Button(action: {
                Task {
                    await viewModel.loadDashboard()
                }
            }) {
                Text("Retry")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: 200)
                    .background(
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                            .fill(ModernTheme.Colors.primary)
                    )
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
    }

    // MARK: - Filters View
    private var filtersView: some View {
        NavigationView {
            Form {
                Section("Time Period") {
                    Picker("Period", selection: $viewModel.selectedPeriod) {
                        ForEach(DashboardFilterPeriod.allCases, id: \.self) { period in
                            Text(period.rawValue).tag(period)
                        }
                    }
                }

                Section("Department") {
                    Picker("Department", selection: $viewModel.selectedDepartment) {
                        Text("All Departments").tag(DashboardFilterDepartment.all)
                        Text("Operations").tag(DashboardFilterDepartment.operations)
                        Text("Sales").tag(DashboardFilterDepartment.sales)
                        Text("Maintenance").tag(DashboardFilterDepartment.maintenance)
                        Text("Logistics").tag(DashboardFilterDepartment.logistics)
                    }
                }

                Section("Region") {
                    Picker("Region", selection: $viewModel.selectedRegion) {
                        Text("All Regions").tag(DashboardFilterRegion.all)
                        Text("North").tag(DashboardFilterRegion.north)
                        Text("South").tag(DashboardFilterRegion.south)
                        Text("East").tag(DashboardFilterRegion.east)
                        Text("West").tag(DashboardFilterRegion.west)
                    }
                }

                Section {
                    Button("Apply Filters") {
                        Task {
                            await viewModel.loadDashboard()
                            showingFilters = false
                        }
                    }

                    Button("Clear Filters") {
                        viewModel.clearFilters()
                        showingFilters = false
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilters = false
                    }
                }
            }
        }
    }

    // MARK: - Export Options View
    private var exportOptionsView: some View {
        NavigationView {
            List {
                Button(action: {
                    Task {
                        do {
                            let url = try await viewModel.exportDashboardToPDF()
                            // Share the PDF
                            let activityVC = UIActivityViewController(
                                activityItems: [url],
                                applicationActivities: nil
                            )
                            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                               let window = windowScene.windows.first,
                               let rootVC = window.rootViewController {
                                rootVC.present(activityVC, animated: true)
                            }
                            showingExportOptions = false
                        } catch {
                            viewModel.handleError(error)
                        }
                    }
                }) {
                    Label("Export to PDF", systemImage: "doc.fill")
                }

                Button(action: {
                    // Schedule email report functionality
                    showingExportOptions = false
                }) {
                    Label("Schedule Email Report", systemImage: "envelope.fill")
                }
            }
            .navigationTitle("Export Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        showingExportOptions = false
                    }
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    ExecutiveDashboardView()
}
