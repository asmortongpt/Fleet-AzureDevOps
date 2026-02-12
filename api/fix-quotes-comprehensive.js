#!/usr/bin/env node
/**
 * Comprehensive quote fixer for TypeScript files
 * Fixes common template literal syntax errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files in src
const files = execSync('find src -type f -name "*.ts" -not -path "*/node_modules/*"', {
  encoding: 'utf8',
  cwd: '/Users/andrewmorton/Documents/GitHub/Fleet/api'
}).trim().split('\n').filter(f => f);

console.log(`Processing ${files.length} TypeScript files...`);

let totalFixed = 0;
const fixedFiles = [];

for (const file of files) {
  const filePath = path.join('/Users/andrewmorton/Documents/GitHub/Fleet/api', file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix 1: Mismatched quotes at end of string 'text` -> 'text'
  content = content.replace(/'([^'`\n]+)`/g, "'$1'");

  // Fix 2: Mismatched quotes at end of string "text` -> "text"
  content = content.replace(/"([^"`\n]+)`/g, '"$1"');

  // Fix 3: Mismatched quotes at start of string `text' -> 'text'
  content = content.replace(/`([^`'\n]+)'/g, "'$1'");

  // Fix 4: Mismatched quotes at start of string `text" -> "text"
  content = content.replace(/`([^`"\n]+)"/g, '"$1"');

  // Fix 5: Object keys with backticks `key`: value -> 'key': value
  content = content.replace(/`([a-zA-Z0-9._-]+)`(\s*):/g, "'$1'$2:");

  // Fix 6: Union types with backticks in TypeScript
  content = content.replace(/:\s*'([^']+)'\s*\|\s*'([^']+)'\s*\|\s*'([^']+)'\s*\|\s*'([^']+)`/g, ": '$1' | '$2' | '$3' | '$4'");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    fixedFiles.push(file);
    console.log(`✅ Fixed ${file}`);
  }
}

console.log(`\n✅ Fixed ${totalFixed} files out of ${files.length}`);

if (totalFixed > 0) {
  console.log('\nTesting compilation...');
  try {
    execSync('npx tsx src/server.ts 2>&1 | head -5', {
      cwd: '/Users/andrewmorton/Documents/GitHub/Fleet/api',
      encoding: 'utf8',
      timeout: 10000
    });
  } catch (err) {
    // Expected to fail, just want to see error
    console.log(err.stdout || err.stderr);
  }
}
