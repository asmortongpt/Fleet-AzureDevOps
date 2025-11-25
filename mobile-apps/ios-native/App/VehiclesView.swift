//
//  VehiclesView.swift
//  Fleet Manager
//
//  Complete Vehicles view with search, filtering, and detailed vehicle cards
//

import SwiftUI

struct VehiclesView: View {
    @StateObject private var viewModel = VehiclesViewModel()
    @State private var showingAddVehicle = false
    @State private var showingFilterMenu = false
    @State private var selectedVehicleForDetail: Vehicle?

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading && viewModel.filteredVehicles.isEmpty {
                    ProgressView("Loading vehicles...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredVehicles.isEmpty && !viewModel.searchText.isEmpty {
                    emptySearchState
                } else if viewModel.filteredVehicles.isEmpty {
                    emptyState
                } else {
                    vehicleList
                }
            }
            .navigationTitle("Vehicles")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search vehicles...")
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    filterButton
                    addButton
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingAddVehicle) {
                AddVehicleView()
            }
            .sheet(item: $selectedVehicleForDetail) { vehicle in
                VehicleDetailView(vehicle: vehicle)
            }
            .sheet(isPresented: $showingFilterMenu) {
                FilterMenuView(viewModel: viewModel)
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Vehicle List
    private var vehicleList: some View {
        ScrollView {
            // Statistics Bar
            statisticsBar

            // Filter Chips
            filterChips

            // Vehicle Cards
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredVehicles) { vehicle in
                    VehicleCard(vehicle: vehicle) {
                        selectedVehicleForDetail = vehicle
                    }
                    .transition(.asymmetric(
                        insertion: .scale.combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 20)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Statistics Bar
    private var statisticsBar: some View {
        HStack(spacing: 16) {
            StatisticPill(
                label: "Active",
                count: viewModel.activeCount,
                color: .green
            )
            StatisticPill(
                label: "Maintenance",
                count: viewModel.maintenanceCount,
                color: .orange
            )
            StatisticPill(
                label: "Offline",
                count: viewModel.offlineCount,
                color: .gray
            )
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    // MARK: - Filter Chips
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(VehiclesViewModel.VehicleFilter.allCases, id: \.self) { filter in
                    FilterChip(
                        title: filter.rawValue,
                        icon: filter.icon,
                        isSelected: viewModel.selectedFilter == filter
                    ) {
                        viewModel.applyFilter(filter)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Toolbar Items
    private var filterButton: some View {
        Button(action: { showingFilterMenu = true }) {
            Image(systemName: "line.3.horizontal.decrease.circle")
        }
    }

    private var addButton: some View {
        Button(action: { showingAddVehicle = true }) {
            Image(systemName: "plus.circle.fill")
        }
    }

    // MARK: - Empty States
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "car.2")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Vehicles")
                .font(.title2.bold())

            Text("Add your first vehicle to get started")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: { showingAddVehicle = true }) {
                Label("Add Vehicle", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptySearchState: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)

            Text("No Results")
                .font(.title2.bold())

            Text("No vehicles match '\(viewModel.searchText)'")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button("Clear Search") {
                viewModel.searchText = ""
            }
            .foregroundColor(.blue)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// VehicleCard and StatusBadge are defined in App/Components/VehicleCard.swift

// MARK: - Statistic Pill
struct StatisticPill: View {
    let label: String
    let count: Int
    let color: Color

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text("\(count)")
                .font(.headline)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(20)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

// MARK: - Filter Menu View
struct FilterMenuView: View {
    @ObservedObject var viewModel: VehiclesViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section("Sort By") {
                    ForEach(VehiclesViewModel.VehicleSortOption.allCases, id: \.self) { option in
                        Button(action: {
                            viewModel.applySortOption(option)
                        }) {
                            HStack {
                                Label(option.rawValue, systemImage: option.icon)
                                Spacer()
                                if viewModel.selectedSortOption == option {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }

                Section("Actions") {
                    Button(action: viewModel.exportVehicleList) {
                        Label("Export List", systemImage: "square.and.arrow.up")
                    }

                    Button(action: viewModel.importVehicles) {
                        Label("Import Vehicles", systemImage: "square.and.arrow.down")
                    }
                }
            }
            .navigationTitle("Filter & Sort")
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

// MARK: - Vehicle Detail View
struct VehicleDetailView: View {
    let vehicle: Vehicle
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: vehicleIcon)
                            .font(.system(size: 60))
                            .foregroundColor(.blue)

                        Text(vehicle.number)
                            .font(.title.bold())

                        Text("\(vehicle.make) \(vehicle.model) • \(vehicle.year)")
                            .font(.headline)
                            .foregroundColor(.secondary)

                        StatusBadge(status: vehicle.status)
                    }
                    .padding()

                    // Details Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        DetailCard(title: "License Plate", value: vehicle.licensePlate, icon: "car.rear")
                        DetailCard(title: "VIN", value: String(vehicle.vin.suffix(6)), icon: "number")
                        DetailCard(title: "Department", value: vehicle.department, icon: "building.2")
                        DetailCard(title: "Region", value: vehicle.region, icon: "map")
                        DetailCard(title: "Fuel Level", value: "\(Int(vehicle.fuelLevel))%", icon: "fuelpump.fill")
                        DetailCard(title: "Mileage", value: formatNumber(vehicle.mileage), icon: "speedometer")
                    }
                    .padding()

                    // Location Map (placeholder)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Current Location")
                            .font(.headline)
                            .padding(.horizontal)

                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(.systemGray5))
                            .frame(height: 200)
                            .overlay(
                                VStack {
                                    Image(systemName: "map")
                                        .font(.largeTitle)
                                        .foregroundColor(.gray)
                                    Text(vehicle.location.address)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.center)
                                        .padding()
                                }
                            )
                            .padding(.horizontal)
                    }

                    // Action Buttons
                    VStack(spacing: 12) {
                        Button(action: {}) {
                            Label("Start Trip", systemImage: "play.circle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }

                        Button(action: {}) {
                            Label("Schedule Maintenance", systemImage: "wrench.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }

                        Button(action: {}) {
                            Label("View History", systemImage: "clock.arrow.circlepath")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Vehicle Details")
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

    private var vehicleIcon: String {
        switch vehicle.type {
        case .sedan: return "car"
        case .suv: return "car.fill"
        case .truck: return "truck.pickup.side"
        case .van: return "bus"
        case .bus: return "bus.fill"
        case .equipment: return "wrench.and.screwdriver"
        }
    }

    private func formatNumber(_ number: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: number)) ?? "0"
    }
}

// MARK: - Detail Card
struct DetailCard: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Preview
#Preview {
    VehiclesView()
}