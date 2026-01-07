#!/usr/bin/env node
/**
 * Fleet Security Orchestrator CLI
 */

import { Command } from 'commander';

import { logger } from '../utils/logger.js';

import { dashboardCommand } from './commands/dashboard.js';
import { finishWithDashboard } from './commands/finish-with-dashboard.js';
import { runFinish } from './commands/finish.js';
import { runReview } from './commands/review.js';
import { runScan } from './commands/scan.js';


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
  .option('--dashboard', 'Launch with real-time dashboard')
  .option('--port <number>', 'Dashboard port (default: 3001)')
  .option('--no-open', 'Do not auto-open browser')
  .action(async (options) => {
    try {
      if (options.dashboard) {
        await finishWithDashboard({
          maxIterations: parseInt(options.maxIterations || '10'),
          dryRun: options.dryRun,
          port: options.port ? parseInt(options.port) : 3001,
          noOpen: options.noOpen
        });
      } else {
        await runFinish(options);
      }
      process.exit(0);
    } catch (error) {
      logger.error('Finish failed', { error });
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('Launch real-time remediation progress dashboard')
  .option('--port <number>', 'Dashboard port (default: 3001)')
  .option('--no-open', 'Do not auto-open browser')
  .action(async (options) => {
    try {
      await dashboardCommand({
        port: options.port ? parseInt(options.port) : 3001,
        noOpen: options.noOpen
      });
    } catch (error) {
      logger.error('Dashboard failed', { error });
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
