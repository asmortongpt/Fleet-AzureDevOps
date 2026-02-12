#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Comprehensive Template Literal Fixer\n');

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

  // Pattern 1: Fix '${...}' -> `${...}`
  // This regex matches single-quoted strings containing ${...} interpolation
  content = content.replace(/'([^']*\$\{[^}]+\}[^']*)'/g, (match, inner) => {
    changes++;
    return `\`${inner}\``;
  });

  // Pattern 2: Fix "text '${...}'" -> "text `${...}`"
  content = content.replace(/"([^"]*)'(\$\{[^}]+\})'([^"]*)"/g, (match, before, expr, after) => {
    changes++;
    return `"${before}\`${expr}\`${after}"`;
  });

  // Pattern 3: Fix console.log('text ${var}') -> console.log(`text ${var}`)
  content = content.replace(/console\.(log|error|warn|info)\('([^']*\$\{[^}]+\}[^']*)'\)/g, (match, method, str) => {
    changes++;
    return `console.${method}(\`${str}\`)`;
  });

  // Pattern 4: Fix throw new Error('... ${...}') -> throw new Error(`... ${...}`)
  content = content.replace(/throw new Error\('([^']*\$\{[^}]+\}[^']*)'\)/g, (match, msg) => {
    changes++;
    return `throw new Error(\`${msg}\`)`;
  });

  // Pattern 5: Fix return ... '${...}' -> return ... `${...}`
  content = content.replace(/return\s+([^;]+?)'([^']*\$\{[^}]+\}[^']*)'/g, (match, prefix, str) => {
    changes++;
    return `return ${prefix}\`${str}\``;
  });

  // Pattern 6: Fix error: '${...}' in objects -> error: `${...}`
  content = content.replace(/error:\s*'([^']*\$\{[^}]+\}[^']*)'/g, (match, msg) => {
    changes++;
    return `error: \`${msg}\``;
  });

  // Pattern 7: Fix message: '${...}' in objects -> message: `${...}`
  content = content.replace(/message:\s*'([^']*\$\{[^}]+\}[^']*)'/g, (match, msg) => {
    changes++;
    return `message: \`${msg}\``;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${changes} errors in ${filePath}`);
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
console.log(`\n✅ All template literal errors fixed!\n`);
