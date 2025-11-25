#!/bin/bash
#=============================================================================
# Quick Deploy - Simplified Deployment Script
#=============================================================================
# Quick deployment for when you have a working ACR build ready
#
# USAGE:
#   ./quick-deploy.sh staging latest
#   ./quick-deploy.sh production v1.2.3
#=============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          Fleet Management - Quick Deploy                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Environment:  ${ENVIRONMENT}"
echo "  Image Tag:    ${IMAGE_TAG}"
echo ""

# Validate inputs
if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|production)$ ]]; then
  echo "❌ Invalid environment: ${ENVIRONMENT}"
  echo "   Valid options: dev, staging, production"
  exit 1
fi

# Production confirmation
if [ "${ENVIRONMENT}" = "production" ]; then
  echo "⚠️  WARNING: Deploying to PRODUCTION"
  echo ""
  read -p "Continue? (yes/no): " confirm
  if [ "${confirm}" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
  fi
  echo ""
fi

# Execute deployment with validation
"${SCRIPT_DIR}/deploy-with-validation.sh" "${ENVIRONMENT}" "${IMAGE_TAG}"

exit $?
