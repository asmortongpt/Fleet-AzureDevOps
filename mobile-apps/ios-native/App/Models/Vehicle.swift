import Foundation

// MARK: - Vehicle Model
public struct Vehicle: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let number: String
    public let type: VehicleType
    public let make: String
    public let model: String
    public let year: Int
    public let vin: String
    public let licensePlate: String
    public var status: VehicleStatus
    public var location: VehicleLocation
    public let region: String
    public let department: String
    public var fuelLevel: Double
    public let fuelType: FuelType
    public var mileage: Double
    public var hoursUsed: Double?
    public var assignedDriver: String?
    public let ownership: OwnershipType
    public let lastService: String
    public let nextService: String
    public var alerts: [String]
    public var customFields: [String: AnyCodable]?
    public var tags: [String]?

    // Computed properties
    public var statusColor: String {
        switch status {
        case .active: return "green"
        case .idle: return "gray"
        case .charging: return "blue"
        case .service: return "orange"
        case .emergency: return "red"
        case .offline: return "darkgray"
        }
    }

    public var fuelLevelPercentage: Int {
        Int(fuelLevel * 100)
    }

    public var isLowFuel: Bool {
        fuelLevel < 0.25
    }

    public var isServiceDue: Bool {
        !alerts.isEmpty
    }
}

// MARK: - Vehicle Type
public enum VehicleType: String, Codable, CaseIterable {
    case sedan
    case suv
    case truck
    case van
    case emergency
    case specialty
    case tractor
    case forklift
    case trailer
    case construction
    case bus
    case motorcycle

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .sedan: return "car.fill"
        case .suv: return "car.fill"
        case .truck: return "truck.box.fill"
        case .van: return "van.fill"
        case .emergency: return "cross.case.fill"
        case .specialty: return "gearshape.fill"
        case .tractor: return "tractor"
        case .forklift: return "fork.knife"
        case .trailer: return "box.truck.fill"
        case .construction: return "hammer.fill"
        case .bus: return "bus.fill"
        case .motorcycle: return "bicycle"
        }
    }
}

// MARK: - Vehicle Status
public enum VehicleStatus: String, Codable, CaseIterable {
    case active
    case idle
    case charging
    case service
    case emergency
    case offline

    public var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Fuel Type
public enum FuelType: String, Codable, CaseIterable {
    case gasoline
    case diesel
    case electric
    case hybrid
    case cng
    case propane

    public var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Ownership Type
public enum OwnershipType: String, Codable, CaseIterable {
    case owned
    case leased
    case rented

    public var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Vehicle Location
public struct VehicleLocation: Codable, Equatable {
    public let lat: Double
    public let lng: Double
    public let address: String
}

// MARK: - Vehicle Inspection
struct VehicleInspection: Codable, Identifiable {
    public let id: String
    public let vehicleId: String
    public let inspectorName: String
    public let inspectionDate: Date
    public var status: InspectionStatus
    public var items: [InspectionItem]
    public var photos: [InspectionPhoto]
    public var notes: String?
    public var signature: String?
    public var mileageAtInspection: Double

    public var completionPercentage: Int {
        let completedItems = items.filter { $0.status != .pending }.count
        guard !items.isEmpty else { return 0 }
        return Int((Double(completedItems) / Double(items.count)) * 100)
    }

    public var hasFailedItems: Bool {
        items.contains { $0.status == .failed }
    }
}

// MARK: - Inspection Status
enum InspectionStatus: String, Codable {
    case pending
    case inProgress = "in_progress"
    case completed
    case failed
}

// MARK: - Inspection Item
struct InspectionItem: Codable, Identifiable {
    public let id: String
    public let category: InspectionCategory
    public let name: String
    public let description: String
    public var status: InspectionItemStatus
    public var notes: String?
    public var photoIds: [String]?
}

// MARK: - Inspection Category
enum InspectionCategory: String, Codable, CaseIterable {
    case exterior = "Exterior"
    case interior = "Interior"
    case engine = "Engine"
    case tires = "Tires"
    case brakes = "Brakes"
    case lights = "Lights"
    case fluids = "Fluids"
    case safety = "Safety"
    case electronics = "Electronics"

    public var icon: String {
        switch self {
        case .exterior: return "car.fill"
        case .interior: return "person.fill"
        case .engine: return "engine.combustion.fill"
        case .tires: return "circle.grid.cross.fill"
        case .brakes: return "hand.raised.fill"
        case .lights: return "lightbulb.fill"
        case .fluids: return "drop.fill"
        case .safety: return "shield.fill"
        case .electronics: return "bolt.fill"
        }
    }
}

// MARK: - Inspection Item Status
enum InspectionItemStatus: String, Codable {
    case pending
    case passed
    case failed
    case needsAttention = "needs_attention"
}

// MARK: - Inspection Photo
struct InspectionPhoto: Codable, Identifiable {
    public let id: String
    public let imageData: Data
    public let category: InspectionCategory
    public let timestamp: Date
    public var notes: String?
}

// MARK: - AnyCodable for dynamic fields
public struct AnyCodable: Codable, Equatable {
    public let value: Any

    init(_ value: Any) {
        self.value = value
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
        } else if let stringValue = try? container.decode(String.self) {
            value = stringValue
        } else if let boolValue = try? container.decode(Bool.self) {
            value = boolValue
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        if let intValue = value as? Int {
            try container.encode(intValue)
        } else if let doubleValue = value as? Double {
            try container.encode(doubleValue)
        } else if let stringValue = value as? String {
            try container.encode(stringValue)
        } else if let boolValue = value as? Bool {
            try container.encode(boolValue)
        }
    }

    public static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        String(describing: lhs.value) == String(describing: rhs.value)
    }
}

// MARK: - API Response Models
struct VehiclesResponse: Codable {
    public let vehicles: [Vehicle]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

struct VehicleResponse: Codable {
    public let vehicle: Vehicle
}
