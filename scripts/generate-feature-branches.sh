#!/bin/bash

# Fleet Feature Branch Generator
# Generates all 42 feature branches from feature_registry.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
REGISTRY="$REPO_ROOT/artifacts/feature_registry.json"

echo "=========================================="
echo "Fleet Feature Branch Generator"
echo "=========================================="

# Check if registry exists
if [ ! -f "$REGISTRY" ]; then
    echo "ERROR: Feature registry not found at $REGISTRY"
    exit 1
fi

# Ensure we're on main and up to date
echo ""
echo "Step 1: Syncing with main branch..."
cd "$REPO_ROOT"
git checkout main
git pull origin main 2>/dev/null || echo "Note: Could not pull from origin"

# Create feature directories
echo ""
echo "Step 2: Creating feature artifact directories..."
mkdir -p artifacts/features

# Extract slugs and create branches
echo ""
echo "Step 3: Creating feature branches..."

TOTAL=$(cat "$REGISTRY" | jq -r '.features | length')
CURRENT=0

cat "$REGISTRY" | jq -r '.features[].slug' | while read slug; do
    CURRENT=$((CURRENT + 1))
    BRANCH_NAME="feature/$slug"
    
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME" 2>/dev/null; then
        echo "[$CURRENT/$TOTAL] Branch exists: $BRANCH_NAME"
    else
        echo "[$CURRENT/$TOTAL] Creating: $BRANCH_NAME"
        git checkout -b "$BRANCH_NAME" main 2>/dev/null
        git checkout main
    fi
    
    # Create feature artifact directory
    mkdir -p "artifacts/features/$slug"
    
    # Initialize status.json
    cat > "artifacts/features/$slug/status.json" << EOF
{
  "slug": "$slug",
  "status": "pending",
  "agent_assigned": false,
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
done

# Return to main
git checkout main

echo ""
echo "=========================================="
echo "Branch Generation Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Total features: $TOTAL"
echo "  - Branches created in: refs/heads/feature/*"
echo "  - Artifact dirs in: artifacts/features/*"
echo ""
echo "To list all feature branches:"
echo "  git branch | grep feature/"
echo ""
echo "To start an agent on a feature:"
echo "  git checkout feature/<slug>"
echo "  # Use FEATURE_AGENT_PROMPT_TEMPLATE.md"
echo ""
