//
//  WorkOrder.swift
//  Fleet Manager - iOS Native App
//
//  Work Order Management models for tracking vehicle maintenance and repairs
//

import Foundation

// MARK: - Work Order Model
public struct WorkOrder: Codable, Identifiable, Equatable {
    public let id: String
    public let woNumber: String
    public let vehicleId: String
    public var vehicleNumber: String?
    public var vehicleMake: String?
    public var vehicleModel: String?
    public var type: WorkOrderType
    public var status: WorkOrderStatus
    public var priority: WorkOrderPriority
    public var description: String
    public var assignedTechId: String?
    public var assignedTechName: String?
    public var createdDate: Date
    public var scheduledDate: Date?
    public var startedDate: Date?
    public var completedDate: Date?
    public var dueDate: Date?
    public var mileageAtStart: Double?
    public var mileageAtComplete: Double?
    public var hoursWorked: Double
    public var laborRate: Double
    public var parts: [WorkOrderPart]
    public var photos: [WorkOrderPhoto]
    public var notes: [WorkOrderNote]
    public var createdBy: String
    public var lastModified: Date

    public init(
        id: String = UUID().uuidString,
        woNumber: String,
        vehicleId: String,
        vehicleNumber: String? = nil,
        vehicleMake: String? = nil,
        vehicleModel: String? = nil,
        type: WorkOrderType,
        status: WorkOrderStatus = .open,
        priority: WorkOrderPriority = .normal,
        description: String,
        assignedTechId: String? = nil,
        assignedTechName: String? = nil,
        createdDate: Date = Date(),
        scheduledDate: Date? = nil,
        startedDate: Date? = nil,
        completedDate: Date? = nil,
        dueDate: Date? = nil,
        mileageAtStart: Double? = nil,
        mileageAtComplete: Double? = nil,
        hoursWorked: Double = 0,
        laborRate: Double = 75.0,
        parts: [WorkOrderPart] = [],
        photos: [WorkOrderPhoto] = [],
        notes: [WorkOrderNote] = [],
        createdBy: String,
        lastModified: Date = Date()
    ) {
        self.id = id
        self.woNumber = woNumber
        self.vehicleId = vehicleId
        self.vehicleNumber = vehicleNumber
        self.vehicleMake = vehicleMake
        self.vehicleModel = vehicleModel
        self.type = type
        self.status = status
        self.priority = priority
        self.description = description
        self.assignedTechId = assignedTechId
        self.assignedTechName = assignedTechName
        self.createdDate = createdDate
        self.scheduledDate = scheduledDate
        self.startedDate = startedDate
        self.completedDate = completedDate
        self.dueDate = dueDate
        self.mileageAtStart = mileageAtStart
        self.mileageAtComplete = mileageAtComplete
        self.hoursWorked = hoursWorked
        self.laborRate = laborRate
        self.parts = parts
        self.photos = photos
        self.notes = notes
        self.createdBy = createdBy
        self.lastModified = lastModified
    }

    // MARK: - Computed Properties

    public var totalPartsCost: Double {
        parts.reduce(0.0) { $0 + $1.totalCost }
    }

    public var totalLaborCost: Double {
        hoursWorked * laborRate
    }

    public var totalCost: Double {
        totalPartsCost + totalLaborCost
    }

    public var formattedTotalCost: String {
        formatCurrency(totalCost)
    }

    public var isOverdue: Bool {
        guard status != .completed && status != .cancelled,
              let due = dueDate else { return false }
        return Date() > due
    }

    public var daysOpen: Int {
        let start = startedDate ?? createdDate
        return Calendar.current.dateComponents([.day], from: start, to: Date()).day ?? 0
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Work Order Type
public enum WorkOrderType: String, Codable, CaseIterable {
    case preventiveMaintenance = "Preventive Maintenance"
    case repair = "Repair"
    case inspection = "Inspection"
    case diagnostics = "Diagnostics"
    case bodyWork = "Body Work"
    case electrical = "Electrical"
    case engineWork = "Engine Work"
    case transmission = "Transmission"
    case brakes = "Brakes"
    case tires = "Tires"
    case hvac = "HVAC"
    case suspension = "Suspension"
    case recall = "Recall"
    case modification = "Modification"
    case other = "Other"

    public var icon: String {
        switch self {
        case .preventiveMaintenance: return "calendar.badge.clock"
        case .repair: return "wrench.and.screwdriver"
        case .inspection: return "checkmark.shield"
        case .diagnostics: return "stethoscope"
        case .bodyWork: return "car.fill"
        case .electrical: return "bolt.fill"
        case .engineWork: return "engine.combustion.fill"
        case .transmission: return "gearshape.2.fill"
        case .brakes: return "hand.raised.fill"
        case .tires: return "circle.grid.cross.fill"
        case .hvac: return "snowflake"
        case .suspension: return "figure.walk"
        case .recall: return "arrow.triangle.2.circlepath"
        case .modification: return "slider.horizontal.3"
        case .other: return "wrench.fill"
        }
    }
}

// MARK: - Work Order Status
public enum WorkOrderStatus: String, Codable, CaseIterable {
    case open = "Open"
    case assigned = "Assigned"
    case inProgress = "In Progress"
    case onHold = "On Hold"
    case awaitingParts = "Awaiting Parts"
    case completed = "Completed"
    case cancelled = "Cancelled"

    public var color: String {
        switch self {
        case .open: return "gray"
        case .assigned: return "blue"
        case .inProgress: return "orange"
        case .onHold: return "yellow"
        case .awaitingParts: return "purple"
        case .completed: return "green"
        case .cancelled: return "red"
        }
    }

    public var icon: String {
        switch self {
        case .open: return "doc.badge.plus"
        case .assigned: return "person.badge.clock"
        case .inProgress: return "gearshape.2"
        case .onHold: return "pause.circle"
        case .awaitingParts: return "box.truck"
        case .completed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }
}

// MARK: - Work Order Priority
public enum WorkOrderPriority: String, Codable, CaseIterable {
    case low = "Low"
    case normal = "Normal"
    case high = "High"
    case urgent = "Urgent"
    case emergency = "Emergency"

    public var color: String {
        switch self {
        case .low: return "gray"
        case .normal: return "blue"
        case .high: return "orange"
        case .urgent: return "red"
        case .emergency: return "purple"
        }
    }

    public var icon: String {
        switch self {
        case .low: return "arrow.down.circle"
        case .normal: return "equal.circle"
        case .high: return "arrow.up.circle"
        case .urgent: return "exclamationmark.circle"
        case .emergency: return "exclamationmark.triangle.fill"
        }
    }

    public var sortOrder: Int {
        switch self {
        case .emergency: return 0
        case .urgent: return 1
        case .high: return 2
        case .normal: return 3
        case .low: return 4
        }
    }
}

// MARK: - Work Order Part
public struct WorkOrderPart: Codable, Identifiable, Equatable {
    public let id: String
    public var partNumber: String
    public var name: String
    public var description: String?
    public var quantity: Int
    public var unitCost: Double
    public var supplier: String?
    public var orderDate: Date?
    public var receivedDate: Date?
    public var warranty: String?

    public init(
        id: String = UUID().uuidString,
        partNumber: String,
        name: String,
        description: String? = nil,
        quantity: Int = 1,
        unitCost: Double,
        supplier: String? = nil,
        orderDate: Date? = nil,
        receivedDate: Date? = nil,
        warranty: String? = nil
    ) {
        self.id = id
        self.partNumber = partNumber
        self.name = name
        self.description = description
        self.quantity = quantity
        self.unitCost = unitCost
        self.supplier = supplier
        self.orderDate = orderDate
        self.receivedDate = receivedDate
        self.warranty = warranty
    }

    public var totalCost: Double {
        Double(quantity) * unitCost
    }

    public var formattedUnitCost: String {
        formatCurrency(unitCost)
    }

    public var formattedTotalCost: String {
        formatCurrency(totalCost)
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Work Order Photo
public struct WorkOrderPhoto: Codable, Identifiable, Equatable {
    public let id: String
    public let fileName: String
    public var imageUrl: String?
    public var imageData: Data?
    public var caption: String?
    public var timestamp: Date
    public var uploadedBy: String

    public init(
        id: String = UUID().uuidString,
        fileName: String,
        imageUrl: String? = nil,
        imageData: Data? = nil,
        caption: String? = nil,
        timestamp: Date = Date(),
        uploadedBy: String
    ) {
        self.id = id
        self.fileName = fileName
        self.imageUrl = imageUrl
        self.imageData = imageData
        self.caption = caption
        self.timestamp = timestamp
        self.uploadedBy = uploadedBy
    }
}

// MARK: - Work Order Note
public struct WorkOrderNote: Codable, Identifiable, Equatable {
    public let id: String
    public var text: String
    public var timestamp: Date
    public var author: String
    public var isSystemNote: Bool

    public init(
        id: String = UUID().uuidString,
        text: String,
        timestamp: Date = Date(),
        author: String,
        isSystemNote: Bool = false
    ) {
        self.id = id
        self.text = text
        self.timestamp = timestamp
        self.author = author
        self.isSystemNote = isSystemNote
    }
}

// MARK: - Technician Model
public struct Technician: Codable, Identifiable, Equatable {
    public let id: String
    public let name: String
    public let email: String
    public var phone: String?
    public var specialization: [String]
    public var certifications: [String]
    public var activeWorkOrders: Int
    public var isAvailable: Bool

    public init(
        id: String = UUID().uuidString,
        name: String,
        email: String,
        phone: String? = nil,
        specialization: [String] = [],
        certifications: [String] = [],
        activeWorkOrders: Int = 0,
        isAvailable: Bool = true
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.phone = phone
        self.specialization = specialization
        self.certifications = certifications
        self.activeWorkOrders = activeWorkOrders
        self.isAvailable = isAvailable
    }
}
