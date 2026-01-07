/**
 * Graph Builder - Build dependency graph from codebase
 */

import fs from 'fs/promises';
import path from 'path';
import fastGlob from 'fast-glob';
import { DependencyGraph, ArchitectureNode } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

const { glob } = fastGlob;

/**
 * Build dependency graph from project
 */
export async function buildDependencyGraph(projectRoot: string): Promise<DependencyGraph> {
  logger.info('Building dependency graph');

  const nodes: Record<string, ArchitectureNode> = {};
  const edges: Array<{ from: string; to: string; type: string }> = [];

  // Parse package.json for npm dependencies
  await parsePackageDependencies(projectRoot, nodes, edges);

  // Parse TypeScript/JavaScript imports
  await parseImportDependencies(projectRoot, nodes, edges);

  // Parse test files
  await parseTestDependencies(projectRoot, nodes, edges);

  logger.info(`Dependency graph: ${Object.keys(nodes).length} nodes, ${edges.length} edges`);

  return { nodes, edges };
}

/**
 * Parse package.json dependencies
 */
async function parsePackageDependencies(
  projectRoot: string,
  nodes: Record<string, ArchitectureNode>,
  edges: Array<{ from: string; to: string; type: string }>
): Promise<void> {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    // Add project node
    const projectId = 'project:root';
    nodes[projectId] = {
      id: projectId,
      type: 'service',
      name: pkg.name || 'Fleet',
      path: projectRoot,
      dependencies: [],
      dependents: [],
      findings: [],
      risk_score: 0,
      criticality: 10, // Root is most critical
    };

    // Add npm dependencies
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    for (const [name, _version] of Object.entries(allDeps)) {
      const depId = `npm:${name}`;
      if (!nodes[depId]) {
        nodes[depId] = {
          id: depId,
          type: 'dependency',
          name,
          dependencies: [],
          dependents: [],
          findings: [],
          risk_score: 0,
          criticality: 3, // External deps have moderate criticality
        };
      }

      edges.push({ from: projectId, to: depId, type: 'npm' });
      nodes[projectId].dependencies.push(depId);
      nodes[depId].dependents.push(projectId);
    }
  } catch (error) {
    logger.warn('Could not parse package.json', { error });
  }
}

/**
 * Parse import/require statements
 */
async function parseImportDependencies(
  projectRoot: string,
  nodes: Record<string, ArchitectureNode>,
  edges: Array<{ from: string; to: string; type: string }>
): Promise<void> {
  const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    ignore: ['node_modules/**', 'dist/**', 'build/**'],
    absolute: true,
  });

  for (const filePath of sourceFiles) {
    const fileId = `file:${path.relative(projectRoot, filePath)}`;

    if (!nodes[fileId]) {
      nodes[fileId] = {
        id: fileId,
        type: 'file',
        name: path.basename(filePath),
        path: filePath,
        dependencies: [],
        dependents: [],
        findings: [],
        risk_score: 0,
        criticality: 5, // Source files have medium criticality
      };
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports = extractImports(content);

      for (const importPath of imports) {
        let targetId: string;

        // Check if it's an npm module
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          const pkgName = importPath.split('/')[0] || importPath;
          targetId = `npm:${pkgName}`;
        } else {
          // Resolve relative import
          const dir = path.dirname(filePath);
          if (dir) {
            const resolvedPath = path.resolve(dir, importPath);
            targetId = `file:${path.relative(projectRoot, resolvedPath)}`;
          } else {
            continue;
          }
        }

        // Ensure target node exists
        if (!nodes[targetId] && targetId.startsWith('npm:')) {
          const name = targetId.replace('npm:', '');
          nodes[targetId] = {
            id: targetId,
            type: 'dependency',
            name,
            dependencies: [],
            dependents: [],
            findings: [],
            risk_score: 0,
            criticality: 3,
          };
        }

        const targetNode = nodes[targetId];
        const sourceNode = nodes[fileId];
        if (targetNode && sourceNode) {
          edges.push({ from: fileId, to: targetId, type: 'import' });
          sourceNode.dependencies.push(targetId);
          targetNode.dependents.push(fileId);
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
}

/**
 * Parse test file dependencies
 */
async function parseTestDependencies(
  projectRoot: string,
  nodes: Record<string, ArchitectureNode>,
  edges: Array<{ from: string; to: string; type: string }>
): Promise<void> {
  const testFiles = await glob('**/*.{test,spec}.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    ignore: ['node_modules/**'],
    absolute: true,
  });

  for (const testPath of testFiles) {
    const testId = `test:${path.relative(projectRoot, testPath)}`;

    if (!nodes[testId]) {
      nodes[testId] = {
        id: testId,
        type: 'test',
        name: path.basename(testPath),
        path: testPath,
        dependencies: [],
        dependents: [],
        findings: [],
        risk_score: 0,
        criticality: 2, // Tests have lower criticality
      };
    }

    // Link test to its corresponding source file
    const sourcePath = testPath.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '.$2');
    const sourceId = `file:${path.relative(projectRoot, sourcePath)}`;

    if (nodes[sourceId]) {
      edges.push({ from: testId, to: sourceId, type: 'tests' });
      nodes[testId].dependencies.push(sourceId);
      nodes[sourceId].dependents.push(testId);
    }
  }
}

/**
 * Extract import statements from source code
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];

  // Match ES6 imports
  const es6ImportRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(content)) !== null) {
    if (match[1]) imports.push(match[1]);
  }

  // Match require statements
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    if (match[1]) imports.push(match[1]);
  }

  return imports;
}
