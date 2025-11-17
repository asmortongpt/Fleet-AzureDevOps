# Quick Start Guide - Mobile OCR

Get up and running with OCR capture in 5 minutes.

## Installation

```bash
cd mobile
npm install
```

## Basic Usage

### 1. Fuel Receipt Capture

```tsx
import FuelReceiptCapture from './src/components/FuelReceiptCapture';

function MyScreen() {
  return (
    <FuelReceiptCapture
      vehicleId="your-vehicle-id"
      driverId="your-driver-id"
      onSave={async (data) => {
        console.log('Saved:', data);
        // data.station, data.gallons, data.totalCost, etc.
      }}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

### 2. Odometer Capture

```tsx
import OdometerCapture from './src/components/OdometerCapture';

function MyScreen() {
  return (
    <OdometerCapture
      vehicleId="your-vehicle-id"
      lastReading={45000}
      onSave={async (data) => {
        console.log('Reading:', data.reading);
        // data.reading, data.unit, data.confidence
      }}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## Configuration

Add to your `.env`:

```env
AZURE_VISION_KEY=your_key_here
AZURE_VISION_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
```

## API Setup

The backend routes are already registered. Just ensure your database is migrated:

```bash
psql -U postgres -d fleet_db -f api/src/migrations/mobile-ocr-tables.sql
```

## Test It

1. Run the mobile app:
   ```bash
   npm run ios  # or npm run android
   ```

2. Navigate to fuel receipt or odometer screen
3. Take a photo or select from gallery
4. Review extracted data
5. Save to backend

## Common Patterns

### Upload to Backend

```tsx
import OCRService from './src/services/OCRService';

const result = await OCRService.uploadAndProcessReceipt(
  imageUri,
  vehicleId,
  driverId,
  'https://api.yourfleet.com',
  authToken
);
```

### Direct OCR Processing

```tsx
// Process locally without upload
const receiptData = await OCRService.processFuelReceipt(imageUri);
const odometerData = await OCRService.processOdometer(imageUri);
```

### Check Confidence

```tsx
Object.entries(data.confidenceScores).forEach(([field, score]) => {
  if (score < 0.8) {
    console.warn(`Low confidence for ${field}: ${score}`);
  }
});
```

## That's It!

You now have production-ready OCR capture working in your app.

For full documentation, see:
- `MOBILE_OCR_IMPLEMENTATION.md` - Complete guide
- `src/examples/OCRIntegrationExample.tsx` - More examples
- `/home/user/Fleet/MOBILE_OCR_IMPLEMENTATION_SUMMARY.md` - Full summary
