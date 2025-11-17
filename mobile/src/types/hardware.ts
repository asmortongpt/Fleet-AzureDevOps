/**
 * Hardware Integration Types
 *
 * Shared types for mobile hardware integrations
 */

// Re-export from components and services
export type {
  BarcodeFormat,
  ScannedItem,
  PartDetails,
  AssetDetails,
  BarcodeScannerProps
} from '../components/BarcodeScanner'

export type {
  NFCTag,
  NFCRecord,
  NFCMessage,
  VehicleNFCData,
  DriverNFCData,
  AccessControlData
} from '../services/NFCReader'

export type {
  CheckInMethod,
  CheckInResult,
  VehicleInfo,
  VehicleCheckInProps
} from '../components/VehicleCheckIn'

export type {
  Beacon,
  VehicleBeacon,
  BeaconRegion,
  GeofenceBeacon,
  BeaconNotification,
  BeaconProximity
} from '../services/BeaconService'

export type {
  DashcamInfo,
  DashcamVideo,
  GPSData,
  VideoSegment,
  DashcamEvent,
  DashcamSettings,
  StreamConfig
} from '../services/DashcamIntegration'

export type {
  PartOrder,
  WorkOrderPart,
  PartsScannerScreenProps
} from '../screens/PartsScannerScreen'

/**
 * Hardware Feature Flags
 */
export interface HardwareFeatures {
  barcode: boolean
  nfc: boolean
  beacons: boolean
  dashcam: boolean
  parts: boolean
}

/**
 * Hardware Permissions
 */
export interface HardwarePermissions {
  camera: 'granted' | 'denied' | 'not_requested'
  location: 'granted' | 'denied' | 'not_requested'
  bluetooth: 'granted' | 'denied' | 'not_requested'
  wifi: 'granted' | 'denied' | 'not_requested'
}

/**
 * Hardware Status
 */
export interface HardwareStatus {
  nfcAvailable: boolean
  nfcEnabled: boolean
  bluetoothAvailable: boolean
  bluetoothEnabled: boolean
  cameraAvailable: boolean
  locationAvailable: boolean
}
