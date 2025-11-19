import Foundation
import CoreData

/**
 * Core Data Model Definitions for Fleet Mobile App
 *
 * This file contains all Core Data entity definitions for offline storage.
 * These models sync with the backend API for offline-first functionality.
 */

// MARK: - Vehicle Entity

@objc(Vehicle)
public class Vehicle: NSManagedObject, Identifiable {
    @NSManaged public var id: Int64
    @NSManaged public var tenantId: Int64
    @NSManaged public var vin: String?
    @NSManaged public var make: String?
    @NSManaged public var model: String?
    @NSManaged public var year: Int32
    @NSManaged public var licensePlate: String?
    @NSManaged public var status: String?
    @NSManaged public var mileage: Double
    @NSManaged public var fuelLevel: Double
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var lastSyncAt: Date?
    @NSManaged public var modifiedAt: Date?
    @NSManaged public var createdAt: Date?
    @NSManaged public var needsSync: Bool
    @NSManaged public var hasConflict: Bool
    @NSManaged public var conflictData: String?

    @NSManaged public var inspections: NSSet?
    @NSManaged public var trips: NSSet?
}

// MARK: - Driver Entity

@objc(Driver)
public class Driver: NSManagedObject, Identifiable {
    @NSManaged public var id: Int64
    @NSManaged public var tenantId: Int64
    @NSManaged public var firstName: String?
    @NSManaged public var lastName: String?
    @NSManaged public var email: String?
    @NSManaged public var phone: String?
    @NSManaged public var licenseNumber: String?
    @NSManaged public var licenseExpiryDate: Date?
    @NSManaged public var status: String?
    @NSManaged public var lastSyncAt: Date?
    @NSManaged public var modifiedAt: Date?
    @NSManaged public var createdAt: Date?
    @NSManaged public var needsSync: Bool
    @NSManaged public var hasConflict: Bool

    @NSManaged public var trips: NSSet?
}

// MARK: - Inspection Entity

@objc(Inspection)
public class Inspection: NSManagedObject, Identifiable {
    @NSManaged public var id: Int64
    @NSManaged public var tenantId: Int64
    @NSManaged public var vehicleId: Int64
    @NSManaged public var driverId: Int64
    @NSManaged public var inspectionType: String?
    @NSManaged public var status: String?
    @NSManaged public var notes: String?
    @NSManaged public var defects: String? // JSON array
    @NSManaged public var odometerReading: Double
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var inspectedAt: Date?
    @NSManaged public var lastSyncAt: Date?
    @NSManaged public var modifiedAt: Date?
    @NSManaged public var createdAt: Date?
    @NSManaged public var needsSync: Bool
    @NSManaged public var hasConflict: Bool

    @NSManaged public var vehicle: Vehicle?
    @NSManaged public var photos: NSSet?
}

// MARK: - Trip Entity

@objc(Trip)
public class Trip: NSManagedObject, Identifiable {
    @NSManaged public var id: Int64
    @NSManaged public var tenantId: Int64
    @NSManaged public var vehicleId: Int64
    @NSManaged public var driverId: Int64
    @NSManaged public var startOdometer: Double
    @NSManaged public var endOdometer: Double
    @NSManaged public var startLatitude: Double
    @NSManaged public var startLongitude: Double
    @NSManaged public var endLatitude: Double
    @NSManaged public var endLongitude: Double
    @NSManaged public var startTime: Date?
    @NSManaged public var endTime: Date?
    @NSManaged public var purpose: String?
    @NSManaged public var route: String? // JSON array of coordinates
    @NSManaged public var distance: Double
    @NSManaged public var duration: Int64
    @NSManaged public var lastSyncAt: Date?
    @NSManaged public var modifiedAt: Date?
    @NSManaged public var createdAt: Date?
    @NSManaged public var needsSync: Bool
    @NSManaged public var hasConflict: Bool

    @NSManaged public var vehicle: Vehicle?
    @NSManaged public var driver: Driver?
}

// MARK: - Photo Entity

@objc(MobilePhoto)
public class MobilePhoto: NSManagedObject, Identifiable {
    @NSManaged public var id: Int64
    @NSManaged public var tenantId: Int64
    @NSManaged public var userId: Int64
    @NSManaged public var localPath: String?
    @NSManaged public var remoteUrl: String?
    @NSManaged public var fileName: String?
    @NSManaged public var fileSize: Int64
    @NSManaged public var mimeType: String?
    @NSManaged public var vehicleId: Int64
    @NSManaged public var inspectionId: Int64
    @NSManaged public var reportType: String?
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var metadata: String? // JSON
    @NSManaged public var takenAt: Date?
    @NSManaged public var uploadedAt: Date?
    @NSManaged public var lastSyncAt: Date?
    @NSManaged public var createdAt: Date?
    @NSManaged public var needsSync: Bool
    @NSManaged public var uploadStatus: String? // pending, uploading, completed, failed
    @NSManaged public var retryCount: Int16

    @NSManaged public var inspection: Inspection?
}

// MARK: - Sync Queue Entity

@objc(SyncQueueItem)
public class SyncQueueItem: NSManagedObject, Identifiable {
    @NSManaged public var id: UUID
    @NSManaged public var entityType: String? // vehicle, driver, inspection, trip, photo
    @NSManaged public var entityId: Int64
    @NSManaged public var operation: String? // create, update, delete
    @NSManaged public var payload: String? // JSON
    @NSManaged public var priority: Int16 // 0=low, 1=normal, 2=high
    @NSManaged public var status: String? // pending, processing, completed, failed
    @NSManaged public var retryCount: Int16
    @NSManaged public var maxRetries: Int16
    @NSManaged public var errorMessage: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var processedAt: Date?
    @NSManaged public var scheduledFor: Date?
}

// MARK: - Device Registration Entity

@objc(DeviceRegistration)
public class DeviceRegistration: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var deviceId: String?
    @NSManaged public var deviceName: String?
    @NSManaged public var deviceType: String?
    @NSManaged public var appVersion: String?
    @NSManaged public var osVersion: String?
    @NSManaged public var pushToken: String?
    @NSManaged public var registeredAt: Date?
    @NSManaged public var lastActiveAt: Date?
}

// MARK: - Message Entity (for offline dispatch messages)

@objc(DispatchMessage)
public class DispatchMessage: NSManagedObject, Identifiable {
    @NSManaged public var id: Int64
    @NSManaged public var tenantId: Int64
    @NSManaged public var channelId: Int64
    @NSManaged public var senderId: Int64
    @NSManaged public var senderName: String?
    @NSManaged public var messageText: String?
    @NSManaged public var messageType: String?
    @NSManaged public var priority: String?
    @NSManaged public var isRead: Bool
    @NSManaged public var sentAt: Date?
    @NSManaged public var receivedAt: Date?
    @NSManaged public var lastSyncAt: Date?
}

// MARK: - Conflict Resolution Entity

@objc(ConflictRecord)
public class ConflictRecord: NSManagedObject, Identifiable {
    @NSManaged public var id: UUID
    @NSManaged public var entityType: String?
    @NSManaged public var entityId: Int64
    @NSManaged public var localVersion: String? // JSON
    @NSManaged public var remoteVersion: String? // JSON
    @NSManaged public var conflictType: String? // timestamp, field_mismatch, deleted
    @NSManaged public var resolution: String? // use_local, use_remote, merge, manual
    @NSManaged public var resolvedBy: Int64
    @NSManaged public var detectedAt: Date?
    @NSManaged public var resolvedAt: Date?
    @NSManaged public var isResolved: Bool
}

// MARK: - Core Data Extensions

extension Vehicle {
    static func fetchRequest() -> NSFetchRequest<Vehicle> {
        return NSFetchRequest<Vehicle>(entityName: "Vehicle")
    }

    var displayName: String {
        return "\(year) \(make ?? "") \(model ?? "")".trimmingCharacters(in: .whitespaces)
    }
}

extension Driver {
    static func fetchRequest() -> NSFetchRequest<Driver> {
        return NSFetchRequest<Driver>(entityName: "Driver")
    }

    var fullName: String {
        return "\(firstName ?? "") \(lastName ?? "")".trimmingCharacters(in: .whitespaces)
    }
}

extension Inspection {
    static func fetchRequest() -> NSFetchRequest<Inspection> {
        return NSFetchRequest<Inspection>(entityName: "Inspection")
    }
}

extension Trip {
    static func fetchRequest() -> NSFetchRequest<Trip> {
        return NSFetchRequest<Trip>(entityName: "Trip")
    }

    var durationFormatted: String {
        let hours = duration / 3600
        let minutes = (duration % 3600) / 60
        return String(format: "%ldh %ldm", hours, minutes)
    }
}

extension MobilePhoto {
    static func fetchRequest() -> NSFetchRequest<MobilePhoto> {
        return NSFetchRequest<MobilePhoto>(entityName: "MobilePhoto")
    }
}

extension SyncQueueItem {
    static func fetchRequest() -> NSFetchRequest<SyncQueueItem> {
        return NSFetchRequest<SyncQueueItem>(entityName: "SyncQueueItem")
    }
}

extension DispatchMessage {
    static func fetchRequest() -> NSFetchRequest<DispatchMessage> {
        return NSFetchRequest<DispatchMessage>(entityName: "DispatchMessage")
    }
}

extension ConflictRecord {
    static func fetchRequest() -> NSFetchRequest<ConflictRecord> {
        return NSFetchRequest<ConflictRecord>(entityName: "ConflictRecord")
    }
}
