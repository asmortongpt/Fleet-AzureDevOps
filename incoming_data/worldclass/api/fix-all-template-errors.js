#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive TypeScript syntax error fixer
 * Fixes template literal syntax errors across the entire codebase
 */

function fixTemplateErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: Fix backticks inside SQL queries in template literals
  // Matches: WHERE role IN (`admin`, `fleet_manager`)
  // Replaces with: WHERE role IN ('admin', 'fleet_manager')
  const pattern1 = /(`[^`]*?)\`([a-zA-Z_][a-zA-Z0-9_]*)\`([^`]*?`)/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, "$1'$2'$3");
    modified = true;
  }

  // Pattern 2: Fix multi-line SQL with backticks
  const lines = content.split('\n');
  const newLines = [];
  let inTemplate = false;
  let templateStartChar = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track if we're inside a template literal
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '`' && (j === 0 || line[j-1] !== '\\')) {
        inTemplate = !inTemplate;
        templateStartChar = inTemplate ? j : null;
      }
    }

    // If inside template literal (likely SQL), replace backticks with single quotes
    if (inTemplate && line.includes('`') && !line.trim().startsWith('`') && !line.trim().endsWith('`')) {
      // Replace backticks that are not template literal delimiters
      const matches = line.matchAll(/\s`([a-zA-Z_][a-zA-Z0-9_]*)`/g);
      for (const match of matches) {
        line = line.replace(match[0], match[0].replace(/`/g, "'"));
        modified = true;
      }
    }

    newLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    return true;
  }

  return false;
}

function processDirectory(dir) {
  let fixedCount = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += processDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      if (fixTemplateErrors(filePath)) {
        console.log(`✓ Fixed: ${filePath}`);
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Main execution
console.log('Starting comprehensive template literal fix...\n');

const srcDir = path.join(__dirname, 'src');
const fixedCount = processDirectory(srcDir);

console.log(`\n✓ Fixed ${fixedCount} files`);
console.log('\nRunning TypeScript compiler check...');

try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n✓ TypeScript compilation successful!');
} catch (error) {
  console.error('\n✗ TypeScript compilation still has errors');
  process.exit(1);
}
