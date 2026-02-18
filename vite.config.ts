import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * P0-1 SECURITY FIX: Prevent .env files from being bundled into production builds
 * Generate CSP nonces for P0-4 fix
 */

export default defineConfig({
  // P0-1: Explicitly exclude .env files from build output
  envPrefix: 'VITE_', // Only load variables with VITE_ prefix
  envDir: './', // Load from project root
  server: {
    port: 5173, // Default port for Azure AD SSO redirect
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Phase 2 Optimization: Re-enabled PWA for offline support & caching
      disable: false, // ENABLED: Provides offline support and improved caching
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp}', // Include WebP for modern browsers
        ],
        globIgnores: ['**/stats.html', '**/playwright-report/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          // API Responses - Network First with 5-min cache
          {
            urlPattern: /^https:\/\/fleet\.capitaltechalliance\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // CDN Assets - Cache First with 30-day expiration
          {
            urlPattern: /^https:\/\/(cdn|unpkg|jsdelivr|cdnjs)\..*\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxAgeSeconds: 86400 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts - Cache First for 1 year
          {
            urlPattern: /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxAgeSeconds: 31536000, // 1 year
              },
            },
          },
          // Google Maps - Cache First with 30-day expiration
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maps-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: false, // Using custom manifest
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Phase 2 Performance Optimization: Enhanced code splitting
        // Migrated from Rollup manualChunks to Rolldown advancedChunks (Vite 7)
        advancedChunks: {
          groups: [
            // Core React & Routing
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              priority: 20,
            },

            // State Management & Data Fetching
            {
              name: 'query-vendor',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 15,
            },
            {
              name: 'state-vendor',
              test: /[\\/]node_modules[\\/](zustand|jotai)[\\/]/,
              priority: 15,
            },

            // UI Libraries (Radix)
            {
              name: 'radix-ui-vendor',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 10,
            },

            // UI Utilities
            {
              name: 'ui-vendor',
              test: /[\\/]node_modules[\\/](zod|class-variance-authority|clsx|tailwind-merge|cmdk)[\\/]/,
              priority: 10,
            },

            // Data Tables & Virtualization
            {
              name: 'ag-grid-vendor',
              test: /[\\/]node_modules[\\/]ag-grid-(react|community)[\\/]/,
              priority: 10,
            },

            // Icons
            {
              name: 'icons-vendor',
              test: /[\\/]node_modules[\\/](lucide-react|@phosphor-icons[\\/]react|@mui[\\/]icons-material)[\\/]/,
              priority: 10,
            },

            // Charting & Visualization
            {
              name: 'recharts-vendor',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 10,
            },
            {
              name: 'mermaid-vendor',
              test: /[\\/]node_modules[\\/]mermaid[\\/]/,
              priority: 10,
            },

            // 3D Graphics (only loaded in VehicleShowroom3D)
            {
              name: 'three-vendor',
              test: /[\\/]node_modules[\\/]three[\\/]/,
              priority: 10,
            },
            {
              name: 'three-fiber-vendor',
              test: /[\\/]node_modules[\\/](@react-three[\\/](fiber|drei|postprocessing)|postprocessing)[\\/]/,
              priority: 10,
            },

            // Dates & Time
            {
              name: 'date-vendor',
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              priority: 10,
            },

            // Animation
            {
              name: 'motion-vendor',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 10,
            },

            // Authentication
            {
              name: 'msal-vendor',
              test: /[\\/]node_modules[\\/]@azure[\\/]msal-(browser|react)[\\/]/,
              priority: 10,
            },

            // Internationalization
            {
              name: 'i18n-vendor',
              test: /[\\/]node_modules[\\/](i18next|i18next-browser-languagedetector|react-i18next)[\\/]/,
              priority: 10,
            },

            // Maps & Location
            {
              name: 'mapping-vendor',
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet|mapbox-gl)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
      // P0-1: Explicitly exclude .env files and msw from being bundled
      external: (id: string): boolean => {
        if (id.includes('.env')) {
          console.warn(`SECURITY: Prevented .env file from being bundled: ${id}`);
          return true;
        }
        // Exclude MSW from production build (development-only mocking)
        if (id.includes('msw/') || id === 'msw') {
          return true;
        }
        return false;
      },
    },
    sourcemap: false, // Fix for Radix UI / Vite build sourcemap errors
    chunkSizeWarningLimit: 500,
    // Vite 7 defaults to Oxc minifier (30-90x faster than Terser) — no need to specify minify
    // Console/debugger dropping is handled by Oxc by default in production builds.
    //
    // TODO: P0-1 SECURITY — The previous Terser config mangled properties matching
    // /(PASSWORD|SECRET|KEY|TOKEN)$/ to strip sensitive property names from production bundles.
    // Oxc minifier does not support property mangling by regex. Implement one of:
    //   1. A custom Vite plugin (transform hook) that strips/renames these properties
    //   2. A post-build script using an AST transform (e.g., jscodeshift or oxc-transform)
    //   3. Ensure sensitive values are never bundled client-side (preferred — audit VITE_ env vars)
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'ag-grid-react',
    ],
  },
  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],

    // Include only unit test files (exclude Playwright e2e tests)
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],

    // Exclude Playwright e2e tests and other non-unit test files
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.spec.ts', // Playwright tests use .spec.ts at root level
      '**/api/e2e/**',
      '**/scripts/**',
      '**/tests/**', // Root level tests directory (Playwright)
      './test-*.spec.ts',
      './check-*.spec.ts',
      './inspect-*.spec.ts',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/e2e/**',
      ],
      all: true,
      lines: 50,
      functions: 50,
      branches: 50,
      statements: 50,
    },

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Display options
    reporters: ['verbose'],

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
  },
});
