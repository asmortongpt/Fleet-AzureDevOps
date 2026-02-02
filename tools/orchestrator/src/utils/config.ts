/**
 * Configuration Loader
 * Loads and validates orchestrator configuration from YAML
 */

import fs from 'fs/promises';
import path from 'path';

import yaml from 'js-yaml';
import { z } from 'zod';

import { logger } from './logger.js';

// Zod schemas for validation
const ScannerConfigSchema = z.object({
  semgrep: z.object({
    enabled: z.boolean(),
    rules: z.array(z.string()),
    exclude: z.array(z.string()).optional(),
  }),
  trivy: z.object({
    enabled: z.boolean(),
    severity: z.array(z.string()),
    scanners: z.array(z.string()),
    ignore_unfixed: z.boolean().optional(),
  }),
  osv: z.object({
    enabled: z.boolean(),
    lockfile_paths: z.array(z.string()),
  }),
  gitleaks: z.object({
    enabled: z.boolean(),
    config: z.string().optional(),
    baseline: z.string().optional(),
  }),
  eslint: z.object({
    enabled: z.boolean(),
    config: z.string(),
    ext: z.array(z.string()),
  }),
  typescript: z.object({
    enabled: z.boolean(),
    project: z.string(),
  }),
  tests: z.object({
    enabled: z.boolean(),
    frameworks: z.array(z.string()),
    coverage_threshold: z.number(),
  }),
  zap: z.object({
    enabled: z.boolean(),
    target: z.string().optional(),
    scan_type: z.string().optional(),
  }),
});

const GatesConfigSchema = z.object({
  security: z.object({
    enabled: z.boolean(),
    max_critical: z.number(),
    max_high: z.number(),
    max_medium: z.number().optional(),
    allow_suppressed: z.boolean().optional(),
  }),
  quality: z.object({
    enabled: z.boolean(),
    max_eslint_errors: z.number(),
    max_ts_errors: z.number(),
    max_code_smells: z.number().optional(),
  }),
  tests: z.object({
    enabled: z.boolean(),
    min_coverage: z.number(),
    must_pass: z.boolean(),
  }),
  build: z.object({
    enabled: z.boolean(),
    must_succeed: z.boolean(),
    timeout_minutes: z.number().optional(),
  }),
});

const AIProviderSchema = z.object({
  enabled: z.boolean(),
  model: z.string().optional(),
  temperature: z.number().optional(),
});

const AIConfigSchema = z.object({
  enabled: z.boolean(),
  providers: z.object({
    openai: AIProviderSchema,
    anthropic: AIProviderSchema,
    google: AIProviderSchema.optional(),
  }),
  features: z.object({
    code_analysis: z.boolean(),
    remediation_suggestions: z.boolean(),
    architecture_review: z.boolean(),
    risk_assessment: z.boolean(),
  }),
  caching: z.object({
    enabled: z.boolean(),
    ttl_seconds: z.number(),
  }),
  rate_limiting: z.object({
    enabled: z.boolean(),
    requests_per_minute: z.number(),
  }),
  fallback: z.object({
    enabled: z.boolean(),
    order: z.array(z.string()),
  }),
});

const ConfigSchema = z.object({
  project: z.object({
    name: z.string(),
    root: z.string(),
    output_dir: z.string(),
  }),
  scanners: ScannerConfigSchema,
  gates: GatesConfigSchema,
  remediation: z.object({
    auto_fix: z.boolean(),
    max_iterations: z.number(),
    verify_each_iteration: z.boolean(),
    create_backup: z.boolean(),
    rollback_on_failure: z.boolean(),
    strategies: z.array(z.string()),
  }),
  repo_sync: z.object({
    github: z.object({
      enabled: z.boolean(),
      owner: z.string(),
      repo: z.string(),
      branch: z.string(),
    }),
    azure_devops: z.object({
      enabled: z.boolean(),
      organization: z.string(),
      project: z.string(),
      repository: z.string(),
      branch: z.string(),
    }),
  }),
  ai: AIConfigSchema,
  reporting: z.object({
    formats: z.array(z.string()),
    outputs: z.record(z.string()),
    email: z.object({
      enabled: z.boolean(),
      recipients: z.array(z.string()),
    }),
    slack: z.object({
      enabled: z.boolean(),
      webhook_url: z.string(),
    }),
  }),
  logging: z.object({
    level: z.string(),
    file: z.string(),
    console: z.boolean(),
    rotation: z.object({
      enabled: z.boolean(),
      max_files: z.number(),
      max_size: z.string(),
    }),
  }),
});

export type OrchestratorConfig = z.infer<typeof ConfigSchema>;

/**
 * Load configuration from YAML file
 */
export async function loadConfig(configPath?: string): Promise<OrchestratorConfig> {
  const configFile =
    configPath ||
    path.join(process.cwd(), 'tools', 'orchestrator', 'config', 'production.yml');

  try {
    logger.info(`Loading configuration from ${configFile}`);

    const fileContent = await fs.readFile(configFile, 'utf-8');
    const rawConfig = yaml.load(fileContent);

    // Validate configuration
    const config = ConfigSchema.parse(rawConfig);

    logger.info('Configuration loaded successfully', {
      scanners_enabled: Object.entries(config.scanners)
        .filter(([_, cfg]) => (cfg as { enabled: boolean }).enabled)
        .map(([name]) => name),
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Configuration validation failed', {
        errors: error.errors,
      });
      throw new Error(`Invalid configuration: ${error.message}`);
    }

    logger.error('Failed to load configuration', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get environment-specific configuration overrides
 */
export function getEnvironmentOverrides(): Partial<OrchestratorConfig> {
  const overrides: Partial<OrchestratorConfig> = {};

  // Allow environment variables to override config
  if (process.env.ORCHESTRATOR_AUTO_FIX) {
    overrides.remediation = {
      ...(overrides.remediation || {}),
      auto_fix: process.env.ORCHESTRATOR_AUTO_FIX === 'true',
    } as OrchestratorConfig['remediation'];
  }

  return overrides;
}

/**
 * Merge configuration with environment overrides
 */
export function mergeConfig(
  base: OrchestratorConfig,
  overrides: Partial<OrchestratorConfig>
): OrchestratorConfig {
  return {
    ...base,
    ...overrides,
    scanners: { ...base.scanners, ...(overrides.scanners || {}) },
    gates: { ...base.gates, ...(overrides.gates || {}) },
    remediation: { ...base.remediation, ...(overrides.remediation || {}) },
  };
}
