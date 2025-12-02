# AI-Powered Vehicle Damage Detection from Photos

## Overview

Automatically detect, classify, and map vehicle damage from photos using AI vision models, then project damage onto the 3D vehicle model with accurate positioning and cost estimation.

---

## Workflow: Photo → AI Analysis → 3D Mapping

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. Photo Capture                                                      │
│    - User takes photo with smartphone/tablet                          │
│    - EXIF data includes GPS, timestamp, device orientation            │
│    - Photo uploaded to Azure Blob Storage                             │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. AI Vision Analysis (Azure Computer Vision / OpenAI GPT-4V)        │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Step 1: Detect Vehicle in Image                             │  │
│    │  - Identify vehicle location and boundaries                 │  │
│    │  - Confirm image contains a vehicle                          │  │
│    │  - Extract vehicle make/model if possible                    │  │
│    └─────────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Step 2: Identify Damage Regions                             │  │
│    │  - Detect scratches, dents, cracks, broken parts            │  │
│    │  - Generate bounding boxes for each damage area             │  │
│    │  - Calculate pixel coordinates of damage                     │  │
│    └─────────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Step 3: Classify Damage Type & Severity                     │  │
│    │  - Type: scratch / dent / crack / broken / rust / paint_chip│  │
│    │  - Severity: minor / moderate / severe / critical            │  │
│    │  - Part identification: hood / door / bumper / fender       │  │
│    └─────────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Step 4: Estimate Repair Cost                                │  │
│    │  - ML model trained on historical repair costs              │  │
│    │  - Factors: damage type, size, part, vehicle make/model     │  │
│    │  - Output: estimated cost range                              │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Output:                                                                │
│ {                                                                      │
│   "damages": [                                                         │
│     {                                                                  │
│       "type": "dent",                                                  │
│       "severity": "moderate",                                          │
│       "part": "front_bumper",                                          │
│       "bounding_box": { "x": 450, "y": 320, "width": 180, "height": 120 },│
│       "confidence": 0.92,                                              │
│       "estimated_cost": { "min": 400, "max": 600, "currency": "USD" }  │
│     }                                                                  │
│   ],                                                                   │
│   "vehicle_angle": "front_left_45",                                   │
│   "vehicle_part_visible": ["front_bumper", "hood", "driver_fender"]   │
│ }                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. 3D Position Mapping                                                │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Camera Angle Detection                                       │  │
│    │  - Identify photo perspective (front/rear/side/45°)         │  │
│    │  - Detect camera height and distance                         │  │
│    │  - Use EXIF orientation data if available                    │  │
│    └─────────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ 2D-to-3D Projection                                          │  │
│    │  - Map bounding box pixel coords to 3D model surface        │  │
│    │  - Use vehicle part name to identify 3D mesh                │  │
│    │  - Raycast from camera view to find 3D intersection point   │  │
│    │  - Calculate surface normal for marker orientation           │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Output:                                                                │
│ {                                                                      │
│   "position_3d": { "x": 2.45, "y": 0.8, "z": 1.2 },                   │
│   "normal": { "x": 0.0, "y": 0.0, "z": 1.0 },                         │
│   "part_mesh_name": "front_bumper_001"                                │
│ }                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. Create Damage Record & Display in 3D Viewer                        │
│    - Insert damage record into PostgreSQL                             │
│    - Render damage marker on 3D vehicle model                         │
│    - Link photo to damage marker                                      │
│    - Allow user to review and adjust if needed                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Implementation: AI Vision Service

### Option 1: Azure Computer Vision (Recommended for Enterprise)

**Advantages**:
- Enterprise SLA and support
- GDPR/HIPAA compliant
- Pre-trained on automotive damage
- Custom Vision training available
- Integrated with Azure ecosystem

```typescript
// api/src/services/azureVisionService.ts
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';

export class AzureVisionDamageDetector {
  private client: ComputerVisionClient;

  constructor() {
    const credentials = new CognitiveServicesCredentials(
      process.env.AZURE_COMPUTER_VISION_KEY!
    );
    this.client = new ComputerVisionClient(
      credentials,
      process.env.AZURE_COMPUTER_VISION_ENDPOINT!
    );
  }

  async detectDamage(imageUrl: string) {
    // Step 1: Analyze image for objects (vehicle detection)
    const objectDetection = await this.client.analyzeImage(imageUrl, {
      visualFeatures: ['Objects', 'Tags', 'Description']
    });

    // Check if vehicle is in image
    const hasVehicle = objectDetection.objects?.some(
      obj => obj.object === 'car' || obj.object === 'truck' || obj.object === 'vehicle'
    );

    if (!hasVehicle) {
      throw new Error('No vehicle detected in image');
    }

    // Step 2: Use Custom Vision model for damage detection
    // (Requires training a custom model with labeled damage photos)
    const damageDetection = await this.detectWithCustomModel(imageUrl);

    return {
      vehicleDetected: true,
      damages: damageDetection.predictions.map(pred => ({
        type: this.classifyDamageType(pred.tagName),
        severity: this.calculateSeverity(pred.probability, pred.boundingBox),
        confidence: pred.probability,
        boundingBox: {
          x: pred.boundingBox.left * 100, // Convert to percentage
          y: pred.boundingBox.top * 100,
          width: pred.boundingBox.width * 100,
          height: pred.boundingBox.height * 100
        },
        partEstimate: this.estimateVehiclePart(pred.boundingBox)
      }))
    };
  }

  private async detectWithCustomModel(imageUrl: string) {
    // Call Custom Vision API
    // URL: https://{endpoint}/customvision/v3.0/Prediction/{projectId}/detect/iterations/{publishedName}/url
    const response = await fetch(
      `${process.env.AZURE_CUSTOM_VISION_ENDPOINT}/detect/iterations/${process.env.CUSTOM_VISION_ITERATION}/url`,
      {
        method: 'POST',
        headers: {
          'Prediction-Key': process.env.AZURE_CUSTOM_VISION_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Url: imageUrl })
      }
    );

    return response.json();
  }

  private classifyDamageType(tagName: string): string {
    const typeMap: Record<string, string> = {
      'scratch': 'scratch',
      'dent': 'dent',
      'crack': 'crack',
      'broken_glass': 'broken',
      'rust': 'rust',
      'paint_damage': 'paint_chip',
      'collision': 'collision'
    };

    return typeMap[tagName.toLowerCase()] || 'other';
  }

  private calculateSeverity(confidence: number, boundingBox: any): string {
    // Calculate damage size (rough estimate based on bounding box)
    const damageArea = boundingBox.width * boundingBox.height;

    if (damageArea > 0.15 || confidence > 0.95) return 'critical';
    if (damageArea > 0.08 || confidence > 0.85) return 'severe';
    if (damageArea > 0.03 || confidence > 0.70) return 'moderate';
    return 'minor';
  }

  private estimateVehiclePart(boundingBox: any): string {
    // Estimate vehicle part based on bounding box position
    // Assumes front-view photo
    const centerX = boundingBox.left + (boundingBox.width / 2);
    const centerY = boundingBox.top + (boundingBox.height / 2);

    // Top section (hood, windshield, roof)
    if (centerY < 0.4) {
      if (centerY < 0.2) return 'hood';
      return 'windshield';
    }

    // Middle section (doors, fenders)
    if (centerY < 0.7) {
      if (centerX < 0.35) return 'driver_fender';
      if (centerX > 0.65) return 'passenger_fender';
      if (centerX < 0.5) return 'driver_door';
      return 'passenger_door';
    }

    // Bottom section (bumpers)
    if (centerX < 0.5) return 'front_bumper';
    return 'rear_bumper';
  }
}
```

### Option 2: OpenAI GPT-4 Vision (Best for Accuracy & Description)

**Advantages**:
- Best-in-class vision understanding
- Natural language damage descriptions
- Can identify make/model/year
- Explains damage in detail

```typescript
// api/src/services/openaiVisionService.ts
import OpenAI from 'openai';

export class OpenAIVisionDamageDetector {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async detectDamage(imageUrl: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert vehicle damage assessor. Analyze this vehicle photo and provide a detailed damage assessment in JSON format.

Return a JSON object with this exact structure:
{
  "vehicleDetected": boolean,
  "vehicleInfo": {
    "make": string or null,
    "model": string or null,
    "year": number or null,
    "color": string
  },
  "cameraAngle": "front" | "rear" | "left_side" | "right_side" | "front_left_45" | "front_right_45" | "rear_left_45" | "rear_right_45",
  "damages": [
    {
      "type": "scratch" | "dent" | "crack" | "broken" | "rust" | "paint_chip" | "collision",
      "severity": "minor" | "moderate" | "severe" | "critical",
      "part": "hood" | "front_bumper" | "rear_bumper" | "driver_door" | "passenger_door" | "driver_fender" | "passenger_fender" | "windshield" | "rear_window" | "headlight" | "taillight" | "roof" | "trunk" | "wheel" | "tire" | "other",
      "description": string,
      "estimatedSize": string (e.g., "3 inches", "12cm"),
      "boundingBox": {
        "x": number (0-100, percentage from left),
        "y": number (0-100, percentage from top),
        "width": number (0-100, percentage of image width),
        "height": number (0-100, percentage of image height)
      },
      "confidence": number (0.0-1.0)
    }
  ],
  "overallAssessment": string
}

Be thorough and identify ALL visible damage, no matter how minor.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.2 // Low temperature for consistent output
    });

    const content = response.choices[0].message.content;

    // Parse JSON from response
    // GPT-4 Vision sometimes wraps JSON in markdown code blocks
    const jsonMatch = content?.match(/```json\n([\s\S]*?)\n```/) ||
                      content?.match(/```\n([\s\S]*?)\n```/) ||
                      [null, content];

    const jsonStr = jsonMatch[1] || content;
    const result = JSON.parse(jsonStr!);

    return result;
  }

  async estimateCost(damageData: any) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert auto body repair cost estimator.'
        },
        {
          role: 'user',
          content: `Estimate the repair cost for the following vehicle damage:

Vehicle: ${damageData.vehicleInfo.make} ${damageData.vehicleInfo.model} ${damageData.vehicleInfo.year}
Damages: ${JSON.stringify(damageData.damages, null, 2)}

Provide cost estimates in USD for each damage item and a total.
Return JSON format:
{
  "damageEstimates": [
    {
      "damageIndex": number,
      "laborCost": number,
      "partsCost": number,
      "totalCost": number,
      "notes": string
    }
  ],
  "totalEstimate": {
    "min": number,
    "max": number,
    "mostLikely": number
  }
}`
        }
      ],
      temperature: 0.3
    });

    const jsonMatch = response.choices[0].message.content?.match(/```json\n([\s\S]*?)\n```/);
    return JSON.parse(jsonMatch?.[1] || response.choices[0].message.content!);
  }
}
```

---

## 3D Position Mapping from 2D Photo

```typescript
// src/utils/photo2DTo3DMapper.ts
import * as THREE from 'three';

interface PhotoMetadata {
  cameraAngle: string; // 'front', 'rear', 'left_side', 'front_left_45', etc.
  damageLocation: {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    width: number;
    height: number;
  };
  vehiclePart: string; // 'front_bumper', 'hood', etc.
}

export class Photo2DTo3DMapper {
  private vehicleModel: THREE.Group;

  constructor(vehicleModel: THREE.Group) {
    this.vehicleModel = vehicleModel;
  }

  /**
   * Map 2D photo coordinates to 3D model position
   */
  map2DTo3D(metadata: PhotoMetadata): {
    position: THREE.Vector3;
    normal: THREE.Vector3;
  } | null {
    // Step 1: Create virtual camera matching photo perspective
    const camera = this.createVirtualCamera(metadata.cameraAngle);

    // Step 2: Convert percentage coordinates to normalized device coordinates
    const ndcX = (metadata.damageLocation.x / 100) * 2 - 1;
    const ndcY = -((metadata.damageLocation.y / 100) * 2 - 1); // Flip Y axis

    // Step 3: Raycast from camera through 2D point
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    // Step 4: Find intersection with vehicle model
    // Filter to only check the identified vehicle part
    const partMesh = this.findPartMesh(metadata.vehiclePart);
    if (!partMesh) {
      console.warn(`Part mesh not found: ${metadata.vehiclePart}`);
      return null;
    }

    const intersects = raycaster.intersectObject(partMesh, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];

      return {
        position: intersection.point,
        normal: intersection.face?.normal.clone() || new THREE.Vector3(0, 1, 0)
      };
    }

    return null;
  }

  /**
   * Create virtual camera matching photo perspective
   */
  private createVirtualCamera(angle: string): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    // Position camera based on angle
    switch (angle) {
      case 'front':
        camera.position.set(0, 1.5, 5);
        break;
      case 'rear':
        camera.position.set(0, 1.5, -5);
        break;
      case 'left_side':
        camera.position.set(-5, 1.5, 0);
        break;
      case 'right_side':
        camera.position.set(5, 1.5, 0);
        break;
      case 'front_left_45':
        camera.position.set(-4, 1.5, 4);
        break;
      case 'front_right_45':
        camera.position.set(4, 1.5, 4);
        break;
      case 'rear_left_45':
        camera.position.set(-4, 1.5, -4);
        break;
      case 'rear_right_45':
        camera.position.set(4, 1.5, -4);
        break;
      default:
        camera.position.set(3, 2, 4); // Default 3/4 view
    }

    // Look at vehicle center
    camera.lookAt(0, 1, 0);

    return camera;
  }

  /**
   * Find 3D mesh for vehicle part
   */
  private findPartMesh(partName: string): THREE.Object3D | null {
    // Search for mesh by name
    // Vehicle models should have named parts (e.g., "front_bumper_001")
    let found: THREE.Object3D | null = null;

    this.vehicleModel.traverse((child) => {
      if (child.name.toLowerCase().includes(partName.toLowerCase())) {
        found = child;
      }
    });

    return found;
  }
}
```

---

## API Endpoints

### POST /api/damage/analyze-photo

**Upload and analyze damage photo**

```typescript
// api/src/routes/damage.ts
import { Router } from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import { OpenAIVisionDamageDetector } from '../services/openaiVisionService';
import { Photo2DTo3DMapper } from '../utils/photo2DTo3DMapper';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze-photo', upload.single('photo'), async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const photoFile = req.file;

    if (!photoFile) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    // Step 1: Upload photo to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient('damage-photos');
    const blobName = `${vehicleId}/${Date.now()}-${photoFile.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(photoFile.buffer, {
      blobHTTPHeaders: { blobContentType: photoFile.mimetype }
    });

    const photoUrl = blockBlobClient.url;

    // Step 2: Analyze photo with AI
    const detector = new OpenAIVisionDamageDetector();
    const damageAnalysis = await detector.detectDamage(photoUrl);

    if (!damageAnalysis.vehicleDetected) {
      return res.status(400).json({
        error: 'No vehicle detected in photo',
        photoUrl
      });
    }

    // Step 3: Get cost estimates
    const costEstimates = await detector.estimateCost(damageAnalysis);

    // Step 4: Map damages to 3D positions
    // (This would require loading the vehicle's 3D model server-side,
    //  or we can return 2D positions and let frontend map to 3D)

    const damagesWithPositions = damageAnalysis.damages.map((damage: any, index: number) => ({
      ...damage,
      photoUrl,
      photoMetadata: {
        cameraAngle: damageAnalysis.cameraAngle,
        boundingBox: damage.boundingBox
      },
      costEstimate: costEstimates.damageEstimates[index]?.totalCost || null
    }));

    // Step 5: Return analysis results
    res.json({
      success: true,
      photoUrl,
      vehicleInfo: damageAnalysis.vehicleInfo,
      cameraAngle: damageAnalysis.cameraAngle,
      damages: damagesWithPositions,
      totalEstimatedCost: costEstimates.totalEstimate,
      overallAssessment: damageAnalysis.overallAssessment
    });

  } catch (error) {
    console.error('Photo analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze photo' });
  }
});

export default router;
```

### POST /api/damage/confirm

**User confirms AI-detected damage and saves to database**

```typescript
router.post('/confirm', async (req, res) => {
  const {
    vehicleId,
    damages, // Array of damage objects from AI analysis
    position3D, // Optional: user-adjusted 3D position
    userNotes
  } = req.body;

  // Insert into vehicle_damage table
  const insertedDamages = await Promise.all(
    damages.map(async (damage: any) => {
      const result = await db.query(
        `INSERT INTO vehicle_damage (
          vehicle_id,
          position_x, position_y, position_z,
          normal_x, normal_y, normal_z,
          severity,
          damage_type,
          part_name,
          description,
          photo_urls,
          cost_estimate,
          reported_by,
          reported_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          vehicleId,
          position3D?.x || 0,
          position3D?.y || 0,
          position3D?.z || 0,
          position3D?.normal?.x || 0,
          position3D?.normal?.y || 1,
          position3D?.normal?.z || 0,
          damage.severity,
          damage.type,
          damage.part,
          `${damage.description}${userNotes ? `\n\nUser notes: ${userNotes}` : ''}`,
          [damage.photoUrl],
          damage.costEstimate,
          req.user.id
        ]
      );

      return result.rows[0];
    })
  );

  res.json({
    success: true,
    damages: insertedDamages
  });
});
```

---

## Frontend: Photo Upload & AI Analysis UI

```typescript
// src/components/AIDamagePhotoUpload.tsx
import { useState } from 'react';
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react';

export function AIDamagePhotoUpload({ vehicleId, onDamageDetected }: {
  vehicleId: string;
  onDamageDetected: (damages: any[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload and analyze photo
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('vehicleId', vehicleId);

      const response = await fetch('/api/damage/analyze-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisResult = await response.json();

      setResult(analysisResult);
      onDamageDetected(analysisResult.damages);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">AI Damage Detection</h2>

      {/* Upload Button */}
      <label className="block">
        <input
          type="file"
          accept="image/*"
          capture="environment" // Use back camera on mobile
          onChange={handlePhotoUpload}
          disabled={uploading}
          className="hidden"
        />

        <div className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${uploading ? 'border-gray-300 bg-gray-50' : 'border-blue-500 hover:border-blue-700 hover:bg-blue-50'}
        `}>
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-lg font-semibold">Analyzing Photo...</p>
              <p className="text-sm text-gray-600 mt-2">
                AI is detecting and classifying vehicle damage
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-semibold">Upload Damage Photo</p>
              <p className="text-sm text-gray-600 mt-2">
                Take or select a photo of vehicle damage
              </p>
            </>
          )}
        </div>
      </label>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Analysis Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Analysis Complete</span>
          </div>

          {/* Vehicle Info */}
          {result.vehicleInfo.make && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Detected Vehicle</p>
              <p className="font-semibold">
                {result.vehicleInfo.make} {result.vehicleInfo.model} {result.vehicleInfo.year}
              </p>
            </div>
          )}

          {/* Damage Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Detected Damages</p>
            <p className="text-2xl font-bold">{result.damages.length}</p>
            <p className="text-sm text-gray-600 mt-2">
              Total Estimated Cost: ${result.totalEstimatedCost.mostLikely.toLocaleString()}
            </p>
          </div>

          {/* Individual Damages */}
          <div className="space-y-3">
            {result.damages.map((damage: any, index: number) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-semibold text-white
                    ${damage.severity === 'critical' ? 'bg-red-500' :
                      damage.severity === 'severe' ? 'bg-orange-500' :
                      damage.severity === 'moderate' ? 'bg-yellow-500' :
                      'bg-green-500'}
                  `}>
                    {damage.severity.toUpperCase()}
                  </span>

                  <span className="text-sm text-gray-600">
                    {damage.part.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">{damage.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Type: {damage.type}
                  </span>
                  <span className="font-semibold">
                    ${damage.costEstimate?.toLocaleString() || 'TBD'}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Confidence: {(damage.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          <button
            onClick={() => {
              // Trigger 3D mapping and save to database
              onDamageDetected(result.damages);
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Confirm & Map to 3D Model
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Training Custom AI Model (Azure Custom Vision)

**Steps to train damage detection model**:

1. **Collect Training Data** (500-1000 images minimum)
   - Photos of scratches, dents, cracks, broken parts
   - Label each damage with bounding boxes
   - Include various angles, lighting conditions
   - Mix of damage severities

2. **Create Custom Vision Project**
   ```bash
   # Azure CLI
   az cognitiveservices account create \
     --name fleet-damage-detector \
     --resource-group fleet-management \
     --kind CustomVision.Training \
     --sku S0 \
     --location eastus
   ```

3. **Upload & Label Images**
   - Use Custom Vision portal: https://customvision.ai
   - Create tags: "scratch", "dent", "crack", "broken", "rust"
   - Draw bounding boxes around each damage
   - Aim for 50-100 images per tag

4. **Train Model**
   - Click "Train" in portal
   - Choose "Quick Training" or "Advanced Training"
   - Wait 10-30 minutes for training

5. **Test & Iterate**
   - Test with new photos
   - Check precision and recall
   - Add more training data for low-confidence predictions

6. **Publish Model**
   - Publish iteration for API access
   - Get prediction endpoint URL and key

---

## Cost Analysis

### Azure Computer Vision
- **Standard**: $1 per 1,000 transactions
- **Custom Vision Training**: $20/month
- **Custom Vision Prediction**: $2 per 1,000 transactions

### OpenAI GPT-4 Vision
- **GPT-4V**: $0.01 per image (low res) / $0.03 per image (high res)

### Storage (Azure Blob)
- **Hot tier**: $0.02 per GB/month
- 1,000 photos (~5GB): $0.10/month

**Example: 100 damage reports/month**
- OpenAI GPT-4V: $1-3
- Azure Blob Storage: $0.10
- **Total**: ~$1-3/month

---

## Future Enhancements

1. **Video Analysis**: Process video walkarounds for complete damage assessment
2. **Historical Comparison**: Compare current damage to previous inspections
3. **AR Preview**: Show predicted 3D markers in AR before confirming
4. **Multi-Photo Fusion**: Combine multiple photos for better 3D accuracy
5. **Repair Tracking**: Track damage repair progress with before/after photos

---

**Last Updated**: 2025-11-11
**Status**: Design Complete, Ready for Implementation
**Dependencies**: Azure Computer Vision or OpenAI API, Azure Blob Storage
