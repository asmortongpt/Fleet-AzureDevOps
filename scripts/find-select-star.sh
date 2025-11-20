#!/bin/bash

# ============================================================================
# SELECT * Detection Script
# Finds all SELECT * queries in TypeScript files
# ============================================================================

set -e

echo "========================================="
echo "SELECT * Query Detection Tool"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SEARCH_DIR="${1:-api/src}"
OUTPUT_FILE="select-star-report.txt"

echo "Searching in: $SEARCH_DIR"
echo ""

# Find all SELECT * queries
echo "Finding SELECT * patterns..."
grep -rn "SELECT\s\+\*" "$SEARCH_DIR" --include="*.ts" | \
  grep -v "node_modules" | \
  grep -v ".test.ts" | \
  sort > "$OUTPUT_FILE"

# Count total instances
TOTAL_COUNT=$(wc -l < "$OUTPUT_FILE")

echo -e "${YELLOW}Found $TOTAL_COUNT SELECT * instances${NC}"
echo ""

# Group by directory
echo "========================================="
echo "By Directory:"
echo "========================================="
awk -F':' '{print $1}' "$OUTPUT_FILE" | \
  xargs -n1 dirname | \
  sort | \
  uniq -c | \
  sort -rn | \
  head -20

echo ""
echo "========================================="
echo "Top 20 Files with Most Instances:"
echo "========================================="
awk -F':' '{print $1}' "$OUTPUT_FILE" | \
  sort | \
  uniq -c | \
  sort -rn | \
  head -20

echo ""
echo "========================================="
echo "High-Priority Services (Security Risk):"
echo "========================================="

# Check for sensitive data exposure patterns
grep -E "(password|token|secret|credential|api_key|ssn|credit_card)" "$OUTPUT_FILE" || echo -e "${GREEN}No obvious sensitive patterns found${NC}"

echo ""
echo "========================================="
echo "Full Report saved to: $OUTPUT_FILE"
echo "========================================="

# Generate CSV for tracking
echo "file,line,query" > "select-star-inventory.csv"
awk -F':' '{print $1","$2","$3}' "$OUTPUT_FILE" >> "select-star-inventory.csv"

echo ""
echo -e "${YELLOW}CSV Inventory created: select-star-inventory.csv${NC}"

# Check if any have been fixed (SELECT with explicit columns)
echo ""
echo "========================================="
echo "Recently Fixed Files (have explicit SELECTs):"
echo "========================================="

# Files that have both old and new patterns
for file in $(awk -F':' '{print $1}' "$OUTPUT_FILE" | sort -u); do
  if grep -q "SELECT.*FROM" "$file" 2>/dev/null; then
    explicit_count=$(grep -c "SELECT [a-z_].*," "$file" 2>/dev/null || echo "0")
    star_count=$(grep -c "SELECT\s\+\*" "$file" 2>/dev/null || echo "0")
    if [ "$explicit_count" -gt 0 ] && [ "$star_count" -gt 0 ]; then
      echo -e "${YELLOW}$file${NC} - Mixed (${explicit_count} explicit, ${star_count} star)"
    elif [ "$explicit_count" -gt 0 ]; then
      echo -e "${GREEN}$file${NC} - Fixed (${explicit_count} explicit queries)"
    fi
  fi
done

echo ""
echo "========================================="
echo "Priority Remediation List:"
echo "========================================="

# High priority: files in services directory
echo ""
echo "1. Core Services (highest priority):"
grep "/services/.*\.ts" "$OUTPUT_FILE" | grep -v "test" | head -10

echo ""
echo "2. Routes (API endpoints):"
grep "/routes/.*\.ts" "$OUTPUT_FILE" | grep -v "test" | head -10

echo ""
echo "3. Other TypeScript files:"
grep "\.ts:" "$OUTPUT_FILE" | grep -v "/services/" | grep -v "/routes/" | head -10

echo ""
echo "========================================="
echo "Remediation Progress:"
echo "========================================="

# Calculate fixed files
TOTAL_TS_FILES=$(find "$SEARCH_DIR" -name "*.ts" -type f | grep -v "node_modules" | grep -v ".test.ts" | wc -l)
FILES_WITH_STAR=$(awk -F':' '{print $1}' "$OUTPUT_FILE" | sort -u | wc -l)
PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", (($TOTAL_TS_FILES - $FILES_WITH_STAR) / $TOTAL_TS_FILES) * 100}")

echo "Total TypeScript files: $TOTAL_TS_FILES"
echo "Files with SELECT *: $FILES_WITH_STAR"
echo "Files cleaned: $(($TOTAL_TS_FILES - $FILES_WITH_STAR))"
echo -e "Completion: ${GREEN}${PERCENTAGE}%${NC}"

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo "1. Review select-star-report.txt for detailed list"
echo "2. Fix high-priority services first (security risk)"
echo "3. Use select-star-inventory.csv to track progress"
echo "4. Run this script after each fix to monitor progress"
echo ""

exit 0
