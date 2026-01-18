#!/usr/bin/env python3
"""
Quality Gates Remediation Orchestrator
Targets specific TypeScript errors from GitHub Actions Quality Gates workflow
"""

import os
import sys
import json
import asyncio
import aiohttp
from pathlib import Path
from typing import Dict, List

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
REPO_PATH = os.getenv('REPO_PATH', '/Users/andrewmorton/Documents/GitHub/Fleet-AzureDevOps')
MODEL = 'claude-opus-4-20250514'
MAX_TOKENS = 8192
TEMPERATURE = 0.1

# Targeted agents for Quality Gates errors
AGENTS = [
    # Fix react-router-dom type conflicts
    {
        "id": 1,
        "name": "Remove react-router-dom stub",
        "file": "src/@types/module-augmentation.d.ts",
        "task": "Remove any react-router-dom module augmentation. The package has its own types. Do NOT declare module 'react-router-dom'."
    },
    {
        "id": 2,
        "name": "Verify BrowserRouter import",
        "file": ".storybook/decorators.tsx",
        "task": "Ensure BrowserRouter is imported from 'react-router-dom'. If error persists, use Router from 'react-router' instead."
    },
    {
        "id": 3,
        "name": "Fix useNavigate in DamageReportDetails",
        "file": "src/components/DamageReports/DamageReportDetails.tsx",
        "task": "Ensure useNavigate is properly imported from react-router-dom. Add import statement if missing."
    },
    {
        "id": 4,
        "name": "Fix useNavigate in CreateDamageReport",
        "file": "src/components/DamageReports/CreateDamageReport.tsx",
        "task": "Ensure useNavigate is properly imported from react-router-dom. Add import statement if missing."
    },
    {
        "id": 5,
        "name": "Fix Link in Breadcrumb",
        "file": "src/components/Breadcrumb.tsx",
        "task": "Ensure Link is properly imported from react-router-dom. Add import statement if missing."
    },

    # Fix react-leaflet type conflicts
    {
        "id": 6,
        "name": "Fix react-leaflet types",
        "file": "src/@types/react-leaflet.d.ts",
        "task": "Add Polygon and Circle to the react-leaflet module declaration exports. Include: export const Polygon: any; export const Circle: any;"
    },
    {
        "id": 7,
        "name": "Verify AssetLocationMap imports",
        "file": "src/components/AssetLocationMap.tsx",
        "task": "Ensure Polygon and Circle are imported from react-leaflet. Verify imports are correct."
    },

    # Fix App.tsx lazy loading
    {
        "id": 8,
        "name": "Fix MaintenanceHub lazy load",
        "file": "src/App.tsx",
        "task": "At line 132, fix lazy loading for MaintenanceHub. Ensure it returns { default: Component }. Use: lazy(() => import('./pages/MaintenanceHub').then(m => ({ default: m.default || m.MaintenanceHub })))"
    },
    {
        "id": 9,
        "name": "Fix ProcurementHub lazy load",
        "file": "src/App.tsx",
        "task": "At line 136, fix lazy loading for ProcurementHub. Ensure it returns { default: Component }. Use: lazy(() => import('./pages/ProcurementHub').then(m => ({ default: m.default || m.ProcurementHub })))"
    },
    {
        "id": 10,
        "name": "Fix LiveFleetDashboard lazy load",
        "file": "src/App.tsx",
        "task": "At line 81, fix lazy loading for LiveFleetDashboard. Ensure it returns { default: Component }. Use: lazy(() => import('./components/dashboard/LiveFleetDashboard').then(m => ({ default: m.default || m.LiveFleetDashboard })))"
    },

    # Fix CinematicCameraSystem infinite type
    {
        "id": 11,
        "name": "Fix CinematicCameraSystem types",
        "file": "src/camera/CinematicCameraSystem.tsx",
        "task": "At line 326, fix 'Type instantiation is excessively deep' error. Add explicit type annotations to break circular type inference. Use 'as any' type assertion if needed to break infinite recursion."
    },

    # Install missing type packages
    {
        "id": 12,
        "name": "Check @types/react-router-dom",
        "file": "package.json",
        "task": "Verify @types/react-router-dom is in devDependencies. If not present, add it. Check react-router-dom version and add matching @types version."
    },

    # Remove conflicting augmentations
    {
        "id": 13,
        "name": "Clean module-augmentation",
        "file": "src/@types/module-augmentation.d.ts",
        "task": "Remove ALL declarations for packages that have their own types: react-router-dom, react-leaflet. Only keep augmentations for packages WITHOUT types."
    },

    # Verify index.d.ts doesn't conflict
    {
        "id": 14,
        "name": "Clean index.d.ts references",
        "file": "src/@types/index.d.ts",
        "task": "Remove any references to react-router-dom or react-leaflet. Only reference packages that truly need custom types."
    },

    # Add proper exports to react-extensions
    {
        "id": 15,
        "name": "Fix react-extensions.d.ts",
        "file": "src/@types/react-extensions.d.ts",
        "task": "Ensure this file ONLY extends React namespace, does NOT declare external modules. Remove any 'declare module' statements."
    }
]

async def call_opus_agent(session: aiohttp.ClientSession, agent: Dict) -> tuple:
    """Call Claude Opus API to fix a specific file"""
    agent_id = agent["id"]
    file_path = os.path.join(REPO_PATH, agent["file"])

    # Read current file if it exists
    current_content = ""
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            current_content = f.read()

    # Construct prompt
    prompt = f"""You are Quality Gates Agent {agent_id}: {agent["name"]}

CRITICAL: Fix TypeScript errors for GitHub Actions Quality Gates workflow.

Task: {agent["task"]}

File: {agent["file"]}

Current Content:
{current_content if current_content else "File does not exist - create it"}

REQUIREMENTS:
1. {agent["task"]}
2. Do NOT create type declarations for packages that have their own types
3. Only augment types, do not replace them
4. Ensure all imports are correct
5. Return ONLY the complete fixed file content
6. Do NOT include markdown code fences or explanations

Return the complete file content:"""

    try:
        async with session.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            json={
                'model': MODEL,
                'max_tokens': MAX_TOKENS,
                'temperature': TEMPERATURE,
                'messages': [{'role': 'user', 'content': prompt}]
            },
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                return (agent_id, 'error', f"API error {response.status}: {error_text}")

            result = await response.json()
            content = result['content'][0]['text']

            # Write fixed content
            os.makedirs(os.path.dirname(file_path) if os.path.dirname(file_path) else '.', exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return (agent_id, 'success', content)

    except Exception as e:
        return (agent_id, 'error', str(e))

async def main():
    print("🎯 Quality Gates Remediation Orchestrator")
    print("="*70)
    print(f"Repository: {REPO_PATH}")
    print(f"Model: {MODEL}")
    print(f"Agents: {len(AGENTS)}")
    print()
    print("📋 Launching agents to fix Quality Gates errors...")
    print()

    async with aiohttp.ClientSession() as session:
        tasks = [call_opus_agent(session, agent) for agent in AGENTS]
        results = await asyncio.gather(*tasks)

    print("\n✅ All agents completed!")
    print("\n📊 Processing results...")
    print()

    success_count = 0
    error_count = 0

    for agent_id, status, content in results:
        agent = next(a for a in AGENTS if a["id"] == agent_id)

        if status == 'success':
            success_count += 1
            print(f"✅ Agent {agent_id:2d} ({agent['name']:35s}): Fixed {agent['file']}")
        else:
            error_count += 1
            print(f"❌ Agent {agent_id:2d} ({agent['name']:35s}): {content[:80]}")

    print()
    print(f"📈 Summary:")
    print(f"   Fixes applied: {success_count}")
    print(f"   Errors: {error_count}")
    print()
    print("✨ Quality Gates fixes complete!")

if __name__ == '__main__':
    if not ANTHROPIC_API_KEY:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    asyncio.run(main())
