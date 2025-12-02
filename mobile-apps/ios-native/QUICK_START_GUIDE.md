# Quick Start Guide - Core Platform Features
## Fleet Companion iOS - Developer Reference

This guide provides quick code snippets for using the newly implemented core platform features.

---

## Table of Contents

1. [Core Data Operations](#1-core-data-operations)
2. [Sync Engine Usage](#2-sync-engine-usage)
3. [Optimized ViewModels](#3-optimized-viewmodels)
4. [Performance Monitoring](#4-performance-monitoring)
5. [WebSocket Integration](#5-websocket-integration)
6. [Common Patterns](#6-common-patterns)

---

## 1. Core Data Operations

### Basic CRUD

```swift
import Foundation

// Initialize repository
let repository = VehicleRepository()

// CREATE
let newVehicle = Vehicle(/* ... */)
try repository.save(newVehicle)

// READ
let allVehicles = try repository.fetchAll()
let vehicle = try repository.fetch(byId: "V123")

// UPDATE
var vehicle = try repository.fetch(byId: "V123")
vehicle.mileage = 50000
try repository.save(vehicle)

// DELETE
try repository.delete(vehicle)
```

### Queries

```swift
// Find by status
let activeVehicles = try repository.fetch(byStatus: .active)

// Search
let searchResults = try repository.search(query: "Ford")

// Filter low fuel
let lowFuelVehicles = try repository.fetchLowFuelVehicles()

// Count by status
let counts = try repository.countByStatus()
// [.active: 25, .maintenance: 5, .offline: 2]
```

### Background Operations

```swift
// Perform heavy operation in background
DataPersistenceManager.shared.performBackgroundTask { context in
    // Import 1000 vehicles
    for vehicleData in largeDataset {
        let entity = VehicleEntity.create(from: vehicleData, in: context)
    }

    try? context.save()
}
```

---

## 2. Sync Engine Usage

### Queue Items for Sync

```swift
// Queue a single item
let syncItem = SyncItem(
    type: .vehicle,
    operation: .update,
    entityId: "V123",
    data: ["mileage": 50000],
    priority: .normal
)

SyncEngine.shared.queueForSync(syncItem)
```

### Priority Examples

```swift
// Critical (syncs immediately if online)
let emergencyItem = SyncItem(
    type: .incident,
    operation: .create,
    entityId: UUID().uuidString,
    data: emergencyData,
    priority: .critical
)

// High (important, syncs soon)
let maintenanceItem = SyncItem(
    type: .maintenance,
    operation: .update,
    entityId: "M456",
    data: maintenanceData,
    priority: .high
)

// Normal (regular sync)
let vehicleItem = SyncItem(
    type: .vehicle,
    operation: .update,
    entityId: "V789",
    data: vehicleData,
    priority: .normal
)
```

### Manual Sync

```swift
// Force sync all pending items
await SyncEngine.shared.forceSyncAll()

// Check sync status
print("Pending items: \(SyncEngine.shared.pendingItemsCount)")
print("Is syncing: \(SyncEngine.shared.isSyncing)")
print("Last sync: \(SyncEngine.shared.lastSyncDate?.formatted() ?? "Never")")
```

---

## 3. Optimized ViewModels

### Basic Usage

```swift
import SwiftUI

struct VehicleListView: View {
    @StateObject private var viewModel = OptimizedVehicleViewModel()

    var body: some View {
        List(viewModel.filteredVehicles) { vehicle in
            VehicleRow(vehicle: vehicle)
        }
        .searchable(text: $viewModel.searchText)
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.fetchVehicles()
        }
    }
}
```

### Filtering & Sorting

```swift
// Search
viewModel.searchText = "Ford"

// Filter by status
viewModel.selectedStatus = .active

// Change sort order
viewModel.sortOption = .mileage

// Clear all filters
viewModel.clearFilters()
```

### Statistics

```swift
let stats = viewModel.getStatistics()

print("Total: \(stats.totalCount)")
print("Active: \(stats.activeCount)")
print("Utilization: \(stats.utilizationRate * 100)%")
print("Avg Mileage: \(stats.averageMileage)")
print("Low Fuel: \(stats.lowFuelCount)")
```

### Dependency Injection (Testing)

```swift
// Create mock for testing
let mockRepo = MockVehicleRepository()
let mockNetwork = MockNetworkManager()

let viewModel = OptimizedVehicleViewModel(
    repository: mockRepo,
    networkManager: mockNetwork,
    syncEngine: MockSyncEngine()
)

// Run tests
await viewModel.fetchVehicles()
XCTAssertEqual(viewModel.vehicles.count, 5)
```

---

## 4. Performance Monitoring

### Start Monitoring

```swift
// Automatic startup
// PerformanceMonitor starts on init

// Manual control
PerformanceMonitor.shared.startMonitoring()
PerformanceMonitor.shared.stopMonitoring()
```

### Track Operations

```swift
// Track a slow operation
PerformanceMonitor.shared.startOperation("importData")

await importLargeDataset()

PerformanceMonitor.shared.endOperation("importData")
// Logs: ⏱️ Completed: importData in 2.143s
// Warns if > 1 second
```

### View Current Metrics

```swift
let metrics = PerformanceMonitor.shared.currentMetrics

print("Memory: \(metrics.memoryUsage.formattedUsed)")
// Memory: 125.45 MB

print("CPU: \(String(format: "%.1f%%", metrics.cpuUsage))")
// CPU: 23.5%

print("FPS: \(String(format: "%.1f", metrics.frameRate))")
// FPS: 59.2

print("Network: \(String(format: "%.3f s", metrics.networkLatency))")
// Network: 0.234 s
```

### Generate Report

```swift
let report = PerformanceMonitor.shared.generateReport()

print("Grade: \(report.performanceGrade.description)")
// Grade: Excellent

print("Avg Memory: \(String(format: "%.2f MB", report.averageMemoryUsage))")
print("Avg CPU: \(String(format: "%.2f%%", report.averageCPUUsage))")
print("Avg FPS: \(String(format: "%.1f", report.averageFrameRate))")

// Export full report
print(PerformanceMonitor.shared.exportMetrics())
```

### Performance Dashboard

```swift
// Show built-in dashboard
NavigationLink("Performance") {
    PerformanceDashboardView()
}
```

### Record Network Requests

```swift
let startTime = Date()

let response = try await networkManager.performRequest(...)

let duration = Date().timeIntervalSince(startTime)
PerformanceMonitor.shared.recordNetworkRequest(duration: duration)
```

---

## 5. WebSocket Integration

### Connect

```swift
// Connect on app launch
Task {
    if let token = await AuthenticationManager.shared.getAccessToken() {
        await WebSocketManager.shared.connect(token: token)
    }
}

// Check connection status
print("Connected: \(WebSocketManager.shared.isConnected)")
print("Status: \(WebSocketManager.shared.connectionStatus.description)")
```

### Subscribe to Updates

```swift
// Subscribe to vehicle updates
await WebSocketManager.shared.subscribeToVehicleUpdates("V123")

// Unsubscribe
await WebSocketManager.shared.unsubscribeFromVehicleUpdates("V123")
```

### Register Message Handlers

```swift
// Handle vehicle updates
WebSocketManager.shared.registerHandler(for: "vehicle_update") { message in
    if let vehicleId = message.payload["vehicleId"]?.value as? String {
        Task {
            // Refresh vehicle data
            await viewModel.refreshVehicle(vehicleId)
        }
    }
}

// Handle alerts
WebSocketManager.shared.registerHandler(for: "alert") { message in
    if let alertType = message.payload["type"]?.value as? String {
        // Show alert to user
        NotificationManager.shared.showAlert(type: alertType)
    }
}
```

### Send Messages

```swift
// Generic message
let message = WebSocketMessage(
    type: "custom_event",
    payload: [
        "data": "value",
        "timestamp": Date()
    ]
)

await WebSocketManager.shared.send(message)

// Convenience method
await WebSocketManager.shared.sendVehicleUpdate(
    "V123",
    data: ["location": ["lat": 40.7128, "lng": -74.0060]]
)
```

### Listen for Messages

```swift
// Observe published property
WebSocketManager.shared.$lastMessage
    .sink { message in
        guard let message = message else { return }
        print("Received: \(message.type)")
    }
    .store(in: &cancellables)

// Or use NotificationCenter
NotificationCenter.default.addObserver(
    self,
    selector: #selector(handleWebSocketMessage),
    name: .webSocketMessageReceived,
    object: nil
)
```

---

## 6. Common Patterns

### Offline-First Create

```swift
// 1. Create vehicle locally
let newVehicle = Vehicle(
    id: UUID().uuidString,
    number: "V456",
    make: "Ford",
    model: "F-150",
    /* ... */
)

// 2. Save to Core Data (works offline)
try repository.save(newVehicle)

// 3. Queue for sync (auto-syncs when online)
let syncItem = SyncItem(
    type: .vehicle,
    operation: .create,
    entityId: newVehicle.id,
    data: newVehicle.toDictionary(),
    priority: .normal
)

SyncEngine.shared.queueForSync(syncItem)

// 4. UI updates immediately (optimistic update)
// No waiting for network!
```

### Offline-First Update

```swift
// 1. Fetch from Core Data (instant)
var vehicle = try repository.fetch(byId: "V123")!

// 2. Update locally
vehicle.mileage = 50000
vehicle.fuelLevel = 0.75

// 3. Save to Core Data
try repository.save(vehicle)

// 4. Queue for sync
let syncItem = SyncItem(
    type: .vehicle,
    operation: .update,
    entityId: vehicle.id,
    data: [
        "mileage": vehicle.mileage,
        "fuelLevel": vehicle.fuelLevel
    ],
    priority: .normal
)

SyncEngine.shared.queueForSync(syncItem)
```

### Optimized List with Pagination

```swift
struct OptimizedListView: View {
    @StateObject private var viewModel = OptimizedVehicleViewModel()

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredVehicles) { vehicle in
                    VehicleRow(vehicle: vehicle)
                        .onAppear {
                            // Load more when near bottom
                            if vehicle == viewModel.filteredVehicles.last {
                                Task {
                                    await viewModel.loadMoreVehicles()
                                }
                            }
                        }
                }

                if viewModel.isLoading {
                    ProgressView()
                }
            }
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
}
```

### Performance-Monitored Operation

```swift
func performExpensiveOperation() async {
    // Start tracking
    PerformanceMonitor.shared.startOperation("expensiveOp")

    // Do work
    await doExpensiveWork()

    // End tracking (auto-warns if slow)
    PerformanceMonitor.shared.endOperation("expensiveOp")
}
```

### Real-Time Vehicle Tracking

```swift
class VehicleDetailViewModel: ObservableObject {
    @Published var vehicle: Vehicle

    init(vehicleId: String) {
        // Load from Core Data
        self.vehicle = try! VehicleRepository().fetch(byId: vehicleId)!

        // Subscribe to updates
        Task {
            await WebSocketManager.shared.subscribeToVehicleUpdates(vehicleId)
        }

        // Handle updates
        WebSocketManager.shared.registerHandler(for: "vehicle_update") { [weak self] message in
            if let data = message.payload["data"] as? [String: Any] {
                Task { @MainActor in
                    // Update UI in real-time
                    self?.updateVehicle(with: data)
                }
            }
        }
    }
}
```

---

## Best Practices

### ✅ DO

- Use `@StateObject` for ViewModels in views
- Use `@ObservedObject` when passing ViewModels down
- Always use `await` for async operations on Main Actor
- Queue data changes for sync immediately
- Monitor performance during development
- Use lazy loading for large lists
- Cache computed properties when expensive

### ❌ DON'T

- Don't block the main thread with heavy operations
- Don't fetch all data at once (use pagination)
- Don't skip debouncing for search
- Don't ignore performance warnings
- Don't sync immediately on every change (batch)
- Don't forget to mark operations as completed

---

## Troubleshooting

### Issue: Slow UI

**Solution:**
```swift
// Check if operations are on main thread
PerformanceMonitor.shared.generateReport()
// Look for slow operations

// Profile the specific view
instruments --template "Time Profiler" YourApp.app
```

### Issue: High Memory Usage

**Solution:**
```swift
// Check current usage
let usage = PerformanceMonitor.shared.currentMetrics.memoryUsage
print(usage.formattedUsed)

// Clear caches if needed
DataPersistenceManager.shared.clearVehicleCache()
viewModel.statisticsCache = nil
```

### Issue: Sync Not Working

**Solution:**
```swift
// Check network status
print(NetworkMonitor.shared.isConnected)

// Check sync queue
print("Pending: \(SyncEngine.shared.pendingItemsCount)")

// Force sync
await SyncEngine.shared.forceSyncAll()

// Check for errors
SyncEngine.shared.$syncStatus.sink { status in
    if case .failed(let error) = status {
        print("Sync error: \(error)")
    }
}
```

### Issue: WebSocket Disconnects

**Solution:**
```swift
// Check connection status
print(WebSocketManager.shared.connectionStatus.description)

// Manually reconnect
if let token = await AuthenticationManager.shared.getAccessToken() {
    await WebSocketManager.shared.connect(token: token)
}

// Check for errors in logs
// Look for: 🔄 WebSocket disconnected, attempting reconnect...
```

---

## Quick Reference Cheat Sheet

```swift
// Core Data
let repo = VehicleRepository()
try repo.save(vehicle)
let vehicles = try repo.fetchAll()

// Sync
SyncEngine.shared.queueForSync(item)
await SyncEngine.shared.forceSyncAll()

// Performance
PerformanceMonitor.shared.startOperation("task")
PerformanceMonitor.shared.endOperation("task")

// WebSocket
await WebSocketManager.shared.connect(token: token)
await WebSocketManager.shared.subscribeToVehicleUpdates(id)

// ViewModel
@StateObject var vm = OptimizedVehicleViewModel()
await vm.fetchVehicles()
vm.searchText = "query"
let stats = vm.getStatistics()
```

---

**For detailed documentation, see:**
- `CORE_PLATFORM_IMPLEMENTATION_REPORT.md` - Full implementation details
- Code comments in each file - Usage examples
- `ARCHITECTURE.md` - System architecture overview

**Questions?** Review the implementation files:
- `CoreDataManager.swift`
- `SyncEngine.swift`
- `WebSocketManager.swift`
- `PerformanceMonitoringFramework.swift`
- `OptimizedVehicleViewModel.swift`
