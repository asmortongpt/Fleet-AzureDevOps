# Connected Vehicle Integration Guide
## Smartcar, OEM APIs, OBD2 & Telematics

---

## 🚗 Overview

Modern vehicles are "connected" - they have APIs that provide real-time data and remote control capabilities. Fleet Manager can integrate with multiple connected vehicle platforms to provide:

- **Real-time vehicle data** (location, fuel, battery, odometer)
- **Remote control** (lock/unlock, start/stop, charge control)
- **Vehicle diagnostics** (engine codes, tire pressure, maintenance alerts)
- **Keyless entry** (BLE, NFC, or API-based)
- **Automated data collection** (eliminate manual entry)

---

## 🔌 Integration Options

### Option 1: Smartcar API ⭐ RECOMMENDED
**Coverage**: 50+ car brands, 100+ million vehicles
**Ease**: Single API for multiple brands
**Cost**: $0.005 - $0.03 per vehicle per day

### Option 2: OEM Direct APIs
**Coverage**: Brand-specific (Tesla, Ford, GM, etc.)
**Ease**: Requires separate integration per brand
**Cost**: Varies by OEM (some free, some paid)

### Option 3: OBD2 Adapters
**Coverage**: All vehicles 1996+ (US), 2001+ (EU)
**Ease**: Hardware required, Bluetooth pairing
**Cost**: $20-100 per adapter

### Option 4: Telematics Systems
**Coverage**: Installed fleet telematics devices
**Ease**: Integration with existing systems
**Cost**: Included if already deployed

---

## 📊 Comparison Matrix

| Feature | Smartcar | OEM APIs | OBD2 | Telematics |
|---------|----------|----------|------|------------|
| **Brands Supported** | 50+ | 1 per API | All (1996+) | All |
| **Real-Time Location** | ✅ | ✅ | ❌ | ✅ |
| **Fuel/Battery Level** | ✅ | ✅ | ✅ | ✅ |
| **Odometer** | ✅ | ✅ | ✅ | ✅ |
| **Engine Diagnostics** | ✅ | ✅ | ✅ | ✅ |
| **Remote Lock/Unlock** | ✅ | ✅ | ❌ | ❌ |
| **Remote Start** | ✅ | ✅ | ❌ | ❌ |
| **EV Charge Control** | ✅ | ✅ | ❌ | ❌ |
| **Tire Pressure** | ✅ | ✅ | ✅ | ✅ |
| **Setup Complexity** | Easy | Medium | Easy | Hard |
| **Recurring Cost** | Low | Variable | None | High |
| **Hardware Required** | ❌ | ❌ | ✅ | ✅ |
| **Fleet Scale** | Unlimited | Unlimited | Limited | Unlimited |

**Recommendation**: Start with **Smartcar** for unified API, add **OBD2** for older vehicles without connected features.

---

## 🔗 1. Smartcar API Integration

### What is Smartcar?
Smartcar is a unified API platform that connects to 50+ car brands through official OEM APIs. It eliminates the need to integrate with each manufacturer separately.

**Supported Brands** (50+):
- **Tesla**, Ford, GM, BMW, Mercedes-Benz, Audi, Volkswagen
- Honda, Toyota, Nissan, Hyundai, Kia, Subaru, Volvo
- Porsche, Jaguar, Land Rover, Lexus, Cadillac, Chevrolet
- And 30+ more...

### Available Data & Controls

#### Vehicle Data (Read)
- **Location**: Real-time GPS coordinates
- **Odometer**: Total mileage
- **Fuel**: Tank level (%), estimated range
- **Battery**: State of charge (EVs), voltage (12V)
- **Tire Pressure**: All 4 tires in PSI
- **Engine Oil**: Oil life percentage
- **VIN**: Vehicle identification number
- **Make/Model/Year**: Vehicle details

#### Remote Controls (Write)
- **Lock/Unlock**: Remote door lock control
- **Start/Stop Engine**: Remote engine start (if supported)
- **Charge Control**: Start/stop charging (EVs)
- **Climate**: Pre-condition cabin temperature
- **Horn & Lights**: Flash lights, honk horn (locate vehicle)

### Implementation

#### Step 1: Sign Up for Smartcar
1. Go to [smartcar.com/dashboard](https://smartcar.com/dashboard)
2. Create account and get API credentials:
   - **Client ID**: `[Your Client ID]`
   - **Client Secret**: `[Your Secret]`
   - **Redirect URI**: `https://fleet.capitaltechalliance.com/api/smartcar/callback`

#### Step 2: Install SDK

**Backend (Node.js)**:
```bash
npm install smartcar --save
```

**Mobile (iOS)**:
```swift
// Add to Podfile
pod 'Smartcar', '~> 5.0'
```

**Mobile (Android)**:
```gradle
// Add to build.gradle
implementation 'com.smartcar.sdk:smartcar-auth:4.0.0'
```

#### Step 3: Implement OAuth Flow

**Backend API Route** (`api/src/routes/smartcar.ts`):
```typescript
import Smartcar from 'smartcar';

const client = new Smartcar.AuthClient({
  clientId: process.env.SMARTCAR_CLIENT_ID,
  clientSecret: process.env.SMARTCAR_CLIENT_SECRET,
  redirectUri: process.env.SMARTCAR_REDIRECT_URI,
  mode: 'live' // or 'test' for development
});

// Step 1: Generate OAuth URL
router.get('/connect', (req, res) => {
  const scope = [
    'read_vehicle_info',
    'read_location',
    'read_odometer',
    'read_fuel',
    'read_battery',
    'read_charge',
    'read_engine_oil',
    'read_tire_pressure',
    'control_security', // lock/unlock
    'control_charge',   // EV charging
  ];

  const authUrl = client.getAuthUrl({
    scope,
    state: req.user.id, // Your user ID for security
  });

  res.json({ authUrl });
});

// Step 2: Handle OAuth Callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // Exchange code for access token
  const access = await client.exchangeCode(code);

  // Get vehicle IDs
  const { vehicles } = await access.getVehicles();

  // Store tokens in database
  await db.query(
    'INSERT INTO vehicle_connections (user_id, provider, vehicle_id, access_token, refresh_token) VALUES ($1, $2, $3, $4, $5)',
    [state, 'smartcar', vehicles[0], access.accessToken, access.refreshToken]
  );

  res.redirect('/dashboard?connected=success');
});

// Step 3: Fetch Vehicle Data
router.get('/vehicle/:id/data', async (req, res) => {
  const { vehicleId } = req.params;

  // Load tokens from database
  const tokens = await db.query(
    'SELECT access_token, refresh_token FROM vehicle_connections WHERE vehicle_id = $1',
    [vehicleId]
  );

  const vehicle = new Smartcar.Vehicle(tokens.access_token);

  // Fetch all data in parallel
  const [location, odometer, fuel, battery, tirePressure] = await Promise.all([
    vehicle.location(),
    vehicle.odometer(),
    vehicle.fuel(),
    vehicle.battery(),
    vehicle.tirePressure()
  ]);

  res.json({
    location: location.data.latitude, longitude: location.data.longitude,
    odometer: odometer.data.distance,
    fuel: fuel.data.percentRemaining,
    battery: battery.data.percentRemaining,
    tirePressure: tirePressure.data
  });
});

// Step 4: Remote Control Example
router.post('/vehicle/:id/lock', async (req, res) => {
  const { vehicleId } = req.params;
  const { action } = req.body; // 'lock' or 'unlock'

  const tokens = await db.query(
    'SELECT access_token FROM vehicle_connections WHERE vehicle_id = $1',
    [vehicleId]
  );

  const vehicle = new Smartcar.Vehicle(tokens.access_token);

  if (action === 'lock') {
    await vehicle.lock();
  } else {
    await vehicle.unlock();
  }

  res.json({ success: true, action });
});
```

#### Step 4: Mobile Integration

**iOS (Swift)**:
```swift
import SmartcarAuth

class SmartcarConnectView: View {
    @State private var smartcar = SmartcarAuth(
        clientId: "your-client-id",
        redirectUri: "fleet://smartcar/callback",
        scope: ["read_vehicle_info", "read_location", "control_security"],
        completionHandler: { (err, code, state, virtualKeyUrl) in
            if let code = code {
                // Send code to backend for token exchange
                self.exchangeCodeForToken(code)
            }
        }
    )

    var body: some View {
        Button("Connect Vehicle") {
            smartcar.launchAuthFlow()
        }
    }

    func exchangeCodeForToken(_ code: String) {
        // Call your backend API
        API.post("/smartcar/callback", params: ["code": code])
    }
}
```

**Android (Kotlin)**:
```kotlin
import com.smartcar.sdk.SmartcarAuth

class SmartcarConnectActivity : AppCompatActivity() {
    private lateinit var smartcarAuth: SmartcarAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        smartcarAuth = SmartcarAuth.Builder()
            .clientId("your-client-id")
            .redirectUri("fleet://smartcar/callback")
            .scope(arrayOf("read_vehicle_info", "read_location", "control_security"))
            .build()

        connectButton.setOnClickListener {
            smartcarAuth.launchAuthFlow(this)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        smartcarAuth.handleResponse(requestCode, resultCode, data)
            .onSuccess { code ->
                // Send code to backend
                exchangeCodeForToken(code)
            }
    }
}
```

### Smartcar Webhooks (Real-Time Updates)

Enable webhooks to receive real-time events:

```typescript
// Backend webhook endpoint
router.post('/smartcar/webhook', async (req, res) => {
  const event = req.body;

  switch (event.eventName) {
    case 'vehicleDisconnected':
      // Vehicle connection lost, notify user
      await notifyUser(event.vehicleId, 'Connection lost');
      break;

    case 'tokensRefreshed':
      // Update tokens in database
      await updateTokens(event.vehicleId, event.tokens);
      break;

    case 'lowFuel':
      // Custom alert: fuel < 20%
      await sendAlert(event.vehicleId, 'Low fuel warning');
      break;
  }

  res.sendStatus(200);
});
```

### Pricing

Smartcar charges per vehicle per day:
- **Connect (Read-Only)**: $0.005/vehicle/day (~$1.80/year)
- **Control (Remote Commands)**: $0.03/vehicle/day (~$10.95/year)
- **First 5 vehicles**: FREE for development

**Example**: 100 vehicles with full control = $3/day = $1,095/year

---

## 🏭 2. OEM Direct APIs

For specific brands, you may want direct OEM integration for additional features or lower costs.

### Tesla API (Unofficial)
**Coverage**: All Tesla vehicles
**Features**: Most comprehensive API (no official SDK)

**Available Data**:
- Real-time location, speed, heading
- Battery state of charge, range
- Climate temperature (interior/exterior)
- Charge rate, time to full charge
- Odometer, trip data
- Sentry mode status

**Remote Controls**:
- Lock/unlock doors
- Start/stop charging
- Set charge limit
- Climate control (heat/cool)
- Flash lights, honk horn
- Open/close trunk, frunk
- Summon (move vehicle short distance)

**Implementation**:
```typescript
import TeslaJS from 'teslajs';

// Step 1: Authenticate
const options = { email: 'user@example.com', password: 'password' };
const result = await TeslaJS.loginAsync(options);

// Step 2: Get vehicle list
const vehicles = await TeslaJS.vehiclesAsync(result);

// Step 3: Wake vehicle (if sleeping)
await TeslaJS.wakeUpAsync({ authToken: result.authToken, vehicleID: vehicles[0].id });

// Step 4: Get vehicle data
const vehicleData = await TeslaJS.vehicleDataAsync({
  authToken: result.authToken,
  vehicleID: vehicles[0].id
});

console.log({
  battery: vehicleData.charge_state.battery_level,
  range: vehicleData.charge_state.battery_range,
  location: {
    lat: vehicleData.drive_state.latitude,
    lng: vehicleData.drive_state.longitude
  },
  odometer: vehicleData.vehicle_state.odometer
});

// Step 5: Remote control
await TeslaJS.startChargeAsync({ authToken: result.authToken, vehicleID: vehicles[0].id });
await TeslaJS.doorLockAsync({ authToken: result.authToken, vehicleID: vehicles[0].id });
```

**NPM Package**: `teslajs` or `tesla-api`

### FordPass (Ford/Lincoln)
**Coverage**: 2017+ Ford/Lincoln with FordPass Connect
**Official SDK**: Yes (OAuth 2.0)

**Available Data**:
- Location, odometer, fuel level
- Oil life, tire pressure
- Remote start status
- Door lock status

**Implementation**:
```typescript
import { FordConnect } from '@fordpass/api';

const ford = new FordConnect({
  username: 'user@example.com',
  password: 'password',
  clientId: process.env.FORD_CLIENT_ID,
  clientSecret: process.env.FORD_CLIENT_SECRET
});

await ford.auth();
const vehicles = await ford.getVehicles();
const status = await ford.getVehicleStatus(vehicles[0].vin);

console.log({
  fuel: status.fuel.fuelLevel,
  location: status.gps,
  odometer: status.odometer.value,
  tirePressure: status.tirePressure
});

// Remote commands
await ford.lock(vehicles[0].vin);
await ford.startEngine(vehicles[0].vin);
```

### GM OnStar (Chevrolet, GMC, Cadillac, Buick)
**Coverage**: 2015+ GM vehicles with OnStar
**Official SDK**: Yes (OnStar RemoteLink API)

**Available Data**:
- Location, fuel level, odometer
- Tire pressure, oil life
- Diagnostic trouble codes
- Door/window status

### Mercedes me
**Coverage**: 2018+ Mercedes-Benz with Mercedes me Connect
**Official SDK**: Yes

### BMW ConnectedDrive
**Coverage**: 2014+ BMW vehicles with ConnectedDrive
**Official SDK**: Yes

---

## 🔌 3. OBD2 Adapter Integration

For older vehicles without built-in connectivity, use OBD2 Bluetooth/Wi-Fi adapters.

### Recommended Adapters

1. **LELink Bluetooth OBD2** ($25)
   - Bluetooth 4.0 (BLE)
   - Works with iOS and Android
   - Real-time data streaming

2. **Veepeak OBDCheck BLE+** ($30)
   - Dual Bluetooth + BLE
   - Battery voltage monitoring
   - Supports multiple protocols

3. **OBDLink MX+** ($100)
   - Professional-grade
   - Wi-Fi connectivity
   - Fastest data rate
   - Heavy-duty commercial fleet use

### Available Data from OBD2

**Engine**:
- RPM, engine load, coolant temp
- Fuel system status, fuel pressure
- Intake air temperature
- Throttle position

**Fuel Consumption**:
- Short-term fuel trim
- Long-term fuel trim
- MAF (Mass Air Flow) sensor
- Calculate MPG in real-time

**Emissions**:
- Oxygen sensor readings
- Catalyst temperature
- Evaporative system
- Diagnostic trouble codes (DTCs)

**Transmission**:
- Transmission temp (if supported)
- Gear position (if supported)

**Limits of OBD2**:
- ❌ No GPS location (need phone GPS)
- ❌ No remote control (read-only)
- ❌ No odometer (must calculate from speed/time)
- ❌ Requires Bluetooth pairing for each vehicle

### Implementation

**iOS (Swift) with CoreBluetooth**:
```swift
import CoreBluetooth

class OBD2Manager: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    var centralManager: CBCentralManager!
    var obd2Peripheral: CBPeripheral?

    func scanForOBD2() {
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            centralManager.scanForPeripherals(withServices: nil)
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        if peripheral.name?.contains("OBD") ?? false {
            obd2Peripheral = peripheral
            centralManager.connect(peripheral)
        }
    }

    func sendOBD2Command(_ command: String) {
        // Send AT command to OBD2 adapter
        // Example: "010C" = Request RPM
        let data = command.data(using: .utf8)
        obd2Peripheral?.writeValue(data!, for: characteristic, type: .withResponse)
    }

    func readRPM() {
        sendOBD2Command("010C") // PID for RPM
        // Response: 41 0C XX XX
        // RPM = ((A * 256) + B) / 4
    }
}
```

**Android (Kotlin) with Bluetooth**:
```kotlin
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothSocket

class OBD2Manager {
    private val adapter = BluetoothAdapter.getDefaultAdapter()
    private var socket: BluetoothSocket? = null

    fun connect(deviceAddress: String) {
        val device = adapter.getRemoteDevice(deviceAddress)
        socket = device.createRfcommSocketToServiceRecord(UUID.fromString("00001101-0000-1000-8000-00805F9B34FB"))
        socket?.connect()
    }

    fun sendCommand(command: String): String {
        socket?.outputStream?.write("$command\r".toByteArray())
        val response = ByteArray(1024)
        socket?.inputStream?.read(response)
        return String(response)
    }

    fun readRPM(): Int {
        val response = sendCommand("010C")
        // Parse response: "41 0C XX XX"
        val bytes = response.split(" ")
        val a = bytes[2].toInt(16)
        val b = bytes[3].toInt(16)
        return ((a * 256) + b) / 4
    }
}
```

### OBD2 PID Cheat Sheet

```
| PID  | Description | Formula |
|------|-------------|---------|
| 010C | Engine RPM | ((A*256)+B)/4 |
| 010D | Vehicle Speed | A km/h |
| 0105 | Coolant Temp | A-40 °C |
| 010F | Intake Air Temp | A-40 °C |
| 0111 | Throttle Position | A*100/255 % |
| 012F | Fuel Tank Level | A*100/255 % |
| 0104 | Engine Load | A*100/255 % |
| 0142 | Control Module Voltage | ((A*256)+B)/1000 V |
```

**Full PID List**: [https://en.wikipedia.org/wiki/OBD-II_PIDs](https://en.wikipedia.org/wiki/OBD-II_PIDs)

---

## 📡 4. Fleet Telematics Integration

If you already have fleet telematics devices installed (Geotab, Samsara, Verizon Connect, etc.), integrate with their APIs.

### Geotab
- **API**: REST API with SDK
- **Data**: GPS, fuel, idling, harsh driving, maintenance
- **Cost**: Included with Geotab subscription

### Samsara
- **API**: REST API + Webhooks
- **Data**: GPS, engine hours, fuel, temperature sensors
- **Features**: Dash cam footage, driver behavior

### Verizon Connect (Fleetmatics)
- **API**: REST API
- **Data**: GPS, fuel, diagnostics, driver logs

### Implementation (Geotab Example):
```typescript
import { API } from 'mg-api-js';

const api = new API('username', 'password', 'database', 'my-server');

await api.authenticate();

// Get all vehicles
const vehicles = await api.call('Get', {
  typeName: 'Device'
});

// Get vehicle location
const location = await api.call('Get', {
  typeName: 'DeviceStatusInfo',
  search: {
    deviceSearch: { id: vehicles[0].id }
  }
});

console.log({
  latitude: location[0].latitude,
  longitude: location[0].longitude,
  speed: location[0].speed
});
```

---

## 🎯 Use Cases & Business Value

### 1. Automated Data Collection
**Without API**: Driver manually logs fuel, mileage, location
**With API**: All data automatically synced every 5 minutes

**Time Savings**: 30 minutes/driver/day × 100 drivers = 50 hours/day
**Cost Savings**: 50 hours × $20/hour = $1,000/day = $365,000/year

### 2. Real-Time Vehicle Health Monitoring
**Without API**: Vehicle breaks down, driver calls dispatch
**With API**: Predictive maintenance alerts before breakdown

**Cost Savings**:
- Prevent 50 breakdowns/year
- $500/tow + $1,000/repair + $500/downtime = $2,000/incident
- **Total**: $100,000/year

### 3. Remote Lock/Unlock (Keyless Entry)
**Without API**: Driver forgets keys, needs spare key delivered
**With API**: Dispatch unlocks vehicle remotely via app

**Time Savings**: 2 hours/incident × 20 incidents/year = 40 hours
**Cost Savings**: 40 hours × $50/hour = $2,000/year

### 4. Geofence Alerts (Unauthorized Use)
**Without API**: No visibility into after-hours vehicle use
**With API**: Instant alerts when vehicle leaves geofence

**Theft Prevention**: Recover stolen vehicles within hours
**Misuse Prevention**: Detect personal use of fleet vehicles

### 5. EV Charge Management
**Without API**: Drivers manually track charging costs
**With API**: Automatically log kWh, cost, location, reimbursement

**Time Savings**: 15 min/charge × 500 charges/month = 125 hours/month
**Cost Savings**: 125 hours × $20/hour = $2,500/month = $30,000/year

---

## 🏗️ Recommended Architecture

### Database Schema

```sql
-- Connected vehicles table
CREATE TABLE vehicle_connections (
  id SERIAL PRIMARY KEY,
  vehicle_id INT REFERENCES vehicles(id),
  provider VARCHAR(50) NOT NULL, -- 'smartcar', 'tesla', 'obd2', 'geotab'
  external_id VARCHAR(255), -- Provider's vehicle ID
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  last_sync TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vehicle telemetry data
CREATE TABLE vehicle_telemetry (
  id SERIAL PRIMARY KEY,
  vehicle_id INT REFERENCES vehicles(id),
  timestamp TIMESTAMP NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed_mph INT,
  odometer_miles INT,
  fuel_percent DECIMAL(5, 2),
  battery_percent DECIMAL(5, 2),
  engine_rpm INT,
  coolant_temp_f INT,
  tire_pressure_fl INT,
  tire_pressure_fr INT,
  tire_pressure_rl INT,
  tire_pressure_rr INT,
  is_charging BOOLEAN,
  charge_rate_kw DECIMAL(5, 2),
  range_miles INT,
  dtc_codes TEXT[], -- Diagnostic trouble codes
  provider VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telemetry_vehicle_time ON vehicle_telemetry(vehicle_id, timestamp DESC);
CREATE INDEX idx_telemetry_timestamp ON vehicle_telemetry(timestamp DESC);
```

### Background Sync Job

```typescript
// Run every 5 minutes via cron
async function syncVehicleData() {
  const connections = await db.query(
    'SELECT * FROM vehicle_connections WHERE status = $1',
    ['active']
  );

  for (const conn of connections) {
    try {
      let telemetry;

      switch (conn.provider) {
        case 'smartcar':
          telemetry = await fetchSmartcarData(conn);
          break;
        case 'tesla':
          telemetry = await fetchTeslaData(conn);
          break;
        case 'obd2':
          telemetry = await fetchOBD2Data(conn);
          break;
        case 'geotab':
          telemetry = await fetchGeotabData(conn);
          break;
      }

      await db.query(
        'INSERT INTO vehicle_telemetry (...) VALUES (...)',
        [conn.vehicle_id, telemetry.latitude, ...]
      );

      await db.query(
        'UPDATE vehicle_connections SET last_sync = NOW() WHERE id = $1',
        [conn.id]
      );

    } catch (error) {
      console.error(`Sync failed for vehicle ${conn.vehicle_id}:`, error);

      if (error.message.includes('token_expired')) {
        await refreshToken(conn);
      }
    }
  }
}
```

### Mobile UI Integration

**Vehicle Connect Flow**:
```
1. Settings → Connected Vehicles → "Connect New Vehicle"
2. Select provider (Smartcar, Tesla, OBD2)
3. If Smartcar/Tesla: OAuth flow → User signs in to car account
4. If OBD2: Bluetooth scan → Pair with adapter
5. Success → Vehicle data starts syncing
6. Dashboard shows real-time fuel, location, battery
```

---

## 💰 Cost Analysis

### Per-Vehicle Annual Cost

| Provider | Setup Cost | Annual Cost | Notes |
|----------|-----------|-------------|-------|
| **Smartcar** | $0 | $2-11/vehicle | $1.80 (read-only) to $10.95 (control) |
| **Tesla API** | $0 | $0 | Unofficial, may break |
| **FordPass** | $0 | $0-120 | Free for 3 years, then $10/month |
| **OBD2** | $25-100 | $0 | One-time adapter cost |
| **Geotab** | $150 | $300 | Hardware + subscription |
| **Samsara** | $200 | $480 | Hardware + subscription |

**Recommended Strategy**:
- Smartcar for newer vehicles (2016+): ~$5/vehicle/year
- OBD2 for older vehicles (1996-2015): $30 one-time
- Average fleet cost: **$10-20/vehicle/year**

---

## 🚀 Implementation Plan

### Phase 1: Smartcar Integration (2 weeks)
1. **Week 1**: Backend API
   - OAuth flow implementation
   - Token storage and refresh
   - Vehicle data endpoints
   - Webhook handlers

2. **Week 2**: Mobile integration
   - iOS SDK integration
   - Android SDK integration
   - Connect flow UI
   - Dashboard widgets

### Phase 2: OBD2 Support (1 week)
1. Bluetooth pairing flow
2. OBD2 PID commands
3. Real-time data streaming
4. Background sync

### Phase 3: OEM Direct APIs (2 weeks)
1. Tesla API integration
2. FordPass integration
3. Provider-specific features
4. Unified data model

### Phase 4: Advanced Features (2 weeks)
1. Predictive maintenance alerts
2. Geofence management
3. Remote control UI
4. EV charge optimization

**Total Timeline**: 7-8 weeks
**Total Cost**: $15,000-20,000 (development) + $10-20/vehicle/year (API costs)
**ROI**: 3-6 months

---

## 📱 Mobile App Features Enabled

### Dashboard Widgets
- **Real-Time Map**: Show all vehicles with live location
- **Fuel/Battery**: Color-coded fuel levels (red < 20%, yellow < 50%, green > 50%)
- **Odometer**: Automatic mileage tracking
- **Diagnostics**: Engine warning lights, maintenance alerts

### Remote Control
- **Lock/Unlock**: Tap button to lock/unlock remotely
- **Engine Start**: Pre-start engine for warm-up
- **Charge Control**: Start/stop EV charging
- **Locate Vehicle**: Flash lights, honk horn

### Notifications
- **Low Fuel**: Alert when fuel < 20%
- **Check Engine**: Instant diagnostic trouble code alerts
- **Geofence**: Notify when vehicle leaves designated area
- **Maintenance Due**: Predictive maintenance reminders

---

**Next Steps**:
1. Review this roadmap with stakeholders
2. Prioritize Smartcar integration for Phase 1
3. Set up Smartcar developer account
4. Begin backend API development

**Questions?** This guide covers 90% of connected vehicle integration scenarios. Let me know if you need specific OEM documentation or implementation help!
