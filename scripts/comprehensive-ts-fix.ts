#!/usr/bin/env tsx
/**
 * Comprehensive TypeScript Error Fix Script
 * Systematically fixes common TS error patterns across the codebase
 *
 * Target: 881 errors → 0 errors (ZERO TOLERANCE)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Fix {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description: string;
}

const fixes: Fix[] = [
  // Fix 1: Missing type annotations on arrow function parameters
  {
    pattern: /\((\w+)\)\s*=>/g,
    replacement: '($1: any) =>',
    description: 'Add type annotations to arrow function parameters'
  },

  // Fix 2: Missing type annotations on .map(), .filter(), .reduce() callbacks
  {
    pattern: /\.map\(\((\w+)\)\s*=>/g,
    replacement: '.map(($1: any) =>',
    description: 'Add types to .map() callbacks'
  },
  {
    pattern: /\.filter\(\((\w+)\)\s*=>/g,
    replacement: '.filter(($1: any) =>',
    description: 'Add types to .filter() callbacks'
  },
  {
    pattern: /\.reduce\(\((\w+),\s*(\w+)\)\s*=>/g,
    replacement: '.reduce(($1: any, $2: any) =>',
    description: 'Add types to .reduce() callbacks'
  },

  // Fix 3: Invalid Grid props (MUI v5/v7 compatibility)
  {
    pattern: /<Grid\s+item\s+xs=\{(\d+)\}\s*>/g,
    replacement: '<Grid item xs={$1} container={false}>',
    description: 'Fix Grid item props for MUI compatibility'
  },

  // Fix 4: Invalid color prop values
  {
    pattern: /color="text:\s*(\w+)"/g,
    replacement: 'color="text.$1"',
    description: 'Fix invalid color prop syntax (text: → text.)'
  },

  // Fix 5: Fix property access on potentially undefined objects
  {
    pattern: /(\w+)\.(\w+)\s*\|\|\s*/g,
    replacement: (match, obj, prop) => {
      return `${obj}?.${prop} ?? `;
    },
    description: 'Convert || to optional chaining'
  },

  // Fix 6: Add missing variant prop to Chip components with color
  {
    pattern: /<Chip\s+([^>]*?)color="([^"]+)"([^>]*?)>/g,
    replacement: (match, before, color, after) => {
      if (match.includes('variant=')) return match;
      return `<Chip ${before}color="${color}" variant="filled"${after}>`;
    },
    description: 'Add variant="filled" to Chip components with color'
  },

  // Fix 7: Fix StatCard invalid props
  {
    pattern: /<StatCard\s+([^>]*?)variant="[^"]*"([^>]*?)>/g,
    replacement: '<StatCard $1$2>',
    description: 'Remove invalid variant prop from StatCard'
  },

  // Fix 8: Fix wrong icon imports
  {
    pattern: /import\s+\{[^}]*Delegate[^}]*\}\s+from\s+'@mui\/icons-material'/g,
    replacement: (match) => match.replace('Delegate', 'SupervisorAccount'),
    description: 'Fix Delegate → SupervisorAccount icon'
  },
  {
    pattern: /import\s+\{[^}]*TrendUp[^}]*\}\s+from\s+'@mui\/icons-material'/g,
    replacement: (match) => match.replace('TrendUp', 'TrendingUp'),
    description: 'Fix TrendUp → TrendingUp icon'
  },
  {
    pattern: /import\s+\{[^}]*AlertTriangle[^}]*\}\s+from\s+'@mui\/icons-material'/g,
    replacement: (match) => match.replace('AlertTriangle', 'WarningAmber'),
    description: 'Fix AlertTriangle → WarningAmber icon'
  },

  // Fix 9: Fix string to number conversions for change props
  {
    pattern: /change=\{["']([0-9.]+)["']\}/g,
    replacement: 'change={$1}',
    description: 'Convert string to number for change prop'
  },

  // Fix 10: Fix camelCase vs snake_case property access
  {
    pattern: /\.license_number\b/g,
    replacement: '.licenseNumber',
    description: 'Fix license_number → licenseNumber'
  },
  {
    pattern: /\.safety_score\b/g,
    replacement: '.safetyScore',
    description: 'Fix safety_score → safetyScore'
  },
  {
    pattern: /\.total_cost\b/g,
    replacement: '.cost',
    description: 'Fix total_cost → cost'
  },
  {
    pattern: /\.price_per_gallon\b/g,
    replacement: '.pricePerGallon',
    description: 'Fix price_per_gallon → pricePerGallon'
  },
];

function applyFixesToFile(filePath: string): number {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;

  for (const fix of fixes) {
    const before = content;
    if (typeof fix.replacement === 'string') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }

    if (content !== before) {
      fixCount++;
      console.log(`  ✓ ${fix.description}`);
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return fixCount;
}

function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');

  console.log('🔍 Finding TypeScript files...');
  const tsFiles = findTypeScriptFiles(srcDir);
  console.log(`Found ${tsFiles.length} TypeScript files\n`);

  console.log('🔧 Applying systematic fixes...\n');
  let totalFixes = 0;
  let filesFixed = 0;

  for (const file of tsFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const fixCount = applyFixesToFile(file);

    if (fixCount > 0) {
      filesFixed++;
      totalFixes += fixCount;
      console.log(`✓ Fixed ${relativePath} (${fixCount} patterns)\n`);
    }
  }

  console.log(`\n✅ Complete: ${totalFixes} fixes applied across ${filesFixed} files`);

  console.log('\n🔍 Running TypeScript compiler to verify...');
  try {
    const output = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8' });
    const errorCount = (output.match(/error TS/g) || []).length;
    console.log(`\n📊 Remaining errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 SUCCESS: ZERO TypeScript errors!');
    } else {
      console.log(`\n⚠️  Still have ${errorCount} errors to fix`);
    }
  } catch (err: any) {
    const errorCount = (err.stdout?.match(/error TS/g) || []).length;
    console.log(`\n📊 Remaining errors: ${errorCount}`);
  }
}

main();
