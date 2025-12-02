# Quick Start - Fleet Test Data Seeding

## TL;DR - Run the Seed

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api

# Fix the database trigger first (one-time)
kubectl exec -it -n fleet-management fleet-postgres-0 -- psql -U fleetadmin -d fleetdb <<'EOF'
DROP TRIGGER IF EXISTS trigger_calculate_fuel_efficiency ON fuel_transactions;
EOF

# Run the seed
npm run seed

# Verify it worked
npm run seed:verify
```

## Login Credentials

All accounts use password: **TestPassword123!**

**Quick Login:**
- Email: `admin@demo-transport.local`

**Other Users:**
```
admin@demo-transport.local
admin@fl-logistics.local
admin@sunshine-fleet.local

manager1@demo-transport.local
tech1@demo-transport.local
driver1@demo-transport.local
```

## What Gets Created

- 3 Tenants (organizations)
- 36 Users (admins, managers, techs, drivers, viewers)
- 50 Vehicles (trucks, vans, EVs)
- 200+ Fuel Transactions
- 100+ Work Orders
- 100+ Maintenance Schedules
- 30+ Routes (Florida cities)

## Troubleshooting

### Can't Connect to Database
```bash
# Port forward (run in separate terminal)
kubectl port-forward -n fleet-management svc/fleet-postgres-service 15432:5432

# Then run seed with local connection
DB_HOST=localhost DB_PORT=15432 npm run seed
```

### Trigger Error
```
ERROR: column "odometer" does not exist
```

**Fix:**
```bash
kubectl exec -it -n fleet-management fleet-postgres-0 -- psql -U fleetadmin -d fleetdb <<'EOF'
ALTER TABLE fuel_transactions DISABLE TRIGGER ALL;
EOF

# Run seed
npm run seed

# Re-enable (optional)
kubectl exec -it -n fleet-management fleet-postgres-0 -- psql -U fleetadmin -d fleetdb <<'EOF'
ALTER TABLE fuel_transactions ENABLE TRIGGER ALL;
EOF
```

### Reset Data
```bash
kubectl exec -it -n fleet-management fleet-postgres-0 -- psql -U fleetadmin -d fleetdb <<'EOF'
DELETE FROM fuel_transactions;
DELETE FROM maintenance_schedules;
DELETE FROM work_orders;
DELETE FROM routes;
DELETE FROM vehicles;
DELETE FROM users;
DELETE FROM tenants;
EOF

# Re-seed
npm run seed
```

## Files

- **Seed Script:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/scripts/seed-comprehensive-test-data.ts`
- **Verify Script:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/scripts/verify-seed-data.ts`
- **Full Docs:** `/Users/andrewmorton/Documents/GitHub/Fleet/TEST_DATA_DOCUMENTATION.md`
- **Summary:** `/Users/andrewmorton/Documents/GitHub/Fleet/SEED_DATA_SETUP_SUMMARY.md`

## Data Highlights

**Florida Cities Used:**
Miami, Tampa, Jacksonville, Orlando, Tallahassee, Fort Lauderdale, West Palm Beach, Naples, Gainesville, Pensacola, St. Petersburg, Cape Coral

**Vehicle Makes:**
Ford, Chevrolet, RAM, Toyota, Tesla, GMC, Mercedes-Benz, Nissan, Rivian

**Realistic Prices:**
- Gasoline: $3.45-$3.89/gal
- Diesel: $3.89-$4.35/gal
- Vehicles: $25,000-$65,000

## That's It!

For more details, see `TEST_DATA_DOCUMENTATION.md`
