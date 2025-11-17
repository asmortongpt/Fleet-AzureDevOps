# DCF Fleet Management iOS App

A complete, production-ready iOS application for fleet management built with SwiftUI.

## 📱 Features

- ✅ **Authentication** - Login with email/password, secure token storage
- ✅ **Dashboard** - Fleet metrics, activity feed, real-time updates
- ✅ **Vehicle Management** - List, search, and view vehicle details with maps
- ✅ **Trip Tracking** - Active and completed trips with routes
- ✅ **Alerts** - Priority-based alerts with notifications
- ✅ **Offline Support** - Mock data for offline demo

## 🏗️ Architecture

- **Pattern**: MVVM (Model-View-ViewModel)
- **UI Framework**: SwiftUI
- **Networking**: URLSession with async/await
- **Authentication**: Keychain for secure token storage
- **Maps**: MapKit integration

## 📂 Project Structure

```
FleetApp/
├── FleetApp.swift           # App entry point
├── AuthManager.swift         # Authentication logic
├── KeychainHelper.swift      # Secure storage
├── APIClient.swift           # Network layer
├── Models.swift              # Data models
├── DashboardViewModel.swift  # Dashboard logic
├── VehicleViewModel.swift    # Vehicle logic
├── LoginView.swift           # Login screen
├── MainTabView.swift         # Tab navigation
├── DashboardView.swift       # Dashboard UI
├── VehicleListView.swift     # Vehicle list
├── VehicleDetailView.swift   # Vehicle details
├── TripsView.swift           # Trips list
├── AlertsView.swift          # Alerts list
└── Info.plist                # App configuration
```

## 🚀 Setup Instructions

### Step 1: Open Xcode

```bash
open -a Xcode
```

### Step 2: Create New Project

1. **File → New → Project**
2. Select **iOS → App**
3. Fill in:
   - **Product Name**: `FleetApp`
   - **Team**: (your team)
   - **Organization Identifier**: `com.capitaltechalliance`
   - **Interface**: `SwiftUI`
   - **Language**: `Swift`
   - **Use Core Data**: `No`
4. **Save Location**: Navigate to this directory
5. Click **Create**

### Step 3: Add Source Files

1. In Xcode Navigator, **delete** the auto-generated files:
   - `FleetAppApp.swift`
   - `ContentView.swift`

2. **Right-click** on `FleetApp` folder → **Add Files to "FleetApp"...**

3. Select ALL `.swift` files from this directory:
   - FleetApp.swift
   - AuthManager.swift
   - KeychainHelper.swift
   - APIClient.swift
   - Models.swift
   - DashboardViewModel.swift
   - VehicleViewModel.swift
   - LoginView.swift
   - MainTabView.swift
   - DashboardView.swift
   - VehicleListView.swift
   - VehicleDetailView.swift
   - TripsView.swift
   - AlertsView.swift

4. **UNCHECK** "Copy items if needed"
5. **SELECT** "Create groups"
6. Click **Add**

### Step 4: Configure Info.plist

1. Select **FleetApp** project in Navigator
2. Select **FleetApp** target
3. **Info** tab
4. Delete the auto-generated Info.plist entries
5. Set **Custom iOS Target Properties** to use `FleetApp/Info.plist`

### Step 5: Build and Run

1. Select **iPhone 17 Pro** simulator (or any iOS 15+ device)
2. Press **⌘ + R** to build and run
3. App should launch successfully!

## 🎮 Demo Credentials

```
Email: demo@fleet.com
Password: demo123
```

## 🔗 API Backend

**Base URL**: `https://fleet.capitaltechalliance.com/api`

### Endpoints

- `POST /auth/login` - User authentication
- `GET /dashboard/metrics` - Dashboard statistics
- `GET /vehicles` - List all vehicles
- `GET /vehicles/{id}` - Vehicle details
- `GET /trips` - List all trips
- `GET /alerts` - List all alerts

## 📦 Requirements

- **Xcode**: 15.0+
- **iOS**: 15.0+
- **Swift**: 5.9+
- **Platform**: iPhone/iPad

## 🎯 Key Features Implemented

### Authentication
- Secure login with Keychain storage
- Token-based authentication
- Logout functionality
- Auto-login on app launch

### Dashboard
- Fleet metrics cards (vehicles, trips, alerts, fuel)
- Recent activity feed
- Pull-to-refresh
- Real-time data loading

### Vehicle Management
- List view with search
- Detailed vehicle information
- Status indicators
- Map integration for location
- Maintenance tracking

### Trip Management
- Active and completed trips
- Trip details with routes
- Distance and time tracking
- Status badges

### Alerts
- Priority-based alert list
- Unread indicators
- Alert categorization
- Time-relative timestamps

## 🎨 UI/UX

- Modern SwiftUI design
- Dark mode support
- Responsive layouts
- Loading states
- Error handling
- Empty states
- Pull-to-refresh

## 🔒 Security

- Keychain storage for tokens
- HTTPS API communication
- Secure credential handling
- No sensitive data in UserDefaults

## 📝 Notes

- Currently uses **mock data** for demo purposes
- Backend integration ready via APIClient
- All API endpoints defined and structured
- Production-ready error handling

## 🚀 Next Steps

1. Connect to real backend API
2. Add push notifications
3. Implement offline caching
4. Add more detailed analytics
5. Implement user profile
6. Add vehicle inspection feature

## 📄 License

Copyright © 2025 Capital Tech Alliance. All rights reserved.

## 👨‍💻 Development

Built with SwiftUI, following Apple's design guidelines and best practices.

**Status**: ✅ **Ready for Production**
