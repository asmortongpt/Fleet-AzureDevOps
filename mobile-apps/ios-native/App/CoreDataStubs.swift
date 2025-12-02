import Foundation
import CoreData

// MARK: - Core Data Entity Stubs
// These are temporary stubs until the Core Data model is created

@objc(MaintenanceRecordEntity)
@objcMembers public class MaintenanceRecordEntity: NSManagedObject {
    @NSManaged public var id: String?
    @NSManaged public var vehicleId: String?
    @NSManaged public var type: String?
    @NSManaged public var status: String?
    @NSManaged public var maintenanceDescription: String?
    @NSManaged public var scheduledDate: Date?
    @NSManaged public var completedDate: Date?
    @NSManaged public var cost: Double
    @NSManaged public var mileage: Double
    @NSManaged public var performedBy: String?
    @NSManaged public var notes: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var syncStatus: String?
    @NSManaged public var category: String?
    @NSManaged public var priority: String?
    @NSManaged public var partsData: Data?
    @NSManaged public var attachmentsData: Data?
    @NSManaged public var vehicleNumber: String?
    @NSManaged public var mileageAtService: Double
    @NSManaged public var hoursAtService: Double
    @NSManaged public var servicedBy: String?
    @NSManaged public var serviceProvider: String?
    @NSManaged public var location: String?
    @NSManaged public var nextServiceMileage: Double
    @NSManaged public var nextServiceDate: Date?
    @NSManaged public var lastSynced: Date?
}

@objc(TripEntity)
@objcMembers public class TripEntity: NSManagedObject {
    @NSManaged public var id: String?
    @NSManaged public var vehicleId: String?
    @NSManaged public var driverId: String?
    @NSManaged public var startTime: Date?
    @NSManaged public var endTime: Date?
    @NSManaged public var startLocation: String?
    @NSManaged public var endLocation: String?
    @NSManaged public var distance: Double
    @NSManaged public var purpose: String?
    @NSManaged public var status: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var syncStatus: String?
    @NSManaged public var averageSpeed: Double
    @NSManaged public var maxSpeed: Double
    @NSManaged public var pausedDuration: Double
    @NSManaged public var notes: String?
    @NSManaged public var coordinatesData: Data?
    @NSManaged public var lastSynced: Date?
    @NSManaged public var name: String?
    @NSManaged public var totalDistance: Double
}

// MARK: - Fetch Requests
extension MaintenanceRecordEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MaintenanceRecordEntity> {
        return NSFetchRequest<MaintenanceRecordEntity>(entityName: "MaintenanceRecordEntity")
    }
}

extension TripEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TripEntity> {
        return NSFetchRequest<TripEntity>(entityName: "TripEntity")
    }
}

// MARK: - VehicleEntity Stub
@objc(VehicleEntity)
@objcMembers public class VehicleEntity: NSManagedObject {
    @NSManaged public var id: String?
    @NSManaged public var tenantId: String?
    @NSManaged public var number: String?
    @NSManaged public var type: String?
    @NSManaged public var make: String?
    @NSManaged public var model: String?
    @NSManaged public var year: Int32
    @NSManaged public var vin: String?
    @NSManaged public var licensePlate: String?
    @NSManaged public var status: String?
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var locationAddress: String?
    @NSManaged public var region: String?
    @NSManaged public var department: String?
    @NSManaged public var fuelLevel: Double
    @NSManaged public var fuelType: String?
    @NSManaged public var mileage: Double
    @NSManaged public var hoursUsed: Double
    @NSManaged public var assignedDriver: String?
    @NSManaged public var ownership: String?
    @NSManaged public var lastService: String?
    @NSManaged public var nextService: String?
    @NSManaged public var alertsData: NSArray?
    @NSManaged public var tags: NSArray?
    @NSManaged public var createdAt: Date?
    @NSManaged public var lastModified: Date?
    @NSManaged public var syncStatus: String?
    @NSManaged public var lastSynced: Date?
}

extension VehicleEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<VehicleEntity> {
        return NSFetchRequest<VehicleEntity>(entityName: "VehicleEntity")
    }
}
