# Ford F-150 Lightning 3D Model Generation System

## 🚀 Overview

Complete production-ready system for generating high-resolution, photo-realistic 3D models of 2025 Ford F-150 Lightning vehicles with dynamic customization capabilities using Meshy.ai API.

### Key Features

✅ **Highest Resolution Photo-Realistic Models**
- Up to 300,000 polygons for maximum detail
- PBR (Physically-Based Rendering) textures
- Multiple export formats: GLB, FBX, OBJ, USDZ

✅ **Dynamic Paint Color Changes**
- 8 factory colors + unlimited custom colors
- Real-time retexturing (10 credits, 3-5 minutes)
- Custom wraps and finishes

✅ **Feature Customization**
- 4 trim levels (Pro, XLT, Lariat, Platinum)
- Multiple wheel options (18", 20", 22")
- Accessories (bed liner, tonneau cover, running boards, etc.)

✅ **Advanced Texture Input**
- Generate from text descriptions
- Generate from photos (1-4 angles)
- Generate from video frames
- LiDAR integration support

✅ **Damage Visualization**
- Dynamic damage addition via retexture API
- Photo-based damage rendering
- Text-based damage descriptions
- Damage history tracking

✅ **Complete Fleet Integration**
- PostgreSQL database schema
- RESTful API endpoints
- React 3D viewer component
- Job queue system
- Analytics tracking

---

## 📦 Installation

### Prerequisites

```bash
# Node.js 18+
node --version

# PostgreSQL 14+
psql --version

# FFmpeg (for video frame extraction)
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu
```

### Install Dependencies

```bash
npm install axios pg form-data @react-three/fiber @react-three/drei three multer
```

### Environment Variables

Add to your `.env` file:

```bash
# Meshy.ai API
MESHY_API_KEY=msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fleet_db

# Optional: Webhook URL for async notifications
MESHY_WEBHOOK_URL=https://your-domain.com/api/webhooks/meshy
```

---

## 🏗️ Architecture

### File Structure

```
Fleet/
├── meshy-ford-lightning-generator.ts    # Core Meshy API client
├── fleet-3d-model-integration.ts        # Database & service layer
├── api/
│   └── routes/
│       └── 3d-models.ts                 # REST API endpoints
├── frontend/
│   └── components/
│       └── Vehicle3DViewer.tsx          # React 3D viewer
├── examples/
│   └── generate-lightning-examples.ts   # Usage examples
└── MESHY_3D_MODELS_README.md           # This file
```

### Database Schema

```sql
-- Vehicle 3D models with versioning
vehicle_3d_models
  ├── id (primary key)
  ├── vehicle_id (foreign key)
  ├── meshy_task_id (unique)
  ├── paint_color, trim_level, wheel_type
  ├── model_url_glb, model_url_fbx, model_url_obj, model_url_usdz
  ├── texture_base_color, texture_metallic, texture_roughness, texture_normal
  ├── features (JSONB)
  ├── version, is_current
  └── credits_used

-- Async job queue
model_generation_queue
  ├── id (primary key)
  ├── vehicle_id (foreign key)
  ├── job_type, priority
  ├── generation_params (JSONB)
  └── status, attempts

-- Damage tracking
vehicle_damage_records
  ├── id (primary key)
  ├── vehicle_id (foreign key)
  ├── damage_type, damage_location, severity
  ├── description, damage_photos (JSONB)
  ├── damaged_model_id (foreign key)
  └── estimated_cost, actual_cost

-- Analytics
model_generation_analytics
  ├── date
  ├── total_generations, credits_used
  └── avg_generation_time, success_rate
```

---

## 🚀 Quick Start

### 1. Initialize Database

```typescript
import FleetModelService from './fleet-3d-model-integration';

const service = new FleetModelService(
  process.env.DATABASE_URL!,
  process.env.MESHY_API_KEY!
);

await service.initialize();
```

### 2. Generate Your First Model

```typescript
import FordLightningGenerator from './meshy-ford-lightning-generator';

const generator = new FordLightningGenerator(process.env.MESHY_API_KEY!);

// Generate from text description
const model = await generator.generateFromText({
  paintColor: 'Antimatter Blue',
  trim: 'Lariat',
  wheels: '20-inch',
  features: {
    bedLiner: true,
    tonneau_cover: true,
    running_boards: true,
  },
});

// Download model files
await generator.downloadModel(model, './output/my_lightning');
```

### 3. Generate from Photos (Highest Quality)

```typescript
// Use 4 photos from different angles for best results
const photos = [
  '/path/to/front.jpg',
  '/path/to/side.jpg',
  '/path/to/rear.jpg',
  '/path/to/top.jpg',
];

const model = await generator.generateFromImages(photos, {
  paintColor: 'Rapid Red',
  trim: 'Platinum',
  wheels: '22-inch',
  features: {},
});
```

### 4. Change Paint Color (Fast)

```typescript
// Change color using retexture API (10 credits, 3-5 mins)
const newColor = await generator.changePaintColor(
  previousTaskId,
  'Agate Black'
);

// Custom color
const customColor = await generator.changePaintColor(
  previousTaskId,
  'Customize',
  undefined,
  'matte military olive green with black accents'
);
```

### 5. Add Damage to Model

```typescript
const damaged = await service.addDamageToModel(vehicleId, {
  type: 'dent',
  location: 'front_bumper',
  severity: 'moderate',
  description: 'Deep dent with scratches and paint damage',
  photos: ['/path/to/damage_photo.jpg'],
  estimatedCost: 1500,
});
```

---

## 🎨 API Endpoints

### Get Current Model

```bash
GET /api/3d-models/vehicle/:vehicleId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "vehicleId": 456,
    "status": "SUCCEEDED",
    "paintColor": "Antimatter Blue",
    "trim": "Lariat",
    "models": {
      "glb": "https://...",
      "fbx": "https://...",
      "obj": "https://...",
      "usdz": "https://..."
    },
    "textures": {
      "baseColor": "https://...",
      "metallic": "https://...",
      "roughness": "https://...",
      "normal": "https://..."
    },
    "creditsUsed": 30
  }
}
```

### Generate Initial Model

```bash
POST /api/3d-models/generate
Content-Type: multipart/form-data

{
  "vehicleId": 456,
  "paintColor": "Rapid Red",
  "trim": "Platinum",
  "wheels": "22-inch",
  "features": {"bedLiner": true},
  "referenceImages": [file1, file2, file3, file4]  # Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Model generation started",
  "data": {
    "modelId": 123,
    "meshyTaskId": "task_abc123",
    "status": "PENDING",
    "estimatedTime": "5-10 minutes"
  }
}
```

### Change Paint Color

```bash
POST /api/3d-models/change-color

{
  "vehicleId": 456,
  "paintColor": "Agate Black",
  "paintHex": "#0A0A0A",           # Optional
  "customDescription": "..."        # Optional for custom colors
}
```

### Add Damage

```bash
POST /api/3d-models/add-damage
Content-Type: multipart/form-data

{
  "vehicleId": 456,
  "damageType": "dent",
  "location": "front_bumper",
  "severity": "moderate",
  "description": "Deep dent with scratches",
  "damagePhotos": [file1, file2],   # Optional
  "estimatedCost": 1500
}
```

### Check Generation Status

```bash
GET /api/3d-models/status/:meshyTaskId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "IN_PROGRESS",
    "progress": 65,
    "isComplete": false,
    "hasFailed": false
  }
}
```

### Get Available Paint Colors

```bash
GET /api/3d-models/paint-colors
```

### Get Available Trims

```bash
GET /api/3d-models/trims
```

---

## 💰 Cost Breakdown

### Per-Vehicle Costs (in Meshy Credits)

| Operation | Credits | Time | Notes |
|-----------|---------|------|-------|
| **Initial Generation (Text)** | 30 | 5-10 min | 20 preview + 10 refine |
| **Initial Generation (Photos)** | 30 | 5-10 min | Higher quality |
| **Paint Color Change** | 10 | 3-5 min | Uses retexture API |
| **Add Damage** | 10 | 3-5 min | Uses retexture API |
| **Custom Texture/Wrap** | 10 | 3-5 min | Uses retexture API |

### Example Fleet Scenarios

**100 Vehicles, Stock Models:**
- Initial generation: 100 × 30 = 3,000 credits

**100 Vehicles, 5 Color Variants Each:**
- Base models: 100 × 30 = 3,000 credits
- Color variants: 100 × 4 × 10 = 4,000 credits
- **Total: 7,000 credits**

**100 Vehicles + Damage Tracking:**
- Base models: 3,000 credits
- Average 2 damage records/vehicle: 100 × 2 × 10 = 2,000 credits
- **Total: 5,000 credits**

### Credit Pricing (2025)

Check current pricing at: https://www.meshy.ai/api

---

## 🎥 Advanced Features

### Video Frame Extraction

```typescript
import { AdvancedTextureProcessor } from './meshy-ford-lightning-generator';

const processor = new AdvancedTextureProcessor();

// Extract 4 frames from 360° video
const frames = await processor.extractVideoFrames(
  '/path/to/walkaround.mp4',
  './temp/frames',
  4
);

// Generate model from video frames
const model = await generator.generateFromImages(frames, options);
```

### LiDAR Integration Workflow

```bash
# 1. Convert LiDAR point cloud to mesh using Open3D
pip install open3d

# 2. Python script to convert
python <<EOF
import open3d as o3d

pcd = o3d.io.read_point_cloud("lightning_scan.las")
pcd.estimate_normals()
mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=9)
o3d.io.write_triangle_mesh("lightning_mesh.glb", mesh)
EOF

# 3. Upload mesh to Meshy Retexture API
const textured = await generator.applyCustomTexture(
  'lightning_mesh.glb',
  'texture_reference.jpg'
);
```

### Webhook Setup for Async Processing

```typescript
// In your Express app
app.post('/api/webhooks/meshy', async (req, res) => {
  const task = req.body;

  // Update database with completed model
  await service['db'].updateModelUrls(task.id, {
    glb: task.model_urls.glb,
    fbx: task.model_urls.fbx,
    obj: task.model_urls.obj,
    usdz: task.model_urls.usdz,
    baseColor: task.texture_urls.base_color,
    metallic: task.texture_urls.metallic,
    roughness: task.texture_urls.roughness,
    normal: task.texture_urls.normal,
    thumbnail: task.thumbnail_url,
  });

  // Notify user via WebSocket, email, etc.
  notifyUser(task.vehicle_id, 'Model generation complete!');

  res.status(200).send('OK');
});
```

Configure webhook at: https://www.meshy.ai/settings/api

---

## 🖥️ Frontend Integration

### React Component Usage

```typescript
import Vehicle3DViewer from './frontend/components/Vehicle3DViewer';

function VehicleDetailPage({ vehicleId }: { vehicleId: number }) {
  return (
    <div>
      <h1>Vehicle #{vehicleId}</h1>
      <Vehicle3DViewer vehicleId={vehicleId} />
    </div>
  );
}
```

### Features

- ✅ Interactive 3D model rotation
- ✅ Real-time paint color changes
- ✅ Damage visualization toggle
- ✅ Model version history
- ✅ Generation progress tracking
- ✅ Custom color picker
- ✅ Mobile-responsive controls

---

## 📊 Analytics & Monitoring

### Track Usage

```typescript
// Daily analytics automatically recorded
const stats = await service['db']['pool'].query(`
  SELECT
    date,
    total_generations,
    total_credits_used,
    avg_generation_time_seconds,
    success_rate
  FROM model_generation_analytics
  ORDER BY date DESC
  LIMIT 30
`);
```

### Monitor Queue

```typescript
// Check pending jobs
const pending = await service['db']['pool'].query(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
  FROM model_generation_queue
`);
```

---

## 🔒 Security Best Practices

### API Key Management

```typescript
// NEVER commit API keys to source control
// Use environment variables
const apiKey = process.env.MESHY_API_KEY;

// Rotate keys periodically
// Monitor usage in Meshy dashboard
```

### Rate Limiting

```typescript
// Implement rate limiting on your API
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use('/api/3d-models', limiter);
```

### Input Validation

```typescript
// Validate all user inputs
import { body, validationResult } from 'express-validator';

app.post('/api/3d-models/generate', [
  body('vehicleId').isInt(),
  body('paintColor').isString().notEmpty(),
  body('trim').isIn(['Pro', 'XLT', 'Lariat', 'Platinum']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request...
});
```

---

## 🐛 Troubleshooting

### Common Issues

**"Task did not complete within timeout"**
- Increase `maxAttempts` in `waitForTaskCompletion()`
- Check Meshy API status
- Verify webhook configuration

**"Failed to load GLB model"**
- Ensure CORS headers allow model URL domain
- Check if model URL has expired (3-day retention)
- Download and host models locally

**"Insufficient credits"**
- Check credit balance: https://www.meshy.ai/settings/api
- Purchase additional credits
- Monitor credit usage analytics

**"Rate limit exceeded"**
- Implement exponential backoff
- Upgrade to higher tier (Studio/Enterprise)
- Use job queue for batch operations

---

## 📚 Additional Resources

- **Meshy.ai Documentation:** https://docs.meshy.ai/en
- **API Reference:** https://docs.meshy.ai/api-introduction
- **Three.js Documentation:** https://threejs.org/docs/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber

---

## 🎯 Next Steps

1. **Set up webhook endpoint** for async processing
2. **Implement caching layer** for frequently accessed models
3. **Add model compression** for faster loading
4. **Create batch generation scripts** for entire fleet
5. **Implement A/B testing** for different generation methods
6. **Add telemetry** for user engagement with 3D models

---

## 📝 License

This integration is designed for use with the Meshy.ai API. Ensure compliance with Meshy.ai Terms of Service: https://www.meshy.ai/terms

---

## 🤝 Support

For issues with:
- **Meshy API:** support@meshy.ai or https://help.meshy.ai
- **This Integration:** Contact your development team

---

**Built with ❤️ for Fleet Management Excellence**
