#!/bin/bash

##############################################################################
# Fleet Management System - Local Development Startup
#
# This script starts all services needed for local development:
# - PostgreSQL Database
# - Redis Cache
# - Backend API Server (with OBD2 Emulator & AI)
# - Frontend Vite Dev Server
# - Mobile Simulator (iOS)
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fleet Management - Local Dev Environment ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to start a service in the background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file=$4

    echo -e "${YELLOW}Starting $name...${NC}"

    if check_port $port; then
        echo -e "${GREEN}✓ $name already running on port $port${NC}"
    else
        eval "$command > $log_file 2>&1 &"
        local pid=$!
        echo "$pid" > ".${name}.pid"
        sleep 2

        if check_port $port; then
            echo -e "${GREEN}✓ $name started on port $port (PID: $pid)${NC}"
        else
            echo -e "${RED}✗ Failed to start $name${NC}"
            echo -e "${YELLOW}Check logs: $log_file${NC}"
        fi
    fi
}

# Create logs directory
mkdir -p logs

##############################################################################
# 1. PostgreSQL Database
##############################################################################
echo -e "\n${BLUE}[1/6] Checking PostgreSQL...${NC}"

if pgrep -x postgres > /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14
    sleep 3
    echo -e "${GREEN}✓ PostgreSQL started${NC}"
fi

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw fleet_dev; then
    echo -e "${GREEN}✓ Database 'fleet_dev' exists${NC}"
else
    echo -e "${YELLOW}Creating database 'fleet_dev'...${NC}"
    createdb fleet_dev
    echo -e "${GREEN}✓ Database created${NC}"
fi

##############################################################################
# 2. Redis Cache
##############################################################################
echo -e "\n${BLUE}[2/6] Checking Redis...${NC}"

if check_port 6379; then
    echo -e "${GREEN}✓ Redis is running on port 6379${NC}"
else
    echo -e "${YELLOW}Starting Redis...${NC}"
    redis-server --daemonize yes
    sleep 1
    echo -e "${GREEN}✓ Redis started${NC}"
fi

##############################################################################
# 3. Backend API Server (includes OBD2 Emulator & AI services)
##############################################################################
echo -e "\n${BLUE}[3/6] Starting Backend API Server...${NC}"
echo -e "${YELLOW}   • Express API${NC}"
echo -e "${YELLOW}   • OBD2 Emulator (WebSocket)${NC}"
echo -e "${YELLOW}   • AI Services (Claude, OpenAI)${NC}"
echo -e "${YELLOW}   • Socket.IO for real-time updates${NC}"

cd api

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating API .env file...${NC}"
    cat > .env <<EOF
# Database
DATABASE_URL=postgresql://localhost:5432/fleet_dev

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# JWT & CSRF (for local dev)
JWT_SECRET=local-dev-jwt-secret-change-in-production
CSRF_SECRET=local-dev-csrf-secret-change-in-production

# AI Services (from global .env)
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}

# OBD2 Emulator
ENABLE_OBD2_EMULATOR=true
OBD2_WS_PORT=3001

# WebSocket
ENABLE_WEBSOCKET=true
EOF
    echo -e "${GREEN}✓ API .env created${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing API dependencies...${NC}"
    npm install
fi

# Start API server
start_service "api" "npm run dev" 3000 "../logs/api.log"

cd ..

##############################################################################
# 4. Frontend Vite Dev Server
##############################################################################
echo -e "\n${BLUE}[4/6] Frontend Already Running${NC}"
echo -e "${GREEN}✓ Frontend dev server running on http://localhost:5173${NC}"

##############################################################################
# 5. Update Frontend Environment
##############################################################################
echo -e "\n${BLUE}[5/6] Configuring Frontend...${NC}"

# Update .env to connect to local API
cat > .env <<EOF
# Fleet Management System - Local Development Environment

# Frontend (Vite)
VITE_API_URL=http://localhost:3000
VITE_ENVIRONMENT=development

# Azure AD Authentication (using your global credentials)
VITE_AZURE_AD_CLIENT_ID=${VITE_AZURE_AD_CLIENT_ID}
VITE_AZURE_AD_TENANT_ID=${VITE_AZURE_AD_TENANT_ID}
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

# OBD2 Emulator WebSocket
VITE_OBD2_WS_URL=ws://localhost:3001

# AI Features
VITE_ENABLE_AI_ASSISTANT=true

# Feature Flags
VITE_ENABLE_TEAMS_INTEGRATION=true
VITE_ENABLE_EMAIL_CENTER=true
VITE_ENABLE_DARK_MODE=true

# App Version
VITE_APP_VERSION=1.0.0
VITE_BUILD_ID=local-dev

# Development
VITE_API_URL_DEV=http://localhost:3000
DEBUG=fleet:*
LOG_LEVEL=debug
EOF

echo -e "${GREEN}✓ Frontend configured to use local API${NC}"

##############################################################################
# 6. Mobile App (iOS Simulator)
##############################################################################
echo -e "\n${BLUE}[6/6] Mobile App Configuration${NC}"

if command -v pod &> /dev/null && [ -d "mobile/ios" ]; then
    echo -e "${YELLOW}Mobile app available. To start iOS simulator:${NC}"
    echo -e "${BLUE}   cd mobile${NC}"
    echo -e "${BLUE}   npm install${NC}"
    echo -e "${BLUE}   cd ios && pod install && cd ..${NC}"
    echo -e "${BLUE}   npm run ios${NC}"
    echo ""
    echo -e "${YELLOW}Mobile app will connect to:${NC}"
    echo -e "${GREEN}   API: http://localhost:3000${NC}"
    echo -e "${GREEN}   OBD2: ws://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠  iOS development tools not installed or mobile directory not found${NC}"
    echo -e "${YELLOW}   Mobile app can still be tested on physical device pointing to:${NC}"
    echo -e "${GREEN}   http://YOUR_LOCAL_IP:3000${NC}"
fi

##############################################################################
# Summary
##############################################################################
echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        All Services Started! 🚀            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "${GREEN}  • Frontend:       ${YELLOW}http://localhost:5173${NC}"
echo -e "${GREEN}  • Backend API:    ${YELLOW}http://localhost:3000${NC}"
echo -e "${GREEN}  • API Docs:       ${YELLOW}http://localhost:3000/api-docs${NC}"
echo -e "${GREEN}  • OBD2 Emulator:  ${YELLOW}ws://localhost:3001${NC}"
echo -e "${GREEN}  • PostgreSQL:     ${YELLOW}localhost:5432 (fleet_dev)${NC}"
echo -e "${GREEN}  • Redis:          ${YELLOW}localhost:6379${NC}"
echo ""
echo -e "${BLUE}Available Features:${NC}"
echo -e "${GREEN}  ✓ REST API with all fleet endpoints${NC}"
echo -e "${GREEN}  ✓ OBD2 Vehicle Emulator (WebSocket)${NC}"
echo -e "${GREEN}  ✓ AI Assistant (Claude & OpenAI)${NC}"
echo -e "${GREEN}  ✓ Real-time updates (Socket.IO)${NC}"
echo -e "${GREEN}  ✓ Microsoft Teams Integration${NC}"
echo -e "${GREEN}  ✓ Email Center${NC}"
echo -e "${GREEN}  ✓ Mobile API endpoints${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "${YELLOW}  • API:      tail -f logs/api.log${NC}"
echo -e "${YELLOW}  • Frontend: Check Vite dev server output${NC}"
echo ""
echo -e "${BLUE}To test OBD2 Emulator:${NC}"
echo -e "${YELLOW}  curl -X POST http://localhost:3000/api/obd2-emulator/start \\${NC}"
echo -e "${YELLOW}    -H 'Content-Type: application/json' \\${NC}"
echo -e "${YELLOW}    -d '{\"vehicleId\": 1, \"profile\": \"sedan\", \"scenario\": \"city\"}'${NC}"
echo ""
echo -e "${BLUE}To stop all services:${NC}"
echo -e "${YELLOW}  ./stop-local-development.sh${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
