# Fleet Mobile Photo Upload & Processing System

Comprehensive photo processing queue and upload system for the Fleet mobile app with offline support, Azure Blob Storage integration, and automated processing.

## Overview

This system provides a complete solution for handling photo uploads from mobile devices with:

- **Offline-first architecture** - Queue photos when offline, auto-sync when connected
- **Azure Blob Storage integration** - Scalable cloud storage
- **Background processing** - Thumbnails, compression, EXIF extraction, OCR
- **Priority queue** - High-priority photos (damage reports) processed first
- **Retry logic** - Automatic retry with exponential backoff
- **Progress tracking** - Real-time upload and processing status

## Architecture

```
Mobile App (React Native)
    ↓
PhotoUploadService (Direct to Azure Blob)
    ↓
OfflinePhotoQueue (AsyncStorage persistence)
    ↓
API Routes (/api/mobile/photos/*)
    ↓
PhotoProcessingService (Background queue)
    ↓
Database (PostgreSQL + Azure Blob Storage)
```

## Components

### 1. Mobile Services

#### PhotoUploadService (`/mobile/src/services/PhotoUploadService.ts`)

**Features:**
- Multipart file upload to Azure Blob Storage
- Progress tracking with callbacks
- Retry logic with exponential backoff (max 3 retries)
- Background upload support
- Batch upload optimization (max 3 concurrent uploads)
- Cancel upload support
- Image compression and optimization
- Automatic thumbnail generation

**Usage:**
```typescript
import PhotoUploadService from './services/PhotoUploadService';

// Initialize
await PhotoUploadService.initialize(azureConnectionString);

// Upload single photo
const result = await PhotoUploadService.uploadPhoto(
  fileUri,
  {
    compress: true,
    generateThumbnail: true,
    priority: 'high',
    metadata: {
      vehicleId: 123,
      reportType: 'damage',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    onProgress: (progress) => {
      console.log(`Upload ${progress.percentage}% complete`);
    },
    onComplete: (result) => {
      console.log('Upload completed:', result.blobUrl);
    },
  }
);

// Batch upload
const batchResult = await PhotoUploadService.uploadBatch(
  [
    { uri: file1Uri, options: { priority: 'high' } },
    { uri: file2Uri, options: { priority: 'normal' } },
  ],
  (completed, total) => {
    console.log(`Batch: ${completed}/${total} completed`);
  }
);

// Cancel upload
await PhotoUploadService.cancelUpload(uploadId);
```

#### OfflinePhotoQueue (`/mobile/src/services/OfflinePhotoQueue.ts`)

**Features:**
- Queue photos when offline using AsyncStorage
- Auto-sync when connectivity restored
- Priority queue (high → normal → low)
- Upload status tracking
- Error handling with configurable retry
- Background sync support
- Network state monitoring

**Usage:**
```typescript
import OfflinePhotoQueue from './services/OfflinePhotoQueue';

// Initialize with auto-sync
await OfflinePhotoQueue.initialize(true);

// Add photo to queue
const photoId = await OfflinePhotoQueue.addToQueue(
  fileUri,
  {
    metadata: { vehicleId: 123, reportType: 'damage' },
    priority: 'high',
  },
  'high' // priority
);

// Start manual sync
await OfflinePhotoQueue.startSync({
  onlyOnWiFi: true,
  maxConcurrent: 2,
  onProgress: (stats) => {
    console.log(`Queue: ${stats.queued} pending, ${stats.completed} done`);
  },
  onPhotoComplete: (photo) => {
    console.log('Photo uploaded:', photo.fileName);
  },
  onSyncComplete: (stats) => {
    console.log('Sync completed:', stats);
  },
});

// Subscribe to queue updates
const unsubscribe = OfflinePhotoQueue.subscribe((stats) => {
  console.log('Queue stats:', stats);
});

// Get queue statistics
const stats = OfflinePhotoQueue.getStats();
// { total: 10, queued: 5, uploading: 2, completed: 3, failed: 0 }

// Retry failed uploads
await OfflinePhotoQueue.retryFailed();

// Clear completed
await OfflinePhotoQueue.clearCompleted();

// Cleanup
unsubscribe();
await OfflinePhotoQueue.dispose();
```

### 2. API Services

#### PhotoProcessingService (`/api/src/services/photo-processing.service.ts`)

**Features:**
- Queue-based asynchronous processing
- Generate thumbnails (300x300)
- Extract EXIF data (GPS, camera info, timestamp)
- Compress images for storage
- OCR processing for receipts/documents
- Update related database records
- Automatic retry on failure

**Processing Pipeline:**
1. Download photo from Azure Blob Storage
2. Extract EXIF metadata (GPS coordinates, camera info)
3. Generate thumbnail (300x300, 80% quality)
4. Compress original (max 1920px, 85% quality)
5. Run OCR if needed (fuel receipts, damage reports)
6. Update database with results
7. Update related records (damage_reports, inspections, fuel_transactions)

**Usage:**
```typescript
import photoProcessingService from './services/photo-processing.service';

// Initialize
await photoProcessingService.initialize(azureConnectionString);

// Start background worker
photoProcessingService.startProcessingQueue();

// Add to queue
const jobId = await photoProcessingService.addToQueue(
  tenantId,
  userId,
  photoId,
  blobUrl,
  'high' // priority
);

// Process single photo manually
const result = await photoProcessingService.processPhoto(
  photoId,
  blobUrl,
  {
    generateThumbnail: true,
    compress: true,
    extractExif: true,
    runOcr: true,
    updateRelatedRecords: true,
  }
);

// Get queue stats
const stats = await photoProcessingService.getQueueStats(tenantId);

// Retry failed jobs
await photoProcessingService.retryFailed(tenantId);

// Cleanup old completed jobs
await photoProcessingService.clearCompletedJobs(30); // older than 30 days
```

### 3. API Routes

#### Mobile Photos Routes (`/api/src/routes/mobile-photos.routes.ts`)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mobile/photos/upload` | Upload single photo |
| POST | `/api/mobile/photos/upload-batch` | Upload multiple photos (max 20) |
| GET | `/api/mobile/photos/sync-queue` | Get pending uploads for sync |
| POST | `/api/mobile/photos/sync-complete` | Mark photos as synced |
| GET | `/api/mobile/photos/status/:id` | Get upload/processing status |
| GET | `/api/mobile/photos/:id` | Get photo details |
| DELETE | `/api/mobile/photos/:id` | Delete photo |
| GET | `/api/mobile/photos/processing/stats` | Processing queue statistics |

**Upload Single Photo:**
```bash
curl -X POST http://localhost:5000/api/mobile/photos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/photo.jpg" \
  -F "metadata={\"vehicleId\":123,\"reportType\":\"damage\"}" \
  -F "priority=high"
```

**Upload Batch:**
```bash
curl -X POST http://localhost:5000/api/mobile/photos/upload-batch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg" \
  -F "metadata=[{\"vehicleId\":123},{\"vehicleId\":124}]"
```

**Get Sync Queue:**
```bash
curl -X GET "http://localhost:5000/api/mobile/photos/sync-queue?since=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Mark as Synced:**
```bash
curl -X POST http://localhost:5000/api/mobile/photos/sync-complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "photoIds": [1, 2, 3],
    "deviceId": "device-uuid-123"
  }'
```

**Get Processing Stats:**
```bash
curl -X GET http://localhost:5000/api/mobile/photos/processing/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

### New Table: `photo_processing_queue`

```sql
CREATE TABLE photo_processing_queue (
    id UUID PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    blob_url TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority VARCHAR(10) CHECK (priority IN ('high', 'normal', 'low')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Enhanced Table: `mobile_photos`

**New Columns:**
- `thumbnail_url` - URL of generated thumbnail
- `compressed_url` - URL of compressed image
- `exif_data` - JSONB containing EXIF metadata
- `ocr_text` - Extracted text from OCR
- `width` / `height` - Image dimensions
- `file_size` - File size in bytes
- `mime_type` - MIME type
- `processed_at` - Processing completion timestamp
- `synced_at` - Sync timestamp
- `synced_from_device` - Device ID that synced

### Updated Tables

**`damage_reports`:**
- `processed_photo_url` - Processed/compressed photo
- `thumbnail_url` - Thumbnail for preview
- `photo_metadata` - JSONB metadata

**`vehicle_inspections`:**
- `photo_urls` - JSONB array of photo URLs
- `photo_count` - Number of photos

**`fuel_transactions`:**
- `receipt_url` - Receipt photo URL
- `receipt_thumbnail_url` - Receipt thumbnail
- `receipt_ocr_text` - OCR extracted text
- `receipt_ocr_data` - JSONB structured OCR data

### Views

**`photo_processing_stats`:**
```sql
SELECT tenant_id, total_photos, processed_photos,
       photos_with_thumbnails, photos_compressed,
       total_storage_bytes, last_7_days, last_30_days
FROM photo_processing_stats;
```

**`photo_queue_health`:**
```sql
SELECT tenant_id, status, priority, job_count,
       avg_retries, oldest_job_minutes
FROM photo_queue_health;
```

**`user_photo_activity`:**
```sql
SELECT user_id, user_name, total_photos,
       photos_last_7_days, total_storage_bytes,
       last_upload_at
FROM user_photo_activity;
```

## Installation

### Mobile App Dependencies

```bash
cd /home/user/Fleet/mobile
npm install
```

**Required packages:**
- `@azure/storage-blob` - Azure Blob Storage SDK
- `@react-native-async-storage/async-storage` - Persistent storage
- `@react-native-community/netinfo` - Network state
- `react-native-fs` - File system access
- `@bam.tech/react-native-image-resizer` - Image compression
- `uuid` - Unique ID generation
- `exifreader` - EXIF data extraction

### API Dependencies

Already included in `/home/user/Fleet/api/package.json`:
- `@azure/storage-blob` ✓
- `sharp` ✓
- `multer` ✓

**Additional required:**
```bash
cd /home/user/Fleet/api
npm install exifreader
```

### Database Migration

```bash
cd /home/user/Fleet/api
psql -U postgres -d fleet_db -f src/migrations/024_photo_processing_queue.sql
```

Or using the migration script:
```bash
npm run migrate
```

## Configuration

### Environment Variables

**API (.env):**
```env
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...

# Processing Queue
PHOTO_PROCESSING_INTERVAL=10000
PHOTO_PROCESSING_BATCH_SIZE=5
PHOTO_MAX_RETRIES=3
```

**Mobile App:**
```typescript
// config.ts
export const config = {
  azureStorage: {
    connectionString: 'YOUR_CONNECTION_STRING',
    containerName: 'mobile-photos',
  },
  upload: {
    maxConcurrent: 3,
    maxRetries: 3,
    chunkSize: 4 * 1024 * 1024, // 4MB
  },
  compression: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 80,
  },
};
```

## API Integration

### Register Routes in Server

Add to `/home/user/Fleet/api/src/server.ts`:

```typescript
import mobilePhotosRoutes from './routes/mobile-photos.routes';

// Register routes
app.use('/api/mobile/photos', mobilePhotosRoutes);

// Initialize photo processing queue
import photoProcessingService from './services/photo-processing.service';

photoProcessingService.initialize(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
).then(() => {
  photoProcessingService.startProcessingQueue();
  console.log('Photo processing queue started');
}).catch(err => {
  console.error('Failed to start photo processing:', err);
});
```

## Usage Examples

### Mobile App Integration

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Button, Image, Text } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import PhotoUploadService from './services/PhotoUploadService';
import OfflinePhotoQueue from './services/OfflinePhotoQueue';

const DamageReportScreen = () => {
  const [queueStats, setQueueStats] = useState(null);

  useEffect(() => {
    // Initialize services
    const init = async () => {
      await PhotoUploadService.initialize(config.azureStorage.connectionString);
      await OfflinePhotoQueue.initialize(true);

      // Subscribe to queue updates
      const unsubscribe = OfflinePhotoQueue.subscribe(setQueueStats);
      return () => unsubscribe();
    };

    init();
  }, []);

  const handleTakePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (result.assets && result.assets[0]) {
      const photo = result.assets[0];

      // Add to queue (will auto-upload when online)
      await OfflinePhotoQueue.addToQueue(
        photo.uri!,
        {
          metadata: {
            vehicleId: currentVehicle.id,
            reportType: 'damage',
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
        },
        'high' // high priority for damage reports
      );
    }
  };

  return (
    <View>
      <Button title="Take Photo" onPress={handleTakePhoto} />
      {queueStats && (
        <Text>
          Queue: {queueStats.queued} pending,
          {queueStats.uploading} uploading,
          {queueStats.completed} done
        </Text>
      )}
    </View>
  );
};
```

## Monitoring & Maintenance

### Check Queue Health

```sql
-- View queue status
SELECT * FROM photo_queue_health;

-- Find stuck jobs
SELECT * FROM stuck_processing_jobs;

-- Processing statistics
SELECT * FROM photo_processing_stats;
```

### Manual Intervention

```typescript
// Retry all failed jobs
await photoProcessingService.retryFailed();

// Clear old completed jobs
await photoProcessingService.clearCompletedJobs(30);

// Get queue stats
const stats = await photoProcessingService.getQueueStats();
console.log('Pending:', stats.byStatus.pending);
console.log('Failed:', stats.byStatus.failed);
```

### Performance Tuning

**Adjust processing interval:**
```typescript
// Faster processing (5 seconds)
photoProcessingService.PROCESSING_INTERVAL = 5000;

// Larger batch size
photoProcessingService.BATCH_SIZE = 10;
```

**Mobile upload concurrency:**
```typescript
PhotoUploadService.maxConcurrentUploads = 5; // default: 3
```

## Error Handling

### Upload Errors

**Mobile:**
- Network errors: Automatically queued for retry
- File errors: Immediate failure, user notified
- Server errors: Retry with exponential backoff

**API:**
- Blob storage errors: Logged, returned to client
- Database errors: Rolled back, error response
- Processing errors: Marked as failed, can retry

### Processing Errors

**Recoverable:**
- Network timeouts → Retry
- Blob download failures → Retry
- Image processing errors → Retry

**Non-recoverable:**
- Invalid file format → Mark as failed
- Corrupted image → Mark as failed
- Missing photo record → Delete queue entry

## Testing

### Mobile Tests

```bash
cd /home/user/Fleet/mobile
npm test
```

### API Tests

```bash
cd /home/user/Fleet/api

# Test upload endpoint
npm test -- photo-upload

# Test processing service
npm test -- photo-processing
```

### Manual Testing

```bash
# Upload test photo
curl -X POST http://localhost:5000/api/mobile/photos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@test-photo.jpg" \
  -F "priority=high"

# Check processing status
curl http://localhost:5000/api/mobile/photos/status/123 \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Photos Not Uploading

1. Check network connectivity
2. Verify Azure Storage connection string
3. Check AsyncStorage permissions
4. Review upload queue status

### Processing Stuck

1. Check `stuck_processing_jobs` view
2. Restart processing queue:
   ```typescript
   photoProcessingService.stopProcessingQueue();
   photoProcessingService.startProcessingQueue();
   ```
3. Check Azure Blob Storage connectivity

### High Queue Backlog

1. Increase processing batch size
2. Decrease processing interval
3. Add more worker instances
4. Check for failed jobs consuming retries

## Best Practices

### Mobile App

1. **Always use OfflinePhotoQueue** - Never upload directly
2. **Set appropriate priorities** - High for damage reports, normal for inspections
3. **Monitor queue stats** - Show users sync status
4. **Handle errors gracefully** - Inform users of failures
5. **Compress before queue** - Save storage and bandwidth

### API

1. **Monitor queue health** - Set up alerts for stuck jobs
2. **Clean up old jobs** - Run cleanup regularly
3. **Index optimization** - Monitor slow queries
4. **Blob storage costs** - Implement lifecycle policies
5. **Rate limiting** - Prevent abuse

## Future Enhancements

- [ ] WebSocket for real-time upload progress
- [ ] AI-powered image enhancement
- [ ] Automatic duplicate detection
- [ ] Cloud-based image optimization (Cloudinary/ImgIX)
- [ ] Advanced OCR with Azure Computer Vision
- [ ] Image similarity search
- [ ] Automated damage assessment
- [ ] Multi-region blob storage replication

## Support

For issues or questions:
- API Issues: Check logs at `/var/log/fleet-api/`
- Mobile Issues: Check device logs
- Database Issues: Check PostgreSQL logs

## License

Proprietary - Fleet Management System
