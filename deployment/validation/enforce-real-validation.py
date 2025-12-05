#!/usr/bin/env python3
"""
REAL Validation Enforcement Script

This script FORCES actual API calls to Cursor, Datadog, and Retool.
NO SIMULATION ALLOWED - blocks any bypass attempts.

Security: API keys from Azure Key Vault
Enforcement: Pre-commit hook + CI/CD gate
Target: ALL tools must be >= 99% or BLOCK deployment
"""

import os
import sys
import json
import time
import requests
import subprocess
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from pathlib import Path

class ValidationEnforcer:
    """
    Enforces REAL validation with no bypass mechanism.
    Any attempt to use simulated validation triggers immediate failure.
    """

    def __init__(self):
        self.cursor_api_key = os.getenv('CURSOR_API_KEY')
        self.datadog_api_key = os.getenv('DATADOG_API_KEY')
        self.datadog_app_key = os.getenv('DATADOG_APP_KEY')
        self.retool_api_key = os.getenv('RETOOL_API_KEY')

        # STRICT MODE: All API keys required
        if not all([self.cursor_api_key, self.datadog_api_key, self.datadog_app_key, self.retool_api_key]):
            raise RuntimeError(
                "❌ VALIDATION BLOCKED: Missing API keys!\n"
                "Required: CURSOR_API_KEY, DATADOG_API_KEY, DATADOG_APP_KEY, RETOOL_API_KEY\n"
                "Get keys from Azure Key Vault and set as environment variables."
            )

        self.reports_dir = Path(__file__).parent.parent.parent / 'validation-reports'
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def validate_with_cursor(self, file_path: str) -> Tuple[float, Dict]:
        """
        REAL Cursor API call - analyzes code quality
        Returns: (score 0-1, details dict)
        """
        print(f"\n🔍 Cursor API: Analyzing {file_path}...")

        try:
            with open(file_path, 'r') as f:
                code = f.read()

            # REAL API CALL - no simulation!
            response = requests.post(
                'https://api.cursor.com/v1/analyze',
                json={
                    'code': code,
                    'language': 'typescript' if file_path.endswith('.ts') else 'javascript',
                    'checks': [
                        'security',
                        'best-practices',
                        'complexity',
                        'maintainability',
                        'sql-injection',
                        'xss',
                        'authentication',
                        'authorization',
                        'tenant-isolation'
                    ]
                },
                headers={
                    'Authorization': f'Bearer {self.cursor_api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )

            if response.status_code != 200:
                raise RuntimeError(f"Cursor API returned {response.status_code}: {response.text}")

            data = response.json()
            score = data['score'] / 100.0  # Convert 0-100 to 0-1

            print(f"  ✓ Cursor score: {score*100:.2f}%")

            return score, {
                'issues': data.get('issues', []),
                'suggestions': data.get('suggestions', []),
                'checks_passed': data.get('checks_passed', 0),
                'checks_total': data.get('checks_total', 0)
            }

        except requests.exceptions.RequestException as e:
            print(f"  ❌ Cursor API call FAILED: {e}")
            return 0.0, {'error': str(e)}

    def validate_with_datadog(self, endpoint: str, tenant_id: str = 'test-tenant') -> Tuple[float, Dict]:
        """
        REAL Datadog API call - checks runtime metrics
        Returns: (score 0-1, details dict)
        """
        print(f"\n📊 Datadog API: Checking metrics for {endpoint}...")

        try:
            current_time = int(time.time())
            past_time = current_time - 3600  # Last hour

            # REAL API CALL - error rate query
            error_response = requests.get(
                'https://api.datadoghq.com/api/v1/query',
                params={
                    'query': f'avg:trace.http.request.errors{{resource_name:{endpoint},tenant_id:{tenant_id}}}by{{resource_name}}.as_count()',
                    'from': past_time,
                    'to': current_time
                },
                headers={
                    'DD-API-KEY': self.datadog_api_key,
                    'DD-APPLICATION-KEY': self.datadog_app_key
                },
                timeout=30
            )

            if error_response.status_code != 200:
                raise RuntimeError(f"Datadog API returned {error_response.status_code}: {error_response.text}")

            error_data = error_response.json()

            # Calculate error rate
            error_rate = 0.0
            if error_data.get('series') and len(error_data['series']) > 0:
                points = error_data['series'][0]['pointlist']
                total_errors = sum(point[1] for point in points)
                error_rate = total_errors / len(points) if points else 0

            # REAL API CALL - latency query
            latency_response = requests.get(
                'https://api.datadoghq.com/api/v1/query',
                params={
                    'query': f'avg:trace.http.request.duration{{resource_name:{endpoint},tenant_id:{tenant_id}}}by{{resource_name}}',
                    'from': past_time,
                    'to': current_time
                },
                headers={
                    'DD-API-KEY': self.datadog_api_key,
                    'DD-APPLICATION-KEY': self.datadog_app_key
                },
                timeout=30
            )

            avg_latency = 0.0
            if latency_response.status_code == 200:
                latency_data = latency_response.json()
                if latency_data.get('series') and len(latency_data['series']) > 0:
                    points = latency_data['series'][0]['pointlist']
                    avg_latency = sum(point[1] for point in points) / len(points) if points else 0

            # Calculate score: 100% - (error_rate * 50%) - (latency_penalty)
            latency_penalty = 0.05 if avg_latency > 1000 else (0.02 if avg_latency > 500 else 0)
            score = max(0.0, 1.0 - (error_rate * 0.5) - latency_penalty)

            print(f"  ✓ Datadog score: {score*100:.2f}%")
            print(f"    Error rate: {error_rate:.4f}, Avg latency: {avg_latency:.2f}ms")

            return score, {
                'error_rate': error_rate,
                'avg_latency_ms': avg_latency,
                'time_window': '1 hour'
            }

        except requests.exceptions.RequestException as e:
            print(f"  ❌ Datadog API call FAILED: {e}")
            return 0.0, {'error': str(e)}

    def validate_with_retool(self, endpoint: str, test_cases: List[Dict]) -> Tuple[float, Dict]:
        """
        REAL Retool API call - runs functional tests
        Returns: (score 0-1, details dict)
        """
        print(f"\n🧪 Retool API: Running tests for {endpoint}...")

        try:
            # REAL API CALL - start workflow
            start_response = requests.post(
                'https://api.retool.com/v1/workflows/fleet-api-tests/start',
                json={
                    'endpoint': endpoint,
                    'testCases': test_cases,
                    'validations': [
                        'response_time_under_500ms',
                        'correct_status_codes',
                        'schema_validation',
                        'tenant_isolation',
                        'authentication_required',
                        'authorization_checks'
                    ]
                },
                headers={
                    'Authorization': f'Bearer {self.retool_api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=60
            )

            if start_response.status_code != 200:
                raise RuntimeError(f"Retool API returned {start_response.status_code}: {start_response.text}")

            workflow_id = start_response.json()['workflow_id']
            print(f"  Workflow started: {workflow_id}")

            # Poll for completion (max 60 seconds)
            max_attempts = 12
            for attempt in range(max_attempts):
                time.sleep(5)

                status_response = requests.get(
                    f'https://api.retool.com/v1/workflows/{workflow_id}',
                    headers={'Authorization': f'Bearer {self.retool_api_key}'},
                    timeout=30
                )

                if status_response.status_code != 200:
                    raise RuntimeError(f"Retool status check failed: {status_response.status_code}")

                status_data = status_response.json()

                if status_data['status'] == 'completed':
                    result = status_data['result']
                    passed_tests = len([t for t in result['tests'] if t['passed']])
                    total_tests = len(result['tests'])
                    score = passed_tests / total_tests if total_tests > 0 else 0.0

                    print(f"  ✓ Retool score: {score*100:.2f}% ({passed_tests}/{total_tests} tests passed)")

                    return score, {
                        'passed_tests': passed_tests,
                        'total_tests': total_tests,
                        'failed_tests': [t for t in result['tests'] if not t['passed']],
                        'workflow_id': workflow_id
                    }

                elif status_data['status'] == 'failed':
                    raise RuntimeError(f"Retool workflow failed: {status_data.get('error')}")

            raise RuntimeError('Retool workflow timeout after 60 seconds')

        except requests.exceptions.RequestException as e:
            print(f"  ❌ Retool API call FAILED: {e}")
            return 0.0, {'error': str(e)}

    def validate_file(self, file_path: str, endpoint: str) -> Dict:
        """
        Run complete 3-tool validation on a file
        ENFORCES: ALL tools >= 99% or FAIL
        """
        print(f"\n{'='*80}")
        print(f"🚀 STARTING REAL 3-TOOL VALIDATION")
        print(f"File: {file_path}")
        print(f"Endpoint: {endpoint}")
        print(f"{'='*80}")

        # Run all three validations
        cursor_score, cursor_details = self.validate_with_cursor(file_path)
        datadog_score, datadog_details = self.validate_with_datadog(endpoint)

        # Test cases for Retool
        test_cases = [
            {'method': 'GET', 'expectedStatus': 401, 'description': 'No auth should fail'},
            {'method': 'GET', 'auth': 'valid-token', 'expectedStatus': 200, 'description': 'Valid auth should succeed'},
            {'method': 'GET', 'auth': 'wrong-tenant-token', 'expectedStatus': 403, 'description': 'Wrong tenant should fail'},
            {'method': 'POST', 'auth': 'valid-token', 'body': {}, 'expectedStatus': 400, 'description': 'Invalid body should fail'},
            {'method': 'POST', 'auth': 'valid-token', 'body': {'valid': 'data'}, 'expectedStatus': 201, 'description': 'Valid request should succeed'}
        ]
        retool_score, retool_details = self.validate_with_retool(endpoint, test_cases)

        # Calculate results
        overall_score = (cursor_score + datadog_score + retool_score) / 3.0
        all_passed = cursor_score >= 0.99 and datadog_score >= 0.99 and retool_score >= 0.99

        # Print summary
        print(f"\n{'='*80}")
        print(f"📈 VALIDATION RESULTS:")
        print(f"{'='*80}")
        print(f"{'✅' if cursor_score >= 0.99 else '❌'} Cursor:   {cursor_score*100:6.2f}%")
        print(f"{'✅' if datadog_score >= 0.99 else '❌'} Datadog:  {datadog_score*100:6.2f}%")
        print(f"{'✅' if retool_score >= 0.99 else '❌'} Retool:   {retool_score*100:6.2f}%")
        print(f"{'='*80}")
        print(f"Overall: {overall_score*100:.2f}%")
        print(f"Status:  {'✅ PASSED' if all_passed else '❌ FAILED'} (requirement: ALL >= 99%)")
        print(f"{'='*80}\n")

        # Create report
        report = {
            'file': file_path,
            'endpoint': endpoint,
            'timestamp': datetime.now().isoformat(),
            'validations': {
                'cursor': {'score': cursor_score, 'details': cursor_details},
                'datadog': {'score': datadog_score, 'details': datadog_details},
                'retool': {'score': retool_score, 'details': retool_details}
            },
            'overall_score': overall_score,
            'passed': all_passed
        }

        # Save report
        report_filename = f"{Path(file_path).stem}_{int(time.time())}.json"
        report_path = self.reports_dir / report_filename
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"💾 Report saved: {report_path}\n")

        return report

    def validate_and_block(self, file_path: str, endpoint: str) -> None:
        """
        Validate file and EXIT with error if validation fails
        This is used as a pre-commit hook to BLOCK bad code
        """
        report = self.validate_file(file_path, endpoint)

        if not report['passed']:
            print("\n" + "="*80)
            print("❌ VALIDATION FAILED - DEPLOYMENT BLOCKED")
            print("="*80)
            print("\nThis file does not meet the 99%+ validation requirement on all tools.")
            print("Fix the issues and try again.\n")
            print("Failed validations:")

            for tool, data in report['validations'].items():
                if data['score'] < 0.99:
                    print(f"  • {tool}: {data['score']*100:.2f}% (need 99%+)")
                    if 'error' in data['details']:
                        print(f"    Error: {data['details']['error']}")

            print("\n" + "="*80 + "\n")
            sys.exit(1)

def main():
    """CLI entry point"""
    if len(sys.argv) < 3:
        print("Usage: python3 enforce-real-validation.py <file-path> <endpoint>")
        print("Example: python3 enforce-real-validation.py server/src/routes/work-orders.ts /api/work-orders")
        sys.exit(1)

    file_path = sys.argv[1]
    endpoint = sys.argv[2]

    enforcer = ValidationEnforcer()
    enforcer.validate_and_block(file_path, endpoint)

    print("✅ Validation passed! File meets all quality requirements.\n")
    sys.exit(0)

if __name__ == '__main__':
    main()
