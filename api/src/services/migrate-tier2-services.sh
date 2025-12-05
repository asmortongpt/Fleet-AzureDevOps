#!/bin/bash

# Tier 2 Service DI Migration - Batch 1 (3 Services)
# Migrates OcrQueueService, OcrService, SearchIndexService from legacy pool to DI

cd /Users/andrewmorton/Documents/GitHub/fleet-local/api/src/services

echo "=== Migrating 3 Tier 2 Services ==="
echo ""

# 1. OcrQueueService.ts
echo "=== 1. OcrQueueService.ts ===" FILE="OcrQueueService.ts"

# Change import from pool to { Pool }
sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Add constructor with db parameter
sed -i '' 's/export class OcrQueueService {/export class OcrQueueService {\n  constructor(private db: Pool) {}/g' "$FILE"

# Replace all pool.query( with this.db.query(
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"
sed -i '' 's/const jobRecord = await pool\.query(/const jobRecord = await this.db.query(/g' "$FILE"
sed -i '' 's/const batchRecord = await pool\.query(/const batchRecord = await this.db.query(/g' "$FILE"
sed -i '' 's/const jobResult = await pool\.query(/const jobResult = await this.db.query(/g' "$FILE"
sed -i '' 's/const batchResult = await pool\.query(/const batchResult = await this.db.query(/g' "$FILE"

# Remove singleton export
sed -i '' 's/export default new OcrQueueService()/export default OcrQueueService/g' "$FILE"

echo "✓ OcrQueueService.ts migrated"

# 2. OcrService.ts
echo ""
echo "=== 2. OcrService.ts ==="
FILE="OcrService.ts"

# Change import from pool to { Pool }
sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Add db parameter to constructor
sed -i '' 's/constructor() {/constructor(private db: Pool) {/g' "$FILE"

# Replace all pool.query( with this.db.query(
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"

# Remove function-based exports and replace with class export
sed -i '' 's/let serviceInstance: OcrService | null = null//g' "$FILE"
sed -i '' 's/export function getOcrService(): OcrService {//g' "$FILE"
sed -i '' 's/if (!serviceInstance) {//g' "$FILE"
sed -i '' 's/serviceInstance = new OcrService();//g' "$FILE"
sed -i '' 's/}//g' "$FILE"
sed -i '' 's/return serviceInstance;//g' "$FILE"
sed -i '' 's/export default getOcrService/export default OcrService/g' "$FILE"

echo "✓ OcrService.ts migrated"

# 3. SearchIndexService.ts
echo ""
echo "=== 3. SearchIndexService.ts ==="
FILE="SearchIndexService.ts"

# Change import from pool to { Pool }
sed -i '' 's/import pool from/import { Pool } from/g' "$FILE"
sed -i '' "s|'../config/database'|'pg'|g" "$FILE"

# Add db parameter to constructor
sed -i '' 's/constructor() {/constructor(private db: Pool) {/g' "$FILE"

# Replace all pool.query( with this.db.query(
sed -i '' 's/await pool\.query(/await this.db.query(/g' "$FILE"
sed -i '' 's/const result = await pool\.query(/const result = await this.db.query(/g' "$FILE"
sed -i '' 's/const countResult = await pool\.query(/const countResult = await this.db.query(/g' "$FILE"
sed -i '' 's/const docResult = await pool\.query(/const docResult = await this.db.query(/g' "$FILE"
sed -i '' 's/const tagResult = await pool\.query(/const tagResult = await this.db.query(/g' "$FILE"
sed -i '' 's/const categoryResult = await pool\.query(/const categoryResult = await this.db.query(/g' "$FILE"

# Remove singleton export
sed -i '' 's/export default new SearchIndexService()/export default SearchIndexService/g' "$FILE"

echo "✓ SearchIndexService.ts migrated"

echo ""
echo "=== Migration Complete ===" echo "✓ 3 services migrated (OcrQueueService, OcrService, SearchIndexService)"
echo ""
echo "Next steps:"
echo "1. Register services in container.ts"
echo "2. Run TypeScript compiler: npx tsc --noEmit"
echo "3. Commit changes to GitHub"
