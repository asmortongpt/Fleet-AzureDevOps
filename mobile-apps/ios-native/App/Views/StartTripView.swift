//
//  StartTripView.swift
//  Fleet Manager
//
//  Start a new trip with vehicle selection and tracking options
//

import SwiftUI
import CoreLocation

struct StartTripView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var locationManager = LocationManager.shared
    @StateObject private var vehiclesViewModel = VehiclesViewModel()
    @StateObject private var tripsViewModel = TripsViewModel()

    @State private var tripName = ""
    @State private var selectedVehicleId: String?
    @State private var notes = ""
    @State private var isStarting = false
    @State private var showVehiclePicker = false

    var body: some View {
        NavigationView {
            Form {
                // Trip Information
                Section("Trip Information") {
                    TextField("Trip Name", text: $tripName)

                    Button(action: { showVehiclePicker = true }) {
                        HStack {
                            Image(systemName: "car.fill")
                                .foregroundColor(.blue)
                            Text(selectedVehicleId ?? "Select Vehicle (Optional)")
                                .foregroundColor(selectedVehicleId == nil ? .secondary : .primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Location Status
                Section("Location") {
                    HStack {
                        Image(systemName: locationStatusIcon)
                            .foregroundColor(locationStatusColor)
                        Text(locationStatusText)
                            .foregroundColor(.secondary)
                    }

                    if let location = locationManager.location {
                        HStack {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.red)
                            Text(String(format: "%.4f, %.4f", location.coordinate.latitude, location.coordinate.longitude))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Tracking Options
                Section("Tracking Options") {
                    Toggle(isOn: .constant(true)) {
                        Label("Track Location", systemImage: "location.fill")
                    }

                    Toggle(isOn: .constant(true)) {
                        Label("Record Speed", systemImage: "speedometer")
                    }

                    Toggle(isOn: .constant(false)) {
                        Label("Battery Saver Mode", systemImage: "battery.100")
                    }
                }

                // Notes
                Section("Notes (Optional)") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                // Quick Start Options
                Section("Quick Start") {
                    QuickStartButton(title: "Morning Commute", icon: "sunrise.fill", color: .orange) {
                        tripName = "Morning Commute"
                    }

                    QuickStartButton(title: "Delivery Route", icon: "shippingbox.fill", color: .purple) {
                        tripName = "Delivery Route"
                    }

                    QuickStartButton(title: "Service Call", icon: "wrench.fill", color: .blue) {
                        tripName = "Service Call"
                    }
                }
            }
            .navigationTitle("Start Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: startTrip) {
                        if isStarting {
                            ProgressView()
                        } else {
                            Text("Start")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(tripName.isEmpty || isStarting)
                }
            }
            .sheet(isPresented: $showVehiclePicker) {
                VehiclePickerSheet(selectedVehicleId: $selectedVehicleId, vehicles: vehiclesViewModel.vehicles)
            }
            .onAppear {
                locationManager.requestPermission()
            }
        }
    }

    // MARK: - Location Status
    private var locationStatusIcon: String {
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            return locationManager.location != nil ? "location.fill" : "location.slash"
        case .denied, .restricted:
            return "location.slash"
        default:
            return "location"
        }
    }

    private var locationStatusColor: Color {
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            return locationManager.location != nil ? .green : .orange
        case .denied, .restricted:
            return .red
        default:
            return .gray
        }
    }

    private var locationStatusText: String {
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            return locationManager.location != nil ? "Location ready" : "Acquiring location..."
        case .denied, .restricted:
            return "Location access denied"
        case .notDetermined:
            return "Location permission required"
        @unknown default:
            return "Unknown location status"
        }
    }

    // MARK: - Start Trip
    private func startTrip() {
        isStarting = true

        tripsViewModel.startNewTrip(vehicleId: selectedVehicleId ?? "")

        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isStarting = false
            dismiss()
        }
    }
}

// MARK: - Quick Start Button
struct QuickStartButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 24)
                Text(title)
                    .foregroundColor(.primary)
                Spacer()
                Image(systemName: "arrow.right.circle")
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Vehicle Picker Sheet
struct VehiclePickerSheet: View {
    @Binding var selectedVehicleId: String?
    let vehicles: [Vehicle]
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    var filteredVehicles: [Vehicle] {
        if searchText.isEmpty {
            return vehicles
        }
        return vehicles.filter {
            $0.number.localizedCaseInsensitiveContains(searchText) ||
            $0.make.localizedCaseInsensitiveContains(searchText) ||
            $0.model.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationView {
            List {
                // None option
                Button(action: {
                    selectedVehicleId = nil
                    dismiss()
                }) {
                    HStack {
                        Image(systemName: "car.fill")
                            .foregroundColor(.gray)
                            .frame(width: 30)
                        Text("No Vehicle")
                            .foregroundColor(.primary)
                        Spacer()
                        if selectedVehicleId == nil {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.blue)
                        }
                    }
                }

                ForEach(filteredVehicles) { vehicle in
                    Button(action: {
                        selectedVehicleId = vehicle.number
                        dismiss()
                    }) {
                        HStack {
                            Image(systemName: vehicle.type.icon)
                                .foregroundColor(.blue)
                                .frame(width: 30)

                            VStack(alignment: .leading) {
                                Text(vehicle.number)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            if selectedVehicleId == vehicle.number {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Select Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search vehicles")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    StartTripView()
}
