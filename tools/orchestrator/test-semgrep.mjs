import { SemgrepScanner } from './dist/scanners/semgrep-scanner.js';

const config = {
  enabled: true,
  rules: ['p/security-audit', 'p/typescript', 'p/react'],
  exclude: ['node_modules', 'dist', 'build', '*.test.ts', '*.spec.ts'],
  timeout_ms: 300000
};

const scanner = new SemgrepScanner(config);

console.log('🔍 Testing Semgrep Scanner...\n');
console.log('Rules:', config.rules.join(', '));
console.log('Target: /Users/andrewmorton/Documents/GitHub/Fleet\n');

const result = await scanner.execute('/Users/andrewmorton/Documents/GitHub/Fleet');

console.log('✨ RESULTS:');
console.log('  Success:', result.success);
console.log('  Duration:', (result.duration_ms / 1000).toFixed(1), 'seconds');
console.log('  🎯 TOTAL FINDINGS:', result.findings.length);

if (result.findings.length > 0) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  result.findings.forEach(f => counts[f.severity] = (counts[f.severity] || 0) + 1);

  console.log('\n📊 By Severity:');
  Object.entries(counts).forEach(([sev, count]) => {
    if (count > 0) console.log(`  ${sev.padEnd(10)}: ${count}`);
  });

  const byType = { security: 0, quality: 0, performance: 0 };
  result.findings.forEach(f => byType[f.type] = (byType[f.type] || 0) + 1);

  console.log('\n📋 By Type:');
  Object.entries(byType).forEach(([type, count]) => {
    if (count > 0) console.log(`  ${type.padEnd(12)}: ${count}`);
  });

  const automated = result.findings.filter(f => f.remediation.automated).length;
  console.log(`\n🔧 Automated: ${automated} / ${result.findings.length}`);

  console.log('\n📝 Sample Findings (first 5):');
  result.findings.slice(0, 5).forEach((f, i) => {
    const file = f.location.file.replace('/Users/andrewmorton/Documents/GitHub/Fleet/', '');
    console.log(`\n  ${i+1}. [${f.severity.toUpperCase()}] ${f.title}`);
    console.log(`     ${f.description.substring(0, 70)}...`);
    console.log(`     📁 ${file}:${f.location.line}`);
    if (f.cwe) console.log(`     🔒 CWE: ${f.cwe}`);
  });

  console.log('\n\n🎉 SUCCESS! Semgrep found REAL security issues!');
} else {
  console.log('\n❌ No findings (check errors)');
  if (result.errors) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log('  -', e));
  }
}
