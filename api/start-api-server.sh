#!/bin/bash
# Fleet Management API - Startup Script
# This script starts the API backend server with the necessary environment variables

echo "🚀 Starting Fleet Management API Server..."

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ ERROR: PostgreSQL is not running"
    echo "   Please start PostgreSQL first"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Change to API directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found"
    echo "   Using default environment variables"
fi

# Start the API server with critical environment variables
# These are needed because some modules check env vars at import time
CSRF_SECRET="${CSRF_SECRET:-6r0UzUuyyjCjASDqtNFXM9HIyAbs90g3ZaM6+kEt7CMnO+y+zEtO/mhF7XoUx3dZ}" \
JWT_SECRET="${JWT_SECRET:-7jJy331kLqyC/neSnUAr8iMDKIJDd1paFwkhSnmd+AiCdiaIlGRUNHOieSwqn4U+hfq7vlxrpBUjURH8HGxJsg==}" \
DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/fleet_management}" \
PORT="${PORT:-3000}" \
NODE_ENV="${NODE_ENV:-development}" \
npm run dev

echo ""
echo "📝 Note: Server logs are displayed above"
echo "🌐 API is available at: http://localhost:3000"
echo "🏥 Health check: http://localhost:3000/api/health"
