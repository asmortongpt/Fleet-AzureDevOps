/**
 * Lighthouse Configuration
 * Configures auditing settings, device profiles, throttling, and custom metrics
 */

export default {
  // ============================================================================
  // Settings
  // ============================================================================
  settings: {
    // Number of times to run the audit on each URL
    runs: 3,

    // Simulated throttling settings for mobile (4G)
    throttle: {
      rttMs: 40,
      downlinkThroughputKbps: 10 * 1024,
      uplinkThroughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },

    // Mobile emulation settings
    emulatedFormFactor: 'mobile',

    // Screenshot settings
    screenEmulation: {
      mobile: {
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        mobile: true,
        hasTouch: true,
      },
      desktop: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        mobile: false,
        hasTouch: false,
      },
    },

    // Disable chrome optimizations
    disableStorageReset: false,
    disableFullPageScreenshot: false,

    // Locale settings
    locale: 'en-US',
  },

  // ============================================================================
  // Passes - Data gathering passes
  // ============================================================================
  passes: [
    {
      passName: 'defaultPass',
      recordTrace: true,
      pauseAfterLoadMs: 5000,
      networkQuietThresholdMs: 5000,
      cpuQuietThresholdMs: 5000,
    },
  ],

  // ============================================================================
  // Audits - What to measure
  // ============================================================================
  audits: [
    'metrics',
    'performance-budget',
    'speed-index',
    'screenshot-thumbnails',
    'final-screenshot',
    'accessibility',
    'best-practices',
    'seo',
    'pwa',
    'font-size-audit',
    'image-size-responsive',
    'image-alt-text',
    'label',
    'link-name',
    'unused-css-rules',
    'unused-javascript',
    'modern-javascript-modules',
    'uses-long-cache-ttl',
    'total-byte-weight',
    'uses-optimized-images',
    'uses-webp-images',
    'offscreen-images',
    'render-blocking-resources',
    'unminified-css',
    'unminified-javascript',
    'unsized-images',
    'uses-rel-preconnect',
    'uses-rel-dns-prefetch',
  ],

  // ============================================================================
  // Categories - How to categorize and weight audits
  // ============================================================================
  categories: {
    performance: {
      title: 'Performance',
      description: 'These metrics validate the speed and efficiency of your web page.',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 15, group: 'metrics' },
        { id: 'largest-contentful-paint', weight: 25, group: 'metrics' },
        { id: 'first-input-delay', weight: 15, group: 'metrics' },
        { id: 'cumulative-layout-shift', weight: 15, group: 'metrics' },
        { id: 'total-blocking-time', weight: 25, group: 'metrics' },
        { id: 'speed-index', weight: 5, group: 'metrics' },
      ],
    },

    accessibility: {
      title: 'Accessibility',
      description: 'These checks validate the accessibility of your web page.',
      auditRefs: [
        { id: 'accessibility', weight: 50 },
        { id: 'label', weight: 10 },
        { id: 'image-alt-text', weight: 10 },
        { id: 'link-name', weight: 10 },
        { id: 'font-size-audit', weight: 10 },
      ],
    },

    'best-practices': {
      title: 'Best Practices',
      description: 'These checks highlight common issues related to web and browser best practices.',
      auditRefs: [
        { id: 'best-practices', weight: 40 },
        { id: 'uses-optimized-images', weight: 10 },
        { id: 'uses-webp-images', weight: 10 },
        { id: 'unminified-css', weight: 10 },
        { id: 'unminified-javascript', weight: 10 },
        { id: 'modern-javascript-modules', weight: 10 },
      ],
    },

    seo: {
      title: 'SEO',
      description: 'These checks validate that your page can be indexed and ranked by search engines.',
      auditRefs: [
        { id: 'seo', weight: 100 },
      ],
    },

    pwa: {
      title: 'Progressive Web App',
      description: 'These checks validate that your page can be installed and run as a PWA.',
      auditRefs: [
        { id: 'pwa', weight: 100 },
      ],
    },
  },

  // ============================================================================
  // Performance Budget
  // ============================================================================
  budgets: [
    {
      type: 'bundle',
      resourceSizes: [
        {
          resourceType: 'script',
          budget: 250,
        },
        {
          resourceType: 'style',
          budget: 100,
        },
        {
          resourceType: 'image',
          budget: 500,
        },
        {
          resourceType: 'font',
          budget: 200,
        },
        {
          resourceType: 'document',
          budget: 50,
        },
      ],
    },
    {
      type: 'timing',
      timings: [
        {
          metric: 'first-contentful-paint',
          budget: 2500,
        },
        {
          metric: 'largest-contentful-paint',
          budget: 4000,
        },
        {
          metric: 'cumulative-layout-shift',
          budget: 0.1,
        },
        {
          metric: 'total-blocking-time',
          budget: 300,
        },
      ],
    },
  ],

  // ============================================================================
  // Output Formats
  // ============================================================================
  onlyCategories: [
    'performance',
    'accessibility',
    'best-practices',
    'seo',
    'pwa',
  ],

  // ============================================================================
  // Plugins
  // ============================================================================
  plugins: [],

  // ============================================================================
  // Extended Info
  // ============================================================================
  extendedInfo: {
    // Enable detailed diagnostics
    diagnostics: true,

    // Include all audit properties
    fullyLoadedCheckAuditRefIds: true,
  },

  // ============================================================================
  // Output Settings
  // ============================================================================
  output: ['csv', 'json', 'html'],

  // ============================================================================
  // Chrome Flags
  // ============================================================================
  chromeFlags: [
    '--no-sandbox',
    '--disable-gpu',
    '--headless',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
  ],

  // ============================================================================
  // Request Headers (for API testing)
  // ============================================================================
  requestHeaders: {
    'User-Agent': 'Fleet-CTA-Lighthouse/1.0 (Accessibility Audit)',
    'X-Audit-Purpose': 'performance-analysis',
  },

  // ============================================================================
  // Skip Audits (optional)
  // ============================================================================
  skipAudits: [],

  // ============================================================================
  // Custom Metrics
  // ============================================================================
  metrics: {
    'first-contentful-paint': {
      threshold: 2500,
      label: 'First Contentful Paint',
    },
    'largest-contentful-paint': {
      threshold: 4000,
      label: 'Largest Contentful Paint',
    },
    'cumulative-layout-shift': {
      threshold: 0.1,
      label: 'Cumulative Layout Shift',
    },
    'first-input-delay': {
      threshold: 300,
      label: 'First Input Delay',
    },
    'total-blocking-time': {
      threshold: 300,
      label: 'Total Blocking Time',
    },
    'speed-index': {
      threshold: 4000,
      label: 'Speed Index',
    },
  },
};
