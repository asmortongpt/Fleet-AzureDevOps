#!/usr/bin/env python3
"""
Production Remediation Runner
Executes production tasks using the honest orchestrator with verification

This script:
1. Imports tasks from production-tasks.py
2. Runs them through the honest orchestrator
3. Provides progress updates and checkpoints
4. Generates detailed execution report
"""

import sys
from pathlib import Path

# Import the honest orchestrator
sys.path.insert(0, str(Path.cwd()))
exec(open("honest-orchestrator.py").read())

# Import production tasks
exec(open("production-tasks.py").read())

def main():
    print("="*80)
    print("PRODUCTION REMEDIATION - HONEST EXECUTION")
    print("="*80)
    print()

    # Select which phase to run
    print("Available Phases:")
    print("1. Phase 1: Documentation Tasks (5 tasks, low risk)")
    print("2. Phase 2: Test Infrastructure (3 tasks, moderate risk)")
    print("3. All Tasks (8 tasks total)")
    print()

    # For autonomous execution, default to Phase 1 (safest)
    print("🤖 Autonomous Mode: Starting with Phase 1 (Documentation)")
    print("   Rationale: Low risk, high value, no code logic changes")
    print()

    tasks = PHASE_1_DOCUMENTATION_TASKS

    # Initialize orchestrator
    workspace = EXECUTION_CONFIG["workspace"]
    orch = HonestOrchestrator(workspace=workspace)

    print(f"📁 Workspace: {workspace}")
    print(f"📋 Tasks to execute: {len(tasks)}")
    print(f"✅ Verification enabled: {EXECUTION_CONFIG['verify_after_each']}")
    print(f"⏮️  Rollback on failure: {EXECUTION_CONFIG['rollback_on_failure']}")
    print()

    # Confirm before starting
    print("🚀 Starting execution in 3 seconds...")
    print("   (CTRL+C to cancel)")
    import time
    try:
        time.sleep(3)
    except KeyboardInterrupt:
        print("\n❌ Cancelled by user")
        return

    print()

    # Execute tasks
    results = orch.run(tasks)

    # Generate summary
    print("\n" + "="*80)
    print("PRODUCTION REMEDIATION COMPLETE")
    print("="*80)

    successful = sum(1 for t in results["tasks"] if t["status"] == "SUCCESS")
    failed = len(tasks) - successful

    print(f"✅ Successful: {successful}/{len(tasks)}")
    print(f"❌ Failed: {failed}/{len(tasks)}")
    print()

    print("Honest Metrics:")
    print(f"  📁 Files Verified: {results['honest_metrics']['files_verified']}")
    print(f"  ✏️  Files Modified: {results['honest_metrics']['files_modified']}")
    print(f"  🔨 Builds Tested: {results['honest_metrics']['builds_tested']}")
    print(f"  📝 Git Commits: {results['honest_metrics']['git_commits']}")
    print(f"  ❌ Actual Failures: {results['honest_metrics']['actual_failures']}")
    print()

    # Show commit SHAs for verification
    if results['honest_metrics']['git_commits'] > 0:
        print("Git Commits Created (for independent verification):")
        for task in results["tasks"]:
            if task.get("git_evidence", {}).get("commit_sha"):
                print(f"  • {task['task_id']}: {task['git_evidence']['commit_sha']}")

    print()
    print(f"📊 Detailed results: {orch.results_file}")
    print("="*80)

    # Report status code
    if failed > 0:
        print(f"\n⚠️  {failed} task(s) failed. See logs for details.")
        sys.exit(1)
    else:
        print("\n✅ All tasks completed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
