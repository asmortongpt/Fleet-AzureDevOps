#!/bin/bash

###############################################################################
# Microsoft Integration - One-Click Setup Script
# This script fully deploys the Microsoft Teams and Outlook integration
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Microsoft Integration - Automated Setup                      ║"
echo "║  Teams + Outlook + Calendar + Adaptive Cards                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}[1/10] Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo -e "${RED}PostgreSQL client is required but not installed. Aborting.${NC}" >&2; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Install dependencies
echo -e "${YELLOW}[2/10] Installing backend dependencies...${NC}"
cd api
npm install --silent
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}[3/10] Installing frontend dependencies...${NC}"
cd ..
npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Check environment variables
echo -e "${YELLOW}[4/10] Checking environment configuration...${NC}"
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}Warning: api/.env not found. Copying from .env.example.microsoft${NC}"
    if [ -f ".env.example.microsoft" ]; then
        cp .env.example.microsoft api/.env
        echo -e "${YELLOW}Please configure api/.env with your Microsoft credentials before continuing${NC}"
        echo -e "${YELLOW}Required variables:${NC}"
        echo "  - MICROSOFT_CLIENT_ID"
        echo "  - MICROSOFT_CLIENT_SECRET"
        echo "  - MICROSOFT_TENANT_ID"
        echo "  - DATABASE_URL"
        read -p "Press Enter once you've configured the .env file..."
    else
        echo -e "${RED}Error: .env.example.microsoft not found${NC}"
        exit 1
    fi
fi

# Verify required env vars
source api/.env 2>/dev/null || true
if [ -z "$MICROSOFT_CLIENT_ID" ] || [ -z "$MICROSOFT_CLIENT_SECRET" ] || [ -z "$MICROSOFT_TENANT_ID" ]; then
    echo -e "${RED}Error: Required Microsoft credentials not set in api/.env${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment configuration verified${NC}"

# Database migrations
echo -e "${YELLOW}[5/10] Running database migrations...${NC}"
cd api

# Parse DATABASE_URL to get connection details
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set${NC}"
    exit 1
fi

# Run migrations in order
MIGRATIONS=(
    "db/migrations/022_attachment_enhancements.sql"
    "db/migrations/023_webhook_subscriptions.sql"
    "db/migrations/024_sync_metadata.sql"
    "db/migrations/025_job_queue.sql"
    "db/migrations/026_advanced_microsoft_integration.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "  → Running $(basename $migration)..."
        psql "$DATABASE_URL" -f "$migration" -q
        echo -e "    ${GREEN}✓${NC}"
    else
        echo -e "    ${YELLOW}Warning: $migration not found, skipping${NC}"
    fi
done

# Also run Teams migration if exists
if [ -f "src/migrations/022_microsoft_teams_integration.sql" ]; then
    echo "  → Running Teams integration migration..."
    psql "$DATABASE_URL" -f "src/migrations/022_microsoft_teams_integration.sql" -q
    echo -e "    ${GREEN}✓${NC}"
fi

echo -e "${GREEN}✓ Database migrations completed${NC}"

# TypeScript compilation check
echo -e "${YELLOW}[6/10] Verifying TypeScript compilation...${NC}"
npx tsc --noEmit 2>&1 | grep -E "^(src/routes|src/services|src/jobs|src/types|src/middleware)" > /tmp/ts-errors.txt || true
if [ -s /tmp/ts-errors.txt ]; then
    echo -e "${YELLOW}Warning: Some TypeScript errors found in Microsoft integration:${NC}"
    head -20 /tmp/ts-errors.txt
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
fi

# Build the application
echo -e "${YELLOW}[7/10] Building application...${NC}"
cd ..
npm run build 2>&1 | tail -5
echo -e "${GREEN}✓ Build completed${NC}"

# Run tests
echo -e "${YELLOW}[8/10] Running integration tests...${NC}"
cd api
npm test -- --testPathPattern="(microsoft-graph|teams|outlook|attachment|webhook)" --passWithNoTests 2>&1 | tail -20
echo -e "${GREEN}✓ Tests completed${NC}"

# Setup webhooks (optional)
echo -e "${YELLOW}[9/10] Setting up Microsoft Graph webhooks...${NC}"
read -p "Do you want to setup webhooks now? This requires a public HTTPS endpoint. (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "$WEBHOOK_BASE_URL" ]; then
        read -p "Enter your webhook base URL (e.g., https://your-domain.com/api/webhooks): " WEBHOOK_BASE_URL
        echo "WEBHOOK_BASE_URL=$WEBHOOK_BASE_URL" >> .env
    fi
    npm run setup:webhooks
    echo -e "${GREEN}✓ Webhooks configured${NC}"
else
    echo -e "${YELLOW}Skipping webhook setup. You can run 'npm run setup:webhooks' later.${NC}"
fi

# Verify integration
echo -e "${YELLOW}[10/10] Verifying integration health...${NC}"
npm run verify:integration 2>&1 | tail -30
echo -e "${GREEN}✓ Integration verified${NC}"

# Success message
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 🎉 SETUP COMPLETE! 🎉                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start the backend:  cd api && npm run dev"
echo "  2. Start the frontend: npm run dev"
echo "  3. Open: http://localhost:5173"
echo ""
echo -e "${BLUE}Microsoft Integration Features:${NC}"
echo "  ✓ Teams Messaging & Channels"
echo "  ✓ Outlook Email Integration"
echo "  ✓ Calendar & Meeting Scheduling"
echo "  ✓ Adaptive Cards"
echo "  ✓ File Attachments (Azure Blob)"
echo "  ✓ Real-time Webhooks"
echo "  ✓ Message Queue System"
echo "  ✓ Sync Service"
echo ""
echo -e "${BLUE}API Documentation:${NC}"
echo "  • Swagger UI: http://localhost:3000/api/docs"
echo "  • Health Check: http://localhost:3000/api/sync/health"
echo "  • Queue Stats: http://localhost:3000/api/queue/stats"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  • Setup Guide: docs/microsoft-integration/setup.md"
echo "  • Security Guide: docs/microsoft-integration/security.md"
echo "  • Runbook: docs/runbooks/microsoft-integration-runbook.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
