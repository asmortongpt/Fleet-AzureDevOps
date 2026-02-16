# Lighthouse CI Quick Reference

## TL;DR - What You Need to Know

Lighthouse CI automatically runs performance, accessibility, and best practices audits on every commit and PR.

### Workflow Location
`.github/workflows/lighthouse-ci.yml`

### Configuration Files
- `lighthouserc.json` - LHCI settings and thresholds
- `lighthouse-config.js` - Lighthouse metrics configuration

### Supporting Scripts
```
scripts/
├── parse-lighthouse-results.js      # Parse results to markdown
├── check-bundle-budgets.js          # Validate bundle sizes
├── check-cwv-budgets.js             # Validate Core Web Vitals
├── store-lighthouse-metrics.js      # Store historical metrics
└── generate-performance-trends.js   # Generate trend reports
```

## When Audits Run

- ✅ Every push to `main` or `develop`
- ✅ Every pull request to `main` or `develop`
- ✅ Daily at 6 AM UTC
- ✅ Manual trigger in GitHub Actions

## What Gets Audited

### Desktop & Mobile Performance
- **Performance Score** (target: 90+)
- **Accessibility Score** (target: 95+)
- **Best Practices Score** (target: 85+)
- **SEO Score** (target: 80+)

### Core Web Vitals
- LCP (Largest Contentful Paint) - target: < 4.0s
- FCP (First Contentful Paint) - target: < 2.5s
- CLS (Cumulative Layout Shift) - target: < 0.1
- FID (First Input Delay) - target: < 300ms
- TBT (Total Blocking Time) - target: < 300ms
- SI (Speed Index) - target: < 4.0s

### Accessibility (WCAG 2.1 Level AA)
- Color contrast (4.5:1 for normal text)
- ARIA labels and semantic HTML
- Form label associations
- Keyboard navigation
- Screen reader compatibility

### Security
- HTTPS enforcement
- Security headers (CSP, X-Frame-Options, etc.)
- CORS configuration
- No console errors/warnings

### Bundle Sizes
- JavaScript: < 250-300 KB
- CSS: < 100 KB
- Images: < 500 KB
- Fonts: < 200 KB

## How to Read Results

### PR Comments
Automatically posted on every PR with:
- 🟢 Green (90+) = Excellent
- 🟡 Yellow (80-89) = Good
- 🔴 Red (< 80) = Needs improvement

### Reports
Available as GitHub Actions artifacts:
1. `lighthouse-reports` - LHCI JSON output
2. `lighthouse-desktop-report` - HTML desktop report
3. `lighthouse-mobile-report` - HTML mobile report
4. `accessibility-reports` - axe-core findings
5. `security-audit-report` - Headers validation

### Historical Tracking
```
.lighthouse/history/
├── metrics-history.csv      # All metrics in CSV format
├── trends-report.md         # Trend analysis
└── report-YYYY-MM-DD.json   # Daily snapshots
```

## Common Performance Issues

### Performance < 80%
**Fix:**
- Optimize images (use WebP, compress)
- Code split large routes
- Lazy load non-critical scripts
- Defer CSS for below-fold content

### Accessibility < 95%
**Fix:**
- Check color contrast ratios (4.5:1+)
- Add ARIA labels to interactive elements
- Associate form labels with inputs
- Test keyboard navigation (Tab key)

### Bundle Size Exceeded
**Fix:**
- Check `npm ls` for duplicates
- Remove unused dependencies
- Use dynamic imports for large libraries
- Enable tree-shaking in Vite

### CLS > 0.1 (Layout Shift)
**Fix:**
- Specify dimensions for images/videos
- Avoid inserting content above existing
- Use transform instead of position changes
- Preload critical fonts

## Local Testing

### Run Lighthouse locally
```bash
npm run build
npm install -g lighthouse
lighthouse http://localhost:8080
```

### Check bundle size
```bash
npm run build
node scripts/check-bundle-budgets.js
```

### Check Core Web Vitals budgets
```bash
node scripts/check-cwv-budgets.js
```

### Run accessibility tests
```bash
npm run test:a11y
```

## Improving Scores

### Quick Wins (30 mins)
1. Optimize largest images
2. Remove unused CSS
3. Enable gzip compression
4. Fix console errors/warnings

### Medium (1-2 hours)
1. Lazy load off-screen images
2. Defer non-critical JavaScript
3. Inline critical CSS
4. Self-host fonts instead of CDN

### Long term (planning required)
1. Code split large bundles
2. Migrate to lightweight libraries
3. Redesign heavy components
4. Implement service workers

## Performance Budgets

Default budgets (configured in `lighthouse-config.js`):

```javascript
budgets: [
  {
    type: 'bundle',
    resourceSizes: [
      { resourceType: 'script', budget: 250 * 1024 },    // 250 KB
      { resourceType: 'style', budget: 100 * 1024 },     // 100 KB
      { resourceType: 'image', budget: 500 * 1024 },     // 500 KB
      { resourceType: 'font', budget: 200 * 1024 },      // 200 KB
    ]
  },
  {
    type: 'timing',
    timings: [
      { metric: 'first-contentful-paint', budget: 2500 },
      { metric: 'largest-contentful-paint', budget: 4000 },
      { metric: 'cumulative-layout-shift', budget: 0.1 },
      { metric: 'total-blocking-time', budget: 300 },
    ]
  }
]
```

## Useful Commands

```bash
# Build and test locally
npm run build

# Check bundle sizes
node scripts/check-bundle-budgets.js

# Parse latest Lighthouse results
node scripts/parse-lighthouse-results.js

# Generate trend report
node scripts/generate-performance-trends.js

# View historical metrics
cat .lighthouse/history/metrics-history.csv

# View trends
cat .lighthouse/history/trends-report.md

# Run accessibility tests
npm run test:a11y
```

## Files Created

```
.github/workflows/lighthouse-ci.yml              ← Main workflow
lighthouserc.json                               ← LHCI configuration
lighthouse-config.js                           ← Lighthouse settings
scripts/parse-lighthouse-results.js             ← Parse results
scripts/check-bundle-budgets.js                 ← Check bundles
scripts/check-cwv-budgets.js                    ← Check CWV
scripts/store-lighthouse-metrics.js             ← Store metrics
scripts/generate-performance-trends.js          ← Trend analysis
.lighthouse/README.md                           ← Reports directory
docs/LIGHTHOUSE_CI_SETUP.md                     ← Full documentation
LIGHTHOUSE_CI_QUICK_REFERENCE.md                ← This file
```

## Documentation

- **Full Setup Guide**: `docs/LIGHTHOUSE_CI_SETUP.md`
- **Reports Directory**: `.lighthouse/README.md`
- **Project Guidelines**: `CLAUDE.md`

## Troubleshooting

### Reports not generating?
- Check `npm run build` succeeded
- Verify `dist` directory exists
- Check GitHub Actions logs

### PR comment not posting?
- Ensure `GITHUB_TOKEN` has permissions
- Check workflow has repo access
- Review GitHub Actions logs

### Performance regression?
- Profile locally with Chrome DevTools
- Check for added dependencies
- Look for new routes/heavy components
- Review commit diff

### Bundle exceeded?
- Run `npm run build -- --profile`
- Check for unused dependencies
- Use code splitting for large routes
- Consider removing optional features

## Next Steps

1. View the latest workflow run in GitHub Actions
2. Download desktop/mobile HTML reports
3. Review trend report at `.lighthouse/history/trends-report.md`
4. Identify top 3 optimization opportunities
5. Create issues for improvements with performance labels

## Support Resources

- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Web.dev Audit Guide](https://web.dev/audit-guide/)
