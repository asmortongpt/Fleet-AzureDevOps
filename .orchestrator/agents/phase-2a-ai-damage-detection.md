# Phase 2A: AI Damage Detection Implementation

**Agent**: AI-ML-Specialist
**LLM Model**: GPT-4o
**Estimated Time**: 2 hours
**Priority**: P0 - Critical Path

## Mission
Implement production-ready AI damage detection system for vehicle inspections using YOLOv8 object detection and ResNet-50 classification, with mobile deployment to iOS (CoreML) and Android (TensorFlow Lite).

## Tasks

### Task 2A-1: YOLOv8 Damage Detection Model
**Deliverables**:
- Trained YOLOv8 model detecting: dents, scratches, cracks, broken glass, tire damage
- Training dataset: Use public datasets + synthetic augmentation
- Model weights and configuration
- FastAPI inference endpoint
- Performance metrics: mAP, precision, recall, F1

**Definition of Done**:
- Model achieves >85% mAP@0.5 on validation set
- Inference API returns bounding boxes with confidence scores
- API handles batch processing (up to 10 images)
- Response time <2s per image

**Implementation**:
```python
# api/services/damage-detection/yolo_service.py
from ultralytics import YOLO
import cv2
import numpy as np

class DamageDetectionService:
    def __init__(self):
        self.model = YOLO('models/vehicle_damage_yolov8n.pt')

    async def detect_damage(self, image_path: str):
        results = self.model(image_path)
        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    'class': r.names[int(box.cls)],
                    'confidence': float(box.conf),
                    'bbox': box.xyxy[0].tolist()
                })
        return detections
```

### Task 2A-2: ResNet-50 Damage Severity Classifier
**Deliverables**:
- Fine-tuned ResNet-50 for severity classification (minor/moderate/severe)
- Calibrated confidence scores (temperature scaling)
- API endpoint for severity estimation
- Confusion matrix and ROC curves

**Definition of Done**:
- Classification accuracy >90% on test set
- Properly calibrated probabilities (ECE <0.1)
- API integrates with YOLO detection pipeline
- Severity estimates include confidence intervals

### Task 2A-3: CoreML Conversion for iOS
**Deliverables**:
- YOLOv8 and ResNet-50 exported to CoreML format
- Swift integration code for both models
- Performance benchmarks on target devices
- Memory profiling results

**Definition of Done**:
- Models run at >10 FPS on iPhone 12
- Memory footprint <200MB during inference
- Properly handles camera input and preprocessing
- Results match Python implementation (IoU >0.9)

**Implementation**:
```swift
// mobile-apps/ios-native/FleetManager/Services/DamageDetectionService.swift
import CoreML
import Vision

class DamageDetectionService {
    private var yoloModel: VNCoreMLModel?
    private var classifierModel: VNCoreMLModel?

    func detectDamage(image: UIImage, completion: @escaping ([Detection]) -> Void) {
        guard let yolo = try? VNCoreMLModel(for: VehicleDamageYOLOv8().model) else { return }
        // Implementation...
    }
}
```

### Task 2A-4: TensorFlow Lite Conversion for Android
**Deliverables**:
- Models exported to TFLite with quantization
- Kotlin integration code
- Performance benchmarks on mid-range Android devices
- Memory optimization

**Definition of Done**:
- Models run at >10 FPS on Pixel 6
- Memory footprint <200MB
- Supports both camera and gallery images
- Results consistent with CoreML version

### Task 2A-5: Mobile App Integration
**Deliverables**:
- iOS screens: Camera capture, detection results, severity display
- Android screens: Same functionality
- Unit tests for model integration
- E2E tests for camera workflow

**Definition of Done**:
- Users can capture photo from camera or select from gallery
- Bounding boxes overlaid on image in real-time
- Severity estimates displayed per detected damage
- Total processing time <3s from capture to results
- Results saved to vehicle inspection record

### Task 2A-6: Azure Deployment
**Deliverables**:
- Docker image with GPU support (NVIDIA runtime)
- Kubernetes manifest for AKS deployment
- Horizontal Pod Autoscaler configuration
- Load testing results

**Definition of Done**:
- API handles 100 requests/minute
- P95 latency <2s
- Auto-scales from 2 to 10 pods based on load
- GPU utilization optimized (>70% during load)
- Prometheus metrics exported

**Kubernetes Manifest**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: damage-detection-api
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: damage-detection
        image: fleetregistry.azurecr.io/damage-detection:v1.0.0
        resources:
          limits:
            nvidia.com/gpu: 1
          requests:
            nvidia.com/gpu: 1
```

## Database Schema

```sql
-- Add to database/migrations/
CREATE TABLE damage_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  inspection_id UUID REFERENCES inspections(id),
  image_url TEXT NOT NULL,
  detections JSONB NOT NULL,
  overall_severity TEXT CHECK (overall_severity IN ('minor', 'moderate', 'severe')),
  ai_confidence DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_damage_detections_vehicle_id ON damage_detections(vehicle_id);
CREATE INDEX idx_damage_detections_inspection_id ON damage_detections(inspection_id);
```

## API Endpoints

```typescript
// api/routes/damage-detection.ts
router.post('/api/damage-detection/analyze', upload.single('image'), async (req, res) => {
  // 1. Upload image to Azure Blob Storage
  // 2. Call YOLO detection service
  // 3. Call severity classifier
  // 4. Save results to database
  // 5. Return combined results
});

router.get('/api/damage-detection/:inspectionId', async (req, res) => {
  // Retrieve all damage detections for an inspection
});
```

## Testing Requirements

1. **Unit Tests**: 80%+ coverage for service layer
2. **Integration Tests**: End-to-end API tests
3. **Model Tests**: Validation set performance
4. **Mobile Tests**: XCTest (iOS), Espresso (Android)

## Documentation

1. API documentation (Swagger)
2. Model performance report
3. Mobile integration guide
4. Deployment playbook

## Success Criteria

- All 6 tasks completed and deployed
- Models achieve target accuracy
- Mobile apps functional on real devices
- API deployed to production AKS
- Documentation complete

## Branch Strategy
- Branch: `feature/phase-2a-ai-damage-detection`
- PR: Link to tracking issue #2A
- Required reviewers: 2 (DevOps + Security)

## Azure Resources Needed

- Azure ML workspace for model training
- Azure Container Registry for Docker images
- Azure Blob Storage for images and model artifacts
- AKS node pool with GPU nodes (Standard_NC6s_v3)

## External Dependencies

- Ultralytics YOLOv8 library
- PyTorch and torchvision
- CoreMLTools for iOS conversion
- TensorFlow Lite converter
- FastAPI for REST API

## Monitoring

- Prometheus metrics: inference_latency, batch_size, gpu_utilization
- Application Insights: request traces, exceptions
- Custom metrics: model_accuracy_drift, confidence_distribution

---

**START IMPLEMENTATION NOW**
