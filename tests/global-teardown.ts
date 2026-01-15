/**
 * Playwright Global Teardown
 * Cleanup after E2E test run
 */

import { FullConfig } from '@playwright/test';
import { getIsolationManager } from '../api/src/db/reset/test-isolation';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Playwright Global Teardown: Cleanup\n');

  try {
    // Cleanup any isolated test databases
    const manager = getIsolationManager();
    const stats = await manager.getStatistics();

    if (stats.total > 0) {
      console.log(`Found ${stats.total} test databases to cleanup`);
      const cleaned = await manager.cleanupTestDatabases(true);
      console.log(`✅ Cleaned up ${cleaned} test database(s)`);
    } else {
      console.log('✅ No test databases to cleanup');
    }

    await manager.close();
    console.log('\n✅ Global teardown complete\n');
  } catch (error: any) {
    console.error('\n❌ Global teardown failed:', error.message);
    // Don't throw - teardown failures shouldn't block test completion
  }
}

export default globalTeardown;
