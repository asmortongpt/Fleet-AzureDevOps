#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixes = 0;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let fixed = line;

    // Fix 1: Mixed template literal quotes like `sometext'
    if (fixed.includes('`') && fixed.includes("'")) {
      // Find backtick followed eventually by single quote instead of backtick
      const backtickMatch = fixed.match(/`([^`]*)'([^`]*$)/);
      if (backtickMatch) {
        fixed = fixed.replace(/`([^`]*)'/, '`$1`');
        if (fixed !== line) {
          console.log(`${filePath}:${i+1}: Fixed mixed quote`);
          fixes++;
        }
      }
    }

    // Fix 2: Template literals with ${...} must use backticks
    if (fixed.includes('${') && !fixed.includes('`')) {
      fixed = fixed.replace(/'([^']*\$\{[^}]+\}[^']*)'/g, '`$1`');
      if (fixed !== line) {
        console.log(`${filePath}:${i+1}: Fixed template literal quotes`);
        fixes++;
      }
    }

    lines[i] = fixed;
  }

  if (fixes > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return fixes;
  }
  return 0;
}

function walkDir(dir) {
  let totalFixes = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      totalFixes += walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      totalFixes += fixFile(filePath);
    }
  }

  return totalFixes;
}

const srcDir = path.join(__dirname, 'src');
console.log('Fixing critical syntax errors...\n');
const totalFixes = walkDir(srcDir);
console.log(`\n✅ Applied ${totalFixes} fixes`);
