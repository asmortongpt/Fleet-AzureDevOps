/**
 * Fleet Management - iOS API Configuration
 *
 * Unified API configuration for all mobile app features:
 * - Offline storage and sync
 * - Driver toolbox
 * - Keyless entry
 * - AR navigation
 * - Barcode scanning
 * - AI damage detection
 * - LiDAR 3D scanning
 * - Route optimization
 * - Radio dispatch
 * - Video telematics
 * - EV charging
 */

import Foundation

enum Environment {
    case development
    case staging
    case production

    static var current: Environment {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }
}

struct APIConfiguration {
    // MARK: - Base URLs

    static var baseURL: String {
        switch Environment.current {
        case .development:
            return "http://localhost:3000"
        case .staging:
            return "https://staging-fleet.capitaltechalliance.com"
        case .production:
            return "https://fleet.capitaltechalliance.com"
        }
    }

    static var apiURL: String {
        return "\(baseURL)/api"
    }

    static var wsURL: String {
        switch Environment.current {
        case .development:
            return "ws://localhost:3000"
        case .staging:
            return "wss://staging-fleet.capitaltechalliance.com"
        case .production:
            return "wss://fleet.capitaltechalliance.com"
        }
    }

    // MARK: - Mobile Integration Endpoints

    struct Mobile {
        static let register = "\(apiURL)/mobile/register"
        static let sync = "\(apiURL)/mobile/sync"
        static func route(vehicleId: Int) -> String {
            "\(apiURL)/mobile/route/\(vehicleId)"
        }
        static let arNavigation = "\(apiURL)/mobile/ar-navigation"
        static let keylessEntry = "\(apiURL)/mobile/keyless-entry"
        static let damageDetection = "\(apiURL)/mobile/damage-detection"
        static let dispatchMessages = "\(apiURL)/mobile/dispatch/messages"
        static let chargingStationsNearby = "\(apiURL)/mobile/charging-stations/nearby"
    }

    // MARK: - Telematics Endpoints

    struct Telematics {
        static let providers = "\(apiURL)/telematics/providers"
        static let dashboard = "\(apiURL)/telematics/dashboard"
        static func vehicleLocation(vehicleId: Int) -> String {
            "\(apiURL)/telematics/vehicles/\(vehicleId)/location"
        }
        static func vehicleStats(vehicleId: Int) -> String {
            "\(apiURL)/telematics/vehicles/\(vehicleId)/stats"
        }
        static let safetyEvents = "\(apiURL)/telematics/safety-events"
    }

    // MARK: - Smartcar Endpoints

    struct Smartcar {
        static let connect = "\(apiURL)/smartcar/connect"
        static func location(vehicleId: Int) -> String {
            "\(apiURL)/smartcar/vehicles/\(vehicleId)/location"
        }
        static func battery(vehicleId: Int) -> String {
            "\(apiURL)/smartcar/vehicles/\(vehicleId)/battery"
        }
        static func lock(vehicleId: Int) -> String {
            "\(apiURL)/smartcar/vehicles/\(vehicleId)/lock"
        }
        static func unlock(vehicleId: Int) -> String {
            "\(apiURL)/smartcar/vehicles/\(vehicleId)/unlock"
        }
        static func startCharging(vehicleId: Int) -> String {
            "\(apiURL)/smartcar/vehicles/\(vehicleId)/charge/start"
        }
        static func stopCharging(vehicleId: Int) -> String {
            "\(apiURL)/smartcar/vehicles/\(vehicleId)/charge/stop"
        }
    }

    // MARK: - Route Optimization Endpoints

    struct Routes {
        static let optimize = "\(apiURL)/route-optimization/optimize"
        static let jobs = "\(apiURL)/route-optimization/jobs"
        static let active = "\(apiURL)/route-optimization/routes/active"
        static func route(routeId: Int) -> String {
            "\(apiURL)/route-optimization/routes/\(routeId)"
        }
        static func completeStop(routeId: Int, stopId: Int) -> String {
            "\(apiURL)/route-optimization/routes/\(routeId)/stops/\(stopId)/complete"
        }
    }

    // MARK: - Dispatch Endpoints

    struct Dispatch {
        static let channels = "\(apiURL)/dispatch/channels"
        static let websocket = "\(wsURL)/api/dispatch/ws"
        static func history(channelId: Int) -> String {
            "\(apiURL)/dispatch/channels/\(channelId)/history"
        }
    }

    // MARK: - EV Charging Endpoints

    struct EVCharging {
        static let chargers = "\(apiURL)/ev/chargers"
        static func chargerStatus(chargerId: Int) -> String {
            "\(apiURL)/ev/chargers/\(chargerId)/status"
        }
        static func reserve(chargerId: Int) -> String {
            "\(apiURL)/ev/chargers/\(chargerId)/reserve"
        }
        static func remoteStart(chargerId: Int) -> String {
            "\(apiURL)/ev/chargers/\(chargerId)/remote-start"
        }
        static func chargeSchedule(vehicleId: Int) -> String {
            "\(apiURL)/ev/vehicles/\(vehicleId)/charge-schedule"
        }
        static let carbonFootprint = "\(apiURL)/ev/carbon-footprint"
        static let esgReport = "\(apiURL)/ev/esg-report"
    }

    // MARK: - Video Telematics Endpoints

    struct VideoTelematics {
        static let cameras = "\(apiURL)/video/cameras"
        static let events = "\(apiURL)/video/events"
        static func videoClip(eventId: Int) -> String {
            "\(apiURL)/video/events/\(eventId)/clip"
        }
        static let evidenceLocker = "\(apiURL)/video/evidence-locker"
    }

    // MARK: - 3D Vehicle Viewer Endpoints

    struct Vehicle3D {
        static func model(vehicleId: Int) -> String {
            "\(apiURL)/vehicles/\(vehicleId)/3d-model"
        }
        static func arModel(vehicleId: Int) -> String {
            "\(apiURL)/vehicles/\(vehicleId)/ar-model"
        }
        static func customize(vehicleId: Int) -> String {
            "\(apiURL)/vehicles/\(vehicleId)/customize"
        }
        static let catalog = "\(apiURL)/vehicle-models/catalog"
    }

    // MARK: - Request Headers

    static func headers(withAuth token: String? = nil) -> [String: String] {
        var headers = [
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-App-Version": appVersion,
            "X-Device-Type": "ios",
            "X-OS-Version": osVersion
        ]

        if let token = token {
            headers["Authorization"] = "Bearer \(token)"
        }

        return headers
    }

    // MARK: - Device Info

    static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    static var osVersion: String {
        UIDevice.current.systemVersion
    }

    static var deviceId: String {
        UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
    }

    static var deviceName: String {
        UIDevice.current.name
    }

    // MARK: - Timeout Configuration

    static let requestTimeout: TimeInterval = 30.0
    static let uploadTimeout: TimeInterval = 120.0
    static let downloadTimeout: TimeInterval = 120.0

    // MARK: - Feature Flags

    struct FeatureFlags {
        static let offlineMode = true
        static let barcode Scanner = true
        static let aiDamageDetection = true
        static let lidarScanning = true
        static let keylessEntry = true
        static let arNavigation = true
        static let radioDispatch = true
        static let videoTelematics = true
        static let evCharging = true
        static let routeOptimization = true
    }

    // MARK: - Offline Sync Configuration

    struct OfflineSync {
        static let autoSyncInterval: TimeInterval = 15 * 60 // 15 minutes
        static let maxRetryAttempts = 5
        static let retryBackoffMultiplier = 2.0
        static let maxConcurrentSyncOperations = 3
    }

    // MARK: - Cache Configuration

    struct Cache {
        static let vehiclesCacheDuration: TimeInterval = 60 * 60 // 1 hour
        static let routesCacheDuration: TimeInterval = 5 * 60 // 5 minutes
        static let chargersCacheDuration: TimeInterval = 15 * 60 // 15 minutes
        static let maxPhotoCacheSize: Int = 100 * 1024 * 1024 // 100 MB
    }
}

// MARK: - API Client Extension

extension URLSession {
    static var fleet: URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = APIConfiguration.requestTimeout
        configuration.timeoutIntervalForResource = APIConfiguration.downloadTimeout
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: configuration)
    }
}
