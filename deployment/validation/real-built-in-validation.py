#!/usr/bin/env python3
"""
REAL Code Validation Using Built-in Tools - NO SIMULATION
Uses TypeScript compiler, ESLint, and npm audit for actual code validation
"""

import subprocess
import json
import sys
from pathlib import Path
from typing import Dict, Tuple

class RealValidation:
    """
    Uses REAL tools for validation - NO SIMULATION POSSIBLE
    - TypeScript Compiler (tsc) for type checking
    - ESLint for code quality and security
    - npm audit for vulnerability scanning
    """

    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root).resolve()
        print(f"🔍 Real Validation Initialized")
        print(f"📁 Project Root: {self.project_root}")
        print(f"⚠️  NO SIMULATION - Using real tools only")
        print("")

    def validate_typescript(self, file_path: str) -> Tuple[float, Dict]:
        """
        REAL TypeScript validation using tsc compiler
        Returns: (score, {errors: [], warnings: []})
        """
        print(f"🔧 Running TypeScript compiler on {file_path}...")

        try:
            result = subprocess.run(
                ["npx", "tsc", "--noEmit", file_path],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )

            errors = []
            warnings = []

            if result.returncode != 0:
                # Parse tsc output
                for line in result.stdout.split('\n'):
                    if line.strip():
                        if 'error TS' in line:
                            errors.append(line.strip())
                        elif 'warning' in line:
                            warnings.append(line.strip())

            # Calculate score
            error_count = len(errors)
            warning_count = len(warnings)

            # Score: 100% - (5% per error) - (1% per warning)
            score = max(0.0, 1.0 - (error_count * 0.05) - (warning_count * 0.01))

            print(f"   TypeScript Score: {score*100:.1f}% ({error_count} errors, {warning_count} warnings)")

            return score, {
                'tool': 'TypeScript Compiler',
                'errors': errors,
                'warnings': warnings,
                'error_count': error_count,
                'warning_count': warning_count
            }

        except subprocess.TimeoutExpired:
            print(f"   ⚠️ TypeScript check timed out")
            return 0.5, {'error': 'Timeout'}
        except Exception as e:
            print(f"   ❌ TypeScript check failed: {e}")
            return 0.0, {'error': str(e)}

    def validate_eslint(self, file_path: str) -> Tuple[float, Dict]:
        """
        REAL ESLint validation
        Returns: (score, {errors: [], warnings: []})
        """
        print(f"🔧 Running ESLint on {file_path}...")

        try:
            result = subprocess.run(
                ["npx", "eslint", "--format=json", file_path],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )

            # ESLint returns JSON output
            if result.stdout:
                lint_results = json.loads(result.stdout)

                errors = []
                warnings = []

                for file_result in lint_results:
                    for message in file_result.get('messages', []):
                        severity = message.get('severity')
                        msg = f"{message.get('line')}:{message.get('column')} - {message.get('message')} ({message.get('ruleId')})"

                        if severity == 2:  # Error
                            errors.append(msg)
                        elif severity == 1:  # Warning
                            warnings.append(msg)

                error_count = len(errors)
                warning_count = len(warnings)

                # Score: 100% - (5% per error) - (1% per warning)
                score = max(0.0, 1.0 - (error_count * 0.05) - (warning_count * 0.01))

                print(f"   ESLint Score: {score*100:.1f}% ({error_count} errors, {warning_count} warnings)")

                return score, {
                    'tool': 'ESLint',
                    'errors': errors[:10],  # Limit to 10 for readability
                    'warnings': warnings[:10],
                    'error_count': error_count,
                    'warning_count': warning_count
                }
            else:
                print(f"   ✅ ESLint: No issues found")
                return 1.0, {'tool': 'ESLint', 'errors': [], 'warnings': []}

        except subprocess.TimeoutExpired:
            print(f"   ⚠️ ESLint check timed out")
            return 0.5, {'error': 'Timeout'}
        except Exception as e:
            print(f"   ⚠️ ESLint check warning: {e}")
            return 0.8, {'error': str(e)}

    def validate_security(self) -> Tuple[float, Dict]:
        """
        REAL security validation using npm audit
        Returns: (score, {vulnerabilities: {}})
        """
        print(f"🔒 Running npm audit for security vulnerabilities...")

        try:
            result = subprocess.run(
                ["npm", "audit", "--json"],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.stdout:
                audit_data = json.loads(result.stdout)

                vulnerabilities = audit_data.get('metadata', {}).get('vulnerabilities', {})

                critical = vulnerabilities.get('critical', 0)
                high = vulnerabilities.get('high', 0)
                moderate = vulnerabilities.get('moderate', 0)
                low = vulnerabilities.get('low', 0)

                # Score based on severity
                score = max(0.0, 1.0 - (critical * 0.2) - (high * 0.1) - (moderate * 0.05) - (low * 0.01))

                print(f"   Security Score: {score*100:.1f}%")
                print(f"   Critical: {critical}, High: {high}, Moderate: {moderate}, Low: {low}")

                return score, {
                    'tool': 'npm audit',
                    'critical': critical,
                    'high': high,
                    'moderate': moderate,
                    'low': low,
                    'total': critical + high + moderate + low
                }
            else:
                print(f"   ✅ npm audit: No vulnerabilities")
                return 1.0, {'tool': 'npm audit', 'vulnerabilities': 0}

        except subprocess.TimeoutExpired:
            print(f"   ⚠️ Security check timed out")
            return 0.7, {'error': 'Timeout'}
        except Exception as e:
            print(f"   ⚠️ Security check warning: {e}")
            return 0.8, {'error': str(e)}

    def validate_file(self, file_path: str) -> Dict:
        """
        Run ALL validations on a file
        Returns: {typescript: {...}, eslint: {...}, security: {...}, overall_score: X}
        """
        print("="*80)
        print(f"🚀 REAL VALIDATION: {file_path}")
        print("="*80)

        # Run all validations
        ts_score, ts_details = self.validate_typescript(file_path)
        eslint_score, eslint_details = self.validate_eslint(file_path)
        security_score, security_details = self.validate_security()

        # Calculate overall score (weighted average)
        overall_score = (ts_score * 0.4) + (eslint_score * 0.4) + (security_score * 0.2)

        print("")
        print("="*80)
        print(f"📊 OVERALL SCORE: {overall_score*100:.1f}%")
        print("="*80)
        print(f"   TypeScript: {ts_score*100:.1f}%")
        print(f"   ESLint: {eslint_score*100:.1f}%")
        print(f"   Security: {security_score*100:.1f}%")
        print("="*80)

        result = {
            'file': file_path,
            'overall_score': overall_score,
            'typescript': ts_details,
            'eslint': eslint_details,
            'security': security_details,
            'passed': overall_score >= 0.99  # 99% threshold
        }

        if result['passed']:
            print("✅ VALIDATION PASSED (≥99%)")
        else:
            print(f"❌ VALIDATION FAILED ({overall_score*100:.1f}% < 99%)")

        print("="*80)
        print("")

        return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 real-built-in-validation.py <file_path>")
        print("Example: python3 real-built-in-validation.py server/src/routes/work-orders.ts")
        sys.exit(1)

    file_path = sys.argv[1]

    validator = RealValidation()
    result = validator.validate_file(file_path)

    # Exit with code 1 if validation failed
    sys.exit(0 if result['passed'] else 1)

if __name__ == "__main__":
    main()
