#!/usr/bin/env node
/**
 * Comprehensive QA Analysis Report Generator
 * Analyzes results from 50-agent AI quality assurance system
 */

const { Pool } = require('pg');
const fs = require('fs').promises;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'qauser',
  password: 'qapass_secure_2026',
  database: 'fleet_qa'
});

async function generateReport() {
  console.log('🎯 Generating Comprehensive QA Analysis Report');
  console.log('='.repeat(80));
  console.log('');

  const report = {
    metadata: {},
    summary: {},
    codeReview: {},
    security: {},
    performance: {},
    testing: {},
    ux: {},
    topIssues: [],
    recommendations: []
  };

  // 1. METADATA
  console.log('📊 Collecting metadata...');
  const metaQuery = await pool.query(`
    SELECT
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(DISTINCT target_file) as files_analyzed,
      AVG(quality_iterations) as avg_iterations,
      MIN(created_at) as analysis_start,
      MAX(completed_at) as analysis_end
    FROM agent_tasks
  `);

  const meta = metaQuery.rows[0];
  report.metadata = {
    totalTasks: parseInt(meta.total_tasks),
    completedTasks: parseInt(meta.completed),
    failedTasks: parseInt(meta.failed),
    filesAnalyzed: parseInt(meta.files_analyzed),
    avgQualityIterations: parseFloat(meta.avg_iterations).toFixed(2),
    analysisStart: meta.analysis_start,
    analysisEnd: meta.analysis_end,
    duration: calculateDuration(meta.analysis_start, meta.analysis_end)
  };

  console.log(`   ✅ Analyzed ${report.metadata.filesAnalyzed} files`);
  console.log(`   ✅ Completed ${report.metadata.completedTasks} tasks`);
  console.log(`   ⏱️  Duration: ${report.metadata.duration}`);
  console.log('');

  // 2. SUMMARY BY TASK TYPE
  console.log('📋 Analyzing by task type...');
  const typeQuery = await pool.query(`
    SELECT
      task_type,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      AVG(quality_iterations) as avg_iterations
    FROM agent_tasks
    GROUP BY task_type
    ORDER BY task_type
  `);

  report.summary.byType = typeQuery.rows.map(row => ({
    type: row.task_type,
    total: parseInt(row.count),
    completed: parseInt(row.completed),
    avgIterations: parseFloat(row.avg_iterations).toFixed(2)
  }));

  typeQuery.rows.forEach(row => {
    console.log(`   ${row.task_type.padEnd(25)} ${row.completed} completed`);
  });
  console.log('');

  // 3. CODE REVIEW INSIGHTS
  console.log('🔍 Extracting code review insights...');
  const codeReviewQuery = await pool.query(`
    SELECT
      result->>'file' as file,
      result->>'analysis' as analysis,
      result->>'score' as score,
      quality_iterations
    FROM agent_tasks
    WHERE task_type = 'code-review'
      AND status = 'completed'
      AND result IS NOT NULL
      AND result->>'analysis' IS NOT NULL
      AND LENGTH(result->>'analysis') > 100
    ORDER BY (result->>'score')::numeric DESC
    LIMIT 100
  `);

  report.codeReview = {
    totalReviews: codeReviewQuery.rows.length,
    insights: codeReviewQuery.rows.slice(0, 20).map(row => ({
      file: row.file,
      score: parseFloat(row.score || 0).toFixed(2),
      iterations: row.quality_iterations,
      preview: row.analysis ? row.analysis.substring(0, 200) + '...' : 'N/A'
    }))
  };

  console.log(`   ✅ ${report.codeReview.totalReviews} code reviews analyzed`);
  console.log('');

  // 4. SECURITY FINDINGS
  console.log('🔒 Analyzing security scans...');
  const securityQuery = await pool.query(`
    SELECT
      result->>'file' as file,
      result->>'analysis' as analysis,
      quality_iterations
    FROM agent_tasks
    WHERE task_type = 'security-scan'
      AND status = 'completed'
      AND result IS NOT NULL
      AND result->>'analysis' IS NOT NULL
    ORDER BY quality_iterations DESC
    LIMIT 50
  `);

  // Extract security keywords
  const securityKeywords = ['vulnerability', 'security', 'injection', 'xss', 'csrf', 'auth', 'password', 'token', 'exploit'];
  const securityIssues = [];

  securityQuery.rows.forEach(row => {
    const analysis = (row.analysis || '').toLowerCase();
    securityKeywords.forEach(keyword => {
      if (analysis.includes(keyword)) {
        securityIssues.push({
          file: row.file,
          keyword: keyword,
          iterations: row.quality_iterations,
          snippet: extractSnippet(row.analysis, keyword)
        });
      }
    });
  });

  report.security = {
    totalScans: securityQuery.rows.length,
    potentialIssues: securityIssues.length,
    topIssues: securityIssues.slice(0, 20)
  };

  console.log(`   ✅ ${report.security.totalScans} security scans completed`);
  console.log(`   ⚠️  ${report.security.potentialIssues} potential issues flagged`);
  console.log('');

  // 5. PERFORMANCE ANALYSIS
  console.log('⚡ Analyzing performance recommendations...');
  const perfQuery = await pool.query(`
    SELECT
      result->>'file' as file,
      result->>'analysis' as analysis,
      quality_iterations
    FROM agent_tasks
    WHERE task_type = 'performance-analysis'
      AND status = 'completed'
      AND result IS NOT NULL
      AND result->>'analysis' IS NOT NULL
    LIMIT 50
  `);

  const perfKeywords = ['bottleneck', 'slow', 'optimize', 'cache', 'memory', 'leak', 'performance', 'inefficient'];
  const perfIssues = [];

  perfQuery.rows.forEach(row => {
    const analysis = (row.analysis || '').toLowerCase();
    perfKeywords.forEach(keyword => {
      if (analysis.includes(keyword)) {
        perfIssues.push({
          file: row.file,
          keyword: keyword,
          snippet: extractSnippet(row.analysis, keyword)
        });
      }
    });
  });

  report.performance = {
    totalAnalyses: perfQuery.rows.length,
    issuesFound: perfIssues.length,
    topIssues: perfIssues.slice(0, 20)
  };

  console.log(`   ✅ ${report.performance.totalAnalyses} performance analyses`);
  console.log(`   ⚠️  ${report.performance.issuesFound} optimization opportunities`);
  console.log('');

  // 6. TEST GENERATION SUMMARY
  console.log('🧪 Analyzing test recommendations...');
  const testQuery = await pool.query(`
    SELECT
      result->>'file' as file,
      result->>'analysis' as analysis
    FROM agent_tasks
    WHERE task_type = 'test-generation'
      AND status = 'completed'
      AND result IS NOT NULL
      AND result->>'analysis' IS NOT NULL
    LIMIT 50
  `);

  report.testing = {
    totalRecommendations: testQuery.rows.length,
    filesNeedingTests: testQuery.rows.map(r => r.file).filter(f => f).slice(0, 30)
  };

  console.log(`   ✅ ${report.testing.totalRecommendations} test recommendations`);
  console.log('');

  // 7. UX/ACCESSIBILITY
  console.log('♿ Analyzing UX/accessibility findings...');
  const uxQuery = await pool.query(`
    SELECT
      result->>'file' as file,
      result->>'analysis' as analysis
    FROM agent_tasks
    WHERE task_type = 'ux-optimization'
      AND status = 'completed'
      AND result IS NOT NULL
      AND result->>'analysis' IS NOT NULL
    LIMIT 50
  `);

  const uxKeywords = ['accessibility', 'wcag', 'aria', 'contrast', 'keyboard', 'screen reader', 'a11y'];
  const uxIssues = [];

  uxQuery.rows.forEach(row => {
    const analysis = (row.analysis || '').toLowerCase();
    uxKeywords.forEach(keyword => {
      if (analysis.includes(keyword)) {
        uxIssues.push({
          file: row.file,
          keyword: keyword,
          snippet: extractSnippet(row.analysis, keyword)
        });
      }
    });
  });

  report.ux = {
    totalAnalyses: uxQuery.rows.length,
    accessibilityIssues: uxIssues.length,
    topIssues: uxIssues.slice(0, 15)
  };

  console.log(`   ✅ ${report.ux.totalAnalyses} UX analyses`);
  console.log(`   ⚠️  ${report.ux.accessibilityIssues} accessibility concerns`);
  console.log('');

  // 8. GENERATE RECOMMENDATIONS
  console.log('💡 Generating recommendations...');
  report.recommendations = generateRecommendations(report);
  console.log(`   ✅ ${report.recommendations.length} recommendations generated`);
  console.log('');

  // 9. SAVE REPORT
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `/tmp/qa-analysis-report-${timestamp}.json`;
  const reportMd = `/tmp/qa-analysis-report-${timestamp}.md`;

  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  await fs.writeFile(reportMd, generateMarkdownReport(report));

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ REPORT GENERATION COMPLETE');
  console.log('='.repeat(80));
  console.log('');
  console.log(`📄 JSON Report: ${reportFile}`);
  console.log(`📝 Markdown Report: ${reportMd}`);
  console.log('');

  // Print summary to console
  printConsoleSummary(report);

  await pool.end();
}

function calculateDuration(start, end) {
  if (!start || !end) return 'N/A';
  const diff = new Date(end) - new Date(start);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function extractSnippet(text, keyword, contextLength = 100) {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(keyword.toLowerCase());
  if (index === -1) return text.substring(0, contextLength);

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + contextLength / 2);
  return '...' + text.substring(start, end) + '...';
}

function generateRecommendations(report) {
  const recommendations = [];

  // Security recommendations
  if (report.security.potentialIssues > 10) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Security',
      title: 'Address Security Vulnerabilities',
      description: `Found ${report.security.potentialIssues} potential security issues. Immediate review recommended.`,
      effort: 'High',
      impact: 'Critical'
    });
  }

  // Performance recommendations
  if (report.performance.issuesFound > 20) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Performance',
      title: 'Optimize Performance Bottlenecks',
      description: `Identified ${report.performance.issuesFound} performance optimization opportunities.`,
      effort: 'Medium',
      impact: 'High'
    });
  }

  // Testing recommendations
  if (report.testing.filesNeedingTests.length > 50) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Testing',
      title: 'Increase Test Coverage',
      description: `${report.testing.filesNeedingTests.length} files need additional test coverage.`,
      effort: 'High',
      impact: 'High'
    });
  }

  // Accessibility recommendations
  if (report.ux.accessibilityIssues > 15) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Accessibility',
      title: 'Improve Accessibility Compliance',
      description: `Found ${report.ux.accessibilityIssues} accessibility concerns. WCAG compliance review needed.`,
      effort: 'Medium',
      impact: 'Medium'
    });
  }

  // Code quality
  if (report.codeReview.totalReviews > 100) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Code Quality',
      title: 'Refactor for Maintainability',
      description: 'Comprehensive code review suggests refactoring opportunities for improved maintainability.',
      effort: 'High',
      impact: 'Medium'
    });
  }

  return recommendations;
}

function generateMarkdownReport(report) {
  return `# Fleet QA Analysis Report

## Executive Summary

**Analysis Date:** ${new Date().toISOString()}
**Duration:** ${report.metadata.duration}
**Files Analyzed:** ${report.metadata.filesAnalyzed}
**Tasks Completed:** ${report.metadata.completedTasks}

---

## 📊 Overall Metrics

| Metric | Value |
|--------|-------|
| Total Tasks | ${report.metadata.totalTasks} |
| Completed | ${report.metadata.completedTasks} |
| Failed | ${report.metadata.failedTasks} |
| Avg Quality Iterations | ${report.metadata.avgQualityIterations} |

---

## 🔍 Analysis by Type

${report.summary.byType.map(t => `### ${t.type}
- Total: ${t.total}
- Completed: ${t.completed}
- Avg Iterations: ${t.avgIterations}`).join('\n\n')}

---

## 🔒 Security Findings

**Total Scans:** ${report.security.totalScans}
**Potential Issues:** ${report.security.potentialIssues}

### Top Security Concerns

${report.security.topIssues.slice(0, 10).map((issue, i) =>
  `${i + 1}. **${issue.keyword}** in \`${issue.file || 'N/A'}\`
   ${issue.snippet.substring(0, 150)}`
).join('\n\n')}

---

## ⚡ Performance Analysis

**Total Analyses:** ${report.performance.totalAnalyses}
**Optimization Opportunities:** ${report.performance.issuesFound}

### Top Performance Issues

${report.performance.topIssues.slice(0, 10).map((issue, i) =>
  `${i + 1}. **${issue.keyword}** in \`${issue.file || 'N/A'}\``
).join('\n')}

---

## 🧪 Testing Recommendations

**Files Needing Tests:** ${report.testing.filesNeedingTests.length}

---

## ♿ Accessibility & UX

**Total Analyses:** ${report.ux.totalAnalyses}
**Accessibility Issues:** ${report.ux.accessibilityIssues}

---

## 💡 Priority Recommendations

${report.recommendations.map((rec, i) =>
  `### ${i + 1}. [${rec.priority}] ${rec.title}

**Category:** ${rec.category}
**Effort:** ${rec.effort}
**Impact:** ${rec.impact}

${rec.description}
`).join('\n')}

---

## 📈 Next Steps

1. Review and prioritize security vulnerabilities
2. Address critical performance bottlenecks
3. Increase test coverage for identified files
4. Implement accessibility improvements
5. Schedule refactoring sprints for code quality

---

*Generated by 50-Agent AI Quality Assurance System*
`;
}

function printConsoleSummary(report) {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    ANALYSIS SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📁 Files Analyzed: ${report.metadata.filesAnalyzed}`);
  console.log(`✅ Tasks Completed: ${report.metadata.completedTasks}`);
  console.log(`⏱️  Duration: ${report.metadata.duration}`);
  console.log('');
  console.log('🔒 Security:');
  console.log(`   Scans: ${report.security.totalScans}`);
  console.log(`   Issues: ${report.security.potentialIssues}`);
  console.log('');
  console.log('⚡ Performance:');
  console.log(`   Analyses: ${report.performance.totalAnalyses}`);
  console.log(`   Optimizations: ${report.performance.issuesFound}`);
  console.log('');
  console.log('🧪 Testing:');
  console.log(`   Files Needing Tests: ${report.testing.filesNeedingTests.length}`);
  console.log('');
  console.log('♿ Accessibility:');
  console.log(`   Issues Found: ${report.ux.accessibilityIssues}`);
  console.log('');
  console.log('💡 Priority Recommendations: ' + report.recommendations.length);
  report.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. [${rec.priority}] ${rec.title}`);
  });
  console.log('');
}

// Run
generateReport().catch(console.error);
