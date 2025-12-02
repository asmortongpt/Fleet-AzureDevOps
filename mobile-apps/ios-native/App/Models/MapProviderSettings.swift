//
//  MapProviderSettings.swift
//  Fleet Manager - Map Provider Configuration
//
//  Provides multi-provider map support with secure API key storage,
//  customizable styles, and feature toggles for Apple Maps, Google Maps,
//  Mapbox, and OpenStreetMap integration
//

import Foundation
import MapKit
import CoreLocation

// MARK: - Map Provider

/// Supported map providers for the Fleet Manager application
enum MapProvider: String, Codable, CaseIterable, Identifiable {
    case apple = "apple"
    case google = "google"
    case mapbox = "mapbox"
    case openstreetmap = "openstreetmap"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .apple:
            return "Apple Maps"
        case .google:
            return "Google Maps"
        case .mapbox:
            return "Mapbox"
        case .openstreetmap:
            return "OpenStreetMap"
        }
    }

    var icon: String {
        switch self {
        case .apple:
            return "map.fill"
        case .google:
            return "globe.americas.fill"
        case .mapbox:
            return "location.fill"
        case .openstreetmap:
            return "map.circle.fill"
        }
    }

    var requiresAPIKey: Bool {
        switch self {
        case .apple, .openstreetmap:
            return false
        case .google, .mapbox:
            return true
        }
    }

    var description: String {
        switch self {
        case .apple:
            return "Native iOS maps with excellent performance and privacy"
        case .google:
            return "Comprehensive mapping with Street View and extensive POI data"
        case .mapbox:
            return "Highly customizable maps with vector tiles and offline support"
        case .openstreetmap:
            return "Free, open-source maps with community-driven data"
        }
    }

    var officialURL: URL? {
        switch self {
        case .apple:
            return URL(string: "https://developer.apple.com/maps/")
        case .google:
            return URL(string: "https://developers.google.com/maps")
        case .mapbox:
            return URL(string: "https://www.mapbox.com/")
        case .openstreetmap:
            return URL(string: "https://www.openstreetmap.org/")
        }
    }
}

// MARK: - Map Style

/// Available map styles across different providers
enum MapStyle: String, Codable, CaseIterable, Identifiable {
    case standard = "standard"
    case satellite = "satellite"
    case hybrid = "hybrid"
    case terrain = "terrain"
    case dark = "dark"
    case light = "light"
    case outdoors = "outdoors"
    case navigation = "navigation"
    case custom = "custom"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .standard:
            return "Standard"
        case .satellite:
            return "Satellite"
        case .hybrid:
            return "Hybrid"
        case .terrain:
            return "Terrain"
        case .dark:
            return "Dark"
        case .light:
            return "Light"
        case .outdoors:
            return "Outdoors"
        case .navigation:
            return "Navigation"
        case .custom:
            return "Custom"
        }
    }

    var icon: String {
        switch self {
        case .standard:
            return "map"
        case .satellite:
            return "globe"
        case .hybrid:
            return "map.circle"
        case .terrain:
            return "mountain.2"
        case .dark:
            return "moon.fill"
        case .light:
            return "sun.max.fill"
        case .outdoors:
            return "tree.fill"
        case .navigation:
            return "arrow.triangle.turn.up.right.diamond"
        case .custom:
            return "paintbrush.fill"
        }
    }

    var description: String {
        switch self {
        case .standard:
            return "Default map view with roads and labels"
        case .satellite:
            return "Satellite imagery view"
        case .hybrid:
            return "Satellite imagery with roads and labels"
        case .terrain:
            return "Topographic view with elevation"
        case .dark:
            return "Dark theme for night viewing"
        case .light:
            return "Light theme with minimal details"
        case .outdoors:
            return "Outdoor activities and trails"
        case .navigation:
            return "Turn-by-turn navigation optimized"
        case .custom:
            return "User-defined custom style"
        }
    }

    /// Convert to MKMapType for Apple Maps
    var mkMapType: MKMapType {
        switch self {
        case .standard, .light, .navigation:
            return .standard
        case .satellite:
            return .satellite
        case .hybrid:
            return .hybrid
        case .terrain, .outdoors:
            return .mutedStandard
        case .dark, .custom:
            return .standard
        }
    }
}

// MARK: - Map Features

/// Individual map features that can be toggled
struct MapFeature: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let icon: String
    let description: String
    var enabled: Bool

    static let traffic = MapFeature(
        id: "traffic",
        name: "Traffic",
        icon: "car.fill",
        description: "Show real-time traffic conditions",
        enabled: true
    )

    static let buildings3D = MapFeature(
        id: "buildings3D",
        name: "3D Buildings",
        icon: "building.2.fill",
        description: "Display buildings in 3D",
        enabled: true
    )

    static let pointsOfInterest = MapFeature(
        id: "pointsOfInterest",
        name: "Points of Interest",
        icon: "mappin.and.ellipse",
        description: "Show restaurants, gas stations, etc.",
        enabled: true
    )

    static let transit = MapFeature(
        id: "transit",
        name: "Transit",
        icon: "bus.fill",
        description: "Display public transportation",
        enabled: false
    )

    static let compass = MapFeature(
        id: "compass",
        name: "Compass",
        icon: "location.north.fill",
        description: "Show compass control",
        enabled: true
    )

    static let scaleBar = MapFeature(
        id: "scaleBar",
        name: "Scale Bar",
        icon: "ruler.fill",
        description: "Display map scale indicator",
        enabled: true
    )

    static let userLocation = MapFeature(
        id: "userLocation",
        name: "User Location",
        icon: "location.fill",
        description: "Show current location on map",
        enabled: true
    )

    static let pitchControl = MapFeature(
        id: "pitchControl",
        name: "Pitch Control",
        icon: "rotate.3d",
        description: "Allow 3D tilting of map",
        enabled: true
    )

    static let rotationGesture = MapFeature(
        id: "rotationGesture",
        name: "Rotation Gesture",
        icon: "arrow.triangle.2.circlepath",
        description: "Enable two-finger rotation",
        enabled: true
    )

    static let zoomControls = MapFeature(
        id: "zoomControls",
        name: "Zoom Controls",
        icon: "plus.magnifyingglass",
        description: "Show zoom in/out buttons",
        enabled: false
    )
}

// MARK: - Provider Features

/// Features available for each map provider
struct ProviderFeatures: Codable {
    let provider: MapProvider
    let availableStyles: [MapStyle]
    let supportedFeatures: [String] // Feature IDs
    let maxOfflineCacheSizeMB: Int
    let supportsOfflineMaps: Bool
    let supportsCustomStyles: Bool
    let supportsVectorTiles: Bool
    let supportsStreetView: Bool
    let maxZoomLevel: Int
    let minZoomLevel: Int

    static let apple = ProviderFeatures(
        provider: .apple,
        availableStyles: [.standard, .satellite, .hybrid, .terrain],
        supportedFeatures: ["traffic", "buildings3D", "pointsOfInterest", "compass", "scaleBar", "userLocation", "pitchControl", "rotationGesture"],
        maxOfflineCacheSizeMB: 500,
        supportsOfflineMaps: false,
        supportsCustomStyles: false,
        supportsVectorTiles: false,
        supportsStreetView: false,
        maxZoomLevel: 20,
        minZoomLevel: 0
    )

    static let google = ProviderFeatures(
        provider: .google,
        availableStyles: [.standard, .satellite, .hybrid, .terrain, .dark, .light, .navigation],
        supportedFeatures: ["traffic", "buildings3D", "pointsOfInterest", "transit", "compass", "scaleBar", "userLocation", "pitchControl", "rotationGesture", "zoomControls"],
        maxOfflineCacheSizeMB: 1000,
        supportsOfflineMaps: true,
        supportsCustomStyles: true,
        supportsVectorTiles: true,
        supportsStreetView: true,
        maxZoomLevel: 21,
        minZoomLevel: 0
    )

    static let mapbox = ProviderFeatures(
        provider: .mapbox,
        availableStyles: [.standard, .satellite, .dark, .light, .outdoors, .navigation, .custom],
        supportedFeatures: ["traffic", "buildings3D", "pointsOfInterest", "compass", "scaleBar", "userLocation", "pitchControl", "rotationGesture", "zoomControls"],
        maxOfflineCacheSizeMB: 2000,
        supportsOfflineMaps: true,
        supportsCustomStyles: true,
        supportsVectorTiles: true,
        supportsStreetView: false,
        maxZoomLevel: 22,
        minZoomLevel: 0
    )

    static let openstreetmap = ProviderFeatures(
        provider: .openstreetmap,
        availableStyles: [.standard, .outdoors],
        supportedFeatures: ["pointsOfInterest", "compass", "scaleBar", "userLocation", "rotationGesture", "zoomControls"],
        maxOfflineCacheSizeMB: 1500,
        supportsOfflineMaps: true,
        supportsCustomStyles: false,
        supportsVectorTiles: false,
        supportsStreetView: false,
        maxZoomLevel: 19,
        minZoomLevel: 0
    )

    static func features(for provider: MapProvider) -> ProviderFeatures {
        switch provider {
        case .apple:
            return .apple
        case .google:
            return .google
        case .mapbox:
            return .mapbox
        case .openstreetmap:
            return .openstreetmap
        }
    }
}

// MARK: - Map Preferences

/// User preferences for map configuration
struct MapPreferences: Codable {
    var provider: MapProvider
    var style: MapStyle
    var enabledFeatures: [String: Bool] // Feature ID -> Enabled state
    var customStyleURL: String?
    var defaultCenter: CLLocationCoordinate2D?
    var defaultZoomLevel: Double
    var defaultPitch: Double
    var defaultHeading: Double
    var offlineMapsEnabled: Bool
    var offlineCacheSizeMB: Int
    var autoRotateEnabled: Bool
    var followUserLocation: Bool
    var showsScale: Bool
    var showsCompass: Bool

    init(
        provider: MapProvider = .apple,
        style: MapStyle = .standard,
        enabledFeatures: [String: Bool] = [:],
        customStyleURL: String? = nil,
        defaultCenter: CLLocationCoordinate2D? = nil,
        defaultZoomLevel: Double = 12.0,
        defaultPitch: Double = 0.0,
        defaultHeading: Double = 0.0,
        offlineMapsEnabled: Bool = false,
        offlineCacheSizeMB: Int = 500,
        autoRotateEnabled: Bool = false,
        followUserLocation: Bool = true,
        showsScale: Bool = true,
        showsCompass: Bool = true
    ) {
        self.provider = provider
        self.style = style
        self.enabledFeatures = enabledFeatures.isEmpty ? MapPreferences.defaultFeatures : enabledFeatures
        self.customStyleURL = customStyleURL
        self.defaultCenter = defaultCenter
        self.defaultZoomLevel = defaultZoomLevel
        self.defaultPitch = defaultPitch
        self.defaultHeading = defaultHeading
        self.offlineMapsEnabled = offlineMapsEnabled
        self.offlineCacheSizeMB = offlineCacheSizeMB
        self.autoRotateEnabled = autoRotateEnabled
        self.followUserLocation = followUserLocation
        self.showsScale = showsScale
        self.showsCompass = showsCompass
    }

    static var defaultFeatures: [String: Bool] {
        [
            "traffic": true,
            "buildings3D": true,
            "pointsOfInterest": true,
            "transit": false,
            "compass": true,
            "scaleBar": true,
            "userLocation": true,
            "pitchControl": true,
            "rotationGesture": true,
            "zoomControls": false
        ]
    }

    static var `default`: MapPreferences {
        MapPreferences()
    }
}

// MARK: - CLLocationCoordinate2D Codable Extension

extension CLLocationCoordinate2D: Codable {
    enum CodingKeys: String, CodingKey {
        case latitude
        case longitude
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let latitude = try container.decode(CLLocationDegrees.self, forKey: .latitude)
        let longitude = try container.decode(CLLocationDegrees.self, forKey: .longitude)
        self.init(latitude: latitude, longitude: longitude)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
    }
}

// MARK: - Map API Key

/// Secure storage container for API keys
struct MapAPIKey: Identifiable {
    let id: String
    let provider: MapProvider
    var key: String
    var isValid: Bool
    var lastValidated: Date?
    var maskedKey: String {
        guard key.count > 8 else { return String(repeating: "*", count: key.count) }
        let suffix = key.suffix(4)
        let prefix = String(repeating: "*", count: key.count - 4)
        return prefix + suffix
    }

    init(provider: MapProvider, key: String = "", isValid: Bool = false, lastValidated: Date? = nil) {
        self.id = provider.rawValue
        self.provider = provider
        self.key = key
        self.isValid = isValid
        self.lastValidated = lastValidated
    }
}

// MARK: - Map Configuration

/// Complete map configuration combining preferences and features
struct MapConfiguration {
    let provider: MapProvider
    let style: MapStyle
    let features: ProviderFeatures
    let preferences: MapPreferences
    let apiKey: MapAPIKey?

    var isConfigured: Bool {
        if provider.requiresAPIKey {
            return apiKey?.isValid ?? false
        }
        return true
    }

    var configurationStatus: String {
        if !isConfigured {
            return "API key required"
        }
        return "Ready"
    }

    static func create(from preferences: MapPreferences, apiKey: MapAPIKey? = nil) -> MapConfiguration {
        let features = ProviderFeatures.features(for: preferences.provider)
        return MapConfiguration(
            provider: preferences.provider,
            style: preferences.style,
            features: features,
            preferences: preferences,
            apiKey: apiKey
        )
    }
}
