To implement the described integration service for a fleet management system in Swift, we'll need to break down the requirements into manageable components and ensure that each part interacts correctly with others. This will involve using Combine for reactive programming, CoreData for local data persistence, and background tasks for syncing and updating data.

### 1. Model Definitions

First, let's define some basic models using CoreData for persistent storage:

```swift
import CoreData

@objc(Vehicle)
public class Vehicle: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var currentDriverId: UUID?
    @NSManaged public var inventory: [InventoryItem]
}

@objc(InventoryItem)
public class InventoryItem: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var quantity: Int16
    @NSManaged public var expirationDate: Date?
    @NSManaged public var isOSHACompliant: Bool
}

@objc(Driver)
public class Driver: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
}
```

### 2. Combine Publishers for State Management

We'll use Combine to manage and publish state changes across the app:

```swift
import Combine

class FleetManager: ObservableObject {
    @Published var currentVehicle: Vehicle?
    @Published var currentDriver: Driver?
    @Published var tripActive: Bool = false
    @Published var inventoryStatus: [InventoryItem: String] = [:]

    private var cancellables = Set<AnyCancellable>()

    init() {
        setupSubscriptions()
    }

    private func setupSubscriptions() {
        $tripActive
            .sink { [weak self] active in
                if active {
                    self?.startTrip()
                } else {
                    self?.endTrip()
                }
            }
            .store(in: &cancellables)
    }

    private func startTrip() {
        // Start trip logic
    }

    private func endTrip() {
        // End trip logic
    }
}
```

### 3. Background Sync and Data Flow

Implementing URLSession for background data transfer and handling offline queue:

```swift
import Foundation

class SyncManager {
    private var backgroundSession: URLSession!
    
    init() {
        let config = URLSessionConfiguration.background(withIdentifier: "com.yourapp.backgroundSync")
        backgroundSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }

    func syncData() {
        guard let url = URL(string: "https://api.yourserver.com/sync") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let task = backgroundSession.uploadTask(with: request, from: prepareDataForSync())
        task.resume()
    }

    private func prepareDataForSync() -> Data? {
        // Prepare and return data to be synced
        return nil
    }
}

extension SyncManager: URLSessionDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        // Handle completion
    }
}
```

### 4. Notifications

Implementing local and push notifications:

```swift
import UserNotifications

class NotificationManager {
    func scheduleLocalNotification(for item: InventoryItem) {
        let content = UNMutableNotificationContent()
        content.title = "Inventory Alert"
        content.body = "Low stock: \(item.name)"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            }
        }
    }
}
```

### Conclusion

This code provides a foundational structure for the fleet management system's integration service, focusing on the main components like state management, background sync, and notifications. Each part can be expanded with more detailed implementations and error handling as needed for a production environment.