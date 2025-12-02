# Fleet Application - Current Test Data Coverage Report
## Generated: 2025-11-13 @ 21:50 UTC

---

## ✅ What We Currently Have

### Data Counts
- **Users:** 140 total
- **Vehicles:** 200 total
- **Work Orders:** 413 total
- **Facilities:** Present
- **Fuel Transactions:** Present
- **Routes:** Present
- **Notifications:** Present

### Status Coverage

#### ✅ Vehicle Statuses (3/5 covered - 60%)
- ✅ `active` - 74 vehicles
- ✅ `maintenance` - 57 vehicles
- ✅ `out_of_service` - 69 vehicles
- ❌ `sold` - **MISSING**
- ❌ `retired` - **MISSING**

#### ✅ Work Order Statuses (3/5 covered - 60%)
- ✅ `open` - 141 orders
- ✅ `in_progress` - 137 orders
- ✅ `completed` - 135 orders
- ❌ `on_hold` - **MISSING**
- ❌ `cancelled` - **MISSING**

#### ✅ Work Order Priorities (4/4 covered - 100%)
- ✅ `low` - 101 orders
- ✅ `medium` - 111 orders
- ✅ `high` - 103 orders
- ✅ `critical` - 98 orders
- **COMPLETE** ✨

#### ✅ User Roles (4/5 covered - 80%)
- ✅ `admin` - 3 users
- ✅ `fleet_manager` - 6 users
- ✅ `driver` - 116 users
- ✅ `technician` - 15 users
- ❌ `viewer` - **MISSING**

#### ✅ Vehicle Types (5/14 covered - 36%)
- ✅ `Sedan` - 46 vehicles
- ✅ `Pickup Truck` - 67 vehicles
- ✅ `Cargo Van` - 33 vehicles
- ✅ `Box Truck` - 16 vehicles
- ✅ `Semi-Truck` - 38 vehicles
- ❌ `SUV` - **MISSING**
- ❌ `Passenger Van` - **MISSING**
- ❌ `Dump Truck` - **MISSING**
- ❌ `Flatbed` - **MISSING**
- ❌ `Refrigerated Truck` - **MISSING**
- ❌ `Service Vehicle` - **MISSING**
- ❌ `Tanker` - **MISSING**
- ❌ `Tow Truck` - **MISSING**
- ❌ `Bus` - **MISSING**

#### ✅ Fuel Types (3/6 covered - 50%)
- ✅ `Gasoline` - 63 vehicles
- ✅ `Diesel` - 105 vehicles
- ✅ `Electric` - 32 vehicles
- ❌ `Hybrid` - **MISSING**
- ❌ `CNG` - **MISSING**
- ❌ `Propane` - **MISSING**

---

## ❌ Critical Missing Coverage

### High Priority Gaps

1. **Vehicle Statuses** - Missing 2/5 (40%)
   - Need `sold` status examples
   - Need `retired` status examples

2. **Work Order Statuses** - Missing 2/5 (40%)
   - Need `on_hold` examples
   - Need `cancelled` examples

3. **Vehicle Types** - Missing 9/14 (64%)
   - Need specialty vehicle types (tanker, tow truck, refrigerated, etc.)
   - Need commercial vehicle types (bus, dump truck, flatbed)

4. **Fuel Types** - Missing 3/6 (50%)
   - Need alternative fuel examples (CNG, Propane, Hybrid)

5. **User Roles** - Missing 1/5 (20%)
   - Need `viewer` role examples

### Additional Missing Data (Need to Check)

**Driver Statuses:**
- active
- on_leave
- suspended
- terminated
- ⚠️ Need to verify all are present

**Route Statuses:**
- planned
- in_progress
- completed
- delayed
- cancelled
- rerouted
- ⚠️ Need to verify all are present

**Inspection Types:**
- pre_trip
- post_trip
- DOT
- state
- safety
- annual
- ⚠️ Need to verify all are present

**Safety Incident Types:**
- accident
- injury
- near_miss
- property_damage
- citation
- equipment_failure
- ⚠️ Need to verify all are present

**Safety Incident Severities:**
- minor
- moderate
- severe
- critical
- fatal
- ⚠️ Need to verify all are present

---

## 📋 Missing Edge Cases

### Boundary Conditions
- ❌ Vehicle with 0 odometer (brand new)
- ❌ Vehicle with >999,999 miles (high mileage)
- ❌ Work order with $0 cost
- ❌ Work order with $100,000+ cost
- ❌ Work order open for 365+ days
- ❌ Route with 0 miles
- ❌ Fuel transaction at $0 (test/error case)
- ❌ Fuel transaction >$5000 (bulk purchase)

### Null/Optional Fields
- ❌ Vehicle with NULL VIN
- ❌ Vehicle with NULL license_plate
- ❌ Driver with no certifications
- ❌ Route with no driver assigned
- ❌ Route with no vehicle assigned
- ❌ Work order with no technician assigned

### Special States
- ❌ Expired driver licenses
- ❌ Expired vehicle registrations
- ❌ Overdue maintenance (365+ days)
- ❌ Failed vehicle inspections
- ❌ Out-of-service orders
- ❌ Open safety incidents

---

## 🎯 Action Plan to Achieve 100% Coverage

### Step 1: Add Missing Status Values (10 minutes)

**SQL to add missing data:**

```sql
-- Add sold vehicles
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer)
VALUES
  (1, '1HGCM82633A123456', 'Honda', 'Accord', 2020, 'Sedan', 'Gasoline', 'sold', 'SOLD-001', 65000),
  (1, '2T1BURHE0FC123457', 'Toyota', 'Corolla', 2019, 'Sedan', 'Gasoline', 'sold', 'SOLD-002', 72000);

-- Add retired vehicles
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer)
VALUES
  (1, '1FTFW1ET5BFA98765', 'Ford', 'F-150', 2010, 'Pickup Truck', 'Gasoline', 'retired', 'RETD-001', 285000),
  (1, '1GNSK7E04AR987654', 'Chevrolet', 'Suburban', 2009, 'SUV', 'Gasoline', 'retired', 'RETD-002', 310000);

-- Add on_hold work orders
UPDATE work_orders SET status = 'on_hold' WHERE work_order_id IN (
  SELECT work_order_id FROM work_orders WHERE status = 'open' LIMIT 15
);

-- Add cancelled work orders
UPDATE work_orders SET status = 'cancelled' WHERE work_order_id IN (
  SELECT work_order_id FROM work_orders WHERE status = 'open' LIMIT 15
);

-- Add viewer role users
INSERT INTO users (tenant_id, email, name, role, status)
VALUES
  (1, 'viewer1@fleet.local', 'Viewer User 1', 'viewer', 'active'),
  (1, 'viewer2@fleet.local', 'Viewer User 2', 'viewer', 'active');
```

### Step 2: Add Missing Vehicle Types (15 minutes)

```sql
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer)
VALUES
  -- SUV
  (1, '5TDJKRFH1LS123456', 'Toyota', '4Runner', 2022, 'SUV', 'Gasoline', 'active', 'SUV-001', 12000),
  -- Passenger Van
  (1, '2C4RC1CG6HR123456', 'Chrysler', 'Pacifica', 2021, 'Passenger Van', 'Gasoline', 'active', 'PVAN-001', 25000),
  -- Dump Truck
  (1, '1FDUF5HT4GEA12345', 'Ford', 'F-550', 2018, 'Dump Truck', 'Diesel', 'active', 'DUMP-001', 65000),
  -- Flatbed
  (1, '1GC4K0CG9FF123456', 'Chevrolet', 'Silverado 5500', 2020, 'Flatbed', 'Diesel', 'active', 'FLAT-001', 42000),
  -- Refrigerated Truck
  (1, '1FUJGHDV8LLBR1234', 'Freightliner', 'M2-106', 2021, 'Refrigerated Truck', 'Diesel', 'active', 'REEFER-001', 38000),
  -- Service Vehicle
  (1, '1FTFW1RG4DFC12345', 'Ford', 'F-250', 2019, 'Service Vehicle', 'Diesel', 'active', 'SVC-001', 55000),
  -- Tanker
  (1, '1XP5DB9X8FD123456', 'Peterbilt', '579', 2020, 'Tanker', 'Diesel', 'active', 'TANK-001', 125000),
  -- Tow Truck
  (1, '1FDAF57P05EE12345', 'Ford', 'F-550', 2018, 'Tow Truck', 'Diesel', 'active', 'TOW-001', 82000),
  -- Bus
  (1, '4UZABRDC3GCZN1234', 'Freightliner', 'MT45', 2019, 'Bus', 'Diesel', 'active', 'BUS-001', 95000);
```

### Step 3: Add Missing Fuel Types (5 minutes)

```sql
-- Update some existing vehicles to hybrid/CNG/Propane
UPDATE vehicles SET fuel_type = 'Hybrid' WHERE vehicle_id IN (
  SELECT vehicle_id FROM vehicles WHERE fuel_type = 'Gasoline' AND vehicle_type = 'Sedan' LIMIT 5
);

UPDATE vehicles SET fuel_type = 'CNG' WHERE vehicle_id IN (
  SELECT vehicle_id FROM vehicles WHERE fuel_type = 'Gasoline' AND vehicle_type = 'Box Truck' LIMIT 3
);

UPDATE vehicles SET fuel_type = 'Propane' WHERE vehicle_id IN (
  SELECT vehicle_id FROM vehicles WHERE fuel_type = 'Gasoline' AND vehicle_type = 'Pickup Truck' LIMIT 2
);
```

### Step 4: Add Edge Cases (20 minutes)

```sql
-- Brand new vehicle (0 miles)
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer)
VALUES (1, '5YJ3E1EA8MF000001', 'Tesla', 'Model 3', 2025, 'Sedan', 'Electric', 'active', 'NEW-001', 0);

-- High mileage vehicle
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer)
VALUES (1, '1FTPW14V98KC99999', 'Ford', 'F-150', 2008, 'Pickup Truck', 'Gasoline', 'active', 'HIGH-001', 999999);

-- $0 work order
INSERT INTO work_orders (tenant_id, vehicle_id, type, status, priority, description, cost)
SELECT 1, vehicle_id, 'Inspection', 'completed', 'low', 'Free inspection (warranty)', 0
FROM vehicles LIMIT 1;

-- Very expensive work order
INSERT INTO work_orders (tenant_id, vehicle_id, type, status, priority, description, cost)
SELECT 1, vehicle_id, 'Engine Rebuild', 'completed', 'critical', 'Complete engine replacement', 125000
FROM vehicles WHERE vehicle_type = 'Semi-Truck' LIMIT 1;
```

---

## 📊 Progress Tracking

### Coverage Status
| Category | Current | Target | Progress |
|----------|---------|--------|----------|
| Vehicle Statuses | 60% (3/5) | 100% | 🟨 |
| Work Order Statuses | 60% (3/5) | 100% | 🟨 |
| Work Order Priorities | 100% (4/4) | 100% | ✅ |
| User Roles | 80% (4/5) | 100% | 🟩 |
| Vehicle Types | 36% (5/14) | 100% | 🟥 |
| Fuel Types | 50% (3/6) | 100% | 🟨 |
| **Overall** | **~60%** | **100%** | **🟨** |

### Next Steps
1. ✅ Run this coverage report
2. ⏳ Execute SQL to add missing status values (10 min)
3. ⏳ Execute SQL to add missing vehicle types (15 min)
4. ⏳ Execute SQL to add missing fuel types (5 min)
5. ⏳ Execute SQL to add edge cases (20 min)
6. ⏳ Verify 100% coverage achieved

**Estimated Time to 100% Coverage:** 50 minutes
