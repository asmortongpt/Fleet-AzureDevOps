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

            // New hardware integration destinations
            case .tripTracking(let vehicleId):
                EnhancedTripTrackingView(vehicleId: vehicleId)

            case .obd2Diagnostics:
                OBD2DiagnosticsView()

            case .maintenancePhoto(let vehicleId, let type):
                VehicleMaintenancePhotoView(
                    vehicleId: vehicleId,
                    maintenanceType: parseMaintenancePhotoType(type)
                )

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

    private func parseMaintenancePhotoType(_ type: String) -> MaintenancePhotoType {
        switch type.lowercased() {
        case "odometer":
            return .odometer
        case "fuel", "fuellevel":
            return .fuelLevel
        case "damage":
            return .damage
        default:
            return .general
        }
    }

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

struct TripDetailViewWrapper: View {
    let tripId: String

    var body: some View {
        Text("Trip Detail: \(tripId)")
            .navigationTitle("Trip")
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
