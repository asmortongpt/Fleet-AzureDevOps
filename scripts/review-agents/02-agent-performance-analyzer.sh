#!/bin/bash

################################################################################
# Agent 2: Performance Analyzer
# Analyzes bundle size, load times, API performance, database queries,
# and provides optimization recommendations
################################################################################

set -e

AGENT_NAME="Performance Analyzer"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/fleet-review-results}"
REPORT_FILE="$OUTPUT_DIR/02-performance-report.json"
REPO_DIR="${REPO_DIR:-/home/azurereviewer/fleet-review}"

mkdir -p "$OUTPUT_DIR"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2; }
log_success() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"; }

log_info "Starting $AGENT_NAME..."
log_info "Repository: $REPO_DIR"
log_info "Output: $REPORT_FILE"

cd "$REPO_DIR"

################################################################################
# Initialize Report Structure
################################################################################

cat > "$REPORT_FILE" <<'REPORT_INIT'
{
  "agent": "Performance Analyzer",
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
  "metrics": {
    "bundleAnalysis": {},
    "lighthouseScores": {},
    "buildPerformance": {},
    "runtimeMetrics": {}
  },
  "optimizations": [],
  "remediationTime": "0 hours"
}
REPORT_INIT

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TEMP_REPORT=$(mktemp)
jq --arg ts "$TIMESTAMP" --arg repo "$REPO_DIR" \
  '.timestamp = $ts | .repository = $repo' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

################################################################################
# 1. Build and Bundle Analysis
################################################################################

log_info "Building project and analyzing bundle..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  log_info "Installing dependencies..."
  npm install --quiet 2>&1 | head -20
fi

# Build with stats
BUILD_START=$(date +%s)
npm run build > "$OUTPUT_DIR/build-output.txt" 2>&1 || log_error "Build failed"
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

log_info "Build completed in ${BUILD_TIME}s"

# Analyze bundle size
BUNDLE_STATS="$OUTPUT_DIR/bundle-stats.json"
if [ -d "dist" ]; then
  # Calculate total bundle size
  TOTAL_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
  TOTAL_SIZE_BYTES=$(du -sb dist 2>/dev/null | cut -f1)

  # Find largest files
  find dist -type f -name "*.js" -exec du -b {} + | \
    sort -rn | head -20 > "$OUTPUT_DIR/largest-chunks.txt"

  MAIN_JS_SIZE=$(find dist -name "index-*.js" -o -name "main-*.js" | \
    head -1 | xargs du -b 2>/dev/null | cut -f1)

  log_info "Bundle size: $TOTAL_SIZE (${TOTAL_SIZE_BYTES} bytes)"

  # Bundle size thresholds
  # Critical: > 5MB, High: > 2MB, Medium: > 1MB
  if [ "$TOTAL_SIZE_BYTES" -gt 5242880 ]; then
    FINDING="{\"category\":\"bundle-size\",\"severity\":\"critical\",\"title\":\"Excessive bundle size\",\"description\":\"Total bundle size is $TOTAL_SIZE, exceeding 5MB threshold. This severely impacts load time.\",\"remediation\":\"Implement aggressive code splitting, lazy loading, and tree shaking. Consider using dynamic imports for heavy modules.\",\"effort\":\"16-24 hours\",\"file\":\"vite.config.ts\",\"codeExample\":\"// vite.config.ts\\nbuild: {\\n  rollupOptions: {\\n    output: {\\n      manualChunks: {\\n        'vendor': ['react', 'react-dom'],\\n        'charts': ['recharts', 'd3'],\\n        'maps': ['leaflet', 'react-leaflet']\\n      }\\n    }\\n  }\\n}\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.critical += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  elif [ "$TOTAL_SIZE_BYTES" -gt 2097152 ]; then
    FINDING="{\"category\":\"bundle-size\",\"severity\":\"high\",\"title\":\"Large bundle size\",\"description\":\"Total bundle size is $TOTAL_SIZE, exceeding 2MB threshold.\",\"remediation\":\"Implement code splitting and lazy loading for modules. Analyze with webpack-bundle-analyzer.\",\"effort\":\"8-12 hours\",\"file\":\"vite.config.ts\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi

  # Save bundle metrics
  BUNDLE_METRICS="{\"totalSize\":\"$TOTAL_SIZE\",\"totalSizeBytes\":$TOTAL_SIZE_BYTES,\"buildTime\":${BUILD_TIME},\"mainChunkSize\":${MAIN_JS_SIZE:-0}}"
  TEMP_REPORT=$(mktemp)
  jq --argjson metrics "$BUNDLE_METRICS" \
    '.metrics.bundleAnalysis = $metrics' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

log_success "Bundle analysis complete"

################################################################################
# 2. Dependency Analysis - Heavy Packages
################################################################################

log_info "Analyzing heavy dependencies..."

# List all dependencies with sizes
npm list --depth=0 --json > "$OUTPUT_DIR/npm-list.json" 2>/dev/null || true

# Check for known heavy packages
HEAVY_DEPS=()
for pkg in "moment" "lodash" "date-fns" "three" "recharts" "d3" "mapbox-gl"; do
  if grep -q "\"$pkg\"" package.json 2>/dev/null; then
    HEAVY_DEPS+=("$pkg")
  fi
done

if [ ${#HEAVY_DEPS[@]} -gt 0 ]; then
  DEPS_LIST=$(IFS=,; echo "${HEAVY_DEPS[*]}")
  log_info "Found heavy dependencies: $DEPS_LIST"

  FINDING="{\"category\":\"dependencies\",\"severity\":\"medium\",\"title\":\"Heavy dependencies detected\",\"description\":\"Found large dependencies: $DEPS_LIST. These contribute significantly to bundle size.\",\"remediation\":\"Consider lighter alternatives (e.g., date-fns → day.js, lodash → lodash-es with tree-shaking, moment → date-fns). Use dynamic imports for heavy libs.\",\"effort\":\"4-8 hours\",\"file\":\"package.json\",\"codeExample\":\"// Lazy load heavy libraries\\nconst loadMapbox = () => import('mapbox-gl')\\n\\n// Use tree-shakeable imports\\nimport { debounce } from 'lodash-es'  // ✓\\nimport _ from 'lodash'  // ✗\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.medium += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

################################################################################
# 3. Check for Unused Dependencies
################################################################################

log_info "Checking for unused dependencies..."
UNUSED_FILE="$OUTPUT_DIR/unused-deps.txt"

# Simple check - look for packages not imported anywhere
UNUSED_COUNT=0
if [ -f "package.json" ]; then
  for pkg in $(jq -r '.dependencies | keys[]' package.json 2>/dev/null); do
    # Skip common false positives
    if [[ "$pkg" =~ ^(@types/|eslint|prettier) ]]; then
      continue
    fi

    # Search for import/require statements
    if ! grep -rq "from ['\"]$pkg\|require(['\"]$pkg" src/ 2>/dev/null; then
      echo "$pkg" >> "$UNUSED_FILE"
      UNUSED_COUNT=$((UNUSED_COUNT + 1))
    fi
  done
fi

if [ "$UNUSED_COUNT" -gt 0 ]; then
  log_info "Found $UNUSED_COUNT potentially unused dependencies"

  FINDING="{\"category\":\"dependencies\",\"severity\":\"low\",\"title\":\"Potentially unused dependencies\",\"description\":\"Found $UNUSED_COUNT dependencies that appear unused in the codebase.\",\"remediation\":\"Review and remove unused dependencies to reduce bundle size and security surface.\",\"effort\":\"2-4 hours\",\"file\":\"package.json\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.low += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

################################################################################
# 4. Lighthouse Performance Audit (if URL provided)
################################################################################

if [ -n "$APP_URL" ]; then
  log_info "Running Lighthouse audit on $APP_URL..."
  LIGHTHOUSE_FILE="$OUTPUT_DIR/lighthouse-report.json"

  lighthouse "$APP_URL" \
    --output=json \
    --output-path="$LIGHTHOUSE_FILE" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance \
    --quiet 2>/dev/null || log_error "Lighthouse failed"

  if [ -f "$LIGHTHOUSE_FILE" ]; then
    PERF_SCORE=$(jq '.categories.performance.score * 100' "$LIGHTHOUSE_FILE" 2>/dev/null || echo "0")
    FCP=$(jq '.audits."first-contentful-paint".numericValue' "$LIGHTHOUSE_FILE" 2>/dev/null || echo "0")
    LCP=$(jq '.audits."largest-contentful-paint".numericValue' "$LIGHTHOUSE_FILE" 2>/dev/null || echo "0")
    TTI=$(jq '.audits."interactive".numericValue' "$LIGHTHOUSE_FILE" 2>/dev/null || echo "0")

    log_info "Lighthouse Performance Score: $PERF_SCORE/100"
    log_info "  FCP: ${FCP}ms, LCP: ${LCP}ms, TTI: ${TTI}ms"

    # Performance thresholds
    if (( $(echo "$PERF_SCORE < 50" | bc -l) )); then
      FINDING="{\"category\":\"performance\",\"severity\":\"critical\",\"title\":\"Poor Lighthouse performance score\",\"description\":\"Lighthouse performance score is $PERF_SCORE/100 (critical threshold: <50)\",\"remediation\":\"Optimize Critical Rendering Path, implement code splitting, compress assets, use CDN, enable caching.\",\"effort\":\"24-40 hours\",\"file\":\"overall architecture\"}"
      TEMP_REPORT=$(mktemp)
      jq --argjson finding "$FINDING" '.findings.critical += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
      mv "$TEMP_REPORT" "$REPORT_FILE"
    elif (( $(echo "$PERF_SCORE < 70" | bc -l) )); then
      FINDING="{\"category\":\"performance\",\"severity\":\"high\",\"title\":\"Moderate Lighthouse performance score\",\"description\":\"Lighthouse performance score is $PERF_SCORE/100 (target: >90)\",\"remediation\":\"Optimize images, implement lazy loading, reduce JavaScript execution time.\",\"effort\":\"12-16 hours\",\"file\":\"overall architecture\"}"
      TEMP_REPORT=$(mktemp)
      jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
      mv "$TEMP_REPORT" "$REPORT_FILE"
    fi

    # Save Lighthouse metrics
    LIGHTHOUSE_METRICS="{\"performanceScore\":$PERF_SCORE,\"firstContentfulPaint\":$FCP,\"largestContentfulPaint\":$LCP,\"timeToInteractive\":$TTI}"
    TEMP_REPORT=$(mktemp)
    jq --argjson metrics "$LIGHTHOUSE_METRICS" \
      '.metrics.lighthouseScores = $metrics' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi

  log_success "Lighthouse audit complete"
else
  log_info "Skipping Lighthouse audit (no APP_URL provided)"
fi

################################################################################
# 5. Analyze Image Optimization
################################################################################

log_info "Analyzing image assets..."
IMAGE_STATS="$OUTPUT_DIR/image-stats.txt"

if [ -d "public" ] || [ -d "src/assets" ]; then
  find public src/assets -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.svg" \) \
    -exec du -b {} + 2>/dev/null | sort -rn > "$IMAGE_STATS" || true

  if [ -s "$IMAGE_STATS" ]; then
    LARGE_IMAGES=$(awk '$1 > 500000' "$IMAGE_STATS" | wc -l)
    TOTAL_IMAGE_SIZE=$(awk '{sum+=$1} END {print sum}' "$IMAGE_STATS")

    if [ "$LARGE_IMAGES" -gt 0 ]; then
      log_info "Found $LARGE_IMAGES images larger than 500KB"

      FINDING="{\"category\":\"image-optimization\",\"severity\":\"medium\",\"title\":\"Unoptimized images detected\",\"description\":\"Found $LARGE_IMAGES images larger than 500KB. Total image size: $(numfmt --to=iec $TOTAL_IMAGE_SIZE).\",\"remediation\":\"Compress images using tools like imagemin, squoosh, or sharp. Convert to modern formats (WebP, AVIF). Implement responsive images.\",\"effort\":\"4-6 hours\",\"file\":\"public/assets\",\"codeExample\":\"<!-- Use modern formats with fallbacks -->\\n<picture>\\n  <source srcset=\\\"image.avif\\\" type=\\\"image/avif\\\">\\n  <source srcset=\\\"image.webp\\\" type=\\\"image/webp\\\">\\n  <img src=\\\"image.jpg\\\" alt=\\\"...\\\">\\n</picture>\"}"
      TEMP_REPORT=$(mktemp)
      jq --argjson finding "$FINDING" '.findings.medium += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
      mv "$TEMP_REPORT" "$REPORT_FILE"
    fi
  fi
fi

################################################################################
# 6. Database Query Analysis
################################################################################

log_info "Analyzing database query patterns..."
QUERY_ISSUES=0

# Check for N+1 query patterns
if grep -rq "\.map.*await\|for.*await.*query" --include="*.ts" --include="*.js" api/ 2>/dev/null; then
  QUERY_ISSUES=$((QUERY_ISSUES + 1))

  FINDING="{\"category\":\"database\",\"severity\":\"high\",\"title\":\"Potential N+1 query pattern\",\"description\":\"Detected potential N+1 query pattern (queries in loops/map).\",\"remediation\":\"Batch queries using Promise.all(), or use database joins. Consider using DataLoader pattern.\",\"effort\":\"8-12 hours\",\"file\":\"api/routes\",\"codeExample\":\"// Bad: N+1 queries\\nconst vehicles = await getVehicles()\\nfor (const v of vehicles) {\\n  v.driver = await getDriver(v.driverId)  // ✗\\n}\\n\\n// Good: Single batch query\\nconst vehicles = await db.query(`\\n  SELECT v.*, d.* FROM vehicles v\\n  LEFT JOIN drivers d ON v.driver_id = d.id\\n`)\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.high += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

# Check for missing indexes (SELECT without WHERE or with unindexed columns)
# This is a heuristic - would need actual DB schema for accurate detection
if [ -d "api" ]; then
  FULL_TABLE_SCANS=$(grep -rc "SELECT \* FROM" --include="*.ts" --include="*.js" api/ 2>/dev/null | \
    awk -F: '{sum+=$2} END {print sum}')

  if [ "$FULL_TABLE_SCANS" -gt 10 ]; then
    FINDING="{\"category\":\"database\",\"severity\":\"medium\",\"title\":\"Potential missing database indexes\",\"description\":\"Found $FULL_TABLE_SCANS SELECT * queries which may indicate missing indexes or inefficient queries.\",\"remediation\":\"Review database queries and add appropriate indexes. Use EXPLAIN ANALYZE to identify slow queries.\",\"effort\":\"6-10 hours\",\"file\":\"database schema\",\"codeExample\":\"-- Add indexes for commonly queried columns\\nCREATE INDEX idx_vehicles_status ON vehicles(status);\\nCREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);\\nCREATE INDEX idx_maintenance_vehicle_id ON maintenance(vehicle_id);\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.medium += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi
fi

log_info "Database analysis: $QUERY_ISSUES issues found"

################################################################################
# 7. React Performance Patterns
################################################################################

log_info "Analyzing React performance patterns..."

# Check for missing React.memo / useMemo / useCallback
MEMO_ISSUES=0

# Large components without memoization
LARGE_COMPONENTS=$(find src -name "*.tsx" -type f | while read f; do
  LINES=$(wc -l < "$f")
  if [ "$LINES" -gt 200 ]; then
    if ! grep -q "React.memo\|useMemo\|useCallback" "$f"; then
      echo "$f"
    fi
  fi
done | wc -l)

if [ "$LARGE_COMPONENTS" -gt 0 ]; then
  MEMO_ISSUES=$((MEMO_ISSUES + 1))

  FINDING="{\"category\":\"react-performance\",\"severity\":\"medium\",\"title\":\"Missing React memoization\",\"description\":\"Found $LARGE_COMPONENTS large components (>200 lines) without memoization (React.memo, useMemo, useCallback).\",\"remediation\":\"Wrap expensive components with React.memo. Use useMemo for expensive computations and useCallback for callback props.\",\"effort\":\"6-10 hours\",\"file\":\"src/components\",\"codeExample\":\"// Memoize expensive component\\nexport const VehicleList = React.memo(({ vehicles, onSelect }) => {\\n  const sortedVehicles = useMemo(() => \\n    vehicles.sort((a, b) => a.name.localeCompare(b.name)),\\n    [vehicles]\\n  )\\n  \\n  const handleClick = useCallback((id) => {\\n    onSelect(id)\\n  }, [onSelect])\\n  \\n  return <div>...</div>\\n})\"}"
  TEMP_REPORT=$(mktemp)
  jq --argjson finding "$FINDING" '.findings.medium += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
  mv "$TEMP_REPORT" "$REPORT_FILE"
fi

# Check for virtual scrolling in large lists
if grep -rq "\.map.*<.*Row\|\.map.*<.*Item" --include="*.tsx" src/ 2>/dev/null; then
  if ! grep -q "react-window\|react-virtualized\|react-virtual" package.json 2>/dev/null; then
    FINDING="{\"category\":\"react-performance\",\"severity\":\"low\",\"title\":\"Missing virtual scrolling for lists\",\"description\":\"Large lists rendered without virtual scrolling library.\",\"remediation\":\"Implement react-window or react-virtual for lists with >50 items.\",\"effort\":\"4-6 hours\",\"file\":\"src/components/lists\",\"codeExample\":\"import { FixedSizeList } from 'react-window'\\n\\n<FixedSizeList\\n  height={600}\\n  itemCount={vehicles.length}\\n  itemSize={50}\\n  width='100%'\\n>\\n  {({ index, style }) => (\\n    <div style={style}>{vehicles[index].name}</div>\\n  )}\\n</FixedSizeList>\"}"
    TEMP_REPORT=$(mktemp)
    jq --argjson finding "$FINDING" '.findings.low += [$finding]' "$REPORT_FILE" > "$TEMP_REPORT"
    mv "$TEMP_REPORT" "$REPORT_FILE"
  fi
fi

log_info "React performance analysis: $MEMO_ISSUES issues"

################################################################################
# 8. Generate Optimization Recommendations
################################################################################

log_info "Generating optimization recommendations..."

OPTIMIZATIONS='[
  {
    "priority": "high",
    "recommendation": "Implement code splitting for all major routes",
    "impact": "30-50% reduction in initial load time",
    "effort": "8 hours"
  },
  {
    "priority": "high",
    "recommendation": "Enable compression (Brotli/Gzip) on production server",
    "impact": "60-70% reduction in transfer size",
    "effort": "2 hours"
  },
  {
    "priority": "medium",
    "recommendation": "Implement service worker for offline caching",
    "impact": "Instant repeat visits, offline functionality",
    "effort": "12 hours"
  },
  {
    "priority": "medium",
    "recommendation": "Optimize images to WebP/AVIF formats",
    "impact": "40-60% reduction in image size",
    "effort": "6 hours"
  },
  {
    "priority": "low",
    "recommendation": "Implement React.lazy() for heavy components",
    "impact": "Faster initial render",
    "effort": "4 hours"
  }
]'

TEMP_REPORT=$(mktemp)
jq --argjson opts "$OPTIMIZATIONS" \
  '.optimizations = $opts' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

################################################################################
# 9. Calculate Summary and Remediation Time
################################################################################

log_info "Calculating summary statistics..."

TEMP_REPORT=$(mktemp)
jq '
  .summary.criticalCount = (.findings.critical | length) |
  .summary.highCount = (.findings.high | length) |
  .summary.mediumCount = (.findings.medium | length) |
  .summary.lowCount = (.findings.low | length) |
  .summary.infoCount = (.findings.info | length) |
  .summary.totalIssues = (.summary.criticalCount + .summary.highCount + .summary.mediumCount + .summary.lowCount + .summary.infoCount)
' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

# Calculate total remediation time
TOTAL_EFFORT=0
for severity in critical high medium low; do
  EFFORT=$(jq -r ".findings.$severity[].effort // \"0 hours\"" "$REPORT_FILE" | \
    sed 's/[^0-9]*//g' | \
    awk '{sum+=$1} END {print sum}')
  TOTAL_EFFORT=$((TOTAL_EFFORT + EFFORT))
done

TEMP_REPORT=$(mktemp)
jq --arg time "$TOTAL_EFFORT hours" \
  '.remediationTime = $time' "$REPORT_FILE" > "$TEMP_REPORT"
mv "$TEMP_REPORT" "$REPORT_FILE"

################################################################################
# 10. Generate Summary
################################################################################

CRITICAL=$(jq '.summary.criticalCount' "$REPORT_FILE")
HIGH=$(jq '.summary.highCount' "$REPORT_FILE")
MEDIUM=$(jq '.summary.mediumCount' "$REPORT_FILE")
LOW=$(jq '.summary.lowCount' "$REPORT_FILE")
TOTAL=$(jq '.summary.totalIssues' "$REPORT_FILE")

log_success "Performance analysis complete!"
echo "----------------------------------------"
echo "Performance Analysis Summary:"
echo "  Critical: $CRITICAL"
echo "  High: $HIGH"
echo "  Medium: $MEDIUM"
echo "  Low: $LOW"
echo "  Total Issues: $TOTAL"
echo "  Estimated Remediation: $TOTAL_EFFORT hours"
echo "----------------------------------------"
echo "Report saved to: $REPORT_FILE"

exit 0
