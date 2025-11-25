#!/usr/bin/env python3
"""
Extract Real Fleet from HTML
Creates correct 3D catalog based on actual fleet vehicles
"""

import json
from pathlib import Path
from collections import Counter

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Real fleet data from fleet-vehicles-list.html
REAL_FLEET = [
    # ALTECH VEHICLES (25 total)
    {"make": "Altech", "model": "AH-350 Hauler", "license_plate": "ALTECH-021", "vehicle_type": "Articulated Hauler", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "AH-350 Hauler", "license_plate": "ALTECH-022", "vehicle_type": "Articulated Hauler", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "CM-3000 Mixer", "license_plate": "ALTECH-006", "vehicle_type": "Mixer Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "CM-3000 Mixer", "license_plate": "ALTECH-007", "vehicle_type": "Mixer Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "CM-3500 Mixer", "license_plate": "ALTECH-008", "vehicle_type": "Mixer Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "CT-500 Crane", "license_plate": "ALTECH-014", "vehicle_type": "Crane Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "CT-500 Crane", "license_plate": "ALTECH-013", "vehicle_type": "Crane Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "CT-600 Crane", "license_plate": "ALTECH-015", "vehicle_type": "Crane Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "ET-400 Transporter", "license_plate": "ALTECH-017", "vehicle_type": "Heavy Hauler", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "ET-400 Transporter", "license_plate": "ALTECH-016", "vehicle_type": "Heavy Hauler", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "ET-450 Transporter", "license_plate": "ALTECH-018", "vehicle_type": "Heavy Hauler", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "FH-250 Flatbed", "license_plate": "ALTECH-010", "vehicle_type": "Flatbed Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "FH-250 Flatbed", "license_plate": "ALTECH-009", "vehicle_type": "Flatbed Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "FH-300 Flatbed", "license_plate": "ALTECH-012", "vehicle_type": "Flatbed Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "FH-300 Flatbed", "license_plate": "ALTECH-011", "vehicle_type": "Flatbed Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "FL-1500 Fuel/Lube", "license_plate": "ALTECH-025", "vehicle_type": "Fuel Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "HD-40 Dump Truck", "license_plate": "ALTECH-002", "vehicle_type": "Heavy Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "HD-40 Dump Truck", "license_plate": "ALTECH-003", "vehicle_type": "Heavy Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "HD-40 Dump Truck", "license_plate": "ALTECH-001", "vehicle_type": "Heavy Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "HD-45 Dump Truck", "license_plate": "ALTECH-004", "vehicle_type": "Heavy Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "HD-45 Dump Truck", "license_plate": "ALTECH-005", "vehicle_type": "Heavy Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "ST-200 Service", "license_plate": "ALTECH-020", "vehicle_type": "Service Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "ST-200 Service", "license_plate": "ALTECH-019", "vehicle_type": "Service Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "WT-2000 Water", "license_plate": "ALTECH-024", "vehicle_type": "Water Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Altech", "model": "WT-2000 Water", "license_plate": "ALTECH-023", "vehicle_type": "Water Truck", "fuel_type": "Diesel", "status": "active"},

    # TESLA VEHICLES (3 total - SmartCar)
    {"make": "Tesla", "model": "Model 3", "license_plate": "SMART-001", "vehicle_type": "Sedan", "fuel_type": "Electric", "status": "active"},
    {"make": "Tesla", "model": "Model S", "license_plate": "SMART-002", "vehicle_type": "Sedan", "fuel_type": "Electric", "status": "active"},
    {"make": "Tesla", "model": "Model X", "license_plate": "SMART-003", "vehicle_type": "SUV", "fuel_type": "Electric", "status": "active"},

    # SAMSARA VEHICLES (6 total)
    {"make": "Freightliner", "model": "Cascadia", "license_plate": "SAMS-001", "vehicle_type": "Semi Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Freightliner", "model": "Cascadia", "license_plate": "SAMS-002", "vehicle_type": "Semi Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Kenworth", "model": "T680", "license_plate": "SAMS-006", "vehicle_type": "Semi Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Kenworth", "model": "T880", "license_plate": "SAMS-007", "vehicle_type": "Heavy Hauler", "fuel_type": "Diesel", "status": "active"},
    {"make": "Mack", "model": "Anthem", "license_plate": "SAMS-010", "vehicle_type": "Semi Truck", "fuel_type": "Diesel", "status": "active"},
    {"make": "Mack", "model": "Granite", "license_plate": "SAMS-011", "vehicle_type": "Dump Truck", "fuel_type": "Diesel", "status": "active"},
]

def categorize_vehicle(vehicle_type: str) -> str:
    """Categorize vehicle type into folder structure"""
    type_map = {
        "Articulated Hauler": "construction",
        "Mixer Truck": "construction",
        "Crane Truck": "construction",
        "Heavy Hauler": "construction",
        "Flatbed Truck": "trucks",
        "Fuel Truck": "trucks",
        "Heavy Truck": "construction",
        "Service Truck": "trucks",
        "Water Truck": "trucks",
        "Sedan": "sedans",
        "SUV": "suvs",
        "Semi Truck": "trucks",
        "Dump Truck": "construction",
    }
    return type_map.get(vehicle_type, "trucks")

def main():
    print("🚗" * 40)
    print("EXTRACTING REAL FLEET DATA")
    print("From: fleet-vehicles-list.html")
    print("🚗" * 40)

    # Count unique models
    model_counts = Counter()
    for vehicle in REAL_FLEET:
        model_key = f"{vehicle['make']} {vehicle['model']}"
        model_counts[model_key] += 1

    # Create catalog entries
    unique_models = []
    seen_models = set()

    for vehicle in REAL_FLEET:
        model_key = f"{vehicle['make']} {vehicle['model']}"

        if model_key not in seen_models:
            seen_models.add(model_key)

            # Create safe ID
            model_id = f"{vehicle['make']}_{vehicle['model']}".lower()
            model_id = model_id.replace(' ', '_').replace('-', '_').replace('/', '_')

            category = categorize_vehicle(vehicle['vehicle_type'])
            fleet_count = model_counts[model_key]

            # Determine priority (Altech highest, then count)
            if vehicle['make'] == 'Altech':
                priority = 1
            elif fleet_count > 1:
                priority = 2
            else:
                priority = 3

            unique_models.append({
                "id": model_id,
                "make": vehicle['make'],
                "model": vehicle['model'],
                "year_range": "2020-2024",
                "type": vehicle['vehicle_type'].lower().replace(' ', '_'),
                "category": category,
                "fleet_count": fleet_count,
                "priority": priority,
                "search_query": f"{vehicle['make']} {vehicle['model']} heavy equipment",
                "has_3d_model": False,
                "model_url": None,
                "target_path": f"public/models/vehicles/{category}/{model_id}.glb"
            })

    # Sort by priority and count
    unique_models.sort(key=lambda x: (x['priority'], -x['fleet_count']))

    # Create catalog
    catalog = {
        "metadata": {
            "generated_at": "2025-11-24",
            "source": "fleet-vehicles-list.html",
            "total_vehicles": len(REAL_FLEET),
            "unique_models": len(unique_models),
            "type_distribution": dict(Counter([v['vehicle_type'] for v in REAL_FLEET])),
            "models_with_files": 0,
            "models_pending": len(unique_models),
            "last_updated": "2025-11-24"
        },
        "models": unique_models
    }

    # Save catalog
    catalog_path = BASE_DIR / "public" / "fleet-3d-catalog-REAL.json"
    with open(catalog_path, 'w') as f:
        json.dump(catalog, f, indent=2)

    print(f"\n✅ Real Fleet Catalog Created!")
    print(f"   Total vehicles: {len(REAL_FLEET)}")
    print(f"   Unique models: {len(unique_models)}")
    print(f"   Saved to: {catalog_path}")

    print(f"\n📊 Fleet Breakdown:")
    print(f"   Altech trucks: {len([v for v in REAL_FLEET if v['make'] == 'Altech'])}")
    print(f"   Tesla vehicles: {len([v for v in REAL_FLEET if v['make'] == 'Tesla'])}")
    print(f"   Samsara trucks: {len([v for v in REAL_FLEET if 'SAMS' in v['license_plate']])}")

    print(f"\n📦 Unique Models Needed ({len(unique_models)} total):")
    for model in unique_models[:10]:
        print(f"   • {model['fleet_count']}x {model['make']} {model['model']} ({model['category']})")
    if len(unique_models) > 10:
        print(f"   ... and {len(unique_models) - 10} more")

    print(f"\n🎯 Priority 1 (Altech): {len([m for m in unique_models if m['priority'] == 1])} models")
    print(f"   Priority 2: {len([m for m in unique_models if m['priority'] == 2])} models")
    print(f"   Priority 3: {len([m for m in unique_models if m['priority'] == 3])} models")

if __name__ == "__main__":
    main()
