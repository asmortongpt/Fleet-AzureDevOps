import SwiftUI

struct AssetListView: View {
    @StateObject private var viewModel = AssetViewModel()
    @State private var showingAddAsset = false
    @State private var showingFilters = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.assets.isEmpty {
                    ProgressView("Loading assets...")
                } else if viewModel.filteredAssets.isEmpty {
                    emptyStateView
                } else {
                    assetListContent
                }
            }
            .navigationTitle("Assets")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    filterButton
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    addButton
                }
            }
            .searchable(text: $viewModel.searchText, prompt: "Search assets...")
            .sheet(isPresented: $showingAddAsset) {
                AddAssetView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                filterSheet
            }
            .task {
                if viewModel.assets.isEmpty {
                    await viewModel.fetchAssets()
                }
            }
        }
    }

    // MARK: - Asset List Content
    private var assetListContent: some View {
        List {
            // Statistics Section
            Section {
                assetStatisticsView
            }

            // Assets Section
            Section(header: Text("Assets (\(viewModel.filteredAssets.count))")) {
                ForEach(viewModel.filteredAssets) { asset in
                    NavigationLink(destination: AssetDetailView(asset: asset, viewModel: viewModel)) {
                        AssetRowView(asset: asset)
                    }
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Statistics View
    private var assetStatisticsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                StatCard(
                    title: "Total",
                    value: "\(viewModel.getAssetCount())",
                    icon: "cube.fill",
                    color: .blue
                )

                StatCard(
                    title: "Available",
                    value: "\(viewModel.getAvailableCount())",
                    icon: "checkmark.circle.fill",
                    color: .green
                )

                StatCard(
                    title: "In Use",
                    value: "\(viewModel.getInUseCount())",
                    icon: "arrow.right.circle.fill",
                    color: .orange
                )

                StatCard(
                    title: "Maintenance",
                    value: "\(viewModel.getMaintenanceCount())",
                    icon: "wrench.and.screwdriver.fill",
                    color: .red
                )

                if viewModel.getTotalValue() > 0 {
                    StatCard(
                        title: "Total Value",
                        value: "$\(String(format: "%.0f", viewModel.getTotalValue()))",
                        icon: "dollarsign.circle.fill",
                        color: .purple
                    )
                }
            }
            .padding(.vertical, 8)
        }
    }

    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "cube.box.fill")
                .font(.system(size: 64))
                .foregroundColor(.gray)

            Text("No Assets Found")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Track your trailers, equipment, tools, and other assets")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button(action: { showingAddAsset = true }) {
                Label("Add Asset", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding(.top, 20)
        }
        .padding()
    }

    // MARK: - Filter Button
    private var filterButton: some View {
        Button(action: { showingFilters = true }) {
            HStack(spacing: 4) {
                Image(systemName: "line.3.horizontal.decrease.circle")
                if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 8, height: 8)
                }
            }
        }
    }

    // MARK: - Add Button
    private var addButton: some View {
        Button(action: { showingAddAsset = true }) {
            Image(systemName: "plus")
        }
    }

    // MARK: - Filter Sheet
    private var filterSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Status")) {
                    Picker("Status", selection: $viewModel.selectedStatus) {
                        Text("All").tag(nil as AssetStatus?)
                        ForEach(AssetStatus.allCases, id: \.self) { status in
                            HStack {
                                Image(systemName: status.icon)
                                Text(status.displayName)
                            }
                            .tag(status as AssetStatus?)
                        }
                    }
                    .pickerStyle(InlinePickerStyle())
                }

                Section(header: Text("Type")) {
                    Picker("Type", selection: $viewModel.selectedType) {
                        Text("All").tag(nil as AssetType?)
                        ForEach(AssetType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.displayName)
                            }
                            .tag(type as AssetType?)
                        }
                    }
                    .pickerStyle(InlinePickerStyle())
                }

                Section(header: Text("Sort By")) {
                    Picker("Sort", selection: $viewModel.sortOption) {
                        ForEach(AssetViewModel.SortOption.allCases, id: \.self) { option in
                            HStack {
                                Image(systemName: option.systemImage)
                                Text(option.rawValue)
                            }
                            .tag(option)
                        }
                    }
                    .pickerStyle(InlinePickerStyle())
                }

                Section {
                    Button(action: {
                        viewModel.clearFilters()
                        showingFilters = false
                    }) {
                        HStack {
                            Spacer()
                            Text("Clear All Filters")
                                .foregroundColor(.red)
                            Spacer()
                        }
                    }
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
}

// MARK: - Asset Row View
struct AssetRowView: View {
    let asset: Asset

    var body: some View {
        HStack(spacing: 12) {
            // Asset Icon
            ZStack {
                Circle()
                    .fill(Color(asset.statusColor).opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: asset.type.icon)
                    .font(.system(size: 24))
                    .foregroundColor(Color(asset.statusColor))
            }

            // Asset Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(asset.number)
                        .font(.headline)
                    Spacer()
                    if asset.isInspectionDue {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                            .font(.caption)
                    }
                }

                Text(asset.name)
                    .font(.subheadline)
                    .foregroundColor(.primary)

                HStack {
                    // Status Badge
                    HStack(spacing: 4) {
                        Image(systemName: asset.status.icon)
                            .font(.caption2)
                        Text(asset.status.displayName)
                            .font(.caption)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(asset.statusColor).opacity(0.2))
                    .foregroundColor(Color(asset.statusColor))
                    .cornerRadius(8)

                    // Type Badge
                    HStack(spacing: 4) {
                        Image(systemName: asset.type.icon)
                            .font(.caption2)
                        Text(asset.type.displayName)
                            .font(.caption)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.gray.opacity(0.2))
                    .foregroundColor(.secondary)
                    .cornerRadius(8)
                }

                // Location or Assignment
                if let assignment = asset.assignedTo {
                    Text(assignment.displayText)
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text(asset.location.displayText)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
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
                    .font(.title3)
                    .foregroundColor(color)
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
        .frame(width: 120, height: 100)
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

#Preview {
    AssetListView()
}
