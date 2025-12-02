# AI-Powered Damage Detection System - Implementation Guide

## Overview

The Fleet Management System now includes a comprehensive AI-powered damage detection system that leverages OpenAI GPT-4 Vision, mobile device sensors (LiDAR, depth cameras), and advanced 3D mapping to automatically detect, classify, and estimate repair costs for vehicle damage.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile Device                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Camera  │  │  LiDAR   │  │  Depth   │  │  Video   │       │
│  │          │  │ Scanner  │  │  Sensor  │  │ Capture  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │              │              │
│       └─────────────┴──────────────┴──────────────┘              │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   MobileDamageCapture.tsx    │
              │  (React Component - UI)      │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │    POST /api/damage/*        │
              │   (REST API Endpoints)       │
              └──────────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────────┐  ┌──────────────────────┐
    │ OpenAIVisionService   │  │ MobileDamageService  │
    │  - GPT-4 Vision API   │  │  - LiDAR Processing  │
    │  - Damage Detection   │  │  - Depth Analysis    │
    │  - Cost Estimation    │  │  - Video Analysis    │
    └───────────┬───────────┘  └──────────┬───────────┘
                │                         │
                └────────────┬────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  DamageAnalysisResults.tsx   │
              │  (Results Display UI)        │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   damage2Dto3DMapper.ts      │
              │  (Photo → 3D Coordinates)    │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  PostgreSQL Database         │
              │  - vehicle_damage table      │
              │  - 3D positions & metadata   │
              └──────────────────────────────┘
```

## Features

### 1. Multi-Modal Damage Capture

#### Photo Capture with Depth Data
- Single or multiple photos from different angles
- Automatic depth data extraction from iOS/Android devices
- Bounding box detection for damage regions
- Confidence scoring for each detected damage

#### LiDAR 3D Scanning (iPhone 12 Pro+, iPad Pro 2020+)
- Point cloud capture with millions of points
- Millimeter-level accuracy for dent depth
- Surface area calculation for damaged regions
- 3D mesh generation from point cloud

#### Video Walkthrough Analysis
- 30-60 second video recording
- Automatic key frame extraction
- Multi-angle consistency validation
- Deduplication of damage findings

### 2. AI-Powered Analysis

#### OpenAI GPT-4 Vision Integration
```typescript
// Example API call structure
const analysis = await visionService.detectDamage(imageUrl);

// Returns structured data:
{
  vehicleDetected: true,
  vehicleInfo: {
    make: "Ford",
    model: "F-150",
    year: 2024,
    color: "Blue"
  },
  cameraAngle: "front_left_45",
  damages: [
    {
      type: "dent",
      severity: "moderate",
      part: "front_bumper",
      description: "Moderate dent, approximately 4 inches diameter",
      estimatedSize: "4 inches diameter",
      boundingBox: { x: 45.5, y: 62.3, width: 8.2, height: 6.5 },
      confidence: 0.92
    }
  ],
  overallAssessment: "Vehicle has moderate damage..."
}
```

#### Cost Estimation Algorithm
```typescript
// Industry-standard pricing rules
const costRules = {
  scratch: {
    minor: { labor: 0.5h, parts: $50 },
    moderate: { labor: 1.5h, parts: $150 },
    severe: { labor: 3h, parts: $300 },
    critical: { labor: 5h, parts: $500 }
  },
  dent: {
    minor: { labor: 1h, parts: $0 }, // PDR
    moderate: { labor: 3h, parts: $100 },
    severe: { labor: 6h, parts: $300 },
    critical: { labor: 10h, parts: $800 }
  },
  // ... more damage types
};

// Part-specific multipliers
const partMultipliers = {
  windshield: 2.0,
  hood: 1.5,
  front_bumper: 1.2,
  // ... more parts
};
```

### 3. 2D-to-3D Position Mapping

#### Virtual Camera System
```typescript
// Convert 2D photo coordinates to 3D model positions
const mapper = new Damage2Dto3DMapper(vehicleModel);

const position3D = mapper.map2DTo3D(
  { x: 45.5, y: 62.3 }, // 2D percentage coordinates
  { angle: 'front_left_45', distance: 5, height: 1.5 },
  { name: 'front_bumper' }
);

// Returns:
{
  position: Vector3(2.1, 0.8, 2.3), // 3D world coordinates
  normal: Vector3(0.0, 0.0, 1.0)    // Surface normal for marker
}
```

#### Raycasting Algorithm
1. Create virtual camera matching photo perspective
2. Convert 2D pixel coordinates to NDC (Normalized Device Coordinates)
3. Cast ray from camera through NDC point
4. Find intersection with 3D vehicle model mesh
5. Extract 3D position and surface normal

### 4. Database Schema

```sql
CREATE TABLE vehicle_damage (
    id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL,

    -- 3D Position
    position_x DECIMAL(10, 6),
    position_y DECIMAL(10, 6),
    position_z DECIMAL(10, 6),

    -- Surface Normal
    normal_x DECIMAL(10, 6),
    normal_y DECIMAL(10, 6),
    normal_z DECIMAL(10, 6),

    -- Classification
    severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
    damage_type VARCHAR(50),
    part_name VARCHAR(100),

    -- Documentation
    description TEXT,
    photo_urls TEXT[],

    -- Costs
    cost_estimate DECIMAL(10, 2),
    actual_repair_cost DECIMAL(10, 2),

    -- Workflow
    repair_status VARCHAR(20) DEFAULT 'pending',
    repair_scheduled_date TIMESTAMP,
    repair_completed_date TIMESTAMP,

    -- Insurance
    insurance_claim_number VARCHAR(100),
    insurance_approved BOOLEAN,

    -- Audit
    reported_at TIMESTAMP DEFAULT NOW(),
    reported_by UUID
);

-- Aggregated view for analytics
CREATE VIEW v_vehicle_damage_summary AS
SELECT
    vehicle_id,
    COUNT(*) as total_damages,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
    SUM(cost_estimate) as total_estimated_cost,
    MAX(reported_at) as most_recent_damage_date
FROM vehicle_damage
GROUP BY vehicle_id;
```

## API Endpoints

### POST /api/damage/analyze-photo
Analyze a single photo with optional depth data.

**Request:**
```bash
curl -X POST http://localhost:3000/api/damage/analyze-photo \
  -F "photo=@damage-front.jpg" \
  -F 'metadata={"deviceModel":"iPhone 15 Pro","depthData":"..."}'
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "vehicleDetected": true,
    "damages": [...],
    "depthEnhancement": {
      "depthAnalyzedDamages": [...]
    }
  },
  "costEstimate": {
    "totalEstimate": 1250.00,
    "urgency": "high"
  }
}
```

### POST /api/damage/analyze-lidar
Analyze LiDAR scan with reference photos.

**Request:**
```bash
curl -X POST http://localhost:3000/api/damage/analyze-lidar \
  -F "photos[]=@photo1.jpg" \
  -F "photos[]=@photo2.jpg" \
  -F 'lidarData={"pointCloud":[...],"scanMetadata":{...}}'
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "damages": [...],
    "lidarEnhancement": {
      "depth3DModel": "/api/damage/3d-models/scan-xyz.glb",
      "accurateDimensions": [
        {
          "damageId": "dent-front_bumper",
          "actualWidth": 0.104,  // meters
          "actualDepth": 0.023,  // meters
          "surfaceArea": 0.0081  // square meters
        }
      ],
      "confidenceBoost": 25  // percentage
    }
  }
}
```

### POST /api/damage/analyze-video
Analyze video walkthrough with key frame extraction.

**Request:**
```bash
curl -X POST http://localhost:3000/api/damage/analyze-video \
  -F "video=@walkthrough.mp4" \
  -F "duration=45" \
  -F "frameInterval=1"
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "damages": [...],
    "videoEnhancement": {
      "multiAngleAnalysis": {
        "anglesCaptured": 15,
        "consistentDamagesAcrossAngles": ["dent-front_bumper", "scratch-driver_door"]
      }
    }
  }
}
```

### POST /api/damage/comprehensive-analysis
Use all available mobile capabilities (photos, LiDAR, video).

**Request:**
```bash
curl -X POST http://localhost:3000/api/damage/comprehensive-analysis \
  -F "photos[]=@photo1.jpg" \
  -F "photos[]=@photo2.jpg" \
  -F 'lidarData={...}' \
  -F 'videoUrl=https://...'
```

### POST /api/damage/save
Save confirmed damage to database.

**Request:**
```json
{
  "vehicleId": "123e4567-e89b-12d3-a456-426614174000",
  "damages": [
    {
      "position": { "x": 2.1, "y": 0.8, "z": 2.3 },
      "normal": { "x": 0.0, "y": 0.0, "z": 1.0 },
      "severity": "moderate",
      "type": "dent",
      "part": "front_bumper",
      "description": "Moderate dent...",
      "costEstimate": 450.00
    }
  ],
  "photoUrls": ["https://blob.azure.com/..."]
}
```

### GET /api/damage/:vehicleId
Retrieve all damage records for a vehicle.

**Response:**
```json
{
  "success": true,
  "damages": [
    {
      "id": "...",
      "position_x": 2.1,
      "position_y": 0.8,
      "position_z": 2.3,
      "severity": "moderate",
      "damage_type": "dent",
      "part_name": "front_bumper",
      "cost_estimate": 450.00,
      "repair_status": "pending",
      "reported_at": "2025-11-10T..."
    }
  ]
}
```

### GET /api/damage/summary/:vehicleId
Get aggregated damage statistics.

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_damages": 5,
    "critical_count": 1,
    "severe_count": 2,
    "total_estimated_cost": 2850.00,
    "pending_repairs": 3,
    "most_recent_damage_date": "2025-11-10T..."
  }
}
```

## React Components

### MobileDamageCapture
```tsx
import { MobileDamageCapture } from '@/components/damage/MobileDamageCapture';

function VehicleInspectionPage() {
  const handleAnalysisComplete = (result) => {
    console.log('Damages detected:', result.analysis.damages);
    console.log('Total cost:', result.costEstimate.totalEstimate);
  };

  return (
    <MobileDamageCapture
      vehicleId="123e4567-e89b-12d3-a456-426614174000"
      onAnalysisComplete={handleAnalysisComplete}
    />
  );
}
```

**Features:**
- Auto-detect device capabilities (camera, LiDAR, depth)
- Three capture modes with mode-specific UI
- Real-time progress tracking during AI analysis
- Photo preview gallery
- Mobile-optimized responsive design

### DamageAnalysisResults
```tsx
import { DamageAnalysisResults } from '@/components/damage/DamageAnalysisResults';

function DamageReviewPage() {
  const handleConfirm = (selectedDamages) => {
    // Save to database
    fetch('/api/damage/save', {
      method: 'POST',
      body: JSON.stringify({ damages: selectedDamages })
    });
  };

  return (
    <DamageAnalysisResults
      analysis={analysisResult}
      costEstimate={costEstimate}
      onConfirmDamages={handleConfirm}
      onMap3D={() => navigate('/3d-viewer')}
    />
  );
}
```

**Features:**
- Interactive damage selection/deselection
- Severity-based color coding
- Cost breakdown per damage
- Enhancement badges (LiDAR, Depth, Multi-angle)
- Urgency indicators
- Responsive card layout

## Usage Examples

### 1. Quick Photo Analysis (iPhone)
```typescript
// User opens app on iPhone 15 Pro
// 1. Select Photo mode
// 2. Take 3-5 photos (front, rear, sides)
// 3. AI analyzes with depth data automatically
// 4. Review results with cost estimates
// 5. Confirm and save to database

// Result:
// - 3 damages detected
// - Total cost: $1,250
// - Includes depth measurements for dents
// - Mapped to 3D model positions
```

### 2. LiDAR Precision Scan (iPad Pro)
```typescript
// User opens app on iPad Pro 2020+
// 1. Select LiDAR mode
// 2. Capture 3D point cloud scan
// 3. Take 2-3 reference photos
// 4. AI processes point cloud + photos
// 5. Review with millimeter accuracy

// Result:
// - 2 damages detected with +25% confidence
// - Dent depth: 23.4mm (LiDAR measured)
// - Surface area: 81 cm²
// - 3D mesh generated for insurance
```

### 3. Video Walkthrough (Any Device)
```typescript
// User opens app on Android phone
// 1. Select Video mode
// 2. Record 45-second walkthrough
// 3. AI extracts 15 key frames
// 4. Multi-angle consistency validation
// 5. Review consolidated findings

// Result:
// - 4 damages detected across 15 frames
// - 2 damages confirmed in 8+ frames (high confidence)
// - Total cost: $1,800
// - Comprehensive documentation
```

## Configuration

### Environment Variables

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_management
DB_USER=fleet_user
DB_PASSWORD=***

# Azure Blob Storage (for photo storage)
AZURE_STORAGE_CONNECTION_STRING=...
```

### OpenAI Model Settings

```typescript
// api/src/services/openaiVisionService.ts
const model = 'gpt-4-vision-preview'; // or 'gpt-4o' for faster processing
const maxTokens = 2500;
const temperature = 0.2; // Lower for consistent, factual responses
```

## Testing

### Unit Tests
```bash
# Test OpenAI Vision service
npm test api/src/services/openaiVisionService.test.ts

# Test 2D-to-3D mapper
npm test src/utils/damage2Dto3DMapper.test.ts
```

### Integration Tests
```bash
# Test complete workflow
npm test tests/damage-detection-workflow.test.ts
```

### Manual Testing Checklist

- [ ] Photo upload works on iOS/Android
- [ ] Depth data is extracted correctly
- [ ] LiDAR scan uploads successfully
- [ ] Video analysis completes without errors
- [ ] AI detects common damage types (dent, scratch, crack)
- [ ] Cost estimates are reasonable
- [ ] 3D positions map correctly to vehicle model
- [ ] Database saves all metadata
- [ ] Results display correctly on mobile/desktop

## Performance Considerations

### Image Size Optimization
```typescript
// Resize images before upload
const maxWidth = 1920;
const maxHeight = 1080;
const quality = 0.8; // 80% JPEG quality
```

### API Rate Limiting
```typescript
// OpenAI API limits
const requestsPerMinute = 3000; // GPT-4 Vision tier limit
const tokensPerMinute = 150000;

// Implement queue for batch processing
const queue = new PQueue({ concurrency: 5 });
```

### Database Indexing
```sql
-- Critical indexes already created
CREATE INDEX idx_vehicle_damage_vehicle_id ON vehicle_damage(vehicle_id);
CREATE INDEX idx_vehicle_damage_severity ON vehicle_damage(severity);
CREATE INDEX idx_vehicle_damage_repair_status ON vehicle_damage(repair_status);
```

## Troubleshooting

### Issue: "No vehicle detected in image"
**Solution**: Ensure photo clearly shows the vehicle with good lighting. Avoid extreme angles or poor visibility.

### Issue: "Depth data not available"
**Solution**: Depth data requires iOS Portrait mode or Android ARCore. Verify device compatibility.

### Issue: "LiDAR enhancement not working"
**Solution**: LiDAR requires iPhone 12 Pro+ or iPad Pro 2020+. Check device model.

### Issue: "3D position mapping fails"
**Solution**: Ensure vehicle 3D model is loaded and mesh names match conventions (body, bumper, door, etc.).

### Issue: "Cost estimates seem too high/low"
**Solution**: Adjust cost rules in `openaiVisionService.ts` lines 146-217 for your region.

## Roadmap

### Phase 1 ✅ (Complete)
- OpenAI GPT-4 Vision integration
- Photo, LiDAR, video capture
- Cost estimation algorithm
- 2D-to-3D position mapping
- Database schema and migrations

### Phase 2 (Planned)
- Azure Custom Vision training for fleet-specific damage
- Real-time damage detection during video recording
- AR overlay showing damage on live camera feed
- Integration with insurance claim systems
- Automated PDF report generation

### Phase 3 (Future)
- Machine learning model for cost prediction
- Historical damage pattern analysis
- Predictive maintenance recommendations
- Multi-vehicle batch processing
- Mobile app (React Native)

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/fleet/issues
- Documentation: https://docs.fleet.example.com
- Email: support@fleet.example.com

## License

This implementation is part of the Fleet Management System and follows the project's license terms.

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
**Compatible with**: Fleet Management v1.9+
**Author**: Capital Tech Alliance Development Team

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
