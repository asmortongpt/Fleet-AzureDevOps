//
//  BudgetPlanningView.swift
//  Fleet Manager
//
//  Budget overview with category breakdown and status tracking
//

import SwiftUI
import Charts

struct BudgetPlanningView: View {
    @StateObject private var viewModel = BudgetPlanningViewModel()
    @State private var showingAddBudget = false
    @State private var showingFilters = false
    @State private var selectedBudget: BudgetPlan?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Summary Cards
                    summarySection

                    // Active Budget Selection
                    if !viewModel.filteredBudgets.isEmpty {
                        budgetSelectionSection
                    }

                    // Active Budget Details
                    if let budget = viewModel.activeBudget {
                        activeBudgetSection(budget: budget)
                    }

                    // Alerts Section
                    if let budget = viewModel.activeBudget {
                        alertsSection(budget: budget)
                    }

                    // Category Breakdown
                    if let budget = viewModel.activeBudget {
                        categoryBreakdownSection(budget: budget)
                    }

                    // Quick Actions
                    quickActionsSection
                }
                .padding()
            }
            .navigationTitle("Budget Planning")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showingFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddBudget = true }) {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingAddBudget) {
                BudgetEditorView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                BudgetFiltersSheet(viewModel: viewModel)
            }
            .task {
                await viewModel.loadAllData()
            }
        }
    }

    // MARK: - Summary Section
    private var summarySection: some View {
        VStack(spacing: 12) {
            Text("FY \(viewModel.selectedFiscalYear) Overview")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                SummaryCard(
                    title: "Total Budget",
                    value: String(format: "$%.2f", viewModel.totalBudgeted),
                    icon: "dollarsign.circle.fill",
                    color: .blue
                )

                SummaryCard(
                    title: "Total Spent",
                    value: String(format: "$%.2f", viewModel.totalSpent),
                    icon: "cart.fill",
                    color: .orange
                )
            }

            HStack(spacing: 12) {
                SummaryCard(
                    title: "Remaining",
                    value: String(format: "$%.2f", viewModel.totalRemaining),
                    icon: "banknote.fill",
                    color: .green
                )

                SummaryCard(
                    title: "Used",
                    value: String(format: "%.1f%%", viewModel.overallPercentageUsed),
                    icon: "percent",
                    color: viewModel.overallPercentageUsed >= 90 ? .red : .purple
                )
            }

            // Budget Status Summary
            HStack(spacing: 16) {
                StatusBadge(count: viewModel.budgetsOnTrack, label: "On Track", color: .green)
                StatusBadge(count: viewModel.budgetsAtRisk, label: "At Risk", color: .orange)
                StatusBadge(count: viewModel.budgetsOverBudget, label: "Over Budget", color: .red)
            }
            .padding(.top, 8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Budget Selection Section
    private var budgetSelectionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Select Budget")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.filteredBudgets) { budget in
                        BudgetCard(budget: budget, isSelected: budget.id == viewModel.activeBudget?.id)
                            .onTapGesture {
                                viewModel.activeBudget = budget
                                Task {
                                    await viewModel.fetchBudgetPlan(id: budget.id)
                                }
                            }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Active Budget Section
    private func activeBudgetSection(budget: BudgetPlan) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Budget Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(budget.name)
                        .font(.title2)
                        .fontWeight(.bold)

                    HStack(spacing: 8) {
                        Image(systemName: budget.period.icon)
                            .font(.caption)
                        Text(budget.period.rawValue)
                            .font(.caption)
                            .foregroundColor(.secondary)

                        if let department = budget.department {
                            Image(systemName: "building.2")
                                .font(.caption)
                            Text(department)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    HStack {
                        Image(systemName: budget.status.icon)
                            .font(.caption)
                        Text(budget.status.rawValue)
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(budget.status.color).opacity(0.2))
                    .foregroundColor(Color(budget.status.color))
                    .cornerRadius(8)
                }
            }

            // Progress Bar
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Budget Progress")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Spacer()
                    Text(String(format: "%.1f%%", budget.percentageUsed))
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(budget.percentageUsed >= 90 ? .red : .primary)
                }

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 12)
                            .cornerRadius(6)

                        Rectangle()
                            .fill(budgetProgressColor(percentage: budget.percentageUsed))
                            .frame(width: min(geometry.size.width * CGFloat(budget.percentageUsed / 100), geometry.size.width), height: 12)
                            .cornerRadius(6)
                    }
                }
                .frame(height: 12)
            }

            // Budget Metrics
            VStack(spacing: 12) {
                MetricRow(
                    label: "Allocated",
                    value: String(format: "$%.2f", budget.totalAllocated),
                    icon: "dollarsign.circle"
                )

                MetricRow(
                    label: "Spent",
                    value: String(format: "$%.2f", budget.totalSpent),
                    icon: "cart"
                )

                MetricRow(
                    label: "Remaining",
                    value: String(format: "$%.2f", budget.remaining),
                    icon: "banknote"
                )

                MetricRow(
                    label: "Daily Burn Rate",
                    value: String(format: "$%.2f/day", budget.dailyBurnRate),
                    icon: "flame"
                )

                MetricRow(
                    label: "Days Remaining",
                    value: "\(budget.daysRemaining) days",
                    icon: "calendar"
                )

                if budget.projectedOverage > 0 {
                    MetricRow(
                        label: "Projected Overage",
                        value: String(format: "$%.2f", budget.projectedOverage),
                        icon: "exclamationmark.triangle",
                        valueColor: .red
                    )
                }
            }

            // Navigation Links
            HStack(spacing: 12) {
                NavigationLink(destination: BudgetVarianceView(budget: budget, viewModel: viewModel)) {
                    HStack {
                        Image(systemName: "chart.bar.xaxis")
                        Text("Variance Analysis")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(10)
                }

                NavigationLink(destination: BudgetForecastView(budget: budget, viewModel: viewModel)) {
                    HStack {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                        Text("Forecast")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.purple.opacity(0.1))
                    .foregroundColor(.purple)
                    .cornerRadius(10)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Alerts Section
    private func alertsSection(budget: BudgetPlan) -> some View {
        let alerts = viewModel.checkBudgetAlerts(for: budget)

        return Group {
            if !alerts.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Alerts")
                        .font(.headline)

                    ForEach(alerts) { alert in
                        HStack(spacing: 12) {
                            Image(systemName: alert.severity.icon)
                                .foregroundColor(Color(alert.severity.color))

                            Text(alert.message)
                                .font(.subheadline)

                            Spacer()
                        }
                        .padding()
                        .background(Color(alert.severity.color).opacity(0.1))
                        .cornerRadius(10)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)
            }
        }
    }

    // MARK: - Category Breakdown Section
    private func categoryBreakdownSection(budget: BudgetPlan) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Category Breakdown")
                .font(.headline)

            ForEach(budget.categories) { category in
                CategoryCard(allocation: category)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 12) {
                Button(action: { showingAddBudget = true }) {
                    ActionButton(icon: "plus.circle", label: "New Budget", color: .blue)
                }

                if let budget = viewModel.activeBudget {
                    Button(action: {
                        Task {
                            _ = await viewModel.copyBudget(from: budget, toFiscalYear: viewModel.selectedFiscalYear + 1)
                        }
                    }) {
                        ActionButton(icon: "doc.on.doc", label: "Copy Budget", color: .green)
                    }
                }
            }

            if let budget = viewModel.activeBudget {
                HStack(spacing: 12) {
                    Button(action: {
                        Task {
                            _ = await viewModel.exportBudgetReport(budgetId: budget.id, format: .pdf)
                        }
                    }) {
                        ActionButton(icon: "arrow.down.doc", label: "Export PDF", color: .orange)
                    }

                    Button(action: {
                        Task {
                            _ = await viewModel.exportBudgetReport(budgetId: budget.id, format: .excel)
                        }
                    }) {
                        ActionButton(icon: "tablecells", label: "Export Excel", color: .purple)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Helper Functions
    private func budgetProgressColor(percentage: Double) -> Color {
        if percentage >= 100 {
            return .red
        } else if percentage >= 90 {
            return .orange
        } else if percentage >= 75 {
            return .yellow
        } else {
            return .green
        }
    }
}

// MARK: - Supporting Views

struct SummaryCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

struct StatusBadge: View {
    let count: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct BudgetCard: View {
    let budget: BudgetPlan
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(budget.name)
                .font(.subheadline)
                .fontWeight(.semibold)
                .lineLimit(1)

            HStack {
                Image(systemName: budget.status.icon)
                    .font(.caption)
                Text(budget.status.rawValue)
                    .font(.caption)
            }
            .foregroundColor(Color(budget.status.color))

            Text(String(format: "%.1f%% Used", budget.percentageUsed))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 140)
        .padding()
        .background(isSelected ? Color.blue.opacity(0.2) : Color(.secondarySystemBackground))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
    }
}

struct CategoryCard: View {
    let allocation: BudgetAllocation

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: allocation.category.icon)
                    .foregroundColor(Color(allocation.category.color))
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 4) {
                    Text(allocation.category.rawValue)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text("\(allocation.formattedSpent) of \(allocation.formattedAllocated)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(String(format: "%.1f%%", allocation.percentageUsed))
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(allocation.percentageUsed >= 90 ? .red : .primary)

                    HStack(spacing: 4) {
                        Image(systemName: allocation.varianceStatus.icon)
                        Text(allocation.formattedRemaining)
                    }
                    .font(.caption)
                    .foregroundColor(Color(allocation.varianceStatus.color))
                }
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(Color(allocation.category.color))
                        .frame(width: min(geometry.size.width * CGFloat(allocation.percentageUsed / 100), geometry.size.width), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

struct MetricRow: View {
    let label: String
    let value: String
    let icon: String
    var valueColor: Color = .primary

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(valueColor)
        }
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
            Text(label)
                .font(.subheadline)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .foregroundColor(color)
        .cornerRadius(10)
    }
}

struct BudgetFiltersSheet: View {
    @ObservedObject var viewModel: BudgetPlanningViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Fiscal Year")) {
                    Picker("Fiscal Year", selection: $viewModel.selectedFiscalYear) {
                        ForEach(viewModel.availableFiscalYears, id: \.self) { year in
                            Text("FY \(year)").tag(year)
                        }
                    }
                }

                Section(header: Text("Status")) {
                    Toggle("Show Only Active", isOn: $viewModel.showOnlyActive)
                }

                Section(header: Text("Department")) {
                    TextField("Department", text: Binding(
                        get: { viewModel.selectedDepartment ?? "" },
                        set: { viewModel.selectedDepartment = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section {
                    Button("Apply Filters") {
                        Task {
                            await viewModel.applyFilters()
                            dismiss()
                        }
                    }

                    Button("Clear Filters") {
                        viewModel.clearFilters()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    BudgetPlanningView()
}
