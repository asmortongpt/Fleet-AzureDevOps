#!/usr/bin/env python3
"""
30-Agent Fleet-AzureDevOps Remediation Orchestrator
Launches 30 Claude Opus agents via Anthropic API to fix all workflows in parallel
"""

import os
import json
import asyncio
import aiohttp
from pathlib import Path
from typing import Dict, List, Tuple
import subprocess
from datetime import datetime

# Configuration
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
if not ANTHROPIC_API_KEY:
    raise ValueError('ANTHROPIC_API_KEY environment variable must be set')
REPO_PATH = Path(os.getenv('REPO_PATH', '/tmp/fleet-remediation'))
API_URL = 'https://api.anthropic.com/v1/messages'
MODEL = 'claude-opus-4-20250514'
MAX_TOKENS = 4096
TEMPERATURE = 0.1

# Agent task definitions
AGENTS = [
    # TEAM 1: API Type Definitions & Stubs
    {
        'id': 1,
        'name': 'TensorFlow Stubs',
        'file': 'api/src/@types/tensorflow-stub.d.ts',
        'task': 'Add tensor2d(), tensor3d(), array() method to Tensor interface',
        'instructions': 'Complete all TensorFlow.js stub types. Add missing methods to match API.'
    },
    {
        'id': 2,
        'name': 'OpenCV Stubs',
        'file': 'api/src/@types/opencv-stub.d.ts',
        'task': 'Add boundingRect(), MatVector, matFromImageData(), Canny()',
        'instructions': 'Complete OpenCV.js stub types. Match all method signatures.'
    },
    {
        'id': 3,
        'name': 'SecretsManagementService',
        'file': 'api/src/services/secrets/SecretsManagementService.ts',
        'task': 'Add initialize() and shutdown() methods',
        'instructions': 'Ensure complete: initialize(), shutdown(), getSecret(), setSecret(), deleteSecret(), listSecrets()'
    },
    {
        'id': 4,
        'name': 'ConfigurationManagement',
        'file': 'api/src/services/config/ConfigurationManagementService.ts',
        'task': 'Create/verify ConfigurationManagementService',
        'instructions': 'Methods: getConfig(), setConfig(), deleteConfig(), getAllConfig()'
    },
    {
        'id': 5,
        'name': 'VehicleService',
        'file': 'api/src/modules/fleet/services/vehicle.service.ts',
        'task': 'Add getStatus(vehicleId: string, tenantId: string) method',
        'instructions': 'Complete all vehicle methods. Fix parameter types to match repository.'
    },

    # TEAM 2: API Routes
    {
        'id': 6,
        'name': 'Vehicles Routes Types',
        'file': 'api/src/routes/vehicles.ts',
        'task': 'Fix lines 128, 286, 336: parseInt(vehicleId) for getVehicleById calls',
        'instructions': 'vehicleId is string, getVehicleById expects number. Use parseInt().'
    },
    {
        'id': 7,
        'name': 'Dashboard RBAC',
        'file': 'api/src/middleware/rbac.ts',
        'task': 'Add ANALYTICS_READ and REPORTS_READ to PERMISSIONS',
        'instructions': 'Add: ANALYTICS_READ: "analytics:read", REPORTS_READ: "reports:read"'
    },
    {
        'id': 8,
        'name': 'Drill-Through Routes',
        'file': 'api/src/routes/drill-through/drill-through.routes.enhanced.ts',
        'task': 'Fix query param types and data.count',
        'instructions': 'Cast req.query as string. Change data.count to data.length.'
    },
    {
        'id': 9,
        'name': 'Integrations Health',
        'file': 'api/src/routes/integrations-health.ts',
        'task': 'Fix cache.delete() calls',
        'instructions': 'Use cache.del() instead of cache.delete(). Fix getStats() return type.'
    },
    {
        'id': 10,
        'name': 'App Init Signatures',
        'file': 'api/src/app.ts',
        'task': 'Fix function call signatures lines 79, 231, 255',
        'instructions': 'Adjust arguments to match function definitions.'
    },

    # TEAM 3: Services & Utilities
    {
        'id': 11,
        'name': 'CacheService',
        'file': 'api/src/services/cache.service.ts',
        'task': 'Add del() or delete() method',
        'instructions': 'Add cache deletion. Fix getStats() to return memoryUsage and hitRate.'
    },
    {
        'id': 12,
        'name': 'Drill-Through Validators',
        'file': 'api/src/routes/drill-through/validators.ts',
        'task': 'Export all validator functions',
        'instructions': 'Ensure: validateEntityType, validateFilters, validateFormat exported.'
    },
    {
        'id': 13,
        'name': 'Query Builder',
        'file': 'api/src/routes/drill-through/utils/queryBuilder.ts',
        'task': 'Export buildDrillThroughQuery',
        'instructions': 'Ensure buildQuery() and buildDrillThroughQuery() exported. Parameterized SQL only.'
    },
    {
        'id': 14,
        'name': 'Excel Generator',
        'file': 'api/src/routes/drill-through/utils/generateExcel.ts',
        'task': 'Return proper Buffer',
        'instructions': 'Create stub that returns Buffer compatible with Excel export.'
    },
    {
        'id': 15,
        'name': 'PDF Generator',
        'file': 'api/src/routes/drill-through/utils/generatePDF.ts',
        'task': 'Return proper Buffer',
        'instructions': 'Create stub that returns Buffer compatible with PDF export.'
    },

    # TEAM 4: Repositories
    {
        'id': 16,
        'name': 'FuelCardIntegration Repo',
        'file': 'api/src/repositories/fuelcardintegration.repository.ts',
        'task': 'Verify pg Pool usage, no TypeORM',
        'instructions': 'All queries parameterized. Methods: create, read, update, delete, list.'
    },
    {
        'id': 17,
        'name': 'LeaseTracking Repo',
        'file': 'api/src/repositories/leasetracking.repository.ts',
        'task': 'Verify pg Pool usage, no TypeORM',
        'instructions': 'All queries parameterized. Methods: create, readAll, readById, update, delete.'
    },
    {
        'id': 18,
        'name': 'Vehicle Repository',
        'file': 'api/src/modules/fleet/repositories/vehicle.repository.ts',
        'task': 'Verify extends VehiclesRepository',
        'instructions': 'Constructor: super(pool). Proper import and export.'
    },
    {
        'id': 19,
        'name': 'Vehicles Base Repo',
        'file': 'api/src/repositories/vehicles.repository.ts',
        'task': 'Verify all CRUD methods with tenant isolation',
        'instructions': 'Methods: findById, findByTenant, create, update, delete. All parameterized.'
    },
    {
        'id': 20,
        'name': 'AI Safety Detection',
        'file': 'api/src/services/ai-safety-detection.service.ts',
        'task': 'Ensure TensorFlow imports commented, use external APIs',
        'instructions': 'No direct tf.* calls. Comment out TensorFlow usage.'
    },

    # TEAM 5: Frontend
    {
        'id': 21,
        'name': 'QueryErrorBoundary',
        'file': 'src/components/errors/QueryErrorBoundary.tsx',
        'task': 'Fix line 141: return ReactElement not function',
        'instructions': 'fallbackRender must return JSX, not a render function.'
    },
    {
        'id': 22,
        'name': 'ComplianceHub DataPoint',
        'file': 'src/pages/ComplianceHub.tsx',
        'task': 'Add value property to line 525 array',
        'instructions': 'Transform data to include value: rate for each object.'
    },
    {
        'id': 23,
        'name': 'ComplianceReportingHub',
        'file': 'src/pages/ComplianceReportingHub.tsx',
        'task': 'Add type guards for downloadUrl lines 617-618',
        'instructions': 'Use: if ("downloadUrl" in result && result.downloadUrl)'
    },
    {
        'id': 24,
        'name': 'Frontend TSConfig',
        'file': 'tsconfig.json',
        'task': 'Verify includes src/@types',
        'instructions': 'Check typeRoots and include paths for custom type definitions.'
    },
    {
        'id': 25,
        'name': 'Frontend Types',
        'file': 'src/types/index.ts',
        'task': 'Verify DataPoint has value property',
        'instructions': 'interface DataPoint { name: string; value: number; ...}'
    },

    # TEAM 6: Build & Config
    {
        'id': 26,
        'name': 'Dockerfile',
        'file': 'Dockerfile',
        'task': 'Ensure copies .npmrc, builds successfully',
        'instructions': 'Copy .npmrc before npm install. Use --legacy-peer-deps.'
    },
    {
        'id': 27,
        'name': 'Dockerignore',
        'file': '.dockerignore',
        'task': 'Create with proper exclusions',
        'instructions': 'Exclude: node_modules, .git, dist, coverage, *.log, .env'
    },
    {
        'id': 28,
        'name': 'API Package.json',
        'file': 'api/package.json',
        'task': 'Verify build script exists',
        'instructions': 'Check scripts.build. Verify dependencies: typescript, pg, inversify.'
    },
    {
        'id': 29,
        'name': 'Root npmrc',
        'file': '.npmrc',
        'task': 'Ensure legacy-peer-deps=true',
        'instructions': 'Create/verify .npmrc with legacy-peer-deps=true'
    },
    {
        'id': 30,
        'name': 'GitHub Workflow',
        'file': '.github/workflows/azure-static-web-apps-production.yml',
        'task': 'Verify Node version and secrets',
        'instructions': 'Check Node 20+, deployment token, build commands, API location.'
    }
]

async def call_opus_agent(session: aiohttp.ClientSession, agent: Dict) -> Tuple[int, str, str]:
    """Call Claude Opus API for a single agent task"""

    file_path = REPO_PATH / agent['file']

    # Read current file content if it exists
    file_content = ""
    if file_path.exists():
        file_content = file_path.read_text()

    prompt = f"""You are Agent {agent['id']} ({agent['name']}) in a 30-agent swarm fixing Fleet-AzureDevOps.

TASK: {agent['task']}
FILE: {agent['file']}
INSTRUCTIONS: {agent['instructions']}

CURRENT FILE CONTENT:
```
{file_content}
```

CRITICAL REQUIREMENTS:
1. Output ONLY the complete fixed file content
2. Preserve all existing code except what needs fixing
3. Use parameterized SQL queries ($1, $2, $3) - never string concatenation
4. Maintain code style and formatting
5. If file doesn't exist and should be created, output new file
6. NO explanations, NO markdown code blocks, ONLY the file content

OUTPUT THE FIXED FILE CONTENT NOW:"""

    payload = {
        'model': MODEL,
        'max_tokens': MAX_TOKENS,
        'temperature': TEMPERATURE,
        'messages': [{'role': 'user', 'content': prompt}]
    }

    headers = {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
    }

    try:
        async with session.post(API_URL, json=payload, headers=headers) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                return agent['id'], 'error', f"API error {resp.status}: {error_text}"

            result = await resp.json()
            content = result.get('content', [{}])[0].get('text', '')

            return agent['id'], 'success', content

    except Exception as e:
        return agent['id'], 'error', str(e)

async def run_all_agents():
    """Run all 30 agents in parallel"""
    print(f"🚀 30-Agent Fleet-AzureDevOps Remediation Orchestrator")
    print("=" * 60)
    print(f"Repository: {REPO_PATH}")
    print(f"Model: {MODEL}")
    print(f"Agents: {len(AGENTS)}")
    print("")

    # Prepare repository
    REPO_PATH.mkdir(parents=True, exist_ok=True)
    results_dir = REPO_PATH / 'agent-results'
    results_dir.mkdir(exist_ok=True)

    print("📋 Launching 30 agents in parallel...")
    print("")

    async with aiohttp.ClientSession() as session:
        tasks = [call_opus_agent(session, agent) for agent in AGENTS]
        results = await asyncio.gather(*tasks)

    print("")
    print("✅ All 30 agents completed!")
    print("")
    print("📊 Processing results...")
    print("")

    # Apply fixes
    fixes_applied = 0
    errors = 0

    for agent_id, status, content in results:
        agent = next(a for a in AGENTS if a['id'] == agent_id)

        if status == 'success':
            file_path = REPO_PATH / agent['file']
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content)
            fixes_applied += 1
            print(f"✅ Agent {agent_id:2d} ({agent['name']:30s}): Fixed {agent['file']}")
        else:
            errors += 1
            print(f"❌ Agent {agent_id:2d} ({agent['name']:30s}): {content[:100]}")

        # Save result
        result_file = results_dir / f"agent-{agent_id}.json"
        result_file.write_text(json.dumps({
            'agent_id': agent_id,
            'name': agent['name'],
            'file': agent['file'],
            'status': status,
            'content': content,
            'timestamp': datetime.now().isoformat()
        }, indent=2))

    print("")
    print(f"📈 Summary:")
    print(f"   Fixes applied: {fixes_applied}")
    print(f"   Errors: {errors}")
    print("")

    # Commit changes
    if fixes_applied > 0:
        print("💾 Committing changes...")
        subprocess.run(['git', 'add', '-A'], cwd=REPO_PATH, check=True)
        subprocess.run([
            'git', 'commit', '-m',
            f'fix: 30-agent automated remediation ({fixes_applied} files)\n\n'
            f'Applied fixes from 30 Claude Opus agents:\n'
            f'- API type definitions and stubs\n'
            f'- Route type conversions\n'
            f'- Service method completions\n'
            f'- Repository conversions\n'
            f'- Frontend type guards\n'
            f'- Build configuration\n\n'
            f'🤖 Generated by 30-agent orchestrator'
        ], cwd=REPO_PATH, check=False)

        print("🚀 Pushing to GitHub...")
        subprocess.run(['git', 'push'], cwd=REPO_PATH, check=False)
        print("")

    print("✨ Orchestration complete!")
    return fixes_applied, errors

if __name__ == '__main__':
    fixes, errors = asyncio.run(run_all_agents())
    exit(0 if errors == 0 else 1)
