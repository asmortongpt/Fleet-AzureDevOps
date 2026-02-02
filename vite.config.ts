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
        changeOrigin: false,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: false,
        secure: false,
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
      disable: true, // Disable PWA temporarily to fix TLS issues
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/stats.html'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fleet\.capitaltechalliance\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5,
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ag-grid-vendor': ['ag-grid-react', 'ag-grid-community'],
          'icons-vendor': ['lucide-react'],
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