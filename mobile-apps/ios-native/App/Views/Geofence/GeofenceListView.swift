//
//  GeofenceListView.swift
//  Fleet Manager - iOS Native App
//
//  Geofence list view with search, filters, and map preview
//  Follows ModernTheme design patterns and accessibility standards
//

import SwiftUI
import MapKit

// MARK: - Geofence List View
struct GeofenceListView: View {
    @StateObject private var viewModel = GeofenceViewModel()
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator

    @State private var showFilters = false
    @State private var showingAddGeofence = false
    @State private var selectedGeofence: Geofence?
    @Namespace private var animation
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            // Main Content
            VStack(spacing: 0) {
                // Active Filters Display
                if viewModel.filterByType != nil || viewModel.showActiveOnly {
                    ModernGeofenceActiveFiltersView(viewModel: viewModel)
                        .padding(.horizontal, ModernTheme.Spacing.lg)
                        .padding(.top, ModernTheme.Spacing.sm)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                // Statistics Bar
                if let statistics = viewModel.statistics {
                    ModernGeofenceStatsBar(statistics: statistics)
                        .padding(.vertical, ModernTheme.Spacing.sm)
                }

                // Geofence List
                if viewModel.isLoading && viewModel.geofences.isEmpty {
                    LoadingSpinnerView(message: "Loading geofences...")
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredGeofences.isEmpty {
                    ModernEmptyGeofenceState(searchText: viewModel.searchText)
                } else {
                    List {
                        ForEach(viewModel.filteredGeofences) { geofence in
                            ModernGeofenceRow(geofence: geofence)
                                .listRowInsets(EdgeInsets(
                                    top: ModernTheme.Spacing.sm,
                                    leading: ModernTheme.Spacing.lg,
                                    bottom: ModernTheme.Spacing.sm,
                                    trailing: ModernTheme.Spacing.lg
                                ))
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        ModernTheme.Haptics.warning()
                                        deleteGeofence(geofence)
                                    } label: {
                                        Label("Delete", systemImage: "trash.fill")
                                    }

                                    Button {
                                        ModernTheme.Haptics.light()
                                        selectedGeofence = geofence
                                    } label: {
                                        Label("Edit", systemImage: "pencil")
                                    }
                                    .tint(ModernTheme.Colors.primary)
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        ModernTheme.Haptics.selection()
                                        toggleGeofenceActive(geofence)
                                    } label: {
                                        Label(
                                            geofence.isActive ? "Deactivate" : "Activate",
                                            systemImage: geofence.isActive ? "pause.fill" : "play.fill"
                                        )
                                    }
                                    .tint(geofence.isActive ? ModernTheme.Colors.warning : ModernTheme.Colors.success)
                                }
                                .contextMenu {
                                    ModernGeofenceContextMenu(geofence: geofence, viewModel: viewModel)
                                }
                                .onTapGesture {
                                    ModernTheme.Haptics.light()
                                    navigationCoordinator.navigate(to: .geofenceDetail(id: geofence.id))
                                }
                                .animatedAppearance(delay: Double(viewModel.filteredGeofences.firstIndex(of: geofence) ?? 0) * 0.05)
                        }
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                    .background(ModernTheme.Colors.groupedBackground)
                    .refreshable {
                        ModernTheme.Haptics.light()
                        await viewModel.refresh()
                    }
                }
            }

            // Error Banner
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
        .navigationTitle("Geofences")
        .navigationBarTitleDisplayMode(.large)
        .searchable(
            text: $viewModel.searchText,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Search geofences..."
        )
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarLeading) {
                Button {
                    ModernTheme.Haptics.selection()
                    showFilters.toggle()
                } label: {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .symbolRenderingMode(.hierarchical)
                        if viewModel.filterByType != nil {
                            Circle()
                                .fill(ModernTheme.Colors.primary)
                                .frame(width: 8, height: 8)
                        }
                    }
                }
                .accessibilityLabel("Filters")
                .accessibilityHint("Double tap to show filter options")
            }

            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button {
                    ModernTheme.Haptics.medium()
                    showingAddGeofence = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
                .accessibilityLabel("Add Geofence")
                .accessibilityHint("Double tap to add a new geofence")
            }
        }
        .sheet(isPresented: $showFilters) {
            ModernGeofenceFilterView(viewModel: viewModel)
        }
        .sheet(isPresented: $showingAddGeofence) {
            NavigationView {
                AddGeofenceView(viewModel: viewModel)
            }
        }
        .sheet(item: $selectedGeofence) { geofence in
            NavigationView {
                AddGeofenceView(viewModel: viewModel, existingGeofence: geofence)
            }
        }
        .task {
            if viewModel.geofences.isEmpty {
                await viewModel.loadGeofences()
            }
        }
    }

    // MARK: - Helper Methods
    private func deleteGeofence(_ geofence: Geofence) {
        Task {
            await viewModel.deleteGeofence(geofence)
        }
    }

    private func toggleGeofenceActive(_ geofence: Geofence) {
        Task {
            await viewModel.toggleGeofenceActive(geofence)
        }
    }
}

// MARK: - Modern Geofence Row
struct ModernGeofenceRow: View {
    let geofence: Geofence

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Type Icon
            ZStack {
                Circle()
                    .fill(geofence.color.opacity(0.15))
                    .frame(width: 56, height: 56)

                Image(systemName: geofence.icon)
                    .font(.title3)
                    .foregroundColor(geofence.color)
            }

            // Geofence Info
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                HStack {
                    Text(geofence.name)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Spacer()

                    GeofenceStatusBadge(isActive: geofence.isActive)
                }

                if let description = geofence.description {
                    Text(description)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .lineLimit(1)
                }

                HStack(spacing: ModernTheme.Spacing.sm) {
                    // Type
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "tag.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.info)
                        Text(geofence.type.rawValue)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    // Shape info
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "circle.circle")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.info)
                        switch geofence.shape {
                        case .circle(let circle):
                            Text(circle.formattedRadius)
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                        case .polygon(let polygon):
                            Text("\(polygon.coordinates.count) points")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                        }
                    }
                }

                // Vehicle count
                if !geofence.assignedVehicles.isEmpty {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "car.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.primary)
                        Text("\(geofence.assignedVehicles.count) vehicle\(geofence.assignedVehicles.count == 1 ? "" : "s")")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                    }
                }

                // Alert settings
                if geofence.notifications.onEntry || geofence.notifications.onExit {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "bell.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.warning)
                        var alertTypes: [String] = []
                        if geofence.notifications.onEntry { alertTypes.append("Entry") }
                        if geofence.notifications.onExit { alertTypes.append("Exit") }
                        Text(alertTypes.joined(separator: ", ") + " alerts")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
        .padding(.vertical, ModernTheme.Spacing.xs)
    }
}

// MARK: - Geofence Status Badge
struct GeofenceStatusBadge: View {
    let isActive: Bool

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xxs) {
            Circle()
                .fill(isActive ? ModernTheme.Colors.success : ModernTheme.Colors.idle)
                .frame(width: 8, height: 8)
            Text(isActive ? "Active" : "Inactive")
                .font(ModernTheme.Typography.caption2)
        }
        .padding(.horizontal, ModernTheme.Spacing.sm)
        .padding(.vertical, ModernTheme.Spacing.xxs)
        .background((isActive ? ModernTheme.Colors.success : ModernTheme.Colors.idle).opacity(0.15))
        .foregroundColor(isActive ? ModernTheme.Colors.success : ModernTheme.Colors.idle)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Active Filters View
struct ModernGeofenceActiveFiltersView: View {
    @ObservedObject var viewModel: GeofenceViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                if let filterType = viewModel.filterByType {
                    FilterChipView(
                        title: filterType.rawValue,
                        icon: filterType.icon
                    ) {
                        viewModel.filterByType = nil
                    }
                }

                if !viewModel.showActiveOnly {
                    FilterChipView(
                        title: "Show All",
                        icon: "eye.fill"
                    ) {
                        viewModel.showActiveOnly = true
                    }
                }

                if viewModel.filterByType != nil || !viewModel.showActiveOnly {
                    Button(action: {
                        viewModel.filterByType = nil
                        viewModel.showActiveOnly = true
                    }) {
                        Text("Clear All")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.error)
                            .padding(.horizontal, ModernTheme.Spacing.md)
                            .padding(.vertical, ModernTheme.Spacing.xs)
                            .background(ModernTheme.Colors.error.opacity(0.1))
                            .cornerRadius(ModernTheme.CornerRadius.sm)
                    }
                }
            }
        }
    }
}

// MARK: - Statistics Bar
struct ModernGeofenceStatsBar: View {
    let statistics: GeofenceStatistics

    var body: some View {
        HStack(spacing: 0) {
            StatItemView(
                value: "\(statistics.totalGeofences)",
                label: "Total",
                color: ModernTheme.Colors.primary
            )

            Divider().frame(height: 30)

            StatItemView(
                value: "\(statistics.activeGeofences)",
                label: "Active",
                color: ModernTheme.Colors.success
            )

            Divider().frame(height: 30)

            StatItemView(
                value: "\(statistics.totalViolations)",
                label: "Violations",
                color: ModernTheme.Colors.warning
            )

            Divider().frame(height: 30)

            StatItemView(
                value: "\(statistics.unacknowledgedViolations)",
                label: "Unack.",
                color: ModernTheme.Colors.error
            )
        }
        .padding(.horizontal)
        .padding(.vertical, ModernTheme.Spacing.sm)
        .background(Color(.systemGray6))
    }
}

// MARK: - Filter View
struct ModernGeofenceFilterView: View {
    @ObservedObject var viewModel: GeofenceViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Filter By Type")) {
                    ForEach(GeofenceType.allCases, id: \.self) { type in
                        Button(action: {
                            viewModel.filterByType = (viewModel.filterByType == type) ? nil : type
                        }) {
                            HStack {
                                Image(systemName: type.icon)
                                    .foregroundColor(type.color)
                                    .frame(width: 30)
                                Text(type.rawValue)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                                Spacer()
                                if viewModel.filterByType == type {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }

                Section(header: Text("Status")) {
                    Toggle("Show Active Only", isOn: $viewModel.showActiveOnly)
                }

                Section {
                    Button(action: {
                        viewModel.filterByType = nil
                        viewModel.showActiveOnly = true
                        dismiss()
                    }) {
                        HStack {
                            Spacer()
                            Text("Reset Filters")
                                .foregroundColor(ModernTheme.Colors.error)
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

// MARK: - Empty State
struct ModernEmptyGeofenceState: View {
    let searchText: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "mappin.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(searchText.isEmpty ? "No Geofences" : "No Results")
                .font(ModernTheme.Typography.title2)

            Text(searchText.isEmpty ?
                 "Add your first geofence to monitor vehicle locations." :
                 "No geofences match your search criteria.")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Context Menu
struct ModernGeofenceContextMenu: View {
    let geofence: Geofence
    let viewModel: GeofenceViewModel

    var body: some View {
        Button(action: {
            Task {
                await viewModel.toggleGeofenceActive(geofence)
            }
        }) {
            Label(
                geofence.isActive ? "Deactivate" : "Activate",
                systemImage: geofence.isActive ? "pause.fill" : "play.fill"
            )
        }

        Divider()

        Button(action: {
            viewModel.centerMapOn(geofence: geofence)
        }) {
            Label("Show on Map", systemImage: "map.fill")
        }

        Button(action: {}) {
            Label("View Vehicles", systemImage: "car.2.fill")
        }

        Button(action: {}) {
            Label("View Events", systemImage: "clock.arrow.circlepath")
        }

        Divider()

        Button(role: .destructive, action: {
            Task {
                await viewModel.deleteGeofence(geofence)
            }
        }) {
            Label("Delete", systemImage: "trash.fill")
        }
    }
}

// MARK: - Loading Spinner
struct LoadingSpinnerView: View {
    let message: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            ProgressView()
            Text(message)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }
}

// MARK: - Error Banner
struct ModernErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.white)

            Text(message)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(.white)
                .lineLimit(2)

            Spacer()

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(.white)
            }
        }
        .padding()
        .background(ModernTheme.Colors.error)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(radius: 5)
    }
}

// MARK: - Preview
#if DEBUG
struct GeofenceListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GeofenceListView()
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif
