//
//  WorkOrderListView.swift
//  Fleet Manager - iOS Native App
//
//  Work Order List with search, filters, and statistics
//

import SwiftUI

struct WorkOrderListView: View {
    @StateObject private var viewModel = WorkOrderViewModel()
    @State private var showingCreateWorkOrder = false
    @State private var showingFilters = false
    @State private var selectedWorkOrder: WorkOrder?

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading && viewModel.filteredWorkOrders.isEmpty {
                    ProgressView("Loading work orders...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredWorkOrders.isEmpty && !viewModel.searchText.isEmpty {
                    emptySearchState
                } else if viewModel.filteredWorkOrders.isEmpty {
                    emptyState
                } else {
                    workOrderList
                }
            }
            .navigationTitle("Work Orders")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search work orders...")
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    filterButton
                    createButton
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingCreateWorkOrder) {
                CreateWorkOrderView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                WorkOrderFilterView(viewModel: viewModel)
            }
            .sheet(item: $selectedWorkOrder) { workOrder in
                WorkOrderDetailView(workOrder: workOrder, viewModel: viewModel)
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Work Order List
    private var workOrderList: some View {
        ScrollView {
            // Statistics Bar
            statisticsBar

            // Active Filters
            if hasActiveFilters {
                activeFiltersBar
            }

            // Work Order Cards
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredWorkOrders) { workOrder in
                    WorkOrderCard(workOrder: workOrder) {
                        selectedWorkOrder = workOrder
                    }
                    .transition(.asymmetric(
                        insertion: .slide.combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 20)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Statistics Bar
    private var statisticsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                StatCard(
                    title: "Open",
                    value: "\(viewModel.openCount)",
                    icon: "doc.badge.plus",
                    color: .gray
                )

                StatCard(
                    title: "In Progress",
                    value: "\(viewModel.inProgressCount)",
                    icon: "gearshape.2",
                    color: .orange
                )

                StatCard(
                    title: "Completed",
                    value: "\(viewModel.completedThisWeek)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )

                StatCard(
                    title: "Monthly Cost",
                    value: formatCurrency(viewModel.totalCostThisMonth),
                    icon: "dollarsign.circle.fill",
                    color: .purple
                )

                StatCard(
                    title: "Avg Days",
                    value: String(format: "%.1f", viewModel.averageCompletionTime),
                    icon: "clock.fill",
                    color: .blue
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Active Filters Bar
    private var activeFiltersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if let status = viewModel.selectedStatus {
                    FilterChip(title: status.rawValue, color: .blue) {
                        viewModel.applyStatusFilter(nil)
                    }
                }

                if let priority = viewModel.selectedPriority {
                    FilterChip(title: priority.rawValue, color: .orange) {
                        viewModel.applyPriorityFilter(nil)
                    }
                }

                if let type = viewModel.selectedType {
                    FilterChip(title: type.rawValue, color: .purple) {
                        viewModel.applyTypeFilter(nil)
                    }
                }

                if viewModel.selectedTechId != nil {
                    FilterChip(title: "By Technician", color: .green) {
                        viewModel.applyTechFilter(nil)
                    }
                }

                Button(action: viewModel.clearFilters) {
                    Label("Clear All", systemImage: "xmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    private var hasActiveFilters: Bool {
        viewModel.selectedStatus != nil ||
        viewModel.selectedPriority != nil ||
        viewModel.selectedType != nil ||
        viewModel.selectedTechId != nil
    }

    // MARK: - Toolbar Items
    private var filterButton: some View {
        Button(action: { showingFilters = true }) {
            Image(systemName: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                .foregroundColor(hasActiveFilters ? .blue : .primary)
        }
    }

    private var createButton: some View {
        Button(action: { showingCreateWorkOrder = true }) {
            Image(systemName: "plus.circle.fill")
                .foregroundColor(.blue)
        }
    }

    // MARK: - Empty States
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "wrench.and.screwdriver.fill")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Work Orders")
                .font(.title2.bold())

            Text("Create your first work order")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: { showingCreateWorkOrder = true }) {
                Label("Create Work Order", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptySearchState: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)

            Text("No Results")
                .font(.title2.bold())

            Text("No work orders match '\(viewModel.searchText)'")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button("Clear Search") {
                viewModel.searchText = ""
            }
            .foregroundColor(.blue)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Helper Functions
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

// MARK: - Work Order Card
struct WorkOrderCard: View {
    let workOrder: WorkOrder
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(workOrder.woNumber)
                            .font(.headline.bold())
                            .foregroundColor(.primary)

                        HStack(spacing: 4) {
                            Text(workOrder.vehicleNumber ?? "Unknown")
                                .font(.subheadline)
                            if let make = workOrder.vehicleMake, let model = workOrder.vehicleModel {
                                Text("(\(make) \(model))")
                                    .font(.caption)
                            }
                        }
                        .foregroundColor(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        WorkOrderStatusBadge(status: workOrder.status)
                        WorkOrderPriorityBadge(priority: workOrder.priority)
                    }
                }

                // Description
                Text(workOrder.description)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                    .lineLimit(2)

                // Type and Tech
                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Image(systemName: workOrder.type.icon)
                            .font(.caption)
                            .foregroundColor(.blue)
                        Text(workOrder.type.rawValue)
                            .font(.caption)
                            .lineLimit(1)
                    }

                    if let tech = workOrder.assignedTechName {
                        HStack(spacing: 4) {
                            Image(systemName: "person.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                            Text(tech)
                                .font(.caption)
                                .lineLimit(1)
                        }
                    }
                }

                // Dates and Cost
                HStack(spacing: 16) {
                    if let dueDate = workOrder.dueDate {
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .font(.caption)
                                .foregroundColor(workOrder.isOverdue ? .red : .gray)
                            Text("Due: \(dueDate, style: .date)")
                                .font(.caption)
                                .foregroundColor(workOrder.isOverdue ? .red : .secondary)
                        }
                    }

                    if workOrder.totalCost > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "dollarsign.circle")
                                .font(.caption)
                                .foregroundColor(.purple)
                            Text(workOrder.formattedTotalCost)
                                .font(.caption)
                        }
                    }
                }

                // Parts indicator
                if !workOrder.parts.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "shippingbox.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                        Text("\(workOrder.parts.count) part\(workOrder.parts.count == 1 ? "" : "s")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Overdue warning
                if workOrder.isOverdue {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                        Text("Overdue by \(workOrder.daysOpen) days")
                            .font(.caption.bold())
                            .foregroundColor(.red)
                    }
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Status Badge
struct WorkOrderStatusBadge: View {
    let status: WorkOrderStatus

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
            Text(status.rawValue)
        }
        .font(.caption2.bold())
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(backgroundColor)
        .foregroundColor(foregroundColor)
        .cornerRadius(6)
    }

    private var backgroundColor: Color {
        Color(status.color).opacity(0.2)
    }

    private var foregroundColor: Color {
        Color(status.color)
    }
}

// MARK: - Priority Badge
struct WorkOrderPriorityBadge: View {
    let priority: WorkOrderPriority

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: priority.icon)
            Text(priority.rawValue)
        }
        .font(.caption2.bold())
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(backgroundColor)
        .foregroundColor(foregroundColor)
        .cornerRadius(6)
    }

    private var backgroundColor: Color {
        Color(priority.color).opacity(0.2)
    }

    private var foregroundColor: Color {
        Color(priority.color)
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title3.bold())
                .foregroundColor(.primary)
        }
        .padding()
        .frame(minWidth: 100)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(title)
                Image(systemName: "xmark.circle.fill")
            }
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(color.opacity(0.2))
            .foregroundColor(color)
            .cornerRadius(20)
        }
    }
}

// MARK: - Filter View
struct WorkOrderFilterView: View {
    @ObservedObject var viewModel: WorkOrderViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Status") {
                    Picker("Filter by Status", selection: Binding(
                        get: { viewModel.selectedStatus },
                        set: { viewModel.applyStatusFilter($0) }
                    )) {
                        Text("All").tag(nil as WorkOrderStatus?)
                        ForEach(WorkOrderStatus.allCases, id: \.self) { status in
                            HStack {
                                Image(systemName: status.icon)
                                Text(status.rawValue)
                            }
                            .tag(status as WorkOrderStatus?)
                        }
                    }
                }

                Section("Priority") {
                    Picker("Filter by Priority", selection: Binding(
                        get: { viewModel.selectedPriority },
                        set: { viewModel.applyPriorityFilter($0) }
                    )) {
                        Text("All").tag(nil as WorkOrderPriority?)
                        ForEach(WorkOrderPriority.allCases, id: \.self) { priority in
                            HStack {
                                Image(systemName: priority.icon)
                                Text(priority.rawValue)
                            }
                            .tag(priority as WorkOrderPriority?)
                        }
                    }
                }

                Section("Type") {
                    Picker("Filter by Type", selection: Binding(
                        get: { viewModel.selectedType },
                        set: { viewModel.applyTypeFilter($0) }
                    )) {
                        Text("All").tag(nil as WorkOrderType?)
                        ForEach(WorkOrderType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.rawValue)
                            }
                            .tag(type as WorkOrderType?)
                        }
                    }
                }

                Section("Technician") {
                    Picker("Filter by Technician", selection: Binding(
                        get: { viewModel.selectedTechId },
                        set: { viewModel.applyTechFilter($0) }
                    )) {
                        Text("All Technicians").tag(nil as String?)
                        ForEach(viewModel.technicians) { tech in
                            Text(tech.name).tag(tech.id as String?)
                        }
                    }
                }

                Section {
                    Button(action: {
                        viewModel.clearFilters()
                        dismiss()
                    }) {
                        Label("Clear All Filters", systemImage: "xmark.circle")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
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
    WorkOrderListView()
}
