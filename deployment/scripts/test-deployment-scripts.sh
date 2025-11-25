#!/bin/bash
#=============================================================================
# Test Deployment Scripts - Dry Run Validation
#=============================================================================
# Validates that all deployment scripts are properly configured and executable
# Does NOT actually deploy anything - just checks prerequisites
#
# USAGE:
#   ./test-deployment-scripts.sh
#=============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     Deployment Scripts - Configuration Test                      ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

test_count=0
pass_count=0
fail_count=0

run_test() {
  local test_name="$1"
  local test_command="$2"

  test_count=$((test_count + 1))
  echo -n "${test_count}. ${test_name}..."

  if eval "${test_command}" > /dev/null 2>&1; then
    echo " ✅ PASS"
    pass_count=$((pass_count + 1))
    return 0
  else
    echo " ❌ FAIL"
    fail_count=$((fail_count + 1))
    return 1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SCRIPT EXISTENCE & PERMISSIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "deploy-with-validation.sh exists" "test -f '${SCRIPT_DIR}/deploy-with-validation.sh'"
run_test "deploy-with-validation.sh is executable" "test -x '${SCRIPT_DIR}/deploy-with-validation.sh'"

run_test "deploy-complete-pipeline.sh exists" "test -f '${SCRIPT_DIR}/deploy-complete-pipeline.sh'"
run_test "deploy-complete-pipeline.sh is executable" "test -x '${SCRIPT_DIR}/deploy-complete-pipeline.sh'"

run_test "quick-deploy.sh exists" "test -f '${SCRIPT_DIR}/quick-deploy.sh'"
run_test "quick-deploy.sh is executable" "test -x '${SCRIPT_DIR}/quick-deploy.sh'"

run_test "monitor-acr-build.sh exists" "test -f '${SCRIPT_DIR}/monitor-acr-build.sh'"
run_test "monitor-acr-build.sh is executable" "test -x '${SCRIPT_DIR}/monitor-acr-build.sh'"

run_test "watch-deployment.sh exists" "test -f '${SCRIPT_DIR}/watch-deployment.sh'"
run_test "watch-deployment.sh is executable" "test -x '${SCRIPT_DIR}/watch-deployment.sh'"

run_test "test-production-health.sh exists" "test -f '${SCRIPT_DIR}/test-production-health.sh'"
run_test "test-production-health.sh is executable" "test -x '${SCRIPT_DIR}/test-production-health.sh'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PREREQUISITES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Azure CLI installed" "command -v az"
run_test "kubectl installed" "command -v kubectl"
run_test "npm installed" "command -v npm"
run_test "npx installed" "command -v npx"
run_test "git installed" "command -v git"
run_test "curl installed" "command -v curl"
run_test "jq installed" "command -v jq || true"  # Optional

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AZURE AUTHENTICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Azure CLI authenticated" "az account show"
run_test "ACR access (fleetappregistry)" "az acr show --name fleetappregistry"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "KUBERNETES ACCESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "kubectl configured" "kubectl cluster-info"
run_test "AKS cluster accessible" "kubectl get nodes"
run_test "Namespace: fleet-management-staging" "kubectl get namespace fleet-management-staging"
run_test "Namespace: fleet-management-production" "kubectl get namespace fleet-management-production"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST INFRASTRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Playwright config exists" "test -f /Users/andrewmorton/Documents/GitHub/Fleet/playwright.config.ts"
run_test "Smoke tests exist" "test -f /Users/andrewmorton/Documents/GitHub/Fleet/e2e/00-smoke-tests.spec.ts"
run_test "Validation tests exist" "test -f /Users/andrewmorton/Documents/GitHub/Fleet/e2e/deployment-validation.spec.ts"
run_test "Production verification exists" "test -f /Users/andrewmorton/Documents/GitHub/Fleet/e2e/production-verification.spec.ts"

# Test if Playwright is accessible
if command -v npx &> /dev/null; then
  run_test "Playwright available via npx" "npx playwright --version"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "KUBERNETES RESOURCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Deployment manifest exists" "test -f ${SCRIPT_DIR}/../kubernetes/deployment-optimized.yaml"
run_test "Service manifest exists" "test -f ${SCRIPT_DIR}/../kubernetes/service.yaml"
run_test "Ingress manifest exists" "test -f ${SCRIPT_DIR}/../kubernetes/ingress.yaml"
run_test "Validation job manifest exists" "test -f ${SCRIPT_DIR}/../kubernetes/deployment-validation-job.yaml"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ACR IMAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if images exist
if az acr repository list --name fleetappregistry --output tsv 2>/dev/null | grep -q "fleet-frontend"; then
  echo "✓ fleet-frontend repository exists"
  pass_count=$((pass_count + 1))
else
  echo "✗ fleet-frontend repository not found"
  fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))

if az acr repository list --name fleetappregistry --output tsv 2>/dev/null | grep -q "fleet-api"; then
  echo "✓ fleet-api repository exists"
  pass_count=$((pass_count + 1))
else
  echo "✗ fleet-api repository not found"
  fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CURRENT DEPLOYMENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check staging
echo "Staging Environment:"
kubectl get deployment -n fleet-management-staging 2>/dev/null | grep fleet || echo "  No deployments found"

echo ""
echo "Production Environment:"
kubectl get deployment -n fleet-management-production 2>/dev/null | grep fleet || echo "  No deployments found"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Total Tests: ${test_count}"
echo "  Passed:      ${pass_count}"
echo "  Failed:      ${fail_count}"
echo ""

if [ ${fail_count} -eq 0 ]; then
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║  ✅ ALL CHECKS PASSED - Ready to Deploy                          ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Next steps:"
  echo "    1. Deploy to staging: ./deployment/scripts/quick-deploy.sh staging latest"
  echo "    2. Monitor deployment: ./deployment/scripts/watch-deployment.sh staging"
  echo "    3. Verify health: ./deployment/scripts/test-production-health.sh staging"
  echo ""
  exit 0
else
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║  ❌ SOME CHECKS FAILED - Review Issues Above                     ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Common fixes:"
  echo "    • Azure login: az login"
  echo "    • AKS access: az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster"
  echo "    • Install Playwright: npm install -g playwright && npx playwright install chromium"
  echo ""
  exit 1
fi
