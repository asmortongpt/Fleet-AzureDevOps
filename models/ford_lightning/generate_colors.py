import bpy
import json
import os

# Colors for 2025 Ford F-150 Lightning
colors = {
    "Antimatter_Blue": (0.118, 0.227, 0.373, 1.0),
    "Avalanche": (0.973, 0.973, 0.973, 1.0),
    "Iconic_Silver": (0.753, 0.753, 0.753, 1.0),
    "Carbonized_Gray": (0.243, 0.243, 0.243, 1.0),
    "Agate_Black": (0.039, 0.039, 0.039, 1.0),
    "Rapid_Red": (0.769, 0.118, 0.227, 1.0),
    "Atlas_Blue": (0.180, 0.353, 0.533, 1.0),
    "Star_White": (1.0, 1.0, 1.0, 1.0),
}

# Check if base model exists
if not os.path.exists('ford_lightning_base.glb'):
    print("❌ Error: ford_lightning_base.glb not found!")
    print("Please download the base model first")
    exit(1)

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import base model
bpy.ops.import_scene.gltf(filepath='ford_lightning_base.glb')

# Get the truck object
truck = bpy.context.selected_objects[0]

# Ensure it has a material
if not truck.data.materials:
    mat = bpy.data.materials.new(name="TruckPaint")
    mat.use_nodes = True
    truck.data.materials.append(mat)

base_mat = truck.data.materials[0]

# Generate each color variant
results = {}

for color_name, rgba in colors.items():
    print(f"Generating {color_name}...")

    # Update material color
    if base_mat.use_nodes:
        bsdf = base_mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = rgba
            bsdf.inputs['Metallic'].default_value = 0.8
            bsdf.inputs['Roughness'].default_value = 0.2

    # Export
    output_path = f'../../output/instant_models/ford_lightning_{color_name}.glb'
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB'
    )

    results[color_name] = output_path
    print(f"   ✅ {output_path}")

# Save metadata
metadata = {
    "vehicle": "2025 Ford F-150 Lightning",
    "generated_at": "2025-01-04",
    "colors": list(colors.keys()),
    "files": results,
    "format": "GLB",
    "source": "Instant 3D Solution"
}

with open('../../output/instant_models/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ Generated {len(colors)} color variants!")
print(f"📁 Output: {os.path.abspath('../../output/instant_models/')}")
