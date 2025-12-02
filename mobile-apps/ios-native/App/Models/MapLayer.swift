//
//  MapLayer.swift
//  Fleet Manager
//
//  Map layer models for traffic, weather, terrain, and incident overlays
//

import Foundation
import MapKit
import SwiftUI

// MARK: - Map Layer Type

enum MapLayerType: String, Codable, CaseIterable, Identifiable {
    case traffic
    case weather
    case terrain
    case satellite
    case hybrid
    case incidents
    case construction

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .traffic:
            return "Traffic"
        case .weather:
            return "Weather"
        case .terrain:
            return "Terrain"
        case .satellite:
            return "Satellite"
        case .hybrid:
            return "Hybrid"
        case .incidents:
            return "Incidents"
        case .construction:
            return "Construction"
        }
    }

    var icon: String {
        switch self {
        case .traffic:
            return "car.fill"
        case .weather:
            return "cloud.sun.fill"
        case .terrain:
            return "mountain.2.fill"
        case .satellite:
            return "globe.americas.fill"
        case .hybrid:
            return "map.fill"
        case .incidents:
            return "exclamationmark.triangle.fill"
        case .construction:
            return "cone.fill"
        }
    }

    var requiresDataFetch: Bool {
        switch self {
        case .traffic, .weather, .incidents, .construction:
            return true
        case .terrain, .satellite, .hybrid:
            return false
        }
    }

    var defaultOpacity: Double {
        switch self {
        case .traffic:
            return 0.8
        case .weather:
            return 0.6
        case .terrain, .satellite, .hybrid:
            return 1.0
        case .incidents, .construction:
            return 1.0
        }
    }
}

// MARK: - Map Layer

struct MapLayer: Identifiable, Codable, Equatable {
    let id: UUID
    let type: MapLayerType
    var name: String
    var isEnabled: Bool
    var opacity: Double
    var refreshInterval: TimeInterval

    init(
        id: UUID = UUID(),
        type: MapLayerType,
        name: String? = nil,
        isEnabled: Bool = false,
        opacity: Double? = nil,
        refreshInterval: TimeInterval = 300
    ) {
        self.id = id
        self.type = type
        self.name = name ?? type.displayName
        self.isEnabled = isEnabled
        self.opacity = opacity ?? type.defaultOpacity
        self.refreshInterval = refreshInterval
    }

    var needsAutoRefresh: Bool {
        return type.requiresDataFetch && isEnabled
    }
}

// MARK: - Traffic Congestion Level

enum TrafficCongestionLevel: String, Codable, CaseIterable {
    case none
    case low
    case moderate
    case heavy
    case stopped

    var displayName: String {
        rawValue.capitalized
    }

    var color: Color {
        switch self {
        case .none:
            return .green
        case .low:
            return .yellow
        case .moderate:
            return .orange
        case .heavy:
            return .red
        case .stopped:
            return Color(red: 0.5, green: 0, blue: 0) // Dark red
        }
    }

    var speedRange: String {
        switch self {
        case .none:
            return "> 50 mph"
        case .low:
            return "35-50 mph"
        case .moderate:
            return "25-35 mph"
        case .heavy:
            return "10-25 mph"
        case .stopped:
            return "< 10 mph"
        }
    }

    var opacity: Double {
        switch self {
        case .none:
            return 0.3
        case .low:
            return 0.5
        case .moderate:
            return 0.7
        case .heavy:
            return 0.8
        case .stopped:
            return 0.9
        }
    }
}

// MARK: - Traffic Road Segment

struct TrafficRoadSegment: Identifiable, Codable, Equatable {
    let id: String
    let roadName: String
    let coordinates: [TrafficCoordinate]
    let congestionLevel: TrafficCongestionLevel
    let averageSpeed: Double
    let timestamp: Date

    var polylineCoordinates: [CLLocationCoordinate2D] {
        coordinates.map { $0.toCLLocationCoordinate2D() }
    }
}

struct TrafficCoordinate: Codable, Equatable {
    let lat: Double
    let lng: Double

    func toCLLocationCoordinate2D() -> CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

// MARK: - Traffic Data

struct TrafficData: Codable, Equatable {
    let segments: [TrafficRoadSegment]
    let lastUpdated: Date
    let coverageArea: MapBounds

    var isEmpty: Bool {
        segments.isEmpty
    }

    func segmentsInRegion(_ region: MKCoordinateRegion) -> [TrafficRoadSegment] {
        segments.filter { segment in
            segment.coordinates.contains { coordinate in
                region.contains(coordinate.toCLLocationCoordinate2D())
            }
        }
    }
}

// MARK: - Weather Data

struct WeatherOverlay: Codable, Equatable {
    let id: String
    let location: WeatherLocation
    let temperature: Double
    let feelsLike: Double
    let conditions: WeatherCondition
    let precipitation: Double
    let precipitationType: PrecipitationType?
    let windSpeed: Double
    let windDirection: Double
    let humidity: Double
    let visibility: Double
    let alerts: [WeatherAlert]
    let timestamp: Date

    var temperatureFahrenheit: Int {
        Int(temperature)
    }

    var hasActivePrecipitation: Bool {
        precipitation > 0
    }

    var hasSevereAlerts: Bool {
        alerts.contains { $0.severity == .severe || $0.severity == .extreme }
    }
}

struct WeatherLocation: Codable, Equatable {
    let lat: Double
    let lng: Double
    let name: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

enum WeatherCondition: String, Codable, CaseIterable {
    case clear
    case partlyCloudy
    case cloudy
    case rain
    case snow
    case sleet
    case fog
    case thunderstorm
    case windy

    var displayName: String {
        switch self {
        case .clear:
            return "Clear"
        case .partlyCloudy:
            return "Partly Cloudy"
        case .cloudy:
            return "Cloudy"
        case .rain:
            return "Rain"
        case .snow:
            return "Snow"
        case .sleet:
            return "Sleet"
        case .fog:
            return "Fog"
        case .thunderstorm:
            return "Thunderstorm"
        case .windy:
            return "Windy"
        }
    }

    var icon: String {
        switch self {
        case .clear:
            return "sun.max.fill"
        case .partlyCloudy:
            return "cloud.sun.fill"
        case .cloudy:
            return "cloud.fill"
        case .rain:
            return "cloud.rain.fill"
        case .snow:
            return "cloud.snow.fill"
        case .sleet:
            return "cloud.sleet.fill"
        case .fog:
            return "cloud.fog.fill"
        case .thunderstorm:
            return "cloud.bolt.fill"
        case .windy:
            return "wind"
        }
    }
}

enum PrecipitationType: String, Codable {
    case rain
    case snow
    case sleet
    case hail

    var displayName: String {
        rawValue.capitalized
    }
}

struct WeatherAlert: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let description: String
    let severity: WeatherAlertSeverity
    let startTime: Date
    let endTime: Date
    let affectedArea: MapBounds

    var isActive: Bool {
        let now = Date()
        return now >= startTime && now <= endTime
    }
}

enum WeatherAlertSeverity: String, Codable, CaseIterable {
    case minor
    case moderate
    case severe
    case extreme

    var color: Color {
        switch self {
        case .minor:
            return .yellow
        case .moderate:
            return .orange
        case .severe:
            return .red
        case .extreme:
            return .purple
        }
    }

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Incident Marker

struct IncidentMarker: Identifiable, Codable, Equatable {
    let id: String
    let type: IncidentType
    let location: IncidentLocation
    let severity: IncidentSeverity
    let description: String
    let reportedAt: Date
    let estimatedClearTime: Date?
    let affectedLanes: Int?
    let roadClosed: Bool

    var coordinate: CLLocationCoordinate2D {
        location.coordinate
    }

    var isActive: Bool {
        guard let clearTime = estimatedClearTime else { return true }
        return Date() < clearTime
    }
}

struct IncidentLocation: Codable, Equatable {
    let lat: Double
    let lng: Double
    let roadName: String
    let direction: String?

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

enum IncidentType: String, Codable, CaseIterable {
    case accident
    case hazard
    case construction
    case roadClosure
    case weather
    case event

    var displayName: String {
        switch self {
        case .accident:
            return "Accident"
        case .hazard:
            return "Hazard"
        case .construction:
            return "Construction"
        case .roadClosure:
            return "Road Closure"
        case .weather:
            return "Weather"
        case .event:
            return "Event"
        }
    }

    var icon: String {
        switch self {
        case .accident:
            return "car.side.and.exclamationmark.fill"
        case .hazard:
            return "exclamationmark.triangle.fill"
        case .construction:
            return "cone.fill"
        case .roadClosure:
            return "xmark.octagon.fill"
        case .weather:
            return "cloud.bolt.fill"
        case .event:
            return "calendar.badge.exclamationmark"
        }
    }
}

enum IncidentSeverity: String, Codable, CaseIterable {
    case low
    case medium
    case high
    case critical

    var color: Color {
        switch self {
        case .low:
            return .yellow
        case .medium:
            return .orange
        case .high:
            return .red
        case .critical:
            return Color(red: 0.5, green: 0, blue: 0.5) // Purple
        }
    }

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Map Bounds

struct MapBounds: Codable, Equatable {
    let northeast: BoundCoordinate
    let southwest: BoundCoordinate

    func contains(_ coordinate: CLLocationCoordinate2D) -> Bool {
        return coordinate.latitude <= northeast.lat &&
               coordinate.latitude >= southwest.lat &&
               coordinate.longitude <= northeast.lng &&
               coordinate.longitude >= southwest.lng
    }
}

struct BoundCoordinate: Codable, Equatable {
    let lat: Double
    let lng: Double
}

// MARK: - API Response Models

struct TrafficDataResponse: Codable {
    let data: TrafficData
    let success: Bool
    let message: String?
}

struct WeatherDataResponse: Codable {
    let data: [WeatherOverlay]
    let success: Bool
    let message: String?
}

struct IncidentDataResponse: Codable {
    let data: [IncidentMarker]
    let success: Bool
    let message: String?
}

// MARK: - MKCoordinateRegion Extension

extension MKCoordinateRegion {
    func contains(_ coordinate: CLLocationCoordinate2D) -> Bool {
        let latDelta = span.latitudeDelta / 2
        let lngDelta = span.longitudeDelta / 2

        let northBound = center.latitude + latDelta
        let southBound = center.latitude - latDelta
        let eastBound = center.longitude + lngDelta
        let westBound = center.longitude - lngDelta

        return coordinate.latitude <= northBound &&
               coordinate.latitude >= southBound &&
               coordinate.longitude <= eastBound &&
               coordinate.longitude >= westBound
    }

    var bounds: MapBounds {
        let latDelta = span.latitudeDelta / 2
        let lngDelta = span.longitudeDelta / 2

        return MapBounds(
            northeast: BoundCoordinate(
                lat: center.latitude + latDelta,
                lng: center.longitude + lngDelta
            ),
            southwest: BoundCoordinate(
                lat: center.latitude - latDelta,
                lng: center.longitude - lngDelta
            )
        )
    }
}

// MARK: - User Preferences

struct MapLayerPreferences: Codable {
    var enabledLayers: [MapLayerType]
    var layerOpacities: [MapLayerType: Double]
    var autoRefreshEnabled: Bool
    var lastSavedDate: Date

    init() {
        self.enabledLayers = []
        self.layerOpacities = [:]
        self.autoRefreshEnabled = true
        self.lastSavedDate = Date()
    }

    static let userDefaultsKey = "MapLayerPreferences"

    func save() {
        if let encoded = try? JSONEncoder().encode(self) {
            UserDefaults.standard.set(encoded, forKey: Self.userDefaultsKey)
        }
    }

    static func load() -> MapLayerPreferences {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey),
              let preferences = try? JSONDecoder().decode(MapLayerPreferences.self, from: data) else {
            return MapLayerPreferences()
        }
        return preferences
    }
}
