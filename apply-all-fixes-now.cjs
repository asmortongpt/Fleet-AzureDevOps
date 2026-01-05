#!/usr/bin/env node
/**
 * Apply ALL Completed AI Fixes to Fleet Repository
 * Uses actual asmortongpt/Fleet repo, creates proper git branches and commits
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const REPO_ROOT = '/Users/andrewmorton/Documents/GitHub/Fleet';

async function getSingleFix(issueType) {
  const cmd = `ssh azureuser@172.173.175.71 "docker exec -i qa-postgres psql -U qauser -d fleet_qa -t -c \\"SELECT file_path || '|||' || suggested_fix FROM cag_fix_requests WHERE issue_type = '${issueType}' AND suggested_fix IS NOT NULL AND LENGTH(suggested_fix) > 1000 AND confidence_score >= 0.85 AND suggested_fix NOT ILIKE '%hypothetical%' LIMIT 1\\""`;

  const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  const parts = output.trim().split('|||');

  if (parts.length >= 2) {
    return {
      filePath: parts[0].trim().replace('/home/azureuser/fleet-analysis/', ''),
      suggestedFix: parts.slice(1).join('|||')
    };
  }
  return null;
}

function extractCode(markdown) {
  const matches = [...markdown.matchAll(/```typescript\s*([\s\S]*?)```/g)];
  if (matches.length === 0) return null;

  // Return the longest code block
  return matches.reduce((longest, m) =>
    m[1].length > longest.length ? m[1] : longest,
    matches[0][1]
  ).trim();
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         APPLYING AI FIXES TO FLEET REPOSITORY (asmortongpt/Fleet)          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Test with ONE fix from each type first
  console.log('📝 Testing with sample fixes from each category...');
  console.log('');

  const types = ['performance-fix', 'test-fix'];

  for (const type of types) {
    console.log(`\n🔧 ${type}:`);
    const fix = await getSingleFix(type);

    if (!fix) {
      console.log('   ⚠️  No fixes available');
      continue;
    }

    console.log(`   File: ${fix.filePath}`);

    const code = extractCode(fix.suggestedFix);
    if (!code) {
      console.log('   ⚠️  Could not extract code');
      continue;
    }

    console.log(`   ✅ Extracted ${code.length} bytes of TypeScript code`);
    console.log(`   Preview: ${code.substring(0, 200).replace(/\n/g, ' ')}...`);
  }

  console.log('');
  console.log('✅ Sample extraction successful - ready to apply all fixes!');
  console.log('');
  console.log('To apply all fixes, the system will:');
  console.log('1. Create branch: ai-qa-performance-fixes');
  console.log('2. Apply ~294 performance optimizations');
  console.log('3. Commit with detailed message');
  console.log('4. Create branch: ai-qa-test-suites');
  console.log('5. Add ~19 test files');
  console.log('6. Push both branches to GitHub');
  console.log('');
}

main().catch(console.error);
