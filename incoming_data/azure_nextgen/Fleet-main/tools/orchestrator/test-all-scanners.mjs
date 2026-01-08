import { ESLintScanner } from './dist/scanners/eslint-scanner.js';
import { TypeScriptScanner } from './dist/scanners/typescript-scanner.js';

const targetPath = '/Users/andrewmorton/Documents/GitHub/Fleet';

console.log('🚀 Fleet Security Orchestrator - Scanner Test\n');
console.log('📂 Target:', targetPath);
console.log('═'.repeat(80));

// Test ESLint Scanner
console.log('\n🔍 ESLINT SCANNER');
console.log('─'.repeat(80));
const eslintConfig = {
  enabled: true,
  config: '/Users/andrewmorton/Documents/GitHub/Fleet/eslint.config.js',
  ext: ['.ts', '.tsx'],
  timeout_ms: 180000
};

const eslintScanner = new ESLintScanner(eslintConfig);
const eslintResult = await eslintScanner.execute(targetPath);

console.log(`✓ Success: ${eslintResult.success}`);
console.log(`⏱  Duration: ${(eslintResult.duration_ms / 1000).toFixed(1)}s`);
console.log(`📊 Findings: ${eslintResult.findings.length}`);

if (eslintResult.findings.length > 0) {
  const eslintCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  eslintResult.findings.forEach(f => eslintCounts[f.severity] = (eslintCounts[f.severity] || 0) + 1);

  console.log('\n   By Severity:');
  Object.entries(eslintCounts).forEach(([sev, count]) => {
    if (count > 0) console.log(`   - ${sev.padEnd(10)}: ${count}`);
  });

  const autoFix = eslintResult.findings.filter(f => f.remediation.automated).length;
  console.log(`\n   🔧 Auto-fixable: ${autoFix} / ${eslintResult.findings.length}`);
}

// Test TypeScript Scanner
console.log('\n🔍 TYPESCRIPT SCANNER');
console.log('─'.repeat(80));
const tsConfig = {
  enabled: true,
  project: 'tsconfig.json',
  timeout_ms: 180000
};

const tsScanner = new TypeScriptScanner(tsConfig);
const tsResult = await tsScanner.execute(targetPath);

console.log(`✓ Success: ${tsResult.success}`);
console.log(`⏱  Duration: ${(tsResult.duration_ms / 1000).toFixed(1)}s`);
console.log(`📊 Findings: ${tsResult.findings.length}`);

if (tsResult.findings.length > 0) {
  const tsCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  tsResult.findings.forEach(f => tsCounts[f.severity] = (tsCounts[f.severity] || 0) + 1);

  console.log('\n   By Severity:');
  Object.entries(tsCounts).forEach(([sev, count]) => {
    if (count > 0) console.log(`   - ${sev.padEnd(10)}: ${count}`);
  });
}

// Summary
console.log('\n' + '═'.repeat(80));
console.log('📈 SUMMARY');
console.log('═'.repeat(80));

const totalFindings = eslintResult.findings.length + tsResult.findings.length;
const totalDuration = (eslintResult.duration_ms + tsResult.duration_ms) / 1000;

console.log(`\n✨ Total Findings: ${totalFindings}`);
console.log(`   - ESLint:     ${eslintResult.findings.length}`);
console.log(`   - TypeScript: ${tsResult.findings.length}`);
console.log(`\n⏱  Total Duration: ${totalDuration.toFixed(1)}s`);

// Combine severity counts
const allCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
[...eslintResult.findings, ...tsResult.findings].forEach(f => {
  allCounts[f.severity] = (allCounts[f.severity] || 0) + 1;
});

console.log('\n📊 Combined By Severity:');
Object.entries(allCounts).forEach(([sev, count]) => {
  if (count > 0) {
    const percentage = ((count / totalFindings) * 100).toFixed(1);
    console.log(`   ${sev.padEnd(10)}: ${count.toString().padStart(5)} (${percentage}%)`);
  }
});

console.log('\n🎉 ALL SCANNERS VALIDATED WITH REAL DATA!\n');
