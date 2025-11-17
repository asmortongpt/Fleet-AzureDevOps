# iOS Fleet Management App - Testing Guide

## Overview

This document describes the testing infrastructure and conventions for the Fleet Management iOS app.

## Test Infrastructure

### Test Types

1. **Unit Tests** (`AppTests/Unit/`)
   - Test individual components in isolation
   - Fast execution
   - No external dependencies
   - Examples: ViewModels, Managers, Services

2. **Integration Tests** (`AppTests/Integration/`)
   - Test interactions between components
   - May include mock external services
   - Examples: API integration, data flow

3. **UI Tests** (`AppTests/UI/`)
   - Test user interface and user flows
   - Run on simulator
   - Examples: Navigation, form submission, user interactions

4. **Performance Tests** (`AppTests/Performance/`)
   - Test app performance metrics
   - Memory usage, CPU usage, launch time
   - Examples: Scroll performance, data loading

5. **Production Tests** (`AppTests/ProductionTests/`)
   - Security, compliance, regression tests
   - Critical functionality validation
   - Examples: NIST compliance, offline sync, security

## Running Tests

### Local Development

#### Run all tests:
```bash
cd mobile-apps/ios-native
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=18.1'
```

#### Run specific test class:
```bash
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=18.1' \
  -only-testing:AppTests/DataPersistenceTests
```

#### Run tests with coverage:
```bash
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=18.1' \
  -enableCodeCoverage YES \
  -derivedDataPath DerivedData
```

#### View coverage report:
```bash
xcrun xccov view --report DerivedData/Logs/Test/*.xcresult
```

### Using Xcode

1. Open `App.xcworkspace` in Xcode
2. Press `Cmd+U` to run all tests
3. View test results in the Test Navigator (`Cmd+6`)
4. View code coverage in the Report Navigator (`Cmd+9`)

## Writing Tests

### Test Naming Convention

- Test files: `[Component]Tests.swift`
- Test classes: `[Component]Tests`
- Test methods: `test_[scenario]_[expectedBehavior]()`

Example:
```swift
class DataPersistenceTests: XCTestCase {
    func test_saveVehicle_persistsVehicleSuccessfully() {
        // Arrange
        let vehicle = Vehicle(id: "1", name: "Test Vehicle")

        // Act
        dataManager.save(vehicle)

        // Assert
        let saved = dataManager.fetch(id: "1")
        XCTAssertEqual(saved?.name, "Test Vehicle")
    }
}
```

### Test Structure (AAA Pattern)

1. **Arrange**: Set up test data and preconditions
2. **Act**: Execute the code under test
3. **Assert**: Verify the expected outcome

### Mocking Guidelines

- Use dependency injection for testability
- Create protocol-based mocks for external dependencies
- Store mocks in `AppTests/Helpers/Mocks/`

Example:
```swift
protocol NetworkServiceProtocol {
    func fetchData() async throws -> Data
}

class MockNetworkService: NetworkServiceProtocol {
    var mockData: Data?
    var shouldThrowError = false

    func fetchData() async throws -> Data {
        if shouldThrowError {
            throw NetworkError.connectionFailed
        }
        return mockData ?? Data()
    }
}
```

## Continuous Integration

### GitHub Actions

The CI pipeline runs automatically on:
- Push to `main`, `develop`, `stage-*` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

#### Workflow Steps:

1. **Build**: Compile app and verify 0 errors
2. **Test**: Run full test suite
3. **Coverage**: Generate code coverage report
4. **Lint**: Run SwiftLint for code quality

#### Artifacts:

- Test results bundle (`.xcresult`)
- HTML test report
- Code coverage report (JSON and TXT)
- SwiftLint report

### Viewing CI Results

1. Go to GitHub Actions tab in repository
2. Select the workflow run
3. Download artifacts for detailed reports

## Code Coverage Goals

- **Target**: 70% overall coverage
- **Critical Components**: 90% coverage minimum
  - Authentication
  - Data Persistence
  - Trip Tracking
  - Security features

## Linting

### SwiftLint Configuration

Configuration file: `.swiftlint.yml`

#### Run SwiftLint locally:
```bash
cd mobile-apps/ios-native
swiftlint
```

#### Auto-fix issues:
```bash
swiftlint --fix
```

#### Key Rules:
- Line length: 120 characters (warning), 150 (error)
- File length: 500 lines (warning), 1000 (error)
- Function length: 50 lines (warning), 100 (error)
- No force unwrapping (`!`)
- No force casting (`as!`)
- Use safe optional unwrapping

## Test Data Management

### Test Fixtures

Store test fixtures in `AppTests/Fixtures/`:
- JSON files for mock API responses
- Sample data objects
- Test images

### Test Database

- Use in-memory Core Data store for tests
- Reset database before each test
- Don't pollute production database

Example:
```swift
class TestDataManager {
    static func createInMemoryStore() -> NSPersistentContainer {
        let container = NSPersistentContainer(name: "FleetManager")
        let description = NSPersistentStoreDescription()
        description.type = NSInMemoryStoreType
        container.persistentStoreDescriptions = [description]
        return container
    }
}
```

## Performance Testing

### Metrics to Track

1. **App Launch Time**: < 2 seconds
2. **View Load Time**: < 500ms
3. **API Response Handling**: < 100ms
4. **Memory Usage**: < 100MB baseline
5. **Scroll Performance**: 60 FPS

### Running Performance Tests

```swift
func testPerformance_vehicleListLoading() {
    measure {
        // Code to measure
        viewModel.loadVehicles()
    }
}
```

## UI Testing Best Practices

1. **Use Accessibility Identifiers**:
```swift
Button("Save")
    .accessibilityIdentifier("saveButton")
```

2. **Test from User Perspective**:
```swift
func testUserCanAddVehicle() {
    app.buttons["addVehicleButton"].tap()
    app.textFields["vehicleName"].tap()
    app.textFields["vehicleName"].typeText("Test Vehicle")
    app.buttons["saveButton"].tap()

    XCTAssertTrue(app.staticTexts["Test Vehicle"].exists)
}
```

3. **Use Waiting for Elements**:
```swift
let element = app.buttons["submit"]
XCTAssertTrue(element.waitForExistence(timeout: 5))
```

## Troubleshooting

### Tests Failing on CI but Pass Locally

- Check simulator iOS version matches CI
- Verify CocoaPods dependencies are cached
- Check for race conditions in async code

### Flaky Tests

- Add proper waits for async operations
- Use `XCTestExpectation` for async tests
- Avoid hardcoded delays (`sleep`)

### Slow Test Suite

- Run tests in parallel where possible
- Use test plans to organize test execution
- Mock expensive operations (network, disk I/O)

## Test Maintenance

### Regular Tasks

- [ ] Review and update test coverage monthly
- [ ] Remove obsolete tests when features change
- [ ] Update mocks when APIs change
- [ ] Run full test suite before major releases
- [ ] Address flaky tests immediately

### Adding New Tests

When adding a new feature:
1. Write unit tests for business logic
2. Write integration tests for data flow
3. Write UI tests for user-facing features
4. Update this documentation if needed

## Resources

- [XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [XCUITest Guide](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/testing_with_xcode/chapters/09-ui_testing.html)
- [SwiftLint Rules](https://realm.github.io/SwiftLint/rule-directory.html)
- [GitHub Actions for iOS](https://docs.github.com/en/actions/deployment/deploying-xcode-applications)

## Contact

For questions or issues with testing infrastructure:
- Create an issue in the GitHub repository
- Tag tests with `@testing` in commit messages
- Review test results in CI/CD pipeline
