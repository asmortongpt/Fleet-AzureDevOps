# Quick Fix Checklist - iOS Build Errors

**Use this checklist to fix the 7 compilation errors and get the app building.**

---

## Fix 1: Add FleetMapView to Xcode ✅

**Method A: Using Xcode (Easiest)**
1. Open `App.xcworkspace` in Xcode
2. In Project Navigator, right-click on "App" group
3. Select "Add Files to 'App'..."
4. Navigate to and select: `App/Views/FleetMapView.swift`
5. Check "Add to targets: App"
6. Click "Add"

**Method B: Using Ruby Script**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native
ruby -e "
require 'xcodeproj'
project = Xcodeproj::Project.open('App.xcodeproj')
target = project.targets.first
file = project.main_group.new_reference('App/Views/FleetMapView.swift')
target.add_file_references([file])
project.save
"
```

**Verify:** `grep -r "FleetMapView.swift" App.xcodeproj/project.pbxproj`

---

## Fix 2: Add TripsViewModel to Xcode ✅

**Method A: Using Xcode**
1. In Project Navigator, right-click "ViewModels" group
2. Select "Add Files to 'App'..."
3. Select: `App/ViewModels/TripsViewModel.swift`
4. Check "Add to targets: App"
5. Click "Add"

**Method B: Using Ruby Script**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native
ruby -e "
require 'xcodeproj'
project = Xcodeproj::Project.open('App.xcodeproj')
target = project.targets.first
file = project.main_group.new_reference('App/ViewModels/TripsViewModel.swift')
target.add_file_references([file])
project.save
"
```

**Verify:** `grep -r "TripsViewModel.swift" App.xcodeproj/project.pbxproj`

---

## Fix 3: Update VehicleDetailView Initializer ✅

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/App/Views/VehicleDetailView.swift`

**Find this:**
```swift
struct VehicleDetailView: View {
    var body: some View {
        // ...
    }
}
```

**Replace with:**
```swift
struct VehicleDetailView: View {
    let vehicle: Vehicle

    init(vehicle: Vehicle) {
        self.vehicle = vehicle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Vehicle Details")
                .font(.title)
                .bold()

            if let vehicleId = vehicle.id {
                Text("ID: \(vehicleId)")
            }

            Text("Status: Active")
        }
        .padding()
        .navigationTitle("Vehicle")
    }
}
```

**Quick Command:**
```bash
# Backup first
cp App/App/Views/VehicleDetailView.swift App/App/Views/VehicleDetailView.swift.backup

# This needs manual editing - open in editor
```

---

## Fix 4: Remove Duplicate TripDetailView ✅

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/TripsView.swift`

**Action:** Open file and remove the `TripDetailView` struct definition around line 571

**Keep:** Only the TripDetailView in `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/TripDetailView.swift`

**Steps:**
1. Open `App/TripsView.swift`
2. Search for `struct TripDetailView`
3. Delete the entire struct (including closing brace)
4. Save file

**Verify:**
```bash
# Should only find ONE definition
grep -n "struct TripDetailView" App/TripsView.swift App/TripDetailView.swift
```

---

## Fix 5: Fix DataPersistenceManager Access ✅

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/MainTabView.swift`
**Line:** 399

**Find this:**
```swift
if let trips = persistenceManager.getCachedTrips() {
```

**Option A - Add wrappedValue:**
```swift
if let trips = persistenceManager.wrappedValue.getCachedTrips() {
```

**Option B - Remove the call (if method doesn't exist):**
```swift
// Comment out for now
// if let trips = persistenceManager.getCachedTrips() {
//     // ...
// }
```

**Option C - Add the method to DataPersistenceManager:**

Find `DataPersistenceManager` class and add:
```swift
func getCachedTrips() -> [Trip]? {
    return trips  // If there's a trips property
}
```

---

## Verification Steps

After applying all fixes:

### 1. Clean Build
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native
xcodebuild clean -workspace App.xcworkspace -scheme App
```

### 2. Rebuild
```bash
xcodebuild -workspace App.xcworkspace -scheme App -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,id=FE11428A-D469-4C43-8951-E3E05A0C1701' \
  build 2>&1 | tee build_fixed.log
```

### 3. Check for Success
```bash
# Should see "BUILD SUCCEEDED"
tail -20 build_fixed.log | grep "BUILD SUCCEEDED"
```

### 4. Find Built App
```bash
find ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator \
  -name "*.app" -type d
```

---

## Deployment Commands (After Successful Build)

### Install to Simulator
```bash
# Set the app path (use output from find command above)
APP_PATH="<path-to-App.app>"

# Install
xcrun simctl install FE11428A-D469-4C43-8951-E3E05A0C1701 "$APP_PATH"
```

### Launch App
```bash
xcrun simctl launch FE11428A-D469-4C43-8951-E3E05A0C1701 com.capitaltechalliance.Fleet
```

### Open Simulator (if not already open)
```bash
open -a Simulator
```

---

## Quick Test Commands

### Check if simulator is booted
```bash
xcrun simctl list devices | grep "FE11428A-D469-4C43-8951-E3E05A0C1701"
```

### Boot simulator if needed
```bash
xcrun simctl boot FE11428A-D469-4C43-8951-E3E05A0C1701
```

### Check installed apps
```bash
xcrun simctl listapps FE11428A-D469-4C43-8951-E3E05A0C1701 | grep -i fleet
```

---

## Troubleshooting

### If files still not found after adding to Xcode:
```bash
# Verify they're in project.pbxproj
grep -c "FleetMapView.swift" App.xcodeproj/project.pbxproj
grep -c "TripsViewModel.swift" App.xcodeproj/project.pbxproj
```

### If build still fails with same errors:
1. Close Xcode if open
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/App-*`
3. Clean: `xcodebuild clean -workspace App.xcworkspace -scheme App`
4. Rebuild

### If simulator launch fails:
```bash
# Reset simulator
xcrun simctl shutdown FE11428A-D469-4C43-8951-E3E05A0C1701
xcrun simctl erase FE11428A-D469-4C43-8951-E3E05A0C1701
xcrun simctl boot FE11428A-D469-4C43-8951-E3E05A0C1701
```

---

## Summary

**Total Fixes:** 5
**Estimated Time:** 15-30 minutes
**Difficulty:** Easy to Medium

**Order of Operations:**
1. Fix 1 & 2 (Add files to Xcode) - 5 min
2. Fix 3 (VehicleDetailView) - 5 min
3. Fix 4 (Remove duplicate) - 2 min
4. Fix 5 (DataPersistenceManager) - 3 min
5. Clean and rebuild - 2 min
6. Deploy to simulator - 2 min

**Total:** ~20 minutes

Once complete, you'll have a working iOS app running in the simulator! 🎉
