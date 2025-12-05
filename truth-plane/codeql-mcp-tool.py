#!/usr/bin/env python3
"""
CodeQL MCP Tool - Truth Plane Gatekeeper
Exposes deterministic verification through CodeQL analysis

MCP Tool Contract:
- build_db(module_scope, build_cmd): Create CodeQL database
- analyze(db, query_pack, output_format): Run analysis
- diff_alerts(before_sarif, after_sarif): Compare results
- summarize(alerts): Convert to unified issues schema
"""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import hashlib


class CodeQLMCPTool:
    """
    CodeQL MCP Tool - Gatekeeper Agent with Authority

    This tool has authority to:
    - Reject patches that introduce new issues
    - Demand follow-up fixes
    - Approve merge steps
    """

    def __init__(self, workspace: Path, codeql_cli: str = "codeql"):
        self.workspace = Path(workspace)
        self.codeql_cli = codeql_cli
        self.db_cache_dir = self.workspace / ".codeql-dbs"
        self.sarif_dir = self.workspace / ".sarif-results"
        self.db_cache_dir.mkdir(exist_ok=True)
        self.sarif_dir.mkdir(exist_ok=True)

    def build_db(
        self,
        module_scope: str,
        build_cmd: Optional[str] = None,
        force_rebuild: bool = False
    ) -> Tuple[bool, str, str]:
        """
        Create CodeQL database for a module or full repo

        Args:
            module_scope: Path to module (e.g., "api/") or "full_repo"
            build_cmd: Build command (e.g., "npm run build")
            force_rebuild: Force rebuild even if cached DB exists

        Returns:
            (success, db_path, message)
        """
        # Determine database path
        scope_hash = hashlib.md5(module_scope.encode()).hexdigest()[:8]
        db_name = f"codeql-db-{module_scope.replace('/', '-')}-{scope_hash}"
        db_path = self.db_cache_dir / db_name

        # Check cache
        if db_path.exists() and not force_rebuild:
            return True, str(db_path), f"Using cached database: {db_path}"

        # Determine source root
        if module_scope == "full_repo":
            source_root = self.workspace
        else:
            source_root = self.workspace / module_scope

        if not source_root.exists():
            return False, "", f"Source path does not exist: {source_root}"

        # Build command
        if build_cmd is None:
            # Auto-detect build command
            if (source_root / "package.json").exists():
                build_cmd = "npm install && npm run build"
            else:
                build_cmd = ""  # No build step

        # CodeQL database creation command
        cmd = [
            self.codeql_cli,
            "database",
            "create",
            str(db_path),
            f"--language=javascript",
            f"--source-root={source_root}",
        ]

        if build_cmd:
            cmd.extend([f"--command={build_cmd}"])

        try:
            result = subprocess.run(
                cmd,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )

            if result.returncode == 0:
                return True, str(db_path), f"Database created: {db_path}"
            else:
                return False, "", f"Database creation failed: {result.stderr}"

        except subprocess.TimeoutExpired:
            return False, "", "Database creation timeout (10 minutes)"
        except Exception as e:
            return False, "", f"Database creation error: {str(e)}"

    def analyze(
        self,
        db_path: str,
        query_pack: str = "codeql/javascript-queries",
        output_format: str = "sarif-latest"
    ) -> Tuple[bool, str, str]:
        """
        Run CodeQL analysis on a database

        Args:
            db_path: Path to CodeQL database
            query_pack: Query pack to run (default: javascript-queries)
            output_format: Output format (sarif-latest, csv, etc.)

        Returns:
            (success, sarif_path, message)
        """
        db = Path(db_path)
        if not db.exists():
            return False, "", f"Database does not exist: {db_path}"

        # Generate output path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sarif_name = f"{db.name}_{timestamp}.sarif"
        sarif_path = self.sarif_dir / sarif_name

        # CodeQL analysis command
        cmd = [
            self.codeql_cli,
            "database",
            "analyze",
            str(db),
            query_pack,
            f"--format={output_format}",
            f"--output={sarif_path}",
            "--threads=0",  # Use all available threads
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=1800  # 30 minute timeout
            )

            if result.returncode == 0:
                return True, str(sarif_path), f"Analysis complete: {sarif_path}"
            else:
                return False, "", f"Analysis failed: {result.stderr}"

        except subprocess.TimeoutExpired:
            return False, "", "Analysis timeout (30 minutes)"
        except Exception as e:
            return False, "", f"Analysis error: {str(e)}"

    def diff_alerts(
        self,
        before_sarif: str,
        after_sarif: str
    ) -> Tuple[bool, Dict, str]:
        """
        Compare two SARIF results to find new/fixed/unchanged alerts

        Args:
            before_sarif: Path to baseline SARIF
            after_sarif: Path to new SARIF

        Returns:
            (success, diff_summary, message)

        diff_summary format:
        {
            "new_alerts": [...],      # Alerts introduced by changes
            "fixed_alerts": [...],    # Alerts fixed by changes
            "unchanged_alerts": [...], # Alerts still present
            "verdict": "APPROVE" | "REJECT" | "REVIEW",
            "reason": "..."
        }
        """
        try:
            # Load SARIF files
            with open(before_sarif, 'r') as f:
                before_data = json.load(f)
            with open(after_sarif, 'r') as f:
                after_data = json.load(f)

            # Extract alerts with fingerprints
            before_alerts = self._extract_alerts(before_data)
            after_alerts = self._extract_alerts(after_data)

            # Create fingerprint sets
            before_fps = {alert['fingerprint'] for alert in before_alerts}
            after_fps = {alert['fingerprint'] for alert in after_alerts}

            # Compute diff
            new_fps = after_fps - before_fps
            fixed_fps = before_fps - after_fps
            unchanged_fps = before_fps & after_fps

            new_alerts = [a for a in after_alerts if a['fingerprint'] in new_fps]
            fixed_alerts = [a for a in before_alerts if a['fingerprint'] in fixed_fps]
            unchanged_alerts = [a for a in after_alerts if a['fingerprint'] in unchanged_fps]

            # Determine verdict
            high_severity_new = sum(1 for a in new_alerts if a['severity'] in ['error', 'warning'])

            if high_severity_new > 0:
                verdict = "REJECT"
                reason = f"Introduced {high_severity_new} new high-severity alerts"
            elif len(new_alerts) > 0:
                verdict = "REVIEW"
                reason = f"Introduced {len(new_alerts)} new low-severity alerts"
            else:
                verdict = "APPROVE"
                reason = f"No new alerts introduced, {len(fixed_alerts)} alerts fixed"

            diff_summary = {
                "new_alerts": new_alerts,
                "fixed_alerts": fixed_alerts,
                "unchanged_alerts": unchanged_alerts,
                "verdict": verdict,
                "reason": reason,
                "stats": {
                    "new_count": len(new_alerts),
                    "fixed_count": len(fixed_alerts),
                    "unchanged_count": len(unchanged_alerts)
                }
            }

            return True, diff_summary, f"Diff computed: {verdict}"

        except Exception as e:
            return False, {}, f"Diff failed: {str(e)}"

    def _extract_alerts(self, sarif_data: Dict) -> List[Dict]:
        """Extract alerts from SARIF with fingerprints"""
        alerts = []

        for run in sarif_data.get('runs', []):
            for result in run.get('results', []):
                # Extract location
                locations = result.get('locations', [])
                if not locations:
                    continue

                location = locations[0]
                physical_location = location.get('physicalLocation', {})
                artifact_location = physical_location.get('artifactLocation', {})
                region = physical_location.get('region', {})

                file_path = artifact_location.get('uri', 'unknown')
                start_line = region.get('startLine', 0)

                # Create fingerprint
                rule_id = result.get('ruleId', 'unknown')
                message = result.get('message', {}).get('text', '')
                fingerprint_str = f"{rule_id}:{file_path}:{start_line}:{message[:50]}"
                fingerprint = hashlib.md5(fingerprint_str.encode()).hexdigest()

                # Determine severity
                level = result.get('level', 'note')
                severity_map = {
                    'error': 'error',
                    'warning': 'warning',
                    'note': 'note',
                    'none': 'note'
                }
                severity = severity_map.get(level, 'note')

                alerts.append({
                    'fingerprint': fingerprint,
                    'rule_id': rule_id,
                    'severity': severity,
                    'message': message,
                    'file': file_path,
                    'line': start_line
                })

        return alerts

    def summarize(self, alerts: List[Dict]) -> List[Dict]:
        """
        Convert alerts to unified issues schema

        Unified Schema:
        {
            "tool": "codeql",
            "ruleId": "...",
            "severity": "error" | "warning" | "note",
            "path": "...",
            "line": 123,
            "message": "...",
            "fingerprint": "..."
        }
        """
        unified = []

        for alert in alerts:
            unified.append({
                "tool": "codeql",
                "ruleId": alert['rule_id'],
                "severity": alert['severity'],
                "path": alert['file'],
                "line": alert['line'],
                "message": alert['message'],
                "fingerprint": alert['fingerprint']
            })

        return unified


if __name__ == "__main__":
    # Test the tool
    print("CodeQL MCP Tool - Truth Plane Gatekeeper")
    print("=" * 80)

    workspace = Path.cwd()
    tool = CodeQLMCPTool(workspace)

    print(f"Workspace: {workspace}")
    print(f"DB Cache: {tool.db_cache_dir}")
    print(f"SARIF Dir: {tool.sarif_dir}")
    print("\nMCP Tool Functions:")
    print("  - build_db(module_scope, build_cmd)")
    print("  - analyze(db, query_pack, output_format)")
    print("  - diff_alerts(before_sarif, after_sarif)")
    print("  - summarize(alerts)")
    print("\n✅ CodeQL MCP Tool initialized")
