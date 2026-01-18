#!/bin/bash
set -e

# 30-Agent Fleet-AzureDevOps Remediation Orchestrator
# Launches 30 Claude Opus agents via API to fix all workflows in parallel

ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY environment variable must be set"
    exit 1
fi
REPO_PATH="${REPO_PATH:-/tmp/fleet-remediation}"
RESULTS_DIR="$REPO_PATH/agent-results"
MAX_TOKENS=4096
TEMPERATURE=0.1

echo "🚀 30-Agent Fleet-AzureDevOps Remediation Orchestrator"
echo "=================================================="
echo "Repository: $REPO_PATH"
echo "Results: $RESULTS_DIR"
echo ""

# Prepare environment
mkdir -p "$RESULTS_DIR"
cd "$REPO_PATH" || exit 1

# Function to call Claude Opus API
call_opus_agent() {
    local agent_id=$1
    local task_description=$2
    local file_to_fix=$3
    local specific_instructions=$4

    echo "🤖 Agent $agent_id: $task_description"

    local prompt="You are Agent $agent_id in a 30-agent swarm fixing Fleet-AzureDevOps workflows.

TASK: $task_description
FILE: $file_to_fix
INSTRUCTIONS: $specific_instructions

CRITICAL REQUIREMENTS:
1. Read the file at $REPO_PATH/$file_to_fix
2. Make ONLY the specific fixes described
3. Use parameterized SQL queries (\$1, \$2, \$3) - never string concatenation
4. Preserve existing code style and formatting
5. Output ONLY the fixed code, no explanations
6. Test syntax if TypeScript/JavaScript

Repository path: $REPO_PATH
Work independently and fast. Output fixed code only."

    curl -s https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d "{
            \"model\": \"claude-opus-4-20250514\",
            \"max_tokens\": $MAX_TOKENS,
            \"temperature\": $TEMPERATURE,
            \"messages\": [{
                \"role\": \"user\",
                \"content\": $(jq -n --arg p "$prompt" '$p')
            }]
        }" > "$RESULTS_DIR/agent-$agent_id.json" &

    echo "$!" >> "$RESULTS_DIR/agent-pids.txt"
}

# Clear previous results
rm -f "$RESULTS_DIR"/*.json "$RESULTS_DIR"/agent-pids.txt

echo "📋 Launching 30 specialized agents..."
echo ""

# TEAM 1: API Type Definitions & Stubs (Agents 1-5)
call_opus_agent 1 "Fix TensorFlow stub types" \
    "api/src/@types/tensorflow-stub.d.ts" \
    "Add: tensor2d(), tensor3d(), array() method to Tensor interface. Ensure all methods match TensorFlow.js API."

call_opus_agent 2 "Fix OpenCV stub types" \
    "api/src/@types/opencv-stub.d.ts" \
    "Add: boundingRect(), MatVector class, matFromImageData(), Canny(). Match OpenCV.js API signatures."

call_opus_agent 3 "Complete SecretsManagementService" \
    "api/src/services/secrets/SecretsManagementService.ts" \
    "Ensure has: initialize(), shutdown(), getSecret(), setSecret(), deleteSecret(), listSecrets() methods."

call_opus_agent 4 "Fix ConfigurationManagementService" \
    "api/src/services/config/ConfigurationManagementService.ts" \
    "Create if missing. Add: getConfig(), setConfig(), deleteConfig(), getAllConfig() methods."

call_opus_agent 5 "Complete VehicleService methods" \
    "api/src/modules/fleet/services/vehicle.service.ts" \
    "Ensure has: getAllVehicles(), getVehicleById(), createVehicle(), updateVehicle(), deleteVehicle(), getStatus(). Fix parameter types."

# TEAM 2: API Routes Type Fixes (Agents 6-10)
call_opus_agent 6 "Fix vehicles.ts type conversions" \
    "api/src/routes/vehicles.ts" \
    "Lines 128, 286, 336: Change getVehicleById(vehicleId, ...) to getVehicleById(parseInt(vehicleId), ...). vehicleId is string, method expects number."

call_opus_agent 7 "Fix dashboard routes RBAC permissions" \
    "api/src/routes/dashboard.routes.ts" \
    "Lines 406, 756: PERMISSIONS.ANALYTICS_READ and PERMISSIONS.REPORTS_READ are missing. Add to middleware/rbac.ts PERMISSIONS object."

call_opus_agent 8 "Fix drill-through query params" \
    "api/src/routes/drill-through/drill-through.routes.enhanced.ts" \
    "Lines 44-45: Cast req.query values: const entityType = req.query.entityType as string. Line 59: Change data.count to data.length."

call_opus_agent 9 "Fix integrations-health cache calls" \
    "api/src/routes/integrations-health.ts" \
    "Line 457: Change cache.delete() to cache.del(). Lines 468: Ensure getStats() returns {connected, dbSize, memoryUsage, hitRate}."

call_opus_agent 10 "Fix app.ts function signatures" \
    "api/src/app.ts" \
    "Lines 79, 231, 255: Adjust function call arguments to match expected signatures. Check invoked function definitions."

# TEAM 3: Cache & Services (Agents 11-15)
call_opus_agent 11 "Add CacheService delete method" \
    "api/src/services/cache.service.ts" \
    "Add delete(key: string) or del(key: string) method. Add memoryUsage and hitRate to getStats() return type."

call_opus_agent 12 "Fix drill-through validators" \
    "api/src/routes/drill-through/validators.ts" \
    "Ensure exports: validateEntityType(), validateFilters(), validateFormat(), validateDrillThroughRequest(), validateExportFormat()."

call_opus_agent 13 "Fix drill-through queryBuilder" \
    "api/src/routes/drill-through/utils/queryBuilder.ts" \
    "Ensure exports: buildQuery(), buildDrillThroughQuery(entityType, filters). Use parameterized queries."

call_opus_agent 14 "Fix drill-through Excel generator" \
    "api/src/routes/drill-through/utils/generateExcel.ts" \
    "Return proper Buffer. Lines 110, 117 in enhanced routes expect buffer.xlsx or proper format. Create stub that returns Buffer."

call_opus_agent 15 "Add RBAC permissions" \
    "api/src/middleware/rbac.ts" \
    "Add to PERMISSIONS object: ANALYTICS_READ: 'analytics:read', REPORTS_READ: 'reports:read'. Ensure exported."

# TEAM 4: Repository Conversions (Agents 16-20)
call_opus_agent 16 "Verify FuelCardIntegration repo" \
    "api/src/repositories/fuelcardintegration.repository.ts" \
    "Ensure uses pg Pool, not TypeORM. All queries parameterized. Has: create(), read(), update(), delete(), list() methods."

call_opus_agent 17 "Verify LeaseTracking repo" \
    "api/src/repositories/leasetracking.repository.ts" \
    "Ensure uses pg Pool, not TypeORM. All queries parameterized. Has: create(), readAll(), readById(), update(), delete() methods."

call_opus_agent 18 "Verify VehicleRepository" \
    "api/src/modules/fleet/repositories/vehicle.repository.ts" \
    "Extends VehiclesRepository. Constructor calls super(pool). Exported as VehicleRepository class."

call_opus_agent 19 "Check VehiclesRepository base" \
    "api/src/repositories/vehicles.repository.ts" \
    "Has: findById(id: number, tenantId), findByTenant(), create(data, tenantId), update(id, data, tenantId), delete(id, tenantId)."

call_opus_agent 20 "Fix AI safety detection stubs" \
    "api/src/services/ai-safety-detection.service.ts" \
    "TensorFlow imports commented out. Uses external APIs only. No tf.* direct calls except in disabled code paths."

# TEAM 5: Frontend Fixes (Agents 21-25)
call_opus_agent 21 "Fix QueryErrorBoundary" \
    "src/components/errors/QueryErrorBoundary.tsx" \
    "Line 141: fallbackRender must return ReactElement, not a function. Ensure proper JSX return type."

call_opus_agent 22 "Fix ComplianceHub DataPoint" \
    "src/pages/ComplianceHub.tsx" \
    "Line 525: Add 'value' property to array objects. Transform {name, failed, passed, rate} to {name, value: rate, failed, passed}."

call_opus_agent 23 "Fix ComplianceReportingHub guards" \
    "src/pages/ComplianceReportingHub.tsx" \
    "Lines 617-618: Add type guard: if ('downloadUrl' in result && result.downloadUrl) before accessing. Or use result.downloadUrl?."

call_opus_agent 24 "Check frontend tsconfig" \
    "tsconfig.json" \
    "Ensure includes src/@types directory. Verify strict mode settings compatible with React."

call_opus_agent 25 "Verify frontend types" \
    "src/types/index.ts" \
    "Check DataPoint interface has 'value' property. Ensure all chart data interfaces export properly."

# TEAM 6: Build & Docker (Agents 26-30)
call_opus_agent 26 "Fix Dockerfile" \
    "Dockerfile" \
    "Ensure: copies .npmrc, installs with --legacy-peer-deps, runs npm run build successfully. Multi-stage if needed."

call_opus_agent 27 "Check .dockerignore" \
    ".dockerignore" \
    "Create if missing. Exclude: node_modules, .git, dist, coverage, *.log, .env. Include: package.json, package-lock.json, .npmrc."

call_opus_agent 28 "Verify API package.json" \
    "api/package.json" \
    "Check build script exists. Verify no incompatible dependencies. TypeScript, pg, inversify should be present."

call_opus_agent 29 "Check root .npmrc" \
    ".npmrc" \
    "Ensure contains: legacy-peer-deps=true. This fixes zod version conflicts."

call_opus_agent 30 "Verify GitHub workflow config" \
    ".github/workflows/azure-static-web-apps-production.yml" \
    "Check deployment token reference, build commands, API location. Ensure uses Node 20+."

echo ""
echo "⏳ Waiting for all 30 agents to complete..."
echo ""

# Wait for all background jobs
wait

echo ""
echo "✅ All 30 agents completed!"
echo ""
echo "📊 Processing results..."
echo ""

# Extract fixes from agent responses
for i in {1..30}; do
    result_file="$RESULTS_DIR/agent-$i.json"
    if [ -f "$result_file" ]; then
        echo "Agent $i: $(jq -r '.content[0].text' "$result_file" 2>/dev/null | head -c 100)..."
    fi
done

echo ""
echo "✨ Agent orchestration complete!"
echo "Results saved in: $RESULTS_DIR"
echo ""
echo "Next steps:"
echo "1. Review agent outputs in $RESULTS_DIR"
echo "2. Apply fixes to repository"
echo "3. Test builds locally"
echo "4. Commit and push"
echo ""
