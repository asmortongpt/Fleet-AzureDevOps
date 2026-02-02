#!/usr/bin/env node
/**
 * EMERGENCY FIX: Repair broken template literals caused by bad Python script
 *
 * The Python script incorrectly replaced backticks with single quotes INSIDE template literals
 * Pattern: `text '${var}` should be `text '${var}'`
 * Pattern: 'text ${var}` should be `text ${var}`
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixTemplateLiterals(content) {
  let fixed = content;
  let changeCount = 0;

  // Pattern 1: `...text '${...}` → `...text '${...}'`
  // Find template literals that start with ` and have a ' before ${
  const pattern1 = /`([^`]*)'(\$\{[^}]+\})`([^`']*)`/g;
  fixed = fixed.replace(pattern1, (match, before, interpolation, after) => {
    changeCount++;
    return `\`${before}'${interpolation}'${after}\``;
  });

  // Pattern 2: '...text ${...}` → `...text ${...}`
  // Find strings that start with ' but contain ${ and end with `
  const pattern2 = /'([^']*\$\{[^}]+\}[^`]*)`/g;
  fixed = fixed.replace(pattern2, (match, content) => {
    changeCount++;
    return `\`${content}\``;
  });

  // Pattern 3: `...${var}' → `...${var}'` (missing closing backtick)
  const pattern3 = /`([^`]*\$\{[^}]+\}[^`]*)'/g;
  fixed = fixed.replace(pattern3, (match, content) => {
    // Only fix if the quote seems to be closing the template literal
    if (!content.includes('`')) {
      changeCount++;
      return `\`${content}\``;
    }
    return match;
  });

  return { fixed, changeCount };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { fixed, changeCount } = fixTemplateLiterals(content);

  if (changeCount > 0) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✅ Fixed ${changeCount} template literals in ${filePath}`);
    return changeCount;
  }

  return 0;
}

function main() {
  const srcDir = path.join(__dirname, 'src');
  const files = glob.sync('**/*.ts', { cwd: srcDir, absolute: true });

  console.log(`🔍 Scanning ${files.length} TypeScript files...`);

  let totalFixes = 0;
  let filesFixed = 0;

  for (const file of files) {
    const fixes = processFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      filesFixed++;
    }
  }

  console.log(`\n✨ Complete!`);
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Files fixed: ${filesFixed}`);
  console.log(`   Total fixes: ${totalFixes}`);
}

main();
