//
//  Part.swift
//  Fleet Manager
//
//  Parts inventory model for procurement
//

import Foundation

// MARK: - Part Model
public struct Part: Identifiable, Codable, Equatable {
    public let id: String
    public let tenantId: String
    public var partNumber: String
    public var name: String
    public var description: String?
    public var category: PartCategory
    public var manufacturer: String?
    public var vendorId: String?
    public var vendorName: String?
    public var unitPrice: Double
    public var quantityOnHand: Int
    public var reorderPoint: Int
    public var reorderQuantity: Int
    public var location: String?
    public var compatibleVehicles: [String]?
    public var notes: String?
    public var status: PartStatus
    public var createdAt: Date
    public var updatedAt: Date

    // Computed properties
    public var isLowStock: Bool {
        quantityOnHand <= reorderPoint
    }

    public var isOutOfStock: Bool {
        quantityOnHand == 0
    }

    public var stockStatus: String {
        if isOutOfStock {
            return "Out of Stock"
        } else if isLowStock {
            return "Low Stock"
        } else {
            return "In Stock"
        }
    }

    public var stockStatusColor: String {
        if isOutOfStock {
            return "red"
        } else if isLowStock {
            return "orange"
        } else {
            return "green"
        }
    }

    public var totalValue: Double {
        Double(quantityOnHand) * unitPrice
    }

    public var formattedUnitPrice: String {
        String(format: "$%.2f", unitPrice)
    }

    public var formattedTotalValue: String {
        String(format: "$%.2f", totalValue)
    }
}

// MARK: - Part Category
public enum PartCategory: String, Codable, CaseIterable {
    case engine = "Engine"
    case transmission = "Transmission"
    case brakes = "Brakes"
    case suspension = "Suspension"
    case electrical = "Electrical"
    case tires = "Tires"
    case filters = "Filters"
    case fluids = "Fluids"
    case bodyParts = "Body Parts"
    case interior = "Interior"
    case exhaust = "Exhaust"
    case cooling = "Cooling"
    case fuel = "Fuel System"
    case other = "Other"

    public var icon: String {
        switch self {
        case .engine: return "engine.combustion.fill"
        case .transmission: return "gearshape.2.fill"
        case .brakes: return "hand.raised.fill"
        case .suspension: return "arrow.up.arrow.down"
        case .electrical: return "bolt.fill"
        case .tires: return "circle.grid.cross.fill"
        case .filters: return "air.purifier.fill"
        case .fluids: return "drop.fill"
        case .bodyParts: return "car.fill"
        case .interior: return "person.fill"
        case .exhaust: return "smoke.fill"
        case .cooling: return "snowflake"
        case .fuel: return "fuelpump.fill"
        case .other: return "wrench.and.screwdriver.fill"
        }
    }
}

// MARK: - Part Status
public enum PartStatus: String, Codable, CaseIterable {
    case active = "Active"
    case discontinued = "Discontinued"
    case obsolete = "Obsolete"

    public var displayName: String {
        rawValue
    }
}

// MARK: - Stock Adjustment
public struct StockAdjustment: Identifiable, Codable {
    public let id: String
    public let partId: String
    public let adjustmentType: AdjustmentType
    public let quantity: Int
    public let reason: String
    public let adjustedBy: String
    public let timestamp: Date
    public var notes: String?

    public enum AdjustmentType: String, Codable {
        case received = "Received"
        case used = "Used"
        case damaged = "Damaged"
        case returned = "Returned"
        case transfer = "Transfer"
        case correction = "Correction"
    }
}

// MARK: - Part Usage Record
public struct PartUsageRecord: Identifiable, Codable {
    public let id: String
    public let partId: String
    public let partNumber: String
    public let partName: String
    public let vehicleId: String
    public let vehicleNumber: String
    public let workOrderId: String?
    public let quantityUsed: Int
    public let unitPrice: Double
    public let totalCost: Double
    public let usedDate: Date
    public let technicianName: String?
}

// MARK: - API Response Models
public struct PartsResponse: Codable {
    public let parts: [Part]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct PartResponse: Codable {
    public let part: Part
}

public struct StockAdjustmentsResponse: Codable {
    public let adjustments: [StockAdjustment]
    public let total: Int
}
