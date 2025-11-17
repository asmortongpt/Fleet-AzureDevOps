import Foundation
import CoreLocation
import Combine

// MARK: - Trip Tracking Service
class TripTrackingService: ObservableObject {
    static let shared = TripTrackingService()

    private let locationManager = LocationManager.shared
    private let persistenceManager = DataPersistenceManager.shared
    
    // Published properties
    @Published var currentTrip: Trip?
    @Published var isTracking = false
    @Published var isPaused = false
    @Published var trackingError: TrackingError?
    
    // Real-time statistics
    @Published var currentDistance: Double = 0
    @Published var currentSpeed: Double = 0
    @Published var currentDuration: TimeInterval = 0
    
    private var cancellables = Set<AnyCancellable>()
    private var tripTimer: Timer?
    private var pauseStartTime: Date?
    private var lastLocation: CLLocation?
    
    private init() {
        // Restore active trip if exists
        if let activeTrip = persistenceManager.getActiveTrip() {
            currentTrip = activeTrip
            if activeTrip.status == .active {
                // Resume tracking
                resumeTracking()
            }
        }
        
        setupLocationSubscription()
    }
    
    // MARK: - Setup
    
    private func setupLocationSubscription() {
        locationManager.locationPublisher
            .sink { [weak self] location in
                self?.handleLocationUpdate(location)
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Trip Control
    
    func startTrip(name: String? = nil, vehicleId: String? = nil, driverId: String? = nil) {
        guard !isTracking else {
            trackingError = .tripAlreadyActive
            return
        }
        
        guard locationManager.hasPermission else {
            trackingError = .noLocationPermission
            locationManager.requestPermission()
            return
        }
        
        let tripName = name ?? "Trip - \(Date().formatted(date: .abbreviated, time: .shortened))"
        
        currentTrip = Trip(
            name: tripName,
            startTime: Date(),
            vehicleId: vehicleId,
            driverId: driverId
        )
        
        isTracking = true
        isPaused = false
        currentDistance = 0
        currentSpeed = 0
        currentDuration = 0
        lastLocation = nil
        
        // Apply trip settings
        applyTripSettings()
        
        // Start location updates
        locationManager.enableBackgroundUpdates()
        locationManager.startUpdatingLocation()
        
        // Start duration timer
        startTimer()
        
        // Save active trip
        saveActiveTrip()
        
        print("Trip started: \(tripName)")
    }
    
    func pauseTrip() {
        guard isTracking, !isPaused else { return }
        
        isPaused = true
        pauseStartTime = Date()
        currentTrip?.status = .paused
        
        // Stop location updates to save battery
        locationManager.stopUpdatingLocation()
        
        // Stop timer
        tripTimer?.invalidate()
        tripTimer = nil
        
        saveActiveTrip()
        
        print("Trip paused")
    }
    
    func resumeTrip() {
        guard isTracking, isPaused else { return }
        
        isPaused = false
        
        // Update paused duration
        if let pauseStart = pauseStartTime {
            let pausedTime = Date().timeIntervalSince(pauseStart)
            currentTrip?.pausedDuration += pausedTime
            pauseStartTime = nil
        }
        
        currentTrip?.status = .active
        
        // Resume location updates
        locationManager.startUpdatingLocation()
        
        // Restart timer
        startTimer()
        
        saveActiveTrip()
        
        print("Trip resumed")
    }
    
    func stopTrip(notes: String? = nil) {
        guard isTracking, let trip = currentTrip else { return }
        
        // Stop location updates
        locationManager.stopUpdatingLocation()
        locationManager.disableBackgroundUpdates()
        
        // Stop timer
        tripTimer?.invalidate()
        tripTimer = nil
        
        // Update trip
        var finalTrip = trip
        finalTrip.endTime = Date()
        finalTrip.status = .completed
        finalTrip.notes = notes
        
        // Calculate final statistics
        finalTrip.totalDistance = currentDistance
        finalTrip.averageSpeed = locationManager.calculateAverageSpeed(coordinates: finalTrip.coordinates)
        finalTrip.maxSpeed = locationManager.calculateMaxSpeed(coordinates: finalTrip.coordinates)
        
        // Save trip
        do {
            try persistenceManager.saveTrip(finalTrip)
            persistenceManager.clearActiveTrip()
            print("Trip saved: \(finalTrip.name)")
        } catch {
            trackingError = .saveFailed(error.localizedDescription)
            print("Error saving trip: \(error)")
        }
        
        // Reset state
        currentTrip = nil
        isTracking = false
        isPaused = false
        currentDistance = 0
        currentSpeed = 0
        currentDuration = 0
        lastLocation = nil
        
        print("Trip stopped")
    }
    
    func cancelTrip() {
        guard isTracking, let trip = currentTrip else { return }
        
        // Stop location updates
        locationManager.stopUpdatingLocation()
        locationManager.disableBackgroundUpdates()
        
        // Stop timer
        tripTimer?.invalidate()
        tripTimer = nil
        
        // Mark as cancelled
        var cancelledTrip = trip
        cancelledTrip.endTime = Date()
        cancelledTrip.status = .cancelled
        
        // Optionally save cancelled trip
        try? persistenceManager.saveTrip(cancelledTrip)
        persistenceManager.clearActiveTrip()
        
        // Reset state
        currentTrip = nil
        isTracking = false
        isPaused = false
        currentDistance = 0
        currentSpeed = 0
        currentDuration = 0
        lastLocation = nil
        
        print("Trip cancelled")
    }
    
    // MARK: - Location Handling
    
    private func handleLocationUpdate(_ location: CLLocation) {
        guard isTracking, !isPaused, var trip = currentTrip else { return }
        
        // Create trip coordinate
        let coordinate = TripCoordinate(from: location)
        
        // Add to trip
        trip.coordinates.append(coordinate)
        
        // Calculate distance
        if let last = lastLocation {
            let distance = locationManager.calculateDistance(from: last, to: location)
            currentDistance += distance
        }
        
        // Update current speed
        if let speed = coordinate.speed, speed > 0 {
            currentSpeed = speed
        }
        
        lastLocation = location
        currentTrip = trip
        
        // Save periodically (every 10 coordinates)
        if trip.coordinates.count % 10 == 0 {
            saveActiveTrip()
        }
    }
    
    // MARK: - Timer
    
    private func startTimer() {
        tripTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updateDuration()
        }
    }
    
    private func updateDuration() {
        guard let trip = currentTrip else { return }
        currentDuration = trip.duration
    }
    
    // MARK: - Settings
    
    private func applyTripSettings() {
        let settings = persistenceManager.getTripSettings()
        
        // Apply accuracy settings
        locationManager.desiredAccuracy = settings.desiredAccuracy.coreLocationAccuracy
        
        // Apply battery optimization
        locationManager.setBatteryOptimization(settings.batteryOptimization)
    }
    
    // MARK: - Auto Detection
    
    func enableAutoDetection() {
        locationManager.startMonitoringSignificantLocationChanges()
    }
    
    func disableAutoDetection() {
        locationManager.stopMonitoringSignificantLocationChanges()
    }
    
    // MARK: - Persistence
    
    private func saveActiveTrip() {
        guard var trip = currentTrip else { return }
        
        // Update statistics
        trip.totalDistance = currentDistance
        
        do {
            try persistenceManager.saveActiveTrip(trip)
        } catch {
            print("Error saving active trip: \(error)")
        }
    }
    
    private func resumeTracking() {
        guard let trip = currentTrip else { return }
        
        isTracking = true
        isPaused = trip.status == .paused
        currentDistance = trip.totalDistance
        
        if trip.coordinates.count > 0 {
            lastLocation = trip.coordinates.last?.clLocation
        }
        
        if !isPaused {
            applyTripSettings()
            locationManager.enableBackgroundUpdates()
            locationManager.startUpdatingLocation()
            startTimer()
        }
        
        print("Trip tracking resumed: \(trip.name)")
    }
    
    // MARK: - Utility
    
    func getFormattedDistance() -> String {
        String(format: "%.2f mi", currentDistance)
    }
    
    func getFormattedSpeed() -> String {
        String(format: "%.1f mph", currentSpeed)
    }
    
    func getFormattedDuration() -> String {
        let hours = Int(currentDuration) / 3600
        let minutes = (Int(currentDuration) % 3600) / 60
        let seconds = Int(currentDuration) % 60
        
        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
}

// MARK: - Tracking Error
enum TrackingError: Error, LocalizedError {
    case tripAlreadyActive
    case noLocationPermission
    case saveFailed(String)
    case unknown(String)
    
    var errorDescription: String? {
        switch self {
        case .tripAlreadyActive:
            return "A trip is already in progress"
        case .noLocationPermission:
            return "Location permission is required to track trips"
        case .saveFailed(let message):
            return "Failed to save trip: \(message)"
        case .unknown(let message):
            return "Tracking error: \(message)"
        }
    }
}
