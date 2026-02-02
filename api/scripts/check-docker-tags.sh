#!/bin/bash
# =============================================================================
# check-docker-tags.sh
# =============================================================================
# Security check script to prevent unpinned Docker image tags (:latest)
# This script should be run as part of CI/CD pipeline to prevent supply chain attacks.
#
# Usage: ./scripts/check-docker-tags.sh
# Exit codes: 0 = success, 1 = :latest tag found, 2 = unpinned base image found
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=============================================="
echo "Docker Image Security Check"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Find all Dockerfiles
DOCKERFILES=$(find "$PROJECT_ROOT" -name "Dockerfile*" -type f ! -path "*/node_modules/*" 2>/dev/null || true)

# Find all Kubernetes/Helm YAML files (exclude CI workflow files which contain the pattern as check strings)
K8S_FILES=$(find "$PROJECT_ROOT" \( -name "*.yaml" -o -name "*.yml" \) -type f ! -path "*/node_modules/*" ! -path "*/.github/workflows/*" 2>/dev/null | grep -v "package" || true)

echo "Checking Dockerfiles for :latest tags..."
echo "-------------------------------------------"

for file in $DOCKERFILES; do
    if [ -f "$file" ]; then
        # Check for :latest tag
        if grep -n ":latest" "$file" 2>/dev/null; then
            echo -e "${RED}ERROR:${NC} :latest tag found in $file"
            ERRORS=$((ERRORS + 1))
        fi

        # Check for unpinned FROM statements (no @sha256: digest)
        # Match FROM statements without @sha256
        UNPINNED=$(grep -n "^FROM " "$file" 2>/dev/null | grep -v "@sha256:" || true)
        if [ -n "$UNPINNED" ]; then
            echo -e "${YELLOW}WARNING:${NC} Unpinned base image (no SHA256 digest) in $file:"
            echo "$UNPINNED"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

echo ""
echo "Checking Kubernetes manifests for :latest tags..."
echo "-------------------------------------------"

for file in $K8S_FILES; do
    if [ -f "$file" ]; then
        # Check for :latest in image: fields
        if grep -n "image:.*:latest" "$file" 2>/dev/null; then
            echo -e "${RED}ERROR:${NC} :latest tag found in $file"
            ERRORS=$((ERRORS + 1))
        fi

        # Check for imagePullPolicy: Always (which defeats the purpose of pinning)
        if grep -n "imagePullPolicy: Always" "$file" 2>/dev/null; then
            echo -e "${YELLOW}WARNING:${NC} imagePullPolicy: Always found in $file (consider IfNotPresent)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

echo ""
echo "=============================================="
echo "Summary"
echo "=============================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}SUCCESS:${NC} All Docker images are properly pinned!"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}WARNINGS:${NC} Found $WARNINGS warning(s), but no critical errors."
    echo "Consider addressing the warnings for better security."
    echo ""
    exit 0
else
    echo -e "${RED}FAILED:${NC} Found $ERRORS error(s) and $WARNINGS warning(s)."
    echo ""
    echo "To fix:"
    echo "  1. Replace :latest tags with specific version tags (e.g., :v1.0.0)"
    echo "  2. Add SHA256 digests to base images in Dockerfiles"
    echo "  3. See docs/DOCKER_BASE_IMAGE_VERSIONS.md for instructions"
    echo ""
    exit 1
fi
