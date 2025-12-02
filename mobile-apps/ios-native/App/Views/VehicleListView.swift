import SwiftUI

// MARK: - Modern Vehicle List View with iOS 17+ Features
struct VehicleListView: View {
    @StateObject private var viewModel = VehicleViewModel()
    @State private var showFilters = false
    @State private var selectedVehicleId: String?
    @State private var showingDetail = false
    @State private var authToken: String? = nil
    @State private var searchText = ""
    @State private var searchSuggestions: [String] = []
    @Namespace private var animation
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            // Main Content
            VStack(spacing: 0) {
                // Active Filters Display with Modern Design
                if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                    ModernActiveFiltersView(viewModel: viewModel)
                        .padding(.horizontal, ModernTheme.Spacing.lg)
                        .padding(.top, ModernTheme.Spacing.sm)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                // Modern Statistics Bar
                ModernVehicleStatsBar(viewModel: viewModel)
                    .padding(.vertical, ModernTheme.Spacing.sm)

                // Modern Vehicle List with .insetGrouped style
                if viewModel.isLoading && viewModel.vehicles.isEmpty {
                    LoadingSpinnerView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredVehicles.isEmpty {
                    ModernEmptyVehicleState(searchText: searchText)
                } else {
                    List {
                        ForEach(viewModel.filteredVehicles) { vehicle in
                            ModernVehicleRow(vehicle: vehicle)
                                .listRowInsets(EdgeInsets(
                                    top: ModernTheme.Spacing.sm,
                                    leading: ModernTheme.Spacing.lg,
                                    bottom: ModernTheme.Spacing.sm,
                                    trailing: ModernTheme.Spacing.lg
                                ))
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        ModernTheme.Haptics.warning()
                                        // Delete action
                                    } label: {
                                        Label("Delete", systemImage: "trash.fill")
                                    }

                                    Button {
                                        ModernTheme.Haptics.light()
                                        // Edit action
                                    } label: {
                                        Label("Edit", systemImage: "pencil")
                                    }
                                    .tint(ModernTheme.Colors.primary)
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        ModernTheme.Haptics.selection()
                                        // Favorite action
                                    } label: {
                                        Label("Favorite", systemImage: "star.fill")
                                    }
                                    .tint(ModernTheme.Colors.warning)
                                }
                                .contextMenu {
                                    ModernVehicleContextMenu(vehicle: vehicle)
                                } preview: {
                                    ModernVehiclePreview(vehicle: vehicle)
                                }
                                .onTapGesture {
                                    ModernTheme.Haptics.light()
                                    selectedVehicleId = vehicle.id
                                    showingDetail = true
                                }
                                .animatedAppearance(delay: Double(viewModel.filteredVehicles.firstIndex(of: vehicle) ?? 0) * 0.05)
                        }
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                    .background(ModernTheme.Colors.groupedBackground)
                    .refreshable {
                        ModernTheme.Haptics.light()
                        await viewModel.refresh(token: authToken)
                    }
                }
            }

            // Modern Error Banner
            if let errorMessage = viewModel.errorMessage {
                VStack {
                    Spacer()
                    ModernErrorBanner(message: errorMessage) {
                        ModernTheme.Haptics.light()
                        viewModel.errorMessage = nil
                    }
                    .padding(ModernTheme.Spacing.lg)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
        .navigationTitle("Fleet Vehicles")
        .navigationBarTitleDisplayMode(.large)
        .searchable(
            text: $searchText,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Search vehicles..."
        ) {
            ForEach(searchSuggestions, id: \.self) { suggestion in
                Text(suggestion)
                    .searchCompletion(suggestion)
            }
        }
        .onChange(of: searchText) { newValue in
            viewModel.searchText = newValue
            updateSearchSuggestions()
        }
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarLeading) {
                Button {
                    ModernTheme.Haptics.selection()
                    showFilters.toggle()
                } label: {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .symbolRenderingMode(.hierarchical)
                        if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                            Circle()
                                .fill(ModernTheme.Colors.primary)
                                .frame(width: 8, height: 8)
                        }
                    }
                }
                .accessibleButton(
                    label: "Filters",
                    hint: AccessibilityHints.filterButton
                )
            }

            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Menu {
                    ForEach(VehicleViewModel.SortOption.allCases, id: \.self) { option in
                        Button {
                            ModernTheme.Haptics.selection()
                            viewModel.sortOption = option
                        } label: {
                            Label(option.rawValue, systemImage: option.systemImage)
                            if viewModel.sortOption == option {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                } label: {
                    Image(systemName: "arrow.up.arrow.down.circle")
                        .symbolRenderingMode(.hierarchical)
                }
                .accessibleButton(
                    label: "Sort options",
                    hint: AccessibilityHints.sortButton
                )

                Button {
                    ModernTheme.Haptics.medium()
                    // Add vehicle action
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
                .accessibleButton(
                    label: "Add Vehicle",
                    hint: "Double tap to add a new vehicle"
                )
            }
        }
        .sheet(isPresented: $showFilters) {
            ModernFilterView(viewModel: viewModel)
        }
        .sheet(isPresented: $showingDetail) {
            if let vehicleId = selectedVehicleId,
               let vehicle = viewModel.vehicles.first(where: { $0.id == vehicleId }) {
                NavigationView {
                    VehicleDetailView(vehicle: vehicle)
                }
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
            }
        }
        .task {
            if viewModel.vehicles.isEmpty {
                await viewModel.fetchVehicles(token: authToken)
            }
        }
    }

    // MARK: - Search Suggestions
    private func updateSearchSuggestions() {
        if searchText.isEmpty {
            searchSuggestions = []
        } else {
            // Generate suggestions based on vehicle data
            searchSuggestions = viewModel.vehicles
                .filter { $0.make.localizedCaseInsensitiveContains(searchText) ||
                         $0.model.localizedCaseInsensitiveContains(searchText) }
                .map { "\($0.make) \($0.model)" }
                .prefix(5)
                .map { String($0) }
        }
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)

            TextField("Search vehicles...", text: $text)
                .textFieldStyle(PlainTextFieldStyle())

            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(10)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Active Filters View
struct ActiveFiltersView: View {
    @ObservedObject var viewModel: VehicleViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if let status = viewModel.selectedStatus {
                    FilterChip(title: status.displayName, icon: "circle.fill") {
                        viewModel.selectedStatus = nil
                    }
                }

                if let type = viewModel.selectedType {
                    FilterChip(title: type.displayName, icon: type.icon) {
                        viewModel.selectedType = nil
                    }
                }

                if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                    Button(action: {
                        viewModel.clearFilters()
                    }) {
                        Text("Clear All")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(16)
                    }
                }
            }
        }
    }
}

// MARK: - Filter Chip
struct VehicleFilterChip: View {
    let title: String
    let icon: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.caption2)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.blue.opacity(0.15))
        .foregroundColor(.blue)
        .cornerRadius(16)
    }
}

// MARK: - Vehicle Stats Bar
struct VehicleStatsBar: View {
    @ObservedObject var viewModel: VehicleViewModel

    var body: some View {
        HStack(spacing: 0) {
            StatItem(
                value: "\(viewModel.getVehicleCount())",
                label: "Total",
                color: .blue
            )

            Divider()
                .frame(height: 30)

            StatItem(
                value: "\(viewModel.getActiveVehiclesCount())",
                label: "Active",
                color: .green
            )

            Divider()
                .frame(height: 30)

            StatItem(
                value: String(format: "%.0f", viewModel.getAverageMileage()),
                label: "Avg Miles",
                color: .orange
            )

            Divider()
                .frame(height: 30)

            StatItem(
                value: "\(Int(viewModel.getAverageFuelLevel() * 100))%",
                label: "Avg Fuel",
                color: .purple
            )
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
}

// MARK: - Stat Item
struct StatItem: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Filter View
struct FilterView: View {
    @ObservedObject var viewModel: VehicleViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Status")) {
                    ForEach(VehicleStatus.allCases, id: \.self) { status in
                        Button(action: {
                            if viewModel.selectedStatus == status {
                                viewModel.selectedStatus = nil
                            } else {
                                viewModel.selectedStatus = status
                            }
                        }) {
                            HStack {
                                VehicleStatusBadge(status: status)
                                Spacer()
                                if viewModel.selectedStatus == status {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }

                Section(header: Text("Vehicle Type")) {
                    ForEach(VehicleType.allCases, id: \.self) { type in
                        Button(action: {
                            if viewModel.selectedType == type {
                                viewModel.selectedType = nil
                            } else {
                                viewModel.selectedType = type
                            }
                        }) {
                            HStack {
                                Image(systemName: type.icon)
                                    .foregroundColor(.blue)
                                    .frame(width: 30)
                                Text(type.displayName)
                                Spacer()
                                if viewModel.selectedType == type {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }

                Section {
                    Button(action: {
                        viewModel.clearFilters()
                        dismiss()
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
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading vehicles...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
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
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Error Banner
struct VehicleErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.white)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.white)
                .lineLimit(2)

            Spacer()

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(.white)
            }
        }
        .padding()
        .background(Color.red)
        .cornerRadius(12)
        .shadow(radius: 5)
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleListView_Previews: PreviewProvider {
    static var previews: some View {
        VehicleListView()
    }
}
#endif
