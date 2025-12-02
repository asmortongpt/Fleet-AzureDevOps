# AI Damage Detection Implementation Guide

**Business Value**: $300,000/year in insurance claims efficiency
**Effort**: 3 weeks
**Priority**: HIGH

---

## Overview

AI-powered vehicle damage detection using computer vision to automatically identify and classify vehicle damage from photos taken with mobile devices.

## Technical Architecture

### Components
1. **Mobile App** - Capture images with guided camera interface
2. **AI Model** - YOLOv8 for detection + ResNet-50 for severity classification
3. **Backend API** - Process images, generate reports
4. **Database** - Store damage records with before/after comparisons

### Workflow
```
User captures photo → Upload to API → AI model detects damage →
Generate severity report → Create work order → Notify stakeholders
```

---

## Week 1: Dataset & Model Training

### 1. Dataset Collection
Required: 10,000+ labeled images of vehicle damage

**Sources**:
- Insurance claim databases (partner with insurance company)
- Public datasets:
  - Stanford Cars Dataset
  - Comp Cars Dataset
  - Custom scraping with attribution
- Internal fleet damage photos (start collecting now)

**Damage Categories**:
- Dent
- Scratch
- Crack/Broken glass
- Paint damage
- Tire damage
- Bumper damage
- Mirror damage
- Headlight/taillight damage

**Severity Levels**:
- Minor (< $500)
- Moderate ($500-$2,000)
- Major ($2,000-$5,000)
- Severe (> $5,000)

### 2. Model Training

**YOLOv8 Object Detection**:
```python
from ultralytics import YOLO

# Train YOLOv8 model
model = YOLO('yolov8n.pt')  # Start with nano model

results = model.train(
    data='damage_dataset.yaml',  # Dataset configuration
    epochs=100,
    imgsz=640,
    batch=16,
    device='0',  # GPU
    project='fleet-damage-detection',
    name='yolov8-damage-v1'
)

# Export for mobile
model.export(format='coreml')  # iOS
model.export(format='tflite')  # Android
```

**Dataset YAML** (`damage_dataset.yaml`):
```yaml
path: /path/to/dataset
train: images/train
val: images/val

nc: 8  # number of classes
names: ['dent', 'scratch', 'crack', 'paint-damage',
        'tire-damage', 'bumper-damage', 'mirror-damage', 'light-damage']
```

**ResNet-50 Severity Classifier**:
```python
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# Load pre-trained ResNet50
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Add custom classification head
x = GlobalAveragePooling2D()(base_model.output)
x = Dense(256, activation='relu')(x)
x = Dense(4, activation='softmax')(x)  # 4 severity levels

model = Model(inputs=base_model.input, outputs=x)

# Compile
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train
model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=50,
    callbacks=[early_stopping, model_checkpoint]
)

# Export for mobile
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
```

### 3. Model Deployment

**Azure ML** (Recommended):
```bash
# Create Azure ML workspace
az ml workspace create --name fleet-ai --resource-group fleet-rg

# Deploy model as endpoint
az ml online-endpoint create --name damage-detection
az ml online-deployment create --name production \
  --endpoint damage-detection \
  --model yolov8-damage:1 \
  --instance-type Standard_DS3_v2
```

**AWS SageMaker** (Alternative):
```python
import sagemaker

# Deploy YOLOv8 model
predictor = sagemaker.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large',
    endpoint_name='fleet-damage-detection'
)
```

---

## Week 2: Mobile Integration

### iOS - CoreML Integration

**DamageDetectionModel.swift**:
```swift
import CoreML
import Vision

class DamageDetector: ObservableObject {
    @Published var detections: [DamageDetection] = []

    private var yoloModel: VNCoreMLModel?
    private var severityModel: VNCoreMLModel?

    init() {
        setupModels()
    }

    private func setupModels() {
        do {
            // Load YOLO model
            let yoloMLModel = try YOLOv8Damage(configuration: MLModelConfiguration())
            yoloModel = try VNCoreMLModel(for: yoloMLModel.model)

            // Load severity classifier
            let severityMLModel = try ResNet50Severity(configuration: MLModelConfiguration())
            severityModel = try VNCoreMLModel(for: severityMLModel.model)
        } catch {
            print("Error loading models: \\(error)")
        }
    }

    func detectDamage(in image: UIImage) {
        guard let yoloModel = yoloModel,
              let cgImage = image.cgImage else { return }

        let request = VNCoreMLRequest(model: yoloModel) { [weak self] request, error in
            self?.processDetections(request: request, originalImage: image)
        }

        request.imageCropAndScaleOption = .scaleFill

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try? handler.perform([request])
    }

    private func processDetections(request: VNRequest, originalImage: UIImage) {
        guard let results = request.results as? [VNRecognizedObjectObservation] else { return }

        var newDetections: [DamageDetection] = []

        for result in results where result.confidence > 0.5 {
            // Crop detected area
            let croppedImage = cropImage(originalImage, to: result.boundingBox)

            // Classify severity
            let severity = classifySeverity(croppedImage)

            let detection = DamageDetection(
                type: result.labels.first?.identifier ?? "unknown",
                confidence: result.confidence,
                boundingBox: result.boundingBox,
                severity: severity,
                estimatedCost: estimateCost(for: severity)
            )

            newDetections.append(detection)
        }

        DispatchQueue.main.async {
            self.detections = newDetections
        }
    }

    private func classifySeverity(_ image: UIImage) -> DamageSeverity {
        guard let severityModel = severityModel,
              let cgImage = image.cgImage else { return .minor }

        let request = VNCoreMLRequest(model: severityModel)
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        try? handler.perform([request])

        guard let results = request.results as? [VNClassificationObservation],
              let topResult = results.first else { return .minor }

        return DamageSeverity(rawValue: topResult.identifier) ?? .minor
    }

    private func estimateCost(for severity: DamageSeverity) -> Int {
        switch severity {
        case .minor: return 250
        case .moderate: return 1250
        case .major: return 3500
        case .severe: return 7500
        }
    }
}

struct DamageDetection: Identifiable {
    let id = UUID()
    let type: String
    let confidence: Float
    let boundingBox: CGRect
    let severity: DamageSeverity
    let estimatedCost: Int
}

enum DamageSeverity: String, CaseIterable {
    case minor = "Minor"
    case moderate = "Moderate"
    case major = "Major"
    case severe = "Severe"
}
```

**DamageCaptureView.swift**:
```swift
struct DamageCaptureView: View {
    @StateObject private var detector = DamageDetector()
    @State private var capturedImage: UIImage?
    @State private var showCamera = false

    var body: some View {
        VStack {
            if let image = capturedImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .overlay(DamageOverlay(detections: detector.detections))

                ScrollView {
                    ForEach(detector.detections) { detection in
                        DamageCard(detection: detection)
                    }
                }

                Button("Upload & Create Work Order") {
                    uploadDamageReport()
                }
                .buttonStyle(.borderedProminent)
            } else {
                Button("Capture Damage Photo") {
                    showCamera = true
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .sheet(isPresented: $showCamera) {
            ImagePicker(image: $capturedImage) { image in
                detector.detectDamage(in: image)
            }
        }
    }
}
```

### Android - TensorFlow Lite Integration

**DamageDetector.kt**:
```kotlin
class DamageDetector(context: Context) {
    private val yoloInterpreter: Interpreter
    private val severityInterpreter: Interpreter

    init {
        // Load YOLOv8 model
        val yoloModel = loadModelFile(context, "yolov8_damage.tflite")
        yoloInterpreter = Interpreter(yoloModel)

        // Load severity classifier
        val severityModel = loadModelFile(context, "resnet50_severity.tflite")
        severityInterpreter = Interpreter(severityModel)
    }

    fun detectDamage(bitmap: Bitmap): List<DamageDetection> {
        // Preprocess image
        val inputBuffer = preprocessImage(bitmap)

        // Run YOLO detection
        val detections = mutableListOf<FloatArray>()
        yoloInterpreter.run(inputBuffer, detections)

        // Process detections
        return detections
            .filter { it[4] > 0.5f } // Confidence threshold
            .map { detection ->
                val box = BoundingBox(
                    detection[0], detection[1],
                    detection[2], detection[3]
                )

                // Crop and classify severity
                val croppedBitmap = cropBitmap(bitmap, box)
                val severity = classifySeverity(croppedBitmap)

                DamageDetection(
                    type = getClassName(detection[5].toInt()),
                    confidence = detection[4],
                    boundingBox = box,
                    severity = severity,
                    estimatedCost = estimateCost(severity)
                )
            }
    }

    private fun classifySeverity(bitmap: Bitmap): DamageSeverity {
        val inputBuffer = preprocessImage(bitmap, size = 224)
        val output = Array(1) { FloatArray(4) }

        severityInterpreter.run(inputBuffer, output)

        val maxIndex = output[0].indices.maxByOrNull { output[0][it] } ?: 0
        return DamageSeverity.values()[maxIndex]
    }
}

@Composable
fun DamageCaptureScreen() {
    var capturedImage by remember { mutableStateOf<Bitmap?>(null) }
    var detections by remember { mutableStateOf<List<DamageDetection>>(emptyList()) }
    val detector = remember { DamageDetector(LocalContext.current) }

    Column {
        if (capturedImage != null) {
            Image(
                bitmap = capturedImage!!.asImageBitmap(),
                contentDescription = "Captured damage",
                modifier = Modifier.weight(1f)
            )

            LazyColumn {
                items(detections) { detection ->
                    DamageCard(detection = detection)
                }
            }

            Button(onClick = { uploadDamageReport(detections) }) {
                Text("Upload & Create Work Order")
            }
        } else {
            Button(onClick = { /* Launch camera */ }) {
                Text("Capture Damage Photo")
            }
        }
    }
}
```

---

## Week 3: Backend Integration

**API Endpoint** (`api/src/routes/damage-detection.routes.ts`):
```typescript
router.post(
  '/detect',
  authenticateJWT,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicle_id } = req.body
      const image = req.file

      if (!image) {
        return res.status(400).json({ error: 'Image file required' })
      }

      // Upload to Azure Blob Storage
      const imageUrl = await uploadToBlobStorage(image)

      // Call AI model endpoint
      const detections = await callAIModel(imageUrl)

      // Create damage report
      const report = await pool.query(
        `INSERT INTO damage_reports (vehicle_id, image_url, detections, total_estimated_cost)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [vehicle_id, imageUrl, JSON.stringify(detections), calculateTotalCost(detections)]
      )

      // Auto-create work order for severe damage
      if (hasSevereDamage(detections)) {
        await createWorkOrder(vehicle_id, report.rows[0].id)
      }

      res.json({
        report: report.rows[0],
        detections
      })
    } catch (error: any) {
      console.error('Damage detection error:', error)
      res.status(500).json({ error: error.message })
    }
  }
)
```

---

## Cost Estimation Algorithm

```typescript
function estimateCost(detection: DamageDetection): number {
  const baseCosts = {
    dent: { minor: 200, moderate: 800, major: 2000, severe: 5000 },
    scratch: { minor: 150, moderate: 500, major: 1500, severe: 3000 },
    crack: { minor: 300, moderate: 1000, major: 3000, severe: 8000 },
    'paint-damage': { minor: 250, moderate: 750, major: 2000, severe: 4000 },
    'tire-damage': { minor: 150, moderate: 300, major: 600, severe: 1200 },
    'bumper-damage': { minor: 400, moderate: 1200, major: 2500, severe: 5000 },
    'mirror-damage': { minor: 200, moderate: 400, major: 800, severe: 1500 },
    'light-damage': { minor: 150, moderate: 400, major: 1000, severe: 2500 }
  }

  return baseCosts[detection.type][detection.severity]
}
```

---

## Testing & Validation

### Model Accuracy Targets
- Detection Precision: > 90%
- Detection Recall: > 85%
- Severity Classification Accuracy: > 80%
- False Positive Rate: < 5%

### Test Dataset
- 2,000+ held-out images
- Manual verification by insurance adjusters
- A/B testing against manual inspection

---

## Deployment Checklist

- [ ] Train YOLOv8 detection model
- [ ] Train ResNet-50 severity classifier
- [ ] Export models for iOS (CoreML) and Android (TFLite)
- [ ] Deploy cloud inference endpoint (Azure ML or AWS SageMaker)
- [ ] Integrate models into mobile apps
- [ ] Implement backend API for damage reports
- [ ] Create work order automation rules
- [ ] Set up image storage (Azure Blob / AWS S3)
- [ ] Configure insurance integration
- [ ] Test with real damage photos
- [ ] Train staff on damage capture workflow
- [ ] Monitor model performance and retrain quarterly

---

## ROI Calculation

**Current Process**:
- Manual damage inspection: 30 min per vehicle
- Insurance adjuster review: 1-2 weeks
- Average claim processing cost: $500

**With AI Detection**:
- Automated inspection: 2 minutes
- Instant severity assessment
- Immediate work order creation
- Reduced claim processing cost: $100

**Annual Savings**:
- 200 vehicles × 12 inspections/year = 2,400 inspections
- Time saved: 1,120 hours ($56,000 @ $50/hour)
- Processing cost saved: $960,000
- **Net savings after AI costs: $300,000/year**

---

## Next Steps

1. **Week 1**: Collect dataset, train models
2. **Week 2**: Integrate into mobile apps
3. **Week 3**: Deploy backend, test end-to-end
4. **Week 4**: Pilot with 20 vehicles, gather feedback
5. **Week 5**: Full rollout, monitor performance
