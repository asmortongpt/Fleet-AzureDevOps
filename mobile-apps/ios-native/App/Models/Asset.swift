import Foundation

// MARK: - Asset Model
public struct Asset: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let number: String
    public let type: AssetType
    public let name: String
    public let description: String?
    public let serialNumber: String?
    public let make: String?
    public let model: String?
    public var status: AssetStatus
    public var condition: AssetCondition
    public var location: AssetLocation
    public var assignedTo: AssignmentInfo?
    public let purchaseDate: String?
    public let purchaseCost: Double?
    public let lastInspection: String?
    public let nextInspection: String?
    public var photos: [String]?
    public var documents: [String]?
    public var customFields: [String: AnyCodable]?

    // Computed properties
    public var statusColor: String {
        switch status {
        case .available: return "green"
        case .inUse: return "blue"
        case .maintenance: return "orange"
        case .retired: return "gray"
        }
    }

    public var conditionColor: String {
        switch condition {
        case .excellent: return "green"
        case .good: return "blue"
        case .fair: return "orange"
        case .poor: return "red"
        }
    }

    public var isInspectionDue: Bool {
        guard let nextInspection = nextInspection else { return false }

        let dateFormatter = ISO8601DateFormatter()
        guard let dueDate = dateFormatter.date(from: nextInspection) else { return false }

        return dueDate < Date()
    }
}

// MARK: - Asset Type
public enum AssetType: String, Codable, CaseIterable {
    case trailer
    case equipment
    case tool
    case container
    case generator
    case pump
    case compressor
    case other

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .trailer: return "truck.box.fill"
        case .equipment: return "wrench.and.screwdriver.fill"
        case .tool: return "hammer.fill"
        case .container: return "cube.box.fill"
        case .generator: return "bolt.fill"
        case .pump: return "drop.fill"
        case .compressor: return "fan.fill"
        case .other: return "cube.fill"
        }
    }
}

// MARK: - Asset Status
public enum AssetStatus: String, Codable, CaseIterable {
    case available
    case inUse = "in_use"
    case maintenance
    case retired

    public var displayName: String {
        switch self {
        case .available: return "Available"
        case .inUse: return "In Use"
        case .maintenance: return "Maintenance"
        case .retired: return "Retired"
        }
    }

    public var icon: String {
        switch self {
        case .available: return "checkmark.circle.fill"
        case .inUse: return "arrow.right.circle.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .retired: return "xmark.circle.fill"
        }
    }
}

// MARK: - Asset Condition
public enum AssetCondition: String, Codable, CaseIterable {
    case excellent
    case good
    case fair
    case poor

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .excellent: return "star.fill"
        case .good: return "hand.thumbsup.fill"
        case .fair: return "minus.circle.fill"
        case .poor: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - Asset Location
public struct AssetLocation: Codable, Equatable {
    public let lat: Double?
    public let lng: Double?
    public let address: String?
    public let facility: String?

    public var displayText: String {
        if let facility = facility, !facility.isEmpty {
            return facility
        }
        if let address = address, !address.isEmpty {
            return address
        }
        return "Unknown Location"
    }
}

// MARK: - Assignment Info
public struct AssignmentInfo: Codable, Equatable {
    public let type: AssignmentType
    public let id: String
    public let name: String
    public let date: String

    public enum AssignmentType: String, Codable {
        case vehicle
        case person
        case location
    }

    public var displayText: String {
        switch type {
        case .vehicle: return "Vehicle: \(name)"
        case .person: return "Person: \(name)"
        case .location: return "Location: \(name)"
        }
    }
}

// MARK: - Asset Specifications
public struct AssetSpecifications: Codable {
    public let dimensions: Dimensions?
    public let weight: Weight?
    public let capacity: String?
    public let customSpecs: [String: AnyCodable]?
}

public struct Dimensions: Codable {
    public let length: Double
    public let width: Double
    public let height: Double
    public let unit: String

    public var displayText: String {
        "\(length) x \(width) x \(height) \(unit)"
    }
}

public struct Weight: Codable {
    public let value: Double
    public let unit: String

    public var displayText: String {
        "\(value) \(unit)"
    }
}

// MARK: - Asset Maintenance Record
public struct AssetMaintenanceRecord: Codable, Identifiable {
    public let id: String
    public let assetId: String
    public let date: String
    public let type: MaintenanceType
    public let description: String
    public let technician: String?
    public let cost: Double?
    public let notes: String?

    public enum MaintenanceType: String, Codable {
        case inspection
        case repair
        case service
        case calibration
        case replacement
    }
}

// MARK: - Asset History Entry
public struct AssetHistoryEntry: Codable, Identifiable {
    public let id: String
    public let assetId: String
    public let timestamp: String
    public let action: HistoryAction
    public let performedBy: String
    public let details: String?

    public enum HistoryAction: String, Codable {
        case created
        case assigned
        case unassigned
        case statusChanged = "status_changed"
        case inspected
        case maintained
        case relocated
    }
}

// MARK: - API Response Models
public struct AssetsResponse: Codable {
    public let assets: [Asset]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct AssetResponse: Codable {
    public let asset: Asset
}

public struct AssetCreateRequest: Codable {
    public let number: String
    public let type: AssetType
    public let name: String
    public let description: String?
    public let serialNumber: String?
    public let make: String?
    public let model: String?
    public let status: AssetStatus
    public let condition: AssetCondition
    public let location: AssetLocation
    public let purchaseDate: String?
    public let purchaseCost: Double?
}

public struct AssetUpdateRequest: Codable {
    public let status: AssetStatus?
    public let condition: AssetCondition?
    public let location: AssetLocation?
    public let assignedTo: AssignmentInfo?
    public let lastInspection: String?
    public let nextInspection: String?
}
