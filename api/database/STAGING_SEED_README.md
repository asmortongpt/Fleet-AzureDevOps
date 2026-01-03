# Capital Tech Alliance - Staging Database Seed Data

This directory contains comprehensive seed data scripts for populating the staging database with realistic data for **Capital Tech Alliance**, a technology services company based in Tallahassee, Florida.

## 📋 Overview

The seed data creates a complete fleet management system with:
- **1 Tenant**: Capital Tech Alliance
- **36 Users**: Admin, fleet managers, technicians, and drivers
- **3 Facilities**: HQ Fleet Center, Northside Depot, and Southside Service Center (all in Tallahassee)
- **30 Drivers**: With valid FL licenses and CDL certifications
- **50 Vehicles**: Diverse fleet including:
  - 15 Trucks (Ford F-150, Chevrolet Silverado, Ram, GMC, Toyota Tundra, F-150 Lightning)
  - 10 Vans (Mercedes Sprinter, Ford Transit, Chevrolet Express, Ram ProMaster)
  - 10 Sedans (Toyota Camry, Honda Accord, Nissan Altima, Tesla Model 3 & S, Ford Fusion)
  - 10 SUVs (Honda CR-V, Toyota RAV4, Ford Explorer, Chevrolet Tahoe, Tesla Model X, etc.)
  - 5 Heavy Equipment (Caterpillar excavators, John Deere backhoe, Komatsu, Volvo)
- **8 Vendors**: Local Tallahassee area suppliers and service providers
- **Work Orders**: Sample maintenance and repair orders
- **Maintenance Schedules**: Preventive maintenance tracking
- **Fuel Transactions**: Recent fuel purchase history
- **Routes**: Planned and completed delivery routes
- **Geofences**: Service area boundaries
- **EV Charging Infrastructure**: 3 charging stations with session history

## 🗂️ Files

1. **seed_capital_tech_alliance.sql** (Part 1)
   - Tenant setup
   - User accounts (admin, fleet managers, technicians, drivers)
   - Facilities
   - Driver records with licenses

2. **seed_capital_tech_alliance_part2.sql** (Part 2)
   - All 50 vehicles with complete specifications
   - VINs, license plates, locations
   - Vehicle assignments

3. **seed_capital_tech_alliance_part3.sql** (Part 3)
   - Vendors
   - Work orders (various statuses)
   - Maintenance schedules
   - Fuel transactions
   - Routes
   - Geofences
   - EV charging stations and sessions
   - Inspection forms

4. **seed_staging.sh**
   - Master execution script
   - Runs all parts in sequence
   - Validates connection
   - Provides summary

## 🚀 Usage

### Option 1: Using the Master Script (Recommended)

```bash
# Set your database URL (replace with your actual credentials)
export DATABASE_URL="postgresql://<USERNAME>:<PASSWORD>@<HOST>:5432/<DATABASE>"

# Run the seed script
cd database
./seed_staging.sh

# Or pass the URL directly
./seed_staging.sh "postgresql://<USERNAME>:<PASSWORD>@<HOST>:5432/<DATABASE>"
```

### Option 2: Manual Execution

```bash
# Apply each part in sequence
psql $DATABASE_URL -f seed_capital_tech_alliance.sql
psql $DATABASE_URL -f seed_capital_tech_alliance_part2.sql
psql $DATABASE_URL -f seed_capital_tech_alliance_part3.sql
```

## 🔑 Default Credentials

After seeding, you can log in with:

**Admin User:**
- Email: `admin@capitaltechalliance.com`
- Password: See seed SQL file (line 45)

**Fleet Manager:**
- Email: `james.thompson@capitaltechalliance.com`
- Password: See seed SQL file

**Sample Driver:**
- Email: `john.davis@capitaltechalliance.com`
- Password: See seed SQL file

> ⚠️ **CRITICAL SECURITY WARNING**:
> - Default passwords are for DEVELOPMENT/TESTING ONLY
> - NEVER use these credentials in production
> - Force password change on first login
> - Implement strong password policy
> - Use Azure AD authentication in production

## 📍 Location Details

All facilities and vehicle locations are in **Tallahassee, Florida**:

### Facilities
1. **HQ Fleet Center**
   - Address: 1500 Capital Circle SE, Tallahassee, FL 32301
   - Coordinates: 30.4383°N, 84.2807°W
   - Capacity: 50 vehicles, 10 service bays

2. **Northside Depot**
   - Address: 3200 North Monroe Street, Tallahassee, FL 32303
   - Coordinates: 30.4850°N, 84.2807°W
   - Capacity: 25 vehicles, 5 service bays

3. **Southside Service Center**
   - Address: 4500 Woodville Highway, Tallahassee, FL 32305
   - Coordinates: 30.3916°N, 84.2807°W
   - Capacity: 30 vehicles, 8 service bays

## 🚗 Vehicle Fleet Composition

### By Type
- **Trucks**: 15 vehicles (including 1 electric F-150 Lightning)
- **Vans**: 10 vehicles (cargo and passenger)
- **Sedans**: 10 vehicles (including 2 Tesla electric)
- **SUVs**: 10 vehicles (including 1 Tesla Model X)
- **Heavy Equipment**: 5 vehicles (excavators, backhoe, dozer)

### By Fuel Type
- **Gasoline**: 30 vehicles
- **Diesel**: 13 vehicles (trucks, vans, heavy equipment)
- **Electric**: 4 vehicles (Tesla Model 3, Model S, Model X, F-150 Lightning)
- **Hybrid**: 3 vehicles (Toyota RAV4 Hybrid, Ford Fusion Hybrid)

### Vehicle Status
- **Active**: 49 vehicles
- **Maintenance**: 1 vehicle (Komatsu excavator)

## 📊 Data Characteristics

### Realistic Elements
- ✅ Valid VIN numbers for each make/model
- ✅ Florida license plates (FLT-001 through FLT-050)
- ✅ Proper GPS coordinates for Tallahassee area
- ✅ Realistic odometer and engine hours
- ✅ Historical purchase dates and depreciation
- ✅ Varied driver safety scores (92.5 - 99.3)
- ✅ Active maintenance schedules
- ✅ Recent fuel transactions (last 30 days)
- ✅ Work orders in various statuses (open, in_progress, completed)

### Time-based Data
- Tenant created 2 years ago
- Users hired at various dates (mimicking company growth)
- Vehicles purchased from 2019-2023
- Recent operational data (fuel, routes, charging sessions)
- Work orders from last 30 days

## 🔄 Re-seeding

The scripts include TRUNCATE statements at the beginning, so you can safely re-run them to reset the data:

```bash
# This will clear and repopulate all data
./seed_staging.sh
```

> ⚠️ **Warning**: This will DELETE all existing data in the staging database!

## 🧪 Testing After Seed

Verify the data was loaded correctly:

```sql
-- Check tenant
SELECT * FROM tenants WHERE name = 'Capital Tech Alliance';

-- Check vehicles
SELECT COUNT(*) FROM vehicles WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';
-- Should return: 50

-- Check active vehicles by type
SELECT vehicle_type, COUNT(*)
FROM vehicles
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
GROUP BY vehicle_type;

-- Check users
SELECT role, COUNT(*)
FROM users
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
GROUP BY role;

-- Check recent fuel transactions
SELECT COUNT(*) FROM fuel_transactions
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';

-- Check EV charging infrastructure
SELECT * FROM charging_stations
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001';
```

## 🏗️ Schema Requirements

These scripts assume the full fleet management schema is already applied. If not, run:

```bash
psql $DATABASE_URL -f schema.sql
```

The schema includes:
- Multi-tenancy support
- Vehicle and driver management
- Work orders and maintenance tracking
- Fuel and charging management
- Routes and geofencing
- Audit logging
- And more...

## 📝 Notes

- All timestamps use `NOW()` with appropriate intervals for realistic historical data
- UUIDs follow a consistent pattern for easy identification
- All monetary values are in USD
- Distances in miles, fuel in gallons (US units)
- Electric vehicle data includes battery capacity and range
- Heavy equipment includes engine hours tracking
- CDL drivers have appropriate endorsements (H, N, T, X)

## 🆘 Troubleshooting

### Connection Error
```bash
Error: psql command not found
```
**Solution**: Install PostgreSQL client tools:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Permission Denied
```bash
permission denied: ./seed_staging.sh
```
**Solution**: Make the script executable:
```bash
chmod +x seed_staging.sh
```

### Foreign Key Constraint Error
**Solution**: Ensure the schema is applied first:
```bash
psql $DATABASE_URL -f schema.sql
```

### Data Already Exists
**Solution**: The scripts will TRUNCATE tables, but if you want to keep existing data, comment out the TRUNCATE statements in `seed_capital_tech_alliance.sql`.

## 📧 Support

For questions or issues with the seed data, contact the development team.

---

**Generated**: 2025-11-11
**Version**: 1.0
**Organization**: Capital Tech Alliance
**Location**: Tallahassee, Florida
