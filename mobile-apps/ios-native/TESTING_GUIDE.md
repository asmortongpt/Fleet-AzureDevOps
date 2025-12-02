# Testing Guide - iOS Fleet Management

**Last Updated:** November 11, 2025
**Testing Framework:** XCTest
**Target Coverage:** 70%+
**Test Organization:** Unit, Integration, UI Tests

---

## Overview

This guide covers testing strategies, tools, and implementation for the iOS Fleet Management app. Testing includes unit tests, integration tests, UI tests, and performance testing.

### Testing Strategy
```
Unit Tests (70%)
  ├─ ViewModels
  ├─ Services
  ├─ Managers
  └─ Business Logic

Integration Tests (20%)
  ├─ API Integration
  ├─ Data Persistence
  └─ Service Interactions

UI Tests (10%)
  ├─ Navigation
  ├─ User Flows
  └─ Accessibility
```

---

## Setting Up Tests

### Test Target Structure
```
AppTests/
├── Unit/
│   ├── ViewModels/
│   │   ├── VehicleViewModelTests.swift
│   │   └── DashboardViewModelTests.swift
│   ├── Services/
│   │   ├── AuthenticationServiceTests.swift
│   │   ├── APIConfigurationTests.swift
│   │   └── TripTrackingServiceTests.swift
│   └── Models/
│       └── VehicleModelTests.swift
│
├── Integration/
│   ├── APIIntegrationTests.swift
│   ├── DataPersistenceTests.swift
│   └── AuthenticationFlowTests.swift
│
└── UI/
    ├── LoginFlowTests.swift
    ├── VehicleListTests.swift
    └── NavigationTests.swift
```

### Create Test File Template
```swift
import XCTest
@testable import App

class VehicleViewModelTests: XCTestCase {
    var sut: VehicleViewModel!  // System Under Test
    var mockAPIService: MockAPIService!

    override func setUp() {
        super.setUp()
        // Initialize test doubles
        mockAPIService = MockAPIService()
        sut = VehicleViewModel(apiService: mockAPIService)
    }

    override func tearDown() {
        sut = nil
        mockAPIService = nil
        super.tearDown()
    }

    func testExample() {
        // Test implementation
    }
}
```

---

## Unit Testing

### Testing ViewModels

#### Example: VehicleViewModel Tests
```swift
func testLoadVehicles_Success() async throws {
    // Arrange
    let mockVehicles = [
        VehicleModel(id: "1", make: "Honda", model: "Odyssey", year: 2023),
        VehicleModel(id: "2", make: "Toyota", model: "Sienna", year: 2022)
    ]
    mockAPIService.vehiclesToReturn = mockVehicles

    // Act
    await sut.loadVehicles()

    // Assert
    XCTAssertEqual(sut.vehicles.count, 2)
    XCTAssertEqual(sut.vehicles[0].id, "1")
    XCTAssertFalse(sut.isLoading)
}

func testLoadVehicles_Failure() async throws {
    // Arrange
    mockAPIService.shouldThrowError = true
    mockAPIService.errorToThrow = APIError.networkUnavailable

    // Act
    await sut.loadVehicles()

    // Assert
    XCTAssertTrue(sut.vehicles.isEmpty)
    XCTAssertNotNil(sut.errorMessage)
    XCTAssertTrue(sut.errorMessage?.contains("network") ?? false)
}

func testFilterVehicles() {
    // Arrange
    sut.vehicles = [
        VehicleModel(id: "1", make: "Honda", model: "Odyssey", year: 2023),
        VehicleModel(id: "2", make: "Honda", model: "Civic", year: 2022)
    ]

    // Act
    let filtered = sut.filteredVehicles(searchText: "Odyssey")

    // Assert
    XCTAssertEqual(filtered.count, 1)
    XCTAssertEqual(filtered[0].model, "Odyssey")
}
```

### Testing Services

#### Example: AuthenticationService Tests
```swift
func testLogin_Success() async throws {
    // Arrange
    let email = "user@example.com"
    let password = "password123"

    // Act
    let result = try await authService.login(email: email, password: password)

    // Assert
    XCTAssertNotNil(result.token)
    XCTAssertEqual(result.user.email, email)
}

func testLogin_InvalidCredentials() async throws {
    // Arrange
    let email = "wrong@example.com"
    let password = "wrong"

    // Act & Assert
    do {
        _ = try await authService.login(email: email, password: password)
        XCTFail("Should throw unauthorized error")
    } catch APIError.unauthorized {
        // Expected error
    } catch {
        XCTFail("Unexpected error: \(error)")
    }
}

func testTokenRefresh() async throws {
    // Arrange
    let oldToken = "old_token_123"

    // Act
    let newToken = try await authService.refreshToken()

    // Assert
    XCTAssertNotEqual(newToken, oldToken)
    XCTAssertFalse(newToken.isEmpty)
}
```

### Testing Models

#### Example: VehicleModel Tests
```swift
func testVehicleModelDecoding() throws {
    // Arrange
    let json = """
    {
        "id": "vehicle-1",
        "vin": "5FNRL6H76LB123456",
        "make": "Honda",
        "model": "Odyssey",
        "year": 2023
    }
    """.data(using: .utf8)!

    // Act
    let decoder = JSONDecoder()
    let vehicle = try decoder.decode(VehicleModel.self, from: json)

    // Assert
    XCTAssertEqual(vehicle.id, "vehicle-1")
    XCTAssertEqual(vehicle.make, "Honda")
    XCTAssertEqual(vehicle.year, 2023)
}

func testVehicleModelEncoding() throws {
    // Arrange
    let vehicle = VehicleModel(
        id: "vehicle-1",
        make: "Honda",
        model: "Odyssey",
        year: 2023,
        vin: "5FNRL6H76LB123456"
    )

    // Act
    let encoder = JSONEncoder()
    let data = try encoder.encode(vehicle)

    // Assert
    XCTAssertFalse(data.isEmpty)

    // Verify roundtrip
    let decoder = JSONDecoder()
    let decodedVehicle = try decoder.decode(VehicleModel.self, from: data)
    XCTAssertEqual(decodedVehicle.id, vehicle.id)
}
```

---

## Integration Testing

### Testing API Integration

```swift
class APIIntegrationTests: XCTestCase {
    var apiService: APIService!
    var urlSession: URLSession!

    override func setUp() {
        super.setUp()
        // Use mock URLSession or test server
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        urlSession = URLSession(configuration: config)
        apiService = APIService(urlSession: urlSession)
    }

    func testFetchVehicles_Integration() async throws {
        // Arrange
        let mockData = """
        {
            "data": [
                {"id": "1", "make": "Honda", "model": "Odyssey", "year": 2023}
            ]
        }
        """.data(using: .utf8)!

        MockURLProtocol.mockResponse = (data: mockData, statusCode: 200)

        // Act
        let vehicles = try await apiService.fetchVehicles()

        // Assert
        XCTAssertEqual(vehicles.count, 1)
        XCTAssertEqual(vehicles[0].make, "Honda")
    }

    func testFetchVehicles_NetworkError() async throws {
        // Arrange
        MockURLProtocol.mockError = URLError(.networkConnectionLost)

        // Act & Assert
        do {
            _ = try await apiService.fetchVehicles()
            XCTFail("Should throw network error")
        } catch URLError.networkConnectionLost {
            // Expected error
        }
    }
}
```

### Testing Data Persistence

```swift
class DataPersistenceTests: XCTestCase {
    var persistenceManager: DataPersistenceManager!

    override func setUp() {
        super.setUp()
        persistenceManager = DataPersistenceManager(
            persistentContainer: createTestContainer()
        )
    }

    func testSaveVehicle() throws {
        // Arrange
        let vehicle = VehicleModel(
            id: "test-1",
            make: "Honda",
            model: "Odyssey",
            year: 2023,
            vin: "TEST123"
        )

        // Act
        try persistenceManager.save(vehicle)

        // Assert
        let savedVehicles = try persistenceManager.fetchVehicles()
        XCTAssertTrue(savedVehicles.contains { $0.id == "test-1" })
    }

    func testDeleteVehicle() throws {
        // Arrange
        let vehicle = VehicleModel(id: "test-1", make: "Honda", model: "Odyssey", year: 2023, vin: "TEST123")
        try persistenceManager.save(vehicle)

        // Act
        try persistenceManager.delete(vehicleId: "test-1")

        // Assert
        let vehicles = try persistenceManager.fetchVehicles()
        XCTAssertFalse(vehicles.contains { $0.id == "test-1" })
    }

    private func createTestContainer() -> NSPersistentContainer {
        let container = NSPersistentContainer(name: "FleetApp")
        let storeDescription = NSPersistentStoreDescription()
        storeDescription.type = NSInMemoryStoreType
        container.persistentStoreDescriptions = [storeDescription]

        var loadError: NSError?
        container.loadPersistentStores { _, error in
            loadError = error as NSError?
        }

        if let error = loadError {
            fatalError("Failed to load test store: \(error)")
        }

        return container
    }
}
```

---

## UI Testing

### Example: Login Flow UI Test
```swift
class LoginFlowTests: XCTestCase {
    let app = XCUIApplication()

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app.launch()
    }

    func testLoginFlow() throws {
        // Arrange
        let emailTextField = app.textFields["email"]
        let passwordTextField = app.secureTextFields["password"]
        let loginButton = app.buttons["Sign In"]

        // Act - Enter credentials
        emailTextField.tap()
        emailTextField.typeText("user@example.com")

        passwordTextField.tap()
        passwordTextField.typeText("password123")

        // Act - Tap login
        loginButton.tap()

        // Assert - Wait for dashboard
        let dashboardView = app.staticTexts["Dashboard"]
        XCTAssertTrue(dashboardView.waitForExistence(timeout: 5))
    }

    func testLoginWithInvalidCredentials() throws {
        // Arrange
        let emailTextField = app.textFields["email"]
        let passwordTextField = app.secureTextFields["password"]
        let loginButton = app.buttons["Sign In"]

        // Act
        emailTextField.tap()
        emailTextField.typeText("wrong@example.com")
        passwordTextField.tap()
        passwordTextField.typeText("wrong")
        loginButton.tap()

        // Assert
        let errorMessage = app.staticTexts["Invalid credentials"]
        XCTAssertTrue(errorMessage.waitForExistence(timeout: 3))
    }
}
```

### Example: Vehicle List UI Test
```swift
class VehicleListTests: XCTestCase {
    let app = XCUIApplication()

    func testVehicleListDisplay() throws {
        // Arrange
        loginUser(email: "user@example.com", password: "password123")

        // Act
        let vehiclesTab = app.tabBars.buttons["Vehicles"]
        vehiclesTab.tap()

        // Assert
        let vehicleList = app.tables["vehicleList"]
        XCTAssertTrue(vehicleList.waitForExistence(timeout: 5))

        let firstCell = vehicleList.cells.firstMatch
        XCTAssertTrue(firstCell.exists)
    }

    func testVehicleSearch() throws {
        // Arrange
        loginUser(email: "user@example.com", password: "password123")
        let vehiclesTab = app.tabBars.buttons["Vehicles"]
        vehiclesTab.tap()

        let searchField = app.searchFields["Search vehicles"]

        // Act
        searchField.tap()
        searchField.typeText("Honda")

        // Assert
        let results = app.tables["vehicleList"].cells
        XCTAssertGreaterThan(results.count, 0)
    }

    // Helper function
    private func loginUser(email: String, password: String) {
        let emailTextField = app.textFields["email"]
        let passwordTextField = app.secureTextFields["password"]
        let loginButton = app.buttons["Sign In"]

        emailTextField.tap()
        emailTextField.typeText(email)
        passwordTextField.tap()
        passwordTextField.typeText(password)
        loginButton.tap()

        let dashboard = app.staticTexts["Dashboard"]
        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
    }
}
```

---

## Performance Testing

### Memory Profiling
```swift
func testVehicleListMemoryUsage() {
    // Arrange
    let viewModel = VehicleViewModel(
        apiService: MockAPIService()
    )

    // Create 1000 vehicles
    viewModel.vehicles = (0..<1000).map { index in
        VehicleModel(
            id: "vehicle-\(index)",
            make: "Honda",
            model: "Odyssey",
            year: 2023,
            vin: "VIN\(index)"
        )
    }

    // Act & Assert
    measure(metrics: [XCTMemoryMetric()]) {
        _ = viewModel.filteredVehicles(searchText: "Honda")
    }
}
```

### Performance Testing
```swift
func testAPIRequestPerformance() {
    measure {
        let request = URLRequest(url: URL(string: "https://api.example.com/vehicles")!)
        let config = URLSessionConfiguration.default
        let session = URLSession(configuration: config)

        // Simulate request
        let expectation = expectation(description: "API call")
        var _ = session.dataTask(with: request) { _, _, _ in
            expectation.fulfill()
        }.resume()

        waitForExpectations(timeout: 10)
    }
}
```

---

## Test Doubles (Mocks, Stubs, Fakes)

### Mock API Service
```swift
class MockAPIService: APIServiceProtocol {
    var vehiclesToReturn: [VehicleModel] = []
    var shouldThrowError = false
    var errorToThrow: Error?

    func fetchVehicles() async throws -> [VehicleModel] {
        if shouldThrowError {
            throw errorToThrow ?? APIError.unknown
        }
        return vehiclesToReturn
    }

    var loginCalled = false
    var loginEmail: String?

    func login(email: String, password: String) async throws -> LoginResponse {
        loginCalled = true
        loginEmail = email

        if shouldThrowError {
            throw APIError.unauthorized
        }

        return LoginResponse(
            token: "mock-token-123",
            user: User(id: "user-1", email: email)
        )
    }
}
```

### Mock Network Monitor
```swift
class MockNetworkMonitor: NetworkMonitorProtocol {
    var isConnected: Bool = true

    func startMonitoring() {}
    func stopMonitoring() {}

    func simulateOffline() {
        isConnected = false
    }

    func simulateOnline() {
        isConnected = true
    }
}
```

---

## Running Tests

### Run All Tests
```bash
# Keyboard shortcut
Cmd + U

# Or from command line
xcodebuild test -workspace App.xcworkspace -scheme App
```

### Run Specific Test Class
```bash
# In Xcode, click test diamond next to class name
# Or command line
xcodebuild test -workspace App.xcworkspace \
  -scheme App \
  -only-testing App:AppTests/VehicleViewModelTests
```

### Run with Coverage
```bash
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme App \
  -enableCodeCoverage YES
```

### View Coverage Report
1. In Xcode: Product > Scheme > Edit Scheme > Test tab
2. Check "Gather coverage for target 'App'"
3. Run tests: Cmd + U
4. Open: Report Navigator > Coverage

---

## Continuous Integration (CI) Testing

### GitHub Actions Example
```yaml
name: iOS Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest

    steps:
    - uses: actions/checkout@v2

    - name: Install dependencies
      run: pod install

    - name: Run tests
      run: |
        xcodebuild test \
          -workspace App.xcworkspace \
          -scheme App \
          -enableCodeCoverage YES

    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

---

## Test Coverage Goals

### Current Coverage
- **Overall:** Target 70%+
- **Services:** 85%+
- **ViewModels:** 80%+
- **Models:** 90%+

### Improving Coverage

```swift
// Low coverage areas to focus on:
// - Error handling paths
// - Network failures
// - Edge cases
// - Boundary conditions

func testVehicleModelWithMinimalData() {
    // Edge case: minimal vehicle data
    let vehicle = VehicleModel(
        id: "",           // empty ID
        make: "",         // empty make
        model: "",        // empty model
        year: 1900,       // old year
        vin: ""           // empty VIN
    )

    XCTAssertFalse(vehicle.isValid())
}

func testLargeDataSet() {
    // Boundary case: large list
    let largeList = (0..<10000).map { index in
        VehicleModel(id: "v\(index)", make: "Make", model: "Model", year: 2023, vin: "V\(index)")
    }

    XCTAssertEqual(largeList.count, 10000)
}
```

---

## Debugging Tests

### Adding Breakpoints
1. Click on line number in test code
2. Xcode will pause execution at breakpoint
3. Step through code with Debug Navigator

### Logging in Tests
```swift
func testWithLogging() {
    print("Test started")
    print("Data: \(testData)")

    // Or use assertions with messages
    XCTAssertEqual(a, b, "Values should be equal: \(a) vs \(b)")
}
```

### Verbose Output
```bash
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme App \
  -verbose
```

---

## Best Practices

### Naming Conventions
```swift
// Good test names describe what is being tested
func testLoadVehicles_WhenNetworkAvailable_ReturnsList()
func testLogin_WithInvalidEmail_ThrowsValidationError()
func testTripTracking_WhenStarted_UpdatesUI()

// Avoid
func testLoadVehicles()           // Too vague
func test1()                      // Meaningless
func testThing()                  // Not specific
```

### Arrange-Act-Assert Pattern
```swift
func testExample() {
    // Arrange: Set up test data and mocks
    let input = "test"
    let expected = "TEST"

    // Act: Execute the code being tested
    let result = input.uppercased()

    // Assert: Verify the result
    XCTAssertEqual(result, expected)
}
```

### Test Independence
- Each test should be independent
- No dependencies between tests
- Clean up in `tearDown()`
- Use unique data for each test

### Avoid Testing Implementation Details
```swift
// Bad: Testing implementation details
func testLoadVehiclesCallsNetworkManager() {
    let mockManager = MockNetworkManager()
    _ = VehicleViewModel(networkManager: mockManager)
    XCTAssertTrue(mockManager.networkCalled)
}

// Good: Testing behavior/results
func testLoadVehiclesReturnsVehicleList() {
    let mockService = MockAPIService()
    mockService.vehiclesToReturn = [testVehicle]
    let viewModel = VehicleViewModel(apiService: mockService)
    XCTAssertEqual(viewModel.vehicles.count, 1)
}
```

---

## Resources

### Documentation
- [Apple XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [SwiftUI Testing Guide](https://developer.apple.com/documentation/xcode/running-tests-and-checking-code-coverage)

### Tools
- Xcode Test Navigator (Cmd + 6)
- Code Coverage Reports
- Performance Profiler (Instruments)

---

**Target:** 70%+ test coverage with focus on critical paths and error handling.

**Next Steps:** Run tests regularly, improve coverage incrementally, and maintain test suite as code evolves.
