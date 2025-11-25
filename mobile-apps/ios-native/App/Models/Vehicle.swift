import Foundation
import CoreLocation

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
    public let lastService: Date
    public let nextService: Date
    public var alerts: [String]
    public var customFields: [String: String]?
    public var tags: [String]?

    // Computed properties
    public var statusColor: String {
        switch status {
        case .active, .moving, .available: return "green"
        case .parked, .reserved: return "blue"
        case .inactive, .offline: return "gray"
        case .maintenance, .service: return "orange"
        case .inUse: return "orange"
        case .idle: return "gray"
        case .charging: return "blue"
        case .emergency: return "red"
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

    public var name: String {
        "\(number) - \(year) \(make) \(model)"
    }

    public var displayLocation: String? {
        location.address
    }

    // Sample data for previews
    public static var sampleAvailable: Vehicle {
        Vehicle(
            id: "1",
            tenantId: "tenant-1",
            number: "FLEET-001",
            type: .truck,
            make: "Ford",
            model: "F-150",
            year: 2023,
            vin: "1FTFW1E85PFA12345",
            licensePlate: "ABC-1234",
            status: .available,
            location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "Main Depot, Tallahassee, FL"),
            region: "North",
            department: "Fleet",
            fuelLevel: 0.75,
            fuelType: .gasoline,
            mileage: 15234,
            hoursUsed: 1250,
            assignedDriver: nil,
            ownership: .owned,
            lastService: Date().addingTimeInterval(-30 * 24 * 60 * 60),
            nextService: Date().addingTimeInterval(30 * 24 * 60 * 60),
            alerts: [],
            customFields: nil,
            tags: ["pickup", "4wd"]
        )
    }

    public static var sampleReserved: Vehicle {
        Vehicle(
            id: "2",
            tenantId: "tenant-1",
            number: "FLEET-002",
            type: .sedan,
            make: "Toyota",
            model: "Camry",
            year: 2024,
            vin: "4T1B11HK5MU123456",
            licensePlate: "XYZ-5678",
            status: .reserved,
            location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "South Station, Tallahassee, FL"),
            region: "South",
            department: "Administration",
            fuelLevel: 0.90,
            fuelType: .hybrid,
            mileage: 8750,
            hoursUsed: 450,
            assignedDriver: "John Doe",
            ownership: .leased,
            lastService: Date().addingTimeInterval(-10 * 24 * 60 * 60),
            nextService: Date().addingTimeInterval(90 * 24 * 60 * 60),
            alerts: [],
            customFields: nil,
            tags: ["hybrid", "fuel-efficient"]
        )
    }

    public static var samples: [Vehicle] {
        [
            Vehicle(
                id: "1",
                tenantId: "tenant-1",
                number: "FLEET-001",
                type: .truck,
                make: "Ford",
                model: "F-150",
                year: 2023,
                vin: "1FTFW1E85PFA12345",
                licensePlate: "ABC-1234",
                status: .available,
                location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "Main Depot"),
                region: "North",
                department: "Fleet",
                fuelLevel: 0.75,
                fuelType: .gasoline,
                mileage: 15234,
                hoursUsed: 1250,
                assignedDriver: nil,
                ownership: .owned,
                lastService: Date().addingTimeInterval(-30 * 24 * 60 * 60),
                nextService: Date().addingTimeInterval(30 * 24 * 60 * 60),
                alerts: [],
                customFields: nil,
                tags: ["pickup", "4wd"]
            ),
            Vehicle(
                id: "2",
                tenantId: "tenant-1",
                number: "FLEET-002",
                type: .sedan,
                make: "Toyota",
                model: "Camry",
                year: 2024,
                vin: "4T1B11HK5MU123456",
                licensePlate: "XYZ-5678",
                status: .available,
                location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "South Station"),
                region: "South",
                department: "Administration",
                fuelLevel: 0.90,
                fuelType: .hybrid,
                mileage: 8750,
                hoursUsed: 450,
                assignedDriver: nil,
                ownership: .leased,
                lastService: Date().addingTimeInterval(-10 * 24 * 60 * 60),
                nextService: Date().addingTimeInterval(90 * 24 * 60 * 60),
                alerts: [],
                customFields: nil,
                tags: ["hybrid", "fuel-efficient"]
            ),
            Vehicle(
                id: "3",
                tenantId: "tenant-1",
                number: "FLEET-003",
                type: .van,
                make: "Ram",
                model: "ProMaster",
                year: 2023,
                vin: "3C6TRVBG3ME123456",
                licensePlate: "GHI-3456",
                status: .maintenance,
                location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "Service Center"),
                region: "North",
                department: "Fleet",
                fuelLevel: 0.20,
                fuelType: .diesel,
                mileage: 45890,
                hoursUsed: 3200,
                assignedDriver: nil,
                ownership: .owned,
                lastService: Date().addingTimeInterval(-1 * 24 * 60 * 60),
                nextService: Date().addingTimeInterval(7 * 24 * 60 * 60),
                alerts: ["Oil Change Due"],
                customFields: nil,
                tags: ["cargo", "high-roof"]
            ),
            Vehicle(
                id: "4",
                tenantId: "tenant-1",
                number: "FLEET-004",
                type: .truck,
                make: "Chevrolet",
                model: "Silverado",
                year: 2022,
                vin: "1GCPYBEN5MZ123456",
                licensePlate: "DEF-9012",
                status: .reserved,
                location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "East Yard"),
                region: "East",
                department: "Fleet",
                fuelLevel: 0.45,
                fuelType: .gasoline,
                mileage: 32156,
                hoursUsed: 2100,
                assignedDriver: "Jane Smith",
                ownership: .owned,
                lastService: Date().addingTimeInterval(-15 * 24 * 60 * 60),
                nextService: Date().addingTimeInterval(60 * 24 * 60 * 60),
                alerts: [],
                customFields: nil,
                tags: ["heavy-duty"]
            )
        ]
    }
}

// MARK: - Vehicle Type
public enum VehicleType: String, Codable, CaseIterable {
    case sedan = "Sedan"
    case suv = "SUV"
    case truck = "Truck"
    case van = "Van"
    case bus = "Bus"
    case equipment = "Equipment"
    case emergency = "Emergency"
    case specialty = "Specialty"
    case tractor = "Tractor"
    case forklift = "Forklift"
    case trailer = "Trailer"
    case construction = "Construction"
    case motorcycle = "Motorcycle"

    public var displayName: String {
        rawValue
    }

    public var icon: String {
        switch self {
        case .sedan: return "car.fill"
        case .suv: return "car.fill"
        case .truck: return "truck.box.fill"
        case .van: return "van.fill"
        case .bus: return "bus.fill"
        case .equipment: return "wrench.and.screwdriver"
        case .emergency: return "cross.case.fill"
        case .specialty: return "gearshape.fill"
        case .tractor: return "tractor"
        case .forklift: return "fork.knife"
        case .trailer: return "box.truck.fill"
        case .construction: return "hammer.fill"
        case .motorcycle: return "bicycle"
        }
    }
}

// MARK: - Vehicle Status
public enum VehicleStatus: String, Codable, CaseIterable {
    case active = "Active"
    case inactive = "Inactive"
    case maintenance = "Maintenance"
    case moving = "Moving"
    case parked = "Parked"
    case offline = "Offline"
    case available = "Available"  // For vehicle request system
    case reserved = "Reserved"    // For vehicle request system
    case inUse = "InUse"         // For vehicle request system
    case idle = "Idle"
    case charging = "Charging"
    case service = "Service"
    case emergency = "Emergency"

    public var displayName: String {
        rawValue
    }

    public var color: String {
        switch self {
        case .active, .available:
            return "green"
        case .moving, .inUse:
            return "orange"
        case .parked, .reserved:
            return "blue"
        case .maintenance, .service:
            return "yellow"
        case .inactive, .offline:
            return "gray"
        case .idle:
            return "gray"
        case .charging:
            return "blue"
        case .emergency:
            return "red"
        }
    }

    public var icon: String {
        switch self {
        case .active, .available:
            return "checkmark.circle.fill"
        case .moving, .inUse:
            return "car.fill"
        case .parked:
            return "p.circle.fill"
        case .reserved:
            return "calendar.badge.clock"
        case .maintenance, .service:
            return "wrench.and.screwdriver.fill"
        case .inactive, .offline:
            return "exclamationmark.triangle.fill"
        case .idle:
            return "pause.circle.fill"
        case .charging:
            return "bolt.fill"
        case .emergency:
            return "exclamationmark.shield.fill"
        }
    }
}

// MARK: - Fuel Type
public enum FuelType: String, Codable, CaseIterable {
    case gasoline = "Gasoline"
    case diesel = "Diesel"
    case electric = "Electric"
    case hybrid = "Hybrid"
    case cng = "CNG"
    case propane = "Propane"

    public var displayName: String {
        rawValue
    }
}

// MARK: - Ownership Type
public enum OwnershipType: String, Codable, CaseIterable {
    case owned = "Owned"
    case leased = "Leased"
    case rental = "Rental"
    case rented = "Rented"

    public var displayName: String {
        rawValue
    }
}

// MARK: - Vehicle Location
public struct VehicleLocation: Codable, Equatable {
    public let lat: Double
    public let lng: Double
    public let address: String

    public var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
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
