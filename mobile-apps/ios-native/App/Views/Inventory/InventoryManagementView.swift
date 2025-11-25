//
//  InventoryManagementView.swift
//  Fleet Manager
//
//  Main inventory management interface with stock tracking and alerts
//

import SwiftUI

struct InventoryManagementView: View {
    @StateObject private var viewModel = InventoryManagementViewModel()
    @State private var showingAddItem = false
    @State private var showingFilters = false
    @State private var showingScanner = false
    @State private var selectedTab: InventoryTab = .all

    enum InventoryTab: String, CaseIterable {
        case all = "All Items"
        case lowStock = "Low Stock"
        case alerts = "Alerts"

        var icon: String {
            switch self {
            case .all: return "cube.box.fill"
            case .lowStock: return "exclamationmark.triangle.fill"
            case .alerts: return "bell.badge.fill"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Summary Cards
                summarySection

                // Tab Picker
                Picker("View", selection: $selectedTab) {
                    ForEach(InventoryTab.allCases, id: \.self) { tab in
                        Label(tab.rawValue, systemImage: tab.icon)
                            .tag(tab)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Content
                switch selectedTab {
                case .all:
                    inventoryListView
                case .lowStock:
                    lowStockView
                case .alerts:
                    alertsView
                }
            }
            .navigationTitle("Inventory")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showingFilters.toggle() }) {
                        Label("Filters", systemImage: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        Button(action: { showingScanner.toggle() }) {
                            Label("Scan", systemImage: "barcode.viewfinder")
                        }

                        Button(action: { showingAddItem.toggle() }) {
                            Label("Add", systemImage: "plus.circle.fill")
                        }
                    }
                }
            }
            .sheet(isPresented: $showingAddItem) {
                AddInventoryItemView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                InventoryFiltersView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingScanner) {
                BarcodeScannerView { barcode in
                    if let item = viewModel.lookupByBarcode(barcode) {
                        viewModel.selectedItem = item
                    }
                    showingScanner = false
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadInventoryData()
            }
        }
    }

    // MARK: - Summary Section
    private var summarySection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SummaryCard(
                    title: "Total Value",
                    value: String(format: "$%.0f", viewModel.totalInventoryValue),
                    icon: "dollarsign.circle.fill",
                    color: .green
                )

                SummaryCard(
                    title: "Total Items",
                    value: "\(viewModel.inventoryItems.count)",
                    icon: "cube.box.fill",
                    color: .blue
                )

                SummaryCard(
                    title: "Low Stock",
                    value: "\(viewModel.lowStockItemsCount)",
                    icon: "exclamationmark.triangle.fill",
                    color: .orange
                )

                SummaryCard(
                    title: "Out of Stock",
                    value: "\(viewModel.outOfStockItemsCount)",
                    icon: "xmark.circle.fill",
                    color: .red
                )

                SummaryCard(
                    title: "Alerts",
                    value: "\(viewModel.alertsCount)",
                    icon: "bell.badge.fill",
                    color: .purple
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Inventory List View
    private var inventoryListView: some View {
        Group {
            if viewModel.loadingState.isLoading && viewModel.filteredItems.isEmpty {
                ProgressView("Loading inventory...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredItems.isEmpty {
                EmptyStateView(
                    icon: "cube.box",
                    title: "No Items Found",
                    message: "Add items to your inventory or adjust your filters"
                )
            } else {
                List {
                    ForEach(viewModel.filteredItems) { item in
                        NavigationLink(destination: InventoryItemDetailView(item: item, viewModel: viewModel)) {
                            InventoryItemRow(item: item)
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
    }

    // MARK: - Low Stock View
    private var lowStockView: some View {
        Group {
            let lowStockItems = viewModel.generateLowStockReport()

            if lowStockItems.isEmpty {
                EmptyStateView(
                    icon: "checkmark.circle",
                    title: "All Stock Levels OK",
                    message: "No items are currently low on stock"
                )
            } else {
                List {
                    ForEach(lowStockItems) { item in
                        NavigationLink(destination: InventoryItemDetailView(item: item, viewModel: viewModel)) {
                            LowStockItemRow(item: item)
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
    }

    // MARK: - Alerts View
    private var alertsView: some View {
        Group {
            if viewModel.activeAlerts.isEmpty {
                EmptyStateView(
                    icon: "checkmark.shield",
                    title: "No Active Alerts",
                    message: "Your inventory is in good shape"
                )
            } else {
                List {
                    ForEach(viewModel.activeAlerts) { alert in
                        InventoryAlertRow(alert: alert) {
                            Task {
                                try? await viewModel.acknowledgeAlert(alert.id)
                            }
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
    }
}

// MARK: - Summary Card
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
                    .font(.title2)
                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(width: 140, height: 100)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

// MARK: - Inventory Item Row
struct InventoryItemRow: View {
    let item: InventoryItem

    var body: some View {
        HStack(spacing: 12) {
            // Category Icon
            Image(systemName: item.category.icon)
                .foregroundColor(Color(item.category.color))
                .font(.title2)
                .frame(width: 40, height: 40)
                .background(Color(item.category.color).opacity(0.1))
                .cornerRadius(8)

            // Item Info
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.body)
                    .fontWeight(.medium)

                Text("SKU: \(item.sku)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(spacing: 8) {
                    Label("\(item.quantity) \(item.unitOfMeasure)", systemImage: "cube.box")
                        .font(.caption)

                    Label(item.location.rawValue, systemImage: item.location.icon)
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(item.formattedTotalValue)
                    .font(.callout)
                    .fontWeight(.semibold)

                // Status Badge
                if item.stockStatus != .normal {
                    HStack(spacing: 4) {
                        Image(systemName: item.stockStatus.icon)
                        Text(item.stockStatus.rawValue)
                    }
                    .font(.caption)
                    .foregroundColor(Color(item.stockStatus.color))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(item.stockStatus.color).opacity(0.1))
                    .cornerRadius(6)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Low Stock Item Row
struct LowStockItemRow: View {
    let item: InventoryItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
                .font(.title2)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.body)
                    .fontWeight(.medium)

                Text("SKU: \(item.sku)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(spacing: 4) {
                    Text("Current: \(item.quantity)")
                    Text("•")
                    Text("Min: \(item.minLevel)")
                    Text("•")
                    Text("Reorder: \(item.reorderPoint)")
                }
                .font(.caption)
                .foregroundColor(.orange)
            }

            Spacer()

            VStack(alignment: .trailing) {
                if item.needsReorder {
                    Text("Order \(item.reorderQuantity)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Inventory Alert Row
struct InventoryAlertRow: View {
    let alert: InventoryAlert
    let onAcknowledge: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "bell.fill")
                    .foregroundColor(Color(alert.severity.color))

                Text(alert.alertType.rawValue)
                    .font(.headline)

                Spacer()

                Text(alert.severity.rawValue)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(alert.severity.color))
                    .cornerRadius(6)
            }

            Text(alert.itemName)
                .font(.subheadline)
                .fontWeight(.medium)

            Text(alert.message)
                .font(.caption)
                .foregroundColor(.secondary)

            Button(action: onAcknowledge) {
                Text("Acknowledge")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            }
            .buttonStyle(BorderlessButtonStyle())
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text(title)
                .font(.title2)
                .fontWeight(.semibold)

            Text(message)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Inventory Item Detail View
struct InventoryItemDetailView: View {
    let item: InventoryItem
    @ObservedObject var viewModel: InventoryManagementViewModel
    @State private var showingStockMovement = false

    var body: some View {
        List {
            Section(header: Text("Item Information")) {
                DetailRow(label: "Name", value: item.name)
                DetailRow(label: "SKU", value: item.sku)
                DetailRow(label: "Category", value: item.category.rawValue)
                if let description = item.description {
                    DetailRow(label: "Description", value: description)
                }
            }

            Section(header: Text("Stock Information")) {
                DetailRow(label: "Quantity", value: "\(item.quantity) \(item.unitOfMeasure)")
                DetailRow(label: "Location", value: item.location.rawValue)
                if let locationDetail = item.locationDetail {
                    DetailRow(label: "Location Detail", value: locationDetail)
                }
                DetailRow(label: "Status", value: item.stockStatus.rawValue)
            }

            Section(header: Text("Stock Levels")) {
                DetailRow(label: "Minimum Level", value: "\(item.minLevel)")
                DetailRow(label: "Maximum Level", value: "\(item.maxLevel)")
                DetailRow(label: "Reorder Point", value: "\(item.reorderPoint)")
                DetailRow(label: "Reorder Quantity", value: "\(item.reorderQuantity)")
            }

            Section(header: Text("Pricing")) {
                DetailRow(label: "Unit Cost", value: item.formattedUnitCost)
                DetailRow(label: "Total Value", value: item.formattedTotalValue)
            }

            if let supplier = item.supplier {
                Section(header: Text("Supplier")) {
                    DetailRow(label: "Name", value: supplier.name)
                    if let contact = supplier.contactName {
                        DetailRow(label: "Contact", value: contact)
                    }
                    DetailRow(label: "Lead Time", value: "\(supplier.leadTimeDays) days")
                }
            }

            if let expirationDate = item.expirationDate {
                Section(header: Text("Expiration")) {
                    DetailRow(label: "Expiration Date", value: formatDate(expirationDate))
                    if item.isExpiringSoon {
                        Text("⚠️ Expiring soon")
                            .foregroundColor(.orange)
                    }
                    if item.isExpired {
                        Text("❌ Expired")
                            .foregroundColor(.red)
                    }
                }
            }

            Section {
                Button(action: { showingStockMovement.toggle() }) {
                    Label("Record Stock Movement", systemImage: "arrow.left.arrow.right.circle.fill")
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("Item Details")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingStockMovement) {
            StockMovementView(item: item, viewModel: viewModel)
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Detail Row
struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Add Inventory Item View
struct AddInventoryItemView: View {
    @ObservedObject var viewModel: InventoryManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var sku = ""
    @State private var selectedCategory: InventoryCategory = .parts
    @State private var quantity = 0
    @State private var selectedLocation: StockLocation = .warehouse

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Basic Information")) {
                    TextField("Item Name", text: $name)
                    TextField("SKU", text: $sku)
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(InventoryCategory.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category)
                        }
                    }
                }

                Section(header: Text("Stock Information")) {
                    Stepper("Quantity: \(quantity)", value: $quantity, in: 0...10000)
                    Picker("Location", selection: $selectedLocation) {
                        ForEach(StockLocation.allCases, id: \.self) { location in
                            Text(location.rawValue).tag(location)
                        }
                    }
                }
            }
            .navigationTitle("Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        // TODO: Implement save
                        dismiss()
                    }
                    .disabled(name.isEmpty || sku.isEmpty)
                }
            }
        }
    }
}

// MARK: - Inventory Filters View
struct InventoryFiltersView: View {
    @ObservedObject var viewModel: InventoryManagementViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Category")) {
                    Picker("Category", selection: $viewModel.selectedCategory) {
                        Text("All Categories").tag(nil as InventoryCategory?)
                        ForEach(InventoryCategory.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category as InventoryCategory?)
                        }
                    }
                }

                Section(header: Text("Location")) {
                    Picker("Location", selection: $viewModel.selectedLocation) {
                        Text("All Locations").tag(nil as StockLocation?)
                        ForEach(StockLocation.allCases, id: \.self) { location in
                            Text(location.rawValue).tag(location as StockLocation?)
                        }
                    }
                }

                Section(header: Text("Status")) {
                    Toggle("Low Stock Only", isOn: $viewModel.showLowStockOnly)
                    Toggle("Expiring Soon Only", isOn: $viewModel.showExpiringSoonOnly)
                }

                Section {
                    Button("Clear All Filters") {
                        viewModel.clearFilters()
                    }
                    .foregroundColor(.red)
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
    InventoryManagementView()
}
