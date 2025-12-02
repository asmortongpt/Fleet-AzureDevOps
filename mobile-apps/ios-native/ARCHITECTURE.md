# Architecture Guide - iOS Fleet Management App

**Last Updated:** November 11, 2025
**Architecture Pattern:** MVVM (Model-View-ViewModel)
**UI Framework:** SwiftUI
**Data Binding:** Combine Framework

---

## Overview

The iOS Fleet Management app follows the **MVVM (Model-View-ViewModel)** architectural pattern, which provides clear separation of concerns and testability. This document describes the overall architecture, design patterns, and structure.

### Architecture Principles

1. **Separation of Concerns** - Each layer has a specific responsibility
2. **Testability** - Services and business logic are testable
3. **Reusability** - Components and utilities are reusable
4. **Maintainability** - Clear structure makes code easy to understand
5. **Scalability** - Structure supports adding new features

---

## Architecture Layers

### Layer Diagram

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                      │
│         (SwiftUI Views & Components)            │
├─────────────────────────────────────────────────┤
│              Presentation Layer                  │
│   (ViewModels, State Management, Navigation)    │
├─────────────────────────────────────────────────┤
│              Business Logic Layer                │
│   (Services, Managers, UseCase Logic)           │
├─────────────────────────────────────────────────┤
│              Data Layer                          │
│   (Persistence, API, Cache, Local Storage)      │
├─────────────────────────────────────────────────┤
│           Infrastructure Layer                   │
│    (Network, Logging, Security, Utilities)      │
└─────────────────────────────────────────────────┘
```

---

## Detailed Layer Structure

### 1. UI Layer (Presentation)

**Responsibility:** Display data and handle user interactions

**Components:**
```
Views/ (SwiftUI Views)
├── MainTabView.swift                # Main navigation hub (tab bar)
├── DashboardView.swift              # Fleet overview and metrics
├── VehicleListView.swift            # Vehicle list with search/filter
├── VehicleDetailView.swift          # Individual vehicle details
├── VehicleInspectionView.swift      # Multi-step inspection process
├── TripTrackingView.swift           # Active trip tracking UI
├── TripHistoryView.swift            # Historical trip analytics
├── TripDetailView.swift             # Individual trip information
├── OBD2DiagnosticsView.swift        # Real-time OBD2 data display
├── ErrorView.swift                  # Error message display
└── LoginView.swift                  # Authentication UI

Components/ (Reusable UI Components)
├── VehicleCard.swift                # Vehicle list item component
└── FleetMetricsCard.swift           # Metrics display component
```

**Key Characteristics:**
- Pure SwiftUI implementation
- No business logic (only presentation logic)
- Reactive to ViewModel changes via `@ObservedObject`
- Composition-based structure
- Accessibility support with VoiceOver labels

---

### 2. Presentation Layer (MVVM)

**Responsibility:** State management, data formatting, navigation

**ViewModels:**
```
ViewModels/ (Business Logic Coordinating Layer)
├── VehicleViewModel.swift
│   ├── Manages vehicle list state
│   ├── Handles filtering and sorting
│   ├── Updates vehicle details
│   └── Published properties for UI binding
│
└── DashboardViewModel.swift
    ├── Aggregates fleet metrics
    ├── Calculates summary statistics
    ├── Updates dashboard state
    └── Manages metric calculations
```

**Pattern Used:**
```swift
@MainActor
class VehicleViewModel: ObservableObject {
    @Published var vehicles: [VehicleModel] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    // Input (user actions)
    func loadVehicles() async { ... }
    func filterVehicles(by: String) { ... }

    // Output (published state)
    var filteredVehicles: [VehicleModel] { ... }
}
```

**Navigation:**
```
NavigationCoordinator.swift
├── Manages app-wide navigation
├── Handles deep linking
├── Coordinates view transitions
└── Maintains navigation state
```

---

### 3. Business Logic Layer (Services & Managers)

**Responsibility:** Core business logic and service orchestration

#### Authentication Services
```
Authentication/
├── AuthenticationManager.swift       # Session & token management (MVVM)
│   ├── Login/logout orchestration
│   ├── Token refresh mechanism
│   ├── Biometric authentication
│   └── Session state tracking
│
└── AuthenticationService.swift       # Low-level auth operations
    ├── API calls for auth
    ├── Token storage
    └── Credential validation
```

#### Core Services
```
Services/
├── APIConfiguration.swift           # API configuration & endpoints
│   ├── Base URL management (dev/prod)
│   ├── Endpoint definitions
│   └── Request builder
│
├── AzureNetworkManager.swift        # HTTP client
│   ├── RESTful API requests
│   ├── JSON encoding/decoding
│   ├── Error handling
│   └── Response parsing
│
├── DataPersistenceManager.swift     # Local data storage
│   ├── Core Data wrapper
│   ├── CRUD operations
│   ├── Caching logic
│   └── Data migration
│
├── LocationManager.swift            # GPS location services
│   ├── Location tracking
│   ├── Permission handling
│   ├── Background location updates
│   └── Geofencing
│
├── TripTrackingService.swift        # Trip recording
│   ├── Trip start/stop
│   ├── GPS point collection
│   ├── Distance calculation
│   └── Speed tracking
│
├── OBD2Manager.swift                # OBD2 device management
│   ├── Device discovery
│   ├── Connection handling
│   ├── Data retrieval
│   └── Error recovery
│
├── NetworkMonitor.swift             # Network status
│   ├── Reachability checking
│   ├── Connection type detection
│   └── Network state notifications
│
└── AzureConfig.swift                # Azure-specific config
    ├── Environment settings
    ├── Azure headers
    └── Health check endpoints
```

#### Security Services
```
Security/
├── KeychainManager.swift            # Secure credential storage
│   ├── Token storage
│   ├── Password storage
│   └── Secure deletion
│
├── CertificatePinningManager.swift  # SSL/TLS validation
│   ├── Certificate pinning
│   ├── Trust evaluation
│   └── Security failure handling
│
├── EncryptionManager.swift          # Data encryption
│   ├── AES-256 encryption
│   ├── Data decryption
│   └── Key management
│
├── JailbreakDetector.swift          # Device security detection
│   ├── Jailbreak detection
│   ├── Security warnings
│   └── Unsafe feature blocking
│
└── SecureConfigManager.swift        # Configuration security
    ├── Encrypted config storage
    ├── Sensitive data protection
    └── Configuration retrieval
```

#### Utility Services
```
Utilities/
├── LoggingManager.swift             # Comprehensive logging
│   ├── Multiple log levels
│   ├── File-based persistence
│   └── Console output
│
├── SecurityLogger.swift             # Security event logging
│   ├── Authentication events
│   ├── Permission changes
│   └── Security incidents
│
├── ErrorHandler.swift               # Centralized error management
│   ├── Error categorization
│   ├── User-friendly messages
│   └── Error recovery
│
└── NavigationCoordinator.swift      # Navigation state
    ├── Screen transitions
    ├── Deep link handling
    └── Navigation stack management
```

---

### 4. Data Layer

**Responsibility:** Data retrieval, persistence, and caching

#### Models
```
Models/
├── Vehicle.swift                    # Basic vehicle model
│   ├── VIN, make, model, year
│   ├── Registration info
│   └── Owner information
│
├── VehicleModel.swift               # Extended vehicle data
│   ├── Vehicle details
│   ├── Maintenance history
│   ├── Trip statistics
│   └── OBD2 status
│
├── TripModel.swift                  # Trip data
│   ├── Start/end times
│   ├── Distance and duration
│   ├── GPS coordinates
│   └── Fuel/efficiency metrics
│
└── FleetModels.swift                # Shared models
    ├── Driver model
    ├── Maintenance record
    ├── Inspection item
    └── Fleet metrics
```

#### Data Persistence
```
Core Data Storage:
├── Vehicle Entity
│   ├── vehicleId (unique)
│   ├── make, model, year
│   ├── vin, registration
│   └── metadata
│
├── Trip Entity
│   ├── tripId (unique)
│   ├── vehicleId (foreign key)
│   ├── startTime, endTime
│   ├── startLocation, endLocation
│   ├── distance, duration
│   └── gpsTracks (relationship)
│
├── GPSPoint Entity
│   ├── tripId (foreign key)
│   ├── latitude, longitude
│   ├── timestamp
│   ├── speed, altitude
│   └── accuracy
│
└── CacheEntry Entity
    ├── key (unique)
    ├── value (JSON)
    ├── expirationDate
    └── metadata
```

#### API Endpoints
```
Authentication:
POST   /auth/login              # User login
GET    /auth/me                 # Current user
POST   /auth/logout             # Logout
POST   /auth/refresh            # Token refresh

Vehicles:
GET    /vehicles                # List vehicles
GET    /vehicles/{id}           # Vehicle details
PUT    /vehicles/{id}           # Update vehicle
POST   /vehicles/{id}/inspection # Submit inspection

Trips:
GET    /trips                   # List trips
GET    /trips/{id}              # Trip details
POST   /trips/start             # Start trip
POST   /trips/{id}/end          # End trip

Maintenance:
GET    /maintenance             # Maintenance records
POST   /maintenance             # Submit maintenance

Metrics:
GET    /fleet-metrics           # Fleet statistics
GET    /vehicles/{id}/metrics   # Vehicle metrics

Health:
GET    /health                  # API health check
```

---

### 5. Infrastructure Layer

**Responsibility:** Technical utilities and cross-cutting concerns

#### Networking
```
Components:
- URLSession configuration
- Request/response logging
- Error mapping
- Retry logic
- Timeout handling
```

#### Logging System
```
Levels:
- .debug: Detailed debugging info
- .info: Informational messages
- .warning: Warning messages
- .error: Error messages
- .critical: Critical failures

Outputs:
- Console (development)
- File system (production)
- Remote service (Sentry)
```

#### Error Handling
```
Error Categories:
- NetworkError
  ├── NoConnection
  ├── Timeout
  ├── InvalidResponse
  └── ServerError

- AuthenticationError
  ├── InvalidCredentials
  ├── TokenExpired
  ├── Unauthorized
  └── MissingCredentials

- ValidationError
  ├── InvalidInput
  ├── MissingField
  └── InvalidFormat

- LocalStorageError
  ├── CorruptedData
  ├── QuotaExceeded
  └── AccessDenied
```

---

## MVVM Pattern in Detail

### Model
```swift
struct VehicleModel: Codable {
    let id: String
    let make: String
    let model: String
    let year: Int
    let vin: String

    // No business logic, pure data structure
}
```

### View
```swift
struct VehicleListView: View {
    @ObservedObject var viewModel: VehicleViewModel

    var body: some View {
        List {
            ForEach(viewModel.vehicles) { vehicle in
                VehicleRow(vehicle: vehicle)
            }
        }
    }
}
```

### ViewModel
```swift
@MainActor
class VehicleViewModel: ObservableObject {
    @Published var vehicles: [VehicleModel] = []
    @Published var isLoading = false

    private let apiService: APIService

    func loadVehicles() async {
        isLoading = true
        do {
            vehicles = try await apiService.fetchVehicles()
        } catch {
            // Handle error
        }
        isLoading = false
    }
}
```

### Data Flow
```
User Action (tap button)
       ↓
View calls ViewModel method
       ↓
ViewModel calls Service
       ↓
Service makes API call / accesses data
       ↓
Data returned to ViewModel
       ↓
ViewModel updates @Published properties
       ↓
View observes changes and updates UI
```

---

## Dependency Injection Pattern

### Service Injection
```swift
// Services are typically singletons
class VehicleViewModel: ObservableObject {
    private let apiService: APIService
    private let persistenceManager: DataPersistenceManager

    init(
        apiService: APIService = .shared,
        persistenceManager: DataPersistenceManager = .shared
    ) {
        self.apiService = apiService
        self.persistenceManager = persistenceManager
    }
}
```

### Environment Objects
```swift
@main
struct FleetManagementApp: App {
    @StateObject var authManager = AuthenticationManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authManager)
        }
    }
}
```

---

## Data Flow Patterns

### Login Flow
```
LoginView
    ↓ (user taps sign in)
RootView.checkAuthenticationStatus()
    ↓
AuthenticationManager.login()
    ↓
AuthenticationService.loginUser()
    ↓
APIConfiguration.createRequest()
    ↓
AzureNetworkManager.request()
    ↓
HTTP POST to /auth/login
    ↓
APIResponse with token
    ↓
KeychainManager.saveToken()
    ↓
@Published isAuthenticated = true
    ↓
View updates to MainTabView
```

### Vehicle List Load Flow
```
VehicleListView appears
    ↓
.onAppear { viewModel.loadVehicles() }
    ↓
VehicleViewModel.loadVehicles()
    ↓
@Published isLoading = true
    ↓
APIService.fetchVehicles()
    ↓
AzureNetworkManager.request()
    ↓
HTTP GET /vehicles
    ↓
Response with vehicle array
    ↓
DataPersistenceManager.cache(vehicles)
    ↓
@Published vehicles = [...]
    ↓
View renders VehicleList
```

### Trip Tracking Flow
```
Trip starts (tap button)
    ↓
TripTrackingView initializes
    ↓
LocationManager.startTracking()
    ↓
TripTrackingService.startTrip()
    ↓
HTTPClient: POST /trips/start
    ↓
Periodic location updates
    ↓
LocationManager.didUpdateLocations()
    ↓
GPSPoint saved to Core Data
    ↓
TripTrackingService.updateTripState()
    ↓
@Published tripState = .tracking
    ↓
View shows real-time updates
```

---

## Async/Await Pattern

### Async Function
```swift
func loadVehicles() async throws -> [VehicleModel] {
    let request = APIConfiguration.createRequest(for: "/vehicles")
    let (data, response) = try await URLSession.shared.data(for: request)
    let vehicles = try JSONDecoder().decode([VehicleModel].self, from: data)
    return vehicles
}
```

### Calling Async Function
```swift
Task {
    do {
        let vehicles = try await apiService.loadVehicles()
        await MainActor.run {
            self.vehicles = vehicles
        }
    } catch {
        handleError(error)
    }
}
```

### Main Thread Updates
```swift
@MainActor
func updateUI() {
    // Always on main thread
    self.vehicles = newVehicles
}

// Or explicitly:
await MainActor.run {
    self.vehicles = newVehicles
}
```

---

## State Management Strategy

### Local State (in View)
```swift
struct SearchView: View {
    @State private var searchText = ""

    var body: some View {
        TextField("Search", text: $searchText)
    }
}
```

### ViewModel State (Published)
```swift
@MainActor
class VehicleViewModel: ObservableObject {
    @Published var vehicles: [VehicleModel] = []
    @Published var selectedVehicle: VehicleModel?
    @Published var isLoading = false
}
```

### App-Wide State (EnvironmentObject)
```swift
@MainActor
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
}

// Usage in views:
@EnvironmentObject var authManager: AuthenticationManager
```

---

## Error Handling Architecture

### Error Definition
```swift
enum APIError: LocalizedError {
    case noConnection
    case invalidURL
    case decodingFailed
    case serverError(Int)
    case unauthorized
    case unknown

    var errorDescription: String? {
        switch self {
        case .noConnection:
            return "No internet connection"
        case .unauthorized:
            return "Please sign in again"
        // ...
        }
    }
}
```

### Error Handling in Views
```swift
struct VehicleListView: View {
    @ObservedObject var viewModel: VehicleViewModel

    var body: some View {
        ZStack {
            if let error = viewModel.errorMessage {
                ErrorView(error: error, retryAction: {
                    Task { await viewModel.loadVehicles() }
                })
            } else if viewModel.isLoading {
                ProgressView()
            } else {
                List(viewModel.vehicles) { vehicle in
                    VehicleRow(vehicle: vehicle)
                }
            }
        }
    }
}
```

---

## Caching Strategy

### Memory Cache (In-Memory)
```
- Fast access
- Lost on app restart
- Used for: Current user, active trip
- TTL: Session-based
```

### Disk Cache (Core Data)
```
- Persistent storage
- Survives app restart
- Used for: Vehicles, trips, inspection history
- TTL: 7 days or manual clear
```

### API Response Cache
```
- Cached responses from API
- Reduces network requests
- Used for: Lists, metrics
- TTL: 30 minutes
- Invalidated on: Create/update/delete operations
```

---

## Testing Architecture

### Unit Tests
```
Test Coverage:
- ViewModel logic (state updates)
- Service methods (API calls mocked)
- Business logic calculations
- Error handling scenarios
- Data persistence operations

Target: 70%+ coverage
```

### Integration Tests
```
Test Coverage:
- API endpoint verification
- Data flow from API → Storage
- Authentication flow
- Sync mechanisms
```

### UI Tests (XCUITest)
```
Test Coverage:
- Navigation flows
- User interactions
- Form submissions
- Error presentations
```

---

## Performance Considerations

### Memory Management
- `@StateObject` for ViewModels (owned by view)
- `@ObservedObject` for dependency (created elsewhere)
- Proper cleanup in `deinit`
- Avoid circular references

### Networking Optimization
- Request batching
- Response caching
- Lazy loading
- Pagination for lists

### UI Performance
- Lazy rendering with LazyVStack
- Async image loading
- Debouncing search queries
- List performance optimization

### Data Persistence
- Indexing frequently queried fields
- Periodic cleanup of expired data
- Efficient Core Data queries
- NSFetchedResultsController for live updates

---

## Security Architecture

### Authentication Flow
```
1. User enters credentials
2. AuthenticationService sends to API
3. API returns JWT token
4. KeychainManager stores token securely
5. Token added to all future requests
6. Token refresh before expiration
7. On logout: Token removed from keychain
```

### Certificate Pinning
```
1. Production certificates configured
2. URLSessionDelegate validates certificates
3. Rejects connections with wrong certs
4. Prevents man-in-the-middle attacks
```

### Data Encryption
```
1. Sensitive data identified
2. EncryptionManager encrypts before storage
3. Core Data stores encrypted values
4. Decryption on retrieval
5. AES-256 encryption algorithm
```

---

## Scaling Considerations

### Adding New Features
1. **Create Model** in `/Models`
2. **Create ViewModel** in `/ViewModels`
3. **Create Views** in `/Views`
4. **Create Service** in `/Services` if needed
5. **Add Tests** in `/AppTests`
6. **Integrate** with existing architecture

### Adding New API Endpoint
1. **Define in APIConfiguration.Endpoints**
2. **Create Service method** in appropriate Service
3. **Create ViewModel method** to call service
4. **Add error handling**
5. **Create tests**

---

## Code Organization Best Practices

### File Organization
- One class/struct per file (except small related types)
- File name matches class/struct name
- Organized in logical directories
- Clear separation of concerns

### Naming Conventions
- Views: `*View.swift` (e.g., `VehicleListView.swift`)
- ViewModels: `*ViewModel.swift`
- Models: `*Model.swift` or plural (e.g., `FleetModels.swift`)
- Services: `*Service.swift` or `*Manager.swift`
- Managers: `*Manager.swift`

### Code Comments
- Mark MARK: sections for logical grouping
- Explain 'why', not 'what'
- Document public APIs
- Include examples where helpful

---

## Architecture Diagram

### Complete System Flow
```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│            (SwiftUI Views with Data Binding)            │
└────────────────────┬────────────────────────────────────┘
                     │ Observes
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   View Models                            │
│  (State Management, Data Formatting, Navigation)        │
└────────────────────┬────────────────────────────────────┘
                     │ Delegates to
                     ↓
┌──────────────────────────────────────────────────────────┐
│                    Services                              │
│  (AuthenticationManager, APIService, TripTrackingService)│
└──────────┬─────────────────────────────┬────────────────┘
           │                             │
           ↓                             ↓
    ┌─────────────┐            ┌──────────────────┐
    │  Network    │            │  Local Storage   │
    │   (REST)    │            │   (Core Data)    │
    └─────────────┘            └──────────────────┘
           │                             │
           ↓                             ↓
    ┌─────────────┐            ┌──────────────────┐
    │   Backend   │            │  Keychain &      │
    │   API       │            │  Encryption      │
    └─────────────┘            └──────────────────┘
```

---

## Architecture Evolution

### Current State (v1.0)
- ✅ MVVM pattern implemented
- ✅ Service-oriented architecture
- ✅ Secure data storage
- ✅ Comprehensive error handling

### Future Improvements
- Consider VIPER for complex features
- Implement Repository pattern
- Add Dependency Injection framework (if complexity increases)
- Consider Redux/Flux for complex state management

---

## Conclusion

The iOS Fleet Management app uses a well-structured MVVM architecture with clear separation between UI, business logic, and data layers. This provides:

- **Maintainability:** Clear structure makes code easy to understand
- **Testability:** Services are easily testable
- **Scalability:** Easy to add new features
- **Performance:** Efficient data handling and UI updates

Follow these architectural principles when making changes to keep the codebase healthy and maintainable.

---

**For questions about architecture, see the relevant layer documentation or code comments.**
