#!/usr/bin/env python3
"""
Fleet Repository Synchronization & Efficiency Testing Script

This script tests and validates the synchronization between Fleet and FleetOps repositories,
analyzes Antigravity-generated content, and provides efficiency metrics for the consolidation process.

Usage:
    python scripts/test_repository_sync.py [--mode all|sync|analyze|compare]

Modes:
    - all: Run all tests (default)
    - sync: Test repository synchronization
    - analyze: Analyze Antigravity content
    - compare: Compare Fleet vs FleetOps repositories
"""

import os
import sys
import json
import subprocess
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import hashlib

# Repository paths
FLEET_REPO = Path("/Users/andrewmorton/Documents/GitHub/Fleet")
FLEETOPS_REPO = Path("/Users/andrewmorton/Documents/GitHub/FleetOps")

class RepositorySyncTester:
    """Tests repository synchronization and provides efficiency metrics."""

    def __init__(self, fleet_path: Path, fleetops_path: Path):
        self.fleet_path = fleet_path
        self.fleetops_path = fleetops_path
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": {},
            "metrics": {},
            "recommendations": []
        }

    def run_git_command(self, repo_path: Path, command: List[str]) -> Tuple[str, str, int]:
        """Execute git command in specified repository."""
        try:
            result = subprocess.run(
                ["git"] + command,
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.stdout.strip(), result.stderr.strip(), result.returncode
        except subprocess.TimeoutExpired:
            return "", "Command timed out", 1
        except Exception as e:
            return "", str(e), 1

    def test_repository_existence(self) -> Dict:
        """Test if both repositories exist and are git repositories."""
        results = {
            "fleet_exists": self.fleet_path.exists(),
            "fleet_is_git": (self.fleet_path / ".git").exists(),
            "fleetops_exists": self.fleetops_path.exists(),
            "fleetops_is_git": (self.fleetops_path / ".git").exists()
        }

        results["passed"] = all(results.values())
        return results

    def test_remote_configuration(self) -> Dict:
        """Test remote configuration for both repositories."""
        fleet_remotes, _, _ = self.run_git_command(self.fleet_path, ["remote", "-v"])
        fleetops_remotes, _, _ = self.run_git_command(self.fleetops_path, ["remote", "-v"])

        results = {
            "fleet_has_github": "github.com" in fleet_remotes,
            "fleet_has_azure": "dev.azure.com" in fleet_remotes,
            "fleetops_has_github": "github.com" in fleetops_remotes,
            "fleetops_has_azure": "dev.azure.com" in fleetops_remotes,
            "fleet_remotes": fleet_remotes.split("\n"),
            "fleetops_remotes": fleetops_remotes.split("\n")
        }

        results["passed"] = results["fleet_has_github"] and results["fleet_has_azure"]
        return results

    def test_antigravity_content(self) -> Dict:
        """Analyze Antigravity-generated content in both repositories."""
        # Search for Antigravity references
        fleet_antigravity_files = []
        fleetops_antigravity_files = []

        for repo_path, file_list in [(self.fleet_path, fleet_antigravity_files),
                                      (self.fleetops_path, fleetops_antigravity_files)]:
            stdout, _, _ = self.run_git_command(repo_path, ["grep", "-l", "-i", "antigravity"])
            if stdout:
                file_list.extend(stdout.split("\n"))

        # Check for Phase 7 Security Audit
        phase7_in_fleet = (self.fleet_path / "Phase 7 Security Audit.md").exists()
        phase7_in_fleetops = (self.fleetops_path / "Phase 7 Security Audit.md").exists()

        results = {
            "fleet_antigravity_files": len(fleet_antigravity_files),
            "fleetops_antigravity_files": len(fleetops_antigravity_files),
            "phase7_in_fleet": phase7_in_fleet,
            "phase7_in_fleetops": phase7_in_fleetops,
            "fleet_files": fleet_antigravity_files[:10],  # First 10 files
            "fleetops_files": fleetops_antigravity_files[:10]
        }

        results["passed"] = phase7_in_fleet
        return results

    def test_commit_history_sync(self) -> Dict:
        """Compare commit histories to detect synchronization status."""
        # Get latest commits from both repos
        fleet_commits, _, _ = self.run_git_command(self.fleet_path, ["log", "--oneline", "-20"])
        fleetops_commits, _, _ = self.run_git_command(self.fleetops_path, ["log", "--oneline", "-20"])

        fleet_commit_list = fleet_commits.split("\n") if fleet_commits else []
        fleetops_commit_list = fleetops_commits.split("\n") if fleetops_commits else []

        # Extract commit hashes
        fleet_hashes = {line.split()[0] for line in fleet_commit_list if line}
        fleetops_hashes = {line.split()[0] for line in fleetops_commit_list if line}

        common_commits = fleet_hashes & fleetops_hashes

        results = {
            "fleet_commit_count": len(fleet_commit_list),
            "fleetops_commit_count": len(fleetops_commit_list),
            "common_commits": len(common_commits),
            "fleet_unique_commits": len(fleet_hashes - fleetops_hashes),
            "fleetops_unique_commits": len(fleetops_hashes - fleet_hashes),
            "sync_percentage": (len(common_commits) / max(len(fleet_hashes), 1)) * 100
        }

        results["passed"] = results["sync_percentage"] > 0
        return results

    def analyze_file_differences(self) -> Dict:
        """Analyze file-level differences between repositories."""
        # Get file counts
        fleet_files = list(self.fleet_path.rglob("*"))
        fleetops_files = list(self.fleetops_path.rglob("*"))

        # Filter out .git directories and get only files
        fleet_files = [f for f in fleet_files if ".git" not in str(f) and f.is_file()]
        fleetops_files = [f for f in fleetops_files if ".git" not in str(f) and f.is_file()]

        # Get relative paths
        fleet_rel_paths = {str(f.relative_to(self.fleet_path)) for f in fleet_files}
        fleetops_rel_paths = {str(f.relative_to(self.fleetops_path)) for f in fleetops_files}

        common_files = fleet_rel_paths & fleetops_rel_paths

        results = {
            "fleet_file_count": len(fleet_files),
            "fleetops_file_count": len(fleetops_files),
            "common_files": len(common_files),
            "fleet_unique_files": len(fleet_rel_paths - fleetops_rel_paths),
            "fleetops_unique_files": len(fleetops_rel_paths - fleet_rel_paths),
            "file_overlap_percentage": (len(common_files) / max(len(fleet_rel_paths), 1)) * 100
        }

        results["passed"] = True
        return results

    def measure_efficiency_metrics(self) -> Dict:
        """Measure efficiency metrics for the consolidation process."""
        # Get repository sizes
        fleet_size = sum(f.stat().st_size for f in self.fleet_path.rglob("*") if f.is_file() and ".git" not in str(f))
        fleetops_size = sum(f.stat().st_size for f in self.fleetops_path.rglob("*") if f.is_file() and ".git" not in str(f))

        # Get commit counts
        fleet_total_commits, _, _ = self.run_git_command(self.fleet_path, ["rev-list", "--all", "--count"])
        fleetops_total_commits, _, _ = self.run_git_command(self.fleetops_path, ["rev-list", "--all", "--count"])

        # Get branch counts
        fleet_branches, _, _ = self.run_git_command(self.fleet_path, ["branch", "-a"])
        fleetops_branches, _, _ = self.run_git_command(self.fleetops_path, ["branch", "-a"])

        fleet_branch_count = len([b for b in fleet_branches.split("\n") if b.strip()])
        fleetops_branch_count = len([b for b in fleetops_branches.split("\n") if b.strip()])

        results = {
            "fleet_size_mb": round(fleet_size / (1024 * 1024), 2),
            "fleetops_size_mb": round(fleetops_size / (1024 * 1024), 2),
            "fleet_total_commits": int(fleet_total_commits) if fleet_total_commits else 0,
            "fleetops_total_commits": int(fleetops_total_commits) if fleetops_total_commits else 0,
            "fleet_branches": fleet_branch_count,
            "fleetops_branches": fleetops_branch_count,
            "size_difference_mb": round(abs(fleet_size - fleetops_size) / (1024 * 1024), 2)
        }

        results["passed"] = True
        return results

    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []

        # Check if Phase 7 is in FleetOps
        if not self.results["tests"].get("antigravity_content", {}).get("phase7_in_fleetops"):
            recommendations.append(
                "📋 Phase 7 Security Audit is in Fleet but not in FleetOps. "
                "Consider syncing this critical security document."
            )

        # Check commit sync
        commit_sync = self.results["tests"].get("commit_history", {})
        if commit_sync and commit_sync.get("sync_percentage", 0) < 50:
            recommendations.append(
                f"⚠️ Commit synchronization is only {commit_sync.get('sync_percentage', 0):.1f}%. "
                "Consider pulling changes from FleetOps into Fleet or vice versa."
            )

        # Check file overlap
        file_analysis = self.results["tests"].get("file_differences", {})
        if file_analysis and file_analysis.get("file_overlap_percentage", 0) < 70:
            recommendations.append(
                f"📁 File overlap is only {file_analysis.get('file_overlap_percentage', 0):.1f}%. "
                "The repositories have diverged significantly."
            )

        # Check for unique content in FleetOps
        if file_analysis and file_analysis.get("fleetops_unique_files", 0) > 0:
            recommendations.append(
                f"🔄 FleetOps has {file_analysis.get('fleetops_unique_files')} unique files. "
                "Review these files to determine if they should be merged into Fleet."
            )

        # Efficiency recommendations
        metrics = self.results.get("metrics", {})
        if metrics.get("fleet_branches", 0) > 50:
            recommendations.append(
                f"🌿 Fleet has {metrics.get('fleet_branches')} branches. "
                "Consider pruning merged and stale branches to improve repository efficiency."
            )

        if not recommendations:
            recommendations.append("✅ All repositories are well-synchronized and efficient!")

        return recommendations

    def run_all_tests(self) -> Dict:
        """Run all tests and generate comprehensive report."""
        print("🔍 Starting Repository Synchronization Tests...\n")

        # Test 1: Repository Existence
        print("Test 1: Checking repository existence...")
        self.results["tests"]["repository_existence"] = self.test_repository_existence()
        print(f"  {'✅ PASSED' if self.results['tests']['repository_existence']['passed'] else '❌ FAILED'}\n")

        # Test 2: Remote Configuration
        print("Test 2: Checking remote configuration...")
        self.results["tests"]["remote_configuration"] = self.test_remote_configuration()
        print(f"  {'✅ PASSED' if self.results['tests']['remote_configuration']['passed'] else '❌ FAILED'}\n")

        # Test 3: Antigravity Content
        print("Test 3: Analyzing Antigravity content...")
        self.results["tests"]["antigravity_content"] = self.test_antigravity_content()
        print(f"  {'✅ PASSED' if self.results['tests']['antigravity_content']['passed'] else '❌ FAILED'}\n")

        # Test 4: Commit History Sync
        print("Test 4: Checking commit history synchronization...")
        self.results["tests"]["commit_history"] = self.test_commit_history_sync()
        print(f"  {'✅ PASSED' if self.results['tests']['commit_history']['passed'] else '❌ FAILED'}\n")

        # Test 5: File Differences
        print("Test 5: Analyzing file differences...")
        self.results["tests"]["file_differences"] = self.analyze_file_differences()
        print(f"  {'✅ PASSED' if self.results['tests']['file_differences']['passed'] else '❌ FAILED'}\n")

        # Metrics
        print("📊 Measuring efficiency metrics...")
        self.results["metrics"] = self.measure_efficiency_metrics()
        print("  ✅ COMPLETE\n")

        # Generate recommendations
        print("💡 Generating recommendations...")
        self.results["recommendations"] = self.generate_recommendations()
        print("  ✅ COMPLETE\n")

        return self.results

    def print_summary(self):
        """Print a human-readable summary of test results."""
        print("\n" + "="*80)
        print("REPOSITORY SYNCHRONIZATION TEST SUMMARY")
        print("="*80 + "\n")

        # Test Results
        print("📋 TEST RESULTS:")
        total_tests = len(self.results["tests"])
        passed_tests = sum(1 for test in self.results["tests"].values() if test.get("passed"))
        print(f"  Total Tests: {total_tests}")
        print(f"  Passed: {passed_tests}")
        print(f"  Failed: {total_tests - passed_tests}\n")

        # Key Metrics
        print("📊 KEY METRICS:")
        metrics = self.results.get("metrics", {})
        print(f"  Fleet Repository Size: {metrics.get('fleet_size_mb', 0)} MB")
        print(f"  FleetOps Repository Size: {metrics.get('fleetops_size_mb', 0)} MB")
        print(f"  Fleet Total Commits: {metrics.get('fleet_total_commits', 0)}")
        print(f"  FleetOps Total Commits: {metrics.get('fleetops_total_commits', 0)}")
        print(f"  Fleet Branches: {metrics.get('fleet_branches', 0)}")
        print(f"  FleetOps Branches: {metrics.get('fleetops_branches', 0)}\n")

        # Synchronization Status
        commit_history = self.results["tests"].get("commit_history", {})
        file_diff = self.results["tests"].get("file_differences", {})
        print("🔄 SYNCHRONIZATION STATUS:")
        print(f"  Commit Sync: {commit_history.get('sync_percentage', 0):.1f}%")
        print(f"  File Overlap: {file_diff.get('file_overlap_percentage', 0):.1f}%")
        print(f"  Common Commits: {commit_history.get('common_commits', 0)}")
        print(f"  Common Files: {file_diff.get('common_files', 0)}\n")

        # Antigravity Analysis
        antigravity = self.results["tests"].get("antigravity_content", {})
        print("🤖 ANTIGRAVITY CONTENT:")
        print(f"  Fleet Antigravity Files: {antigravity.get('fleet_antigravity_files', 0)}")
        print(f"  FleetOps Antigravity Files: {antigravity.get('fleetops_antigravity_files', 0)}")
        print(f"  Phase 7 in Fleet: {'✅' if antigravity.get('phase7_in_fleet') else '❌'}")
        print(f"  Phase 7 in FleetOps: {'✅' if antigravity.get('phase7_in_fleetops') else '❌'}\n")

        # Recommendations
        print("💡 RECOMMENDATIONS:")
        for i, rec in enumerate(self.results.get("recommendations", []), 1):
            print(f"  {i}. {rec}")

        print("\n" + "="*80)
        print(f"Report generated: {self.results['timestamp']}")
        print("="*80 + "\n")

    def save_report(self, output_path: Path):
        """Save detailed report to JSON file."""
        with open(output_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"📄 Detailed report saved to: {output_path}")


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Test and analyze Fleet repository synchronization"
    )
    parser.add_argument(
        "--mode",
        choices=["all", "sync", "analyze", "compare"],
        default="all",
        help="Test mode to run"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=FLEET_REPO / "artifacts" / f"sync_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        help="Output path for detailed JSON report"
    )

    args = parser.parse_args()

    # Initialize tester
    tester = RepositorySyncTester(FLEET_REPO, FLEETOPS_REPO)

    # Run tests
    if args.mode == "all":
        tester.run_all_tests()
    elif args.mode == "sync":
        print("Running synchronization tests only...")
        tester.results["tests"]["remote_configuration"] = tester.test_remote_configuration()
        tester.results["tests"]["commit_history"] = tester.test_commit_history_sync()
    elif args.mode == "analyze":
        print("Running Antigravity analysis only...")
        tester.results["tests"]["antigravity_content"] = tester.test_antigravity_content()
    elif args.mode == "compare":
        print("Running repository comparison only...")
        tester.results["tests"]["file_differences"] = tester.analyze_file_differences()
        tester.results["metrics"] = tester.measure_efficiency_metrics()

    # Print summary
    tester.print_summary()

    # Save detailed report
    args.output.parent.mkdir(parents=True, exist_ok=True)
    tester.save_report(args.output)

    # Exit with appropriate code
    all_passed = all(test.get("passed", False) for test in tester.results["tests"].values())
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
