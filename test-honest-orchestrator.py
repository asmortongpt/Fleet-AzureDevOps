#!/usr/bin/env python3
"""
Test script for honest orchestrator - proves it works with real verification
"""

import sys
from pathlib import Path
from datetime import datetime

# Import the honest orchestrator
sys.path.insert(0, str(Path.cwd()))
exec(open("honest-orchestrator.py").read())

# Create a simple test task
timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

test_tasks = [{
    "id": "VERIFY-001",
    "name": "Test Honest Orchestrator - Add Verification Timestamp",
    "target_files": ["ORCHESTRATOR_HONESTY_REPORT.md"],
    "modifications": [{
        "file": "ORCHESTRATOR_HONESTY_REPORT.md",
        "old": "# VM Orchestrator Honesty Report",
        "new": f"# VM Orchestrator Honesty Report\n**Verification Test Run:** {timestamp}"
    }],
    "test_build": False,
    "commit_message": "test: Verify honest orchestrator performs real file modifications"
}]

# Run with workspace set to current directory
print("\n🚀 RUNNING HONEST ORCHESTRATOR VERIFICATION TEST")
print("="*80)

orch = HonestOrchestrator(workspace=str(Path.cwd()))
results = orch.run(test_tasks)

# Print summary
print("\n" + "="*80)
print("VERIFICATION TEST SUMMARY")
print("="*80)
print(f"Task Status: {results['tasks'][0]['status']}")
print(f"Files Verified: {results['honest_metrics']['files_verified']}")
print(f"Files Modified: {results['honest_metrics']['files_modified']}")
print(f"Git Commits: {results['honest_metrics']['git_commits']}")

if results['tasks'][0].get('git_evidence', {}).get('commit_sha'):
    print(f"Commit SHA: {results['tasks'][0]['git_evidence']['commit_sha']}")

print("="*80)

# Show if task succeeded
if results['tasks'][0]['status'] == 'SUCCESS':
    print("\n✅ HONEST ORCHESTRATOR VERIFICATION: PASSED")
    print("   - File existence verified before modification")
    print("   - Real file modification with hash validation")
    print("   - Git diff evidence captured")
    print("   - Commit created with SHA")
else:
    print(f"\n❌ TASK FAILED: {results['tasks'][0].get('failure_reason', 'Unknown')}")
