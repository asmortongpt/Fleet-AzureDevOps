//
//  VehicleModel.swift
//  Fleet Manager - iOS Native App
//
//  Core Data entities and persistence layer for Vehicle data
//  Supports offline-first architecture with CloudKit sync
//

import Foundation
import CoreData
import CloudKit

// MARK: - Vehicle Entity Extension
extension VehicleEntity {

    // MARK: - Convenience Methods

    /// Convert Core Data entity to Codable Vehicle model
    func toVehicle() -> Vehicle? {
        guard let id = id,
              let tenantId = tenantId,
              let number = number,
              let typeRaw = type,
              let make = make,
              let model = model,
              let vin = vin,
              let licensePlate = licensePlate,
              let statusRaw = status,
              let region = region,
              let department = department,
              let fuelTypeRaw = fuelType,
              let ownershipRaw = ownership,
              let lastService = lastService,
              let nextService = nextService else {
            return nil
        }

        let location = VehicleLocation(
            lat: latitude,
            lng: longitude,
            address: locationAddress ?? ""
        )

        let alerts = (alertsData as? [String]) ?? []

        return Vehicle(
            id: id,
            tenantId: tenantId,
            number: number,
            type: VehicleType(rawValue: typeRaw) ?? .sedan,
            make: make,
            model: model,
            year: Int(year),
            vin: vin,
            licensePlate: licensePlate,
            status: VehicleStatus(rawValue: statusRaw) ?? .offline,
            location: location,
            region: region,
            department: department,
            fuelLevel: fuelLevel,
            fuelType: FuelType(rawValue: fuelTypeRaw) ?? .gasoline,
            mileage: mileage,
            hoursUsed: hoursUsed == 0 ? nil : hoursUsed,
            assignedDriver: assignedDriver,
            ownership: OwnershipType(rawValue: ownershipRaw) ?? .owned,
            lastService: lastService,
            nextService: nextService,
            alerts: alerts,
            customFields: nil,
            tags: tags as? [String]
        )
    }

    /// Update entity from Codable Vehicle model
    func update(from vehicle: Vehicle, context: NSManagedObjectContext) {
        self.id = vehicle.id
        self.tenantId = vehicle.tenantId
        self.number = vehicle.number
        self.type = vehicle.type.rawValue
        self.make = vehicle.make
        self.model = vehicle.model
        self.year = Int32(vehicle.year)
        self.vin = vehicle.vin
        self.licensePlate = vehicle.licensePlate
        self.status = vehicle.status.rawValue
        self.latitude = vehicle.location.lat
        self.longitude = vehicle.location.lng
        self.locationAddress = vehicle.location.address
        self.region = vehicle.region
        self.department = vehicle.department
        self.fuelLevel = vehicle.fuelLevel
        self.fuelType = vehicle.fuelType.rawValue
        self.mileage = vehicle.mileage
        self.hoursUsed = vehicle.hoursUsed ?? 0
        self.assignedDriver = vehicle.assignedDriver
        self.ownership = vehicle.ownership.rawValue
        self.lastService = vehicle.lastService
        self.nextService = vehicle.nextService
        self.alertsData = vehicle.alerts as NSArray
        self.tags = vehicle.tags as NSArray?
        self.lastModified = Date()
        self.syncStatus = SyncStatus.pending.rawValue
    }

    /// Create new entity from Vehicle model
    static func create(from vehicle: Vehicle, in context: NSManagedObjectContext) -> VehicleEntity {
        let entity = VehicleEntity(context: context)
        entity.update(from: vehicle, context: context)
        entity.createdAt = Date()
        return entity
    }
}

// MARK: - Vehicle Repository
public class VehicleRepository {
    private let persistence = DataPersistenceManager.shared

    // MARK: - CRUD Operations

    /// Fetch all vehicles
    public func fetchAll() throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "number", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }

    /// Fetch vehicle by ID
    public func fetch(byId id: String) throws -> Vehicle? {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id)
        fetchRequest.fetchLimit = 1

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.first?.toVehicle()
    }

    /// Fetch vehicles by status
    public func fetch(byStatus status: VehicleStatus) throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "status == %@", status.rawValue)
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "number", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }

    /// Fetch vehicles by type
    public func fetch(byType type: VehicleType) throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "type == %@", type.rawValue)
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "number", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }

    /// Fetch vehicles with low fuel
    public func fetchLowFuelVehicles() throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "fuelLevel < 0.25")
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "fuelLevel", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }

    /// Fetch vehicles with service due
    public func fetchServiceDueVehicles() throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "alertsData.@count > 0")
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "nextService", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }

    /// Save or update vehicle
    public func save(_ vehicle: Vehicle) throws {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", vehicle.id)
        fetchRequest.fetchLimit = 1

        let context = persistence.viewContext
        let existingEntities = try context.fetch(fetchRequest)

        if let existing = existingEntities.first {
            existing.update(from: vehicle, context: context)
        } else {
            _ = VehicleEntity.create(from: vehicle, in: context)
        }

        try persistence.save()
    }

    /// Save multiple vehicles (batch operation)
    public func saveAll(_ vehicles: [Vehicle]) throws {
        let context = persistence.viewContext

        for vehicle in vehicles {
            let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "id == %@", vehicle.id)
            fetchRequest.fetchLimit = 1

            let existingEntities = try context.fetch(fetchRequest)

            if let existing = existingEntities.first {
                existing.update(from: vehicle, context: context)
            } else {
                _ = VehicleEntity.create(from: vehicle, in: context)
            }
        }

        try persistence.save()
    }

    /// Delete vehicle
    public func delete(_ vehicle: Vehicle) throws {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", vehicle.id)
        fetchRequest.fetchLimit = 1

        let context = persistence.viewContext
        let entities = try context.fetch(fetchRequest)

        if let entity = entities.first {
            try persistence.delete(entity)
        }
    }

    /// Delete all vehicles
    public func deleteAll() throws {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = VehicleEntity.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        try persistence.viewContext.execute(deleteRequest)
        try persistence.save()
    }

    // MARK: - Statistics

    /// Get vehicle count by status
    public func countByStatus() throws -> [VehicleStatus: Int] {
        var counts: [VehicleStatus: Int] = [:]

        for status in VehicleStatus.allCases {
            let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "status == %@", status.rawValue)

            let count = try persistence.viewContext.count(for: fetchRequest)
            counts[status] = count
        }

        return counts
    }

    /// Get total mileage across all vehicles
    public func totalMileage() throws -> Double {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        let entities = try persistence.viewContext.fetch(fetchRequest)

        return entities.reduce(0.0) { $0 + $1.mileage }
    }

    /// Get average fuel level
    public func averageFuelLevel() throws -> Double {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        let entities = try persistence.viewContext.fetch(fetchRequest)

        guard !entities.isEmpty else { return 0 }

        let totalFuel = entities.reduce(0.0) { $0 + $1.fuelLevel }
        return totalFuel / Double(entities.count)
    }
}

// MARK: - Vehicle Sync Service
public class VehicleSyncService {
    private let repository = VehicleRepository()
    private let persistence = DataPersistenceManager.shared

    /// Sync vehicles from API
    public func syncFromAPI(vehicles: [Vehicle]) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            persistence.performBackgroundTask { context in
                do {
                    for vehicle in vehicles {
                        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
                        fetchRequest.predicate = NSPredicate(format: "id == %@", vehicle.id)
                        fetchRequest.fetchLimit = 1

                        let existingEntities = try context.fetch(fetchRequest)

                        if let existing = existingEntities.first {
                            existing.update(from: vehicle, context: context)
                            existing.syncStatus = SyncStatus.synced.rawValue
                        } else {
                            let entity = VehicleEntity.create(from: vehicle, in: context)
                            entity.syncStatus = SyncStatus.synced.rawValue
                        }
                    }

                    if context.hasChanges {
                        try context.save()
                    }

                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    /// Get pending vehicles to sync
    public func getPendingSync() throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "syncStatus == %@", SyncStatus.pending.rawValue)

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }

    /// Mark vehicle as synced
    public func markAsSynced(_ vehicleId: String) throws {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", vehicleId)
        fetchRequest.fetchLimit = 1

        let context = persistence.viewContext
        let entities = try context.fetch(fetchRequest)

        if let entity = entities.first {
            entity.syncStatus = SyncStatus.synced.rawValue
            entity.lastSynced = Date()
            try persistence.save()
        }
    }
}

// MARK: - Vehicle Search
public extension VehicleRepository {
    /// Search vehicles by query (number, make, model, VIN)
    func search(query: String) throws -> [Vehicle] {
        let fetchRequest: NSFetchRequest<VehicleEntity> = VehicleEntity.fetchRequest()

        let predicates = [
            NSPredicate(format: "number CONTAINS[cd] %@", query),
            NSPredicate(format: "make CONTAINS[cd] %@", query),
            NSPredicate(format: "model CONTAINS[cd] %@", query),
            NSPredicate(format: "vin CONTAINS[cd] %@", query),
            NSPredicate(format: "licensePlate CONTAINS[cd] %@", query)
        ]

        fetchRequest.predicate = NSCompoundPredicate(orPredicateWithSubpredicates: predicates)
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "number", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toVehicle() }
    }
}
