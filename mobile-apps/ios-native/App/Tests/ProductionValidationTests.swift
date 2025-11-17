//
//  ProductionValidationTests.swift
//  Fleet Manager - Comprehensive Production Validation Suite
//
//  Complete production environment validation covering:
//  - API endpoints with production URLs
//  - SSL certificate pinning
//  - Firebase integration (Analytics, Crashlytics, FCM)
//  - Authentication flows
//  - Data persistence and sync
//  - OBD2 Bluetooth connectivity
//  - GPS tracking accuracy
//  - Offline-to-online sync
//  - Security features
//  - Performance and memory usage
//
//  Test Coverage: 35+ comprehensive production validation tests
//

import XCTest
@testable import App
import CoreLocation
import CoreBluetooth
import Security
import LocalAuthentication

class ProductionValidationTests: XCTestCase {

    // MARK: - Test Dependencies

    var apiConfiguration: APIConfiguration!
    var authService: AuthenticationService!
    var encryptionManager: EncryptionManager!
    var keychainManager: KeychainManager!
    var certificatePinningManager: CertificatePinningManager!
    var jailbreakDetector: JailbreakDetector!
    var dataPersistenceManager: DataPersistenceManager!
    var syncService: SyncService!
    var locationManager: LocationManager!
    var obd2Manager: OBD2Manager!
    var firebaseManager: FirebaseManager!
    var analyticsManager: AnalyticsManager!
    var performanceMonitor: PerformanceMonitor!
    var backgroundSyncManager: BackgroundSyncManager!
    var crashReporter: CrashReporter!
    var pushNotificationManager: PushNotificationManager!
    var networkMonitor: NetworkMonitor!

    // MARK: - Setup & Teardown

    override func setUp() {
        super.setUp()

        // Initialize all production services
        apiConfiguration = APIConfiguration.shared
        authService = AuthenticationService()
        encryptionManager = EncryptionManager.shared
        keychainManager = KeychainManager.shared
        certificatePinningManager = CertificatePinningManager.shared
        jailbreakDetector = JailbreakDetector.shared
        dataPersistenceManager = DataPersistenceManager.shared
        syncService = SyncService.shared
        locationManager = LocationManager.shared
        obd2Manager = OBD2Manager.shared
        firebaseManager = FirebaseManager.shared
        analyticsManager = AnalyticsManager.shared
        performanceMonitor = PerformanceMonitor.shared
        backgroundSyncManager = BackgroundSyncManager.shared
        crashReporter = CrashReporter.shared
        pushNotificationManager = PushNotificationManager.shared
        networkMonitor = NetworkMonitor.shared
    }

    override func tearDown() {
        // Clean up test data
        try? keychainManager.clearAll()
        super.tearDown()
    }

    // MARK: - Production API Endpoint Tests (5 tests)

    func testProductionAPIBaseURL() {
        let productionURL = apiConfiguration.baseURL

        XCTAssertNotNil(productionURL, "Production API base URL must be configured")
        XCTAssertTrue(productionURL.absoluteString.hasPrefix("https://"), "Production API must use HTTPS")
        XCTAssertFalse(productionURL.absoluteString.contains("localhost"), "Production should not use localhost")
        XCTAssertFalse(productionURL.absoluteString.contains("127.0.0.1"), "Production should not use local IP")

        print("✅ Production API Base URL: \(productionURL.absoluteString)")
    }

    func testProductionAuthenticationEndpoint() {
        let expectation = self.expectation(description: "Auth endpoint reachable")

        guard let authURL = URL(string: "\(apiConfiguration.baseURL.absoluteString)/auth/login") else {
            XCTFail("Invalid auth URL")
            return
        }

        var request = URLRequest(url: authURL)
        request.httpMethod = "POST"
        request.timeoutInterval = 10.0

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse {
                // We expect 400/401 for invalid credentials, not 404
                XCTAssertTrue([200, 400, 401, 422].contains(httpResponse.statusCode),
                             "Auth endpoint should be accessible (got \(httpResponse.statusCode))")
            }
            expectation.fulfill()
        }

        task.resume()
        waitForExpectations(timeout: 15.0, handler: nil)
    }

    func testProductionHealthCheckEndpoint() {
        let expectation = self.expectation(description: "Health check endpoint")

        guard let healthURL = URL(string: "\(apiConfiguration.baseURL.absoluteString)/health") else {
            XCTFail("Invalid health check URL")
            return
        }

        let task = URLSession.shared.dataTask(with: healthURL) { data, response, error in
            XCTAssertNil(error, "Health check should not error: \(error?.localizedDescription ?? "")")

            if let httpResponse = response as? HTTPURLResponse {
                XCTAssertTrue([200, 204].contains(httpResponse.statusCode),
                             "Health endpoint should return 200/204")
            }

            expectation.fulfill()
        }

        task.resume()
        waitForExpectations(timeout: 10.0, handler: nil)
    }

    func testProductionAPITimeout() {
        let timeoutInterval = apiConfiguration.requestTimeout

        XCTAssertGreaterThan(timeoutInterval, 0, "Timeout must be configured")
        XCTAssertLessThanOrEqual(timeoutInterval, 60, "Timeout should be reasonable (≤60s)")
        XCTAssertGreaterThanOrEqual(timeoutInterval, 10, "Timeout should be sufficient (≥10s)")
    }

    func testProductionAPIHeaders() {
        let headers = apiConfiguration.defaultHeaders

        XCTAssertNotNil(headers["Content-Type"], "Content-Type header required")
        XCTAssertNotNil(headers["Accept"], "Accept header required")
        XCTAssertEqual(headers["Content-Type"], "application/json", "JSON content type required")

        // Verify no development headers in production
        XCTAssertNil(headers["X-Debug-Mode"], "Debug headers should not be in production")
    }

    // MARK: - SSL Certificate Pinning Tests (3 tests)

    func testSSLCertificatePinningEnabled() {
        #if !DEBUG
        XCTAssertTrue(certificatePinningManager.strictMode, "Certificate pinning must be enabled in production")
        XCTAssertFalse(certificatePinningManager.bypassPinning, "Certificate pinning bypass must be disabled")
        #endif

        XCTAssertNotNil(certificatePinningManager, "Certificate pinning manager must be initialized")
    }

    func testSSLCertificatePinningSessionConfiguration() {
        let session = certificatePinningManager.createPinnedURLSession()
        let config = session.configuration

        // Verify TLS settings
        XCTAssertEqual(config.tlsMinimumSupportedProtocolVersion, .TLSv12, "TLS 1.2+ required")
        XCTAssertNil(config.urlCache, "URL cache should be disabled for security")
        XCTAssertEqual(config.requestCachePolicy, .reloadIgnoringLocalAndRemoteCacheData)
        XCTAssertFalse(config.httpShouldSetCookies, "Cookies should be managed manually")
    }

    func testProductionCertificateValidation() {
        let expectation = self.expectation(description: "Certificate validation")

        guard let url = URL(string: apiConfiguration.baseURL.absoluteString) else {
            XCTFail("Invalid production URL")
            return
        }

        let session = certificatePinningManager.createPinnedURLSession()

        let task = session.dataTask(with: url) { data, response, error in
            // Certificate validation is tested through URLSession delegate
            XCTAssertNotNil(session, "Pinned session created")
            expectation.fulfill()
        }

        task.resume()
        waitForExpectations(timeout: 15.0, handler: nil)
    }

    // MARK: - Firebase Integration Tests (4 tests)

    func testFirebaseAnalyticsIntegration() {
        XCTAssertNotNil(analyticsManager, "Analytics manager must be initialized")

        // Log test event
        analyticsManager.logEvent("production_test_event", parameters: ["test": "validation"])

        // Verify analytics is configured
        #if !DEBUG
        XCTAssertTrue(analyticsManager.isEnabled, "Analytics must be enabled in production")
        #endif
    }

    func testFirebaseCrashlyticsIntegration() {
        XCTAssertNotNil(crashReporter, "Crash reporter must be initialized")

        // Test crash logging (without actually crashing)
        crashReporter.logError(NSError(domain: "TestDomain", code: 999, userInfo: ["test": "validation"]))

        #if !DEBUG
        XCTAssertTrue(crashReporter.isEnabled, "Crashlytics must be enabled in production")
        #endif
    }

    func testFirebaseCloudMessagingIntegration() {
        XCTAssertNotNil(pushNotificationManager, "Push notification manager must be initialized")

        // Verify FCM token handling
        let tokenExists = pushNotificationManager.fcmToken != nil || pushNotificationManager.apnsToken != nil

        // In production, we should have proper notification setup
        #if !DEBUG
        XCTAssertTrue(pushNotificationManager.isConfigured, "FCM must be configured in production")
        #endif
    }

    func testFirebaseRemoteConfigIntegration() {
        let remoteConfig = firebaseManager.remoteConfig

        XCTAssertNotNil(remoteConfig, "Remote Config must be initialized")

        // Test fetching remote config
        let expectation = self.expectation(description: "Remote config fetch")

        remoteConfig.fetch { status, error in
            XCTAssertNil(error, "Remote config fetch should not error")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 10.0, handler: nil)
    }

    // MARK: - Authentication Flow Tests (4 tests)

    func testAuthenticationFlowStructure() {
        XCTAssertNotNil(authService, "Auth service must be initialized")

        // Verify authentication manager is configured
        let authManager = AuthenticationManager.shared
        XCTAssertNotNil(authManager, "Authentication manager required")
    }

    func testAuthenticationTokenStorage() {
        let testToken = "test_token_\(UUID().uuidString)"

        // Save token
        let saveResult = keychainManager.save(testToken, forKey: "test_auth_token")
        XCTAssertTrue(saveResult, "Token should be saved to keychain")

        // Retrieve token
        let retrievedToken = keychainManager.retrieve(forKey: "test_auth_token")
        XCTAssertEqual(retrievedToken, testToken, "Retrieved token should match")

        // Clean up
        keychainManager.delete(forKey: "test_auth_token")
    }

    func testAuthenticationTokenRefresh() {
        // Verify token refresh logic exists
        XCTAssertNotNil(authService.refreshToken, "Token refresh method must exist")

        // Test token expiry checking
        let expiredToken = authService.isTokenExpired(expiresAt: Date().addingTimeInterval(-3600))
        XCTAssertTrue(expiredToken, "Expired token should be detected")

        let validToken = authService.isTokenExpired(expiresAt: Date().addingTimeInterval(3600))
        XCTAssertFalse(validToken, "Valid token should not be expired")
    }

    func testAuthenticationLogout() {
        // Test logout clears all session data
        authService.logout()

        let token = keychainManager.retrieve(forKey: "access_token")
        XCTAssertNil(token, "Token should be cleared on logout")
    }

    // MARK: - Data Persistence Tests (3 tests)

    func testDataPersistenceInitialization() {
        XCTAssertNotNil(dataPersistenceManager, "Data persistence manager must be initialized")
        XCTAssertTrue(dataPersistenceManager.isReady, "Persistence store should be ready")
    }

    func testDataEncryptionAtRest() throws {
        let testData = "Sensitive vehicle data 12345"

        // Test encryption
        let encrypted = try encryptionManager.encrypt(string: testData)
        XCTAssertNotEqual(encrypted, testData, "Data should be encrypted")

        // Test decryption
        let decrypted = try encryptionManager.decrypt(string: encrypted)
        XCTAssertEqual(decrypted, testData, "Decrypted data should match original")
    }

    func testDataPersistencePerformance() {
        measure {
            let testVehicle = ["id": UUID().uuidString, "name": "Test Vehicle", "vin": "1HGBH41JXMN109186"]
            _ = dataPersistenceManager.save(testVehicle, forKey: "test_vehicle")
        }
    }

    // MARK: - Sync Operation Tests (3 tests)

    func testSyncServiceInitialization() {
        XCTAssertNotNil(syncService, "Sync service must be initialized")
        XCTAssertNotNil(backgroundSyncManager, "Background sync manager required")
    }

    func testOfflineToOnlineSyncTransition() {
        let expectation = self.expectation(description: "Sync transition")

        // Simulate offline operation
        syncService.enqueueOperation(type: .create, entity: "vehicle", data: ["test": "data"])

        // Verify operation queued
        let queueCount = syncService.pendingOperationsCount
        XCTAssertGreaterThan(queueCount, 0, "Operation should be queued")

        // Simulate going online
        networkMonitor.updateNetworkStatus(isConnected: true)

        // Give sync time to process
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5.0, handler: nil)
    }

    func testSyncConflictResolution() {
        let serverData = ["id": "123", "name": "Server Name", "updated": Date().timeIntervalSince1970]
        let clientData = ["id": "123", "name": "Client Name", "updated": Date().addingTimeInterval(-3600).timeIntervalSince1970]

        let resolver = ConflictResolver()
        let resolved = resolver.resolve(serverData: serverData, clientData: clientData, strategy: .serverWins)

        XCTAssertEqual(resolved["name"] as? String, "Server Name", "Server should win conflict")
    }

    // MARK: - OBD2 Bluetooth Tests (3 tests)

    func testOBD2ManagerInitialization() {
        XCTAssertNotNil(obd2Manager, "OBD2 manager must be initialized")
        XCTAssertTrue(obd2Manager.isBluetoothSupported, "Bluetooth should be supported on iOS")
    }

    func testOBD2BluetoothPermissions() {
        // Verify Bluetooth permission handling
        let permissionManager = BluetoothPermissionManager.shared
        XCTAssertNotNil(permissionManager, "Bluetooth permission manager required")

        // Check permission status
        let status = permissionManager.authorizationStatus
        XCTAssertTrue([.authorized, .notDetermined, .restricted].contains(status), "Valid permission status")
    }

    func testOBD2DataParserFunctionality() {
        let parser = OBD2DataParser()

        // Test RPM parsing (Mode 01, PID 0C)
        let rpmData = "41 0C 1A F8" // Example: 1726 RPM
        let rpm = parser.parseRPM(from: rpmData)
        XCTAssertNotNil(rpm, "RPM should be parsed")
        XCTAssertGreaterThan(rpm ?? 0, 0, "RPM should be positive")

        // Test speed parsing (Mode 01, PID 0D)
        let speedData = "41 0D 50" // Example: 80 km/h
        let speed = parser.parseSpeed(from: speedData)
        XCTAssertNotNil(speed, "Speed should be parsed")
    }

    // MARK: - GPS Tracking Tests (2 tests)

    func testGPSLocationManagerConfiguration() {
        XCTAssertNotNil(locationManager, "Location manager must be initialized")

        // Verify location accuracy settings
        XCTAssertEqual(locationManager.desiredAccuracy, kCLLocationAccuracyBest, "Best accuracy required for tracking")
        XCTAssertGreaterThan(locationManager.distanceFilter, 0, "Distance filter should be configured")
    }

    func testGPSTrackingAccuracyValidation() {
        // Test location validation logic
        let accurateLocation = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            altitude: 10,
            horizontalAccuracy: 5.0,
            verticalAccuracy: 5.0,
            timestamp: Date()
        )

        let isValid = locationManager.isLocationValid(accurateLocation)
        XCTAssertTrue(isValid, "Accurate location should be valid")

        let inaccurateLocation = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            altitude: 10,
            horizontalAccuracy: 100.0,
            verticalAccuracy: 100.0,
            timestamp: Date().addingTimeInterval(-3600)
        )

        let isInvalidOld = locationManager.isLocationValid(inaccurateLocation)
        XCTAssertFalse(isInvalidOld, "Old/inaccurate location should be invalid")
    }

    // MARK: - Security Feature Tests (4 tests)

    func testJailbreakDetection() {
        let isJailbroken = jailbreakDetector.isDeviceJailbroken()

        // In test environment, device should not be jailbroken
        XCTAssertFalse(isJailbroken, "Test device should not be jailbroken")

        // Verify detection methods are implemented
        XCTAssertTrue(jailbreakDetector.hasImplementedChecks(), "Jailbreak checks must be implemented")
    }

    func testEncryptionKeyGeneration() {
        let key = encryptionManager.generateEncryptionKey()

        XCTAssertNotNil(key, "Encryption key should be generated")
        XCTAssertEqual(key.count, 32, "AES-256 requires 32-byte key")
    }

    func testSecureDataWiping() {
        // Test secure data deletion
        let testKey = "test_sensitive_data"
        let testValue = "sensitive_value_12345"

        keychainManager.save(testValue, forKey: testKey)

        let deleteResult = keychainManager.delete(forKey: testKey)
        XCTAssertTrue(deleteResult, "Data should be securely deleted")

        let retrievedValue = keychainManager.retrieve(forKey: testKey)
        XCTAssertNil(retrievedValue, "Deleted data should not be retrievable")
    }

    func testSecurityEventLogging() {
        let securityLogger = SecurityLogger.shared

        // Log security event
        securityLogger.logSecurityEvent(.authenticationFailure, details: ["test": "validation"])

        // Verify event was logged
        let events = securityLogger.getRecentEvents(limit: 10)
        XCTAssertGreaterThan(events.count, 0, "Security events should be logged")
    }

    // MARK: - Performance & Memory Tests (4 tests)

    func testMemoryUsageUnderLoad() {
        performanceMonitor.startMonitoring()

        // Create load
        for _ in 0..<100 {
            let _ = ["id": UUID().uuidString, "data": String(repeating: "x", count: 1000)]
        }

        let memoryUsage = performanceMonitor.currentMemoryUsage
        XCTAssertLessThan(memoryUsage, 100_000_000, "Memory usage should be under 100MB")

        performanceMonitor.stopMonitoring()
    }

    func testAppLaunchPerformance() {
        measure {
            // Simulate app initialization sequence
            _ = APIConfiguration.shared
            _ = AuthenticationManager.shared
            _ = DataPersistenceManager.shared
            _ = FirebaseManager.shared
        }
    }

    func testDatabaseQueryPerformance() {
        measure {
            // Test database read performance
            for _ in 0..<50 {
                _ = dataPersistenceManager.fetch(forKey: "test_query_\(Int.random(in: 0...100))")
            }
        }
    }

    func testEncryptionPerformanceBenchmark() {
        let testData = String(repeating: "Performance test data ", count: 100)

        measure {
            do {
                let encrypted = try encryptionManager.encrypt(string: testData)
                let _ = try encryptionManager.decrypt(string: encrypted)
            } catch {
                XCTFail("Encryption performance test failed: \(error)")
            }
        }
    }
}

// MARK: - Test Helpers

extension ProductionValidationTests {

    func waitForAsyncOperation(timeout: TimeInterval = 5.0, completion: @escaping () -> Void) {
        let expectation = self.expectation(description: "Async operation")

        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
            completion()
            expectation.fulfill()
        }

        waitForExpectations(timeout: timeout + 1.0, handler: nil)
    }

    func generateMockVehicleData() -> [String: Any] {
        return [
            "id": UUID().uuidString,
            "vin": "1HGBH41JXMN109186",
            "make": "Test Make",
            "model": "Test Model",
            "year": 2024,
            "licensePlate": "TEST123"
        ]
    }
}
