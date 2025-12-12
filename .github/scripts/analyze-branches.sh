#!/bin/bash
# Branch Analysis and Cleanup Script for Fleet Repository
# This script helps identify stale branches and provides cleanup recommendations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STALE_THRESHOLD_DAYS=180  # 6 months
OLD_THRESHOLD_DAYS=90     # 3 months

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Fleet Repository Branch Analysis & Cleanup Tool    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ensure we have latest remote info
echo -e "${GREEN}📡 Fetching latest remote information...${NC}"
git fetch --all --prune

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"
echo ""

# ============================================================================
# BRANCH STATISTICS
# ============================================================================

echo -e "${BLUE}═══ Branch Statistics ═══${NC}"
echo ""

TOTAL_LOCAL=$(git branch | wc -l | tr -d ' ')
TOTAL_REMOTE=$(git branch -r | grep -v HEAD | wc -l | tr -d ' ')
TOTAL_MERGED=$(git branch -r --merged origin/main | grep -v HEAD | wc -l | tr -d ' ')

echo "Total local branches:  $TOTAL_LOCAL"
echo "Total remote branches: $TOTAL_REMOTE"
echo "Merged to main:        $TOTAL_MERGED"
echo ""

# ============================================================================
# STALE BRANCHES (>6 months)
# ============================================================================

echo -e "${BLUE}═══ Stale Branches (>6 months old) ═══${NC}"
echo ""

STALE_DATE=$(date -v-${STALE_THRESHOLD_DAYS}d +%Y-%m-%d 2>/dev/null || date -d "$STALE_THRESHOLD_DAYS days ago" +%Y-%m-%d)

STALE_BRANCHES=$(git for-each-ref --sort=-committerdate refs/remotes/ \
  --format='%(committerdate:short)|%(refname:short)|%(authorname)' \
  | grep -v HEAD \
  | awk -v date="$STALE_DATE" -F'|' '$1 < date {print $0}')

if [ -z "$STALE_BRANCHES" ]; then
  echo -e "${GREEN}✅ No stale branches found${NC}"
else
  STALE_COUNT=$(echo "$STALE_BRANCHES" | wc -l | tr -d ' ')
  echo -e "${YELLOW}Found $STALE_COUNT stale branches:${NC}"
  echo ""
  echo "Date       | Branch | Author"
  echo "-----------|--------|--------"
  echo "$STALE_BRANCHES" | while IFS='|' read -r date branch author; do
    printf "%-10s | %-40s | %s\n" "$date" "${branch#origin/}" "$author"
  done
fi
echo ""

# ============================================================================
# OLD BRANCHES (>3 months)
# ============================================================================

echo -e "${BLUE}═══ Old Branches (3-6 months old) ═══${NC}"
echo ""

OLD_DATE=$(date -v-${OLD_THRESHOLD_DAYS}d +%Y-%m-%d 2>/dev/null || date -d "$OLD_THRESHOLD_DAYS days ago" +%Y-%m-%d)

OLD_BRANCHES=$(git for-each-ref --sort=-committerdate refs/remotes/ \
  --format='%(committerdate:short)|%(refname:short)|%(authorname)' \
  | grep -v HEAD \
  | awk -v old="$OLD_DATE" -v stale="$STALE_DATE" -F'|' '$1 >= stale && $1 < old {print $0}')

if [ -z "$OLD_BRANCHES" ]; then
  echo -e "${GREEN}✅ No old branches found${NC}"
else
  OLD_COUNT=$(echo "$OLD_BRANCHES" | wc -l | tr -d ' ')
  echo -e "${YELLOW}Found $OLD_COUNT old branches:${NC}"
  echo ""
  echo "Date       | Branch | Author"
  echo "-----------|--------|--------"
  echo "$OLD_BRANCHES" | head -20 | while IFS='|' read -r date branch author; do
    printf "%-10s | %-40s | %s\n" "$date" "${branch#origin/}" "$author"
  done

  if [ $(echo "$OLD_BRANCHES" | wc -l) -gt 20 ]; then
    echo "... and $((OLD_COUNT - 20)) more"
  fi
fi
echo ""

# ============================================================================
# MERGED BRANCHES
# ============================================================================

echo -e "${BLUE}═══ Branches Already Merged to Main ═══${NC}"
echo ""

MERGED_BRANCHES=$(git branch -r --merged origin/main | grep -v HEAD | grep -v "origin/main" | sed 's/origin\///')

if [ -z "$MERGED_BRANCHES" ]; then
  echo -e "${GREEN}✅ No merged branches to clean up${NC}"
else
  MERGED_COUNT=$(echo "$MERGED_BRANCHES" | wc -l | tr -d ' ')
  echo -e "${YELLOW}Found $MERGED_COUNT merged branches:${NC}"
  echo ""
  echo "$MERGED_BRANCHES" | head -20
  if [ $(echo "$MERGED_BRANCHES" | wc -l) -gt 20 ]; then
    echo "... and $((MERGED_COUNT - 20)) more"
  fi
fi
echo ""

# ============================================================================
# RECENT ACTIVE BRANCHES
# ============================================================================

echo -e "${BLUE}═══ Recently Active Branches (last 30 days) ═══${NC}"
echo ""

RECENT_DATE=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d "30 days ago" +%Y-%m-%d)

RECENT_BRANCHES=$(git for-each-ref --sort=-committerdate refs/remotes/ \
  --format='%(committerdate:short)|%(refname:short)|%(authorname)' \
  | grep -v HEAD \
  | awk -v date="$RECENT_DATE" -F'|' '$1 >= date {print $0}' \
  | head -20)

if [ -z "$RECENT_BRANCHES" ]; then
  echo -e "${YELLOW}No recent activity${NC}"
else
  echo "Date       | Branch | Author"
  echo "-----------|--------|--------"
  echo "$RECENT_BRANCHES" | while IFS='|' read -r date branch author; do
    printf "%-10s | %-40s | %s\n" "$date" "${branch#origin/}" "$author"
  done
fi
echo ""

# ============================================================================
# CLAUDE-GENERATED BRANCHES
# ============================================================================

echo -e "${BLUE}═══ Claude-Generated Branches ═══${NC}"
echo ""

CLAUDE_BRANCHES=$(git branch -r | grep -E "claude/|copilot/|codex/" | sed 's/origin\///')

if [ -z "$CLAUDE_BRANCHES" ]; then
  echo -e "${GREEN}✅ No AI-generated branches${NC}"
else
  CLAUDE_COUNT=$(echo "$CLAUDE_BRANCHES" | wc -l | tr -d ' ')
  echo -e "${YELLOW}Found $CLAUDE_COUNT AI-generated branches${NC}"
  echo ""
  echo "$CLAUDE_BRANCHES" | head -20
  if [ $(echo "$CLAUDE_BRANCHES" | wc -l) -gt 20 ]; then
    echo "... and $((CLAUDE_COUNT - 20)) more"
  fi
fi
echo ""

# ============================================================================
# CLEANUP RECOMMENDATIONS
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Cleanup Recommendations                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Generate cleanup script
CLEANUP_SCRIPT=".github/scripts/cleanup-branches.sh"

cat > "$CLEANUP_SCRIPT" <<'CLEANUP_EOF'
#!/bin/bash
# Auto-generated branch cleanup script
# Review carefully before executing!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  WARNING: This will delete branches from the remote repository${NC}"
echo -e "${YELLOW}Review the branch list carefully before proceeding${NC}"
echo ""

read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting branch cleanup...${NC}"
echo ""

CLEANUP_EOF

# Add stale branches to cleanup script
if [ -n "$STALE_BRANCHES" ]; then
  echo -e "📋 ${YELLOW}Stale branches (recommended for deletion):${NC}"
  echo "   Command: Delete branches older than 6 months"
  echo ""

  echo "$STALE_BRANCHES" | while IFS='|' read -r date branch author; do
    BRANCH_NAME="${branch#origin/}"
    echo "echo -e \"Deleting: ${YELLOW}$BRANCH_NAME${NC} (last commit: $date)\"" >> "$CLEANUP_SCRIPT"
    echo "git push origin --delete \"$BRANCH_NAME\" 2>/dev/null || echo \"  Already deleted\"" >> "$CLEANUP_SCRIPT"
  done

  echo "" >> "$CLEANUP_SCRIPT"
fi

# Add merged branches to cleanup script
if [ -n "$MERGED_BRANCHES" ]; then
  echo -e "📋 ${GREEN}Merged branches (safe to delete):${NC}"
  echo "   Command: Delete branches already merged to main"
  echo ""

  echo "$MERGED_BRANCHES" | while read -r branch; do
    if [ ! -z "$branch" ]; then
      echo "echo -e \"Deleting merged: ${GREEN}$branch${NC}\"" >> "$CLEANUP_SCRIPT"
      echo "git push origin --delete \"$branch\" 2>/dev/null || echo \"  Already deleted\"" >> "$CLEANUP_SCRIPT"
    fi
  done

  echo "" >> "$CLEANUP_SCRIPT"
fi

echo "echo \"\"" >> "$CLEANUP_SCRIPT"
echo "echo -e \"\${GREEN}✅ Cleanup complete\${NC}\"" >> "$CLEANUP_SCRIPT"
echo "echo \"\"" >> "$CLEANUP_SCRIPT"
echo "echo \"Fetching updated branch list...\"" >> "$CLEANUP_SCRIPT"
echo "git fetch --all --prune" >> "$CLEANUP_SCRIPT"

chmod +x "$CLEANUP_SCRIPT"

echo -e "${GREEN}Generated cleanup script: $CLEANUP_SCRIPT${NC}"
echo ""
echo -e "To execute cleanup:"
echo -e "  ${YELLOW}bash $CLEANUP_SCRIPT${NC}"
echo ""

# ============================================================================
# MANUAL CLEANUP COMMANDS
# ============================================================================

echo -e "${BLUE}═══ Manual Cleanup Commands ═══${NC}"
echo ""
echo "# Delete a single remote branch:"
echo "  git push origin --delete <branch-name>"
echo ""
echo "# Delete multiple branches:"
echo "  git branch -r | grep 'pattern' | sed 's/origin\\///' | xargs -I {} git push origin --delete {}"
echo ""
echo "# Prune deleted remote branches locally:"
echo "  git fetch --all --prune"
echo ""
echo "# Delete local branches already merged to main:"
echo "  git branch --merged main | grep -v '\\*\\|main\\|develop' | xargs -I {} git branch -d {}"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Summary                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_CANDIDATES=$((${STALE_COUNT:-0} + ${MERGED_COUNT:-0}))

if [ $TOTAL_CANDIDATES -gt 0 ]; then
  echo -e "Total cleanup candidates: ${YELLOW}$TOTAL_CANDIDATES branches${NC}"
  echo -e "  - Stale (>6 months): ${STALE_COUNT:-0}"
  echo -e "  - Merged to main: ${MERGED_COUNT:-0}"
  echo ""
  echo -e "${GREEN}Potential space savings: Estimate 10-50MB per branch${NC}"
else
  echo -e "${GREEN}✅ Repository is clean - no branches need cleanup${NC}"
fi

echo ""
echo -e "Analysis complete! $(date)"
echo ""
