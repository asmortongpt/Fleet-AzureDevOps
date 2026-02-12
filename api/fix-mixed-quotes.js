#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fix Mixed Quote Issues\n');

// Find all TypeScript files
const findTsFiles = () => {
  try {
    const output = execSync('find src -type f -name "*.ts"', {
      encoding: 'utf8',
      cwd: __dirname
    });
    return output.trim().split('\n').filter(f => f);
  } catch (error) {
    console.error('Error finding TypeScript files:', error.message);
    return [];
  }
};

const fixFile = (filePath) => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let changes = 0;

  // Pattern 1: Fix 'word` -> `word`
  content = content.replace(/'([^'`\n]*)`/g, (match, word) => {
    changes++;
    return `\`${word}\``;
  });

  // Pattern 2: Fix `word' -> `word`
  content = content.replace(/`([^'`\n]*)'/g, (match, word) => {
    changes++;
    return `\`${word}\``;
  });

  // Pattern 3: Fix `...${var}...' in multiline strings
  content = content.replace(/`([^`]*\$\{[^}]+\}[^`]*)'/g, (match, str) => {
    changes++;
    return `\`${str}\``;
  });

  // Pattern 4: Fix '...${var}...` in multiline strings
  content = content.replace(/'([^']*\$\{[^}]+\}[^']*)`/g, (match, str) => {
    changes++;
    return `\`${str}\``;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${changes} mixed quote errors in ${filePath}`);
    return changes;
  }

  return 0;
};

// Main execution
const files = findTsFiles();
console.log(`Found ${files.length} TypeScript files\n`);

let totalChanges = 0;
let filesFixed = 0;

for (const file of files) {
  const changes = fixFile(file);
  if (changes > 0) {
    totalChanges += changes;
    filesFixed++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Files scanned: ${files.length}`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Total changes: ${totalChanges}`);
console.log(`\n✅ All mixed quote errors fixed!\n`);
