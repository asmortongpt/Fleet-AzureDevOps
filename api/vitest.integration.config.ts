import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest Integration Test Configuration
 *
 * This configuration is specifically for integration tests that:
 * - Make real HTTP requests to the API
 * - Use a test database (or mock data)
 * - Test complete request/response cycles
 *
 * Usage: npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    // Only run our new integration tests
    include: [
      'tests/integration/auth.test.ts',
      'tests/integration/vehicles.test.ts',
      'tests/integration/health.test.ts'
    ],
    // Exclude other integration tests that have different setup requirements
    exclude: [
      'tests/integration/rls-verification.test.ts',
      'tests/integration/vehicles.api.test.ts',
      'node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration',
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
      ]
    },
    // Integration tests may take longer
    testTimeout: 60000,
    hookTimeout: 60000,
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long-for-security',
      CSRF_SECRET: 'test-csrf-secret-at-least-32-characters-long-for-security',
      USE_MOCK_DATA: 'false',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fleet_test'
    },
    // Dependencies that should be bundled
    deps: {
      inline: ['supertest']
    }
  }
})
