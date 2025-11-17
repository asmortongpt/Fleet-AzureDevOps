# CI/CD Integration Guide

## GitHub Actions Integration

Add this to `.github/workflows/ui-completeness.yml`:

```yaml
name: UI Completeness Check

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  ui-completeness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install anthropic openai
          npm install -g @playwright/test
          playwright install chromium

      - name: Run UI Completeness Analysis
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python mobile-apps/ios-native/test_framework/fleet_ui_completeness_example_v2.py \
            --provider anthropic \
            --generate-tests \
            --output-dir reports

      - name: Run Generated Playwright Tests
        run: |
          cd reports
          npm test:e2e

      - name: Upload Reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: ui-completeness-reports
          path: reports/

      - name: Comment PR with Results
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('reports/ui_completeness_report.json'));
            const body = `## UI Completeness Report

            **Overall Completeness:** ${report.overall_completeness.toFixed(1)}%

            **Findings:**
            - 🔴 Critical: ${report.critical_findings}
            - 🟠 High: ${report.high_findings}
            - 🟡 Medium: ${report.medium_findings}
            - 🟢 Low: ${report.low_findings}

            [View Full Report](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

## Azure DevOps Integration

Add this to `azure-pipelines.yml`:

```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: UsePythonVersion@0
  inputs:
    versionSpec: '3.11'

- script: |
    pip install anthropic openai
    npm install -g @playwright/test
    playwright install chromium
  displayName: 'Install dependencies'

- script: |
    python mobile-apps/ios-native/test_framework/fleet_ui_completeness_example_v2.py \
      --provider anthropic \
      --generate-tests \
      --output-dir $(Build.ArtifactStagingDirectory)/reports
  env:
    ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)
  displayName: 'Run UI Completeness Analysis'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '$(Build.ArtifactStagingDirectory)/reports'
    artifactName: 'ui-completeness-reports'
```

## Local Development

Run analysis locally:

```bash
# Install dependencies
pip install anthropic openai
npm install -g @playwright/test

# Run analysis
python fleet_ui_completeness_example_v2.py --generate-tests

# Run generated tests
cd output
npx playwright test
```
