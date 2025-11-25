//
//  VendorListView.swift
//  Fleet Manager
//
//  Vendor list with search, filters, and performance metrics
//

import SwiftUI

struct VendorListView: View {
    @StateObject private var viewModel = VendorViewModel()
    @State private var showingAddVendor = false

    var body: some View {
        ZStack {
            if viewModel.loadingState.isLoading && viewModel.vendors.isEmpty {
                ProgressView("Loading vendors...")
            } else if viewModel.filteredVendors.isEmpty {
                emptyStateView
            } else {
                vendorListContent
            }
        }
        .navigationTitle("Vendors")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $viewModel.searchText, prompt: "Search vendors")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddVendor = true }) {
                    Image(systemName: "plus.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .sheet(isPresented: $showingAddVendor) {
            AddVendorView()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.fetchVendors()
        }
    }

    // MARK: - Vendor List Content
    private var vendorListContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Filters
                filtersSection

                // Summary Cards
                summaryCardsSection

                // Vendor List
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.filteredVendors) { vendor in
                        NavigationLink(destination: VendorDetailView(vendor: vendor)) {
                            VendorCard(vendor: vendor)
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

    // MARK: - Filters Section
    private var filtersSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // Category Filter
                Menu {
                    Button("All Categories") {
                        viewModel.selectCategory(nil)
                    }
                    ForEach(VendorCategory.allCases, id: \.self) { category in
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

                // Status Filter
                Menu {
                    Button("All Statuses") {
                        viewModel.selectStatus(nil)
                    }
                    ForEach(VendorStatus.allCases, id: \.self) { status in
                        Button(status.rawValue) {
                            viewModel.selectStatus(status)
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "checkmark.circle")
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
                    title: "Total Vendors",
                    value: "\(viewModel.vendors.count)",
                    icon: "building.2.fill",
                    color: .blue
                )

                SummaryCard(
                    title: "Active",
                    value: "\(viewModel.vendors.filter { $0.status == .active }.count)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )

                SummaryCard(
                    title: "Total Spend",
                    value: String(format: "$%.0fK", viewModel.vendors.reduce(0) { $0 + $1.totalSpend } / 1000),
                    icon: "dollarsign.circle.fill",
                    color: .purple
                )

                SummaryCard(
                    title: "Orders",
                    value: "\(viewModel.vendors.reduce(0) { $0 + $1.orderCount })",
                    icon: "shippingbox.fill",
                    color: .orange
                )
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "building.2")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Vendors Found")
                .font(.title2.bold())

            Text("Add your first vendor to start managing procurement")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingAddVendor = true }) {
                Label("Add Vendor", systemImage: "plus.circle.fill")
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

// MARK: - Vendor Card
struct VendorCard: View {
    let vendor: Vendor

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vendor.name)
                        .font(.headline)
                        .foregroundColor(.primary)

                    HStack(spacing: 4) {
                        Image(systemName: vendor.category.icon)
                            .font(.caption)
                        Text(vendor.category.rawValue)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 2) {
                        ForEach(0..<5) { index in
                            Image(systemName: index < vendor.ratingStars ? "star.fill" : "star")
                                .font(.caption)
                                .foregroundColor(index < vendor.ratingStars ? .yellow : .gray)
                        }
                    }

                    Text(vendor.status.rawValue)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color(vendor.statusColor).opacity(0.2))
                        .foregroundColor(Color(vendor.statusColor))
                        .cornerRadius(8)
                }
            }

            Divider()

            // Metrics
            HStack(spacing: 20) {
                MetricView(
                    icon: "dollarsign.circle.fill",
                    label: "Total Spend",
                    value: vendor.formattedTotalSpend,
                    color: .green
                )

                MetricView(
                    icon: "shippingbox.fill",
                    label: "Orders",
                    value: "\(vendor.orderCount)",
                    color: .blue
                )

                MetricView(
                    icon: "calendar",
                    label: "Terms",
                    value: "Net \(vendor.paymentTerms.netDays)",
                    color: .purple
                )
            }

            // Contact
            HStack(spacing: 16) {
                Label(vendor.contactName, systemImage: "person.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label(vendor.phone, systemImage: "phone.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
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
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2.bold())
                .foregroundColor(.primary)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 140, height: 100)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Metric View
struct MetricView: View {
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

// MARK: - Add Vendor View (Placeholder)
struct AddVendorView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Vendor Information") {
                    TextField("Vendor Name", text: .constant(""))
                    Picker("Category", selection: .constant(VendorCategory.parts)) {
                        ForEach(VendorCategory.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category)
                        }
                    }
                }

                Section("Contact") {
                    TextField("Contact Name", text: .constant(""))
                    TextField("Email", text: .constant(""))
                    TextField("Phone", text: .constant(""))
                }
            }
            .navigationTitle("Add Vendor")
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
        VendorListView()
    }
}
