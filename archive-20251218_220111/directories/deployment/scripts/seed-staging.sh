#!/bin/bash
# Seed Staging Database with 100 vehicles and test data

set -e

NAMESPACE="fleet-management-staging"
POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=fleet-postgres -o jsonpath='{.items[0].metadata.name}')

echo "========================================="
echo "Seeding Staging Database"
echo "========================================="
echo "Namespace: $NAMESPACE"
echo "Pod: $POD_NAME"
echo ""

# Copy seed script to pod
echo "Copying seed script to PostgreSQL pod..."
kubectl cp /Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/seed-database.sql \
  $NAMESPACE/$POD_NAME:/tmp/seed-database.sql

echo "Running migrations and seed script..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U fleetadmin -d fleetdb_staging -f /tmp/seed-database.sql

echo ""
echo "Generating staging data (100 vehicles, 300 maintenance records, 150 work orders, 500 fuel transactions)..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U fleetadmin -d fleetdb_staging -c "
  -- Generate staging data
  SELECT generate_vehicles(100);
  SELECT generate_maintenance_records(300);
  SELECT generate_work_orders(150);
  SELECT generate_fuel_transactions(500);

  -- Display summary
  SELECT 'Staging Database Seeded Successfully!' AS status;
  SELECT 'Tenants: ' || COUNT(*) || ' record(s)' AS summary FROM tenants
  UNION ALL
  SELECT 'Users: ' || COUNT(*) || ' record(s)' FROM users
  UNION ALL
  SELECT 'Drivers: ' || COUNT(*) || ' record(s)' FROM drivers
  UNION ALL
  SELECT 'Vehicles: ' || COUNT(*) || ' record(s)' FROM vehicles
  UNION ALL
  SELECT 'Maintenance Records: ' || COUNT(*) || ' record(s)' FROM maintenance_records
  UNION ALL
  SELECT 'Work Orders: ' || COUNT(*) || ' record(s)' FROM work_orders
  UNION ALL
  SELECT 'Fuel Transactions: ' || COUNT(*) || ' record(s)' FROM fuel_transactions;
"

echo ""
echo "========================================="
echo "Staging database seeded successfully!"
echo "========================================="
echo ""
echo "Test credentials:"
echo "  Admin: admin@acme.com / password123"
echo "  Fleet Manager: fleet@acme.com / password123"
echo "  Driver: driver1@acme.com / password123"
echo ""
echo "Total records created:"
echo "  - 4 Tenants"
echo "  - 10 Users"
echo "  - 6 Drivers"
echo "  - 100 Vehicles"
echo "  - 300 Maintenance Records"
echo "  - 150 Work Orders"
echo "  - 500 Fuel Transactions"
echo ""
