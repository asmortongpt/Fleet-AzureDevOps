//
//  MaintenanceModel.swift
//  Fleet Manager - iOS Native App
//
//  Core Data entities and persistence layer for Maintenance records
//  Supports offline maintenance tracking with CloudKit sync
//

import Foundation
import CoreData
import CloudKit

// MARK: - Maintenance Record Model
public struct MaintenanceRecord: Codable, Identifiable {
    public let id: String
    public let vehicleId: String
    public var vehicleNumber: String?
    public let type: MaintenanceType
    public let category: MaintenanceCategory
    public var scheduledDate: Date
    public var completedDate: Date?
    public var status: MaintenanceStatus
    public var priority: MaintenancePriority
    public var description: String
    public var cost: Double?
    public var mileageAtService: Double?
    public var hoursAtService: Double?
    public var servicedBy: String?
    public var serviceProvider: String?
    public var location: String?
    public var notes: String?
    public var parts: [MaintenancePart]?
    public var attachments: [String]? // URLs or file paths
    public var nextServiceMileage: Double?
    public var nextServiceDate: Date?
    public var createdAt: Date
    public var lastModified: Date

    public init(
        id: String = UUID().uuidString,
        vehicleId: String,
        vehicleNumber: String? = nil,
        type: MaintenanceType,
        category: MaintenanceCategory,
        scheduledDate: Date,
        completedDate: Date? = nil,
        status: MaintenanceStatus = .scheduled,
        priority: MaintenancePriority = .normal,
        description: String,
        cost: Double? = nil,
        mileageAtService: Double? = nil,
        hoursAtService: Double? = nil,
        servicedBy: String? = nil,
        serviceProvider: String? = nil,
        location: String? = nil,
        notes: String? = nil,
        parts: [MaintenancePart]? = nil,
        attachments: [String]? = nil,
        nextServiceMileage: Double? = nil,
        nextServiceDate: Date? = nil,
        createdAt: Date = Date(),
        lastModified: Date = Date()
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.vehicleNumber = vehicleNumber
        self.type = type
        self.category = category
        self.scheduledDate = scheduledDate
        self.completedDate = completedDate
        self.status = status
        self.priority = priority
        self.description = description
        self.cost = cost
        self.mileageAtService = mileageAtService
        self.hoursAtService = hoursAtService
        self.servicedBy = servicedBy
        self.serviceProvider = serviceProvider
        self.location = location
        self.notes = notes
        self.parts = parts
        self.attachments = attachments
        self.nextServiceMileage = nextServiceMileage
        self.nextServiceDate = nextServiceDate
        self.createdAt = createdAt
        self.lastModified = lastModified
    }

    public var isOverdue: Bool {
        guard status != .completed && status != .cancelled else { return false }
        return Date() > scheduledDate
    }

    public var formattedCost: String {
        guard let cost = cost else { return "N/A" }
        return String(format: "$%.2f", cost)
    }

    public var totalPartsCost: Double {
        parts?.reduce(0.0) { $0 + $1.cost } ?? 0.0
    }
}

// MARK: - Maintenance Type
public enum MaintenanceType: String, Codable, CaseIterable {
    case preventive = "Preventive"
    case corrective = "Corrective"
    case predictive = "Predictive"
    case emergency = "Emergency"
    case inspection = "Inspection"
    case recall = "Recall"

    public var icon: String {
        switch self {
        case .preventive: return "calendar.badge.clock"
        case .corrective: return "wrench.and.screwdriver"
        case .predictive: return "chart.line.uptrend.xyaxis"
        case .emergency: return "exclamationmark.triangle.fill"
        case .inspection: return "checkmark.shield"
        case .recall: return "arrow.triangle.2.circlepath"
        }
    }
}

// MARK: - Maintenance Category
public enum MaintenanceCategory: String, Codable, CaseIterable {
    case oilChange = "Oil Change"
    case tireRotation = "Tire Rotation"
    case brakeService = "Brake Service"
    case batteryReplacement = "Battery Replacement"
    case engineRepair = "Engine Repair"
    case transmission = "Transmission"
    case suspension = "Suspension"
    case electrical = "Electrical"
    case hvac = "HVAC"
    case bodyWork = "Body Work"
    case interior = "Interior"
    case safety = "Safety"
    case diagnostic = "Diagnostic"
    case fluid = "Fluid Service"
    case filter = "Filter Replacement"
    case beltsHoses = "Belts & Hoses"
    case exhaust = "Exhaust System"
    case cooling = "Cooling System"
    case fuel = "Fuel System"
    case other = "Other"

    public var icon: String {
        switch self {
        case .oilChange: return "drop.fill"
        case .tireRotation: return "circle.grid.cross.fill"
        case .brakeService: return "hand.raised.fill"
        case .batteryReplacement: return "battery.100"
        case .engineRepair: return "engine.combustion.fill"
        case .transmission: return "gearshape.2.fill"
        case .suspension: return "figure.walk"
        case .electrical: return "bolt.fill"
        case .hvac: return "snowflake"
        case .bodyWork: return "car.fill"
        case .interior: return "chair.fill"
        case .safety: return "shield.fill"
        case .diagnostic: return "stethoscope"
        case .fluid: return "drop.triangle.fill"
        case .filter: return "air.purifier.fill"
        case .beltsHoses: return "link"
        case .exhaust: return "smoke.fill"
        case .cooling: return "thermometer"
        case .fuel: return "fuelpump.fill"
        case .other: return "wrench.fill"
        }
    }
}

// MARK: - Maintenance Status
public enum MaintenanceStatus: String, Codable, CaseIterable {
    case scheduled = "Scheduled"
    case inProgress = "In Progress"
    case completed = "Completed"
    case cancelled = "Cancelled"
    case delayed = "Delayed"
    case onHold = "On Hold"
    case overdue = "Overdue"

    public var color: String {
        switch self {
        case .scheduled: return "blue"
        case .inProgress: return "orange"
        case .completed: return "green"
        case .cancelled: return "gray"
        case .delayed: return "red"
        case .overdue: return "red"
        case .onHold: return "yellow"
        }
    }
}

// MARK: - Maintenance Priority
public enum MaintenancePriority: String, Codable, CaseIterable {
    case low = "Low"
    case normal = "Normal"
    case high = "High"
    case urgent = "Urgent"
    case critical = "Critical"

    public var color: String {
        switch self {
        case .low: return "gray"
        case .normal: return "blue"
        case .high: return "orange"
        case .urgent: return "red"
        case .critical: return "purple"
        }
    }

    public var sortOrder: Int {
        switch self {
        case .critical: return 0
        case .urgent: return 1
        case .high: return 2
        case .normal: return 3
        case .low: return 4
        }
    }
}

// MARK: - Maintenance Part
public struct MaintenancePart: Codable, Identifiable {
    public let id: String
    public var name: String
    public var partNumber: String?
    public var quantity: Int
    public var cost: Double
    public var supplier: String?
    public var notes: String?

    public init(
        id: String = UUID().uuidString,
        name: String,
        partNumber: String? = nil,
        quantity: Int = 1,
        cost: Double,
        supplier: String? = nil,
        notes: String? = nil
    ) {
        self.id = id
        self.name = name
        self.partNumber = partNumber
        self.quantity = quantity
        self.cost = cost
        self.supplier = supplier
        self.notes = notes
    }

    public var formattedCost: String {
        String(format: "$%.2f", cost)
    }

    public var totalCost: Double {
        cost * Double(quantity)
    }
}

// MARK: - Maintenance Entity Extension
extension MaintenanceRecordEntity {

    // MARK: - Convenience Methods

    /// Convert Core Data entity to Codable MaintenanceRecord model
    func toMaintenanceRecord() -> MaintenanceRecord? {
        guard let id = id,
              let vehicleId = vehicleId,
              let typeRaw = type,
              let categoryRaw = category,
              let scheduledDate = scheduledDate,
              let statusRaw = status,
              let priorityRaw = priority,
              let description = maintenanceDescription,
              let createdAt = createdAt,
              let lastModified = lastModified else {
            return nil
        }

        // Decode parts
        var parts: [MaintenancePart]? = nil
        if let partsData = partsData,
           let decoded = try? JSONDecoder().decode([MaintenancePart].self, from: partsData) {
            parts = decoded
        }

        // Decode attachments
        var attachments: [String]? = nil
        if let attachmentsData = attachmentsData as? [String] {
            attachments = attachmentsData
        }

        return MaintenanceRecord(
            id: id,
            vehicleId: vehicleId,
            vehicleNumber: vehicleNumber,
            type: MaintenanceType(rawValue: typeRaw) ?? .preventive,
            category: MaintenanceCategory(rawValue: categoryRaw) ?? .other,
            scheduledDate: scheduledDate,
            completedDate: completedDate,
            status: MaintenanceStatus(rawValue: statusRaw) ?? .scheduled,
            priority: MaintenancePriority(rawValue: priorityRaw) ?? .normal,
            description: description,
            cost: cost == 0 ? nil : cost,
            mileageAtService: mileageAtService == 0 ? nil : mileageAtService,
            hoursAtService: hoursAtService == 0 ? nil : hoursAtService,
            servicedBy: servicedBy,
            serviceProvider: serviceProvider,
            location: location,
            notes: notes,
            parts: parts,
            attachments: attachments,
            nextServiceMileage: nextServiceMileage == 0 ? nil : nextServiceMileage,
            nextServiceDate: nextServiceDate,
            createdAt: createdAt,
            lastModified: lastModified
        )
    }

    /// Update entity from Codable MaintenanceRecord model
    func update(from record: MaintenanceRecord, context: NSManagedObjectContext) {
        self.id = record.id
        self.vehicleId = record.vehicleId
        self.vehicleNumber = record.vehicleNumber
        self.type = record.type.rawValue
        self.category = record.category.rawValue
        self.scheduledDate = record.scheduledDate
        self.completedDate = record.completedDate
        self.status = record.status.rawValue
        self.priority = record.priority.rawValue
        self.maintenanceDescription = record.description
        self.cost = record.cost ?? 0
        self.mileageAtService = record.mileageAtService ?? 0
        self.hoursAtService = record.hoursAtService ?? 0
        self.servicedBy = record.servicedBy
        self.serviceProvider = record.serviceProvider
        self.location = record.location
        self.notes = record.notes

        // Encode parts
        if let parts = record.parts,
           let encoded = try? JSONEncoder().encode(parts) {
            self.partsData = encoded
        }

        // Encode attachments
        if let attachments = record.attachments {
            self.attachmentsData = try? JSONEncoder().encode(attachments)
        }

        self.nextServiceMileage = record.nextServiceMileage ?? 0
        self.nextServiceDate = record.nextServiceDate
        self.lastModified = record.lastModified
        self.syncStatus = SyncStatus.pending.rawValue
    }

    /// Create new entity from MaintenanceRecord model
    static func create(from record: MaintenanceRecord, in context: NSManagedObjectContext) -> MaintenanceRecordEntity {
        let entity = MaintenanceRecordEntity(context: context)
        entity.update(from: record, context: context)
        entity.createdAt = record.createdAt
        return entity
    }
}

// MARK: - Maintenance Repository
public class MaintenanceRepository {
    private let persistence = DataPersistenceManager.shared

    // MARK: - CRUD Operations

    /// Fetch all maintenance records
    public func fetchAll() throws -> [MaintenanceRecord] {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "scheduledDate", ascending: false)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Fetch maintenance record by ID
    public func fetch(byId id: String) throws -> MaintenanceRecord? {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", id)
        fetchRequest.fetchLimit = 1

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.first?.toMaintenanceRecord()
    }

    /// Fetch maintenance records by vehicle ID
    public func fetch(byVehicleId vehicleId: String) throws -> [MaintenanceRecord] {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "vehicleId == %@", vehicleId)
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "scheduledDate", ascending: false)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Fetch maintenance records by status
    public func fetch(byStatus status: MaintenanceStatus) throws -> [MaintenanceRecord] {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "status == %@", status.rawValue)
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "scheduledDate", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Fetch maintenance records by priority
    public func fetch(byPriority priority: MaintenancePriority) throws -> [MaintenanceRecord] {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "priority == %@", priority.rawValue)
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "scheduledDate", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Fetch overdue maintenance records
    public func fetchOverdue() throws -> [MaintenanceRecord] {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        let statusPredicate = NSPredicate(format: "status != %@ AND status != %@",
                                         MaintenanceStatus.completed.rawValue,
                                         MaintenanceStatus.cancelled.rawValue)
        let datePredicate = NSPredicate(format: "scheduledDate < %@", Date() as NSDate)
        fetchRequest.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [statusPredicate, datePredicate])
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "scheduledDate", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Fetch upcoming maintenance (next 30 days)
    public func fetchUpcoming(days: Int = 30) throws -> [MaintenanceRecord] {
        let endDate = Calendar.current.date(byAdding: .day, value: days, to: Date()) ?? Date()

        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        let statusPredicate = NSPredicate(format: "status == %@", MaintenanceStatus.scheduled.rawValue)
        let datePredicate = NSPredicate(format: "scheduledDate >= %@ AND scheduledDate <= %@",
                                       Date() as NSDate,
                                       endDate as NSDate)
        fetchRequest.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [statusPredicate, datePredicate])
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "scheduledDate", ascending: true)]

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Save or update maintenance record
    public func save(_ record: MaintenanceRecord) throws {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", record.id)
        fetchRequest.fetchLimit = 1

        let context = persistence.viewContext
        let existingEntities = try context.fetch(fetchRequest)

        if let existing = existingEntities.first {
            existing.update(from: record, context: context)
        } else {
            _ = MaintenanceRecordEntity.create(from: record, in: context)
        }

        try persistence.save()
    }

    /// Delete maintenance record
    public func delete(_ record: MaintenanceRecord) throws {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", record.id)
        fetchRequest.fetchLimit = 1

        let context = persistence.viewContext
        let entities = try context.fetch(fetchRequest)

        if let entity = entities.first {
            try persistence.delete(entity)
        }
    }

    /// Delete all maintenance records
    public func deleteAll() throws {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = MaintenanceRecordEntity.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        try persistence.viewContext.execute(deleteRequest)
        try persistence.save()
    }

    // MARK: - Statistics

    /// Get total maintenance cost
    public func totalCost() throws -> Double {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        let entities = try persistence.viewContext.fetch(fetchRequest)

        return entities.reduce(0.0) { $0 + $1.cost }
    }

    /// Get total maintenance cost for a vehicle
    public func totalCost(forVehicleId vehicleId: String) throws -> Double {
        let records = try fetch(byVehicleId: vehicleId)
        return records.reduce(0.0) { $0 + ($1.cost ?? 0) + $1.totalPartsCost }
    }

    /// Get maintenance count by status
    public func countByStatus() throws -> [MaintenanceStatus: Int] {
        var counts: [MaintenanceStatus: Int] = [:]

        for status in MaintenanceStatus.allCases {
            let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "status == %@", status.rawValue)

            let count = try persistence.viewContext.count(for: fetchRequest)
            counts[status] = count
        }

        return counts
    }

    /// Get maintenance count by category
    public func countByCategory() throws -> [MaintenanceCategory: Int] {
        var counts: [MaintenanceCategory: Int] = [:]

        for category in MaintenanceCategory.allCases {
            let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "category == %@", category.rawValue)

            let count = try persistence.viewContext.count(for: fetchRequest)
            counts[category] = count
        }

        return counts
    }
}

// MARK: - Maintenance Sync Service
public class MaintenanceSyncService {
    private let repository = MaintenanceRepository()
    private let persistence = DataPersistenceManager.shared

    /// Sync maintenance records from API
    public func syncFromAPI(records: [MaintenanceRecord]) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            persistence.performBackgroundTask { context in
                do {
                    for record in records {
                        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
                        fetchRequest.predicate = NSPredicate(format: "id == %@", record.id)
                        fetchRequest.fetchLimit = 1

                        let existingEntities = try context.fetch(fetchRequest)

                        if let existing = existingEntities.first {
                            existing.update(from: record, context: context)
                            existing.syncStatus = SyncStatus.synced.rawValue
                        } else {
                            let entity = MaintenanceRecordEntity.create(from: record, in: context)
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

    /// Get pending maintenance records to sync
    public func getPendingSync() throws -> [MaintenanceRecord] {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "syncStatus == %@", SyncStatus.pending.rawValue)

        let entities = try persistence.viewContext.fetch(fetchRequest)
        return entities.compactMap { $0.toMaintenanceRecord() }
    }

    /// Mark maintenance record as synced
    public func markAsSynced(_ recordId: String) throws {
        let fetchRequest: NSFetchRequest<MaintenanceRecordEntity> = MaintenanceRecordEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %@", recordId)
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
