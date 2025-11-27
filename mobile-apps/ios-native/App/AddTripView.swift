import SwiftUI
import CoreLocation

// MARK: - Temporary Add Trip ViewModel Stub
@MainActor
private class AddTripViewModelStub: ObservableObject {
    @Published var availableVehicles: [Vehicle] = []
    @Published var selectedVehicle: Vehicle?
    @Published var selectedVehicleId: String?
    @Published var driverName: String = ""
    @Published var purpose: String = ""
    @Published var currentLocation: CLLocation?
    @Published var locationAuthStatus: CLAuthorizationStatus = .notDetermined
    @Published var isLoading: Bool = false
    @Published var hasError: Bool = false
    @Published var errorMessage: String?

    var canStartTrip: Bool { false }

    func loadVehicles() {}
    func checkLocationPermission() {}
    func requestLocationPermission() {}
    func startTrip(tripsViewModel: TripsViewModel) async {}
}

// MARK: - Add Trip View
struct AddTripView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var viewModel = AddTripViewModelStub()
    @ObservedObject var tripsViewModel: TripsViewModel

    var body: some View {
        NavigationView {
            ZStack {
                Form {
                    // Vehicle Selection
                    Section {
                        if viewModel.availableVehicles.isEmpty {
                            EmptyVehicleListView()
                        } else {
                            Picker("Vehicle", selection: $viewModel.selectedVehicleId) {
                                Text("Select a vehicle").tag(nil as String?)
                                ForEach(viewModel.availableVehicles) { vehicle in
                                    Text("\(vehicle.number) - \(vehicle.make) \(vehicle.model)")
                                        .tag(vehicle.id as String?)
                                }
                            }
                        }
                    } header: {
                        Text("Vehicle")
                    }

                    // Driver Info
                    Section {
                        TextField("Driver Name", text: $viewModel.driverName)
                        TextField("Purpose", text: $viewModel.purpose)
                    } header: {
                        Text("Trip Details")
                    }

                    // Location
                    Section {
                        switch viewModel.locationAuthStatus {
                        case .notDetermined:
                            LocationPermissionPromptView {
                                viewModel.requestLocationPermission()
                            }
                        case .denied, .restricted:
                            LocationPermissionDeniedView {
                                viewModel.requestLocationPermission()
                            }
                        case .authorizedAlways, .authorizedWhenInUse:
                            if let location = viewModel.currentLocation {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: "location.fill")
                                            .foregroundColor(ModernTheme.Colors.primary)
                                        Text("Current Location")
                                            .font(ModernTheme.Typography.headline)
                                    }
                                    Text("Lat: \(location.coordinate.latitude, specifier: "%.4f"), Lng: \(location.coordinate.longitude, specifier: "%.4f")")
                                        .font(.caption)
                                        .foregroundColor(ModernTheme.Colors.secondaryText)
                                }
                            } else {
                                HStack {
                                    ProgressView()
                                    Text("Getting location...")
                                        .foregroundColor(ModernTheme.Colors.secondaryText)
                                }
                            }
                        @unknown default:
                            EmptyView()
                        }
                    } header: {
                        Text("Starting Location")
                    }

                    // Start Trip Button
                    Section {
                        Button {
                            Task {
                                await viewModel.startTrip(tripsViewModel: tripsViewModel)
                                if !viewModel.hasError {
                                    dismiss()
                                }
                            }
                        } label: {
                            HStack {
                                Image(systemName: "play.circle.fill")
                                Text("Start Trip")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                        }
                        .disabled(!viewModel.canStartTrip)
                        .buttonStyle(.borderedProminent)
                    }
                }
                .navigationTitle("New Trip")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            dismiss()
                        }
                    }
                }
                .alert("Error", isPresented: $viewModel.hasError) {
                    Button("OK", role: .cancel) {}
                } message: {
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                    }
                }
                .onAppear {
                    viewModel.loadVehicles()
                    viewModel.checkLocationPermission()
                }

                // Loading overlay
                if viewModel.isLoading {
                    AddTripLoadingOverlay()
                }
            }
        }
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
private struct AddTripLoadingOverlay: View {
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
// #Preview {
//     AddTripView(tripsViewModel: TripsViewModel())
// }
