# Azure API Integration - Quick Reference Guide

## Getting Started

### 1. Import Required Services
```swift
import Foundation

// In your ViewModel
let vehicleAPI = VehicleAPIService.shared
let tripAPI = TripAPIService.shared
let maintenanceAPI = MaintenanceAPIService.shared
let fuelAPI = FuelAPIService.shared
let realtimeService = RealtimeService.shared
let syncManager = OfflineSyncManager.shared
```

---

## Common Operations

### Fetch Vehicles
```swift
// Fetch all vehicles
do {
    let response = try await vehicleAPI.fetchVehicles(page: 1, limit: 50)
    let vehicles = response.vehicles
    print("Total vehicles: \(response.total)")
} catch {
    print("Error: \(error.localizedDescription)")
}

// Search vehicles
let results = try await vehicleAPI.searchVehicles(query: "FL-1234")

// Filter by status
let activeVehicles = try await vehicleAPI.fetchVehicles(byStatus: .active)

// Get low fuel vehicles
let lowFuel = try await vehicleAPI.fetchLowFuelVehicles()
```

### Create/Update Vehicle
```swift
// Create new vehicle
let createRequest = VehicleCreateRequest(
    tenantId: "tenant-001",
    number: "FL-5678",
    type: .truck,
    make: "Ford",
    model: "F-150",
    year: 2024,
    vin: "1FTFW1E54MFC12345",
    licensePlate: "ABC-1234",
    status: .active,
    location: VehicleLocation(lat: 28.5383, lng: -81.3792, address: "Orlando, FL"),
    region: "Central",
    department: "Operations",
    fuelLevel: 0.75,
    fuelType: .gasoline,
    mileage: 15000,
    ownership: .owned,
    tags: ["4WD", "Heavy Duty"]
)

let newVehicle = try await vehicleAPI.createVehicle(createRequest)

// Update vehicle
let updateRequest = VehicleUpdateRequest(
    number: nil,
    status: .maintenance,
    location: nil,
    fuelLevel: 0.50,
    mileage: 15250,
    assignedDriver: "John Doe",
    tags: ["4WD", "Heavy Duty", "In Service"]
)

let updated = try await vehicleAPI.updateVehicle(id: vehicleId, updates: updateRequest)
```

### Trip Management
```swift
// Start a trip
let startRequest = TripStartRequest(
    vehicleId: vehicleId,
    driverId: driverId,
    driverName: "John Doe",
    startLocation: VehicleLocation(lat: 28.5383, lng: -81.3792, address: "Orlando, FL"),
    purpose: "Delivery"
)

let trip = try await tripAPI.startTrip(startRequest)

// Update location during trip
try await tripAPI.updateTripLocation(
    id: trip.id,
    location: CLLocationCoordinate2D(latitude: 28.5400, longitude: -81.3800),
    speed: 55.0,
    timestamp: Date()
)

// End trip
let endRequest = TripEndRequest(
    endLocation: VehicleLocation(lat: 28.6000, lng: -81.4000, address: "Winter Park, FL"),
    endTime: Date(),
    distance: 15.5,
    duration: 1800, // 30 minutes
    fuelUsed: 1.2,
    averageSpeed: 45.0,
    maxSpeed: 65.0,
    notes: "Delivery completed successfully"
)

let completedTrip = try await tripAPI.endTrip(id: trip.id, endData: endRequest)
```

### Maintenance Operations
```swift
// Schedule maintenance
let scheduleRequest = MaintenanceScheduleRequest(
    vehicleId: vehicleId,
    type: "Oil Change",
    scheduledDate: Date().addingTimeInterval(7 * 24 * 3600), // 7 days from now
    provider: "Fleet Service Center",
    notes: "Regular maintenance"
)

let maintenance = try await maintenanceAPI.scheduleMaintenence(scheduleRequest)

// Get due maintenances
let dueList = try await maintenanceAPI.fetchDueMaintenances()

// Complete maintenance
let completion = MaintenanceCompletionRequest(
    completedDate: Date(),
    cost: 85.50,
    mileageAtService: 15250,
    parts: [
        MaintenancePart(name: "Oil Filter", partNumber: "PN-1234", quantity: 1, unitPrice: 12.99),
        MaintenancePart(name: "Motor Oil", partNumber: "PN-5678", quantity: 5, unitPrice: 8.99)
    ],
    laborHours: 1.0,
    notes: "Oil change completed"
)

let completed = try await maintenanceAPI.completeMaintenence(id: maintenance.id, completion: completion)
```

### Fuel Tracking
```swift
// Create fuel record
let fuelRequest = FuelRecordCreateRequest(
    vehicleId: vehicleId,
    date: Date(),
    station: "Shell",
    location: VehicleLocation(lat: 28.5383, lng: -81.3792, address: "123 Main St, Orlando, FL"),
    gallons: 15.5,
    pricePerGallon: 3.45,
    totalCost: 53.48,
    odometer: 15250,
    fuelType: .gasoline,
    paymentMethod: "Company Card",
    notes: nil
)

let fuelRecord = try await fuelAPI.createFuelRecord(fuelRequest)

// Upload receipt
let receiptURL = try await fuelAPI.uploadReceipt(
    fuelRecordId: fuelRecord.id,
    imageData: receiptImageData
)

// Get fuel statistics
let stats = try await fuelAPI.fetchFuelStats()
print("Average MPG: \(stats.averageMPG)")
print("Total Cost: $\(stats.totalCost)")
```

### Report Generation
```swift
// Generate vehicle utilization report
let reportRequest = ReportGenerateRequest(
    type: .vehicleUtilization,
    name: "Monthly Utilization - November 2025",
    parameters: ReportParameters(
        startDate: Date().addingTimeInterval(-30 * 24 * 3600),
        endDate: Date(),
        vehicleIds: nil, // All vehicles
        driverIds: nil
    )
)

let report = try await reportAPI.generateReport(reportRequest)

// Export to PDF
let pdfData = try await reportAPI.exportReport(reportId: report.id, format: .pdf)

// Save to file
let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
let fileURL = documentsPath.appendingPathComponent("report.pdf")
try pdfData.write(to: fileURL)
```

### Notifications
```swift
// Register for push notifications
if let deviceToken = UserDefaults.standard.string(forKey: "deviceToken") {
    try await notificationAPI.registerDevice(token: deviceToken)
}

// Fetch notifications
let response = try await notificationAPI.fetchNotifications(page: 1, limit: 20)
let unreadCount = response.unreadCount

// Update preferences
var prefs = try await notificationAPI.fetchNotificationPreferences()
prefs.enableAlerts = true
prefs.enableMaintenance = true
prefs.quietHoursStart = "22:00"
prefs.quietHoursEnd = "07:00"

try await notificationAPI.updateNotificationPreferences(prefs)
```

---

## Real-time Updates

### Connect to WebSocket
```swift
// Connect
realtimeService.connect()

// Subscribe to events
realtimeService.subscribe(to: [
    .vehicleLocationUpdate,
    .vehicleStatusChange,
    .tripStarted,
    .alertCreated,
    .geofenceViolation
])

// Listen for vehicle updates
realtimeService.vehicleLocationUpdates
    .sink { vehicle in
        print("Vehicle \(vehicle.number) moved to \(vehicle.location.address)")
    }
    .store(in: &cancellables)

// Listen for alerts
realtimeService.alertsCreated
    .sink { alertData in
        print("New alert: \(alertData)")
    }
    .store(in: &cancellables)

// Disconnect when done
realtimeService.disconnect()
```

---

## Offline Support

### Queue Operations for Later
```swift
// Queue vehicle update
syncManager.enqueueVehicleUpdate(
    vehicleId: vehicleId,
    updates: VehicleUpdateRequest(
        status: .maintenance,
        mileage: 15500
    )
)

// Queue trip creation
syncManager.enqueueTripCreate(tripRequest)

// Queue fuel record
syncManager.enqueueFuelRecord(fuelRequest)

// Check pending operations
let pendingCount = syncManager.getPendingCount()
print("\(pendingCount) operations pending sync")

// Manual sync
Task {
    await syncManager.syncAll()
}

// Monitor sync progress
syncManager.$syncProgress
    .sink { progress in
        print("Sync progress: \(Int(progress * 100))%")
    }
    .store(in: &cancellables)
```

---

## Error Handling Patterns

### Basic Error Handling
```swift
do {
    let vehicles = try await vehicleAPI.fetchVehicles()
    // Success
} catch let error as APIError {
    switch error {
    case .unauthorized:
        // Redirect to login
        print("Please log in again")
    case .networkError(let underlying):
        // Show network error
        print("Network error: \(underlying.localizedDescription)")
    case .offline:
        // Load from cache
        print("You are offline")
    default:
        print("Error: \(error.localizedDescription)")
    }
} catch {
    print("Unexpected error: \(error)")
}
```

### Error Handling with Cache Fallback
```swift
func loadVehicles() async {
    do {
        let response = try await vehicleAPI.fetchVehicles()
        self.vehicles = response.vehicles
        cacheVehicles(response.vehicles)
    } catch {
        // Try to load from cache
        if let cached = loadCachedVehicles() {
            self.vehicles = cached
            self.showMessage("Using cached data - offline")
        } else {
            self.showError(error.localizedDescription)
        }
    }
}
```

---

## Authentication

### Set Auth Token
```swift
// After successful login
AzureAPIClient.shared.setAuthToken(
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "refresh_token_here"
)

// Clear on logout
AzureAPIClient.shared.clearAuthToken()
```

---

## Configuration

### Environment Variables
Set these in your `.env` file or Xcode environment variables:
```bash
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret
```

### API Base URL
The API URL is automatically selected based on build configuration:
- **Debug:** `http://localhost:5555/api`
- **Release:** `https://dcf-fleet-management.azurewebsites.net/api`

Override in AzureConfig.swift if needed:
```swift
static var apiURL: String {
    return "https://custom-domain.com/api"
}
```

---

## Performance Tips

### 1. Use Pagination
```swift
// Bad - loads all records
let allVehicles = try await vehicleAPI.fetchVehicles(page: 1, limit: 1000)

// Good - paginate as needed
let page1 = try await vehicleAPI.fetchVehicles(page: 1, limit: 50)
let page2 = try await vehicleAPI.fetchVehicles(page: 2, limit: 50)
```

### 2. Batch Operations
```swift
// Bad - multiple individual requests
for vehicle in vehicles {
    try await vehicleAPI.updateVehicleStatus(id: vehicle.id, status: .inactive)
}

// Good - single batch request
let updates = vehicles.map { VehicleBatchUpdate(id: $0.id, status: .inactive) }
try await vehicleAPI.batchUpdateVehicles(updates)
```

### 3. Cache Strategy
```swift
// Cache responses for quick access
func fetchVehicles() async throws -> [Vehicle] {
    // Check cache first
    if let cached = getCachedVehicles(), cacheIsValid() {
        return cached
    }

    // Fetch from API
    let response = try await vehicleAPI.fetchVehicles()
    cacheVehicles(response.vehicles)
    return response.vehicles
}
```

### 4. Cancel Unnecessary Requests
```swift
private var fetchTask: Task<Void, Never>?

func loadData() {
    // Cancel previous request
    fetchTask?.cancel()

    // Start new request
    fetchTask = Task {
        do {
            let data = try await vehicleAPI.fetchVehicles()
            self.vehicles = data.vehicles
        } catch {
            // Handle error
        }
    }
}
```

---

## Debugging

### Enable Request Logging
The API client automatically logs all requests. Check Xcode console for:
```
[Network] GET /v1/vehicles - 200 OK (0.234s)
[API] Fetched 25 vehicles
```

### Monitor Network Status
```swift
AzureAPIClient.shared.$isOnline
    .sink { isOnline in
        print("Network: \(isOnline ? "Online" : "Offline")")
    }
    .store(in: &cancellables)
```

### Check Sync Queue
```swift
print("Pending operations: \(syncManager.getPendingCount())")
print("Failed operations: \(syncManager.getFailedCount())")

if let oldest = syncManager.getOldestPendingOperation() {
    print("Oldest pending: \(oldest.timestamp)")
}
```

---

## Testing

### Mock API Responses
```swift
// For unit tests, inject a mock API client
class MockVehicleAPI: VehicleAPIService {
    var mockVehicles: [Vehicle] = []

    override func fetchVehicles() async throws -> VehiclesResponse {
        return VehiclesResponse(
            vehicles: mockVehicles,
            total: mockVehicles.count,
            page: 1,
            limit: 50
        )
    }
}
```

---

## Common Issues

### Issue: 401 Unauthorized
**Solution:** Token expired. Clear and re-authenticate:
```swift
AzureAPIClient.shared.clearAuthToken()
// Redirect to login screen
```

### Issue: Slow Network Performance
**Solution:** Use pagination and cache:
```swift
// Reduce page size
let response = try await vehicleAPI.fetchVehicles(page: 1, limit: 25)
```

### Issue: Offline Operations Not Syncing
**Solution:** Check network status and trigger manual sync:
```swift
if AzureAPIClient.shared.isOnline {
    await syncManager.syncAll()
} else {
    print("Still offline - will sync when connected")
}
```

---

## Support

For issues or questions:
1. Check `AZURE_API_INTEGRATION_SUMMARY.md` for detailed documentation
2. Review logs in Xcode console
3. Check Azure Application Insights for server-side errors
4. Contact backend team for API issues

---

**Last Updated:** November 17, 2025
