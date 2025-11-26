#!/usr/bin/env node
/**
 * Fix template literal syntax errors in TypeScript files
 * This script uses simple pattern matching to fix common issues:
 * 1. Mixed quotes: 'text` or `text' -> 'text'
 * 2. Backtick with single quote inside template: `text'${var}'text` -> `text ${var} text`
 * 3. Nested backticks: encodeURIComponent(`text`) -> encodeURIComponent('text')
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files
const files = execSync('find src -type f -name "*.ts"', {
  encoding: 'utf8',
  cwd: '/Users/andrewmorton/Documents/GitHub/Fleet/api'
}).trim().split('\n').filter(f => f);

let totalFixed = 0;
const fixedFiles = [];

for (const file of files) {
  const filePath = path.join('/Users/andrewmorton/Documents/GitHub/Fleet/api', file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Pattern 1: Fix lines ending with mismatched quotes like 'text` or "text`
  // This handles: error: 'message`
  content = content.replace(/(['"]\w[^'"`]*)`(?=\s*[,\)\}])/g, (match, prefix) => {
    if (prefix.startsWith("'")) {
      return match.replace('`', "'");
    } else if (prefix.startsWith('"')) {
      return match.replace('`', '"');
    }
    return match;
  });

  // Pattern 2: Fix lines starting with backtick but should be quote: `text' or `text"
  content = content.replace(/`([^`'"\$\{\}]*)['"]/g, "'$1'");

  // Pattern 3: Fix nested backticks in function calls like encodeURIComponent(`text`)
  // Look for function calls with backtick strings containing no ${...}
  content = content.replace(/(\w+\()`([^`\$]*)`(\))/g, "$1'$2'$3");

  // Pattern 4: Fix template literals with quotes inside that should be plain strings
  // `text` -> 'text' if no ${...} inside
  content = content.replace(/`([^`\$\{]*)`(?=[,\s\)\}])/g, (match, inner) => {
    // Only replace if there's no ${...} interpolation
    if (!inner.includes('${')) {
      return `'${inner}'`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    fixedFiles.push(file);
    console.log(`✅ Fixed ${file}`);
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);
if (fixedFiles.length > 0) {
  console.log('\nFixed files:');
  fixedFiles.forEach(f => console.log(`  - ${f}`));
}
