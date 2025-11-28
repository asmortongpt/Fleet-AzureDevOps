#!/usr/bin/env python3
"""
Fleet Management UI Refresh Orchestrator
Runs all AI agent tasks in parallel using OpenAI and Gemini APIs
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent / 'agent-tasks'))

print("🚀 Fleet Management UI Refresh Orchestrator")
print("=" * 60)
print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/Users/andrewmorton/.env')

# Verify API keys
OPENAI_KEY = os.getenv('OPENAI_API_KEY')
GEMINI_KEY = os.getenv('GEMINI_API_KEY')

if not OPENAI_KEY:
    print("❌ Error: OPENAI_API_KEY not found in environment")
    sys.exit(1)

if not GEMINI_KEY:
    print("❌ Error: GEMINI_API_KEY not found in environment")
    sys.exit(1)

print("✅ API Keys loaded successfully")
print()

# Define tasks
TASKS = [
    {
        "name": "Endpoint Monitor",
        "module": "endpoint_monitor",
        "function": "create_endpoint_monitor",
        "ai_engine": "OpenAI GPT-4",
        "icon": "📡"
    },
    {
        "name": "Scrolling Optimizer",
        "module": "scrolling_optimizer",
        "function": "optimize_scrolling",
        "ai_engine": "Google Gemini",
        "icon": "📏"
    },
    {
        "name": "Dark Mode Fixer",
        "module": "darkmode_fixer",
        "function": "fix_darkmode",
        "ai_engine": "OpenAI GPT-4",
        "icon": "🌙"
    },
    {
        "name": "Reactive Drilldown",
        "module": "reactive_drilldown",
        "function": "implement_drilldown",
        "ai_engine": "Google Gemini",
        "icon": "🔗"
    },
    {
        "name": "Responsive Designer",
        "module": "responsive_designer",
        "function": "make_responsive",
        "ai_engine": "OpenAI GPT-4",
        "icon": "📱"
    }
]

def run_task(task):
    """Run a single AI agent task"""
    try:
        print(f"{task['icon']} Starting: {task['name']} ({task['ai_engine']})")

        # Import and run the task function
        module = __import__(task['module'])
        task_function = getattr(module, task['function'])

        # Execute task
        result = task_function()

        print(f"  ✅ {task['name']} completed successfully")
        return {
            "task": task['name'],
            "status": "success",
            "result": result
        }

    except Exception as e:
        print(f"  ❌ {task['name']} failed: {str(e)}")
        return {
            "task": task['name'],
            "status": "error",
            "error": str(e)
        }

def main():
    """Main orchestrator function"""

    print("📋 Task Queue:")
    for task in TASKS:
        print(f"  {task['icon']} {task['name']} → {task['ai_engine']}")
    print()

    print("🔄 Running tasks in parallel...")
    print()

    # Run tasks in parallel using ThreadPoolExecutor
    results = []
    start_time = datetime.now()

    with ThreadPoolExecutor(max_workers=5) as executor:
        # Submit all tasks
        future_to_task = {executor.submit(run_task, task): task for task in TASKS}

        # Collect results as they complete
        for future in as_completed(future_to_task):
            task = future_to_task[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"  ❌ Exception in {task['name']}: {str(e)}")
                results.append({
                    "task": task['name'],
                    "status": "exception",
                    "error": str(e)
                })

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    print()
    print("=" * 60)
    print("📊 Results Summary")
    print("=" * 60)

    successful = sum(1 for r in results if r['status'] == 'success')
    failed = len(results) - successful

    print(f"Total tasks: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Duration: {duration:.2f} seconds")
    print()

    # Detailed results
    for result in results:
        status_icon = "✅" if result['status'] == 'success' else "❌"
        print(f"{status_icon} {result['task']}: {result['status']}")
        if result['status'] != 'success':
            print(f"   Error: {result.get('error', 'Unknown error')}")

    # Save results
    results_file = Path(__file__).parent.parent / 'ui-refresh-results.json'
    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": duration,
            "successful": successful,
            "failed": failed,
            "results": results
        }, f, indent=2)

    print()
    print(f"📄 Full results saved to: {results_file}")
    print()

    if failed == 0:
        print("🎉 All tasks completed successfully!")
    else:
        print(f"⚠️  {failed} task(s) failed. Check logs above for details.")

    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
