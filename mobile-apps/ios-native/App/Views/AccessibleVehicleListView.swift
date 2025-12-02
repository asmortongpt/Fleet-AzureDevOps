//
//  AccessibleVehicleListView.swift
//  Fleet Manager - Fully Accessible Vehicle List
//
//  Example of implementing comprehensive accessibility in a list view
//  Demonstrates sorting, filtering, search, and dynamic content with full accessibility
//

import SwiftUI

// MARK: - Accessible Vehicle List View

struct AccessibleVehicleListView: View {
    @StateObject private var viewModel = VehicleViewModel()
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    @State private var showFilters = false
    @State private var showSortOptions = false
    @State private var selectedVehicleId: String?
    @State private var showingDetail = false
    @State private var authToken: String? = nil

    @FocusState private var searchFieldFocused: Bool

    var body: some View {
        NavigationView {
            ZStack {
                // Main Content
                VStack(spacing: 0) {
                    // Search Bar
                    AccessibleSearchBar(
                        text: $viewModel.searchText,
                        isFocused: $searchFieldFocused
                    )
                    .padding(.horizontal)
                    .padding(.top, 8)

                    // Active Filters Display
                    if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                        AccessibleActiveFiltersView(viewModel: viewModel)
                            .padding(.horizontal)
                            .padding(.top, 8)
                    }

                    // Statistics Bar
                    AccessibleVehicleStatsBar(viewModel: viewModel)
                        .padding(.vertical, 8)

                    // Vehicle List
                    vehicleListContent
                }

                // Error Message
                if let errorMessage = viewModel.errorMessage {
                    VStack {
                        Spacer()
                        AccessibleErrorBanner(message: errorMessage) {
                            viewModel.errorMessage = nil
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("vehicles.title".localized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    filterButton
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    sortButton
                }
            }
            .sheet(isPresented: $showFilters) {
                AccessibleFilterView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingDetail) {
                if let vehicleId = selectedVehicleId,
                   let vehicle = viewModel.vehicles.first(where: { $0.id == vehicleId }) {
                    NavigationView {
                        VehicleDetailView(vehicle: vehicle)
                    }
                }
            }
            .task {
                if viewModel.vehicles.isEmpty {
                    await viewModel.fetchVehicles(token: authToken)
                }
            }
            .localizedEnvironment()
            .onAppear {
                accessibilityManager.notifyScreenChanged()
                announceScreenContent()
            }
        }
    }

    // MARK: - Vehicle List Content

    @ViewBuilder
    private var vehicleListContent: some View {
        if viewModel.isLoading && viewModel.vehicles.isEmpty {
            AccessibleLoadingView(message: "vehicles.loading".localized)
        } else if viewModel.filteredVehicles.isEmpty {
            AccessibleEmptyStateView(
                icon: "car.fill",
                title: "vehicles.no_vehicles_found".localized,
                message: viewModel.searchText.isEmpty
                    ? "vehicles.no_vehicles_available".localized
                    : "vehicles.no_search_results".localized
            )
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.filteredVehicles) { vehicle in
                        AccessibleVehicleCard(vehicle: vehicle) {
                            selectedVehicleId = vehicle.id
                            showingDetail = true
                            accessibilityManager.announce(
                                "Opening details for vehicle \(vehicle.number)"
                            )
                        }
                    }
                }
                .padding()
            }
            .refreshable {
                await viewModel.refresh(token: authToken)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel("vehicles.title".localized)
            .accessibilityHint("Scroll to browse vehicles")
        }
    }

    // MARK: - Filter Button

    private var filterButton: some View {
        Button(action: {
            showFilters.toggle()
            if showFilters {
                accessibilityManager.announceLocalized("vehicles.filter")
            }
        }) {
            HStack(spacing: 4) {
                Image(systemName: "line.3.horizontal.decrease.circle")
                    .font(.system(size: accessibilityManager.scaledFontSize(20)))

                if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 8, height: 8)
                        .accessibilityLabel("vehicles.filters_active".localized)
                }
            }
        }
        .accessibilityLabel("vehicles.filter".localized)
        .accessibilityHint(
            viewModel.selectedStatus != nil || viewModel.selectedType != nil
                ? "accessibility.hint.tap_to_open".localized + ". " + "vehicles.filters_active".localized
                : "accessibility.hint.tap_to_open".localized
        )
        .accessibilityAddTraits(.isButton)
        .accessibleTouchTarget()
    }

    // MARK: - Sort Button

    private var sortButton: some View {
        Menu {
            ForEach(VehicleViewModel.SortOption.allCases, id: \.self) { option in
                Button(action: {
                    viewModel.sortOption = option
                    accessibilityManager.announce(
                        "Sorted by \(option.rawValue)",
                        priority: .default
                    )
                }) {
                    Label {
                        Text(option.rawValue)
                        if viewModel.sortOption == option {
                            Image(systemName: "checkmark")
                                .accessibilityLabel("accessibility.value.selected".localized)
                        }
                    } icon: {
                        Image(systemName: option.systemImage)
                            .accessibilityHidden(true)
                    }
                }
            }
        } label: {
            Image(systemName: "arrow.up.arrow.down.circle")
                .font(.system(size: accessibilityManager.scaledFontSize(20)))
        }
        .accessibilityLabel("vehicles.sort".localized)
        .accessibilityHint("accessibility.hint.tap_to_open".localized)
        .accessibilityValue("Sorted by \(viewModel.sortOption.rawValue)")
        .accessibilityAddTraits(.isButton)
        .accessibleTouchTarget()
    }

    // MARK: - Announce Screen Content

    private func announceScreenContent() {
        let count = viewModel.filteredVehicles.count
        let announcement = localizationManager.pluralString(
            forKey: "vehicles.count",
            count: count
        )
        accessibilityManager.announce(announcement)
    }
}

// MARK: - Accessible Search Bar

struct AccessibleSearchBar: View {
    @Binding var text: String
    var isFocused: FocusState<Bool>.Binding

    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
                .font(.system(size: accessibilityManager.scaledFontSize(16)))
                .accessibilityHidden(true)

            TextField("vehicles.search_placeholder".localized, text: $text)
                .textFieldStyle(PlainTextFieldStyle())
                .focused(isFocused)
                .accessibilityLabel("accessibility.search".localized)
                .accessibilityHint("accessibility.hint.tap_to_edit".localized)
                .accessibilityValue(text.isEmpty ? "" : text)

            if !text.isEmpty {
                Button(action: {
                    text = ""
                    accessibilityManager.announce("Search cleared")
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                        .font(.system(size: accessibilityManager.scaledFontSize(16)))
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Clear search")
                .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                .accessibilityAddTraits(.isButton)
            }
        }
        .padding(10)
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .accessibilityElement(children: .contain)
    }
}

// MARK: - Accessible Active Filters View

struct AccessibleActiveFiltersView: View {
    @ObservedObject var viewModel: VehicleViewModel
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if let status = viewModel.selectedStatus {
                    AccessibleFilterChip(
                        title: status.displayName,
                        icon: "circle.fill"
                    ) {
                        viewModel.selectedStatus = nil
                        accessibilityManager.announce("Status filter removed")
                    }
                }

                if let type = viewModel.selectedType {
                    AccessibleFilterChip(
                        title: type.displayName,
                        icon: type.icon
                    ) {
                        viewModel.selectedType = nil
                        accessibilityManager.announce("Type filter removed")
                    }
                }

                if viewModel.selectedStatus != nil || viewModel.selectedType != nil {
                    Button(action: {
                        viewModel.clearFilters()
                        accessibilityManager.announceLocalized(
                            "vehicles.clear_filters",
                            priority: .default
                        )
                    }) {
                        Text("vehicles.clear_filters".localized)
                            .font(.system(size: accessibilityManager.scaledFontSize(12)))
                            .foregroundColor(.red)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(16)
                    }
                    .accessibilityLabel("vehicles.clear_filters".localized)
                    .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                    .accessibilityAddTraits(.isButton)
                    .accessibleTouchTarget()
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Active filters")
    }
}

// MARK: - Accessible Filter Chip

struct AccessibleFilterChip: View {
    let title: String
    let icon: String
    let onRemove: () -> Void

    @StateObject private var accessibilityManager = AccessibilityManager.shared

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: accessibilityManager.scaledFontSize(10)))
                .accessibilityHidden(true)

            Text(title)
                .font(.system(size: accessibilityManager.scaledFontSize(12), weight: .medium))

            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.system(size: accessibilityManager.scaledFontSize(10)))
                    .frame(width: 24, height: 24)
            }
            .accessibilityLabel("Remove \(title) filter")
            .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
            .accessibilityAddTraits(.isButton)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.blue.opacity(0.15))
        .foregroundColor(.blue)
        .cornerRadius(16)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(title) filter active")
    }
}

// MARK: - Accessible Vehicle Stats Bar

struct AccessibleVehicleStatsBar: View {
    @ObservedObject var viewModel: VehicleViewModel
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        if accessibilityManager.isAccessibilityCategory {
            // Vertical layout for large text
            VStack(spacing: 12) {
                statItems
            }
            .padding(.vertical)
        } else {
            // Horizontal layout for normal text
            HStack(spacing: 0) {
                statItems
            }
            .padding(.vertical, 8)
        }
    }

    @ViewBuilder
    private var statItems: some View {
        AccessibleStatItem(
            value: "\(viewModel.getVehicleCount())",
            label: "metrics.total".localized,
            color: .blue
        )

        if !accessibilityManager.isAccessibilityCategory {
            Divider()
                .frame(height: 30)
                .accessibilityHidden(true)
        }

        AccessibleStatItem(
            value: "\(viewModel.getActiveVehiclesCount())",
            label: "metrics.active".localized,
            color: .green
        )

        if !accessibilityManager.isAccessibilityCategory {
            Divider()
                .frame(height: 30)
                .accessibilityHidden(true)
        }

        AccessibleStatItem(
            value: String(format: "%.0f", viewModel.getAverageMileage()),
            label: "metrics.avg_miles".localized,
            color: .orange
        )

        if !accessibilityManager.isAccessibilityCategory {
            Divider()
                .frame(height: 30)
                .accessibilityHidden(true)
        }

        AccessibleStatItem(
            value: "\(Int(viewModel.getAverageFuelLevel() * 100))%",
            label: "metrics.avg_fuel".localized,
            color: .purple
        )
    }
}

// MARK: - Accessible Stat Item

struct AccessibleStatItem: View {
    let value: String
    let label: String
    let color: Color

    @StateObject private var accessibilityManager = AccessibilityManager.shared

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(
                    size: accessibilityManager.scaledFontSize(17),
                    weight: .bold
                ))
                .foregroundColor(color)

            Text(label)
                .font(.system(size: accessibilityManager.scaledFontSize(11)))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label): \(value)")
    }
}

// MARK: - Accessible Vehicle Card

struct AccessibleVehicleCard: View {
    let vehicle: Vehicle
    let onTap: () -> Void

    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(vehicle.number)
                            .font(.system(
                                size: accessibilityManager.scaledFontSize(18),
                                weight: .bold
                            ))
                            .foregroundColor(.primary)

                        Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                            .font(.system(size: accessibilityManager.scaledFontSize(14)))
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    VehicleStatusBadge(status: vehicle.status)
                }

                // Metrics
                HStack(spacing: 16) {
                    // Fuel level
                    HStack(spacing: 4) {
                        Image(systemName: "fuelpump.fill")
                            .foregroundColor(vehicle.isLowFuel ? .red : .green)
                            .font(.system(size: accessibilityManager.scaledFontSize(14)))
                            .accessibilityHidden(true)

                        Text("\(vehicle.fuelLevelPercentage)%")
                            .font(.system(size: accessibilityManager.scaledFontSize(14)))
                            .foregroundColor(vehicle.isLowFuel ? .red : .green)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Fuel level: \(vehicle.fuelLevelPercentage) percent")

                    // Mileage
                    HStack(spacing: 4) {
                        Image(systemName: "speedometer")
                            .foregroundColor(.blue)
                            .font(.system(size: accessibilityManager.scaledFontSize(14)))
                            .accessibilityHidden(true)

                        Text(String(format: "%.0f mi", vehicle.mileage))
                            .font(.system(size: accessibilityManager.scaledFontSize(14)))
                            .foregroundColor(.secondary)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Mileage: \(Int(vehicle.mileage)) miles")
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(
                color: Color.black.opacity(0.1),
                radius: accessibilityManager.isReduceMotionEnabled ? 3 : 5,
                x: 0,
                y: 2
            )
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel(vehicleAccessibilityLabel)
        .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
        .accessibilityAddTraits(.isButton)
        .accessibleTouchTarget(size: CGSize(width: .infinity, height: 80))
    }

    private var vehicleAccessibilityLabel: String {
        var label = "Vehicle \(vehicle.number). "
        label += "\(vehicle.year) \(vehicle.make) \(vehicle.model). "
        label += "Status: \(vehicle.status.displayName). "
        label += "Fuel: \(vehicle.fuelLevelPercentage) percent. "
        label += "Mileage: \(Int(vehicle.mileage)) miles."

        if vehicle.isLowFuel {
            label += " Low fuel warning."
        }

        return label
    }
}

// MARK: - Accessible Loading View

struct AccessibleLoadingView: View {
    let message: String

    @StateObject private var accessibilityManager = AccessibilityManager.shared

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .accessibilityHidden(true)

            Text(message)
                .font(.system(size: accessibilityManager.scaledFontSize(15)))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(message)
        .onAppear {
            accessibilityManager.announce(message)
        }
    }
}

// MARK: - Accessible Empty State View

struct AccessibleEmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    @StateObject private var accessibilityManager = AccessibilityManager.shared

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: accessibilityManager.scaledFontSize(60)))
                .foregroundColor(.gray)
                .accessibilityHidden(true)

            Text(title)
                .font(.system(
                    size: accessibilityManager.scaledFontSize(20),
                    weight: .semibold
                ))
                .foregroundColor(.primary)

            Text(message)
                .font(.system(size: accessibilityManager.scaledFontSize(15)))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(message)")
        .onAppear {
            accessibilityManager.announce("\(title). \(message)")
        }
    }
}

// MARK: - Accessible Filter View

struct AccessibleFilterView: View {
    @ObservedObject var viewModel: VehicleViewModel
    @Environment(\.dismiss) var dismiss

    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("vehicle.status".localized)
                    .accessibilityHeading(level: 2)) {
                    ForEach(VehicleStatus.allCases, id: \.self) { status in
                        Button(action: {
                            toggleStatus(status)
                        }) {
                            HStack {
                                VehicleStatusBadge(status: status)
                                Spacer()
                                if viewModel.selectedStatus == status {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                        .accessibilityLabel("accessibility.value.selected".localized)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel(status.displayName)
                        .accessibilityValue(
                            viewModel.selectedStatus == status
                                ? "accessibility.value.selected".localized
                                : "accessibility.value.not_selected".localized
                        )
                        .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                        .accessibilityAddTraits(.isButton)
                    }
                }

                Section(header: Text("vehicle.type".localized)
                    .accessibilityHeading(level: 2)) {
                    ForEach(VehicleType.allCases, id: \.self) { type in
                        Button(action: {
                            toggleType(type)
                        }) {
                            HStack {
                                Image(systemName: type.icon)
                                    .foregroundColor(.blue)
                                    .frame(width: 30)
                                    .accessibilityHidden(true)

                                Text(type.displayName)

                                Spacer()

                                if viewModel.selectedType == type {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                        .accessibilityLabel("accessibility.value.selected".localized)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel(type.displayName)
                        .accessibilityValue(
                            viewModel.selectedType == type
                                ? "accessibility.value.selected".localized
                                : "accessibility.value.not_selected".localized
                        )
                        .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                        .accessibilityAddTraits(.isButton)
                    }
                }

                Section {
                    Button(action: {
                        viewModel.clearFilters()
                        accessibilityManager.announceLocalized("vehicles.clear_filters")
                        dismiss()
                    }) {
                        HStack {
                            Spacer()
                            Text("vehicles.clear_filters".localized)
                                .foregroundColor(.red)
                            Spacer()
                        }
                    }
                    .accessibilityLabel("vehicles.clear_filters".localized)
                    .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                    .accessibilityAddTraits(.isButton)
                }
            }
            .navigationTitle("vehicles.filter".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("done".localized) {
                        dismiss()
                    }
                    .accessibilityLabel("done".localized)
                    .accessibilityHint("Close filter screen")
                    .accessibilityAddTraits(.isButton)
                }
            }
            .localizedEnvironment()
            .onAppear {
                accessibilityManager.notifyScreenChanged()
            }
        }
    }

    private func toggleStatus(_ status: VehicleStatus) {
        if viewModel.selectedStatus == status {
            viewModel.selectedStatus = nil
            accessibilityManager.announce("\(status.displayName) filter removed")
        } else {
            viewModel.selectedStatus = status
            accessibilityManager.announce("\(status.displayName) filter applied")
        }
    }

    private func toggleType(_ type: VehicleType) {
        if viewModel.selectedType == type {
            viewModel.selectedType = nil
            accessibilityManager.announce("\(type.displayName) filter removed")
        } else {
            viewModel.selectedType = type
            accessibilityManager.announce("\(type.displayName) filter applied")
        }
    }
}

// MARK: - Preview

struct AccessibleVehicleListView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            AccessibleVehicleListView()
                .previewDisplayName("Default")

            AccessibleVehicleListView()
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")

            AccessibleVehicleListView()
                .environment(\.sizeCategory, .accessibilityExtraExtraExtraLarge)
                .previewDisplayName("AXXXLarge Text")

            AccessibleVehicleListView()
                .environment(\.layoutDirection, .rightToLeft)
                .previewDisplayName("RTL Layout")
        }
    }
}
