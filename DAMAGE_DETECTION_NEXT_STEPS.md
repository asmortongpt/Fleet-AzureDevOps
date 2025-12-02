# AI Damage Detection - Next Steps

## Summary
✅ **Implementation Complete**: All AI damage detection code has been successfully implemented, committed (fdd57dd, 38e45cb), and pushed to Azure DevOps origin/main.

## Configuration Status

### ✅ Verified
- **OpenAI API Key**: Configured in `/Users/andrewmorton/Documents/GitHub/Fleet/api/.env`
  - Key: `sk-proj-[REDACTED]` (verified present)
  - Model: `gpt-4-vision-preview`
- **Damage Detection Services**: All TypeScript files created and in place
  - `api/src/services/openaiVisionService.ts` ✅
  - `api/src/services/mobileDamageService.ts` ✅
  - `api/src/routes/damage.ts` ✅
  - `src/components/damage/MobileDamageCapture.tsx` ✅
  - `src/components/damage/DamageAnalysisResults.tsx` ✅
  - `src/utils/damage2Dto3DMapper.ts` ✅
- **Documentation**: Complete implementation guide created
  - `docs/AI_DAMAGE_DETECTION_IMPLEMENTATION.md` (650+ lines) ✅

### ✅ Database Ready
- **Database Migration**: `vehicle_damage` table successfully created (2025-11-10)
  - 31 columns including 3D position (x, y, z) and surface normals
  - 7 indexes for optimized queries
  - 2 views: `v_vehicle_damage_summary` and `v_damage_heat_map`
  - Timestamp triggers for automatic `updated_at` tracking
  - Check constraints for data validation
- **Kubernetes Database Access**: Confirmed access to `fleet-postgres-service` in `fleet-management` namespace

---

## Next Steps (In Priority Order)

### 1. Test API Endpoints ⏭️ **READY TO TEST**

Once the database is ready, test the damage detection API:

```bash
# Test 1: Health check
curl http://localhost:3000/api/health

# Test 2: Analyze single photo (with test image)
curl -X POST http://localhost:3000/api/damage/analyze-photo \
  -F "photo=@/path/to/test/car-damage.jpg" \
  -F "metadata={\"deviceModel\":\"iPhone 14 Pro\",\"captureDate\":\"2025-11-10T00:00:00Z\"}"

# Test 3: Comprehensive analysis (multiple photos)
curl -X POST http://localhost:3000/api/damage/comprehensive-analysis \
  -F "photos=@/path/to/test/car-front.jpg" \
  -F "photos=@/path/to/test/car-rear.jpg" \
  -F "photos=@/path/to/test/car-damage-closeup.jpg"
```

### 4. Download 3D Vehicle Models (Optional but Recommended)

For accurate 3D damage mapping, download photorealistic vehicle models:

#### Recommended Sources (from RECOMMENDED_3D_MODELS.md):
1. **Sketchfab** (Free + Paid)
   - URL: https://sketchfab.com/search?features=downloadable&q=car&type=models
   - Filter: Downloadable, CC-BY or CC0 license
   - Formats: GLB/GLTF (native to Three.js)
   - Quality: Look for "PBR" (Physically Based Rendering) models

2. **TurboSquid** (Professional)
   - URL: https://www.turbosquid.com/Search/3D-Models/car
   - Price Range: $50-$500 per model
   - Formats: FBX, OBJ (convert to GLB using Blender)
   - Quality: Highest quality photorealistic models

#### Installation:
```bash
# Create models directory
mkdir -p /Users/andrewmorton/Documents/GitHub/Fleet/public/models/vehicles

# Download models and place in directory with naming convention:
# {make}_{model}_{year}.glb
# Examples:
#   toyota_camry_2023.glb
#   ford_f150_2024.glb
#   tesla_model3_2023.glb

# Update database with model references
psql -U fleetadmin -d fleetdb -c "
UPDATE vehicles
SET model_3d_url = '/models/vehicles/toyota_camry_2023.glb'
WHERE make = 'Toyota' AND model = 'Camry';
"
```

### 5. Integrate UI Components

Wire up the damage detection UI components to your vehicle detail pages:

#### Example Integration:
```typescript
// In src/pages/VehicleDetail.tsx or similar

import { MobileDamageCapture } from '@/components/damage/MobileDamageCapture';
import { DamageAnalysisResults } from '@/components/damage/DamageAnalysisResults';
import { useState } from 'react';

export function VehicleDetailPage({ vehicleId }: { vehicleId: string }) {
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisComplete = async (result: any) => {
    setAnalysisResult(result);
  };

  const handleConfirmDamages = async (damages: any[]) => {
    // Save to database
    const response = await fetch('/api/damage/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        damages: damages.map(d => ({
          position: d.position3D || { x: 0, y: 1, z: 0 },
          normal: d.normal || { x: 0, y: 1, z: 0 },
          severity: d.severity,
          damageType: d.type,
          partName: d.part,
          description: d.description,
          photoUrls: [d.photoUrl],
          costEstimate: d.estimatedCost
        })),
        photoUrls: result.analysis.photoUrls
      })
    });

    if (response.ok) {
      alert('Damage reports saved successfully!');
    }
  };

  return (
    <div>
      {/* Existing vehicle detail UI */}

      {/* Add damage capture section */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Report Vehicle Damage</h2>

        {!analysisResult ? (
          <MobileDamageCapture
            vehicleId={vehicleId}
            onAnalysisComplete={handleAnalysisComplete}
          />
        ) : (
          <DamageAnalysisResults
            analysis={analysisResult.analysis}
            costEstimate={analysisResult.costEstimate}
            onConfirmDamages={handleConfirmDamages}
            onMap3D={() => {
              // Navigate to 3D view
              window.location.href = `/vehicles/${vehicleId}/3d-damage`;
            }}
          />
        )}
      </section>
    </div>
  );
}
```

### 6. Deploy to Production (if needed)

If you need to deploy the new damage detection features to Kubernetes:

```bash
# Build new Docker images
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
az acr build --registry fleetappregistry --image fleet-api:v1.9-damage-detection --file Dockerfile .

cd /Users/andrewmorton/Documents/GitHub/Fleet
az acr build --registry fleetappregistry --image fleet-app:v1.9-damage-detection --file Dockerfile .

# Update Kubernetes deployments
kubectl set image deployment/fleet-api \
  fleet-api=fleetappregistry.azurecr.io/fleet-api:v1.9-damage-detection \
  -n fleet-management

kubectl set image deployment/fleet-app \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:v1.9-damage-detection \
  -n fleet-management

# Monitor rollout
kubectl rollout status deployment/fleet-api -n fleet-management
kubectl rollout status deployment/fleet-app -n fleet-management
```

### 7. Add OpenAI API Key to Kubernetes (if deploying)

If deploying to Kubernetes, ensure the OpenAI API key is in the secrets:

```bash
# Check if OPENAI_API_KEY is in fleet-secrets
kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data}' | grep OPENAI_API_KEY

# If not present, add it (replace YOUR_OPENAI_API_KEY with actual key from api/.env):
kubectl create secret generic fleet-secrets-new \
  --from-literal=OPENAI_API_KEY="YOUR_OPENAI_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f - -n fleet-management

# Or patch existing secret (replace YOUR_OPENAI_API_KEY with actual key):
kubectl patch secret fleet-secrets -n fleet-management \
  --type='json' \
  -p='[{"op": "add", "path": "/data/OPENAI_API_KEY", "value": "'"$(echo -n 'YOUR_OPENAI_API_KEY' | base64)"'"}]'
```

---

## Testing Checklist

Once all setup is complete, test the following workflows:

### Photo Analysis Workflow
- [ ] Capture single photo from mobile device
- [ ] Upload photo via web interface
- [ ] AI successfully detects vehicle
- [ ] AI identifies damage with bounding boxes
- [ ] Cost estimation is generated
- [ ] Damage can be saved to database

### Video Analysis Workflow
- [ ] Record 30-second video walkthrough
- [ ] System extracts key frames
- [ ] Multi-angle analysis identifies consistent damage
- [ ] Results show damage from multiple perspectives

### LiDAR Workflow (iPhone 12 Pro+ / iPad Pro 2020+)
- [ ] Device capability detection recognizes LiDAR
- [ ] LiDAR scan capture process works
- [ ] Point cloud data enhances damage measurements
- [ ] Millimeter-level accuracy is achieved

### 3D Mapping Workflow
- [ ] 2D damage positions map to 3D vehicle model
- [ ] Damage markers appear at correct locations
- [ ] Surface normals orient markers properly
- [ ] 3D view provides accurate visualization

### Database Workflow
- [ ] Damage reports save successfully
- [ ] Photo URLs are stored correctly
- [ ] Cost estimates are recorded
- [ ] Repair status can be updated
- [ ] Audit trail captures who reported damage

---

## Troubleshooting

### Issue: "OpenAI API Key not found"
**Solution**: Verify API key is loaded in environment
```bash
# Check if API key is in .env file
grep OPENAI_API_KEY api/.env

# If deploying to Kubernetes, check secret
kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data.OPENAI_API_KEY}' | base64 -d
```

### Issue: "vehicle_damage table does not exist"
**Solution**: Run database migration (see Step 1 above)

### Issue: "OpenAI API rate limit exceeded"
**Solution**: Implement rate limiting or upgrade OpenAI plan
- Current implementation has no rate limiting
- Consider adding Redis-based rate limiting
- OpenAI GPT-4 Vision has rate limits: 100 requests/minute (default)

### Issue: "3D model not loading"
**Solution**: Verify model path and format
```bash
# Check if model file exists
ls -la public/models/vehicles/

# Verify GLB/GLTF format
file public/models/vehicles/*.glb
```

### Issue: "Damage mapping to 3D model is inaccurate"
**Solution**: Calibrate camera angle detection
- Check if `cameraAngle` parameter is correct in analysis result
- Verify vehicle model dimensions match real vehicle
- Adjust distance/height parameters in `createVirtualCamera()`

---

## Cost Considerations

### OpenAI API Costs
- **GPT-4 Vision Preview**: $0.01 per image (1024x1024)
- **Typical Analysis**:
  - Single photo: ~$0.01
  - 5 photos: ~$0.05
  - Video (10 frames): ~$0.10
  - LiDAR + 5 photos: ~$0.05

### Estimated Monthly Costs
- **Low Usage** (100 damage reports/month): $5-10/month
- **Medium Usage** (500 damage reports/month): $25-50/month
- **High Usage** (2000 damage reports/month): $100-200/month

### Cost Optimization Tips
1. Use image compression before sending to OpenAI
2. Implement caching for repeated analyses
3. Use lower resolution for initial detection
4. Batch process multiple images in single request

---

## Documentation References

- **Implementation Guide**: `docs/AI_DAMAGE_DETECTION_IMPLEMENTATION.md`
- **Database Migration**: `api/src/migrations/add-vehicle-damage-table.sql`
- **3D Models Guide**: `docs/RECOMMENDED_3D_MODELS.md`
- **Damage Mapping Guide**: `docs/DAMAGE_MAPPING_SYSTEM.md`

---

## Support

For issues or questions about the damage detection system:
1. Review implementation documentation in `docs/AI_DAMAGE_DETECTION_IMPLEMENTATION.md`
2. Check troubleshooting section above
3. Verify OpenAI API key is valid and has credits
4. Ensure database migration was run successfully

---

**Last Updated**: 2025-11-10
**Implementation Status**: ✅ Complete - All Code Implemented
**Database Status**: ✅ Migration Complete - Ready for Use
**Deployment Status**: 🔄 Local Development Mode (Kubernetes database configured)
