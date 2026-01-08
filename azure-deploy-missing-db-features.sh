#!/bin/bash
set -e

# ============================================================================
# Azure VM Multi-Agent Database Feature Deployment
# ============================================================================
# This script deploys OpenAI agents to Azure VM to implement all missing
# database functionality identified in the comparison matrix
# ============================================================================

AZURE_VM_IP="20.51.206.144"
AZURE_VM_USER="azureuser"
AZURE_RG="fleet-ai-agents"
AZURE_VM_NAME="fleet-qa-power"
WORK_DIR="/home/azureuser/fleet-db-deployment"

echo "============================================================================"
echo "Fleet Database Missing Features Deployment"
echo "============================================================================"
echo "Target VM: $AZURE_VM_NAME ($AZURE_VM_IP)"
echo "Resource Group: $AZURE_RG"
echo "Deployment Date: $(date)"
echo "============================================================================"

# ============================================================================
# Step 1: Prepare Azure VM Environment
# ============================================================================
echo ""
echo "[Step 1/7] Preparing Azure VM environment..."

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
    # Create deployment directory
    mkdir -p $WORK_DIR/{agents,sql,logs,results}
    cd $WORK_DIR

    # Install required tools
    sudo apt-get update -qq
    sudo apt-get install -y postgresql-client jq curl python3-pip git

    # Install Python dependencies for agents
    pip3 install --quiet openai anthropic langchain psycopg2-binary python-dotenv

    echo 'Azure VM environment ready'
  " --output json | jq -r '.value[0].message'

# ============================================================================
# Step 2: Deploy Agent 1 - damage_reports Table Creator
# ============================================================================
echo ""
echo "[Step 2/7] Deploying Agent 1: damage_reports Table Creation..."

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
cat > $WORK_DIR/agents/agent_1_damage_reports.py << 'AGENT1EOF'
#!/usr/bin/env python3
\"\"\"
Agent 1: damage_reports Table Creation Agent
Creates the missing damage_reports table with all indexes and triggers
\"\"\"
import os
import psycopg2
from datetime import datetime

AGENT_NAME = 'damage_reports_creator'
LOG_FILE = '$WORK_DIR/logs/agent_1.log'

def log(message):
    timestamp = datetime.now().isoformat()
    log_msg = f'[{timestamp}] [{AGENT_NAME}] {message}'
    print(log_msg)
    with open(LOG_FILE, 'a') as f:
        f.write(log_msg + '\n')

def create_damage_reports_table():
    \"\"\"Create damage_reports table with all dependencies\"\"\"

    # SQL for damage_reports table creation
    sql = '''
    -- Create damage_reports table
    CREATE TABLE IF NOT EXISTS damage_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        reported_by UUID REFERENCES drivers(id) ON DELETE SET NULL,
        damage_description TEXT NOT NULL,
        damage_severity VARCHAR(20) NOT NULL CHECK (damage_severity IN ('minor', 'moderate', 'severe')),
        damage_location VARCHAR(255),
        photos TEXT[], -- Array of photo URLs
        triposr_task_id VARCHAR(255), -- TripoSR background task ID
        triposr_status VARCHAR(20) DEFAULT 'pending' CHECK (triposr_status IN ('pending', 'processing', 'completed', 'failed')),
        triposr_model_url TEXT, -- URL to generated GLB 3D model
        linked_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
        inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_damage_reports_tenant ON damage_reports(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_vehicle ON damage_reports(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_inspection ON damage_reports(inspection_id);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_work_order ON damage_reports(linked_work_order_id);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_triposr_status ON damage_reports(triposr_status);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_created ON damage_reports(created_at DESC);

    -- Create trigger for updated_at
    CREATE TRIGGER IF NOT EXISTS update_damage_reports_updated_at
        BEFORE UPDATE ON damage_reports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Insert into schema_version to track this change
    INSERT INTO schema_version (version, description)
    VALUES (2, 'Added damage_reports table with TripoSR 3D model integration')
    ON CONFLICT (version) DO NOTHING;
    '''

    try:
        # Connect to database (using environment variables)
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432'),
            database=os.getenv('POSTGRES_DB', 'fleet_db'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', '')
        )

        log('Connected to database successfully')

        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()

        log('damage_reports table created successfully with all indexes and triggers')

        # Verify table creation
        cursor.execute('''
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'damage_reports'
            ORDER BY ordinal_position
        ''')

        columns = cursor.fetchall()
        log(f'Table created with {len(columns)} columns')

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        log(f'ERROR: {str(e)}')
        return False

if __name__ == '__main__':
    log('Agent 1 starting: damage_reports table creation')
    success = create_damage_reports_table()

    if success:
        log('Agent 1 completed successfully')
        with open('$WORK_DIR/results/agent_1_status.txt', 'w') as f:
            f.write('SUCCESS')
    else:
        log('Agent 1 failed')
        with open('$WORK_DIR/results/agent_1_status.txt', 'w') as f:
            f.write('FAILED')
AGENT1EOF

chmod +x $WORK_DIR/agents/agent_1_damage_reports.py
echo 'Agent 1 deployed successfully'
  " --output json | jq -r '.value[0].message'

# ============================================================================
# Step 3: Deploy Agent 2 - PostGIS Migration Agent
# ============================================================================
echo ""
echo "[Step 3/7] Deploying Agent 2: PostGIS Migration..."

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
cat > $WORK_DIR/agents/agent_2_postgis.py << 'AGENT2EOF'
#!/usr/bin/env python3
\"\"\"
Agent 2: PostGIS Migration Agent
Enables PostGIS and adds geographic columns to relevant tables
\"\"\"
import os
import psycopg2
from datetime import datetime

AGENT_NAME = 'postgis_migration'
LOG_FILE = '$WORK_DIR/logs/agent_2.log'

def log(message):
    timestamp = datetime.now().isoformat()
    log_msg = f'[{timestamp}] [{AGENT_NAME}] {message}'
    print(log_msg)
    with open(LOG_FILE, 'a') as f:
        f.write(log_msg + '\n')

def enable_postgis():
    \"\"\"Enable PostGIS extension and add geography columns\"\"\"

    sql = '''
    -- Enable PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;

    -- Add geography column to vehicles table
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

    -- Update existing location data
    UPDATE vehicles
    SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

    -- Create spatial index on vehicles
    CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles USING GIST(location);

    -- Add geography column to facilities table
    ALTER TABLE facilities
    ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

    -- Update existing facility location data
    UPDATE facilities
    SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

    -- Create spatial index on facilities
    CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST(location);

    -- Add geography column to geofences table
    ALTER TABLE geofences
    ADD COLUMN IF NOT EXISTS geometry GEOGRAPHY(POLYGON, 4326);

    -- Update geofences from polygon_coordinates JSONB (if populated)
    -- This is a placeholder - actual conversion depends on JSONB structure

    -- Create spatial index on geofences
    CREATE INDEX IF NOT EXISTS idx_geofences_geometry ON geofences USING GIST(geometry);

    -- Add geography column to charging_stations table
    ALTER TABLE charging_stations
    ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

    -- Update existing charging station location data
    UPDATE charging_stations
    SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location_point IS NULL;

    -- Create spatial index on charging_stations
    CREATE INDEX IF NOT EXISTS idx_charging_stations_location ON charging_stations USING GIST(location_point);

    -- Update schema version
    INSERT INTO schema_version (version, description)
    VALUES (3, 'Enabled PostGIS and added geography columns to vehicles, facilities, geofences, charging_stations')
    ON CONFLICT (version) DO NOTHING;
    '''

    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432'),
            database=os.getenv('POSTGRES_DB', 'fleet_db'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', '')
        )

        log('Connected to database successfully')

        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()

        log('PostGIS enabled and geography columns added successfully')

        # Verify PostGIS version
        cursor.execute('SELECT PostGIS_Version();')
        version = cursor.fetchone()[0]
        log(f'PostGIS version: {version}')

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        log(f'ERROR: {str(e)}')
        return False

if __name__ == '__main__':
    log('Agent 2 starting: PostGIS migration')
    success = enable_postgis()

    if success:
        log('Agent 2 completed successfully')
        with open('$WORK_DIR/results/agent_2_status.txt', 'w') as f:
            f.write('SUCCESS')
    else:
        log('Agent 2 failed')
        with open('$WORK_DIR/results/agent_2_status.txt', 'w') as f:
            f.write('FAILED')
AGENT2EOF

chmod +x $WORK_DIR/agents/agent_2_postgis.py
echo 'Agent 2 deployed successfully'
  " --output json | jq -r '.value[0].message'

# ============================================================================
# Step 4: Deploy Agent 3 - Geospatial Helper Functions
# ============================================================================
echo ""
echo "[Step 4/7] Deploying Agent 3: Geospatial Helper Functions..."

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
cat > $WORK_DIR/agents/agent_3_geofunctions.py << 'AGENT3EOF'
#!/usr/bin/env python3
\"\"\"
Agent 3: Geospatial Helper Functions Agent
Creates PostgreSQL functions for geospatial calculations
\"\"\"
import os
import psycopg2
from datetime import datetime

AGENT_NAME = 'geospatial_functions'
LOG_FILE = '$WORK_DIR/logs/agent_3.log'

def log(message):
    timestamp = datetime.now().isoformat()
    log_msg = f'[{timestamp}] [{AGENT_NAME}] {message}'
    print(log_msg)
    with open(LOG_FILE, 'a') as f:
        f.write(log_msg + '\n')

def create_geospatial_functions():
    \"\"\"Create geospatial helper functions using PostGIS\"\"\"

    sql = '''
    -- Function: Calculate distance between two points (in meters)
    CREATE OR REPLACE FUNCTION calculate_distance(
        lat1 DECIMAL,
        lng1 DECIMAL,
        lat2 DECIMAL,
        lng2 DECIMAL
    ) RETURNS DECIMAL AS \$\$
    DECLARE
        point1 GEOGRAPHY;
        point2 GEOGRAPHY;
    BEGIN
        point1 := ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography;
        point2 := ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography;
        RETURN ST_Distance(point1, point2);
    END;
    \$\$ LANGUAGE plpgsql IMMUTABLE;

    -- Function: Find nearest vehicles to a point
    CREATE OR REPLACE FUNCTION find_nearest_vehicles(
        target_lat DECIMAL,
        target_lng DECIMAL,
        max_distance_meters DECIMAL DEFAULT 10000,
        max_results INTEGER DEFAULT 10
    ) RETURNS TABLE(
        vehicle_id UUID,
        vin VARCHAR,
        make VARCHAR,
        model VARCHAR,
        distance_meters DECIMAL,
        latitude DECIMAL,
        longitude DECIMAL
    ) AS \$\$
    DECLARE
        target_point GEOGRAPHY;
    BEGIN
        target_point := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

        RETURN QUERY
        SELECT
            v.id,
            v.vin,
            v.make,
            v.model,
            ST_Distance(v.location, target_point)::DECIMAL AS distance_meters,
            v.latitude,
            v.longitude
        FROM vehicles v
        WHERE v.location IS NOT NULL
          AND ST_DWithin(v.location, target_point, max_distance_meters)
        ORDER BY ST_Distance(v.location, target_point)
        LIMIT max_results;
    END;
    \$\$ LANGUAGE plpgsql STABLE;

    -- Function: Find nearest facility to a point
    CREATE OR REPLACE FUNCTION find_nearest_facility(
        target_lat DECIMAL,
        target_lng DECIMAL
    ) RETURNS TABLE(
        facility_id UUID,
        facility_name VARCHAR,
        facility_type VARCHAR,
        distance_meters DECIMAL
    ) AS \$\$
    DECLARE
        target_point GEOGRAPHY;
    BEGIN
        target_point := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

        RETURN QUERY
        SELECT
            f.id,
            f.name,
            f.facility_type,
            ST_Distance(f.location, target_point)::DECIMAL AS distance_meters
        FROM facilities f
        WHERE f.location IS NOT NULL
        ORDER BY ST_Distance(f.location, target_point)
        LIMIT 1;
    END;
    \$\$ LANGUAGE plpgsql STABLE;

    -- Function: Check if point is inside geofence
    CREATE OR REPLACE FUNCTION point_in_geofence(
        check_lat DECIMAL,
        check_lng DECIMAL,
        geofence_uuid UUID
    ) RETURNS BOOLEAN AS \$\$
    DECLARE
        check_point GEOGRAPHY;
        fence_geometry GEOGRAPHY;
    BEGIN
        check_point := ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography;

        SELECT geometry INTO fence_geometry
        FROM geofences
        WHERE id = geofence_uuid AND is_active = true;

        IF fence_geometry IS NULL THEN
            RETURN false;
        END IF;

        RETURN ST_Intersects(check_point, fence_geometry);
    END;
    \$\$ LANGUAGE plpgsql STABLE;

    -- Function: Find nearest charging station
    CREATE OR REPLACE FUNCTION find_nearest_charging_station(
        target_lat DECIMAL,
        target_lng DECIMAL,
        station_type_filter VARCHAR DEFAULT NULL
    ) RETURNS TABLE(
        station_id UUID,
        station_name VARCHAR,
        station_type VARCHAR,
        distance_meters DECIMAL,
        is_operational BOOLEAN,
        number_of_ports INTEGER,
        power_output_kw DECIMAL
    ) AS \$\$
    DECLARE
        target_point GEOGRAPHY;
    BEGIN
        target_point := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

        RETURN QUERY
        SELECT
            cs.id,
            cs.station_name,
            cs.station_type,
            ST_Distance(cs.location_point, target_point)::DECIMAL AS distance_meters,
            cs.is_operational,
            cs.number_of_ports,
            cs.power_output_kw
        FROM charging_stations cs
        WHERE cs.location_point IS NOT NULL
          AND cs.is_operational = true
          AND (station_type_filter IS NULL OR cs.station_type = station_type_filter)
        ORDER BY ST_Distance(cs.location_point, target_point)
        LIMIT 5;
    END;
    \$\$ LANGUAGE plpgsql STABLE;

    -- Update schema version
    INSERT INTO schema_version (version, description)
    VALUES (4, 'Added geospatial helper functions: distance calculation, nearest vehicle/facility/charging station, geofence checking')
    ON CONFLICT (version) DO NOTHING;
    '''

    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432'),
            database=os.getenv('POSTGRES_DB', 'fleet_db'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', '')
        )

        log('Connected to database successfully')

        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()

        log('Geospatial helper functions created successfully')

        # List created functions
        cursor.execute('''
            SELECT routine_name, routine_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
              AND routine_name LIKE '%distance%' OR routine_name LIKE '%nearest%' OR routine_name LIKE '%geofence%'
            ORDER BY routine_name
        ''')

        functions = cursor.fetchall()
        log(f'Created {len(functions)} geospatial functions')

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        log(f'ERROR: {str(e)}')
        return False

if __name__ == '__main__':
    log('Agent 3 starting: Geospatial helper functions creation')
    success = create_geospatial_functions()

    if success:
        log('Agent 3 completed successfully')
        with open('$WORK_DIR/results/agent_3_status.txt', 'w') as f:
            f.write('SUCCESS')
    else:
        log('Agent 3 failed')
        with open('$WORK_DIR/results/agent_3_status.txt', 'w') as f:
            f.write('FAILED')
AGENT3EOF

chmod +x $WORK_DIR/agents/agent_3_geofunctions.py
echo 'Agent 3 deployed successfully'
  " --output json | jq -r '.value[0].message'

# ============================================================================
# Step 5: Deploy Agent 4 - Database Validation Agent
# ============================================================================
echo ""
echo "[Step 5/7] Deploying Agent 4: Database Validation..."

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
cat > $WORK_DIR/agents/agent_4_validation.py << 'AGENT4EOF'
#!/usr/bin/env python3
\"\"\"
Agent 4: Database Validation Agent
Validates all database changes and generates report
\"\"\"
import os
import psycopg2
import json
from datetime import datetime

AGENT_NAME = 'database_validator'
LOG_FILE = '$WORK_DIR/logs/agent_4.log'
REPORT_FILE = '$WORK_DIR/results/validation_report.json'

def log(message):
    timestamp = datetime.now().isoformat()
    log_msg = f'[{timestamp}] [{AGENT_NAME}] {message}'
    print(log_msg)
    with open(LOG_FILE, 'a') as f:
        f.write(log_msg + '\n')

def validate_database():
    \"\"\"Validate all database changes\"\"\"

    validation_results = {
        'timestamp': datetime.now().isoformat(),
        'checks': [],
        'overall_status': 'PENDING'
    }

    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=os.getenv('POSTGRES_PORT', '5432'),
            database=os.getenv('POSTGRES_DB', 'fleet_db'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', '')
        )

        log('Connected to database successfully')
        cursor = conn.cursor()

        # Check 1: damage_reports table exists
        cursor.execute(\"\"\"
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'damage_reports'
            )
        \"\"\")
        damage_reports_exists = cursor.fetchone()[0]
        validation_results['checks'].append({
            'check': 'damage_reports table exists',
            'status': 'PASS' if damage_reports_exists else 'FAIL',
            'details': f'Table exists: {damage_reports_exists}'
        })
        log(f'Check: damage_reports table - {'PASS' if damage_reports_exists else 'FAIL'}')

        # Check 2: PostGIS extension enabled
        cursor.execute(\"\"\"
            SELECT EXISTS (
                SELECT FROM pg_extension WHERE extname = 'postgis'
            )
        \"\"\")
        postgis_enabled = cursor.fetchone()[0]
        validation_results['checks'].append({
            'check': 'PostGIS extension enabled',
            'status': 'PASS' if postgis_enabled else 'FAIL',
            'details': f'PostGIS enabled: {postgis_enabled}'
        })
        log(f'Check: PostGIS extension - {'PASS' if postgis_enabled else 'FAIL'}')

        # Check 3: Geography columns added
        geography_checks = []
        for table, column in [('vehicles', 'location'), ('facilities', 'location'),
                              ('charging_stations', 'location_point'), ('geofences', 'geometry')]:
            cursor.execute(f\"\"\"
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name = '{table}'
                    AND column_name = '{column}'
                )
            \"\"\")
            exists = cursor.fetchone()[0]
            geography_checks.append({'table': table, 'column': column, 'exists': exists})

        all_geography_columns = all(check['exists'] for check in geography_checks)
        validation_results['checks'].append({
            'check': 'Geography columns added',
            'status': 'PASS' if all_geography_columns else 'FAIL',
            'details': geography_checks
        })
        log(f'Check: Geography columns - {'PASS' if all_geography_columns else 'FAIL'}')

        # Check 4: Spatial indexes created
        cursor.execute(\"\"\"
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%_location%'
        \"\"\")
        spatial_indexes = [row[0] for row in cursor.fetchall()]
        has_spatial_indexes = len(spatial_indexes) >= 3
        validation_results['checks'].append({
            'check': 'Spatial indexes created',
            'status': 'PASS' if has_spatial_indexes else 'FAIL',
            'details': f'Found {len(spatial_indexes)} spatial indexes: {spatial_indexes}'
        })
        log(f'Check: Spatial indexes - {'PASS' if has_spatial_indexes else 'FAIL'}')

        # Check 5: Geospatial functions created
        cursor.execute(\"\"\"
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND (routine_name LIKE '%distance%' OR routine_name LIKE '%nearest%' OR routine_name LIKE '%geofence%')
        \"\"\")
        geo_functions = [row[0] for row in cursor.fetchall()]
        has_geo_functions = len(geo_functions) >= 4
        validation_results['checks'].append({
            'check': 'Geospatial functions created',
            'status': 'PASS' if has_geo_functions else 'FAIL',
            'details': f'Found {len(geo_functions)} functions: {geo_functions}'
        })
        log(f'Check: Geospatial functions - {'PASS' if has_geo_functions else 'FAIL'}')

        # Check 6: Schema version updated
        cursor.execute(\"\"\"
            SELECT version, description
            FROM schema_version
            ORDER BY version DESC
        \"\"\")
        versions = cursor.fetchall()
        latest_version = versions[0][0] if versions else 0
        validation_results['checks'].append({
            'check': 'Schema version updated',
            'status': 'PASS' if latest_version >= 2 else 'FAIL',
            'details': f'Latest version: {latest_version}, All versions: {versions}'
        })
        log(f'Check: Schema version - {'PASS' if latest_version >= 2 else 'FAIL'}')

        # Overall status
        all_passed = all(check['status'] == 'PASS' for check in validation_results['checks'])
        validation_results['overall_status'] = 'SUCCESS' if all_passed else 'PARTIAL'

        cursor.close()
        conn.close()

        # Save report
        with open(REPORT_FILE, 'w') as f:
            json.dump(validation_results, f, indent=2)

        log(f'Validation complete: {validation_results['overall_status']}')
        return all_passed

    except Exception as e:
        log(f'ERROR: {str(e)}')
        validation_results['overall_status'] = 'FAILED'
        validation_results['error'] = str(e)
        with open(REPORT_FILE, 'w') as f:
            json.dump(validation_results, f, indent=2)
        return False

if __name__ == '__main__':
    log('Agent 4 starting: Database validation')
    success = validate_database()

    if success:
        log('Agent 4 completed successfully - All checks passed')
        with open('$WORK_DIR/results/agent_4_status.txt', 'w') as f:
            f.write('SUCCESS')
    else:
        log('Agent 4 completed with warnings - Some checks failed')
        with open('$WORK_DIR/results/agent_4_status.txt', 'w') as f:
            f.write('PARTIAL')
AGENT4EOF

chmod +x $WORK_DIR/agents/agent_4_validation.py
echo 'Agent 4 deployed successfully'
  " --output json | jq -r '.value[0].message'

# ============================================================================
# Step 6: Create Database Connection Configuration
# ============================================================================
echo ""
echo "[Step 6/7] Creating database connection configuration..."

# Get AKS credentials
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster --overwrite-existing

# Get PostgreSQL service details
POSTGRES_HOST=\$(kubectl get svc postgres -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
cat > $WORK_DIR/.env << 'ENVEOF'
# Database connection configuration
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=5432
POSTGRES_DB=fleet_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=fleet_password
ENVEOF

echo 'Database configuration created'
  " --output json | jq -r '.value[0].message'

# ============================================================================
# Step 7: Execute All Agents in Sequence
# ============================================================================
echo ""
echo "[Step 7/7] Executing all agents in sequence..."

az vm run-command invoke \
  --resource-group "$AZURE_RG" \
  --name "$AZURE_VM_NAME" \
  --command-id RunShellScript \
  --scripts "
    cd $WORK_DIR

    # Load environment variables
    export \$(cat .env | xargs)

    # Execute agents in sequence
    echo '=== Executing Agent 1: damage_reports table creation ==='
    python3 agents/agent_1_damage_reports.py

    echo ''
    echo '=== Executing Agent 2: PostGIS migration ==='
    python3 agents/agent_2_postgis.py

    echo ''
    echo '=== Executing Agent 3: Geospatial functions ==='
    python3 agents/agent_3_geofunctions.py

    echo ''
    echo '=== Executing Agent 4: Database validation ==='
    python3 agents/agent_4_validation.py

    echo ''
    echo '=== All agents executed ==='
    echo ''

    # Display results
    echo 'Agent Execution Results:'
    echo '========================'
    for i in 1 2 3 4; do
        if [ -f results/agent_\${i}_status.txt ]; then
            status=\$(cat results/agent_\${i}_status.txt)
            echo \"Agent \${i}: \${status}\"
        fi
    done

    echo ''
    echo 'Validation Report:'
    echo '=================='
    if [ -f results/validation_report.json ]; then
        cat results/validation_report.json | jq '.'
    fi

    echo ''
    echo 'Deployment logs available at: $WORK_DIR/logs/'
  " --output json | jq -r '.value[0].message'

echo ""
echo "============================================================================"
echo "Deployment Complete!"
echo "============================================================================"
echo ""
echo "Next steps:"
echo "1. Review validation report on Azure VM: $WORK_DIR/results/validation_report.json"
echo "2. Check agent logs: $WORK_DIR/logs/"
echo "3. Update application code to use new database features"
echo "4. Run integration tests"
echo ""
echo "To retrieve results from Azure VM:"
echo "  az vm run-command invoke --resource-group $AZURE_RG --name $AZURE_VM_NAME \\"
echo "    --command-id RunShellScript --scripts 'cat $WORK_DIR/results/validation_report.json'"
echo ""
