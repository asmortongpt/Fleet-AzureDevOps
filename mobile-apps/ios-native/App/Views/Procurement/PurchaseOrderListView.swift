//
//  PurchaseOrderListView.swift
//  Fleet Manager
//
//  Purchase Order management with approval workflow
//

import SwiftUI

struct PurchaseOrderListView: View {
    @StateObject private var viewModel = PurchaseOrderViewModel()
    @State private var showingCreatePO = false

    var body: some View {
        ZStack {
            if viewModel.loadingState.isLoading && viewModel.purchaseOrders.isEmpty {
                ProgressView("Loading purchase orders...")
            } else if viewModel.filteredOrders.isEmpty {
                emptyStateView
            } else {
                orderListContent
            }
        }
        .navigationTitle("Purchase Orders")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $viewModel.searchText, prompt: "Search POs")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingCreatePO = true }) {
                    Image(systemName: "plus.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .sheet(isPresented: $showingCreatePO) {
            CreatePurchaseOrderView()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.fetchPurchaseOrders()
        }
    }

    // MARK: - Order List Content
    private var orderListContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Alerts
                if !viewModel.pendingApproval.isEmpty || !viewModel.overdue.isEmpty {
                    alertsSection
                }

                // Filters
                filtersSection

                // Summary Cards
                summaryCardsSection

                // Order List
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.filteredOrders) { order in
                        NavigationLink(destination: PurchaseOrderDetailView(order: order)) {
                            PurchaseOrderCard(order: order)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Alerts Section
    private var alertsSection: some View {
        VStack(spacing: 12) {
            if !viewModel.pendingApproval.isEmpty {
                AlertBanner(
                    title: "Pending Approval",
                    message: "\(viewModel.pendingApproval.count) orders awaiting approval",
                    icon: "clock.fill",
                    color: .orange
                )
            }

            if !viewModel.overdue.isEmpty {
                AlertBanner(
                    title: "Overdue Delivery",
                    message: "\(viewModel.overdue.count) orders past expected delivery",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Filters Section
    private var filtersSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                Menu {
                    Button("All Statuses") {
                        viewModel.selectStatus(nil)
                    }
                    ForEach(POStatus.allCases, id: \.self) { status in
                        Button(action: {
                            viewModel.selectStatus(status)
                        }) {
                            Label(status.rawValue, systemImage: status.icon)
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                        Text(viewModel.selectedStatus?.rawValue ?? "Status")
                        Image(systemName: "chevron.down")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(viewModel.selectedStatus != nil ? Color.blue : Color(.secondarySystemGroupedBackground))
                    .foregroundColor(viewModel.selectedStatus != nil ? .white : .primary)
                    .cornerRadius(20)
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Summary Cards Section
    private var summaryCardsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SummaryCard(
                    title: "Total Orders",
                    value: "\(viewModel.purchaseOrders.count)",
                    icon: "shippingbox.fill",
                    color: .blue
                )

                SummaryCard(
                    title: "Pending Approval",
                    value: "\(viewModel.pendingApproval.count)",
                    icon: "clock.fill",
                    color: .orange
                )

                SummaryCard(
                    title: "Overdue",
                    value: "\(viewModel.overdue.count)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )

                SummaryCard(
                    title: "Total Value",
                    value: String(format: "$%.0fK", viewModel.purchaseOrders.reduce(0) { $0 + $1.total } / 1000),
                    icon: "dollarsign.circle.fill",
                    color: .green
                )
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "shippingbox")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Purchase Orders")
                .font(.title2.bold())

            Text("Create your first purchase order to order parts")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingCreatePO = true }) {
                Label("Create PO", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Purchase Order Card
struct PurchaseOrderCard: View {
    let order: PurchaseOrder

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(order.poNumber)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(order.vendorName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(order.formattedTotal)
                        .font(.headline)
                        .foregroundColor(.green)

                    HStack(spacing: 4) {
                        Image(systemName: order.status.icon)
                            .font(.caption2)
                        Text(order.status.rawValue)
                            .font(.caption2)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color(order.statusColor).opacity(0.2))
                    .foregroundColor(Color(order.statusColor))
                    .cornerRadius(8)
                }
            }

            Divider()

            // Details
            HStack(spacing: 20) {
                POMetric(
                    icon: "calendar",
                    label: "Order Date",
                    value: order.orderDate.formatted(date: .abbreviated, time: .omitted)
                )

                if let expectedDate = order.expectedDeliveryDate {
                    POMetric(
                        icon: "truck.box",
                        label: "Expected",
                        value: expectedDate.formatted(date: .abbreviated, time: .omitted)
                    )
                }

                POMetric(
                    icon: "cube.box",
                    label: "Items",
                    value: "\(order.itemCount)"
                )
            }

            // Overdue Warning
            if order.isOverdue {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text("Delivery overdue")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            // Approval Info
            if let approvedBy = order.approvedBy {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                    Text("Approved by \(approvedBy)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if order.status == .pendingApproval {
                HStack(spacing: 8) {
                    Image(systemName: "clock.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                    Text("Awaiting approval")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - PO Metric
struct POMetric: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundColor(.blue)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.caption.bold())
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Purchase Order Detail View (Placeholder)
struct PurchaseOrderDetailView: View {
    let order: PurchaseOrder

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(order.poNumber)
                        .font(.title2.bold())
                    Text(order.vendorName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()

                // Status
                HStack {
                    Image(systemName: order.status.icon)
                    Text(order.status.rawValue)
                        .font(.headline)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(order.statusColor).opacity(0.2))
                .foregroundColor(Color(order.statusColor))
                .cornerRadius(12)
                .padding(.horizontal)

                // Line Items
                VStack(alignment: .leading, spacing: 12) {
                    Text("Line Items")
                        .font(.headline)
                        .padding(.horizontal)

                    ForEach(order.items) { item in
                        POLineItemCard(item: item)
                    }
                }

                // Totals
                VStack(spacing: 8) {
                    HStack {
                        Text("Subtotal")
                        Spacer()
                        Text(String(format: "$%.2f", order.subtotal))
                    }
                    HStack {
                        Text("Tax")
                        Spacer()
                        Text(String(format: "$%.2f", order.tax))
                    }
                    HStack {
                        Text("Shipping")
                        Spacer()
                        Text(String(format: "$%.2f", order.shippingCost))
                    }
                    Divider()
                    HStack {
                        Text("Total")
                            .font(.headline)
                        Spacer()
                        Text(order.formattedTotal)
                            .font(.headline)
                            .foregroundColor(.green)
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
                .padding(.horizontal)

                // Actions
                if order.canApprove {
                    VStack(spacing: 12) {
                        Button(action: {}) {
                            Label("Approve Order", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        Button(action: {}) {
                            Label("Reject Order", systemImage: "xmark.circle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("PO Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - PO Line Item Card
struct POLineItemCard: View {
    let item: POLineItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.partName)
                    .font(.subheadline.bold())
                Spacer()
                Text(item.formattedTotalPrice)
                    .font(.subheadline.bold())
                    .foregroundColor(.green)
            }

            HStack {
                Text(item.partNumber)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("Qty: \(item.quantity) × \(item.formattedUnitPrice)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if item.quantityReceived > 0 {
                ProgressView(value: Double(item.quantityReceived), total: Double(item.quantity))
                    .tint(.green)
                Text("\(item.quantityReceived) of \(item.quantity) received")
                    .font(.caption)
                    .foregroundColor(.green)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

// MARK: - Create Purchase Order View (Placeholder)
struct CreatePurchaseOrderView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Vendor") {
                    Text("Select Vendor")
                }

                Section("Line Items") {
                    Button("Add Item") {}
                }

                Section("Delivery") {
                    DatePicker("Expected Delivery", selection: .constant(Date()), displayedComponents: .date)
                    TextField("Delivery Address", text: .constant(""))
                }
            }
            .navigationTitle("Create Purchase Order")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PurchaseOrderListView()
    }
}
