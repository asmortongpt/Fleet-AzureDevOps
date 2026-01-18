#!/usr/bin/env python3
"""
50-Agent Comprehensive TypeScript Error Remediation Orchestrator
Systematically fixes all 1203 TypeScript errors in Fleet-AzureDevOps
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

# 50 agents organized by error category
AGENTS = [
    # Category 1: Missing Type Declarations (15 agents)
    {"id": 1, "name": "Leaflet Types", "file": "src/@types/leaflet.d.ts", "task": "Create comprehensive Leaflet type declarations for all L.* classes"},
    {"id": 2, "name": "React-Leaflet Types", "file": "src/@types/react-leaflet.d.ts", "task": "Create react-leaflet type declarations for MapContainer, TileLayer, Marker, Popup"},
    {"id": 3, "name": "React-Dropzone Types", "file": "src/@types/react-dropzone.d.ts", "task": "Create react-dropzone type declarations with useDropzone hook"},
    {"id": 4, "name": "Html5-Qrcode Types", "file": "src/@types/html5-qrcode.d.ts", "task": "Create html5-qrcode type declarations with Html5Qrcode class"},
    {"id": 5, "name": "React-QR-Scanner Types", "file": "src/@types/yudiel-react-qr-scanner.d.ts", "task": "Create @yudiel/react-qr-scanner type declarations"},
    {"id": 6, "name": "React-Virtual Types", "file": "src/@types/tanstack-react-virtual.d.ts", "task": "Create @tanstack/react-virtual type declarations with useVirtualizer hook"},
    {"id": 7, "name": "React-PDF Types", "file": "src/@types/react-pdf.d.ts", "task": "Create react-pdf type declarations with Document and Page components"},
    {"id": 8, "name": "React-Leaflet-Cluster Types", "file": "src/@types/react-leaflet-cluster.d.ts", "task": "Create react-leaflet-cluster type declarations"},
    {"id": 9, "name": "Storybook-React Types", "file": "src/@types/storybook-react.d.ts", "task": "Create @storybook/react type declarations"},
    {"id": 10, "name": "Install @types/leaflet", "file": "package.json", "task": "Check if @types/leaflet exists in npm, if so add to devDependencies"},
    {"id": 11, "name": "TypeScript Config Paths", "file": "tsconfig.json", "task": "Ensure typeRoots includes src/@types"},
    {"id": 12, "name": "Vite Config Types", "file": "vite.config.ts", "task": "Ensure Vite config doesn't conflict with custom types"},
    {"id": 13, "name": "Global Types Index", "file": "src/@types/index.d.ts", "task": "Create index file that references all custom type declarations"},
    {"id": 14, "name": "Module Augmentation", "file": "src/@types/module-augmentation.d.ts", "task": "Create module augmentation for missing exports"},
    {"id": 15, "name": "React Node Types", "file": "src/@types/react-extensions.d.ts", "task": "Extend React types for ReactNode compatibility"},

    # Category 2: Toast.info Errors (10 agents)
    {"id": 16, "name": "AdminDashboard Toast", "file": "src/components/dashboards/roles/AdminDashboard.tsx", "task": "Replace all toast.info() with toast() - lines 129, 139, 149, 154"},
    {"id": 17, "name": "DispatcherDashboard Toast", "file": "src/components/dashboards/roles/DispatcherDashboard.tsx", "task": "Replace all toast.info() with toast() - lines 120, 125, 130"},
    {"id": 18, "name": "DriverDashboard Toast", "file": "src/components/dashboards/roles/DriverDashboard.tsx", "task": "Replace all toast.info() with toast() - lines 90, 98, 106, 156"},
    {"id": 19, "name": "FleetManagerDashboard Toast", "file": "src/components/dashboards/roles/FleetManagerDashboard.tsx", "task": "Replace all toast.info() with toast() - lines 81, 88, 101, 108"},
    {"id": 20, "name": "MaintenanceManagerDashboard Toast", "file": "src/components/dashboards/roles/MaintenanceManagerDashboard.tsx", "task": "Replace all toast.info() with toast() - lines 129, 134, 139"},
    {"id": 21, "name": "AlertsPanel Logger", "file": "src/components/admin/AlertsPanel.tsx", "task": "Fix LogContext type errors at lines 151, 156"},
    {"id": 22, "name": "EmulatorMonitor Logger", "file": "src/components/admin/EmulatorMonitor.tsx", "task": "Fix LogContext type errors at lines 138, 143"},
    {"id": 23, "name": "Toast Type Utility", "file": "src/lib/toast-helpers.ts", "task": "Create toast helper with info, success, error, warning methods"},
    {"id": 24, "name": "Logger Type Fix", "file": "src/utils/logger.ts", "task": "Ensure LogContext type allows string context"},
    {"id": 25, "name": "Toast Import Standardization", "file": "src/lib/toast-import-standard.md", "task": "Document standard toast import pattern"},

    # Category 3: Phosphor Icon Errors (5 agents)
    {"id": 26, "name": "AdminDashboard Activity Icon", "file": "src/components/dashboards/roles/AdminDashboard.tsx", "task": "Replace Activity icon with ChartLine or Gauge"},
    {"id": 27, "name": "DispatcherDashboard Route Icon", "file": "src/components/dashboards/roles/DispatcherDashboard.tsx", "task": "Replace Route icon with MapTrifold or Path"},
    {"id": 28, "name": "MaintenanceManagerDashboard Tools Icon", "file": "src/components/dashboards/roles/MaintenanceManagerDashboard.tsx", "task": "Replace Tools icon with Wrench or Toolbox"},
    {"id": 29, "name": "Phosphor Icons Inventory", "file": "src/lib/phosphor-icons-available.ts", "task": "List all valid Phosphor icons used in project"},
    {"id": 30, "name": "Icon Replacement Guide", "file": "docs/icon-migration.md", "task": "Document icon replacements"},

    # Category 4: Zod Schema Errors (5 agents)
    {"id": 31, "name": "CreateDamageReport Zod", "file": "src/components/DamageReports/CreateDamageReport.tsx", "task": "Fix zod enum at line 25 - use z.enum(['minor', 'moderate', 'severe']) without required_error"},
    {"id": 32, "name": "Zod Error Handling", "file": "src/components/DamageReports/CreateDamageReport.tsx", "task": "Fix error.errors access at line 108 - use error.issues"},
    {"id": 33, "name": "Zod Schema Types", "file": "src/schemas/damage-report.schema.ts", "task": "Create proper zod schema for damage reports"},
    {"id": 34, "name": "Zod Utilities", "file": "src/lib/zod-helpers.ts", "task": "Create zod utility functions for common patterns"},
    {"id": 35, "name": "Zod Version Check", "file": "package.json", "task": "Ensure zod version is compatible (>=3.23)"},

    # Category 5: Drilldown Type Errors (15 agents)
    {"id": 36, "name": "AlertDrilldowns Types", "file": "src/components/drilldown/AlertDrilldowns.tsx", "task": "Fix all type modifier conflicts in Alert interface"},
    {"id": 37, "name": "AssetHubDrilldowns Types", "file": "src/components/drilldown/AssetHubDrilldowns.tsx", "task": "Add proper types for asset properties"},
    {"id": 38, "name": "AssetHubDrilldowns ReactNode", "file": "src/components/drilldown/AssetHubDrilldowns.tsx", "task": "Fix unknown to ReactNode conversion at line 44"},
    {"id": 39, "name": "Drilldown Common Types", "file": "src/types/drilldown.ts", "task": "Create centralized drilldown type definitions"},
    {"id": 40, "name": "Alert Interface", "file": "src/types/alert.ts", "task": "Create proper Alert interface with all fields"},
    {"id": 41, "name": "Asset Interface", "file": "src/types/asset.ts", "task": "Create proper Asset interface with all fields"},
    {"id": 42, "name": "ActivityLog Interface", "file": "src/types/activity-log.ts", "task": "Standardize activity_log vs activityLog naming"},
    {"id": 43, "name": "NotificationsSent Interface", "file": "src/types/notifications.ts", "task": "Create notifications_sent type"},
    {"id": 44, "name": "Drilldown Context Types", "file": "src/contexts/DrilldownContext.tsx", "task": "Ensure DrilldownContext exports proper types"},
    {"id": 45, "name": "Drilldown Utils", "file": "src/utils/drilldown-helpers.ts", "task": "Create type-safe drilldown helper functions"},
    {"id": 46, "name": "Status Enums", "file": "src/types/enums.ts", "task": "Create enums for alert status, severity, priority"},
    {"id": 47, "name": "Date Formatting Utils", "file": "src/utils/date-helpers.ts", "task": "Create type-safe date formatting utilities"},
    {"id": 48, "name": "Drilldown Table Types", "file": "src/components/drilldown/types.ts", "task": "Create table column types for drilldowns"},
    {"id": 49, "name": "Drilldown Test Fixtures", "file": "src/__tests__/fixtures/drilldown.ts", "task": "Create test fixtures with proper types"},
    {"id": 50, "name": "Type Guard Functions", "file": "src/utils/type-guards.ts", "task": "Create type guards for runtime type checking"}
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
    prompt = f"""You are Agent {agent_id}: {agent["name"]}

Task: {agent["task"]}

File: {agent["file"]}

Current Content:
{current_content if current_content else "File does not exist - create it"}

Instructions:
1. {agent["task"]}
2. Follow TypeScript best practices
3. Ensure compatibility with existing codebase
4. Return ONLY the complete fixed file content
5. Do NOT include markdown code fences or explanations
6. If creating new type declarations, use proper .d.ts format

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
    print("🚀 50-Agent Comprehensive TypeScript Remediation")
    print("="*70)
    print(f"Repository: {REPO_PATH}")
    print(f"Model: {MODEL}")
    print(f"Agents: {len(AGENTS)}")
    print()
    print("📋 Launching 50 agents in parallel...")
    print()

    async with aiohttp.ClientSession() as session:
        tasks = [call_opus_agent(session, agent) for agent in AGENTS]
        results = await asyncio.gather(*tasks)

    print("\n✅ All 50 agents completed!")
    print("\n📊 Processing results...")
    print()

    success_count = 0
    error_count = 0

    # Save results
    os.makedirs('agent-results', exist_ok=True)

    for agent_id, status, content in results:
        agent = next(a for a in AGENTS if a["id"] == agent_id)

        if status == 'success':
            success_count += 1
            print(f"✅ Agent {agent_id:2d} ({agent['name']:30s}): Fixed {agent['file']}")

            # Save result
            with open(f'agent-results/agent-{agent_id}.json', 'w') as f:
                json.dump({
                    'agent_id': agent_id,
                    'name': agent['name'],
                    'file': agent['file'],
                    'status': 'success',
                    'content_length': len(content)
                }, f, indent=2)
        else:
            error_count += 1
            print(f"❌ Agent {agent_id:2d} ({agent['name']:30s}): {content}")

            with open(f'agent-results/agent-{agent_id}.json', 'w') as f:
                json.dump({
                    'agent_id': agent_id,
                    'name': agent['name'],
                    'file': agent['file'],
                    'status': 'error',
                    'error': content
                }, f, indent=2)

    print()
    print(f"📈 Summary:")
    print(f"   Fixes applied: {success_count}")
    print(f"   Errors: {error_count}")
    print()

    # Run type check
    print("🔍 Running TypeScript type check...")
    os.system(f"cd {REPO_PATH} && npm run typecheck 2>&1 | grep 'error TS' | wc -l")

    print()
    print("✨ Orchestration complete!")

if __name__ == '__main__':
    if not ANTHROPIC_API_KEY:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    asyncio.run(main())
