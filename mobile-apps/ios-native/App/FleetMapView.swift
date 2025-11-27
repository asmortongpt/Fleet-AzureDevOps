//
//  FleetMapView.swift
//  Fleet Manager
//

import SwiftUI
import MapKit

// MARK: - Fleet Map View
struct FleetMapView: View {
    @StateObject private var viewModel = FleetMapViewModel()
    @State private var showFilterSheet = false
    @State private var showVehicleDetail = false

    var body: some View {
        ZStack {
            // Map
            Map(coordinateRegion: $viewModel.mapRegion, annotationItems: viewModel.filteredVehicles) { vehicle in
                MapAnnotation(coordinate: CLLocationCoordinate2D(latitude: vehicle.location.lat, longitude: vehicle.location.lng)) {
                    Button {
                        withAnimation {
                            viewModel.selectedVehicle = vehicle
                        }
                    } label: {
                        Circle()
                            .fill(viewModel.getAnnotationColor(for: vehicle.status))
                            .frame(width: 30, height: 30)
                            .overlay(
                                Image(systemName: vehicle.type.icon)
                                    .font(.caption)
                                    .foregroundColor(.white)
                            )
                            .shadow(radius: 4)
                    }
                }
            }
            .edgesIgnoringSafeArea(.all)

            // Controls overlay
            VStack {
                HStack {
                    Spacer()
                    VStack(spacing: ModernTheme.Spacing.md) {
                        MapControlButton(icon: "line.3.horizontal.decrease.circle", color: ModernTheme.Colors.primary) {
                            showFilterSheet = true
                        }

                        MapControlButton(icon: "info.circle", color: ModernTheme.Colors.info) {
                            withAnimation {
                                viewModel.showLegend.toggle()
                            }
                        }

                        MapControlButton(icon: "location.fill", color: ModernTheme.Colors.success) {
                            viewModel.centerOnAllVehicles()
                        }
                    }
                    .padding()
                }

                Spacer()

                // Selected vehicle card
                if let selectedVehicle = viewModel.selectedVehicle {
                    VehicleMapDetailCard(
                        vehicle: selectedVehicle,
                        onViewDetails: {
                            showVehicleDetail = true
                        },
                        onClose: {
                            withAnimation {
                                viewModel.selectedVehicle = nil
                            }
                        }
                    )
                    .padding()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }

            // Legend overlay
            if viewModel.showLegend {
                VStack {
                    HStack {
                        Spacer()
                        MapLegendView(viewModel: viewModel)
                            .frame(width: 250)
                            .padding()
                    }
                    Spacer()
                }
                .transition(.move(edge: .trailing).combined(with: .opacity))
            }
        }
        .navigationTitle("Fleet Map")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showFilterSheet) {
            FilterSheetView(viewModel: viewModel)
        }
        .sheet(isPresented: $showVehicleDetail) {
            if let vehicle = viewModel.selectedVehicle {
                NavigationView {
                    VehicleDetailView(vehicle: vehicle)
                }
            }
        }
        .task {
            await viewModel.fetchVehicles()
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
