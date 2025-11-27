# Car3D.net Integration Guide

This guide explains how to purchase and upload 3D vehicle models from [car3d.net](https://car3d.net/) to the Fleet Management System.

## Overview

Car3D.net provides professional, high-quality 3D vehicle models optimized for commercial use. These models can be purchased and uploaded to your fleet management system for enhanced visualization.

## Prerequisites

- Access to Fleet Management System admin panel
- Car3D.net account (for purchasing models)
- Azure Blob Storage configured (automatic in production)

## Supported File Formats

The system supports the following 3D model formats:

1. **GLB** (Recommended) - Binary glTF, single file, best for web
2. **GLTF** - Text-based glTF with external assets
3. **FBX** - Autodesk format (will be converted to GLB)
4. **OBJ** - Wavefront format (with MTL materials)
5. **USDZ** - Apple AR format (iOS AR Quick Look)

## Purchasing Models from Car3D.net

### Step 1: Find Your Vehicle Model

1. Visit https://car3d.net/
2. Use the search bar to find your specific vehicle (e.g., "Ford F-150 2024")
3. Browse the available models and select the one that matches your fleet

### Step 2: Choose the Right Format

When purchasing, select one of these formats:

- **GLB** (Best Choice): Single file, optimized for web, ~5-20MB
- **GLTF**: Multiple files, good if you need to edit textures
- **FBX**: If you plan to edit in Blender/Maya first

💡 **Recommendation**: Always choose **GLB** format for direct upload to the fleet system.

### Step 3: Download Quality Considerations

Car3D.net offers different quality tiers:

| Quality | Poly Count | File Size | Use Case |
|---------|-----------|-----------|----------|
| **Low** | 10k-50k | 2-5MB | Mobile, large fleets |
| **Medium** | 50k-150k | 5-15MB | Desktop, standard use (Recommended) |
| **High** | 150k-500k | 15-50MB | Marketing, presentations |
| **Ultra** | 500k+ | 50MB+ | Studio renders only |

💡 **Recommendation**: Use **Medium** quality for optimal performance and visual quality.

## Uploading Models to Fleet Management System

### Method 1: Web Interface (Recommended)

1. **Navigate to Model Library**
   ```
   Fleet Management → Settings → 3D Model Library
   ```

2. **Click "Upload Model"**

3. **Fill in Model Details**:
   - **File**: Select your downloaded GLB file
   - **Name**: e.g., "Ford F-150 2024 XLT"
   - **Description**: Optional details
   - **Vehicle Type**: Select from dropdown (Truck, SUV, Sedan, etc.)
   - **Make**: Ford
   - **Model**: F-150
   - **Year**: 2024
   - **License**: Commercial (for car3d.net models)
   - **Quality**: Medium (or as appropriate)
   - **Tags**: Add searchable tags (e.g., "pickup", "commercial", "ford")

4. **Click "Upload"**
   - Upload progress will be shown
   - Large files may take several minutes
   - Model will be automatically uploaded to Azure Blob Storage

5. **Verify Upload**
   - Model should appear in the library
   - Click to preview the 3D viewer
   - Test AR view on mobile devices

### Method 2: API Upload (Advanced)

```bash
curl -X POST https://fleet.capitaltechalliance.com/api/v1/models/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "model=@path/to/model.glb" \
  -F "name=Ford F-150 2024" \
  -F "vehicleType=truck" \
  -F "make=Ford" \
  -F "model=F-150" \
  -F "year=2024" \
  -F "license=Commercial" \
  -F "quality=medium" \
  -F "tags=pickup,commercial,ford"
```

## Optimization Best Practices

### Before Uploading

1. **File Size Check**
   - Keep models under 50MB for web performance
   - Compress textures if needed (use 2K max resolution)

2. **Model Validation**
   - Test the model in a GLB viewer (e.g., https://gltf-viewer.donmccurdy.com/)
   - Ensure textures and materials load correctly
   - Check that the model is properly oriented (front facing +Z)

3. **Texture Optimization**
   - Use compressed formats (JPEG for color, PNG for transparency)
   - Resize textures to power-of-2 dimensions (512, 1024, 2048)
   - Combine multiple textures into texture atlases when possible

### Post-Upload Optimization

The system automatically:
- Generates CDN URLs for fast loading
- Compresses files if needed
- Creates thumbnail previews
- Enables browser caching (1 year)

## Assigning Models to Vehicles

### Method 1: From Vehicle Details Page

1. Navigate to a vehicle (e.g., Vehicle #1234)
2. Click "3D View" tab
3. Click "Assign 3D Model"
4. Search and select the model
5. Click "Save"

### Method 2: Bulk Assignment

For multiple vehicles of the same make/model:

1. Go to Fleet → Vehicles
2. Filter by Make/Model (e.g., Ford F-150)
3. Select multiple vehicles (checkbox)
4. Click "Bulk Actions" → "Assign 3D Model"
5. Select the model
6. Click "Apply to Selected"

## AR (Augmented Reality) Features

Models uploaded from car3d.net support AR viewing:

### iOS (AR Quick Look)

- System automatically generates USDZ format
- Users can tap "View in AR" on iPhone/iPad
- Model appears in real-world space

### Android (Scene Viewer)

- Uses GLB format directly
- Tap "View in AR" on Android devices
- Google ARCore required

## Troubleshooting

### Model Doesn't Load

**Issue**: Black screen or error in 3D viewer

**Solutions**:
1. Check file format is GLB (not GLTF with external files)
2. Verify file size is under 100MB upload limit
3. Re-export from car3d.net as GLB
4. Test file in https://gltf-viewer.donmccurdy.com/

### Model Too Large

**Issue**: Slow loading or timeout

**Solutions**:
1. Use lower quality version from car3d.net
2. Compress textures to 1K or 2K resolution
3. Use Blender to decimate geometry:
   ```
   Blender → Import GLB → Modifiers → Decimate → Ratio: 0.5
   ```

### Textures Missing

**Issue**: Model appears gray or untextured

**Solutions**:
1. Ensure you downloaded the complete package from car3d.net
2. Use GLB format (embeds textures)
3. If using GLTF, upload texture files separately

### Wrong Orientation

**Issue**: Model facing wrong direction

**Solutions**:
1. Rotate in Blender before export
2. Contact car3d.net support for correct orientation
3. System displays models with +Z as front by default

## License Compliance

### Car3D.net Commercial License

Models purchased from car3d.net include:
- ✅ Commercial use permitted
- ✅ Unlimited renders
- ✅ Multiple users within organization
- ❌ Cannot redistribute models
- ❌ Cannot resell models

### Attribution

While car3d.net doesn't require attribution, we recommend:
- Adding model author in "Description" field
- Including purchase date in metadata
- Keeping license documentation

## Cost Optimization

### Model Reuse

1. **Create Collections**: Group similar vehicles
2. **Share Models**: One model can be assigned to multiple vehicles
3. **Generic Models**: Use generic models for common fleet vehicles

### Storage Costs

Azure Blob Storage costs approximately:
- **Storage**: $0.18/GB/month (Hot tier)
- **Bandwidth**: $0.087/GB (outbound)
- **Transactions**: Minimal (cached)

**Example Monthly Cost**:
- 50 models @ 15MB each = 750MB
- Monthly cost: ~$0.14 + bandwidth
- CDN caching reduces bandwidth costs significantly

## Advanced Features

### Damage Mapping

Models can be used for damage visualization:

1. Upload model to library
2. Assign to vehicle
3. On damage report, mark location on 3D model
4. System saves damage markers with coordinates

### Custom Paintwork

System supports real-time paint color changes:

```typescript
// In 3D viewer
customization: {
  exteriorColor: '#FF0000', // Red
  interiorColor: '#000000', // Black
}
```

### Level of Detail (LOD)

Upload multiple quality versions:

1. Ultra: For desktop, stationary viewing
2. High: For desktop, rotating/panning
3. Medium: For mobile devices
4. Low: For fleet overview maps

System automatically selects based on device.

## Support

### Car3D.net Support
- Website: https://car3d.net/support
- Email: support@car3d.net
- Response time: 24-48 hours

### Fleet Management Support
- Documentation: See `/docs` folder
- API Reference: `/docs/API.md`
- GitHub Issues: Create ticket with "3D Models" label

## Additional Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [glTF Specification](https://www.khronos.org/gltf/)
- [Blender glTF Export Guide](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
- [Azure Blob Storage Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)

## Changelog

- **2025-11-27**: Initial documentation created
- **Future**: Plan to add batch upload tool, model converter UI

---

**Questions?** Open an issue on GitHub or contact the development team.
