//
//  AddTripView.swift
//  Fleet Manager
//
//  Complete Add Trip View with GPS integration, vehicle selection, and trip tracking
//

import SwiftUI
import MapKit
import CoreLocation

// MARK: - Add Trip View
struct AddTripView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel: AddTripViewModel
    @StateObject private var tripsViewModel: TripsViewModel

    // MARK: - State
    @State private var selectedVehicle: Vehicle?
    @State private var purpose: String = ""
    @State private var odometer: String = ""
    @State private var searchText: String = ""
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""

    init(tripsViewModel: TripsViewModel) {
        _viewModel = StateObject(wrappedValue: AddTripViewModel())
        _tripsViewModel = StateObject(wrappedValue: tripsViewModel)
    }

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: ModernTheme.Spacing.xl) {
                        // Location Preview
                        locationSection

                        // Vehicle Selection
                        vehicleSelectionSection

                        // Trip Details
                        tripDetailsSection

                        // Start Button
                        startButtonSection
                    }
                    .padding()
                }
                .background(ModernTheme.Colors.groupedBackground)

                // Loading Overlay
                if viewModel.isLoading {
                    LoadingOverlay()
                }
            }
            .navigationTitle("Start New Trip")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .task {
                await viewModel.initialize()
            }
        }
    }

    // MARK: - Location Section
    private var locationSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Image(systemName: "location.circle.fill")
                    .foregroundColor(ModernTheme.Colors.primary)
                    .font(.title3)

                Text("Start Location")
                    .font(ModernTheme.Typography.headline)

                Spacer()

                if viewModel.locationPermissionStatus == .authorized {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.success)
                } else if viewModel.locationPermissionStatus == .denied {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.error)
                }
            }

            if let location = viewModel.currentLocation {
                // Map Preview
                Map(coordinateRegion: .constant(MKCoordinateRegion(
                    center: location.coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                )), annotationItems: [LocationAnnotation(coordinate: location.coordinate)]) { item in
                    MapMarker(coordinate: item.coordinate, tint: .blue)
                }
                .frame(height: 200)
                .cornerRadius(ModernTheme.CornerRadius.md)
                .allowsHitTesting(false)

                // Address
                if let address = viewModel.currentAddress {
                    HStack {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(ModernTheme.Colors.secondary)
                        Text(address)
                            .font(ModernTheme.Typography.callout)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                    .padding(.top, ModernTheme.Spacing.xs)
                }
            } else if viewModel.locationPermissionStatus == .denied {
                LocationPermissionDeniedView {
                    viewModel.requestLocationPermission()
                }
            } else if viewModel.locationPermissionStatus == .notDetermined {
                LocationPermissionPromptView {
                    viewModel.requestLocationPermission()
                }
            } else {
                HStack {
                    ProgressView()
                    Text("Getting your location...")
                        .font(ModernTheme.Typography.callout)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.xxl)
            }
        }
        .padding()
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(color: ModernTheme.Shadow.small.color,
                radius: ModernTheme.Shadow.small.radius,
                x: ModernTheme.Shadow.small.x,
                y: ModernTheme.Shadow.small.y)
    }

    // MARK: - Vehicle Selection Section
    private var vehicleSelectionSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Image(systemName: "car.fill")
                    .foregroundColor(ModernTheme.Colors.primary)
                    .font(.title3)

                Text("Select Vehicle")
                    .font(ModernTheme.Typography.headline)

                Spacer()

                if selectedVehicle != nil {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.success)
                }
            }

            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                TextField("Search vehicles...", text: $searchText)
                    .textFieldStyle(.plain)

                if !searchText.isEmpty {
                    Button(action: { searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.sm)

            // Vehicle List
            if viewModel.filteredVehicles(searchText: searchText).isEmpty {
                EmptyVehicleListView()
            } else {
                VStack(spacing: ModernTheme.Spacing.sm) {
                    ForEach(viewModel.filteredVehicles(searchText: searchText).prefix(5)) { vehicle in
                        VehicleSelectionRow(
                            vehicle: vehicle,
                            isSelected: selectedVehicle?.id == vehicle.id
                        ) {
                            withAnimation(ModernTheme.Animation.quick) {
                                selectedVehicle = vehicle
                                odometer = String(format: "%.0f", vehicle.mileage)
                                ModernTheme.Haptics.selection()
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(color: ModernTheme.Shadow.small.color,
                radius: ModernTheme.Shadow.small.radius,
                x: ModernTheme.Shadow.small.x,
                y: ModernTheme.Shadow.small.y)
    }

    // MARK: - Trip Details Section
    private var tripDetailsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
            // Purpose Field
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                Label("Purpose (Optional)", systemImage: "text.alignleft")
                    .font(ModernTheme.Typography.subheadline)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                TextField("e.g., Client meeting, Delivery, Inspection", text: $purpose)
                    .textFieldStyle(.roundedBorder)
            }

            // Odometer Reading
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                Label("Odometer Reading", systemImage: "speedometer")
                    .font(ModernTheme.Typography.subheadline)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                TextField("Enter current odometer reading", text: $odometer)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(.roundedBorder)

                if let vehicle = selectedVehicle {
                    Text("Last recorded: \(String(format: "%.0f km", vehicle.mileage))")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(color: ModernTheme.Shadow.small.color,
                radius: ModernTheme.Shadow.small.radius,
                x: ModernTheme.Shadow.small.x,
                y: ModernTheme.Shadow.small.y)
    }

    // MARK: - Start Button Section
    private var startButtonSection: some View {
        Button(action: startTrip) {
            HStack {
                Image(systemName: "play.fill")
                    .font(.title3)

                Text("Start Trip")
                    .font(ModernTheme.Typography.bodyBold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                LinearGradient(
                    colors: canStartTrip ? [ModernTheme.Colors.success, ModernTheme.Colors.success.opacity(0.8)] : [Color.gray, Color.gray.opacity(0.8)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(ModernTheme.CornerRadius.md)
            .shadow(color: canStartTrip ? ModernTheme.Colors.success.opacity(0.3) : Color.clear,
                    radius: 8,
                    x: 0,
                    y: 4)
        }
        .disabled(!canStartTrip)
        .animation(ModernTheme.Animation.smooth, value: canStartTrip)
    }

    // MARK: - Helper Properties
    private var canStartTrip: Bool {
        selectedVehicle != nil &&
        viewModel.currentLocation != nil &&
        !odometer.isEmpty &&
        Double(odometer) != nil
    }

    // MARK: - Actions
    private func startTrip() {
        guard let vehicle = selectedVehicle,
              let location = viewModel.currentLocation,
              let odometerReading = Double(odometer) else {
            return
        }

        ModernTheme.Haptics.success()

        Task {
            do {
                try await viewModel.startTrip(
                    vehicleId: vehicle.id,
                    purpose: purpose.isEmpty ? nil : purpose,
                    odometerReading: odometerReading,
                    startLocation: location.coordinate
                )

                // Update trips view model
                await MainActor.run {
                    tripsViewModel.startNewTrip(vehicleId: vehicle.id)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    ModernTheme.Haptics.error()
                }
            }
        }
    }
}

// MARK: - Vehicle Selection Row
struct VehicleSelectionRow: View {
    let vehicle: Vehicle
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Selection Indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? ModernTheme.Colors.success : ModernTheme.Colors.secondaryText)
                    .font(.title3)

                // Vehicle Icon
                Image(systemName: vehicle.type.icon)
                    .foregroundColor(vehicle.status.themeColor)
                    .font(.title3)
                    .frame(width: 40)

                // Vehicle Info
                VStack(alignment: .leading, spacing: 2) {
                    Text(vehicle.number)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                // Status Badge
                VStack(alignment: .trailing, spacing: 2) {
                    StatusBadge(status: vehicle.status)

                    if vehicle.fuelLevel < 0.25 {
                        HStack(spacing: 2) {
                            Image(systemName: "fuelpump.fill")
                                .font(.caption2)
                            Text(String(format: "%.0f%%", vehicle.fuelLevel * 100))
                                .font(ModernTheme.Typography.caption2)
                        }
                        .foregroundColor(ModernTheme.Colors.warning)
                    }
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(isSelected ? ModernTheme.Colors.success.opacity(0.1) : ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.sm)
            .overlay(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .stroke(isSelected ? ModernTheme.Colors.success : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: VehicleStatus

    var body: some View {
        Text(status.displayName)
            .font(ModernTheme.Typography.caption2)
            .padding(.horizontal, ModernTheme.Spacing.sm)
            .padding(.vertical, ModernTheme.Spacing.xxs)
            .background(status.themeColor.opacity(0.2))
            .foregroundColor(status.themeColor)
            .cornerRadius(ModernTheme.CornerRadius.xs)
    }
}

// MARK: - Empty Vehicle List View
struct EmptyVehicleListView: View {
    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: "car.fill")
                .font(.system(size: 48))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No vehicles available")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text("No active vehicles match your search")
                .font(ModernTheme.Typography.callout)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, ModernTheme.Spacing.xxxl)
    }
}

// MARK: - Location Permission Denied View
struct LocationPermissionDeniedView: View {
    let action: () -> Void

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "location.slash.fill")
                .font(.system(size: 48))
                .foregroundColor(ModernTheme.Colors.error)

            Text("Location Access Denied")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text("Please enable location services in Settings to start trips with GPS tracking.")
                .font(ModernTheme.Typography.callout)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)

            Button(action: {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }) {
                Text("Open Settings")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(ModernTheme.Colors.primary)
                    .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .padding()
    }
}

// MARK: - Location Permission Prompt View
struct LocationPermissionPromptView: View {
    let action: () -> Void

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "location.circle.fill")
                .font(.system(size: 48))
                .foregroundColor(ModernTheme.Colors.primary)

            Text("Location Permission Required")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text("We need access to your location to track trips and provide accurate GPS data.")
                .font(ModernTheme.Typography.callout)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)

            Button(action: action) {
                Text("Enable Location")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(ModernTheme.Colors.primary)
                    .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .padding()
    }
}

// MARK: - Loading Overlay
struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)

            VStack(spacing: ModernTheme.Spacing.lg) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)

                Text("Starting trip...")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(.white)
            }
            .padding(ModernTheme.Spacing.xxxl)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                    .fill(Color.black.opacity(0.8))
            )
        }
    }
}

// MARK: - Location Annotation
struct LocationAnnotation: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
}

// MARK: - Preview
#Preview {
    AddTripView(tripsViewModel: TripsViewModel())
}
