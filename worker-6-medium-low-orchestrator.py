#!/usr/bin/env python3
"""
Honest Verification-First Orchestrator
Built on lessons learned from simulation failures

Core Principles:
1. Verify files exist BEFORE claiming work
2. Make REAL modifications with git evidence
3. Test builds AFTER changes
4. Report ACTUAL failures with specific errors
5. NO simulations, NO random validation scores
"""

import os
import subprocess
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

class HonestOrchestrator:
    def __init__(self, workspace: str = None):
        self.workspace = Path(workspace) if workspace else Path.cwd()
        self.log_file = self.workspace / "worker-6-medium-low-orchestration.log"
        self.results_file = self.workspace / "worker-6-medium-low-results.json"
        self.results = {
            "start_time": datetime.now().isoformat(),
            "tasks": [],
            "honest_metrics": {
                "files_verified": 0,
                "files_modified": 0,
                "builds_tested": 0,
                "actual_failures": 0,
                "git_commits": 0
            }
        }

    def log(self, message: str, level: str = "INFO"):
        """Honest logging with timestamps"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level}] {message}"
        print(log_entry)

        with open(self.log_file, "a") as f:
            f.write(log_entry + "\n")

    def verify_file_exists(self, file_path: str) -> bool:
        """
        VERIFY file exists before claiming work
        Returns True only if file actually exists
        """
        full_path = self.workspace / file_path
        exists = full_path.exists()

        if exists:
            self.log(f"✅ VERIFIED: {file_path} exists ({full_path.stat().st_size} bytes)")
            self.results["honest_metrics"]["files_verified"] += 1
        else:
            self.log(f"❌ VERIFICATION FAILED: {file_path} does NOT exist", "ERROR")

        return exists

    def get_file_hash(self, file_path: str) -> Optional[str]:
        """Get MD5 hash of file content for verification"""
        try:
            full_path = self.workspace / file_path
            with open(full_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            self.log(f"❌ Failed to hash {file_path}: {e}", "ERROR")
            return None

    def run_command(self, cmd: List[str], description: str) -> Tuple[bool, str, str]:
        """
        Run command and return ACTUAL results
        Returns: (success, stdout, stderr)
        """
        try:
            self.log(f"🔧 Running: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=300
            )

            success = result.returncode == 0

            if success:
                self.log(f"✅ {description} succeeded")
            else:
                self.log(f"❌ {description} FAILED with code {result.returncode}", "ERROR")
                self.log(f"   stderr: {result.stderr[:500]}", "ERROR")

            return success, result.stdout, result.stderr

        except subprocess.TimeoutExpired:
            self.log(f"❌ {description} TIMED OUT after 5 minutes", "ERROR")
            return False, "", "Timeout"
        except Exception as e:
            self.log(f"❌ {description} ERROR: {e}", "ERROR")
            return False, "", str(e)

    def modify_file(self, file_path: str, old_content: str, new_content: str) -> bool:
        """
        Make REAL file modification with verification
        Returns True only if file was actually modified
        """
        full_path = self.workspace / file_path

        try:
            # Get hash BEFORE
            hash_before = self.get_file_hash(file_path)

            # Read current content
            with open(full_path, 'r') as f:
                current = f.read()

            # Verify old content exists
            if old_content not in current:
                self.log(f"❌ OLD CONTENT NOT FOUND in {file_path}", "ERROR")
                return False

            # Make modification
            modified = current.replace(old_content, new_content)

            # Write new content
            with open(full_path, 'w') as f:
                f.write(modified)

            # Get hash AFTER
            hash_after = self.get_file_hash(file_path)

            # VERIFY actual change
            if hash_before == hash_after:
                self.log(f"❌ FILE NOT CHANGED: {file_path} (hash unchanged)", "ERROR")
                return False

            self.log(f"✅ MODIFIED: {file_path}")
            self.log(f"   Hash before: {hash_before}")
            self.log(f"   Hash after:  {hash_after}")
            self.results["honest_metrics"]["files_modified"] += 1

            return True

        except Exception as e:
            self.log(f"❌ MODIFICATION FAILED: {file_path} - {e}", "ERROR")
            return False

    def verify_git_changes(self) -> Tuple[bool, str]:
        """
        Verify ACTUAL git changes with diff
        Returns: (has_changes, diff_output)
        """
        success, stdout, stderr = self.run_command(
            ["git", "diff", "--stat"],
            "Git diff stat"
        )

        if not success:
            return False, stderr

        has_changes = len(stdout.strip()) > 0

        if has_changes:
            # Get detailed diff
            success2, diff, _ = self.run_command(
                ["git", "diff", "--unified=0"],
                "Git detailed diff"
            )

            self.log(f"✅ GIT CHANGES VERIFIED:")
            self.log(f"   Stats: {stdout[:200]}")
            return True, diff
        else:
            self.log(f"❌ NO GIT CHANGES DETECTED", "WARNING")
            return False, ""

    def test_build(self) -> bool:
        """
        Run ACTUAL build test
        Returns True only if build succeeds
        """
        self.log("🔨 Testing build...")

        success, stdout, stderr = self.run_command(
            ["npm", "run", "build"],
            "NPM Build"
        )

        if success:
            self.log(f"✅ BUILD SUCCEEDED")
            self.results["honest_metrics"]["builds_tested"] += 1
            return True
        else:
            self.log(f"❌ BUILD FAILED", "ERROR")
            self.results["honest_metrics"]["actual_failures"] += 1
            return False

    def git_commit(self, message: str) -> Optional[str]:
        """
        Create REAL git commit and return SHA
        Returns: commit SHA or None
        """
        # Stage changes
        success1, _, _ = self.run_command(["git", "add", "."], "Git add")
        if not success1:
            return None

        # Commit
        success2, stdout, _ = self.run_command(
            ["git", "commit", "-m", message],
            "Git commit"
        )

        if not success2:
            return None

        # Get commit SHA
        success3, sha, _ = self.run_command(
            ["git", "rev-parse", "HEAD"],
            "Get commit SHA"
        )

        if success3:
            sha = sha.strip()
            self.log(f"✅ COMMITTED: {sha}")
            self.results["honest_metrics"]["git_commits"] += 1
            return sha

        return None

    def execute_task(self, task: Dict) -> Dict:
        """
        Execute ONE task with full honesty
        Returns detailed results with evidence
        """
        task_result = {
            "task_id": task["id"],
            "name": task["name"],
            "start_time": datetime.now().isoformat(),
            "verification": {},
            "modifications": [],
            "build_test": None,
            "git_evidence": None,
            "status": "NOT_STARTED"
        }

        self.log(f"\n{'='*80}")
        self.log(f"TASK: {task['id']} - {task['name']}")
        self.log(f"{'='*80}")

        # STEP 1: Verify target files exist
        self.log("📋 STEP 1: File Verification")
        for file_path in task.get("target_files", []):
            exists = self.verify_file_exists(file_path)
            task_result["verification"][file_path] = exists

            if not exists:
                task_result["status"] = "FAILED_VERIFICATION"
                task_result["failure_reason"] = f"File not found: {file_path}"
                self.results["honest_metrics"]["actual_failures"] += 1
                return task_result

        # STEP 2: Make modifications
        self.log("📝 STEP 2: File Modifications")
        for mod in task.get("modifications", []):
            success = self.modify_file(
                mod["file"],
                mod["old"],
                mod["new"]
            )

            task_result["modifications"].append({
                "file": mod["file"],
                "success": success
            })

            if not success:
                task_result["status"] = "FAILED_MODIFICATION"
                task_result["failure_reason"] = f"Failed to modify {mod['file']}"
                self.results["honest_metrics"]["actual_failures"] += 1
                return task_result

        # STEP 3: Verify git changes
        self.log("🔍 STEP 3: Git Change Verification")
        has_changes, diff = self.verify_git_changes()

        if not has_changes:
            task_result["status"] = "FAILED_NO_CHANGES"
            task_result["failure_reason"] = "No git changes detected"
            self.results["honest_metrics"]["actual_failures"] += 1
            return task_result

        task_result["git_evidence"] = {
            "has_changes": True,
            "diff_preview": diff[:500]
        }

        # STEP 4: Test build (if required)
        if task.get("test_build", False):
            self.log("🔨 STEP 4: Build Test")
            build_success = self.test_build()
            task_result["build_test"] = {
                "success": build_success,
                "tested": True
            }

            if not build_success:
                task_result["status"] = "FAILED_BUILD"
                task_result["failure_reason"] = "Build failed after modifications"
                self.results["honest_metrics"]["actual_failures"] += 1

                # Rollback on build failure
                self.log("⏮️  Rolling back changes...")
                self.run_command(["git", "reset", "--hard", "HEAD"], "Git reset")
                return task_result

        # STEP 5: Commit changes
        self.log("💾 STEP 5: Git Commit")
        commit_sha = self.git_commit(task.get("commit_message", f"Task: {task['name']}"))

        if commit_sha:
            task_result["git_evidence"]["commit_sha"] = commit_sha
            task_result["status"] = "SUCCESS"
            self.log(f"✅ TASK COMPLETED SUCCESSFULLY")
        else:
            task_result["status"] = "FAILED_COMMIT"
            task_result["failure_reason"] = "Git commit failed"
            self.results["honest_metrics"]["actual_failures"] += 1

        task_result["end_time"] = datetime.now().isoformat()
        return task_result

    def run(self, tasks: List[Dict]):
        """
        Execute all tasks with honest reporting
        """
        self.log("="*80)
        self.log("HONEST VERIFICATION-FIRST ORCHESTRATOR")
        self.log("="*80)
        self.log(f"Workspace: {self.workspace}")
        self.log(f"Total Tasks: {len(tasks)}")
        self.log("="*80)

        for task in tasks:
            result = self.execute_task(task)
            self.results["tasks"].append(result)

        # Final summary
        self.results["end_time"] = datetime.now().isoformat()

        successful = sum(1 for t in self.results["tasks"] if t["status"] == "SUCCESS")
        failed = len(self.results["tasks"]) - successful

        self.log("\n" + "="*80)
        self.log("FINAL HONEST RESULTS")
        self.log("="*80)
        self.log(f"Total Tasks: {len(tasks)}")
        self.log(f"✅ Successful: {successful}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"📁 Files Verified: {self.results['honest_metrics']['files_verified']}")
        self.log(f"✏️  Files Modified: {self.results['honest_metrics']['files_modified']}")
        self.log(f"🔨 Builds Tested: {self.results['honest_metrics']['builds_tested']}")
        self.log(f"📝 Git Commits: {self.results['honest_metrics']['git_commits']}")
        self.log("="*80)

        # Save detailed results
        with open(self.results_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        self.log(f"\n📊 Detailed results saved to: {self.results_file}")

        return self.results


if __name__ == "__main__":
    # Example task demonstrating the honest approach
    example_tasks = [
        {
            "id": "DEMO-001",
            "name": "Fix Sentry v10 Comment Documentation",
            "target_files": ["src/lib/sentry.ts"],
            "modifications": [
                {
                    "file": "src/lib/sentry.ts",
                    "old": "// React Router v6 instrumentation",
                    "new": "// React Router v6 instrumentation (v10 API compatibility pending)"
                }
            ],
            "test_build": True,
            "commit_message": "docs: Add v10 API compatibility note to Sentry config"
        }
    ]

    orchestrator = HonestOrchestrator()
    results = orchestrator.run(example_tasks)

    print("\n✅ Honest orchestration complete!")
    print(f"📊 Results: {orchestrator.results_file}")
