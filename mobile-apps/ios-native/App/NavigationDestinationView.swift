//
//  NavigationDestinationView.swift
//  Fleet Management
//
//  Central navigation destination resolver for all views
//  Handles routing to all new hardware-integrated features
//

import SwiftUI

struct NavigationDestinationView: View {
    let destination: NavigationDestination

    var body: some View {
        Group {
            switch destination {
            case .vehicleDetail(let id):
                VehicleDetailView(vehicleId: id)

            case .tripDetail(let id):
                TripDetailViewWrapper(tripId: id)

            case .maintenanceDetail(let id):
                MaintenanceDetailView(maintenanceId: id)

            case .addVehicle:
                AddVehicleView()

            case .addTrip:
                Text("Add Trip - Legacy View")

            case .maintenance:
                MaintenanceView()

            case .fleetMap:
                Text("Fleet Map View")

            case .settings:
                SettingsView()

            case .profile:
                ProfileView()

            case .notifications:
                Text("Notifications View")

            case .about:
                AboutView()

            case .help:
                Text("Help View")

            // PTT Radio Dispatch
            case .pushToTalk:
                PushToTalkPanel(
                    signalingUrl: "wss://fleet.capitaltechalliance.com/ptt",
                    token: "demo-token",
                    defaultChannelId: "dispatch-1"
                )
                .navigationTitle("Push-To-Talk")

            // New hardware integration destinations
            case .tripTracking(let vehicleId):
                EnhancedTripTrackingView(vehicleId: vehicleId)

            case .obd2Diagnostics:
                OBD2DiagnosticsView()

            case .maintenancePhoto(let vehicleId, let type):
                Text("Maintenance Photo for vehicle \(vehicleId) - Type: \(type)")
                    .navigationTitle("Maintenance Photo")
                // TODO: Implement when MaintenancePhotoType is defined

            case .photoCapture(let vehicleId, let photoType):
                PhotoCaptureViewWrapper(
                    vehicleId: vehicleId,
                    photoType: parsePhotoType(photoType)
                )

            // Geofence management destinations
            case .geofenceList:
                GeofenceListView()

            case .geofenceDetail(let id):
                GeofenceDetailView(geofenceId: id)

            case .addGeofence:
                Text("Add Geofence - Use sheet from GeofenceListView")

            case .editGeofence(let id):
                Text("Edit Geofence: \(id) - Use sheet from GeofenceListView")

            // Driver management destinations
            case .driverDetail(let id):
                DriverDetailView(driverId: id)

            case .addDriver:
                Text("Add Driver View")

            case .editDriver(let id):
                Text("Edit Driver: \(id)")

            // GIS Command Center destination
            case .gisCommandCenter:
                GISCommandCenterView()
            }
        }
    }

    // MARK: - Helper Parsers

    private func parsePhotoType(_ type: String) -> PhotoType {
        switch type.lowercased() {
        case "odometer":
            return .odometer
        case "damage":
            return .damage
        case "maintenance":
            return .maintenance
        case "inspection":
            return .inspection
        case "vin":
            return .vin
        case "interior":
            return .interior
        case "exterior":
            return .exterior
        default:
            return .general
        }
    }
}

// MARK: - Wrapper Views

struct VehicleDetailView: View {
    let vehicleId: String

    var body: some View {
        Text("Vehicle Detail: \(vehicleId)")
            .navigationTitle("Vehicle")
    }
}

// MARK: - Vehicle Detail Wrapper
/// Wrapper view that loads a vehicle by ID and passes it to VehicleDetailView
struct VehicleDetailViewWrapper: View {
    let vehicleId: String
    @StateObject private var viewModel = VehicleViewModel()

    var body: some View {
        if let vehicle = viewModel.vehicles.first(where: { $0.id == vehicleId }) {
            VehicleDetailView(vehicle: vehicle)
        } else {
            ProgressView("Loading vehicle...")
                .onAppear {
                    Task {
                        await viewModel.fetchVehicles()
                    }
                }
        }
    }
}

// MARK: - Trip Detail Wrapper
/// Wrapper view that loads a trip by ID and passes it to TripDetailView
struct TripDetailViewWrapper: View {
    let tripId: String
    @StateObject private var viewModel = TripsViewModel()

    var body: some View {
        if let trip = viewModel.trips.first(where: { $0.id.uuidString == tripId }) {
            TripDetailView(trip: trip)
        } else {
            VStack(spacing: 20) {
                ProgressView("Loading trip...")
            }
            .onAppear {
                Task {
                    await viewModel.refresh()
                }
            }
        }
    }
}

struct PhotoCaptureViewWrapper: View {
    let vehicleId: String
    let photoType: PhotoType

    @State private var capturedPhotos: [CapturedPhoto] = []
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        PhotoCaptureView(
            vehicleId: vehicleId,
            photoType: photoType,
            maxPhotos: 10
        ) { photos in
            capturedPhotos = photos
            print("✅ Captured \(photos.count) photos")
            dismiss()
        }
    }
}
