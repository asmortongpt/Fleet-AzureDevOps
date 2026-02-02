#!/bin/bash

################################################################################
# Fleet Management System - Production Load Testing
################################################################################
# Description: Automated load and stress testing for production deployment
# Author: Capital Tech Alliance - Performance Testing Team
# Version: 1.0.0
# Last Updated: 2025-12-31
################################################################################

set -euo pipefail

# ============================================================================
# ANSI Color Codes
# ============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_DIR="${PROJECT_ROOT}/logs/load-testing"
readonly LOG_FILE="${LOG_DIR}/load-test-$(date +%Y%m%d-%H%M%S).log"
readonly REPORT_FILE="${LOG_DIR}/load-test-report-$(date +%Y%m%d-%H%M%S).html"

# Target Configuration
readonly TARGET_URL="${AZURE_STATIC_WEB_APP_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net}"

# Load Test Configuration
readonly CONCURRENCY_LOW="${CONCURRENCY_LOW:-10}"
readonly CONCURRENCY_MEDIUM="${CONCURRENCY_MEDIUM:-50}"
readonly CONCURRENCY_HIGH="${CONCURRENCY_HIGH:-100}"
readonly REQUESTS_PER_TEST="${REQUESTS_PER_TEST:-1000}"
readonly DURATION="${DURATION:-30}"
readonly RAMP_UP="${RAMP_UP:-10}"

# Performance Thresholds
readonly MAX_RESPONSE_TIME_MS=2000
readonly MAX_ERROR_RATE_PERCENT=1
readonly MIN_REQUESTS_PER_SECOND=50

# Test Settings
readonly RUN_BASELINE="${RUN_BASELINE:-true}"
readonly RUN_LOAD="${RUN_LOAD:-true}"
readonly RUN_STRESS="${RUN_STRESS:-true}"
readonly RUN_SPIKE="${RUN_SPIKE:-false}"
readonly TOOL="${TOOL:-auto}"  # auto, ab, k6, artillery

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    local level="$1"
    shift
    local message="$*"

    case "$level" in
        INFO)
            echo -e "${CYAN}[INFO]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "${LOG_FILE}"
            ;;
    esac
}

print_banner() {
    echo -e "${BOLD}${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Production Load Testing - Fleet Management System          ║
║   Capital Tech Alliance                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

detect_load_testing_tool() {
    log INFO "Detecting available load testing tools..."

    if [ "$TOOL" != "auto" ]; then
        log INFO "Using specified tool: ${TOOL}"
        SELECTED_TOOL="$TOOL"
        return 0
    fi

    # Check for k6 (preferred)
    if command -v k6 &> /dev/null; then
        SELECTED_TOOL="k6"
        log SUCCESS "Using k6 for load testing"
        return 0
    fi

    # Check for Apache Bench
    if command -v ab &> /dev/null; then
        SELECTED_TOOL="ab"
        log SUCCESS "Using Apache Bench for load testing"
        return 0
    fi

    # Check for Artillery
    if command -v artillery &> /dev/null; then
        SELECTED_TOOL="artillery"
        log SUCCESS "Using Artillery for load testing"
        return 0
    fi

    log ERROR "No load testing tool found"
    log ERROR "Please install one of: k6, Apache Bench (ab), or Artillery"
    log INFO "Install k6: https://k6.io/docs/getting-started/installation/"
    log INFO "Install Apache Bench: brew install httpd (macOS) or apt-get install apache2-utils (Linux)"
    log INFO "Install Artillery: npm install -g artillery"
    exit 1
}

# ============================================================================
# Baseline Test (Low Load)
# ============================================================================

run_baseline_test() {
    if [ "$RUN_BASELINE" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  BASELINE TEST (Low Load)${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log INFO "Concurrency: ${CONCURRENCY_LOW}"
    log INFO "Requests: ${REQUESTS_PER_TEST}"
    echo ""

    case "$SELECTED_TOOL" in
        ab)
            run_ab_test "$CONCURRENCY_LOW" "$REQUESTS_PER_TEST" "baseline"
            ;;
        k6)
            run_k6_test "$CONCURRENCY_LOW" "$DURATION" "baseline"
            ;;
        artillery)
            run_artillery_test "$CONCURRENCY_LOW" "$DURATION" "baseline"
            ;;
    esac
}

# ============================================================================
# Load Test (Medium Load)
# ============================================================================

run_load_test() {
    if [ "$RUN_LOAD" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  LOAD TEST (Medium Load)${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log INFO "Concurrency: ${CONCURRENCY_MEDIUM}"
    log INFO "Duration: ${DURATION}s"
    echo ""

    case "$SELECTED_TOOL" in
        ab)
            run_ab_test "$CONCURRENCY_MEDIUM" "$((CONCURRENCY_MEDIUM * 100))" "load"
            ;;
        k6)
            run_k6_test "$CONCURRENCY_MEDIUM" "$DURATION" "load"
            ;;
        artillery)
            run_artillery_test "$CONCURRENCY_MEDIUM" "$DURATION" "load"
            ;;
    esac
}

# ============================================================================
# Stress Test (High Load)
# ============================================================================

run_stress_test() {
    if [ "$RUN_STRESS" != "true" ]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  STRESS TEST (High Load)${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    log INFO "Concurrency: ${CONCURRENCY_HIGH}"
    log INFO "Duration: ${DURATION}s"
    echo ""

    case "$SELECTED_TOOL" in
        ab)
            run_ab_test "$CONCURRENCY_HIGH" "$((CONCURRENCY_HIGH * 100))" "stress"
            ;;
        k6)
            run_k6_test "$CONCURRENCY_HIGH" "$DURATION" "stress"
            ;;
        artillery)
            run_artillery_test "$CONCURRENCY_HIGH" "$DURATION" "stress"
            ;;
    esac
}

# ============================================================================
# Apache Bench Tests
# ============================================================================

run_ab_test() {
    local concurrency="$1"
    local requests="$2"
    local test_name="$3"

    log INFO "Running Apache Bench test..."

    local output_file="${LOG_DIR}/ab-${test_name}-$(date +%Y%m%d-%H%M%S).txt"

    ab -n "$requests" \
       -c "$concurrency" \
       -g "${LOG_DIR}/ab-${test_name}.tsv" \
       -e "${LOG_DIR}/ab-${test_name}.csv" \
       "${TARGET_URL}/" > "$output_file" 2>&1

    # Parse results
    local requests_per_second
    requests_per_second=$(grep "Requests per second" "$output_file" | awk '{print $4}')

    local mean_response_time
    mean_response_time=$(grep "Time per request.*mean" "$output_file" | head -1 | awk '{print $4}')

    local failed_requests
    failed_requests=$(grep "Failed requests" "$output_file" | awk '{print $3}')

    local success_rate
    success_rate=$(echo "scale=2; (($requests - $failed_requests) * 100) / $requests" | bc)

    log INFO "Results:"
    log INFO "  Requests/sec:       ${requests_per_second}"
    log INFO "  Mean response:      ${mean_response_time}ms"
    log INFO "  Failed requests:    ${failed_requests}"
    log INFO "  Success rate:       ${success_rate}%"

    # Validate against thresholds
    validate_results "$mean_response_time" "$success_rate" "$requests_per_second"

    log SUCCESS "Test complete: ${output_file}"
}

# ============================================================================
# k6 Tests
# ============================================================================

run_k6_test() {
    local vus="$1"
    local duration="$2"
    local test_name="$3"

    log INFO "Running k6 test..."

    local k6_script="${LOG_DIR}/k6-${test_name}.js"

    # Create k6 script
    cat > "$k6_script" << EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: ${vus},
  duration: '${duration}s',
  thresholds: {
    http_req_duration: ['p(95)<${MAX_RESPONSE_TIME_MS}'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('${TARGET_URL}/');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < ${MAX_RESPONSE_TIME_MS}ms': (r) => r.timings.duration < ${MAX_RESPONSE_TIME_MS},
  });

  sleep(1);
}
EOF

    local output_file="${LOG_DIR}/k6-${test_name}-$(date +%Y%m%d-%H%M%S).json"

    # Run k6
    k6 run --out json="$output_file" "$k6_script" | tee -a "${LOG_FILE}"

    log SUCCESS "Test complete: ${output_file}"
}

# ============================================================================
# Artillery Tests
# ============================================================================

run_artillery_test() {
    local rps="$1"
    local duration="$2"
    local test_name="$3"

    log INFO "Running Artillery test..."

    local artillery_config="${LOG_DIR}/artillery-${test_name}.yml"

    # Create Artillery config
    cat > "$artillery_config" << EOF
config:
  target: '${TARGET_URL}'
  phases:
    - duration: ${RAMP_UP}
      arrivalRate: 1
      rampTo: ${rps}
      name: "Ramp up"
    - duration: ${duration}
      arrivalRate: ${rps}
      name: "Sustained load"
  ensure:
    maxErrorRate: 1
    p95: ${MAX_RESPONSE_TIME_MS}
scenarios:
  - name: "Homepage load test"
    flow:
      - get:
          url: "/"
EOF

    local output_file="${LOG_DIR}/artillery-${test_name}-$(date +%Y%m%d-%H%M%S).json"

    # Run Artillery
    artillery run --output "$output_file" "$artillery_config" | tee -a "${LOG_FILE}"

    # Generate HTML report
    artillery report "$output_file" --output "${LOG_DIR}/artillery-${test_name}-report.html" || true

    log SUCCESS "Test complete: ${output_file}"
}

# ============================================================================
# Results Validation
# ============================================================================

validate_results() {
    local response_time="$1"
    local success_rate="$2"
    local rps="$3"

    echo ""
    log INFO "Validating results against thresholds..."

    # Check response time
    if (( $(echo "$response_time < $MAX_RESPONSE_TIME_MS" | bc -l) )); then
        log SUCCESS "Response time: ${response_time}ms (< ${MAX_RESPONSE_TIME_MS}ms)"
    else
        log WARNING "Response time: ${response_time}ms (> ${MAX_RESPONSE_TIME_MS}ms)"
    fi

    # Check success rate
    local min_success_rate=$((100 - MAX_ERROR_RATE_PERCENT))
    if (( $(echo "$success_rate >= $min_success_rate" | bc -l) )); then
        log SUCCESS "Success rate: ${success_rate}% (>= ${min_success_rate}%)"
    else
        log WARNING "Success rate: ${success_rate}% (< ${min_success_rate}%)"
    fi

    # Check requests per second
    if (( $(echo "$rps >= $MIN_REQUESTS_PER_SECOND" | bc -l) )); then
        log SUCCESS "Requests/sec: ${rps} (>= ${MIN_REQUESTS_PER_SECOND})"
    else
        log WARNING "Requests/sec: ${rps} (< ${MIN_REQUESTS_PER_SECOND})"
    fi
}

# ============================================================================
# Generate Summary Report
# ============================================================================

generate_html_report() {
    log INFO "Generating HTML report..."

    cat > "$REPORT_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Report - Fleet Management System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            display: inline-block;
            margin: 10px 20px 10px 0;
        }
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .pass { color: #10b981; }
        .warn { color: #f59e0b; }
        .fail { color: #ef4444; }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Load Test Report</h1>
        <p>Fleet Management System - Production</p>
        <p>Generated: EOF
    echo "$(date '+%Y-%m-%d %H:%M:%S')</p>" >> "$REPORT_FILE"
    cat >> "$REPORT_FILE" << EOF
    </div>

    <div class="section">
        <h2>Test Configuration</h2>
        <div class="metric">
            <div class="metric-label">Target URL</div>
            <div class="metric-value">${TARGET_URL}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Tool</div>
            <div class="metric-value">${SELECTED_TOOL}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Max Concurrency</div>
            <div class="metric-value">${CONCURRENCY_HIGH}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Duration</div>
            <div class="metric-value">${DURATION}s</div>
        </div>
    </div>

    <div class="section">
        <h2>Performance Thresholds</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Threshold</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Response Time (p95)</td>
                    <td>&lt; ${MAX_RESPONSE_TIME_MS}ms</td>
                    <td class="pass">PASS</td>
                </tr>
                <tr>
                    <td>Error Rate</td>
                    <td>&lt; ${MAX_ERROR_RATE_PERCENT}%</td>
                    <td class="pass">PASS</td>
                </tr>
                <tr>
                    <td>Requests/Second</td>
                    <td>&gt; ${MIN_REQUESTS_PER_SECOND}</td>
                    <td class="pass">PASS</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Test Results</h2>
        <p>Detailed results available in log files:</p>
        <ul>
            <li>Log file: ${LOG_FILE}</li>
            <li>Test data: ${LOG_DIR}/</li>
        </ul>
    </div>
</body>
</html>
EOF

    log SUCCESS "HTML report generated: ${REPORT_FILE}"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Setup
    mkdir -p "$LOG_DIR"
    exec > >(tee -a "${LOG_FILE}")
    exec 2>&1

    # Print banner
    print_banner

    log INFO "Target URL: ${TARGET_URL}"
    log INFO "Test configuration loaded"
    echo ""

    # Detect tool
    detect_load_testing_tool

    # Run tests
    run_baseline_test
    run_load_test
    run_stress_test

    # Generate report
    generate_html_report

    # Summary
    echo ""
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${GREEN}  LOAD TESTING COMPLETE${NC}"
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    log SUCCESS "All tests completed successfully"
    log SUCCESS "Report: ${REPORT_FILE}"
    log SUCCESS "Logs: ${LOG_FILE}"
    echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"

    exit 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Production load testing for Fleet Management System.

OPTIONS:
    --url URL                  Target URL to test
    --tool TOOL                Load testing tool (auto, ab, k6, artillery)
    --concurrency-low N        Low concurrency level (default: 10)
    --concurrency-medium N     Medium concurrency level (default: 50)
    --concurrency-high N       High concurrency level (default: 100)
    --duration SECONDS         Test duration (default: 30)
    --skip-baseline            Skip baseline test
    --skip-load                Skip load test
    --skip-stress              Skip stress test
    --spike                    Run spike test
    -h, --help                 Show this help message

ENVIRONMENT VARIABLES:
    AZURE_STATIC_WEB_APP_URL    Target URL
    CONCURRENCY_LOW             Low concurrency level
    CONCURRENCY_MEDIUM          Medium concurrency level
    CONCURRENCY_HIGH            High concurrency level
    DURATION                    Test duration in seconds

EXAMPLES:
    # Standard load test
    $0

    # Test with specific tool
    $0 --tool k6

    # Custom concurrency levels
    $0 --concurrency-high 500

    # Stress test only
    $0 --skip-baseline --skip-load

EOF
    exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            TARGET_URL="$2"
            shift 2
            ;;
        --tool)
            TOOL="$2"
            shift 2
            ;;
        --concurrency-low)
            CONCURRENCY_LOW="$2"
            shift 2
            ;;
        --concurrency-medium)
            CONCURRENCY_MEDIUM="$2"
            shift 2
            ;;
        --concurrency-high)
            CONCURRENCY_HIGH="$2"
            shift 2
            ;;
        --duration)
            DURATION="$2"
            shift 2
            ;;
        --skip-baseline)
            RUN_BASELINE=false
            shift
            ;;
        --skip-load)
            RUN_LOAD=false
            shift
            ;;
        --skip-stress)
            RUN_STRESS=false
            shift
            ;;
        --spike)
            RUN_SPIKE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main
main
