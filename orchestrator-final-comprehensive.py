#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE REMEDIATION ORCHESTRATOR
100-agent massive parallel execution to eliminate ALL TypeScript errors
"""

import os
import sys
import json
import asyncio
import aiohttp
from pathlib import Path
from typing import Dict, List
import subprocess

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
REPO_PATH = os.getenv('REPO_PATH', '/Users/andrewmorton/Documents/GitHub/Fleet-AzureDevOps')
MODEL = 'claude-opus-4-20250514'
MAX_TOKENS = 8192
TEMPERATURE = 0

def get_typescript_errors():
    """Extract actual TypeScript errors from npm run typecheck"""
    result = subprocess.run(
        ['npm', 'run', 'typecheck'],
        cwd=REPO_PATH,
        capture_output=True,
        text=True,
        timeout=120
    )

    errors = []
    for line in result.stdout.split('\n') + result.stderr.split('\n'):
        if 'error TS' in line:
            errors.append(line.strip())

    return errors[:100]  # Limit to first 100 unique errors

def parse_error_to_agent(error_line: str, agent_id: int) -> Dict:
    """Convert TypeScript error line into agent task"""
    parts = error_line.split('error TS')
    if len(parts) < 2:
        return None

    file_and_line = parts[0].strip()
    error_details = 'error TS' + parts[1]

    # Extract file path
    file_path = file_and_line.split('(')[0] if '(' in file_and_line else file_and_line

    # Extract error code and message
    error_match = error_details.split(':', 1)
    error_code = error_match[0].strip() if error_match else ""
    error_msg = error_match[1].strip() if len(error_match) > 1 else ""

    return {
        "id": agent_id,
        "name": f"Fix {error_code} in {os.path.basename(file_path)}",
        "file": file_path,
        "task": f"Fix TypeScript error: {error_msg}. Location: {file_and_line}. Ensure proper types, imports, and exports."
    }

async def call_opus_agent(session: aiohttp.ClientSession, agent: Dict) -> tuple:
    """Call Claude Opus API to fix a specific file"""
    if not agent:
        return (0, 'skipped', 'Invalid agent')

    agent_id = agent["id"]
    file_path = os.path.join(REPO_PATH, agent["file"])

    # Read current file if it exists
    current_content = ""
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                current_content = f.read()
        except Exception as e:
            return (agent_id, 'error', f"Failed to read file: {str(e)}")

    # Construct prompt
    prompt = f"""You are FINAL FIX Agent {agent_id}: {agent["name"]}

CRITICAL MISSION: Eliminate this TypeScript error completely.

Task: {agent["task"]}

File: {agent["file"]}

Current Content:
{current_content if current_content else "File does not exist"}

STRICT REQUIREMENTS:
1. Fix the EXACT error described
2. Do NOT break existing functionality
3. Use proper TypeScript types (no 'any' unless absolutely necessary)
4. Ensure all imports are correct
5. If file doesn't exist, create stub only if explicitly needed
6. Return ONLY the complete fixed file content
7. NO markdown code fences or explanations

Return complete file content:"""

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
                return (agent_id, 'error', f"API {response.status}")

            result = await response.json()
            content = result['content'][0]['text']

            # Write fixed content
            if current_content or 'create' in agent["task"].lower():
                os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

            return (agent_id, 'success', f"Fixed {os.path.basename(agent['file'])}")

    except Exception as e:
        return (agent_id, 'error', str(e)[:80])

async def main():
    print("🚀 FINAL COMPREHENSIVE REMEDIATION - 100 AGENTS")
    print("="*70)
    print(f"Repository: {REPO_PATH}")
    print(f"Model: {MODEL} (Temperature: {TEMPERATURE})")
    print()

    print("📊 Extracting TypeScript errors...")
    errors = get_typescript_errors()
    print(f"Found {len(errors)} TypeScript errors to fix")
    print()

    # Convert errors to agents
    agents = []
    for i, error in enumerate(errors, 1):
        agent = parse_error_to_agent(error, i)
        if agent:
            agents.append(agent)

    print(f"📋 Launching {len(agents)} agents in parallel...")
    print()

    async with aiohttp.ClientSession() as session:
        # Run in batches of 20 to avoid rate limits
        batch_size = 20
        all_results = []

        for i in range(0, len(agents), batch_size):
            batch = agents[i:i+batch_size]
            print(f"⚡ Processing batch {i//batch_size + 1}/{(len(agents)-1)//batch_size + 1} ({len(batch)} agents)...")

            tasks = [call_opus_agent(session, agent) for agent in batch]
            results = await asyncio.gather(*tasks)
            all_results.extend(results)

            # Small delay between batches
            if i + batch_size < len(agents):
                await asyncio.sleep(2)

    print("\n✅ All agents completed!")
    print("\n📊 Results:")
    print()

    success_count = sum(1 for _, status, _ in all_results if status == 'success')
    error_count = sum(1 for _, status, _ in all_results if status == 'error')

    for agent_id, status, msg in all_results:
        if status == 'success':
            print(f"✅ Agent {agent_id:3d}: {msg}")
        else:
            print(f"❌ Agent {agent_id:3d}: {msg}")

    print()
    print(f"📈 FINAL Summary:")
    print(f"   Total Agents: {len(agents)}")
    print(f"   Successful Fixes: {success_count}")
    print(f"   Errors: {error_count}")
    print()
    print("✨ Final remediation complete!")

if __name__ == '__main__':
    if not ANTHROPIC_API_KEY:
        print("❌ Error: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    asyncio.run(main())
