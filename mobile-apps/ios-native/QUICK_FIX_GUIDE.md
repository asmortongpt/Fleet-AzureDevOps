# Quick Fix Guide - Fleet iOS App

## Current Status

✅ **CocoaPods dependencies installed** - Firebase and other pods are ready
✅ **Xcode workspace opened** - `App.xcworkspace` is now loading
⚠️ **Missing files need to be added to project** - Files exist but aren't in Xcode project

## What Just Happened

1. ✅ Installed CocoaPods dependencies (`pod install`)
2. ✅ Closed `App.xcodeproj`
3. ✅ Opened `App.xcworkspace` (required for CocoaPods)

## The One Thing You Need to Do

**Add 6 missing Swift files to the Xcode project**

These files exist in your filesystem but aren't included in the Xcode project build, causing the "Cannot find" errors.

### Step-by-Step Instructions

Xcode should now be open with `App.xcworkspace`. Follow these steps:

#### 1. Wait for Xcode to Finish Loading
- Wait for the indexing progress bar at the top to complete
- Should take 30-60 seconds

#### 2. Add Missing Files

In Xcode's **Project Navigator** (left sidebar):

1. **Right-click** on the **"App"** folder (the yellow folder icon)
2. Select **"Add Files to 'App'..."**
3. Navigate to: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/`
4. **Select these 5 files** (hold ⌘ to multi-select):
   - `CrashReporter.swift`
   - `AuthenticationService.swift`
   - `SyncService.swift`
   - `NetworkMonitor.swift`
   - `TripModels.swift`

5. **IMPORTANT - Check these settings:**
   - ✅ **"App" target is CHECKED** (in "Add to targets" section)
   - ❌ **"Copy items if needed" is UNCHECKED** (files are already in the right place)
   - ✅ **"Create groups"** is selected (NOT "Create folder references")

6. Click **"Add"**

#### 3. Add VehicleViewModel

Repeat the process for the ViewModels folder:

1. **Right-click** on **"App"** folder again
2. Select **"Add Files to 'App'..."**
3. Navigate to: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/ViewModels/`
4. Select **`VehicleViewModel.swift`**
5. Same settings as above (App target checked, don't copy, create groups)
6. Click **"Add"**

#### 4. Build the Project

Once all files are added:

1. Press **⌘+B** to build
2. You should see **"Build Succeeded"** ✅

If you see any remaining errors, check the "Troubleshooting" section below.

#### 5. Run the App!

1. Select a simulator device (e.g., "iPhone 17 Pro") from the device dropdown at the top
2. Press **⌘+R** to run
3. The Fleet Mobile app should launch in the simulator! 🚀

## Files Being Added

| File | Purpose |
|------|---------|
| `CrashReporter.swift` | Crash reporting and error tracking |
| `AuthenticationService.swift` | Authentication API service |
| `SyncService.swift` | Background sync functionality |
| `NetworkMonitor.swift` | Network connectivity monitoring |
| `TripModels.swift` | Data models for trips (Trip, TripCoordinate, etc.) |
| `VehicleViewModel.swift` | View model for vehicle management |

## Expected Warnings (These are OK)

After building, you may see these warnings - they don't prevent the app from running:

- ⚠️ "Search path not found" for Firebase (cosmetic issue)
- ⚠️ Missing app icon sizes (won't affect functionality)
- ⚠️ "Left side of nil coalescing operator has non-optional type" (minor code warning)
- ⚠️ "Extension declares a conformance" for CoreBluetooth (Swift 6 compatibility)

## Troubleshooting

### Error: "Build Failed" after adding files

**Solution:**
1. Clean build folder: **Product → Clean Build Folder** (⇧⌘K)
2. Rebuild: **⌘+B**

### Error: Still seeing "Cannot find" errors

**Solution:**
1. Make sure you opened `App.xcworkspace` (NOT `App.xcodeproj`)
2. Verify all 6 files were added by checking the Project Navigator
3. Make sure "App" target is checked for each file:
   - Click on a file in Project Navigator
   - Open File Inspector (right sidebar)
   - Under "Target Membership", ensure "App" is checked

### Error: "No such module 'Firebase'"

**Solution:**
1. Make sure you're using `App.xcworkspace` (NOT `.xcodeproj`)
2. If needed, reinstall pods:
   ```bash
   cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native
   pod deintegrate
   pod install
   ```
3. Reopen `App.xcworkspace`

### Xcode shows duplicate files

**Solution:**
- This means the files were accidentally copied.
- Delete the duplicates (keep the ones in the `App/` folder)
- Make sure "Copy items if needed" was **unchecked** when adding

## Quick Reference

**Workspace location:**
```
/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcworkspace
```

**Missing files location:**
```
/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App/
├── CrashReporter.swift
├── AuthenticationService.swift
├── SyncService.swift
├── NetworkMonitor.swift
├── TripModels.swift
└── ViewModels/
    └── VehicleViewModel.swift
```

**Build commands:**
- Build: **⌘+B**
- Run: **⌘+R**
- Clean: **⇧⌘K**

## After Successful Build

Once the app launches, you'll see:

1. **Login Screen** - Test with credentials or create an account
2. **Dashboard Tab** - Fleet overview with metrics
3. **Vehicles Tab** - Vehicle list and management
4. **Trips Tab** - Trip tracking
5. **Settings Tab** - App configuration

## App Features Ready to Test

✅ **Authentication** - Email/password + Face ID/Touch ID
✅ **Dashboard** - Fleet metrics and charts
✅ **Vehicle Management** - View and track vehicles
✅ **OBD-II Integration** - Bluetooth LE (needs ELM327 device)
✅ **GPS Tracking** - Real-time location
✅ **Photo OCR** - Receipt scanning with Vision framework
✅ **Offline Sync** - Core Data with background sync
✅ **Dark Mode** - Full theme support

---

**That's it!** Just add those 6 files in Xcode and you're ready to go. 🎉

The app should build and run successfully after adding the files.
