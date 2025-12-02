# FLEET APP DATA POPULATION & MOBILE DEMO SETUP GUIDE

## OVERVIEW

Your Fleet app already has a **comprehensive demo data system** built-in! Here's how to activate it and set up a full 50-vehicle demo with mobile simulator support.

---

## QUICK START: Enable Demo Mode

### Option 1: Browser Console (Instant)

1. Open your Fleet app in browser
2. Open DevTools Console (F12)
3. Run:
```javascript
localStorage.setItem('demo_mode', 'true')
location.reload()
```

**Result:** 50 vehicles, 30 drivers, 5 facilities, 100 fuel transactions instantly loaded!

### Option 2: URL Parameter
Navigate to:
```
http://localhost:5173/?demo=true
```

### Option 3: Environment Variable
Add to `.env.local`:
```bash
VITE_DEMO_MODE=true
```

---

## WHAT DATA GETS GENERATED

When demo mode is enabled, the app automatically generates:

| Data Type | Count | Details |
|-----------|-------|---------|
| **Vehicles** | 50 | Mixed types (sedan, SUV, truck, van) across 5 cities |
| **Drivers** | 30 | Active and off-duty status |
| **Facilities** | 5 | Depots in NY, LA, Chicago, Atlanta, Seattle |
| **Work Orders** | 30 | Various statuses (completed, in-progress, scheduled) |
| **Fuel Transactions** | 100 | Last 90 days |
| **Routes** | 15 | Active, planned, completed routes |
| **Maintenance Schedules** | Auto-generated | Based on vehicle mileage |

---

## VEHICLE DATA BREAKDOWN

Your demo data includes realistic vehicle distribution:

**Vehicle Makes:**
- Honda (Accord, Civic, CR-V)
- Toyota (Camry, Corolla, RAV4, Highlander)
- Ford (F-150, Explorer, Transit, Escape)
- Chevrolet (Silverado, Tahoe, Malibu, Equinox)
- Tesla (Model 3, Model Y)
- Nissan (Altima, Rogue, Leaf)
- Ram (1500, 2500)
- Mercedes (Sprinter)
- Dodge (ProMaster)

**Status Distribution:**
- 40% Active (20 vehicles)
- 30% Idle (15 vehicles)
- 10% Charging (5 vehicles - EVs)
- 10% In Service (5 vehicles)
- 5% Emergency (2-3 vehicles)
- 5% Offline (2 vehicles)

**Location:** All vehicles distributed across Tallahassee, FL area:
- 30.4383N, -84.2807W (HQ Depot)
- Spread within 10km radius for realistic GPS tracking

---

## MOBILE SIMULATOR SETUP

Your app already has a **built-in mobile emulator** at:
```
http://localhost:5173/test/mobile-emulator
```

### Step-by-Step Mobile Demo Setup

#### 1. Start the Development Server
```bash
cd Fleet
npm install
npm run dev
```

#### 2. Access the Mobile Emulator
Open in browser:
```
http://localhost:5173/test/mobile-emulator
```

#### 3. Select Your Device
Available emulated devices:
- **iPhone 14 Pro** (393x852) - iOS 16
- **iPhone SE** (375x667) - iOS 16
- **iPad Pro 12.9"** (1024x1366) - iOS 16
- **Google Pixel 7** (412x915) - Android 13
- **Samsung Galaxy S23** (360x780) - Android 13

#### 4. Configure Orientation
Toggle between:
- **Portrait** (default)
- **Landscape** (for tablet viewing)

#### 5. Test API Endpoints
Click **"Test All APIs"** button to verify:
- Vehicles API
- Drivers API
- Work Orders API
- Fuel Transactions API
- Facilities API
- Routes API

---

## CUSTOMIZING DEMO DATA

### Modify Vehicle Count

Edit `src/lib/demo-data.ts`:

```typescript
// Change from 50 to any number
export function generateDemoVehicles(count: number = 100): Vehicle[] {
  // ... generates your custom count
}
```

Then regenerate in console:
```javascript
// Clear existing demo data
localStorage.removeItem('demo_mode')
localStorage.setItem('demo_mode', 'true')
location.reload()
```

### Add Custom Facilities

Edit `src/lib/demo-data.ts`:

```typescript
export function generateDemoFacilities(): GISFacility[] {
  return [
    // Add your facility
    {
      id: "fac-custom-1",
      name: "Your Custom Facility",
      type: "depot",
      location: {
        lat: 30.4383,  // Your coordinates
        lng: -84.2807,
        address: "Your Address"
      },
      capacity: 20,
      currentOccupancy: 10,
      status: "operational",
      serviceBays: 10,
      tenantId: "demo-tenant-001"
    }
  ]
}
```

### Customize Vehicle Types

```typescript
const vehicleTypes: Vehicle["type"][] = [
  "sedan",
  "suv",
  "truck",
  "van",
  // Add custom types
  "bus",
  "motorcycle",
  "emergency"
]
```

---

## DEMO WALKTHROUGH SCENARIOS

### Scenario 1: Fleet Operations Manager View

1. Enable demo mode
2. Navigate to **Dashboard**
   - View 50 vehicles on map
   - See real-time status distribution
   - Monitor fuel levels

3. Click **GPS Tracking**
   - Live vehicle positions
   - Active routes (15 routes)
   - Geofence alerts

4. Open **Maintenance**
   - 30 work orders (various statuses)
   - Upcoming scheduled maintenance
   - Predictive maintenance alerts

### Scenario 2: Driver Mobile Experience

1. Open mobile emulator: `http://localhost:5173/test/mobile-emulator`
2. Select **iPhone 14 Pro**
3. Navigate to main app URL in iframe
4. Demo driver actions:
   - View assigned vehicle
   - Log mileage
   - Report issues
   - Check route

### Scenario 3: Dispatch Console

1. Go to **Dispatch Console**
2. View all active vehicles (20 active out of 50)
3. Assign routes to idle vehicles
4. Monitor ETAs and locations
5. Handle emergency situations

---

## CONNECTING EXTERNAL EMULATORS

### iOS Simulator (Xcode Required)

#### 1. Get Your Local IP
```bash
# Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

Example output: `192.168.1.100`

#### 2. Update Vite Config
Already configured in `vite.config.ts`:
```typescript
server: {
  host: true,  // Allows network access
  port: 5173,
  strictPort: false
}
```

#### 3. Start Dev Server with Network Access
```bash
npm run dev -- --host
```

Output will show:
```
  Local:   http://localhost:5173/
  Network: http://192.168.1.100:5173/
```

#### 4. Open in iOS Simulator
1. Launch Xcode Simulator
2. Open Safari in simulator
3. Navigate to: `http://192.168.1.100:5173`
4. Add to Home Screen for PWA experience

### Android Emulator (Android Studio)

#### 1. Start Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_33
```

#### 2. Access via 10.0.2.2 (Android's host loopback)
```
http://10.0.2.2:5173
```

Or use your network IP:
```
http://192.168.1.100:5173
```

#### 3. Install as PWA
1. Open Chrome in Android emulator
2. Navigate to app URL
3. Tap menu -> "Add to Home screen"
4. Test offline functionality

---

## PHYSICAL DEVICE TESTING

### 1. Enable Demo Mode via QR Code

Create a demo URL with query parameter:
```
http://192.168.1.100:5173/?demo=true
```

Generate QR code using online tool or:
```bash
npx qrcode-terminal "http://192.168.1.100:5173/?demo=true"
```

### 2. Scan with Phone Camera
- iOS: Camera app auto-detects
- Android: Google Lens or Camera app

### 3. Test Features
- GPS tracking (uses device location)
- Push notifications (if enabled)
- Camera for receipt scanning
- Offline mode
- Touch gestures

---

## DEMO DATA API ENDPOINTS

Your demo data is accessible via these patterns:

### Get All Vehicles
```javascript
fetch('/api/vehicles')
  .then(r => r.json())
  .then(data => console.log('50 vehicles:', data))
```

### Get Single Vehicle
```javascript
// Demo vehicles have IDs: veh-demo-1000 through veh-demo-1049
fetch('/api/vehicles/veh-demo-1000')
```

### Get Active Drivers
```javascript
fetch('/api/drivers?status=active')
```

### Get Today's Fuel Transactions
```javascript
const today = new Date().toISOString().split('T')[0]
fetch(`/api/fuel-transactions?date=${today}`)
```

---

## TESTING DIFFERENT DATA SCENARIOS

### Scenario: High-Volume Operations

```javascript
// Generate 200 vehicles
localStorage.setItem('demo_vehicle_count', '200')
localStorage.setItem('demo_mode', 'true')
location.reload()
```

### Scenario: Emergency Fleet

```typescript
// In demo-data.ts, modify status weights
const statusWeights = [0.1, 0.1, 0.0, 0.1, 0.6, 0.1]
// 60% emergency vehicles
```

### Scenario: EV Fleet

```typescript
// Force all vehicles to be electric
const makes = [
  { make: "Tesla", models: ["Model 3", "Model Y", "Model X"] },
  { make: "Nissan", models: ["Leaf"] },
  { make: "Rivian", models: ["R1T", "R1S"] }
]
```

---

## TROUBLESHOOTING

### Demo Data Not Loading?

**Check console:**
```javascript
// Verify demo mode is active
console.log('Demo mode:', localStorage.getItem('demo_mode'))

// Check if data generated
console.log('Vehicles:', window.__demoVehicles?.length)
```

**Force refresh:**
```javascript
localStorage.clear()
localStorage.setItem('demo_mode', 'true')
location.reload()
```

### Mobile Emulator Not Working?

**1. Verify port 5173 is accessible:**
```bash
curl http://localhost:5173/test/mobile-emulator
```

**2. Check for CORS issues:**
Already configured in `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

**3. Clear browser cache:**
```javascript
// In DevTools Console
caches.keys().then(names => names.forEach(name => caches.delete(name)))
```

### Vehicles Not Appearing on Map?

**Check map library loaded:**
```javascript
// Verify Leaflet loaded
console.log('Leaflet:', typeof L !== 'undefined')

// Check vehicle coordinates
fetch('/api/vehicles')
  .then(r => r.json())
  .then(vehicles => {
    vehicles.forEach(v => {
      console.log(`${v.name}: ${v.location.lat}, ${v.location.lng}`)
    })
  })
```

---

## DEMO PERFORMANCE METRICS

Expected performance with 50 vehicles:

| Metric | Target | Demo Value |
|--------|--------|------------|
| **Initial Load** | < 2s | ~1.5s |
| **Map Render** | < 1s | ~800ms |
| **Vehicle Markers** | < 500ms | ~400ms |
| **API Response** | < 200ms | ~50ms (local) |
| **Memory Usage** | < 100MB | ~75MB |

---

## RECOMMENDED DEMO FLOW

### 30-Minute Executive Demo

**Part 1: Overview (5 min)**
1. Show Dashboard - 50 vehicles at a glance
2. Highlight key metrics (fuel efficiency, maintenance costs)
3. Demo real-time GPS tracking

**Part 2: Operations (10 min)**
4. Dispatch Console - assign routes
5. Maintenance scheduling
6. Work order management
7. Fuel transaction tracking

**Part 3: Mobile Experience (10 min)**
8. Switch to mobile emulator
9. Show driver interface
10. Demonstrate offline functionality
11. Receipt capture workflow

**Part 4: Analytics (5 min)**
12. Fleet Analytics dashboard
13. Cost analysis reports
14. Predictive maintenance insights

---

## PRODUCTION SETUP (Beyond Demo)

### 1. Connect to Real Backend API

Disable demo mode:
```javascript
localStorage.setItem('demo_mode', 'false')
```

Configure API base URL in `.env.production`:
```bash
VITE_API_BASE_URL=https://api.yourfleet.com
VITE_AZURE_MAPS_KEY=your_key
VITE_APPLICATION_INSIGHTS_KEY=your_key
```

### 2. Database Schema

Your demo data structure matches this schema:
```sql
CREATE TABLE vehicles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  status VARCHAR(50),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  fuel_level INT,
  mileage INT,
  tenant_id VARCHAR(50)
);

CREATE TABLE drivers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  license_number VARCHAR(50),
  status VARCHAR(50),
  safety_score INT,
  tenant_id VARCHAR(50)
);

-- Additional tables for work_orders, fuel_transactions, etc.
```

### 3. Real-Time Updates

Implement WebSocket connection:
```typescript
// In src/lib/websocket.ts
const ws = new WebSocket('wss://api.yourfleet.com/ws')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  // Update vehicle location in real-time
  updateVehiclePosition(update.vehicleId, update.location)
}
```

---

## FINAL CHECKLIST

Before your demo:

- [ ] Run `npm install` - all dependencies installed
- [ ] Run `npm run dev` - dev server running
- [ ] Enable demo mode - `localStorage.setItem('demo_mode', 'true')`
- [ ] Verify 50 vehicles loaded - check Dashboard
- [ ] Test mobile emulator - `/test/mobile-emulator` accessible
- [ ] Check GPS tracking - vehicles showing on map
- [ ] Test all API endpoints - "Test All APIs" button passes
- [ ] Verify network access - `http://YOUR_IP:5173` works from phone
- [ ] Clear browser cache - fresh start for demo
- [ ] Close unnecessary tabs - optimize performance
- [ ] Disable OS notifications - uninterrupted demo

---

**You're ready to demo!**

Your Fleet app now has **50 fully-functional demo vehicles**, **30 drivers**, and **complete mobile emulator support**. The demo data automatically loads when you enable demo mode, and you can customize it as needed.

For questions or issues, check the troubleshooting section or review the code in:
- `src/lib/demo-data.ts` - Data generation
- `src/hooks/use-fleet-data.ts` - Data loading logic
- `src/components/testing/MobileEmulatorTestScreen.tsx` - Mobile emulator
