#!/bin/bash

# Tier 5 DI Migration Script
# Migrates remaining 6 services from legacy pool imports to DI pattern

cd /Users/andrewmorton/Documents/GitHub/fleet-local/api/src/services

echo "=== Starting Tier 5 DI Migration ==="

# Function to migrate a service file
migrate_service() {
  local file=$1
  local service_name=$(basename "$file" .service.ts)

  echo "Migrating $service_name..."

  # Step 1: Change import from legacy to Pool
  sed -i '' 's/import pool from/import { Pool } from/g' "$file"
  sed -i '' "s|'../config/database'|'pg'|g" "$file"

  # Step 2: Add db: Pool to constructor (if class exists)
  # This is tricky and requires checking if constructor already has params
  # For now, we'll handle this manually for each service

  # Step 3: Replace pool. with this.db.
  sed -i '' 's/pool\.query(/this.db.query(/g' "$file"
  sed -i '' 's/await pool\./await this.db./g' "$file"

  echo "✓ $service_name migrated"
}

# Migrate google-calendar.service.ts (8+ pool usages)
echo ""
echo "=== 1. google-calendar.service.ts ==="
FILE="google-calendar.service.ts"

# Change import
sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# This service exports functions, so we need to wrap in a class
echo "Note: google-calendar.service.ts needs manual class wrapping"

# Migrate mcp-server-registry.service.ts (2 pool usages + local pool variable)
echo ""
echo "=== 2. mcp-server-registry.service.ts ==="
FILE="mcp-server-registry.service.ts"

sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Need to be careful - this has a local 'pool' variable for server pools
# Replace database pool with this.db, but not the server pool variable
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"
sed -i '' 's/const metricsResult = await pool\.query(/const metricsResult = await this.db.query(/g' "$FILE"

# Add constructor param
# Check if constructor exists
if grep -q "constructor()" "$FILE"; then
  sed -i '' 's/constructor()/constructor(private db: Pool)/g' "$FILE"
fi

# Migrate mcp-server.service.ts (5 pool usages)
echo ""
echo "=== 3. mcp-server.service.ts ==="
FILE="mcp-server.service.ts"

sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Replace all pool. with this.db.
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"

# Add constructor param
if grep -q "constructor()" "$FILE"; then
  sed -i '' 's/constructor()/constructor(private db: Pool)/g' "$FILE"
fi

# Migrate obd2.service.ts (20+ pool usages)
echo ""
echo "=== 4. obd2.service.ts ==="
FILE="obd2.service.ts"

sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Replace all pool. with this.db.
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"
sed -i '' 's/const existing = await pool\.query(/const existing = await this.db.query(/g' "$FILE"

# This service exports functions, needs class wrapping
echo "Note: obd2.service.ts needs manual class wrapping"

# Migrate outlook.service.ts (1 pool usage)
echo ""
echo "=== 5. outlook.service.ts ==="
FILE="outlook.service.ts"

sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Replace pool usage
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"

# Add constructor param
if grep -q "constructor()" "$FILE"; then
  sed -i '' 's/constructor()/constructor(private db: Pool)/g' "$FILE"
fi

# Migrate push-notification.service.ts (4+ pool usages)
echo ""
echo "=== 6. push-notification.service.ts ==="
FILE="push-notification.service.ts"

sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Replace all pool. with this.db.
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"
sed -i '' 's/const existing = await pool\.query(/const existing = await this.db.query(/g' "$FILE"
sed -i '' 's/const recipientsResult = await pool\.query(/const recipientsResult = await this.db.query(/g' "$FILE"

# Add constructor param
if grep -q "constructor()" "$FILE"; then
  sed -i '' 's/constructor()/constructor(private db: Pool)/g' "$FILE"
fi

echo ""
echo "=== Migration Complete ==="
echo "✓ 6 services migrated to DI pattern"
echo ""
echo "Manual steps required:"
echo "1. google-calendar.service.ts - wrap exported functions in class"
echo "2. obd2.service.ts - wrap exported functions in class"
echo "3. Verify all constructors properly inject db: Pool"
echo "4. Remove singleton exports (export default new Service() -> export default Service)"
