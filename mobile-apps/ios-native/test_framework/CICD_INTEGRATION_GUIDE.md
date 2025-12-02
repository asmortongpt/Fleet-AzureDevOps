# CI/CD Integration Guide for UI Completeness Orchestrator

This guide shows you how to integrate the 10-agent UI completeness orchestrator into your CI/CD pipeline for continuous quality analysis.

## Overview

The orchestrator can run in your CI/CD pipeline to:

1. **Pre-merge analysis**: Verify completeness before merging PRs
2. **Deployment gates**: Block deployments if critical gaps found
3. **Regression detection**: Compare specs over time to catch regressions
4. **Documentation**: Auto-generate completeness reports
5. **Test generation**: Create Playwright tests from specs

## Integration Options

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/ui-completeness-check.yml`:

```yaml
name: UI Completeness Analysis

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  analyze:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install openai anthropic  # or your LLM provider
          # No other deps needed - orchestrator is self-contained

      - name: Run UI Completeness Analysis
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          # or ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd mobile-apps/ios-native/test_framework
          python3 - << 'EOF'
          import os
          import json
          from llm_integrations import OpenAIClient
          from ui_completeness_orchestrator import UICompletenessOrchestrator
          from rag_client import InMemoryRAGClient

          # Initialize
          llm = OpenAIClient(api_key=os.getenv('OPENAI_API_KEY'))
          rag = InMemoryRAGClient()

          # TODO: Seed RAG with your codebase data
          # from fleet_ui_completeness_example_v2 import seed_fleet_rag_data
          # seed_fleet_rag_data(rag)

          orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)
          spec = orchestrator.build_completeness_spec('Fleet', os.getenv('BASE_URL'))

          # Save spec
          with open('spec.json', 'w') as f:
              json.dump(spec, f, indent=2)

          # Check for critical issues
          issues = []
          for audit in spec.get('page_audits', []):
              if audit.get('incomplete'):
                  for issue in audit.get('issues', []):
                      if issue['severity'] in ['critical', 'high']:
                          issues.append(f"{audit['page_key']}: {issue['summary']}")

          if issues:
              print("❌ Critical completeness issues found:")
              for issue in issues:
                  print(f"  - {issue}")
              exit(1)
          else:
              print("✅ No critical completeness issues")
          EOF

      - name: Upload spec as artifact
        uses: actions/upload-artifact@v4
        with:
          name: ui-completeness-spec
          path: mobile-apps/ios-native/test_framework/spec.json

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const spec = JSON.parse(fs.readFileSync('mobile-apps/ios-native/test_framework/spec.json', 'utf8'));

            const summary = spec.summary || 'No summary available';
            const metrics = spec.metrics || {};

            const comment = `## UI Completeness Analysis

            ${summary}

            ### Metrics
            - Routes: ${metrics.total_routes || 0}
            - Components: ${metrics.total_components || 0}
            - Coverage: ${metrics.coverage_percentage || 0}%

            [View full spec](../actions/runs/${context.runId})
            `;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: comment
            });
```

### Option 2: Azure DevOps Pipelines

Create `azure-pipelines-ui-completeness.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: UsePythonVersion@0
    inputs:
      versionSpec: '3.11'
    displayName: 'Use Python 3.11'

  - script: |
      pip install openai anthropic
    displayName: 'Install dependencies'

  - script: |
      cd mobile-apps/ios-native/test_framework
      python3 -c "
      import os
      import json
      from llm_integrations import OpenAIClient
      from ui_completeness_orchestrator import UICompletenessOrchestrator
      from rag_client import InMemoryRAGClient

      llm = OpenAIClient(api_key=os.getenv('OPENAI_API_KEY'))
      rag = InMemoryRAGClient()
      orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)
      spec = orchestrator.build_completeness_spec('Fleet')

      with open('$(Build.ArtifactStagingDirectory)/spec.json', 'w') as f:
          json.dump(spec, f, indent=2)

      # Quality gate
      incomplete_pages = [a for a in spec.get('page_audits', []) if a.get('incomplete')]
      if incomplete_pages:
          print(f'⚠️ {len(incomplete_pages)} pages have incomplete functionality')
          for page in incomplete_pages:
              print(f'  - {page[\"page_key\"]}: {len(page.get(\"issues\", []))} issues')
          exit(1)
      "
    env:
      OPENAI_API_KEY: $(OPENAI_API_KEY)
    displayName: 'Run UI Completeness Analysis'

  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: '$(Build.ArtifactStagingDirectory)'
      artifactName: 'ui-completeness-spec'
    displayName: 'Publish completeness spec'
```

### Option 3: GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
ui-completeness:
  stage: test
  image: python:3.11
  before_script:
    - pip install openai anthropic
  script:
    - cd mobile-apps/ios-native/test_framework
    - python3 fleet_ui_completeness_example_v2.py
    - |
      python3 - << 'EOF'
      import json
      with open('fleet_ui_completeness_spec_v2.json') as f:
          spec = json.load(f)

      # Quality gate
      incomplete = sum(1 for a in spec.get('page_audits', []) if a.get('incomplete'))
      print(f"Incomplete pages: {incomplete}")

      if incomplete > 0:
          print("❌ Failed: Incomplete functionality detected")
          exit(1)
      EOF
  artifacts:
    paths:
      - mobile-apps/ios-native/test_framework/fleet_ui_completeness_spec_v2.json
    expire_in: 30 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
```

## Quality Gates

### Example: Completeness Threshold Gate

```python
# quality_gate.py
import json
import sys

with open('fleet_ui_completeness_spec_v2.json') as f:
    spec = json.load(f)

# Define thresholds
MIN_COVERAGE = 80  # Minimum 80% coverage
MAX_CRITICAL_ISSUES = 0  # Zero critical issues allowed
MAX_HIGH_ISSUES = 5  # Max 5 high-severity issues

# Check coverage
metrics = spec.get('metrics', {})
coverage = metrics.get('coverage_percentage', 0)

if coverage < MIN_COVERAGE:
    print(f"❌ Coverage {coverage}% is below threshold {MIN_COVERAGE}%")
    sys.exit(1)

# Count issues by severity
critical = 0
high = 0

for audit in spec.get('page_audits', []):
    for issue in audit.get('issues', []):
        if issue['severity'] == 'critical':
            critical += 1
        elif issue['severity'] == 'high':
            high += 1

if critical > MAX_CRITICAL_ISSUES:
    print(f"❌ {critical} critical issues found (max: {MAX_CRITICAL_ISSUES})")
    sys.exit(1)

if high > MAX_HIGH_ISSUES:
    print(f"❌ {high} high-severity issues found (max: {MAX_HIGH_ISSUES})")
    sys.exit(1)

print(f"✅ Quality gate passed: {coverage}% coverage, {critical} critical, {high} high issues")
```

## Scheduled Analysis

### Daily Regression Check

```yaml
# .github/workflows/nightly-completeness.yml
name: Nightly UI Completeness Check

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      # ... (same as above)

      - name: Compare with baseline
        run: |
          python3 - << 'EOF'
          import json

          # Load current spec
          with open('spec.json') as f:
              current = json.load(f)

          # Load baseline (from previous run)
          try:
              with open('baseline_spec.json') as f:
                  baseline = json.load(f)
          except FileNotFoundError:
              print("No baseline found, saving current as baseline")
              with open('baseline_spec.json', 'w') as f:
                  json.dump(current, f)
              exit(0)

          # Compare
          current_coverage = current.get('metrics', {}).get('coverage_percentage', 0)
          baseline_coverage = baseline.get('metrics', {}).get('coverage_percentage', 0)

          delta = current_coverage - baseline_coverage

          if delta < -5:  # More than 5% regression
              print(f"❌ Coverage regressed by {abs(delta)}%")
              exit(1)
          elif delta > 0:
              print(f"✅ Coverage improved by {delta}%")

          # Update baseline
          with open('baseline_spec.json', 'w') as f:
              json.dump(current, f)
          EOF

      - name: Commit baseline
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add baseline_spec.json
          git commit -m "Update completeness baseline [skip ci]" || true
          git push
```

## Deployment Gates

### Block Deployment on Critical Issues

```yaml
# In your deployment workflow
deploy:
  needs: analyze
  if: success()  # Only deploy if analysis passed
  runs-on: ubuntu-latest
  steps:
    - name: Download spec
      uses: actions/download-artifact@v4
      with:
        name: ui-completeness-spec

    - name: Check deployment readiness
      run: |
        python3 - << 'EOF'
        import json

        with open('spec.json') as f:
            spec = json.load(f)

        # Check deployment verification
        deployment = spec.get('deployment_verification', {})
        synthetics = deployment.get('synthetics', [])

        print(f"Deployment verification: {len(synthetics)} synthetic tests defined")

        # Check for unknowns
        unknowns = spec.get('unknowns', [])
        if unknowns:
            print(f"⚠️  {len(unknowns)} unresolved questions:")
            for unknown in unknowns:
                print(f"  - {unknown['question']}")

        # Allow deployment with warnings
        print("✅ Deployment approved with warnings")
        EOF

    # ... rest of deployment steps
```

## Test Generation Integration

### Auto-generate and Run Playwright Tests

```yaml
generate-tests:
  needs: analyze
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Download spec
      uses: actions/download-artifact@v4
      with:
        name: ui-completeness-spec

    - name: Generate Playwright tests
      run: |
        cd mobile-apps/ios-native/test_framework
        python3 playwright_test_generator.py spec.json

    - name: Install Playwright
      run: |
        npm install --save-dev @playwright/test @axe-core/playwright
        npx playwright install --with-deps

    - name: Run generated tests
      run: |
        cd mobile-apps/ios-native/test_framework/generated_tests
        npx playwright test

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: mobile-apps/ios-native/test_framework/generated_tests/playwright-report/
```

## Best Practices

### 1. Cache LLM Responses

```python
import hashlib
import json
from pathlib import Path

def get_cached_spec(prompt_hash: str) -> dict | None:
    cache_file = Path(f'.cache/spec_{prompt_hash}.json')
    if cache_file.exists():
        with open(cache_file) as f:
            return json.load(f)
    return None

def cache_spec(prompt_hash: str, spec: dict):
    cache_dir = Path('.cache')
    cache_dir.mkdir(exist_ok=True)
    with open(cache_dir / f'spec_{prompt_hash}.json', 'w') as f:
        json.dump(spec, f)

# In your orchestrator:
prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:16]
cached = get_cached_spec(prompt_hash)
if cached:
    return cached

spec = self.llm.complete(prompt)
cache_spec(prompt_hash, spec)
```

### 2. Incremental Analysis

Only analyze changed files:

```python
import subprocess

def get_changed_files():
    """Get files changed since last commit"""
    result = subprocess.run(
        ['git', 'diff', '--name-only', 'HEAD~1', 'HEAD'],
        capture_output=True,
        text=True
    )
    return result.stdout.strip().split('\n')

# Filter RAG documents to only include changed files
changed = get_changed_files()
if changed:
    # Only re-analyze pages affected by changes
    ...
```

### 3. Cost Control

```python
# Limit LLM calls
MAX_DAILY_ANALYSES = 10

def check_rate_limit():
    # Track API usage in Redis/DB
    # Prevent excessive API costs
    ...
```

## Environment Variables

Required secrets in CI:

```bash
OPENAI_API_KEY=sk-...              # OpenAI API key
# OR
ANTHROPIC_API_KEY=sk-ant-...       # Anthropic API key
# OR
AZURE_OPENAI_API_KEY=...           # Azure OpenAI key
AZURE_OPENAI_ENDPOINT=https://...  # Azure endpoint

BASE_URL=https://staging.example.com  # Optional: URL to test
```

## Monitoring & Alerts

### Slack Notification on Regression

```yaml
- name: Notify Slack on regression
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      UI Completeness check failed!
      Coverage dropped or critical issues found.
      View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Summary

The UI completeness orchestrator integrates seamlessly into CI/CD pipelines to provide:

- ✅ Automated completeness analysis
- ✅ Quality gates before deployment
- ✅ Regression detection
- ✅ Automated test generation
- ✅ Documentation generation
- ✅ Security & performance checks

Choose the integration option that matches your CI/CD platform and customize quality gates for your requirements.
