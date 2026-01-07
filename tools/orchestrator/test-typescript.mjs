import { TypeScriptScanner } from './dist/scanners/typescript-scanner.js';

const config = {
  enabled: true,
  project: 'tsconfig.json',
  timeout_ms: 180000
};

const scanner = new TypeScriptScanner(config);

console.log('🔍 Testing TypeScript Scanner...\n');
const result = await scanner.execute('/Users/andrewmorton/Documents/GitHub/Fleet');

console.log('✨ RESULTS:');
console.log('  Success:', result.success);
console.log('  Duration:', (result.duration_ms / 1000).toFixed(1), 'seconds');
console.log('  🎯 TOTAL FINDINGS:', result.findings.length);

if (result.findings.length > 0) {
  const counts = { high: 0, medium: 0, low: 0 };
  result.findings.forEach(f => counts[f.severity] = (counts[f.severity] || 0) + 1);

  console.log('\n📊 By Severity:');
  Object.entries(counts).forEach(([sev, count]) => {
    if (count > 0) console.log(`  ${sev.padEnd(10)}: ${count}`);
  });

  console.log('\n📝 Sample Findings (first 5):');
  result.findings.slice(0, 5).forEach((f, i) => {
    const file = f.location.file.replace('/Users/andrewmorton/Documents/GitHub/Fleet/', '');
    console.log(`\n  ${i+1}. [${f.severity.toUpperCase()}] ${f.title}`);
    console.log(`     ${f.description.substring(0, 70)}...`);
    console.log(`     📁 ${file}:${f.location.line}`);
  });

  console.log('\n\n🎉 SUCCESS! Scanner found REAL type errors!');
} else {
  console.log('\n❌ No findings (check errors)');
  if (result.errors) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log('  -', e));
  }
}
