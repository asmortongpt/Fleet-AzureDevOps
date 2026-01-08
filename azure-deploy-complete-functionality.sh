#!/bin/bash

# ============================================================================
# Azure VM Multi-Agent Deployment for Complete Functionality
# ============================================================================
# This script deploys OpenAI agents to Azure VM to:
# 1. Create comprehensive integration tests
# 2. Deploy all code to Kubernetes
# 3. Verify functionality end-to-end
# ============================================================================

set -e

echo "🚀 Starting Azure VM Multi-Agent Deployment"
echo "============================================"

# Azure VM Configuration
VM_NAME="fleet-qa-power"
RESOURCE_GROUP="fleet-ai-agents"
VM_IP="20.51.206.144"

# OpenAI Configuration
export OPENAI_API_KEY="${OPENAI_API_KEY:-$OPENAI_SERVICE_ACCOUNT}"

# Agent Workspace
AGENT_DIR="/home/azureuser/fleet-complete-deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deployment_${TIMESTAMP}.log"

echo "📋 Deployment Configuration:"
echo "  VM: $VM_NAME ($VM_IP)"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Agent Directory: $AGENT_DIR"
echo "  Timestamp: $TIMESTAMP"
echo ""

# ============================================================================
# STEP 1: Create Agent 1 - Integration Test Generator
# ============================================================================

cat > /tmp/agent_1_integration_tests.py << 'AGENT1_EOF'
#!/usr/bin/env python3
"""
Agent 1: Integration Test Generator
Generates comprehensive integration tests for damage reports and geospatial APIs
"""

import os
import sys
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

def generate_integration_tests():
    """Generate integration tests using OpenAI"""

    print("🧪 Agent 1: Generating Integration Tests")
    print("=" * 60)

    prompt = """
    Generate comprehensive integration tests for the Fleet Management System's new features:

    1. Damage Reports API Tests (TypeScript/Jest)
       - Test all CRUD operations
       - Test 3D model generation flow
       - Test filtering and pagination
       - Test error handling (404, 400, 500)
       - Test multi-tenancy isolation

    2. Geospatial API Tests (TypeScript/Jest)
       - Test distance calculations
       - Test nearest vehicle queries
       - Test nearest facility queries
       - Test geofence operations
       - Test charging station queries

    3. Database Function Tests (SQL)
       - Test calculate_distance_haversine accuracy
       - Test find_nearest_vehicles performance
       - Test geofence boundary conditions

    4. End-to-End Tests (Playwright)
       - Test damage report creation workflow
       - Test 3D model viewing
       - Test geospatial map interactions

    Requirements:
    - Use TypeScript with Jest
    - Use parameterized queries
    - Mock external services (TripoSR)
    - Test with real database (fleet_db)
    - Include performance benchmarks
    - Generate test data fixtures

    Output: Complete test files ready to run
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert QA engineer who writes comprehensive integration tests."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=4000,
        temperature=0.3
    )

    test_code = response.choices[0].message.content

    # Save test files
    os.makedirs('/home/azureuser/generated-tests', exist_ok=True)

    with open('/home/azureuser/generated-tests/damage-reports.integration.test.ts', 'w') as f:
        f.write(test_code)

    print("✅ Integration tests generated successfully")
    print(f"📁 Saved to: /home/azureuser/generated-tests/")

    return test_code

if __name__ == '__main__':
    try:
        generate_integration_tests()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Agent 1 failed: {e}")
        sys.exit(1)
AGENT1_EOF

# ============================================================================
# STEP 2: Create Agent 2 - Kubernetes Deployment Agent
# ============================================================================

cat > /tmp/agent_2_k8s_deployment.py << 'AGENT2_EOF'
#!/usr/bin/env python3
"""
Agent 2: Kubernetes Deployment Agent
Deploys all new code to Kubernetes and verifies deployment
"""

import os
import sys
import subprocess
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

def deploy_to_kubernetes():
    """Deploy code to Kubernetes"""

    print("☸️  Agent 2: Kubernetes Deployment")
    print("=" * 60)

    # Build Docker image with new code
    print("🐳 Building Docker image...")
    subprocess.run([
        'docker', 'build',
        '-t', 'fleet-api:latest',
        '-f', '/home/azureuser/Fleet/api/Dockerfile',
        '/home/azureuser/Fleet/api'
    ], check=True)

    # Tag and push to registry
    print("📤 Pushing to container registry...")
    subprocess.run([
        'docker', 'tag',
        'fleet-api:latest',
        'fleetregistry.azurecr.io/fleet-api:latest'
    ], check=True)

    subprocess.run([
        'docker', 'push',
        'fleetregistry.azurecr.io/fleet-api:latest'
    ], check=True)

    # Apply Kubernetes manifests
    print("☸️  Applying Kubernetes manifests...")
    subprocess.run([
        'kubectl', 'set', 'image',
        'deployment/fleet-api',
        'fleet-api=fleetregistry.azurecr.io/fleet-api:latest',
        '-n', 'fleet-management'
    ], check=True)

    # Wait for rollout
    print("⏳ Waiting for deployment rollout...")
    subprocess.run([
        'kubectl', 'rollout', 'status',
        'deployment/fleet-api',
        '-n', 'fleet-management',
        '--timeout=5m'
    ], check=True)

    print("✅ Kubernetes deployment completed successfully")

    return True

if __name__ == '__main__':
    try:
        deploy_to_kubernetes()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Agent 2 failed: {e}")
        sys.exit(1)
AGENT2_EOF

# ============================================================================
# STEP 3: Create Agent 3 - Verification Agent
# ============================================================================

cat > /tmp/agent_3_verification.py << 'AGENT3_EOF'
#!/usr/bin/env python3
"""
Agent 3: Verification Agent
Verifies all functionality is working correctly
"""

import os
import sys
import requests
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

def verify_deployment():
    """Verify all endpoints are working"""

    print("✅ Agent 3: Deployment Verification")
    print("=" * 60)

    base_url = "http://135.18.149.69/api"

    tests = [
        {
            "name": "Health Check",
            "method": "GET",
            "url": f"{base_url}/health",
            "expected_status": 200
        },
        {
            "name": "Damage Reports List",
            "method": "GET",
            "url": f"{base_url}/damage-reports",
            "expected_status": 200
        },
        {
            "name": "Geospatial - Vehicles with Location",
            "method": "GET",
            "url": f"{base_url}/geospatial/vehicles-with-location",
            "expected_status": 200
        },
        {
            "name": "Calculate Distance",
            "method": "POST",
            "url": f"{base_url}/geospatial/calculate-distance",
            "json": {
                "lat1": 40.7128,
                "lng1": -74.0060,
                "lat2": 42.3601,
                "lng2": -71.0589
            },
            "expected_status": 200
        }
    ]

    results = []

    for test in tests:
        print(f"\n🧪 Testing: {test['name']}")
        try:
            if test['method'] == 'GET':
                response = requests.get(test['url'], timeout=10)
            else:
                response = requests.post(test['url'], json=test.get('json'), timeout=10)

            success = response.status_code == test['expected_status']
            status = "✅ PASS" if success else "❌ FAIL"

            print(f"   {status} - Status: {response.status_code}")

            results.append({
                "test": test['name'],
                "success": success,
                "status_code": response.status_code
            })

        except Exception as e:
            print(f"   ❌ FAIL - Error: {e}")
            results.append({
                "test": test['name'],
                "success": False,
                "error": str(e)
            })

    # Summary
    print("\n" + "=" * 60)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 60)

    total = len(results)
    passed = sum(1 for r in results if r['success'])
    failed = total - passed

    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")

    if failed > 0:
        print("\n⚠️  Some tests failed. Review deployment.")
        return False
    else:
        print("\n✅ All tests passed! Deployment verified.")
        return True

if __name__ == '__main__':
    try:
        success = verify_deployment()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Agent 3 failed: {e}")
        sys.exit(1)
AGENT3_EOF

# ============================================================================
# STEP 4: Create Agent 4 - Documentation Generator
# ============================================================================

cat > /tmp/agent_4_documentation.py << 'AGENT4_EOF'
#!/usr/bin/env python3
"""
Agent 4: Documentation Generator
Generates comprehensive API documentation
"""

import os
import sys
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

def generate_documentation():
    """Generate API documentation"""

    print("📚 Agent 4: Generating Documentation")
    print("=" * 60)

    prompt = """
    Generate comprehensive API documentation for the Fleet Management System's new features:

    1. Damage Reports API
       - OpenAPI/Swagger specification
       - Request/response examples
       - Error codes and handling
       - Authentication requirements

    2. Geospatial API
       - Endpoint descriptions
       - Query parameter details
       - Response schemas
       - Example use cases

    3. Integration Guide
       - How to use the APIs
       - Code examples in TypeScript and Python
       - Best practices

    Output: Markdown documentation and OpenAPI YAML
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert technical writer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=3000,
        temperature=0.3
    )

    docs = response.choices[0].message.content

    os.makedirs('/home/azureuser/generated-docs', exist_ok=True)

    with open('/home/azureuser/generated-docs/API_DOCUMENTATION.md', 'w') as f:
        f.write(docs)

    print("✅ Documentation generated successfully")
    print(f"📁 Saved to: /home/azureuser/generated-docs/")

    return docs

if __name__ == '__main__':
    try:
        generate_documentation()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Agent 4 failed: {e}")
        sys.exit(1)
AGENT4_EOF

# ============================================================================
# STEP 5: Deploy Agents to Azure VM
# ============================================================================

echo "📤 Deploying agents to Azure VM: $VM_NAME"
echo ""

# Copy agent scripts to VM
echo "📂 Copying agent scripts..."
az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts "mkdir -p $AGENT_DIR && echo 'Agent workspace created'"

# Upload Agent 1
echo "📤 Uploading Agent 1: Integration Test Generator"
az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts @/tmp/agent_1_integration_tests.py \
  > /tmp/agent1_output.log 2>&1 &

AGENT1_PID=$!

# Upload Agent 2
echo "📤 Uploading Agent 2: Kubernetes Deployment"
az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts @/tmp/agent_2_k8s_deployment.py \
  > /tmp/agent2_output.log 2>&1 &

AGENT2_PID=$!

# Upload Agent 3
echo "📤 Uploading Agent 3: Verification"
az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts @/tmp/agent_3_verification.py \
  > /tmp/agent3_output.log 2>&1 &

AGENT3_PID=$!

# Upload Agent 4
echo "📤 Uploading Agent 4: Documentation"
az vm run-command invoke \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --command-id RunShellScript \
  --scripts @/tmp/agent_4_documentation.py \
  > /tmp/agent4_output.log 2>&1 &

AGENT4_PID=$!

echo ""
echo "⏳ All agents deployed. Running in parallel..."
echo "   Agent 1 PID: $AGENT1_PID (Integration Tests)"
echo "   Agent 2 PID: $AGENT2_PID (Kubernetes Deployment)"
echo "   Agent 3 PID: $AGENT3_PID (Verification)"
echo "   Agent 4 PID: $AGENT4_PID (Documentation)"
echo ""

# Wait for all agents to complete
wait $AGENT1_PID
AGENT1_STATUS=$?

wait $AGENT2_PID
AGENT2_STATUS=$?

wait $AGENT3_PID
AGENT3_STATUS=$?

wait $AGENT4_PID
AGENT4_STATUS=$?

# ============================================================================
# STEP 6: Report Results
# ============================================================================

echo ""
echo "============================================"
echo "📊 DEPLOYMENT SUMMARY"
echo "============================================"
echo ""

echo "Agent Results:"
echo "  Agent 1 (Integration Tests): $([ $AGENT1_STATUS -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAILED')"
echo "  Agent 2 (Kubernetes Deploy): $([ $AGENT2_STATUS -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAILED')"
echo "  Agent 3 (Verification):      $([ $AGENT3_STATUS -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAILED')"
echo "  Agent 4 (Documentation):     $([ $AGENT4_STATUS -eq 0 ] && echo '✅ SUCCESS' || echo '❌ FAILED')"
echo ""

# Check overall status
if [ $AGENT1_STATUS -eq 0 ] && [ $AGENT2_STATUS -eq 0 ] && [ $AGENT3_STATUS -eq 0 ] && [ $AGENT4_STATUS -eq 0 ]; then
    echo "✅ ALL AGENTS COMPLETED SUCCESSFULLY"
    echo ""
    echo "🎉 Deployment Complete!"
    echo "   - Integration tests generated"
    echo "   - Code deployed to Kubernetes"
    echo "   - Functionality verified"
    echo "   - Documentation created"
    exit 0
else
    echo "❌ SOME AGENTS FAILED"
    echo ""
    echo "Check logs for details:"
    echo "   /tmp/agent1_output.log"
    echo "   /tmp/agent2_output.log"
    echo "   /tmp/agent3_output.log"
    echo "   /tmp/agent4_output.log"
    exit 1
fi
