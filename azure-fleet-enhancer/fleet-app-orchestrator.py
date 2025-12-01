#!/usr/bin/env python3
"""
Fleet Application Enhancement Orchestrator
Works directly with the existing Fleet codebase to make improvements
"""

import asyncio
import os
import subprocess
from typing import List, Dict
from dataclasses import dataclass
import openai
from anthropic import Anthropic
import google.generativeai as genai

@dataclass
class Enhancement:
    id: str
    category: str
    description: str
    priority: str
    files_to_modify: List[str]
    status: str = "pending"

class FleetEnhancer:
    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        # Define enhancements from previous findings
        self.enhancements = [
            Enhancement(
                id="ui-001",
                category="UI/UX",
                description="Implement Bloomberg Terminal-style data grid for FleetDashboard",
                priority="high",
                files_to_modify=["src/components/modules/FleetDashboard.tsx", "src/index.css"]
            ),
            Enhancement(
                id="ui-002",
                category="UI/UX",
                description="Remove all hardcoded demo data from use-fleet-data.ts hook",
                priority="critical",
                files_to_modify=["src/hooks/use-fleet-data.ts"]
            ),
            Enhancement(
                id="ui-003",
                category="UI/UX",
                description="Add 100vh x 100vw no-scroll layout to all dashboard modules",
                priority="high",
                files_to_modify=["src/components/modules/*.tsx"]
            ),
            Enhancement(
                id="backend-001",
                category="Backend",
                description="Add comprehensive input validation middleware",
                priority="critical",
                files_to_modify=["server/middleware/*.ts"]
            ),
            Enhancement(
                id="backend-002",
                category="Backend",
                description="Implement parameterized SQL queries (no string concatenation)",
                priority="critical",
                files_to_modify=["server/routes/*.ts", "server/db.ts"]
            ),
        ]

    async def read_file_content(self, file_path: str) -> str:
        """Read file content from repository"""
        full_path = os.path.join(self.repo_path, file_path)
        if os.path.exists(full_path):
            with open(full_path, 'r') as f:
                return f.read()
        return ""

    async def write_file_content(self, file_path: str, content: str):
        """Write file content to repository"""
        full_path = os.path.join(self.repo_path, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)

    async def generate_improvement(self, enhancement: Enhancement) -> Dict:
        """Use best LLM to generate improvement for a file"""
        print(f"🤖 Generating improvement for {enhancement.id}: {enhancement.description}")

        file_path = enhancement.files_to_modify[0]
        current_content = await self.read_file_content(file_path)

        # Use Claude Sonnet 4 for code generation
        prompt = f"""
You are enhancing a production Fleet Management application.

Enhancement Task: {enhancement.description}
Category: {enhancement.category}
Priority: {enhancement.priority}

Current file content ({file_path}):
```
{current_content}
```

Requirements:
1. Apply the enhancement while maintaining existing functionality
2. Follow TypeScript strict mode best practices
3. Use parameterized queries for any SQL (never string concatenation)
4. Ensure security: validate inputs, escape outputs
5. Bloomberg Terminal design system: dark theme, data density, no scrolling
6. Return ONLY the improved file content, no explanations

Provide the complete improved file content:
"""

        response = self.anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )

        improved_content = response.content[0].text

        return {
            "enhancement_id": enhancement.id,
            "file_path": file_path,
            "improved_content": improved_content
        }

    async def apply_improvement(self, improvement: Dict):
        """Apply improvement to file"""
        file_path = improvement["file_path"]
        content = improvement["improved_content"]

        print(f"✍️  Applying improvement to {file_path}")
        await self.write_file_content(file_path, content)

    async def commit_and_push(self, enhancement: Enhancement):
        """Commit changes and push to both GitHub and Azure DevOps"""
        print(f"📝 Committing {enhancement.id}...")

        os.chdir(self.repo_path)

        # Stage changes
        subprocess.run(["git", "add", "-A"], check=True)

        # Commit
        commit_message = f"""feat: {enhancement.description}

Category: {enhancement.category}
Priority: {enhancement.priority}
Enhancement ID: {enhancement.id}

🤖 Generated with AI Fleet Enhancer
Co-Authored-By: Claude <noreply@anthropic.com>
"""
        subprocess.run(["git", "commit", "-m", commit_message], check=True)

        # Push to both remotes
        print("🚀 Pushing to GitHub...")
        subprocess.run(["git", "push", "github", "main"], check=True)

        print("🚀 Pushing to Azure DevOps...")
        subprocess.run(["git", "push", "origin", "main"], check=True)

        print(f"✅ {enhancement.id} committed and pushed to both remotes")

    async def enhance_fleet_app(self):
        """Main orchestration loop"""
        print("╔═══════════════════════════════════════════════════════════════════╗")
        print("║     Fleet Application Enhancement Orchestrator                    ║")
        print("║     Working with EXISTING Fleet codebase                          ║")
        print("╚═══════════════════════════════════════════════════════════════════╝")
        print()

        for enhancement in self.enhancements:
            try:
                print(f"\n━━━━ Processing {enhancement.id} ━━━━")

                # Generate improvement
                improvement = await self.generate_improvement(enhancement)

                # Apply to codebase
                await self.apply_improvement(improvement)

                # Commit and push
                await self.commit_and_push(enhancement)

                enhancement.status = "completed"
                print(f"✅ {enhancement.id} COMPLETED\n")

            except Exception as e:
                print(f"❌ Error processing {enhancement.id}: {e}")
                enhancement.status = "failed"
                continue

        print("\n╔═══════════════════════════════════════════════════════════════════╗")
        print("║     Enhancement Summary                                            ║")
        print("╚═══════════════════════════════════════════════════════════════════╝")

        completed = [e for e in self.enhancements if e.status == "completed"]
        failed = [e for e in self.enhancements if e.status == "failed"]

        print(f"✅ Completed: {len(completed)}")
        print(f"❌ Failed: {len(failed)}")
        print(f"📊 Success Rate: {len(completed)/len(self.enhancements)*100:.1f}%")

if __name__ == "__main__":
    # Path to Fleet repository on VM
    REPO_PATH = "/home/azureuser/Fleet"

    enhancer = FleetEnhancer(REPO_PATH)
    asyncio.run(enhancer.enhance_fleet_app())
