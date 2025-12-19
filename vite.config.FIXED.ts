import { resolve } from 'path'

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, PluginOption } from "vite";
import { cjsInterop } from 'vite-plugin-cjs-interop'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

/**
 * Inject runtime-config.js script tag
 * This ensures the runtime configuration is loaded before the main app
 * CRITICAL: Required for production deployment
 */
function injectRuntimeConfig(): PluginOption {
  return {
    name: 'inject-runtime-config',
    enforce: 'post',
    transformIndexHtml(html) {
      // Ensure runtime-config.js is loaded before the main app
      // This file is created at container startup with actual environment values
      // CRITICAL: Use absolute path (/) for Kubernetes/production deployment
      return html.replace(
        '<div id="root"></div>',
        '<div id="root"></div>\n    <script src="/runtime-config.js"></script>'
      );
    },
  };
}

/**
 * Fix module preload order to ensure React loads before libraries that depend on it
 * CRITICAL FIX: Prevents "Cannot read properties of undefined (reading 'useLayoutEffect')" error
 *
 * The issue: @floating-ui/react uses React hooks at module initialization time, but Vite's
 * default preload order loads vendor chunks before react-vendor, causing undefined errors.
 *
 * This plugin reorders modulepreload links to ensure correct dependency order:
 * 1. react-vendor (React core)
 * 2. react-utils (libraries that use React at module level like @floating-ui)
 * 3. vendor (other third-party libraries)
 */
function fixModulePreloadOrder(): PluginOption {
  return {
    name: 'fix-module-preload-order',
    enforce: 'post',
    transformIndexHtml(html) {
      // Extract all modulepreload link tags
      const preloadRegex = /<link rel="modulepreload"[^>]*>/g;
      const preloads = html.match(preloadRegex) || [];

      // Separate React-dependent chunks that MUST load after React
      const reactVendorPreloads = preloads.filter(link => link.includes('react-vendor'));
      const reactUtilsPreloads = preloads.filter(link => link.includes('react-utils'));
      const vendorPreloads = preloads.filter(link => link.includes('vendor') && !link.includes('react-vendor'));
      const otherPreloads = preloads.filter(link =>
        !link.includes('vendor') && !link.includes('react-utils')
      );

      // Remove all modulepreload links from HTML
      let newHtml = html.replace(preloadRegex, '');

      // Re-insert in correct order: react-vendor -> react-utils -> vendor -> others
      const orderedPreloads = [
        ...reactVendorPreloads,  // React MUST load first
        ...reactUtilsPreloads,   // Then React-dependent utilities like @floating-ui
        ...vendorPreloads,       // Then general vendor code
        ...otherPreloads         // Then everything else
      ].join('\n  ');

      // CRITICAL FIX: Insert modulepreloads BEFORE the main script tag
      // The browser needs to see modulepreload hints BEFORE it starts executing the script
      // This regex matches both self-closing <script /> and <script></script> patterns
      const scriptTagRegex = /<script type="module"[^>]*(?:crossorigin[^>]*)?(?:src="[^"]*")?[^>]*>/;
      const mainScriptMatch = newHtml.match(scriptTagRegex);

      if (mainScriptMatch) {
        // Insert preloads immediately before the main script tag
        newHtml = newHtml.replace(
          scriptTagRegex,
          `${orderedPreloads}\n  ${mainScriptMatch[0]}`
        );
      } else {
        // Fallback: insert before </head> if we can't find the script tag
        console.warn('[vite-config] Could not find main script tag, inserting preloads before </head>');
        newHtml = newHtml.replace(
          '</head>',
          `  ${orderedPreloads}\n</head>`
        );
      }

      return newHtml;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // CRITICAL: Base path MUST be '/' for Kubernetes/production deployment
  // Using './' (relative paths) causes asset loading issues in production
  // This is documented in WHITE_SCREEN_DIAGNOSTIC_REPORT.md
  base: '/',

  plugins: [
    react(),
    tailwindcss(),
    // FIX: CJS/ESM interop for icon libraries and React Context usage
    cjsInterop({
      dependencies: [
        '@phosphor-icons/react',
        'lucide-react',
        '@heroicons/react',
        '@mui/icons-material',
        'sonner',
        'react-hot-toast',
        '@tanstack/react-query',
        'next-themes'
      ]
    }),
    injectRuntimeConfig(), // CRITICAL: Injects runtime-config.js script tag
    fixModulePreloadOrder(), // CRITICAL FIX: Reorder modulepreload tags to ensure React loads first
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst' | 'treemap' | 'network'
    }) as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      // CRITICAL FIX: Force all React imports to resolve to the same instance
      // This prevents "Cannot read properties of null (reading 'useEffect')" errors
      'react': resolve(projectRoot, 'node_modules/react'),
      'react-dom': resolve(projectRoot, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(projectRoot, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': resolve(projectRoot, 'node_modules/react/jsx-dev-runtime')
    },
    // CRITICAL FIX: Deduplicate React to prevent "Invalid hook call" errors
    // Forces all React imports to resolve to the same instance
    dedupe: ['react', 'react-dom', 'scheduler']
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    fs: {
      // Allow serving files from node_modules and project root
      allow: [
        // Allow project root
        '.',
        // Allow node_modules for CSS and asset imports
        '../node_modules'
      ]
    },
    // Force cache bust on dev server
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // REMOVED: Custom cache directory - use default to avoid confusion
  // The custom cacheDir was causing issues with stale pre-bundled deps
  // cacheDir: 'node_modules/.vite-fleet',  // REMOVED
  build: {
    // ========================================================================
    // CODE SPLITTING & CHUNK OPTIMIZATION
    // ========================================================================

    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Increase chunk size warning limit (500kb default is too small for map apps)
    chunkSizeWarningLimit: 1000,

    // Minification settings - use esbuild instead of terser to avoid circular dependency issues
    minify: 'esbuild',

    // Source maps - disable for production, enable for staging
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,

    // CSS code splitting
    cssCodeSplit: true,

    // Rollup options for advanced chunking
    rollupOptions: {
      output: {
        // ===================================================================
        // MANUAL CHUNK STRATEGY
        // Separates large dependencies into their own chunks for better caching
        // ===================================================================
        manualChunks: (id) => {
          // CRITICAL: Core React libraries MUST be in their own chunk, loaded FIRST
          // This prevents "Cannot read properties of null (reading 'useEffect')" errors
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/@remix-run')) {
            return 'react-router';
          }

          // Map libraries - large, load on demand
          if (id.includes('node_modules/leaflet')) {
            return 'map-leaflet';
          }
          if (id.includes('node_modules/mapbox-gl')) {
            return 'map-mapbox';
          }
          if (id.includes('node_modules/@react-google-maps') ||
              id.includes('node_modules/google-maps')) {
            return 'map-google';
          }
          if (id.includes('node_modules/azure-maps')) {
            return 'map-azure';
          }

          // 3D libraries - very large, load only when needed
          if (id.includes('node_modules/three')) {
            return 'three-core';
          }
          if (id.includes('node_modules/@react-three')) {
            return 'three-react';
          }
          if (id.includes('node_modules/postprocessing')) {
            return 'three-postprocessing';
          }

          // UI component libraries
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-radix';
          }
          if (id.includes('node_modules/@phosphor-icons') ||
              id.includes('node_modules/@heroicons') ||
              id.includes('node_modules/lucide-react')) {
            return 'ui-icons';
          }

          // Data visualization - separate recharts from d3 for better isolation
          if (id.includes('node_modules/recharts')) {
            return 'charts-recharts';
          }
          if (id.includes('node_modules/d3')) {
            return 'charts-d3';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'forms';
          }

          // Large utility libraries
          if (id.includes('node_modules/date-fns')) {
            return 'utils-date';
          }
          if (id.includes('node_modules/axios')) {
            return 'utils-http';
          }
          if (id.includes('node_modules/lodash')) {
            return 'utils-lodash';
          }

          // React utility libraries (MUST load after React)
          // These libraries use React.createContext or useLayoutEffect at module level
          if (id.includes('node_modules/react-error-boundary') ||
              id.includes('node_modules/react-hot-toast') ||
              id.includes('node_modules/sonner') ||
              id.includes('node_modules/next-themes') ||
              id.includes('node_modules/react-day-picker') ||
              id.includes('node_modules/react-dropzone') ||
              id.includes('node_modules/react-window') ||
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/swr') ||
              id.includes('node_modules/use-sync-external-store') ||
              id.includes('node_modules/embla-carousel-react') ||
              id.includes('node_modules/vaul') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/@floating-ui') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/cmdk')) {
            return 'react-utils';
          }

          // Animation libraries (non-React dependent)
          // Note: framer-motion moved to react-utils above due to useLayoutEffect usage

          // All other node_modules (should NOT include React-dependent code)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },

        // Chunk file naming with content hash for cache busting
        chunkFileNames: (chunkInfo) => {
          // Use chunk name if available, otherwise use hash
          const name = chunkInfo.name || 'chunk';
          return `assets/js/${name}-[hash].js`;
        },

        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',

        // Asset file naming (images, fonts, etc.)
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];

          // Organize by file type
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `assets/css/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },
      },

      // External dependencies (CDN - optional, commented out by default)
      // Uncomment to load from CDN instead of bundling
      // external: ['react', 'react-dom'],
    },

    // ========================================================================
    // OPTIMIZATION SETTINGS
    // ========================================================================

    // Preload assets for better performance
    modulePreload: {
      polyfill: true,
    },

    // Report compressed size (slower builds, useful for analysis)
    reportCompressedSize: true,

    // Emit manifest for advanced caching strategies
    manifest: true,

    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },

  // ========================================================================
  // OPTIMIZATION - DEP PRE-BUNDLING
  // CRITICAL FIX: This section is the key to solving React Query errors
  // ========================================================================
  optimizeDeps: {
    // CRITICAL FIX: Include React AND React Query together
    // This ensures React Query is pre-bundled WITH React, not before it
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      // CHANGED: Include React Query instead of excluding it
      // This forces Vite to pre-bundle it WITH React, ensuring React is available
      '@tanstack/react-query',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'date-fns',
      'axios',
      'recharts',
      '@phosphor-icons/react',
    ],

    // Exclude dependencies that should be loaded dynamically
    exclude: [
      'leaflet',
      'mapbox-gl',
      '@react-google-maps/api',
      'azure-maps-control',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      // REMOVED: Don't exclude React Query anymore
      // '@tanstack/react-query',  // REMOVED
      // Keep devtools excluded (it's a dev-only tool)
      '@tanstack/react-query-devtools',
    ],

    // CRITICAL: Ensure React is always available as a singleton
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      // ADDED: Preserve React as external during pre-bundling to prevent duplication
      // This ensures all pre-bundled deps see the same React instance
      plugins: []
    },

    // CHANGED: Force optimization on first run to clear stale caches
    // After running nuclear_cache_clear.py, this ensures a fresh build
    force: true,

    // Disable dependency pre-bundling for problematic packages
    needsInterop: []
  },

  // ========================================================================
  // PERFORMANCE SETTINGS
  // ========================================================================

  // Increase the maximum file size for better performance with large apps
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
  },
});
