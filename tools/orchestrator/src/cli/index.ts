#!/usr/bin/env node
/**
 * Fleet Security Orchestrator CLI
 */

import { Command } from 'commander';
import { runReview } from './commands/review.js';
import { runFinish } from './commands/finish.js';
import { runScan } from './commands/scan.js';
import { logger } from '../utils/logger.js';

const program = new Command();

program
  .name('orchestrator')
  .description('Fleet Security Orchestrator - Unified Vulnerability Management')
  .version('1.0.0');

program
  .command('review')
  .description('Run all scanners and generate comprehensive reports')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <path>', 'Output directory for artifacts')
  .action(async (options) => {
    try {
      await runReview(options);
      process.exit(0);
    } catch (error) {
      logger.error('Review failed', { error });
      process.exit(1);
    }
  });

program
  .command('finish')
  .description('Autonomous remediation until all gates pass')
  .option('-c, --config <path>', 'Configuration file path')
  .option('--max-iterations <number>', 'Maximum remediation iterations', '10')
  .option('--dry-run', 'Simulate without making changes')
  .action(async (options) => {
    try {
      await runFinish(options);
      process.exit(0);
    } catch (error) {
      logger.error('Finish failed', { error });
      process.exit(1);
    }
  });

program
  .command('scan')
  .description('Run specific scanner')
  .argument('<scanner>', 'Scanner name (semgrep, trivy, eslint, etc.)')
  .option('-t, --target <path>', 'Target path', process.cwd())
  .action(async (scanner, options) => {
    try {
      await runScan(scanner, options);
      process.exit(0);
    } catch (error) {
      logger.error('Scan failed', { error });
      process.exit(1);
    }
  });

program.parse();
