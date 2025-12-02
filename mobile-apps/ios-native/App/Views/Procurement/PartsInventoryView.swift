//
//  PartsInventoryView.swift
//  Fleet Manager
//
//  Parts inventory with stock levels and reorder management
//

import SwiftUI

struct PartsInventoryView: View {
    @StateObject private var viewModel = PartsViewModel()
    @State private var showingAddPart = false
    @State private var showingStockAdjustment = false
    @State private var selectedPart: Part?

    var body: some View {
        ZStack {
            if viewModel.loadingState.isLoading && viewModel.parts.isEmpty {
                ProgressView("Loading inventory...")
            } else if viewModel.filteredParts.isEmpty {
                emptyStateView
            } else {
                inventoryContent
            }
        }
        .navigationTitle("Parts Inventory")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $viewModel.searchText, prompt: "Search parts")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingAddPart = true }) {
                        Label("Add Part", systemImage: "plus.circle")
                    }
                    Button(action: { showingStockAdjustment = true }) {
                        Label("Adjust Stock", systemImage: "arrow.up.arrow.down")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .sheet(isPresented: $showingAddPart) {
            AddPartView()
        }
        .sheet(item: $selectedPart) { part in
            PartDetailSheet(part: part)
        }
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.fetchParts()
        }
    }

    // MARK: - Inventory Content
    private var inventoryContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Alerts Section
                if !viewModel.outOfStockParts.isEmpty || !viewModel.lowStockParts.isEmpty {
                    alertsSection
                }

                // Filters
                filtersSection

                // Summary Cards
                summaryCardsSection

                // Parts List
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.filteredParts) { part in
                        PartCard(part: part)
                            .onTapGesture {
                                selectedPart = part
                            }
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
            if !viewModel.outOfStockParts.isEmpty {
                AlertBanner(
                    title: "Out of Stock",
                    message: "\(viewModel.outOfStockParts.count) parts need immediate reordering",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )
            }

            if !viewModel.lowStockParts.isEmpty {
                AlertBanner(
                    title: "Low Stock",
                    message: "\(viewModel.lowStockParts.count) parts below reorder point",
                    icon: "exclamationmark.circle.fill",
                    color: .orange
                )
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Filters Section
    private var filtersSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // Category Filter
                Menu {
                    Button("All Categories") {
                        viewModel.selectCategory(nil)
                    }
                    ForEach(PartCategory.allCases, id: \.self) { category in
                        Button(action: {
                            viewModel.selectCategory(category)
                        }) {
                            Label(category.rawValue, systemImage: category.icon)
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                        Text(viewModel.selectedCategory?.rawValue ?? "Category")
                        Image(systemName: "chevron.down")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(viewModel.selectedCategory != nil ? Color.blue : Color(.secondarySystemGroupedBackground))
                    .foregroundColor(viewModel.selectedCategory != nil ? .white : .primary)
                    .cornerRadius(20)
                }

                // Low Stock Filter
                Button(action: viewModel.toggleLowStockFilter) {
                    HStack {
                        Image(systemName: "exclamationmark.circle")
                        Text("Low Stock")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(viewModel.showLowStockOnly ? Color.orange : Color(.secondarySystemGroupedBackground))
                    .foregroundColor(viewModel.showLowStockOnly ? .white : .primary)
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
                    title: "Total Parts",
                    value: "\(viewModel.parts.count)",
                    icon: "wrench.and.screwdriver.fill",
                    color: .blue
                )

                SummaryCard(
                    title: "Low Stock",
                    value: "\(viewModel.lowStockParts.count)",
                    icon: "exclamationmark.circle.fill",
                    color: .orange
                )

                SummaryCard(
                    title: "Out of Stock",
                    value: "\(viewModel.outOfStockParts.count)",
                    icon: "xmark.circle.fill",
                    color: .red
                )

                SummaryCard(
                    title: "Total Value",
                    value: String(format: "$%.0fK", viewModel.parts.reduce(0) { $0 + $1.totalValue } / 1000),
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
            Image(systemName: "wrench.and.screwdriver")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Parts Found")
                .font(.title2.bold())

            Text("Add parts to track your inventory")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingAddPart = true }) {
                Label("Add Part", systemImage: "plus.circle.fill")
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

// MARK: - Part Card
struct PartCard: View {
    let part: Part

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(part.name)
                        .font(.headline)
                        .foregroundColor(.primary)

                    HStack(spacing: 4) {
                        Image(systemName: part.category.icon)
                            .font(.caption)
                        Text(part.partNumber)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(part.formattedUnitPrice)
                        .font(.headline)
                        .foregroundColor(.green)

                    Text(part.stockStatus)
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color(part.stockStatusColor).opacity(0.2))
                        .foregroundColor(Color(part.stockStatusColor))
                        .cornerRadius(8)
                }
            }

            Divider()

            // Stock Information
            HStack(spacing: 20) {
                StockMetric(
                    icon: "cube.fill",
                    label: "On Hand",
                    value: "\(part.quantityOnHand)",
                    color: .blue
                )

                StockMetric(
                    icon: "arrow.down.circle.fill",
                    label: "Reorder Point",
                    value: "\(part.reorderPoint)",
                    color: .orange
                )

                StockMetric(
                    icon: "dollarsign.circle.fill",
                    label: "Total Value",
                    value: part.formattedTotalValue,
                    color: .green
                )
            }

            // Vendor Info
            if let vendorName = part.vendorName {
                HStack(spacing: 8) {
                    Image(systemName: "building.2.fill")
                        .font(.caption)
                        .foregroundColor(.blue)
                    Text(vendorName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Location
            if let location = part.location {
                HStack(spacing: 8) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.caption)
                        .foregroundColor(.purple)
                    Text(location)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Stock Metric
struct StockMetric: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundColor(color)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Alert Banner
struct AlertBanner: View {
    let title: String
    let message: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(color)
                Text(message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Part Detail Sheet
struct PartDetailSheet: View {
    let part: Part
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text(part.name)
                            .font(.title2.bold())
                        Text(part.partNumber)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()

                    // Stock Status
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Stock Status")
                            .font(.headline)
                            .padding(.horizontal)

                        HStack(spacing: 20) {
                            VStack {
                                Text("\(part.quantityOnHand)")
                                    .font(.title.bold())
                                Text("On Hand")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Divider()
                                .frame(height: 40)

                            VStack {
                                Text("\(part.reorderPoint)")
                                    .font(.title.bold())
                                    .foregroundColor(.orange)
                                Text("Reorder Point")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Divider()
                                .frame(height: 40)

                            VStack {
                                Text("\(part.reorderQuantity)")
                                    .font(.title.bold())
                                    .foregroundColor(.blue)
                                Text("Reorder Qty")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Pricing
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Pricing")
                            .font(.headline)
                            .padding(.horizontal)

                        HStack {
                            Text("Unit Price")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(part.formattedUnitPrice)
                                .font(.headline)
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)

                        HStack {
                            Text("Total Value")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(part.formattedTotalValue)
                                .font(.headline)
                                .foregroundColor(.green)
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Actions
                    VStack(spacing: 12) {
                        Button(action: {}) {
                            Label("Adjust Stock", systemImage: "arrow.up.arrow.down")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        Button(action: {}) {
                            Label("Create Purchase Order", systemImage: "shippingbox.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.purple)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Part Details")
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

// MARK: - Add Part View (Placeholder)
struct AddPartView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Part Information") {
                    TextField("Part Number", text: .constant(""))
                    TextField("Part Name", text: .constant(""))
                    Picker("Category", selection: .constant(PartCategory.filters)) {
                        ForEach(PartCategory.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category)
                        }
                    }
                }

                Section("Inventory") {
                    TextField("Quantity on Hand", text: .constant(""))
                        .keyboardType(.numberPad)
                    TextField("Reorder Point", text: .constant(""))
                        .keyboardType(.numberPad)
                    TextField("Reorder Quantity", text: .constant(""))
                        .keyboardType(.numberPad)
                }

                Section("Pricing") {
                    TextField("Unit Price", text: .constant(""))
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add Part")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PartsInventoryView()
    }
}
