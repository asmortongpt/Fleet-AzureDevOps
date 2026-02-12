/**
 * Dashboard Command
 * Launch real-time remediation progress dashboard
 */

import open from 'open';

import { getDashboard } from '../../dashboard/server.js';
import { logger } from '../../utils/logger.js';

export interface DashboardOptions {
  port?: number;
  noOpen?: boolean;
}

export async function dashboardCommand(options: DashboardOptions = {}): Promise<void> {
  const port = options.port || 3001;

  logger.info('Starting dashboard server...', { port });

  const dashboard = getDashboard(port);

  await dashboard.start();

  // Auto-open browser unless --no-open flag
  if (!options.noOpen) {
    try {
      await open(`http://localhost:${port}`);
      logger.info('Opened dashboard in browser');
    } catch (error) {
      logger.warn('Could not auto-open browser', { error });
      console.log(`\nManually open: http://localhost:${port}`);
    }
  }

  console.log('\n✨ Dashboard is running!');
  console.log(`📊 View at: http://localhost:${port}`);
  console.log('\nPress Ctrl+C to stop\n');

  // Keep process alive
  await new Promise(() => {});
}
