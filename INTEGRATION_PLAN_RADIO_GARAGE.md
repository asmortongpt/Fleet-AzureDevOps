# Integration Plan: Radio Dispatch + Virtual Garage

## Overview
Integrate two separate applications into the Fleet Management System as new modules:
1. **Radio Fleet Dispatch** - Emergency dispatch, radio monitoring, incident management
2. **Virtual Garage** - 3D vehicle visualization and showroom

## Current Architecture Analysis

### Fleet App Structure (Vite + React)
- **Framework:** Vite + React + TypeScript
- **Routing:** State-based module switching in App.tsx
- **Modules:** 30+ existing modules in `/src/components/modules/`
- **Navigation:** Centralized in `/src/lib/navigation.ts`
- **Data:** API hooks in `/src/hooks/use-api.ts`
- **UI:** Shadcn/ui components + Tailwind CSS

## Integration Approach: Modular Addition

### Phase 1: Virtual Garage (3D Visualization) ✅
**Complexity:** Medium
**Source:** `/Users/andrewmorton/Documents/GitHub/Garage/`

#### Implementation Steps:
1. **Create VirtualGarage.tsx module** (`/src/components/modules/VirtualGarage.tsx`)
   - Extract 3D rendering logic from `dcf_photorealistic_garage.html`
   - Use Three.js / React Three Fiber for 3D rendering
   - Connect to Fleet vehicles API for real-time data

2. **Add dependencies:**
   ```json
   "@react-three/fiber": "^8.x",
   "@react-three/drei": "^9.x",
   "three": "^0.x"
   ```

3. **Add navigation item** to `/src/lib/navigation.ts`:
   ```typescript
   {
     id: "virtual-garage",
     label: "Virtual Garage",
     icon: "cube",
     module: "virtual-garage"
   }
   ```

4. **Update App.tsx** switch statement:
   ```typescript
   case "virtual-garage":
     return <VirtualGarage data={fleetData} />
   ```

#### Features to Include:
- ✅ 3D vehicle models from existing fleet (Meshy AI GLB models)
- ✅ Interactive camera controls (orbit, zoom, pan)
- ✅ Vehicle details panel (specs, maintenance status)
- ✅ Filter by vehicle type, status, location
- ✅ **Photo damage reporting with upload**
- ✅ **Photo-to-3D conversion using Meshy AI API**
- ✅ **Damage visualization overlay on 3D models**
- ✅ **Damage history tracking and timeline**
- ✅ **Link damage reports to work orders**
- ✅ Export/share 3D views
- ✅ VR mode support (optional)

#### Damage Reporting Feature Details:

**Photo Upload & Processing:**
1. **Upload Interface**: Drag-and-drop or file picker for damage photos
2. **Multi-photo support**: Upload multiple angles of damage
3. **Photo metadata**: GPS location, timestamp, user who reported
4. **Immediate preview**: Show uploaded photos before processing

**Meshy AI Integration:**
1. **API Integration**: Connect to Meshy AI API for text-to-3D and image-to-3D
2. **Photo-to-3D conversion**: Submit damage photos to Meshy AI
3. **Model generation tracking**: Monitor Meshy task status (PENDING → IN_PROGRESS → SUCCEEDED)
4. **GLB model retrieval**: Fetch generated 3D damage models
5. **Caching**: Store generated models in Azure Blob Storage

**3D Damage Visualization:**
1. **Damage overlay**: Display damage models on top of base vehicle model
2. **Damage markers**: Red pins showing damage locations on 3D vehicle
3. **Severity visualization**: Color coding (green=minor, yellow=moderate, red=severe)
4. **Before/After comparison**: Toggle between pristine and damaged views
5. **Damage timeline**: Scrub through damage history chronologically

**Backend API Endpoints:**
```typescript
POST /api/vehicles/:id/damage-reports
  - Upload damage photos
  - Create damage report record
  - Trigger Meshy AI generation

GET /api/vehicles/:id/damage-reports
  - List all damage reports for vehicle
  - Include 3D model URLs

GET /api/damage-reports/:id/3d-model
  - Get GLB model URL for specific damage report
  - Return Meshy AI generated model

POST /api/damage-reports/:id/link-work-order
  - Link damage report to work order
  - Trigger repair workflow
```

**Database Schema Additions:**
```sql
CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  vehicle_id UUID REFERENCES vehicles(id),
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  damage_description TEXT,
  damage_severity VARCHAR(20), -- 'minor', 'moderate', 'severe'
  damage_location VARCHAR(100), -- 'front-bumper', 'rear-door', etc.
  photo_urls TEXT[],
  meshy_task_id VARCHAR(100),
  meshy_model_url TEXT,
  meshy_status VARCHAR(20), -- 'pending', 'processing', 'succeeded', 'failed'
  linked_work_order_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_damage_reports_vehicle ON damage_reports(vehicle_id);
CREATE INDEX idx_damage_reports_tenant ON damage_reports(tenant_id);
```

---

### Phase 2: Radio Fleet Dispatch 🎯
**Complexity:** High
**Source:** `/Users/andrewmorton/Documents/GitHub/radio-fleet-dispatch/`

#### Architecture Decision: Embedded vs Iframe
**Option A: Full Integration** (Recommended)
- Extract core dispatch features as React components
- Share authentication and data with Fleet app
- Pros: Seamless UX, shared state, unified deployment
- Cons: Requires significant refactoring

**Option B: Iframe Integration** (Faster)
- Embed Radio Dispatch as iframe
- Pass authentication token via postMessage
- Pros: Minimal changes, keep apps separate
- Cons: Separate deployments, less integrated UX

**Chosen Approach:** **Hybrid** - Create simplified dispatch module in Fleet, with option to "Open Full Dispatch" in new tab

#### Implementation Steps:

1. **Create RadioDispatch.tsx module** (`/src/components/modules/RadioDispatch.tsx`)
   - Live radio feed component
   - Active incidents list
   - Quick dispatch actions
   - Link to full dispatch app

2. **Add Radio Dispatch API integration:**
   - Create `/src/lib/radio-dispatch-api.ts`
   - Connect to Radio Dispatch backend at `https://capitaltechhub.com/dispatch/api`
   - Use existing JWT auth

3. **Database Integration:**
   - Add `radio_incident_id` column to Fleet `safety_incidents` table
   - Sync critical radio incidents to Fleet safety system

4. **Add navigation items:**
   ```typescript
   {
     id: "radio-dispatch",
     label: "Radio Dispatch",
     icon: "broadcast",
     module: "radio-dispatch"
   },
   {
     id: "emergency-incidents",
     label: "Emergency Response",
     icon: "siren",
     module: "emergency-incidents"
   }
   ```

5. **Update App.tsx:**
   ```typescript
   case "radio-dispatch":
     return <RadioDispatch />
   case "emergency-incidents":
     return <EmergencyIncidents data={fleetData} />
   ```

#### Features to Include:
- ✅ Live radio transmission feed (last 10 transmissions)
- ✅ Active incidents dashboard (critical/high priority)
- ✅ Quick dispatch actions (assign units, create incidents)
- ✅ Real-time notifications for fleet-related emergencies
- ✅ GPS integration (show incident locations on Fleet map)
- ✅ "Open Full Dispatch" button → opens full app in new tab

---

## File Structure After Integration

```
Fleet/
├── src/
│   ├── components/
│   │   ├── modules/
│   │   │   ├── VirtualGarage.tsx         # NEW: 3D vehicle showroom
│   │   │   ├── RadioDispatch.tsx         # NEW: Radio monitoring
│   │   │   ├── EmergencyIncidents.tsx    # NEW: Emergency response
│   │   │   ├── FleetDashboard.tsx
│   │   │   └── ... (30+ existing modules)
│   │   └── ui/
│   │       ├── three-viewport.tsx        # NEW: 3D rendering wrapper
│   │       ├── radio-player.tsx          # NEW: Audio player
│   │       └── ... (existing UI components)
│   ├── lib/
│   │   ├── radio-dispatch-api.ts         # NEW: Radio Dispatch API client
│   │   ├── three-utils.ts                # NEW: 3D rendering utilities
│   │   └── navigation.ts                 # UPDATED: Add new modules
│   ├── hooks/
│   │   ├── use-radio-feed.ts             # NEW: Radio data hook
│   │   ├── use-3d-loader.ts              # NEW: 3D model loader
│   │   └── ... (existing hooks)
│   └── App.tsx                            # UPDATED: Add new modules
├── public/
│   └── models/                            # NEW: 3D vehicle models
│       ├── sedan.glb
│       ├── truck.glb
│       └── van.glb
└── package.json                           # UPDATED: Add dependencies
```

---

## Database Changes

### New Tables (Optional - for deep integration)

```sql
-- Link Fleet vehicles to Radio Dispatch units
CREATE TABLE radio_dispatch_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fleet_vehicle_id UUID REFERENCES vehicles(id),
  radio_unit_id VARCHAR(50), -- ID in Radio Dispatch system
  unit_callsign VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync radio incidents to Fleet safety system
ALTER TABLE safety_incidents
ADD COLUMN radio_incident_id UUID,
ADD COLUMN radio_transmission_ids TEXT[];
```

### Environment Variables

```bash
# Add to .env
VITE_RADIO_DISPATCH_API=https://capitaltechhub.com/dispatch/api
VITE_RADIO_DISPATCH_WS=wss://capitaltechhub.com/dispatch/ws
VITE_ENABLE_RADIO_DISPATCH=true
VITE_ENABLE_VIRTUAL_GARAGE=true
```

---

## Dependencies to Add

### package.json additions:
```json
{
  "dependencies": {
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "three": "^0.158.0",
    "socket.io-client": "^4.7.0",
    "wavesurfer.js": "^7.4.0",
    "react-dropzone": "^14.2.3",
    "axios": "^1.6.0"
  }
}
```

### Environment Variables for Meshy AI:
```bash
# Add to .env
VITE_MESHY_AI_API_KEY=your_meshy_api_key_here
VITE_MESHY_AI_API_URL=https://api.meshy.ai
VITE_AZURE_STORAGE_DAMAGE_PHOTOS_CONTAINER=damage-photos
```

---

## Navigation Updates

### `/src/lib/navigation.ts` additions:

```typescript
{
  id: "operations",
  label: "Operations",
  children: [
    { id: "dashboard", label: "Dashboard", icon: "chart-bar" },
    { id: "radio-dispatch", label: "Radio Dispatch", icon: "broadcast" },  // NEW
    { id: "emergency-incidents", label: "Emergency Response", icon: "siren" }, // NEW
    { id: "routes", label: "Routes", icon: "map" },
    { id: "gps-tracking", label: "GPS Tracking", icon: "map-pin" }
  ]
},
{
  id: "fleet-management",
  label: "Fleet",
  children: [
    { id: "garage", label: "Garage Service", icon: "wrench" },
    { id: "virtual-garage", label: "Virtual Garage (3D)", icon: "cube" },  // NEW
    { id: "people", label: "People Management", icon: "users" },
    { id: "predictive", label: "Predictive Maintenance", icon: "chart-line" }
  ]
}
```

---

## Implementation Timeline

### Week 1: Virtual Garage
- ✅ Day 1-2: Setup Three.js infrastructure
- ✅ Day 3-4: Create 3D vehicle viewer component
- ✅ Day 5: Connect to Fleet vehicles API
- ✅ Day 6-7: Polish UI and add interactions

### Week 2: Radio Dispatch
- ✅ Day 1-2: Create RadioDispatch module (simplified view)
- ✅ Day 3: Add API integration
- ✅ Day 4-5: Implement live feed and incidents
- ✅ Day 6-7: Add emergency incident tracking

### Week 3: Integration & Testing
- ✅ Day 1-2: Database schema changes
- ✅ Day 3-4: Cross-module integration (GPS, incidents)
- ✅ Day 5: End-to-end testing
- ✅ Day 6-7: Documentation and deployment

---

## Testing Strategy

### Unit Tests
- 3D rendering components
- Radio API client
- Data synchronization logic

### Integration Tests
- Fleet → Radio Dispatch data flow
- Radio incidents → Fleet safety incidents
- Vehicle GPS → Radio dispatch map

### E2E Tests
- View vehicle in Virtual Garage
- Receive radio transmission → Create incident → Assign vehicle
- Emergency response workflow

---

## Rollout Plan

### Phase 1: Staging Deployment
1. Deploy to staging environment
2. Test with real radio data (if available)
3. Verify 3D models load correctly
4. Performance testing

### Phase 2: Production Deployment
1. Feature flag: `VITE_ENABLE_RADIO_DISPATCH=true`
2. Gradual rollout (10% → 50% → 100%)
3. Monitor for errors
4. Collect user feedback

### Phase 3: Full Integration
1. Deep database integration
2. Real-time synchronization
3. Advanced features (voice commands, AI analysis)

---

## Success Criteria

### Virtual Garage
- ✅ All fleet vehicles visible in 3D
- ✅ Load time < 3 seconds
- ✅ Smooth 60fps rendering
- ✅ Works on desktop and tablet

### Radio Dispatch
- ✅ Live transmission feed with < 1 second delay
- ✅ Incidents created from radio within 5 seconds
- ✅ Fleet vehicles assigned to incidents correctly
- ✅ GPS integration shows accurate locations

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 3D models too large | High load times | Use compressed GLB format, lazy loading |
| Radio Dispatch API downtime | Feature unavailable | Add offline mode, fallback to manual entry |
| Complex state management | Bugs, performance issues | Use React Query for caching, clear data flow |
| User confusion with two apps | Poor UX | Clear navigation, in-app tutorials |

---

## Future Enhancements

### Virtual Garage V2
- AR/VR support for immersive viewing
- Vehicle damage visualization from incidents
- Maintenance history 3D overlays (show replaced parts)
- Custom livery/decal editor

### Radio Dispatch V2
- AI-powered dispatch recommendations
- Voice command integration
- Predictive incident modeling
- Multi-agency coordination

---

**Status:** Ready for Implementation
**Start Date:** TBD
**Target Completion:** 3 weeks from start
**Owner:** Development Team
