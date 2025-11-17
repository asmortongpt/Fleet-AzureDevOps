# Vehicle Damage Mapping and Rendering System

## Overview

A comprehensive system for visualizing vehicle damage in the photorealistic 3D viewer, enabling fleet managers to document, track, and assess vehicle damage with interactive 3D annotations.

---

## Features

### 1. Interactive Damage Annotation
- Click-to-mark damage on 3D model surface
- Real-time damage marker placement
- Multi-damage support (track multiple damage points)
- Annotate with photos, descriptions, and severity ratings

### 2. Damage Visualization Types

**A. Damage Markers/Hotspots**
- 3D billboarded sprites at damage location
- Color-coded by severity (green/yellow/orange/red)
- Click to expand detailed damage info
- Animated pulse effect for visibility

**B. Damage Overlay Materials**
- Scratch overlays (procedural or texture-based)
- Dent deformation (vertex displacement)
- Broken glass shader (cracks, shatter patterns)
- Rust/corrosion effects
- Paint damage (chips, scratches)

**C. Heat Map Visualization**
- Damage density heat map overlay
- Shows high-damage areas across fleet
- Useful for identifying problem zones (e.g., rear bumper damage common)

### 3. Damage Severity Levels

| Level | Color | Description | Visual Effect |
|-------|-------|-------------|---------------|
| **Minor** | Green | Cosmetic only | Small marker, subtle glow |
| **Moderate** | Yellow | Functional impact | Medium marker, yellow overlay |
| **Severe** | Orange | Significant damage | Large marker, orange glow |
| **Critical** | Red | Safety concern | Pulsing red marker, urgent |

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Fleet Management UI                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Vehicle3DViewer Component                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Photorealistic 3D Model (GLB/GLTF)            │  │  │
│  │  │  - Clearcoat car paint                          │  │  │
│  │  │  - Chrome, glass, rubber materials              │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Damage Overlay Layer                           │  │  │
│  │  │  ┌─────────────────────────────────────────┐   │  │  │
│  │  │  │ Damage Markers (3D Sprites)             │   │  │  │
│  │  │  │ - Position: Vector3(x, y, z)            │   │  │  │
│  │  │  │ - Severity: minor/moderate/severe/crit  │   │  │  │
│  │  │  │ - Color: severity-based                 │   │  │  │
│  │  │  └─────────────────────────────────────────┘   │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌─────────────────────────────────────────┐   │  │  │
│  │  │  │ Damage Materials/Shaders                │   │  │  │
│  │  │  │ - Scratch overlays (decals)             │   │  │  │
│  │  │  │ - Dent displacement                      │   │  │  │
│  │  │  │ - Broken glass shader                    │   │  │  │
│  │  │  └─────────────────────────────────────────┘   │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌─────────────────────────────────────────┐   │  │  │
│  │  │  │ Raycasting System                        │   │  │  │
│  │  │  │ - Click detection on 3D surface         │   │  │  │
│  │  │  │ - Returns: intersection point, normal   │   │  │  │
│  │  │  └─────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Damage Annotation Panel                        │  │  │
│  │  │  - Photo upload                                  │  │  │
│  │  │  - Description text                              │  │  │
│  │  │  - Severity selector                             │  │  │
│  │  │  - Cost estimate                                 │  │  │
│  │  │  - Date/time recorded                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   Damage API          │
                  │   POST /api/damage    │
                  │   GET  /api/damage    │
                  │   PUT  /api/damage/:id│
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   PostgreSQL Database │
                  │   vehicle_damage      │
                  │   - id                │
                  │   - vehicle_id        │
                  │   - position_x/y/z    │
                  │   - severity          │
                  │   - description       │
                  │   - photo_urls[]      │
                  │   - cost_estimate     │
                  │   - created_at        │
                  └───────────────────────┘
```

---

## Database Schema

### vehicle_damage Table

```sql
CREATE TABLE vehicle_damage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- 3D Position (world coordinates on vehicle model)
    position_x DECIMAL(10, 6) NOT NULL,
    position_y DECIMAL(10, 6) NOT NULL,
    position_z DECIMAL(10, 6) NOT NULL,

    -- Surface normal (for correct marker orientation)
    normal_x DECIMAL(10, 6),
    normal_y DECIMAL(10, 6),
    normal_z DECIMAL(10, 6),

    -- Damage Information
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
    damage_type VARCHAR(50), -- 'scratch', 'dent', 'crack', 'broken', 'rust', 'paint_chip'
    part_name VARCHAR(100), -- 'front_bumper', 'driver_door', 'hood', etc.

    -- Description and Documentation
    description TEXT,
    photo_urls TEXT[], -- Array of photo URLs
    repair_notes TEXT,

    -- Cost and Status
    cost_estimate DECIMAL(10, 2),
    repair_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'scheduled', 'in_progress', 'completed'
    repair_date TIMESTAMP,

    -- Metadata
    reported_by UUID REFERENCES users(id),
    reported_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMP,

    CONSTRAINT valid_position CHECK (
        position_x BETWEEN -10 AND 10 AND
        position_y BETWEEN -10 AND 10 AND
        position_z BETWEEN -10 AND 10
    )
);

CREATE INDEX idx_vehicle_damage_vehicle_id ON vehicle_damage(vehicle_id);
CREATE INDEX idx_vehicle_damage_severity ON vehicle_damage(severity);
CREATE INDEX idx_vehicle_damage_reported_at ON vehicle_damage(reported_at DESC);
```

---

## React Component Implementation

### 1. Damage Marker Component

```typescript
// src/components/DamageMarker.tsx
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { useState } from 'react';

interface DamageMarkerProps {
  position: Vector3;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  damageInfo: {
    id: string;
    description: string;
    photoUrls: string[];
    costEstimate: number;
    reportedAt: Date;
  };
  onClick?: (id: string) => void;
}

const SEVERITY_COLORS = {
  minor: '#4ade80',     // green-400
  moderate: '#fbbf24',  // yellow-400
  severe: '#fb923c',    // orange-400
  critical: '#ef4444',  // red-500
};

export function DamageMarker({ position, severity, damageInfo, onClick }: DamageMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const color = SEVERITY_COLORS[severity];

  return (
    <group position={position}>
      {/* 3D Marker Sprite */}
      <sprite
        scale={[0.3, 0.3, 0.3]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => {
          setExpanded(!expanded);
          onClick?.(damageInfo.id);
        }}
      >
        <spriteMaterial
          color={color}
          opacity={hovered ? 1.0 : 0.8}
          transparent
          depthTest={false}
        />
      </sprite>

      {/* Pulsing Ring Effect (for critical damage) */}
      {severity === 'critical' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
            side={2}
          />
        </mesh>
      )}

      {/* HTML Overlay Info Panel */}
      {(hovered || expanded) && (
        <Html
          position={[0, 0.5, 0]}
          center
          style={{
            pointerEvents: expanded ? 'auto' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-4 min-w-[280px] max-w-[400px]"
            style={{ border: `2px solid ${color}` }}
          >
            {/* Severity Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {severity.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(damageInfo.reportedAt).toLocaleDateString()}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">
              {damageInfo.description}
            </p>

            {/* Cost Estimate */}
            {damageInfo.costEstimate && (
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Est. Cost: ${damageInfo.costEstimate.toLocaleString()}
              </div>
            )}

            {/* Photo Thumbnails */}
            {damageInfo.photoUrls.length > 0 && (
              <div className="flex gap-2 mb-3">
                {damageInfo.photoUrls.slice(0, 3).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Damage ${i + 1}`}
                    className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition"
                  />
                ))}
                {damageInfo.photoUrls.length > 3 && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                    +{damageInfo.photoUrls.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {expanded && (
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  View Details
                </button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                  Edit
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
```

### 2. Damage Annotation Mode

```typescript
// src/hooks/useDamageAnnotation.ts
import { useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Vector3 } from 'three';

export function useDamageAnnotation(vehicleModelRef: React.RefObject<THREE.Group>) {
  const { camera, gl } = useThree();
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [pendingDamage, setPendingDamage] = useState<{
    position: Vector3;
    normal: Vector3;
  } | null>(null);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!isAnnotating || !vehicleModelRef.current) return;

    // Convert mouse position to normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast from camera through mouse position
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Check intersection with vehicle model
    const intersects = raycaster.intersectObject(vehicleModelRef.current, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];

      // Store the 3D position and surface normal
      setPendingDamage({
        position: intersection.point,
        normal: intersection.face?.normal || new Vector3(0, 1, 0),
      });

      // Open damage annotation dialog
      // (handled by parent component)
    }
  }, [isAnnotating, vehicleModelRef, camera, gl]);

  return {
    isAnnotating,
    setIsAnnotating,
    pendingDamage,
    setPendingDamage,
    handleClick,
  };
}
```

### 3. Enhanced Vehicle3DViewer with Damage Support

```typescript
// Addition to src/components/Vehicle3DViewer.tsx

import { DamageMarker } from './DamageMarker';
import { useDamageAnnotation } from '../hooks/useDamageAnnotation';

// ... existing Vehicle3DViewer code ...

// Add damage state
const [damages, setDamages] = useState<VehicleDamage[]>([]);
const [showDamageMarkers, setShowDamageMarkers] = useState(true);

// Damage annotation hook
const { isAnnotating, setIsAnnotating, pendingDamage, handleClick } =
  useDamageAnnotation(modelRef);

// Fetch damages from API
useEffect(() => {
  if (vehicleId) {
    fetch(`/api/vehicles/${vehicleId}/damage`)
      .then(res => res.json())
      .then(data => setDamages(data))
      .catch(err => console.error('Failed to load damage data:', err));
  }
}, [vehicleId]);

// Add to Canvas
<Canvas>
  {/* ... existing 3D scene ... */}

  {/* Damage Markers */}
  {showDamageMarkers && damages.map((damage) => (
    <DamageMarker
      key={damage.id}
      position={new Vector3(damage.position_x, damage.position_y, damage.position_z)}
      severity={damage.severity}
      damageInfo={{
        id: damage.id,
        description: damage.description,
        photoUrls: damage.photo_urls,
        costEstimate: damage.cost_estimate,
        reportedAt: new Date(damage.reported_at),
      }}
      onClick={(id) => {
        // Open damage details modal
        console.log('Clicked damage:', id);
      }}
    />
  ))}
</Canvas>

{/* Damage Annotation Controls */}
<div className="absolute top-4 right-4 flex flex-col gap-2">
  <button
    onClick={() => setIsAnnotating(!isAnnotating)}
    className={`px-4 py-2 rounded ${
      isAnnotating ? 'bg-red-600' : 'bg-blue-600'
    } text-white`}
  >
    {isAnnotating ? 'Cancel Annotation' : 'Add Damage'}
  </button>

  <button
    onClick={() => setShowDamageMarkers(!showDamageMarkers)}
    className="px-4 py-2 rounded bg-gray-600 text-white"
  >
    {showDamageMarkers ? 'Hide Markers' : 'Show Markers'}
  </button>
</div>
```

---

## Advanced Damage Visualization Techniques

### 1. Scratch Overlay (Decal System)

```typescript
// src/materials/ScratchDecal.tsx
import { Decal } from '@react-three/drei';
import { useTexture } from '@react-three/drei';

export function ScratchDecal({ position, rotation, scale = 0.5 }) {
  const scratchTexture = useTexture('/textures/damage/scratch_alpha.png');

  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <meshStandardMaterial
        map={scratchTexture}
        transparent
        polygonOffset
        polygonOffsetFactor={-1}
        roughness={0.9}
        metalness={0.1}
      />
    </Decal>
  );
}
```

### 2. Dent Deformation (Vertex Displacement)

```typescript
// src/effects/DentEffect.ts
import { BufferGeometry, Vector3 } from 'three';

export function applyDentDeformation(
  geometry: BufferGeometry,
  dentCenter: Vector3,
  dentRadius: number,
  dentDepth: number
) {
  const positions = geometry.attributes.position;
  const tempVector = new Vector3();

  for (let i = 0; i < positions.count; i++) {
    tempVector.fromBufferAttribute(positions, i);

    // Calculate distance from dent center
    const distance = tempVector.distanceTo(dentCenter);

    if (distance < dentRadius) {
      // Calculate displacement amount (smooth falloff)
      const falloff = 1 - (distance / dentRadius);
      const displacement = Math.pow(falloff, 2) * dentDepth;

      // Displace vertex inward along normal
      const normal = new Vector3();
      normal.fromBufferAttribute(geometry.attributes.normal, i);
      tempVector.addScaledVector(normal, -displacement);

      // Update position
      positions.setXYZ(i, tempVector.x, tempVector.y, tempVector.z);
    }
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals(); // Recalculate normals
}
```

### 3. Broken Glass Shader

```glsl
// Broken glass fragment shader
uniform float crackDensity;
uniform vec3 crackColor;
uniform sampler2D noiseTexture;

varying vec2 vUv;

void main() {
    // Sample noise texture for crack pattern
    float noise = texture2D(noiseTexture, vUv * 10.0).r;

    // Create crack lines
    float cracks = step(0.5 + crackDensity, noise);

    // Mix glass color with crack color
    vec3 glassColor = vec3(0.8, 0.9, 1.0);
    vec3 finalColor = mix(glassColor, crackColor, cracks);

    // Reduce transparency where cracks exist
    float alpha = mix(0.3, 0.8, cracks);

    gl_FragColor = vec4(finalColor, alpha);
}
```

---

## API Endpoints

### POST /api/vehicles/:vehicleId/damage

**Create new damage record**

```typescript
// Request Body
{
  "position_x": 2.456,
  "position_y": 1.234,
  "position_z": 0.789,
  "normal_x": 0.0,
  "normal_y": 1.0,
  "normal_z": 0.0,
  "severity": "moderate",
  "damage_type": "dent",
  "part_name": "front_bumper",
  "description": "Moderate dent on front bumper, approximately 3 inches diameter",
  "photo_urls": [
    "https://storage.azure.com/fleet/damage/img1.jpg",
    "https://storage.azure.com/fleet/damage/img2.jpg"
  ],
  "cost_estimate": 450.00
}

// Response
{
  "id": "uuid",
  "vehicle_id": "uuid",
  "position_x": 2.456,
  "position_y": 1.234,
  "position_z": 0.789,
  ...
  "reported_at": "2025-11-11T12:00:00Z"
}
```

### GET /api/vehicles/:vehicleId/damage

**Get all damage for a vehicle**

```typescript
// Response
{
  "damages": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "position": { "x": 2.456, "y": 1.234, "z": 0.789 },
      "normal": { "x": 0.0, "y": 1.0, "z": 0.0 },
      "severity": "moderate",
      "damage_type": "dent",
      "part_name": "front_bumper",
      "description": "Moderate dent on front bumper",
      "photo_urls": ["url1", "url2"],
      "cost_estimate": 450.00,
      "repair_status": "pending",
      "reported_by": "user_name",
      "reported_at": "2025-11-11T12:00:00Z"
    }
  ],
  "total_damages": 5,
  "total_cost_estimate": 2350.00
}
```

---

## Damage Report Generation

### Generate PDF Report with 3D Screenshots

```typescript
// src/utils/damageReportGenerator.ts
import html2pdf from 'html2pdf.js';

export async function generateDamageReport(
  vehicleData: Vehicle,
  damages: VehicleDamage[],
  screenshot3D: string // Base64 image
) {
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .damage-item { border: 1px solid #ddd; padding: 15px; margin: 15px 0; }
        .severity-badge { padding: 5px 10px; border-radius: 4px; color: white; }
        .critical { background: #ef4444; }
        .severe { background: #fb923c; }
        .moderate { background: #fbbf24; }
        .minor { background: #4ade80; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Vehicle Damage Report</h1>
        <p>Vehicle: ${vehicleData.make} ${vehicleData.model} (${vehicleData.year})</p>
        <p>VIN: ${vehicleData.vin}</p>
        <p>Report Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="3d-view">
        <h2>3D Vehicle View</h2>
        <img src="${screenshot3D}" style="width: 100%; max-width: 800px;" />
      </div>

      <h2>Damage Summary</h2>
      <p>Total Damages: ${damages.length}</p>
      <p>Estimated Repair Cost: $${damages.reduce((sum, d) => sum + d.cost_estimate, 0).toLocaleString()}</p>

      <h2>Damage Details</h2>
      ${damages.map(damage => `
        <div class="damage-item">
          <div>
            <span class="severity-badge ${damage.severity}">${damage.severity.toUpperCase()}</span>
            <strong>${damage.part_name}</strong>
          </div>
          <p>${damage.description}</p>
          <p><strong>Cost Estimate:</strong> $${damage.cost_estimate.toLocaleString()}</p>
          <p><strong>Reported:</strong> ${new Date(damage.reported_at).toLocaleDateString()}</p>
          ${damage.photo_urls.map(url => `
            <img src="${url}" style="width: 150px; margin: 5px;" />
          `).join('')}
        </div>
      `).join('')}
    </body>
    </html>
  `;

  const opt = {
    margin: 10,
    filename: `damage-report-${vehicleData.vin}-${Date.now()}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().set(opt).from(reportHTML).save();
}
```

---

## Mobile Support

### Photo Capture on Mobile

```typescript
// src/components/DamagePhotoCapture.tsx
import { useRef } from 'react';

export function DamagePhotoCapture({ onCapture }: { onCapture: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use back camera on mobile
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        📷 Take Photo
      </button>
    </div>
  );
}
```

---

## Future Enhancements

### 1. AI-Powered Damage Detection
- Automatic damage detection from uploaded photos
- ML model estimates severity and cost
- Auto-populate damage markers from photo analysis

### 2. AR Damage Overlay
- Use device camera to view vehicle with AR damage overlays
- Point phone at real vehicle to see repair history in AR

### 3. Damage Timeline Visualization
- Animated playback showing damage accumulation over time
- Useful for tracking progressive damage (e.g., rust spreading)

### 4. Fleet-Wide Damage Analytics
- Dashboard showing damage trends across fleet
- Heat maps of common damage areas
- Predictive maintenance based on damage patterns

---

## Testing

### Unit Tests

```typescript
// tests/DamageMarker.test.tsx
import { render, screen } from '@testing-library/react';
import { DamageMarker } from '../src/components/DamageMarker';
import { Vector3 } from 'three';

describe('DamageMarker', () => {
  it('renders with correct severity color', () => {
    const damageInfo = {
      id: 'test-1',
      description: 'Test damage',
      photoUrls: [],
      costEstimate: 500,
      reportedAt: new Date(),
    };

    render(
      <DamageMarker
        position={new Vector3(0, 0, 0)}
        severity="critical"
        damageInfo={damageInfo}
      />
    );

    // Verify marker is rendered with red color for critical
    // (Testing requires Three.js test setup)
  });
});
```

---

## Performance Considerations

1. **Damage Marker LOD**: Hide markers when camera is far from vehicle
2. **Lazy Loading**: Load damage photos only when marker is expanded
3. **Instanced Rendering**: Use instanced meshes for many markers
4. **Occlusion Culling**: Hide markers behind vehicle body

---

## Documentation Files

- `docs/DAMAGE_MAPPING_SYSTEM.md` - This document
- `docs/DAMAGE_API.md` - API endpoint documentation
- `docs/DAMAGE_MIGRATION.sql` - Database migration script

---

**Last Updated**: 2025-11-11
**Compatible with**: Fleet Management v1.8-photorealistic-3d
**Dependencies**: Three.js, React Three Fiber, @react-three/drei
