//
//  AddTripViewModel.swift
//  Fleet Manager
//
//  ViewModel for Add Trip functionality with GPS integration and trip creation
//

import Foundation
import CoreLocation
import SwiftUI
import Combine

// MARK: - Location Permission Status
enum LocationPermissionStatus {
    case notDetermined
    case authorized
    case denied
    case restricted
}

// MARK: - Add Trip View Model
@MainActor
final class AddTripViewModel: NSObject, ObservableObject {

    // MARK: - Published Properties
    @Published var availableVehicles: [Vehicle] = []
    @Published var currentLocation: CLLocation?
    @Published var currentAddress: String?
    @Published var locationPermissionStatus: LocationPermissionStatus = .notDetermined
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    // MARK: - Private Properties
    private let locationManager = CLLocationManager()
    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private let geocoder = CLGeocoder()
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    override init() {
        super.init()
        setupLocationManager()
    }

    // MARK: - Setup
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10
        updateLocationPermissionStatus()
    }

    func initialize() async {
        await loadVehicles()
        if locationPermissionStatus == .authorized {
            startLocationUpdates()
        }
    }

    // MARK: - Location Permission
    func requestLocationPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    private func updateLocationPermissionStatus() {
        let status: CLAuthorizationStatus
        if #available(iOS 14.0, *) {
            status = locationManager.authorizationStatus
        } else {
            status = CLLocationManager.authorizationStatus()
        }

        switch status {
        case .notDetermined:
            locationPermissionStatus = .notDetermined
        case .authorizedWhenInUse, .authorizedAlways:
            locationPermissionStatus = .authorized
            startLocationUpdates()
        case .denied:
            locationPermissionStatus = .denied
        case .restricted:
            locationPermissionStatus = .restricted
        @unknown default:
            locationPermissionStatus = .notDetermined
        }
    }

    private func startLocationUpdates() {
        locationManager.startUpdatingLocation()
    }

    // MARK: - Load Vehicles
    private func loadVehicles() async {
        isLoading = true

        // Try to load from cache first
        if let cached = persistenceManager.getCachedVehicles() {
            availableVehicles = cached.filter { $0.status == .active || $0.status == .idle }
        }

        // Fetch from API
        do {
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.vehicles,
                method: .GET,
                responseType: VehiclesResponse.self
            )

            availableVehicles = response.vehicles.filter { $0.status == .active || $0.status == .idle }

            // Update cache
            persistenceManager.cacheVehicles(response.vehicles)

        } catch {
            print("Failed to load vehicles: \(error.localizedDescription)")
            // Keep using cached data if available
        }

        isLoading = false
    }

    // MARK: - Vehicle Filtering
    func filteredVehicles(searchText: String) -> [Vehicle] {
        guard !searchText.isEmpty else {
            return availableVehicles
        }

        return availableVehicles.filter { vehicle in
            vehicle.number.localizedCaseInsensitiveContains(searchText) ||
            vehicle.make.localizedCaseInsensitiveContains(searchText) ||
            vehicle.model.localizedCaseInsensitiveContains(searchText) ||
            vehicle.licensePlate.localizedCaseInsensitiveContains(searchText) ||
            vehicle.department.localizedCaseInsensitiveContains(searchText)
        }
    }

    // MARK: - Geocoding
    private func reverseGeocodeLocation(_ location: CLLocation) {
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
            guard let self = self else { return }

            Task { @MainActor in
                if let error = error {
                    print("Geocoding error: \(error.localizedDescription)")
                    self.currentAddress = "Location: \(location.coordinate.latitude), \(location.coordinate.longitude)"
                    return
                }

                if let placemark = placemarks?.first {
                    var addressComponents: [String] = []

                    if let streetNumber = placemark.subThoroughfare {
                        addressComponents.append(streetNumber)
                    }
                    if let street = placemark.thoroughfare {
                        addressComponents.append(street)
                    }
                    if let city = placemark.locality {
                        addressComponents.append(city)
                    }
                    if let state = placemark.administrativeArea {
                        addressComponents.append(state)
                    }

                    self.currentAddress = addressComponents.joined(separator: ", ")
                } else {
                    self.currentAddress = "Location: \(location.coordinate.latitude), \(location.coordinate.longitude)"
                }
            }
        }
    }

    // MARK: - Start Trip
    func startTrip(
        vehicleId: String,
        purpose: String?,
        odometerReading: Double,
        startLocation: CLLocationCoordinate2D
    ) async throws {
        isLoading = true
        defer { isLoading = false }

        // Create trip request
        let tripData: [String: Any] = [
            "vehicleId": vehicleId,
            "startTime": ISO8601DateFormatter().string(from: Date()),
            "startLocation": [
                "lat": startLocation.latitude,
                "lng": startLocation.longitude,
                "address": currentAddress ?? ""
            ],
            "odometerReading": odometerReading,
            "purpose": purpose as Any,
            "status": "in_progress"
        ]

        do {
            // POST to API
            let _: TripResponse = try await networkManager.performRequest(
                endpoint: "/v1/trips",
                method: .POST,
                body: tripData,
                responseType: TripResponse.self
            )

            print("Trip started successfully")

        } catch {
            print("Failed to start trip: \(error.localizedDescription)")
            throw error
        }
    }
}

// MARK: - CLLocationManagerDelegate
extension AddTripViewModel: CLLocationManagerDelegate {

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            updateLocationPermissionStatus()
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        Task { @MainActor in
            self.currentLocation = location
            self.reverseGeocodeLocation(location)

            // Stop updating after we get a good location
            if location.horizontalAccuracy < 50 {
                manager.stopUpdatingLocation()
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            print("Location error: \(error.localizedDescription)")
            self.errorMessage = "Failed to get location: \(error.localizedDescription)"
        }
    }
}
