//
//  FleetMapView.swift
//  Fleet Manager
//
//  Full-featured map view with real-time GPS tracking, filtering, and clustering
//

import SwiftUI
import MapKit

struct FleetMapView: View {
    @StateObject private var viewModel = FleetMapViewModel()
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @State private var selectedVehicle: Vehicle?
    @State private var showVehicleDetail = false

    var body: some View {
        ZStack {
            // Map Layer
            Map(coordinateRegion: $viewModel.mapRegion, annotationItems: viewModel.filteredVehicles) { vehicle in
                MapAnnotation(coordinate: CLLocationCoordinate2D(
                    latitude: vehicle.location.lat,
                    longitude: vehicle.location.lng
                )) {
                    VehicleMapPin(vehicle: vehicle)
                        .onTapGesture {
                            selectedVehicle = vehicle
                            viewModel.selectedVehicle = vehicle
                            showVehicleDetail = true
                            ModernTheme.Haptics.light()
                        }
                }
            }
            .ignoresSafeArea()

            // Top Controls
            VStack {
                topControlBar
                Spacer()
            }

            // Side Controls
            HStack {
                Spacer()
                VStack(spacing: ModernTheme.Spacing.md) {
                    Spacer()
                    sideControlButtons
                }
                .padding(.trailing, ModernTheme.Spacing.lg)
                .padding(.bottom, ModernTheme.Spacing.xxxl)
            }

            // Bottom Detail Card
            if showVehicleDetail, let vehicle = selectedVehicle {
                VStack {
                    Spacer()
                    VehicleMapDetailCard(vehicle: vehicle) {
                        navigationCoordinator.navigate(to: .vehicleDetail(id: vehicle.id))
                        ModernTheme.Haptics.medium()
                    } onClose: {
                        withAnimation {
                            showVehicleDetail = false
                            selectedVehicle = nil
                        }
                        ModernTheme.Haptics.light()
                    }
                    .padding(ModernTheme.Spacing.lg)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }

            // Legend Overlay
            if viewModel.showLegend {
                VStack {
                    HStack {
                        MapLegendView(viewModel: viewModel)
                            .padding(ModernTheme.Spacing.lg)
                        Spacer()
                    }
                    Spacer()
                }
                .transition(.move(edge: .leading).combined(with: .opacity))
            }

            // Loading Overlay
            if viewModel.isLoading {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                ProgressView("Loading vehicles...")
                    .padding()
                    .background(ModernTheme.Colors.background)
                    .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .navigationTitle("Fleet Map")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                toolbarButtons
            }
        }
        .searchable(text: $viewModel.searchText, prompt: "Search vehicles...")
        .task {
            await viewModel.fetchVehicles()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) { }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
        .sheet(isPresented: $viewModel.showFilterSheet) {
            FilterSheetView(viewModel: viewModel)
        }
    }

    // MARK: - Top Control Bar
    private var topControlBar: some View {
        HStack(spacing: ModernTheme.Spacing.sm) {
            // Active count badge
            StatusBadge(
                title: "Active",
                count: viewModel.activeCount,
                color: ModernTheme.Colors.active,
                isSelected: viewModel.selectedStatusFilter == .active
            ) {
                if viewModel.selectedStatusFilter == .active {
                    viewModel.applyStatusFilter(nil)
                } else {
                    viewModel.applyStatusFilter(.active)
                }
            }

            // Idle count badge
            StatusBadge(
                title: "Idle",
                count: viewModel.idleCount,
                color: ModernTheme.Colors.idle,
                isSelected: viewModel.selectedStatusFilter == .idle
            ) {
                if viewModel.selectedStatusFilter == .idle {
                    viewModel.applyStatusFilter(nil)
                } else {
                    viewModel.applyStatusFilter(.idle)
                }
            }

            // Offline count badge
            StatusBadge(
                title: "Offline",
                count: viewModel.offlineCount,
                color: ModernTheme.Colors.offline,
                isSelected: viewModel.selectedStatusFilter == .offline
            ) {
                if viewModel.selectedStatusFilter == .offline {
                    viewModel.applyStatusFilter(nil)
                } else {
                    viewModel.applyStatusFilter(.offline)
                }
            }

            Spacer()
        }
        .padding(.horizontal, ModernTheme.Spacing.lg)
        .padding(.top, ModernTheme.Spacing.sm)
    }

    // MARK: - Side Control Buttons
    private var sideControlButtons: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            // Center on all vehicles
            MapControlButton(
                icon: "map.fill",
                color: ModernTheme.Colors.primary
            ) {
                viewModel.centerOnAllVehicles()
            }
            .accessibilityLabel("Center on all vehicles")

            // Center on user location
            MapControlButton(
                icon: "location.fill",
                color: ModernTheme.Colors.info
            ) {
                viewModel.centerOnUserLocation()
            }
            .accessibilityLabel("Center on my location")

            // Refresh
            MapControlButton(
                icon: "arrow.clockwise",
                color: ModernTheme.Colors.success
            ) {
                Task {
                    await viewModel.refresh()
                }
            }
            .accessibilityLabel("Refresh vehicle locations")

            // Toggle Legend
            MapControlButton(
                icon: "info.circle.fill",
                color: viewModel.showLegend ? ModernTheme.Colors.warning : ModernTheme.Colors.secondaryText
            ) {
                withAnimation {
                    viewModel.showLegend.toggle()
                    ModernTheme.Haptics.light()
                }
            }
            .accessibilityLabel("Toggle legend")
        }
    }

    // MARK: - Toolbar Buttons
    private var toolbarButtons: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Filter button
            Button {
                viewModel.showFilterSheet = true
                ModernTheme.Haptics.light()
            } label: {
                Image(systemName: viewModel.selectedStatusFilter != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    .foregroundColor(viewModel.selectedStatusFilter != nil ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
            }
            .accessibilityLabel("Filter vehicles")
        }
    }
}

// MARK: - Vehicle Map Pin
struct VehicleMapPin: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 2) {
            ZStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 44, height: 44)
                    .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)

                Image(systemName: vehicle.type.icon)
                    .foregroundColor(.white)
                    .font(.system(size: 20, weight: .semibold))
            }

            Text(vehicle.number)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.primary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.white)
                .cornerRadius(4)
                .shadow(color: .black.opacity(0.2), radius: 2, x: 0, y: 1)
        }
    }

    private var statusColor: Color {
        vehicle.status.themeColor
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let title: String
    let count: Int
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)

                Text(title)
                    .font(.caption.weight(.semibold))

                Text("\(count)")
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(color.opacity(0.2))
                    .cornerRadius(8)
            }
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(isSelected ? color : Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
    }
}

// MARK: - Map Control Button
struct MapControlButton: View {
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: 50, height: 50)
                .background(color)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
        }
    }
}

// MARK: - Vehicle Map Detail Card
struct VehicleMapDetailCard: View {
    let vehicle: Vehicle
    let onViewDetails: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.number)
                        .font(ModernTheme.Typography.title3)

                    Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            // Status
            HStack {
                Image(systemName: vehicle.status.symbolName)
                    .foregroundColor(.white)
                Text(vehicle.status.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(vehicle.status.themeColor)
            .cornerRadius(12)

            Divider()

            // Quick Stats
            HStack(spacing: ModernTheme.Spacing.xl) {
                QuickStat(
                    icon: "fuelpump.fill",
                    label: "Fuel",
                    value: "\(vehicle.fuelLevelPercentage)%",
                    color: vehicle.isLowFuel ? ModernTheme.Colors.warning : ModernTheme.Colors.success
                )

                QuickStat(
                    icon: "speedometer",
                    label: "Mileage",
                    value: String(format: "%.0f mi", vehicle.mileage),
                    color: ModernTheme.Colors.info
                )

                if let driver = vehicle.assignedDriver {
                    QuickStat(
                        icon: "person.fill",
                        label: "Driver",
                        value: driver,
                        color: ModernTheme.Colors.primary
                    )
                }

                Spacer()
            }

            // Location
            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                Text(vehicle.location.address)
                    .font(.caption)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .lineLimit(1)
            }

            // View Details Button
            Button(action: onViewDetails) {
                HStack {
                    Text("View Full Details")
                        .font(ModernTheme.Typography.bodyBold)
                    Image(systemName: "arrow.right")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.md)
                .background(ModernTheme.Colors.primary)
                .foregroundColor(.white)
                .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .padding(ModernTheme.Spacing.lg)
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .shadow(color: .black.opacity(0.2), radius: 12, x: 0, y: 4)
    }
}

// MARK: - Quick Stat
struct QuickStat: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(label)
                    .font(.caption)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundColor(ModernTheme.Colors.primaryText)
                .lineLimit(1)
        }
    }
}

// MARK: - Map Legend View
struct MapLegendView: View {
    @ObservedObject var viewModel: FleetMapViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Vehicle Status")
                    .font(ModernTheme.Typography.headline)
                Spacer()
                Button {
                    withAnimation {
                        viewModel.showLegend = false
                    }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            ForEach(viewModel.statusLegend, id: \.status) { item in
                LegendItem(
                    color: item.color,
                    label: item.status.displayName,
                    count: item.count
                )
            }

            Divider()

            Text("Total: \(viewModel.vehicles.count) vehicles")
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("Showing: \(viewModel.filteredVehicles.count) vehicles")
                .font(.caption.weight(.semibold))
                .foregroundColor(ModernTheme.Colors.primary)
        }
        .padding(ModernTheme.Spacing.lg)
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Legend Item
struct LegendItem: View {
    let color: Color
    let label: String
    let count: Int

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.sm) {
            Circle()
                .fill(color)
                .frame(width: 12, height: 12)

            Text(label)
                .font(.subheadline)

            Spacer()

            Text("\(count)")
                .font(.subheadline.weight(.semibold))
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }
}

// MARK: - Filter Sheet View
struct FilterSheetView: View {
    @ObservedObject var viewModel: FleetMapViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section("Filter by Status") {
                    ForEach(VehicleStatus.allCases, id: \.self) { status in
                        Button {
                            if viewModel.selectedStatusFilter == status {
                                viewModel.applyStatusFilter(nil)
                            } else {
                                viewModel.applyStatusFilter(status)
                            }
                        } label: {
                            HStack {
                                Circle()
                                    .fill(viewModel.getAnnotationColor(for: status))
                                    .frame(width: 20, height: 20)

                                Text(status.displayName)
                                    .foregroundColor(ModernTheme.Colors.primaryText)

                                Spacer()

                                Text("\(viewModel.getVehiclesByStatus(status).count)")
                                    .font(.caption)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(ModernTheme.Colors.secondaryBackground)
                                    .cornerRadius(8)

                                if viewModel.selectedStatusFilter == status {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }

                Section {
                    Button {
                        viewModel.clearFilters()
                        ModernTheme.Haptics.light()
                    } label: {
                        HStack {
                            Image(systemName: "xmark.circle")
                            Text("Clear All Filters")
                        }
                        .foregroundColor(ModernTheme.Colors.error)
                    }
                }
            }
            .navigationTitle("Filter Vehicles")
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

// MARK: - Preview
#if DEBUG
struct FleetMapView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            FleetMapView()
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif
