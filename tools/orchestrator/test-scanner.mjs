import { ESLintScanner } from './dist/scanners/eslint-scanner.js';

const config = {
  enabled: true,
  config: '../../.eslintrc.json',
  ext: ['.ts', '.tsx'],
  timeout_ms: 60000
};

const scanner = new ESLintScanner(config);

// Test scan method directly  
console.log('Testing ESLint scan...');
const rawOutput = await scanner.scan('/Users/andrewmorton/Documents/GitHub/Fleet');

console.log('\nRaw output sample:');
console.log('Type:', typeof rawOutput);
console.log('Length:', Array.isArray(rawOutput) ? rawOutput.length : 'N/A');

if (Array.isArray(rawOutput) && rawOutput.length > 0) {
  const filesWithIssues = rawOutput.filter(f => f.errorCount + f.warningCount > 0);
  console.log(`Files with issues: ${filesWithIssues.length}`);
  
  if (filesWithIssues.length > 0) {
    console.log('\nFirst file with issues:');
    console.log(JSON.stringify(filesWithIssues[0], null, 2).substring(0, 500));
  }
}

// Test normalize
console.log('\n\nTesting normalization...');
const findings = scanner.normalize(rawOutput);
console.log(`Normalized findings: ${findings.length}`);

if (findings.length > 0) {
  console.log('\nFirst finding:');
  console.log(JSON.stringify(findings[0], null, 2));
}
