# Navigation Quick Start Guide

## Files Created

✅ **4 Core Navigation Files** (1,214 lines total)

1. **FleetManagementApp.swift** (96 lines)
   - Main @main app entry point
   - Environment setup
   - Appearance configuration
   - Deep link handler

2. **RootView.swift** (246 lines)
   - Authentication gate
   - Splash screen
   - Login screen with biometric support

3. **NavigationCoordinator.swift** (271 lines)
   - Tab management
   - Navigation stack management
   - Deep link routing
   - Theme management

4. **MainTabView.swift** (601 lines)
   - 5 tab navigation
   - All placeholder views
   - Navigation routing
   - Reusable components

## Quick Test Commands

### Build the Project
```bash
cd /home/user/Fleet/mobile-apps/ios-native
xcodebuild -workspace App.xcworkspace -scheme App -sdk iphonesimulator
```

### Test Deep Links
```bash
# From terminal when simulator is running:
xcrun simctl openurl booted "fleet://dashboard"
xcrun simctl openurl booted "fleet://vehicles/VEH-12345"
xcrun simctl openurl booted "fleet://trips/TRIP-67890"
xcrun simctl openurl booted "fleet://more/settings"
```

## Navigation Cheat Sheet

### Tab Structure
| Tab | Icon | System Image |
|-----|------|--------------|
| Dashboard | 📊 | chart.bar.fill |
| Vehicles | 🚗 | car.2.fill |
| Trips | 📍 | location.fill |
| Maintenance | 🔧 | wrench.and.screwdriver.fill |
| More | ⋯ | ellipsis.circle.fill |

### Programmatic Navigation Examples

```swift
// Switch to a tab
navigationCoordinator.selectTab(.vehicles)

// Navigate to detail view
navigationCoordinator.navigate(to: .vehicleDetail(id: "VEH-123"))

// Navigate back
navigationCoordinator.navigateBack()

// Pop to root
navigationCoordinator.popToRoot()

// Reset to home
navigationCoordinator.resetToHome()
```

### Deep Link Patterns

```
fleet://dashboard
fleet://vehicles
fleet://vehicles/{id}
fleet://trips
fleet://trips/{id}
fleet://maintenance
fleet://maintenance/{id}
fleet://more
fleet://more/settings
fleet://more/profile
```

## Environment Objects

All views have access to:

```swift
@EnvironmentObject var navigationCoordinator: NavigationCoordinator
@EnvironmentObject var authManager: AuthenticationManager
@EnvironmentObject var networkManager: AzureNetworkManager
```

## Key Features Implemented

### Authentication
- ✅ Login screen with email/password
- ✅ Biometric authentication (Face ID/Touch ID)
- ✅ Token-based authentication
- ✅ Automatic session restoration
- ✅ Secure keychain storage
- ✅ Logout functionality

### Navigation
- ✅ 5-tab TabView structure
- ✅ NavigationStack for each tab
- ✅ Deep linking support
- ✅ Programmatic navigation
- ✅ Back navigation
- ✅ Pop to root

### UI/UX
- ✅ Splash screen
- ✅ Loading states
- ✅ Error handling
- ✅ Dark mode support
- ✅ Empty state placeholders
- ✅ Connection status banner
- ✅ Smooth animations

### State Management
- ✅ Centralized navigation state
- ✅ Authentication state
- ✅ Network state
- ✅ Theme state
- ✅ Alert state

## Next Steps

### 1. Test the Navigation
- Build and run in Xcode
- Test tab switching
- Test deep links
- Test authentication flow
- Test dark mode toggle

### 2. Implement Features
Replace placeholder views with real implementations:

**Dashboard**
- Fetch real metrics from API
- Implement pull-to-refresh
- Add charts/graphs

**Vehicles**
- Load vehicle list from API
- Implement vehicle detail view
- Add vehicle form

**Trips**
- Load trip history
- Show trip map
- Trip detail view

**Maintenance**
- Load maintenance schedule
- Maintenance detail
- Schedule new maintenance

**More**
- Complete settings
- User profile editing
- Help content

### 3. Add ViewModels
Create ViewModels for each feature:
```swift
DashboardViewModel.swift
VehicleListViewModel.swift
VehicleDetailViewModel.swift
TripListViewModel.swift
TripDetailViewModel.swift
MaintenanceViewModel.swift
```

### 4. Connect to APIs
Use the existing API configuration:
- APIConfiguration.swift
- AzureNetworkManager
- AuthenticationService

### 5. Add Tests
Write tests for:
- NavigationCoordinator
- Deep link handling
- Authentication flow
- View models

## Common Tasks

### Add a New Tab
1. Add case to `TabItem` enum in NavigationCoordinator.swift
2. Add tab to TabView in MainTabView.swift
3. Create view for tab
4. Add icon and title

### Add a New Navigation Destination
1. Add case to `NavigationDestination` enum
2. Add case to `destinationView(for:)` in MainTabView
3. Create destination view
4. Navigate using: `navigationCoordinator.navigate(to: .yourDestination)`

### Add a Deep Link Route
1. Add route to `handleDeepLink(_:)` in NavigationCoordinator
2. Parse URL components
3. Select appropriate tab
4. Navigate to destination

### Show an Alert
```swift
navigationCoordinator.showError("Error Title", "Error message")
navigationCoordinator.showSuccess("Success", "Operation completed")
```

### Toggle Dark Mode
```swift
navigationCoordinator.toggleColorScheme()
// Or set directly:
navigationCoordinator.setColorScheme(.dark)
navigationCoordinator.setColorScheme(.light)
navigationCoordinator.setColorScheme(nil) // System default
```

## File Locations

All navigation files are in:
```
/home/user/Fleet/mobile-apps/ios-native/App/
├── FleetManagementApp.swift
├── RootView.swift
├── NavigationCoordinator.swift
├── MainTabView.swift
├── AuthenticationManager.swift (existing)
├── APIConfiguration.swift (existing)
└── AzureConfig.swift (existing)
```

## Documentation Files

- **NAVIGATION_STRUCTURE.md** - Complete documentation (500+ lines)
- **NAVIGATION_FLOW_DIAGRAM.md** - Visual flow diagrams
- **NAVIGATION_QUICK_START.md** - This file

## Support & Resources

### Reference Files
- FleetMobileApp.swift patterns: `/home/user/Fleet/mobile-apps/ios/FleetMobileApp.swift`
- API Configuration: `/home/user/Fleet/mobile-apps/ios-native/App/APIConfiguration.swift`
- Auth Manager: `/home/user/Fleet/mobile-apps/ios-native/App/AuthenticationManager.swift`

### SwiftUI Navigation Resources
- NavigationStack: iOS 16+ path-based navigation
- TabView: Tab-based navigation
- NavigationDestination: Type-safe routing
- Environment Objects: Dependency injection

## Architecture Summary

```
App Entry
    ↓
Authentication Gate
    ↓
Tab Navigation (5 tabs)
    ↓
Feature Screens
    ↓
Detail Views
```

**State Management**: Centralized in NavigationCoordinator
**Authentication**: AuthenticationManager.shared singleton
**Network**: AzureNetworkManager with APIConfiguration
**Security**: Keychain-based token storage

## Status

✅ **COMPLETE** - Navigation infrastructure ready
⏳ **PENDING** - Feature implementation
⏳ **PENDING** - Real data integration
⏳ **PENDING** - Testing

The navigation system is production-ready and awaiting feature implementation!
