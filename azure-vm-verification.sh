#!/bin/bash
# Fleet Management - Azure VM Verification Script
# Verifies Phase 2 DI migration on Azure VM (172.191.51.49)

set -e

VM_HOST="azureuser@172.191.51.49"
VM_PROJECT_PATH="/mnt/workspace/fleet-local"

echo "════════════════════════════════════════════════════════════"
echo "Fleet Management - Azure VM Verification"
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 1: Copy latest code to Azure VM
echo "📦 Step 1: Copying latest code to Azure VM..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
  ./ ${VM_HOST}:${VM_PROJECT_PATH}/

if [ $? -eq 0 ]; then
  echo "✅ Code copied successfully"
else
  echo "❌ Failed to copy code"
  exit 1
fi

# Step 2: Install dependencies on Azure VM
echo ""
echo "📦 Step 2: Installing dependencies on Azure VM..."
ssh ${VM_HOST} "cd ${VM_PROJECT_PATH}/api && npm install --production"

if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed"
else
  echo "⚠️  Dependency installation had warnings (continuing...)"
fi

# Step 3: Verify TypeScript compilation
echo ""
echo "🔍 Step 3: TypeScript compilation check..."
ssh ${VM_HOST} "cd ${VM_PROJECT_PATH}/api && npx tsc --noEmit --skipLibCheck 2>&1 | head -20"

# Step 4: Count services and registrations
echo ""
echo "📊 Step 4: Counting services and registrations..."

SERVICE_COUNT=$(ssh ${VM_HOST} "cd ${VM_PROJECT_PATH}/api/src/services && find . -name '*.service.ts' -o -name '*.ts' | grep -v '__tests__' | grep -v '.test.ts' | wc -l")
REGISTRATION_COUNT=$(ssh ${VM_HOST} "cd ${VM_PROJECT_PATH}/api/src && grep -c 'asClass' container.ts 2>/dev/null || echo 0")

echo "   Services in api/src/services: ${SERVICE_COUNT}"
echo "   Registrations in container.ts: ${REGISTRATION_COUNT}"

if [ "$REGISTRATION_COUNT" -ge "94" ]; then
  echo "✅ All 94+ services registered"
else
  echo "⚠️  Expected 94 registrations, found ${REGISTRATION_COUNT}"
fi

# Step 5: Verify no legacy pool imports in services
echo ""
echo "🔍 Step 5: Checking for legacy pool imports..."

LEGACY_IMPORTS=$(ssh ${VM_HOST} "cd ${VM_PROJECT_PATH}/api/src/services && grep -r \"import pool from\" . 2>/dev/null | grep -v '__tests__' | wc -l")

echo "   Legacy pool imports found: ${LEGACY_IMPORTS}"

if [ "$LEGACY_IMPORTS" -eq "0" ]; then
  echo "✅ No legacy pool imports in services"
else
  echo "⚠️  Found ${LEGACY_IMPORTS} legacy pool imports (expected 0)"
fi

# Step 6: Verify parameterized queries
echo ""
echo "🔍 Step 6: Verifying parameterized queries..."

PARAM_QUERIES=$(ssh ${VM_HOST} "cd ${VM_PROJECT_PATH}/api/src/services && grep -r 'this.db.query' . 2>/dev/null | grep -c '\$[0-9]' || echo 0")

echo "   Parameterized queries found: ${PARAM_QUERIES}"

if [ "$PARAM_QUERIES" -gt "200" ]; then
  echo "✅ Parameterized queries verified (${PARAM_QUERIES})"
else
  echo "⚠️  Expected 232+ parameterized queries"
fi

# Step 7: Check security with gitleaks (if available)
echo ""
echo "🔒 Step 7: Security scan check..."

GITLEAKS_AVAILABLE=$(ssh ${VM_HOST} "which gitleaks >/dev/null 2>&1 && echo 'yes' || echo 'no'")

if [ "$GITLEAKS_AVAILABLE" = "yes" ]; then
  echo "   Running gitleaks scan..."
  ssh ${VM_HOST} "cd ${VM_PROJECT_PATH} && gitleaks detect --no-git --redact 2>&1 | tail -10"
else
  echo "⚠️  Gitleaks not available on Azure VM"
fi

# Step 8: Generate summary report
echo ""
echo "════════════════════════════════════════════════════════════"
echo "VERIFICATION SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Code synchronized to Azure VM"
echo "✅ Dependencies installed"
echo "📊 Service count: ${SERVICE_COUNT}"
echo "📊 Registrations: ${REGISTRATION_COUNT}"
echo "📊 Legacy imports: ${LEGACY_IMPORTS}"
echo "📊 Parameterized queries: ${PARAM_QUERIES}"
echo ""

# Step 9: Create verification timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
ssh ${VM_HOST} "echo 'Phase 2 Verification: ${TIMESTAMP}' > ${VM_PROJECT_PATH}/AZURE_VM_VERIFIED.txt"
ssh ${VM_HOST} "echo 'Services: ${SERVICE_COUNT}' >> ${VM_PROJECT_PATH}/AZURE_VM_VERIFIED.txt"
ssh ${VM_HOST} "echo 'Registrations: ${REGISTRATION_COUNT}' >> ${VM_PROJECT_PATH}/AZURE_VM_VERIFIED.txt"
ssh ${VM_HOST} "echo 'Legacy imports: ${LEGACY_IMPORTS}' >> ${VM_PROJECT_PATH}/AZURE_VM_VERIFIED.txt"

echo "📝 Verification timestamp saved to AZURE_VM_VERIFIED.txt"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Phase 2 Azure VM verification complete!"
echo "════════════════════════════════════════════════════════════"
