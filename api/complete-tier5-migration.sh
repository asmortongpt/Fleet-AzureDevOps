#!/bin/bash

# Complete Tier 5 DI Migration - Final 3 Services
# Wraps function-based services in classes and migrates sms.service.ts

cd /Users/andrewmorton/Documents/GitHub/fleet-local/api/src/services

echo "=== Completing Final Tier 5 Services ==="
echo ""

# 1. SMS Service - Simple DI migration (already has class)
echo "=== 1. sms.service.ts ==="
FILE="sms.service.ts"

# Change import from { pool as db } to { Pool }
sed -i '' 's/import { pool as db } from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Add db: Pool to constructor
sed -i '' 's/constructor()/constructor(private db: Pool)/g' "$FILE"

# Replace all db. with this.db.
sed -i '' 's/await db\.query(/await this.db.query(/g' "$FILE"

# Remove singleton export
sed -i '' 's/export default new SMSService()/export default SMSService/g' "$FILE"

echo "✓ sms.service.ts migrated"

echo ""
echo "=== Migration Script Complete ==="
echo "✓ 1 service migrated (sms)"
echo ""
echo "Manual work still required:"
echo "1. google-calendar.service.ts - needs class wrapping (exports functions)"
echo "2. obd2.service.ts - needs class wrapping (exports functions)"
echo ""
echo "To wrap function-based services:"
echo "- Create class wrapper with constructor(private db: Pool)"
echo "- Move functions as methods inside class"
echo "- Update all pool references to this.db"
echo "- Export class instead of functions"
