#!/bin/bash

################################################################################
# Agent 4: Architecture Reviewer
# Analyzes dependency graphs, circular dependencies, design patterns,
# and scalability concerns
################################################################################

set -e

AGENT_NAME="Architecture Reviewer"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
REPORT_FILE="$OUTPUT_DIR/04-architecture-report.json"
REPO_DIR="${REPO_DIR:-/home/azurereviewer/fleet-review}"

mkdir -p "$OUTPUT_DIR"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2; }
log_success() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"; }

log_info "Starting $AGENT_NAME..."
cd "$REPO_DIR"

################################################################################
# Initialize Report
################################################################################

cat > "$REPORT_FILE" <<'INIT'
{
  "agent": "Architecture Reviewer",
  "timestamp": "",
  "repository": "",
  "findings": {
    "critical": [],
    "high": [],
    "medium": [],
    "low": [],
    "info": []
  },
  "summary": {
    "totalIssues": 0,
    "criticalCount": 0,
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0,
    "infoCount": 0
  },
  "architecture": {
    "dependencyGraph": {},
    "circularDependencies": [],
    "layerViolations": [],
    "designPatterns": {},
    "scalability": {}
  },
  "remediationTime": "0 hours"
}
INIT

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg ts "$TIMESTAMP" --arg repo "$REPO_DIR" \
  '.timestamp = $ts | .repository = $repo' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 1. Dependency Graph Analysis
################################################################################

log_info "Generating dependency graph..."

# Use madge to analyze dependencies
madge src --json > "$OUTPUT_DIR/dependencies.json" 2>/dev/null || true

if [ -f "$OUTPUT_DIR/dependencies.json" ]; then
  # Count total modules
  MODULE_COUNT=$(jq 'keys | length' "$OUTPUT_DIR/dependencies.json" 2>/dev/null || echo "0")
  log_info "Analyzed $MODULE_COUNT modules"

  # Find highly coupled modules (many dependencies)
  HIGHLY_COUPLED=$(jq 'to_entries | map(select((.value | length) > 10)) | length' "$OUTPUT_DIR/dependencies.json" 2>/dev/null || echo "0")

  if [ "$HIGHLY_COUPLED" -gt 0 ]; then
    log_info "Found $HIGHLY_COUPLED highly coupled modules (>10 dependencies)"

    FINDING="{\"category\":\"coupling\",\"severity\":\"medium\",\"title\":\"High module coupling\",\"description\":\"$HIGHLY_COUPLED modules have >10 dependencies, indicating tight coupling\",\"remediation\":\"Refactor to reduce dependencies. Use dependency injection and interfaces to decouple modules.\",\"effort\":\"12-20 hours\",\"file\":\"multiple\",\"codeExample\":\"// Use dependency injection\\ninterface IVehicleService {\\n  getVehicle(id: string): Promise<Vehicle>\\n}\\n\\nclass VehicleController {\\n  constructor(private vehicleService: IVehicleService) {}\\n}\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  jq --argjson graph "$(cat $OUTPUT_DIR/dependencies.json)" \
    '.architecture.dependencyGraph = {moduleCount: '"$MODULE_COUNT"', highlyCoupled: '"$HIGHLY_COUPLED"'}' \
    "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

################################################################################
# 2. Circular Dependency Detection
################################################################################

log_info "Detecting circular dependencies..."

madge src --circular > "$OUTPUT_DIR/circular.txt" 2>/dev/null || true

if [ -s "$OUTPUT_DIR/circular.txt" ]; then
  CIRCULAR_COUNT=$(wc -l < "$OUTPUT_DIR/circular.txt")
  log_info "Found $CIRCULAR_COUNT circular dependencies"

  if [ "$CIRCULAR_COUNT" -gt 0 ]; then
    FINDING="{\"category\":\"circular-deps\",\"severity\":\"high\",\"title\":\"Circular dependencies detected\",\"description\":\"Found $CIRCULAR_COUNT circular dependency chains\",\"remediation\":\"Break circular dependencies by introducing interfaces, moving shared code to separate modules, or inverting dependencies.\",\"effort\":\"16-24 hours\",\"file\":\"multiple\",\"codeExample\":\"// Before: A → B → A (circular)\\n// After: A → Interface ← B (decoupled)\\n\\n// shared/interfaces.ts\\nexport interface IUserData { ... }\\n\\n// moduleA.ts\\nimport { IUserData } from './shared/interfaces'\\n\\n// moduleB.ts\\nimport { IUserData } from './shared/interfaces'\"}"
    jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  # Save circular dependencies list
  CIRCULAR_ARRAY=$(cat "$OUTPUT_DIR/circular.txt" | jq -R . | jq -s .)
  jq --argjson circular "$CIRCULAR_ARRAY" \
    '.architecture.circularDependencies = $circular' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
else
  log_success "No circular dependencies found"
fi

################################################################################
# 3. Layer Architecture Validation
################################################################################

log_info "Validating architectural layers..."

# Check for proper layering (presentation → business → data)
LAYER_VIOLATIONS=0

# Check if UI components import from data layer directly
if grep -rq "from.*api/\|from.*database/\|from.*models/" --include="*.tsx" src/components/ 2>/dev/null; then
  LAYER_VIOLATIONS=$((LAYER_VIOLATIONS + 1))

  FINDING="{\"category\":\"layer-violation\",\"severity\":\"high\",\"title\":\"UI layer accessing data layer directly\",\"description\":\"UI components are directly importing from API/database layers, violating clean architecture\",\"remediation\":\"Use hooks or service layer to mediate between UI and data layers\",\"effort\":\"8-12 hours\",\"file\":\"src/components\",\"codeExample\":\"// Bad: Component → API directly\\nimport { fetchVehicles } from '@/api/vehicles'\\n\\n// Good: Component → Hook → API\\nimport { useVehicles } from '@/hooks/use-vehicles'\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for business logic in components
if grep -rq "\.map.*\.filter.*\.reduce\|complex.*calculation\|business.*logic" --include="*.tsx" src/components/ 2>/dev/null; then
  LAYER_VIOLATIONS=$((LAYER_VIOLATIONS + 1))

  FINDING="{\"category\":\"layer-violation\",\"severity\":\"medium\",\"title\":\"Business logic in presentation layer\",\"description\":\"Complex business logic detected in UI components\",\"remediation\":\"Extract business logic to service/utility layer\",\"effort\":\"6-10 hours\",\"file\":\"src/components\",\"codeExample\":\"// Extract to service\\n// services/vehicle-calculator.ts\\nexport function calculateMaintenanceCost(vehicle: Vehicle): number {\\n  return vehicle.maintenance.reduce((sum, m) => sum + m.cost, 0)\\n}\\n\\n// Component\\nconst cost = calculateMaintenanceCost(vehicle)\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

log_info "Layer violations: $LAYER_VIOLATIONS"

################################################################################
# 4. Design Pattern Analysis
################################################################################

log_info "Analyzing design patterns..."

PATTERNS_USED=()
PATTERNS_MISSING=()

# Check for Singleton pattern
if grep -rq "getInstance\|private.*constructor" --include="*.ts" src/ 2>/dev/null; then
  PATTERNS_USED+=("Singleton")
fi

# Check for Factory pattern
if grep -rq "createFactory\|Factory.*create" --include="*.ts" src/ 2>/dev/null; then
  PATTERNS_USED+=("Factory")
fi

# Check for Observer pattern
if grep -rq "subscribe\|addEventListener\|on\(" --include="*.ts" src/ 2>/dev/null; then
  PATTERNS_USED+=("Observer")
fi

# Check for Strategy pattern
if grep -rq "interface.*Strategy\|class.*Strategy" --include="*.ts" src/ 2>/dev/null; then
  PATTERNS_USED+=("Strategy")
fi

log_info "Design patterns detected: ${PATTERNS_USED[*]}"

# Recommend patterns for common scenarios
if ! grep -rq "Repository" --include="*.ts" src/ 2>/dev/null; then
  PATTERNS_MISSING+=("Repository")

  FINDING="{\"category\":\"design-pattern\",\"severity\":\"low\",\"title\":\"Missing Repository pattern\",\"description\":\"Repository pattern not detected. Data access logic may be scattered\",\"remediation\":\"Implement Repository pattern to centralize data access logic\",\"effort\":\"12-16 hours\",\"file\":\"src/repositories\",\"codeExample\":\"// repositories/vehicle-repository.ts\\nexport class VehicleRepository {\\n  async findById(id: string): Promise<Vehicle> {\\n    return db.query('SELECT * FROM vehicles WHERE id = $1', [id])\\n  }\\n  \\n  async findAll(filter?: VehicleFilter): Promise<Vehicle[]> {\\n    // Complex query logic here\\n  }\\n}\"}"
  jq --argjson f "$FINDING" '.findings.low += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

PATTERNS_OBJ="{\"used\":[$(printf '\"%s\",' "${PATTERNS_USED[@]}" | sed 's/,$//')]}"
jq --argjson patterns "$PATTERNS_OBJ" \
  '.architecture.designPatterns = $patterns' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 5. Scalability Analysis
################################################################################

log_info "Analyzing scalability concerns..."

SCALABILITY_ISSUES=0

# Check for in-memory caching without limits
if grep -rq "Map\|Set\|cache.*=.*{}\|cache.*=.*\[\]" --include="*.ts" src/ 2>/dev/null; then
  if ! grep -rq "LRU\|maxSize\|eviction" --include="*.ts" src/ 2>/dev/null; then
    SCALABILITY_ISSUES=$((SCALABILITY_ISSUES + 1))

    FINDING="{\"category\":\"scalability\",\"severity\":\"high\",\"title\":\"Unbounded in-memory caching\",\"description\":\"In-memory caches detected without size limits or eviction policies\",\"remediation\":\"Implement LRU cache with max size, or use Redis for distributed caching\",\"effort\":\"6-8 hours\",\"file\":\"multiple\",\"codeExample\":\"// Use LRU cache with limits\\nimport LRU from 'lru-cache'\\n\\nconst cache = new LRU({\\n  max: 500,  // Max items\\n  ttl: 1000 * 60 * 5,  // 5 minute TTL\\n  updateAgeOnGet: true\\n})\"}"
    jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
fi

# Check for synchronous operations in request handlers
if grep -rq "\.sync\|readFileSync\|writeFileSync" --include="*.ts" api/ 2>/dev/null; then
  SCALABILITY_ISSUES=$((SCALABILITY_ISSUES + 1))

  FINDING="{\"category\":\"scalability\",\"severity\":\"high\",\"title\":\"Synchronous operations blocking event loop\",\"description\":\"Synchronous file/network operations detected in API handlers\",\"remediation\":\"Replace all sync operations with async equivalents\",\"effort\":\"4-6 hours\",\"file\":\"api/\",\"codeExample\":\"// Bad\\nconst data = fs.readFileSync('file.json', 'utf8')\\n\\n// Good\\nconst data = await fs.promises.readFile('file.json', 'utf8')\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for missing pagination
if ! grep -rq "limit\|offset\|page\|cursor" --include="*.ts" api/ 2>/dev/null; then
  SCALABILITY_ISSUES=$((SCALABILITY_ISSUES + 1))

  FINDING="{\"category\":\"scalability\",\"severity\":\"medium\",\"title\":\"Missing pagination on list endpoints\",\"description\":\"API endpoints may return unbounded result sets\",\"remediation\":\"Implement pagination (offset/limit or cursor-based) on all list endpoints\",\"effort\":\"8-12 hours\",\"file\":\"api/routes\",\"codeExample\":\"// Implement pagination\\ninterface PaginationParams {\\n  limit?: number\\n  offset?: number\\n}\\n\\napp.get('/api/vehicles', async (req, res) => {\\n  const limit = parseInt(req.query.limit) || 50\\n  const offset = parseInt(req.query.offset) || 0\\n  \\n  const vehicles = await db.query(\\n    'SELECT * FROM vehicles LIMIT $1 OFFSET $2',\\n    [limit, offset]\\n  )\\n  \\n  res.json({\\n    data: vehicles,\\n    pagination: { limit, offset, total: await getTotal() }\\n  })\\n})\"}"
  jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

# Check for N+1 query patterns
if grep -rq "for.*await\|\.map.*await" --include="*.ts" api/ 2>/dev/null; then
  SCALABILITY_ISSUES=$((SCALABILITY_ISSUES + 1))

  FINDING="{\"category\":\"scalability\",\"severity\":\"high\",\"title\":\"N+1 query anti-pattern\",\"description\":\"Queries executed in loops will not scale with data growth\",\"remediation\":\"Use batch queries, joins, or DataLoader pattern\",\"effort\":\"12-16 hours\",\"file\":\"api/\",\"codeExample\":\"// Bad: N+1\\nfor (const vehicle of vehicles) {\\n  vehicle.driver = await getDriver(vehicle.driverId)\\n}\\n\\n// Good: Single query with join\\nconst vehicles = await db.query(`\\n  SELECT v.*, d.* FROM vehicles v\\n  LEFT JOIN drivers d ON v.driver_id = d.id\\n`)\"}"
  jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

log_info "Scalability issues: $SCALABILITY_ISSUES"

jq --argjson scale "{\"issuesFound\":$SCALABILITY_ISSUES}" \
  '.architecture.scalability = $scale' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# 6. Microservices Readiness Assessment
################################################################################

log_info "Assessing microservices readiness..."

# Check for monolithic indicators
MONOLITH_SCORE=0

# Single entry point
if [ -f "src/main.ts" ] || [ -f "src/index.ts" ]; then
  MONOLITH_SCORE=$((MONOLITH_SCORE + 1))
fi

# Shared database models
if [ -d "src/models" ] && [ $(find src/models -name "*.ts" | wc -l) -gt 20 ]; then
  MONOLITH_SCORE=$((MONOLITH_SCORE + 1))
fi

# No service boundaries
if ! grep -rq "Service\|Gateway\|Adapter" --include="*.ts" src/ 2>/dev/null; then
  MONOLITH_SCORE=$((MONOLITH_SCORE + 1))
fi

if [ "$MONOLITH_SCORE" -ge 2 ]; then
  FINDING="{\"category\":\"architecture\",\"severity\":\"info\",\"title\":\"Monolithic architecture detected\",\"description\":\"Application follows monolithic pattern. Consider microservices for better scalability.\",\"remediation\":\"Evaluate bounded contexts for potential service boundaries (e.g., Vehicle Management, Maintenance, Driver Management as separate services)\",\"effort\":\"80-120 hours (major refactor)\",\"file\":\"overall architecture\"}"
  jq --argjson f "$FINDING" '.findings.info += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
fi

################################################################################
# 7. API Design Review
################################################################################

log_info "Reviewing API design..."

API_ISSUES=0

# Check for REST best practices
if [ -d "api" ]; then
  # Check for proper HTTP methods
  if ! grep -rq "app\.post\|router\.post" --include="*.ts" api/ 2>/dev/null; then
    API_ISSUES=$((API_ISSUES + 1))
  fi

  # Check for versioning
  if ! grep -rq "/v1/\|/v2/\|/api/v" --include="*.ts" api/ 2>/dev/null; then
    FINDING="{\"category\":\"api-design\",\"severity\":\"medium\",\"title\":\"Missing API versioning\",\"description\":\"API endpoints do not appear to be versioned\",\"remediation\":\"Implement API versioning (e.g., /api/v1/) to support backward compatibility\",\"effort\":\"4-6 hours\",\"file\":\"api/routes\",\"codeExample\":\"// Version your API\\napp.use('/api/v1/vehicles', vehiclesV1Router)\\napp.use('/api/v2/vehicles', vehiclesV2Router)\"}"
    jq --argjson f "$FINDING" '.findings.medium += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi

  # Check for error handling middleware
  if ! grep -rq "errorHandler\|error.*middleware" --include="*.ts" api/ 2>/dev/null; then
    API_ISSUES=$((API_ISSUES + 1))

    FINDING="{\"category\":\"api-design\",\"severity\":\"high\",\"title\":\"Missing centralized error handling\",\"description\":\"No error handling middleware detected\",\"remediation\":\"Implement centralized error handling middleware\",\"effort\":\"4 hours\",\"file\":\"api/middleware\",\"codeExample\":\"// error-handler.ts\\nexport function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {\\n  logger.error('API Error', { error: err, path: req.path })\\n  \\n  if (err instanceof ValidationError) {\\n    return res.status(400).json({ error: err.message })\\n  }\\n  \\n  res.status(500).json({ error: 'Internal server error' })\\n}\\n\\napp.use(errorHandler)\"}"
    jq --argjson f "$FINDING" '.findings.high += [$f]' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"
  fi
fi

log_info "API issues: $API_ISSUES"

################################################################################
# 8. Calculate Summary
################################################################################

jq '
  .summary.criticalCount = (.findings.critical | length) |
  .summary.highCount = (.findings.high | length) |
  .summary.mediumCount = (.findings.medium | length) |
  .summary.lowCount = (.findings.low | length) |
  .summary.infoCount = (.findings.info | length) |
  .summary.totalIssues = (.summary.criticalCount + .summary.highCount + .summary.mediumCount + .summary.lowCount + .summary.infoCount)
' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

TOTAL_EFFORT=0
for severity in critical high medium low; do
  EFFORT=$(jq -r ".findings.$severity[].effort // \"0 hours\"" "$REPORT_FILE" | \
    sed 's/[^0-9]*//g' | awk '{sum+=$1} END {print sum}')
  TOTAL_EFFORT=$((TOTAL_EFFORT + EFFORT))
done

jq --arg time "$TOTAL_EFFORT hours" \
  '.remediationTime = $time' "$REPORT_FILE" > /tmp/tmp.$$ && mv /tmp/tmp.$$ "$REPORT_FILE"

################################################################################
# Summary
################################################################################

CRITICAL=$(jq '.summary.criticalCount' "$REPORT_FILE")
HIGH=$(jq '.summary.highCount' "$REPORT_FILE")
MEDIUM=$(jq '.summary.mediumCount' "$REPORT_FILE")
LOW=$(jq '.summary.lowCount' "$REPORT_FILE")
TOTAL=$(jq '.summary.totalIssues' "$REPORT_FILE")

log_success "Architecture review complete!"
echo "----------------------------------------"
echo "Architecture Review Summary:"
echo "  Critical: $CRITICAL"
echo "  High: $HIGH"
echo "  Medium: $MEDIUM"
echo "  Low: $LOW"
echo "  Total Issues: $TOTAL"
echo "  Estimated Remediation: $TOTAL_EFFORT hours"
echo "----------------------------------------"
echo "Report saved to: $REPORT_FILE"

exit 0
