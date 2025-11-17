import Foundation
import CoreLocation

// MARK: - Trip Models Namespace
public enum TripModels {
    // MARK: - Trip Model
    public struct Trip: Codable, Identifiable {
    public let id: UUID
    public var name: String
    public let startTime: Date
    public var endTime: Date?
    public var coordinates: [TripCoordinate]
    public var status: TripStatus
    public var totalDistance: Double // in miles
    public var averageSpeed: Double // in mph
    public var maxSpeed: Double // in mph
    public var pausedDuration: TimeInterval
    public var vehicleId: String?
    public var driverId: String?
    public var notes: String?

    public var duration: TimeInterval {
        let end = endTime ?? Date()
        return end.timeIntervalSince(startTime) - pausedDuration
    }

    public var formattedDistance: String {
        String(format: "%.2f mi", totalDistance)
    }

    public var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        return "\(hours)h \(minutes)m"
    }

    public var formattedAverageSpeed: String {
        String(format: "%.1f mph", averageSpeed)
    }

    init(
        id: UUID = UUID(),
        name: String = "Trip",
        startTime: Date = Date(),
        endTime: Date? = nil,
        coordinates: [TripCoordinate] = [],
        status: TripStatus = .active,
        totalDistance: Double = 0,
        averageSpeed: Double = 0,
        maxSpeed: Double = 0,
        pausedDuration: TimeInterval = 0,
        vehicleId: String? = nil,
        driverId: String? = nil,
        notes: String? = nil
    ) {
        self.id = id
        self.name = name
        self.startTime = startTime
        self.endTime = endTime
        self.coordinates = coordinates
        self.status = status
        self.totalDistance = totalDistance
        self.averageSpeed = averageSpeed
        self.maxSpeed = maxSpeed
        self.pausedDuration = pausedDuration
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.notes = notes
    }
    }

    // MARK: - Trip Status
    public enum TripStatus: String, Codable {
        case active
        case paused
        case completed
        case cancelled

        public var displayName: String {
            switch self {
            case .active: return "Active"
            case .paused: return "Paused"
            case .completed: return "Completed"
            case .cancelled: return "Cancelled"
            }
        }
    }

    // MARK: - Trip Coordinate
    public struct TripCoordinate: Codable, Identifiable {
        public let id: UUID
        public let latitude: Double
        public let longitude: Double
        public let timestamp: Date
        public let speed: Double? // in mph
        public let altitude: Double? // in meters
        public let accuracy: Double? // in meters
        public let course: Double? // in degrees

        init(
            id: UUID = UUID(),
            latitude: Double,
            longitude: Double,
            timestamp: Date = Date(),
            speed: Double? = nil,
            altitude: Double? = nil,
            accuracy: Double? = nil,
            course: Double? = nil
        ) {
            self.id = id
            self.latitude = latitude
            self.longitude = longitude
            self.timestamp = timestamp
            self.speed = speed
            self.altitude = altitude
            self.accuracy = accuracy
            self.course = course
        }

        init(from location: CLLocation) {
            self.id = UUID()
            self.latitude = location.coordinate.latitude
            self.longitude = location.coordinate.longitude
            self.timestamp = location.timestamp
            self.speed = location.speed >= 0 ? location.speed * 2.23694 : nil // Convert m/s to mph
            self.altitude = location.altitude
            self.accuracy = location.horizontalAccuracy
            self.course = location.course >= 0 ? location.course : nil
        }

        public var clLocation: CLLocation {
            CLLocation(
                coordinate: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
                altitude: altitude ?? 0,
                horizontalAccuracy: accuracy ?? 0,
                verticalAccuracy: -1,
                course: course ?? -1,
                speed: (speed ?? 0) / 2.23694, // Convert mph to m/s
                timestamp: timestamp
            )
        }
    }

    // MARK: - Trip Settings
    public struct TripSettings: Codable {
        public var autoDetectTrips: Bool
        public var minimumTripDistance: Double // in miles
        public var minimumTripDuration: TimeInterval // in seconds
        public var locationUpdateInterval: TimeInterval // in seconds
        public var desiredAccuracy: LocationAccuracy
        public var batteryOptimization: Bool

        static let `default` = TripSettings(
            autoDetectTrips: false,
            minimumTripDistance: 0.1, // 0.1 miles
            minimumTripDuration: 60, // 1 minute
            locationUpdateInterval: 5, // 5 seconds
            desiredAccuracy: .best,
            batteryOptimization: true
        )
    }

    // MARK: - Location Accuracy
    public enum LocationAccuracy: String, Codable, CaseIterable {
        case best
        case tenMeters
        case hundredMeters
        case kilometer
        case threeKilometers

        public var coreLocationAccuracy: CLLocationAccuracy {
            switch self {
            case .best: return kCLLocationAccuracyBest
            case .tenMeters: return kCLLocationAccuracyNearestTenMeters
            case .hundredMeters: return kCLLocationAccuracyHundredMeters
            case .kilometer: return kCLLocationAccuracyKilometer
            case .threeKilometers: return kCLLocationAccuracyThreeKilometers
            }
        }

        public var displayName: String {
            switch self {
            case .best: return "Best (GPS)"
            case .tenMeters: return "High (~10m)"
            case .hundredMeters: return "Medium (~100m)"
            case .kilometer: return "Low (~1km)"
            case .threeKilometers: return "Minimal (~3km)"
            }
        }

        public var batteryImpact: String {
            switch self {
            case .best: return "High"
            case .tenMeters: return "Medium-High"
            case .hundredMeters: return "Medium"
            case .kilometer: return "Low"
            case .threeKilometers: return "Very Low"
            }
        }
    }

    // MARK: - Trip Summary (for list views)
    public struct TripSummary: Identifiable {
        public let id: UUID
        public let name: String
        public let startTime: Date
        public let endTime: Date?
        public let distance: Double
        public let duration: TimeInterval
        public let status: TripStatus

        init(from trip: Trip) {
            self.id = trip.id
            self.name = trip.name
            self.startTime = trip.startTime
            self.endTime = trip.endTime
            self.distance = trip.totalDistance
            self.duration = trip.duration
            self.status = trip.status
        }
    }
}
