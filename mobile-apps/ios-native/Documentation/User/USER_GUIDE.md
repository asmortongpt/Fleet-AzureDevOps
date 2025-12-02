# Fleet Management iOS App - Complete User Guide

**Version 1.0**
**Last Updated: November 2024**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Account Setup and Login](#account-setup-and-login)
4. [Dashboard Overview and Navigation](#dashboard-overview-and-navigation)
5. [Vehicle Management](#vehicle-management)
6. [Trip Tracking](#trip-tracking)
7. [OBD2 Setup and Diagnostics](#obd2-setup-and-diagnostics)
8. [Vehicle Inspections](#vehicle-inspections)
9. [Maintenance Scheduling and Tracking](#maintenance-scheduling-and-tracking)
10. [Offline Mode Usage](#offline-mode-usage)
11. [Settings and Preferences](#settings-and-preferences)
12. [Troubleshooting Common Issues](#troubleshooting-common-issues)
13. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)

---

## Introduction

Welcome to the Fleet Management iOS app! This comprehensive mobile application helps you manage your fleet operations efficiently, whether you're tracking a single vehicle or managing hundreds. Our app provides real-time vehicle monitoring, trip tracking, maintenance scheduling, OBD2 diagnostics, and comprehensive inspection workflows.

### Key Features

- **Real-time Dashboard**: Monitor your entire fleet at a glance with live metrics and charts
- **Vehicle Management**: Add, edit, and track vehicles with detailed information
- **Trip Tracking**: Automatically track trips with GPS, record mileage, and analyze driving patterns
- **OBD2 Integration**: Connect to vehicle diagnostics via Bluetooth for real-time engine data
- **Vehicle Inspections**: Conduct thorough pre-trip and post-trip inspections with photo documentation
- **Maintenance Tracking**: Schedule and track preventive and corrective maintenance
- **Offline Support**: Work seamlessly even without internet connectivity
- **Advanced Security**: FIPS-compliant encryption and NIST-certified security standards

### System Requirements

- iOS 15.0 or later
- iPhone 8 or newer (iPad compatible)
- 100 MB free storage space
- Bluetooth 4.0 or later (for OBD2 features)
- GPS enabled (for trip tracking)
- Internet connection (required for initial setup, optional for daily use)

---

## Getting Started

### Installation

1. **Download the App**
   - Open the App Store on your iOS device
   - Search for "Fleet Management" or "DCF Fleet Manager"
   - Tap "Get" or the cloud download icon
   - Authenticate with Face ID, Touch ID, or your Apple ID password
   - Wait for the app to download and install

2. **First Launch**
   - Locate the Fleet Management app icon on your home screen
   - Tap to launch the application
   - The app will request several permissions on first launch (explained in detail below)

### Required Permissions

The app requires the following permissions to function properly:

1. **Location Services** (Required)
   - **Why**: Essential for trip tracking, vehicle location monitoring, and geofencing
   - **What to do**: Tap "Allow While Using App" or "Allow Always" for best experience
   - **Privacy**: Location data is encrypted and never shared with third parties

2. **Bluetooth** (Required for OBD2)
   - **Why**: Connects to OBD2 adapters for vehicle diagnostics
   - **What to do**: Tap "OK" to enable Bluetooth access
   - **Privacy**: Only connects to paired OBD2 devices

3. **Camera** (Required for Inspections)
   - **Why**: Capture photos during vehicle inspections and document damage
   - **What to do**: Tap "OK" to allow camera access
   - **Privacy**: Photos are stored locally and encrypted

4. **Photo Library** (Optional)
   - **Why**: Attach existing photos to maintenance records or inspections
   - **What to do**: Tap "Allow Access to All Photos" or "Select Photos"
   - **Privacy**: The app only accesses photos you explicitly select

5. **Notifications** (Recommended)
   - **Why**: Receive alerts for maintenance due dates, trip reminders, and system updates
   - **What to do**: Tap "Allow" to enable notifications
   - **Control**: You can customize notification types in Settings later

**Screenshot Reference**: *Capture the permissions request screen showing each permission with the Allow/Don't Allow buttons*

### Initial Setup Checklist

Before you begin using the app, complete these steps:

- [ ] Grant all required permissions
- [ ] Create or log into your account
- [ ] Complete the onboarding tutorial
- [ ] Add your first vehicle
- [ ] Set up your profile information
- [ ] Configure notification preferences
- [ ] Pair OBD2 device (if applicable)

---

## Account Setup and Login

### Creating a New Account

If you're a new user, follow these steps to create your account:

1. **Launch the App**
   - Open the Fleet Management app
   - You'll see the login screen with the app logo

2. **Start Registration**
   - Tap "Create Account" or "Sign Up" button
   - You'll be directed to the registration form

3. **Enter Your Information**
   - **Email Address**: Enter your work or personal email
     - Must be a valid email format
     - This will be your username for logging in
   - **Password**: Create a secure password
     - Minimum 8 characters
     - Must include uppercase, lowercase, numbers, and special characters
     - Password strength indicator will show as you type
   - **Confirm Password**: Re-enter your password to verify
   - **Full Name**: Enter your first and last name
   - **Organization** (Optional): Enter your company or fleet name
   - **Phone Number** (Optional): For account recovery

4. **Accept Terms**
   - Read the Terms of Service and Privacy Policy
   - Tap the checkbox to accept
   - These documents explain data usage and your rights

5. **Complete Registration**
   - Tap "Create Account" button
   - You'll receive a verification email
   - Check your email inbox (and spam folder)
   - Tap the verification link in the email
   - Return to the app and log in

**Screenshot Reference**: *Capture the registration form showing all input fields and the Create Account button*

### Logging In

For existing users:

1. **Enter Credentials**
   - Email address or username
   - Password

2. **Optional Features**
   - **Remember Me**: Check this to stay logged in
   - **Biometric Login**: Enable Face ID or Touch ID for faster access

3. **Tap "Login"**
   - If credentials are correct, you'll be directed to the dashboard
   - If incorrect, you'll see an error message

### Password Recovery

If you forget your password:

1. On the login screen, tap "Forgot Password?"
2. Enter your registered email address
3. Tap "Send Reset Link"
4. Check your email for password reset instructions
5. Click the link in the email
6. Enter your new password twice
7. Tap "Reset Password"
8. Return to the app and log in with your new password

**Security Tip**: Never share your password with anyone. Use a password manager to generate and store complex passwords securely.

### Multi-Factor Authentication (MFA)

For enhanced security, we recommend enabling MFA:

1. Go to Settings > Security
2. Tap "Enable Two-Factor Authentication"
3. Choose your preferred method:
   - **SMS**: Receive codes via text message
   - **Authenticator App**: Use Google Authenticator or similar
   - **Email**: Receive codes via email
4. Follow the setup wizard
5. Save your backup codes in a secure location

Once enabled, you'll need to enter a verification code each time you log in from a new device.

---

## Dashboard Overview and Navigation

The Dashboard is your command center for fleet management. It provides a comprehensive overview of your fleet's status, performance metrics, and quick access to key features.

### Dashboard Layout

The dashboard is organized into several sections:

#### 1. Header Section

**Connection Status Indicator**
- Located in the top-right corner
- Shows "Online" (green dot) or "Offline" (orange dot)
- In offline mode, displays "Showing cached data"

**Filter Button**
- Tap the filter icon (three horizontal sliders) to:
  - Filter vehicles by status (Active, Idle, Service, Emergency)
  - Filter by region or department
  - Filter by vehicle type
  - Sort by various criteria

**Screenshot Reference**: *Capture the dashboard header showing connection status and filter button*

#### 2. Last Sync Time

- Displays when data was last synchronized with the server
- Format: "Updated 2 minutes ago" or "Updated today at 3:45 PM"
- Pull down on the screen to manually refresh

#### 3. Fleet Metrics Cards

Four primary metric cards display key information:

**Active Vehicles Card**
- Icon: Blue car icon
- Shows the count of vehicles currently in active status
- Tap to view all active vehicles

**Total Trips Card**
- Icon: Green location icon
- Displays total trips recorded (today, this week, or all-time based on filter)
- Tap to view trip history

**Maintenance Due Card**
- Icon: Orange wrench icon
- Shows count of vehicles with upcoming or overdue maintenance
- Tap to view maintenance schedule

**Total Distance Card**
- Icon: Purple road icon
- Displays cumulative distance traveled
- Units automatically adjust (miles/kilometers based on settings)

**Screenshot Reference**: *Capture the four metric cards showing different stats with icons and values*

#### 4. Fleet Performance Charts (iOS 17+)

**Vehicle Status Distribution Chart**
- Bar chart showing breakdown of vehicle statuses
- Color-coded bars:
  - Green: Active vehicles
  - Gray: Idle vehicles
  - Orange: Vehicles in service
  - Red: Emergency or critical vehicles
- Tap any bar to filter dashboard by that status

**Weekly Trip Trend Chart**
- Line chart showing trips over the past week
- X-axis: Days of the week (Mon-Sun)
- Y-axis: Number of trips
- Shaded area under the line for visual emphasis
- Helps identify usage patterns and peak days

**Screenshot Reference**: *Capture both charts showing sample data with clear labels*

#### 5. Quick Actions Section

Horizontal scrollable menu with quick access buttons:

- **Add Vehicle**: Tap to register a new vehicle
- **Start Trip**: Begin tracking a new trip
- **Schedule Maintenance**: Add a maintenance task
- **View Reports**: Access detailed analytics

Each button includes an icon and label. Swipe left/right to see all options.

**Screenshot Reference**: *Capture the quick actions row showing all four buttons*

### Navigation Menu

Access the main menu by tapping the tab bar at the bottom:

1. **Dashboard Tab** (Home icon)
   - Returns to the main dashboard
   - Shows badge notification for alerts

2. **Vehicles Tab** (Car icon)
   - Lists all vehicles in your fleet
   - Search and filter capabilities
   - Tap any vehicle for detailed view

3. **Trips Tab** (Map icon)
   - Access trip history
   - Start new trips
   - View trip analytics

4. **Maintenance Tab** (Wrench icon)
   - View maintenance calendar
   - Schedule new maintenance
   - Track work orders

5. **More Tab** (Three dots icon)
   - Settings and preferences
   - Help and support
   - User profile
   - About and legal information

**Screenshot Reference**: *Capture the bottom tab bar showing all five tabs with icons*

### Pull-to-Refresh

On any screen with scrollable content:
1. Pull down from the top of the list
2. Release when you see the refresh indicator
3. Wait for the spinning animation to complete
4. Content updates with latest data

### Search Functionality

Most list views include a search bar:
1. Tap the search bar at the top
2. Type your search query
3. Results filter in real-time as you type
4. Tap "Cancel" or the X button to clear search
5. Search works across multiple fields (vehicle number, VIN, license plate, driver name, etc.)

---

## Vehicle Management

The Vehicle Management section allows you to add, edit, view, and remove vehicles from your fleet.

### Adding a Vehicle

#### Method 1: Manual Entry

1. **Navigate to Add Vehicle Screen**
   - From Dashboard: Tap "Add Vehicle" quick action
   - From Vehicles Tab: Tap the "+" button in top-right
   - From Menu: More > Vehicles > Add Vehicle

2. **Enter Required Information**

   **Basic Information** (Required)
   - **Vehicle Number**: Your internal fleet number (e.g., "V-001", "TRUCK-42")
   - **VIN**: 17-character Vehicle Identification Number
     - Tap the camera icon to scan VIN from windshield
     - Tap the barcode icon to scan VIN barcode
   - **License Plate**: Current registration plate number
   - **Make**: Manufacturer (Ford, Chevrolet, Toyota, etc.)
   - **Model**: Vehicle model (F-150, Silverado, Camry, etc.)
   - **Year**: Model year (2020-2024)

   **Vehicle Type** (Required)
   - Select from dropdown: Car, Truck, Van, SUV, Semi, Bus, Equipment
   - This affects available features and metrics

   **Fuel Type** (Required)
   - Gasoline, Diesel, Electric, Hybrid, CNG, Propane
   - Affects fuel tracking calculations

   **Screenshot Reference**: *Capture the Add Vehicle form showing basic information fields*

3. **Optional Information**

   **Classification**
   - **Department**: Select or create department (Operations, Sales, Maintenance, etc.)
   - **Region**: Geographic assignment (Northeast, Southwest, etc.)
   - **Ownership**: Owned, Leased, or Rental

   **Current Status**
   - **Mileage**: Current odometer reading
   - **Fuel Level**: Current fuel percentage (0-100%)
   - **Location**: Tap "Use Current Location" or enter address manually

   **Assignment**
   - **Assigned Driver**: Select from driver list or enter name
   - **Home Base**: Primary parking location

   **Service Information**
   - **Last Service Date**: Date of most recent maintenance
   - **Next Service Due**: Scheduled next service date
   - **Service Interval**: Miles/months between services

4. **Add Photos** (Optional)
   - Tap "Add Photos" button
   - Choose from:
     - Take Photo: Opens camera
     - Choose from Library: Select existing photos
   - Recommended photos:
     - Front view
     - Rear view
     - Left side
     - Right side
     - Dashboard/interior
     - Any existing damage
   - You can add up to 10 photos per vehicle

5. **Custom Fields** (Optional)
   - Tap "Add Custom Field" to track additional information
   - Examples: Insurance policy number, GPS device ID, special equipment

6. **Save Vehicle**
   - Review all information for accuracy
   - Tap "Save Vehicle" button
   - Vehicle will be added to your fleet and appear in the vehicles list

**Screenshot Reference**: *Capture the complete Add Vehicle form with all sections visible*

#### Method 2: VIN Scanner

1. Tap the camera icon in the VIN field
2. Point your camera at the VIN on the windshield
3. The app automatically recognizes and captures the VIN
4. Review and confirm the VIN is correct
5. The app may auto-populate Make, Model, and Year if available in the database

#### Method 3: Barcode Scanner

1. Tap the barcode icon in the VIN field
2. Point your camera at the VIN barcode (usually on driver's door jamb)
3. The app scans and decodes the barcode
4. VIN is automatically entered and validated

### Viewing Vehicle Details

1. **Access Vehicle Details**
   - From Vehicles list: Tap on any vehicle
   - From Dashboard: Tap a vehicle in a list or chart
   - From Search: Search for vehicle and tap result

2. **Vehicle Detail Sections**

   **Header Information**
   - Vehicle photo (if added)
   - Vehicle number and status badge
   - Make, Model, Year
   - Quick action buttons: Edit, Delete, Share

   **Status Overview**
   - Current location with map preview (tap to open full map)
   - Fuel level gauge
   - Current mileage
   - Last updated timestamp

   **Recent Activity**
   - Last 5 trips with dates and distances
   - Recent maintenance records
   - Recent inspections
   - Tap "View All" to see complete history

   **Vehicle Information**
   - VIN, License Plate
   - Department, Region
   - Assigned Driver
   - Ownership type

   **Service Information**
   - Last service date and type
   - Next service due date
   - Service interval
   - Outstanding maintenance items

   **Documents** (If any)
   - Registration
   - Insurance
   - Service records
   - Inspection reports
   - Tap to view or download

   **Alerts** (If any)
   - Red exclamation icon for critical alerts
   - Yellow warning icon for warnings
   - Examples: "Oil change overdue", "Inspection expires soon"

**Screenshot Reference**: *Capture vehicle detail screen showing all sections with sample data*

### Editing a Vehicle

1. Open the vehicle detail screen
2. Tap the "Edit" button (pencil icon) in top-right
3. Modify any field you wish to change
4. Fields cannot be left blank if they were previously required
5. Tap "Save Changes" when done
6. Or tap "Cancel" to discard changes

**Best Practice**: When updating mileage, always use the current odometer reading for accuracy.

### Removing a Vehicle

1. Open the vehicle detail screen
2. Tap the "Edit" button
3. Scroll to the bottom
4. Tap "Delete Vehicle" button (red text)
5. Confirm deletion in the alert dialog
6. **Warning**: This action cannot be undone
7. All associated data (trips, maintenance, inspections) will also be deleted
8. Consider archiving instead of deleting for record-keeping

### Vehicle List Views

The Vehicles screen offers multiple view options:

**List View** (Default)
- Shows vehicles in a scrollable list
- Each row displays: Photo, Number, Make/Model, Status badge, Fuel level
- Swipe left on any vehicle for quick actions: Edit, Delete

**Grid View**
- Tap the grid icon in top-right to switch
- Shows vehicles as cards in a grid layout
- Better for visual browsing with larger photos

**Map View**
- Tap the map icon to see all vehicles on a map
- Color-coded pins by status
- Tap any pin to see vehicle details
- Tap "Directions" to navigate to vehicle location

**Filtering and Sorting**

Tap the filter icon to access options:

**Filter by Status**
- All Vehicles
- Active only
- Idle only
- In Service
- Out of Service
- Emergency

**Filter by Type**
- All Types
- Cars
- Trucks
- Vans
- SUVs
- Equipment

**Filter by Assignment**
- All Vehicles
- Assigned
- Unassigned
- By specific driver

**Sort Options**
- Vehicle Number (A-Z or Z-A)
- Most Recent Activity
- Fuel Level (Low to High or High to Low)
- Mileage (Low to High or High to Low)
- Maintenance Due (Soonest first)

**Screenshot Reference**: *Capture the vehicles list showing filter/sort options panel*

---

## Trip Tracking

Trip tracking helps you monitor vehicle usage, calculate mileage for reimbursement, analyze driving patterns, and maintain accurate logs.

### Starting a New Trip

#### Manual Trip Start

1. **Begin Trip Creation**
   - From Dashboard: Tap "Start Trip" quick action
   - From Trips Tab: Tap "+" button
   - From Vehicle Details: Tap "Start Trip"

2. **Enter Trip Details**
   - **Trip Name**: Descriptive name (e.g., "Morning Delivery Route")
   - **Vehicle**: Select from dropdown (pre-selected if started from vehicle detail)
   - **Driver**: Select driver name or enter new name
   - **Trip Purpose**: Business, Personal, Commute, Service, Other
   - **Starting Odometer** (Optional): Current mileage reading
   - **Notes** (Optional): Additional information about the trip

3. **Start Tracking**
   - Tap "Start Trip" button
   - GPS begins tracking your location
   - Timer starts counting trip duration
   - You'll see a persistent notification showing "Trip in progress"

**Screenshot Reference**: *Capture the Start Trip form with all fields*

#### Quick Start

For faster trip starts:
1. Tap and hold the "Start Trip" button on dashboard
2. Quick start sheet appears with:
   - Last used vehicle (pre-selected)
   - Last used driver name
   - Auto-generated trip name with date/time
3. Tap "Start Now" to begin immediately
4. Edit details later if needed

### During a Trip

While a trip is active, you'll see:

**Active Trip Banner**
- Appears at top of most screens
- Shows: Vehicle number, elapsed time, distance traveled
- Tap banner to view trip details

**Trip Control Screen**
- **Real-time Map**: Shows your route with breadcrumb trail
- **Trip Statistics**:
  - Current Speed (mph or km/h)
  - Distance Traveled
  - Duration (hours:minutes:seconds)
  - Average Speed
  - Estimated Fuel Used
- **Control Buttons**:
  - Pause: Temporarily pause tracking (bathroom breaks, fuel stops)
  - Resume: Continue after pause
  - Add Note: Add timestamped note to trip log
  - Add Photo: Attach photos (delivery proof, incident documentation)
  - Stop: End the trip

**Screenshot Reference**: *Capture the active trip screen showing map, stats, and controls*

### Pausing a Trip

When you need to pause tracking:
1. Tap "Pause" button on trip control screen
2. Trip status changes to "Paused"
3. GPS tracking stops, but trip remains active
4. Timer pauses
5. Use cases: Lunch break, temporary stop, switching drivers
6. Tap "Resume" when ready to continue
7. GPS and timer resume from where they left off

### Stopping a Trip

When your trip is complete:

1. **End the Trip**
   - Tap "Stop Trip" button
   - Confirmation dialog appears

2. **Review Trip Summary**
   - Total Distance
   - Total Duration
   - Average Speed
   - Route Map
   - Number of stops made
   - Fuel consumed (estimated)

3. **Add Final Details** (Optional)
   - Ending Odometer reading
   - Final notes or comments
   - Expense information
   - Add photos (delivery confirmations, etc.)

4. **Save Trip**
   - Tap "Save Trip"
   - Trip is saved to history
   - Available for review and export

**Screenshot Reference**: *Capture the trip summary screen after stopping*

### Viewing Trip History

1. **Access Trip History**
   - From Trips tab at bottom navigation
   - Or from Dashboard > Quick Actions > View Reports > Trips

2. **Trip Statistics Header**
   - Total Trips count
   - Total Distance (all time or filtered)
   - Total Duration (all time or filtered)

3. **Filter Trips**
   Tap the filter chips below statistics:
   - **All**: Shows all trips
   - **Active**: Currently running trips only
   - **Completed**: Finished trips
   - **Paused**: Temporarily paused trips

   Additional filters:
   - By Date Range (Today, This Week, This Month, Custom)
   - By Vehicle
   - By Driver
   - By Trip Purpose

4. **Trip List**
   Each trip row shows:
   - Trip name
   - Status badge (Active/Completed/Paused)
   - Distance traveled
   - Duration
   - Average speed
   - Start date and time

5. **Trip Details**
   Tap any trip to view:
   - Full route map with start/end markers
   - Detailed statistics
   - Stop locations and durations
   - Photos attached during trip
   - Driver information
   - Notes and comments
   - Weather conditions (if available)

**Screenshot Reference**: *Capture trip history list showing multiple trips with different statuses*

### Trip Details and Maps

From the trip detail screen:

**Interactive Map**
- Zoom in/out with pinch gestures
- Pan by dragging
- Green pin: Trip start location
- Red pin: Trip end location
- Blue line: Route traveled
- Orange pins: Stops made during trip
- Tap any marker for more information

**Route Analytics**
- Distance by road type (highway, city, rural)
- Elevation changes (if available)
- Speed zones and violations (if tracked)
- Idle time vs. moving time

**Export Options**
Tap "Share" button to:
- Export as GPX file (for mapping software)
- Export as PDF report
- Export as CSV (for spreadsheets)
- Share via email, AirDrop, or messaging

### Automatic Trip Detection

Enable this feature in Settings > Trips > Auto-Detect Trips:

**How It Works**
- App detects when vehicle starts moving (based on GPS)
- Automatically creates a trip record
- Tracks route without manual start
- Prompts to save trip when vehicle stops

**Configuration**
- Minimum distance threshold (default: 0.5 miles)
- Minimum duration threshold (default: 2 minutes)
- Auto-select vehicle (based on last OBD2 connection or manual setting)

**Benefits**
- Never forget to start a trip
- Capture all vehicle movements
- Reduced manual data entry

**Privacy Note**: Auto-detect only works when app is open or running in background. Location tracking respects system privacy settings.

---

## OBD2 Setup and Diagnostics

OBD2 (On-Board Diagnostics) integration provides real-time engine data and diagnostic information directly from your vehicle's computer.

### What is OBD2?

OBD2 is a standardized system that:
- Monitors engine performance
- Detects malfunctions and emissions issues
- Provides diagnostic trouble codes (DTCs)
- Reports real-time sensor data

All vehicles manufactured after 1996 (US) have an OBD2 port, usually located:
- Under the dashboard, near the driver's side
- Near the steering column
- Sometimes hidden behind a panel or cover

**Screenshot Reference**: *Diagram showing typical OBD2 port locations in vehicles*

### Compatible OBD2 Adapters

The app works with Bluetooth OBD2 adapters (ELM327 protocol):

**Recommended Adapters**
- BAFX Products Bluetooth OBD2 Scanner
- BlueDriver Bluetooth Pro OBDII Scan Tool
- Veepeak OBD2 Bluetooth Scanner
- ScanTool OBDLink MX+

**Purchase Considerations**
- Must support Bluetooth 4.0 or later
- ELM327 chipset compatibility
- iOS compatibility verified
- Price range: $20-$100

**Where to Buy**
- Amazon
- Auto parts stores (AutoZone, O'Reilly, Advance Auto Parts)
- Electronics retailers

### Initial OBD2 Setup

#### Step 1: Purchase and Prepare Adapter

1. Purchase a compatible Bluetooth OBD2 adapter
2. Ensure it's fully charged (if rechargeable) or has fresh batteries
3. Read manufacturer's instructions

#### Step 2: Locate OBD2 Port

1. Consult your vehicle's owner manual for OBD2 port location
2. Common locations:
   - Below steering wheel, left side
   - Behind small access panel on lower dash
   - Near center console
3. The port is a 16-pin trapezoid-shaped connector

**Screenshot Reference**: *Photo showing OBD2 port with adapter plugged in*

#### Step 3: Connect Adapter to Vehicle

1. Ensure vehicle is in accessory mode or engine is running
2. Plug OBD2 adapter firmly into port
3. Adapter LED should light up (varies by model):
   - Some blink on connection
   - Some show solid light
   - Some have color-coded status lights
4. Wait 5-10 seconds for adapter to initialize

#### Step 4: Pair Adapter with App

1. **Open OBD2 Diagnostics**
   - From Dashboard: More > OBD2 Diagnostics
   - From Vehicles: Vehicle Details > OBD2 Connect

2. **Enable Bluetooth**
   - If Bluetooth is off, app will prompt to enable it
   - Tap "Enable Bluetooth" or go to iOS Settings

3. **Scan for Devices**
   - Tap "Scan for Devices" button
   - App searches for nearby OBD2 adapters
   - Scanning indicator shows progress (typically 10-15 seconds)

4. **Select Your Adapter**
   - List of discovered devices appears
   - Look for device names like:
     - "OBDII"
     - "ELM327"
     - "CHX-XXXX"
     - Your adapter's specific name
   - Tap on your adapter to connect

5. **Enter PIN if Prompted**
   - Some adapters require a PIN (usually 0000 or 1234)
   - Check adapter documentation for correct PIN
   - Enter PIN and tap "Connect"

6. **Wait for Connection**
   - Connection process takes 5-15 seconds
   - Status banner shows "Connecting..."
   - Once connected: Banner turns green and shows "Connected"

**Screenshot Reference**: *Capture OBD2 device list screen showing discovered adapters*

#### Step 5: Verify Connection

Once connected, the OBD2 Diagnostics screen shows:

**Connection Status Banner**
- Green background
- "Connected" status
- "Real-time data streaming" message

**Real-Time Data Cards**
You should see live data updating:
- RPM (engine revolutions per minute)
- Speed (vehicle speed)
- Fuel Level (% remaining)
- Coolant Temperature (°C or °F)
- Engine Load (%)
- Throttle Position (%)

If data is updating, your setup is successful!

**Screenshot Reference**: *Capture OBD2 diagnostics screen showing real-time data*

### Understanding OBD2 Data

#### Engine RPM (Revolutions Per Minute)

**What it means**: How fast your engine is spinning

**Normal ranges**:
- Idle: 600-1000 RPM
- Driving: 1500-3000 RPM
- Highway: 2000-3000 RPM

**Concerns**:
- Idle too high (>1200 RPM): Possible vacuum leak, faulty sensor
- Fluctuating at idle: Engine misfire, fuel system issue

#### Vehicle Speed

**What it means**: Current speed from vehicle's speed sensor

**Notes**:
- More accurate than GPS speed
- Updates every second
- Displayed in mph or km/h based on settings

#### Fuel Level

**What it means**: Percentage of fuel remaining in tank

**Notes**:
- Based on fuel level sensor
- May not match dashboard gauge exactly
- Useful for fuel consumption tracking

#### Coolant Temperature

**What it means**: Engine coolant/antifreeze temperature

**Normal range**: 195-220°F (90-105°C)

**Concerns**:
- <160°F: Engine not warmed up yet
- >230°F: Overheating risk - pull over safely
- Rapid temperature increase: Cooling system problem

#### Engine Load

**What it means**: Percentage of maximum engine capacity being used

**Normal ranges**:
- Idle: 10-20%
- City driving: 20-50%
- Highway: 25-40%
- Acceleration/hills: 50-90%

**High load with low RPM**: Possible issue with transmission or engine performance

#### Throttle Position

**What it means**: How far gas pedal is pressed

**Normal ranges**:
- Idle: 0-10%
- Cruising: 10-30%
- Acceleration: 50-100%

### Diagnostic Trouble Codes (DTCs)

DTCs are codes that identify specific vehicle problems.

#### Reading DTCs

1. From OBD2 Diagnostics screen
2. Scroll to "Diagnostic Codes" section
3. Tap "Refresh" to read current codes
4. Wait 5-10 seconds for scan to complete

**If No Codes Found**:
- Green checkmark icon appears
- Message: "No diagnostic trouble codes found"
- Your vehicle's computer has not detected any issues

**If Codes Found**:
- Each code is displayed as a card
- Format: Letter + 4 digits (e.g., P0171, P0300)

#### Understanding DTC Format

**First Character** (System):
- **P**: Powertrain (engine, transmission)
- **B**: Body (airbags, power seats, etc.)
- **C**: Chassis (brakes, suspension, steering)
- **U**: Network (communication between modules)

**Second Character** (Code Type):
- **0**: Generic (standardized across all makes)
- **1**: Manufacturer-specific

**Remaining 3 Digits**: Specific fault

#### Common DTCs and Meanings

| Code | Description | Severity | Action |
|------|-------------|----------|--------|
| P0171 | System Too Lean (Bank 1) | Medium | Check for vacuum leaks, MAF sensor |
| P0300 | Random/Multiple Cylinder Misfire | High | Check spark plugs, ignition coils |
| P0420 | Catalyst System Efficiency Below Threshold | Medium | Catalytic converter may need replacement |
| P0442 | EVAP System Leak Detected (small leak) | Low | Check gas cap, EVAP system |
| P0128 | Coolant Thermostat Temperature Below Regulating Temperature | Low | Thermostat may be stuck open |

**Screenshot Reference**: *Capture diagnostic codes screen showing sample DTCs*

#### DTC Severity Levels

**Pending (Yellow)**
- Code has been triggered once
- Not confirmed yet
- Monitor - may resolve itself
- No immediate action needed

**Confirmed (Red)**
- Code has been triggered multiple times
- Issue is persistent
- Should be addressed soon
- May affect performance or emissions

**Permanent (Purple)**
- Code cannot be cleared until issue is fixed
- Repair required
- Will prevent passing emissions test

#### Clearing DTCs

**When to Clear**:
- After repairs have been made
- To reset check engine light
- To verify if issue is resolved

**How to Clear**:
1. Scroll to Diagnostic Codes section
2. Tap "Clear All Codes" button (appears only when codes exist)
3. Confirm in alert dialog
4. Wait for confirmation message
5. Codes are erased from vehicle's computer

**Important Notes**:
- Clearing codes does NOT fix the problem
- If the issue persists, codes will return
- Some codes (permanent) cannot be cleared until repaired
- Clearing codes will reset emission monitors

### OBD2 Settings and Advanced Features

Access OBD2 Settings by tapping the menu icon (three dots) on OBD2 Diagnostics screen:

#### Auto-Reconnect

**Purpose**: Automatically reconnect to OBD2 adapter when in range

**How it works**:
- When enabled, app attempts to reconnect to last paired adapter
- Reconnects when you start vehicle
- No manual scanning needed

**Configuration**:
- Settings > OBD2 > Auto-Reconnect toggle
- Max Retries: 1-10 attempts (default: 3)
- Timeout: 5-60 seconds (default: 15)

#### Data Logging

Record OBD2 data during trips:
- Logs data points every 1-5 seconds (configurable)
- Stores RPM, speed, fuel, temperature over time
- Useful for performance analysis and diagnostics
- Review logs in Trip Details > OBD2 Log

#### VIN Reading

Read VIN directly from vehicle's computer:
1. Tap menu > Read VIN
2. App queries vehicle computer
3. VIN appears in 5-10 seconds
4. Tap "Save to Vehicle" to update vehicle record

#### Connection Statistics

View connection performance:
- Device name
- Connection attempts
- Successful connections
- Total data points received
- Reset statistics: Settings > Reset Statistics

**Screenshot Reference**: *Capture OBD2 settings screen*

### Troubleshooting OBD2 Connection

#### Adapter Won't Appear in Scan

**Solutions**:
1. Ensure vehicle is in accessory mode or running
2. Verify adapter is plugged in firmly
3. Check adapter LED is lit
4. Restart adapter (unplug and replug)
5. Ensure Bluetooth is enabled on iPhone
6. Move iPhone closer to adapter
7. Remove adapter from Bluetooth settings and re-pair

#### Connection Fails or Drops

**Solutions**:
1. Check adapter battery (if rechargeable)
2. Ensure no other devices are connected to adapter
3. Clear Bluetooth cache: Settings > Bluetooth > Forget Device
4. Update adapter firmware (if available)
5. Try different adapter (may be faulty)

#### No Data Showing

**Solutions**:
1. Wait 30 seconds after connection for initial data
2. Ensure vehicle supports OBD2 protocol (1996 or newer)
3. Try starting engine (some data only available when running)
4. Check adapter is fully inserted into OBD2 port
5. Adapter may not be compatible - try recommended adapters

#### Data Seems Incorrect

**Solutions**:
1. Compare with vehicle's dashboard gauges
2. Some vehicles have variations in sensor reporting
3. Coolant temp: Wait for engine to warm up
4. Fuel level: May differ from dash due to sensor placement
5. Reset connection and reconnect

---

## Vehicle Inspections

The vehicle inspection feature helps you conduct thorough pre-trip, post-trip, and periodic inspections with photo documentation.

### When to Conduct Inspections

**Pre-Trip Inspections**
- Before long trips
- Before daily use (commercial fleets)
- After vehicle has been idle for extended period
- Regulatory requirement (DOT, etc.)

**Post-Trip Inspections**
- After long trips
- After rough road conditions
- To document vehicle condition
- Before returning rental vehicles

**Periodic Inspections**
- Monthly safety checks
- Quarterly maintenance inspections
- Annual vehicle assessments
- Insurance documentation

### Starting an Inspection

1. **Navigate to Inspection Screen**
   - From Vehicle Details: Tap "Start Inspection" button
   - From Vehicles List: Swipe left on vehicle > Tap "Inspect"
   - From Dashboard: More > Inspections > New Inspection

2. **Enter Inspector Information**
   - Inspector Name prompt appears
   - Enter your full name
   - This records who performed the inspection
   - Tap "Start Inspection" to proceed

**Screenshot Reference**: *Capture inspector name prompt screen*

3. **Inspection Progress Screen Opens**

**Header Section**:
- Vehicle number and model displayed
- Progress percentage (0% at start)
- Progress bar showing completion status

**Screenshot Reference**: *Capture inspection progress header showing 0% completion*

### Inspection Categories

The inspection is organized into 8 categories. Each category contains multiple inspection points:

#### 1. Exterior

Inspection points include:
- **Body Condition**: Dents, scratches, rust, paint damage
- **Lights**: Headlights, taillights, turn signals, brake lights all functional
- **Mirrors**: Side mirrors intact and properly adjusted
- **Windows**: Cracks, chips, tinting compliance
- **Wipers**: Condition of blades, washer fluid level
- **Tires**: Tread depth, pressure, sidewall damage, wear patterns
- **Wheels**: Lug nuts tight, rim damage
- **License Plate**: Visible, current registration sticker

**How to Inspect Each Point**:
1. Tap the Exterior category to expand
2. For each item, select status:
   - **Passed** (green checkmark): Item meets standards
   - **Failed** (red X): Item does not pass, needs repair
   - **Needs Attention** (orange exclamation): Minor issue, monitor

3. If Failed or Needs Attention:
   - "Add Notes" button appears
   - Tap to add details about the issue
   - Describe location, severity, and recommended action

4. Add photos:
   - Tap "Add Photo" for the category
   - Take photo with camera or choose from library
   - Photos automatically tagged with category
   - Can add multiple photos per category

**Screenshot Reference**: *Capture Exterior inspection items with different status options*

#### 2. Interior

Inspection points:
- **Seats**: Condition, tears, stains, adjustability
- **Seat Belts**: Function properly, no fraying
- **Dashboard**: All gauges working, warning lights off
- **Climate Control**: AC, heat, defrost functioning
- **Steering Wheel**: Condition, alignment, play
- **Pedals**: Brake, gas, clutch (if manual) feel normal
- **Floor Mats**: Clean, secured, not interfering with pedals
- **Interior Lights**: Dome light, door lights functional

#### 3. Engine Compartment

Inspection points:
- **Oil Level**: Check dipstick, top off if needed
- **Coolant Level**: Check reservoir, proper level
- **Brake Fluid**: Proper level, not dark or cloudy
- **Power Steering Fluid**: Proper level (if applicable)
- **Battery**: Terminals clean, tight, no corrosion
- **Belts**: No cracks, proper tension
- **Hoses**: No leaks, cracks, or bulges
- **Air Filter**: Clean, not clogged with debris

**Safety Tip**: Only check engine compartment when engine is cold. Never remove radiator cap when hot.

#### 4. Fluids

Inspection points:
- **Engine Oil**: Level and condition
- **Transmission Fluid**: Level and color (should be red, not brown)
- **Differential Fluid**: Level checked (if accessible)
- **Windshield Washer**: Full, working properly
- **Check for Leaks**: Look under vehicle for puddles

#### 5. Undercarriage

Inspection points:
- **Exhaust System**: No holes, loose parts, excessive rust
- **Frame**: No cracks, damage, or excessive rust
- **Suspension**: Shocks not leaking, springs intact
- **Drive Shaft**: No excessive play (trucks/RWD)
- **Fuel Tank**: Secure, no leaks or damage

**Note**: May require vehicle lift or inspection pit. Can mark as N/A if not accessible.

#### 6. Safety Equipment

Inspection points:
- **First Aid Kit**: Present, stocked, not expired
- **Fire Extinguisher**: Present, charged, not expired
- **Warning Triangles/Flares**: Present and functional
- **Spare Tire**: Proper inflation, not damaged
- **Jack and Lug Wrench**: Present and functional
- **Emergency Supplies**: Flashlight, blanket, basic tools

#### 7. Documents

Inspection points:
- **Registration**: Current, in vehicle
- **Insurance Card**: Current, in vehicle
- **Inspection Sticker**: Current, on windshield (if required)
- **Maintenance Records**: Available or logged in system
- **Operator's Manual**: Present in glove box

#### 8. Overall Condition

General assessment:
- **Cleanliness**: Interior and exterior clean
- **Odor**: No unusual smells (burning, fuel, mildew)
- **General Appearance**: Professional, ready for use
- **Readiness**: Vehicle ready for intended use

**Screenshot Reference**: *Capture all eight category cards in collapsed state*

### Completing the Inspection

1. **Review Progress**
   - Progress bar must show 100% to complete
   - All inspection points must have a status selected
   - Review any Failed or Needs Attention items

2. **Add General Notes**
   - Scroll to "General Notes" section
   - Tap in text area
   - Add any overall comments about the inspection
   - Mention anything that doesn't fit in specific categories

3. **Review Photos**
   - "Inspection Photos" section shows all photos taken
   - Tap any photo to view full size
   - Photos organized by category
   - Can delete photos if needed

4. **Complete Inspection**
   - Tap "Complete Inspection" button at bottom
   - Button is green when 100% complete
   - Button is gray and disabled if incomplete

5. **Completion Dialog**
   - If all items passed: "Are you sure you want to complete this inspection?"
   - If items failed: "This inspection has failed items. A work order will be created for repairs."
   - Tap "Complete" to confirm
   - Or "Cancel" to continue editing

6. **Post-Completion Actions**
   - Inspection is saved to vehicle record
   - If items failed: Automatic work order created and added to Maintenance
   - Inspection appears in Vehicle Details > Inspections tab
   - Can export as PDF for records

**Screenshot Reference**: *Capture completion dialog showing failed items warning*

### Viewing Inspection History

1. From Vehicle Details > Inspections tab
2. List shows all past inspections for this vehicle
3. Each row displays:
   - Inspection date and time
   - Inspector name
   - Pass/Fail status
   - Number of failed items
4. Tap any inspection to view details

### Inspection Reports

**Export Options**:
1. Open completed inspection
2. Tap "Share" button
3. Choose format:
   - **PDF Report**: Professional formatted document with all photos
   - **Email**: Send directly to recipient
   - **Print**: AirPrint compatible
   - **Save to Files**: Store in iCloud or local storage

**PDF Report Contents**:
- Cover page with vehicle info
- Inspector name and date/time
- Summary of results
- Detailed findings by category
- All photos embedded
- Notes and comments
- Signature line (if printed)

---

## Maintenance Scheduling and Tracking

The Maintenance module helps you schedule, track, and manage all vehicle maintenance activities.

### Understanding Maintenance Types

**Preventive Maintenance**
- Scheduled regular maintenance
- Based on time or mileage intervals
- Examples: Oil changes, tire rotations, inspections
- Prevents larger problems
- Icon: Calendar with clock

**Corrective Maintenance**
- Fixes identified problems
- Reactive, not scheduled
- Examples: Brake repairs, engine fixes
- Icon: Wrench and screwdriver

**Predictive Maintenance**
- Based on data and analytics
- Uses OBD2 data, patterns, and AI
- Anticipates failures before they occur
- Icon: Chart with upward trend

**Emergency Maintenance**
- Urgent, unplanned repairs
- Vehicle cannot operate safely
- Requires immediate attention
- Icon: Exclamation triangle

**Inspection**
- Periodic safety and compliance checks
- May be regulatory requirement
- Identifies issues needing maintenance
- Icon: Shield with checkmark

**Recall**
- Manufacturer-issued recalls
- Safety or compliance related
- Usually free service
- Icon: Circular arrows

### Scheduling Maintenance

#### Creating a Maintenance Record

1. **Navigate to Maintenance Screen**
   - From Dashboard: Quick Actions > Schedule Maintenance
   - From Vehicles: Vehicle Details > Maintenance tab > "+"
   - From Maintenance Tab: Tap "+" button

2. **Select Vehicle**
   - Choose from dropdown list
   - Search by vehicle number, VIN, or license plate
   - Pre-selected if started from vehicle detail screen

3. **Enter Maintenance Details**

   **Type** (Required)
   - Select from: Preventive, Corrective, Predictive, Emergency, Inspection, Recall

   **Category** (Required)
   - Oil Change
   - Tire Rotation
   - Brake Service
   - Battery Replacement
   - Engine Repair
   - Transmission
   - Suspension
   - Electrical
   - HVAC
   - Body Work
   - Interior
   - Safety
   - Diagnostic
   - Fluid Service
   - Filter Replacement
   - Belts & Hoses
   - Exhaust System
   - Cooling System
   - Fuel System
   - Other

   **Description** (Required)
   - Brief summary of work to be done
   - Example: "Replace engine oil and oil filter, rotate tires"

   **Scheduled Date** (Required)
   - Tap calendar icon
   - Select date maintenance is scheduled
   - Time picker also available

   **Priority** (Required)
   - **Low**: Can wait, not urgent (gray)
   - **Normal**: Standard priority (blue)
   - **High**: Should be done soon (orange)
   - **Urgent**: Needs immediate attention (red)
   - **Critical**: Safety issue, do not drive (purple)

**Screenshot Reference**: *Capture schedule maintenance form with all required fields*

4. **Optional Information**

   **Service Provider**
   - Name of shop or mechanic
   - Select from previous providers or enter new

   **Location**
   - Shop address
   - Or "On-Site" if done at your facility

   **Estimated Cost**
   - Expected cost in dollars
   - Helps with budgeting
   - Can be updated later with actual cost

   **Mileage at Service**
   - Current odometer reading
   - Or expected mileage at service date

   **Assigned To**
   - Technician or person responsible
   - For internal maintenance tracking

5. **Add Parts** (Optional)

   **Parts List**:
   - Tap "Add Part" button
   - Enter:
     - Part Name
     - Part Number (if known)
     - Quantity needed
     - Cost per unit
     - Supplier
     - Notes
   - Tap "Save Part"
   - Add multiple parts as needed
   - Total parts cost calculates automatically

**Screenshot Reference**: *Capture add parts screen*

6. **Next Service Reminder** (Optional)
   - Next Service Date: When this service should be done again
   - Next Service Mileage: Mileage trigger for next service
   - Example: Oil change every 3,000 miles or 3 months

7. **Attachments** (Optional)
   - Tap "Add Attachment"
   - Choose:
     - Take Photo
     - Choose Photo from Library
     - Scan Document
     - Choose File
   - Useful for:
     - Service quotes
     - Receipts
     - Work orders
     - Before/after photos

8. **Save Maintenance Record**
   - Review all information
   - Tap "Save" button
   - Record added to maintenance calendar

### Maintenance Calendar View

1. **Access Calendar**
   - Maintenance Tab > Calendar icon
   - Shows month view by default

2. **Calendar Features**

   **Date Indicators**:
   - Blue dot: Scheduled maintenance
   - Orange dot: Overdue maintenance
   - Green dot: Completed maintenance
   - Red dot: Critical priority maintenance

   **Tap any date**:
   - See all maintenance scheduled for that day
   - Tap any item for details

   **Change Views**:
   - Month: See whole month
   - Week: See weekly schedule
   - List: All maintenance in chronological order

**Screenshot Reference**: *Capture calendar view showing various maintenance items*

### Updating Maintenance Status

As maintenance progresses, update the status:

1. **Open Maintenance Record**
   - From calendar or maintenance list
   - Tap on the record

2. **Change Status**
   - Tap "Status" field
   - Select new status:
     - **Scheduled**: Not started yet
     - **In Progress**: Work has begun
     - **Completed**: Finished
     - **Cancelled**: No longer needed
     - **Delayed**: Postponed to later date
     - **On Hold**: Temporarily paused

3. **For Completed Maintenance**:
   - **Completed Date**: Auto-fills with today, or select different date
   - **Actual Cost**: Enter final cost paid
   - **Serviced By**: Name of person/shop who did the work
   - **Completion Notes**: Any details about the service performed
   - **Upload Receipt**: Add photo of invoice/receipt
   - **Odometer Reading**: Current mileage after service

4. **Save Changes**
   - Tap "Save"
   - Status updates across all views

**Screenshot Reference**: *Capture completed maintenance form showing actual cost and completion notes*

### Maintenance Reminders and Alerts

The app sends notifications for:

**Due Soon**
- 7 days before scheduled date
- Or 500 miles before scheduled mileage
- Notification title: "Maintenance Due Soon"
- Tap to view details

**Overdue**
- Day after scheduled date passes
- Notification title: "Maintenance Overdue"
- Priority level affects notification urgency

**Critical Items**
- Immediate alert for critical priority items
- Persistent notification until acknowledged
- May restrict vehicle use (configurable)

**Configuration**:
Settings > Notifications > Maintenance
- Enable/disable maintenance reminders
- Set advance notice days (1-30 days)
- Set mileage threshold (100-1000 miles)
- Quiet hours (no notifications during)

### Viewing Maintenance History

1. **From Vehicle Details**
   - Maintenance tab shows all maintenance for that vehicle
   - Sorted by date (most recent first)

2. **From Maintenance Tab**
   - Shows all maintenance across all vehicles
   - Filter by:
     - Vehicle
     - Status
     - Type
     - Date range
     - Priority

3. **Maintenance Statistics**
   - Total maintenance count
   - Total cost (all time or filtered)
   - Average cost per maintenance
   - Cost by category (pie chart)
   - Maintenance by month (bar chart)

**Screenshot Reference**: *Capture maintenance history with statistics*

### Maintenance Reports

Generate reports for analysis:

1. **Access Reports**
   - Maintenance Tab > Reports button (chart icon)

2. **Report Types**

   **Maintenance by Vehicle**
   - See which vehicles require most maintenance
   - Identify high-cost vehicles
   - Plan for replacements

   **Maintenance by Type**
   - Breakdown by preventive vs. corrective
   - Identify if preventive maintenance is adequate

   **Maintenance by Category**
   - See most common issues
   - Examples: If many brake services, investigate cause

   **Cost Analysis**
   - Total cost over time
   - Budget vs. actual
   - Forecast future costs

   **Upcoming Maintenance**
   - Next 30/60/90 days
   - Plan staffing and budget
   - Avoid scheduling conflicts

3. **Export Reports**
   - PDF: Professional formatted document
   - CSV: Import into Excel/Google Sheets
   - Email: Send to stakeholders
   - Print: Hard copy for records

**Screenshot Reference**: *Capture maintenance reports screen showing cost analysis chart*

### Maintenance Best Practices

**Tips for Effective Maintenance Management**:

1. **Follow Manufacturer Recommendations**
   - Refer to vehicle owner's manual
   - Adhere to recommended service intervals
   - Don't skip preventive maintenance

2. **Keep Detailed Records**
   - Always add notes about service performed
   - Attach receipts and work orders
   - Record actual mileage at service time

3. **Use Priority Levels Correctly**
   - Critical: Safety issues, don't drive
   - Urgent: Needs immediate attention
   - High: Address within a week
   - Normal: Follow schedule
   - Low: When convenient

4. **Set Realistic Schedules**
   - Don't postpone critical maintenance
   - Account for shop availability
   - Schedule during slower periods

5. **Track Costs**
   - Always enter estimated and actual costs
   - Helps with budgeting
   - Identifies cost trends

6. **Review Regularly**
   - Weekly review of upcoming maintenance
   - Monthly review of overdue items
   - Quarterly analysis of costs and trends

7. **Communicate**
   - Share maintenance schedules with drivers
   - Notify when vehicle will be unavailable
   - Report completed maintenance to stakeholders

---

## Offline Mode Usage

The Fleet Management app is designed to work seamlessly even when you don't have an internet connection.

### How Offline Mode Works

**Automatic Detection**
- App constantly monitors network connectivity
- When connection lost, automatically enters offline mode
- Offline indicator appears at top of screen
- All data operations continue locally

**Local Data Storage**
- All fleet data cached on device using encrypted Core Data
- Includes: Vehicles, trips, maintenance, inspections
- Photos stored locally
- Can view and edit all information offline

**Background Sync**
- When connection restored, automatic sync begins
- Changed data uploaded to server
- New data downloaded from server
- Conflict resolution if same data modified elsewhere

**Screenshot Reference**: *Capture offline indicator banner showing "Offline Mode - Showing cached data"*

### What You Can Do Offline

**Full Functionality**:
- View all vehicles and their details
- Start and stop trips (GPS tracking works offline)
- Conduct vehicle inspections
- Schedule maintenance
- Edit vehicle information
- Take and attach photos
- View trip history
- Access maintenance records
- Search vehicles
- View dashboard metrics (cached data)

**Limited Functionality**:
- Cannot sync new data from server
- Cannot access data for vehicles not previously cached
- Charts and analytics show cached data only
- Some features may show "Offline" badge

**Not Available**:
- Real-time data updates
- Accessing new vehicles added by other users
- OBD2 features (Bluetooth still works, but app won't sync data)

### Preparing for Offline Use

**Before Going Offline**:

1. **Open App with Internet**
   - Ensures latest data is cached
   - All vehicle information downloaded

2. **View Key Screens**
   - Open vehicles you'll need
   - View trip history you may reference
   - Access maintenance schedules
   - App caches viewed screens

3. **Download Maps** (Optional)
   - iOS Maps: Settings > Maps > Download Offline Maps
   - Select region where you'll be working
   - Offline maps improve trip tracking

4. **Check Sync Status**
   - Settings > Data & Sync > Sync Status
   - Ensure "All data synced" message
   - Resolve any pending uploads

**Screenshot Reference**: *Capture data sync status screen*

### Working Offline

**Offline Indicator**:
- Orange banner at top: "Offline Mode"
- Subtext: "Showing cached data"
- Tap for more information

**Creating New Records**:
- All functions work normally
- Data saved locally
- Sync icon appears on record (cloud with arrow)
- Will upload when online

**Editing Records**:
- Edit any cached record
- Changes saved locally
- Marked as "Pending Sync"

**Taking Photos**:
- Photos stored on device
- Tagged for upload when online
- No size limit on offline photos

**Trip Tracking**:
- GPS works without internet
- Route recorded locally
- Breadcrumb trail saved
- Uploads when connection restored

### Returning Online

**Automatic Sync**:
1. App detects connection restored
2. Offline banner disappears
3. Sync begins automatically in background
4. Sync status shown in top-right (spinning icon)

**Manual Sync**:
1. Pull down on any list screen to refresh
2. Or Settings > Data & Sync > Sync Now
3. Progress indicator shows sync status
4. Notification when sync complete

**Sync Process**:
- Uploads local changes first
- Downloads new data from server
- Resolves conflicts (if any)
- Updates all screens with latest data
- May take 30 seconds to several minutes depending on changes

**Screenshot Reference**: *Capture sync progress indicator*

### Conflict Resolution

**When Conflicts Occur**:
- Same vehicle edited on multiple devices while offline
- App detects conflicting changes

**Conflict Dialog**:
- Shows your changes vs. server changes
- Options:
  - Keep My Changes (overwrite server)
  - Keep Server Changes (discard local)
  - Merge Changes (keep both, you resolve)

**Best Practice**:
- Review both versions carefully
- Keep most recent or most accurate data
- Merge if changes don't conflict (different fields)

**Screenshot Reference**: *Diagram showing conflict resolution flow*

### Offline Mode Best Practices

**Tips for Offline Work**:

1. **Sync Before Going Offline**
   - Always start with latest data
   - Prevents conflicts

2. **Work on Specific Vehicles**
   - Reduces chance of conflicts
   - Easier to manage offline data

3. **Regular Syncs**
   - Sync whenever you have connection
   - Don't accumulate too many offline changes

4. **Photo Management**
   - Offline photos consume device storage
   - Sync soon to upload and free space

5. **Trip Tracking**
   - Offline trips recorded accurately
   - Longer trips generate more data
   - Battery usage slightly higher offline

6. **Check Storage**
   - Settings > iPhone Storage > Fleet App
   - Ensure adequate free space
   - Clear cache if needed

### Troubleshooting Offline Mode

**Sync Not Working**:
1. Check internet connection in other apps
2. Force close and reopen Fleet app
3. Settings > Data & Sync > Force Sync
4. Restart device if persists

**Data Missing After Sync**:
1. Check filters (may be hiding data)
2. Pull to refresh on list screens
3. Log out and log back in
4. Contact support if data lost

**Photos Not Uploading**:
1. Check internet connection quality
2. Ensure sufficient storage on server
3. Photos upload in background, may take time
4. Check Settings > Data & Sync > Upload Queue

---

## Settings and Preferences

Customize the app to match your workflow and preferences.

### Accessing Settings

- From any screen: Tap "More" tab > Settings icon
- Or Dashboard > Top-right menu > Settings

### Account Settings

**Profile Information**
- Name: Display name used throughout app
- Email: Login email, also receives notifications
- Phone: For account recovery and SMS alerts
- Organization: Company or fleet name
- Role: Your position (Fleet Manager, Driver, Mechanic, etc.)

**Change Password**
- Current Password: Enter existing password
- New Password: Must meet security requirements
- Confirm New Password: Re-enter for verification
- Tap "Update Password"

**Email Notifications**
- Maintenance Reminders: On/Off
- Trip Summaries: Daily/Weekly/Off
- Inspection Alerts: On/Off
- System Updates: On/Off

**Screenshot Reference**: *Capture account settings screen*

### App Settings

**Units**
- Distance: Miles or Kilometers
- Volume: Gallons or Liters
- Temperature: Fahrenheit or Celsius
- Affects all measurements in app

**Date and Time**
- Format: 12-hour or 24-hour
- First Day of Week: Sunday or Monday
- Affects calendar and date displays

**Language**
- Select from available languages
- Currently available: English (more coming soon)
- Restart required after change

**Theme**
- Light Mode: Bright background
- Dark Mode: Dark background, easier on eyes
- Automatic: Follow iOS system setting

**Screenshot Reference**: *Capture app settings with units and theme options*

### Trip Settings

**Auto-Detect Trips**
- Enable/Disable automatic trip detection
- Minimum Distance: 0.1 - 5.0 miles
- Minimum Duration: 1 - 10 minutes

**Default Trip Type**
- Business
- Personal
- Commute
- Service
- Other
- Pre-selects this type for new trips

**Trip Alerts**
- Speeding Alert: On/Off
- Speed Threshold: 5-25 mph over limit
- Idle Alert: Notify after X minutes idle
- Geofence Alerts: On/Off

**Location Accuracy**
- Best: Most accurate, uses more battery
- Good: Balanced accuracy and battery
- Battery Saver: Less accurate, saves battery

### Maintenance Settings

**Reminder Timing**
- Days Before Due: 1-30 days advance notice
- Mileage Before Due: 100-1000 miles advance notice

**Default Priority**
- Set default for new maintenance items
- Options: Low, Normal, High, Urgent, Critical

**Auto-Create from Inspections**
- When enabled: Failed inspection items automatically create maintenance records
- When disabled: Manual creation required

**Service Providers**
- Manage list of preferred service providers
- Add, edit, or delete providers
- Set default provider

### OBD2 Settings

**Connection**
- Auto-Reconnect: On/Off
- Max Retries: 1-10 attempts
- Scan Timeout: 5-60 seconds

**Data Logging**
- Enable/Disable data logging during trips
- Log Interval: 1-10 seconds between data points
- Storage Duration: 7-90 days (auto-delete older)

**Alerts**
- High RPM Alert: Threshold in RPM
- Overheat Alert: Coolant temp threshold
- Low Fuel Alert: Percentage threshold

### Notifications

**Allow Notifications**
- Master toggle for all notifications

**Notification Types**:
- Maintenance Due: On/Off, Sound, Badge
- Trip Reminders: On/Off, Sound, Badge
- Inspection Alerts: On/Off, Sound, Badge
- OBD2 Alerts: On/Off, Sound, Badge
- System Messages: On/Off, Sound, Badge

**Quiet Hours**
- Enable: On/Off
- Start Time: Select time (e.g., 10:00 PM)
- End Time: Select time (e.g., 7:00 AM)
- No notifications during these hours

**Screenshot Reference**: *Capture notifications settings with toggles*

### Data & Privacy

**Data Sync**
- Sync Frequency: Manual, Every Hour, Real-time
- Sync Over Cellular: On/Off (uses mobile data)
- Sync Photos: On/Off
- Last Sync Time: Shows last successful sync

**Cache Management**
- Cache Size: Shows MB used
- Clear Cache: Removes locally cached data
- Note: Will re-download when needed

**Data Export**
- Export All Data: Download all your data as JSON/CSV
- Useful for backups or migration

**Privacy**
- Location Sharing: Control who sees your location
- Analytics: Share anonymous usage data with developer
- Crash Reports: Send crash logs to improve app

### Security

**Biometric Lock**
- Face ID/Touch ID: On/Off
- Require on App Launch: On/Off
- Require After: 1/5/15/30 minutes

**Auto-Lock**
- Lock app after: 1/2/5/10 minutes of inactivity
- Requires biometric or password to unlock

**Two-Factor Authentication**
- Enable 2FA: On/Off
- Method: SMS, Email, or Authenticator App
- Backup Codes: View and save

**Encryption**
- Data Encryption: Always enabled (FIPS-compliant)
- Photo Encryption: On/Off
- Backup Encryption: On/Off

### About

**App Information**
- Version: Current app version number
- Build: Build number
- Last Updated: Date of last update

**Legal**
- Terms of Service: Full terms document
- Privacy Policy: How we handle your data
- Licenses: Open source licenses used
- NIST Compliance: Security certifications

**Support**
- Help Center: Access in-app help
- Contact Support: Email support team
- Report Bug: Send bug report with logs
- Feature Request: Suggest new features

**Developer**
- About Us: Information about the development team
- Website: Visit our website
- Social Media: Follow us for updates

### Advanced Settings

**Developer Options** (Tap version 7 times to unlock)
- Enable Debug Logging
- Show Performance Metrics
- Network Request Logging
- Reset to Factory Settings (Warning: Deletes all data)

---

## Troubleshooting Common Issues

### Login and Account Issues

#### Cannot Log In

**Symptoms**: Incorrect password error, login button not working

**Solutions**:
1. Check email is typed correctly (no extra spaces)
2. Ensure password is correct (check caps lock)
3. Try "Forgot Password" to reset
4. Ensure internet connection is active
5. Update app to latest version
6. Contact support if account is locked

#### Not Receiving Verification Email

**Solutions**:
1. Check spam/junk folder
2. Add support@fleetapp.com to contacts
3. Wait 5-10 minutes (email may be delayed)
4. Request another verification email
5. Try different email address
6. Contact support for manual verification

#### Two-Factor Code Not Working

**Solutions**:
1. Ensure code is still valid (expires after 5 minutes)
2. Check device time is accurate (Settings > General > Date & Time > Set Automatically)
3. Request new code
4. Try backup code if available
5. Disable and re-enable 2FA

### App Performance Issues

#### App Running Slowly

**Solutions**:
1. Close and reopen app
2. Restart iPhone
3. Clear app cache: Settings > Data & Privacy > Clear Cache
4. Delete and reinstall app (backup data first!)
5. Update iOS to latest version
6. Free up device storage (need at least 1GB free)

#### App Crashes on Launch

**Solutions**:
1. Force close app and reopen
2. Restart iPhone
3. Update app to latest version
4. Update iOS to latest version
5. Delete and reinstall app
6. Contact support with crash logs

#### High Battery Usage

**Solutions**:
1. Check if trip tracking is running (stop if not needed)
2. Disable auto-trip detection if not needed
3. Reduce location accuracy: Settings > Trip Settings > Battery Saver
4. Disconnect OBD2 when not in use
5. Enable Low Power Mode in iOS
6. Check for app updates (may include battery optimizations)

### Vehicle and Data Issues

#### Vehicle Not Showing in List

**Solutions**:
1. Pull down to refresh list
2. Check filters (tap filter icon, select "All")
3. Check search box is empty
4. Ensure vehicle was saved properly
5. Log out and log back in
6. Check internet connection and sync

#### Changes Not Saving

**Solutions**:
1. Ensure all required fields are filled
2. Tap "Save" button explicitly
3. Check for error messages
4. Ensure internet connection for sync
5. Try in offline mode (saves locally)
6. Update app to latest version

#### Photos Not Uploading

**Solutions**:
1. Check internet connection (WiFi recommended for large photos)
2. Ensure sufficient device storage
3. Check photo format is supported (JPEG, PNG, HEIC)
4. Compress photos if very large
5. Settings > Data & Sync > Force Sync
6. Upload photos individually

### Trip Tracking Issues

#### GPS Not Working

**Solutions**:
1. Ensure Location Services enabled for app
2. iOS Settings > Privacy > Location Services > Fleet App > "Always" or "While Using"
3. Ensure device has GPS signal (may not work indoors)
4. Restart device
5. Reset Location & Privacy: Settings > General > Reset > Reset Location & Privacy
6. Wait for clear sky view (GPS needs satellite visibility)

#### Trip Not Recording Route

**Solutions**:
1. Ensure trip was started properly (green banner showing)
2. Check location permissions
3. Ensure device has adequate battery
4. Disable Low Power Mode (may restrict background GPS)
5. Keep app running in foreground during trip
6. Update app to latest version

#### Trip Distance Inaccurate

**Solutions**:
1. Ensure GPS has clear signal throughout trip
2. Avoid starting trip indoors
3. Allow GPS to warm up (30 seconds) before moving
4. Compare with odometer reading
5. Settings > Trip Settings > Location Accuracy > Best
6. Report persistent inaccuracies to support

### OBD2 Issues

#### Cannot Find OBD2 Adapter

**Solutions**:
1. Ensure adapter is plugged into OBD2 port
2. Ensure vehicle is in accessory mode or running
3. Check adapter has power (LED should be on)
4. Enable Bluetooth on iPhone
5. Move iPhone closer to adapter (within 3 feet)
6. Forget adapter in Bluetooth settings and re-pair
7. Try different adapter if available

#### Connection Keeps Dropping

**Solutions**:
1. Ensure adapter is fully inserted
2. Check for adapter battery (if rechargeable)
3. Reduce distance between iPhone and adapter
4. Disable other Bluetooth devices
5. Update adapter firmware (if available)
6. Try different adapter (may be faulty)

#### No Data Showing

**Solutions**:
1. Wait 30 seconds after connection
2. Ensure engine is running (some data only when running)
3. Verify vehicle is OBD2 compatible (1996 or newer)
4. Try different OBD2 adapter
5. Reset connection and reconnect

### Maintenance and Inspection Issues

#### Notifications Not Appearing

**Solutions**:
1. Check iOS Settings > Notifications > Fleet App > Allow Notifications
2. Ensure notification type enabled in app settings
3. Check Quiet Hours settings
4. Check Do Not Disturb is off
5. Log out and log back in
6. Delete and reinstall app

#### Cannot Complete Inspection

**Solutions**:
1. Ensure all inspection items have status selected
2. Check progress bar shows 100%
3. Scroll through all categories
4. Fill required fields (inspector name, etc.)
5. Try completing in offline mode
6. Contact support if error persists

### Sync and Offline Issues

#### Data Not Syncing

**Solutions**:
1. Check internet connection
2. Pull down to refresh on any list
3. Settings > Data & Sync > Sync Now
4. Log out and log back in
5. Clear cache and re-sync
6. Contact support if data appears lost

#### Stuck in Offline Mode

**Solutions**:
1. Check internet connection in other apps
2. Toggle airplane mode off then on
3. Force close app and reopen
4. Restart device
5. Forget WiFi network and reconnect
6. Update app to latest version

### Getting Help

If problems persist after trying these solutions:

**Contact Support**
- Email: support@fleetapp.com
- In-app: More > Help > Contact Support
- Include:
  - Description of issue
  - Steps to reproduce
  - Screenshots (if applicable)
  - Device model and iOS version
  - App version

**Check Status**
- Visit status.fleetapp.com for service status
- Known issues and outages posted there

**Community Forum**
- Visit community.fleetapp.com
- Search for similar issues
- Get help from other users

---

## Frequently Asked Questions (FAQ)

### General Questions

**Q1: Is the app free to use?**
A: The app is free to download. A subscription is required for advanced features like unlimited vehicles, OBD2 integration, and cloud sync. Basic features are free forever.

**Q2: Does the app work on iPad?**
A: Yes! The app is universal and optimized for both iPhone and iPad. All features work on both devices.

**Q3: Can I use the app on multiple devices?**
A: Yes, log in with the same account on multiple devices. Data syncs automatically across all devices.

**Q4: Is my data secure?**
A: Absolutely. We use FIPS-compliant encryption, NIST-certified security standards, and industry-best practices. Data is encrypted both in transit and at rest.

**Q5: Can I export my data?**
A: Yes. Go to Settings > Data & Privacy > Export All Data. You can download your data as CSV or JSON format.

### Account Questions

**Q6: How do I delete my account?**
A: Settings > Account > Delete Account. Warning: This permanently deletes all your data and cannot be undone.

**Q7: Can I change my email address?**
A: Yes. Settings > Account > Email Address > Change Email. You'll need to verify the new email address.

**Q8: What happens if I forget my password?**
A: Use "Forgot Password" on the login screen. A reset link will be emailed to you.

**Q9: How do I enable two-factor authentication?**
A: Settings > Security > Two-Factor Authentication > Enable. We highly recommend this for added security.

**Q10: Can multiple users share one account?**
A: Not recommended for security reasons. Each user should have their own account. Enterprise plans support teams.

### Vehicle Questions

**Q11: How many vehicles can I add?**
A: Free plan: Up to 5 vehicles. Pro plan: Up to 50 vehicles. Enterprise plan: Unlimited vehicles.

**Q12: Can I track vehicles in real-time?**
A: Yes, during active trips. The vehicle location updates in real-time on the map.

**Q13: What if my vehicle is older than 1996?**
A: The app works with any vehicle for basic tracking. OBD2 features require 1996 or newer (OBD2 mandate).

**Q14: Can I track equipment (non-vehicles)?**
A: Yes! Select "Equipment" as vehicle type. You can track generators, trailers, etc.

**Q15: How do I archive a vehicle without deleting it?**
A: Edit vehicle > Change status to "Out of Service". It will remain in your records but won't appear in active lists.

### Trip Tracking Questions

**Q16: Does trip tracking work offline?**
A: Yes! GPS works without internet. Trips sync when connection is restored.

**Q17: How accurate is the distance tracking?**
A: GPS accuracy is typically within 30 feet. Distance calculations are accurate within 1-2% compared to odometer.

**Q18: Does trip tracking drain battery?**
A: Trip tracking uses moderate battery. A 1-hour trip typically uses 5-10% battery. Use Settings > Trip Settings > Battery Saver mode for longer trips.

**Q19: Can I edit a trip after it's completed?**
A: Yes. Open trip from history, tap Edit, make changes, and save.

**Q20: Can I export trips for mileage reimbursement?**
A: Yes. Trips can be exported as PDF, CSV, or GPX format. Includes all details for reimbursement.

### OBD2 Questions

**Q21: What is OBD2?**
A: On-Board Diagnostics II is a standardized system in all vehicles 1996+ that monitors engine performance and emissions.

**Q22: Which OBD2 adapter should I buy?**
A: We recommend Bluetooth ELM327-based adapters. See OBD2 Setup section for specific recommendations.

**Q23: Will OBD2 void my warranty?**
A: No. Reading data from OBD2 port is non-invasive and will not void warranty. (Modifications might)

**Q24: Can OBD2 damage my vehicle?**
A: No. The app only reads data, it doesn't write or modify vehicle settings.

**Q25: Why is my OBD2 data different from dashboard?**
A: Some variation is normal due to different sensor locations or calibration. Generally should be within 5-10%.

### Maintenance Questions

**Q26: Can the app remind me when maintenance is due?**
A: Yes! Set up maintenance schedules and you'll receive notifications before due date.

**Q27: How do I track maintenance costs?**
A: Enter costs when scheduling or completing maintenance. View totals in Maintenance > Reports.

**Q28: Can I attach receipts to maintenance records?**
A: Yes. Take photos or upload existing files. All attachments stored securely.

**Q29: What if I get service done elsewhere?**
A: No problem. You can still log it in the app manually. Add service provider, cost, and notes.

**Q30: Does the app integrate with repair shops?**
A: Not currently, but we're working on integrations. For now, manually enter details from shop invoices.

### Inspection Questions

**Q31: How long does a vehicle inspection take?**
A: Typical inspection takes 10-20 minutes depending on thoroughness.

**Q32: Can I customize inspection categories?**
A: Not yet, but this feature is coming soon. Current categories cover most inspection needs.

**Q33: Are inspection photos stored locally?**
A: Yes, photos stored on device and optionally synced to cloud for backup.

**Q34: Can I share inspection reports?**
A: Yes. Export as PDF and share via email, AirDrop, or messaging.

**Q35: What happens if an inspection item fails?**
A: Failed items automatically create maintenance records (if enabled in settings). You can address them in Maintenance section.

### Offline Mode Questions

**Q36: What data is available offline?**
A: All data you've viewed while online is cached. Vehicles, trips, maintenance, inspections all accessible offline.

**Q37: Can I track trips offline?**
A: Yes! GPS works offline. Trip data saves locally and syncs when online.

**Q38: How long can I work offline?**
A: Indefinitely. Data stays cached until you clear it. Sync when convenient.

**Q39: What if I edit the same vehicle on two devices offline?**
A: App detects conflicts when syncing and prompts you to resolve (keep yours, keep server, or merge).

**Q40: Does offline mode work on cellular networks?**
A: "Offline mode" activates when no internet. On cellular, app is "online" but may sync slower than WiFi.

### Technical Questions

**Q41: Which iOS version do I need?**
A: iOS 15.0 or later. Newer features may require iOS 16 or 17.

**Q42: How much storage does the app use?**
A: App itself is ~50 MB. Data storage depends on usage: 100-500 MB typical for average fleet.

**Q43: Does the app work with CarPlay?**
A: Not currently, but this feature is planned for a future release.

**Q44: Can I use the app with Apple Watch?**
A: Not currently, but we're exploring Watch integration for quick trip start/stop.

**Q45: Does the app support Face ID and Touch ID?**
A: Yes! Enable in Settings > Security > Biometric Lock.

### Pricing and Subscriptions

**Q46: How much does a subscription cost?**
A: Free plan available. Pro plan: $9.99/month. Enterprise: Custom pricing. Visit our website for details.

**Q47: Can I try premium features before buying?**
A: Yes! 14-day free trial of Pro features when you sign up.

**Q48: How do I cancel my subscription?**
A: iOS Settings > [Your Name] > Subscriptions > Fleet Management > Cancel Subscription

**Q49: What happens to my data if I cancel?**
A: Data remains accessible in free tier (limited features). Export data before canceling if needed.

**Q50: Are there discounts for multiple vehicles?**
A: Enterprise plans offer volume discounts. Contact sales@fleetapp.com for quote.

### Support Questions

**Q51: How do I report a bug?**
A: More > Help > Report Bug. Include description, steps to reproduce, and screenshots.

**Q52: How quickly does support respond?**
A: We aim to respond within 24 hours on business days. Premium subscribers get priority support.

**Q53: Is there a user manual?**
A: Yes, this guide! Also available in-app: More > Help > User Guide.

**Q54: Are there video tutorials?**
A: Yes! More > Help > Video Tutorials. Covers all major features.

**Q55: Can I request new features?**
A: Absolutely! More > Help > Feature Request. We love hearing from users!

---

## Conclusion

Thank you for choosing Fleet Management! We hope this guide helps you get the most out of the app.

**Quick Links**:
- **Support**: support@fleetapp.com
- **Website**: www.fleetapp.com
- **Community**: community.fleetapp.com
- **Status**: status.fleetapp.com

**Stay Updated**:
- Enable notifications for app updates
- Follow us on social media
- Check our blog for tips and tricks

**We're Here to Help**:
If you have questions not covered in this guide, don't hesitate to contact support. We're committed to your success!

Happy fleet managing!

---

**Document Version**: 1.0
**Last Updated**: November 2024
**Total Words**: ~11,000+
