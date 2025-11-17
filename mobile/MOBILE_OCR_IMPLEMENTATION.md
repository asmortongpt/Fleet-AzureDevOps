# Mobile OCR Implementation Guide

## Overview

This implementation provides production-ready OCR services for the Fleet mobile app, enabling:
- **Fuel Receipt Capture**: Automatic extraction of fuel transaction data from receipt photos
- **Odometer Reading**: Digital recognition of odometer displays with validation
- **Real-time Processing**: On-device ML Kit OCR with cloud fallback
- **Data Validation**: Comprehensive validation with confidence scoring

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Mobile App (React Native)              │
├─────────────────────────────────────────────────────────┤
│  Components:                                            │
│  - FuelReceiptCapture.tsx                               │
│  - OdometerCapture.tsx                                  │
├─────────────────────────────────────────────────────────┤
│  Services:                                              │
│  - OCRService.ts (ML Kit + Azure Vision)                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│              Backend API (Node.js/Express)              │
├─────────────────────────────────────────────────────────┤
│  Routes:                                                │
│  - POST /api/mobile/fuel-receipts/ocr                   │
│  - POST /api/mobile/odometer/ocr                        │
│  - POST /api/mobile/ocr/validate                        │
│  - GET  /api/mobile/ocr/history                         │
├─────────────────────────────────────────────────────────┤
│  Services:                                              │
│  - OcrService.ts (Tesseract, Google, AWS, Azure)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Database (PostgreSQL)                        │
├─────────────────────────────────────────────────────────┤
│  Tables:                                                │
│  - fuel_transactions                                    │
│  - odometer_readings                                    │
│  - mobile_ocr_captures                                  │
└─────────────────────────────────────────────────────────┘
```

## Installation

### 1. Mobile App Dependencies

```bash
cd mobile
npm install
```

**Required packages:**
- `expo-camera` - Camera functionality
- `expo-image-picker` - Gallery access
- `expo-file-system` - File operations
- `react-native-mlkit-ocr` - On-device OCR
- `zod` - Schema validation

### 2. Backend Dependencies

Already included in the main API. Requires:
- `multer` - File upload handling
- `zod` - Data validation
- Existing OCR service infrastructure

### 3. Database Migration

```bash
psql -U postgres -d fleet_db -f api/src/migrations/mobile-ocr-tables.sql
```

## Configuration

### Environment Variables

**Backend (.env):**
```env
# Azure Computer Vision (Optional - fallback)
AZURE_VISION_KEY=your_azure_vision_key
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/

# Storage paths
MOBILE_OCR_UPLOAD_DIR=/tmp/mobile-ocr-uploads
RECEIPT_STORAGE_PATH=/app/storage/receipts
ODOMETER_STORAGE_PATH=/app/storage/odometer
```

**Mobile App:**
```typescript
// In your app config
export const API_CONFIG = {
  baseUrl: 'https://api.yourfleet.com',
  azureVisionKey: process.env.AZURE_VISION_KEY,
  azureVisionEndpoint: process.env.AZURE_VISION_ENDPOINT,
};
```

## Usage Examples

### 1. Fuel Receipt Capture

```typescript
import React from 'react';
import { View } from 'react-native';
import FuelReceiptCapture from './components/FuelReceiptCapture';

function FuelReceiptScreen({ navigation, route }) {
  const { vehicleId, driverId } = route.params;

  const handleSave = async (data) => {
    try {
      // Data includes:
      // - date, station, gallons, pricePerGallon, totalCost
      // - fuelType, location, paymentMethod, notes
      // - photoUri, confidenceScores

      console.log('Receipt data:', data);
      console.log('Confidence scores:', data.confidenceScores);

      // Navigate back or show success
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save receipt:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <FuelReceiptCapture
        vehicleId={vehicleId}
        driverId={driverId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}
```

### 2. Odometer Capture

```typescript
import React from 'react';
import { View } from 'react-native';
import OdometerCapture from './components/OdometerCapture';

function OdometerScreen({ navigation, route }) {
  const { vehicleId, tripId, lastReading } = route.params;

  const handleSave = async (data) => {
    try {
      // Data includes:
      // - reading, unit, confidence
      // - vehicleId, tripId, reservationId
      // - notes, photoUri

      console.log('Odometer reading:', data.reading);
      console.log('Confidence:', data.confidence);

      // Navigate back or show success
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save odometer:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <OdometerCapture
        vehicleId={vehicleId}
        tripId={tripId}
        lastReading={lastReading}
        lastReadingDate="2024-01-15"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}
```

### 3. Direct OCR Service Usage

```typescript
import OCRService from './services/OCRService';

// Process fuel receipt
async function processReceipt(imageUri: string) {
  try {
    const result = await OCRService.processFuelReceipt(imageUri);

    console.log('Station:', result.station);
    console.log('Gallons:', result.gallons);
    console.log('Total:', result.totalCost);
    console.log('Confidence:', result.confidenceScores);

    return result;
  } catch (error) {
    console.error('OCR failed:', error);
  }
}

// Process odometer
async function processOdometer(imageUri: string) {
  try {
    const result = await OCRService.processOdometer(imageUri);

    console.log('Reading:', result.reading);
    console.log('Unit:', result.unit);
    console.log('Confidence:', result.confidence);

    return result;
  } catch (error) {
    console.error('OCR failed:', error);
  }
}

// Upload to backend
async function uploadReceipt(imageUri: string, vehicleId: string) {
  try {
    const result = await OCRService.uploadAndProcessReceipt(
      imageUri,
      vehicleId,
      driverId,
      'https://api.yourfleet.com',
      authToken
    );

    console.log('Transaction created:', result.transaction);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## API Endpoints

### POST /api/mobile/fuel-receipts/ocr

Upload and process fuel receipt image.

**Request:**
```bash
curl -X POST https://api.yourfleet.com/api/mobile/fuel-receipts/ocr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg" \
  -F "vehicleId=123e4567-e89b-12d3-a456-426614174000" \
  -F "driverId=123e4567-e89b-12d3-a456-426614174001"
```

**Response:**
```json
{
  "message": "Fuel receipt processed successfully",
  "transaction": {
    "id": "987fcdeb-51a2-43f1-9c4d-5b7e8a9f0e1d",
    "vehicle_id": "123e4567-e89b-12d3-a456-426614174000",
    "gallons": 12.345,
    "price_per_gallon": 3.459,
    "total_cost": 42.70,
    "station": "Shell",
    "transaction_date": "2024-01-20T14:30:00Z"
  },
  "ocrData": {
    "date": "01/20/2024",
    "station": "Shell",
    "gallons": 12.345,
    "pricePerGallon": 3.459,
    "totalCost": 42.70,
    "fuelType": "Regular",
    "location": "San Francisco, CA"
  },
  "confidenceScores": {
    "date": 0.92,
    "station": 0.95,
    "gallons": 0.89,
    "pricePerGallon": 0.87,
    "totalCost": 0.91
  },
  "documentId": "fuel-receipt-1705759800000-abc123"
}
```

### POST /api/mobile/odometer/ocr

Upload and process odometer reading image.

**Request:**
```bash
curl -X POST https://api.yourfleet.com/api/mobile/odometer/ocr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@odometer.jpg" \
  -F "vehicleId=123e4567-e89b-12d3-a456-426614174000" \
  -F "tripId=456e7890-e89b-12d3-a456-426614174002"
```

**Response:**
```json
{
  "message": "Odometer reading processed successfully",
  "reading": {
    "id": "789fcdeb-51a2-43f1-9c4d-5b7e8a9f0e1d",
    "vehicle_id": "123e4567-e89b-12d3-a456-426614174000",
    "odometer_reading": 45678.5,
    "unit": "miles",
    "reading_type": "ocr",
    "confidence_score": 0.94,
    "reading_date": "2024-01-20T14:30:00Z"
  },
  "ocrData": {
    "reading": 45678.5,
    "unit": "miles",
    "confidence": 0.94
  },
  "confidence": 0.94,
  "documentId": "odometer-1705759800000-xyz789"
}
```

### POST /api/mobile/ocr/validate

Validate extracted OCR data before submission.

**Request:**
```json
{
  "type": "fuel-receipt",
  "data": {
    "date": "01/20/2024",
    "station": "Shell",
    "gallons": 12.345,
    "pricePerGallon": 3.459,
    "totalCost": 42.70,
    "confidenceScores": {
      "gallons": 0.75
    }
  }
}
```

**Response:**
```json
{
  "valid": true,
  "data": { /* validated data */ },
  "warnings": [
    "Low confidence (75%) for field: gallons"
  ]
}
```

### GET /api/mobile/ocr/history

Get OCR capture history.

**Request:**
```bash
curl https://api.yourfleet.com/api/mobile/ocr/history?type=fuel_receipt&limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "captures": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "capture_type": "fuel_receipt",
      "document_id": "fuel-receipt-1705759800000-abc123",
      "ocr_data": { /* extracted data */ },
      "confidence_scores": { /* field confidences */ },
      "created_at": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

## Features

### Fuel Receipt Capture

**Extracted Fields:**
- ✅ Date (various formats)
- ✅ Station name (automatic recognition of major brands)
- ✅ Gallons/volume
- ✅ Price per gallon
- ✅ Total cost
- ✅ Fuel type (Regular, Premium, Diesel)
- ✅ Location (city, state)
- ✅ Payment method

**Capabilities:**
- Auto-cropping guide overlay
- Real-time OCR preview
- Confidence score display (per field)
- Manual correction interface
- Automatic calculation of missing values
- Expense categorization

### Odometer Capture

**Features:**
- Camera overlay with digit guide boxes
- Real-time digit recognition
- Historical reading validation
- Rollback detection (reading < last reading)
- Large increase alerts (>1000 miles)
- Unit selection (miles/kilometers)
- Trip/reservation linking

**Validation:**
- Cannot be less than previous reading
- Alerts on suspicious increases
- Confidence scoring
- Photo verification

## OCR Providers

### 1. ML Kit (Primary - On-device)

**Pros:**
- Free
- No internet required
- Fast processing
- Privacy-friendly
- Works offline

**Cons:**
- Moderate accuracy
- Limited form understanding

### 2. Azure Computer Vision (Fallback)

**Pros:**
- High accuracy
- Good handwriting recognition
- Form understanding
- Multi-language support

**Cons:**
- Requires internet
- Costs money
- Privacy considerations

## Data Validation

All OCR data is validated using Zod schemas:

```typescript
// Fuel receipt validation
const FuelReceiptSchema = z.object({
  date: z.string().min(1),
  station: z.string().min(1),
  gallons: z.number().positive(),
  pricePerGallon: z.number().positive(),
  totalCost: z.number().positive(),
  fuelType: z.string().optional(),
  location: z.string().optional(),
  paymentMethod: z.string().optional(),
});

// Odometer validation
const OdometerSchema = z.object({
  reading: z.number().positive(),
  unit: z.enum(['miles', 'kilometers']),
  confidence: z.number().min(0).max(1),
});
```

## Confidence Scoring

Confidence scores help users understand OCR accuracy:

| Score | Color | Meaning | Action |
|-------|-------|---------|--------|
| 90-100% | 🟢 Green | High confidence | Auto-accept |
| 80-89% | 🟡 Yellow | Medium confidence | Review recommended |
| 0-79% | 🔴 Red | Low confidence | Manual correction required |

## Error Handling

### OCR Failures
- Automatic fallback to Azure Vision
- Option for manual entry
- Retry capability

### Validation Errors
- Clear error messages
- Field-level feedback
- Guided correction

### Network Errors
- Local processing continues
- Queued upload on reconnection
- Offline capability

## Testing

### Unit Tests
```bash
cd mobile
npm test
```

### Integration Tests
```bash
# Test OCR endpoints
curl -X POST http://localhost:3000/api/mobile/fuel-receipts/ocr \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-receipt.jpg" \
  -F "vehicleId=$VEHICLE_ID"
```

### Manual Testing Checklist
- [ ] Camera permissions granted
- [ ] Photo capture works
- [ ] Gallery selection works
- [ ] OCR extracts data correctly
- [ ] Confidence scores displayed
- [ ] Manual editing works
- [ ] Validation catches errors
- [ ] Save succeeds
- [ ] Data appears in backend

## Performance

### Mobile OCR Processing
- On-device: 1-3 seconds
- Azure fallback: 2-5 seconds
- Total with upload: 3-8 seconds

### Optimization Tips
- Use ML Kit for immediate feedback
- Cache Azure credentials
- Compress images before upload
- Batch multiple captures
- Implement request queuing

## Security

### Best Practices
- ✅ Authentication required for all endpoints
- ✅ File type validation
- ✅ File size limits (10MB)
- ✅ Path traversal prevention
- ✅ Tenant isolation
- ✅ Audit logging
- ✅ HTTPS only
- ✅ Token expiration

### Privacy
- Photos stored in tenant-isolated directories
- OCR data encrypted at rest
- Automatic cleanup of old captures
- GDPR compliance ready

## Troubleshooting

### Issue: OCR returns no data
**Solution:**
- Ensure good lighting
- Hold camera steady
- Use auto-cropping guide
- Try Azure fallback

### Issue: Low confidence scores
**Solution:**
- Retake photo with better angle
- Ensure receipt is flat
- Check for shadows/glare
- Manual correction available

### Issue: Validation errors
**Solution:**
- Review extracted fields
- Check for missing data
- Use manual entry if needed
- Verify calculations

## Roadmap

Future enhancements:
- [ ] Receipt expense categories
- [ ] Multi-page receipt support
- [ ] Automatic receipt matching
- [ ] Machine learning improvements
- [ ] Damage report OCR
- [ ] License plate recognition
- [ ] VIN barcode scanning
- [ ] QR code integration

## Support

For issues or questions:
- GitHub Issues: [github.com/yourorg/fleet/issues]
- Documentation: [docs.yourfleet.com/mobile-ocr]
- Email: support@yourfleet.com

## License

Copyright © 2024 Fleet Management System
