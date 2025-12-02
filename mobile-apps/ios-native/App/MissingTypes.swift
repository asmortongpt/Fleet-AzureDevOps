//
//  MissingTypes.swift
//  Fleet Manager
//
//  Missing type definitions for build success
//

import Foundation
import CoreLocation

// MARK: - Activity Types
struct ActivityItem: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: ActivityType
    let title: String
    let description: String
    let vehicleId: String?
    let driverId: String?
}

enum ActivityType: String {
    case tripStarted = "Trip Started"
    case tripCompleted = "Trip Completed"
    case maintenanceScheduled = "Maintenance Scheduled"
    case maintenanceCompleted = "Maintenance Completed"
    case alert = "Alert"
    case incident = "Incident"
}

// MARK: - User Role
enum UserRole: String, Codable {
    case admin = "Admin"
    case fleetManager = "Fleet Manager"
    case dispatcher = "Dispatcher"
    case driver = "Driver"
    case mechanic = "Mechanic"
    case viewer = "Viewer"
}

// MARK: - Coordinate Type (Codable wrapper for CLLocationCoordinate2D)
struct Coordinate: Codable, Equatable {
    let latitude: Double
    let longitude: Double

    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    init(_ coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }

    var clLocationCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

// MARK: - Geofence
struct Geofence: Identifiable, Codable {
    let id: String
    let name: String
    let center: Coordinate
    let radius: Double
    let isActive: Bool
}
