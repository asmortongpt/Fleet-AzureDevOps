import Foundation
import CoreData
import CoreLocation

// MARK: - Trip Model
/// Model for tracking vehicle trips with Core Data integration
public struct TripModel: Codable, Identifiable, Hashable {
    public let id: String
    public let vehicleId: String
    public let driverId: String?
    public let startTime: Date
    public var endTime: Date?
    public let startLocation: CLLocationCoordinate2D
    public var endLocation: CLLocationCoordinate2D?
    public var distance: Double // in kilometers
    public var purpose: String?
    public var status: TripStatus
    public var averageSpeed: Double // km/h
    public var maxSpeed: Double // km/h
    public var routePoints: [CLLocationCoordinate2D]

    public enum TripStatus: String, Codable {
        case active = "active"
        case paused = "paused"
        case completed = "completed"
        case cancelled = "cancelled"
    }

    public init(
        id: String = UUID().uuidString,
        vehicleId: String,
        driverId: String? = nil,
        startTime: Date = Date(),
        endTime: Date? = nil,
        startLocation: CLLocationCoordinate2D,
        endLocation: CLLocationCoordinate2D? = nil,
        distance: Double = 0,
        purpose: String? = nil,
        status: TripStatus = .active,
        averageSpeed: Double = 0,
        maxSpeed: Double = 0,
        routePoints: [CLLocationCoordinate2D] = []
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.startTime = startTime
        self.endTime = endTime
        self.startLocation = startLocation
        self.endLocation = endLocation
        self.distance = distance
        self.purpose = purpose
        self.status = status
        self.averageSpeed = averageSpeed
        self.maxSpeed = maxSpeed
        self.routePoints = routePoints
    }

    // MARK: - Computed Properties

    public var duration: TimeInterval {
        let end = endTime ?? Date()
        return end.timeIntervalSince(startTime)
    }

    public var isActive: Bool {
        return status == .active
    }

    public var isCompleted: Bool {
        return status == .completed
    }

    // MARK: - Codable Implementation

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId
        case driverId
        case startTime
        case endTime
        case startLocationLat
        case startLocationLon
        case endLocationLat
        case endLocationLon
        case distance
        case purpose
        case status
        case averageSpeed
        case maxSpeed
        case routePointsData
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        vehicleId = try container.decode(String.self, forKey: .vehicleId)
        driverId = try container.decodeIfPresent(String.self, forKey: .driverId)
        startTime = try container.decode(Date.self, forKey: .startTime)
        endTime = try container.decodeIfPresent(Date.self, forKey: .endTime)

        let startLat = try container.decode(Double.self, forKey: .startLocationLat)
        let startLon = try container.decode(Double.self, forKey: .startLocationLon)
        startLocation = CLLocationCoordinate2D(latitude: startLat, longitude: startLon)

        if let endLat = try container.decodeIfPresent(Double.self, forKey: .endLocationLat),
           let endLon = try container.decodeIfPresent(Double.self, forKey: .endLocationLon) {
            endLocation = CLLocationCoordinate2D(latitude: endLat, longitude: endLon)
        } else {
            endLocation = nil
        }

        distance = try container.decode(Double.self, forKey: .distance)
        purpose = try container.decodeIfPresent(String.self, forKey: .purpose)
        status = try container.decode(TripStatus.self, forKey: .status)
        averageSpeed = try container.decode(Double.self, forKey: .averageSpeed)
        maxSpeed = try container.decode(Double.self, forKey: .maxSpeed)

        if let routeData = try container.decodeIfPresent(Data.self, forKey: .routePointsData) {
            routePoints = (try? JSONDecoder().decode([CoordinateData].self, from: routeData))?.map { $0.coordinate } ?? []
        } else {
            routePoints = []
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)
        try container.encode(vehicleId, forKey: .vehicleId)
        try container.encodeIfPresent(driverId, forKey: .driverId)
        try container.encode(startTime, forKey: .startTime)
        try container.encodeIfPresent(endTime, forKey: .endTime)

        try container.encode(startLocation.latitude, forKey: .startLocationLat)
        try container.encode(startLocation.longitude, forKey: .startLocationLon)

        try container.encodeIfPresent(endLocation?.latitude, forKey: .endLocationLat)
        try container.encodeIfPresent(endLocation?.longitude, forKey: .endLocationLon)

        try container.encode(distance, forKey: .distance)
        try container.encodeIfPresent(purpose, forKey: .purpose)
        try container.encode(status, forKey: .status)
        try container.encode(averageSpeed, forKey: .averageSpeed)
        try container.encode(maxSpeed, forKey: .maxSpeed)

        let coordinateData = routePoints.map { CoordinateData(coordinate: $0) }
        if let data = try? JSONEncoder().encode(coordinateData) {
            try container.encode(data, forKey: .routePointsData)
        }
    }

    // MARK: - Core Data Integration

    /// Convert to Core Data entity
    public func toEntity(context: NSManagedObjectContext) -> TripEntity {
        let entity = TripEntity(context: context)
        entity.id = id
        entity.vehicleId = vehicleId
        entity.driverId = driverId
        entity.startTime = startTime
        entity.endTime = endTime
        entity.startLocation = "\(startLocation.latitude),\(startLocation.longitude)"
        entity.endLocation = endLocation.map { "\($0.latitude),\($0.longitude)" }
        entity.distance = distance
        entity.purpose = purpose
        entity.status = status.rawValue
        entity.averageSpeed = averageSpeed
        entity.maxSpeed = maxSpeed

        // Encode route points as Data
        if let data = try? JSONEncoder().encode(routePoints.map { CoordinateData(coordinate: $0) }) {
            entity.coordinatesData = data
        }

        return entity
    }

    /// Create from Core Data entity
    public static func fromEntity(_ entity: TripEntity) -> TripModel? {
        guard let id = entity.id,
              let vehicleId = entity.vehicleId,
              let startTime = entity.startTime,
              let startLocationString = entity.startLocation,
              let statusString = entity.status else {
            return nil
        }

        let startLocationComponents = startLocationString.split(separator: ",")
        guard startLocationComponents.count == 2,
              let startLat = Double(startLocationComponents[0]),
              let startLon = Double(startLocationComponents[1]) else {
            return nil
        }

        let startLocation = CLLocationCoordinate2D(latitude: startLat, longitude: startLon)

        var endLocation: CLLocationCoordinate2D?
        if let endLocationString = entity.endLocation {
            let endLocationComponents = endLocationString.split(separator: ",")
            if endLocationComponents.count == 2,
               let endLat = Double(endLocationComponents[0]),
               let endLon = Double(endLocationComponents[1]) {
                endLocation = CLLocationCoordinate2D(latitude: endLat, longitude: endLon)
            }
        }

        var routePoints: [CLLocationCoordinate2D] = []
        if let coordinatesData = entity.coordinatesData,
           let coordinates = try? JSONDecoder().decode([CoordinateData].self, from: coordinatesData) {
            routePoints = coordinates.map { $0.coordinate }
        }

        return TripModel(
            id: id,
            vehicleId: vehicleId,
            driverId: entity.driverId,
            startTime: startTime,
            endTime: entity.endTime,
            startLocation: startLocation,
            endLocation: endLocation,
            distance: entity.distance,
            purpose: entity.purpose,
            status: TripStatus(rawValue: statusString) ?? .active,
            averageSpeed: entity.averageSpeed,
            maxSpeed: entity.maxSpeed,
            routePoints: routePoints
        )
    }
}

// MARK: - Helper Struct for Coordinate Encoding
private struct CoordinateData: Codable {
    let latitude: Double
    let longitude: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }
}
