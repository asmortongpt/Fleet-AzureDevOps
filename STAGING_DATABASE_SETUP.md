# Staging Database Population - Quick Start Guide

## 🎯 Objective
Populate the staging database with realistic data for **Capital Tech Alliance** in Tallahassee, Florida.

## 📦 What's Included

All seed data files are in the `/database` directory:

- `seed_capital_tech_alliance.sql` - Part 1: Tenant, users, facilities, drivers
- `seed_capital_tech_alliance_part2.sql` - Part 2: 50 vehicles
- `seed_capital_tech_alliance_part3.sql` - Part 3: Operations data
- `seed_staging.sh` - Master execution script
- `STAGING_SEED_README.md` - Comprehensive documentation

## 🚀 Quick Start

### Step 1: Get Database Credentials

The staging database connection info from `.env.staging`:
- **Host**: `fleet-staging-db.postgres.database.azure.com`
- **Port**: `5432`
- **Database**: `fleet_staging`
- **User**: `fleetadmin`
- **Password**: (from `DB_PASSWORD` environment variable)
- **SSL**: Required

### Step 2: Execute the Seed Script

```bash
# Option 1: Using environment variable
export DATABASE_URL="postgresql://fleetadmin:YOUR_PASSWORD@fleet-staging-db.postgres.database.azure.com:5432/fleet_staging?sslmode=require"
cd database
./seed_staging.sh

# Option 2: Pass URL directly
cd database
./seed_staging.sh "postgresql://fleetadmin:YOUR_PASSWORD@fleet-staging-db.postgres.database.azure.com:5432/fleet_staging?sslmode=require"
```

### Step 3: Verify

After execution, you should see:
```
✓ Staging database successfully populated!

Capital Tech Alliance - Record Summary:
  Tenants:    1
  Users:      36
  Vehicles:   50
  Drivers:    30
  Facilities: 3
```

## Test Login

After seeding, log in with:
- **Email**: `admin@capitaltechalliance.com`
- **Password**: `YOUR_ADMIN_PASSWORD_HERE`

## 📊 What Gets Created

### Company: Capital Tech Alliance
- **Location**: Tallahassee, Florida
- **Industry**: Technology Services
- **Fleet Size**: 50 vehicles

### Users (36 total)
- 1 Admin
- 2 Fleet Managers
- 3 Technicians
- 30 Drivers

### Facilities (3 in Tallahassee)
1. HQ Fleet Center - 1500 Capital Circle SE
2. Northside Depot - 3200 North Monroe Street
3. Southside Service Center - 4500 Woodville Highway

### Vehicles (50 total)
- 15 Trucks (Ford, Chevy, Ram, GMC, Toyota)
- 10 Vans (Mercedes Sprinter, Ford Transit, Ram ProMaster)
- 10 Sedans (Toyota, Honda, Nissan, Tesla, Ford)
- 10 SUVs (Honda, Toyota, Ford, Chevy, Tesla)
- 5 Heavy Equipment (CAT, John Deere, Komatsu, Volvo)

### Operational Data
- 8 Vendors (local Tallahassee suppliers)
- 10 Work Orders (various statuses)
- Maintenance schedules for all vehicles
- Recent fuel transactions
- Delivery routes
- Geofences
- 3 EV charging stations
- Charging session history

## 🛠️ Alternative: Manual Execution

If you prefer to run each file separately:

```bash
# 1. Connect to database
export PGPASSWORD='YOUR_PASSWORD'
export PGHOST='fleet-staging-db.postgres.database.azure.com'
export PGPORT='5432'
export PGDATABASE='fleet_staging'
export PGUSER='fleetadmin'
export PGSSLMODE='require'

# 2. Run each script
cd database
psql -f seed_capital_tech_alliance.sql
psql -f seed_capital_tech_alliance_part2.sql
psql -f seed_capital_tech_alliance_part3.sql
```

## 🔄 Re-seeding

To clear and repopulate the database:

```bash
# The scripts include TRUNCATE statements, so just re-run:
./seed_staging.sh
```

> ⚠️ **Warning**: This will DELETE all existing data!

## 📝 Notes

- All vehicle locations are in Tallahassee, FL area
- Timestamps are realistic (created over past 2 years)
- VINs are properly formatted for each make/model
- License plates follow Florida format (FLT-001 to FLT-050)
- CDL drivers have appropriate endorsements
- EVs have charging infrastructure and history
- Heavy equipment tracks engine hours

## 🐛 Troubleshooting

### Can't connect to database
```bash
# Test connection first
psql "postgresql://fleetadmin:PASSWORD@fleet-staging-db.postgres.database.azure.com:5432/fleet_staging?sslmode=require" -c "SELECT 1;"
```

### psql not found
```bash
# Install PostgreSQL client
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Permission denied on script
```bash
chmod +x database/seed_staging.sh
```

## 📧 Questions?

See `/database/STAGING_SEED_README.md` for comprehensive documentation.

---

**Generated**: November 11, 2025
**Branch**: `claude/populate-staging-database-011CV2umWG75n33Lfc7ENDqG`
