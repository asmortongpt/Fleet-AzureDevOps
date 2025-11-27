#!/bin/bash

##############################################################################
# Fleet Management System - Stop Local Development Services
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Stopping Fleet Development Services   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Stop API server
if [ -f ".api.pid" ]; then
    PID=$(cat .api.pid)
    echo -e "${YELLOW}Stopping API server (PID: $PID)...${NC}"
    kill $PID 2>/dev/null || echo -e "${RED}Process not found${NC}"
    rm .api.pid
    echo -e "${GREEN}✓ API server stopped${NC}"
fi

# Stop Redis (if started by script)
echo -e "${YELLOW}Redis will continue running (system service)${NC}"
echo -e "${YELLOW}To stop Redis manually: redis-cli shutdown${NC}"

# Stop PostgreSQL (keep running as it's a system service)
echo -e "${YELLOW}PostgreSQL will continue running (system service)${NC}"
echo -e "${YELLOW}To stop PostgreSQL: brew services stop postgresql@14${NC}"

# Kill any stray node processes on our ports
echo -e "${YELLOW}Cleaning up any processes on ports 3000, 3001...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Services Stopped Successfully ✓       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Frontend dev server (port 5173) is still running.${NC}"
echo -e "${YELLOW}To stop it, press Ctrl+C in the terminal where it's running.${NC}"
echo ""
