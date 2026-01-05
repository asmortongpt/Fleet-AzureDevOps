#!/bin/bash
set -e

echo "🚀 Deploying 20 Azure VM Agents for Comprehensive Testing & Validation"
echo "============================================================================="

NAMESPACE="fleet-management"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Ensure we're connected to the correct AKS cluster
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster --overwrite-existing

echo ""
echo "📋 Agent Deployment Plan:"
echo "  - Group 1 (5 agents): Automated Testing (unit, integration, e2e)"
echo "  - Group 2 (5 agents): Visual Page Verification"
echo "  - Group 3 (5 agents): API & Database Validation"
echo "  - Group 4 (5 agents): Performance & Load Testing"
echo ""

# ============================================================================
# GROUP 1: AUTOMATED TESTING AGENTS (5)
# ============================================================================
echo "🧪 GROUP 1: Deploying 5 Automated Testing Agents..."

for i in {1..5}; do
  cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: test-agent-$i-$TIMESTAMP
  namespace: $NAMESPACE
  labels:
    group: automated-testing
    agent: test-agent-$i
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: test-runner
        image: mcr.microsoft.com/playwright:v1.40.0-jammy
        command: ["/bin/bash", "-c"]
        args:
          - |
            set -e
            echo "🧪 TEST AGENT $i: Starting automated test suite"

            # Install dependencies
            apt-get update -qq && apt-get install -y curl git nodejs npm postgresql-client -qq

            # Clone repository
            git clone https://github.com/asmortongit/Fleet.git /workspace
            cd /workspace

            # Install dependencies
            npm ci --quiet

            # Run tests based on agent number
            case $i in
              1)
                echo "Running unit tests..."
                npm run test:unit 2>&1 | tee /tmp/unit-tests.log
                ;;
              2)
                echo "Running integration tests..."
                npm run test:integration 2>&1 | tee /tmp/integration-tests.log
                ;;
              3)
                echo "Running e2e tests..."
                npx playwright test --reporter=html 2>&1 | tee /tmp/e2e-tests.log
                ;;
              4)
                echo "Running component tests..."
                npm run test -- --coverage 2>&1 | tee /tmp/component-tests.log
                ;;
              5)
                echo "Running API tests..."
                npm run test:api 2>&1 | tee /tmp/api-tests.log
                ;;
            esac

            echo "✅ TEST AGENT $i: Completed"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
EOF
  echo "  ✓ Deployed test-agent-$i"
done

# ============================================================================
# GROUP 2: VISUAL VERIFICATION AGENTS (5)
# ============================================================================
echo ""
echo "👁️  GROUP 2: Deploying 5 Visual Verification Agents..."

PAGES=(
  "Fleet Hub,/"
  "Operations Hub,/operations"
  "Maintenance Hub,/maintenance"
  "Drivers Hub,/drivers"
  "Analytics Hub,/analytics"
)

for i in {1..5}; do
  PAGE_INFO="${PAGES[$((i-1))]}"
  PAGE_NAME="${PAGE_INFO%%,*}"
  PAGE_PATH="${PAGE_INFO##*,}"

  cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: visual-agent-$i-$TIMESTAMP
  namespace: $NAMESPACE
  labels:
    group: visual-verification
    agent: visual-agent-$i
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: visual-verifier
        image: mcr.microsoft.com/playwright:v1.40.0-jammy
        command: ["/bin/bash", "-c"]
        args:
          - |
            set -e
            echo "👁️  VISUAL AGENT $i: Verifying '$PAGE_NAME' page"

            # Create verification script
            cat > /tmp/verify.js <<'SCRIPT'
            const { chromium } = require('playwright');

            (async () => {
              const browser = await chromium.launch();
              const page = await browser.newPage();

              const url = 'https://fleet.capitaltechalliance.com$PAGE_PATH';
              console.log('Navigating to:', url);

              await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
              await page.waitForTimeout(3000);

              // Capture screenshots
              await page.screenshot({ path: '/tmp/screenshot-full.png', fullPage: true });
              await page.screenshot({ path: '/tmp/screenshot-viewport.png' });

              // Check for errors
              const errors = [];
              page.on('console', msg => {
                if (msg.type() === 'error') errors.push(msg.text());
              });

              // Get page metrics
              const title = await page.title();
              const url_final = page.url();

              // Check critical elements
              const hasNavigation = await page.locator('nav').count() > 0;
              const hasMainContent = await page.locator('main, [role="main"]').count() > 0;
              const hasData = await page.locator('[role="table"], .data-grid, .card').count() > 0;

              console.log('\n=== VERIFICATION RESULTS ===');
              console.log('Page:', '$PAGE_NAME');
              console.log('Title:', title);
              console.log('URL:', url_final);
              console.log('Has Navigation:', hasNavigation);
              console.log('Has Main Content:', hasMainContent);
              console.log('Has Data Elements:', hasData);
              console.log('Console Errors:', errors.length);

              if (errors.length > 0) {
                console.log('\nErrors Found:');
                errors.forEach(err => console.log('  -', err));
              }

              await browser.close();

              if (!hasNavigation || !hasMainContent) {
                process.exit(1);
              }
            })();
SCRIPT

            # Replace placeholder
            sed -i "s|\\\$PAGE_PATH|$PAGE_PATH|g" /tmp/verify.js

            # Install Playwright
            npm init -y
            npm install playwright

            # Run verification
            node /tmp/verify.js

            echo "✅ VISUAL AGENT $i: '$PAGE_NAME' verification complete"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
EOF
  echo "  ✓ Deployed visual-agent-$i for '$PAGE_NAME'"
done

# ============================================================================
# GROUP 3: API & DATABASE VALIDATION AGENTS (5)
# ============================================================================
echo ""
echo "🔌 GROUP 3: Deploying 5 API & Database Validation Agents..."

API_ENDPOINTS=(
  "vehicles,/api/v1/vehicles"
  "drivers,/api/v1/drivers"
  "maintenance,/api/v1/maintenance"
  "work-orders,/api/v1/work-orders"
  "analytics,/api/v1/analytics/dashboard"
)

for i in {1..5}; do
  ENDPOINT_INFO="${API_ENDPOINTS[$((i-1))]}"
  ENDPOINT_NAME="${ENDPOINT_INFO%%,*}"
  ENDPOINT_PATH="${ENDPOINT_INFO##*,}"

  cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: api-agent-$i-$TIMESTAMP
  namespace: $NAMESPACE
  labels:
    group: api-validation
    agent: api-agent-$i
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: api-validator
        image: curlimages/curl:latest
        command: ["/bin/sh", "-c"]
        args:
          - |
            set -e
            echo "🔌 API AGENT $i: Testing '$ENDPOINT_NAME' endpoint"

            URL="https://fleet.capitaltechalliance.com$ENDPOINT_PATH"
            echo "Testing: \$URL"

            # Test API endpoint
            RESPONSE=\$(curl -s -w "\\n%{http_code}" "\$URL")
            HTTP_CODE=\$(echo "\$RESPONSE" | tail -1)
            BODY=\$(echo "\$RESPONSE" | head -n -1)

            echo ""
            echo "HTTP Status: \$HTTP_CODE"
            echo "Response Preview:"
            echo "\$BODY" | head -c 500
            echo ""

            if [ "\$HTTP_CODE" = "200" ]; then
              echo "✅ API AGENT $i: '$ENDPOINT_NAME' endpoint is healthy"
              exit 0
            else
              echo "❌ API AGENT $i: '$ENDPOINT_NAME' endpoint returned \$HTTP_CODE"
              exit 1
            fi
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
EOF
  echo "  ✓ Deployed api-agent-$i for '$ENDPOINT_NAME'"
done

# ============================================================================
# GROUP 4: PERFORMANCE & LOAD TESTING AGENTS (5)
# ============================================================================
echo ""
echo "⚡ GROUP 4: Deploying 5 Performance & Load Testing Agents..."

for i in {1..5}; do
  cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: perf-agent-$i-$TIMESTAMP
  namespace: $NAMESPACE
  labels:
    group: performance-testing
    agent: perf-agent-$i
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: load-tester
        image: williamyeh/wrk:latest
        command: ["/bin/sh", "-c"]
        args:
          - |
            set -e
            echo "⚡ PERF AGENT $i: Running load test"

            # Different load patterns for each agent
            case $i in
              1)
                # Light load - 10 connections, 30 seconds
                wrk -t2 -c10 -d30s https://fleet.capitaltechalliance.com/
                ;;
              2)
                # Medium load - 50 connections, 30 seconds
                wrk -t4 -c50 -d30s https://fleet.capitaltechalliance.com/api/v1/vehicles
                ;;
              3)
                # Heavy load - 100 connections, 30 seconds
                wrk -t8 -c100 -d30s https://fleet.capitaltechalliance.com/
                ;;
              4)
                # API stress test
                wrk -t4 -c50 -d30s https://fleet.capitaltechalliance.com/api/v1/drivers
                ;;
              5)
                # Sustained load
                wrk -t4 -c50 -d60s https://fleet.capitaltechalliance.com/
                ;;
            esac

            echo "✅ PERF AGENT $i: Load test complete"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
EOF
  echo "  ✓ Deployed perf-agent-$i"
done

echo ""
echo "============================================================================="
echo "✅ Successfully deployed all 20 Azure VM agents!"
echo ""
echo "📊 Monitor agent status with:"
echo "   kubectl get jobs -n $NAMESPACE -l group=automated-testing"
echo "   kubectl get jobs -n $NAMESPACE -l group=visual-verification"
echo "   kubectl get jobs -n $NAMESPACE -l group=api-validation"
echo "   kubectl get jobs -n $NAMESPACE -l group=performance-testing"
echo ""
echo "📋 View agent logs with:"
echo "   kubectl logs -n $NAMESPACE job/test-agent-1-$TIMESTAMP"
echo "   kubectl logs -n $NAMESPACE job/visual-agent-1-$TIMESTAMP"
echo "   kubectl logs -n $NAMESPACE job/api-agent-1-$TIMESTAMP"
echo "   kubectl logs -n $NAMESPACE job/perf-agent-1-$TIMESTAMP"
echo "============================================================================="
