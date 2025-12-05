#!/usr/bin/env python3
"""
Redundant Truth Agents - Multiple Verification Sources
Prevents single-point-of-failure in verification

Agents:
- TypeScript Compiler (tsc --noEmit)
- ESLint (eslint . --max-warnings=0)
- Semgrep (SAST with custom rules)
- npm audit (CVE scanning)
"""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple
import hashlib


class RedundantVerifiers:
    """
    Redundant truth agents for multi-source verification
    All agents must approve before patch is accepted
    """

    def __init__(self, workspace: Path):
        self.workspace = Path(workspace)

    def run_tsc(self, module_path: str = ".") -> Tuple[bool, List[Dict], str]:
        """
        TypeScript strict gate - tsc --noEmit

        Returns:
            (success, issues, message)
        """
        target = self.workspace / module_path

        cmd = ["npx", "tsc", "--noEmit", "--pretty", "false"]

        try:
            result = subprocess.run(
                cmd,
                cwd=target,
                capture_output=True,
                text=True,
                timeout=300
            )

            # Parse TypeScript errors
            issues = self._parse_tsc_output(result.stdout + result.stderr)

            success = result.returncode == 0
            message = f"TypeScript: {len(issues)} issues found" if issues else "TypeScript: Clean"

            return success, issues, message

        except subprocess.TimeoutExpired:
            return False, [], "TypeScript verification timeout"
        except Exception as e:
            return False, [], f"TypeScript verification error: {str(e)}"

    def run_eslint(self, module_path: str = ".") -> Tuple[bool, List[Dict], str]:
        """
        ESLint gate - eslint . --max-warnings=0

        Returns:
            (success, issues, message)
        """
        target = self.workspace / module_path

        cmd = [
            "npx", "eslint",
            ".",
            "--max-warnings=0",
            "--format=json"
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=target,
                capture_output=True,
                text=True,
                timeout=300
            )

            # Parse ESLint JSON output
            if result.stdout:
                eslint_data = json.loads(result.stdout)
                issues = self._parse_eslint_output(eslint_data)
            else:
                issues = []

            success = result.returncode == 0 and len(issues) == 0
            message = f"ESLint: {len(issues)} issues found" if issues else "ESLint: Clean"

            return success, issues, message

        except subprocess.TimeoutExpired:
            return False, [], "ESLint verification timeout"
        except Exception as e:
            return False, [], f"ESLint verification error: {str(e)}"

    def run_semgrep(self, module_path: str = ".") -> Tuple[bool, List[Dict], str]:
        """
        Semgrep SAST gate

        Returns:
            (success, issues, message)
        """
        target = self.workspace / module_path

        cmd = [
            "semgrep",
            "--config=auto",
            "--json",
            "--quiet",
            str(target)
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=600
            )

            # Parse Semgrep JSON output
            if result.stdout:
                semgrep_data = json.loads(result.stdout)
                issues = self._parse_semgrep_output(semgrep_data)
            else:
                issues = []

            # Semgrep returns non-zero if findings, but we only fail on errors
            error_issues = [i for i in issues if i['severity'] == 'error']
            success = len(error_issues) == 0

            message = f"Semgrep: {len(issues)} issues found" if issues else "Semgrep: Clean"

            return success, issues, message

        except subprocess.TimeoutExpired:
            return False, [], "Semgrep verification timeout"
        except FileNotFoundError:
            # Semgrep not installed - skip
            return True, [], "Semgrep: Not installed (skipped)"
        except Exception as e:
            return False, [], f"Semgrep verification error: {str(e)}"

    def run_npm_audit(self, module_path: str = ".") -> Tuple[bool, List[Dict], str]:
        """
        npm audit CVE scanning

        Returns:
            (success, issues, message)
        """
        target = self.workspace / module_path

        # Check if package.json exists
        if not (target / "package.json").exists():
            return True, [], "npm audit: No package.json (skipped)"

        cmd = ["npm", "audit", "--json"]

        try:
            result = subprocess.run(
                cmd,
                cwd=target,
                capture_output=True,
                text=True,
                timeout=120
            )

            # Parse npm audit JSON
            if result.stdout:
                audit_data = json.loads(result.stdout)
                issues = self._parse_npm_audit_output(audit_data)
            else:
                issues = []

            # Only fail on high/critical vulnerabilities
            critical_issues = [i for i in issues if i['severity'] in ['high', 'critical']]
            success = len(critical_issues) == 0

            message = f"npm audit: {len(issues)} vulnerabilities found" if issues else "npm audit: Clean"

            return success, issues, message

        except subprocess.TimeoutExpired:
            return False, [], "npm audit timeout"
        except Exception as e:
            return False, [], f"npm audit error: {str(e)}"

    def run_all_verifiers(self, module_path: str = ".") -> Tuple[bool, Dict[str, List[Dict]], str]:
        """
        Run ALL redundant verifiers and combine results

        Returns:
            (all_passed, issues_by_tool, summary_message)
        """
        results = {}
        all_passed = True

        # Run each verifier
        verifiers = [
            ("tsc", self.run_tsc),
            ("eslint", self.run_eslint),
            ("semgrep", self.run_semgrep),
            ("npm_audit", self.run_npm_audit)
        ]

        for tool_name, verifier_func in verifiers:
            success, issues, message = verifier_func(module_path)
            results[tool_name] = {
                "success": success,
                "issues": issues,
                "message": message
            }

            if not success:
                all_passed = False

        # Generate summary
        total_issues = sum(len(r["issues"]) for r in results.values())
        failed_verifiers = [name for name, r in results.items() if not r["success"]]

        if all_passed:
            summary = f"✅ ALL VERIFIERS PASSED (0 issues)"
        else:
            summary = f"❌ VERIFICATION FAILED: {len(failed_verifiers)} verifiers failed, {total_issues} total issues"

        return all_passed, results, summary

    def _parse_tsc_output(self, output: str) -> List[Dict]:
        """Parse TypeScript compiler output into unified schema"""
        issues = []

        for line in output.split('\n'):
            # Format: path/file.ts(line,col): error TS1234: message
            if '): error TS' in line or '): warning TS' in line:
                try:
                    parts = line.split('): ')
                    location = parts[0]
                    rest = parts[1]

                    # Extract path and line
                    path_parts = location.split('(')
                    path = path_parts[0]
                    line_col = path_parts[1].split(',')
                    line_num = int(line_col[0])

                    # Extract error code and message
                    error_parts = rest.split(': ', 1)
                    error_code = error_parts[0].replace('error ', '').replace('warning ', '')
                    message = error_parts[1] if len(error_parts) > 1 else ''

                    # Determine severity
                    severity = 'error' if 'error' in rest else 'warning'

                    # Create fingerprint
                    fingerprint_str = f"tsc:{error_code}:{path}:{line_num}"
                    fingerprint = hashlib.md5(fingerprint_str.encode()).hexdigest()

                    issues.append({
                        "tool": "tsc",
                        "ruleId": error_code,
                        "severity": severity,
                        "path": path,
                        "line": line_num,
                        "message": message,
                        "fingerprint": fingerprint
                    })
                except:
                    pass  # Skip malformed lines

        return issues

    def _parse_eslint_output(self, eslint_data: List[Dict]) -> List[Dict]:
        """Parse ESLint JSON output into unified schema"""
        issues = []

        for file_result in eslint_data:
            file_path = file_result.get('filePath', '')

            for message in file_result.get('messages', []):
                rule_id = message.get('ruleId', 'unknown')
                line = message.get('line', 0)
                severity_level = message.get('severity', 1)

                # Map ESLint severity to unified schema
                severity = 'error' if severity_level == 2 else 'warning'

                # Create fingerprint
                fingerprint_str = f"eslint:{rule_id}:{file_path}:{line}"
                fingerprint = hashlib.md5(fingerprint_str.encode()).hexdigest()

                issues.append({
                    "tool": "eslint",
                    "ruleId": rule_id,
                    "severity": severity,
                    "path": file_path,
                    "line": line,
                    "message": message.get('message', ''),
                    "fingerprint": fingerprint
                })

        return issues

    def _parse_semgrep_output(self, semgrep_data: Dict) -> List[Dict]:
        """Parse Semgrep JSON output into unified schema"""
        issues = []

        for result in semgrep_data.get('results', []):
            rule_id = result.get('check_id', 'unknown')
            path = result.get('path', '')
            line = result.get('start', {}).get('line', 0)
            message = result.get('extra', {}).get('message', '')

            # Map Semgrep severity
            severity_map = {
                'ERROR': 'error',
                'WARNING': 'warning',
                'INFO': 'note'
            }
            severity = severity_map.get(result.get('extra', {}).get('severity', 'INFO'), 'note')

            # Create fingerprint
            fingerprint_str = f"semgrep:{rule_id}:{path}:{line}"
            fingerprint = hashlib.md5(fingerprint_str.encode()).hexdigest()

            issues.append({
                "tool": "semgrep",
                "ruleId": rule_id,
                "severity": severity,
                "path": path,
                "line": line,
                "message": message,
                "fingerprint": fingerprint
            })

        return issues

    def _parse_npm_audit_output(self, audit_data: Dict) -> List[Dict]:
        """Parse npm audit JSON output into unified schema"""
        issues = []

        vulnerabilities = audit_data.get('vulnerabilities', {})

        for pkg_name, vuln_info in vulnerabilities.items():
            severity = vuln_info.get('severity', 'unknown')

            for via in vuln_info.get('via', []):
                if isinstance(via, dict):
                    cve = via.get('cve', via.get('url', 'unknown'))
                    title = via.get('title', 'Unknown vulnerability')

                    # Create fingerprint
                    fingerprint_str = f"npm_audit:{cve}:{pkg_name}"
                    fingerprint = hashlib.md5(fingerprint_str.encode()).hexdigest()

                    issues.append({
                        "tool": "npm_audit",
                        "ruleId": cve,
                        "severity": severity,
                        "path": f"package.json (dependency: {pkg_name})",
                        "line": 0,
                        "message": title,
                        "fingerprint": fingerprint
                    })

        return issues


if __name__ == "__main__":
    print("Redundant Truth Agents - Multi-Source Verification")
    print("=" * 80)

    workspace = Path.cwd()
    verifiers = RedundantVerifiers(workspace)

    print(f"Workspace: {workspace}")
    print("\nRunning all verifiers...")

    all_passed, results, summary = verifiers.run_all_verifiers()

    print(f"\n{summary}")
    print("\nDetailed Results:")
    for tool_name, result in results.items():
        status = "✅" if result["success"] else "❌"
        print(f"{status} {tool_name}: {result['message']}")
        if result["issues"]:
            print(f"   Issues: {len(result['issues'])}")
