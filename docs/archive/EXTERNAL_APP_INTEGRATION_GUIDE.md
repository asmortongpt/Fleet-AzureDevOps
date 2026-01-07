# 🔗 EXTERNAL APP INTEGRATION GUIDE
## Update 3D Fleet Models from Images, Videos, and LiDAR

---

## 📋 **OVERVIEW**

Your external application (mobile app, web app, desktop app) can now update 3D vehicle models in real-time using:

- **📸 Images:** Photos of actual vehicles from any camera
- **🎥 Videos:** Walkaround videos, damage documentation
- **📡 LiDAR:** Point cloud scans for accurate geometry

---

## 🚀 **QUICK START**

### **1. API Endpoints**

**Base URL:** `http://fleet.capitaltechalliance.com/api/3d-models`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/update/image` | POST | Apply image textures to model |
| `/update/video` | POST | Extract textures from video |
| `/update/lidar` | POST | Refine geometry with LiDAR |
| `/:vehicleId/history` | GET | View update history |

---

## 📸 **UPDATE FROM IMAGES**

### **API Request:**

```bash
curl -X POST http://fleet.capitaltechalliance.com/api/3d-models/update/image \
  -F "vehicleId=123" \
  -F "textureType=diffuse" \
  -F "images=@truck_front.jpg" \
  -F "images=@truck_side.jpg" \
  -F "images=@truck_damage.jpg"
```

### **Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | number | ✅ | Vehicle ID from database |
| `images` | file[] | ✅ | 1-10 JPG/PNG images |
| `textureType` | string | ❌ | `diffuse`, `normal`, `roughness`, `damage` (default: `diffuse`) |
| `applyDamage` | boolean | ❌ | Apply images as damage overlay |

### **Response:**

```json
{
  "success": true,
  "message": "Model updated successfully",
  "modelPath": "/output/updated_models/vehicle_123_1735948800.glb",
  "imagesProcessed": 3
}
```

### **Example: Mobile App (React Native)**

```typescript
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

async function updateVehicleModel(vehicleId: number) {
  // Pick images from gallery
  const images = await DocumentPicker.pickMultiple({
    type: [DocumentPicker.types.images],
  });

  // Create form data
  const formData = new FormData();
  formData.append('vehicleId', vehicleId);
  formData.append('textureType', 'diffuse');

  images.forEach((image, index) => {
    formData.append('images', {
      uri: image.uri,
      type: image.type,
      name: image.name,
    });
  });

  // Upload
  const response = await fetch(
    'http://fleet.capitaltechalliance.com/api/3d-models/update/image',
    {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  const result = await response.json();
  console.log('✅ Model updated:', result.modelPath);

  return result;
}
```

### **Example: Web App (JavaScript)**

```javascript
async function uploadVehiclePhotos(vehicleId, files) {
  const formData = new FormData();
  formData.append('vehicleId', vehicleId);
  formData.append('textureType', 'diffuse');

  // Add selected files
  for (const file of files) {
    formData.append('images', file);
  }

  const response = await fetch('/api/3d-models/update/image', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

// Usage in HTML
<input type="file" multiple accept="image/*" id="vehiclePhotos" />
<button onclick="handleUpload()">Update 3D Model</button>

<script>
async function handleUpload() {
  const input = document.getElementById('vehiclePhotos');
  const files = Array.from(input.files);

  const result = await uploadVehiclePhotos(123, files);
  alert('Model updated: ' + result.modelPath);
}
</script>
```

---

## 🎥 **UPDATE FROM VIDEO**

### **API Request:**

```bash
curl -X POST http://fleet.capitaltechalliance.com/api/3d-models/update/video \
  -F "vehicleId=123" \
  -F "frameInterval=30" \
  -F "useFrames=0,10,20,30" \
  -F "video=@vehicle_walkaround.mp4"
```

### **Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | number | ✅ | Vehicle ID |
| `video` | file | ✅ | MP4/MOV/AVI video file (max 500MB) |
| `frameInterval` | number | ❌ | Extract every N frames (default: 30) |
| `useFrames` | string | ❌ | Comma-separated frame indices to use (default: "0,1,2,3") |

### **Response:**

```json
{
  "success": true,
  "message": "Model updated from video successfully",
  "modelPath": "/output/updated_models/vehicle_123_video_1735948900.glb",
  "videoProcessed": "vehicle_walkaround.mp4"
}
```

### **Example: Mobile App (React Native)**

```typescript
import { launchCamera } from 'react-native-image-picker';

async function recordVehicleWalkaround(vehicleId: number) {
  // Record video
  const result = await launchCamera({
    mediaType: 'video',
    videoQuality: 'high',
    durationLimit: 60, // 60 seconds max
  });

  if (result.assets && result.assets[0]) {
    const video = result.assets[0];

    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('frameInterval', 30);
    formData.append('useFrames', '0,10,20,30');
    formData.append('video', {
      uri: video.uri,
      type: video.type,
      name: video.fileName,
    });

    const response = await fetch(
      'http://fleet.capitaltechalliance.com/api/3d-models/update/video',
      {
        method: 'POST',
        body: formData,
      }
    );

    return await response.json();
  }
}
```

---

## 📡 **UPDATE FROM LIDAR**

### **API Request:**

```bash
curl -X POST http://fleet.capitaltechalliance.com/api/3d-models/update/lidar \
  -F "vehicleId=123" \
  -F "refinementMethod=shrinkwrap" \
  -F "lidar=@vehicle_scan.ply"
```

### **Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | number | ✅ | Vehicle ID |
| `lidar` | file | ✅ | PLY/LAS/XYZ/PCD point cloud file |
| `refinementMethod` | string | ❌ | `shrinkwrap`, `remesh`, `displace` (default: `shrinkwrap`) |

### **Refinement Methods:**

- **`shrinkwrap`:** Conform model surface to point cloud (best for scanned vehicles)
- **`remesh`:** Rebuild geometry from scratch (for heavily damaged vehicles)
- **`displace`:** Push/pull vertices to match scan (subtle adjustments)

### **Response:**

```json
{
  "success": true,
  "message": "Model refined with LiDAR data successfully",
  "modelPath": "/output/updated_models/vehicle_123_lidar_1735949000.glb",
  "lidarFile": "vehicle_scan.ply",
  "refinementMethod": "shrinkwrap"
}
```

### **Example: LiDAR Scanner Integration**

```python
# Python example for LiDAR scanner apps
import requests

def upload_lidar_scan(vehicle_id, scan_file_path):
    url = "http://fleet.capitaltechalliance.com/api/3d-models/update/lidar"

    files = {
        'lidar': open(scan_file_path, 'rb')
    }

    data = {
        'vehicleId': vehicle_id,
        'refinementMethod': 'shrinkwrap'
    }

    response = requests.post(url, files=files, data=data)
    return response.json()

# Usage
result = upload_lidar_scan(123, '/path/to/vehicle_scan.ply')
print(f"✅ Model refined: {result['modelPath']}")
```

---

## 📊 **VIEW UPDATE HISTORY**

### **API Request:**

```bash
curl -X GET http://fleet.capitaltechalliance.com/api/3d-models/123/history
```

### **Response:**

```json
{
  "vehicleId": "123",
  "history": [
    {
      "id": 45,
      "model_path": "/output/updated_models/vehicle_123_lidar_1735949000.glb",
      "texture_source": null,
      "geometry_source": "lidar_scan",
      "refinement_method": "shrinkwrap",
      "is_current": true,
      "created_at": "2025-01-04T20:00:00Z"
    },
    {
      "id": 44,
      "model_path": "/output/updated_models/vehicle_123_video_1735948900.glb",
      "texture_source": "uploaded_video",
      "texture_type": "video_extracted",
      "is_current": false,
      "created_at": "2025-01-04T19:45:00Z"
    },
    {
      "id": 43,
      "model_path": "/output/updated_models/vehicle_123_1735948800.glb",
      "texture_source": "uploaded_images",
      "texture_type": "diffuse",
      "is_current": false,
      "created_at": "2025-01-04T19:30:00Z"
    }
  ]
}
```

---

## 🔧 **WORKFLOW EXAMPLES**

### **Scenario 1: Damage Documentation**

**Mobile App Workflow:**
1. Driver discovers vehicle damage
2. Takes 3-5 photos of damage
3. App uploads photos to `/update/image` with `textureType=damage`
4. 3D model automatically shows damage
5. Office sees updated model in fleet management system

### **Scenario 2: New Vehicle Onboarding**

**Workflow:**
1. Vehicle arrives at facility
2. Inspector records 360° video walkaround
3. App uploads video to `/update/video`
4. System extracts frames and creates composite texture
5. 3D model now shows actual vehicle appearance

### **Scenario 3: Accurate Post-Accident Scan**

**Workflow:**
1. Use LiDAR scanner to capture vehicle post-accident
2. Export point cloud as PLY file
3. Upload to `/update/lidar` with `refinementMethod=shrinkwrap`
4. 3D model geometry conforms to actual damage
5. Insurance adjuster views accurate 3D model

---

## 🏗️ **DATABASE SCHEMA**

The API automatically tracks all updates in the database:

```sql
CREATE TABLE vehicle_3d_models (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  model_path TEXT NOT NULL,

  -- Texture updates
  texture_source VARCHAR(50),  -- 'uploaded_images', 'uploaded_video', etc.
  texture_type VARCHAR(50),    -- 'diffuse', 'normal', 'damage', etc.

  -- Geometry updates
  geometry_source VARCHAR(50), -- 'lidar_scan', 'photogrammetry', etc.
  refinement_method VARCHAR(50), -- 'shrinkwrap', 'remesh', 'displace'

  -- Version control
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);
```

---

## 📱 **SUPPORTED FILE FORMATS**

### **Images:**
- JPG/JPEG
- PNG
- Max size: 10 images per request
- Recommended: 1920x1080 or higher

### **Videos:**
- MP4 (recommended)
- MOV
- AVI
- Max size: 500MB
- Recommended: 1080p, 30-60 FPS

### **LiDAR:**
- PLY (Point Cloud Library)
- LAS (LiDAR Data Exchange)
- XYZ (Text-based point cloud)
- PCD (Point Cloud Data)
- Max size: 500MB

---

## ⚡ **PERFORMANCE**

| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Image texture update | 5-15 sec | Depends on image count/size |
| Video frame extraction | 30-60 sec | Depends on video length |
| LiDAR refinement | 60-120 sec | Depends on point count |

---

## 🔐 **AUTHENTICATION**

All API requests require authentication:

```javascript
fetch('/api/3d-models/update/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
  },
  body: formData,
});
```

---

## ✅ **COMPLETE INTEGRATION EXAMPLE**

### **React Native Mobile App:**

```typescript
import React, { useState } from 'react';
import { View, Button, Image, Text } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const VehicleModelUpdater = ({ vehicleId }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectImages = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 10,
      quality: 1,
    });

    if (result.assets) {
      setSelectedImages(result.assets);
    }
  };

  const uploadAndUpdate = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    formData.append('textureType', 'diffuse');

    selectedImages.forEach((image) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type,
        name: image.fileName,
      });
    });

    try {
      const response = await fetch(
        'http://fleet.capitaltechalliance.com/api/3d-models/update/image',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        }
      );

      const data = await response.json();
      setResult(data);
      alert('✅ 3D Model Updated!');
    } catch (error) {
      alert('❌ Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Select Photos" onPress={selectImages} />
      <Text>{selectedImages.length} photos selected</Text>

      {selectedImages.map((img, i) => (
        <Image key={i} source={{ uri: img.uri }} style={{ width: 100, height: 100 }} />
      ))}

      <Button
        title={loading ? "Updating..." : "Update 3D Model"}
        onPress={uploadAndUpdate}
        disabled={selectedImages.length === 0 || loading}
      />

      {result && (
        <Text>✅ Updated: {result.modelPath}</Text>
      )}
    </View>
  );
};

export default VehicleModelUpdater;
```

---

## 🎯 **SUMMARY**

**Your external application can now:**

✅ Upload photos → Apply as textures
✅ Upload videos → Extract frames → Create textures
✅ Upload LiDAR scans → Refine geometry
✅ View update history
✅ Automatic version control
✅ Real-time 3D model updates

**The system handles:**
- File upload and validation
- Blender processing in background
- Database updates
- Model versioning
- Texture mapping
- Geometry refinement

**All you need to do is:**
1. Send files via REST API
2. Receive updated model path
3. Display in your 3D viewer

---

**Ready to integrate! 🚀**
