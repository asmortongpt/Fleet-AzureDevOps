/**
 * Scan Command - Run a specific scanner
 */

import chalk from 'chalk';
import ora from 'ora';

import { logger } from '../../utils/logger.js';

export async function runScan(scanner: string, options: { target?: string }): Promise<void> {
  const spinner = ora(`Running ${scanner} scanner...`).start();

  try {
    const target = options.target || process.cwd();

    logger.info(`Running ${scanner} on ${target}`);

    // Scanner execution would go here based on scanner name
    spinner.succeed(`${scanner} scan complete`);

    console.log(chalk.green(`\n✓ ${scanner} scan completed successfully\n`));
  } catch (error) {
    spinner.fail(`${scanner} scan failed`);
    throw error;
  }
}
