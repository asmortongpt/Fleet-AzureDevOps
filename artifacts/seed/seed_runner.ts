
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manualy
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log('Loading .env from', envPath);
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match && !line.trim().startsWith('#')) {
            const key = match[1];
            let value = match[2] || '';
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

// Initial Configuration
const DB_CONFIG = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.VITE_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.VITE_DB_PORT || process.env.DB_PORT || '5432'),
        database: process.env.VITE_DB_NAME || process.env.DB_NAME || 'fleet_db',
        user: process.env.VITE_DB_USER || process.env.DB_USER || 'andrewmorton',
        password: process.env.VITE_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    };

async function seed() {
    console.log('🌱 Starting deterministic seed...');

    const pool = new Pool(DB_CONFIG);
    const client = await pool.connect();

    try {
        // Read the definition file
        const dataPath = path.join(__dirname, 'seed_data_definition.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const data = JSON.parse(rawData);

        await client.query('BEGIN');

        // 1. Tenants
        for (const tenant of data.tenants) {
            console.log(`Processing tenant: ${tenant.name}`);
            const domain = tenant.domain || `${tenant.slug}.com`;
            const settings = JSON.stringify({ plan: tenant.plan, company: { name: tenant.name } });
            await client.query(`
        INSERT INTO tenants (id, name, domain, slug, settings, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          domain = EXCLUDED.domain,
          slug = EXCLUDED.slug,
          settings = EXCLUDED.settings;
      `, [tenant.id, tenant.name, domain, tenant.slug, settings]);
        }

        // 2. Users
        try {
            const enumRes = await client.query("SELECT unnest(enum_range(NULL::user_role))");
            console.log('Valid user_role values:', enumRes.rows.map(r => r.unnest));
        } catch (e) {
            console.warn('Could not fetch user_role enum values (maybe not an enum?):', e.message);
        }

        for (const user of data.users) {
            // Resolve tenant_id from slug
            const tenantRes = await client.query('SELECT id FROM tenants WHERE slug = $1', [user.tenant_slug]);
            const tenantId = tenantRes.rows[0]?.id;

            if (!tenantId) {
                console.warn(`Skipping user ${user.email} - tenant not found for slug ${user.tenant_slug}`);
                continue;
            }

            console.log(`Processing user: ${user.email}`);
            await client.query(`
            INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
            ON CONFLICT (email) DO UPDATE SET
                role = EXCLUDED.role,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                phone = EXCLUDED.phone;
        `, [tenantId, user.email, user.password_hash, user.first_name, user.last_name, user.role, user.phone]);
        }

        // ... (skipping vehicles block which is fine) ...

        // 5. Parts Catalog (Inventory Items)
        if (data.parts) {
            console.log(`Processing ${data.parts.length} parts...`);
            for (const part of data.parts) {
                const tenantRes = await client.query('SELECT id FROM tenants WHERE slug = $1', [part.tenant_slug]);
                const tenantId = tenantRes.rows[0]?.id;

                // Manual Upsert for Parts
                const existingPart = await client.query(
                    'SELECT id FROM inventory_items WHERE tenant_id = $1 AND part_number = $2',
                    [tenantId, part.part_number]
                );

                if (existingPart.rows.length > 0) {
                    await client.query(`
                        UPDATE inventory_items SET 
                            quantity_on_hand = $1, 
                            unit_cost = $2,
                            updated_at = NOW()
                        WHERE id = $3
                     `, [part.quantity_on_hand, part.unit_cost, existingPart.rows[0].id]);
                } else {
                    await client.query(`
                       INSERT INTO inventory_items (
                            tenant_id, part_number, sku, name, description, category, manufacturer,
                            unit_cost, list_price, quantity_on_hand, minimum_quantity, reorder_quantity,
                            bin_location, compatible_makes, compatible_models, compatible_years,
                            created_at
                       )
                       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
                    `, [
                        tenantId, part.part_number, part.name, part.description, part.category, part.manufacturer,
                        part.unit_cost, part.list_price, part.quantity_on_hand, part.minimum_quantity, part.reorder_quantity,
                        part.bin_location,
                        part.compatible_makes,
                        part.compatible_models,
                        part.compatible_years
                    ]);
                }
            }
        }

        // 3. Vehicles
        try {
            const indices = await client.query("SELECT * FROM pg_indexes WHERE tablename = 'vehicles'");
            console.log('Vehicle Indices:', indices.rows.map(r => r.indexdef));
        } catch (e) { console.log('Index check failed', e.message); }

        for (const vehicle of data.vehicles) {
            // Resolve tenant_id from slug
            const tenantRes = await client.query('SELECT id FROM tenants WHERE slug = $1', [vehicle.tenant_slug]);
            const tenantId = tenantRes.rows[0]?.id;

            if (!tenantId) {
                console.warn(`Skipping vehicle ${vehicle.vin} - tenant not found for slug ${vehicle.tenant_slug}`);
                continue;
            }

            // Manual upsert since unique constraint on VIN is missing
            const existing = await client.query('SELECT id FROM vehicles WHERE vin = $1', [vehicle.vin]);

            if (existing.rows.length > 0) {
                console.log(`Updating existing vehicle: ${vehicle.vin}`);
                await client.query(`
                    UPDATE vehicles SET 
                        odometer = $1,
                        status = $2,
                        updated_at = NOW()
                    WHERE vin = $3
                `, [vehicle.odometer, vehicle.status, vehicle.vin]);
            } else {
                console.log(`Inserting new vehicle: ${vehicle.vin}`);
                const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                const number = `V-${vehicle.vin.slice(-6)}`;
                await client.query(`
                    INSERT INTO vehicles (
                        tenant_id, vin, name, number, make, model, year, license_plate, 
                        type, status, fuel_type, odometer, created_at,
                        
                        -- Specs
                        color, transmission, drive_train, engine_summary,
                        gross_vehicle_weight_rating_lbs, curb_weight_lbs,
                        length_inches, width_inches, height_inches,
                        wheelbase_inches, towing_capacity_lbs, payload_capacity_lbs,
                        
                        -- Capabilities
                        tank_capacity_gal, battery_capacity_kwh, range_miles,
                        
                        -- Lifecycle
                        purchase_date, purchase_price, current_value, 
                        warranty_expiration_date,
                        
                        -- Registration
                        registration_expiration_date, insurance_provider, insurance_policy_number
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, 
                        $9, $10, $11, $12, NOW(),
                        
                        $13, $14, $15, $16,
                        $17, $18,
                        $19, $20, $21,
                        $22, $23, $24,
                        
                        $25, $26, $27,
                        
                        $28, $29, $30,
                        $31,
                        
                        $32, $33, $34
                    )
                `, [
                    tenantId, vehicle.vin, name, number, vehicle.make, vehicle.model, vehicle.year,
                    vehicle.license_plate, vehicle.type, vehicle.status, vehicle.fuel_type, vehicle.odometer,

                    vehicle.color, vehicle.transmission, vehicle.drive_train, vehicle.engine_summary,
                    vehicle.gross_vehicle_weight_rating_lbs, vehicle.curb_weight_lbs,
                    vehicle.length_inches, vehicle.width_inches, vehicle.height_inches,
                    vehicle.wheelbase_inches, vehicle.towing_capacity_lbs, vehicle.payload_capacity_lbs,

                    vehicle.tank_capacity_gal, vehicle.battery_capacity_kwh, vehicle.range_miles,

                    vehicle.purchase_date, vehicle.purchase_price, vehicle.current_value,
                    vehicle.warranty_expiration_date,

                    vehicle.registration_expiration_date, vehicle.insurance_provider, vehicle.insurance_policy_number
                ]);
            }
        }

        // --- PRE-FETCH LOOKUPS ---
        const userMap = new Map(); // email -> id
        const vehicleMap = new Map(); // vin -> id
        const driverMap = new Map(); // email -> driver_id

        const existingUsers = await client.query('SELECT email, id FROM users');
        existingUsers.rows.forEach(row => userMap.set(row.email, row.id));

        const existingVehicles = await client.query('SELECT vin, id FROM vehicles');
        existingVehicles.rows.forEach(row => vehicleMap.set(row.vin, row.id));

        // 4. Facilities
        for (const facility of data.facilities) {
            console.log(`Processing facility: ${facility.name}`);
            const tenantRes = await client.query('SELECT id FROM tenants WHERE slug = $1', [facility.tenant_slug]);
            const tenantId = tenantRes.rows[0]?.id;

            // Generate code from name (e.g. Capital Tech HQ -> CTHQ)
            const code = facility.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 10);
            // Default location for Tallahassee
            const lat = 30.4383;
            const lng = -84.2807;

            await client.query(`
                INSERT INTO facilities (id, tenant_id, name, code, type, address, city, state, zip_code, capacity, latitude, longitude, is_active, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
             `, [facility.id, tenantId, facility.name, code, facility.type, facility.address, facility.city, facility.state, facility.zip_code, facility.capacity, lat, lng]);
        }

        // 5. Drivers (Create from Users marked is_driver)
        for (const user of data.users) {
            if (user.is_driver) {
                const userId = userMap.get(user.email);
                const tenantRes = await client.query('SELECT id FROM tenants WHERE slug = $1', [user.tenant_slug]);
                const tenantId = tenantRes.rows[0]?.id;

                if (userId && tenantId) {
                    // Deterministic License: first letter of last name + random
                    const license = `D-${user.last_name.charAt(0)}${user.first_name.charAt(0)}-${userId.substring(0, 6).toUpperCase()}`;
                    const expiry = new Date(Date.now() + 31536000000 + Math.random() * 94608000000).toISOString(); // 1-4 years

                    // Upsert driver
                    const res = await client.query(`
                        INSERT INTO drivers (
                            tenant_id, user_id, license_number, status, 
                            first_name, last_name, email, phone, license_expiry_date,
                            created_at
                        )
                        VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, NOW())
                        ON CONFLICT (tenant_id, license_number) DO UPDATE SET 
                            status = 'active',
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name,
                            phone = EXCLUDED.phone
                        RETURNING id;
                     `, [tenantId, userId, license, user.first_name, user.last_name, user.email, user.phone, expiry]);

                    // If conflict doesn't act RETURNING might be empty if no update happened or driver exists?
                    // Actually ON CONFLICT DO UPDATE ... RETURNING works.
                    if (res.rows[0]) driverMap.set(user.email, res.rows[0].id);
                    else {
                        // Fetch if needed
                        const d = await client.query('SELECT id FROM drivers WHERE user_id = $1', [userId]);
                        if (d.rows[0]) driverMap.set(user.email, d.rows[0].id);
                    }
                }
            }
        }

        // 6. Fuel Transactions
        if (data.fuel_transactions) {
            console.log(`Processing ${data.fuel_transactions.length} fuel transactions...`);
            const transactionChunks = []; // Could batch insert
            for (const tx of data.fuel_transactions) {
                const vId = vehicleMap.get(tx.vehicle_vin);
                if (vId) {
                    const totalCost = (parseFloat(tx.gallons) * parseFloat(tx.price_per_gallon)).toFixed(2);
                    await client.query(`
                        INSERT INTO fuel_transactions (
                            tenant_id, vehicle_id, gallons, cost_per_gallon, total_cost, 
                            fuel_type, location, odometer, transaction_date
                        )
                        SELECT id, $2, $3, $4, $5, $6, $7, $8, $9 FROM tenants WHERE slug = $1
                     `, [tx.tenant_slug, vId, tx.gallons, tx.price_per_gallon, totalCost, tx.fuel_type, tx.location, tx.odometer, tx.date]);
                }
            }
        }

        // 7. Maintenance
        if (data.maintenance_schedules) {
            for (const sch of data.maintenance_schedules) {
                const vId = vehicleMap.get(sch.vehicle_vin);
                if (vId) {
                    await client.query(`
                        INSERT INTO maintenance_schedules(tenant_id, vehicle_id, name, type, interval_miles, last_service_date, last_service_mileage, created_at)
                        SELECT id, $2, $3, $4, $5, $6, $7, NOW() FROM tenants WHERE slug = $1
                        `, [sch.tenant_slug, vId, sch.name, sch.type, sch.interval_miles, sch.last_service_date, sch.last_service_mileage]);
                }
            }
        }

        // 8. Work Orders
        if (data.work_orders) {
            for (const wo of data.work_orders) {
                const vId = vehicleMap.get(wo.vehicle_vin);
                if (vId) {
                    const woNum = `WO - ${Math.floor(Math.random() * 100000)}`;
                    await client.query(`
                        INSERT INTO work_orders (tenant_id, vehicle_id, number, title, type, priority, status, description, created_at)
                        SELECT id, $2, $3, $4, $5, $6, $7, $8, $9 FROM tenants WHERE slug = $1
                        ON CONFLICT (tenant_id, number) DO NOTHING
                    `, [wo.tenant_slug, vId, woNum, wo.title, wo.type, wo.priority, wo.status, wo.description, wo.reported_at]);
                }
            }
        }

        // 9. Incidents
        if (data.incidents) {
            for (const inc of data.incidents) {
                const vId = vehicleMap.get(inc.vehicle_vin);
                const dId = driverMap.get(inc.driver_email);
                if (vId) {
                    const incNum = `INC-${Math.floor(Math.random() * 100000)}`;
                    await client.query(`
                        INSERT INTO incidents(tenant_id, vehicle_id, driver_id, number, incident_date, type, severity, description, status, created_at)
                        SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, NOW() FROM tenants WHERE slug = $1
                        ON CONFLICT(tenant_id, number) DO NOTHING
                        `, [inc.tenant_slug, vId, dId || null, incNum, inc.date, inc.type, inc.severity, inc.description, inc.status]);
                }
            }
        }
        await client.query('COMMIT');
        console.log('✅ Seed completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
