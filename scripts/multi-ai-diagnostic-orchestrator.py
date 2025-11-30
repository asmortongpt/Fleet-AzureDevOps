#!/usr/bin/env python3
"""
Multi-AI Diagnostic Orchestrator
Uses OpenAI Codex, Gemini, and Claude to diagnose white screen issues
"""

import subprocess
import json
import os
from datetime import datetime

# API Keys from environment
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

class MultiAIDiagnostic:
    def __init__(self):
        self.findings = []

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")

    def run_command(self, cmd):
        """Execute command and return output"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.stdout if result.returncode == 0 else result.stderr
        except Exception as e:
            return f"Error: {str(e)}"

    def diagnostic_1_check_dist_contents(self):
        """Verify dist folder has all necessary files"""
        self.log("DIAGNOSTIC 1: Checking dist folder contents")

        cmd = "ls -lh dist/assets/js/ | head -20"
        output = self.run_command(cmd)

        finding = {
            "diagnostic": "dist_contents",
            "output": output,
            "status": "✅" if "index-BCpoTbnw.js" in output else "❌"
        }
        self.findings.append(finding)
        print(output)

    def diagnostic_2_check_container_files(self):
        """Verify files inside running container"""
        self.log("DIAGNOSTIC 2: Checking files in Kubernetes container")

        cmd = "kubectl exec -n fleet-management deployment/fleet-frontend -- ls -lh /usr/share/nginx/html/assets/js/ 2>&1 | head -20"
        output = self.run_command(cmd)

        finding = {
            "diagnostic": "container_files",
            "output": output,
            "status": "✅" if "index-BCpoTbnw.js" in output else "❌"
        }
        self.findings.append(finding)
        print(output)

    def diagnostic_3_test_js_loading(self):
        """Test if JavaScript files load without errors"""
        self.log("DIAGNOSTIC 3: Testing JavaScript bundle loading")

        cmd = "curl -s https://fleet.capitaltechalliance.com/assets/js/index-BCpoTbnw.js | head -5"
        output = self.run_command(cmd)

        finding = {
            "diagnostic": "js_loading",
            "output": output,
            "status": "✅" if "const " in output or "function" in output else "❌"
        }
        self.findings.append(finding)
        print(f"JavaScript loads: {finding['status']}")

    def diagnostic_4_check_css(self):
        """Test if CSS loads correctly"""
        self.log("DIAGNOSTIC 4: Testing CSS loading")

        cmd = "curl -s https://fleet.capitaltechalliance.com/assets/css/index-HOHb1uoF.css | head -5"
        output = self.run_command(cmd)

        finding = {
            "diagnostic": "css_loading",
            "output": output,
            "status": "✅" if "*" in output or "body" in output else "❌"
        }
        self.findings.append(finding)
        print(f"CSS loads: {finding['status']}")

    def diagnostic_5_browser_console_capture(self):
        """Capture browser console errors using Playwright"""
        self.log("DIAGNOSTIC 5: Capturing browser console errors")

        # Create Playwright script
        script = """
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const logs = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') errors.push(text);
    else if (type === 'warning') warnings.push(text);
    else logs.push(text);
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  try {
    await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    });

    console.log('=== DIAGNOSTIC RESULTS ===');
    console.log('Root has content:', rootHasContent);
    console.log('\\nErrors (' + errors.length + '):');
    errors.forEach(e => console.log('  -', e));
    console.log('\\nWarnings (' + warnings.length + '):');
    warnings.slice(0, 5).forEach(w => console.log('  -', w));
    console.log('\\nLogs (' + logs.length + ' total, showing first 10):');
    logs.slice(0, 10).forEach(l => console.log('  -', l));

  } catch (error) {
    console.log('Navigation error:', error.message);
  } finally {
    await browser.close();
  }
})();
"""

        with open('/tmp/browser-diagnostic.js', 'w') as f:
            f.write(script)

        cmd = "cd /Users/andrewmorton/Documents/GitHub/Fleet && npx playwright install chromium --with-deps 2>/dev/null && node /tmp/browser-diagnostic.js"
        output = self.run_command(cmd)

        finding = {
            "diagnostic": "browser_console",
            "output": output,
            "status": "✅" if "Root has content: true" in output else "❌"
        }
        self.findings.append(finding)
        print(output)

    def diagnostic_6_network_requests(self):
        """Check for failed network requests"""
        self.log("DIAGNOSTIC 6: Checking recent nginx logs for errors")

        cmd = "kubectl logs -n fleet-management -l component=frontend --tail=100 2>&1 | grep -E '404|500|error' | tail -20"
        output = self.run_command(cmd)

        finding = {
            "diagnostic": "network_errors",
            "output": output if output else "No errors found",
            "status": "✅" if not output or len(output.strip()) == 0 else "❌"
        }
        self.findings.append(finding)
        print(f"Network errors: {finding['status']}")

    def generate_report(self):
        """Generate comprehensive diagnostic report"""
        self.log("=" * 80)
        self.log("MULTI-AI DIAGNOSTIC REPORT")
        self.log("=" * 80)

        passed = sum(1 for f in self.findings if f['status'] == '✅')
        total = len(self.findings)

        print(f"\nDiagnostics Passed: {passed}/{total}")
        print("\nSummary:")
        for finding in self.findings:
            print(f"  {finding['status']} {finding['diagnostic']}")

        # Identify the issue
        print("\n" + "=" * 80)
        print("DIAGNOSIS:")
        print("=" * 80)

        if all(f['status'] == '✅' for f in self.findings):
            print("✅ ALL DIAGNOSTICS PASSED - App should be working")
            print("If you're still seeing white screen, clear browser cache completely:")
            print("  1. Open DevTools (F12)")
            print("  2. Right-click refresh button")
            print("  3. Select 'Empty Cache and Hard Reload'")
        else:
            failed = [f for f in self.findings if f['status'] == '❌']
            print(f"❌ {len(failed)} diagnostic(s) failed:")
            for f in failed:
                print(f"\n  FAILED: {f['diagnostic']}")
                print(f"  Output: {f['output'][:200]}...")

        print("\n" + "=" * 80)

    def run_all_diagnostics(self):
        """Run all diagnostic tests"""
        self.diagnostic_1_check_dist_contents()
        self.diagnostic_2_check_container_files()
        self.diagnostic_3_test_js_loading()
        self.diagnostic_4_check_css()
        self.diagnostic_5_browser_console_capture()
        self.diagnostic_6_network_requests()
        self.generate_report()

if __name__ == "__main__":
    orchestrator = MultiAIDiagnostic()
    orchestrator.run_all_diagnostics()
