/**
 * Route Migration Script
 * Analyzes all route files and generates migration plan
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteAnalysis {
  filePath: string;
  fileName: string;
  linesOfCode: number;
  hasCRUDPattern: boolean;
  hasAuthentication: boolean;
  hasValidation: boolean;
  hasCaching: boolean;
  hasPagination: boolean;
  hasFiltering: boolean;
  estimatedReduction: number;
}

interface MigrationReport {
  totalFiles: number;
  candidateFiles: number;
  totalLinesOfCode: number;
  estimatedLinesAfterMigration: number;
  reductionPercentage: number;
  routes: RouteAnalysis[];
}

/**
 * Analyze a single route file
 */
function analyzeRouteFile(filePath: string): RouteAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = path.basename(filePath);

  const analysis: RouteAnalysis = {
    filePath,
    fileName,
    linesOfCode: lines.length,
    hasCRUDPattern: false,
    hasAuthentication: false,
    hasValidation: false,
    hasCaching: false,
    hasPagination: false,
    hasFiltering: false,
    estimatedReduction: 0,
  };

  // Check for CRUD patterns
  const hasGet = content.includes('router.get');
  const hasPost = content.includes('router.post');
  const hasPut = content.includes('router.put') || content.includes('router.patch');
  const hasDelete = content.includes('router.delete');
  analysis.hasCRUDPattern = hasGet && hasPost && hasPut && hasDelete;

  // Check for common patterns
  analysis.hasAuthentication = content.includes('authenticateJWT');
  analysis.hasValidation = content.includes('validate');
  analysis.hasCaching = content.includes('cacheService') || content.includes('cache');
  analysis.hasPagination = content.includes('page') && content.includes('pageSize');
  analysis.hasFiltering = content.includes('filter(') || content.includes('search');

  // Estimate reduction if it has CRUD pattern
  if (analysis.hasCRUDPattern) {
    // Standard CRUD routes typically reduce to ~30-40 lines with factory
    const targetLines = 35;
    analysis.estimatedReduction = Math.max(0, analysis.linesOfCode - targetLines);
  }

  return analysis;
}

/**
 * Scan routes directory and analyze all files
 */
function analyzeAllRoutes(routesDir: string): MigrationReport {
  const files = fs.readdirSync(routesDir);
  const routes: RouteAnalysis[] = [];

  files.forEach((file) => {
    if (!file.endsWith('.ts') || file.includes('.test.') || file.includes('.spec.')) {
      return;
    }

    // Skip backup files
    if (file.includes('.backup') || file.includes('.refactored')) {
      return;
    }

    const filePath = path.join(routesDir, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      const analysis = analyzeRouteFile(filePath);
      routes.push(analysis);
    }
  });

  // Calculate totals
  const totalFiles = routes.length;
  const candidateFiles = routes.filter((r) => r.hasCRUDPattern).length;
  const totalLinesOfCode = routes.reduce((sum, r) => sum + r.linesOfCode, 0);
  const estimatedLinesAfterMigration = routes.reduce(
    (sum, r) => sum + (r.linesOfCode - r.estimatedReduction),
    0
  );
  const reductionPercentage =
    totalLinesOfCode > 0
      ? ((totalLinesOfCode - estimatedLinesAfterMigration) / totalLinesOfCode) * 100
      : 0;

  return {
    totalFiles,
    candidateFiles,
    totalLinesOfCode,
    estimatedLinesAfterMigration,
    reductionPercentage,
    routes: routes.sort((a, b) => b.estimatedReduction - a.estimatedReduction),
  };
}

/**
 * Generate migration report
 */
function generateReport(report: MigrationReport): string {
  let output = '# Route Migration Report\n\n';
  output += `## Summary\n\n`;
  output += `- **Total Route Files:** ${report.totalFiles}\n`;
  output += `- **CRUD Candidate Files:** ${report.candidateFiles} (${((report.candidateFiles / report.totalFiles) * 100).toFixed(1)}%)\n`;
  output += `- **Current Lines of Code:** ${report.totalLinesOfCode.toLocaleString()}\n`;
  output += `- **Estimated After Migration:** ${report.estimatedLinesAfterMigration.toLocaleString()}\n`;
  output += `- **Code Reduction:** ${(report.totalLinesOfCode - report.estimatedLinesAfterMigration).toLocaleString()} lines (${report.reductionPercentage.toFixed(1)}%)\n\n`;

  output += `## Top 20 Candidates for Migration\n\n`;
  output += `| File | Lines | Reduction | Patterns |\n`;
  output += `|------|-------|-----------|----------|\n`;

  const top20 = report.routes.slice(0, 20);
  top20.forEach((route) => {
    const patterns = [];
    if (route.hasCRUDPattern) patterns.push('CRUD');
    if (route.hasAuthentication) patterns.push('Auth');
    if (route.hasValidation) patterns.push('Valid');
    if (route.hasCaching) patterns.push('Cache');
    if (route.hasPagination) patterns.push('Page');
    if (route.hasFiltering) patterns.push('Filter');

    output += `| ${route.fileName} | ${route.linesOfCode} | -${route.estimatedReduction} | ${patterns.join(', ')} |\n`;
  });

  output += `\n## Pattern Analysis\n\n`;
  const withAuth = report.routes.filter((r) => r.hasAuthentication).length;
  const withValidation = report.routes.filter((r) => r.hasValidation).length;
  const withCaching = report.routes.filter((r) => r.hasCaching).length;
  const withPagination = report.routes.filter((r) => r.hasPagination).length;
  const withFiltering = report.routes.filter((r) => r.hasFiltering).length;

  output += `- **Authentication:** ${withAuth} files (${((withAuth / report.totalFiles) * 100).toFixed(1)}%)\n`;
  output += `- **Validation:** ${withValidation} files (${((withValidation / report.totalFiles) * 100).toFixed(1)}%)\n`;
  output += `- **Caching:** ${withCaching} files (${((withCaching / report.totalFiles) * 100).toFixed(1)}%)\n`;
  output += `- **Pagination:** ${withPagination} files (${((withPagination / report.totalFiles) * 100).toFixed(1)}%)\n`;
  output += `- **Filtering:** ${withFiltering} files (${((withFiltering / report.totalFiles) * 100).toFixed(1)}%)\n`;

  output += `\n## Duplication Metrics\n\n`;
  const duplicatedLines = report.totalLinesOfCode - report.estimatedLinesAfterMigration;
  const duplicationPercentage = report.reductionPercentage;

  output += `**Current Duplication Level:** ${duplicationPercentage.toFixed(1)}%\n\n`;
  output += `This represents approximately ${duplicatedLines.toLocaleString()} lines of duplicate or boilerplate code that can be eliminated using the CRUD factory pattern.\n\n`;

  output += `## Migration Strategy\n\n`;
  output += `1. **Phase 1:** Migrate top 10 high-value routes (saves ~2,000+ lines)\n`;
  output += `2. **Phase 2:** Migrate remaining CRUD routes (saves ~${(duplicatedLines * 0.8).toFixed(0)} lines)\n`;
  output += `3. **Phase 3:** Refactor complex routes to use helper utilities\n`;
  output += `4. **Phase 4:** Add export endpoints using export helpers\n\n`;

  output += `## Next Steps\n\n`;
  output += `- [ ] Review this report\n`;
  output += `- [ ] Test refactored vehicles.ts and drivers.ts\n`;
  output += `- [ ] Create migration PRs for high-value routes\n`;
  output += `- [ ] Update documentation and examples\n`;
  output += `- [ ] Train team on new patterns\n`;

  return output;
}

/**
 * Main execution
 */
function main() {
  const routesDir = path.join(__dirname, '../routes');
  console.log('Analyzing routes in:', routesDir);

  const report = analyzeAllRoutes(routesDir);
  const markdown = generateReport(report);

  // Write report to file
  const reportPath = path.join(__dirname, '../../ROUTE_MIGRATION_REPORT.md');
  fs.writeFileSync(reportPath, markdown);

  console.log('\n' + markdown);
  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Write JSON report for programmatic access
  const jsonPath = path.join(__dirname, '../../route-migration-analysis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON data saved to: ${jsonPath}`);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { analyzeAllRoutes, generateReport, RouteAnalysis, MigrationReport };
