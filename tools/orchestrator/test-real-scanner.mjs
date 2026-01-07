import { ESLintScanner } from './dist/scanners/eslint-scanner.js';

const config = {
  enabled: true,
  config: '/Users/andrewmorton/Documents/GitHub/Fleet/.eslintrc.json',
  ext: ['.ts', '.tsx'],
  timeout_ms: 120000
};

const scanner = new ESLintScanner(config);

console.log('🔍 Testing ESLint Scanner with REAL data...\n');
const result = await scanner.execute('/Users/andrewmorton/Documents/GitHub/Fleet');

console.log('Scanner Results:');
console.log('  Success:', result.success);
console.log('  Duration:', result.duration_ms, 'ms');
console.log('  ✨ Total Findings:', result.findings.length);

if (result.findings.length > 0) {
  const bySeverity = {};
  result.findings.forEach(f => {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  });

  console.log('\nBy Severity:');
  Object.entries(bySeverity).forEach(([severity, count]) => {
    console.log(`  ${severity}: ${count}`);
  });

  console.log('\nFirst 5 findings:');
  result.findings.slice(0, 5).forEach((f, i) => {
    const fileShort = f.location.file.replace('/Users/andrewmorton/Documents/GitHub/Fleet/', '');
    console.log(`\n${i+1}. [${f.severity}] ${f.title}`);
    console.log(`   ${f.description.substring(0, 80)}`);
    console.log(`   📁 ${fileShort}:${f.location.line}`);
    console.log(`   🔧 ${f.remediation.automated ? 'AUTO-FIXABLE' : 'Manual fix'}`);
  });
} else if (result.errors) {
  console.log('\n❌ Errors:');
  result.errors.forEach(err => console.log('  ', err));
}
