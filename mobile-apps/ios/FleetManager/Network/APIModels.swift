import Foundation

/**
 * API Data Transfer Objects (DTOs)
 *
 * These models match the backend API structure and are used
 * for network communication. They are separate from Core Data models.
 */

// MARK: - Device Registration

struct DeviceRegistrationRequest: Codable {
    let deviceType: String
    let deviceId: String
    let deviceName: String
    let appVersion: String
    let osVersion: String
    let pushToken: String?
}

struct DeviceRegistrationResponse: Codable {
    let id: Int
    let deviceId: String
    let registeredAt: Date
}

// MARK: - Sync Models

struct SyncRequest: Codable {
    let deviceId: String
    let lastSyncAt: Date?
    let data: SyncData
}

struct SyncData: Codable {
    let inspections: [InspectionDTO]?
    let reports: [ReportDTO]?
    let photos: [PhotoDTO]?
    let hosLogs: [HOSLogDTO]?
}

struct SyncResponse: Codable {
    let success: Bool
    let serverTime: Date
    let conflicts: [ConflictDTO]?
    let updates: SyncUpdates
}

struct SyncUpdates: Codable {
    let vehicles: [VehicleDTO]?
    let drivers: [DriverDTO]?
    let inspections: [InspectionDTO]?
    let trips: [TripDTO]?
    let messages: [MessageDTO]?
}

// MARK: - Vehicle DTO

struct VehicleDTO: Codable, Identifiable {
    let id: Int
    let tenantId: Int
    let vin: String?
    let make: String?
    let model: String?
    let year: Int?
    let licensePlate: String?
    let status: String?
    let mileage: Double?
    let fuelLevel: Double?
    let latitude: Double?
    let longitude: Double?
    let modifiedAt: Date?
    let createdAt: Date?
}

// MARK: - Driver DTO

struct DriverDTO: Codable, Identifiable {
    let id: Int
    let tenantId: Int
    let firstName: String?
    let lastName: String?
    let email: String?
    let phone: String?
    let licenseNumber: String?
    let licenseExpiryDate: Date?
    let status: String?
    let modifiedAt: Date?
    let createdAt: Date?
}

// MARK: - Inspection DTO

struct InspectionDTO: Codable, Identifiable {
    let id: Int?
    let tenantId: Int
    let vehicleId: Int
    let driverId: Int
    let inspectionType: String
    let status: String
    let notes: String?
    let defects: [DefectDTO]?
    let odometerReading: Double
    let latitude: Double?
    let longitude: Double?
    let inspectedAt: Date
    let modifiedAt: Date?
    let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, tenantId, vehicleId, driverId, inspectionType, status
        case notes, defects, odometerReading, latitude, longitude
        case inspectedAt, modifiedAt, createdAt
    }
}

struct DefectDTO: Codable {
    let category: String
    let severity: String
    let description: String
    let photoUrl: String?
}

// MARK: - Trip DTO

struct TripDTO: Codable, Identifiable {
    let id: Int?
    let tenantId: Int
    let vehicleId: Int
    let driverId: Int
    let startOdometer: Double
    let endOdometer: Double?
    let startLatitude: Double
    let startLongitude: Double
    let endLatitude: Double?
    let endLongitude: Double?
    let startTime: Date
    let endTime: Date?
    let purpose: String?
    let route: [CoordinateDTO]?
    let distance: Double?
    let duration: Int?
    let modifiedAt: Date?
    let createdAt: Date?
}

struct CoordinateDTO: Codable {
    let latitude: Double
    let longitude: Double
    let timestamp: Date
    let speed: Double?
    let heading: Double?
}

// MARK: - Photo DTO

struct PhotoDTO: Codable {
    let id: Int?
    let tenantId: Int
    let userId: Int
    let photoUrl: String?
    let fileName: String
    let fileSize: Int
    let mimeType: String
    let vehicleId: Int?
    let inspectionId: Int?
    let damageReportId: Int?
    let fuelTransactionId: Int?
    let reportType: String?
    let latitude: Double?
    let longitude: Double?
    let tags: [String]?
    let description: String?
    let takenAt: Date
    let uploadedAt: Date?
}

struct PhotoUploadResponse: Codable {
    let success: Bool
    let photo: PhotoInfo
}

struct PhotoInfo: Codable {
    let id: Int
    let url: String
    let fileName: String
    let uploadedAt: Date
}

// MARK: - HOS Log DTO

struct HOSLogDTO: Codable {
    let id: Int?
    let driverId: Int
    let vehicleId: Int?
    let status: String // on_duty, driving, off_duty, sleeper_berth
    let startTime: Date
    let endTime: Date?
    let location: String?
    let latitude: Double?
    let longitude: Double?
    let odometer: Double?
    let notes: String?
}

// MARK: - Report DTO

struct ReportDTO: Codable {
    let id: Int?
    let reportType: String
    let vehicleId: Int?
    let driverId: Int?
    let description: String
    let severity: String?
    let photos: [String]?
    let latitude: Double?
    let longitude: Double?
    let createdAt: Date
}

// MARK: - Message DTO

struct MessageDTO: Codable, Identifiable {
    let id: Int
    let tenantId: Int
    let channelId: Int
    let senderId: Int
    let senderName: String
    let messageText: String
    let messageType: String?
    let priority: String?
    let sentAt: Date
}

// MARK: - Conflict DTO

struct ConflictDTO: Codable, Identifiable {
    let id: String
    let entityType: String
    let entityId: Int
    let conflictType: String
    let localVersion: String
    let remoteVersion: String
    let detectedAt: Date
}

// MARK: - Keyless Entry

struct KeylessEntryRequest: Codable {
    let vehicleId: Int
    let deviceId: String
    let command: String // lock, unlock, start, stop
    let location: LocationDTO?
}

struct LocationDTO: Codable {
    let latitude: Double
    let longitude: Double
}

struct KeylessEntryResponse: Codable {
    let success: Bool
    let command: String
    let executedAt: Date
    let message: String?
}

// MARK: - AR Navigation

struct ARNavigationRequest: Codable {
    let vehicleId: Int
    let routeId: Int?
    let currentLocation: LocationDTO
    let heading: Double
    let includePois: Bool?
    let includeGeofences: Bool?
}

struct ARNavigationResponse: Codable {
    let route: RouteDTO
    let pois: [POIDTO]?
    let geofences: [GeofenceDTO]?
    let nextWaypoint: WaypointDTO?
    let distanceToNext: Double
    let estimatedArrival: Date?
}

struct RouteDTO: Codable, Identifiable {
    let id: Int
    let name: String?
    let waypoints: [WaypointDTO]
    let distance: Double
    let duration: Int
}

struct WaypointDTO: Codable, Identifiable {
    let id: Int
    let latitude: Double
    let longitude: Double
    let address: String?
    let sequenceOrder: Int
    let estimatedArrival: Date?
}

struct POIDTO: Codable, Identifiable {
    let id: Int
    let name: String
    let category: String
    let latitude: Double
    let longitude: Double
    let distance: Double
}

struct GeofenceDTO: Codable, Identifiable {
    let id: Int
    let name: String
    let type: String
    let coordinates: [LocationDTO]
    let radius: Double?
    let alertOnEntry: Bool
    let alertOnExit: Bool
}

// MARK: - Damage Detection

struct DamageDetectionRequest: Codable {
    let vehicleId: Int
    let photoUrl: String
    let aiDetections: [AIDetectionDTO]
    let severity: String
    let estimatedCost: Double?
}

struct AIDetectionDTO: Codable {
    let type: String
    let confidence: Double
    let boundingBox: BoundingBoxDTO
}

struct BoundingBoxDTO: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct DamageDetectionResponse: Codable {
    let success: Bool
    let reportId: Int
    let severity: String
    let estimatedCost: Double?
}

// MARK: - Charging Stations

struct ChargingStationDTO: Codable, Identifiable {
    let id: Int
    let name: String
    let address: String
    let latitude: Double
    let longitude: Double
    let distance: Double
    let connectorTypes: [String]
    let powerLevel: String
    let availability: String
    let pricing: String?
}

// MARK: - Push Notification

struct PushNotificationPayload: Codable {
    let title: String
    let body: String
    let data: [String: String]?
    let priority: String?
}
