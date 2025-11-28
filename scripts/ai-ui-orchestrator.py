#!/usr/bin/env python3
"""
Fleet Management UI Refresh Orchestrator
Uses OpenAI GPT-4 and Google Gemini via Azure VM agents
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import openai
import google.generativeai as genai

# Configure API keys from environment
openai.api_key = os.getenv("OPENAI_API_KEY")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Project paths
PROJECT_ROOT = Path("/Users/andrewmorton/Documents/GitHub/Fleet")
SRC_DIR = PROJECT_ROOT / "src"
COMPONENTS_DIR = SRC_DIR / "components"

class UIRefreshTask:
    """Represents a UI refresh task"""
    def __init__(self, name: str, agent: str, files: List[Path], prompt: str):
        self.name = name
        self.agent = agent
        self.files = files
        self.prompt = prompt
        self.result = None
        self.error = None
        self.start_time = None
        self.end_time = None

class AIOrchestrator:
    """Orchestrates UI refresh using multiple AI agents"""

    def __init__(self):
        self.tasks: List[UIRefreshTask] = []
        self.results: Dict[str, Any] = {}

    async def add_task(self, task: UIRefreshTask):
        """Add a task to the queue"""
        self.tasks.append(task)

    async def run_openai_task(self, task: UIRefreshTask) -> Dict[str, Any]:
        """Execute task using OpenAI GPT-4"""
        try:
            task.start_time = datetime.now()

            # Read relevant files
            file_contents = []
            for file_path in task.files:
                if file_path.exists():
                    with open(file_path, 'r') as f:
                        file_contents.append({
                            'path': str(file_path.relative_to(PROJECT_ROOT)),
                            'content': f.read()
                        })

            # Build context
            context = f"""
You are an expert React/TypeScript developer working on a Fleet Management system.

Task: {task.name}

Files to analyze and modify:
"""
            for fc in file_contents:
                context += f"\n\n=== {fc['path']} ===\n{fc['content']}"

            context += f"\n\n{task.prompt}"

            # Call OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert React/TypeScript developer specializing in UI/UX optimization."},
                    {"role": "user", "content": context}
                ],
                temperature=0.7,
                max_tokens=4000
            )

            task.end_time = datetime.now()
            task.result = response.choices[0].message.content

            return {
                'status': 'success',
                'task': task.name,
                'agent': 'OpenAI GPT-4',
                'result': task.result,
                'duration': (task.end_time - task.start_time).total_seconds()
            }

        except Exception as e:
            task.end_time = datetime.now()
            task.error = str(e)
            return {
                'status': 'error',
                'task': task.name,
                'agent': 'OpenAI GPT-4',
                'error': str(e),
                'duration': (task.end_time - task.start_time).total_seconds() if task.end_time else 0
            }

    async def run_gemini_task(self, task: UIRefreshTask) -> Dict[str, Any]:
        """Execute task using Google Gemini"""
        try:
            task.start_time = datetime.now()

            # Read relevant files
            file_contents = []
            for file_path in task.files:
                if file_path.exists():
                    with open(file_path, 'r') as f:
                        file_contents.append({
                            'path': str(file_path.relative_to(PROJECT_ROOT)),
                            'content': f.read()
                        })

            # Build context
            context = f"""
You are an expert React/TypeScript developer working on a Fleet Management system.

Task: {task.name}

Files to analyze and modify:
"""
            for fc in file_contents:
                context += f"\n\n=== {fc['path']} ===\n{fc['content']}"

            context += f"\n\n{task.prompt}"

            # Call Gemini
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(context)

            task.end_time = datetime.now()
            task.result = response.text

            return {
                'status': 'success',
                'task': task.name,
                'agent': 'Google Gemini',
                'result': task.result,
                'duration': (task.end_time - task.start_time).total_seconds()
            }

        except Exception as e:
            task.end_time = datetime.now()
            task.error = str(e)
            return {
                'status': 'error',
                'task': task.name,
                'agent': 'Google Gemini',
                'error': str(e),
                'duration': (task.end_time - task.start_time).total_seconds() if task.end_time else 0
            }

    async def execute_tasks(self):
        """Execute all tasks in parallel"""
        print("🚀 Fleet Management UI Refresh - AI Orchestrator")
        print("=" * 60)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        # Create task coroutines
        coroutines = []
        for task in self.tasks:
            if task.agent == "openai":
                coroutines.append(self.run_openai_task(task))
            elif task.agent == "gemini":
                coroutines.append(self.run_gemini_task(task))

        # Run all tasks in parallel
        results = await asyncio.gather(*coroutines, return_exceptions=True)

        # Process results
        successful = 0
        failed = 0

        for result in results:
            if isinstance(result, dict):
                if result['status'] == 'success':
                    print(f"✅ {result['task']}: {result['duration']:.2f}s")
                    successful += 1
                else:
                    print(f"❌ {result['task']}: {result['error']}")
                    failed += 1
                self.results[result['task']] = result

        # Summary
        print("\n" + "=" * 60)
        print("📊 Results Summary")
        print("=" * 60)
        print(f"Total tasks: {len(self.tasks)}")
        print(f"Successful: {successful}")
        print(f"Failed: {failed}")

        # Save results
        results_file = PROJECT_ROOT / "ai-orchestrator-results.json"
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"\n📄 Full results saved to: {results_file}")

        return self.results

async def main():
    """Main orchestrator entry point"""

    orchestrator = AIOrchestrator()

    # Task 1: Endpoint Monitoring Dashboard (OpenAI)
    await orchestrator.add_task(UIRefreshTask(
        name="Endpoint Monitor Dashboard",
        agent="openai",
        files=[
            COMPONENTS_DIR / "modules" / "FleetDashboard.tsx",
            SRC_DIR / "lib" / "api-client.ts",
            SRC_DIR / "hooks" / "useOBD2Emulator.ts",
            SRC_DIR / "hooks" / "useRadioSocket.ts",
            SRC_DIR / "hooks" / "useDispatchSocket.ts"
        ],
        prompt="""
Create a comprehensive endpoint monitoring dashboard component that:
1. Tracks all REST API endpoints health
2. Monitors WebSocket connections (OBD2:8081, Radio:8082, Dispatch:8083)
3. Shows real-time status indicators with color coding
4. Displays connection latency and uptime
5. Provides reconnection controls
6. Uses minimal scrolling with collapsible sections
7. Works perfectly in dark mode

Return the complete TypeScript React component code.
"""
    ))

    # Task 2: Scrolling Optimization (Gemini)
    await orchestrator.add_task(UIRefreshTask(
        name="Scrolling Minimization",
        agent="gemini",
        files=[
            COMPONENTS_DIR / "modules" / "FleetDashboard.tsx",
            COMPONENTS_DIR / "modules" / "FleetAnalytics.tsx",
            COMPONENTS_DIR / "modules" / "FleetOptimizer.tsx"
        ],
        prompt="""
Optimize these components to minimize scrolling by:
1. Using collapsible/accordion sections for large data sets
2. Implementing tabs for different views
3. Creating compact card layouts with better space utilization
4. Using virtual scrolling for long lists
5. Implementing smart pagination
6. Adding sticky headers where appropriate

Return specific code changes for each component.
"""
    ))

    # Task 3: Dark Mode Enhancement (OpenAI)
    await orchestrator.add_task(UIRefreshTask(
        name="Dark Mode Visibility Fix",
        agent="openai",
        files=[
            COMPONENTS_DIR / "modules" / "FleetDashboard.tsx",
            SRC_DIR / "App.tsx"
        ],
        prompt="""
Fix dark mode visibility issues across all UI elements:
1. Ensure proper contrast ratios (WCAG AAA compliance)
2. Fix text colors for readability
3. Adjust border and shadow colors
4. Update chart/graph colors for dark backgrounds
5. Fix button and input styling
6. Ensure icons are visible
7. Add smooth transitions between light/dark modes

Return the complete CSS/Tailwind class updates needed.
"""
    ))

    # Task 4: Interactive Drilldown (Gemini)
    await orchestrator.add_task(UIRefreshTask(
        name="Reactive Data Drilldown",
        agent="gemini",
        files=[
            COMPONENTS_DIR / "modules" / "FleetDashboard.tsx",
            COMPONENTS_DIR / "FleetMap.tsx" if (COMPONENTS_DIR / "FleetMap.tsx").exists() else COMPONENTS_DIR / "modules" / "FleetDashboard.tsx"
        ],
        prompt="""
Make all data visualizations interactive with drilldown capabilities:
1. Map markers clickable → show vehicle details modal
2. Dashboard metrics clickable → show detailed breakdown
3. Chart elements clickable → drill into specific data
4. List items clickable → show full record details
5. Implement breadcrumb navigation for drill-down paths
6. Add "back" functionality to return to previous views
7. Maintain state during navigation

Return code for interactive handlers and modal components.
"""
    ))

    # Task 5: Responsive Design (OpenAI)
    await orchestrator.add_task(UIRefreshTask(
        name="Responsive Layout Optimization",
        agent="openai",
        files=[
            COMPONENTS_DIR / "modules" / "FleetDashboard.tsx",
            COMPONENTS_DIR / "modules" / "FleetAnalytics.tsx"
        ],
        prompt="""
Optimize components for all screen sizes:
1. Mobile (320px-767px): Single column, stacked cards
2. Tablet (768px-1023px): Two column grid
3. Desktop (1024px+): Multi-column dashboard
4. Use Tailwind responsive classes (sm:, md:, lg:, xl:, 2xl:)
5. Ensure touch-friendly targets on mobile (min 44x44px)
6. Implement responsive typography
7. Optimize map sizing for different screens

Return responsive Tailwind class implementations.
"""
    ))

    # Execute all tasks
    results = await orchestrator.execute_tasks()

    # Generate implementation files
    print("\n📝 Generating implementation guides...")

    for task_name, result in results.items():
        if result['status'] == 'success':
            output_file = PROJECT_ROOT / f"AI_IMPLEMENTATION_{task_name.replace(' ', '_').upper()}.md"
            with open(output_file, 'w') as f:
                f.write(f"# {task_name}\n\n")
                f.write(f"**Agent**: {result['agent']}\n")
                f.write(f"**Duration**: {result['duration']:.2f}s\n\n")
                f.write("## Implementation\n\n")
                f.write(result['result'])
            print(f"  ✅ {output_file.name}")

    print("\n🎉 AI Orchestration Complete!")

if __name__ == "__main__":
    asyncio.run(main())
