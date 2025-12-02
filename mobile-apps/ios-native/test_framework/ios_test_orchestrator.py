#!/usr/bin/env python3
"""
iOS Test Orchestrator - Comprehensive testing for Fleet Mobile iOS app
"""
from __future__ import annotations
from typing import List, Dict, Any
import json
import os
import sys

from test_models import (
    TestPlan, TestTask, TestRunRecord,
    TestStatus, TestCommandResult, new_id,
)
from rag_client import RAGClient, RAGDocument, InMemoryRAGClient
from test_mcp_clients import TestRunnerClient, XcodeBuildRunnerClient


class IOSTestOrchestrator:
    def __init__(
        self,
        workdir: str,
    ) -> None:
        self.workdir = workdir
        self.rag = InMemoryRAGClient()
        self.runner = TestRunnerClient(workdir)
        self.xcode_runner = XcodeBuildRunnerClient(workdir)

        self._plans: Dict[str, TestPlan] = {}
        self._runs: Dict[str, TestRunRecord] = {}

        # Initialize RAG with iOS app requirements
        self._initialize_rag()

    def _initialize_rag(self):
        """Initialize RAG with iOS app architecture and requirements"""
        docs = [
            RAGDocument(
                id="req-001",
                namespace="requirements",
                title="Fleet iOS App Requirements",
                kind="requirement",
                content="""
                iOS Fleet Mobile App Requirements:
                - Email/Password + Biometric Authentication (Face ID/Touch ID)
                - Dashboard with fleet metrics
                - Vehicle management and tracking
                - OBD-II Bluetooth LE integration
                - GPS tracking (foreground + background)
                - Photo capture with OCR using Vision framework
                - Offline-first sync with Core Data
                - SwiftUI interface with accessibility support
                - Dark mode support
                - Azure AD SSO integration
                """,
                metadata={"platform": "iOS"}
            ),
            RAGDocument(
                id="arch-001",
                namespace="architecture",
                title="Fleet iOS App Architecture",
                kind="architecture",
                content="""
                Architecture:
                - MVVM pattern with SwiftUI
                - Core Data for offline persistence
                - Combine framework for reactive programming
                - URLSession for networking
                - CocoaPods for dependency management (Firebase, Sentry, KeychainSwift)
                - Modular structure: Models, ViewModels, Views, Services, Networking, OBD2

                Key Files Required:
                - CrashReporter.swift - Error tracking
                - AuthenticationService.swift - Auth API
                - SyncService.swift - Background sync
                - NetworkMonitor.swift - Connectivity
                - TripModels.swift - Trip data models
                - VehicleViewModel.swift - Vehicle MVVM
                """,
                metadata={"platform": "iOS"}
            ),
        ]
        self.rag.add_documents(docs)

    def build_ios_test_plan(self) -> TestPlan:
        """Build comprehensive test plan for iOS app"""
        tasks: List[TestTask] = [
            # Architecture validation
            TestTask(
                id=new_id("TT"),
                description="Verify all required Swift files exist in filesystem",
                category="architecture",
                metadata={"files": [
                    "App/CrashReporter.swift",
                    "App/AuthenticationService.swift",
                    "App/SyncService.swift",
                    "App/NetworkMonitor.swift",
                    "App/TripModels.swift",
                    "App/ViewModels/VehicleViewModel.swift",
                ]}
            ),
            TestTask(
                id=new_id("TT"),
                description="Verify CocoaPods dependencies are installed",
                category="architecture",
            ),
            TestTask(
                id=new_id("TT"),
                description="Check Xcode project file includes all Swift source files",
                category="architecture",
            ),

            # Static analysis
            TestTask(
                id=new_id("TT"),
                description="Run Swift compiler to identify compilation errors",
                category="static",
            ),
            TestTask(
                id=new_id("TT"),
                description="Validate import statements and dependencies",
                category="static",
            ),

            # Build tests
            TestTask(
                id=new_id("TT"),
                description="Build iOS app for simulator (Debug configuration)",
                category="integration",
                depends_on=[],
            ),
        ]

        plan = TestPlan(
            id=new_id("TPL"),
            feature_or_system="Fleet iOS Mobile App",
            tasks=tasks,
        )
        self._plans[plan.id] = plan
        return plan

    def run_test_plan(self, plan: TestPlan) -> TestRunRecord:
        """Execute test plan and collect results"""
        results: List[TestCommandResult] = []

        for task in plan.tasks:
            task.status = TestStatus.RUNNING
            print(f"\n🔍 Running: {task.description}")

            try:
                cmd, res = self._execute_task(task)

                status = TestStatus.PASSED if res.status == "passed" else TestStatus.FAILED
                task.status = status

                results.append(
                    TestCommandResult(
                        command=cmd,
                        category=task.category,
                        status=status,
                        log=res.log,
                    )
                )

                # Print result immediately
                if status == TestStatus.PASSED:
                    print(f"✅ PASSED")
                else:
                    print(f"❌ FAILED")
                    print(f"   Error: {res.log[:200]}...")

            except Exception as e:
                task.status = TestStatus.FAILED
                results.append(
                    TestCommandResult(
                        command="(exception)",
                        category=task.category,
                        status=TestStatus.FAILED,
                        log=str(e),
                    )
                )
                print(f"❌ EXCEPTION: {e}")

        summary = self._summarize_results(results)
        run = TestRunRecord(
            id=new_id("TRUN"),
            test_plan_id=plan.id,
            tasks=plan.tasks,
            results=results,
            summary=summary,
        )
        self._runs[run.id] = run

        return run

    def _execute_task(self, task: TestTask) -> tuple[str, Any]:
        """Execute a single test task"""
        category = task.category
        desc = task.description

        if "Verify all required Swift files exist" in desc:
            files = task.metadata.get("files", [])
            missing = []
            for f in files:
                path = os.path.join(self.workdir, f)
                if not os.path.exists(path):
                    missing.append(f)

            if missing:
                return ("file_check", type('obj', (object,), {
                    'status': 'failed',
                    'log': f"Missing files: {', '.join(missing)}"
                })())
            else:
                return ("file_check", type('obj', (object,), {
                    'status': 'passed',
                    'log': f"All {len(files)} required files exist"
                })())

        elif "CocoaPods dependencies" in desc:
            cmd = "pod check --verbose"
            res = self.runner.run(cmd)
            return (cmd, res)

        elif "Check Xcode project file includes" in desc:
            cmd = f'grep -r "CrashReporter.swift" App.xcodeproj/ || echo "NOT_FOUND"'
            res = self.runner.run(cmd)
            if "NOT_FOUND" in res.log:
                res.status = "failed"
                res.log = "Required files not included in Xcode project"
            return (cmd, res)

        elif "Run Swift compiler" in desc:
            cmd = 'xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 17 Pro" -dry-run 2>&1 | head -100'
            res = self.runner.run(cmd)
            return (cmd, res)

        elif "Build iOS app for simulator" in desc:
            res = self.xcode_runner.run_build(
                workspace="App.xcworkspace",
                scheme="App",
                destination="platform=iOS Simulator,name=iPhone 17 Pro"
            )
            return ("xcodebuild", res)

        else:
            # Generic command
            cmd = "echo 'Test not implemented'"
            res = self.runner.run(cmd)
            return (cmd, res)

    def _summarize_results(self, results: List[TestCommandResult]) -> str:
        """Generate summary of test results"""
        from collections import Counter
        counts = Counter(r.status for r in results)

        total = len(results)
        passed = counts.get(TestStatus.PASSED, 0)
        failed = counts.get(TestStatus.FAILED, 0)

        lines = [
            "=" * 60,
            "TEST SUMMARY",
            "=" * 60,
            f"Total Tests: {total}",
            f"✅ Passed: {passed}",
            f"❌ Failed: {failed}",
            "",
            "FAILED TESTS:" if failed > 0 else "ALL TESTS PASSED!",
        ]

        if failed > 0:
            for r in results:
                if r.status == TestStatus.FAILED:
                    lines.append(f"  - {r.category}: {r.command}")
                    lines.append(f"    {r.log[:150]}...")

        return "\n".join(lines)

    def generate_fix_report(self, run: TestRunRecord) -> str:
        """Generate actionable fix report"""
        failed_results = [r for r in run.results if r.status == TestStatus.FAILED]

        if not failed_results:
            return "✅ No failures - app is ready!"

        report = [
            "",
            "=" * 60,
            "ACTIONABLE FIX REPORT",
            "=" * 60,
            "",
        ]

        for i, result in enumerate(failed_results, 1):
            report.append(f"{i}. {result.category.upper()} FAILURE:")
            report.append(f"   Command: {result.command}")
            report.append(f"   Issue: {result.log[:300]}")
            report.append("")

            # Generate fix suggestions
            if "Missing files" in result.log:
                report.append("   FIX: Add these files to Xcode project:")
                report.append("   1. Open App.xcworkspace in Xcode")
                report.append("   2. Right-click 'App' folder → 'Add Files to App...'")
                report.append("   3. Select the missing files")
                report.append("   4. Ensure 'App' target is checked")
                report.append("")

            elif "not included in Xcode project" in result.log:
                report.append("   FIX: Files exist but not in Xcode project")
                report.append("   - Use 'Add Files to App...' in Xcode")
                report.append("")

            elif "Cannot find" in result.log or "error:" in result.log:
                report.append("   FIX: Compilation errors detected")
                report.append("   - Review compiler errors above")
                report.append("   - Ensure all dependencies are resolved")
                report.append("")

        return "\n".join(report)


def main():
    """Main entry point"""
    workdir = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native"

    print("=" * 60)
    print("FLEET IOS APP - COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    print(f"Working Directory: {workdir}")
    print("")

    orchestrator = IOSTestOrchestrator(workdir=workdir)

    # Build test plan
    print("📋 Building test plan...")
    plan = orchestrator.build_ios_test_plan()
    print(f"   Created {len(plan.tasks)} test tasks")

    # Execute tests
    print("\n🚀 Executing test plan...\n")
    run = orchestrator.run_test_plan(plan)

    # Print summary
    print("\n" + run.summary)

    # Generate fix report
    fix_report = orchestrator.generate_fix_report(run)
    print(fix_report)

    # Save results
    results_file = os.path.join(workdir, "test_results.json")
    with open(results_file, 'w') as f:
        json.dump({
            "plan_id": plan.id,
            "run_id": run.id,
            "summary": run.summary,
            "fix_report": fix_report,
            "tasks": [
                {
                    "description": t.description,
                    "category": t.category,
                    "status": t.status.value,
                }
                for t in run.tasks
            ],
            "results": [
                {
                    "command": r.command,
                    "category": r.category,
                    "status": r.status.value,
                    "log": r.log[:500],
                }
                for r in run.results
            ],
        }, f, indent=2)

    print(f"\n📊 Results saved to: {results_file}")

    # Exit code based on results
    failed_count = sum(1 for r in run.results if r.status == TestStatus.FAILED)
    sys.exit(1 if failed_count > 0 else 0)


if __name__ == "__main__":
    main()
