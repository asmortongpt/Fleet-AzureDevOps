# Lighthouse CI Reports Directory

This directory contains Lighthouse CI audit reports and performance metrics.

## Directory Structure

```
.lighthouse/
├── README.md                     # This file
├── desktop/                      # Desktop-specific reports
│   ├── report.json              # JSON report
│   └── report.html              # HTML report (viewable in browser)
├── mobile/                       # Mobile-specific reports
│   ├── report.json              # JSON report
│   └── report.html              # HTML report (viewable in browser)
├── accessibility/               # Accessibility audit results
│   ├── report.json              # axe-core results (JSON)
│   └── headers.md               # Security headers check
├── security/                    # Security headers audit
│   └── headers.md               # Response headers analysis
├── history/                     # Historical tracking
│   ├── metrics-history.csv      # CSV with all historical metrics
│   ├── trends-report.md         # Trend analysis report
│   └── report-YYYY-MM-DD.json   # Daily snapshot
└── report-latest.json          # Latest LHCI report
```

## Quick Start

### View Latest Reports

**Desktop Report:**
1. Download `desktop/report.html` from GitHub Actions artifacts
2. Open in web browser
3. Explore performance opportunities

**Mobile Report:**
1. Download `mobile/report.html` from GitHub Actions artifacts
2. Open in web browser
3. Compare mobile vs desktop performance

**Accessibility Report:**
1. Review `accessibility/report.json` for detailed axe-core findings
2. Check `accessibility/headers.md` for security header validation

### Track Performance Over Time

1. Review `history/trends-report.md` for trend analysis
2. Export `history/metrics-history.csv` for custom analysis
3. Check historical JSON reports: `history/report-YYYY-MM-DD.json`

## Key Metrics

### Lighthouse Scores (0-100)
- **Performance**: Measures speed and efficiency (target: 90+)
- **Accessibility**: WCAG 2.1 compliance (target: 95+)
- **Best Practices**: Web standards adherence (target: 85+)
- **SEO**: Search engine optimization (target: 80+)

### Core Web Vitals
- **LCP**: Largest Contentful Paint (target: < 2.5s)
- **FCP**: First Contentful Paint (target: < 1.8s)
- **CLS**: Cumulative Layout Shift (target: < 0.1)
- **FID**: First Input Delay (target: < 100ms)
- **TBT**: Total Blocking Time (target: < 200ms)

## Workflow Triggers

Reports are generated:
1. On every push to `main` or `develop`
2. On every pull request to `main` or `develop`
3. Daily at 6 AM UTC
4. Manually via GitHub Actions workflow dispatch

## Accessing Reports

### From GitHub Actions

1. Go to GitHub Actions in repository
2. Find "Lighthouse CI" workflow run
3. Scroll to "Artifacts" section
4. Download desired report

### From Git History

```bash
# Check if metrics were committed
git log --oneline -- .lighthouse/history/

# View historical metrics
cat .lighthouse/history/metrics-history.csv

# View trends report
cat .lighthouse/history/trends-report.md
```

## Interpreting Results

### Performance Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | Excellent | Maintain |
| 80-89 | Good | Monitor |
| < 80 | Needs Work | Investigate |

### Core Web Vitals Status

| Metric | Good | Needs Improvement |
|--------|------|-------------------|
| LCP | < 2.5s | > 4.0s |
| FCP | < 1.8s | > 3.0s |
| CLS | < 0.1 | > 0.25 |
| FID | < 100ms | > 300ms |

## Performance Optimization Tips

### Quick Wins
1. Optimize images (use WebP, compress)
2. Remove unused CSS/JavaScript
3. Enable gzip compression
4. Use lazy loading for images

### Medium Effort
1. Implement code splitting
2. Optimize fonts (self-host, subset)
3. Defer non-critical JavaScript
4. Inline critical CSS

### Long Term
1. Redesign heavy components
2. Migrate to lighter libraries
3. Implement service workers
4. Build custom solutions for heavy operations

## Troubleshooting

### High Performance Regression
- Check what changed in the commit
- Profile locally with Chrome DevTools
- Look for added dependencies
- Check for new routes/components

### Accessibility Issues
- Run locally: `npm run test:a11y`
- Use axe DevTools extension
- Test keyboard navigation
- Check color contrast

### Bundle Size Increase
- Run: `npm run build -- --profile`
- Check what was added
- Consider code splitting
- Review dependencies

## Related Documentation

- See `../docs/LIGHTHOUSE_CI_SETUP.md` for comprehensive setup guide
- Check `../CLAUDE.md` for project guidelines
- Review GitHub Actions workflow: `.github/workflows/lighthouse-ci.yml`

## Next Steps

1. Review the latest HTML reports
2. Compare desktop vs mobile scores
3. Check trend analysis for regressions
4. Identify optimization opportunities
5. Create issues for improvements
