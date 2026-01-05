#!/usr/bin/env python3
"""
Open-Source 3D Model Generator for Fleet Vehicles
Using TripoSR (Stability AI) - State-of-the-art image-to-3D

No API costs, runs locally, production quality
"""

import os
import sys
import torch
import numpy as np
from PIL import Image
import trimesh
import json
from datetime import datetime

print("🚗 Open-Source Fleet 3D Model Generator")
print("=" * 60)
print("Using TripoSR - Stability AI's Image-to-3D Model")
print("No API costs • Runs locally • Production quality")
print("=" * 60)
print()

# Check GPU availability
if torch.cuda.is_available():
    device = "cuda"
    print(f"✅ GPU detected: {torch.cuda.get_device_name(0)}")
else:
    device = "cpu"
    print("⚠️  No GPU detected - using CPU (slower but works)")

print(f"   Device: {device}")
print()

# Install dependencies if needed
def install_dependencies():
    """Install required packages"""
    print("📦 Checking dependencies...")

    packages = [
        "transformers",
        "diffusers",
        "accelerate",
        "trimesh",
        "rembg",
        "pillow",
        "torch",
        "torchvision",
    ]

    import subprocess
    for package in packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            print(f"   Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])

    print("✅ All dependencies installed")
    print()

install_dependencies()

# Import TripoSR
print("🔧 Loading TripoSR model...")
print("   (First run will download ~2GB model - this may take a few minutes)")
print()

from transformers import pipeline

# Load the model
try:
    # Use the TripoSR model from Hugging Face
    pipe = pipeline(
        "image-to-3d",
        model="stabilityai/TripoSR",
        device=device,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32
    )
    print("✅ TripoSR model loaded successfully")
except Exception as e:
    print(f"⚠️  TripoSR not available, falling back to Shap-E...")
    # Fallback to Shap-E (OpenAI)
    from diffusers import ShapEPipeline

    pipe = ShapEPipeline.from_pretrained(
        "openai/shap-e",
        torch_dtype=torch.float16 if device == "cuda" else torch.float32
    )
    pipe = pipe.to(device)
    print("✅ Shap-E model loaded successfully")

print()

def remove_background(image_path):
    """Remove background from image using rembg"""
    print("🎨 Removing background...")
    from rembg import remove

    input_image = Image.open(image_path)
    output_image = remove(input_image)

    return output_image

def generate_3d_model(image_path, output_dir, vehicle_config):
    """Generate 3D model from image"""

    print(f"📸 Input image: {image_path}")
    print(f"📁 Output directory: {output_dir}")
    print()

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Load and preprocess image
    print("⚙️  Step 1/4: Preprocessing image...")

    if os.path.exists(image_path):
        image = Image.open(image_path).convert("RGB")

        # Remove background for better results
        try:
            image = remove_background(image_path)
        except Exception as e:
            print(f"   ⚠️  Background removal failed: {e}")
            print("   Continuing with original image...")
    else:
        print(f"   ⚠️  Image not found, generating from description...")
        # We'll use text-to-image first, then image-to-3D
        from diffusers import StableDiffusionPipeline

        text_pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        text_pipe = text_pipe.to(device)

        prompt = f"""professional automotive photography, 2025 Ford F-150 Lightning electric pickup truck,
        {vehicle_config.get('paintColor', 'blue')} metallic paint, {vehicle_config.get('trim', 'Lariat')} trim,
        {vehicle_config.get('wheels', '20-inch')} wheels, 3/4 front view, studio lighting, white background,
        ultra high detail, 8K, photorealistic"""

        print(f"   Generating image from prompt: {prompt[:100]}...")
        image = text_pipe(prompt, num_inference_steps=50).images[0]

        # Save generated image
        image_save_path = os.path.join(output_dir, "generated_reference.png")
        image.save(image_save_path)
        print(f"   ✅ Reference image saved: {image_save_path}")

    print("   ✅ Image preprocessed")
    print()

    # Generate 3D model
    print("⚙️  Step 2/4: Generating 3D mesh...")
    print("   (This may take 1-3 minutes depending on your hardware)")

    try:
        # Generate with TripoSR
        result = pipe(image)
        mesh = result.mesh

    except Exception as e:
        print(f"   Error with primary model: {e}")
        print("   Trying alternative method...")

        # Alternative: Use Shap-E with text prompt
        from diffusers import ShapEImg2ImgPipeline

        shap_pipe = ShapEImg2ImgPipeline.from_pretrained(
            "openai/shap-e-img2img",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        shap_pipe = shap_pipe.to(device)

        images = shap_pipe(
            image,
            guidance_scale=15.0,
            num_inference_steps=64,
            frame_size=256,
        ).images

        # Convert to mesh
        mesh = images[0]

    print("   ✅ 3D mesh generated")
    print()

    # Export to multiple formats
    print("⚙️  Step 3/4: Exporting to multiple formats...")

    # Save as GLB (recommended for web)
    glb_path = os.path.join(output_dir, "ford_lightning.glb")
    mesh.export(glb_path)
    print(f"   ✅ GLB: {glb_path}")

    # Save as OBJ
    obj_path = os.path.join(output_dir, "ford_lightning.obj")
    mesh.export(obj_path)
    print(f"   ✅ OBJ: {obj_path}")

    # Save as PLY
    ply_path = os.path.join(output_dir, "ford_lightning.ply")
    mesh.export(ply_path)
    print(f"   ✅ PLY: {ply_path}")

    # Save as STL (for 3D printing)
    stl_path = os.path.join(output_dir, "ford_lightning.stl")
    mesh.export(stl_path)
    print(f"   ✅ STL: {stl_path}")

    print()

    # Generate metadata
    print("⚙️  Step 4/4: Saving metadata...")

    metadata = {
        "vehicle": "2025 Ford F-150 Lightning",
        "configuration": vehicle_config,
        "generated_at": datetime.now().isoformat(),
        "model": "TripoSR (Stability AI)" if "TripoSR" in str(type(pipe)) else "Shap-E (OpenAI)",
        "device": device,
        "mesh_stats": {
            "vertices": len(mesh.vertices) if hasattr(mesh, 'vertices') else "N/A",
            "faces": len(mesh.faces) if hasattr(mesh, 'faces') else "N/A",
        },
        "files": {
            "glb": glb_path,
            "obj": obj_path,
            "ply": ply_path,
            "stl": stl_path,
        }
    }

    metadata_path = os.path.join(output_dir, "metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"   ✅ Metadata: {metadata_path}")
    print()

    return metadata

def generate_color_variants(base_mesh_path, colors, output_base_dir):
    """Generate color variants by modifying materials"""
    print("🎨 Generating color variants...")

    mesh = trimesh.load(base_mesh_path)

    color_map = {
        "Antimatter Blue": [30, 58, 95],
        "Avalanche": [248, 248, 248],
        "Iconic Silver": [192, 192, 192],
        "Carbonized Gray": [62, 62, 62],
        "Agate Black": [10, 10, 10],
        "Rapid Red": [196, 30, 58],
        "Atlas Blue": [46, 90, 136],
        "Star White": [255, 255, 255],
    }

    results = {}

    for color_name in colors:
        print(f"   Creating {color_name} variant...")

        # Create color variant
        color_mesh = mesh.copy()

        # Apply color (convert to 0-1 range)
        rgb = color_map.get(color_name, [128, 128, 128])
        color_mesh.visual.vertex_colors = [rgb[0]/255, rgb[1]/255, rgb[2]/255, 1.0]

        # Save
        output_dir = os.path.join(output_base_dir, color_name.replace(" ", "_"))
        os.makedirs(output_dir, exist_ok=True)

        glb_path = os.path.join(output_dir, f"ford_lightning_{color_name.replace(' ', '_')}.glb")
        color_mesh.export(glb_path)

        results[color_name] = glb_path
        print(f"   ✅ {glb_path}")

    print()
    return results

# Main execution
if __name__ == "__main__":
    print("🚀 Starting 3D Model Generation")
    print()

    # Configuration
    vehicle_config = {
        "paintColor": "Antimatter Blue",
        "trim": "Lariat",
        "wheels": "20-inch",
        "features": {
            "bedLiner": True,
            "tonneau_cover": True,
            "running_boards": True,
            "bed_lights": True,
        }
    }

    # Check if reference image exists
    reference_image = "./reference_images/ford_lightning_front.jpg"

    if not os.path.exists(reference_image):
        print(f"⚠️  Reference image not found: {reference_image}")
        print("   Generating from text description instead...")
        reference_image = None

    # Generate base model
    output_dir = "./output/opensource_lightning"

    print("=" * 60)
    metadata = generate_3d_model(reference_image, output_dir, vehicle_config)
    print("=" * 60)
    print()

    # Print results
    print("✅ 3D MODEL GENERATION COMPLETE!")
    print()
    print("📊 Model Statistics:")
    print(f"   Model: {metadata['model']}")
    print(f"   Device: {metadata['device']}")
    print(f"   Vertices: {metadata['mesh_stats']['vertices']}")
    print(f"   Faces: {metadata['mesh_stats']['faces']}")
    print()

    print("📁 Generated Files:")
    for format_name, file_path in metadata['files'].items():
        file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
        print(f"   {format_name.upper()}: {file_path} ({file_size:.2f} MB)")
    print()

    print("🎨 Optional: Generate Color Variants")
    generate_variants = input("Generate all 8 color variants? (y/n): ").strip().lower()

    if generate_variants == 'y':
        colors = [
            "Antimatter Blue", "Avalanche", "Iconic Silver", "Carbonized Gray",
            "Agate Black", "Rapid Red", "Atlas Blue", "Star White"
        ]

        color_results = generate_color_variants(
            metadata['files']['glb'],
            colors,
            "./output/opensource_lightning_colors"
        )

        print("✅ All color variants generated!")
        print()

    print("🎉 SUCCESS!")
    print()
    print("📖 Next Steps:")
    print("   1. View GLB files: https://gltf-viewer.donmccurdy.com/")
    print(f"   2. Open in Blender: File → Import → glTF 2.0 → {metadata['files']['glb']}")
    print("   3. Use in Three.js/React Three Fiber")
    print("   4. Import into Unity/Unreal")
    print()
    print("💡 Tips:")
    print("   • Use higher quality reference images for better results")
    print("   • GPU accelerates generation 10-20x faster")
    print("   • Models can be refined in Blender or similar tools")
    print()
