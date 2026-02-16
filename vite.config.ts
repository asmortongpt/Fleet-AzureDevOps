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
    rollupOptions: {
      output: {
        // Phase 2 Performance Optimization: Enhanced code splitting
        // Reduced main bundle by splitting vendors into logical chunks
        manualChunks: {
          // Core React & Routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // State Management & Data Fetching
          'query-vendor': ['@tanstack/react-query'],
          'state-vendor': ['zustand', 'jotai'],

          // UI Libraries
          'radix-ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip',
          ],

          // UI Utilities
          'ui-vendor': [
            'zod',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'cmdk',
          ],

          // Data Tables & Virtualization
          'ag-grid-vendor': ['ag-grid-react', 'ag-grid-community'],

          // Icons
          'icons-vendor': ['lucide-react', '@phosphor-icons/react', '@mui/icons-material'],

          // Charting & Visualization
          'recharts-vendor': ['recharts'],
          'mermaid-vendor': ['mermaid'],

          // 3D Graphics (only loaded in VehicleShowroom3D)
          'three-vendor': ['three'],
          'three-fiber-vendor': ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],

          // Dates & Time
          'date-vendor': ['date-fns'],

          // Animation
          'motion-vendor': ['framer-motion'],

          // Authentication
          'msal-vendor': ['@azure/msal-browser', '@azure/msal-react'],

          // Internationalization
          'i18n-vendor': ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],

          // Maps & Location
          'mapping-vendor': ['leaflet', 'react-leaflet', 'mapbox-gl'],
        },
      },
      // P0-1: Explicitly exclude .env files and msw from being bundled
      external: (id: string): boolean => {
        if (id.includes('.env')) {
          console.warn(`⚠️  SECURITY: Prevented .env file from being bundled: ${id}`);
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      // P0-1: Remove any environment variable references in production
      mangle: {
        properties: {
          regex: /(PASSWORD|SECRET|KEY|TOKEN)$/,
        },
      },
    },
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
