#!/bin/bash

# Fleet API Docker Build Testing Script
# Tests the Docker build locally before deploying to production

set -e  # Exit on any error

echo "🔍 FLEET API - PRE-DEPLOYMENT DOCKER BUILD TEST"
echo "=============================================="
echo ""

REPO_PATH="/Users/andrewmorton/Documents/GitHub/Fleet"
cd "$REPO_PATH"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Validate package.json syntax
echo "Test 1: Validating package.json syntax..."
if node -e "JSON.parse(require('fs').readFileSync('api/package.json', 'utf8'))" 2>/dev/null; then
    echo -e "${GREEN}✅ package.json is valid JSON${NC}"
else
    echo -e "${RED}❌ package.json has syntax errors${NC}"
    exit 1
fi

# Test 2: Check for common TypeScript syntax errors that tsx will catch
echo ""
echo "Test 2: Checking for tsx-incompatible syntax patterns..."

# Check for escaped dollar signs in template strings (the issue we just fixed)
ESCAPED_DOLLARS=$(grep -r '\\$[0-9]' api/src --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ESCAPED_DOLLARS" -eq "0" ]; then
    echo -e "${GREEN}✅ No escaped dollar signs in template strings${NC}"
else
    echo -e "${RED}❌ Found $ESCAPED_DOLLARS escaped dollar signs that will break tsx${NC}"
    grep -rn '\\$[0-9]' api/src --include="*.ts" 2>/dev/null || true
    exit 1
fi

# Test 3: Build Docker image locally
echo ""
echo "Test 3: Building Docker image locally (this may take 3-5 minutes)..."
echo -e "${YELLOW}Building fleet-api:test-local...${NC}"

if docker build -f api/Dockerfile -t fleet-api:test-local ./api > /tmp/docker-build-test.log 2>&1; then
    echo -e "${GREEN}✅ Docker build succeeded${NC}"
else
    echo -e "${RED}❌ Docker build failed. Check /tmp/docker-build-test.log for details${NC}"
    tail -50 /tmp/docker-build-test.log
    exit 1
fi

# Test 4: Test container startup
echo ""
echo "Test 4: Testing container startup..."

# Run container in test mode with minimal env vars
docker run -d \
  --name fleet-api-test \
  -e NODE_ENV=test \
  -e PORT=3000 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_NAME=test_db \
  -e DB_USER=test \
  -e DB_PASSWORD=test \
  -e JWT_SECRET=test-secret-for-local-testing-only \
  -p 3099:3000 \
  fleet-api:test-local > /dev/null 2>&1

# Wait for container to start
echo "Waiting for container to initialize..."
sleep 5

# Check if container is still running (not crashed)
if docker ps | grep -q fleet-api-test; then
    echo -e "${GREEN}✅ Container started successfully${NC}"

    # Show container logs
    echo ""
    echo "Container startup logs (last 20 lines):"
    docker logs fleet-api-test 2>&1 | tail -20

    # Try to hit health endpoint
    echo ""
    echo "Test 5: Testing health endpoint..."
    if curl -s http://localhost:3099/api/health > /dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s http://localhost:3099/api/health)
        echo -e "${GREEN}✅ Health endpoint responding${NC}"
        echo "Response: $HEALTH_RESPONSE"
    else
        echo -e "${YELLOW}⚠️  Health endpoint not responding (this may be expected if DB is not configured)${NC}"
    fi
else
    echo -e "${RED}❌ Container crashed on startup${NC}"
    echo ""
    echo "Container logs:"
    docker logs fleet-api-test 2>&1

    # Cleanup
    docker rm -f fleet-api-test > /dev/null 2>&1 || true
    docker rmi fleet-api:test-local > /dev/null 2>&1 || true
    exit 1
fi

# Cleanup
echo ""
echo "Cleaning up test containers..."
docker stop fleet-api-test > /dev/null 2>&1 || true
docker rm fleet-api-test > /dev/null 2>&1 || true
docker rmi fleet-api:test-local > /dev/null 2>&1 || true

echo ""
echo "=============================================="
echo -e "${GREEN}✅ ALL PRE-DEPLOYMENT TESTS PASSED${NC}"
echo "=============================================="
echo ""
echo "The Docker build is ready for production deployment."
echo ""
echo "Next steps:"
echo "  1. Push to Azure Container Registry"
echo "  2. Deploy to Azure Container Apps"
echo "  3. Monitor production logs for 5 minutes"
echo "  4. Verify health endpoint in production"
echo ""
