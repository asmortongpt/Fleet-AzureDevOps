#!/usr/bin/env python3
"""
============================================================================
Deployment Status Monitor and Aggregator
============================================================================
Real-time monitoring and aggregation of 32 autonomous agents
============================================================================
"""

import json
import sys
import time
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List

REPO_ROOT = Path(__file__).parent.parent
MODULES_DIR = REPO_ROOT / "modules"
REFRESH_INTERVAL = 5  # seconds


class DeploymentMonitor:
    """Real-time deployment monitoring"""

    def __init__(self):
        self.last_update = None
        self.status_cache = {}

    def clear_screen(self):
        """Clear terminal screen"""
        print("\033[2J\033[H", end="")

    def collect_status(self) -> Dict[str, Dict]:
        """Collect status from all agent status files"""
        status_data = {}

        if not MODULES_DIR.exists():
            return status_data

        for module_dir in MODULES_DIR.iterdir():
            if not module_dir.is_dir():
                continue

            status_file = module_dir / "status" / "agent-status.json"
            if status_file.exists():
                try:
                    with open(status_file) as f:
                        data = json.load(f)
                        status_data[data["module"]] = data
                except Exception as e:
                    print(f"Error reading {status_file}: {e}", file=sys.stderr)

        return status_data

    def calculate_stats(self, status_data: Dict[str, Dict]) -> Dict:
        """Calculate aggregate statistics"""
        stats = {
            "total": len(status_data),
            "by_status": defaultdict(int),
            "by_phase": defaultdict(int),
            "avg_progress": defaultdict(list),
        }

        for module, data in status_data.items():
            stats["by_status"][data.get("status", "unknown")] += 1
            stats["by_phase"][data.get("phase", "unknown")] += 1

            progress = data.get("progress", {})
            for phase, pct in progress.items():
                stats["avg_progress"][phase].append(pct)

        # Calculate averages
        for phase, values in stats["avg_progress"].items():
            if values:
                stats["avg_progress"][phase] = sum(values) / len(values)

        return stats

    def render_progress_bar(self, percentage: float, width: int = 30) -> str:
        """Render a progress bar"""
        filled = int(width * percentage / 100)
        bar = "█" * filled + "░" * (width - filled)
        return f"[{bar}] {percentage:5.1f}%"

    def display_status(self, status_data: Dict[str, Dict], stats: Dict):
        """Display real-time status dashboard"""
        self.clear_screen()

        print("=" * 80)
        print("  32-AGENT MODULE ENHANCEMENT SYSTEM - REAL-TIME MONITORING")
        print("=" * 80)
        print()

        # Overall stats
        print(f"📊 OVERALL STATUS (Last updated: {datetime.now().strftime('%H:%M:%S')})")
        print(f"   Total Modules: {stats['total']}")
        print()

        # Status breakdown
        print("📈 STATUS BREAKDOWN:")
        for status, count in sorted(stats["by_status"].items()):
            icon = {
                "completed": "✅",
                "running": "⚙️ ",
                "failed": "❌",
                "initialized": "🔄",
            }.get(status, "❓")
            print(f"   {icon} {status.upper()}: {count}")
        print()

        # Phase breakdown
        print("🔄 PHASE BREAKDOWN:")
        for phase, count in sorted(stats["by_phase"].items()):
            print(f"   • {phase}: {count}")
        print()

        # Average progress
        print("📊 AVERAGE PROGRESS:")
        avg_progress = stats["avg_progress"]
        phases = ["analysis", "design", "implementation", "testing", "documentation"]
        for phase in phases:
            pct = avg_progress.get(phase, 0)
            bar = self.render_progress_bar(pct, width=40)
            print(f"   {phase.capitalize():20} {bar}")
        print()

        # Individual module status (scrollable)
        print("=" * 80)
        print("MODULE DETAILS:")
        print("-" * 80)

        for module in sorted(status_data.keys()):
            data = status_data[module]
            status = data.get("status", "unknown")
            phase = data.get("phase", "unknown")
            progress = data.get("progress", {})

            status_icon = {
                "completed": "✅",
                "running": "⚙️",
                "failed": "❌",
                "initialized": "🔄",
            }.get(status, "❓")

            # Overall progress
            total_progress = sum(progress.values()) / len(progress) if progress else 0

            print(f"{status_icon} {module:25} | {status:12} | {phase:25} | {total_progress:5.1f}%")

        print("=" * 80)
        print(f"Press Ctrl+C to exit | Refreshing every {REFRESH_INTERVAL}s")

    def run(self):
        """Run the monitoring loop"""
        print("Starting deployment monitor...")
        print("Waiting for agent data...")
        print()

        try:
            while True:
                status_data = self.collect_status()

                if status_data:
                    stats = self.calculate_stats(status_data)
                    self.display_status(status_data, stats)

                    # Check if all completed
                    if stats["by_status"].get("completed", 0) == stats["total"]:
                        print()
                        print("🎉 ALL AGENTS COMPLETED! 🎉")
                        break

                time.sleep(REFRESH_INTERVAL)

        except KeyboardInterrupt:
            print("\n\nMonitoring stopped by user.")
            print("Deployment continues in background.")


def generate_final_report():
    """Generate final deployment report"""
    print("\nGenerating final report...")

    monitor = DeploymentMonitor()
    status_data = monitor.collect_status()
    stats = monitor.calculate_stats(status_data)

    report_file = REPO_ROOT / f"DEPLOYMENT_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    report = {
        "timestamp": datetime.now().isoformat(),
        "statistics": {
            "total_modules": stats["total"],
            "by_status": dict(stats["by_status"]),
            "by_phase": dict(stats["by_phase"]),
            "average_progress": dict(stats["avg_progress"]),
        },
        "modules": status_data,
    }

    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)

    print(f"✓ Final report saved to: {report_file}")

    # Print summary
    print("\n" + "=" * 80)
    print("DEPLOYMENT SUMMARY")
    print("=" * 80)
    print(f"Total Modules: {stats['total']}")
    print(f"Completed: {stats['by_status'].get('completed', 0)}")
    print(f"Failed: {stats['by_status'].get('failed', 0)}")
    print(f"Running: {stats['by_status'].get('running', 0)}")
    print("=" * 80)


def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] == "--report":
        generate_final_report()
    else:
        monitor = DeploymentMonitor()
        monitor.run()


if __name__ == "__main__":
    main()
