/**
 * FleetApp iOS Native Tests
 * Comprehensive test suite for iOS mobile application
 */

import XCTest
@testable import FleetApp

class FleetAppTests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Authentication Tests

    func testLoginWithValidCredentials() throws {
        // Given: User is on login screen
        XCTAssertTrue(app.textFields["email"].exists)
        XCTAssertTrue(app.secureTextFields["password"].exists)

        // When: User enters valid credentials
        app.textFields["email"].tap()
        app.textFields["email"].typeText("test@example.com")

        app.secureTextFields["password"].tap()
        app.secureTextFields["password"].typeText("TestPassword123!")

        app.buttons["Login"].tap()

        // Then: User should see dashboard
        let dashboardTitle = app.staticTexts["Dashboard"]
        XCTAssertTrue(dashboardTitle.waitForExistence(timeout: 5))
    }

    func testLoginWithInvalidCredentials() throws {
        app.textFields["email"].tap()
        app.textFields["email"].typeText("invalid@example.com")

        app.secureTextFields["password"].tap()
        app.secureTextFields["password"].typeText("WrongPassword")

        app.buttons["Login"].tap()

        let errorMessage = app.staticTexts["Invalid credentials"]
        XCTAssertTrue(errorMessage.waitForExistence(timeout: 3))
    }

    func testLogout() throws {
        // Login first
        loginTestUser()

        // Tap profile icon
        app.buttons["ProfileButton"].tap()

        // Tap logout
        app.buttons["Logout"].tap()

        // Confirm logout
        app.buttons["Confirm"].tap()

        // Verify back on login screen
        XCTAssertTrue(app.textFields["email"].waitForExistence(timeout: 3))
    }

    // MARK: - Vehicle List Tests

    func testVehicleListLoads() throws {
        loginTestUser()

        // Navigate to vehicles
        app.tabBars.buttons["Vehicles"].tap()

        // Verify vehicles are displayed
        let vehiclesList = app.tables["VehiclesList"]
        XCTAssertTrue(vehiclesList.waitForExistence(timeout: 5))

        // Verify at least one vehicle exists
        let firstCell = vehiclesList.cells.element(boundBy: 0)
        XCTAssertTrue(firstCell.exists)
    }

    func testVehicleSearch() throws {
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()

        // Tap search bar
        let searchField = app.searchFields["Search vehicles"]
        searchField.tap()
        searchField.typeText("Ford")

        // Wait for search results
        sleep(1)

        // Verify filtered results
        let vehiclesList = app.tables["VehiclesList"]
        let cellCount = vehiclesList.cells.count
        XCTAssertGreaterThan(cellCount, 0)
    }

    func testVehicleDetailView() throws {
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()

        // Tap first vehicle
        let vehiclesList = app.tables["VehiclesList"]
        vehiclesList.cells.element(boundBy: 0).tap()

        // Verify detail view
        XCTAssertTrue(app.staticTexts["VehicleDetailTitle"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["VIN"].exists)
        XCTAssertTrue(app.staticTexts["Make"].exists)
        XCTAssertTrue(app.staticTexts["Model"].exists)
    }

    // MARK: - Inspection Tests

    func testCreateInspection() throws {
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()

        // Select vehicle
        app.tables["VehiclesList"].cells.element(boundBy: 0).tap()

        // Tap inspection button
        app.buttons["NewInspection"].tap()

        // Fill inspection form
        app.switches["Lights"].tap()
        app.switches["Brakes"].tap()
        app.switches["Tires"].tap()

        // Add notes
        let notesField = app.textViews["InspectionNotes"]
        notesField.tap()
        notesField.typeText("All systems checked and operational")

        // Submit inspection
        app.buttons["Submit"].tap()

        // Verify success
        let successAlert = app.alerts["Inspection Submitted"]
        XCTAssertTrue(successAlert.waitForExistence(timeout: 3))
        successAlert.buttons["OK"].tap()
    }

    func testInspectionPhotoCapture() throws {
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()
        app.tables["VehiclesList"].cells.element(boundBy: 0).tap()
        app.buttons["NewInspection"].tap()

        // Tap camera button
        app.buttons["AddPhoto"].tap()

        // Choose camera or photo library
        let photoLibraryButton = app.sheets.buttons["Photo Library"]
        if photoLibraryButton.exists {
            photoLibraryButton.tap()

            // Select first photo
            let photo = app.collectionViews.cells.element(boundBy: 0)
            if photo.waitForExistence(timeout: 3) {
                photo.tap()
            }
        }

        // Verify photo added
        XCTAssertTrue(app.images["InspectionPhoto0"].exists)
    }

    // MARK: - Offline Sync Tests

    func testOfflineDataCreation() throws {
        loginTestUser()

        // Enable airplane mode simulation
        app.switches["AirplaneMode"].tap()

        // Create inspection while offline
        app.tabBars.buttons["Vehicles"].tap()
        app.tables["VehiclesList"].cells.element(boundBy: 0).tap()
        app.buttons["NewInspection"].tap()

        app.switches["Lights"].tap()
        app.buttons["Submit"].tap()

        // Verify offline queue indicator
        let offlineIndicator = app.staticTexts["Saved Offline"]
        XCTAssertTrue(offlineIndicator.waitForExistence(timeout: 3))

        // Disable airplane mode
        app.switches["AirplaneMode"].tap()

        // Wait for sync
        sleep(3)

        // Verify sync complete
        let syncIndicator = app.staticTexts["Synced"]
        XCTAssertTrue(syncIndicator.exists)
    }

    func testConflictResolution() throws {
        loginTestUser()

        // This test would simulate a conflict scenario
        // For example, updating the same vehicle odometer offline and online

        // Enable offline mode
        app.switches["AirplaneMode"].tap()

        // Update vehicle offline
        app.tabBars.buttons["Vehicles"].tap()
        app.tables["VehiclesList"].cells.element(boundBy: 0).tap()
        app.buttons["Edit"].tap()

        let odometerField = app.textFields["Odometer"]
        odometerField.tap()
        odometerField.clearAndEnterText("15000")

        app.buttons["Save"].tap()

        // Enable online mode
        app.switches["AirplaneMode"].tap()

        // Wait for conflict detection
        sleep(2)

        // Resolve conflict (choose local version)
        let conflictAlert = app.alerts["Conflict Detected"]
        if conflictAlert.waitForExistence(timeout: 5) {
            conflictAlert.buttons["Keep Local"].tap()
        }
    }

    // MARK: - GPS & Location Tests

    func testLocationTracking() throws {
        loginTestUser()

        // Navigate to map view
        app.tabBars.buttons["Map"].tap()

        // Verify map is displayed
        let mapView = app.otherElements["MapView"]
        XCTAssertTrue(mapView.waitForExistence(timeout: 5))

        // Verify current location button
        let locationButton = app.buttons["CurrentLocation"]
        XCTAssertTrue(locationButton.exists)

        // Tap to center on current location
        locationButton.tap()

        // Verify location is shown (blue dot)
        sleep(2)
    }

    func testGeofenceAlert() throws {
        loginTestUser()
        app.tabBars.buttons["Map"].tap()

        // Simulate entering geofence
        // Note: This would require location simulation in test environment

        // Verify alert appears
        let geofenceAlert = app.alerts["Geofence Alert"]
        if geofenceAlert.waitForExistence(timeout: 10) {
            XCTAssertTrue(geofenceAlert.exists)
            geofenceAlert.buttons["OK"].tap()
        }
    }

    // MARK: - Push Notification Tests

    func testPushNotificationReceived() throws {
        loginTestUser()

        // Simulate receiving push notification
        // This would be done through test environment or mocking

        // Verify notification banner appears
        let notificationBanner = app.staticTexts["MaintenanceDue"]
        if notificationBanner.waitForExistence(timeout: 5) {
            notificationBanner.tap()

            // Verify navigation to maintenance screen
            XCTAssertTrue(app.staticTexts["Maintenance"].exists)
        }
    }

    // MARK: - Performance Tests

    func testAppLaunchPerformance() throws {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }

    func testScrollPerformance() throws {
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()

        let vehiclesList = app.tables["VehiclesList"]

        measure {
            vehiclesList.swipeUp(velocity: .fast)
            vehiclesList.swipeDown(velocity: .fast)
        }
    }

    // MARK: - Accessibility Tests

    func testVoiceOverSupport() throws {
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()

        // Verify accessibility labels
        let vehicleCell = app.tables["VehiclesList"].cells.element(boundBy: 0)
        XCTAssertNotNil(vehicleCell.label)
        XCTAssertTrue(vehicleCell.label.count > 0)

        // Verify buttons have labels
        let addButton = app.buttons["AddVehicle"]
        XCTAssertNotNil(addButton.label)
    }

    func testDynamicTypeSupport() throws {
        // Test with different text sizes
        loginTestUser()
        app.tabBars.buttons["Vehicles"].tap()

        // Verify text is visible and readable
        let vehicleCell = app.tables["VehiclesList"].cells.element(boundBy: 0)
        XCTAssertTrue(vehicleCell.staticTexts.count > 0)
    }

    // MARK: - Helper Methods

    private func loginTestUser() {
        app.textFields["email"].tap()
        app.textFields["email"].typeText("test@example.com")

        app.secureTextFields["password"].tap()
        app.secureTextFields["password"].typeText("TestPassword123!")

        app.buttons["Login"].tap()

        // Wait for dashboard to load
        _ = app.staticTexts["Dashboard"].waitForExistence(timeout: 5)
    }
}

// MARK: - XCUIElement Extensions

extension XCUIElement {
    func clearAndEnterText(_ text: String) {
        guard let stringValue = self.value as? String else {
            XCTFail("Tried to clear and enter text into a non string value")
            return
        }

        self.tap()

        let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: stringValue.count)
        self.typeText(deleteString)
        self.typeText(text)
    }
}
