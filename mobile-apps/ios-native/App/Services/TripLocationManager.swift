//
//  TripLocationManager.swift
//  Fleet Management
//
//  GPS and Location Tracking Service for Trip Recording
//

import Foundation
import CoreLocation
import Combine

/// Main location manager for tracking vehicle trips with GPS
@MainActor
class TripLocationManager: NSObject, ObservableObject {

    // MARK: - Published Properties

    @Published var currentLocation: CLLocation?
    @Published var currentSpeed: Double = 0 // in mph
    @Published var totalDistance: Double = 0 // in miles
    @Published var isTracking: Bool = false
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var locationError: String?

    // MARK: - Private Properties

    private let locationManager = CLLocationManager()
    private var tripCoordinates: [CLLocationCoordinate2D] = []
    private var lastLocation: CLLocation?
    private var startTime: Date?
    private var pausedDuration: TimeInterval = 0
    private var pauseStartTime: Date?

    // MARK: - Trip Statistics

    var maxSpeed: Double = 0
    var averageSpeed: Double {
        guard let startTime = startTime else { return 0 }
        let duration = Date().timeIntervalSince(startTime) - pausedDuration
        guard duration > 0 else { return 0 }
        return (totalDistance / duration) * 3600 // miles per hour
    }

    var tripDuration: TimeInterval {
        guard let startTime = startTime else { return 0 }
        return Date().timeIntervalSince(startTime) - pausedDuration
    }

    // MARK: - Initialization

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.activityType = .automotiveNavigation
        locationManager.distanceFilter = 5 // Update every 5 meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true

        authorizationStatus = locationManager.authorizationStatus
    }

    // MARK: - Public Methods

    /// Request location permissions from the user
    func requestPermissions() {
        switch locationManager.authorizationStatus {
        case .notDetermined:
            // Request "When In Use" first, then can request "Always" later
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse:
            // Request "Always" authorization for background tracking
            locationManager.requestAlwaysAuthorization()
        case .authorizedAlways:
            // Already have full permissions
            print("✅ Location permissions: Always authorized")
        case .denied, .restricted:
            locationError = "Location access denied. Please enable in Settings."
            print("❌ Location permissions denied or restricted")
        @unknown default:
            print("⚠️ Unknown authorization status")
        }
    }

    /// Start tracking a new trip
    func startTracking() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            locationError = "Location permissions not granted"
            requestPermissions()
            return
        }

        // Reset trip data
        tripCoordinates.removeAll()
        totalDistance = 0
        maxSpeed = 0
        lastLocation = nil
        startTime = Date()
        pausedDuration = 0
        pauseStartTime = nil
        locationError = nil

        // Start location updates
        isTracking = true
        locationManager.startUpdatingLocation()

        print("🚗 GPS tracking started")
    }

    /// Pause trip tracking
    func pauseTracking() {
        guard isTracking else { return }

        locationManager.stopUpdatingLocation()
        pauseStartTime = Date()

        print("⏸️ GPS tracking paused")
    }

    /// Resume trip tracking after pause
    func resumeTracking() {
        guard isTracking else { return }

        if let pauseStart = pauseStartTime {
            pausedDuration += Date().timeIntervalSince(pauseStart)
            pauseStartTime = nil
        }

        locationManager.startUpdatingLocation()

        print("▶️ GPS tracking resumed")
    }

    /// Stop tracking and return all recorded coordinates
    func stopTracking() -> [CLLocationCoordinate2D] {
        guard isTracking else { return [] }

        isTracking = false
        locationManager.stopUpdatingLocation()

        // If we were paused, add that duration
        if let pauseStart = pauseStartTime {
            pausedDuration += Date().timeIntervalSince(pauseStart)
            pauseStartTime = nil
        }

        let coordinates = tripCoordinates

        print("🏁 GPS tracking stopped - Total distance: \(String(format: "%.2f", totalDistance)) miles")
        print("📍 Recorded \(coordinates.count) location points")

        return coordinates
    }

    /// Get current trip statistics
    func getTripStats() -> TripStats {
        TripStats(
            distance: totalDistance,
            duration: tripDuration,
            averageSpeed: averageSpeed,
            maxSpeed: maxSpeed,
            coordinates: tripCoordinates
        )
    }

    // MARK: - Private Methods

    private func calculateDistance(from: CLLocation, to: CLLocation) -> Double {
        // Returns distance in miles
        let meters = from.distance(from: to)
        return meters * 0.000621371 // Convert meters to miles
    }

    private func calculateSpeed(from location: CLLocation) -> Double {
        // Convert m/s to mph
        guard location.speed >= 0 else { return 0 }
        return location.speed * 2.23694
    }
}

// MARK: - CLLocationManagerDelegate

extension TripLocationManager: CLLocationManagerDelegate {

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            guard isTracking else { return }

            for location in locations {
                // Filter out inaccurate locations
                guard location.horizontalAccuracy >= 0 && location.horizontalAccuracy <= 50 else {
                    continue
                }

                currentLocation = location

                // Calculate speed
                let speed = calculateSpeed(from: location)
                currentSpeed = speed

                // Update max speed
                if speed > maxSpeed {
                    maxSpeed = speed
                }

                // Calculate distance if we have a previous location
                if let last = lastLocation {
                    let distance = calculateDistance(from: last, to: location)

                    // Only add distance if movement is reasonable (not GPS drift)
                    if distance > 0.001 { // More than ~5 feet
                        totalDistance += distance
                    }
                }

                // Store the coordinate
                tripCoordinates.append(location.coordinate)
                lastLocation = location
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            locationError = error.localizedDescription
            print("❌ Location error: \(error.localizedDescription)")
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            authorizationStatus = manager.authorizationStatus

            switch manager.authorizationStatus {
            case .notDetermined:
                print("📍 Location authorization: Not determined")
            case .restricted:
                print("🚫 Location authorization: Restricted")
                locationError = "Location access is restricted"
            case .denied:
                print("❌ Location authorization: Denied")
                locationError = "Location access denied. Enable in Settings."
            case .authorizedAlways:
                print("✅ Location authorization: Always")
                locationError = nil
            case .authorizedWhenInUse:
                print("⚠️ Location authorization: When In Use (consider requesting Always for background tracking)")
                locationError = nil
            @unknown default:
                print("⚠️ Location authorization: Unknown status")
            }
        }
    }
}

// MARK: - Trip Statistics Model

struct TripStats {
    let distance: Double // miles
    let duration: TimeInterval // seconds
    let averageSpeed: Double // mph
    let maxSpeed: Double // mph
    let coordinates: [CLLocationCoordinate2D]
}
