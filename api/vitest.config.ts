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
      'src/__tests__/security/sql-injection.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
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
      statements: 80
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
})
