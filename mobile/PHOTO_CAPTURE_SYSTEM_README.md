# Fleet Mobile Photo Capture System

## Overview

A comprehensive, production-ready photo capture system for the Fleet Management mobile app, featuring damage reporting, vehicle inspections, and photo annotations with full offline support and GPS tagging.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Components](#components)
- [Services](#services)
- [Utilities](#utilities)
- [Usage Examples](#usage-examples)
- [File Structure](#file-structure)
- [Dependencies](#dependencies)
- [Permissions](#permissions)

---

## Features

### DamageReportCamera
- ✅ Multi-angle photo capture (front, rear, sides, interior, VIN, odometer, etc.)
- ✅ Vehicle damage diagram with interactive location markers
- ✅ Four-level severity selector (minor, moderate, severe, critical)
- ✅ Voice-to-text description input
- ✅ Automatic GPS tagging with coordinates
- ✅ Real-time photo compression (configurable quality)
- ✅ Offline queue with automatic sync
- ✅ Photo preview with retake capability
- ✅ Comprehensive summary view before submission

### InspectionPhotoCapture
- ✅ Checklist-based inspection workflow
- ✅ Pass/Fail/N/A/Requires Attention criteria
- ✅ Required vs optional photo tracking
- ✅ Min/max photo requirements per item
- ✅ Defect tagging with severity levels
- ✅ Immediate action flags
- ✅ Category-based organization
- ✅ Progress tracking with completion percentage
- ✅ Comprehensive summary statistics
- ✅ Offline-first design

### PhotoAnnotation
- ✅ Interactive drawing tools:
  - Arrow annotations with automatic arrowheads
  - Circle annotations
  - Rectangle annotations
  - Freehand drawing with smooth curves
  - Text labels with font size control
  - Numbered markers
- ✅ Full undo/redo functionality
- ✅ Color picker (9 preset colors)
- ✅ Stroke width selector (5 options)
- ✅ Clear all annotations
- ✅ Annotation counter
- ✅ Save as new photo with annotations
- ✅ Read-only mode for viewing

### CameraService
- ✅ Singleton service pattern
- ✅ Permission management (camera + location)
- ✅ High-quality photo capture with options
- ✅ Image compression with quality/size control
- ✅ GPS location tagging
- ✅ EXIF metadata handling
- ✅ Persistent file storage
- ✅ Offline queue with priority
- ✅ Automatic sync with retry logic
- ✅ File size calculations and formatting

### Offline Sync System
- ✅ Network status monitoring
- ✅ Automatic queue management
- ✅ Priority-based sync ordering
- ✅ Exponential backoff retry
- ✅ Conflict resolution strategies
- ✅ Batch upload operations
- ✅ Storage size tracking
- ✅ Sync statistics and reporting

### GPS Utilities
- ✅ Real-time location tracking
- ✅ Distance calculations (Haversine formula)
- ✅ Bearing and direction calculations
- ✅ Speed conversions (km/h, mph)
- ✅ Geofencing with enter/exit events
- ✅ Route tracking and recording
- ✅ Coordinate formatting (decimal, DMS)
- ✅ Bounding box calculations
- ✅ Map integration (Google Maps, Apple Maps)

---

## Architecture

```
mobile/
├── src/
│   ├── components/
│   │   ├── DamageReportCamera.tsx      (1,042 lines)
│   │   ├── InspectionPhotoCapture.tsx  (1,384 lines)
│   │   └── PhotoAnnotation.tsx         (1,019 lines)
│   ├── services/
│   │   └── CameraService.ts            (706 lines)
│   ├── utils/
│   │   ├── offlineSync.ts              (624 lines)
│   │   └── gpsUtils.ts                 (661 lines)
│   ├── types/
│   │   └── index.ts                    (474 lines)
│   └── index.ts                        (123 lines)
└── package.json

Total: 6,033 lines of production-ready TypeScript code
```

---

## Installation

### 1. Install Dependencies

```bash
cd /home/user/Fleet/mobile
npm install
```

### 2. Install React Native Libraries

```bash
# Camera
npm install react-native-vision-camera

# Image Processing
npm install react-native-image-resizer

# File System
npm install react-native-fs

# Geolocation
npm install react-native-geolocation-service

# Voice Recognition
npm install @react-native-voice/voice

# Drawing & Annotations
npm install react-native-svg react-native-view-shot

# Network & Storage
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
```

### 3. iOS Setup

```bash
cd ios
pod install
cd ..
```

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture vehicle photos and damage reports</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to tag photos with GPS coordinates</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice-to-text descriptions</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save vehicle photos</string>
```

### 4. Android Setup

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

---

## Components

### DamageReportCamera

Comprehensive damage report creation with multi-angle photo capture.

```typescript
import { DamageReportCamera } from '@fleet/mobile';

<DamageReportCamera
  vehicleId="VEH-12345"
  onComplete={(report) => {
    console.log('Damage report submitted:', report);
    // Navigate to report details or submit to API
  }}
  onCancel={() => {
    console.log('Report cancelled');
    // Navigate back
  }}
  existingReport={draftReport} // Optional: Continue from draft
/>
```

**Features:**
- 10 predefined photo angles (front, rear, sides, interior, etc.)
- Interactive vehicle damage diagram
- Severity selection (minor, moderate, severe, critical)
- Voice-to-text description
- GPS coordinates for each photo
- Photo preview and retake
- Draft saving
- Comprehensive summary view

---

### InspectionPhotoCapture

Checklist-based vehicle inspection with pass/fail criteria.

```typescript
import { InspectionPhotoCapture, InspectionType } from '@fleet/mobile';

const checklist = [
  {
    id: 'tire-1',
    category: 'Tires',
    item: 'Front Left Tire',
    description: 'Check tread depth and pressure',
    required: true,
    requiresPhoto: true,
    minPhotos: 1,
    maxPhotos: 3,
    passFail: null,
    notes: '',
    photos: [],
    defects: [],
  },
  // ... more items
];

<InspectionPhotoCapture
  vehicleId="VEH-12345"
  inspectionType={InspectionType.PRE_TRIP}
  checklist={checklist}
  onComplete={(report) => {
    console.log('Inspection completed:', report);
    // Submit to API
  }}
  onCancel={() => {
    console.log('Inspection cancelled');
  }}
/>
```

**Features:**
- Progress tracking (e.g., "Item 5 of 20")
- Pass/Fail/N/A/Requires Attention status
- Photo requirement validation
- Defect logging with severity
- Immediate action flags
- Statistics dashboard
- Validation before submission

---

### PhotoAnnotation

Interactive photo annotation with drawing tools.

```typescript
import { PhotoAnnotation } from '@fleet/mobile';

<PhotoAnnotation
  photo={capturedPhoto}
  existingAnnotations={[]} // Optional: Load existing annotations
  onSave={(annotatedPhoto) => {
    console.log('Photo annotated and saved:', annotatedPhoto);
    // Upload or store annotated photo
  }}
  onCancel={() => {
    console.log('Annotation cancelled');
  }}
  readOnly={false} // Set to true for viewing only
/>
```

**Tools:**
- **Arrow**: Point to specific damage areas
- **Circle**: Highlight circular regions
- **Rectangle**: Mark rectangular areas
- **Freehand**: Draw custom shapes
- **Text**: Add labels and notes
- **Marker**: Numbered location pins

**Features:**
- Unlimited undo/redo
- 9 preset colors
- 5 stroke widths
- Clear all annotations
- Annotation counter
- Save as new image

---

## Services

### CameraService

Singleton service for all camera and photo operations.

```typescript
import CameraService from '@fleet/mobile';

// Capture photo with GPS
const photo = await CameraService.capturePhoto(cameraRef, {
  quality: 85,
  maxWidth: 1920,
  maxHeight: 1920,
  includeGPS: true,
  flashMode: FlashMode.AUTO,
});

// Compress photo
const compressed = await CameraService.compressPhoto(photo, {
  quality: 70,
  maxWidth: 1024,
  maxHeight: 1024,
});

// Get current location
const location = await CameraService.getCurrentLocation();

// Add to offline queue
await CameraService.addToQueue(
  QueueItemType.DAMAGE_REPORT,
  damageReport,
  10 // priority
);

// Process queue
await CameraService.processQueue();
```

---

## Utilities

### Offline Sync

Network monitoring and queue management.

```typescript
import { networkMonitor, syncQueue, SyncStats } from '@fleet/mobile';

// Check network status
const isOnline = networkMonitor.isOnline();

// Listen for network changes
networkMonitor.addListener((connected) => {
  console.log('Network status:', connected ? 'Online' : 'Offline');
});

// Add to sync queue
await syncQueue.addToQueue(QueueItemType.PHOTO_UPLOAD, photoData, 8);

// Get sync statistics
const stats = await SyncStats.getStatistics();
console.log(SyncStats.formatStatistics(stats));

// Process queue with custom handler
await syncQueue.processQueue(async (item) => {
  // Custom sync logic
  await api.upload(item.data);
});
```

### GPS Utilities

Location services and calculations.

```typescript
import {
  gpsService,
  DistanceCalculator,
  geofenceManager,
  routeTracker,
  CoordinateUtils,
} from '@fleet/mobile';

// Get current location
const location = await gpsService.getCurrentLocation();

// Start watching location
gpsService.startWatching((location) => {
  console.log('Location updated:', location);
});

// Calculate distance
const distance = DistanceCalculator.calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 34.0522, longitude: -118.2437 }
);
console.log('Distance:', DistanceCalculator.formatDistance(distance));

// Setup geofence
geofenceManager.addGeofence({
  id: 'depot-1',
  name: 'Main Depot',
  center: { latitude: 40.7128, longitude: -74.0060 },
  radius: 500, // meters
  active: true,
});

// Track route
routeTracker.startTracking();
// ... add location points
const route = routeTracker.stopTracking();
```

---

## Usage Examples

### Complete Damage Report Flow

```typescript
import React from 'react';
import { DamageReportCamera } from '@fleet/mobile';

const DamageReportScreen = ({ route, navigation }) => {
  const { vehicleId } = route.params;

  const handleComplete = async (report) => {
    try {
      // Submit to API
      await api.submitDamageReport(report);

      // Show success
      Alert.alert('Success', 'Damage report submitted successfully!');

      // Navigate back
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. It has been saved for offline sync.');
    }
  };

  return (
    <DamageReportCamera
      vehicleId={vehicleId}
      onComplete={handleComplete}
      onCancel={() => navigation.goBack()}
    />
  );
};
```

### Complete Inspection Flow

```typescript
import React, { useState, useEffect } from 'react';
import { InspectionPhotoCapture, InspectionType } from '@fleet/mobile';

const InspectionScreen = ({ route, navigation }) => {
  const { vehicleId } = route.params;
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    // Load inspection template from API or local storage
    const template = await api.getInspectionTemplate(InspectionType.PRE_TRIP);
    setChecklist(template.items);
  };

  const handleComplete = async (report) => {
    try {
      await api.submitInspectionReport(report);
      Alert.alert('Success', 'Inspection completed!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit. Saved for offline sync.');
    }
  };

  return (
    <InspectionPhotoCapture
      vehicleId={vehicleId}
      inspectionType={InspectionType.PRE_TRIP}
      checklist={checklist}
      onComplete={handleComplete}
      onCancel={() => navigation.goBack()}
    />
  );
};
```

---

## File Structure

```
/home/user/Fleet/mobile/src/
├── components/
│   ├── DamageReportCamera.tsx       # Damage report UI
│   ├── InspectionPhotoCapture.tsx   # Inspection UI
│   └── PhotoAnnotation.tsx          # Annotation UI
├── services/
│   └── CameraService.ts             # Camera operations
├── utils/
│   ├── offlineSync.ts               # Offline sync utilities
│   └── gpsUtils.ts                  # GPS utilities
├── types/
│   └── index.ts                     # TypeScript definitions
└── index.ts                         # Main exports
```

---

## Dependencies

### Core React Native
- `react`: ^18.2.0
- `react-native`: ^0.72.0

### Camera & Media
- `react-native-vision-camera`: ^3.6.0
- `react-native-image-resizer`: ^3.0.0
- `react-native-view-shot`: ^3.8.0

### Location Services
- `react-native-geolocation-service`: ^5.3.0

### Voice Recognition
- `@react-native-voice/voice`: ^3.2.0

### Storage & Network
- `@react-native-async-storage/async-storage`: ^1.19.0
- `@react-native-community/netinfo`: ^11.0.0
- `react-native-fs`: ^2.20.0

### UI & Drawing
- `react-native-svg`: ^13.14.0

---

## Permissions

### iOS (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture vehicle photos and damage reports</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to tag photos with GPS coordinates</string>

<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice-to-text descriptions</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save vehicle photos</string>
```

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

---

## Type Safety

All components and services are fully typed with TypeScript:

```typescript
// Example: Damage Report Type
interface DamageReport {
  id: string;
  vehicleId: string;
  reportedBy: string;
  reportedAt: Date;
  photos: DamagePhoto[];
  severity: DamageSeverity;
  description: string;
  voiceTranscription?: string;
  damageLocations: DamageLocation[];
  estimatedCost?: number;
  status: DamageReportStatus;
  syncStatus: SyncStatus;
}
```

All types are exported from `/home/user/Fleet/mobile/src/types/index.ts`.

---

## Summary

### Files Created

| File | Lines | Description |
|------|-------|-------------|
| `types/index.ts` | 474 | Complete TypeScript type definitions |
| `services/CameraService.ts` | 706 | Camera and photo operations service |
| `components/DamageReportCamera.tsx` | 1,042 | Damage report component |
| `components/InspectionPhotoCapture.tsx` | 1,384 | Inspection component |
| `components/PhotoAnnotation.tsx` | 1,019 | Photo annotation component |
| `utils/offlineSync.ts` | 624 | Offline sync utilities |
| `utils/gpsUtils.ts` | 661 | GPS utilities |
| `index.ts` | 123 | Main exports |
| **TOTAL** | **6,033** | **Production-ready code** |

### Key Features

✅ **3 Major Components**: DamageReportCamera, InspectionPhotoCapture, PhotoAnnotation
✅ **Full Type Safety**: 474 lines of TypeScript definitions
✅ **Offline-First**: Complete queue management and sync system
✅ **GPS Integration**: Location tagging and tracking utilities
✅ **Image Processing**: Compression, resizing, and EXIF metadata
✅ **Voice-to-Text**: Integrated speech recognition
✅ **6 Drawing Tools**: Arrow, circle, rectangle, freehand, text, markers
✅ **Production Ready**: Error handling, validation, and user feedback

### Libraries Used

- react-native-vision-camera
- react-native-image-resizer
- react-native-fs
- react-native-geolocation-service
- @react-native-voice/voice
- react-native-svg
- react-native-view-shot

---

## License

PROPRIETARY - Fleet Team

---

## Support

For questions or issues, contact the Fleet Team development team.
