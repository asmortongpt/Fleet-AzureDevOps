/**
 * Blast Radius Calculator
 * Calculate impact radius for findings based on dependency graph
 */

import { CanonicalFinding, DependencyGraph, ArchitectureNode } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate blast radius for all findings
 */
export function calculateBlastRadius(
  findings: CanonicalFinding[],
  graph: DependencyGraph
): CanonicalFinding[] {
  logger.info('Calculating blast radius for findings');

  const updatedFindings = findings.map((finding) => {
    const nodeId = findNodeForFinding(finding, graph);

    if (!nodeId || !graph.nodes[nodeId]) {
      return { ...finding, blast_radius: 1, affected_components: [finding.location.file] };
    }

    const { radius, affectedNodes } = computeBlastRadius(nodeId, graph);

    return {
      ...finding,
      blast_radius: radius,
      affected_components: affectedNodes.map((n) => n.name),
    };
  });

  logger.info('Blast radius calculation complete');
  return updatedFindings;
}

/**
 * Find the graph node corresponding to a finding
 */
function findNodeForFinding(finding: CanonicalFinding, graph: DependencyGraph): string | null {
  // For dependency findings
  if (finding.type === 'dependency' && finding.package_name) {
    return `npm:${finding.package_name}`;
  }

  // For file-based findings
  const filePath = finding.location.file;
  const fileId = `file:${filePath}`;

  if (graph.nodes[fileId]) {
    return fileId;
  }

  // Try to find by partial path match
  for (const nodeId of Object.keys(graph.nodes)) {
    if (nodeId.includes(filePath) || filePath.includes(nodeId.replace('file:', ''))) {
      return nodeId;
    }
  }

  return null;
}

/**
 * Compute blast radius using BFS traversal
 */
function computeBlastRadius(
  startNodeId: string,
  graph: DependencyGraph
): { radius: number; affectedNodes: ArchitectureNode[] } {
  const visited = new Set<string>();
  const affectedNodes: ArchitectureNode[] = [];
  const queue: Array<{ id: string; depth: number }> = [{ id: startNodeId, depth: 0 }];

  let maxDepth = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { id, depth } = current;

    if (visited.has(id)) continue;
    visited.add(id);

    const node = graph.nodes[id];
    if (!node) continue;

    affectedNodes.push(node);
    maxDepth = Math.max(maxDepth, depth);

    // Traverse dependents (things that depend on this)
    for (const dependentId of node.dependents) {
      if (!visited.has(dependentId)) {
        queue.push({ id: dependentId, depth: depth + 1 });
      }
    }
  }

  // Blast radius score: affected nodes + depth factor
  const radius = affectedNodes.length + maxDepth * 2;

  return { radius, affectedNodes };
}

/**
 * Find critical paths in the graph
 */
export function findCriticalPaths(graph: DependencyGraph): string[][] {
  const paths: string[][] = [];

  // Find nodes with high criticality and many dependents
  const criticalNodes = Object.values(graph.nodes)
    .filter((node) => node.criticality >= 7 && node.dependents.length > 5)
    .sort((a, b) => b.dependents.length - a.dependents.length);

  for (const node of criticalNodes.slice(0, 10)) {
    // Top 10 critical paths
    const path = tracePath(node.id, graph);
    paths.push(path);
  }

  return paths;
}

/**
 * Trace dependency path from node to root
 */
function tracePath(nodeId: string, graph: DependencyGraph): string[] {
  const path: string[] = [nodeId];
  let current = nodeId;

  const visited = new Set<string>();
  visited.add(current);

  while (true) {
    const node = graph.nodes[current];
    if (!node || node.dependents.length === 0) break;

    // Find the most critical dependent
    let nextNode: string | null = null;
    let maxCriticality = 0;

    for (const depId of node.dependents) {
      if (visited.has(depId)) continue;

      const dep = graph.nodes[depId];
      if (dep && dep.criticality > maxCriticality) {
        maxCriticality = dep.criticality;
        nextNode = depId;
      }
    }

    if (!nextNode) break;

    path.push(nextNode);
    visited.add(nextNode);
    current = nextNode;

    // Prevent infinite loops
    if (path.length > 50) break;
  }

  return path;
}
