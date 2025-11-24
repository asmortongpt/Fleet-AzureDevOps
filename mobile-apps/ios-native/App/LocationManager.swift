import Foundation
import CoreLocation
import Combine

// MARK: - Location Manager
class LocationManager: NSObject, ObservableObject {
    static let shared = LocationManager()

    private let locationManager = CLLocationManager()

    // Published properties
    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus
    @Published var isUpdatingLocation = false
    @Published var locationError: LocationError?

    // Location updates publisher
    private let locationSubject = PassthroughSubject<CLLocation, Never>()
    var locationPublisher: AnyPublisher<CLLocation, Never> {
        locationSubject.eraseToAnyPublisher()
    }

    // Configuration
    var desiredAccuracy: CLLocationAccuracy = kCLLocationAccuracyBest {
        didSet {
            locationManager.desiredAccuracy = desiredAccuracy
        }
    }

    var distanceFilter: CLLocationDistance = kCLDistanceFilterNone {
        didSet {
            locationManager.distanceFilter = distanceFilter
        }
    }

    private override init() {
        self.authorizationStatus = locationManager.authorizationStatus
        super.init()
        
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = kCLDistanceFilterNone
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true
        
        // Activity type for vehicle tracking
        locationManager.activityType = .automotiveNavigation
    }

    // MARK: - Permission Management

    func requestPermission() {
        let status = locationManager.authorizationStatus

        switch status {
        case .notDetermined:
            locationManager.requestAlwaysAuthorization()
        case .restricted, .denied:
            locationError = .permissionDenied
        case .authorizedWhenInUse:
            // Request upgrade to always
            locationManager.requestAlwaysAuthorization()
        case .authorizedAlways:
            break
        @unknown default:
            break
        }
    }

    var hasPermission: Bool {
        let status = locationManager.authorizationStatus
        return status == .authorizedAlways || status == .authorizedWhenInUse
    }

    var hasAlwaysPermission: Bool {
        return locationManager.authorizationStatus == .authorizedAlways
    }

    // MARK: - Location Updates

    func startUpdatingLocation() {
        guard hasPermission else {
            locationError = .permissionDenied
            requestPermission()
            return
        }

        locationManager.startUpdatingLocation()
        isUpdatingLocation = true
        locationError = nil
    }

    func stopUpdatingLocation() {
        locationManager.stopUpdatingLocation()
        isUpdatingLocation = false
    }

    // MARK: - Background Location

    func enableBackgroundUpdates() {
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }

    func disableBackgroundUpdates() {
        locationManager.allowsBackgroundLocationUpdates = false
        locationManager.pausesLocationUpdatesAutomatically = true
    }

    // MARK: - Significant Location Changes

    func startMonitoringSignificantLocationChanges() {
        guard hasPermission else {
            locationError = .permissionDenied
            return
        }

        locationManager.startMonitoringSignificantLocationChanges()
    }

    func stopMonitoringSignificantLocationChanges() {
        locationManager.stopMonitoringSignificantLocationChanges()
    }

    // MARK: - Battery Optimization

    func setBatteryOptimization(_ enabled: Bool) {
        if enabled {
            // Use significant location changes when possible
            desiredAccuracy = kCLLocationAccuracyHundredMeters
            distanceFilter = 100 // 100 meters
            locationManager.pausesLocationUpdatesAutomatically = true
        } else {
            // Use best accuracy for trip tracking
            desiredAccuracy = kCLLocationAccuracyBest
            distanceFilter = kCLDistanceFilterNone
            locationManager.pausesLocationUpdatesAutomatically = false
        }
    }

    // MARK: - Distance Calculation

    func calculateDistance(from start: CLLocation, to end: CLLocation) -> Double {
        let distanceMeters = start.distance(from: end)
        return distanceMeters * 0.000621371 // Convert meters to miles
    }

    func calculateTotalDistance(coordinates: [TripCoordinate]) -> Double {
        guard coordinates.count > 1 else { return 0 }

        var totalDistance: Double = 0

        for i in 1..<coordinates.count {
            let start = coordinates[i-1].clLocation
            let end = coordinates[i].clLocation
            totalDistance += calculateDistance(from: start, to: end)
        }

        return totalDistance
    }

    // MARK: - Speed Calculation

    func calculateAverageSpeed(coordinates: [TripCoordinate]) -> Double {
        let speeds = coordinates.compactMap { $0.speed }
        guard !speeds.isEmpty else { return 0 }
        return speeds.reduce(0, +) / Double(speeds.count)
    }

    func calculateMaxSpeed(coordinates: [TripCoordinate]) -> Double {
        return coordinates.compactMap { $0.speed }.max() ?? 0
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationManager: CLLocationManagerDelegate {
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            locationError = nil
        case .denied, .restricted:
            locationError = .permissionDenied
            stopUpdatingLocation()
        case .notDetermined:
            break
        @unknown default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Filter out old or inaccurate locations
        let age = abs(location.timestamp.timeIntervalSinceNow)
        guard age < 10 else { return } // Ignore locations older than 10 seconds

        guard location.horizontalAccuracy >= 0 && location.horizontalAccuracy <= 100 else {
            return // Ignore inaccurate locations (> 100 meters)
        }

        self.location = location
        locationSubject.send(location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let clError = error as? CLError {
            switch clError.code {
            case .denied:
                locationError = .permissionDenied
            case .network:
                locationError = .networkError
            case .locationUnknown:
                locationError = .locationUnavailable
            default:
                locationError = .unknown(error.localizedDescription)
            }
        } else {
            locationError = .unknown(error.localizedDescription)
        }
        
        print("Location error: \(error.localizedDescription)")
    }
}

// MARK: - Location Error
enum LocationError: Error, LocalizedError {
    case permissionDenied
    case locationUnavailable
    case networkError
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Location permission denied. Please enable location access in Settings."
        case .locationUnavailable:
            return "Current location is unavailable. Please try again."
        case .networkError:
            return "Network error while getting location."
        case .unknown(let message):
            return "Location error: \(message)"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .permissionDenied:
            return "Go to Settings > Privacy > Location Services and enable location access for Capital Tech Alliance Fleet."
        case .locationUnavailable:
            return "Make sure you are outdoors or near a window for better GPS signal."
        case .networkError:
            return "Check your internet connection and try again."
        case .unknown:
            return "Please try again later."
        }
    }
}
