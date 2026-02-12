# AI Damage Detection System

## Overview

The AI Damage Detection system is an advanced machine learning-powered feature that automatically detects, classifies, and estimates repair costs for vehicle damage using computer vision.

## Architecture

### ML Models

- **YOLOv8**: Object detection to identify damage zones on vehicles
- **ResNet-50**: Classification model to categorize damage types and severity
- **OpenAI Vision API**: Used as a proxy for production ML models

### Components

1. **ML Model Layer** (`ml-models/damage-detection.model.ts`)
   - Core ML inference engine
   - Image preprocessing
   - Damage zone detection
   - Damage classification
   - Cost estimation algorithms

2. **Service Layer** (`services/ai-damage-detection.service.ts`)
   - Business logic orchestration
   - Database operations
   - Work order automation
   - Notification handling

3. **API Layer** (`routes/ai-damage-detection.routes.ts`)
   - RESTful endpoints
   - Request validation
   - Image upload handling
   - Response formatting

4. **Database Schema** (`db/migrations/001_create_ai_damage_detections.sql`)
   - Detection records storage
   - Work order linkage
   - Audit trail

## Features

### Damage Detection Capabilities

#### Damage Zones (24 zones)
- Front/Rear bumpers
- All doors (front/rear, left/right)
- Fenders (all 4)
- Hood, Roof, Trunk
- All windows and windshield
- All wheels
- Undercarriage

#### Damage Types (12 types)
- Scratches
- Dents
- Cracks
- Paint damage
- Rust
- Broken parts
- Missing parts
- Collision damage
- Hail damage
- Glass damage
- Tire damage
- Structural damage

#### Severity Levels
- **Minor**: Cosmetic damage, low priority
- **Moderate**: Noticeable damage, medium priority
- **Severe**: Significant damage, high priority
- **Critical**: Unsafe to operate, immediate attention required

### Automatic Features

1. **Work Order Generation**
   - Automatically creates work orders for each detected damage
   - Assigns priority based on severity
   - Includes estimated repair costs
   - Links to original detection record

2. **Cost Estimation**
   - Provides cost ranges (min/max) based on:
     - Damage type
     - Severity level
     - Vehicle zone affected
   - Currency: USD

3. **Repair Recommendations**
   - Severity-based action recommendations
   - Priority scoring (1-10)
   - Timeline suggestions

## API Endpoints

### POST /api/ai/damage-detection

Detect damage from uploaded image or URL.

**Request (multipart/form-data):**
```
vehicleId: string (required)
reportedBy: string (required)
image: File (optional)
imageUrl: string (optional)
imageBase64: string (optional)
autoCreateWorkOrder: boolean (optional, default: true)
notes: string (optional)
location: string (optional)
incidentDate: Date (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detectionId": "uuid",
    "vehicleId": "123",
    "detectionResult": {
      "detectedDamages": [
        {
          "id": "damage-xxx",
          "zone": "front_bumper",
          "type": "scratch",
          "severity": "moderate",
          "confidence": 0.89,
          "boundingBox": { "x": 0.3, "y": 0.6, "width": 0.4, "height": 0.2 },
          "description": "Scratch on front bumper",
          "estimatedRepairCost": { "min": 150, "max": 400, "currency": "USD" },
          "repairPriority": 6,
          "recommendedAction": "Schedule repair within 2-4 weeks"
        }
      ],
      "overallSeverity": "moderate",
      "totalEstimatedCost": { "min": 150, "max": 400, "currency": "USD" },
      "processingTimeMs": 2345,
      "modelVersion": "yolov8-resnet50-v1.2.0",
      "timestamp": "2026-01-11T..."
    },
    "workOrdersCreated": [
      {
        "workOrderId": 567,
        "damageId": "damage-xxx",
        "status": "created"
      }
    ],
    "summary": {
      "totalDamages": 1,
      "criticalDamages": 0,
      "severeDamages": 0,
      "totalEstimatedCost": { "min": 150, "max": 400, "currency": "USD" }
    },
    "processingTimeMs": 2500,
    "timestamp": "2026-01-11T..."
  }
}
```

### GET /api/ai/damage-detection/:id

Get damage detection by ID.

### GET /api/ai/damage-detection/vehicle/:vehicleId

Get damage detection history for a vehicle.

**Query Parameters:**
- `limit` (optional): Max records to return (default: 50)

### GET /api/ai/damage-detection/pending

Get all pending damages (not yet repaired).

**Query Parameters:**
- `vehicleId` (optional): Filter by vehicle ID

### PATCH /api/ai/damage-detection/:id/repair-status

Update repair status for a detection.

**Request Body:**
```json
{
  "status": "pending|in_progress|completed|cancelled",
  "completedBy": "user-id" (optional)
}
```

### GET /api/ai/damage-detection/stats

Get damage detection statistics.

**Query Parameters:**
- `vehicleId` (optional): Filter by vehicle ID
- `days` (optional): Number of days to look back (default: 30)

## Database Schema

### ai_damage_detections table

```sql
CREATE TABLE ai_damage_detections (
  id UUID PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  detected_damages JSONB NOT NULL,
  overall_severity VARCHAR(20) NOT NULL,
  total_estimated_cost JSONB NOT NULL,
  reported_by VARCHAR(255) NOT NULL,
  detection_date TIMESTAMP NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  image_url VARCHAR(1000),
  notes TEXT,
  location VARCHAR(255),
  incident_date TIMESTAMP,
  repair_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  repair_completed_by VARCHAR(255),
  repair_completed_date TIMESTAMP,
  work_orders_created JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### work_orders additions

```sql
ALTER TABLE work_orders ADD COLUMN ai_detection_id UUID;
ALTER TABLE work_orders ADD COLUMN ai_damage_id VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN damage_type VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN damage_zone VARCHAR(50);
```

## Installation

1. **Install Dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Run Database Migration**
   ```bash
   psql $DATABASE_URL -f src/db/migrations/001_create_ai_damage_detections.sql
   ```

3. **Configure Environment**
   Add to `.env`:
   ```
   OPENAI_API_KEY=your_openai_api_key
   YOLO_ENDPOINT=https://api.openai.com/v1/chat/completions
   RESNET_ENDPOINT=https://api.openai.com/v1/chat/completions
   ```

4. **Verify Installation**
   ```bash
   npm run test -- ai-damage-detection.test.ts
   ```

## Usage Examples

### Example 1: Detect Damage from Image Upload

```bash
curl -X POST http://localhost:3000/api/ai/damage-detection \
  -F "vehicleId=123" \
  -F "reportedBy=user-001" \
  -F "image=@damage-photo.jpg" \
  -F "notes=Found damage during inspection" \
  -F "location=Parking Lot A"
```

### Example 2: Detect Damage from URL

```bash
curl -X POST http://localhost:3000/api/ai/damage-detection \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "123",
    "reportedBy": "user-001",
    "imageUrl": "https://example.com/damage-photo.jpg",
    "autoCreateWorkOrder": true
  }'
```

### Example 3: Get Vehicle Damage History

```bash
curl -X GET "http://localhost:3000/api/ai/damage-detection/vehicle/123?limit=10"
```

### Example 4: Update Repair Status

```bash
curl -X PATCH http://localhost:3000/api/ai/damage-detection/abc-123-def/repair-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "completedBy": "mechanic-001"
  }'
```

## Integration with Mobile Apps

The system integrates seamlessly with mobile apps for field damage reporting:

```typescript
// Mobile app example
const formData = new FormData();
formData.append('vehicleId', vehicle.id);
formData.append('reportedBy', currentUser.id);
formData.append('image', {
  uri: photo.uri,
  type: 'image/jpeg',
  name: 'damage-photo.jpg'
});
formData.append('location', currentLocation);
formData.append('notes', damageNotes);

const response = await fetch(
  'https://api.example.com/api/ai/damage-detection',
  {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  }
);

const result = await response.json();
console.log(`Detected ${result.data.summary.totalDamages} damages`);
console.log(`Created ${result.data.workOrdersCreated.length} work orders`);
```

## Testing

Run the integration tests:

```bash
npm run test -- ai-damage-detection.test.ts
```

Test coverage includes:
- ML model initialization and configuration
- Damage detection from various image formats
- Batch processing
- Cost estimation
- Service layer operations
- Database operations
- End-to-end workflow (detection → work order → repair)

## Performance

- **Image Processing**: 1-3 seconds
- **Damage Detection**: 2-5 seconds
- **Total API Response**: 3-8 seconds
- **Batch Processing**: ~4 seconds per image (parallelized)

## Cost Structure

Estimated costs per damage type and severity (USD):

| Damage Type | Minor | Moderate | Severe | Critical |
|-------------|-------|----------|--------|----------|
| Scratch | $50-150 | $150-400 | $400-800 | $800-1500 |
| Dent | $100-300 | $300-800 | $800-2000 | $2000-4000 |
| Collision | $500-1500 | $1500-5000 | $5000-15000 | $15000-50000 |
| Glass Damage | $100-300 | $300-500 | $500-1000 | $1000-2000 |

## Limitations

1. **Image Quality**: Requires clear, well-lit images
2. **API Dependencies**: Relies on OpenAI Vision API availability
3. **Cost Estimates**: Ranges may vary by location and vehicle type
4. **Production ML Models**: Currently uses OpenAI as proxy; production deployment should use dedicated YOLOv8/ResNet-50 endpoints

## Future Enhancements

- [ ] Real-time video stream analysis
- [ ] 3D damage mapping using LiDAR
- [ ] Historical damage pattern analysis
- [ ] Integration with insurance APIs
- [ ] Multi-language support for descriptions
- [ ] Custom cost estimation per fleet/region
- [ ] Mobile app offline mode with sync

## Support

For issues or questions:
- GitHub Issues: [Fleet-AzureDevOps/issues](https://github.com/your-org/Fleet-AzureDevOps/issues)
- Documentation: See `/docs/ai-damage-detection/`

## License

Copyright 2026 Capital Tech Alliance. All rights reserved.
