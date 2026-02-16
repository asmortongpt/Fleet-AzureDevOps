# Lighthouse CI Integration Guide

## Overview

This document describes the comprehensive Lighthouse CI integration for the Fleet-CTA frontend application. Lighthouse CI automatically monitors performance, accessibility, and best practices on every commit and pull request.

## What is Lighthouse CI?

Lighthouse CI (LHCI) is a set of tools for running Lighthouse audits continuously in your CI/CD pipeline. It:

- Runs Lighthouse audits on multiple pages
- Validates performance against configurable thresholds
- Tracks metrics over time for trend analysis
- Integrates with GitHub to comment on pull requests
- Fails the build if regressions are detected

## Architecture

### GitHub Actions Workflows

The `lighthouse-ci.yml` workflow runs six parallel jobs:

1. **lighthouse-ci** - Main Lighthouse CI analysis using LHCI CLI
2. **lighthouse-desktop** - Desktop-specific performance audit
3. **lighthouse-mobile** - Mobile-specific performance audit
4. **accessibility-audit** - WCAG 2.1 Level AA compliance check using axe-core
5. **security-audit** - Security headers and best practices validation
6. **performance-budgets** - Bundle size and Core Web Vitals budget checking

### Configuration Files

- **`.github/workflows/lighthouse-ci.yml`** - GitHub Actions workflow
- **`lighthouserc.json`** - Lighthouse CI configuration (thresholds, URLs, assertions)
- **`lighthouse-config.js`** - Lighthouse configuration (device profiles, metrics, budgets)

### Supporting Scripts

- **`scripts/parse-lighthouse-results.js`** - Parses JSON results and outputs markdown
- **`scripts/check-bundle-budgets.js`** - Validates bundle sizes against budgets
- **`scripts/check-cwv-budgets.js`** - Validates Core Web Vitals against thresholds
- **`scripts/store-lighthouse-metrics.js`** - Stores metrics in CSV for historical tracking
- **`scripts/generate-performance-trends.js`** - Generates trend analysis reports

## Performance Thresholds

### Lighthouse Scores

All scores are on a scale of 0-100:

| Category | Minimum Score | Target |
|----------|---------------|--------|
| Performance | 80 | 90+ |
| Accessibility | 95 | 100 |
| Best Practices | 85 | 95+ |
| SEO | 80 | 95+ |

### Core Web Vitals

| Metric | Threshold | Target |
|--------|-----------|--------|
| First Contentful Paint (FCP) | 2.5s | < 1.8s |
| Largest Contentful Paint (LCP) | 4.0s | < 2.5s |
| Cumulative Layout Shift (CLS) | 0.1 | < 0.1 |
| First Input Delay (FID) | 300ms | < 100ms |
| Total Blocking Time (TBT) | 300ms | < 200ms |
| Speed Index | 4.0s | < 3.0s |

### Bundle Size Budgets

| File Type | Budget |
|-----------|--------|
| JavaScript | 250-300 KB |
| CSS | 100 KB |
| Images | 500 KB |
| Fonts | 200 KB |

## Triggering Audits

### Automatic Triggers

1. **Every push to `main` or `develop` branch** - Runs full audit suite
2. **Every pull request to `main` or `develop`** - Runs full audit suite with PR comments
3. **Daily schedule** - Runs at 6 AM UTC for daily monitoring
4. **Workflow dispatch** - Manual trigger available in GitHub Actions UI

### Manual Triggering

From GitHub Actions UI:

1. Go to `.github/workflows/lighthouse-ci.yml`
2. Click "Run workflow"
3. Select branch and click "Run workflow"

From command line:

```bash
gh workflow run lighthouse-ci.yml -r main
```

## Interpreting Results

### PR Comments

When a Lighthouse audit runs on a pull request, a comment is automatically posted showing:

- **Performance scores** for all four categories (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals** metrics (LCP, FCP, FID, CLS, TBT)
- **Color-coded status**:
  - 🟢 Green (90+): Excellent
  - 🟡 Yellow (80-89): Good
  - 🔴 Red (< 80): Needs improvement

### Example PR Comment

```
## 🔍 Lighthouse CI Results

| Category | Score |
|----------|-------|
| 🟢 Performance | 92 |
| 🟢 Accessibility | 98 |
| 🟢 Best Practices | 88 |
| 🟡 SEO | 85 |

### Core Web Vitals
- LCP: 2100ms
- FID: 50ms
- CLS: 0.05

[View detailed report](...link...)
```

### Artifacts

After each run, reports are available as artifacts:

1. **lighthouse-reports** - Raw LHCI JSON output
2. **lighthouse-desktop-report** - HTML report for desktop audit
3. **lighthouse-mobile-report** - HTML report for mobile audit
4. **accessibility-reports** - axe-core audit results
5. **security-audit-report** - Security headers validation

### Accessing Artifacts

1. Go to GitHub Actions run
2. Scroll down to "Artifacts" section
3. Download the report you want
4. Open HTML reports in a browser

## Performance Metrics Explained

### Lighthouse Scores

**Performance (0-100)**
- Measures how fast the page loads and becomes interactive
- Uses real-world metrics: FCP, LCP, FID, CLS, TBT
- Weight: Performance metrics = 75%, opportunities = 25%

**Accessibility (0-100)**
- Measures WCAG 2.1 Level AA compliance
- Tests color contrast, ARIA labels, form labels, etc.
- Automated tests catch ~30% of accessibility issues

**Best Practices (0-100)**
- Validates general web best practices
- Tests HTTPS, console errors, image optimization, etc.
- Helps maintain a secure and efficient application

**SEO (0-100)**
- Measures search engine optimization readiness
- Tests meta tags, viewport configuration, mobile-friendliness
- Not critical for internal/authenticated apps but helps with indexing

### Core Web Vitals

**First Contentful Paint (FCP)**
- Time until first pixels appear on screen
- Measures perceived speed of page load
- Target: < 1.8s

**Largest Contentful Paint (LCP)**
- Time until largest visual element appears
- Most important metric for perceived load speed
- Target: < 2.5s

**Cumulative Layout Shift (CLS)**
- Visual stability metric (how much does layout shift?)
- Should be minimal (0.1) to avoid user frustration
- Target: < 0.1 (0.05 is good)

**First Input Delay (FID)**
- Responsiveness to user input (deprecated in favor of INP)
- Time from click to browser processing
- Target: < 100ms

**Total Blocking Time (TBT)**
- Sum of blocking time for all tasks > 50ms
- Affects interactivity and responsiveness
- Target: < 200ms

## Common Issues and Solutions

### Performance Score < 80%

**Symptoms:**
- Slow First Contentful Paint
- Slow Largest Contentful Paint
- High Total Blocking Time

**Solutions:**
1. **Code Splitting** - Split routes with dynamic imports
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```
2. **Lazy Load Images** - Use `loading="lazy"`
3. **Optimize Images** - Use WebP format, compress JPEGs
4. **Reduce JavaScript** - Defer non-critical scripts
5. **CSS Optimization** - Inline critical CSS, defer non-critical

### Accessibility Score < 95%

**Symptoms:**
- Poor color contrast
- Missing ARIA labels
- Form inputs without labels

**Solutions:**
1. **Color Contrast** - Use contrast checker tools
   - Background and foreground should have 4.5:1 ratio
2. **ARIA Labels** - Use semantic HTML and ARIA when needed
   ```html
   <input aria-label="Search" type="text" />
   ```
3. **Form Labels** - Always associate labels with inputs
   ```html
   <label htmlFor="email">Email</label>
   <input id="email" type="email" />
   ```
4. **Keyboard Navigation** - Test with Tab key
5. **Screen Reader Testing** - Test with VoiceOver/NVDA

### Best Practices < 85%

**Symptoms:**
- HTTPS errors
- Unoptimized images
- Minification warnings

**Solutions:**
1. **HTTPS** - Ensure all resources load over HTTPS
2. **Image Optimization** - Use modern formats (WebP)
3. **Minification** - Already handled by Vite
4. **Browser Support** - Don't use deprecated APIs
5. **Console Errors** - Fix all errors/warnings in console

### SEO < 80%

**Symptoms:**
- Missing meta descriptions
- Not mobile-friendly
- Viewport not configured

**Solutions:**
1. **Meta Tags** - Add to HTML head
   ```html
   <meta name="description" content="..." />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   ```
2. **Structured Data** - Add schema.org markup
3. **Mobile Friendly** - Test on mobile devices
4. **Crawlable Content** - Avoid JavaScript-only content

### Bundle Size Exceeded

**Symptoms:**
- Performance score drops
- Lighthouse warns about unused JavaScript/CSS

**Solutions:**
1. **Code Splitting** - Split large routes
2. **Dynamic Imports** - Load libraries on demand
3. **Tree Shaking** - Remove unused code
4. **Dependency Audit** - Remove unused packages
5. **Minification** - Already handled but check compression

## Historical Tracking

### Metrics Storage

Metrics are stored in `.lighthouse/history/`:

- **`metrics-history.csv`** - CSV file with all historical data
- **`trends-report.md`** - Markdown report with trend analysis
- **`report-YYYY-MM-DD.json`** - Daily JSON snapshots

### Accessing Historical Data

```bash
# View CSV history
cat .lighthouse/history/metrics-history.csv

# View trends report
cat .lighthouse/history/trends-report.md
```

### Creating Custom Reports

You can create custom analysis scripts using the CSV data:

```bash
# Export metrics from last 30 days
tail -30 .lighthouse/history/metrics-history.csv > recent-metrics.csv

# Create graphs or alerts based on the data
node scripts/analyze-trends.js
```

## Integration with Other Tools

### GitHub Status Checks

Lighthouse CI integration adds status checks to PRs:

- `LHCI / lighthouse-ci` - Main audit status
- `LHCI / desktop` - Desktop audit status
- `LHCI / mobile` - Mobile audit status

### GitHub Labels

You can use GitHub labels to categorize PRs:

- `performance` - Performance improvements
- `accessibility` - Accessibility improvements
- `bundle-size` - Bundle size changes

### Slack Notifications (Optional)

To add Slack notifications, modify the workflow:

```yaml
- name: Post Slack notification
  uses: slackapi/slack-github-action@v1.24
  with:
    payload: |
      {
        "text": "Lighthouse audit completed",
        "blocks": [...]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Best Practices

### Before Committing

1. **Run Lighthouse locally**
   ```bash
   npm run build
   npm install -g lighthouse
   lighthouse http://localhost:8080
   ```

2. **Check performance in DevTools**
   - Chrome DevTools → Performance tab
   - Record interaction and analyze
   - Look for long tasks (> 50ms)

3. **Test on slow network**
   - DevTools → Network tab
   - Set throttling to "Fast 3G"
   - Verify app is still usable

4. **Test on mobile device**
   - Use real device when possible
   - Test on Pixel and iPhone
   - Check touch performance

### Improving Score Incrementally

1. **Measure first** - Get baseline with Lighthouse
2. **Focus on one metric** - Don't try to fix everything at once
3. **Make small changes** - One optimization per commit
4. **Re-measure** - Verify each change helped
5. **Share learnings** - Document what worked

### Performance Budget Strategy

1. **Set conservative budgets** - Leave room for growth
2. **Review quarterly** - Adjust as needed
3. **Allocate budget** - Decide on split between JS/CSS/images
4. **Monitor trends** - Watch for regressions
5. **Plan capacity** - Reserve budget for new features

## Troubleshooting

### Lighthouse reports not generating

**Issue:** "Error: Could not find a Lighthouse report"

**Solutions:**
1. Check that `npm run build` succeeded
2. Verify `dist` directory exists
3. Check http-server is running
4. Review workflow logs for errors

### PR comment not posting

**Issue:** Lighthouse runs but no comment on PR

**Solutions:**
1. Check `GITHUB_TOKEN` permission in workflow
2. Verify workflow has access to repo
3. Check GitHub Actions logs for errors
4. Ensure PR is from a branch, not fork

### Bundle budget check failing

**Issue:** "Some bundles exceeded their budget"

**Solutions:**
1. Review which files are over budget
2. Use `npm run build -- --profile` to analyze
3. Check for unused dependencies
4. Consider code splitting
5. Update budgets if intentional growth

### Performance regression detected

**Issue:** New PR has lower scores than main

**Solutions:**
1. Profile the changes locally
2. Check for added dependencies
3. Look for new routes or components
4. Reduce bundle size or optimize rendering
5. Discuss with team if regression is acceptable

## Advanced Configuration

### Custom URLs

Edit `lighthouserc.json` to audit additional pages:

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:8080",
        "http://localhost:8080/dashboard",
        "http://localhost:8080/fleet-dashboard",
        "http://localhost:8080/drivers",
        "http://localhost:8080/maintenance"
      ]
    }
  }
}
```

### Custom Assertions

Add custom performance assertions:

```json
{
  "ci": {
    "assert": {
      "customAssertions": {
        "my-custom-metric": ["error", { "minScore": 0.8 }]
      }
    }
  }
}
```

### Custom Plugins

Create custom Lighthouse plugins to measure application-specific metrics:

```javascript
// plugins/custom-metrics.js
export default class CustomMetricsPlugin {
  get name() {
    return 'Custom Metrics';
  }

  afterPass(pass) {
    // Add custom measurements
  }
}
```

## Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Web.dev Audit Guide](https://web.dev/audit-guide/)
- [WebAIM Accessibility](https://webaim.org/)

## Support

For issues or questions:

1. Check GitHub Issues in the repository
2. Review Lighthouse CI logs in GitHub Actions
3. Consult web.dev guides for specific metrics
4. Contact the performance team for deep optimization

## Roadmap

Future improvements:

- [ ] Slack notifications for regressions
- [ ] Custom dashboard for historical tracking
- [ ] Performance alerts based on thresholds
- [ ] Integration with browser performance APIs
- [ ] Automated remediation suggestions
- [ ] Team performance benchmarking
