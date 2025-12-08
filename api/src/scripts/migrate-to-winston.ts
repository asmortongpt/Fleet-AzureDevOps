/**
 * Console.log to Winston Migration Script
 *
 * This script automatically replaces all console.log/error/warn/debug instances
 * with appropriate Winston logger calls throughout the codebase.
 *
 * Usage: tsx src/scripts/migrate-to-winston.ts
 */

import * as fs from 'fs'
import * as path from 'path'

import { glob } from 'glob'

interface MigrationStats {
  filesScanned: number
  filesModified: number
  consoleLogs: number
  consoleErrors: number
  consoleWarns: number
  consoleDebugs: number
  consoleInfos: number
  totalReplacements: number
}

const stats: MigrationStats = {
  filesScanned: 0,
  filesModified: 0,
  consoleLogs: 0,
  consoleErrors: 0,
  consoleWarns: 0,
  consoleDebugs: 0,
  consoleInfos: 0,
  totalReplacements: 0
}

/**
 * Migrate a single file from console.* to logger.*
 */
function migrateFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')
  let modified = content
  let hasChanges = false
  let needsImport = false

  // Track what was replaced
  const consoleLogMatches = content.match(/console\.log\(/g)
  const consoleErrorMatches = content.match(/console\.error\(/g)
  const consoleWarnMatches = content.match(/console\.warn\(/g)
  const consoleDebugMatches = content.match(/console\.debug\(/g)
  const consoleInfoMatches = content.match(/console\.info\(/g)

  if (consoleLogMatches) stats.consoleLogs += consoleLogMatches.length
  if (consoleErrorMatches) stats.consoleErrors += consoleErrorMatches.length
  if (consoleWarnMatches) stats.consoleWarns += consoleWarnMatches.length
  if (consoleDebugMatches) stats.consoleDebugs += consoleDebugMatches.length
  if (consoleInfoMatches) stats.consoleInfos += consoleInfoMatches.length

  // Replace console.error
  if (content.includes('console.error')) {
    modified = modified.replace(/console\.error\(/g, 'logger.error(')
    hasChanges = true
    needsImport = true
  }

  // Replace console.warn
  if (content.includes('console.warn')) {
    modified = modified.replace(/console\.warn\(/g, 'logger.warn(')
    hasChanges = true
    needsImport = true
  }

  // Replace console.info
  if (content.includes('console.info')) {
    modified = modified.replace(/console\.info\(/g, 'logger.info(')
    hasChanges = true
    needsImport = true
  }

  // Replace console.debug
  if (content.includes('console.debug')) {
    modified = modified.replace(/console\.debug\(/g, 'logger.debug(')
    hasChanges = true
    needsImport = true
  }

  // Replace console.log - this needs special handling based on context
  if (content.includes('console.log')) {
    modified = modified.replace(/console\.log\(/g, 'logger.info(')
    hasChanges = true
    needsImport = true
  }

  // Add logger import if needed and not already present
  if (needsImport && !content.includes('from \'../utils/logger\'') && !content.includes('from \'@/utils/logger\'')) {
    // Determine correct import path based on file location
    const relativePath = getRelativeLoggerImport(filePath)

    // Find the last import statement
    const lastImportMatch = modified.match(/^import .* from .*/gm)
    if (lastImportMatch && lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1]
      const importIndex = modified.lastIndexOf(lastImport)
      const afterLastImport = importIndex + lastImport.length

      // Insert new import after last import
      modified = modified.slice(0, afterLastImport) +
                 `\nimport logger from '${relativePath}'` +
                 modified.slice(afterLastImport)
    } else {
      // No imports found, add at top after any comments
      const firstLineMatch = modified.match(/^(\/\*[\s\S]*?\*\/|\/\/.*\n)*/
)
      if (firstLineMatch) {
        const commentEnd = firstLineMatch[0].length
        modified = modified.slice(0, commentEnd) +
                   `\nimport logger from '${relativePath}'\n` +
                   modified.slice(commentEnd)
      } else {
        modified = `import logger from '${relativePath}'\n\n` + modified
      }
    }
  }

  // Write back if modified
  if (hasChanges) {
    fs.writeFileSync(filePath, modified, 'utf-8')
    stats.filesModified++
    stats.totalReplacements +=
      (consoleLogMatches?.length || 0) +
      (consoleErrorMatches?.length || 0) +
      (consoleWarnMatches?.length || 0) +
      (consoleDebugMatches?.length || 0) +
      (consoleInfoMatches?.length || 0)
    return true
  }

  return false
}

/**
 * Get relative path to logger from given file
 */
function getRelativeLoggerImport(filePath: string): string {
  const srcDir = path.join(process.cwd(), 'src')
  const fileDir = path.dirname(filePath)
  const relPath = path.relative(fileDir, path.join(srcDir, 'utils/logger'))

  // Normalize to forward slashes and ensure it starts with ./
  let normalized = relPath.replace(/\\/g, '/')
  if (!normalized.startsWith('.')) {
    normalized = './' + normalized
  }

  return normalized
}

/**
 * Main migration function
 */
async function main() {
  console.log('🔄 Starting console.* to Winston logger migration...\n')

  // Find all TypeScript files in src/ directory
  const srcDir = path.join(process.cwd(), 'src')
  const files = glob.sync(`${srcDir}/**/*.ts`, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/tests/**',
      '**/scripts/**', // Don't modify script files
      '**/utils/logger.ts' // Don't modify logger itself
    ]
  })

  console.log(`📁 Found ${files.length} TypeScript files to scan\n`)

  // Process each file
  for (const file of files) {
    stats.filesScanned++
    const relativePath = path.relative(process.cwd(), file)

    try {
      const modified = migrateFile(file)
      if (modified) {
        console.log(`✅ Modified: ${relativePath}`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${relativePath}:`, error)
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(70))
  console.log(`Files scanned:       ${stats.filesScanned}`)
  console.log(`Files modified:      ${stats.filesModified}`)
  console.log(`Total replacements:  ${stats.totalReplacements}`)
  console.log('')
  console.log('Breakdown by type:')
  console.log(`  console.log()    → logger.info()   : ${stats.consoleLogs}`)
  console.log(`  console.error()  → logger.error()  : ${stats.consoleErrors}`)
  console.log(`  console.warn()   → logger.warn()   : ${stats.consoleWarns}`)
  console.log(`  console.debug()  → logger.debug()  : ${stats.consoleDebugs}`)
  console.log(`  console.info()   → logger.info()   : ${stats.consoleInfos}`)
  console.log('='.repeat(70))
  console.log('\n✨ Migration complete! Please review changes and run tests.\n')
}

// Run migration
main().catch(console.error)
