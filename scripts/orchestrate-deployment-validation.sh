#!/bin/bash

################################################################################
# Deployment Validation Orchestrator
# Purpose: Run all validation agents in parallel and monitor results
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${RESULTS_DIR:-./validation-results}"
NAMESPACE="${NAMESPACE:-fleet-management}"
DEPLOYMENT_NAME="${DEPLOYMENT_NAME:-fleet-app}"
BASE_URL="${BASE_URL:-https://fleet.capitaltechalliance.com}"

# Export variables for child scripts
export RESULTS_DIR
export NAMESPACE
export DEPLOYMENT_NAME
export BASE_URL

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[ORCHESTRATOR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log_success() {
    echo -e "${GREEN}[ORCHESTRATOR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

################################################################################
# Cleanup previous results
################################################################################

cleanup_results() {
    log_info "Cleaning up previous validation results..."

    if [ -d "$RESULTS_DIR" ]; then
        # Archive old results
        local archive_name="validation-results-archive-$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$archive_name" "$RESULTS_DIR" 2>/dev/null || true
        log_info "Archived old results to: $archive_name"

        # Clean results directory
        rm -rf "${RESULTS_DIR:?}"/*
    fi

    mkdir -p "$RESULTS_DIR"
    log_success "Results directory ready: $RESULTS_DIR"
}

################################################################################
# Run validation agents in parallel
################################################################################

run_validation_agents() {
    log_info "Starting all validation agents in parallel..."

    local agents_dir="${SCRIPT_DIR}/validation-agents"
    local pids=()

    # Make all scripts executable
    chmod +x "${agents_dir}"/*.sh
    chmod +x "${SCRIPT_DIR}"/*.sh

    # Start PDCA validator
    log_info "Starting PDCA validator..."
    bash "${agents_dir}/pdca-validator.sh" > "${RESULTS_DIR}/pdca-validator.log" 2>&1 &
    pids+=($!)

    # Start Visual Regression validator
    log_info "Starting Visual Regression validator..."
    bash "${agents_dir}/visual-regression-validator.sh" > "${RESULTS_DIR}/visual-regression.log" 2>&1 &
    pids+=($!)

    # Start Performance validator
    log_info "Starting Performance validator..."
    bash "${agents_dir}/performance-validator.sh" > "${RESULTS_DIR}/performance-validator.log" 2>&1 &
    pids+=($!)

    # Start Smoke Test validator
    log_info "Starting Smoke Test validator..."
    bash "${agents_dir}/smoke-test-validator.sh" > "${RESULTS_DIR}/smoke-test-validator.log" 2>&1 &
    pids+=($!)

    log_success "All validation agents started (PIDs: ${pids[*]})"

    # Return the PIDs for monitoring
    echo "${pids[@]}"
}

################################################################################
# Monitor validation agent progress
################################################################################

monitor_agents() {
    local pids=("$@")

    log_info "Monitoring ${#pids[@]} validation agents..."

    local total=${#pids[@]}
    local completed=0

    while [ $completed -lt $total ]; do
        completed=0

        for pid in "${pids[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                ((completed++))
            fi
        done

        if [ $completed -lt $total ]; then
            log_info "Progress: $completed/$total agents completed"
            sleep 10
        fi
    done

    log_success "All validation agents completed"

    # Check exit codes
    local all_success=true
    local agent_names=("pdca-validator" "visual-regression" "performance-validator" "smoke-tester")
    local index=0

    for pid in "${pids[@]}"; do
        if wait "$pid"; then
            log_success "${agent_names[$index]} completed successfully"
        else
            log_info "${agent_names[$index]} completed with errors (see logs)"
            all_success=false
        fi
        ((index++))
    done

    return 0
}

################################################################################
# Display validation summary
################################################################################

display_validation_summary() {
    log_info "=== Validation Summary ==="
    echo ""

    local results_found=0

    for result_file in "${RESULTS_DIR}"/*-result.json; do
        if [ -f "$result_file" ]; then
            results_found=1
            local agent=$(jq -r '.agent' "$result_file")
            local status=$(jq -r '.status' "$result_file")
            local timestamp=$(jq -r '.timestamp' "$result_file")

            if [ "$status" = "PASSED" ]; then
                echo -e "${GREEN}✓${NC} $agent - $status ($timestamp)"
            else
                echo -e "${YELLOW}✗${NC} $agent - $status ($timestamp)"
                local error=$(jq -r '.error // "No error message"' "$result_file")
                echo "    Error: $error"
            fi
        fi
    done

    if [ $results_found -eq 0 ]; then
        echo "No validation results found"
    fi

    echo ""
}

################################################################################
# Main orchestration
################################################################################

main() {
    log_info "======================================================"
    log_info "Deployment Validation Orchestration Started"
    log_info "======================================================"
    log_info "Deployment: $DEPLOYMENT_NAME"
    log_info "Namespace: $NAMESPACE"
    log_info "Base URL: $BASE_URL"
    log_info "Results Directory: $RESULTS_DIR"
    echo ""

    # Step 1: Cleanup previous results
    cleanup_results

    # Step 2: Run all validation agents in parallel
    local agent_pids=($(run_validation_agents))

    echo ""
    log_info "Waiting for validation agents to complete..."
    echo ""

    # Step 3: Monitor agent progress
    monitor_agents "${agent_pids[@]}"

    echo ""

    # Step 4: Display summary
    display_validation_summary

    # Step 5: Run deployment validation monitor
    log_info "======================================================"
    log_info "Starting Deployment Validation Monitor"
    log_info "======================================================"
    echo ""

    if bash "${SCRIPT_DIR}/deployment-validation-monitor.sh"; then
        log_success "======================================================"
        log_success "DEPLOYMENT VALIDATION: SUCCESS"
        log_success "======================================================"
        exit 0
    else
        log_info "======================================================"
        log_info "DEPLOYMENT VALIDATION: ROLLBACK EXECUTED"
        log_info "======================================================"
        exit 1
    fi
}

# Trap errors
trap 'log_info "Error occurred in orchestration script"' ERR

# Run main orchestration
main "$@"
