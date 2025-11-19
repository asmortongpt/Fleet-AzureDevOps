import Foundation
import CoreLocation
import Combine

/**
 * Location Manager
 *
 * Manages GPS tracking with battery optimization:
 * - Adaptive accuracy based on movement
 * - Automatic pause when stationary
 * - Background location updates
 * - Geofencing support
 * - Trip tracking with breadcrumb trail
 */

class LocationManager: NSObject, ObservableObject {
    static let shared = LocationManager()

    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isTracking = false
    @Published var currentTrip: TripTracking?

    private let locationManager = CLLocationManager()
    private let coreData = CoreDataStack.shared

    private var locationBuffer: [CLLocation] = []
    private let bufferSize = 10
    private var lastSignificantLocation: CLLocation?

    private override init() {
        super.init()
        setupLocationManager()
    }

    // MARK: - Setup

    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10 // meters
        locationManager.pausesLocationUpdatesAutomatically = true
        locationManager.activityType = .automotiveNavigation
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.showsBackgroundLocationIndicator = true

        authorizationStatus = locationManager.authorizationStatus
    }

    // MARK: - Authorization

    func requestPermission() {
        switch authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse:
            locationManager.requestAlwaysAuthorization()
        default:
            break
        }
    }

    // MARK: - Tracking Control

    func startTracking(mode: TrackingMode = .standard) {
        guard authorizationStatus == .authorizedAlways ||
              authorizationStatus == .authorizedWhenInUse else {
            print("⚠️ Location permission not granted")
            requestPermission()
            return
        }

        configureForMode(mode)
        locationManager.startUpdatingLocation()
        isTracking = true

        print("📍 Location tracking started (\(mode))")
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        isTracking = false
        print("📍 Location tracking stopped")
    }

    func pauseTracking() {
        locationManager.allowsBackgroundLocationUpdates = false
        locationManager.pausesLocationUpdatesAutomatically = true
    }

    func resumeTracking() {
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = true
    }

    private func configureForMode(_ mode: TrackingMode) {
        switch mode {
        case .highAccuracy:
            locationManager.desiredAccuracy = kCLLocationAccuracyBest
            locationManager.distanceFilter = 5

        case .standard:
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
            locationManager.distanceFilter = 10

        case .batterySaver:
            locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
            locationManager.distanceFilter = 50

        case .significant:
            locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
            locationManager.distanceFilter = kCLDistanceFilterNone
            locationManager.startMonitoringSignificantLocationChanges()
        }
    }

    // MARK: - Trip Tracking

    func startTrip(vehicleId: Int64, driverId: Int64, purpose: String?) {
        guard let currentLocation = location else {
            print("⚠️ Cannot start trip: no location available")
            return
        }

        let trip = TripTracking(
            vehicleId: vehicleId,
            driverId: driverId,
            startLocation: currentLocation,
            startOdometer: 0, // Should be provided by user
            purpose: purpose
        )

        currentTrip = trip
        startTracking(mode: .standard)

        print("🚗 Trip started")
    }

    func endTrip(endOdometer: Double) {
        guard var trip = currentTrip else {
            print("⚠️ No active trip to end")
            return
        }

        guard let currentLocation = location else {
            print("⚠️ Cannot end trip: no location available")
            return
        }

        trip.endLocation = currentLocation
        trip.endOdometer = endOdometer
        trip.endTime = Date()

        // Calculate distance and duration
        trip.calculateMetrics()

        // Save trip to Core Data
        saveTripToDatabase(trip)

        // Clear current trip
        currentTrip = nil
        stopTracking()

        print("🏁 Trip ended: \(String(format: "%.2f", trip.distance))km in \(trip.formattedDuration)")
    }

    private func saveTripToDatabase(_ tripTracking: TripTracking) {
        coreData.performBackgroundTask { context in
            let trip = Trip(context: context)
            trip.id = Int64.random(in: 1...Int64.max) // Temporary ID
            trip.tenantId = Int64(UserDefaults.standard.integer(forKey: "tenantId"))
            trip.vehicleId = tripTracking.vehicleId
            trip.driverId = tripTracking.driverId
            trip.startOdometer = tripTracking.startOdometer
            trip.endOdometer = tripTracking.endOdometer
            trip.startLatitude = tripTracking.startLocation.coordinate.latitude
            trip.startLongitude = tripTracking.startLocation.coordinate.longitude
            trip.endLatitude = tripTracking.endLocation?.coordinate.latitude ?? 0
            trip.endLongitude = tripTracking.endLocation?.coordinate.longitude ?? 0
            trip.startTime = tripTracking.startTime
            trip.endTime = tripTracking.endTime
            trip.purpose = tripTracking.purpose
            trip.distance = tripTracking.distance
            trip.duration = Int64(tripTracking.duration)
            trip.createdAt = Date()
            trip.needsSync = true

            // Save route as JSON
            if let routeData = try? JSONEncoder().encode(tripTracking.route),
               let routeString = String(data: routeData, encoding: .utf8) {
                trip.route = routeString
            }

            do {
                try context.save()
                print("💾 Trip saved to database")

                // Queue for sync
                SyncEngine.shared.queueOperation(
                    entityType: "trip",
                    entityId: trip.id,
                    operation: "create",
                    payload: [
                        "vehicleId": tripTracking.vehicleId,
                        "driverId": tripTracking.driverId,
                        "startOdometer": tripTracking.startOdometer,
                        "endOdometer": tripTracking.endOdometer,
                        "startLatitude": tripTracking.startLocation.coordinate.latitude,
                        "startLongitude": tripTracking.startLocation.coordinate.longitude,
                        "endLatitude": tripTracking.endLocation?.coordinate.latitude ?? 0,
                        "endLongitude": tripTracking.endLocation?.coordinate.longitude ?? 0,
                        "startTime": tripTracking.startTime.iso8601String,
                        "endTime": tripTracking.endTime?.iso8601String ?? "",
                        "purpose": tripTracking.purpose ?? "",
                        "distance": tripTracking.distance,
                        "duration": tripTracking.duration
                    ],
                    priority: 2
                )
            } catch {
                print("❌ Failed to save trip: \(error)")
            }
        }
    }

    // MARK: - Geofencing

    func monitorGeofence(latitude: Double, longitude: Double, radius: Double, identifier: String) {
        let region = CLCircularRegion(
            center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
            radius: radius,
            identifier: identifier
        )

        region.notifyOnEntry = true
        region.notifyOnExit = true

        locationManager.startMonitoring(for: region)

        print("🗺️ Monitoring geofence: \(identifier)")
    }

    func stopMonitoringGeofence(_ identifier: String) {
        for region in locationManager.monitoredRegions {
            if region.identifier == identifier {
                locationManager.stopMonitoring(for: region)
                print("🗺️ Stopped monitoring geofence: \(identifier)")
            }
        }
    }

    // MARK: - Helper Methods

    func calculateDistance(from: CLLocation, to: CLLocation) -> Double {
        return from.distance(from: to) / 1000.0 // Convert to kilometers
    }

    func isLocationAccurate(_ location: CLLocation) -> Bool {
        return location.horizontalAccuracy >= 0 && location.horizontalAccuracy <= 50
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus

        print("📍 Location authorization changed: \(authorizationStatus.description)")
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newLocation = locations.last else { return }

        // Filter out inaccurate locations
        guard isLocationAccurate(newLocation) else {
            print("⚠️ Location accuracy too low: \(newLocation.horizontalAccuracy)m")
            return
        }

        // Update current location
        location = newLocation

        // Add to buffer for smoothing
        locationBuffer.append(newLocation)
        if locationBuffer.count > bufferSize {
            locationBuffer.removeFirst()
        }

        // Add to current trip route
        if currentTrip != nil {
            addLocationToTrip(newLocation)
        }

        // Check if location changed significantly
        if let lastLocation = lastSignificantLocation {
            let distance = calculateDistance(from: lastLocation, to: newLocation)

            if distance >= 0.1 { // 100 meters
                lastSignificantLocation = newLocation
                handleSignificantLocationChange(newLocation)
            }
        } else {
            lastSignificantLocation = newLocation
        }

        print("📍 Location updated: \(newLocation.coordinate.latitude), \(newLocation.coordinate.longitude)")
    }

    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        print("📍 Entered geofence: \(region.identifier)")

        // Post notification
        NotificationCenter.default.post(
            name: .didEnterGeofence,
            object: nil,
            userInfo: ["identifier": region.identifier]
        )
    }

    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        print("📍 Exited geofence: \(region.identifier)")

        // Post notification
        NotificationCenter.default.post(
            name: .didExitGeofence,
            object: nil,
            userInfo: ["identifier": region.identifier]
        )
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location manager error: \(error.localizedDescription)")
    }

    private func addLocationToTrip(_ location: CLLocation) {
        currentTrip?.route.append(CoordinatePoint(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            timestamp: location.timestamp,
            speed: location.speed >= 0 ? location.speed : nil,
            heading: location.course >= 0 ? location.course : nil
        ))

        // Update distance
        if let lastPoint = currentTrip?.route.dropLast().last {
            let lastLocation = CLLocation(
                latitude: lastPoint.latitude,
                longitude: lastPoint.longitude
            )
            currentTrip?.distance += calculateDistance(from: lastLocation, to: location)
        }
    }

    private func handleSignificantLocationChange(_ location: CLLocation) {
        // Update vehicle location in database if needed
        // This could trigger sync or local updates
    }
}

// MARK: - Supporting Types

enum TrackingMode {
    case highAccuracy
    case standard
    case batterySaver
    case significant
}

struct TripTracking {
    let vehicleId: Int64
    let driverId: Int64
    let startLocation: CLLocation
    let startOdometer: Double
    var endLocation: CLLocation?
    var endOdometer: Double = 0
    let startTime: Date
    var endTime: Date?
    let purpose: String?

    var route: [CoordinatePoint] = []
    var distance: Double = 0
    var duration: TimeInterval = 0

    init(vehicleId: Int64, driverId: Int64, startLocation: CLLocation, startOdometer: Double, purpose: String?) {
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.startLocation = startLocation
        self.startOdometer = startOdometer
        self.purpose = purpose
        self.startTime = Date()

        // Add starting point to route
        self.route.append(CoordinatePoint(
            latitude: startLocation.coordinate.latitude,
            longitude: startLocation.coordinate.longitude,
            timestamp: startTime,
            speed: nil,
            heading: nil
        ))
    }

    mutating func calculateMetrics() {
        if let end = endTime {
            duration = end.timeIntervalSince(startTime)
        }
    }

    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        return String(format: "%dh %dm", hours, minutes)
    }
}

struct CoordinatePoint: Codable {
    let latitude: Double
    let longitude: Double
    let timestamp: Date
    let speed: Double?
    let heading: Double?
}

// MARK: - Extensions

extension CLAuthorizationStatus {
    var description: String {
        switch self {
        case .notDetermined: return "Not Determined"
        case .restricted: return "Restricted"
        case .denied: return "Denied"
        case .authorizedAlways: return "Always Authorized"
        case .authorizedWhenInUse: return "When In Use"
        @unknown default: return "Unknown"
        }
    }
}

extension Notification.Name {
    static let didEnterGeofence = Notification.Name("didEnterGeofence")
    static let didExitGeofence = Notification.Name("didExitGeofence")
}

extension Date {
    var iso8601String: String {
        let formatter = ISO8601DateFormatter()
        return formatter.string(from: self)
    }
}
