#!/bin/bash
# Run database migrations for Fleet Management API

set -e

echo "=================================================="
echo "Fleet Management API - Database Migration"
echo "=================================================="

# Get database credentials from Kubernetes secret
echo "Retrieving database credentials..."
DB_PASSWORD=$(kubectl get secret fleet-api-secrets -n fleet-management -o jsonpath='{.data.database-password}' | base64 -d)

# Port forward to PostgreSQL
echo "Setting up port forward to PostgreSQL..."
kubectl port-forward -n fleet-management svc/fleet-postgres 5432:5432 &
PF_PID=$!

# Wait for port forward to be ready
sleep 3

# Run migration
echo "Running database migration..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5432 -U fleetuser -d fleetdb -f migrations/001_initial_schema.sql

# Kill port forward
kill $PF_PID

echo "✓ Database migration completed successfully"
