#!/bin/bash
set -e

echo "🧪 Running Integration Tests for Wave 3 Features"

export NODE_ENV=test
export DB_NAME=fleet_test

echo "📦 Installing test dependencies..."
cd api
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

echo "🏃 Running integration tests..."
npx jest tests/integration --verbose

echo "✅ All integration tests passed!"
