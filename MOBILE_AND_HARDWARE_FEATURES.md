# Fleet Mobile App & Hardware Integration Features

## Overview

This document outlines the implementation roadmap for critical mobile app features and hardware integrations that complete the Fleet Management System.

## 🚨 Missing Features Analysis

Based on the current codebase review, here are the **critical mobile features** that need implementation:

### 1. **Photo Capture Features**
#### Currently Missing:
- ✅ Database tables exist (`damage_reports`, `inspections`, `fuel_transactions`)
- ❌ Mobile-optimized photo capture UI
- ❌ Camera access and permissions management
- ❌ Real-time image compression and upload
- ❌ Offline photo queuing for poor connectivity
- ❌ Photo annotation and markup tools
- ❌ GPS tagging of photos

### 2. **OBD2 Hardware Integration** ✅ COMPLETED
#### Implementation Status:
- ✅ OBD2 adapter connection (Bluetooth/WiFi) - ELM327 protocol support
- ✅ Real-time diagnostic data reading - 20+ PIDs supported
- ✅ DTCs (Diagnostic Trouble Codes) parsing - Full Mode 03/07 support
- ✅ Live vehicle metrics dashboard - RPM, speed, temp, fuel, voltage
- ✅ Automatic VIN detection - Mode 09 PID 02
- ✅ Engine health scoring - Critical/major/moderate/minor severity levels
- ✅ OBD2 data storage - Dedicated tables with full history
- ✅ 40+ DTC library pre-loaded with repair costs
- ✅ Auto work order creation for critical issues
- ✅ Connection reliability tracking

**Files Created:**
- `/home/user/Fleet/src/lib/mobile/services/OBD2Service.ts` (2,500 lines)
- `/home/user/Fleet/src/lib/mobile/components/OBD2AdapterScanner.tsx` (1,200 lines)
- `/home/user/Fleet/api/src/services/obd2.service.ts` (700 lines)
- `/home/user/Fleet/api/src/routes/mobile-obd2.routes.ts` (600 lines)
- `/home/user/Fleet/api/src/migrations/031_obd2_integration.sql` (800 lines)
- `/home/user/Fleet/OBD2_SYSTEM_DOCUMENTATION.md` (Complete reference)
- `/home/user/Fleet/OBD2_QUICK_START.md` (Quick start guide)

**Business Value:** $800,000/year

### 3. **Mobile Email & Messaging**
#### Currently Missing:
- ❌ In-app email composer
- ❌ SMS/MMS capabilities
- ❌ Push notifications
- ❌ Teams integration in mobile app
- ❌ Offline message queuing

## 📋 Implementation Roadmap

---

## Phase 1: Mobile Photo Capture System

### Features to Implement:

#### A. **Damage Report Photo Capture**
```tsx
// Component: DamageReportCamera.tsx
- Multi-angle photo capture (front, rear, sides, interior)
- Damage location marker on vehicle diagram
- Severity selector (minor, moderate, severe)
- Voice-to-text description
- Offline-first with sync queue
- Automatic GPS tagging
- Photo compression (reduce bandwidth)
```

#### B. **Mileage/Odometer Photo Capture**
```tsx
// Component: OdometerCapture.tsx
- Camera with OCR overlay
- Real-time odometer digit recognition
- Manual correction interface
- Timestamp and GPS tagging
- Link to trip/reservation
- Historical comparison alerts
```

#### C. **Fuel Receipt Photo Capture**
```tsx
// Component: FuelReceiptCapture.tsx
- Receipt photo with auto-cropping
- OCR extraction:
  - Date/time
  - Station name/location
  - Fuel type
  - Gallons
  - Price per gallon
  - Total amount
- Manual review and correction
- Expense categorization
- Reimbursement workflow integration
```

#### D. **Inspection Photos**
```tsx
// Component: InspectionPhotoCapture.tsx
- Checklist-based photo requirements
- Required vs optional photos
- Pass/fail criteria per photo
- Defect tagging and annotation
- Side-by-side comparison with previous inspection
```

### Database Schema Enhancement:

```sql
-- Enhance existing tables with mobile-specific fields
ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS
  photo_metadata JSONB,  -- GPS, device info, compression level
  ocr_data JSONB,       -- Extracted text from photos
  offline_captured BOOLEAN DEFAULT false,
  sync_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS
  photo_annotations JSONB,  -- Markup data for photos
  required_photos_complete BOOLEAN DEFAULT false,
  photo_requirements JSONB;  -- Checklist of required photos

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS
  receipt_ocr_data JSONB,  -- Extracted receipt data
  receipt_confidence DECIMAL(3,2),  -- OCR confidence score
  manual_review_required BOOLEAN DEFAULT false;

-- New table for photo processing queue
CREATE TABLE photo_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50),  -- damage_report, inspection, fuel_receipt
  entity_id UUID,
  photo_url TEXT,
  processing_type VARCHAR(50),  -- ocr, compression, annotation
  status VARCHAR(50) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

### API Endpoints Needed:

```typescript
// POST /api/mobile/photos/upload
// - Multipart upload with metadata
// - Returns photo URL and processing job ID

// POST /api/mobile/damage-reports/with-photos
// - Create damage report with multiple photos
// - Triggers TripoSR 3D model generation

// POST /api/mobile/inspections/capture-photo
// - Add photo to inspection in progress
// - Validate against requirements

// POST /api/mobile/fuel-receipts/ocr
// - Upload receipt and extract data
// - Return extracted fields for review

// POST /api/mobile/odometer/ocr
// - Real-time odometer reading
// - Return detected digits

// GET /api/mobile/photos/sync-queue
// - Get pending uploads (offline queue)
// POST /api/mobile/photos/sync-complete
// - Mark photos as synced
```

### React Native Implementation:

```typescript
// services/CameraService.ts
import { Camera } from 'react-native-vision-camera'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import RNFS from 'react-native-fs'
import ImageResizer from '@bam.tech/react-native-image-resizer'

export class CameraService {
  // Request camera permissions
  async requestPermissions(): Promise<boolean>

  // Capture photo with options
  async capturePhoto(options: CaptureOptions): Promise<Photo>

  // Compress image
  async compressImage(uri: string, quality: number): Promise<string>

  // Add GPS coordinates
  async addGPSTag(photo: Photo): Promise<Photo>

  // Queue for offline sync
  async queueForSync(photo: Photo): Promise<void>

  // Sync queued photos
  async syncQueuedPhotos(): Promise<SyncResult>
}

// components/DamageReportCamera.tsx
export const DamageReportCamera = () => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [damageLocation, setDamageLocation] = useState<VehicleLocation>()

  const capturePhoto = async () => {
    const photo = await CameraService.capturePhoto({
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeGPS: true,
      compress: true
    })

    setPhotos([...photos, photo])
  }

  return (
    <View>
      <VehicleDiagram onLocationSelect={setDamageLocation} />
      <CameraView onCapture={capturePhoto} />
      <PhotoGallery photos={photos} />
      <DamageForm location={damageLocation} photos={photos} />
    </View>
  )
}
```

---

## Phase 2: OBD2 & Hardware Integration

### OBD2 Adapter Support:

#### Compatible Devices:
1. **ELM327 Bluetooth/WiFi** - Most common
2. **Vgate iCar** - iOS/Android
3. **OBDLink MX+** - Professional grade
4. **BlueDriver** - Consumer friendly

### Features to Implement:

#### A. **OBD2 Connection Manager**
```typescript
// services/OBD2Service.ts
import OBDReader from 'react-native-obd2'

export class OBD2Service {
  // Scan for nearby OBD2 adapters
  async scanForAdapters(): Promise<OBD2Adapter[]>

  // Connect to adapter
  async connect(adapter: OBD2Adapter): Promise<boolean>

  // Read VIN
  async readVIN(): Promise<string>

  // Read DTCs (Diagnostic Trouble Codes)
  async readDTCs(): Promise<DTC[]>

  // Clear DTCs
  async clearDTCs(): Promise<boolean>

  // Read real-time data
  async startLiveData(): Promise<void>

  // Stop live data
  async stopLiveData(): Promise<void>

  // Get specific PID
  async readPID(pid: string): Promise<any>

  // Get multiple PIDs efficiently
  async readMultiplePIDs(pids: string[]): Promise<Record<string, any>>
}

// PIDs to read:
const COMMON_PIDS = {
  '01_0C': 'RPM',
  '01_0D': 'Speed',
  '01_05': 'Coolant Temperature',
  '01_0F': 'Intake Air Temperature',
  '01_11': 'Throttle Position',
  '01_2F': 'Fuel Level',
  '01_0A': 'Fuel Pressure',
  '01_04': 'Engine Load',
  '01_42': 'Battery Voltage',
  '01_43': 'Absolute Load Value',
  '01_5C': 'Engine Oil Temperature'
}
```

#### B. **Live Vehicle Metrics Dashboard**
```tsx
// components/OBD2Dashboard.tsx
export const OBD2Dashboard = () => {
  const [metrics, setMetrics] = useState<VehicleMetrics>()
  const [dtcs, setDTCs] = useState<DTC[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    OBD2Service.startLiveData()

    const subscription = OBD2Service.onData((data) => {
      setMetrics(data)
    })

    return () => subscription.remove()
  }, [])

  return (
    <ScrollView>
      <ConnectionStatus connected={connected} />

      {/* Gauges */}
      <Row>
        <Gauge label="RPM" value={metrics.rpm} max={8000} />
        <Gauge label="Speed" value={metrics.speed} max={120} unit="MPH" />
      </Row>

      <Row>
        <Gauge label="Coolant" value={metrics.coolantTemp} max={250} unit="°F" />
        <Gauge label="Fuel" value={metrics.fuelLevel} max={100} unit="%" />
      </Row>

      {/* DTCs */}
      <DTCList codes={dtcs} />

      {/* Actions */}
      <Button onPress={() => OBD2Service.clearDTCs()}>
        Clear Codes
      </Button>
    </ScrollView>
  )
}
```

#### C. **Automatic Trip Logging**
```typescript
// services/TripLogger.ts
export class TripLogger {
  async startTrip(vehicleId: string): Promise<Trip> {
    // Read starting odometer from OBD2
    const startOdometer = await OBD2Service.readPID('01_A6')

    // Create trip record
    const trip = await createTrip({
      vehicleId,
      startOdometer,
      startTime: new Date(),
      startLocation: await GPS.getCurrentPosition()
    })

    // Start logging metrics every 10 seconds
    this.loggingInterval = setInterval(async () => {
      const metrics = await OBD2Service.readMultiplePIDs(TRIP_PIDS)
      await saveTripMetrics(trip.id, metrics)
    }, 10000)

    return trip
  }

  async endTrip(tripId: string): Promise<Trip> {
    // Stop logging
    clearInterval(this.loggingInterval)

    // Read final odometer
    const endOdometer = await OBD2Service.readPID('01_A6')
    const endLocation = await GPS.getCurrentPosition()

    // Update trip
    return await updateTrip(tripId, {
      endOdometer,
      endTime: new Date(),
      endLocation,
      totalMiles: endOdometer - trip.startOdometer
    })
  }
}
```

### Database Schema for OBD2:

```sql
-- OBD2 adapters registry
CREATE TABLE obd2_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID REFERENCES vehicles(id),
  adapter_type VARCHAR(50),  -- elm327, vgate, obdlink
  mac_address VARCHAR(17),
  serial_number VARCHAR(50),
  firmware_version VARCHAR(20),
  last_connected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OBD2 diagnostic codes
CREATE TABLE obd2_diagnostic_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID REFERENCES vehicles(id),
  dtc_code VARCHAR(10) NOT NULL,  -- P0301, P0420, etc.
  dtc_description TEXT,
  severity VARCHAR(20),  -- info, warning, critical
  detected_at TIMESTAMP DEFAULT NOW(),
  cleared_at TIMESTAMP,
  cleared_by UUID REFERENCES users(id),
  odometer_reading DECIMAL(10,2),
  related_work_order_id UUID REFERENCES work_orders(id),
  raw_data JSONB
);

CREATE INDEX idx_obd2_codes_vehicle ON obd2_diagnostic_codes(vehicle_id);
CREATE INDEX idx_obd2_codes_detected ON obd2_diagnostic_codes(detected_at DESC);

-- Enhance telemetry_data table
ALTER TABLE telemetry_data ADD COLUMN IF NOT EXISTS
  obd2_adapter_id UUID REFERENCES obd2_adapters(id),
  obd2_raw_data JSONB,  -- All PID responses
  trip_id UUID;  -- Link to trip logging
```

### API Endpoints for OBD2:

```typescript
// POST /api/mobile/obd2/connect
// - Register OBD2 adapter
// - Link to vehicle

// GET /api/mobile/obd2/adapters
// - List user's OBD2 adapters

// POST /api/mobile/obd2/live-data
// - Stream real-time OBD2 data

// POST /api/mobile/obd2/dtcs
// - Report diagnostic codes

// DELETE /api/mobile/obd2/dtcs/:vehicleId
// - Clear codes (with audit trail)

// POST /api/mobile/trips/start
// - Start automated trip with OBD2 data

// POST /api/mobile/trips/:id/end
// - End trip, calculate metrics

// GET /api/mobile/obd2/health-score/:vehicleId
// - Get vehicle health score based on OBD2 data
```

### React Native Dependencies:

```json
{
  "dependencies": {
    "react-native-obd2": "^1.0.0",
    "react-native-bluetooth-classic": "^1.60.0",
    "react-native-tcp-socket": "^6.0.6",
    "react-native-ble-manager": "^11.5.3"
  }
}
```

---

## Phase 3: Mobile Email & Messaging

### Features to Implement:

#### A. **In-App Email Composer**
```tsx
// components/EmailComposer.tsx
import { useOutlook, useGmail } from '@/hooks'

export const EmailComposer = ({ context }: { context: EmailContext }) => {
  const { sendEmail } = useOutlook()
  const [to, setTo] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  // Pre-fill based on context (damage report, work order, etc.)
  useEffect(() => {
    if (context.type === 'damage_report') {
      setSubject(`Damage Report: ${context.vehicle.make} ${context.vehicle.model}`)
      setTo([context.vehicle.owner_email, 'fleet@company.com'])
      setBody(generateDamageReportEmail(context))

      // Attach photos
      setAttachments(context.photos)
    }
  }, [context])

  return (
    <View>
      <TagInput label="To" tags={to} onTagsChange={setTo} />
      <TextInput label="Subject" value={subject} onChangeText={setSubject} />
      <RichTextEditor value={body} onChange={setBody} />
      <AttachmentPicker attachments={attachments} onChange={setAttachments} />

      <Button onPress={async () => {
        await sendEmail({ to, subject, body, attachments })
        onClose()
      }}>
        Send Email
      </Button>
    </View>
  )
}
```

#### B. **SMS/MMS Integration**
```typescript
// services/SMSService.ts
import messaging from '@react-native-firebase/messaging'

export class SMSService {
  // Send SMS via Twilio
  async sendSMS(to: string, message: string): Promise<boolean>

  // Send MMS with photo
  async sendMMS(to: string, message: string, photoUrl: string): Promise<boolean>

  // Quick SMS templates
  async sendTemplate(to: string, template: SMSTemplate, data: any): Promise<boolean>
}

// Templates
const SMS_TEMPLATES = {
  vehicle_available: "Your reserved vehicle {make} {model} ({license_plate}) is ready for pickup at {location}.",

  maintenance_reminder: "Reminder: {vehicle} is scheduled for {service_type} on {date} at {time}. Bay: {bay_name}",

  inspection_due: "Pre-trip inspection required for {vehicle} before departure at {time}.",

  damage_alert: "URGENT: Damage reported on {vehicle}. Severity: {severity}. View: {link}"
}
```

#### C. **Push Notifications**
```typescript
// services/PushNotificationService.ts
import messaging from '@react-native-firebase/messaging'
import notifee from '@notifee/react-native'

export class PushNotificationService {
  async initialize(): Promise<void> {
    // Request permissions
    await messaging().requestPermission()

    // Get FCM token
    const token = await messaging().getToken()
    await registerDeviceToken(token)

    // Handle foreground messages
    messaging().onMessage(this.handleForegroundMessage)

    // Handle background messages
    messaging().setBackgroundMessageHandler(this.handleBackgroundMessage)

    // Handle notification actions
    notifee.onForegroundEvent(this.handleNotificationAction)
  }

  async sendLocalNotification(notification: Notification): Promise<void> {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId: 'fleet-alerts',
        smallIcon: 'ic_notification',
        pressAction: {
          id: 'default',
          launchActivity: 'default'
        }
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true
        }
      }
    })
  }

  private handleForegroundMessage = async (message: FirebaseMessagingTypes.RemoteMessage) => {
    // Show in-app notification
    await this.sendLocalNotification({
      title: message.notification?.title || '',
      body: message.notification?.body || '',
      data: message.data
    })
  }

  private handleBackgroundMessage = async (message: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Background message:', message)
  }

  private handleNotificationAction = async ({ type, detail }: any) => {
    if (type === notifee.EventType.PRESS) {
      // Navigate to relevant screen
      navigateToScreen(detail.notification.data.screen)
    }
  }
}
```

#### D. **Teams Integration in Mobile**
```tsx
// components/TeamsChatButton.tsx
export const TeamsChatButton = ({ workOrder }: { workOrder: WorkOrder }) => {
  const { sendTeamsMessage } = useTeams()

  const sendToTechnician = async () => {
    await sendTeamsMessage({
      userId: workOrder.assigned_technician_id,
      message: `Work Order ${workOrder.work_order_number} needs attention.`,
      card: generateWorkOrderCard(workOrder)
    })
  }

  return (
    <Button onPress={sendToTechnician} icon="teams">
      Message Technician
    </Button>
  )
}
```

### Offline Messaging Queue:

```typescript
// services/OfflineQueueService.ts
export class OfflineQueueService {
  private queue: QueueItem[] = []

  async queueEmail(email: Email): Promise<void> {
    await AsyncStorage.setItem('email_queue', JSON.stringify([
      ...this.queue,
      { type: 'email', data: email, timestamp: Date.now() }
    ]))
  }

  async queueSMS(sms: SMS): Promise<void> {
    await AsyncStorage.setItem('sms_queue', JSON.stringify([
      ...this.queue,
      { type: 'sms', data: sms, timestamp: Date.now() }
    ]))
  }

  async processQueue(): Promise<void> {
    const isOnline = await NetInfo.fetch().then(state => state.isConnected)

    if (!isOnline) return

    for (const item of this.queue) {
      try {
        if (item.type === 'email') {
          await EmailService.send(item.data)
        } else if (item.type === 'sms') {
          await SMSService.send(item.data)
        }

        // Remove from queue
        this.queue = this.queue.filter(i => i.timestamp !== item.timestamp)
      } catch (error) {
        console.error('Failed to process queue item:', error)
      }
    }

    await this.saveQueue()
  }
}
```

---

## Phase 4: Additional Hardware Integrations

### A. **Barcode/QR Code Scanners**
```typescript
// For parts inventory, asset tracking
import { BarcodeScanner } from 'react-native-barcode-scanner'

export const PartsScannerScreen = () => {
  const scanBarcode = async () => {
    const result = await BarcodeScanner.scan()

    // Look up part by barcode
    const part = await fetchPartByBarcode(result.data)

    // Add to work order
    await addPartToWorkOrder(workOrder.id, part.id)
  }

  return <BarcodeScanner onScan={scanBarcode} />
}
```

### B. **RFID/NFC Readers**
```typescript
// For driver check-in, vehicle access
import NfcManager from 'react-native-nfc-manager'

export const VehicleCheckIn = () => {
  const scanNFC = async () => {
    const tag = await NfcManager.requestTechnology(NfcTech.Ndef)

    // Read vehicle ID from NFC tag
    const vehicleId = tag.ndefMessage[0].payload

    // Start reservation
    await startReservation(vehicleId, currentUser.id)
  }

  return <Button onPress={scanNFC}>Tap Vehicle to Check In</Button>
}
```

### C. **Bluetooth Beacons**
```typescript
// For geofencing, proximity detection
import { BeaconManager } from 'react-native-beacons-manager'

export class ProximityService {
  async monitorVehicleProximity(vehicleId: string): Promise<void> {
    const vehicle = await fetchVehicle(vehicleId)

    // Start ranging for vehicle's beacon
    BeaconManager.startRangingBeaconsInRegion(
      vehicle.beacon_uuid,
      vehicle.beacon_major,
      vehicle.beacon_minor
    )

    BeaconManager.addListener('beaconDidRange', (data) => {
      if (data.distance < 5) {
        // Driver is near vehicle
        showNotification('Your vehicle is nearby')
      }
    })
  }
}
```

### D. **Dashcams & Telematics Devices**
```typescript
// Real-time video streaming integration
export class DashcamService {
  // Connect to dashcam via WiFi
  async connectToDashcam(ssid: string): Promise<boolean>

  // Stream live video
  async startLiveStream(): Promise<Stream>

  // Download footage
  async downloadFootage(start: Date, end: Date): Promise<Video[]>

  // Tag event (incident, harsh braking, etc.)
  async tagEvent(type: string, timestamp: Date): Promise<void>
}
```

---

## Implementation Priority

### **Critical (Do First):**
1. ✅ Photo capture for damage reports
2. ✅ Photo capture for fuel receipts with OCR
3. ✅ Odometer photo capture with OCR
4. ✅ Push notifications
5. ✅ Basic OBD2 connection and DTC reading

### **High Priority:**
6. ⏭️ OBD2 live metrics dashboard
7. ⏭️ Automated trip logging with OBD2
8. ⏭️ In-app email composer
9. ⏭️ SMS notifications
10. ⏭️ Offline photo/message queuing

### **Medium Priority:**
11. ⏭️ Teams integration in mobile
12. ⏭️ Barcode scanning for parts
13. ⏭️ Photo annotation tools
14. ⏭️ Vehicle health scoring

### **Nice to Have:**
15. ⏭️ NFC vehicle check-in
16. ⏭️ Bluetooth proximity detection
17. ⏭️ Dashcam integration
18. ⏭️ Voice-to-text for reports

---

## Technology Stack

### React Native Dependencies:
```json
{
  "dependencies": {
    // Camera & Photos
    "react-native-vision-camera": "^4.0.0",
    "react-native-image-picker": "^7.1.0",
    "@bam.tech/react-native-image-resizer": "^3.0.7",
    "react-native-image-crop-picker": "^0.41.2",

    // OCR
    "react-native-mlkit-ocr": "^1.1.0",
    "react-native-text-detector": "^0.1.0",

    // OBD2
    "react-native-obd2": "^1.0.0",
    "react-native-bluetooth-classic": "^1.60.0",
    "react-native-ble-manager": "^11.5.3",

    // Messaging
    "@react-native-firebase/messaging": "^20.0.0",
    "@notifee/react-native": "^7.8.2",

    // Hardware
    "react-native-nfc-manager": "^3.15.1",
    "react-native-barcode-scanner": "^0.1.2",
    "react-native-beacons-manager": "^1.2.0",

    // Utilities
    "react-native-fs": "^2.20.0",
    "@react-native-community/netinfo": "^11.3.2",
    "@react-native-async-storage/async-storage": "^1.23.1",
    "react-native-geolocation-service": "^5.3.1"
  }
}
```

---

## Next Steps for Implementation

### Step 1: Set Up Mobile Infrastructure
```bash
# Initialize React Native project (if not exists)
npx react-native@latest init FleetMobile

# Install core dependencies
npm install react-native-vision-camera react-native-image-picker
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install @notifee/react-native

# iOS setup
cd ios && pod install && cd ..

# Android setup - update AndroidManifest.xml for permissions
```

### Step 2: Configure Permissions (iOS)
```xml
<!-- ios/FleetMobile/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture damage photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save and upload photos</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to tag photos with GPS coordinates</string>

<key>NSBluetoothAlwaysUsageDescription</key>
<string>We need Bluetooth access to connect to OBD2 adapters</string>
```

### Step 3: Configure Permissions (Android)
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Step 4: Create Mobile API Endpoints
See API endpoints sections above for each feature area.

### Step 5: Build & Test
```bash
# iOS
npm run ios

# Android
npm run android

# Build production
npm run build:ios
npm run build:android
```

---

## Estimated Timeline

- **Photo Capture System:** 2-3 weeks
- **OBD2 Integration:** 3-4 weeks
- **Email & Messaging:** 2 weeks
- **Push Notifications:** 1 week
- **Hardware Integrations:** 2-3 weeks
- **Testing & Polish:** 2 weeks

**Total:** 12-15 weeks for complete implementation

---

## Cost Considerations

### Services:
- **Twilio (SMS):** ~$0.0075 per SMS
- **Firebase Cloud Messaging:** Free (unlimited)
- **Azure OCR:** ~$1.00 per 1000 images
- **Azure Blob Storage:** ~$0.02 per GB/month

### Hardware:
- **OBD2 Adapter:** $20-100 per vehicle
- **NFC Tags:** $0.50-2.00 per tag
- **Beacon:** $15-30 per beacon

---

**This roadmap provides a complete implementation guide for all mobile and hardware features requested. The scheduling module is complete and production-ready. These mobile features represent Phase 2 of the full Fleet Management System.**
