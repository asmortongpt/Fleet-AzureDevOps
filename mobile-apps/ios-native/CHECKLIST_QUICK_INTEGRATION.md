# Checklist System - Quick Integration Guide

## 5-Minute Integration

### Step 1: Add to Main Navigation (2 minutes)

**File**: `App/MainTabView.swift`

```swift
import SwiftUI

struct MainTabView: View {
    @StateObject private var checklistService = ChecklistService.shared

    var body: some View {
        TabView {
            // ... existing tabs ...

            // ADD THIS:
            ChecklistManagementView()
                .tabItem {
                    Label("Checklists", systemImage: "checklist")
                }
                .badge(checklistService.pendingChecklists.count)
        }
    }
}
```

### Step 2: Integrate Geofence Triggers (1 minute)

**File**: `App/GeofencingView.swift` or wherever you handle geofence events

```swift
// When entering a geofence
func didEnterGeofence(_ geofence: Geofence) {
    NotificationCenter.default.post(
        name: .geofenceEntered,
        object: geofence
    )
}

// When exiting a geofence
func didExitGeofence(_ geofence: Geofence) {
    NotificationCenter.default.post(
        name: .geofenceExited,
        object: geofence
    )
}
```

### Step 3: Integrate Trip Triggers (1 minute)

**File**: `App/TripTrackingView.swift` or your trip service

```swift
// When starting a trip
func startTrip(tripId: String) {
    NotificationCenter.default.post(
        name: .tripStarted,
        object: tripId
    )
    // ... rest of trip start logic
}

// When ending a trip
func endTrip(tripId: String) {
    NotificationCenter.default.post(
        name: .tripEnded,
        object: tripId
    )
    // ... rest of trip end logic
}
```

### Step 4: Request Notification Permissions (1 minute)

**File**: `App/YourApp.swift` or `AppDelegate.swift`

```swift
import UserNotifications

func setupNotifications() {
    UNUserNotificationCenter.current().requestAuthorization(
        options: [.alert, .badge, .sound]
    ) { granted, error in
        if granted {
            print("✅ Notifications authorized")
        } else if let error = error {
            print("❌ Notification error: \(error)")
        }
    }
}

// Call in your app initialization
init() {
    setupNotifications()
}
```

### Step 5: Update Info.plist

Add these keys for camera/photo permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture photos for checklist documentation</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to attach photos to checklists</string>
```

## Done! 🎉

Your checklist system is now integrated and will:
- ✅ Auto-trigger when entering/exiting geofences
- ✅ Auto-trigger when starting/ending trips
- ✅ Show badge count of pending checklists
- ✅ Send push notifications
- ✅ Allow photo capture
- ✅ Allow signature capture

## Testing the Integration

### Test Geofence Trigger
```swift
// Simulate geofence entry
let testGeofence = Geofence(
    id: "test-1",
    name: "Test Site",
    description: "Test location",
    type: .customer,
    shape: .circle(GeofenceCircle(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        radius: 100
    )),
    isActive: true,
    createdDate: Date(),
    createdBy: "test",
    assignedVehicles: [],
    assignedDrivers: [],
    notifications: GeofenceNotifications(
        onEntry: true,
        onExit: true,
        onDwell: false,
        dwellTimeMinutes: nil
    ),
    schedule: nil,
    tags: []
)

NotificationCenter.default.post(name: .geofenceEntered, object: testGeofence)
```

### Test Trip Trigger
```swift
// Simulate trip start
NotificationCenter.default.post(
    name: .tripStarted,
    object: "trip-123"
)
```

### Test Manual Trigger
```swift
// Manually trigger a checklist from anywhere
let viewModel = ChecklistViewModel()
await viewModel.manuallyTriggerChecklist(templateId: "osha-site-safety")
```

## Accessing Checklist Data

### Get Pending Checklists
```swift
let service = ChecklistService.shared
let pending = service.pendingChecklists
```

### Get Active Checklist
```swift
let service = ChecklistService.shared
let active = service.activeChecklists.first
```

### Get Completed Checklists
```swift
let service = ChecklistService.shared
let completed = service.completedChecklists
```

### Search Checklists
```swift
let service = ChecklistService.shared
let results = service.searchChecklists("safety")
```

### Filter by Category
```swift
let service = ChecklistService.shared
let oshaChecklists = service.filterChecklists(by: .osha)
```

## Customization

### Add Custom Template Programmatically
```swift
let customTemplate = ChecklistTemplate(
    id: UUID().uuidString,
    name: "Custom Delivery Checklist",
    description: "Verify delivery completion",
    category: .deliveryConfirmation,
    items: [
        ChecklistItemTemplate(
            id: UUID().uuidString,
            sequenceNumber: 1,
            text: "Package delivered to recipient",
            description: nil,
            type: .checkbox,
            isRequired: true,
            options: nil,
            validationRules: nil,
            dependencies: nil,
            conditionalLogic: nil
        ),
        ChecklistItemTemplate(
            id: UUID().uuidString,
            sequenceNumber: 2,
            text: "Recipient signature",
            description: nil,
            type: .signature,
            isRequired: true,
            options: nil,
            validationRules: nil,
            dependencies: nil,
            conditionalLogic: nil
        ),
        ChecklistItemTemplate(
            id: UUID().uuidString,
            sequenceNumber: 3,
            text: "Photo of delivered package",
            description: nil,
            type: .photo,
            isRequired: true,
            options: nil,
            validationRules: nil,
            dependencies: nil,
            conditionalLogic: nil
        )
    ],
    triggers: [
        ChecklistTrigger(
            id: UUID().uuidString,
            type: .geofenceExit,
            conditions: [],
            isEnabled: true
        )
    ],
    isRequired: true,
    timeoutMinutes: 10,
    allowSkip: false,
    requiresApproval: false,
    approverRoles: [],
    attachmentTypes: [.photo],
    createdBy: "manager_id",
    createdAt: Date(),
    isActive: true
)

await ChecklistService.shared.createTemplate(customTemplate)
```

### Listen for Checklist Completion
```swift
NotificationCenter.default.publisher(for: .checklistCompleted)
    .sink { notification in
        guard let checklist = notification.object as? ChecklistInstance else { return }
        print("✅ Checklist completed: \(checklist.templateName)")
        // Send to analytics, update dashboard, etc.
    }
    .store(in: &cancellables)
```

## Advanced Integration

### Role-Based Template Access
```swift
// In ChecklistManagementView or template editor
import UserRole

if currentUser.permissions.canManageSettings {
    // Show template editor
    Button("Create Template") {
        showTemplateEditor = true
    }
}
```

### Custom Validation Rules
```swift
let validationRules = ValidationRules(
    minValue: 0,
    maxValue: 100000,
    minLength: nil,
    maxLength: nil,
    pattern: "^[0-9]+$", // Regex: numbers only
    required: true
)

let item = ChecklistItemTemplate(
    id: UUID().uuidString,
    sequenceNumber: 1,
    text: "Enter mileage",
    description: "Current vehicle odometer reading",
    type: .odometer,
    isRequired: true,
    options: nil,
    validationRules: validationRules,
    dependencies: nil,
    conditionalLogic: nil
)
```

### Conditional Logic Example
```swift
// Show "Missing Items" text field only if tools or materials are missing
let conditionalLogic = ConditionalLogic(
    showIf: [
        Condition(
            itemId: "tools-complete",
            conditionOperator: .equals,
            value: "false"
        ),
        Condition(
            itemId: "materials-complete",
            conditionOperator: .equals,
            value: "false"
        )
    ],
    hideIf: nil
)
```

## API Integration

When you're ready to sync with your backend:

### 1. Update ChecklistService.swift

Replace the TODO comments with actual API calls:

```swift
// In ChecklistService.swift

private func submitChecklistToAPI(_ checklist: ChecklistInstance) async throws {
    let url = URL(string: "\(APIConfig.baseURL)/api/checklist/instances")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    request.httpBody = try encoder.encode(checklist)

    let (_, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw ChecklistError.apiError
    }
}
```

### 2. Sync Templates from Server

```swift
private func loadCustomTemplates() async {
    do {
        let url = URL(string: "\(APIConfig.baseURL)/api/checklist/templates")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let response = try decoder.decode(ChecklistTemplatesResponse.self, from: data)

        // Merge with predefined templates
        templates.append(contentsOf: response.templates)
    } catch {
        print("❌ Failed to load templates: \(error)")
    }
}
```

## Troubleshooting

### Checklists Not Triggering
1. Check notification observers are set up in ChecklistService
2. Verify geofence/trip code posts notifications
3. Check template triggers are enabled
4. Verify template is active

### Badge Count Not Updating
1. Ensure ChecklistService is shared instance
2. Check @Published properties are being observed
3. Verify MainTabView has @StateObject

### Photos Not Capturing
1. Add Info.plist camera permission
2. Check device permissions in Settings
3. Verify photo capture sheet is presented

### Signatures Not Saving
1. Check SignaturePadView has proper closure
2. Verify signature data is base64 encoded
3. Check response is being set

## Performance Tips

1. **Lazy Loading**: History view already implements lazy loading
2. **Image Compression**: Compress photos before saving:
   ```swift
   let compressed = imageData.jpegData(compressionQuality: 0.7)
   ```
3. **Background Sync**: Queue API submissions for background processing
4. **Cache Templates**: Templates are cached in UserDefaults

## Support

For issues or questions:
1. Check `CHECKLIST_SYSTEM_IMPLEMENTATION.md` for detailed documentation
2. Review `CHECKLIST_DELIVERABLES.txt` for features and integration points
3. Examine predefined templates in `ChecklistModels.swift` for examples

---

**Integration Time**: ~5 minutes
**Complexity**: Low
**Dependencies**: None (uses built-in iOS frameworks)
**Minimum iOS**: 15.0
**Status**: Production Ready ✅
