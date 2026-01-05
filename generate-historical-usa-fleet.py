#!/usr/bin/env python3
"""
Generate Complete Historical USA Fleet (2015-2024)
Creates 3D models for all major USA production vehicles across 10 model years
"""

import bpy
import bmesh
import math
import json
import os
from pathlib import Path

print("🚛 HISTORICAL USA FLEET GENERATOR (2015-2024)")
print("=" * 80)
print("Generating 3D models for 10 years of USA production vehicles")
print("=" * 80)
print()

# Historical vehicle database - organized by year with model changes
historical_vehicles_by_year = {
    # Track significant changes per year
    "2015": {
        "discontinued": ["Ford_Fusion", "Chevrolet_Cruze"],
        "new_models": [],
        "unchanged": ["Ford_F150", "Chevrolet_Silverado_1500", "Ram_1500", "Toyota_Tacoma"]
    },
    "2016": {
        "discontinued": [],
        "new_models": ["Honda_Ridgeline"],
        "unchanged": ["Ford_F150", "Chevrolet_Silverado_1500"]
    },
    "2017": {
        "discontinued": [],
        "new_models": ["Ford_F150_Raptor"],
        "unchanged": ["Ford_F150", "Ram_1500"]
    },
    "2018": {
        "discontinued": [],
        "new_models": ["Ford_Expedition"],
        "unchanged": ["Ford_F150", "Chevrolet_Silverado_1500"]
    },
    "2019": {
        "discontinued": [],
        "new_models": ["Ram_1500_Redesign", "Ford_Ranger"],
        "unchanged": ["Ford_F150"]
    },
    "2020": {
        "discontinued": [],
        "new_models": ["Ford_Explorer_Redesign", "Chevrolet_Silverado_HD"],
        "unchanged": ["Ford_F150", "Ram_1500"]
    },
    "2021": {
        "discontinued": [],
        "new_models": ["Ford_F150_Redesign", "Ford_Bronco"],
        "unchanged": ["Ram_1500", "Toyota_Tacoma"]
    },
    "2022": {
        "discontinued": [],
        "new_models": ["Ford_F150_Lightning", "Rivian_R1T", "GMC_Hummer_EV"],
        "unchanged": ["Ford_F150", "Ram_1500"]
    },
    "2023": {
        "discontinued": [],
        "new_models": ["Chevrolet_Silverado_EV", "Ram_REV"],
        "unchanged": ["Ford_F150_Lightning", "Rivian_R1T"]
    },
    "2024": {
        "discontinued": [],
        "new_models": ["Tesla_Cybertruck", "Ford_Maverick_Hybrid"],
        "unchanged": ["Ford_F150_Lightning", "Chevrolet_Silverado_EV"]
    }
}

# Base vehicle database (2015-2024 common vehicles)
base_vehicles = {
    # PICKUP TRUCKS
    "Ford_F150": {
        "type": "Full-Size Truck",
        "manufacturer": "Ford",
        "dimensions": {"length": 5.9, "width": 2.0, "height": 1.95},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.7,
        "colors": ["Oxford White", "Agate Black", "Iconic Silver"]
    },
    "Ford_F250_Super_Duty": {
        "type": "Heavy Duty Truck",
        "manufacturer": "Ford",
        "dimensions": {"length": 6.2, "width": 2.0, "height": 2.0},
        "cab_ratio": 0.38,
        "bed_ratio": 0.62,
        "wheel_base": 4.0,
        "colors": ["Oxford White", "Agate Black", "Stone Gray"]
    },
    "Ford_Ranger": {
        "type": "Midsize Truck",
        "manufacturer": "Ford",
        "dimensions": {"length": 5.4, "width": 1.85, "height": 1.83},
        "cab_ratio": 0.45,
        "bed_ratio": 0.55,
        "wheel_base": 3.3,
        "colors": ["Oxford White", "Rapid Red", "Cactus Gray"],
        "years": [2019, 2020, 2021, 2022, 2023, 2024]  # Returned in 2019
    },
    "Chevrolet_Silverado_1500": {
        "type": "Full-Size Truck",
        "manufacturer": "Chevrolet",
        "dimensions": {"length": 5.9, "width": 2.0, "height": 1.95},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.75,
        "colors": ["Summit White", "Black", "Silver Ice Metallic"]
    },
    "Chevrolet_Silverado_2500HD": {
        "type": "Heavy Duty Truck",
        "manufacturer": "Chevrolet",
        "dimensions": {"length": 6.5, "width": 2.0, "height": 2.0},
        "cab_ratio": 0.38,
        "bed_ratio": 0.62,
        "wheel_base": 4.0,
        "colors": ["Summit White", "Black", "Red Hot"]
    },
    "Ram_1500": {
        "type": "Full-Size Truck",
        "manufacturer": "Ram",
        "dimensions": {"length": 5.8, "width": 2.0, "height": 1.94},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.6,
        "colors": ["Bright White", "Diamond Black", "Billet Silver"]
    },
    "Ram_2500": {
        "type": "Heavy Duty Truck",
        "manufacturer": "Ram",
        "dimensions": {"length": 6.3, "width": 2.0, "height": 2.0},
        "cab_ratio": 0.38,
        "bed_ratio": 0.62,
        "wheel_base": 3.9,
        "colors": ["Bright White", "Diamond Black", "Flame Red"]
    },
    "Toyota_Tundra": {
        "type": "Full-Size Truck",
        "manufacturer": "Toyota",
        "dimensions": {"length": 5.8, "width": 2.0, "height": 1.95},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.7,
        "colors": ["Super White", "Midnight Black", "Magnetic Gray"]
    },
    "Toyota_Tacoma": {
        "type": "Midsize Truck",
        "manufacturer": "Toyota",
        "dimensions": {"length": 5.4, "width": 1.9, "height": 1.8},
        "cab_ratio": 0.45,
        "bed_ratio": 0.55,
        "wheel_base": 3.3,
        "colors": ["Super White", "Midnight Black", "Barcelona Red"]
    },
    "GMC_Sierra_1500": {
        "type": "Full-Size Truck",
        "manufacturer": "GMC",
        "dimensions": {"length": 5.9, "width": 2.0, "height": 1.95},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.75,
        "colors": ["Summit White", "Onyx Black", "Steel Gray"]
    },

    # CARGO VANS
    "Ford_Transit_150": {
        "type": "Full-Size Van",
        "manufacturer": "Ford",
        "dimensions": {"length": 6.0, "width": 2.0, "height": 2.8},
        "cab_ratio": 0.25,
        "cargo_ratio": 0.75,
        "wheel_base": 3.5,
        "colors": ["Oxford White", "Agate Black", "Iconic Silver"]
    },
    "Chevrolet_Express_2500": {
        "type": "Full-Size Van",
        "manufacturer": "Chevrolet",
        "dimensions": {"length": 5.7, "width": 2.0, "height": 2.1},
        "cab_ratio": 0.3,
        "cargo_ratio": 0.7,
        "wheel_base": 3.4,
        "colors": ["Summit White", "Black", "Silver Ice"]
    },
    "Ram_ProMaster_2500": {
        "type": "Full-Size Van",
        "manufacturer": "Ram",
        "dimensions": {"length": 6.4, "width": 2.0, "height": 2.9},
        "cab_ratio": 0.2,
        "cargo_ratio": 0.8,
        "wheel_base": 3.9,
        "colors": ["Bright White", "Black", "Broom Yellow"]
    },
    "Mercedes_Sprinter_2500": {
        "type": "Full-Size Van",
        "manufacturer": "Mercedes-Benz",
        "dimensions": {"length": 6.0, "width": 2.0, "height": 2.8},
        "cab_ratio": 0.25,
        "cargo_ratio": 0.75,
        "wheel_base": 3.7,
        "colors": ["Arctic White", "Obsidian Black", "Graphite Gray"]
    },

    # SUVs
    "Ford_Explorer": {
        "type": "Midsize SUV",
        "manufacturer": "Ford",
        "dimensions": {"length": 5.0, "width": 2.0, "height": 1.8},
        "cab_ratio": 1.0,
        "wheel_base": 3.0,
        "colors": ["Oxford White", "Carbonized Gray", "Rapid Red"]
    },
    "Ford_Expedition": {
        "type": "Full-Size SUV",
        "manufacturer": "Ford",
        "dimensions": {"length": 5.3, "width": 2.0, "height": 1.9},
        "cab_ratio": 1.0,
        "wheel_base": 3.2,
        "colors": ["Oxford White", "Agate Black", "Stone Blue"]
    },
    "Chevrolet_Tahoe": {
        "type": "Full-Size SUV",
        "manufacturer": "Chevrolet",
        "dimensions": {"length": 5.3, "width": 2.0, "height": 1.9},
        "cab_ratio": 1.0,
        "wheel_base": 3.0,
        "colors": ["Summit White", "Black", "Silver Flare"]
    },
    "Chevrolet_Suburban": {
        "type": "Full-Size SUV",
        "manufacturer": "Chevrolet",
        "dimensions": {"length": 5.7, "width": 2.0, "height": 1.9},
        "cab_ratio": 1.0,
        "wheel_base": 3.3,
        "colors": ["Summit White", "Black", "Satin Steel"]
    },
    "Toyota_4Runner": {
        "type": "Midsize SUV",
        "manufacturer": "Toyota",
        "dimensions": {"length": 4.8, "width": 1.9, "height": 1.8},
        "cab_ratio": 1.0,
        "wheel_base": 2.8,
        "colors": ["Super White", "Midnight Black", "Magnetic Gray"]
    },
    "Honda_Pilot": {
        "type": "Midsize SUV",
        "manufacturer": "Honda",
        "dimensions": {"length": 4.9, "width": 2.0, "height": 1.8},
        "cab_ratio": 1.0,
        "wheel_base": 2.8,
        "colors": ["Platinum White", "Crystal Black", "Modern Steel"]
    },

    # ELECTRIC VEHICLES (2022+)
    "Ford_F150_Lightning": {
        "type": "Electric Truck",
        "manufacturer": "Ford",
        "dimensions": {"length": 5.9, "width": 2.0, "height": 2.0},
        "cab_ratio": 0.4,
        "bed_ratio": 0.6,
        "wheel_base": 3.7,
        "colors": ["Antimatter Blue", "Oxford White", "Carbonized Gray"],
        "years": [2022, 2023, 2024]
    },
    "Rivian_R1T": {
        "type": "Electric Truck",
        "manufacturer": "Rivian",
        "dimensions": {"length": 5.5, "width": 2.0, "height": 1.9},
        "cab_ratio": 0.45,
        "bed_ratio": 0.55,
        "wheel_base": 3.4,
        "colors": ["Rivian Blue", "Glacier White", "Launch Green"],
        "years": [2022, 2023, 2024]
    },
    "Tesla_Cybertruck": {
        "type": "Electric Truck",
        "manufacturer": "Tesla",
        "dimensions": {"length": 5.7, "width": 2.0, "height": 1.8},
        "cab_ratio": 0.5,
        "bed_ratio": 0.5,
        "wheel_base": 3.6,
        "colors": ["Stainless Steel"],
        "years": [2024]
    },

    # SPECIALTY VEHICLES
    "Caterpillar_D8_Dozer": {
        "type": "Heavy Equipment",
        "manufacturer": "Caterpillar",
        "dimensions": {"length": 7.5, "width": 3.5, "height": 3.2},
        "colors": ["CAT Yellow", "Black"],
        "is_tracked": True
    },
    "Caterpillar_320_Excavator": {
        "type": "Heavy Equipment",
        "manufacturer": "Caterpillar",
        "dimensions": {"length": 9.0, "width": 2.8, "height": 3.0},
        "colors": ["CAT Yellow", "Black"],
        "is_tracked": True
    },
    "John_Deere_310_Backhoe": {
        "type": "Heavy Equipment",
        "manufacturer": "John Deere",
        "dimensions": {"length": 6.0, "width": 2.3, "height": 3.5},
        "colors": ["John Deere Green", "Yellow"],
        "has_loader": True,
        "has_backhoe": True
    },
}

# Color palette
color_palette = {
    # Ford colors
    "Oxford White": (0.95, 0.95, 0.95, 1.0),
    "Agate Black": (0.039, 0.039, 0.039, 1.0),
    "Iconic Silver": (0.753, 0.753, 0.753, 1.0),
    "Carbonized Gray": (0.243, 0.243, 0.243, 1.0),
    "Rapid Red": (0.769, 0.118, 0.227, 1.0),
    "Antimatter Blue": (0.118, 0.227, 0.373, 1.0),
    "Stone Gray": (0.6, 0.6, 0.6, 1.0),
    "Cactus Gray": (0.5, 0.52, 0.48, 1.0),
    "Stone Blue": (0.3, 0.4, 0.5, 1.0),

    # Chevrolet colors
    "Summit White": (0.98, 0.98, 0.98, 1.0),
    "Black": (0.02, 0.02, 0.02, 1.0),
    "Silver Ice Metallic": (0.7, 0.72, 0.75, 1.0),
    "Red Hot": (0.85, 0.15, 0.15, 1.0),
    "Silver Ice": (0.75, 0.75, 0.75, 1.0),
    "Silver Flare": (0.72, 0.72, 0.72, 1.0),
    "Satin Steel": (0.65, 0.65, 0.65, 1.0),

    # Ram colors
    "Bright White": (1.0, 1.0, 1.0, 1.0),
    "Diamond Black": (0.05, 0.05, 0.05, 1.0),
    "Billet Silver": (0.7, 0.7, 0.7, 1.0),
    "Flame Red": (0.8, 0.1, 0.1, 1.0),
    "Broom Yellow": (0.95, 0.85, 0.1, 1.0),

    # Toyota colors
    "Super White": (0.99, 0.99, 0.99, 1.0),
    "Midnight Black": (0.05, 0.05, 0.05, 1.0),
    "Magnetic Gray": (0.4, 0.4, 0.4, 1.0),
    "Barcelona Red": (0.8, 0.1, 0.1, 1.0),

    # GMC colors
    "Steel Gray": (0.45, 0.45, 0.45, 1.0),
    "Onyx Black": (0.03, 0.03, 0.03, 1.0),

    # Mercedes colors
    "Arctic White": (0.97, 0.97, 0.97, 1.0),
    "Obsidian Black": (0.04, 0.04, 0.04, 1.0),
    "Graphite Gray": (0.35, 0.35, 0.35, 1.0),

    # Honda colors
    "Platinum White": (0.96, 0.96, 0.96, 1.0),
    "Crystal Black": (0.04, 0.04, 0.04, 1.0),
    "Modern Steel": (0.5, 0.5, 0.5, 1.0),

    # EV colors
    "Rivian Blue": (0.2, 0.4, 0.6, 1.0),
    "Glacier White": (0.95, 0.97, 1.0, 1.0),
    "Launch Green": (0.2, 0.6, 0.3, 1.0),
    "Stainless Steel": (0.8, 0.8, 0.8, 1.0),

    # Equipment colors
    "CAT Yellow": (0.98, 0.78, 0.05, 1.0),
    "John Deere Green": (0.22, 0.48, 0.22, 1.0),
    "Yellow": (1.0, 0.9, 0.0, 1.0),
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

    if "Truck" in specs["type"] and "Heavy Equipment" not in specs["type"]:
        # Create pickup truck
        cab_length = length * specs["cab_ratio"]
        bed_length = length * specs["bed_ratio"]

        # Cab
        bpy.ops.mesh.primitive_cube_add(size=1, location=(cab_length/2, 0, height/2))
        cab = bpy.context.active_object
        cab.scale = (cab_length, width, height * 0.9)
        cab.name = "Cab"

        # Bed
        bpy.ops.mesh.primitive_cube_add(size=1, location=(cab_length + bed_length/2, 0, height * 0.4))
        bed = bpy.context.active_object
        bed.scale = (bed_length, width, height * 0.6)
        bed.name = "Bed"

        # Hood
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height * 0.35))
        hood = bpy.context.active_object
        hood.scale = (cab_length * 0.4, width, height * 0.5)
        hood.name = "Hood"

    elif "Van" in specs["type"]:
        # Create van
        cab_length = length * specs["cab_ratio"]
        cargo_length = length * specs["cargo_ratio"]

        # Cab
        bpy.ops.mesh.primitive_cube_add(size=1, location=(cab_length/2, 0, height * 0.45))
        cab = bpy.context.active_object
        cab.scale = (cab_length, width, height * 0.7)
        cab.name = "Cab"

        # Cargo area
        bpy.ops.mesh.primitive_cube_add(size=1, location=(cab_length + cargo_length/2, 0, height/2))
        cargo = bpy.context.active_object
        cargo.scale = (cargo_length, width, height)
        cargo.name = "Cargo"

    elif "Equipment" in specs["type"]:
        # Create heavy equipment body
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length/2, 0, height/2))
        body = bpy.context.active_object
        body.scale = (length, width, height)
        body.name = "Body"

    else:
        # Create SUV/Sedan
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length/2, 0, height/2))
        body = bpy.context.active_object
        body.scale = (length, width, height)
        body.name = "Body"

        # Hood
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length * 0.15, 0, height * 0.35))
        hood = bpy.context.active_object
        hood.scale = (length * 0.3, width, height * 0.5)
        hood.name = "Hood"

    # Add wheels (unless tracked)
    if not specs.get("is_tracked", False):
        wheel_radius = 0.4 if "Heavy" in specs["type"] else 0.35 if "Equipment" in specs["type"] else 0.3
        wheel_width = 0.3 if "Heavy" in specs["type"] else 0.25

        wheel_base = specs.get("wheel_base", length * 0.6)
        front_wheel_pos = wheel_base / 2
        rear_wheel_pos = -wheel_base / 2

        wheel_positions = [
            (front_wheel_pos, width/2 + 0.1, wheel_radius),
            (front_wheel_pos, -width/2 - 0.1, wheel_radius),
            (rear_wheel_pos, width/2 + 0.1, wheel_radius),
            (rear_wheel_pos, -width/2 - 0.1, wheel_radius),
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

    # Join all parts
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    vehicle = bpy.context.active_object
    vehicle.name = name

    # Add smooth shading
    bpy.ops.object.shade_smooth()

    return vehicle

def apply_material(obj, color_name):
    """Apply colored material to object"""
    obj.data.materials.clear()

    mat = bpy.data.materials.new(name=f"{obj.name}_{color_name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]

    rgba = color_palette.get(color_name, (0.5, 0.5, 0.5, 1.0))

    bsdf.inputs['Base Color'].default_value = rgba
    bsdf.inputs['Metallic'].default_value = 0.7
    bsdf.inputs['Roughness'].default_value = 0.3

    obj.data.materials.append(mat)

# Generate historical fleet
total_models = 0
results_by_year = {}

years = range(2015, 2025)  # 2015-2024

for year in years:
    print(f"\n{'='*80}")
    print(f"📅 GENERATING {year} VEHICLE MODELS")
    print(f"{'='*80}")

    # Create output directory for this year
    output_dir = Path(f"./output/complete_usa_fleet_{year}")
    output_dir.mkdir(parents=True, exist_ok=True)

    year_results = {}
    year_model_count = 0

    for vehicle_name, specs in base_vehicles.items():
        # Check if vehicle was available in this year
        if "years" in specs:
            if year not in specs["years"]:
                continue  # Skip this vehicle for this year

        print(f"\n🚗 {vehicle_name} ({year})")

        # Create base vehicle
        vehicle = create_vehicle(vehicle_name, specs)

        # Generate color variants
        vehicle_color_results = {}

        for color_name in specs["colors"]:
            print(f"   Creating {color_name}...")

            # Apply color
            apply_material(vehicle, color_name)

            # Export
            safe_color_name = color_name.replace(" ", "_")
            filename = f"{vehicle_name}_{year}_{safe_color_name}.glb"
            filepath = output_dir / filename

            bpy.ops.export_scene.gltf(
                filepath=str(filepath),
                export_format='GLB',
                use_selection=False
            )

            vehicle_color_results[color_name] = str(filepath)
            year_model_count += 1
            total_models += 1

            file_size = filepath.stat().st_size / 1024
            print(f"   ✅ {filename} ({file_size:.1f} KB)")

        year_results[vehicle_name] = {
            "type": specs["type"],
            "manufacturer": specs.get("manufacturer", "Unknown"),
            "colors": vehicle_color_results,
            "dimensions": specs["dimensions"]
        }

    # Save metadata for this year
    metadata = {
        "fleet_name": f"Complete USA Fleet {year}",
        "year": year,
        "generated_at": "2025-01-04",
        "total_vehicles": len(year_results),
        "total_models": year_model_count,
        "vehicles": year_results
    }

    metadata_path = output_dir / f"fleet_metadata_{year}.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    results_by_year[year] = {
        "metadata_path": str(metadata_path),
        "output_dir": str(output_dir),
        "model_count": year_model_count
    }

    print(f"\n✅ {year} Complete: {year_model_count} models generated")

# Save master metadata
master_metadata = {
    "fleet_name": "Complete Historical USA Fleet (2015-2024)",
    "years": list(range(2015, 2025)),
    "generated_at": "2025-01-04",
    "total_models": total_models,
    "total_years": 10,
    "results_by_year": results_by_year
}

master_metadata_path = Path("./output/historical_fleet_master_metadata.json")
with open(master_metadata_path, 'w') as f:
    json.dump(master_metadata, f, indent=2)

print(f"\n{'='*80}")
print("✅ HISTORICAL FLEET GENERATION COMPLETE")
print(f"{'='*80}")
print(f"\n📊 Final Statistics:")
print(f"   Years Covered: 2015-2024 (10 years)")
print(f"   Total 3D Models: {total_models}")
print(f"   Average per Year: {total_models // 10}")
print(f"\n📁 Output Structure:")
for year in range(2015, 2025):
    print(f"   • output/complete_usa_fleet_{year}/")
print(f"\n💾 Master Metadata: {master_metadata_path}")
print(f"\n🎉 Complete historical fleet is ready!")
print()
