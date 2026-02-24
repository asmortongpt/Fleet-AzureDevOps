import { promises as fs } from 'fs'
import path from 'path'

const SOURCE_ROOT = path.resolve(__dirname, '../src')
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage'])

const wildcardThenCreds = /origin\s*:\s*['"`]\*['"`][\s\S]{0,500}?credentials\s*:\s*true/gm
const credsThenWildcard = /credentials\s*:\s*true[\s\S]{0,500}?origin\s*:\s*['"`]\*['"`]/gm

interface Violation {
  file: string
  line: number
  snippet: string
}

async function collectSourceFiles(dir: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectSourceFiles(fullPath, out)
      continue
    }

    if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(fullPath)
    }
  }
}

function findViolations(filePath: string, content: string): Violation[] {
  const violations: Violation[] = []
  const matches = [...content.matchAll(wildcardThenCreds), ...content.matchAll(credsThenWildcard)]

  for (const match of matches) {
    const index = match.index ?? 0
    const line = content.slice(0, index).split('\n').length
    const snippet = match[0].replace(/\s+/g, ' ').slice(0, 180)

    violations.push({
      file: filePath,
      line,
      snippet,
    })
  }

  return violations
}

async function main(): Promise<void> {
  const files: string[] = []
  await collectSourceFiles(SOURCE_ROOT, files)

  const violations: Violation[] = []

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8')
    violations.push(...findViolations(file, content))
  }

  if (violations.length === 0) {
    console.log('[CORS check] PASS: no wildcard origins with credentials=true found in src/')
    return
  }

  console.error('[CORS check] FAIL: found invalid wildcard CORS + credentials combinations:')
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line}`)
    console.error(`  ${violation.snippet}`)
  }

  process.exit(1)
}

main().catch((error: unknown) => {
  console.error('[CORS check] ERROR:', error)
  process.exit(1)
})
