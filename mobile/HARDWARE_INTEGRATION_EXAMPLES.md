# Fleet Mobile Hardware Integration - Usage Examples

Complete usage examples for all hardware integration components and services.

---

## Table of Contents

1. [Barcode Scanner](#barcode-scanner)
2. [NFC Reader](#nfc-reader)
3. [Vehicle Check-In](#vehicle-check-in)
4. [Beacon Service](#beacon-service)
5. [Dashcam Integration](#dashcam-integration)
6. [Parts Scanner Screen](#parts-scanner-screen)
7. [API Integration](#api-integration)

---

## Barcode Scanner

### Basic Single Scan

```tsx
import React, { useState } from 'react'
import { View, Button, Modal } from 'react-native'
import BarcodeScanner, { ScannedItem } from './components/BarcodeScanner'

function MyComponent() {
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = (item: ScannedItem) => {
    console.log('Scanned:', item.barcode)
    console.log('Format:', item.format)

    if (item.partDetails) {
      console.log('Part:', item.partDetails.partNumber)
      console.log('Price:', item.partDetails.price)
    }

    setShowScanner(false)
  }

  return (
    <View>
      <Button title="Scan Barcode" onPress={() => setShowScanner(true)} />

      <Modal visible={showScanner}>
        <BarcodeScanner
          mode="single"
          scanType="general"
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          autoSubmit={true}
        />
      </Modal>
    </View>
  )
}
```

### Batch Part Scanning

```tsx
import React, { useState } from 'react'
import BarcodeScanner, { ScannedItem } from './components/BarcodeScanner'

function BatchPartScanner() {
  const [showScanner, setShowScanner] = useState(false)

  const handleBatchComplete = (items: ScannedItem[]) => {
    console.log(`Scanned ${items.length} parts`)

    const partsWithDetails = items.filter(item => item.partDetails)
    console.log(`Found ${partsWithDetails.length} parts in inventory`)

    // Process parts
    partsWithDetails.forEach(item => {
      console.log(`${item.partDetails!.partNumber}: ${item.partDetails!.description}`)
    })

    setShowScanner(false)
  }

  return (
    <BarcodeScanner
      mode="batch"
      scanType="parts"
      onScan={(item) => console.log('Item scanned:', item)}
      onBatchComplete={handleBatchComplete}
      onClose={() => setShowScanner(false)}
      enablePartLookup={true}
      barcodeFormats={['code128', 'ean13', 'upc_a', 'qr']}
    />
  )
}
```

### Asset Tracking

```tsx
import React from 'react'
import BarcodeScanner, { ScannedItem } from './components/BarcodeScanner'

function AssetScanner() {
  const handleAssetScan = async (item: ScannedItem) => {
    if (item.assetDetails) {
      console.log('Asset:', item.assetDetails.name)
      console.log('Tag:', item.assetDetails.assetTag)
      console.log('Status:', item.assetDetails.status)
      console.log('Location:', item.assetDetails.location)

      // Update asset location or perform check-in
      await updateAssetLocation(item.assetDetails.assetId)
    }
  }

  return (
    <BarcodeScanner
      mode="single"
      scanType="assets"
      onScan={handleAssetScan}
      onClose={() => {}}
      enableAssetLookup={true}
    />
  )
}
```

---

## NFC Reader

### Read Vehicle NFC Tag

```tsx
import React, { useEffect } from 'react'
import { Alert } from 'react-native'
import NFCReader from './services/NFCReader'

function VehicleNFCReader() {
  useEffect(() => {
    initNFC()

    return () => {
      NFCReader.cleanup()
    }
  }, [])

  const initNFC = async () => {
    const initialized = await NFCReader.init()
    if (!initialized) {
      Alert.alert('NFC Not Supported', 'This device does not support NFC')
      return
    }

    const enabled = await NFCReader.isEnabled()
    if (!enabled) {
      Alert.alert('NFC Disabled', 'Please enable NFC', [
        { text: 'Cancel' },
        { text: 'Settings', onPress: () => NFCReader.goToNfcSetting() }
      ])
    }
  }

  const readVehicleTag = async () => {
    const vehicleData = await NFCReader.readVehicleTag()

    if (vehicleData) {
      console.log('Vehicle ID:', vehicleData.vehicleId)
      console.log('VIN:', vehicleData.vin)
      console.log('Vehicle:', `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`)

      Alert.alert(
        'Vehicle Found',
        `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}\nVIN: ${vehicleData.vin}`
      )
    } else {
      Alert.alert('Error', 'Failed to read vehicle tag')
    }
  }

  return (
    <Button title="Read Vehicle Tag" onPress={readVehicleTag} />
  )
}
```

### Write NFC Tag

```tsx
import NFCReader, { VehicleNFCData } from './services/NFCReader'

async function writeVehicleTag() {
  const vehicleData: VehicleNFCData = {
    vehicleId: 'VEH-12345',
    vin: '1HGBH41JXMN109186',
    make: 'Ford',
    model: 'Transit',
    year: 2023,
    licensePlate: 'ABC-1234',
    fleetNumber: 'FL-001'
  }

  const success = await NFCReader.writeVehicleTag(vehicleData)

  if (success) {
    Alert.alert('Success', 'Vehicle tag programmed successfully')
  } else {
    Alert.alert('Error', 'Failed to write tag')
  }
}
```

### Continuous NFC Reading

```tsx
import React, { useEffect } from 'react'
import NFCReader, { NFCMessage } from './services/NFCReader'

function ContinuousNFCReader() {
  useEffect(() => {
    startReading()

    return () => {
      NFCReader.stopReading()
    }
  }, [])

  const startReading = async () => {
    await NFCReader.startReading((message: NFCMessage) => {
      console.log('NFC Tag detected:', message)

      message.records.forEach(record => {
        console.log('Type:', record.type)
        console.log('Payload:', record.payload)
      })
    })
  }

  return <View>{/* Your UI */}</View>
}
```

### Driver Authentication

```tsx
import NFCReader from './services/NFCReader'

async function authenticateDriver(authToken: string) {
  const result = await NFCReader.authenticateDriver(authToken)

  if (result.success && result.driverData) {
    console.log('Driver:', result.driverData.name)
    console.log('Employee ID:', result.driverData.employeeId)
    console.log('License:', result.driverData.licenseNumber)

    // Proceed with driver login
    await loginDriver(result.driverData)
  } else {
    Alert.alert('Authentication Failed', result.message)
  }
}
```

---

## Vehicle Check-In

### Basic Check-In

```tsx
import React, { useState } from 'react'
import VehicleCheckIn, { CheckInResult } from './components/VehicleCheckIn'

function CheckInScreen() {
  const [showCheckIn, setShowCheckIn] = useState(true)

  const handleCheckInSuccess = async (result: CheckInResult) => {
    console.log('Check-in successful!')
    console.log('Method:', result.method)
    console.log('Vehicle ID:', result.vehicleId)
    console.log('Reservation:', result.reservationId)

    if (result.vehicle) {
      console.log('Vehicle:', `${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}`)
    }

    if (result.requiresInspection) {
      // Navigate to pre-trip inspection
      navigation.navigate('PreTripInspection', {
        vehicleId: result.vehicleId,
        reservationId: result.reservationId
      })
    }

    setShowCheckIn(false)
  }

  return (
    <VehicleCheckIn
      onCheckInSuccess={handleCheckInSuccess}
      onClose={() => setShowCheckIn(false)}
      enableNFC={true}
      enableQR={true}
      enableManual={true}
      autoStartInspection={true}
      authToken="your-auth-token"
    />
  )
}
```

### NFC-Only Check-In

```tsx
function NFCCheckIn() {
  return (
    <VehicleCheckIn
      onCheckInSuccess={(result) => {
        console.log('NFC Check-in:', result)
      }}
      onClose={() => {}}
      enableNFC={true}
      enableQR={false}
      enableManual={false}
      authToken="your-auth-token"
    />
  )
}
```

---

## Beacon Service

### Monitor Nearby Vehicles

```tsx
import React, { useEffect, useState } from 'react'
import BeaconService, { VehicleBeacon } from './services/BeaconService'

function NearbyVehicles() {
  const [nearbyVehicles, setNearbyVehicles] = useState<VehicleBeacon[]>([])

  useEffect(() => {
    initBeacons()

    return () => {
      BeaconService.cleanup()
    }
  }, [])

  const initBeacons = async () => {
    const initialized = await BeaconService.init()
    if (!initialized) return

    // Fetch and register vehicle beacons
    await BeaconService.fetchVehicleBeacons('auth-token')

    // Register region
    BeaconService.registerRegion({
      identifier: 'fleet-vehicles',
      uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6'
    })

    // Start ranging
    await BeaconService.startRanging()

    // Listen for vehicle beacons
    const unsubscribe = BeaconService.onVehicleBeaconsDetected((beacons) => {
      setNearbyVehicles(beacons)

      // Find nearest vehicle
      const nearest = BeaconService.getNearestVehicle(beacons)
      if (nearest) {
        console.log('Nearest vehicle:', nearest.make, nearest.model)
        console.log('Distance:', nearest.distance, 'meters')
        console.log('Proximity:', nearest.proximity)
      }
    })

    return unsubscribe
  }

  return (
    <View>
      <Text>Nearby Vehicles: {nearbyVehicles.length}</Text>
      {nearbyVehicles.map((vehicle) => (
        <View key={vehicle.vehicleId}>
          <Text>{vehicle.make} {vehicle.model}</Text>
          <Text>{vehicle.proximity} - {vehicle.distance?.toFixed(1)}m</Text>
        </View>
      ))}
    </View>
  )
}
```

### Geofencing with Beacons

```tsx
import BeaconService, { GeofenceBeacon } from './services/BeaconService'

function setupGeofencing() {
  // Register regions for specific vehicles
  BeaconService.registerRegion({
    identifier: 'vehicle-001',
    uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6',
    major: 100,
    minor: 1
  })

  BeaconService.registerRegion({
    identifier: 'vehicle-002',
    uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6',
    major: 100,
    minor: 2
  })

  // Start monitoring
  BeaconService.startMonitoring()

  // Listen for geofence events
  BeaconService.onGeofenceEvent((event: GeofenceBeacon) => {
    if (event.type === 'entry') {
      console.log('Entered vehicle beacon range:', event.region.identifier)
      // Show notification: "You are near your vehicle"
    } else {
      console.log('Exited vehicle beacon range:', event.region.identifier)
    }
  })
}
```

### Register New Beacon

```tsx
async function registerVehicleBeacon(authToken: string) {
  const success = await BeaconService.registerBeaconWithAPI(
    authToken,
    'VEH-12345',
    '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6',
    100,
    1
  )

  if (success) {
    console.log('Beacon registered successfully')
  }
}
```

---

## Dashcam Integration

### Connect to Dashcam

```tsx
import React, { useState, useEffect } from 'react'
import DashcamIntegration from './services/DashcamIntegration'

function DashcamConnect() {
  const [connected, setConnected] = useState(false)
  const [dashcamInfo, setDashcamInfo] = useState(null)

  const scanAndConnect = async () => {
    // Scan for nearby dashcam WiFi networks
    const dashcams = await DashcamIntegration.scanForDashcams()

    if (dashcams.length === 0) {
      Alert.alert('No Dashcams Found', 'Make sure dashcam WiFi is enabled')
      return
    }

    // Connect to first dashcam (or show selection)
    const connected = await DashcamIntegration.connectToDashcam(
      dashcams[0],
      'password' // Optional password
    )

    if (connected) {
      setConnected(true)
      const info = await DashcamIntegration.getDashcamInfo()
      setDashcamInfo(info)

      console.log('Connected to:', info?.brand, info?.model)
    } else {
      Alert.alert('Connection Failed', 'Could not connect to dashcam')
    }
  }

  return (
    <View>
      <Button title="Connect to Dashcam" onPress={scanAndConnect} />
      {connected && dashcamInfo && (
        <View>
          <Text>Brand: {dashcamInfo.brand}</Text>
          <Text>Model: {dashcamInfo.model}</Text>
          <Text>Firmware: {dashcamInfo.firmwareVersion}</Text>
        </View>
      )}
    </View>
  )
}
```

### Live Video Stream

```tsx
import { WebView } from 'react-native-webview'
import DashcamIntegration from './services/DashcamIntegration'

function LiveDashcamView() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const startStream = async () => {
    const url = await DashcamIntegration.startLiveStream({
      quality: 'medium',
      width: 1280,
      height: 720,
      fps: 30
    })

    if (url) {
      setStreamUrl(url)
    } else {
      Alert.alert('Stream Error', 'Could not start live stream')
    }
  }

  useEffect(() => {
    return () => {
      DashcamIntegration.stopLiveStream()
    }
  }, [])

  return (
    <View>
      <Button title="Start Live Stream" onPress={startStream} />
      {streamUrl && (
        <WebView
          source={{ uri: streamUrl }}
          style={{ width: '100%', height: 400 }}
        />
      )}
    </View>
  )
}
```

### Tag Incident Event

```tsx
import DashcamIntegration from './services/DashcamIntegration'

async function tagIncident(authToken: string, gpsData: GPSData) {
  const event = await DashcamIntegration.tagEvent(
    authToken,
    'harsh_braking',
    'Driver had to brake suddenly to avoid obstacle',
    gpsData
  )

  if (event) {
    console.log('Event tagged:', event.id)
    console.log('Video URL:', event.videoUrl)

    // Event is saved and video segment is being captured
    Alert.alert(
      'Incident Recorded',
      'Event has been tagged. Video footage will be saved automatically.'
    )
  }
}
```

### Download Video

```tsx
async function downloadEventVideo(video: DashcamVideo) {
  const localPath = await DashcamIntegration.downloadVideo(
    video,
    (progress, downloaded, total) => {
      console.log(`Download progress: ${progress.toFixed(1)}%`)
      console.log(`${(downloaded / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB`)
    }
  )

  if (localPath) {
    console.log('Video downloaded to:', localPath)
    // Play video or upload to server
  } else {
    Alert.alert('Download Failed', 'Could not download video')
  }
}
```

### Get Video List

```tsx
async function getIncidentVideos() {
  // Get all event videos
  const videos = await DashcamIntegration.getVideoList('event')

  console.log(`Found ${videos.length} event videos`)

  videos.forEach(video => {
    console.log('Filename:', video.filename)
    console.log('Timestamp:', video.timestamp)
    console.log('Duration:', video.duration, 'seconds')
    console.log('Size:', (video.size / 1024 / 1024).toFixed(2), 'MB')

    if (video.gpsData) {
      console.log('Location:', video.gpsData.latitude, video.gpsData.longitude)
      console.log('Speed:', video.gpsData.speed, 'mph')
    }
  })
}
```

---

## Parts Scanner Screen

### Basic Usage

```tsx
import React from 'react'
import PartsScannerScreen from './screens/PartsScannerScreen'

function MaintenanceScreen({ navigation, route }) {
  const { workOrderId } = route.params

  return (
    <PartsScannerScreen
      workOrderId={workOrderId}
      authToken="your-auth-token"
      onClose={() => navigation.goBack()}
    />
  )
}
```

### Standalone Parts Scanner

```tsx
function InventoryScanner() {
  return (
    <PartsScannerScreen
      // No workOrderId - just for inventory lookup
      authToken="your-auth-token"
      onClose={() => {}}
    />
  )
}
```

---

## API Integration

### Setup API Routes

Register the routes in your Express app:

```typescript
// api/src/index.ts
import mobileHardwareRoutes from './routes/mobile-hardware.routes'

app.use('/api/mobile', mobileHardwareRoutes)
```

### Example API Calls

```typescript
// Part lookup
const response = await fetch('/api/mobile/parts/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({ barcode: 'BRK-12345' })
})
const { part } = await response.json()

// Vehicle check-in
const checkInResponse = await fetch('/api/mobile/checkin/nfc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    vehicleId: 'VEH-001',
    checkInMethod: 'nfc',
    timestamp: new Date().toISOString()
  })
})

// Register beacon
const beaconResponse = await fetch('/api/mobile/beacons/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    vehicleId: 'VEH-001',
    uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6',
    major: 100,
    minor: 1,
    registeredAt: new Date().toISOString()
  })
})

// Tag dashcam event
const eventResponse = await fetch('/api/mobile/dashcam/event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'impact',
    severity: 'high',
    gpsData: {
      latitude: 40.7128,
      longitude: -74.0060,
      speed: 35
    }
  })
})
```

---

## Complete Integration Example

Here's a complete example showing multiple hardware features working together:

```tsx
import React, { useState, useEffect } from 'react'
import { View, Button, Text, Alert } from 'react-native'
import NFCReader from './services/NFCReader'
import BeaconService from './services/BeaconService'
import DashcamIntegration from './services/DashcamIntegration'
import VehicleCheckIn from './components/VehicleCheckIn'

function FleetDriverApp() {
  const [checkedIn, setCheckedIn] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState(null)
  const [nearbyVehicles, setNearbyVehicles] = useState([])
  const [dashcamConnected, setDashcamConnected] = useState(false)

  useEffect(() => {
    initializeHardware()

    return () => {
      cleanup()
    }
  }, [])

  const initializeHardware = async () => {
    // Initialize NFC
    await NFCReader.init()

    // Initialize and start beacon monitoring
    const beaconInit = await BeaconService.init()
    if (beaconInit) {
      await BeaconService.fetchVehicleBeacons('auth-token')
      await BeaconService.startRanging()

      BeaconService.onVehicleBeaconsDetected((beacons) => {
        setNearbyVehicles(beacons)
      })
    }
  }

  const cleanup = async () => {
    await NFCReader.cleanup()
    await BeaconService.cleanup()
    await DashcamIntegration.disconnect()
  }

  const handleVehicleCheckIn = async (result) => {
    setCheckedIn(true)
    setCurrentVehicle(result.vehicle)

    // Try to connect to vehicle's dashcam
    const dashcams = await DashcamIntegration.scanForDashcams()
    if (dashcams.length > 0) {
      const connected = await DashcamIntegration.connectToDashcam(dashcams[0])
      setDashcamConnected(connected)
    }

    // Start pre-trip inspection if required
    if (result.requiresInspection) {
      // Navigate to inspection screen
    }
  }

  const recordIncident = async () => {
    if (!dashcamConnected) {
      Alert.alert('Dashcam Not Connected', 'Please connect to dashcam first')
      return
    }

    // Get current GPS location
    const gpsData = await getCurrentLocation()

    // Tag the event in dashcam
    const event = await DashcamIntegration.tagEvent(
      'auth-token',
      'impact',
      'Incident recorded by driver',
      gpsData
    )

    if (event) {
      Alert.alert('Incident Recorded', 'Event has been logged and video saved')
    }
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!checkedIn ? (
        <VehicleCheckIn
          onCheckInSuccess={handleVehicleCheckIn}
          onClose={() => {}}
          enableNFC={true}
          enableQR={true}
          enableManual={true}
          authToken="auth-token"
        />
      ) : (
        <View>
          <Text>Checked in to: {currentVehicle?.make} {currentVehicle?.model}</Text>
          <Text>Dashcam: {dashcamConnected ? 'Connected' : 'Disconnected'}</Text>
          <Text>Nearby Vehicles: {nearbyVehicles.length}</Text>

          <Button title="Record Incident" onPress={recordIncident} />
        </View>
      )}
    </View>
  )
}

export default FleetDriverApp
```

---

## Required Dependencies

Install these packages in your React Native project:

```bash
npm install react-native-camera
npm install react-native-nfc-manager
npm install react-native-beacons-manager
npm install react-native-wifi-reborn
npm install react-native-vector-icons
npm install react-native-webview
```

### iOS Setup

Add to `ios/Podfile`:

```ruby
permissions_path = '../node_modules/react-native-permissions/ios'
pod 'Permission-Camera', :path => "#{permissions_path}/Camera"
pod 'Permission-LocationWhenInUse', :path => "#{permissions_path}/LocationWhenInUse"
pod 'Permission-Bluetooth', :path => "#{permissions_path}/Bluetooth"
```

Add to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan barcodes and QR codes</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to find nearby vehicles</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We need Bluetooth access to detect vehicle beacons</string>
<key>NFCReaderUsageDescription</key>
<string>We need NFC access for vehicle check-in</string>
```

### Android Setup

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />

<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />
```

---

## Best Practices

1. **Always check permissions** before using hardware features
2. **Handle errors gracefully** - not all devices support all features
3. **Provide fallbacks** - e.g., manual entry if NFC/barcode fails
4. **Clean up resources** - stop scanning/monitoring when component unmounts
5. **Test on real devices** - simulators don't support NFC, beacons, etc.
6. **Use background monitoring carefully** - can drain battery
7. **Secure NFC writes** - validate data before writing to tags
8. **Cache beacon data** - avoid excessive API calls
9. **Implement retry logic** - for WiFi connections and API calls
10. **Monitor battery usage** - especially with continuous beacon ranging

---

## Troubleshooting

### NFC Not Working
- Ensure NFC is enabled in device settings
- Check that device supports NFC (not all Android devices do)
- Verify NFC permissions are granted
- Try different tag positions/orientations

### Beacons Not Detected
- Check Bluetooth and Location permissions
- Ensure Bluetooth is enabled
- Verify beacon batteries are not dead
- Check beacon UUID matches registered region
- Try increasing scan interval

### Dashcam Connection Fails
- Ensure dashcam WiFi is enabled
- Check WiFi password is correct
- Verify device is connected to dashcam network
- Some dashcams require app-specific configuration

### Barcode Scanner Issues
- Ensure adequate lighting
- Clean camera lens
- Hold steady and at proper distance
- Try different barcode formats
- Check camera permissions

---

This completes the hardware integration suite for Fleet mobile app!
