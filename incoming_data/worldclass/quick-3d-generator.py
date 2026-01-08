#!/usr/bin/env python3
"""
FAST Open-Source 3D Generator - Using Shap-E (OpenAI)
Generates photo-realistic 3D models in minutes, completely free
"""

import torch
from diffusers import ShapEPipeline
from diffusers.utils import export_to_ply, export_to_obj
import os
from datetime import datetime
import json

print("⚡ FAST 3D Model Generator")
print("=" * 60)
print("Using Shap-E (OpenAI) - Open Source, Runs Locally, Free")
print("=" * 60)
print()

# Check GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {device}")
if device == "cuda":
    print(f"GPU: {torch.cuda.get_device_name(0)}")
print()

# Configuration
vehicle_config = {
    "paintColor": "Antimatter Blue",
    "trim": "Lariat",
    "wheels": "20-inch",
}

# Generate detailed prompt
prompt = f"""professional automotive photography of a 2025 Ford F-150 Lightning electric pickup truck,
{vehicle_config['paintColor']} metallic automotive paint with premium gloss finish,
{vehicle_config['trim']} luxury trim with LED lighting and chrome accents,
{vehicle_config['wheels']} polished aluminum wheels,
distinctive LED light bar across front grille, sleek aerodynamic body,
crew cab configuration, modern electric truck design, Lightning badging,
studio lighting, white background, ultra high detail, photorealistic, 8K quality,
3/4 front view angle"""

print("📋 Vehicle Configuration:")
for key, value in vehicle_config.items():
    print(f"   {key}: {value}")
print()

print("🔧 Loading Shap-E model...")
print("   (First run downloads ~3GB model)")

# Load model
pipe = ShapEPipeline.from_pretrained(
    "openai/shap-e",
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    variant="fp16" if device == "cuda" else None
)
pipe = pipe.to(device)

print("✅ Model loaded")
print()

# Generate
print("🚀 Generating 3D model...")
print(f"   Prompt: {prompt[:100]}...")
print("   This will take 2-5 minutes...")
print()

start_time = datetime.now()

# Generate with high quality settings
images = pipe(
    prompt,
    guidance_scale=15.0,      # Higher = more faithful to prompt
    num_inference_steps=64,   # More steps = better quality
    frame_size=256,           # Output resolution
).images

end_time = datetime.now()
duration = (end_time - start_time).total_seconds()

print(f"✅ Generation complete in {duration:.1f} seconds ({duration/60:.1f} minutes)")
print()

# Create output directory
output_dir = "./output/shap_e_lightning"
os.makedirs(output_dir, exist_ok=True)

print("💾 Exporting to multiple formats...")

# Export to PLY (point cloud format)
ply_path = os.path.join(output_dir, "ford_lightning.ply")
export_to_ply(images[0], ply_path)
print(f"   ✅ PLY: {ply_path}")

# Export to OBJ (mesh format)
obj_path = os.path.join(output_dir, "ford_lightning.obj")
export_to_obj(images[0], obj_path)
print(f"   ✅ OBJ: {obj_path}")

# Save metadata
metadata = {
    "vehicle": "2025 Ford F-150 Lightning",
    "configuration": vehicle_config,
    "prompt": prompt,
    "generated_at": start_time.isoformat(),
    "duration_seconds": duration,
    "model": "Shap-E (OpenAI)",
    "device": device,
    "settings": {
        "guidance_scale": 15.0,
        "num_inference_steps": 64,
        "frame_size": 256
    },
    "files": {
        "ply": ply_path,
        "obj": obj_path,
    }
}

metadata_path = os.path.join(output_dir, "metadata.json")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"   ✅ Metadata: {metadata_path}")
print()

# Print file sizes
print("📊 Generated Files:")
for name, path in metadata['files'].items():
    size_mb = os.path.getsize(path) / (1024 * 1024)
    print(f"   {name.upper()}: {size_mb:.2f} MB - {path}")
print()

print("=" * 60)
print("🎉 SUCCESS! 3D Model Generated")
print("=" * 60)
print()
print("📖 Next Steps:")
print()
print("1. View the model:")
print("   • OBJ viewer: https://3dviewer.net/")
print("   • Blender: File → Import → Wavefront (.obj)")
print("   • MeshLab: Free tool for viewing/editing")
print()
print("2. Convert to other formats:")
print("   • Use Blender to export as GLB, FBX, USDZ")
print("   • Blender script provided below")
print()
print("3. Refine the model:")
print("   • Import into Blender for manual refinement")
print("   • Add more detailed textures")
print("   • Optimize polygon count")
print()

# Create Blender conversion script
blender_script = """
# Blender Python Script - Run in Blender's Scripting tab
import bpy

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import OBJ
bpy.ops.import_scene.obj(filepath='OUTPUT_PATH/ford_lightning.obj')

# Export as GLB (recommended for web)
bpy.ops.export_scene.gltf(
    filepath='OUTPUT_PATH/ford_lightning.glb',
    export_format='GLB',
    export_apply=True
)

# Export as FBX (for Unity/Unreal)
bpy.ops.export_scene.fbx(
    filepath='OUTPUT_PATH/ford_lightning.fbx',
    use_selection=False
)

print("✅ Converted to GLB and FBX!")
"""

blender_script_path = os.path.join(output_dir, "convert_to_glb.py")
with open(blender_script_path, 'w') as f:
    f.write(blender_script.replace('OUTPUT_PATH', os.path.abspath(output_dir)))

print(f"💡 Blender conversion script saved: {blender_script_path}")
print("   Run in Blender: Alt+P in Scripting tab")
print()

print("🔧 Quick Blender Conversion Command:")
print(f"   blender --background --python {blender_script_path}")
print()

print("✨ Tips for Better Results:")
print("   • More detailed prompts = better models")
print("   • Use reference images if available")
print("   • GPU speeds up generation 10-20x")
print("   • Refine in Blender for production quality")
print()
