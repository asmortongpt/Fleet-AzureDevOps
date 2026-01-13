import { pool } from '../config/database';

// Setup runs before all tests
beforeAll(async () => {
  // Database setup if needed
  console.log('Test suite starting...');
});

// Cleanup runs after all tests
afterAll(async () => {
  await pool.end();
  console.log('Test suite complete');
});

// Reset state between tests
afterEach(() => {
  jest.clearAllMocks();
});
