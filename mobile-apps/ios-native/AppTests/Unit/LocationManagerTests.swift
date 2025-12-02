//
//  LocationManagerTests.swift
//  Fleet Management App Tests
//
//  Unit tests for location tracking and CoreLocation integration
//

import XCTest
import CoreLocation
@testable import App

class LocationManagerTests: XCTestCase {

    var mockLocationManager: MockCLLocationManager!
    var locationDelegate: LocationManagerDelegate!

    override func setUpWithError() throws {
        try super.setUpWithError()
        mockLocationManager = MockCLLocationManager()
        locationDelegate = LocationManagerDelegate()
    }

    override func tearDownWithError() throws {
        mockLocationManager = nil
        locationDelegate = nil
        try super.tearDownWithError()
    }

    // MARK: - Authorization Tests

    func testLocationAuthorizationStatusWhenAuthorized() throws {
        // Given
        mockLocationManager.authorizationStatus = .authorizedAlways

        // Then
        XCTAssertEqual(mockLocationManager.authorizationStatus, .authorizedAlways)
    }

    func testLocationAuthorizationStatusWhenDenied() throws {
        // Given
        mockLocationManager.authorizationStatus = .denied

        // Then
        XCTAssertEqual(mockLocationManager.authorizationStatus, .denied)
    }

    func testLocationAuthorizationStatusWhenNotDetermined() throws {
        // Given
        mockLocationManager.authorizationStatus = .notDetermined

        // Then
        XCTAssertEqual(mockLocationManager.authorizationStatus, .notDetermined)
    }

    func testRequestWhenInUseAuthorization() throws {
        // Given
        var requestCalled = false
        mockLocationManager.onRequestWhenInUseAuthorization = {
            requestCalled = true
        }

        // When
        mockLocationManager.requestWhenInUseAuthorization()

        // Then
        XCTAssertTrue(requestCalled)
    }

    func testRequestAlwaysAuthorization() throws {
        // Given
        var requestCalled = false
        mockLocationManager.onRequestAlwaysAuthorization = {
            requestCalled = true
        }

        // When
        mockLocationManager.requestAlwaysAuthorization()

        // Then
        XCTAssertTrue(requestCalled)
    }

    // MARK: - Location Update Tests

    func testStartUpdatingLocation() throws {
        // Given
        var startCalled = false
        mockLocationManager.onStartUpdatingLocation = {
            startCalled = true
        }

        // When
        mockLocationManager.startUpdatingLocation()

        // Then
        XCTAssertTrue(startCalled)
        XCTAssertTrue(mockLocationManager.isUpdatingLocation)
    }

    func testStopUpdatingLocation() throws {
        // Given
        mockLocationManager.startUpdatingLocation()
        var stopCalled = false
        mockLocationManager.onStopUpdatingLocation = {
            stopCalled = true
        }

        // When
        mockLocationManager.stopUpdatingLocation()

        // Then
        XCTAssertTrue(stopCalled)
        XCTAssertFalse(mockLocationManager.isUpdatingLocation)
    }

    func testLocationUpdateReceived() throws {
        // Given
        let expectation = expectation(description: "Location update received")
        let testLocation = CLLocation(latitude: 37.7749, longitude: -122.4194)

        locationDelegate.onLocationUpdate = { locations in
            XCTAssertEqual(locations.count, 1)
            XCTAssertEqual(locations.first?.coordinate.latitude, 37.7749, accuracy: 0.0001)
            XCTAssertEqual(locations.first?.coordinate.longitude, -122.4194, accuracy: 0.0001)
            expectation.fulfill()
        }

        // When
        locationDelegate.didUpdateLocations([testLocation])

        // Then
        waitForExpectations(timeout: 1.0)
    }

    func testMultipleLocationUpdatesReceived() throws {
        // Given
        let expectation = expectation(description: "Multiple location updates received")
        let locations = [
            CLLocation(latitude: 37.7749, longitude: -122.4194),
            CLLocation(latitude: 37.7750, longitude: -122.4195),
            CLLocation(latitude: 37.7751, longitude: -122.4196)
        ]

        locationDelegate.onLocationUpdate = { receivedLocations in
            XCTAssertEqual(receivedLocations.count, 3)
            expectation.fulfill()
        }

        // When
        locationDelegate.didUpdateLocations(locations)

        // Then
        waitForExpectations(timeout: 1.0)
    }

    // MARK: - Location Error Tests

    func testLocationUpdateError() throws {
        // Given
        let expectation = expectation(description: "Location error received")
        let error = NSError(domain: kCLErrorDomain, code: CLError.denied.rawValue)

        locationDelegate.onError = { receivedError in
            XCTAssertEqual((receivedError as NSError).code, CLError.denied.rawValue)
            expectation.fulfill()
        }

        // When
        locationDelegate.didFailWithError(error)

        // Then
        waitForExpectations(timeout: 1.0)
    }

    // MARK: - Distance Calculation Tests

    func testDistanceBetweenLocations() throws {
        // Given
        let sanFrancisco = CLLocation(latitude: 37.7749, longitude: -122.4194)
        let newYork = CLLocation(latitude: 40.7128, longitude: -74.0060)

        // When
        let distance = sanFrancisco.distance(from: newYork)

        // Then
        // Distance between SF and NYC is approximately 4,130 km
        XCTAssertGreaterThan(distance, 4_000_000) // meters
        XCTAssertLessThan(distance, 5_000_000) // meters
    }

    func testDistanceBetweenSameLocation() throws {
        // Given
        let location1 = CLLocation(latitude: 37.7749, longitude: -122.4194)
        let location2 = CLLocation(latitude: 37.7749, longitude: -122.4194)

        // When
        let distance = location1.distance(from: location2)

        // Then
        XCTAssertEqual(distance, 0.0, accuracy: 0.001)
    }

    func testDistanceBetweenNearbyLocations() throws {
        // Given - 100 meters apart
        let location1 = CLLocation(latitude: 37.7749, longitude: -122.4194)
        let location2 = CLLocation(latitude: 37.7758, longitude: -122.4194)

        // When
        let distance = location1.distance(from: location2)

        // Then - Should be approximately 100 meters
        XCTAssertGreaterThan(distance, 90)
        XCTAssertLessThan(distance, 110)
    }

    // MARK: - Location Accuracy Tests

    func testLocationAccuracy() throws {
        // Given
        let highAccuracy = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            altitude: 0,
            horizontalAccuracy: 5,
            verticalAccuracy: 5,
            timestamp: Date()
        )

        let lowAccuracy = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            altitude: 0,
            horizontalAccuracy: 100,
            verticalAccuracy: 100,
            timestamp: Date()
        )

        // Then
        XCTAssertLessThan(highAccuracy.horizontalAccuracy, lowAccuracy.horizontalAccuracy)
        XCTAssertEqual(highAccuracy.horizontalAccuracy, 5, accuracy: 0.1)
    }

    func testLocationAge() throws {
        // Given
        let oldDate = Date().addingTimeInterval(-60) // 1 minute ago
        let oldLocation = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            altitude: 0,
            horizontalAccuracy: 10,
            verticalAccuracy: 10,
            timestamp: oldDate
        )

        // When
        let age = abs(oldLocation.timestamp.timeIntervalSinceNow)

        // Then
        XCTAssertGreaterThan(age, 59)
        XCTAssertLessThan(age, 61)
    }

    // MARK: - Background Location Tests

    func testBackgroundLocationCapability() throws {
        // Given
        mockLocationManager.allowsBackgroundLocationUpdates = true

        // Then
        XCTAssertTrue(mockLocationManager.allowsBackgroundLocationUpdates)
    }

    func testPauseLocationUpdatesAutomatically() throws {
        // Given
        mockLocationManager.pausesLocationUpdatesAutomatically = true

        // Then
        XCTAssertTrue(mockLocationManager.pausesLocationUpdatesAutomatically)
    }

    // MARK: - Desired Accuracy Tests

    func testSetDesiredAccuracyBest() throws {
        // Given / When
        mockLocationManager.desiredAccuracy = kCLLocationAccuracyBest

        // Then
        XCTAssertEqual(mockLocationManager.desiredAccuracy, kCLLocationAccuracyBest)
    }

    func testSetDesiredAccuracyNearestTenMeters() throws {
        // Given / When
        mockLocationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters

        // Then
        XCTAssertEqual(mockLocationManager.desiredAccuracy, kCLLocationAccuracyNearestTenMeters)
    }

    func testSetDesiredAccuracyHundredMeters() throws {
        // Given / When
        mockLocationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters

        // Then
        XCTAssertEqual(mockLocationManager.desiredAccuracy, kCLLocationAccuracyHundredMeters)
    }

    // MARK: - Distance Filter Tests

    func testSetDistanceFilter() throws {
        // Given / When
        mockLocationManager.distanceFilter = 100.0

        // Then
        XCTAssertEqual(mockLocationManager.distanceFilter, 100.0)
    }

    func testDistanceFilterNone() throws {
        // Given / When
        mockLocationManager.distanceFilter = kCLDistanceFilterNone

        // Then
        XCTAssertEqual(mockLocationManager.distanceFilter, kCLDistanceFilterNone)
    }

    // MARK: - Performance Tests

    func testLocationUpdatePerformance() throws {
        // Given
        let locations = (0..<100).map { i in
            CLLocation(
                latitude: 37.7749 + Double(i) * 0.0001,
                longitude: -122.4194 + Double(i) * 0.0001
            )
        }

        // When / Then
        measure {
            locationDelegate.didUpdateLocations(locations)
        }
    }

    func testDistanceCalculationPerformance() throws {
        // Given
        let location1 = CLLocation(latitude: 37.7749, longitude: -122.4194)
        let location2 = CLLocation(latitude: 40.7128, longitude: -74.0060)

        // When / Then
        measure {
            for _ in 0..<1000 {
                _ = location1.distance(from: location2)
            }
        }
    }

    // MARK: - Edge Cases

    func testNegativeLatitude() throws {
        // Given - Southern hemisphere
        let location = CLLocation(latitude: -33.8688, longitude: 151.2093) // Sydney

        // Then
        XCTAssertLessThan(location.coordinate.latitude, 0)
    }

    func testNegativeLongitude() throws {
        // Given - Western hemisphere
        let location = CLLocation(latitude: 37.7749, longitude: -122.4194) // San Francisco

        // Then
        XCTAssertLessThan(location.coordinate.longitude, 0)
    }

    func testEquatorLocation() throws {
        // Given
        let location = CLLocation(latitude: 0.0, longitude: 0.0)

        // Then
        XCTAssertEqual(location.coordinate.latitude, 0.0)
        XCTAssertEqual(location.coordinate.longitude, 0.0)
    }

    func testPrimeMeridianLocation() throws {
        // Given
        let location = CLLocation(latitude: 51.4779, longitude: 0.0) // Greenwich

        // Then
        XCTAssertEqual(location.coordinate.longitude, 0.0)
    }
}

// MARK: - Mock CLLocationManager

class MockCLLocationManager {
    var authorizationStatus: CLAuthorizationStatus = .notDetermined
    var isUpdatingLocation = false
    var allowsBackgroundLocationUpdates = false
    var pausesLocationUpdatesAutomatically = false
    var desiredAccuracy: CLLocationAccuracy = kCLLocationAccuracyBest
    var distanceFilter: CLLocationDistance = kCLDistanceFilterNone

    var onRequestWhenInUseAuthorization: (() -> Void)?
    var onRequestAlwaysAuthorization: (() -> Void)?
    var onStartUpdatingLocation: (() -> Void)?
    var onStopUpdatingLocation: (() -> Void)?

    func requestWhenInUseAuthorization() {
        onRequestWhenInUseAuthorization?()
    }

    func requestAlwaysAuthorization() {
        onRequestAlwaysAuthorization?()
    }

    func startUpdatingLocation() {
        isUpdatingLocation = true
        onStartUpdatingLocation?()
    }

    func stopUpdatingLocation() {
        isUpdatingLocation = false
        onStopUpdatingLocation?()
    }
}

// MARK: - Location Manager Delegate

class LocationManagerDelegate {
    var onLocationUpdate: (([CLLocation]) -> Void)?
    var onError: ((Error) -> Void)?

    func didUpdateLocations(_ locations: [CLLocation]) {
        onLocationUpdate?(locations)
    }

    func didFailWithError(_ error: Error) {
        onError?(error)
    }
}
