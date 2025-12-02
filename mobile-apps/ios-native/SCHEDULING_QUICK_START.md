# Scheduling System - Quick Start Guide

## Immediate Integration (5 minutes)

### Step 1: Add to MainTabView
Open `/App/MainTabView.swift` and add:

```swift
import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "speedometer")
                }

            FleetMapView()
                .tabItem {
                    Label("Map", systemImage: "map")
                }

            // ADD THIS:
            ScheduleView()
                .tabItem {
                    Label("Schedule", systemImage: "calendar")
                }

            // ... other tabs
        }
    }
}
```

### Step 2: Add Calendar Permission
Open `Info.plist` and add:

```xml
<key>NSCalendarsUsageDescription</key>
<string>Fleet Management needs calendar access to sync your schedules and send reminders</string>
```

### Step 3: Build and Run
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native
open App.xcworkspace
# Press Cmd+R to build and run
```

That's it! The scheduling system is now accessible.

---

## File Locations

```
App/
├── Models/
│   └── Schedule/
│       └── ScheduleModels.swift           (624 lines)
│
├── Services/
│   ├── ScheduleService.swift              (567 lines)
│   └── CalendarSyncService.swift          (463 lines)
│
├── ViewModels/
│   └── ScheduleViewModel.swift            (467 lines)
│
└── Views/
    └── Schedule/
        ├── ScheduleView.swift             (269 lines)
        ├── DayScheduleView.swift          (98 lines)
        ├── WeekScheduleView.swift         (100 lines)
        ├── MonthScheduleView.swift        (187 lines)
        ├── AgendaScheduleView.swift       (126 lines)
        ├── AddScheduleView.swift          (355 lines)
        ├── ScheduleDetailView.swift       (486 lines)
        ├── ScheduleCard.swift             (210 lines)
        └── ScheduleFilterView.swift       (188 lines)
```

---

## Common Tasks

### Create a New Schedule Programmatically

```swift
import Foundation

let schedule = ScheduleEntry(
    id: UUID().uuidString,
    type: .shift,
    title: "Morning Delivery Route",
    description: "Downtown area deliveries",
    startDate: Date(),
    endDate: Date().addingTimeInterval(8 * 3600), // 8 hours
    status: .scheduled,
    priority: .normal,
    participants: [
        Participant(
            id: UUID().uuidString,
            name: "John Driver",
            role: .driver,
            status: .accepted,
            userId: "driver-001"
        )
    ],
    location: ScheduleLocation(
        name: "Main Depot",
        address: "123 Fleet St",
        coordinates: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060)
    ),
    recurrence: nil,
    reminders: [
        Reminder(
            id: UUID().uuidString,
            type: .notification,
            minutesBefore: 30,
            sent: false
        )
    ],
    attachments: [],
    metadata: ["vehicleId": "vehicle-101"],
    createdBy: "current_user",
    createdAt: Date(),
    updatedAt: Date()
)

// Save it
Task {
    await ScheduleService.shared.createSchedule(schedule)
}
```

### Add Recurring Schedule

```swift
let recurrence = RecurrenceRule(
    frequency: .weekly,
    interval: 1,
    endDate: nil,
    count: nil,
    daysOfWeek: [.monday, .tuesday, .wednesday, .thursday, .friday],
    daysOfMonth: nil
)

var schedule = createMySchedule()
schedule.recurrence = recurrence

Task {
    await ScheduleService.shared.createSchedule(schedule)
}
```

### Check for Conflicts

```swift
let conflicts = await ScheduleService.shared.detectConflicts(entry: schedule)

if !conflicts.isEmpty {
    for conflict in conflicts {
        print("Conflict: \(conflict.description)")
        print("Severity: \(conflict.severity)")
        print("Affected entries: \(conflict.conflictingEntries.count)")
    }
}
```

### Enable Calendar Sync

```swift
Task {
    do {
        try await CalendarSyncService.shared.enableSync()
        print("Calendar sync enabled")

        // Export all schedules
        let schedules = ScheduleService.shared.schedules
        try await CalendarSyncService.shared.exportSchedules(schedules)
        print("Schedules exported to iOS Calendar")
    } catch {
        print("Error: \(error.localizedDescription)")
    }
}
```

### Filter Schedules

```swift
var filter = ScheduleFilter()
filter.types = [.shift, .trip]
filter.statuses = [.scheduled, .inProgress]
filter.priorities = [.high, .urgent]
filter.dateRange = DateRange(
    start: Date(),
    end: Calendar.current.date(byAdding: .day, value: 7, to: Date())!
)

let viewModel = ScheduleViewModel()
viewModel.filter = filter
await viewModel.loadSchedules()
```

### Get Driver Schedule

```swift
let driverSchedule = try await ScheduleService.shared.getDriverSchedule(
    driverId: "driver-001",
    date: Date()
)

print("Total hours: \(driverSchedule.totalHours / 3600)")
print("Overtime: \(driverSchedule.overtimeHours / 3600)")
print("Shifts: \(driverSchedule.shifts.count)")
print("Availability: \(driverSchedule.availability)")
```

### Schedule Maintenance

```swift
let maintenanceWindow = MaintenanceWindow(
    id: UUID().uuidString,
    type: .routine,
    scheduledDate: Date().addingTimeInterval(86400), // Tomorrow
    estimatedDuration: 3600, // 1 hour
    vendor: "ABC Auto Service",
    cost: 150.00,
    notes: "Regular oil change and inspection",
    status: .scheduled
)

try await ScheduleService.shared.scheduleMaintenance(
    vehicleId: "vehicle-101",
    vehicleNumber: "FL-101",
    window: maintenanceWindow
)
```

---

## View Mode Navigation

The schedule view supports 4 modes:

1. **Day View** - Shows 24-hour timeline with schedules in hourly slots
2. **Week View** - Shows 7 days with schedule counts per day
3. **Month View** - Calendar grid with event indicators
4. **Agenda View** - Chronological list of upcoming events

Switch between modes using the segmented picker at the top.

---

## Sample Data

The app loads sample data on first run. You'll see:
- A morning shift scheduled for tomorrow
- A maintenance appointment

You can:
- Tap schedules to view details
- Tap + to add new schedules
- Use filter button to narrow results
- Navigate dates with < > buttons
- Tap "Today" to jump to current date

---

## Customization

### Change Schedule Types
Edit `ScheduleType` enum in `ScheduleModels.swift`:

```swift
enum ScheduleType: String, Codable, CaseIterable {
    case shift = "Shift"
    case trip = "Trip"
    // Add your custom type:
    case custom = "Custom Type"

    var icon: String {
        switch self {
        case .custom: return "star.fill"
        // ...
        }
    }
}
```

### Add Custom Colors
Update the `colorName` property:

```swift
var colorName: String {
    switch self {
    case .custom: return "purple"
    // ...
    }
}
```

### Modify Recurrence Options
Edit `RecurrenceFrequency` in `ScheduleModels.swift`:

```swift
enum RecurrenceFrequency: String, Codable {
    case daily = "Daily"
    case weekly = "Weekly"
    case monthly = "Monthly"
    case yearly = "Yearly"
    // Add: case biweekly = "Bi-weekly"
}
```

---

## Troubleshooting

### Issue: Calendar permission denied
**Solution:** Go to Settings > Privacy & Security > Calendars and enable for Fleet Management

### Issue: Schedules not persisting
**Solution:** Check that ScheduleService is initialized as a singleton and saveSchedulesToCache() is called

### Issue: Conflicts not detected
**Solution:** Ensure schedules have participants with userId set for driver conflicts, or vehicleId in metadata for vehicle conflicts

### Issue: Date navigation not working
**Solution:** Verify that selectedDate is properly observed in the view and loadSchedules() is called onChange

---

## Performance Tips

1. **Use date ranges** - Don't load all schedules at once:
   ```swift
   await service.fetchSchedulesInRange(start: startDate, end: endDate)
   ```

2. **Cache formatted strings** - Don't format dates repeatedly:
   ```swift
   private var formattedTime: String {
       // Cache this if displaying many schedules
   }
   ```

3. **Lazy loading** - Views already use `LazyVStack` for performance

4. **Batch operations** - When syncing to calendar, use bulk export:
   ```swift
   try await CalendarSyncService.shared.exportSchedules(allSchedules)
   ```

---

## API Integration

When ready to connect to backend, update `ScheduleService.swift`:

```swift
func fetchSchedules(for date: Date, filter: ScheduleFilter?) async throws -> [ScheduleEntry] {
    // Replace this:
    // return cached schedules

    // With API call:
    let response = try await apiClient.get("/schedules", params: [
        "date": dateFormatter.string(from: date),
        "type": filter?.types.map { $0.rawValue }
    ])

    return try JSONDecoder().decode([ScheduleEntry].self, from: response)
}
```

Similarly update create, update, and delete methods.

---

## What's Included

✅ Complete data models (624 lines)
✅ Schedule service with CRUD (567 lines)
✅ Calendar sync service (463 lines)
✅ ViewModel with state management (467 lines)
✅ 8 view files (2,019 lines total)
✅ Conflict detection
✅ Offline support
✅ iOS Calendar integration
✅ Advanced filtering
✅ Statistics tracking
✅ Sample data

**Total: 4,140 lines of production-ready code**

---

## Support

For detailed implementation guide, see:
- `SCHEDULING_SYSTEM_IMPLEMENTATION.md` - Complete documentation
- `SCHEDULING_IMPLEMENTATION_SUMMARY.txt` - Quick reference

For issues or questions, refer to the inline code documentation.

---

**You're all set!** The scheduling system is ready to use. Just add it to your MainTabView and start scheduling. 🎉
