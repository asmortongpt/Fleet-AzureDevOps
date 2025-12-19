#!/usr/bin/env python3
"""
Master Security Remediation Orchestrator
Coordinates all automated security fixes for Fleet Management application

Usage:
    python master-orchestrator.py --phase 1           # Run Phase 1 (Critical)
    python master-orchestrator.py --phase 2           # Run Phase 2 (High Priority)
    python master-orchestrator.py --phase all         # Run all phases
    python master-orchestrator.py --dry-run           # Scan only, no changes
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('remediation.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class RemediationResult:
    """Represents the result of a single remediation task"""
    def __init__(self, agent: str, file_path: str, fix_type: str):
        self.agent = agent
        self.file_path = file_path
        self.fix_type = fix_type
        self.status = 'pending'
        self.error = None
        self.verification_passed = False
        self.start_time = None
        self.end_time = None

    def to_dict(self) -> Dict:
        return {
            'agent': self.agent,
            'file_path': str(self.file_path),
            'fix_type': self.fix_type,
            'status': self.status,
            'error': self.error,
            'verification_passed': self.verification_passed,
            'duration_seconds': (
                (self.end_time - self.start_time).total_seconds()
                if self.start_time and self.end_time else 0
            )
        }


class ProgressTracker:
    """Tracks and reports remediation progress honestly"""
    def __init__(self):
        self.total_tasks = 0
        self.completed = 0
        self.failed = 0
        self.skipped = 0
        self.results: List[RemediationResult] = []
        self.start_time = datetime.now()

    def add_task(self):
        self.total_tasks += 1

    def mark_completed(self, result: RemediationResult):
        self.completed += 1
        result.status = 'completed'
        self.results.append(result)

    def mark_failed(self, result: RemediationResult, error: str):
        self.failed += 1
        result.status = 'failed'
        result.error = error
        self.results.append(result)

    def mark_skipped(self, result: RemediationResult, reason: str):
        self.skipped += 1
        result.status = 'skipped'
        result.error = reason
        self.results.append(result)

    def get_percentage(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return (self.completed / self.total_tasks) * 100

    def generate_report(self) -> Dict:
        """Generate honest progress report"""
        elapsed = (datetime.now() - self.start_time).total_seconds()

        report = {
            'timestamp': datetime.now().isoformat(),
            'elapsed_seconds': elapsed,
            'elapsed_human': f"{elapsed // 3600:.0f}h {(elapsed % 3600) // 60:.0f}m {elapsed % 60:.0f}s",
            'progress': {
                'total_tasks': self.total_tasks,
                'completed': self.completed,
                'failed': self.failed,
                'skipped': self.skipped,
                'completion_percentage': round(self.get_percentage(), 2)
            },
            'results': [r.to_dict() for r in self.results],
            'summary': {
                'xss_fixes': len([r for r in self.results if r.agent == 'xss' and r.status == 'completed']),
                'csrf_fixes': len([r for r in self.results if r.agent == 'csrf' and r.status == 'completed']),
                'sql_fixes': len([r for r in self.results if r.agent == 'sql_injection' and r.status == 'completed']),
                'tenant_fixes': len([r for r in self.results if r.agent == 'tenant_isolation' and r.status == 'completed']),
                'repository_files': len([r for r in self.results if r.agent == 'repository' and r.status == 'completed'])
            }
        }

        return report

    def save_report(self, output_path: Path):
        """Save report to JSON file"""
        report = self.generate_report()
        output_path.write_text(json.dumps(report, indent=2))
        logger.info(f"Report saved to: {output_path}")

    def generate_html_dashboard(self, output_path: Path):
        """Generate HTML dashboard with real-time progress"""
        report = self.generate_report()

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Fleet Security Remediation Progress</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 20px;
        }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(to right, #06b6d4, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .subtitle {{
            color: #94a3b8;
            margin-bottom: 2rem;
        }}

        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }}
        .stat-card {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 1.5rem;
        }}
        .stat-label {{
            color: #94a3b8;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }}
        .stat-value {{
            font-size: 2rem;
            font-weight: bold;
            color: #06b6d4;
        }}

        .progress-section {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 2rem;
            margin-bottom: 2rem;
        }}
        .progress-bar-container {{
            background: #0f172a;
            height: 40px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 1rem;
        }}
        .progress-bar {{
            background: linear-gradient(to right, #06b6d4, #3b82f6);
            height: 100%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }}

        .results-grid {{
            display: grid;
            gap: 0.5rem;
        }}
        .result-item {{
            background: #1e293b;
            border-left: 4px solid #64748b;
            padding: 1rem;
            border-radius: 4px;
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            gap: 1rem;
            align-items: center;
        }}
        .result-item.completed {{ border-left-color: #10b981; }}
        .result-item.failed {{ border-left-color: #ef4444; }}
        .result-item.skipped {{ border-left-color: #f59e0b; }}

        .status-badge {{
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .status-badge.completed {{
            background: #10b98144;
            color: #10b981;
        }}
        .status-badge.failed {{
            background: #ef444444;
            color: #ef4444;
        }}
        .status-badge.skipped {{
            background: #f59e0b44;
            color: #f59e0b;
        }}

        .agent-badge {{
            background: #334155;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            color: #94a3b8;
        }}

        .file-path {{
            color: #94a3b8;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.875rem;
        }}

        .timestamp {{
            color: #64748b;
            font-size: 0.75rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Fleet Security Remediation</h1>
        <p class="subtitle">Automated Security Fixes - Real-time Progress</p>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Tasks</div>
                <div class="stat-value">{report['progress']['total_tasks']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Completed</div>
                <div class="stat-value" style="color: #10b981;">{report['progress']['completed']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Failed</div>
                <div class="stat-value" style="color: #ef4444;">{report['progress']['failed']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Skipped</div>
                <div class="stat-value" style="color: #f59e0b;">{report['progress']['skipped']}</div>
            </div>
        </div>

        <div class="progress-section">
            <h2 style="margin-bottom: 1rem;">Overall Progress</h2>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: {report['progress']['completion_percentage']}%">
                    {report['progress']['completion_percentage']}%
                </div>
            </div>
            <p class="timestamp">
                Started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')} |
                Elapsed: {report['elapsed_human']}
            </p>
        </div>

        <div class="progress-section">
            <h2 style="margin-bottom: 1rem;">Fix Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">XSS Fixes</div>
                    <div class="stat-value">{report['summary']['xss_fixes']}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">CSRF Fixes</div>
                    <div class="stat-value">{report['summary']['csrf_fixes']}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">SQL Injection Fixes</div>
                    <div class="stat-value">{report['summary']['sql_fixes']}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Repository Files</div>
                    <div class="stat-value">{report['summary']['repository_files']}</div>
                </div>
            </div>
        </div>

        <div class="progress-section">
            <h2 style="margin-bottom: 1rem;">Detailed Results</h2>
            <div class="results-grid">
                {''.join([f'''
                <div class="result-item {r['status']}">
                    <span class="agent-badge">{r['agent']}</span>
                    <span class="file-path">{r['file_path']}</span>
                    <span class="status-badge {r['status']}">{r['status']}</span>
                    <span class="timestamp">{r['duration_seconds']:.1f}s</span>
                </div>
                ''' for r in report['results'][-50:]])}  <!-- Show last 50 results -->
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
    </script>
</body>
</html>
        """

        output_path.write_text(html)
        logger.info(f"Dashboard saved to: {output_path}")


class MasterRemediationOrchestrator:
    """Coordinates all security remediation agents"""

    def __init__(self, project_root: Path, dry_run: bool = False):
        self.project_root = project_root
        self.dry_run = dry_run
        self.progress = ProgressTracker()

        # Import agents
        sys.path.insert(0, str(project_root / "security-remediation"))

    def print_header(self, text: str):
        print(f"\n{'═' * 80}")
        print(f"  {text}")
        print(f"{'═' * 80}\n")

    def run_scanner(self, scanner_name: str) -> List[Dict]:
        """Run a scanner and return vulnerabilities"""
        logger.info(f"Running scanner: {scanner_name}")

        scanner_path = self.project_root / "security-remediation" / "scanners" / f"{scanner_name}.py"

        if not scanner_path.exists():
            logger.error(f"Scanner not found: {scanner_path}")
            return []

        try:
            # Run scanner as subprocess
            result = subprocess.run(
                [sys.executable, str(scanner_path), str(self.project_root)],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            if result.returncode != 0:
                logger.error(f"Scanner failed: {result.stderr}")
                return []

            # Parse JSON output
            vulnerabilities = json.loads(result.stdout)
            logger.info(f"Found {len(vulnerabilities)} vulnerabilities")
            return vulnerabilities

        except subprocess.TimeoutExpired:
            logger.error(f"Scanner timed out: {scanner_name}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse scanner output: {e}")
            return []
        except Exception as e:
            logger.error(f"Scanner error: {e}")
            return []

    def run_agent(self, agent_name: str) -> bool:
        """Run a remediation agent"""
        self.print_header(f"Running Agent: {agent_name}")

        agent_path = self.project_root / "security-remediation" / "agents" / f"{agent_name}-agent.py"

        if not agent_path.exists():
            logger.error(f"Agent not found: {agent_path}")
            return False

        try:
            # Run agent with dry-run flag if needed
            cmd = [sys.executable, str(agent_path), str(self.project_root)]
            if self.dry_run:
                cmd.append("--dry-run")

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )

            if result.returncode != 0:
                logger.error(f"Agent failed: {result.stderr}")
                return False

            # Parse results
            agent_results = json.loads(result.stdout)

            # Update progress tracker
            for fix in agent_results.get('fixes', []):
                result_obj = RemediationResult(
                    agent=agent_name,
                    file_path=fix['file_path'],
                    fix_type=fix['type']
                )
                result_obj.start_time = datetime.fromisoformat(fix.get('start_time', datetime.now().isoformat()))
                result_obj.end_time = datetime.fromisoformat(fix.get('end_time', datetime.now().isoformat()))

                if fix['status'] == 'success':
                    result_obj.verification_passed = fix.get('verified', False)
                    self.progress.mark_completed(result_obj)
                elif fix['status'] == 'failed':
                    self.progress.mark_failed(result_obj, fix.get('error', 'Unknown error'))
                elif fix['status'] == 'skipped':
                    self.progress.mark_skipped(result_obj, fix.get('reason', 'Unknown reason'))

            logger.info(f"Agent completed: {agent_name}")
            return True

        except subprocess.TimeoutExpired:
            logger.error(f"Agent timed out: {agent_name}")
            return False
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse agent output: {e}")
            return False
        except Exception as e:
            logger.error(f"Agent error: {e}")
            return False

    def execute_phase_1_critical(self) -> bool:
        """
        Phase 1: Critical Security (17-19 hours)
        - SQL Injection (3h)
        - XSS Protection (6h)
        - CSRF Protection (8h)
        """
        self.print_header("PHASE 1: CRITICAL SECURITY FIXES")

        if self.dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made\n")

        success = True

        # 1. SQL Injection Fixes
        logger.info("Starting SQL Injection remediation...")
        if not self.run_agent('sql-injection'):
            logger.error("SQL Injection agent failed")
            success = False

        # 2. XSS Protection
        logger.info("Starting XSS Protection remediation...")
        if not self.run_agent('xss'):
            logger.error("XSS agent failed")
            success = False

        # 3. CSRF Protection
        logger.info("Starting CSRF Protection remediation...")
        if not self.run_agent('csrf'):
            logger.error("CSRF agent failed")
            success = False

        return success

    def execute_phase_2_high_priority(self) -> bool:
        """
        Phase 2: High Priority Architecture (26 hours)
        - Tenant Isolation (10h)
        - Repository Pattern (16h)
        """
        self.print_header("PHASE 2: HIGH PRIORITY ARCHITECTURE")

        if self.dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made\n")

        success = True

        # 4. Tenant Isolation
        logger.info("Starting Tenant Isolation remediation...")
        if not self.run_agent('tenant-isolation'):
            logger.error("Tenant Isolation agent failed")
            success = False

        # 5. Repository Pattern
        logger.info("Starting Repository Pattern implementation...")
        if not self.run_agent('repository'):
            logger.error("Repository agent failed")
            success = False

        return success

    def generate_final_report(self):
        """Generate comprehensive final report"""
        self.print_header("GENERATING FINAL REPORT")

        # Save JSON report
        report_path = self.project_root / "security-remediation" / "reports" / "remediation-report.json"
        self.progress.save_report(report_path)

        # Generate HTML dashboard
        dashboard_path = self.project_root / "security-remediation" / "reports" / "progress-dashboard.html"
        self.progress.generate_html_dashboard(dashboard_path)

        # Print summary
        report = self.progress.generate_report()
        print(f"\n{'═' * 80}")
        print("REMEDIATION COMPLETE")
        print(f"{'═' * 80}\n")
        print(f"Total Tasks:     {report['progress']['total_tasks']}")
        print(f"Completed:       {report['progress']['completed']} ✅")
        print(f"Failed:          {report['progress']['failed']} ❌")
        print(f"Skipped:         {report['progress']['skipped']} ⚠️")
        print(f"Completion:      {report['progress']['completion_percentage']}%")
        print(f"\nElapsed Time:    {report['elapsed_human']}")
        print(f"\nReports:")
        print(f"  - JSON:  {report_path}")
        print(f"  - HTML:  {dashboard_path}")
        print(f"\n{'═' * 80}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Fleet Security Remediation Master Orchestrator'
    )
    parser.add_argument(
        '--phase',
        choices=['1', '2', 'all'],
        default='all',
        help='Phase to execute (1=Critical, 2=High Priority, all=Both)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Scan only, do not make changes'
    )
    parser.add_argument(
        '--project-root',
        type=Path,
        default=Path.cwd(),
        help='Project root directory'
    )

    args = parser.parse_args()

    # Initialize orchestrator
    orchestrator = MasterRemediationOrchestrator(
        project_root=args.project_root,
        dry_run=args.dry_run
    )

    orchestrator.print_header("FLEET SECURITY REMEDIATION ORCHESTRATOR")
    print(f"Project Root: {args.project_root}")
    print(f"Phase:        {args.phase}")
    print(f"Dry Run:      {args.dry_run}")
    print(f"Started:      {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    try:
        # Execute phases
        if args.phase in ['1', 'all']:
            success = orchestrator.execute_phase_1_critical()
            if not success and not args.dry_run:
                logger.error("Phase 1 failed - stopping execution")
                sys.exit(1)

        if args.phase in ['2', 'all']:
            success = orchestrator.execute_phase_2_high_priority()
            if not success and not args.dry_run:
                logger.error("Phase 2 failed")
                sys.exit(1)

        # Generate final report
        orchestrator.generate_final_report()

        sys.exit(0)

    except KeyboardInterrupt:
        logger.warning("Remediation interrupted by user")
        orchestrator.generate_final_report()
        sys.exit(130)
    except Exception as e:
        logger.error(f"Orchestrator failed: {e}", exc_info=True)
        orchestrator.generate_final_report()
        sys.exit(1)


if __name__ == "__main__":
    main()
