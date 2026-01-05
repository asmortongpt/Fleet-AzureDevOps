#!/usr/bin/env python3
"""
Generate Complete Fleet Vehicle Collection
Creates 3D models for all common fleet vehicle types
"""

import bpy
import bmesh
import math
import json
import os
from pathlib import Path

print("🚛 Fleet Vehicle Generator")
print("=" * 70)
print("Generating 3D models for common fleet vehicles")
print("=" * 70)
print()

# Create output directory
output_dir = Path("./output/fleet_vehicles")
output_dir.mkdir(parents=True, exist_ok=True)

# Define fleet vehicle types
fleet_vehicles = {
    "Ford_F150_Lightning": {
        "type": "Pickup Truck",
        "dimensions": {"length": 5.9, "width": 2.0, "height": 2.0},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.7,
        "colors": ["Antimatter Blue", "Oxford White", "Rapid Red"]
    },
    "Ford_Transit_Van": {
        "type": "Cargo Van",
        "dimensions": {"length": 6.0, "width": 2.0, "height": 2.8},
        "cab_ratio": 0.25,
        "cargo_ratio": 0.75,
        "wheel_base": 3.5,
        "colors": ["Oxford White", "Agate Black", "Iconic Silver"]
    },
    "Ford_Explorer": {
        "type": "SUV",
        "dimensions": {"length": 5.0, "width": 2.0, "height": 1.8},
        "cab_ratio": 1.0,
        "wheel_base": 3.0,
        "colors": ["Carbonized Gray", "Atlas Blue", "Star White"]
    },
    "Ford_Escape": {
        "type": "Compact SUV",
        "dimensions": {"length": 4.6, "width": 1.9, "height": 1.7},
        "cab_ratio": 1.0,
        "wheel_base": 2.7,
        "colors": ["Rapid Red", "Iconic Silver", "Agate Black"]
    },
    "Ford_Fusion": {
        "type": "Sedan",
        "dimensions": {"length": 4.9, "width": 1.9, "height": 1.5},
        "cab_ratio": 1.0,
        "wheel_base": 2.9,
        "colors": ["Oxford White", "Carbonized Gray", "Atlas Blue"]
    },
    "Chevrolet_Silverado": {
        "type": "Heavy Duty Pickup",
        "dimensions": {"length": 6.3, "width": 2.1, "height": 2.0},
        "cab_ratio": 0.35,
        "bed_ratio": 0.65,
        "wheel_base": 4.0,
        "colors": ["Summit White", "Black", "Silver Ice Metallic"]
    },
    "Ram_ProMaster": {
        "type": "Commercial Van",
        "dimensions": {"length": 6.4, "width": 2.0, "height": 2.9},
        "cab_ratio": 0.2,
        "cargo_ratio": 0.8,
        "wheel_base": 3.9,
        "colors": ["Bright White", "Black", "Broom Yellow"]
    },
    "Toyota_Tacoma": {
        "type": "Midsize Pickup",
        "dimensions": {"length": 5.4, "width": 1.9, "height": 1.8},
        "cab_ratio": 0.45,
        "bed_ratio": 0.55,
        "wheel_base": 3.3,
        "colors": ["Super White", "Midnight Black", "Barcelona Red"]
    },
}

# Color definitions
color_palette = {
    # Ford colors
    "Antimatter Blue": (0.118, 0.227, 0.373, 1.0),
    "Oxford White": (0.95, 0.95, 0.95, 1.0),
    "Rapid Red": (0.769, 0.118, 0.227, 1.0),
    "Agate Black": (0.039, 0.039, 0.039, 1.0),
    "Iconic Silver": (0.753, 0.753, 0.753, 1.0),
    "Carbonized Gray": (0.243, 0.243, 0.243, 1.0),
    "Atlas Blue": (0.180, 0.353, 0.533, 1.0),
    "Star White": (1.0, 1.0, 1.0, 1.0),
    "Avalanche": (0.973, 0.973, 0.973, 1.0),

    # Chevrolet colors
    "Summit White": (0.98, 0.98, 0.98, 1.0),
    "Black": (0.02, 0.02, 0.02, 1.0),
    "Silver Ice Metallic": (0.7, 0.72, 0.75, 1.0),

    # Ram colors
    "Bright White": (1.0, 1.0, 1.0, 1.0),
    "Broom Yellow": (0.95, 0.85, 0.1, 1.0),

    # Toyota colors
    "Super White": (0.99, 0.99, 0.99, 1.0),
    "Midnight Black": (0.05, 0.05, 0.05, 1.0),
    "Barcelona Red": (0.8, 0.1, 0.1, 1.0),
}

def clear_scene():
    """Clear all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_vehicle(name, specs):
    """Create a vehicle model based on specifications"""

    clear_scene()

    length = specs["dimensions"]["length"]
    width = specs["dimensions"]["width"]
    height = specs["dimensions"]["height"]

    if specs["type"] in ["Pickup Truck", "Heavy Duty Pickup", "Midsize Pickup"]:
        # Create pickup truck
        cab_length = length * specs["cab_ratio"]
        bed_length = length * specs["bed_ratio"]

        # Cab
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(cab_length/2, 0, height/2)
        )
        cab = bpy.context.active_object
        cab.scale = (cab_length, width, height * 0.9)
        cab.name = "Cab"

        # Bed
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(cab_length + bed_length/2, 0, height * 0.4)
        )
        bed = bpy.context.active_object
        bed.scale = (bed_length, width, height * 0.6)
        bed.name = "Bed"

        # Hood
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(0, 0, height * 0.35)
        )
        hood = bpy.context.active_object
        hood.scale = (cab_length * 0.4, width, height * 0.5)
        hood.name = "Hood"

    elif specs["type"] in ["Cargo Van", "Commercial Van"]:
        # Create van
        cab_length = length * specs["cab_ratio"]
        cargo_length = length * specs["cargo_ratio"]

        # Cab
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(cab_length/2, 0, height * 0.45)
        )
        cab = bpy.context.active_object
        cab.scale = (cab_length, width, height * 0.7)
        cab.name = "Cab"

        # Cargo area (tall)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(cab_length + cargo_length/2, 0, height/2)
        )
        cargo = bpy.context.active_object
        cargo.scale = (cargo_length, width, height)
        cargo.name = "Cargo"

    else:
        # Create SUV/Sedan
        # Main body
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(length/2, 0, height/2)
        )
        body = bpy.context.active_object
        body.scale = (length, width, height)
        body.name = "Body"

        # Hood
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(length * 0.15, 0, height * 0.35)
        )
        hood = bpy.context.active_object
        hood.scale = (length * 0.3, width, height * 0.5)
        hood.name = "Hood"

    # Add wheels
    wheel_radius = 0.35 if "Heavy Duty" in specs["type"] else 0.3
    wheel_width = 0.25

    wheel_base = specs.get("wheel_base", length * 0.6)
    front_wheel_pos = wheel_base / 2
    rear_wheel_pos = -wheel_base / 2

    wheel_positions = [
        (front_wheel_pos, width/2 + 0.1, wheel_radius),    # Front right
        (front_wheel_pos, -width/2 - 0.1, wheel_radius),   # Front left
        (rear_wheel_pos, width/2 + 0.1, wheel_radius),     # Rear right
        (rear_wheel_pos, -width/2 - 0.1, wheel_radius),    # Rear left
    ]

    for i, pos in enumerate(wheel_positions):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=wheel_radius,
            depth=wheel_width,
            location=pos,
            rotation=(0, math.pi/2, 0)
        )
        wheel = bpy.context.active_object
        wheel.name = f"Wheel_{i}"

    # Select all and join
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    vehicle = bpy.context.active_object
    vehicle.name = name

    # Add smooth shading
    bpy.ops.object.shade_smooth()

    return vehicle

def apply_material(obj, color_name):
    """Apply colored material to object"""

    # Clear existing materials
    obj.data.materials.clear()

    # Create new material
    mat = bpy.data.materials.new(name=f"{obj.name}_{color_name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]

    # Get color
    rgba = color_palette.get(color_name, (0.5, 0.5, 0.5, 1.0))

    # Apply color and properties
    bsdf.inputs['Base Color'].default_value = rgba
    bsdf.inputs['Metallic'].default_value = 0.7
    bsdf.inputs['Roughness'].default_value = 0.3

    obj.data.materials.append(mat)

# Generate all vehicles
results = {}
total_models = 0

for vehicle_name, specs in fleet_vehicles.items():
    print(f"\n{'='*70}")
    print(f"🚗 Generating {vehicle_name} ({specs['type']})")
    print(f"{'='*70}")

    # Create base vehicle
    vehicle = create_vehicle(vehicle_name, specs)

    # Generate color variants
    vehicle_results = {}

    for color_name in specs["colors"]:
        print(f"   Creating {color_name} variant...")

        # Apply color
        apply_material(vehicle, color_name)

        # Export
        safe_color_name = color_name.replace(" ", "_")
        filename = f"{vehicle_name}_{safe_color_name}.glb"
        filepath = output_dir / filename

        bpy.ops.export_scene.gltf(
            filepath=str(filepath),
            export_format='GLB',
            use_selection=False
        )

        vehicle_results[color_name] = str(filepath)
        total_models += 1

        file_size = filepath.stat().st_size / 1024  # KB
        print(f"   ✅ {filename} ({file_size:.1f} KB)")

    results[vehicle_name] = {
        "type": specs["type"],
        "colors": vehicle_results,
        "dimensions": specs["dimensions"]
    }

# Save metadata
metadata = {
    "fleet_name": "Complete Fleet Collection",
    "generated_at": "2025-01-04",
    "total_vehicles": len(fleet_vehicles),
    "total_models": total_models,
    "vehicles": results
}

metadata_path = output_dir / "fleet_metadata.json"
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\n{'='*70}")
print("✅ FLEET GENERATION COMPLETE")
print(f"{'='*70}")
print(f"\n📊 Summary:")
print(f"   Vehicle Types: {len(fleet_vehicles)}")
print(f"   Total Models: {total_models}")
print(f"   Output Directory: {output_dir.absolute()}")
print(f"\n📁 Generated Files:")

# List all files
for glb_file in sorted(output_dir.glob("*.glb")):
    size = glb_file.stat().st_size / 1024
    print(f"   ✓ {glb_file.name} ({size:.1f} KB)")

print(f"\n💾 Metadata: {metadata_path}")
print(f"\n🎉 Your complete fleet is ready!")
print(f"\n📖 Vehicle Types Generated:")
print(f"   • Pickup Trucks (F-150, Silverado, Tacoma)")
print(f"   • Cargo Vans (Transit, ProMaster)")
print(f"   • SUVs (Explorer, Escape)")
print(f"   • Sedans (Fusion)")
print(f"\n🚀 Next Steps:")
print(f"   1. View models: blender {output_dir / '*.glb'}")
print(f"   2. Import to fleet management app")
print(f"   3. Use in 3D viewer component")
print()
