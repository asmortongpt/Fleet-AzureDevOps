//
//  GISData.swift
//  Fleet Manager
//
//  GIS data models for heatmaps, clusters, boundaries, and layers
//

import Foundation
import MapKit
import CoreLocation

// MARK: - GIS Layer Types
enum GISLayerType: String, Codable, CaseIterable {
    case heatmap = "heatmap"
    case cluster = "cluster"
    case boundary = "boundary"
    case route = "route"
    case geofence = "geofence"
    case incident = "incident"

    var displayName: String {
        switch self {
        case .heatmap: return "Heatmap"
        case .cluster: return "Clusters"
        case .boundary: return "Boundaries"
        case .route: return "Routes"
        case .geofence: return "Geofences"
        case .incident: return "Incidents"
        }
    }

    var iconName: String {
        switch self {
        case .heatmap: return "flame.fill"
        case .cluster: return "scope"
        case .boundary: return "map.fill"
        case .route: return "point.3.connected.trianglepath.dotted"
        case .geofence: return "mappin.circle.fill"
        case .incident: return "exclamationmark.triangle.fill"
        }
    }

    var defaultColor: String {
        switch self {
        case .heatmap: return "red"
        case .cluster: return "blue"
        case .boundary: return "green"
        case .route: return "purple"
        case .geofence: return "orange"
        case .incident: return "red"
        }
    }
}

// MARK: - GIS Layer
struct GISLayer: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var type: GISLayerType
    var visible: Bool
    var opacity: Double
    var zIndex: Int
    var color: String?
    var metadata: [String: String]?

    init(id: String = UUID().uuidString,
         name: String,
         type: GISLayerType,
         visible: Bool = true,
         opacity: Double = 1.0,
         zIndex: Int = 0,
         color: String? = nil,
         metadata: [String: String]? = nil) {
        self.id = id
        self.name = name
        self.type = type
        self.visible = visible
        self.opacity = opacity
        self.zIndex = zIndex
        self.color = color ?? type.defaultColor
        self.metadata = metadata
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: GISLayer, rhs: GISLayer) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Heatmap Data
struct HeatmapData: Codable, Identifiable {
    let id: String
    let coordinates: [HeatmapPoint]
    var radius: Double
    var gradient: HeatmapGradient
    var maxIntensity: Double

    init(id: String = UUID().uuidString,
         coordinates: [HeatmapPoint],
         radius: Double = 30.0,
         gradient: HeatmapGradient = .default,
         maxIntensity: Double = 1.0) {
        self.id = id
        self.coordinates = coordinates
        self.radius = radius
        self.gradient = gradient
        self.maxIntensity = maxIntensity
    }
}

struct HeatmapPoint: Codable, Identifiable {
    let id: String
    let latitude: Double
    let longitude: Double
    let intensity: Double
    let timestamp: Date?

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(id: String = UUID().uuidString,
         latitude: Double,
         longitude: Double,
         intensity: Double,
         timestamp: Date? = nil) {
        self.id = id
        self.latitude = latitude
        self.longitude = longitude
        self.intensity = intensity
        self.timestamp = timestamp
    }

    init(coordinate: CLLocationCoordinate2D, intensity: Double, timestamp: Date? = nil) {
        self.id = UUID().uuidString
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
        self.intensity = intensity
        self.timestamp = timestamp
    }
}

struct HeatmapGradient: Codable {
    let colors: [String]
    let positions: [Double]

    static let `default` = HeatmapGradient(
        colors: ["#0000FF", "#00FFFF", "#00FF00", "#FFFF00", "#FF0000"],
        positions: [0.0, 0.25, 0.5, 0.75, 1.0]
    )

    static let fire = HeatmapGradient(
        colors: ["#000000", "#FF0000", "#FF6600", "#FFFF00", "#FFFFFF"],
        positions: [0.0, 0.3, 0.6, 0.85, 1.0]
    )

    static let cool = HeatmapGradient(
        colors: ["#FFFFFF", "#00FFFF", "#0000FF", "#000080"],
        positions: [0.0, 0.4, 0.7, 1.0]
    )
}

// MARK: - Cluster Data
struct ClusterPoint: Identifiable, Codable {
    let id: String
    let latitude: Double
    let longitude: Double
    let itemCount: Int
    let items: [ClusterItem]
    let radius: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var averageIntensity: Double {
        guard !items.isEmpty else { return 0 }
        return items.reduce(0.0) { $0 + $1.weight } / Double(items.count)
    }

    init(id: String = UUID().uuidString,
         latitude: Double,
         longitude: Double,
         itemCount: Int,
         items: [ClusterItem],
         radius: Double = 100.0) {
        self.id = id
        self.latitude = latitude
        self.longitude = longitude
        self.itemCount = itemCount
        self.items = items
        self.radius = radius
    }

    init(coordinate: CLLocationCoordinate2D, items: [ClusterItem], radius: Double = 100.0) {
        self.id = UUID().uuidString
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
        self.itemCount = items.count
        self.items = items
        self.radius = radius
    }
}

struct ClusterItem: Identifiable, Codable {
    let id: String
    let latitude: Double
    let longitude: Double
    let type: String
    let name: String
    let weight: Double
    let metadata: [String: String]?

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(id: String = UUID().uuidString,
         latitude: Double,
         longitude: Double,
         type: String,
         name: String,
         weight: Double = 1.0,
         metadata: [String: String]? = nil) {
        self.id = id
        self.latitude = latitude
        self.longitude = longitude
        self.type = type
        self.name = name
        self.weight = weight
        self.metadata = metadata
    }
}

// MARK: - Geographic Boundary
struct GeographicBoundary: Identifiable, Codable {
    let id: String
    let name: String
    let type: BoundaryType
    let coordinates: [BoundaryCoordinate]
    let fillColor: String?
    let strokeColor: String?
    let strokeWidth: Double
    let metadata: [String: String]?

    var polygonCoordinates: [CLLocationCoordinate2D] {
        coordinates.map { $0.coordinate }
    }

    var boundingBox: MKMapRect {
        let points = polygonCoordinates.map { MKMapPoint($0) }
        let minX = points.map { $0.x }.min() ?? 0
        let maxX = points.map { $0.x }.max() ?? 0
        let minY = points.map { $0.y }.min() ?? 0
        let maxY = points.map { $0.y }.max() ?? 0

        return MKMapRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
    }

    init(id: String = UUID().uuidString,
         name: String,
         type: BoundaryType,
         coordinates: [BoundaryCoordinate],
         fillColor: String? = nil,
         strokeColor: String? = nil,
         strokeWidth: Double = 2.0,
         metadata: [String: String]? = nil) {
        self.id = id
        self.name = name
        self.type = type
        self.coordinates = coordinates
        self.fillColor = fillColor
        self.strokeColor = strokeColor
        self.strokeWidth = strokeWidth
        self.metadata = metadata
    }
}

struct BoundaryCoordinate: Codable {
    let latitude: Double
    let longitude: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    init(coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }
}

enum BoundaryType: String, Codable, CaseIterable {
    case state = "state"
    case county = "county"
    case city = "city"
    case zone = "zone"
    case serviceArea = "service_area"
    case custom = "custom"

    var displayName: String {
        switch self {
        case .state: return "State"
        case .county: return "County"
        case .city: return "City"
        case .zone: return "Zone"
        case .serviceArea: return "Service Area"
        case .custom: return "Custom"
        }
    }
}

// MARK: - GIS Filter
struct GISFilter: Codable {
    var dateRange: DateRange?
    var vehicleTypes: [String]?
    var statusFilters: [String]?
    var driverIds: [String]?
    var minimumIntensity: Double?
    var boundingBox: BoundingBox?

    init(dateRange: DateRange? = nil,
         vehicleTypes: [String]? = nil,
         statusFilters: [String]? = nil,
         driverIds: [String]? = nil,
         minimumIntensity: Double? = nil,
         boundingBox: BoundingBox? = nil) {
        self.dateRange = dateRange
        self.vehicleTypes = vehicleTypes
        self.statusFilters = statusFilters
        self.driverIds = driverIds
        self.minimumIntensity = minimumIntensity
        self.boundingBox = boundingBox
    }

    var isEmpty: Bool {
        dateRange == nil &&
        (vehicleTypes?.isEmpty ?? true) &&
        (statusFilters?.isEmpty ?? true) &&
        (driverIds?.isEmpty ?? true) &&
        minimumIntensity == nil &&
        boundingBox == nil
    }
}

struct DateRange: Codable {
    let startDate: Date
    let endDate: Date

    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }

    static var lastHour: DateRange {
        let now = Date()
        return DateRange(startDate: now.addingTimeInterval(-3600), endDate: now)
    }

    static var today: DateRange {
        let now = Date()
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: now)
        return DateRange(startDate: startOfDay, endDate: now)
    }

    static var thisWeek: DateRange {
        let now = Date()
        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: now) ?? now
        return DateRange(startDate: weekAgo, endDate: now)
    }

    static var thisMonth: DateRange {
        let now = Date()
        let calendar = Calendar.current
        let monthAgo = calendar.date(byAdding: .month, value: -1, to: now) ?? now
        return DateRange(startDate: monthAgo, endDate: now)
    }
}

struct BoundingBox: Codable {
    let minLatitude: Double
    let maxLatitude: Double
    let minLongitude: Double
    let maxLongitude: Double

    var mapRect: MKMapRect {
        let topLeft = MKMapPoint(CLLocationCoordinate2D(latitude: maxLatitude, longitude: minLongitude))
        let bottomRight = MKMapPoint(CLLocationCoordinate2D(latitude: minLatitude, longitude: maxLongitude))

        return MKMapRect(
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        )
    }

    init(minLatitude: Double, maxLatitude: Double, minLongitude: Double, maxLongitude: Double) {
        self.minLatitude = minLatitude
        self.maxLatitude = maxLatitude
        self.minLongitude = minLongitude
        self.maxLongitude = maxLongitude
    }

    init(mapRect: MKMapRect) {
        let topLeft = mapRect.origin
        let bottomRight = MKMapPoint(x: mapRect.maxX, y: mapRect.maxY)

        let topLeftCoordinate = topLeft.coordinate
        let bottomRightCoordinate = bottomRight.coordinate

        self.minLatitude = bottomRightCoordinate.latitude
        self.maxLatitude = topLeftCoordinate.latitude
        self.minLongitude = topLeftCoordinate.longitude
        self.maxLongitude = bottomRightCoordinate.longitude
    }
}

// MARK: - GIS Response Models
struct GISLayersResponse: Codable {
    let layers: [GISLayer]
    let timestamp: Date
}

struct HeatmapResponse: Codable {
    let heatmap: HeatmapData
    let timestamp: Date
}

struct ClusterResponse: Codable {
    let clusters: [ClusterPoint]
    let timestamp: Date
}

struct BoundaryResponse: Codable {
    let boundaries: [GeographicBoundary]
    let timestamp: Date
}
