import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    // Keep default `npm test` focused on fast, deterministic unit tests.
    // Heavier API/service integration suites live elsewhere and should run under a dedicated script
    // with a real DB and environment configuration.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // This repo contains a full backend under `api/` with its own vitest config.
      // Running backend tests in the frontend runner is slow and can fail due to differing timeouts/env.
      'api/**',
      // Local MCP tooling shouldn't be picked up by the app unit test runner.
      'mcp-server/**',
      'api/src/__tests__/services/**',
      'api/src/routes/__tests__/**',
      'api/tests/**',
      'tests/e2e/**',
      'tests/smoke/**',
      'tests/certification/**',
      'e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/test{,s}/**',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      reporters: ['default', 'json'],
      outputFile: './benchmarks/reports/bench-results.json',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
