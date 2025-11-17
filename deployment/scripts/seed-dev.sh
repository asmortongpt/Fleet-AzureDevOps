#!/bin/bash
# Seed Development Database with 50 vehicles and test data

set -e

NAMESPACE="fleet-management-dev"
POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=fleet-postgres -o jsonpath='{.items[0].metadata.name}')

echo "========================================="
echo "Seeding Development Database"
echo "========================================="
echo "Namespace: $NAMESPACE"
echo "Pod: $POD_NAME"
echo ""

# Copy seed script to pod
echo "Copying seed script to PostgreSQL pod..."
kubectl cp /Users/andrewmorton/Documents/GitHub/Fleet/deployment/scripts/seed-database.sql \
  $NAMESPACE/$POD_NAME:/tmp/seed-database.sql

echo "Running migrations and seed script..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U fleetadmin -d fleetdb_dev -f /tmp/seed-database.sql

echo ""
echo "Generating dev data (50 vehicles, 100 maintenance records, 50 work orders, 200 fuel transactions)..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U fleetadmin -d fleetdb_dev -c "
  -- Generate dev data
  SELECT generate_vehicles(50);
  SELECT generate_maintenance_records(100);
  SELECT generate_work_orders(50);
  SELECT generate_fuel_transactions(200);

  -- Display summary
  SELECT 'Dev Database Seeded Successfully!' AS status;
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
echo "Development database seeded successfully!"
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
echo "  - 50 Vehicles"
echo "  - 100 Maintenance Records"
echo "  - 50 Work Orders"
echo "  - 200 Fuel Transactions"
echo ""
