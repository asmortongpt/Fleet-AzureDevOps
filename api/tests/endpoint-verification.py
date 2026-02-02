#!/usr/bin/env python3
"""
Fleet Management API Endpoint Verification
Tests all API endpoints across all environments
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple
import csv
from pathlib import Path

# Environment URLs
ENVIRONMENTS = {
    'Production': 'http://68.220.148.2',
    'Staging': 'http://20.161.88.59',
    'Dev': 'http://48.211.228.97'
}

# Endpoint definitions
ENDPOINTS = {
    'System': [
        ('GET', '/api/health', 'Health check endpoint'),
        ('GET', '/api/docs', 'API documentation (Swagger UI)'),
        ('GET', '/api/openapi.json', 'OpenAPI specification'),
    ],
    'Core Fleet Management': [
        ('GET', '/api/vehicles', 'List all vehicles'),
        ('GET', '/api/drivers', 'List all drivers'),
        ('GET', '/api/work-orders', 'List work orders'),
        ('GET', '/api/maintenance-schedules', 'List maintenance schedules'),
        ('GET', '/api/fuel-transactions', 'List fuel transactions'),
        ('GET', '/api/routes', 'List routes'),
    ],
    'Location & Geofencing': [
        ('GET', '/api/geofences', 'List geofences'),
        ('GET', '/api/arcgis-layers', 'List ArcGIS layers'),
        ('GET', '/api/traffic-cameras', 'List traffic cameras'),
    ],
    'Safety & Compliance': [
        ('GET', '/api/inspections', 'List vehicle inspections'),
        ('GET', '/api/damage-reports', 'List damage reports'),
        ('GET', '/api/damage', 'Damage management endpoint'),
        ('GET', '/api/safety-incidents', 'List safety incidents'),
        ('GET', '/api/osha-compliance', 'OSHA compliance records'),
    ],
    'Video & Telematics': [
        ('GET', '/api/video-events', 'List video events'),
        ('GET', '/api/video', 'Video telematics endpoint'),
        ('GET', '/api/telemetry', 'Telemetry data'),
        ('GET', '/api/telematics', 'Telematics data'),
    ],
    'EV & Charging': [
        ('GET', '/api/charging-stations', 'List charging stations'),
        ('GET', '/api/charging-sessions', 'List charging sessions'),
        ('GET', '/api/ev', 'EV management endpoint'),
    ],
    'Procurement & Vendors': [
        ('GET', '/api/purchase-orders', 'List purchase orders'),
        ('GET', '/api/facilities', 'List facilities'),
        ('GET', '/api/vendors', 'List vendors'),
    ],
    'Communications & Policies': [
        ('GET', '/api/communication-logs', 'Communication logs'),
        ('GET', '/api/communications', 'Communications management'),
        ('GET', '/api/policies', 'List policies'),
        ('GET', '/api/policy-templates', 'Policy templates'),
        ('GET', '/api/documents', 'Document management'),
    ],
    'Personal Use & Billing': [
        ('GET', '/api/mileage-reimbursement', 'Mileage reimbursement'),
        ('GET', '/api/trip-usage', 'Trip usage tracking'),
        ('GET', '/api/personal-use-policies', 'Personal use policies'),
        ('GET', '/api/personal-use-charges', 'Personal use charges'),
        ('GET', '/api/billing-reports', 'Billing reports'),
    ],
    'Dispatch & Routing': [
        ('GET', '/api/dispatch', 'Dispatch management'),
        ('GET', '/api/route-optimization', 'Route optimization'),
    ],
    'Mobile & Emulator': [
        ('GET', '/api/mobile', 'Mobile integration'),
        ('GET', '/api/emulator', 'Emulator endpoints'),
    ],
    'DevOps & Quality': [
        ('GET', '/api/quality-gates', 'Quality gate checks'),
        ('GET', '/api/deployments', 'Deployment tracking'),
    ],
    'External Integrations': [
        ('GET', '/api/smartcar', 'Smartcar integration'),
    ],
}


class EndpointTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0

    def test_endpoint(self, method: str, endpoint: str, base_url: str, timeout: int = 10) -> Tuple[int, float, str]:
        """Test a single endpoint and return status code, response time, and any notes"""
        url = f"{base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            start_time = time.time()

            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json={}, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json={}, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                return 0, 0, f"Unknown method: {method}"

            elapsed = (time.time() - start_time) * 1000  # Convert to ms

            # Check for specific response patterns
            notes = ""
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        notes = f"Returned {len(data)} items"
                    elif isinstance(data, dict):
                        notes = f"Returned object with {len(data)} keys"
                except:
                    notes = "Non-JSON response"
            elif response.status_code == 401:
                notes = "Authentication required"
            elif response.status_code == 404:
                notes = "Endpoint not found"
            elif response.status_code == 500:
                notes = "Internal server error"

            return response.status_code, elapsed, notes

        except requests.exceptions.Timeout:
            return 0, timeout * 1000, "Timeout"
        except requests.exceptions.ConnectionError:
            return 0, 0, "Connection error"
        except Exception as e:
            return 0, 0, f"Error: {str(e)[:50]}"

    def test_all_endpoints(self):
        """Test all endpoints across all environments"""
        print("\n" + "="*80)
        print("Fleet Management API Endpoint Verification")
        print("="*80)
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Production:  {ENVIRONMENTS['Production']}")
        print(f"Staging:     {ENVIRONMENTS['Staging']}")
        print(f"Dev:         {ENVIRONMENTS['Dev']}")
        print("="*80 + "\n")

        for category, endpoints in ENDPOINTS.items():
            print(f"\n=== {category.upper()} ===\n")

            for method, endpoint, description in endpoints:
                self.total_tests += 1
                print(f"Testing: {method} {endpoint}")
                print(f"  Description: {description}")

                results = {}
                any_success = False

                for env_name, base_url in ENVIRONMENTS.items():
                    status, elapsed, notes = self.test_endpoint(method, endpoint, base_url)
                    results[env_name] = {'status': status, 'time': elapsed, 'notes': notes}

                    # Determine status indicator
                    if 200 <= status < 300:
                        indicator = "✓"
                        color = "\033[92m"  # Green
                        any_success = True
                    elif status == 401 or status == 403:
                        indicator = "○"
                        color = "\033[93m"  # Yellow
                    elif status > 0:
                        indicator = "✗"
                        color = "\033[91m"  # Red
                    else:
                        indicator = "✗"
                        color = "\033[91m"  # Red

                    print(f"  {env_name:12} {color}{indicator}\033[0m {status:3d} ({elapsed:6.0f}ms) {notes}")

                # Store results
                self.results.append({
                    'category': category,
                    'method': method,
                    'endpoint': endpoint,
                    'description': description,
                    **results
                })

                if any_success:
                    self.passed_tests += 1
                else:
                    self.failed_tests += 1

    def save_results(self, output_dir: str = './test-results'):
        """Save results to CSV and JSON files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_path = Path(output_dir) / timestamp
        output_path.mkdir(parents=True, exist_ok=True)

        # Save CSV
        csv_file = output_path / 'endpoint-results.csv'
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Category', 'Method', 'Endpoint', 'Description',
                'Prod Status', 'Prod Time (ms)', 'Prod Notes',
                'Staging Status', 'Staging Time (ms)', 'Staging Notes',
                'Dev Status', 'Dev Time (ms)', 'Dev Notes'
            ])

            for result in self.results:
                writer.writerow([
                    result['category'],
                    result['method'],
                    result['endpoint'],
                    result['description'],
                    result['Production']['status'],
                    f"{result['Production']['time']:.0f}",
                    result['Production']['notes'],
                    result['Staging']['status'],
                    f"{result['Staging']['time']:.0f}",
                    result['Staging']['notes'],
                    result['Dev']['status'],
                    f"{result['Dev']['time']:.0f}",
                    result['Dev']['notes'],
                ])

        # Save JSON
        json_file = output_path / 'endpoint-results.json'
        with open(json_file, 'w') as f:
            json.dump({
                'timestamp': timestamp,
                'environments': ENVIRONMENTS,
                'summary': {
                    'total_tests': self.total_tests,
                    'passed': self.passed_tests,
                    'failed': self.failed_tests,
                    'success_rate': (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
                },
                'results': self.results
            }, f, indent=2)

        # Save HTML report
        self.save_html_report(output_path)

        return output_path

    def save_html_report(self, output_path: Path):
        """Generate an HTML report"""
        html_file = output_path / 'report.html'

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>API Endpoint Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
        .summary {{ background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .stats {{ display: flex; gap: 20px; margin-top: 20px; }}
        .stat {{ flex: 1; background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }}
        .stat-value {{ font-size: 32px; font-weight: bold; color: #2c3e50; }}
        .stat-label {{ color: #7f8c8d; margin-top: 5px; }}
        table {{ width: 100%; background: white; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        th {{ background: #34495e; color: white; padding: 12px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #ecf0f1; font-size: 14px; }}
        tr:hover {{ background: #f8f9fa; }}
        .status-2xx {{ color: #27ae60; font-weight: bold; }}
        .status-4xx {{ color: #f39c12; font-weight: bold; }}
        .status-5xx {{ color: #e74c3c; font-weight: bold; }}
        .status-error {{ color: #95a5a6; font-weight: bold; }}
        .endpoint {{ font-family: monospace; color: #2980b9; }}
        .category {{ background: #3498db; color: white; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Fleet Management API Test Report</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <div class="summary">
        <h2>Test Summary</h2>
        <div class="stats">
            <div class="stat">
                <div class="stat-value">{self.total_tests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #27ae60;">{self.passed_tests}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #e74c3c;">{self.failed_tests}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value">{(self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0:.1f}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Production</th>
                <th>Staging</th>
                <th>Dev</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
"""

        current_category = None
        for result in self.results:
            if current_category != result['category']:
                current_category = result['category']
                html_content += f"""
            <tr class="category">
                <td colspan="7">{result['category']}</td>
            </tr>
"""

            # Determine status classes
            def get_status_class(status):
                if 200 <= status < 300:
                    return 'status-2xx'
                elif 400 <= status < 500:
                    return 'status-4xx'
                elif 500 <= status < 600:
                    return 'status-5xx'
                else:
                    return 'status-error'

            html_content += f"""
            <tr>
                <td></td>
                <td class="endpoint">{result['endpoint']}</td>
                <td>{result['method']}</td>
                <td class="{get_status_class(result['Production']['status'])}">{result['Production']['status']} ({result['Production']['time']:.0f}ms)</td>
                <td class="{get_status_class(result['Staging']['status'])}">{result['Staging']['status']} ({result['Staging']['time']:.0f}ms)</td>
                <td class="{get_status_class(result['Dev']['status'])}">{result['Dev']['status']} ({result['Dev']['time']:.0f}ms)</td>
                <td>{result['description']}</td>
            </tr>
"""

        html_content += """
        </tbody>
    </table>
</body>
</html>
"""

        with open(html_file, 'w') as f:
            f.write(html_content)

    def print_summary(self, output_path: Path):
        """Print test summary"""
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Total Tests:   {self.total_tests}")
        print(f"Passed:        \033[92m{self.passed_tests}\033[0m")
        print(f"Failed:        \033[91m{self.failed_tests}\033[0m")
        print(f"Success Rate:  {(self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0:.1f}%")
        print()
        print("Results saved to:")
        print(f"  - CSV Report:  {output_path / 'endpoint-results.csv'}")
        print(f"  - JSON Report: {output_path / 'endpoint-results.json'}")
        print(f"  - HTML Report: {output_path / 'report.html'}")
        print("="*80 + "\n")


def main():
    tester = EndpointTester()
    tester.test_all_endpoints()
    output_path = tester.save_results()
    tester.print_summary(output_path)

    # Print recommendations
    print("\n" + "="*80)
    print("RECOMMENDATIONS")
    print("="*80)

    # Check which environments are responding
    env_status = {env: 0 for env in ENVIRONMENTS.keys()}
    for result in tester.results:
        for env in ENVIRONMENTS.keys():
            if 200 <= result[env]['status'] < 300:
                env_status[env] += 1

    for env, count in env_status.items():
        if count == 0:
            print(f"⚠️  {env}: No endpoints responding - check if service is running")
        elif count < tester.total_tests * 0.5:
            print(f"⚠️  {env}: Only {count}/{tester.total_tests} endpoints working - investigate issues")
        else:
            print(f"✓  {env}: {count}/{tester.total_tests} endpoints working")

    print("="*80 + "\n")


if __name__ == '__main__':
    main()
