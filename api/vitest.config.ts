import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      // Integration tests that require real database, Redis, or Express server
      'tests/**',
      'src/tests/paginationRoute.test.ts',
      'src/routes/__tests__/vendor-management.test.ts',
      'src/routes/__tests__/insurance.test.ts',
      'src/__tests__/security/sql-injection.test.ts',
      // Tests that import singletons requiring API keys/credentials at import time
      'src/__tests__/services/ai-task-prioritization.test.ts',
      'src/__tests__/services/multi-llm-orchestrator.service.test.ts',
      'src/routes/__tests__/auth-jwt-validation.test.ts',
      // Tests that connect to Redis (Bull queues) - hang in CI without Redis
      'src/__tests__/jobs/queue.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'json-summary', 'html', 'lcov', 'csv'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/config/',
        'src/emulators/',
        '**/*.d.ts'
      ],
      include: [
        'src/**/*.ts'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      all: true,
      clean: true,
      skipFull: false,
    },
    testTimeout: 30000,
    hookTimeout: 30000
  }
})
