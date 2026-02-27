/**
 * Percy Configuration for Visual Regression Testing
 *
 * Percy.io provides cloud-based visual regression testing with:
 * - Automatic diffing across snapshots
 * - Historical baselines
 * - Parallel test execution
 * - GitHub integration with PR comments
 * - Team collaboration features
 *
 * Setup:
 * 1. npm install -D @percy/cli @percy/playwright
 * 2. Set PERCY_TOKEN in GitHub Secrets (from percy.io)
 * 3. Run: npx percy exec -- npx playwright test
 */

module.exports = {
  // Project settings
  project: {
    name: 'Fleet-CTA',
    staticDir: './dist',
  },

  // Discovery settings for crawling
  discovery: {
    network: {
      stripQueryString: false,
    },
  },

  // Snapshot settings
  snapshot: {
    // Widths to test (responsive design)
    widths: [375, 768, 1920],

    // Minimum height for viewport
    minHeight: 1024,

    // Additional CSS to apply to page
    additionalStyleSheet: '',

    // JavaScript to execute before snapshot
    additionalJs: `
      // Wait for animations to complete
      document.body.style.animation = 'none';
      document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none';
        el.style.transition = 'none';
      });
    `,
  },

  // Approval settings
  approval: {
    // Percentage threshold for approval
    threshold: 0.5,

    // Auto-approve changes from specific users
    autoApprove: false,

    // LSIF results for code coverage
    lsif: false,
  },

  // Upload settings
  uploadSettings: {
    // API URL
    url: 'https://percy.io',

    // Timeout for uploads
    timeout: 120000,
  },

  // Comparison settings
  comparison: {
    // Percentage threshold for warnings
    threshold: 1,

    // Create new snapshots without comparison
    newSnapshots: true,
  },

  // Versioning
  version: '1.0.0',

  // Placeholder for static site testing
  static: {
    // Base URL for static site
    baseUrl: 'http://localhost:5173',

    // Files to crawl
    include: '/**/*.html',

    // Files to ignore
    exclude: '/admin/**',

    // Cleanup patterns
    cleanUrls: true,
  },

  // Browser settings
  browsers: {
    chrome: {
      widths: [1920],
    },
    firefox: {
      widths: [1920],
    },
    webkit: {
      widths: [375],
    },
  },

  // Environment-specific settings
  development: {
    baseUrl: 'http://localhost:5173',
  },

  staging: {
    baseUrl: process.env.STAGING_URL || 'https://staging.fleet-cta.dev',
  },

  production: {
    baseUrl: 'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
  },
}
