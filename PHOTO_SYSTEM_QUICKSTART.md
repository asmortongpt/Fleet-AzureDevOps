# Fleet Photo Upload System - Quick Start Guide

Get started with the Fleet mobile photo upload system in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- Azure Storage Account created
- React Native development environment set up

---

## 1. Install Dependencies

### API Server

```bash
cd /home/user/Fleet/api
npm install exifreader
```

All other dependencies (`@azure/storage-blob`, `sharp`, `multer`) are already installed.

### Mobile App

```bash
cd /home/user/Fleet/mobile
npm install
```

**iOS Additional Step:**
```bash
cd ios
pod install
cd ..
```

---

## 2. Configure Environment

### API Server (.env)

Add to `/home/user/Fleet/api/.env`:

```env
# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net

# Photo Processing Configuration
PHOTO_PROCESSING_INTERVAL=10000
PHOTO_PROCESSING_BATCH_SIZE=5
PHOTO_MAX_RETRIES=3
```

### Mobile App

Create `/home/user/Fleet/mobile/src/config/azure.ts`:

```typescript
export const azureConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  containerName: 'mobile-photos',
  thumbnailContainerName: 'mobile-thumbnails',
  compressedContainerName: 'mobile-photos-compressed',
};
```

---

## 3. Run Database Migration

```bash
cd /home/user/Fleet/api

# Using psql
psql -U postgres -d fleet_db -f src/migrations/024_photo_processing_queue.sql

# OR using the migration script
npm run migrate
```

**Expected Output:**
```
====================================================
Photo Processing Queue Migration Completed Successfully!
====================================================
Mobile Photos: 0
Processing Queue Jobs: 0

New Tables:
  - photo_processing_queue

Enhanced Tables:
  - mobile_photos (added processing columns)
  - damage_reports (added photo columns)
  - vehicle_inspections (added photo columns)
  - fuel_transactions (added receipt columns)

New Views:
  - photo_processing_stats
  - photo_queue_health
  - user_photo_activity
  - stuck_processing_jobs
====================================================
```

---

## 4. Register API Routes

Edit `/home/user/Fleet/api/src/server.ts`:

```typescript
import mobilePhotosRoutes from './routes/mobile-photos.routes';
import photoProcessingService from './services/photo-processing.service';

// ... existing imports ...

// Register routes (add with other route registrations)
app.use('/api/mobile/photos', mobilePhotosRoutes);

// Initialize photo processing service
const initializePhotoProcessing = async () => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      console.warn('Azure Storage not configured - photo processing disabled');
      return;
    }

    await photoProcessingService.initialize(connectionString);
    photoProcessingService.startProcessingQueue();

    console.log('✓ Photo processing queue started');
  } catch (error) {
    console.error('Failed to start photo processing:', error);
  }
};

// Call after database connection
pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL');
    initializePhotoProcessing();
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// ... rest of server setup ...
```

---

## 5. Start API Server

```bash
cd /home/user/Fleet/api
npm run dev
```

**Check Logs:**
```
✓ Connected to PostgreSQL
✓ PhotoProcessingService initialized successfully
✓ Photo processing queue started
✓ Server running on port 5000
```

---

## 6. Initialize Mobile Services

Create `/home/user/Fleet/mobile/src/App.tsx` (or update existing):

```typescript
import React, { useEffect } from 'react';
import PhotoUploadService from './services/PhotoUploadService';
import OfflinePhotoQueue from './services/OfflinePhotoQueue';
import { azureConfig } from './config/azure';

const App = () => {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize photo upload service
        await PhotoUploadService.initialize(azureConfig.connectionString);
        console.log('✓ PhotoUploadService initialized');

        // Initialize offline queue with auto-sync
        await OfflinePhotoQueue.initialize(true);
        console.log('✓ OfflinePhotoQueue initialized');

      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      OfflinePhotoQueue.dispose();
    };
  }, []);

  return (
    // Your app components here
  );
};

export default App;
```

---

## 7. Test Upload

### Option A: Using Mobile App

Create a test screen:

```typescript
import React from 'react';
import { View, Button, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import OfflinePhotoQueue from '../services/OfflinePhotoQueue';

const TestUploadScreen = () => {
  const handleUpload = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (result.assets && result.assets[0]) {
      try {
        const photoId = await OfflinePhotoQueue.addToQueue(
          result.assets[0].uri!,
          {
            metadata: {
              reportType: 'general',
              description: 'Test upload',
            },
          },
          'high'
        );

        Alert.alert('Success', `Photo queued: ${photoId}`);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Upload Photo" onPress={handleUpload} />
    </View>
  );
};

export default TestUploadScreen;
```

### Option B: Using API (curl)

```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.com","password":"password"}' \
  | jq -r '.token')

# Upload test photo
curl -X POST http://localhost:5000/api/mobile/photos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@test-photo.jpg" \
  -F "metadata={\"reportType\":\"general\"}" \
  -F "priority=high"

# Expected Response:
# {
#   "success": true,
#   "photo": {
#     "id": 1,
#     "url": "https://blob.core.windows.net/mobile-photos/...",
#     "fileName": "test-photo.jpg",
#     "uploadedAt": "2024-01-15T10:30:00.000Z"
#   }
# }
```

---

## 8. Monitor Processing

### Check Queue Status

```sql
-- Connect to database
psql -U postgres -d fleet_db

-- Check queue
SELECT status, priority, COUNT(*)
FROM photo_processing_queue
GROUP BY status, priority;

-- View stats
SELECT * FROM photo_processing_stats;

-- Check for stuck jobs
SELECT * FROM stuck_processing_jobs;
```

### API Endpoint

```bash
curl http://localhost:5000/api/mobile/photos/processing/stats \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "stats": {
#     "byStatus": {
#       "pending": 5,
#       "processing": 2,
#       "completed": 100,
#       "failed": 0
#     },
#     "byPriority": {
#       "high": 10,
#       "normal": 95,
#       "low": 2
#     }
#   }
# }
```

---

## 9. Verify Processing Results

```sql
-- Check processed photos
SELECT
  id,
  file_name,
  thumbnail_url IS NOT NULL as has_thumbnail,
  compressed_url IS NOT NULL as has_compressed,
  exif_data IS NOT NULL as has_exif,
  ocr_text IS NOT NULL as has_ocr,
  processed_at
FROM mobile_photos
ORDER BY created_at DESC
LIMIT 10;
```

---

## 10. Common Commands

### Mobile App

```bash
# Run on iOS
npm run ios

# Run on Android
npm run android

# View logs
npx react-native log-ios
npx react-native log-android
```

### API

```bash
# Start dev server
npm run dev

# Run migrations
npm run migrate

# View logs
tail -f logs/api.log
```

### Database

```sql
-- Clear all photos (dev only!)
DELETE FROM photo_processing_queue;
DELETE FROM mobile_photos;

-- Retry failed jobs
UPDATE photo_processing_queue
SET status = 'pending', retry_count = 0
WHERE status = 'failed';

-- Manual cleanup
SELECT cleanup_old_processing_queue_entries();
```

---

## Troubleshooting

### Issue: Photos not uploading

**Check:**
1. Azure connection string is correct
2. Network connectivity
3. Mobile app permissions

```typescript
// Test Azure connection
import PhotoUploadService from './services/PhotoUploadService';

const test = async () => {
  try {
    await PhotoUploadService.initialize(connectionString);
    console.log('Connection successful');
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

### Issue: Processing queue not running

**Check:**
1. API server logs for errors
2. Azure Storage connectivity
3. Database connection

```bash
# Restart processing queue
curl -X POST http://localhost:5000/api/mobile/photos/processing/restart \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Issue: Stuck jobs

**Fix:**
```sql
-- Find stuck jobs
SELECT * FROM stuck_processing_jobs;

-- Reset stuck jobs
UPDATE photo_processing_queue
SET status = 'pending', processing_started_at = NULL
WHERE status = 'processing'
  AND processing_started_at < NOW() - INTERVAL '1 hour';
```

---

## Example Workflows

### 1. Damage Report Upload

```typescript
const uploadDamagePhoto = async (vehicleId: number, photoUri: string) => {
  const photoId = await OfflinePhotoQueue.addToQueue(
    photoUri,
    {
      metadata: {
        vehicleId,
        reportType: 'damage',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        tags: ['front-bumper', 'scratch'],
        description: 'Minor scratch on front bumper',
      },
    },
    'high' // High priority for damage reports
  );

  return photoId;
};
```

### 2. Vehicle Inspection Photos

```typescript
const uploadInspectionPhotos = async (
  inspectionId: number,
  photoUris: string[]
) => {
  const photoIds = await OfflinePhotoQueue.addBatchToQueue(
    photoUris.map(uri => ({
      uri,
      options: {
        metadata: {
          inspectionId,
          reportType: 'inspection',
        },
      },
      priority: 'normal',
    }))
  );

  return photoIds;
};
```

### 3. Fuel Receipt OCR

```typescript
const uploadFuelReceipt = async (
  fuelTransactionId: number,
  receiptUri: string
) => {
  const photoId = await OfflinePhotoQueue.addToQueue(
    receiptUri,
    {
      metadata: {
        fuelTransactionId,
        reportType: 'fuel',
      },
    },
    'normal'
  );

  return photoId;
};
```

---

## Performance Tips

### Mobile App

1. **Compress before upload**
   ```typescript
   const options = {
     compress: true,
     maxWidth: 1920,
     maxHeight: 1080,
     quality: 80,
   };
   ```

2. **Use WiFi for large batches**
   ```typescript
   await OfflinePhotoQueue.startSync({
     onlyOnWiFi: true,
     maxConcurrent: 2,
   });
   ```

3. **Monitor queue size**
   ```typescript
   const stats = OfflinePhotoQueue.getStats();
   if (stats.queued > 50) {
     Alert.alert('Large queue', 'Connect to WiFi to upload faster');
   }
   ```

### API

1. **Increase batch size for high volume**
   ```typescript
   photoProcessingService.BATCH_SIZE = 10;
   ```

2. **Decrease interval for faster processing**
   ```typescript
   photoProcessingService.PROCESSING_INTERVAL = 5000;
   ```

3. **Enable parallel processing**
   ```javascript
   // Run multiple worker instances
   pm2 start api/src/workers/photo-processor.js -i 4
   ```

---

## Next Steps

1. **Add error tracking** - Integrate Sentry or similar
2. **Set up monitoring** - Add Grafana dashboards
3. **Configure alerts** - Slack/email for stuck jobs
4. **Optimize storage** - Enable Azure Blob lifecycle policies
5. **Add analytics** - Track upload patterns

---

## Resources

- Full Documentation: `/home/user/Fleet/PHOTO_UPLOAD_SYSTEM_README.md`
- Database Schema: `/home/user/Fleet/PHOTO_SYSTEM_DATABASE_SCHEMA.md`
- Implementation Summary: `/home/user/Fleet/PHOTO_UPLOAD_IMPLEMENTATION_SUMMARY.md`
- API Reference: http://localhost:5000/api-docs (Swagger)

---

## Support

**Common Issues:** See Troubleshooting section above

**Questions:** Check full documentation in `PHOTO_UPLOAD_SYSTEM_README.md`

**Bugs:** Create issue with:
- Error logs
- Steps to reproduce
- Mobile app version
- API version

---

**Quick Start Version:** 1.0.0
**Last Updated:** November 17, 2025

---

## Checklist

- [ ] Dependencies installed (API + Mobile)
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] API routes registered
- [ ] API server started successfully
- [ ] Mobile services initialized
- [ ] Test upload completed
- [ ] Processing queue running
- [ ] Photo processed successfully
- [ ] Monitoring queries tested

Once all checkboxes are ✓, your photo upload system is ready!
