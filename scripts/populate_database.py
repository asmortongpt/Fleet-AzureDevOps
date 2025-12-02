#!/usr/bin/env python3
"""
Populate Database with 3D Models
Creates database tables and populates with fleet 3D model data
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from typing import Dict, List, Any
import time

# Paths
BASE_DIR = Path(__file__).parent.parent
CATALOG_PATH = BASE_DIR / "public" / "fleet-3d-catalog.json"
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

# Database connection from environment or defaults
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "15432")),
    "database": os.getenv("DB_NAME", "pmo_tool"),
    "user": os.getenv("DB_USER", "pmo_user"),
    "password": os.getenv("DB_PASSWORD", "PMOTool2025!Secure")
}

def create_tables(conn):
    """Create 3D model tables if they don't exist"""
    cursor = conn.cursor()

    print("\n📋 Creating Database Tables")
    print("-" * 60)

    # vehicle_3d_models table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_3d_models (
        id SERIAL PRIMARY KEY,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year_range VARCHAR(20),
        vehicle_type VARCHAR(50),
        category VARCHAR(50),
        model_url TEXT,
        model_path TEXT,
        model_format VARCHAR(10) DEFAULT 'glb',
        thumbnail_url TEXT,
        polygon_count INTEGER,
        file_size_mb DECIMAL(10,2),
        has_pbr_materials BOOLEAN DEFAULT true,
        has_clearcoat BOOLEAN DEFAULT true,
        source VARCHAR(50),
        license VARCHAR(50) DEFAULT 'CC0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(make, model, year_range)
    )
    """)
    print("  ✅ Table created/verified: vehicle_3d_models")

    # vehicle_3d_instances table (links vehicles to 3D models)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_3d_instances (
        id SERIAL PRIMARY KEY,
        vehicle_id VARCHAR(50) NOT NULL,
        model_id INTEGER REFERENCES vehicle_3d_models(id),
        custom_color VARCHAR(7),
        custom_decals JSONB,
        damage_markers JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vehicle_id)
    )
    """)
    print("  ✅ Table created/verified: vehicle_3d_instances")

    # Create indexes for performance
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_make_model
    ON vehicle_3d_models(make, model)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_category
    ON vehicle_3d_models(category)
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_vehicle_3d_instances_vehicle_id
    ON vehicle_3d_instances(vehicle_id)
    """)

    print("  ✅ Indexes created")

    conn.commit()
    print("✅ Database schema created successfully\n")

def scan_downloaded_models() -> Dict[str, Dict[str, Any]]:
    """Scan for downloaded model files"""
    models_found = {}

    if not MODELS_DIR.exists():
        return models_found

    for category_dir in MODELS_DIR.iterdir():
        if not category_dir.is_dir():
            continue

        category_name = category_dir.name

        # Scan for GLB files
        for model_file in category_dir.glob("*.glb"):
            model_id = model_file.stem
            file_size_mb = model_file.stat().st_size / (1024 * 1024)

            models_found[model_id] = {
                "filename": model_file.name,
                "category": category_name,
                "path": str(model_file.relative_to(BASE_DIR.parent)),
                "url": f"/models/vehicles/{category_name}/{model_file.name}",
                "file_size_mb": round(file_size_mb, 2),
                "format": "glb"
            }

    return models_found

def populate_3d_models_table(conn, catalog: Dict[str, Any], downloaded_models: Dict[str, Dict[str, Any]]) -> int:
    """Populate vehicle_3d_models table"""
    cursor = conn.cursor()

    print("📦 Populating vehicle_3d_models Table")
    print("-" * 60)

    added_count = 0

    for model_data in catalog.get("models", []):
        model_id = model_data.get("id")
        has_file = model_id in downloaded_models

        # Get file info if downloaded
        file_info = downloaded_models.get(model_id, {})

        try:
            cursor.execute("""
            INSERT INTO vehicle_3d_models (
                make, model, year_range, vehicle_type, category,
                model_url, model_path, model_format, file_size_mb,
                polygon_count, has_pbr_materials, has_clearcoat,
                source, license
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (make, model, year_range) DO UPDATE SET
                model_url = EXCLUDED.model_url,
                model_path = EXCLUDED.model_path,
                file_size_mb = EXCLUDED.file_size_mb,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
            """, (
                model_data["make"],
                model_data["model"],
                model_data["year_range"],
                model_data["type"],
                model_data["category"],
                file_info.get("url") if has_file else None,
                file_info.get("path") if has_file else None,
                file_info.get("format", "glb"),
                file_info.get("file_size_mb") if has_file else None,
                45000,  # Default polygon count
                True,   # has_pbr_materials
                True,   # has_clearcoat
                "Manual Download" if not has_file else "Downloaded",
                "CC0"
            ))

            model_db_id = cursor.fetchone()[0]
            added_count += 1

            status = "✅" if has_file else "⚠️"
            file_status = f"({file_info.get('file_size_mb', 0):.2f} MB)" if has_file else "(pending download)"

            print(f"  {status} {model_data['make']} {model_data['model']} {file_status}")

        except Exception as e:
            print(f"  ❌ Error adding {model_data['make']} {model_data['model']}: {e}")

    conn.commit()
    print(f"\n✅ Added/updated {added_count} models in database\n")

    return added_count

def link_vehicles_to_models(conn, catalog: Dict[str, Any]):
    """
    Link emulator vehicles to 3D models
    This creates vehicle_3d_instances entries
    """
    cursor = conn.cursor()

    print("🔗 Linking Vehicles to 3D Models")
    print("-" * 60)

    # Load vehicle configuration
    vehicles_config_path = BASE_DIR / "api" / "src" / "emulators" / "config" / "vehicles.json"

    if not vehicles_config_path.exists():
        print("  ⚠️  vehicles.json not found, skipping vehicle linking")
        return 0

    with open(vehicles_config_path) as f:
        vehicles_data = json.load(f)

    vehicles = vehicles_data.get("vehicles", [])
    linked_count = 0

    for vehicle in vehicles:
        vehicle_id = vehicle.get("id")
        make = vehicle.get("make")
        model = vehicle.get("model")

        # Find matching 3D model
        cursor.execute("""
        SELECT id FROM vehicle_3d_models
        WHERE make = %s AND model = %s
        LIMIT 1
        """, (make, model))

        result = cursor.fetchone()

        if result:
            model_db_id = result[0]

            try:
                cursor.execute("""
                INSERT INTO vehicle_3d_instances (
                    vehicle_id, model_id
                ) VALUES (%s, %s)
                ON CONFLICT (vehicle_id) DO UPDATE SET
                    model_id = EXCLUDED.model_id,
                    updated_at = CURRENT_TIMESTAMP
                """, (vehicle_id, model_db_id))

                linked_count += 1
                print(f"  ✅ Linked {vehicle_id}: {make} {model}")

            except Exception as e:
                print(f"  ❌ Error linking {vehicle_id}: {e}")
        else:
            print(f"  ⚠️  No 3D model found for {vehicle_id}: {make} {model}")

    conn.commit()
    print(f"\n✅ Linked {linked_count} vehicles to 3D models\n")

    return linked_count

def generate_database_report(conn) -> str:
    """Generate database population report"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Get statistics
    cursor.execute("SELECT COUNT(*) as total FROM vehicle_3d_models")
    total_models = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as total FROM vehicle_3d_models WHERE model_url IS NOT NULL")
    models_with_files = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as total FROM vehicle_3d_instances")
    linked_vehicles = cursor.fetchone()["total"]

    cursor.execute("""
    SELECT category, COUNT(*) as count
    FROM vehicle_3d_models
    GROUP BY category
    ORDER BY count DESC
    """)
    by_category = cursor.fetchall()

    report = f"""# Database Population Report

## 📊 Summary

- **Total 3D Models in Database**: {total_models}
- **Models with Downloaded Files**: {models_with_files}
- **Models Pending Download**: {total_models - models_with_files}
- **Vehicles Linked to Models**: {linked_vehicles}

## 📦 Models by Category

"""

    for row in by_category:
        report += f"- **{row['category'].replace('_', ' ').title()}**: {row['count']} models\n"

    report += f"""

## 🗄️ Database Tables

### vehicle_3d_models

Stores metadata for all 3D vehicle models:

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| make | VARCHAR(100) | Vehicle manufacturer |
| model | VARCHAR(100) | Vehicle model name |
| year_range | VARCHAR(20) | Model year range |
| vehicle_type | VARCHAR(50) | Type (truck, sedan, suv, etc.) |
| category | VARCHAR(50) | Folder category |
| model_url | TEXT | Public URL to GLB file |
| model_path | TEXT | File system path |
| model_format | VARCHAR(10) | File format (glb, gltf) |
| thumbnail_url | TEXT | Preview image URL |
| polygon_count | INTEGER | Triangle count |
| file_size_mb | DECIMAL | File size in megabytes |
| has_pbr_materials | BOOLEAN | PBR materials present |
| has_clearcoat | BOOLEAN | Clearcoat shader present |
| source | VARCHAR(50) | Download source |
| license | VARCHAR(50) | Model license |

**Total Records**: {total_models}

### vehicle_3d_instances

Links emulator vehicles to 3D models:

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| vehicle_id | VARCHAR(50) | Emulator vehicle ID |
| model_id | INTEGER | FK to vehicle_3d_models |
| custom_color | VARCHAR(7) | Override color (hex) |
| custom_decals | JSONB | Decal configuration |
| damage_markers | JSONB | Damage overlay data |

**Total Records**: {linked_vehicles}

## 🔍 Sample Queries

### Get all available 3D models with files:

```sql
SELECT make, model, year_range, model_url, file_size_mb
FROM vehicle_3d_models
WHERE model_url IS NOT NULL
ORDER BY make, model;
```

### Get vehicle with its 3D model:

```sql
SELECT
    vi.vehicle_id,
    vm.make,
    vm.model,
    vm.model_url,
    vm.file_size_mb
FROM vehicle_3d_instances vi
JOIN vehicle_3d_models vm ON vi.model_id = vm.id
WHERE vi.vehicle_id = 'VEH-001';
```

### Models pending download:

```sql
SELECT make, model, category
FROM vehicle_3d_models
WHERE model_url IS NULL
ORDER BY category, make, model;
```

## 📈 Next Steps

1. **Download remaining models** from Sketchfab
2. **Run catalog updater**: `python3 scripts/update_3d_catalog.py`
3. **Re-run this script** to update database with new files
4. **Test in 3D viewer**: Verify models load correctly

## 🔄 Updating the Database

After downloading new models:

```bash
# Update catalog
python3 scripts/update_3d_catalog.py

# Re-populate database
python3 scripts/populate_database.py
```

The script will automatically:
- Update existing records with file URLs
- Add new models
- Maintain vehicle linkages

---

*Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}*
"""

    return report

def main():
    """Main execution"""
    print("\n" + "🗄️" * 30)
    print("DATABASE POPULATION SCRIPT")
    print("Creating tables and populating 3D model data")
    print("🗄️" * 30)

    # Load catalog
    print("\n📖 Loading Catalog")
    print("-" * 60)

    if not CATALOG_PATH.exists():
        print(f"❌ Catalog not found: {CATALOG_PATH}")
        print("   Run: python3 scripts/download_fleet_3d_models.py first")
        return

    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    print(f"✅ Loaded catalog: {catalog['metadata']['unique_models']} models\n")

    # Scan for downloaded models
    print("📁 Scanning for Downloaded Models")
    print("-" * 60)

    downloaded_models = scan_downloaded_models()
    print(f"✅ Found {len(downloaded_models)} downloaded model files\n")

    # Connect to database
    print("🔌 Connecting to Database")
    print("-" * 60)

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"✅ Connected to: {DB_CONFIG['database']} @ {DB_CONFIG['host']}:{DB_CONFIG['port']}\n")

        # Create tables
        create_tables(conn)

        # Populate 3D models table
        model_count = populate_3d_models_table(conn, catalog, downloaded_models)

        # Link vehicles to models
        linked_count = link_vehicles_to_models(conn, catalog)

        # Generate report
        print("📝 Generating Database Report")
        print("-" * 60)

        report = generate_database_report(conn)
        report_path = BASE_DIR / "DATABASE_POPULATION_REPORT.md"

        with open(report_path, 'w') as f:
            f.write(report)

        print(f"✅ Report created: {report_path}\n")

        # Close connection
        conn.close()

        # Summary
        print("=" * 60)
        print("DATABASE POPULATION COMPLETE")
        print("=" * 60)
        print(f"Models in database: {model_count}")
        print(f"Models with files: {len(downloaded_models)}")
        print(f"Vehicles linked: {linked_count}")
        print()
        print("Database tables:")
        print("  ✅ vehicle_3d_models")
        print("  ✅ vehicle_3d_instances")
        print()
        print("Report: DATABASE_POPULATION_REPORT.md")
        print("=" * 60)
        print("✨ Database ready!")
        print()

    except psycopg2.OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        print()
        print("⚠️  Database not available. Tables and data not created.")
        print("   Once database is running, re-run this script.")
        print()
        print("   Connection attempted:")
        print(f"   Host: {DB_CONFIG['host']}")
        print(f"   Port: {DB_CONFIG['port']}")
        print(f"   Database: {DB_CONFIG['database']}")
        print()

if __name__ == "__main__":
    main()
