//
//  BudgetVarianceView.swift
//  Fleet Manager
//
//  Actual vs planned comparison with variance analysis
//

import SwiftUI
import Charts

struct BudgetVarianceView: View {
    let budget: BudgetPlan
    @ObservedObject var viewModel: BudgetPlanningViewModel

    @State private var selectedCategory: BudgetCategory?
    @State private var showFavorableOnly = false
    @State private var showUnfavorableOnly = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Summary Section
                varianceSummarySection

                // Filters
                filtersSection

                // Variance Chart
                varianceChartSection

                // Category Variances
                categoryVariancesSection

                // Variance Details Table
                varianceTableSection
            }
            .padding()
        }
        .navigationTitle("Variance Analysis")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.fetchVariances(budgetId: budget.id)
        }
    }

    // MARK: - Variance Summary Section
    private var varianceSummarySection: some View {
        VStack(spacing: 16) {
            Text("Budget Variance Summary")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                VarianceSummaryCard(
                    title: "Budgeted",
                    value: String(format: "$%.2f", budget.totalAllocated),
                    icon: "dollarsign.circle",
                    color: .blue
                )

                VarianceSummaryCard(
                    title: "Actual",
                    value: String(format: "$%.2f", budget.totalSpent),
                    icon: "cart",
                    color: .orange
                )
            }

            HStack(spacing: 12) {
                VarianceSummaryCard(
                    title: "Variance",
                    value: String(format: "$%.2f", abs(budget.variance)),
                    icon: budget.variance >= 0 ? "arrow.down.circle" : "arrow.up.circle",
                    color: budget.variance >= 0 ? .green : .red
                )

                VarianceSummaryCard(
                    title: "Variance %",
                    value: String(format: "%.1f%%", abs(budget.variancePercentage)),
                    icon: "percent",
                    color: budget.variancePercentage >= 0 ? .green : .red
                )
            }

            // Variance Status
            HStack {
                Image(systemName: budget.variance >= 0 ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundColor(budget.variance >= 0 ? .green : .red)

                Text(budget.variance >= 0 ? "Under Budget (Favorable)" : "Over Budget (Unfavorable)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(budget.variance >= 0 ? .green : .red)

                Spacer()
            }
            .padding()
            .background(budget.variance >= 0 ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
            .cornerRadius(10)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Filters Section
    private var filtersSection: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Filters")
                    .font(.headline)

                Spacer()

                Button("Reset") {
                    selectedCategory = nil
                    showFavorableOnly = false
                    showUnfavorableOnly = false
                }
                .font(.caption)
                .foregroundColor(.blue)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(
                        title: "All Categories",
                        isSelected: selectedCategory == nil,
                        action: { selectedCategory = nil }
                    )

                    ForEach(BudgetCategory.allCases) { category in
                        FilterChip(
                            title: category.rawValue,
                            isSelected: selectedCategory == category,
                            action: { selectedCategory = category }
                        )
                    }
                }
            }

            HStack(spacing: 12) {
                Toggle("Favorable Only", isOn: $showFavorableOnly)
                    .onChange(of: showFavorableOnly) { _, newValue in
                        if newValue {
                            showUnfavorableOnly = false
                        }
                    }

                Toggle("Unfavorable Only", isOn: $showUnfavorableOnly)
                    .onChange(of: showUnfavorableOnly) { _, newValue in
                        if newValue {
                            showFavorableOnly = false
                        }
                    }
            }
            .font(.caption)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Variance Chart Section
    private var varianceChartSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Variance by Category")
                .font(.headline)

            if #available(iOS 16.0, *) {
                Chart {
                    ForEach(filteredAllocations) { allocation in
                        BarMark(
                            x: .value("Category", allocation.category.rawValue),
                            y: .value("Budgeted", allocation.allocatedAmount)
                        )
                        .foregroundStyle(.blue.opacity(0.5))

                        BarMark(
                            x: .value("Category", allocation.category.rawValue),
                            y: .value("Actual", allocation.spentAmount)
                        )
                        .foregroundStyle(Color(allocation.category.color))
                    }
                }
                .frame(height: 250)
                .chartXAxis {
                    AxisMarks { _ in
                        AxisValueLabel()
                            .font(.caption2)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisValueLabel {
                            if let doubleValue = value.as(Double.self) {
                                Text(formatCurrency(doubleValue))
                                    .font(.caption2)
                            }
                        }
                    }
                }
            } else {
                Text("Charts require iOS 16.0 or later")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Legend
            HStack(spacing: 20) {
                HStack(spacing: 4) {
                    Rectangle()
                        .fill(.blue.opacity(0.5))
                        .frame(width: 20, height: 12)
                    Text("Budgeted")
                        .font(.caption)
                }

                HStack(spacing: 4) {
                    Rectangle()
                        .fill(.orange)
                        .frame(width: 20, height: 12)
                    Text("Actual")
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Category Variances Section
    private var categoryVariancesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Category Breakdown")
                .font(.headline)

            ForEach(filteredAllocations) { allocation in
                CategoryVarianceCard(allocation: allocation)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Variance Table Section
    private var varianceTableSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detailed Variance Table")
                .font(.headline)

            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Category")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Text("Budgeted")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 80, alignment: .trailing)

                    Text("Actual")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 80, alignment: .trailing)

                    Text("Variance")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 80, alignment: .trailing)
                }
                .padding()
                .background(Color(.secondarySystemBackground))

                // Rows
                ForEach(filteredAllocations) { allocation in
                    HStack {
                        HStack(spacing: 8) {
                            Image(systemName: allocation.category.icon)
                                .foregroundColor(Color(allocation.category.color))
                                .font(.caption)
                            Text(allocation.category.rawValue)
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)

                        Text(String(format: "$%.2f", allocation.allocatedAmount))
                            .font(.caption)
                            .frame(width: 80, alignment: .trailing)

                        Text(String(format: "$%.2f", allocation.spentAmount))
                            .font(.caption)
                            .frame(width: 80, alignment: .trailing)

                        Text(String(format: "$%.2f", abs(allocation.variance)))
                            .font(.caption)
                            .foregroundColor(allocation.variance >= 0 ? .green : .red)
                            .frame(width: 80, alignment: .trailing)
                    }
                    .padding()
                    .background(Color(.systemBackground))

                    Divider()
                }

                // Total Row
                HStack {
                    Text("TOTAL")
                        .font(.caption)
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Text(String(format: "$%.2f", budget.totalAllocated))
                        .font(.caption)
                        .fontWeight(.bold)
                        .frame(width: 80, alignment: .trailing)

                    Text(String(format: "$%.2f", budget.totalSpent))
                        .font(.caption)
                        .fontWeight(.bold)
                        .frame(width: 80, alignment: .trailing)

                    Text(String(format: "$%.2f", abs(budget.variance)))
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(budget.variance >= 0 ? .green : .red)
                        .frame(width: 80, alignment: .trailing)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
            }
            .background(Color(.systemBackground))
            .cornerRadius(10)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Computed Properties
    private var filteredAllocations: [BudgetAllocation] {
        var filtered = budget.categories

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if showFavorableOnly {
            filtered = filtered.filter { $0.variance >= 0 }
        }

        if showUnfavorableOnly {
            filtered = filtered.filter { $0.variance < 0 }
        }

        return filtered
    }

    // MARK: - Helper Functions
    private func formatCurrency(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "$%.1fK", value / 1000)
        } else {
            return String(format: "$%.0f", value)
        }
    }
}

// MARK: - Supporting Views

struct VarianceSummaryCard: View {
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

struct CategoryVarianceCard: View {
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

                    HStack(spacing: 16) {
                        HStack(spacing: 4) {
                            Text("Budget:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(allocation.formattedAllocated)
                                .font(.caption)
                        }

                        HStack(spacing: 4) {
                            Text("Actual:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(allocation.formattedSpent)
                                .font(.caption)
                        }
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: allocation.varianceStatus.icon)
                        Text(String(format: "$%.2f", abs(allocation.variance)))
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(Color(allocation.varianceStatus.color))

                    Text(String(format: "%.1f%%", abs(allocation.variancePercentage)))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Comparison Bar
            GeometryReader { geometry in
                HStack(spacing: 4) {
                    // Budgeted bar
                    Rectangle()
                        .fill(Color.blue.opacity(0.3))
                        .frame(width: geometry.size.width / 2 - 2, height: 20)
                        .overlay(
                            Text("Budgeted")
                                .font(.caption2)
                                .foregroundColor(.white)
                        )

                    // Actual bar
                    Rectangle()
                        .fill(Color(allocation.category.color))
                        .frame(width: geometry.size.width / 2 - 2, height: 20)
                        .overlay(
                            Text("Actual")
                                .font(.caption2)
                                .foregroundColor(.white)
                        )
                }
            }
            .frame(height: 20)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color(.secondarySystemBackground))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

#Preview {
    NavigationView {
        BudgetVarianceView(
            budget: BudgetPlan(
                id: "1",
                name: "FY 2025 Fleet Budget",
                fiscalYear: 2025,
                startDate: Date(),
                endDate: Calendar.current.date(byAdding: .year, value: 1, to: Date()) ?? Date(),
                period: .annual,
                totalAllocated: 100000,
                totalSpent: 75000,
                totalProjected: 95000,
                categories: [
                    BudgetAllocation(id: "1", category: .fuel, allocatedAmount: 30000, spentAmount: 25000, projectedAmount: 28000, percentage: 30),
                    BudgetAllocation(id: "2", category: .maintenance, allocatedAmount: 25000, spentAmount: 20000, projectedAmount: 24000, percentage: 25),
                    BudgetAllocation(id: "3", category: .insurance, allocatedAmount: 20000, spentAmount: 15000, projectedAmount: 18000, percentage: 20)
                ],
                department: "Operations",
                vehicleId: nil,
                createdBy: "Admin",
                createdAt: Date(),
                updatedAt: Date(),
                isActive: true
            ),
            viewModel: BudgetPlanningViewModel()
        )
    }
}
