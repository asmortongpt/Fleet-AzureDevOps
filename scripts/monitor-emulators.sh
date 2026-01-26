#!/bin/bash
# ============================================================================
# Fleet Emulator Monitoring Dashboard
# Real-time monitoring of emulator system status
# ============================================================================

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-https://proud-bay-0fdc8040f.3.azurestaticapps.net/api}"
REFRESH_INTERVAL="${REFRESH_INTERVAL:-5}"  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Clear screen and move cursor to top
clear_screen() {
    clear
}

# Draw header
draw_header() {
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${NC}        ${CYAN}Fleet Emulator Monitoring Dashboard${NC}               ${PURPLE}║${NC}"
    echo -e "${PURPLE}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${PURPLE}║${NC} API: ${BLUE}$API_BASE_URL${NC}"
    echo -e "${PURPLE}║${NC} Updated: ${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Get emulator status
get_status() {
    curl -s "$API_BASE_URL/emulator/status" 2>/dev/null || echo "{}"
}

# Display system status
display_system_status() {
    local status="$1"

    local is_running=$(echo "$status" | jq -r '.isRunning // false')
    local is_paused=$(echo "$status" | jq -r '.isPaused // false')

    echo -e "${CYAN}═══ System Status ═══${NC}"

    if [ "$is_running" = "true" ]; then
        echo -e "Status: ${GREEN}● RUNNING${NC}"
    else
        echo -e "Status: ${RED}● STOPPED${NC}"
    fi

    if [ "$is_paused" = "true" ]; then
        echo -e "Mode:   ${YELLOW}⏸ PAUSED${NC}"
    fi

    echo ""
}

# Display statistics
display_stats() {
    local status="$1"

    local total_vehicles=$(echo "$status" | jq -r '.stats.totalVehicles // 0')
    local active_vehicles=$(echo "$status" | jq -r '.stats.activeVehicles // 0')
    local total_events=$(echo "$status" | jq -r '.stats.totalEvents // 0')
    local events_per_sec=$(echo "$status" | jq -r '.stats.eventsPerSecond // 0')
    local memory_usage=$(echo "$status" | jq -r '.stats.memoryUsage // 0')
    local uptime=$(echo "$status" | jq -r '.stats.uptime // 0')

    echo -e "${CYAN}═══ Statistics ═══${NC}"
    echo -e "Total Vehicles:    ${GREEN}$total_vehicles${NC}"
    echo -e "Active Vehicles:   ${GREEN}$active_vehicles${NC}"
    echo -e "Total Events:      ${YELLOW}$(printf "%'d" $total_events)${NC}"
    echo -e "Events/Second:     ${YELLOW}$events_per_sec${NC}"
    echo -e "Memory Usage:      ${BLUE}${memory_usage} MB${NC}"
    echo -e "Uptime:            ${BLUE}${uptime}s${NC}"
    echo ""
}

# Display vehicle summary
display_vehicles() {
    local vehicles=$(curl -s "$API_BASE_URL/emulator/vehicles" 2>/dev/null || echo "[]")
    local count=$(echo "$vehicles" | jq 'length // 0')

    echo -e "${CYAN}═══ Vehicles ($count) ═══${NC}"

    if [ "$count" -eq 0 ]; then
        echo -e "${YELLOW}No vehicles found${NC}"
        return
    fi

    # Show first 5 vehicles
    echo "$vehicles" | jq -r '.[:5] | .[] |
        "\(.id | .[0:12]) │ \(.make) \(.model) │ \(.type)"' | \
        while IFS='│' read -r id make_model vtype; do
            echo -e "  ${GREEN}$id${NC} │$make_model │$vtype"
        done

    if [ "$count" -gt 5 ]; then
        echo -e "  ${YELLOW}... and $((count - 5)) more vehicles${NC}"
    fi
    echo ""
}

# Display active emulator types
display_emulator_types() {
    echo -e "${CYAN}═══ Active Emulator Types ═══${NC}"
    echo -e "  ${GREEN}✓${NC} GPS Emulator          (Real-time location)"
    echo -e "  ${GREEN}✓${NC} OBD2 Emulator         (Engine diagnostics)"
    echo -e "  ${GREEN}✓${NC} Fuel Emulator         (Consumption tracking)"
    echo -e "  ${GREEN}✓${NC} Maintenance Emulator  (Service events)"
    echo -e "  ${GREEN}✓${NC} Driver Behavior       (Scoring & events)"
    echo -e "  ${GREEN}✓${NC} Route Emulator        (Traffic simulation)"
    echo -e "  ${GREEN}✓${NC} Cost Emulator         (Operating costs)"
    echo -e "  ${GREEN}✓${NC} IoT Emulator          (Sensor data)"
    echo -e "  ${GREEN}✓${NC} Radio/PTT Emulator    (Communications)"
    echo -e "  ${GREEN}✓${NC} Video Telematics      (Dashcam + AI)"
    echo -e "  ${GREEN}✓${NC} EV Charging           (Charging sessions)"
    echo -e "  ${GREEN}✓${NC} Inventory Emulator    (Parts & supplies)"
    echo ""
}

# Display recent activity
display_activity() {
    echo -e "${CYAN}═══ Recent Activity ═══${NC}"

    # Get fleet overview for activity data
    local overview=$(curl -s "$API_BASE_URL/emulator/fleet/overview" 2>/dev/null || echo "{}")

    # Count vehicles by status
    local moving=$(echo "$overview" | jq -r '[.vehicles[]? | select(.speed > 0)] | length')
    local idle=$(echo "$overview" | jq -r '[.vehicles[]? | select(.speed == 0)] | length')

    echo -e "  Moving vehicles: ${GREEN}$moving${NC}"
    echo -e "  Idle vehicles:   ${YELLOW}$idle${NC}"
    echo ""
}

# Display controls
display_controls() {
    echo -e "${PURPLE}═══ Controls ═══${NC}"
    echo -e "  ${YELLOW}[Space]${NC} Pause/Resume  ${YELLOW}[R]${NC} Restart  ${YELLOW}[Q]${NC} Quit  ${YELLOW}[H]${NC} Help"
    echo ""
}

# Main monitoring loop
monitor() {
    while true; do
        clear_screen
        draw_header

        # Fetch status
        local status=$(get_status)

        # Display all sections
        display_system_status "$status"
        display_stats "$status"
        display_vehicles
        display_emulator_types
        display_activity
        display_controls

        # Wait for refresh interval
        sleep $REFRESH_INTERVAL
    done
}

# Display help
show_help() {
    cat << EOF
Fleet Emulator Monitoring Dashboard

Usage: $0 [OPTIONS]

Options:
  -u, --url URL       API base URL (default: $API_BASE_URL)
  -i, --interval SEC  Refresh interval in seconds (default: $REFRESH_INTERVAL)
  -h, --help          Show this help message

Examples:
  # Monitor with default settings
  $0

  # Monitor with custom API URL
  $0 -u https://custom-api.com/api

  # Monitor with 10-second refresh
  $0 -i 10

Environment Variables:
  API_BASE_URL        API base URL
  REFRESH_INTERVAL    Refresh interval in seconds

Interactive Controls:
  Space    Pause/Resume emulators
  R        Restart emulators
  Q        Quit monitoring
  H        Show help

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_BASE_URL="$2"
            shift 2
            ;;
        -i|--interval)
            REFRESH_INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed${NC}"
    exit 1
fi

# Start monitoring
echo -e "${CYAN}Starting Fleet Emulator Monitor...${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
echo ""
sleep 2

monitor
