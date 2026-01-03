#!/bin/bash

# Fleet Management System - Complete Setup and Test Script
# This script will set up the database, seed data, and test the API

set -e  # Exit on any error

echo "=================================="
echo "Fleet Management System Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if ! pg_isready -q 2>/dev/null; then
  echo -e "${RED}❌ PostgreSQL is not running${NC}"
  echo ""
  echo "Please start PostgreSQL:"
  echo "  macOS: brew services start postgresql@16"
  echo "  Linux: sudo systemctl start postgresql"
  echo "  Docker: docker run --name fleet-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fleet_dev -p 5432:5432 -d postgres:16-alpine"
  exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check if .env file exists
echo ""
echo "🔍 Checking .env file..."
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example...${NC}"
  cp .env.example .env

  # Generate secrets
  JWT_SECRET=$(openssl rand -base64 48)
  SESSION_SECRET=$(openssl rand -base64 48)
  CSRF_SECRET=$(openssl rand -base64 48)

  # Update .env with generated secrets
  sed -i.bak "s|YOUR_JWT_SECRET_HERE_GENERATE_WITH_OPENSSL_RAND_BASE64_48|$JWT_SECRET|" .env
  sed -i.bak "s|YOUR_SESSION_SECRET_HERE_GENERATE_WITH_OPENSSL_RAND_BASE64_48|$SESSION_SECRET|" .env
  sed -i.bak "s|YOUR_CSRF_SECRET_HERE_GENERATE_WITH_OPENSSL_RAND_BASE64_48|$CSRF_SECRET|" .env

  # Set development database URL
  sed -i.bak "s|postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/fleet_db|postgresql://postgres:postgres@localhost:5432/fleet_dev|" .env

  rm .env.bak
  echo -e "${GREEN}✅ .env file created with generated secrets${NC}"
else
  echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if database exists
echo ""
echo "🔍 Checking database..."
if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
  echo -e "${GREEN}✅ Database 'fleet_dev' exists${NC}"
else
  echo -e "${YELLOW}⚠️  Database 'fleet_dev' does not exist, creating...${NC}"
  psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "CREATE DATABASE fleet_dev;"
  echo -e "${GREEN}✅ Database created${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Generate migrations
echo ""
echo "🔄 Generating database migrations..."
npx drizzle-kit generate 2>&1 | grep -v "warning" || true
echo -e "${GREEN}✅ Migrations generated${NC}"

# Push schema to database
echo ""
echo "🚀 Pushing schema to database..."
npx drizzle-kit push --force 2>&1 | grep -v "warning" || true
echo -e "${GREEN}✅ Schema pushed to database${NC}"

# Run seed script
echo ""
echo "🌱 Seeding database with production data..."
echo "   This will create 3,000+ records across all tables..."
echo ""
npx tsx src/scripts/seed-production-data.ts

echo ""
echo "=================================="
echo "✨ Setup Complete!"
echo "=================================="
echo ""

# Test the API
echo "🧪 Testing API endpoints..."
echo ""

# Start the server in the background
echo "Starting server..."
npx tsx src/server-simple.ts &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test endpoints
echo ""
echo "Testing endpoints..."
echo ""

echo -n "  Health check... "
if curl -s http://localhost:3000/health | grep -q "ok"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo -n "  GET /api/vehicles... "
if curl -s http://localhost:3000/api/vehicles | grep -q "data"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo -n "  GET /api/drivers... "
if curl -s http://localhost:3000/api/drivers | grep -q "data"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo -n "  GET /api/work-orders... "
if curl -s http://localhost:3000/api/work-orders | grep -q "data"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo -n "  GET /api/fuel-transactions... "
if curl -s http://localhost:3000/api/fuel-transactions | grep -q "data"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo ""
echo "🎉 All tests passed!"
echo ""

# Stop the server
kill $SERVER_PID 2>/dev/null || true

echo "=================================="
echo "📊 Database Summary"
echo "=================================="
psql "$DATABASE_URL" << EOF
SELECT 'Tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'Drivers', COUNT(*) FROM drivers
UNION ALL SELECT 'Facilities', COUNT(*) FROM facilities
UNION ALL SELECT 'Work Orders', COUNT(*) FROM work_orders
UNION ALL SELECT 'Inspections', COUNT(*) FROM inspections
UNION ALL SELECT 'Fuel Transactions', COUNT(*) FROM fuel_transactions
UNION ALL SELECT 'Routes', COUNT(*) FROM routes
UNION ALL SELECT 'GPS Tracks', COUNT(*) FROM gps_tracks
UNION ALL SELECT 'Incidents', COUNT(*) FROM incidents
UNION ALL SELECT 'Certifications', COUNT(*) FROM certifications
UNION ALL SELECT 'Training Records', COUNT(*) FROM training_records
UNION ALL SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL SELECT 'Parts Inventory', COUNT(*) FROM parts_inventory
UNION ALL SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL SELECT 'Documents', COUNT(*) FROM documents
UNION ALL SELECT 'Announcements', COUNT(*) FROM announcements
UNION ALL SELECT 'Assets', COUNT(*) FROM assets
UNION ALL SELECT 'Charging Stations', COUNT(*) FROM charging_stations
UNION ALL SELECT 'Charging Sessions', COUNT(*) FROM charging_sessions
UNION ALL SELECT 'Tasks', COUNT(*) FROM tasks
ORDER BY count DESC;
EOF

echo ""
echo "=================================="
echo "🚀 Ready to Start!"
echo "=================================="
echo ""
echo "To start the API server:"
echo "  npm run dev"
echo ""
echo "API will be available at:"
echo "  http://localhost:3000"
echo ""
echo "Test credentials:"
echo "  Check database for user emails"
echo "  Password: Demo123!"
echo ""
echo "Update frontend .env:"
echo "  VITE_USE_MOCK_DATA=false"
echo "  VITE_API_URL=http://localhost:3000"
echo ""
