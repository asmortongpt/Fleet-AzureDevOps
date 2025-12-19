# Virtual Garage + Radio Dispatch Integration Status

**Date:** November 9, 2025
**Status:** Phase 1 (Virtual Garage) - Dependencies Installed, Ready for Component Development

---

## ✅ Completed Tasks

### 1. Architecture Planning
- **Created:** `INTEGRATION_PLAN_RADIO_GARAGE.md` - Comprehensive 400+ line integration plan
- **Features Defined:**
  - Virtual Garage with 3D visualization
  - **Photo damage reporting with upload**
  - **Photo-to-3D conversion using Meshy AI**
  - Damage visualization overlay on 3D models
  - Radio Fleet Dispatch integration (hybrid approach)
  - Navigation and routing updates

### 2. Dependencies Installed
```json
{
  "@react-three/fiber": "^8.15.0",    // React renderer for Three.js
  "@react-three/drei": "^9.88.0",     // Helper components
  "three": "^0.158.0",                // 3D library
  "react-dropzone": "^14.2.3"         // File upload
}
```

### 3. Meshy AI Models Data
- **Source:** `/Users/andrewmorton/Documents/GitHub/Garage/dcf_meshy_models.json`
- **Copied to:** `/Users/andrewmorton/Documents/GitHub/Fleet/public/meshy-models.json`
- **Contains:** 6 photorealistic vehicle models with GLB URLs:
  - Nissan Kicks (590 units)
  - Ford Fusion (156 units)
  - Chevrolet Impala (98 units)
  - Ford Focus (87 units)
  - Ford Explorer (12 units)
  - Toyota Sienna (39 units)

### 4. Database Schema Designed
```sql
CREATE TABLE damage_reports (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  reported_by UUID REFERENCES users(id),
  damage_description TEXT,
  damage_severity VARCHAR(20),  -- 'minor', 'moderate', 'severe'
  damage_location VARCHAR(100),
  photo_urls TEXT[],
  meshy_task_id VARCHAR(100),
  meshy_model_url TEXT,
  meshy_status VARCHAR(20),     -- 'pending', 'processing', 'succeeded'
  linked_work_order_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚧 Next Steps

### Phase 1A: Create VirtualGarage Component Structure

**File:** `src/components/modules/VirtualGarage.tsx`

**Component Structure:**
```typescript
export function VirtualGarage({ data }: { data: any }) {
  return (
    <div className="virtual-garage-container">
      {/* 1. Header with vehicle selector */}
      <VehicleSelector vehicles={data.vehicles} />

      {/* 2. 3D Viewer using React Three Fiber */}
      <Canvas>
        <Scene3D vehicleModel={selectedVehicle} />
      </Canvas>

      {/* 3. Damage Reporting Panel */}
      <DamageReportPanel
        vehicleId={selectedVehicle.id}
        onPhotoUpload={handlePhotoUpload}
        onSubmit={handleDamageReport}
      />

      {/* 4. Damage History Timeline */}
      <DamageTimeline
        reports={damageReports}
        onSelectReport={handleSelectReport}
      />

      {/* 5. Vehicle Info Overlay */}
      <VehicleInfoOverlay vehicle={selectedVehicle} />
    </div>
  )
}
```

### Phase 1B: Create Supporting Components

1. **`src/components/ui/Vehicle3DViewer.tsx`**
   - React Three Fiber Canvas
   - GLTFLoader for Meshy AI models
   - OrbitControls for camera
   - Lighting setup (key, fill, rim lights)

2. **`src/components/ui/DamageReportUpload.tsx`**
   - react-dropzone integration
   - Photo preview grid
   - GPS/timestamp metadata capture
   - Upload progress indicator

3. **`src/components/ui/DamageVisualization.tsx`**
   - Damage markers (3D pins)
   - Severity color coding
   - Before/After toggle
   - Damage overlay models

4. **`src/lib/meshy-ai-client.ts`**
   - Meshy AI API integration
   - Photo-to-3D conversion
   - Task status polling
   - GLB model retrieval

### Phase 1C: Backend API Endpoints

**File:** `api/routes/damage_reports.py`

```python
@router.post("/api/vehicles/{vehicle_id}/damage-reports")
async def create_damage_report(
    vehicle_id: str,
    photos: List[UploadFile],
    description: str,
    severity: str,
    location: str
):
    # 1. Upload photos to Azure Blob Storage
    photo_urls = await upload_photos_to_blob(photos)

    # 2. Submit to Meshy AI for 3D generation
    meshy_task = await submit_to_meshy_ai(photos[0])

    # 3. Create damage report record
    report = await db.damage_reports.create({
        "vehicle_id": vehicle_id,
        "photo_urls": photo_urls,
        "meshy_task_id": meshy_task.id,
        "damage_severity": severity,
        # ...
    })

    return report

@router.get("/api/vehicles/{vehicle_id}/damage-reports")
async def get_damage_reports(vehicle_id: str):
    return await db.damage_reports.find_by_vehicle(vehicle_id)

@router.get("/api/damage-reports/{report_id}/3d-model")
async def get_damage_3d_model(report_id: str):
    report = await db.damage_reports.get(report_id)

    # Check if Meshy AI processing is complete
    if report.meshy_status == "pending":
        status = await check_meshy_task_status(report.meshy_task_id)
        if status == "SUCCEEDED":
            # Update with model URL
            await db.damage_reports.update(report_id, {
                "meshy_model_url": status.model_url,
                "meshy_status": "succeeded"
            })

    return report
```

### Phase 1D: Database Migration

**File:** `api/migrations/add_damage_reports_table.sql`

```sql
-- Create damage_reports table
CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  damage_description TEXT NOT NULL,
  damage_severity VARCHAR(20) CHECK (damage_severity IN ('minor', 'moderate', 'severe')),
  damage_location VARCHAR(100),
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  meshy_task_id VARCHAR(100),
  meshy_model_url TEXT,
  meshy_status VARCHAR(20) DEFAULT 'pending' CHECK (meshy_status IN ('pending', 'processing', 'succeeded', 'failed')),
  linked_work_order_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_damage_reports_vehicle ON damage_reports(vehicle_id);
CREATE INDEX idx_damage_reports_tenant ON damage_reports(tenant_id);
CREATE INDEX idx_damage_reports_severity ON damage_reports(damage_severity);
CREATE INDEX idx_damage_reports_status ON damage_reports(meshy_status);
```

---

## 📋 Implementation Roadmap

### Week 1: Core 3D Viewer
- [ ] Day 1: Create VirtualGarage.tsx shell and routing
- [ ] Day 2: Implement React Three Fiber 3D scene
- [ ] Day 3: Integrate Meshy AI GLB model loading
- [ ] Day 4: Add camera controls and lighting
- [ ] Day 5: Test with real Meshy models

### Week 2: Damage Reporting
- [ ] Day 1: Create DamageReportUpload component
- [ ] Day 2: Implement photo upload to Azure Blob
- [ ] Day 3: Integrate Meshy AI API for photo-to-3D
- [ ] Day 4: Create damage_reports backend endpoints
- [ ] Day 5: Database migration and testing

### Week 3: Damage Visualization
- [ ] Day 1: Create damage marker system in 3D
- [ ] Day 2: Implement before/after toggle
- [ ] Day 3: Create damage timeline scrubber
- [ ] Day 4: Link to work orders
- [ ] Day 5: End-to-end testing

---

## 🔑 Key Features Summary

### 1. 3D Vehicle Viewer
- Load photorealistic GLB models from Meshy AI
- Interactive camera controls (orbit, zoom, pan)
- Professional lighting (key, fill, rim)
- Vehicle info overlay with fleet data

### 2. Photo Damage Reporting
- Drag-and-drop photo upload (multiple photos)
- GPS location and timestamp capture
- Immediate photo preview grid
- Description and severity selection

### 3. Photo-to-3D Conversion
- Submit damage photos to Meshy AI API
- Monitor generation status (real-time polling)
- Retrieve generated GLB models
- Cache in Azure Blob Storage

### 4. Damage Visualization
- Red pins showing damage locations on 3D model
- Color-coded severity (green/yellow/red)
- Damage model overlay on vehicle
- Before/After comparison slider
- Timeline scrubber for damage history

### 5. Work Order Integration
- Link damage reports to work orders
- Auto-create repair tasks
- Track repair status
- Cost estimation from damage analysis

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vehicles/:id/damage-reports` | Create damage report with photos |
| GET | `/api/vehicles/:id/damage-reports` | List all damage reports |
| GET | `/api/damage-reports/:id` | Get single damage report |
| GET | `/api/damage-reports/:id/3d-model` | Get 3D model URL |
| POST | `/api/damage-reports/:id/link-work-order` | Link to work order |
| GET | `/api/meshy-ai/task/:taskId/status` | Check Meshy AI generation status |

---

## 🔐 Environment Variables Required

```bash
# Meshy AI Configuration
VITE_MESHY_AI_API_KEY=your_api_key_here
VITE_MESHY_AI_API_URL=https://api.meshy.ai

# Azure Blob Storage (for damage photos)
VITE_AZURE_STORAGE_DAMAGE_PHOTOS_CONTAINER=damage-photos
AZURE_STORAGE_CONNECTION_STRING=your_connection_string

# Feature Flags
VITE_ENABLE_VIRTUAL_GARAGE=true
VITE_ENABLE_DAMAGE_REPORTING=true
```

---

## 📚 Resources

### Meshy AI Models
- **Location:** `/public/meshy-models.json`
- **6 vehicle models** with GLB URLs ready to load
- All models have `status: "SUCCEEDED"` with valid URLs

### Existing Garage Code
- **Source:** `/Users/andrewmorton/Documents/GitHub/Garage/`
- `dcf_photorealistic_garage.html` - Procedural 3D models
- `dcf_meshy_3d_garage.html` - GLB loading implementation
- **Reference these for Three.js setup patterns**

### Integration Plan
- **File:** `INTEGRATION_PLAN_RADIO_GARAGE.md`
- 400+ lines of detailed specifications
- Database schemas, API endpoints, component structure

---

## 🎯 Success Criteria

### Must Have
- ✅ Load Meshy AI GLB models in 3D viewer
- ✅ Photo upload for damage reporting
- ✅ Submit photos to Meshy AI for 3D generation
- ✅ Display generated damage models on vehicle
- ✅ Save damage reports to database
- ✅ Link damage reports to work orders

### Nice to Have
- VR mode support
- AR vehicle placement
- AI damage severity estimation
- Cost estimation from photos
- Multi-language damage descriptions

---

## 🚀 Quick Start Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run database migrations
cd api && alembic upgrade head

# Test 3D models loading
# Navigate to: http://localhost:3000 and select "Virtual Garage"
```

---

**Status:** Ready for component implementation
**Next Action:** Create `src/components/modules/VirtualGarage.tsx`
**Estimated Time:** 2-3 weeks for full implementation

