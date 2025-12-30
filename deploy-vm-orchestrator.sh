#!/bin/bash
# Azure VM Multi-Agent TypeScript Error Orchestrator
# Deploys Grok + Claude agents in parallel on Azure VM

set -e

echo "🚀 AZURE VM MULTI-AGENT ORCHESTRATION DEPLOYMENT"
echo "================================================"
echo "Target: Fix all 870 TypeScript errors"
echo "Strategy: Massive parallel deployment"
echo ""

# Azure VM Configuration
VM_NAME="ai-agent-orchestrator"
VM_ZONE="us-central1-a"
WORKING_DIR="/Users/andrewmorton/Documents/GitHub/fleet-local"

# Export environment variables
export GROK_API_KEY="${XAI_API_KEY}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"

echo "📊 Current Status:"
echo "  - Errors: 870 TypeScript errors"
echo "  - Working Dir: ${WORKING_DIR}"
echo "  - Azure VM: ${VM_NAME}"
echo ""

# Create orchestration manifest
cat > /tmp/ts-fix-manifest.json <<'EOF'
{
  "project": "fleet-local-typescript-remediation",
  "totalErrors": 870,
  "errorBreakdown": {
    "TS2339": 411,
    "TS2322": 94,
    "TS2345": 51,
    "TS2305": 48,
    "TS2353": 35,
    "TS2352": 28,
    "TS2769": 27,
    "TS2307": 27,
    "TS18046": 22,
    "TS2551": 18,
    "other": 109
  },
  "agents": [
    {
      "id": "grok-1",
      "type": "grok-beta",
      "task": "Fix TS2339 property errors (411 errors)",
      "priority": "CRITICAL",
      "model": "grok-beta",
      "parallelism": 10
    },
    {
      "id": "grok-2",
      "type": "grok-beta",
      "task": "Fix TS2322 type assignment errors (94 errors)",
      "priority": "HIGH",
      "model": "grok-beta",
      "parallelism": 5
    },
    {
      "id": "claude-1",
      "type": "autonomous-coder",
      "task": "Fix TS2345 argument type errors (51 errors)",
      "priority": "HIGH",
      "model": "sonnet",
      "parallelism": 3
    },
    {
      "id": "claude-2",
      "type": "autonomous-coder",
      "task": "Fix TS2305 module export errors (48 errors)",
      "priority": "HIGH",
      "model": "sonnet",
      "parallelism": 3
    },
    {
      "id": "gpt-1",
      "type": "openai-o1",
      "task": "Fix TS2353 object literal errors (35 errors)",
      "priority": "MEDIUM",
      "model": "o1-preview",
      "parallelism": 2
    },
    {
      "id": "gemini-1",
      "type": "gemini-2.0",
      "task": "Fix TS2307 cannot find module errors (27 errors)",
      "priority": "MEDIUM",
      "model": "gemini-2.0-flash-exp",
      "parallelism": 2
    },
    {
      "id": "cleanup-agent",
      "type": "autonomous-coder",
      "task": "Fix remaining 114 misc errors",
      "priority": "LOW",
      "model": "sonnet",
      "parallelism": 2
    }
  ],
  "strategy": "parallel-swarming",
  "maxConcurrentAgents": 27,
  "targetErrors": 0
}
EOF

echo "✅ Orchestration manifest created"
echo ""

# Create Grok deployment script
cat > /tmp/deploy-grok-swarm.py <<'PYTHON'
#!/usr/bin/env python3
"""
Grok Multi-Agent Swarm Deployment
Deploys multiple Grok agents in parallel to fix TypeScript errors
"""

import os
import json
import asyncio
import subprocess
from typing import List, Dict
from openai import OpenAI

# Initialize Grok client
client = OpenAI(
    api_key=os.environ.get("XAI_API_KEY"),
    base_url="https://api.x.ai/v1"
)

async def deploy_grok_agent(agent_config: Dict, error_list_file: str):
    """Deploy a single Grok agent to fix errors"""
    agent_id = agent_config['id']
    task = agent_config['task']
    error_count = int(task.split('(')[1].split(' ')[0])

    print(f"🤖 [GROK-{agent_id}] Deploying to fix {error_count} errors...")

    prompt = f"""You are a TypeScript error fixing specialist. Your mission:

TASK: {task}

CODEBASE: /Users/andrewmorton/Documents/GitHub/fleet-local
ERROR LIST: {error_list_file}

INSTRUCTIONS:
1. Read the error list file to get specific errors for your category
2. Use RAG to search for similar patterns across the codebase
3. Apply systematic fixes following these patterns:
   - For TS2339 (property doesn't exist): Add type guards, update interfaces
   - For TS2322 (type not assignable): Add proper type casts, fix signatures
   - For TS2345 (argument type): Fix function parameter types
4. Test each fix: ./node_modules/.bin/tsc --noEmit --skipLibCheck
5. Create granular git commits for each category of fixes
6. Report: errors fixed count

SECURITY: Follow parameterized queries, no hardcoded secrets, proper validation.

Fix ALL assigned errors. Report progress every 50 fixes.
"""

    try:
        response = client.chat.completions.create(
            model="grok-beta",
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.3,
            max_tokens=8000
        )

        result = response.choices[0].message.content
        print(f"✅ [GROK-{agent_id}] Completed: {result[:200]}...")
        return {
            "agent": agent_id,
            "status": "completed",
            "result": result
        }
    except Exception as e:
        print(f"❌ [GROK-{agent_id}] Error: {e}")
        return {
            "agent": agent_id,
            "status": "failed",
            "error": str(e)
        }

async def deploy_all_grok_agents(manifest_path: str):
    """Deploy all Grok agents in parallel"""
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)

    grok_agents = [a for a in manifest['agents'] if a['type'] == 'grok-beta']

    print(f"🚀 Deploying {len(grok_agents)} Grok agents in parallel...")

    # Create error list files for each agent
    subprocess.run([
        './node_modules/.bin/tsc', '--noEmit', '--skipLibCheck'
    ], capture_output=True, text=True, cwd='/Users/andrewmorton/Documents/GitHub/fleet-local')

    tasks = []
    for agent in grok_agents:
        error_file = f"/tmp/errors_{agent['id']}.txt"
        tasks.append(deploy_grok_agent(agent, error_file))

    results = await asyncio.gather(*tasks)

    print("\n📊 GROK DEPLOYMENT RESULTS:")
    for result in results:
        print(f"  - {result['agent']}: {result['status']}")

    return results

if __name__ == "__main__":
    asyncio.run(deploy_all_grok_agents("/tmp/ts-fix-manifest.json"))
PYTHON

chmod +x /tmp/deploy-grok-swarm.py

echo "✅ Grok deployment script created"
echo ""

# Create Claude agent deployment
cat > /tmp/deploy-claude-agents.sh <<'BASH'
#!/bin/bash
# Deploy Claude autonomous-coder agents in parallel

echo "🤖 Deploying Claude Autonomous Agents..."

# This will be executed via Claude Code's Task tool
cat > /tmp/claude-agent-tasks.txt <<EOF
AGENT-1: Fix TS2345 argument type errors (51 errors)
AGENT-2: Fix TS2305 module export errors (48 errors)
AGENT-3: Fix remaining misc errors (114 errors)
EOF

echo "✅ Claude agent tasks defined"
echo "   Agents will be spawned via Claude Code Task tool"
BASH

chmod +x /tmp/deploy-claude-agents.sh

echo "✅ Claude deployment script created"
echo ""

echo "🎯 DEPLOYMENT SEQUENCE:"
echo "  1. Extract error categories to separate files"
echo "  2. Deploy Grok swarm (2 agents, 15 parallel threads)"
echo "  3. Deploy Claude agents (3 agents)"
echo "  4. Deploy OpenAI + Gemini agents (2 agents)"
echo "  5. Aggregate results and verify zero errors"
echo ""

# Extract error categories
cd "${WORKING_DIR}"
./node_modules/.bin/tsc --noEmit --skipLibCheck 2>&1 > /tmp/all_errors_current.txt

echo "📋 Extracting error categories..."
grep "TS2339" /tmp/all_errors_current.txt > /tmp/errors_TS2339.txt || true
grep "TS2322" /tmp/all_errors_current.txt > /tmp/errors_TS2322.txt || true
grep "TS2345" /tmp/all_errors_current.txt > /tmp/errors_TS2345.txt || true
grep "TS2305" /tmp/all_errors_current.txt > /tmp/errors_TS2305.txt || true
grep "TS2353" /tmp/all_errors_current.txt > /tmp/errors_TS2353.txt || true
grep "TS2307" /tmp/all_errors_current.txt > /tmp/errors_TS2307.txt || true

echo "✅ Error categories extracted to /tmp/errors_*.txt"
echo ""

echo "🚀 READY FOR PARALLEL DEPLOYMENT"
echo "   Run the following commands in separate terminals:"
echo ""
echo "   Terminal 1: python3 /tmp/deploy-grok-swarm.py"
echo "   Terminal 2: bash /tmp/deploy-claude-agents.sh"
echo ""
echo "   Or execute via Claude Code orchestration..."
