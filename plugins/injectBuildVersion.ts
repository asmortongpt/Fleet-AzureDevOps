/**
 * Vite Plugin: Inject Build Version into Service Worker
 *
 * This plugin generates a unique build version from:
 * - Git commit SHA (short form)
 * - Build timestamp
 *
 * Format: v1.0.0-{commitSHA}-{timestamp}
 * Example: v1.0.0-a1b2c3d-1700000000000
 *
 * The placeholder __BUILD_VERSION__ in sw.js is replaced after build.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Plugin, ResolvedConfig } from 'vite';

interface BuildVersionOptions {
  /** Base version string (default: 'v1.0.0') */
  baseVersion?: string;
  /** Path to service worker file relative to dist (default: 'sw.js') */
  swPath?: string;
  /** Placeholder string to replace (default: '__BUILD_VERSION__') */
  placeholder?: string;
}

/**
 * Gets the current git commit SHA (short form)
 * Falls back to 'unknown' if git is not available
 */
function getGitCommitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    console.warn('[injectBuildVersion] Could not get git commit SHA, using "unknown"');
    return 'unknown';
  }
}

/**
 * Gets the current git branch name
 * Falls back to 'unknown' if git is not available
 */
function getGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Generates a build version string
 * Format: v{baseVersion}-{commitSHA}-{timestamp}
 */
function generateBuildVersion(baseVersion: string): string {
  const commitSha = getGitCommitSha();
  const timestamp = Date.now();
  return `${baseVersion}-${commitSha}-${timestamp}`;
}

/**
 * Vite plugin to inject build version into service worker
 */
export function injectBuildVersion(options: BuildVersionOptions = {}): Plugin {
  const {
    baseVersion = 'v1.0.0',
    swPath = 'sw.js',
    placeholder = '__BUILD_VERSION__',
  } = options;

  let config: ResolvedConfig;
  let buildVersion: string;

  return {
    name: 'inject-build-version',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    buildStart() {
      // Generate version at build start for consistency
      buildVersion = generateBuildVersion(baseVersion);
      const branch = getGitBranch();

      console.log('\n[injectBuildVersion] Build Information:');
      console.log(`  Version: ${buildVersion}`);
      console.log(`  Branch:  ${branch}`);
      console.log(`  Mode:    ${config.mode}`);
    },

    closeBundle() {
      // Only run in production builds
      if (config.command !== 'build') {
        return;
      }

      const distPath = config.build.outDir;
      const swFilePath = resolve(distPath, swPath);

      if (!existsSync(swFilePath)) {
        console.warn(`[injectBuildVersion] Service worker not found at: ${swFilePath}`);
        return;
      }

      try {
        // Read the service worker file
        let swContent = readFileSync(swFilePath, 'utf-8');

        // Check if placeholder exists
        if (!swContent.includes(placeholder)) {
          console.warn(`[injectBuildVersion] Placeholder "${placeholder}" not found in ${swPath}`);
          return;
        }

        // Replace all occurrences of the placeholder
        swContent = swContent.replace(new RegExp(placeholder, 'g'), buildVersion);

        // Write back the modified content
        writeFileSync(swFilePath, swContent, 'utf-8');

        console.log(`\n[injectBuildVersion] Successfully injected version into ${swPath}`);
        console.log(`  Cache version: ${buildVersion}`);
        console.log(`  File: ${swFilePath}`);
      } catch (error) {
        console.error('[injectBuildVersion] Error injecting build version:', error);
        throw error;
      }
    },

    // Also expose version as a virtual module for client-side access
    resolveId(id) {
      if (id === 'virtual:build-version') {
        return id;
      }
    },

    load(id) {
      if (id === 'virtual:build-version') {
        const version = buildVersion || generateBuildVersion(baseVersion);
        return `export const BUILD_VERSION = "${version}";
export const GIT_COMMIT = "${getGitCommitSha()}";
export const BUILD_TIME = ${Date.now()};
export const GIT_BRANCH = "${getGitBranch()}";
`;
      }
    },
  };
}

export default injectBuildVersion;
